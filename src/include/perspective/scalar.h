/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/exports.h>
#include <perspective/date.h>
#include <perspective/time.h>
#include <perspective/none.h>
#include <cstring>
#include <cstdio>
#include <functional>
#include <boost/cstdint.hpp>
#include <vector>
#include <boost/unordered_set.hpp>
#include <boost/unordered_map.hpp>
#include <boost/algorithm/string/case_conv.hpp>
#include <sstream>
#include <functional> //std::hash

namespace perspective {

template <template <typename COMPARED_T> class COMPARER_T>
struct PERSPECTIVE_EXPORT t_const_char_comparator {
    inline bool
    operator()(const char* s1, const char* s2) const {
        COMPARER_T<t_index> cmp;
        int cmpval = std::strcmp(s1, s2);
        return cmp(cmpval, 0);
    }
};

const int SCALAR_INPLACE_LEN = 13;

union t_scalar_u {
    t_int64 m_int64;
    t_int32 m_int32;
    t_int16 m_int16;
    t_int8 m_int8;

    t_uint64 m_uint64;
    t_uint32 m_uint32;
    t_uint16 m_uint16;
    t_uint8 m_uint8;

    t_float64 m_float64;
    t_float32 m_float32;

    t_bool m_bool;

    const char* m_charptr;
    char m_inplace_char[SCALAR_INPLACE_LEN];
};

// t_scalar should remain a POD type.
struct PERSPECTIVE_EXPORT t_tscalar {

    template <typename T>
    T get() const;

    void set(t_int64 v);
    void set(t_int32 v);
    void set(t_int16 v);
    void set(t_int8 v);

    void set(t_uint64 v);
    void set(t_uint32 v);
    void set(t_uint16 v);
    void set(t_uint8 v);

    void set(t_bool v);
    void set(t_date v);
    void set(t_time v);
    void set(const char* v);
    void set(t_none v);
    void set(t_float64 v);
    void set(t_float32 v);
    void set(t_tscalar v);

    bool is_nan() const;
    bool is_none() const;
    bool is_str() const;
    bool is_of_type(t_uchar t) const;
    bool is_floating_point() const;
    bool is_signed() const;

    template <template <typename COMPARED_T> class COMPARER_T>
    bool compare_common(const t_tscalar& rhs) const;

    bool operator==(const t_tscalar& rhs) const;
    bool operator!=(const t_tscalar& rhs) const;
    bool operator<(const t_tscalar& rhs) const;
    bool operator>(const t_tscalar& rhs) const;
    bool operator>=(const t_tscalar& rhs) const;
    bool operator<=(const t_tscalar& rhs) const;

    bool is_numeric() const;

    static t_tscalar canonical(t_dtype dtype);

    t_tscalar abs() const;
    t_tscalar negate() const;

    t_tscalar add(const t_tscalar& other) const;
    t_tscalar mul(const t_tscalar& other) const;
    t_tscalar difference(const t_tscalar& other) const;

    t_bool cmp(t_filter_op op, const t_tscalar& other) const;

    t_str repr() const;
    t_str to_string(t_bool for_expr = false) const;
    t_float64 to_double() const;
    t_int64 to_int64() const;
    t_uint64 to_uint64() const;

    bool begins_with(const t_tscalar& other) const;
    bool ends_with(const t_tscalar& other) const;
    bool contains(const t_tscalar& other) const;
    bool is_valid() const;
    operator bool() const;
    void clear();
    t_dtype get_dtype() const;
    const char* get_char_ptr() const;
    t_bool is_inplace() const;
    static t_bool can_store_inplace(const char* s);

    template <typename DATA_T>
    t_tscalar coerce_numeric() const;

    t_tscalar coerce_numeric_dtype(t_dtype dtype) const;

    t_scalar_u m_data;
    t_uchar m_type;
    t_status m_status;
    t_bool m_inplace;
};

typedef std::vector<t_tscalar> t_tscalvec;
typedef boost::unordered_set<t_tscalar> t_tscalset;
typedef boost::unordered_map<t_tscalar, t_tvidx> t_tscaltvimap;

PERSPECTIVE_EXPORT t_tscalar mknone();

template <typename DATA_T>
t_tscalar
t_tscalar::coerce_numeric() const {
    auto v = to_double();
    DATA_T converted(v);
    t_tscalar rv = mknone();
    rv.set(converted);
    return rv;
}

template <>
t_tscalar t_tscalar::coerce_numeric<t_bool>() const;

template <>
t_int64 t_tscalar::get() const;

template <>
t_int32 t_tscalar::get() const;

template <>
t_int16 t_tscalar::get() const;

template <>
t_int8 t_tscalar::get() const;

template <>
t_uint64 t_tscalar::get() const;

template <>
t_uint32 t_tscalar::get() const;

template <>
t_uint16 t_tscalar::get() const;

template <>
t_uint8 t_tscalar::get() const;

template <>
t_date t_tscalar::get() const;

template <>
t_time t_tscalar::get() const;

template <>
const char* t_tscalar::get() const;

template <>
t_none t_tscalar::get() const;

template <>
t_float64 t_tscalar::get() const;

template <>
t_float32 t_tscalar::get() const;

template <>
t_bool t_tscalar::get() const;

template <template <typename COMPARED_T> class COMPARER_T>
bool
t_tscalar::compare_common(const t_tscalar& rhs) const {
    if (m_type != rhs.m_type) {
        COMPARER_T<t_uchar> cmp;
        return cmp(m_type, rhs.m_type);
    }

    if (m_status != rhs.m_status) {
        COMPARER_T<t_uchar> cmp;
        return cmp(m_status, rhs.m_status);
    }

    switch (m_type) {
        case DTYPE_INT64: {
            COMPARER_T<t_int64> cmp;
            return cmp(m_data.m_int64, rhs.m_data.m_int64);
        } break;
        case DTYPE_INT32: {
            COMPARER_T<t_int32> cmp;
            return cmp(m_data.m_int32, rhs.m_data.m_int32);
        } break;
        case DTYPE_INT16: {
            COMPARER_T<t_int16> cmp;
            return cmp(m_data.m_int16, rhs.m_data.m_int16);
        } break;
        case DTYPE_INT8: {
            COMPARER_T<t_int8> cmp;
            return cmp(m_data.m_int8, rhs.m_data.m_int8);
        } break;
        case DTYPE_UINT64: {
            COMPARER_T<t_uint64> cmp;
            return cmp(m_data.m_uint64, rhs.m_data.m_uint64);
        } break;
        case DTYPE_UINT32: {
            COMPARER_T<t_uint32> cmp;
            return cmp(m_data.m_uint32, rhs.m_data.m_uint32);
        } break;
        case DTYPE_UINT16: {
            COMPARER_T<t_uint16> cmp;
            return cmp(m_data.m_uint16, rhs.m_data.m_uint16);
        } break;
        case DTYPE_UINT8: {
            COMPARER_T<t_uint8> cmp;
            return cmp(m_data.m_uint8, rhs.m_data.m_uint8);
        } break;
        case DTYPE_FLOAT64: {
            COMPARER_T<t_float64> cmp;
            return cmp(m_data.m_float64, rhs.m_data.m_float64);
        } break;
        case DTYPE_FLOAT32: {
            COMPARER_T<t_float32> cmp;
            return cmp(m_data.m_float32, rhs.m_data.m_float32);
        } break;
        case DTYPE_DATE: {
            COMPARER_T<t_uint32> cmp;
            return cmp(m_data.m_uint32, rhs.m_data.m_uint32);
        } break;
        case DTYPE_TIME: {
            COMPARER_T<t_int64> cmp;
            return cmp(m_data.m_int64, rhs.m_data.m_int64);
        } break;
        case DTYPE_BOOL: {
            COMPARER_T<t_bool> cmp;
            return cmp(m_data.m_bool, rhs.m_data.m_bool);
        } break;
        case DTYPE_NONE: {
            COMPARER_T<t_none> cmp;
            return cmp(t_none(), t_none());
        } break;
        case DTYPE_STR: {
            t_const_char_comparator<COMPARER_T> cmp;
            return cmp(get_char_ptr(), rhs.get_char_ptr());
        } break;
        default: {
#ifdef PSP_DEBUG
            std::cout << __FILE__ << ":" << __LINE__ << " Reached unknown type " << m_type
                      << std::endl;
#endif
            return false;
        }
    }
}

template <typename T>
struct t_tscal_extractor {
    static bool
    extract(T& output, const t_tscalar& in) {
        if (in.is_none()) {
            return false;
        }
        output = in.get<T>();
        return true;
    }
};

t_str repr(const t_tscalar& s);

size_t hash_value(const t_tscalar& s);

template <typename T>
t_tscalar
mktscalar(const T& v) {
    t_tscalar rval;
    rval.set(v);
    return rval;
}

t_tscalar mktscalar();

} // end namespace perspective

namespace std {

template <>
struct hash<perspective::t_tscalar> {
    // Enable the use of std::unordered_map
    size_t
    operator()(const perspective::t_tscalar& key) const {
        return perspective::hash_value(key);
    }
};

PERSPECTIVE_EXPORT std::ostream& operator<<(std::ostream& os, const perspective::t_tscalar& t);
PERSPECTIVE_EXPORT std::ostream& operator<<(std::ostream& os, const perspective::t_tscalvec& t);
} // namespace std
