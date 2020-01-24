/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/computed_method.h>

namespace perspective {
namespace computed_method {

using int8 = std::int8_t;
using int16 = std::int16_t;
using int32 = std::int32_t;
using int64 = std::int64_t;
using uint8 = std::uint8_t;
using uint16 = std::uint16_t;
using uint32 = std::uint32_t;
using uint64 = std::uint64_t;
using float32 = float;
using float64 = double;

/**
 * @brief Generate all type permutations for a numeric function that takes one
 * parameter. Return value from numeric functions are always `double`.
 */
#define NUMERIC_FUNCTION_1(FUNC)    \
    FUNC(uint8)                     \
    FUNC(uint16)                    \
    FUNC(uint32)                    \
    FUNC(uint64)                    \
    FUNC(int8)                      \
    FUNC(int16)                     \
    FUNC(int32)                     \
    FUNC(int64)                     \
    FUNC(float32)                   \
    FUNC(float64)                   \

#define POW(T)                                                      \
    t_tscalar pow_##T(t_tscalar x) {                                \
        t_tscalar rval = mknone();                                  \
        rval.set(static_cast<float64>(                              \
            pow(static_cast<float64>(x.get<T>()), 2)                \
        ));                                                         \
        return rval;                                                \
    }

#define INVERT(T)                                                   \
    t_tscalar invert_##T(t_tscalar x) {                             \
        t_tscalar rval = mknone();                                  \
        float64 rhs = static_cast<float64>(x.get<T>());             \
        if (rhs != 0) rval.set(static_cast<float64>(1 / rhs));      \
        return rval;                                                \
    }

#define SQRT(T)                                                     \
    t_tscalar sqrt_##T(t_tscalar x) {                               \
        t_tscalar rval = mknone();                                  \
        float64 val = static_cast<float64>(x.get<T>());             \
         rval.set(static_cast<float64>(sqrt(val)));                 \
        return rval;                                                \
    }

#define ABS(T)                                                      \
    t_tscalar abs_##T(t_tscalar x) {                                \
        t_tscalar rval;                                             \
        rval.set(static_cast<float64>(                              \
            std::abs(static_cast<float64>(x.get<T>()))));           \
        return rval;                                                \
    }

#define BUCKET_10(T)                                                \
    t_tscalar bucket_10_##T(t_tscalar x) {                          \
        t_tscalar rval;                                             \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 10)) * 10);           \
        return rval;                                                \
    }

#define BUCKET_100(T)                                               \
    t_tscalar bucket_100_##T(t_tscalar x) {                         \
        t_tscalar rval;                                             \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 100)) * 100);         \
        return rval;                                                \
    }

#define BUCKET_1000(T)                                              \
    t_tscalar bucket_1000_##T(t_tscalar x) {                        \
        t_tscalar rval;                                             \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 1000)) * 1000);       \
        return rval;                                                \
    }

#define BUCKET_0_1(T)                                               \
    t_tscalar bucket_0_1_##T(t_tscalar x) {                         \
        t_tscalar rval;                                             \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 0.1)) * 0.1);         \
        return rval;                                                \
    }

#define BUCKET_0_0_1(T)                                             \
    t_tscalar bucket_0_0_1_##T(t_tscalar x) {                       \
        t_tscalar rval;                                             \
        T val = x.get<T>();                                         \
        rval.set(static_cast<float64>(                              \
            floor(static_cast<float64>(val) / 0.01)) * 0.01);       \
        return rval;                                                \
    }

#define BUCKET_0_0_0_1(T)                                               \
    t_tscalar bucket_0_0_0_1_##T(t_tscalar x) {                         \
        t_tscalar rval;                                                 \
        T val = x.get<T>();                                             \
        rval.set(static_cast<float64>(                                  \
            floor(static_cast<float64>(val) / 0.001)) * 0.001);         \
        return rval;                                                    \
    }

NUMERIC_FUNCTION_1(POW);
NUMERIC_FUNCTION_1(INVERT);
NUMERIC_FUNCTION_1(SQRT);
NUMERIC_FUNCTION_1(ABS);
NUMERIC_FUNCTION_1(BUCKET_10);
NUMERIC_FUNCTION_1(BUCKET_100);
NUMERIC_FUNCTION_1(BUCKET_1000);
NUMERIC_FUNCTION_1(BUCKET_0_1);
NUMERIC_FUNCTION_1(BUCKET_0_0_1);
NUMERIC_FUNCTION_1(BUCKET_0_0_0_1);
/**
 * @brief Generate all type permutations for a numeric function that takes two
 * parameters. Return value from numeric functions are always `double`.
 */
#define NUMERIC_FUNCTION_2(FUNC) \
    FUNC(uint8, uint8)         \
    FUNC(uint8, uint16)        \
    FUNC(uint8, uint32)        \
    FUNC(uint8, uint64)        \
    FUNC(uint8, int8)          \
    FUNC(uint8, int16)         \
    FUNC(uint8, int32)         \
    FUNC(uint8, int64)         \
    FUNC(uint8, float32)       \
    FUNC(uint8, float64)       \
    FUNC(uint16, uint8)        \
    FUNC(uint16, uint16)       \
    FUNC(uint16, uint32)       \
    FUNC(uint16, uint64)       \
    FUNC(uint16, int8)         \
    FUNC(uint16, int16)        \
    FUNC(uint16, int32)        \
    FUNC(uint16, int64)        \
    FUNC(uint16, float32)      \
    FUNC(uint16, float64)      \
    FUNC(uint32, uint8)        \
    FUNC(uint32, uint16)       \
    FUNC(uint32, uint32)       \
    FUNC(uint32, uint64)       \
    FUNC(uint32, int8)         \
    FUNC(uint32, int16)        \
    FUNC(uint32, int32)        \
    FUNC(uint32, int64)        \
    FUNC(uint32, float32)      \
    FUNC(uint32, float64)      \
    FUNC(uint64, uint8)        \
    FUNC(uint64, uint16)       \
    FUNC(uint64, uint32)       \
    FUNC(uint64, uint64)       \
    FUNC(uint64, int8)         \
    FUNC(uint64, int16)        \
    FUNC(uint64, int32)        \
    FUNC(uint64, int64)        \
    FUNC(uint64, float32)      \
    FUNC(uint64, float64)      \
    FUNC(int8, uint8)          \
    FUNC(int8, uint16)         \
    FUNC(int8, uint32)         \
    FUNC(int8, uint64)         \
    FUNC(int8, int8)           \
    FUNC(int8, int16)          \
    FUNC(int8, int32)          \
    FUNC(int8, int64)          \
    FUNC(int8, float32)        \
    FUNC(int8, float64)        \
    FUNC(int16, uint8)         \
    FUNC(int16, uint16)        \
    FUNC(int16, uint32)        \
    FUNC(int16, uint64)        \
    FUNC(int16, int8)          \
    FUNC(int16, int16)         \
    FUNC(int16, int32)         \
    FUNC(int16, int64)         \
    FUNC(int16, float32)       \
    FUNC(int16, float64)       \
    FUNC(int32, uint8)         \
    FUNC(int32, uint16)        \
    FUNC(int32, uint32)        \
    FUNC(int32, uint64)        \
    FUNC(int32, int8)          \
    FUNC(int32, int16)         \
    FUNC(int32, int32)         \
    FUNC(int32, int64)         \
    FUNC(int32, float32)       \
    FUNC(int32, float64)       \
    FUNC(int64, uint8)         \
    FUNC(int64, uint16)        \
    FUNC(int64, uint32)        \
    FUNC(int64, uint64)        \
    FUNC(int64, int8)          \
    FUNC(int64, int16)         \
    FUNC(int64, int32)         \
    FUNC(int64, int64)         \
    FUNC(int64, float32)       \
    FUNC(int64, float64)       \
    FUNC(float32, uint8)       \
    FUNC(float32, uint16)      \
    FUNC(float32, uint32)      \
    FUNC(float32, uint64)      \
    FUNC(float32, int8)        \
    FUNC(float32, int16)       \
    FUNC(float32, int32)       \
    FUNC(float32, int64)       \
    FUNC(float32, float32)     \
    FUNC(float32, float64)     \
    FUNC(float64, uint8)       \
    FUNC(float64, uint16)      \
    FUNC(float64, uint32)      \
    FUNC(float64, uint64)      \
    FUNC(float64, int8)        \
    FUNC(float64, int16)       \
    FUNC(float64, int32)       \
    FUNC(float64, int64)       \
    FUNC(float64, float32)     \
    FUNC(float64, float64)     \

#define ADD(T1, T2)                                                 \
    t_tscalar add_##T1##_##T2(t_tscalar x, t_tscalar y) {           \
        t_tscalar rval;                                             \
        rval.set(static_cast<float64>(x.get<T1>() + y.get<T2>()));  \
        return rval;                                                \
    }

#define SUBTRACT(T1, T2)                                                 \
    t_tscalar subtract_##T1##_##T2(t_tscalar x, t_tscalar y) {           \
        t_tscalar rval;                                                  \
        rval.set(static_cast<float64>(x.get<T1>() - y.get<T2>()));       \
        return rval;                                                     \
    }

#define MULTIPLY(T1, T2)                                                \
    t_tscalar multiply_##T1##_##T2(t_tscalar x, t_tscalar y) {          \
        t_tscalar rval;                                                 \
        rval.set(static_cast<float64>(x.get<T1>() * y.get<T2>()));      \
        return rval;                                                    \
    }

#define DIVIDE(T1, T2)                                                         \
    t_tscalar divide_##T1##_##T2(t_tscalar x, t_tscalar y) {                   \
        t_tscalar rval = mknone();                                             \
        float64 lhs = static_cast<float64>(x.get<T1>());                       \
        float64 rhs = static_cast<float64>(y.get<T2>());                       \
        if (rhs != 0) rval.set(static_cast<float64>(lhs / rhs));               \
        return rval;                                                           \
    }

NUMERIC_FUNCTION_2(ADD);
NUMERIC_FUNCTION_2(SUBTRACT);
NUMERIC_FUNCTION_2(MULTIPLY);
NUMERIC_FUNCTION_2(DIVIDE);

/**
 * @brief Generate dispatch functions that call the correct computation method
 * with typings.
 */
#define NUMERIC_FUNCTION_2_DISPATCH(OP, DTYPE, T1)                               \
    template <>                                                                \
    t_tscalar OP<DTYPE>(t_tscalar x, t_tscalar y) {                   \
        switch (y.get_dtype()) {                                               \
            case DTYPE_UINT8: return OP##_##T1##_uint8(x, y);                  \
            case DTYPE_UINT16: return OP##_##T1##_uint16(x, y);                \
            case DTYPE_UINT32: return OP##_##T1##_uint32(x, y);                \
            case DTYPE_UINT64: return OP##_##T1##_uint64(x, y);                \
            case DTYPE_INT8: return OP##_##T1##_int8(x, y);                    \
            case DTYPE_INT16: return OP##_##T1##_int16(x, y);                  \
            case DTYPE_INT32: return OP##_##T1##_int32(x, y);                  \
            case DTYPE_INT64: return OP##_##T1##_int64(x, y);                  \
            case DTYPE_FLOAT32: return OP##_##T1##_float32(x, y);              \
            case DTYPE_FLOAT64: return OP##_##T1##_float64(x, y);              \
            default: break;                                                    \
        }                                                                      \
        return mknone();                                                       \
    }

NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_UINT8, uint8);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_UINT16, uint16);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_UINT32, uint32);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_UINT64, uint64);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_INT8, int8);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_INT16, int16);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_INT32, int32);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_INT64, int64);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_FLOAT32, float32);
NUMERIC_FUNCTION_2_DISPATCH(add, DTYPE_FLOAT64, float64);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_UINT8, uint8);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_UINT16, uint16);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_UINT32, uint32);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_UINT64, uint64);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_INT8, int8);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_INT16, int16);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_INT32, int32);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_INT64, int64);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_FLOAT32, float32);
NUMERIC_FUNCTION_2_DISPATCH(subtract, DTYPE_FLOAT64, float64);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_UINT8, uint8);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_UINT16, uint16);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_UINT32, uint32);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_UINT64, uint64);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_INT8, int8);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_INT16, int16);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_INT32, int32);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_INT64, int64);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_FLOAT32, float32);
NUMERIC_FUNCTION_2_DISPATCH(multiply, DTYPE_FLOAT64, float64);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_UINT8, uint8);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_UINT16, uint16);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_UINT32, uint32);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_UINT64, uint64);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_INT8, int8);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_INT16, int16);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_INT32, int32);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_INT64, int64);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_FLOAT32, float32);
NUMERIC_FUNCTION_2_DISPATCH(divide, DTYPE_FLOAT64, float64);

// Invert

// Uppercase

t_tscalar uppercase(t_tscalar x) {
    t_tscalar rval = mknone();

    if (x.get_dtype() != DTYPE_STR) {
        return rval;
    }

    std::string val = x.to_string();
    boost::to_upper<std::string>(val);
    rval.set(val.c_str());
    return rval;
}

} // end namespace computed_method
} // end namespace perspective