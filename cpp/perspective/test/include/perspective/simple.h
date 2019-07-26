#pragma once

#include <perspective/base.h>
#include <perspective/config.h>
#include <perspective/data_table.h>
#include <perspective/date.h>
#include <perspective/time.h>
#include <perspective/test_utils.h>
#include <perspective/simple.h>
#include <perspective/context_base.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/context_zero.h>
#include <perspective/context_grouped_pkey.h>
#include <perspective/node_processor.h>
#include <perspective/storage.h>
#include <perspective/none.h>
#include <perspective/gnode.h>
#include <perspective/sym_table.h>
#include <gtest/gtest.h>
#include <random>
#include <limits>
#include <cmath>
#include <cstdint>
#include <sstream>

namespace perspective{

t_tscalar bnull = mknull(DTYPE_BOOL);
t_tscalar snull = mknull(DTYPE_STR);
t_tscalar i64_null = mknull(DTYPE_INT64);

t_tscalar s_true = mktscalar<bool>(true);
t_tscalar s_false = mktscalar<bool>(false);
t_tscalar s_none = mktscalar<t_none>(t_none());
t_tscalar iop = mktscalar<std::uint8_t>(OP_INSERT);
t_tscalar dop = mktscalar<std::uint8_t>(OP_DELETE);
t_tscalar cop = mktscalar<std::uint8_t>(OP_CLEAR);
t_tscalar s_nan32 = mktscalar(std::numeric_limits<float>::quiet_NaN());
t_tscalar s_nan64 = mktscalar(std::numeric_limits<double>::quiet_NaN());
t_tscalar i64_clear = mkclear(DTYPE_INT64);
t_tscalar f64_clear = mkclear(DTYPE_FLOAT64);
t_tscalar str_clear = mkclear(DTYPE_STR);

std::vector<t_dtype> numeric_dtypes{
    DTYPE_INT64,
    DTYPE_INT32,
    DTYPE_INT16,
    DTYPE_INT8,
    DTYPE_UINT64,
    DTYPE_UINT32,
    DTYPE_UINT16,
    DTYPE_UINT8,
    DTYPE_FLOAT64,
    DTYPE_FLOAT32,
};

std::vector<t_dtype> common_dtypes{
    DTYPE_NONE,
    DTYPE_INT64,
    DTYPE_INT32,
    DTYPE_INT16,
    DTYPE_INT8,
    DTYPE_UINT64,
    DTYPE_UINT32,
    DTYPE_UINT16,
    DTYPE_UINT8,
    DTYPE_FLOAT64,
    DTYPE_FLOAT32,
    DTYPE_BOOL,
    DTYPE_TIME,
    DTYPE_DATE,
    DTYPE_STR,
};

template <typename DATA_T>
struct test_traits
{
    typedef DATA_T t_data;
    typedef typename t_accumulation_type<DATA_T>::type t_accum_type;
    static const perspective::t_dtype dtype;
    static const perspective::t_tscalar null;
    static const perspective::t_tscalar clear;
    static const perspective::t_tscalar zero;
    static const perspective::t_tscalar v1;
    static const perspective::t_tscalar v2;

    static t_tscalar
    acc_s(std::int64_t v)
    {
        t_accum_type v_(v);
        return mktscalar<t_accum_type>(v);
    }
};



template <typename DATA_T>
const perspective::t_dtype test_traits<DATA_T>::dtype = type_to_dtype<DATA_T>();

template <typename DATA_T>
const perspective::t_tscalar test_traits<DATA_T>::null = perspective::mknull(test_traits<DATA_T>::dtype);

template <typename DATA_T>
const perspective::t_tscalar test_traits<DATA_T>::clear = perspective::mkclear(test_traits<DATA_T>::dtype);

template <typename DATA_T>
const perspective::t_tscalar test_traits<DATA_T>::zero
    = perspective::mktscalar<DATA_T>(0);
template <typename DATA_T>
const perspective::t_tscalar test_traits<DATA_T>::v1
    = perspective::mktscalar<DATA_T>(1);
template <typename DATA_T>
const perspective::t_tscalar test_traits<DATA_T>::v2
    = perspective::mktscalar<DATA_T>(2);

// String specializations
template <>
const t_tscalar test_traits<std::string>::zero = mktscalar<const char*>("");
template <>
const t_tscalar test_traits<std::string>::v1 = mktscalar<const char*>("1");
template <>
const t_tscalar test_traits<std::string>::v2 = mktscalar<const char*>("2");

// Date specializations
template <>
const t_tscalar test_traits<t_date>::zero = mktscalar(t_date());
template <>
const t_tscalar test_traits<t_date>::v1 = mktscalar(t_date(2018, 1, 1));
template <>
const t_tscalar test_traits<t_date>::v2 = mktscalar(t_date(2018, 1, 1));

// Time specializations
template <>
const t_tscalar test_traits<t_time>::zero = mktscalar(t_time(0));
template <>
const t_tscalar test_traits<t_time>::v1 = mktscalar(t_time(100000));
template <>
const t_tscalar test_traits<t_time>::v2 = mktscalar(t_time(200000));

typedef test_traits<std::int64_t> tr_i64;
typedef test_traits<std::int32_t> tr_i32;
typedef test_traits<std::int16_t> tr_i16;
typedef test_traits<std::int8_t> tr_i8;
typedef test_traits<std::uint64_t> tr_u64;
typedef test_traits<std::uint32_t> tr_u32;
typedef test_traits<std::uint16_t> tr_u16;
typedef test_traits<std::uint8_t> tr_u8;
typedef test_traits<double> tr_float64;
typedef test_traits<float> tr_float32;

typedef test_traits<t_date> tr_date;
typedef test_traits<t_time> tr_time;
typedef test_traits<std::string> tr_str;
typedef test_traits<bool> tr_bool;

typedef ::testing::Types<tr_i64, tr_i32, tr_i16, tr_i8, tr_float64, tr_float32>
    tl_numeric_types;
}