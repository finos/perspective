/* Fast open-addressing hash table.
 *
 * Copyright 2022 Joaquin M Lopez Munoz.
 * Distributed under the Boost Software License, Version 1.0.
 * (See accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 * See https://www.boost.org/libs/unordered for library home page.
 */

#ifndef BOOST_UNORDERED_DETAIL_FOA_HPP
#define BOOST_UNORDERED_DETAIL_FOA_HPP

#include <boost/assert.hpp>
#include <boost/config.hpp>
#include <boost/config/workaround.hpp>
#include <boost/core/allocator_traits.hpp>
#include <boost/core/bit.hpp>
#include <boost/core/empty_value.hpp>
#include <boost/core/no_exceptions_support.hpp>
#include <boost/core/pointer_traits.hpp>
#include <boost/cstdint.hpp>
#include <boost/predef.h>
#include <boost/type_traits/is_nothrow_swappable.hpp>
#include <boost/unordered/detail/xmx.hpp>
#include <boost/unordered/hash_traits.hpp>
#include <climits>
#include <cmath>
#include <cstddef>
#include <cstring>
#include <iterator>
#include <limits>
#include <tuple>
#include <type_traits>
#include <utility>

#if defined(__SSE2__)||\
    defined(_M_X64)||(defined(_M_IX86_FP)&&_M_IX86_FP>=2)
#define BOOST_UNORDERED_SSE2
#include <emmintrin.h>
#elif defined(__ARM_NEON)&&!defined(__ARM_BIG_ENDIAN)
#define BOOST_UNORDERED_LITTLE_ENDIAN_NEON
#include <arm_neon.h>
#endif

#ifdef __has_builtin
#define BOOST_UNORDERED_HAS_BUILTIN(x) __has_builtin(x)
#else
#define BOOST_UNORDERED_HAS_BUILTIN(x) 0
#endif

#if !defined(NDEBUG)
#define BOOST_UNORDERED_ASSUME(cond) BOOST_ASSERT(cond)
#elif BOOST_UNORDERED_HAS_BUILTIN(__builtin_assume)
#define BOOST_UNORDERED_ASSUME(cond) __builtin_assume(cond)
#elif defined(__GNUC__) || BOOST_UNORDERED_HAS_BUILTIN(__builtin_unreachable)
#define BOOST_UNORDERED_ASSUME(cond)    \
  do{                                   \
    if(!(cond))__builtin_unreachable(); \
  }while(0)
#elif defined(_MSC_VER)
#define BOOST_UNORDERED_ASSUME(cond) __assume(cond)
#else
#define BOOST_UNORDERED_ASSUME(cond)  \
  do{                                 \
    static_cast<void>(false&&(cond)); \
  }while(0)
#endif

namespace boost{
namespace unordered{
namespace detail{
namespace foa{

static const std::size_t default_bucket_count = 0;

/* foa::table is an open-addressing hash table serving as the foundational core
 * of boost::unordered_flat_[map|set]. Its main internal design aspects are:
 * 
 *   - Element slots are logically split into groups of size N=15. The number
 *     of groups is always a power of two, so the number of allocated slots
       is of the form (N*2^n)-1 (final slot reserved for a sentinel mark).
 *   - Positioning is done at the group level rather than the slot level, that
 *     is, for any given element its hash value is used to locate a group and
 *     insertion is performed on the first available element of that group;
 *     if the group is full (overflow), further groups are tried using
 *     quadratic probing.
 *   - Each group has an associated 16B metadata word holding reduced hash
 *     values and overflow information. Reduced hash values are used to
 *     accelerate lookup within the group by using 128-bit SIMD or 64-bit word
 *     operations.
 */

/* group15 controls metadata information of a group of N=15 element slots.
 * The 16B metadata word is organized as follows (LSB depicted rightmost):
 *
 *   +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *   |ofw|h14|h13|h13|h11|h10|h09|h08|h07|h06|h05|h04|h03|h02|h01|h00|
 *   +---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
 *
 * hi is 0 if the i-th element slot is avalaible, 1 to mark a sentinel and,
 * when the slot is occupied, a value in the range [2,255] obtained from the
 * element's original hash value.
 * ofw is the so-called overflow byte. If insertion of an element with hash
 * value h is tried on a full group, then the (h%8)-th bit of the overflow
 * byte is set to 1 and a further group is probed. Having an overflow byte
 * brings two advantages:
 * 
 *   - There's no need to reserve a special value of hi to mark tombstone
 *     slots; each reduced hash value keeps then log2(254)=7.99 bits of the
 *     original hash (alternative approaches reserve one full bit to mark
 *     if the slot is available/deleted, so their reduced hash values are 7 bit
 *     strong only).
 *   - When doing an unsuccessful lookup (i.e. the element is not present in
 *     the table), probing stops at the first non-overflowed group. Having 8
 *     bits for signalling overflow makes it very likely that we stop at the
 *     current group (this happens when no element with the same (h%8) value
 *     has overflowed in the group), saving us an additional group check even
 *     under high-load/high-erase conditions. It is critical that hash
 *     reduction is invariant under modulo 8 (see maybe_caused_overflow).
 *
 * When looking for an element with hash value h, match(h) returns a bitmask
 * signalling which slots have the same reduced hash value. If available,
 * match uses SSE2 or (little endian) Neon 128-bit SIMD operations. On non-SIMD
 * scenarios, the logical layout described above is physically mapped to two
 * 64-bit words with *bit interleaving*, i.e. the least significant 16 bits of
 * the first 64-bit word contain the least significant bits of each byte in the
 * "logical" 128-bit word, and so forth. With this layout, match can be
 * implemented with 4 ANDs, 3 shifts, 2 XORs, 1 OR and 1 NOT.
 * 
 * group15 has no user-defined ctor so that it's a trivial type and can be
 * initialized via memset etc. Where needed, group15::initialize sets the
 * metadata to all zeros.
 */

#if defined(BOOST_UNORDERED_SSE2)

struct group15
{
  static constexpr int N=15;

  struct dummy_group_type
  {
    alignas(16) unsigned char storage[N+1]={0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0};
  };

  inline void initialize(){m=_mm_setzero_si128();}

  inline void set(std::size_t pos,std::size_t hash)
  {
    BOOST_ASSERT(pos<N);
    at(pos)=reduced_hash(hash);
  }

  inline void set_sentinel()
  {
    at(N-1)=sentinel_;
  }

  inline bool is_sentinel(std::size_t pos)const
  {
    BOOST_ASSERT(pos<N);
    return at(pos)==sentinel_;
  }

  inline void reset(std::size_t pos)
  {
    BOOST_ASSERT(pos<N);
    at(pos)=available_;
  }

  static inline void reset(unsigned char* pc)
  {
    *pc=available_;
  }

  inline int match(std::size_t hash)const
  {
    return _mm_movemask_epi8(
      _mm_cmpeq_epi8(m,_mm_set1_epi32(match_word(hash))))&0x7FFF;
  }

  inline bool is_not_overflowed(std::size_t hash)const
  {
    static constexpr unsigned char shift[]={1,2,4,8,16,32,64,128};

    return !(overflow()&shift[hash%8]);
  }

  inline void mark_overflow(std::size_t hash)
  {
#if BOOST_WORKAROUND(BOOST_GCC, >= 50000 && BOOST_GCC < 60000)
    overflow() = static_cast<unsigned char>( overflow() | static_cast<unsigned char>(1<<(hash%8)) );
#else
    overflow()|=static_cast<unsigned char>(1<<(hash%8));
#endif
  }

  static inline bool maybe_caused_overflow(unsigned char* pc)
  {
    std::size_t pos=reinterpret_cast<uintptr_t>(pc)%sizeof(group15);
    group15    *pg=reinterpret_cast<group15*>(pc-pos);
    return !pg->is_not_overflowed(*pc);
  };

  inline int match_available()const
  {
    return _mm_movemask_epi8(
      _mm_cmpeq_epi8(m,_mm_setzero_si128()))&0x7FFF;
  }

  inline int match_occupied()const
  {
    return (~match_available())&0x7FFF;
  }

  inline int match_really_occupied()const /* excluding sentinel */
  {
    return at(N-1)==sentinel_?match_occupied()&0x3FFF:match_occupied();
  }

private:
  static constexpr unsigned char available_=0,
                                 sentinel_=1;

  inline static int match_word(std::size_t hash)
  {
    static constexpr boost::uint32_t word[]=
    {
      0x08080808u,0x09090909u,0x02020202u,0x03030303u,0x04040404u,0x05050505u,0x06060606u,0x07070707u,
      0x08080808u,0x09090909u,0x0A0A0A0Au,0x0B0B0B0Bu,0x0C0C0C0Cu,0x0D0D0D0Du,0x0E0E0E0Eu,0x0F0F0F0Fu,
      0x10101010u,0x11111111u,0x12121212u,0x13131313u,0x14141414u,0x15151515u,0x16161616u,0x17171717u,
      0x18181818u,0x19191919u,0x1A1A1A1Au,0x1B1B1B1Bu,0x1C1C1C1Cu,0x1D1D1D1Du,0x1E1E1E1Eu,0x1F1F1F1Fu,
      0x20202020u,0x21212121u,0x22222222u,0x23232323u,0x24242424u,0x25252525u,0x26262626u,0x27272727u,
      0x28282828u,0x29292929u,0x2A2A2A2Au,0x2B2B2B2Bu,0x2C2C2C2Cu,0x2D2D2D2Du,0x2E2E2E2Eu,0x2F2F2F2Fu,
      0x30303030u,0x31313131u,0x32323232u,0x33333333u,0x34343434u,0x35353535u,0x36363636u,0x37373737u,
      0x38383838u,0x39393939u,0x3A3A3A3Au,0x3B3B3B3Bu,0x3C3C3C3Cu,0x3D3D3D3Du,0x3E3E3E3Eu,0x3F3F3F3Fu,
      0x40404040u,0x41414141u,0x42424242u,0x43434343u,0x44444444u,0x45454545u,0x46464646u,0x47474747u,
      0x48484848u,0x49494949u,0x4A4A4A4Au,0x4B4B4B4Bu,0x4C4C4C4Cu,0x4D4D4D4Du,0x4E4E4E4Eu,0x4F4F4F4Fu,
      0x50505050u,0x51515151u,0x52525252u,0x53535353u,0x54545454u,0x55555555u,0x56565656u,0x57575757u,
      0x58585858u,0x59595959u,0x5A5A5A5Au,0x5B5B5B5Bu,0x5C5C5C5Cu,0x5D5D5D5Du,0x5E5E5E5Eu,0x5F5F5F5Fu,
      0x60606060u,0x61616161u,0x62626262u,0x63636363u,0x64646464u,0x65656565u,0x66666666u,0x67676767u,
      0x68686868u,0x69696969u,0x6A6A6A6Au,0x6B6B6B6Bu,0x6C6C6C6Cu,0x6D6D6D6Du,0x6E6E6E6Eu,0x6F6F6F6Fu,
      0x70707070u,0x71717171u,0x72727272u,0x73737373u,0x74747474u,0x75757575u,0x76767676u,0x77777777u,
      0x78787878u,0x79797979u,0x7A7A7A7Au,0x7B7B7B7Bu,0x7C7C7C7Cu,0x7D7D7D7Du,0x7E7E7E7Eu,0x7F7F7F7Fu,
      0x80808080u,0x81818181u,0x82828282u,0x83838383u,0x84848484u,0x85858585u,0x86868686u,0x87878787u,
      0x88888888u,0x89898989u,0x8A8A8A8Au,0x8B8B8B8Bu,0x8C8C8C8Cu,0x8D8D8D8Du,0x8E8E8E8Eu,0x8F8F8F8Fu,
      0x90909090u,0x91919191u,0x92929292u,0x93939393u,0x94949494u,0x95959595u,0x96969696u,0x97979797u,
      0x98989898u,0x99999999u,0x9A9A9A9Au,0x9B9B9B9Bu,0x9C9C9C9Cu,0x9D9D9D9Du,0x9E9E9E9Eu,0x9F9F9F9Fu,
      0xA0A0A0A0u,0xA1A1A1A1u,0xA2A2A2A2u,0xA3A3A3A3u,0xA4A4A4A4u,0xA5A5A5A5u,0xA6A6A6A6u,0xA7A7A7A7u,
      0xA8A8A8A8u,0xA9A9A9A9u,0xAAAAAAAAu,0xABABABABu,0xACACACACu,0xADADADADu,0xAEAEAEAEu,0xAFAFAFAFu,
      0xB0B0B0B0u,0xB1B1B1B1u,0xB2B2B2B2u,0xB3B3B3B3u,0xB4B4B4B4u,0xB5B5B5B5u,0xB6B6B6B6u,0xB7B7B7B7u,
      0xB8B8B8B8u,0xB9B9B9B9u,0xBABABABAu,0xBBBBBBBBu,0xBCBCBCBCu,0xBDBDBDBDu,0xBEBEBEBEu,0xBFBFBFBFu,
      0xC0C0C0C0u,0xC1C1C1C1u,0xC2C2C2C2u,0xC3C3C3C3u,0xC4C4C4C4u,0xC5C5C5C5u,0xC6C6C6C6u,0xC7C7C7C7u,
      0xC8C8C8C8u,0xC9C9C9C9u,0xCACACACAu,0xCBCBCBCBu,0xCCCCCCCCu,0xCDCDCDCDu,0xCECECECEu,0xCFCFCFCFu,
      0xD0D0D0D0u,0xD1D1D1D1u,0xD2D2D2D2u,0xD3D3D3D3u,0xD4D4D4D4u,0xD5D5D5D5u,0xD6D6D6D6u,0xD7D7D7D7u,
      0xD8D8D8D8u,0xD9D9D9D9u,0xDADADADAu,0xDBDBDBDBu,0xDCDCDCDCu,0xDDDDDDDDu,0xDEDEDEDEu,0xDFDFDFDFu,
      0xE0E0E0E0u,0xE1E1E1E1u,0xE2E2E2E2u,0xE3E3E3E3u,0xE4E4E4E4u,0xE5E5E5E5u,0xE6E6E6E6u,0xE7E7E7E7u,
      0xE8E8E8E8u,0xE9E9E9E9u,0xEAEAEAEAu,0xEBEBEBEBu,0xECECECECu,0xEDEDEDEDu,0xEEEEEEEEu,0xEFEFEFEFu,
      0xF0F0F0F0u,0xF1F1F1F1u,0xF2F2F2F2u,0xF3F3F3F3u,0xF4F4F4F4u,0xF5F5F5F5u,0xF6F6F6F6u,0xF7F7F7F7u,
      0xF8F8F8F8u,0xF9F9F9F9u,0xFAFAFAFAu,0xFBFBFBFBu,0xFCFCFCFCu,0xFDFDFDFDu,0xFEFEFEFEu,0xFFFFFFFFu,
    };

#if defined(__MSVC_RUNTIME_CHECKS)
    return (int)word[hash&0xffu];
#else
    return (int)word[(unsigned char)hash];
#endif
  }

  inline static unsigned char reduced_hash(std::size_t hash)
  {
#if defined(__MSVC_RUNTIME_CHECKS)
    return match_word(hash)&0xffu;
#else
    return (unsigned char)match_word(hash);
#endif
  }

  inline unsigned char& at(std::size_t pos)
  {
    return reinterpret_cast<unsigned char*>(&m)[pos];
  }

  inline unsigned char at(std::size_t pos)const
  {
    return reinterpret_cast<const unsigned char*>(&m)[pos];
  }

  inline unsigned char& overflow()
  {
    return at(N);
  }

  inline unsigned char overflow()const
  {
    return at(N);
  }

  alignas(16) __m128i m;
};

#elif defined(BOOST_UNORDERED_LITTLE_ENDIAN_NEON)

struct group15
{
  static constexpr int N=15;

  struct dummy_group_type
  {
    alignas(16) unsigned char storage[N+1]={0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0};
  };

  inline void initialize(){m=vdupq_n_s8(0);}

  inline void set(std::size_t pos,std::size_t hash)
  {
    BOOST_ASSERT(pos<N);
    at(pos)=reduced_hash(hash);
  }

  inline void set_sentinel()
  {
    at(N-1)=sentinel_;
  }

  inline bool is_sentinel(std::size_t pos)const
  {
    BOOST_ASSERT(pos<N);
    return pos==N-1&&at(N-1)==sentinel_;
  }

  inline void reset(std::size_t pos)
  {
    BOOST_ASSERT(pos<N);
    at(pos)=available_;
  }

  static inline void reset(unsigned char* pc)
  {
    *pc=available_;
  }

  inline int match(std::size_t hash)const
  {
    return simde_mm_movemask_epi8(
      vceqq_s8(m,vdupq_n_s8(reduced_hash(hash))))&0x7FFF;
  }

  inline bool is_not_overflowed(std::size_t hash)const
  {
    static constexpr unsigned char shift[]={1,2,4,8,16,32,64,128};

    return !(overflow()&shift[hash%8]);
  }

  inline void mark_overflow(std::size_t hash)
  {
    overflow()|=static_cast<unsigned char>(1<<(hash%8));
  }

  static inline bool maybe_caused_overflow(unsigned char* pc)
  {
    std::size_t pos=reinterpret_cast<uintptr_t>(pc)%sizeof(group15);
    group15    *pg=reinterpret_cast<group15*>(pc-pos);
    return !pg->is_not_overflowed(*pc);
  };

  inline int match_available()const
  {
    return simde_mm_movemask_epi8(vceqq_s8(m,vdupq_n_s8(0)))&0x7FFF;
  }

  inline int match_occupied()const
  {
    return simde_mm_movemask_epi8(
      vcgtq_u8(vreinterpretq_u8_s8(m),vdupq_n_u8(0)))&0x7FFF;
  }

  inline int match_really_occupied()const /* excluding sentinel */
  {
    return at(N-1)==sentinel_?match_occupied()&0x3FFF:match_occupied();
  }

private:
  static constexpr unsigned char available_=0,
                                 sentinel_=1;

  inline static unsigned char reduced_hash(std::size_t hash)
  {
    static constexpr unsigned char table[]={
      8,9,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
      16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
      32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,
      48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,
      64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,
      80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,
      96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,
      112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,
      128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,
      144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,
      160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,
      176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,
      192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,
      208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
      224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,
      240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,
    };
    
    return table[(unsigned char)hash];
  }

  /* Copied from 
   * https://github.com/simd-everywhere/simde/blob/master/simde/x86/sse2.h#L3763
   */

  static inline int simde_mm_movemask_epi8(uint8x16_t a)
  {
    static constexpr uint8_t md[16]={
      1 << 0, 1 << 1, 1 << 2, 1 << 3,
      1 << 4, 1 << 5, 1 << 6, 1 << 7,
      1 << 0, 1 << 1, 1 << 2, 1 << 3,
      1 << 4, 1 << 5, 1 << 6, 1 << 7,
    };

    uint8x16_t  masked=vandq_u8(vld1q_u8(md),a);
    uint8x8x2_t tmp=vzip_u8(vget_low_u8(masked),vget_high_u8(masked));
    uint16x8_t  x=vreinterpretq_u16_u8(vcombine_u8(tmp.val[0],tmp.val[1]));

#if defined(__ARM_ARCH_ISA_A64)
    return vaddvq_u16(x);
#else
    uint64x2_t t64=vpaddlq_u32(vpaddlq_u16(x));
    return int(vgetq_lane_u64(t64,0))+int(vgetq_lane_u64(t64,1));
#endif
  }

  inline unsigned char& at(std::size_t pos)
  {
    return reinterpret_cast<unsigned char*>(&m)[pos];
  }

  inline unsigned char at(std::size_t pos)const
  {
    return reinterpret_cast<const unsigned char*>(&m)[pos];
  }

  inline unsigned char& overflow()
  {
    return at(N);
  }

  inline unsigned char overflow()const
  {
    return at(N);
  }

  alignas(16) int8x16_t m;
};

#else /* non-SIMD */

struct group15
{
  static constexpr int N=15;

  struct dummy_group_type
  {
    alignas(16) boost::uint64_t m[2]=
      {0x0000000000004000ull,0x0000000000000000ull};
  };

  inline void initialize(){m[0]=0;m[1]=0;}

  inline void set(std::size_t pos,std::size_t hash)
  {
    BOOST_ASSERT(pos<N);
    set_impl(pos,reduced_hash(hash));
  }

  inline void set_sentinel()
  {
    set_impl(N-1,sentinel_);
  }

  inline bool is_sentinel(std::size_t pos)const
  {
    BOOST_ASSERT(pos<N);
    return 
      pos==N-1&&
      (m[0] & boost::uint64_t(0x4000400040004000ull))==boost::uint64_t(0x4000ull)&&
      (m[1] & boost::uint64_t(0x4000400040004000ull))==0;
  }

  inline void reset(std::size_t pos)
  {
    BOOST_ASSERT(pos<N);
    set_impl(pos,available_);
  }

  static inline void reset(unsigned char* pc)
  {
    std::size_t pos=reinterpret_cast<uintptr_t>(pc)%sizeof(group15);
    pc-=pos;
    reinterpret_cast<group15*>(pc)->reset(pos);
  }

  inline int match(std::size_t hash)const
  {
    return match_impl(reduced_hash(hash));
  }

  inline bool is_not_overflowed(std::size_t hash)const
  {
    return !(reinterpret_cast<const boost::uint16_t*>(m)[hash%8] & 0x8000u);
  }

  inline void mark_overflow(std::size_t hash)
  {
    reinterpret_cast<boost::uint16_t*>(m)[hash%8]|=0x8000u;
  }

  static inline bool maybe_caused_overflow(unsigned char* pc)
  {
    std::size_t     pos=reinterpret_cast<uintptr_t>(pc)%sizeof(group15);
    group15        *pg=reinterpret_cast<group15*>(pc-pos);
    boost::uint64_t x=((pg->m[0])>>pos)&0x000100010001ull;
#if defined(__MSVC_RUNTIME_CHECKS)
    boost::uint32_t y=(x|(x>>15)|(x>>30))&0xffffffffu;
#else
    boost::uint32_t y=static_cast<boost::uint32_t>(x|(x>>15)|(x>>30));
#endif
    return !pg->is_not_overflowed(y);
  };

  inline int match_available()const
  {
    boost::uint64_t x=~(m[0]|m[1]);
    boost::uint32_t y=static_cast<boost::uint32_t>(x&(x>>32));
    y&=y>>16;
    return y&0x7FFF;
  }

  inline int match_occupied()const
  {
    boost::uint64_t x=m[0]|m[1];
#if defined(__MSVC_RUNTIME_CHECKS)
    boost::uint32_t y=(x|(x>>32))&0xffffffffu;
#else
    boost::uint32_t y=static_cast<boost::uint32_t>(x|(x>>32));
#endif
    y|=y>>16;
    return y&0x7FFF;
  }

  inline int match_really_occupied()const /* excluding sentinel */
  {
    return ~(match_impl(0)|match_impl(1))&0x7FFF;
  }

private:
  static constexpr unsigned char available_=0,
                                 sentinel_=1;

  inline static unsigned char reduced_hash(std::size_t hash)
  {
    static constexpr unsigned char table[]={
      8,9,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
      16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
      32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,
      48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,
      64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,
      80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,
      96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,
      112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,
      128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,
      144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,
      160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,
      176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,
      192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,
      208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
      224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,
      240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,
    };
    
#if defined(__MSVC_RUNTIME_CHECKS)
  return table[hash&0xffu];
#else
    return table[(unsigned char)hash];
#endif
  }

  inline void set_impl(std::size_t pos,std::size_t n)
  {
    BOOST_ASSERT(n<256);
    set_impl(m[0],pos,n&0xFu);
    set_impl(m[1],pos,n>>4);
  }

  static inline void set_impl(boost::uint64_t& x,std::size_t pos,std::size_t n)
  {
    static constexpr boost::uint64_t mask[]=
    {
      0x0000000000000000ull,0x0000000000000001ull,0x0000000000010000ull,
      0x0000000000010001ull,0x0000000100000000ull,0x0000000100000001ull,
      0x0000000100010000ull,0x0000000100010001ull,0x0001000000000000ull,
      0x0001000000000001ull,0x0001000000010000ull,0x0001000000010001ull,
      0x0001000100000000ull,0x0001000100000001ull,0x0001000100010000ull,
      0x0001000100010001ull,
    };
    static constexpr boost::uint64_t imask[]=
    {
      0x0001000100010001ull,0x0001000100010000ull,0x0001000100000001ull,
      0x0001000100000000ull,0x0001000000010001ull,0x0001000000010000ull,
      0x0001000000000001ull,0x0001000000000000ull,0x0000000100010001ull,
      0x0000000100010000ull,0x0000000100000001ull,0x0000000100000000ull,
      0x0000000000010001ull,0x0000000000010000ull,0x0000000000000001ull,
      0x0000000000000000ull,
    };

    BOOST_ASSERT(pos<16&&n<16);
    x|=   mask[n]<<pos;
    x&=~(imask[n]<<pos);
  }

  inline int match_impl(std::size_t n)const
  {
    static constexpr boost::uint64_t mask[]=
    {
      0x0000000000000000ull,0x000000000000ffffull,0x00000000ffff0000ull,
      0x00000000ffffffffull,0x0000ffff00000000ull,0x0000ffff0000ffffull,
      0x0000ffffffff0000ull,0x0000ffffffffffffull,0xffff000000000000ull,
      0xffff00000000ffffull,0xffff0000ffff0000ull,0xffff0000ffffffffull,
      0xffffffff00000000ull,0xffffffff0000ffffull,0xffffffffffff0000ull,
      0xffffffffffffffffull,
    };

    BOOST_ASSERT(n<256);
    boost::uint64_t x=m[0]^mask[n&0xFu];
                    x=~((m[1]^mask[n>>4])|x);
    boost::uint32_t y=static_cast<boost::uint32_t>(x&(x>>32));
                    y&=y>>16;
    return          y&0x7FFF;
  }

  alignas(16) boost::uint64_t m[2];
};

#endif

/* foa::table uses a size policy to obtain the permissible sizes of the group
 * array (and, by implication, the element array) and to do the hash->group
 * mapping.
 * 
 *   - size_index(n) returns an unspecified "index" number used in other policy
 *     operations.
 *   - size(size_index_) returns the number of groups for the given index. It is
 *     guaranteed that size(size_index(n)) >= n.
 *   - min_size() is the minimum number of groups permissible, i.e.
 *     size(size_index(0)).
 *   - position(hash,size_index_) maps hash to a position in the range
 *     [0,size(size_index_)).
 * 
 * The reason we're introducing the intermediate index value for calculating
 * sizes and positions is that it allows us to optimize the implementation of
 * position, which is in the hot path of lookup and insertion operations:
 * pow2_size_policy, the actual size policy used by foa::table, returns 2^n
 * (n>0) as permissible sizes and returns the n most significant bits
 * of the hash value as the position in the group array; using a size index
 * defined as i = (bits in std::size_t) - n, we have an unbeatable
 * implementation of position(hash) as hash>>i.
 * There's a twofold reason for choosing the high bits of hash for positioning:
 *   - Multiplication-based mixing tends to yield better entropy in the high
 *     part of its result.
 *   - group15 reduced-hash values take the *low* bits of hash, and we want
 *     these values and positioning to be as uncorrelated as possible.
 */

struct pow2_size_policy
{
  static inline std::size_t size_index(std::size_t n)
  {
    // TODO: min size is 2, see if we can bring it down to 1 without loss
    // of performance

    return sizeof(std::size_t)*CHAR_BIT-
      (n<=2?1:((std::size_t)(boost::core::bit_width(n-1))));
  }

  static inline std::size_t size(std::size_t size_index_)
  {
     return std::size_t(1)<<(sizeof(std::size_t)*CHAR_BIT-size_index_);  
  }
    
  static constexpr std::size_t min_size(){return 2;}

  static inline std::size_t position(std::size_t hash,std::size_t size_index_)
  {
    return hash>>size_index_;
  }
};

/* size index of a group array for a given *element* capacity */

template<typename Group,typename SizePolicy>
static inline std::size_t size_index_for(std::size_t n)
{
  /* n/N+1 == ceil((n+1)/N) (extra +1 for the sentinel) */
  return SizePolicy::size_index(n/Group::N+1);
}

/* Quadratic prober over a power-of-two range using triangular numbers.
 * mask in next(mask) must be the range size minus one (and since size is 2^n,
 * mask has exactly its n first bits set to 1).
 */

struct pow2_quadratic_prober
{
  pow2_quadratic_prober(std::size_t pos_):pos{pos_}{}

  inline std::size_t get()const{return pos;}

  /* next returns false when the whole array has been traversed, which ends
   * probing (in practice, full-table probing will only happen with very small
   * arrays).
   */

  inline bool next(std::size_t mask)
  {
    step+=1;
    pos=(pos+step)&mask;
    return step<=mask;
  }

private:
  std::size_t pos,step=0;
};

/* Mixing policies: no_mix is the identity function and xmx_mix uses the
 * xmx function defined in <boost/unordered/detail/xmx.hpp>.
 * foa::table mixes hash results with xmx_mix unless the hash is marked as
 * avalanching, i.e. of good quality (see <boost/unordered/hash_traits.hpp>).
 */

struct no_mix
{
  template<typename Hash,typename T>
  static inline std::size_t mix(const Hash& h,const T& x)
  {
    return h(x);
  }
};

struct xmx_mix
{
  template<typename Hash,typename T>
  static inline std::size_t mix(const Hash& h,const T& x)
  {
    return xmx(h(x));
  }
};

/* boost::core::countr_zero has a potentially costly check for
 * the case x==0.
 */

inline unsigned int unchecked_countr_zero(int x)
{
#if defined(BOOST_MSVC)
  unsigned long r;
  _BitScanForward(&r,(unsigned long)x);
  return (unsigned int)r;
#else
  BOOST_UNORDERED_ASSUME(x!=0);
  return (unsigned int)boost::core::countr_zero((unsigned int)x);
#endif
}

template<typename,typename,typename,typename>
class table;

/* table_iterator keeps two pointers:
 * 
 *   - A pointer p to the element slot.
 *   - A pointer pc to the n-th byte of the associated group metadata, where n
 *     is the position of the element in the group.
 *
 * A simpler solution would have been to keep a pointer p to the element, a
 * pointer pg to the group, and the position n, but that would increase
 * sizeof(table_iterator) by 4/8 bytes. In order to make this compact
 * representation feasible, it is required that group objects are aligned
 * to their size, so that we can recover pg and n as
 * 
 *   - n = pc%sizeof(group)
 *   - pg = pc-n
 * 
 * (for explanatory purposes pg and pc are treated above as if they were memory
 * addresses rather than pointers).The main drawback of this two-pointer
 * representation is that iterator increment is relatively slow.
 * 
 * p = nullptr is conventionally used to mark end() iterators.
 */

/* internal conversion from const_iterator to iterator */
class const_iterator_cast_tag {}; 

template<typename Value,typename Group,bool Const>
class table_iterator
{
public:
  using difference_type=std::ptrdiff_t;
  using value_type=Value;
  using pointer=
    typename std::conditional<Const,value_type const*,value_type*>::type;
  using reference=
    typename std::conditional<Const,value_type const&,value_type&>::type;
  using iterator_category=std::forward_iterator_tag;
  using element_type=
    typename std::conditional<Const,value_type const,value_type>::type;

  table_iterator()=default;
  template<bool Const2,typename std::enable_if<!Const2>::type* =nullptr>
  table_iterator(const table_iterator<Value,Group,Const2>& x):
    pc{x.pc},p{x.p}{}
  table_iterator(
    const_iterator_cast_tag, const table_iterator<Value,Group,true>& x):
    pc{x.pc},p{x.p}{}

  inline reference operator*()const noexcept{return *p;}
  inline pointer operator->()const noexcept{return p;}
  inline table_iterator& operator++()noexcept{increment();return *this;}
  inline table_iterator operator++(int)noexcept
    {auto x=*this;increment();return x;}
  friend inline bool operator==(
    const table_iterator& x,const table_iterator& y)
    {return x.p==y.p;}
  friend inline bool operator!=(
    const table_iterator& x,const table_iterator& y)
    {return !(x==y);}

private:
  template<typename,typename,bool> friend class table_iterator;
  template<typename,typename,typename,typename> friend class table;

  table_iterator(Group* pg,std::size_t n,const Value* p_):
    pc{reinterpret_cast<unsigned char*>(const_cast<Group*>(pg))+n},
    p{const_cast<Value*>(p_)}
    {}

  inline std::size_t rebase() noexcept
  {
    std::size_t off=reinterpret_cast<uintptr_t>(pc)%sizeof(Group);
    pc-=off;
    return off;
  }

  inline void increment()noexcept
  {
    std::size_t n0=rebase();

    int mask=(reinterpret_cast<Group*>(pc)->match_occupied()>>(n0+1))<<(n0+1);
    if(!mask){
      do{
        pc+=sizeof(Group);
        p+=Group::N;
      }
      while((mask=reinterpret_cast<Group*>(pc)->match_occupied())==0);
    }

    auto n=unchecked_countr_zero(mask);
    if(BOOST_UNLIKELY(reinterpret_cast<Group*>(pc)->is_sentinel(n))){
      p=nullptr;
    }
    else{
      pc+=n;
      p-=n0;
      p+=n;
    }
  }

  unsigned char *pc=nullptr;
  Value         *p=nullptr;
};

/* table_arrays controls allocation, initialization and deallocation of
 * paired arrays of groups and element slots. Only one chunk of memory is
 * allocated to place both arrays: this is not done for efficiency reasons,
 * but in order to be able to properly align the group array without storing
 * additional offset information --the alignment required (16B) is usually
 * greater than alignof(std::max_align_t) and thus not guaranteed by
 * allocators.
 */

template<typename Group,std::size_t Size>
Group* dummy_groups()
{
  /* Dummy storage initialized as if in an empty container (actually, each
   * of its groups is initialized like a separate empty container).
   * We make table_arrays::groups point to this when capacity()==0, so that
   * we are not allocating any dynamic memory and yet lookup can be implemented
   * without checking for groups==nullptr. This space won't ever be used for
   * insertion as the container's capacity is precisely zero.
   */

  static constexpr typename Group::dummy_group_type
  storage[Size]={typename Group::dummy_group_type(),};

  return reinterpret_cast<Group*>(
    const_cast<typename Group::dummy_group_type*>(storage));
}

template<typename Value,typename Group,typename SizePolicy>
struct table_arrays
{
  using value_type=Value;
  using group_type=Group;
  static constexpr auto N=group_type::N;
  using size_policy=SizePolicy;

  template<typename Allocator>
  static table_arrays new_(Allocator& al,std::size_t n)
  {
    using alloc_traits=boost::allocator_traits<Allocator>;

    auto         groups_size_index=size_index_for<group_type,size_policy>(n);
    auto         groups_size=size_policy::size(groups_size_index);
    table_arrays arrays{groups_size_index,groups_size-1,nullptr,nullptr};

    if(!n){
      arrays.groups=dummy_groups<group_type,size_policy::min_size()>();
    }
    else{
      arrays.elements=
        boost::to_address(alloc_traits::allocate(al,buffer_size(groups_size)));
      
      /* Align arrays.groups to sizeof(group_type). table_iterator critically
       * depends on such alignment for its increment operation.
       */

      auto p=reinterpret_cast<unsigned char*>(arrays.elements+groups_size*N-1);
      p+=(uintptr_t(sizeof(group_type))-
          reinterpret_cast<uintptr_t>(p))%sizeof(group_type);
      arrays.groups=reinterpret_cast<group_type*>(p);

      /* memset is faster/not slower than initializing groups individually.
       * This assumes all zeros is group_type's default layout. 
       */

      std::memset(arrays.groups,0,sizeof(group_type)*groups_size);
      arrays.groups[groups_size-1].set_sentinel();
    }
    return arrays;
  }

  template<typename Allocator>
  static void delete_(Allocator& al,table_arrays& arrays)noexcept
  {
    using alloc_traits=boost::allocator_traits<Allocator>;
    using pointer=typename alloc_traits::pointer;
    using pointer_traits=boost::pointer_traits<pointer>;

    if(arrays.elements){
      alloc_traits::deallocate(
        al,pointer_traits::pointer_to(*arrays.elements),
        buffer_size(arrays.groups_size_mask+1));
    }
  }

  /* combined space for elements and groups measured in sizeof(value_type)s */

  static std::size_t buffer_size(std::size_t groups_size)
  {
    auto buffer_bytes=
      /* space for elements (we subtract 1 because of the sentinel) */
      sizeof(value_type)*(groups_size*N-1)+
      /* space for groups + padding for group alignment */
      sizeof(group_type)*(groups_size+1)-1;

    /* ceil(buffer_bytes/sizeof(value_type)) */
    return (buffer_bytes+sizeof(value_type)-1)/sizeof(value_type);
  }

  std::size_t  groups_size_index;
  std::size_t  groups_size_mask;
  group_type  *groups;
  value_type  *elements;
};

struct if_constexpr_void_else{void operator()()const{}};

template<bool B,typename F,typename G=if_constexpr_void_else>
void if_constexpr(F f,G g={})
{
  std::get<B?0:1>(std::forward_as_tuple(f,g))();
}

template<bool B,typename T,typename std::enable_if<B>::type* =nullptr>
void copy_assign_if(T& x,const T& y){x=y;}

template<bool B,typename T,typename std::enable_if<!B>::type* =nullptr>
void copy_assign_if(T&,const T&){}

template<bool B,typename T,typename std::enable_if<B>::type* =nullptr>
void move_assign_if(T& x,T& y){x=std::move(y);}

template<bool B,typename T,typename std::enable_if<!B>::type* =nullptr>
void move_assign_if(T&,T&){}

template<bool B,typename T,typename std::enable_if<B>::type* =nullptr>
void swap_if(T& x,T& y){using std::swap; swap(x,y);}

template<bool B,typename T,typename std::enable_if<!B>::type* =nullptr>
void swap_if(T&,T&){}

inline void prefetch(const void* p)
{
  (void) p;
#if defined(BOOST_GCC)||defined(BOOST_CLANG)
  __builtin_prefetch((const char*)p);
#elif defined(BOOST_UNORDERED_SSE2)
  _mm_prefetch((const char*)p,_MM_HINT_T0);
#endif    
}

#if defined(BOOST_GCC)
/* GCC's -Wshadow triggers at scenarios like this: 
 *
 *   struct foo{};
 *   template<typename Base>
 *   struct derived:Base
 *   {
 *     void f(){int foo;}
 *   };
 * 
 *   derived<foo>x;
 *   x.f(); // declaration of "foo" in derived::f shadows base type "foo"
 *
 * This makes shadowing warnings unavoidable in general when a class template
 * derives from user-provided classes, as is the case with table and
 * empty_value's below.
 */

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wshadow"
#endif

#if defined(BOOST_MSVC)
#pragma warning(push)
#pragma warning(disable:4714) /* marked as __forceinline not inlined */
#endif

#if BOOST_WORKAROUND(BOOST_MSVC,<=1900)
/* VS2015 marks as unreachable generic catch clauses around non-throwing
 * code.
 */
#pragma warning(push)
#pragma warning(disable:4702)
#endif

/* foa::table interface departs in a number of ways from that of C++ unordered
 * associative containers because it's not for end-user consumption
 * (boost::unordered_flat_[map|set] wrappers complete it as appropriate) and,
 * more importantly, because of fundamental restrictions imposed by open
 * addressing:
 * 
 *   - value_type must be moveable.
 *   - Pointer stability is not kept under rehashing.
 *   - begin() is not O(1).
 *   - No bucket API.
 *   - Load factor is fixed and can't be set by the user.
 *   - No extract API.
 * 
 * The TypePolicy template parameter is used to generate instantiations
 * suitable for either maps or sets, and introduces non-standard init_type:
 * 
 *   - TypePolicy::key_type and TypePolicy::value_type have the obvious
 *     meaning.
 *   - TypePolicy::init_type is the type implicitly converted to when
 *     writing x.insert({...}). For maps, this is std::pair<Key,T> rather
 *     than std::pair<const Key,T> so that, for instance, x.insert({"hello",0})
 *     produces a cheaply moveable std::string&& ("hello") rather than
 *     a copyable const std::string&&. foa::table::insert is extended to accept
 *     both init_type and value_type references.
 *   - TypePolicy::move(value_type&) returns a temporary object for value
 *     transfer on rehashing, move copy/assignment, and merge. For maps, this
 *     object is a std::pair<Key&&,T&&>, which is generally cheaper to move
 *     than std::pair<const Key,T>&& because of the constness in Key.
 *   - TypePolicy::extract returns a const reference to the key part of
 *     a value of type value_type, init_type or
 *     decltype(TypePolicy::move(...)).
 * 
 *  try_emplace, erase and find support heterogenous lookup by default, that is,
 *  without checking for any ::is_transparent typedefs --the checking is done by
 *  boost::unordered_flat_[map|set].
 * 
 *  At the moment, we're not supporting allocators with fancy pointers.
 *  Allocator::pointer must be convertible to/from regular pointers.
 */

/* We pull this out so the tests don't have to rely on a magic constant or
 * instantiate the table class template as it can be quite gory.
 */
constexpr static float const mlf = 0.875f;

template<typename TypePolicy,typename Hash,typename Pred,typename Allocator>
class 

#if defined(_MSC_VER)&&_MSC_FULL_VER>=190023918
__declspec(empty_bases) /* activate EBO with multiple inheritance */
#endif

table:empty_value<Hash,0>,empty_value<Pred,1>,empty_value<Allocator,2>
{
  using hash_base=empty_value<Hash,0>;
  using pred_base=empty_value<Pred,1>;
  using allocator_base=empty_value<Allocator,2>;
  using type_policy=TypePolicy;
  using group_type=group15;
  static constexpr auto N=group_type::N;
  using size_policy=pow2_size_policy;
  using prober=pow2_quadratic_prober;
  using mix_policy=typename std::conditional<
    hash_is_avalanching<Hash>::value,
    no_mix,
    xmx_mix
  >::type;
  using alloc_traits=boost::allocator_traits<Allocator>;

public:
  using key_type=typename type_policy::key_type;
  using init_type=typename type_policy::init_type;
  using value_type=typename type_policy::value_type;

private:
  static constexpr bool has_mutable_iterator=
    !std::is_same<key_type,value_type>::value;

public:
  using hasher=Hash;
  using key_equal=Pred;
  using allocator_type=Allocator;
  using pointer=value_type*;
  using const_pointer=const value_type*;
  using reference=value_type&;
  using const_reference=const value_type&;
  using size_type=std::size_t;
  using difference_type=std::ptrdiff_t;
  using const_iterator=table_iterator<value_type,group_type,true>;
  using iterator=typename std::conditional<
    has_mutable_iterator,
    table_iterator<value_type,group_type,false>,
    const_iterator>::type;

  table(
    std::size_t n=0,const Hash& h_=Hash(),const Pred& pred_=Pred(),
    const Allocator& al_=Allocator()):
    hash_base{empty_init,h_},pred_base{empty_init,pred_},
    allocator_base{empty_init,al_},size_{0},arrays(new_arrays(n)),
    ml{initial_max_load()}
    {}

  table(const table& x):
    table{x,alloc_traits::select_on_container_copy_construction(x.al())}{}

  table(table&& x)
    noexcept(
      std::is_nothrow_move_constructible<Hash>::value&&
      std::is_nothrow_move_constructible<Pred>::value&&
      std::is_nothrow_move_constructible<Allocator>::value):
    hash_base{empty_init,std::move(x.h())},
    pred_base{empty_init,std::move(x.pred())},
    allocator_base{empty_init,std::move(x.al())},
    size_{x.size_},arrays(x.arrays),ml{x.ml}
  {
    x.size_=0;
    x.arrays=x.new_arrays(0);
    x.ml=x.initial_max_load();
  }

  table(const table& x,const Allocator& al_):
    table{std::size_t(std::ceil(float(x.size())/mlf)),x.h(),x.pred(),al_}
  {
    x.for_all_elements([this](value_type* p){
      unchecked_insert(*p);
    });
  }

  table(table&& x,const Allocator& al_):
    table{0,std::move(x.h()),std::move(x.pred()),al_}
  {
    if(al()==x.al()){
      std::swap(size_,x.size_);
      std::swap(arrays,x.arrays);
      std::swap(ml,x.ml);
    }
    else{
      reserve(x.size());
      clear_on_exit c{x};
      (void)c; /* unused var warning */

      /* This works because subsequent x.clear() does not depend on the
       * elements' values.
       */
      x.for_all_elements([this](value_type* p){
        unchecked_insert(type_policy::move(*p));
      });
    }
  }

  ~table()noexcept
  {
    for_all_elements([this](value_type* p){
      destroy_element(p);
    });
    delete_arrays(arrays);
  }

  table& operator=(const table& x)
  {
    static constexpr auto pocca=
      alloc_traits::propagate_on_container_copy_assignment::value;

    if(this!=std::addressof(x)){
      clear();
      h()=x.h();
      pred()=x.pred();
      if_constexpr<pocca>([&,this]{
        if(al()!=x.al())reserve(0);
        copy_assign_if<pocca>(al(),x.al());
      });
      /* noshrink: favor memory reuse over tightness */
      noshrink_reserve(x.size()); 
      x.for_all_elements([this](value_type* p){
        unchecked_insert(*p);
      });
    }
    return *this;
  }

#if defined(BOOST_MSVC)
#pragma warning(push)
#pragma warning(disable:4127) /* conditional expression is constant */
#endif

  table& operator=(table&& x)
    noexcept(
      alloc_traits::is_always_equal::value&&
      std::is_nothrow_move_assignable<Hash>::value&&
      std::is_nothrow_move_assignable<Pred>::value)
  {
    static constexpr auto pocma=
      alloc_traits::propagate_on_container_move_assignment::value;

    if(this!=std::addressof(x)){
      clear();
      h()=std::move(x.h());
      pred()=std::move(x.pred());
      if(pocma||al()==x.al()){
        using std::swap;
        reserve(0);
        move_assign_if<pocma>(al(),x.al());
        swap(size_,x.size_);
        swap(arrays,x.arrays);
        swap(ml,x.ml);
      }
      else{
        /* noshrink: favor memory reuse over tightness */
        noshrink_reserve(x.size());
        clear_on_exit c{x};
        (void)c; /* unused var warning */

        /* This works because subsequent x.clear() does not depend on the
         * elements' values.
         */
        x.for_all_elements([this](value_type* p){
          unchecked_insert(type_policy::move(*p));
        });
      }
    }
    return *this;
  }

#if defined(BOOST_MSVC)
#pragma warning(pop) /* C4127 */
#endif

  allocator_type get_allocator()const noexcept{return al();}

  iterator begin()noexcept
  {
    iterator it{arrays.groups,0,arrays.elements};
    if(!(arrays.groups[0].match_occupied()&0x1))++it;
    return it;
  }

  const_iterator begin()const noexcept
                   {return const_cast<table*>(this)->begin();}
  iterator       end()noexcept{return {};}
  const_iterator end()const noexcept{return const_cast<table*>(this)->end();}
  const_iterator cbegin()const noexcept{return begin();}
  const_iterator cend()const noexcept{return end();}

  bool        empty()const noexcept{return size()==0;}
  std::size_t size()const noexcept{return size_;}
  std::size_t max_size()const noexcept{return SIZE_MAX;}

  template<typename... Args>
  BOOST_FORCEINLINE std::pair<iterator,bool> emplace(Args&&... args)
  {
    using emplace_type = typename std::conditional<
      std::is_constructible<
        init_type, Args...
      >::value,
      init_type,
      value_type
    >::type;
    return emplace_impl(emplace_type(std::forward<Args>(args)...));
  }

  template<typename Key,typename... Args>
  BOOST_FORCEINLINE std::pair<iterator,bool> try_emplace(
    Key&& k,Args&&... args)
  {
    return emplace_impl(
      std::piecewise_construct,
      std::forward_as_tuple(std::forward<Key>(k)),
      std::forward_as_tuple(std::forward<Args>(args)...));
  }

  BOOST_FORCEINLINE std::pair<iterator,bool>
  insert(const init_type& x){return emplace_impl(x);}

  BOOST_FORCEINLINE std::pair<iterator,bool>
  insert(init_type&& x){return emplace_impl(std::move(x));}

  /* template<typename=void> tilts call ambiguities in favor of init_type */

  template<typename=void>
  BOOST_FORCEINLINE std::pair<iterator,bool>
  insert(const value_type& x){return emplace_impl(x);}

  template<typename=void>
  BOOST_FORCEINLINE std::pair<iterator,bool>
  insert(value_type&& x){return emplace_impl(std::move(x));}

  template<
    bool dependent_value=false,
    typename std::enable_if<
      has_mutable_iterator||dependent_value>::type* =nullptr
  >
  void erase(iterator pos)noexcept{return erase(const_iterator(pos));}

  BOOST_FORCEINLINE
  void erase(const_iterator pos)noexcept
  {
    destroy_element(pos.p);
    recover_slot(pos.pc);
  }

  template<typename Key>
  BOOST_FORCEINLINE
  auto erase(Key&& x) -> typename std::enable_if<
    !std::is_convertible<Key,iterator>::value&&
    !std::is_convertible<Key,const_iterator>::value, std::size_t>::type
  {
    auto it=find(x);
    if(it!=end()){
      erase(it);
      return 1;
    }
    else return 0;
  }

  void swap(table& x)
    noexcept(
      alloc_traits::is_always_equal::value&&
      boost::is_nothrow_swappable<Hash>::value&&
      boost::is_nothrow_swappable<Pred>::value)
  {
    static constexpr auto pocs=
      alloc_traits::propagate_on_container_swap::value;

    using std::swap;
    swap(h(),x.h());
    swap(pred(),x.pred());
    if_constexpr<pocs>([&,this]{
      swap_if<pocs>(al(),x.al());
    },
    [&,this]{ /* else */
      BOOST_ASSERT(al()==x.al());
      (void)this; /* makes sure captured this is used */
    });
    swap(size_,x.size_);
    swap(arrays,x.arrays);
    swap(ml,x.ml);
  }

  void clear()noexcept
  {
    auto p=arrays.elements;
    if(p){
      for(auto pg=arrays.groups,last=pg+arrays.groups_size_mask+1;
          pg!=last;++pg,p+=N){
        auto mask=pg->match_really_occupied();
        while(mask){
          destroy_element(p+unchecked_countr_zero(mask));
          mask&=mask-1;
        }
        /* we wipe the entire metadata to reset the overflow byte as well */
        pg->initialize();
      }
      arrays.groups[arrays.groups_size_mask].set_sentinel();
      size_=0;
      ml=initial_max_load();
    }
  }

  // TODO: should we accept different allocator too?
  template<typename Hash2,typename Pred2>
  void merge(table<TypePolicy,Hash2,Pred2,Allocator>& x)
  {
    x.for_all_elements([&,this](group_type* pg,unsigned int n,value_type* p){
      if(emplace_impl(type_policy::move(*p)).second){
        x.erase(iterator{pg,n,p});
      }
    });
  }

  template<typename Hash2,typename Pred2>
  void merge(table<TypePolicy,Hash2,Pred2,Allocator>&& x){merge(x);}

  hasher hash_function()const{return h();}
  key_equal key_eq()const{return pred();}

  template<typename Key>
  BOOST_FORCEINLINE iterator find(const Key& x)
  {
    auto hash=hash_for(x);
    return find_impl(x,position_for(hash),hash);
  }

  template<typename Key>
  BOOST_FORCEINLINE const_iterator find(const Key& x)const
  {
    return const_cast<table*>(this)->find(x);
  }

  std::size_t capacity()const noexcept
  {
    return arrays.elements?(arrays.groups_size_mask+1)*N-1:0;
  }
  
  float load_factor()const noexcept
  {
    if (capacity() == 0) { return 0; }
    return float(size())/float(capacity());
  }

  float max_load_factor()const noexcept{return mlf;}

  std::size_t max_load()const noexcept{return ml;}

  void rehash(std::size_t n)
  {
    auto m=size_t(std::ceil(float(size())/mlf));
    if(m>n)n=m;
    if(n)n=capacity_for(n); /* exact resulting capacity */

    if(n!=capacity())unchecked_rehash(n);
  }

  void reserve(std::size_t n)
  {
    rehash(std::size_t(std::ceil(float(n)/mlf)));
  }

  template<typename Predicate>
  friend std::size_t erase_if(table& x,Predicate pr)
  {
    return x.erase_if_impl(pr);
  }

private:
  template<typename,typename,typename,typename> friend class table;
  using arrays_type=table_arrays<value_type,group_type,size_policy>;

  struct clear_on_exit
  {
    ~clear_on_exit(){x.clear();}
    table& x;
  };

  Hash&            h(){return hash_base::get();}
  const Hash&      h()const{return hash_base::get();}
  Pred&            pred(){return pred_base::get();}
  const Pred&      pred()const{return pred_base::get();}
  Allocator&       al(){return allocator_base::get();}
  const Allocator& al()const{return allocator_base::get();}

  arrays_type new_arrays(std::size_t n)
  {
    return arrays_type::new_(al(),n);
  }

  void delete_arrays(arrays_type& arrays_)noexcept
  {
    arrays_type::delete_(al(),arrays_);
  }

  template<typename... Args>
  void construct_element(value_type* p,Args&&... args)
  {
    alloc_traits::construct(al(),p,std::forward<Args>(args)...);
  }

  void destroy_element(value_type* p)noexcept
  {
    alloc_traits::destroy(al(),p);
  }

  struct destroy_element_on_exit
  {
    ~destroy_element_on_exit(){this_->destroy_element(p);}
    table      *this_;
    value_type *p;
  };

  void recover_slot(unsigned char* pc)
  {
    /* If this slot potentially caused overflow, we decrease the maximum load so
     * that average probe length won't increase unboundedly in repeated
     * insert/erase cycles (drift).
     */
    ml-=group_type::maybe_caused_overflow(pc);
    group_type::reset(pc);
    --size_;
  }

  void recover_slot(group_type* pg,std::size_t pos)
  {
    recover_slot(reinterpret_cast<unsigned char*>(pg)+pos);
  }

  std::size_t initial_max_load()const
  {
    static constexpr std::size_t small_capacity=2*N-1;

    auto capacity_=capacity();
    if(capacity_<=small_capacity){
      return capacity_; /* we allow 100% usage */
    }
    else{
      return (std::size_t)(mlf*(float)(capacity_));
    }
  }

  template<typename T>
  static inline auto key_from(const T& x)
    ->decltype(type_policy::extract(x))
  {
    return type_policy::extract(x);
  }

  template<typename Arg1,typename Arg2>
  static inline auto key_from(
    std::piecewise_construct_t,const Arg1& k,const Arg2&)
    ->decltype(std::get<0>(k))
  {
    return std::get<0>(k);
  }

  template<typename Key>
  inline std::size_t hash_for(const Key& x)const
  {
    return mix_policy::mix(h(),x);
  }

  inline std::size_t position_for(std::size_t hash)const
  {
    return position_for(hash,arrays);
  }

  static inline std::size_t position_for(
    std::size_t hash,const arrays_type& arrays_)
  {
    return size_policy::position(hash,arrays_.groups_size_index);
  }

  static inline void prefetch_elements(const value_type* p)
  {
    /* We have experimentally confirmed that ARM architectures get a higher
     * speedup when around the first half of the element slots in a group are
     * prefetched, whereas for Intel just the first cache line is best.
     * Please report back if you find better tunings for some particular
     * architectures.
     */

#if BOOST_ARCH_ARM
    /* Cache line size can't be known at compile time, so we settle on
     * the very frequent value of 64B.
     */
    constexpr int  cache_line=64;
    const char    *p0=reinterpret_cast<const char*>(p),
                  *p1=p0+sizeof(value_type)*N/2;
    for(;p0<p1;p0+=cache_line)prefetch(p0);
#else
    prefetch(p);
#endif
  }

#if defined(BOOST_MSVC)
/* warning: forcing value to bool 'true' or 'false' in bool(pred()...) */
#pragma warning(push)
#pragma warning(disable:4800)
#endif

  template<typename Key>
  BOOST_FORCEINLINE iterator find_impl(
    const Key& x,std::size_t pos0,std::size_t hash)const
  {    
    prober pb(pos0);
    do{
      auto pos=pb.get();
      auto pg=arrays.groups+pos;
      auto mask=pg->match(hash);
      if(mask){
        auto p=arrays.elements+pos*N;
        prefetch_elements(p);
        do{
          auto n=unchecked_countr_zero(mask);
          if(BOOST_LIKELY(bool(pred()(x,key_from(p[n]))))){
            return {pg,n,p+n};
          }
          mask&=mask-1;
        }while(mask);
      }
      if(BOOST_LIKELY(pg->is_not_overflowed(hash))){
        return {}; /* end() */
      }
    }
    while(BOOST_LIKELY(pb.next(arrays.groups_size_mask)));
    return {}; /* end() */
  }

#if defined(BOOST_MSVC)
#pragma warning(pop) /* C4800 */
#endif

  template<typename... Args>
  BOOST_FORCEINLINE std::pair<iterator,bool> emplace_impl(Args&&... args)
  {
    const auto &k=key_from(std::forward<Args>(args)...);
    auto        hash=hash_for(k);
    auto        pos0=position_for(hash);
    auto        it=find_impl(k,pos0,hash);

    if(it!=end()){
      return {it,false};
    }
    if(BOOST_LIKELY(size_<ml)){
      return {
        unchecked_emplace_at(pos0,hash,std::forward<Args>(args)...),
        true
      };  
    }
    else{
      return {
        unchecked_emplace_with_rehash(hash,std::forward<Args>(args)...),
        true
      };  
    }
  }

  static std::size_t capacity_for(std::size_t n)
  {
    return size_policy::size(size_index_for<group_type,size_policy>(n))*N-1;
  }

  template<typename... Args>
  BOOST_NOINLINE iterator
  unchecked_emplace_with_rehash(std::size_t hash,Args&&... args)
  {
    /* Due to the anti-drift mechanism (see recover_slot), new_arrays_ may be
     * of the same size as the old arrays; in the limit, erasing one element at
     * full load and then inserting could bring us back to the same capacity
     * after a costly rehash. To avoid this, we jump to the next capacity level
     * when the number of erased elements is <= 10% of total elements at full
     * load, which is implemented by requesting additional F*size elements,
     * with F = P * 10% / (1 - P * 10%), where P is the probability of an
     * element having caused overflow; P has been measured as ~0.162 under
     * ideal conditions, yielding F ~ 0.0165 ~ 1/61.
     */
    auto     new_arrays_=new_arrays(std::size_t(
               std::ceil(static_cast<float>(size_+size_/61+1)/mlf)));
    iterator it;
    BOOST_TRY{
      /* strong exception guarantee -> try insertion before rehash */
      it=nosize_unchecked_emplace_at(
        new_arrays_,position_for(hash,new_arrays_),
        hash,std::forward<Args>(args)...);
    }
    BOOST_CATCH(...){
      delete_arrays(new_arrays_);
      BOOST_RETHROW
    }
    BOOST_CATCH_END

    /* new_arrays_ lifetime taken care of by unchecked_rehash */
    unchecked_rehash(new_arrays_);
    ++size_;
    return it;
  }

  BOOST_NOINLINE void unchecked_rehash(std::size_t n)
  {
    auto new_arrays_=new_arrays(n);
    unchecked_rehash(new_arrays_);
  }

  BOOST_NOINLINE void unchecked_rehash(arrays_type& new_arrays_)
  {
    std::size_t num_destroyed=0;
    BOOST_TRY{
      for_all_elements([&,this](value_type* p){
        nosize_transfer_element(p,new_arrays_,num_destroyed);
      });
    }
    BOOST_CATCH(...){
      if(num_destroyed){
        for(auto pg=arrays.groups;;++pg){
          auto mask=pg->match_occupied();
          while(mask){
            auto nz=unchecked_countr_zero(mask);
            recover_slot(pg,nz);
            if(!(--num_destroyed))goto continue_;
            mask&=mask-1;
          }
        }
      }
      continue_:
      for_all_elements(new_arrays_,[this](value_type* p){
        destroy_element(p);
      });
      delete_arrays(new_arrays_);
      BOOST_RETHROW
    }
    BOOST_CATCH_END

    /* either all moved and destroyed or all copied */
    BOOST_ASSERT(num_destroyed==size()||num_destroyed==0);
    if(num_destroyed!=size()){
      for_all_elements([this](value_type* p){
        destroy_element(p);
      });
    }
    delete_arrays(arrays);
    arrays=new_arrays_;
    ml=initial_max_load();
  }

  void noshrink_reserve(std::size_t n)
  {
    /* used only on assignment after element clearance */
    BOOST_ASSERT(empty());

    if(n){
      n=std::size_t(std::ceil(float(n)/mlf)); /* elements -> slots */
      n=capacity_for(n); /* exact resulting capacity */

      if(n>capacity()){
        auto new_arrays_=new_arrays(n);
        delete_arrays(arrays);
        arrays=new_arrays_;
        ml=initial_max_load();
      }
    }
  }

  template<typename Value>
  void unchecked_insert(Value&& x)
  {
    auto hash=hash_for(key_from(x));
    unchecked_emplace_at(position_for(hash),hash,std::forward<Value>(x));
  }

  void nosize_transfer_element(
    value_type* p,const arrays_type& arrays_,std::size_t& num_destroyed)
  {
    nosize_transfer_element(
      p,hash_for(key_from(*p)),arrays_,num_destroyed,
      std::integral_constant< /* std::move_if_noexcept semantics */
        bool,
        std::is_nothrow_move_constructible<init_type>::value||
        !std::is_copy_constructible<init_type>::value>{});
  }

  void nosize_transfer_element(
    value_type* p,std::size_t hash,const arrays_type& arrays_,
    std::size_t& num_destroyed,std::true_type /* ->move */)
  {
    /* Destroy p even if an an exception is thrown in the middle of move
     * construction, which could leave the source half-moved.
     */
    ++num_destroyed;
    destroy_element_on_exit d{this,p};
    (void)d; /* unused var warning */
    nosize_unchecked_emplace_at(
      arrays_,position_for(hash,arrays_),hash,type_policy::move(*p));
  }

  void nosize_transfer_element(
    value_type* p,std::size_t hash,const arrays_type& arrays_,
    std::size_t& /*num_destroyed*/,std::false_type /* ->copy */)
  {
    nosize_unchecked_emplace_at(
      arrays_,position_for(hash,arrays_),hash,
      const_cast<const value_type&>(*p));
  }

  template<typename... Args>
  iterator unchecked_emplace_at(
    std::size_t pos0,std::size_t hash,Args&&... args)
  {
    auto res=nosize_unchecked_emplace_at(
      arrays,pos0,hash,std::forward<Args>(args)...);
    ++size_;
    return res;
  }

  template<typename... Args>
  iterator nosize_unchecked_emplace_at(
    const arrays_type& arrays_,std::size_t pos0,std::size_t hash,
    Args&&... args)
  {
    for(prober pb(pos0);;pb.next(arrays_.groups_size_mask)){
      auto pos=pb.get();
      auto pg=arrays_.groups+pos;
      auto mask=pg->match_available();
      if(BOOST_LIKELY(mask!=0)){
        auto n=unchecked_countr_zero(mask);
        auto p=arrays_.elements+pos*N+n;
        construct_element(p,std::forward<Args>(args)...);
        pg->set(n,hash);
        return {pg,n,p};
      }
      else pg->mark_overflow(hash);
    }
  }

  template<typename Predicate>
  std::size_t erase_if_impl(Predicate pr)
  {
    std::size_t s=size();
    for_all_elements([&,this](group_type* pg,unsigned int n,value_type* p){
      if(pr(*p)) erase(iterator{pg,n,p});
    });
    return std::size_t(s-size());
  }

  template<typename F>
  void for_all_elements(F f)const
  {
    for_all_elements(arrays,f);
  }

  template<typename F>
  static auto for_all_elements(const arrays_type& arrays_,F f)
    ->decltype(f(nullptr),void())
  {
    for_all_elements(
      arrays_,[&](group_type*,unsigned int,value_type* p){return f(p);});
  }

  template<typename F>
  static auto for_all_elements(const arrays_type& arrays_,F f)
    ->decltype(f(nullptr,0,nullptr),void())
  {
    auto p=arrays_.elements;
    if(!p){return;}
    for(auto pg=arrays_.groups,last=pg+arrays_.groups_size_mask+1;
        pg!=last;++pg,p+=N){
      auto mask=pg->match_really_occupied();
      while(mask){
        auto n=unchecked_countr_zero(mask);
        f(pg,n,p+n);
        mask&=mask-1;
      }
    }
  }

  std::size_t size_;
  arrays_type arrays;
  std::size_t ml;
};

#if BOOST_WORKAROUND(BOOST_MSVC,<=1900)
#pragma warning(pop) /* C4702 */
#endif

#if defined(BOOST_MSVC)
#pragma warning(pop) /* C4714 */
#endif

#if defined(BOOST_GCC)
#pragma GCC diagnostic pop /* ignored "-Wshadow" */
#endif

} /* namespace foa */
} /* namespace detail */
} /* namespace unordered */
} /* namespace boost */

#undef BOOST_UNORDERED_ASSUME
#undef BOOST_UNORDERED_HAS_BUILTIN
#ifdef BOOST_UNORDERED_LITTLE_ENDIAN_NEON
#undef BOOST_UNORDERED_LITTLE_ENDIAN_NEON
#endif
#ifdef BOOST_UNORDERED_SSE2
#undef BOOST_UNORDERED_SSE2
#endif
#endif
