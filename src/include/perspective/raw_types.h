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
typedef char t_char;
typedef unsigned char t_uchar;
typedef std::int8_t t_int8;
typedef std::uint8_t t_uint8;
typedef std::int16_t t_int16;
typedef std::uint16_t t_uint16;
typedef std::int32_t t_int32;
typedef std::uint32_t t_uint32;
typedef long long t_int64;
typedef unsigned long long t_uint64;

typedef float t_float32;
typedef double t_float64;
typedef std::string t_str;

typedef bool t_bool;

enum t_status : t_uint8 { STATUS_INVALID, STATUS_VALID, STATUS_CLEAR };

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
    DTYPE_LAST
};

#ifdef PSP_ENABLE_WASM
typedef t_uint32 t_uindex;
typedef t_int32 t_index;
#else
typedef t_uint64 t_uindex;
typedef t_int64 t_index;
#endif

#ifdef WIN32
typedef t_uint32 t_fflag;
typedef void* t_handle;
#else
typedef t_int32 t_fflag;
typedef t_int32 t_handle;
#endif

typedef t_index t_rcode;
typedef t_index t_oid;

typedef std::vector<t_dtype> t_dtypevec;
typedef std::vector<t_str> t_svec;
typedef std::set<t_str> t_sset;
typedef std::map<t_str, t_str> t_ssmap;

// high 32 bits , low 32 bits
typedef std::pair<t_uint32, t_uint32> t_szpair;
typedef std::pair<t_str, t_str> t_sspair;
typedef std::vector<t_sspair> t_sspvec;

typedef std::pair<t_index, t_index> t_idxpair;
typedef std::pair<t_uindex, t_uindex> t_uidxpair;

typedef std::set<t_index> t_idxset;
typedef std::set<t_uindex> t_uidxset;

typedef std::vector<t_idxpair> t_idxpvec;
typedef std::vector<t_uidxpair> t_uidxpvec;

typedef std::vector<t_index> t_idxvec;
typedef std::vector<t_uindex> t_uidxvec;

typedef t_index t_ptidx;
typedef std::vector<t_ptidx> t_ptivec;
typedef std::pair<t_ptidx, t_ptidx> t_ptipair;
typedef std::vector<t_ptipair> t_ptipairvec;

typedef t_index t_tvidx;
typedef std::vector<t_tvidx> t_tvivec;
typedef std::pair<t_tvidx, t_tvidx> t_tvipair;
typedef std::vector<t_tvipair> t_tvipairvec;

typedef std::map<t_str, t_index> t_sidxmap;

typedef std::vector<t_bool> t_boolvec;

typedef t_uint32 t_depth;

typedef std::pair<t_float64, t_float64> t_f64pair;
typedef std::vector<t_f64pair> t_f64pvec;
typedef std::vector<t_float64> t_f64vec;
typedef std::set<std::string> t_sset;
typedef std::map<t_str, t_str> t_ssmap;

typedef std::set<t_ptidx> t_ptiset;

typedef std::map<t_index, t_index> t_iimap;
typedef t_uindex t_stridx;
typedef std::pair<t_stridx, t_stridx> t_stridxpair;

struct t_hdf5_tag {};

struct t_extent_pair {
    t_uindex m_begin;
    t_uindex m_end;
};

struct t_column_static_ctx {
    t_str m_colname;
    t_dtype m_dtype;
};

struct t_column_dynamic_ctx {
    void* m_base;
    t_uint8* m_status;
    t_extent_pair* m_extents_base;
    t_uchar* m_vlendata_base;
    void* m_opaque;
};

typedef std::vector<t_column_static_ctx> t_column_static_ctxvec;
typedef std::vector<t_column_dynamic_ctx> t_column_dynamic_ctxvec;

struct t_table_static_ctx {
    t_column_static_ctxvec m_columns;

    inline t_svec
    get_colnames() const {
        t_svec rval;
        for (const auto& c : m_columns) {
            rval.push_back(c.m_colname);
        }
        return rval;
    }
};

} // end namespace perspective
