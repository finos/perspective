/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#include <perspective/scalar.h>

namespace exprtk {

using perspective::t_tscalar;
using perspective::mktscalar;
using perspective::mknone;

namespace details {
namespace numeric {
namespace details {

/**
 * Allows for tag dispatching so that the overloads in this header
 * are called for t_tscalar operations.
 */
struct t_tscalar_type_tag;

template <typename T> inline T const_pi_impl(t_tscalar_type_tag);
template <typename T> inline T const_e_impl(t_tscalar_type_tag);

template <typename T>
inline int to_int32_impl(const T& v, t_tscalar_type_tag);

template <typename T>
inline long long int to_int64_impl(const T& v, t_tscalar_type_tag);

#define define_unary_function_impl_header(FunctionName)                 \
template <typename T>                                                   \
inline T FunctionName##_impl(const T v, t_tscalar_type_tag);            \

define_unary_function_impl_header(abs)
define_unary_function_impl_header(acos)
define_unary_function_impl_header(acosh)
define_unary_function_impl_header(asin)
define_unary_function_impl_header(asinh)
define_unary_function_impl_header(atan)
define_unary_function_impl_header(atanh)
define_unary_function_impl_header(ceil)
define_unary_function_impl_header(cos)
define_unary_function_impl_header(cosh)
define_unary_function_impl_header(exp)
define_unary_function_impl_header(expm1)
define_unary_function_impl_header(floor)
define_unary_function_impl_header(log)
define_unary_function_impl_header(log10)
define_unary_function_impl_header(log2)
define_unary_function_impl_header(log1p)
define_unary_function_impl_header(neg)
define_unary_function_impl_header(pos)
define_unary_function_impl_header(round)
define_unary_function_impl_header(sin)
define_unary_function_impl_header(sinc)
define_unary_function_impl_header(sinh)
define_unary_function_impl_header(sqrt)
define_unary_function_impl_header(tan)
define_unary_function_impl_header(tanh)
define_unary_function_impl_header(cot)
define_unary_function_impl_header(sec)
define_unary_function_impl_header(csc)
define_unary_function_impl_header(r2d)
define_unary_function_impl_header(d2r)
define_unary_function_impl_header(d2g)
define_unary_function_impl_header(g2d)
define_unary_function_impl_header(notl)
define_unary_function_impl_header(sgn)
define_unary_function_impl_header(erf)
define_unary_function_impl_header(erfc)
define_unary_function_impl_header(ncdf)
define_unary_function_impl_header(frac)
define_unary_function_impl_header(trunc)

#undef define_unary_function_impl_header

#define define_binary_function_impl_header(FunctionName)                  \
template <typename T>                                                     \
inline T FunctionName##_impl(const T v0, const T v1, t_tscalar_type_tag); \

// except reserved words: and, or, xor
define_binary_function_impl_header(min)
define_binary_function_impl_header(max)
define_binary_function_impl_header(equal)
define_binary_function_impl_header(nequal)
define_binary_function_impl_header(modulus)
define_binary_function_impl_header(pow)
define_binary_function_impl_header(logn)
define_binary_function_impl_header(root)
define_binary_function_impl_header(roundn)
define_binary_function_impl_header(hypot)
define_binary_function_impl_header(atan2)
define_binary_function_impl_header(shr)
define_binary_function_impl_header(shl)
define_binary_function_impl_header(nand)
define_binary_function_impl_header(nor)
define_binary_function_impl_header(xnor)

#undef define_binary_function_impl_header

template <typename T>
inline T and_impl(const T v0, const T v1, t_tscalar_type_tag);

template <typename T>
inline T or_impl(const T v0, const T v1, t_tscalar_type_tag);

template <typename T>
inline T xor_impl(const T v0, const T v1, t_tscalar_type_tag);

template <typename T>
inline bool is_integer_impl(const T& v, t_tscalar_type_tag);

// #if (defined(_MSC_VER) && (_MSC_VER >= 1900)) || !defined(_MSC_VER)
// #define exprtk_define_erf(TT,impl)           \
// inline TT erf_impl(TT v) { return impl(v); } \

// exprtk_define_erf(      float,::erff)
// exprtk_define_erf(     double,::erf )
// exprtk_define_erf(long double,::erfl)
// #undef exprtk_define_erf
// #endif

// #if (defined(_MSC_VER) && (_MSC_VER >= 1900)) || !defined(_MSC_VER)
// #define exprtk_define_erfc(TT,impl)           \
// inline TT erfc_impl(TT v) { return impl(v); } \

// exprtk_define_erfc(      float,::erfcf)
// exprtk_define_erfc(     double,::erfc )
// exprtk_define_erfc(long double,::erfcl)
// #undef exprtk_define_erfc
// #endif

} // end namespace details
} // end namespace numeric

inline bool is_true(const t_tscalar& v);

inline bool is_false(const t_tscalar& v);

template <typename Iterator>
inline bool string_to_real(Iterator& itr_external, const Iterator end, t_tscalar& t, numeric::details::t_tscalar_type_tag);

} // end namespace details
} // end namespace exprtk

// exprtk needs to be imported after the type tags have been declared.
// #define exprtk_enable_debugging
#define exprtk_disable_rtl_io_file
#include <exprtk.hpp>

namespace exprtk {
namespace details {
namespace numeric {
namespace details {

#define UNARY_STD_FUNCTION_BODY(FUNC)                                                                    \
    switch (v.get_dtype()) {                                                                             \
        case perspective::t_dtype::DTYPE_INT64: return mktscalar(static_cast<double>(std::FUNC(v.get<std::int64_t>())));      \
        case perspective::t_dtype::DTYPE_INT32: return mktscalar(static_cast<double>(std::FUNC(v.get<std::int32_t>())));      \
        case perspective::t_dtype::DTYPE_INT16: return mktscalar(static_cast<double>(std::FUNC(v.get<std::int16_t>())));      \
        case perspective::t_dtype::DTYPE_INT8: return mktscalar(static_cast<double>(std::FUNC(v.get<std::int8_t>())));        \
        case perspective::t_dtype::DTYPE_UINT64: return mktscalar(static_cast<double>(std::FUNC(v.get<std::uint64_t>())));    \
        case perspective::t_dtype::DTYPE_UINT32: return mktscalar(static_cast<double>(std::FUNC(v.get<std::uint32_t>())));    \
        case perspective::t_dtype::DTYPE_UINT16: return mktscalar(static_cast<double>(std::FUNC(v.get<std::uint16_t>())));    \
        case perspective::t_dtype::DTYPE_UINT8: return mktscalar(static_cast<double>(std::FUNC(v.get<std::uint8_t>())));      \
        case perspective::t_dtype::DTYPE_FLOAT64: return mktscalar(static_cast<double>(std::FUNC(v.get<double>())));          \
        case perspective::t_dtype::DTYPE_FLOAT32: return mktscalar(static_cast<double>(std::FUNC(v.get<float>())));           \
        default: return mknone();                                                                        \
    }                                                                                                    \

/**
 * @brief a function that returns none for all types besides float.
 * 
 */
#define UNARY_STD_INT_FUNCTION_BODY(FUNC)                                                                \
    switch (v.get_dtype()) {                                                                             \
        case perspective::t_dtype::DTYPE_FLOAT64: return mktscalar(static_cast<double>(std::FUNC(v.get<double>())));          \
        case perspective::t_dtype::DTYPE_FLOAT32: return mktscalar(static_cast<double>(std::FUNC(v.get<float>())));           \
        default: return mknone();                                                                        \
    }                                                                                                    \

#define BINARY_STD_FUNCTION_INNER(V0_TYPE, FUNC)                                                                           \
    switch (v1.get_dtype()) {                                                                                              \
        case perspective::t_dtype::DTYPE_INT64: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::int64_t>())));      \
        case perspective::t_dtype::DTYPE_INT32: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::int32_t>())));      \
        case perspective::t_dtype::DTYPE_INT16: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::int16_t>())));      \
        case perspective::t_dtype::DTYPE_INT8: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::int8_t>())));        \
        case perspective::t_dtype::DTYPE_UINT64: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::uint64_t>())));    \
        case perspective::t_dtype::DTYPE_UINT32: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::uint32_t>())));    \
        case perspective::t_dtype::DTYPE_UINT16: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::uint16_t>())));    \
        case perspective::t_dtype::DTYPE_UINT8: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<std::uint8_t>())));      \
        case perspective::t_dtype::DTYPE_FLOAT64: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<double>())));          \
        case perspective::t_dtype::DTYPE_FLOAT32: return mktscalar(static_cast<double>(std::FUNC(v0.get<V0_TYPE>, v1.get<float>())));           \
        default: return mknone();                                                                                          \
    }                                                                                                                      \

#define BINARY_STD_FUNCTION_BODY(FUNC)                                                            \
    switch (v0.get_dtype()) {                                                                     \
        case perspective::t_dtype::DTYPE_INT64: BINARY_STD_FUNCTION_INNER(std::int64_t, FUNC)     \
        case perspective::t_dtype::DTYPE_INT32: BINARY_STD_FUNCTION_INNER(std::int32_t, FUNC)     \
        case perspective::t_dtype::DTYPE_INT16: BINARY_STD_FUNCTION_INNER(std::int16_t, FUNC)     \
        case perspective::t_dtype::DTYPE_INT8: BINARY_STD_FUNCTION_INNER(std::int8_t, FUNC)       \
        case perspective::t_dtype::DTYPE_UINT64: BINARY_STD_FUNCTION_INNER(std::int64_t, FUNC)    \
        case perspective::t_dtype::DTYPE_UINT32: BINARY_STD_FUNCTION_INNER(std::int32_t, FUNC)    \
        case perspective::t_dtype::DTYPE_UINT16: BINARY_STD_FUNCTION_INNER(std::int16_t, FUNC)    \
        case perspective::t_dtype::DTYPE_UINT8: BINARY_STD_FUNCTION_INNER(std::int8_t, FUNC)      \
        case perspective::t_dtype::DTYPE_FLOAT64: BINARY_STD_FUNCTION_INNER(double, FUNC)         \
        case perspective::t_dtype::DTYPE_FLOAT32: BINARY_STD_FUNCTION_INNER(float, FUNC)          \
        default: return mknone();                                                                 \
    }                                                                                             \

struct t_tscalar_type_tag {};

template<>
struct number_type<t_tscalar> {
    typedef t_tscalar_type_tag type;
    number_type() {}
};

template <>
inline t_tscalar const_pi_impl(t_tscalar_type_tag) {
    t_tscalar rval;
    rval.set(constant::pi);
    return rval;
};

template <>
inline t_tscalar const_e_impl(t_tscalar_type_tag) {
    t_tscalar rval;
    rval.set(constant::e);
    return rval;
};

template <>
struct epsilon_type<t_tscalar> {
    static inline t_tscalar value() {
        t_tscalar rval;
        rval.set(0.0000000001);
        return rval;
    }
};    

inline bool is_nan_impl(const t_tscalar& v, t_tscalar_type_tag) {
    return v.is_nan();
}

template <>
inline int to_int32_impl(const t_tscalar& v, t_tscalar_type_tag) {
    switch (v.get_dtype()) {
        case perspective::t_dtype::DTYPE_INT64: return static_cast<int>(v.get<std::int64_t>());
        case perspective::t_dtype::DTYPE_INT32: return static_cast<int>(v.get<std::int32_t>());
        case perspective::t_dtype::DTYPE_INT16: return static_cast<int>(v.get<std::int16_t>());
        case perspective::t_dtype::DTYPE_INT8: return static_cast<int>(v.get<std::int8_t>());
        case perspective::t_dtype::DTYPE_UINT64: return static_cast<int>(v.get<std::uint64_t>());
        case perspective::t_dtype::DTYPE_UINT32: return static_cast<int>(v.get<std::uint32_t>());
        case perspective::t_dtype::DTYPE_UINT16: return static_cast<int>(v.get<std::uint16_t>());
        case perspective::t_dtype::DTYPE_UINT8: return static_cast<int>(v.get<std::uint8_t>());
        case perspective::t_dtype::DTYPE_FLOAT64: return static_cast<int>(v.get<double>());
        case perspective::t_dtype::DTYPE_FLOAT32: return static_cast<int>(v.get<float>());
        default: return 0;
    }
}

template <>
inline long long int to_int64_impl(const t_tscalar& v, t_tscalar_type_tag) {
    switch (v.get_dtype()) {
        case perspective::t_dtype::DTYPE_INT64: return v.get<std::int64_t>();
        case perspective::t_dtype::DTYPE_INT32: return v.get<std::int32_t>();
        case perspective::t_dtype::DTYPE_INT16: return v.get<std::int16_t>();
        case perspective::t_dtype::DTYPE_INT8: return v.get<std::int8_t>();
        case perspective::t_dtype::DTYPE_UINT64: return v.get<std::uint64_t>();
        case perspective::t_dtype::DTYPE_UINT32: return v.get<std::uint32_t>();
        case perspective::t_dtype::DTYPE_UINT16: return v.get<std::uint16_t>();
        case perspective::t_dtype::DTYPE_UINT8: return v.get<std::uint8_t>();
        case perspective::t_dtype::DTYPE_FLOAT64: return v.get<double>();
        case perspective::t_dtype::DTYPE_FLOAT32: return v.get<float>();
        default: return 0;
    }
}

/******************************************************************************
 *
 * Unary functions
 */
template <> inline t_tscalar abs_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar acos_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(acos) }
template <> inline t_tscalar acosh_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar asin_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(asin) }
template <> inline t_tscalar asinh_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar atan_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(atan) }
template <> inline t_tscalar atanh_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar ceil_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(ceil) }
template <> inline t_tscalar cos_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(cos) }
template <> inline t_tscalar cosh_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(cosh) }
template <> inline t_tscalar exp_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(exp) }
template <> inline t_tscalar expm1_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar floor_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(floor) }
template <> inline t_tscalar log_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(log) }
template <> inline t_tscalar log10_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(log10) }
template <> inline t_tscalar log2_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar log1p_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar neg_impl(const t_tscalar v, t_tscalar_type_tag) { return -v; }
template <> inline t_tscalar round_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(round) }
template <> inline t_tscalar pos_impl(const t_tscalar v, t_tscalar_type_tag) { return +v; }
template <> inline t_tscalar sgn_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar sin_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(sin) }
template <> inline t_tscalar sinc_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar sinh_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(sinh) }
template <> inline t_tscalar sqrt_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_FUNCTION_BODY(sqrt) }
template <> inline t_tscalar tan_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(tan) }
template <> inline t_tscalar tanh_impl(const t_tscalar v, t_tscalar_type_tag) { UNARY_STD_INT_FUNCTION_BODY(tanh) }
template <> inline t_tscalar cot_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar sec_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar csc_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar r2d_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar d2r_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar d2g_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar g2d_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar notl_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar frac_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar trunc_impl(const t_tscalar v, t_tscalar_type_tag) {
    // TODO: this is used in vector construction and doesn't work for some reason.
    switch (v.get_dtype()) {
        case perspective::t_dtype::DTYPE_INT64: return mktscalar(v.get<std::int64_t>());
        case perspective::t_dtype::DTYPE_INT32: return mktscalar(static_cast<std::int64_t>(v.get<std::int32_t>()));
        case perspective::t_dtype::DTYPE_INT16: return mktscalar(static_cast<std::int64_t>(v.get<std::int16_t>()));
        case perspective::t_dtype::DTYPE_INT8: return mktscalar(static_cast<std::int64_t>(v.get<std::int8_t>()));
        case perspective::t_dtype::DTYPE_UINT64: return mktscalar(static_cast<std::int64_t>(v.get<std::uint64_t>()));
        case perspective::t_dtype::DTYPE_UINT32: return mktscalar(static_cast<std::int64_t>(v.get<std::uint32_t>()));
        case perspective::t_dtype::DTYPE_UINT16: return mktscalar(static_cast<std::int64_t>(v.get<std::uint16_t>()));
        case perspective::t_dtype::DTYPE_UINT8: return mktscalar(static_cast<std::int64_t>(v.get<std::uint8_t>()));
        case perspective::t_dtype::DTYPE_FLOAT64: return mktscalar(static_cast<std::int64_t>(v.get<double>()));
        case perspective::t_dtype::DTYPE_FLOAT32: return mktscalar(static_cast<std::int64_t>(v.get<float>()));
        default: return mknone();
    }
}
template <> inline t_tscalar erf_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar erfc_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar ncdf_impl(const t_tscalar v, t_tscalar_type_tag) { return mktscalar(0); }


/******************************************************************************
 *
 * Binary functions
 */
template <> inline t_tscalar min_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return (v1 < v0) ? v1 : v0; }
template <> inline t_tscalar max_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return (v1 > v0) ? v1 : v0;  }
template <> inline t_tscalar equal_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) {
    t_tscalar rval;
    // TODO: this doesn't work between scalars of different dtypes - how do
    // we handle equality, comparison etc. between different dtyped scalars?
    rval.set(v0 == v1);
    return rval;    
}
template <> inline t_tscalar nequal_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) {
    t_tscalar rval;
    rval.set(v0 != v1);
    return rval;
}
template <> inline t_tscalar modulus_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar pow_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar logn_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar root_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar roundn_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar hypot_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar atan2_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar shr_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar shl_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar nand_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar nor_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar xnor_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar and_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar or_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }
template <> inline t_tscalar xor_impl(const t_tscalar v0, const t_tscalar v1, t_tscalar_type_tag) { return mktscalar(0); }

template <> inline bool is_integer_impl(const t_tscalar& v, t_tscalar_type_tag) {
    switch (v.get_dtype()) {
        case perspective::t_dtype::DTYPE_INT64:
        case perspective::t_dtype::DTYPE_INT32:
        case perspective::t_dtype::DTYPE_INT16:
        case perspective::t_dtype::DTYPE_INT8:
        case perspective::t_dtype::DTYPE_UINT64:
        case perspective::t_dtype::DTYPE_UINT32:
        case perspective::t_dtype::DTYPE_UINT16: 
        case perspective::t_dtype::DTYPE_UINT8: return true;
        case perspective::t_dtype::DTYPE_FLOAT64:
        case perspective::t_dtype::DTYPE_FLOAT32: return false;
        default: return false;
    }
};

#undef UNARY_STD_FUNCTION_BODY
#undef UNARY_STD_INT_FUNCTION_BODY

} // end namespace details
} // end namespace numeric

inline bool is_true (const t_tscalar& v) {
    return static_cast<bool>(v);
}

inline bool is_false(const t_tscalar& v) {
    return !is_true(v);
};
/******************************************************************************
 *
 * String -> t_tscalar
 */

/**
 * @brief Parse an infinity value and set `t` to infinity as a DTYPE_FLOAT64
 * scalar.
 * 
 * @tparam Iterator 
 * @param itr 
 * @param end 
 * @param t 
 * @param negative 
 * @return true 
 * @return false 
 */
template <typename Iterator>
static inline bool parse_inf(Iterator& itr, const Iterator end, t_tscalar& t, bool negative) {
    static const char_t inf_uc[] = "INFINITY";
    static const char_t inf_lc[] = "infinity";
    static const std::size_t inf_length = 8;

    const std::size_t length = static_cast<std::size_t>(std::distance(itr,end));

    if ((3 != length) && (inf_length != length)) return false;

    char_cptr inf_itr = ('i' == (*itr)) ? inf_lc : inf_uc;

    while (end != itr) {
        if (*inf_itr == static_cast<char>(*itr)) {
            ++itr;
            ++inf_itr;
            continue;
        } else {
            return false;
        }

    }
    
    negative ? t.set(-std::numeric_limits<double>::infinity()) : t.set(std::numeric_limits<double>::infinity());
    t.m_type = perspective::t_dtype::DTYPE_FLOAT64;

    return true;
}

template <typename T>
inline bool valid_exponent(const int exponent, numeric::details::t_tscalar_type_tag) {
    using namespace details::numeric;
    return (numeric_info<T>::min_exp <= exponent) && (exponent <= numeric_info<T>::max_exp);
}

/**
 * @brief Parse a string to a real number, setting `t` to the parsed value and
 * giving it DTYPE_FLOAT64. Returns true if the parse succeeded, and false
 * otherwise.
 * 
 * @tparam Iterator 
 * @param itr_external 
 * @param end 
 * @param t 
 * @return true 
 * @return false 
 */
template <typename Iterator>
inline bool string_to_real(Iterator& itr_external, const Iterator end, t_tscalar& t, numeric::details::t_tscalar_type_tag) {
    bool parsed = string_to_real(itr_external, end, t.m_data.m_float64, numeric::details::real_type_tag());

    if (parsed) {
        t.m_type = perspective::DTYPE_FLOAT64;
        t.m_status = perspective::STATUS_VALID;
    }

    return parsed;

    // if (end == itr_external) return false;

    // Iterator itr = itr_external;

    // // Start the parser with a float, since we need the widest numeric type
    // // to prevent promotion later on.
    // double d = 0.0;

    // const bool negative = ('-' == (*itr));

    // if (negative || '+' == (*itr)) {
    //     if (end == ++itr) return false;
    // }

    // bool instate = false;

    // static const char_t zero = static_cast<uchar_t>('0');

    // #define parse_digit_1(d)          \
    // if ((digit = (*itr - zero)) < 10) \
    // { d = d * 10 + digit; }     \
    // else                              \
    // { break; }                     \
    // if (end == ++itr) break;          \

    // #define parse_digit_2(d)          \
    // if ((digit = (*itr - zero)) < 10) \
    // { d = d * 10 + digit; }     \
    // else { break; }                   \
    // ++itr;                         \

    // if ('.' != (*itr)) {
    //     const Iterator curr = itr;

    //     while ((end != itr) && (zero == (*itr))) ++itr;

    //     while (end != itr) {
    //         unsigned int digit;
    //         parse_digit_1(d)
    //         parse_digit_1(d)
    //         parse_digit_2(d)
    //     }

    //     if (curr != itr) instate = true;
    // }

    // int exponent = 0;

    // if (end != itr) {
    //     if ('.' == (*itr)) {
    //         const Iterator curr = ++itr;
    //         double tmp_d = 0.0;

    //         while (end != itr) {
    //             unsigned int digit;
    //             parse_digit_1(tmp_d)
    //             parse_digit_1(tmp_d)
    //             parse_digit_2(tmp_d)
    //         }

    //         if (curr != itr) {
    //             instate = true;

    //             const int frac_exponent = static_cast<int>(-std::distance(curr, itr));

    //             if (!valid_exponent<double>(frac_exponent, numeric::details::t_tscalar_type_tag()))
    //                 return false;

    //             d += compute_pow10(tmp_d, frac_exponent);
    //         }

    //         #undef parse_digit_1
    //         #undef parse_digit_2
    //     }

    //     if (end != itr) {
    //         typename std::iterator_traits<Iterator>::value_type c = (*itr);

    //         if (('e' == c) || ('E' == c)) {
    //             int exp = 0;

    //             if (!details::string_to_type_converter_impl_ref(++itr, end, exp)) {
    //                 if (end == itr) {
    //                     return false;
    //                 } else {
    //                     c = (*itr);
    //                 }
    //             }

    //             exponent += exp;
    //         }

    //         if (end != itr) {
    //             if (('f' == c) || ('F' == c) || ('l' == c) || ('L' == c)) {
    //                 ++itr;
    //             } else if ('#' == c) {
    //                 if (end == ++itr) {
    //                     return false;
    //                 } else if (('I' <= (*itr)) && ((*itr) <= 'n')) {
    //                     if (('i' == (*itr)) || ('I' == (*itr))) {
    //                         return parse_inf(itr, end, t, negative);
    //                     } else if (('n' == (*itr)) || ('N' == (*itr))) {
    //                         return parse_nan(itr, end, t);
    //                     } else
    //                         return false;
    //                 } else {
    //                     return false;
    //                 }
    //             } else if (('I' <= (*itr)) && ((*itr) <= 'n')) {
    //                 if (('i' == (*itr)) || ('I' == (*itr))) {
    //                     return parse_inf(itr, end, t, negative);
    //                 } else if (('n' == (*itr)) || ('N' == (*itr))) {
    //                     return parse_nan(itr, end, t);
    //                 } else {
    //                 return false;
    //                 }
    //             }
    //             else
    //                 return false;
    //         }
    //     }
    // }

    // if ((end != itr) || (!instate)) {
    //     return false;
    // } else if (!valid_exponent<double>(exponent, numeric::details::t_tscalar_type_tag())) {
    //     return false;
    // } else if (exponent) {
    //     d = compute_pow10(d, exponent);
    // }

    // negative ? t.set(-d) :  t.set(d);
    // t.m_type = perspective::DTYPE_FLOAT64;

    // return true;
}

} // end namespace details
} // end namespace exprtk
