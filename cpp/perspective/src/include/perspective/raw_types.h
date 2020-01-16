/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
// Cannot include anything else in
// perspective apart from first.h
#include <perspective/first.h>
#include <perspective/exports.h>
#include <cstdint>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <limits>

namespace perspective {

enum t_status : std::uint8_t { STATUS_INVALID, STATUS_VALID, STATUS_CLEAR };

class t_date;
class t_time;

enum t_dtype {
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
    DTYPE_ENUM,
    DTYPE_OID,
    DTYPE_PTR,
    DTYPE_F64PAIR,
    DTYPE_USER_FIXED,
    DTYPE_STR,
    DTYPE_USER_VLEN,
    DTYPE_LAST_VLEN,
    DTYPE_LAST,
    DTYPE_OBJECT
};

template<t_dtype> struct t_dtype_to_type;

template<>
struct t_dtype_to_type<DTYPE_INT64> {
    using type = std::int64_t;
};

template<>
struct t_dtype_to_type<DTYPE_INT32> {
    using type = std::int32_t;
};

template<>
struct t_dtype_to_type<DTYPE_INT16> {
    using type = std::int16_t;
};

template<>
struct t_dtype_to_type<DTYPE_INT8> {
    using type = std::int8_t;
};

template<>
struct t_dtype_to_type<DTYPE_UINT64> {
    using type = std::uint64_t;
};

template<>
struct t_dtype_to_type<DTYPE_UINT32> {
    using type = std::uint32_t;
};

template<>
struct t_dtype_to_type<DTYPE_UINT16> {
    using type = std::uint16_t;
};

template<>
struct t_dtype_to_type<DTYPE_UINT8> {
    using type = std::uint8_t;
};

template<>
struct t_dtype_to_type<DTYPE_FLOAT64> {
    using type = double;
};

template<>
struct t_dtype_to_type<DTYPE_FLOAT32> {
    using type = float;
};

template<>
struct t_dtype_to_type<DTYPE_BOOL> {
    using type = bool;
};

template<>
struct t_dtype_to_type<DTYPE_TIME> {
    using type = std::int64_t;
};

template<>
struct t_dtype_to_type<DTYPE_DATE> {
    using type = t_date;
};

template<>
struct t_dtype_to_type<DTYPE_STR> {
    using type = std::string;
};

#ifdef PSP_ENABLE_WASM
typedef std::uint32_t t_uindex;
typedef std::int32_t t_index;
#else
typedef std::uint64_t t_uindex;
typedef std::int64_t t_index;
#endif

#ifdef WIN32
typedef std::uint32_t t_fflag;
typedef void* t_handle;
#else
typedef std::int32_t t_fflag;
typedef std::int32_t t_handle;
#endif

typedef std::uint32_t t_depth;

struct t_extent_pair {
    t_uindex m_begin;
    t_uindex m_end;
};

struct t_column_static_ctx {
    std::string m_colname;
    t_dtype m_dtype;
};

struct t_column_dynamic_ctx {
    void* m_base;
    std::uint8_t* m_status;
    t_extent_pair* m_extents_base;
    unsigned char* m_vlendata_base;
    void* m_opaque;
};

struct t_table_static_ctx {
    std::vector<t_column_static_ctx> m_columns;

    inline std::vector<std::string>
    get_colnames() const {
        std::vector<std::string> rval;
        for (const auto& c : m_columns) {
            rval.push_back(c.m_colname);
        }
        return rval;
    }
};

template <typename T>
struct t_accumulation_type {
    using type = T;
};

template <>
struct t_accumulation_type<std::int32_t> {
    using type = std::int64_t;
};

template <>
struct t_accumulation_type<std::int16_t> {
    using type = std::int64_t;
};

template <>
struct t_accumulation_type<std::int8_t> {
    using type = std::int64_t;
};

template <>
struct t_accumulation_type<std::uint64_t> {
    using type = std::int64_t;
};
template <>
struct t_accumulation_type<std::uint32_t> {
    using type = std::int64_t;
};
template <>
struct t_accumulation_type<std::uint16_t> {
    using type = std::int64_t;
};
template <>
struct t_accumulation_type<std::uint8_t> {
    using type = std::int64_t;
};

template <>
struct t_accumulation_type<float> {
    using type = double;
};

template <>
struct t_accumulation_type<bool> {
    using type = std::int64_t;
};

} // end namespace perspective
