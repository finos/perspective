//
// Copyright (c) 2019 Vinnie Falco (vinnie.falco@gmail.com)
// Copyright (c) 2022 Alan de Freitas (alandefreitas@gmail.com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// Official repository: https://github.com/boostorg/url
//

#ifndef BOOST_URL_DETAIL_CONFIG_HPP
#define BOOST_URL_DETAIL_CONFIG_HPP

#include <boost/config.hpp>
#include <boost/config/workaround.hpp>
#include <limits.h>
#include <stdint.h>

#if CHAR_BIT != 8
# error unsupported platform
#endif

#if defined(BOOST_URL_DOCS)
# define BOOST_URL_DECL
#else
# if (defined(BOOST_URL_DYN_LINK) || defined(BOOST_ALL_DYN_LINK)) && !defined(BOOST_URL_STATIC_LINK)
#  if defined(BOOST_URL_SOURCE)
#   define BOOST_URL_DECL  BOOST_SYMBOL_EXPORT
#   define BOOST_URL_BUILD_DLL
#  else
#   define BOOST_URL_DECL  BOOST_SYMBOL_IMPORT
#  endif
# endif // shared lib
# ifndef  BOOST_URL_DECL
#  define BOOST_URL_DECL
# endif
# if !defined(BOOST_URL_SOURCE) && !defined(BOOST_ALL_NO_LIB) && !defined(BOOST_URL_NO_LIB)
#  define BOOST_LIB_NAME boost_url
#  if defined(BOOST_ALL_DYN_LINK) || defined(BOOST_URL_DYN_LINK)
#   define BOOST_DYN_LINK
#  endif
#  include <boost/config/auto_link.hpp>
# endif
#endif

#if ! defined(BOOST_URL_NO_SSE2) && \
    ! defined(BOOST_URL_USE_SSE2)
# if (defined(_M_IX86) && _M_IX86_FP == 2) || \
      defined(_M_X64) || defined(__SSE2__)
#  define BOOST_URL_USE_SSE2
# endif
#endif

#if BOOST_WORKAROUND( BOOST_GCC_VERSION, <= 72000 ) || \
    BOOST_WORKAROUND( BOOST_CLANG_VERSION, <= 35000 )
# define BOOST_URL_CONSTEXPR
#else
# define BOOST_URL_CONSTEXPR constexpr
#endif

// Add source location to error codes
#ifdef BOOST_URL_NO_SOURCE_LOCATION
# define BOOST_URL_ERR(ev) (::boost::system::error_code(ev))
# define BOOST_URL_RETURN_EC(ev) return (ev)
# define BOOST_URL_POS ::boost::source_location()
#else
# define BOOST_URL_ERR(ev) (::boost::system::error_code( (ev), [] { \
         static constexpr auto loc((BOOST_CURRENT_LOCATION)); \
         return &loc; }()))
# define BOOST_URL_RETURN_EC(ev) \
    static constexpr auto loc ## __LINE__((BOOST_CURRENT_LOCATION)); \
    return ::boost::system::error_code((ev), &loc ## __LINE__)
# define BOOST_URL_POS (BOOST_CURRENT_LOCATION)
#endif

#ifndef BOOST_URL_STRTOK_TPARAM
#define BOOST_URL_STRTOK_TPARAM class StringToken = string_token::return_string
#endif
#ifndef BOOST_URL_STRTOK_RETURN
#define BOOST_URL_STRTOK_RETURN typename StringToken::result_type
#endif
#ifndef BOOST_URL_STRTOK_ARG
#define BOOST_URL_STRTOK_ARG(name) StringToken&& token = {}
#endif

#if BOOST_WORKAROUND( BOOST_GCC_VERSION, < 80000 ) || \
    BOOST_WORKAROUND( BOOST_CLANG_VERSION, < 30900 )
#define BOOST_URL_RETURN(x) return std::move((x))
#else
#define BOOST_URL_RETURN(x) return (x)
#endif

using pos_t = size_t;

#ifndef BOOST_URL_MAX_SIZE
// we leave room for a null,
// and still fit in pos_t
#define BOOST_URL_MAX_SIZE ((pos_t(-1))-1)
#endif

#ifdef BOOST_GCC
#define BOOST_URL_NO_INLINE [[gnu::noinline]]
#else
#define BOOST_URL_NO_INLINE
#endif

#ifndef BOOST_URL_COW_STRINGS
#if defined(BOOST_LIBSTDCXX_VERSION) && (BOOST_LIBSTDCXX_VERSION < 60000 || (defined(_GLIBCXX_USE_CXX11_ABI) && _GLIBCXX_USE_CXX11_ABI == 0))
#define BOOST_URL_COW_STRINGS
#endif
#endif

// detect 32/64 bit
#if UINTPTR_MAX == UINT64_MAX
# define BOOST_URL_ARCH 64
#elif UINTPTR_MAX == UINT32_MAX
# define BOOST_URL_ARCH 32
#else
# error Unknown or unsupported architecture, please open an issue
#endif

#endif
