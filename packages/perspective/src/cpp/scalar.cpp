/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/scalar.h>
#include <perspective/sym_table.h>
#include <cstring>
#include <cstdio>
#include <functional>
#include <boost/cstdint.hpp>
#include <vector>
#include <boost/algorithm/string/case_conv.hpp>
#include <sstream>
#include <cmath>
#include <limits>
SUPPRESS_WARNINGS_VC(4800)

namespace perspective {

bool
t_tscalar::is_none() const {
    return m_type == DTYPE_NONE;
}

bool
t_tscalar::is_str() const {
    return m_type == DTYPE_STR;
}

bool
t_tscalar::is_of_type(t_uchar t) const {
    return m_type == t;
}

bool
t_tscalar::operator==(const t_tscalar& rhs) const {
    if (m_type != rhs.m_type || m_status != rhs.m_status)
        return false;

    if (m_type == DTYPE_BOOL)
        return get<t_bool>() == rhs.get<t_bool>();

    if (m_type != DTYPE_STR)
        return m_data.m_uint64 == rhs.m_data.m_uint64;

    return strcmp(get_char_ptr(), rhs.get_char_ptr()) == 0;
}

bool
t_tscalar::operator!=(const t_tscalar& rhs) const {
    return !operator==(rhs);
}

bool
t_tscalar::operator<(const t_tscalar& rhs) const {
    return compare_common<std::less>(rhs);
}

bool
t_tscalar::operator>(const t_tscalar& rhs) const {
    return compare_common<std::greater>(rhs);
}

bool
t_tscalar::operator>=(const t_tscalar& rhs) const {
    return compare_common<std::greater_equal>(rhs);
}

bool
t_tscalar::operator<=(const t_tscalar& rhs) const {
    return compare_common<std::less_equal>(rhs);
}

bool
t_tscalar::is_numeric() const {
    return is_numeric_type(static_cast<t_dtype>(m_type));
}

void
t_tscalar::clear() {
    m_type = DTYPE_NONE;
    m_data.m_uint64 = 0;
    m_status = STATUS_INVALID;
}

t_tscalar
t_tscalar::canonical(t_dtype dtype) {
    t_tscalar rval;
    rval.clear();
    rval.m_status = STATUS_VALID;

    switch (dtype) {
        case DTYPE_INT64: {
            rval.set(t_int64(0));
        } break;
        case DTYPE_INT32: {
            rval.set(t_int32(0));
        } break;
        case DTYPE_INT16: {
            rval.set(t_int16(0));
        } break;
        case DTYPE_INT8: {
            rval.set(t_int8(0));
        } break;

        case DTYPE_UINT64: {
            rval.set(t_uint64(0));
        } break;
        case DTYPE_UINT32: {
            rval.set(t_uint32(0));
        } break;
        case DTYPE_UINT16: {
            rval.set(t_uint16(0));
        } break;
        case DTYPE_UINT8: {
            rval.set(t_uint8(0));
        } break;

        case DTYPE_FLOAT64: {
            rval.set(t_float64(0));
        } break;
        case DTYPE_FLOAT32: {
            rval.set(t_float32(0));
        } break;
        case DTYPE_DATE: {
            rval.set(t_date(t_uint32(0)));
        } break;
        case DTYPE_TIME: {
            rval.set(t_time(0));
        } break;
        case DTYPE_BOOL: {
            rval.set(t_bool(0));
        } break;
        case DTYPE_NONE: {
            // handled trivially
        } break;
        case DTYPE_STR: {
            rval.m_type = DTYPE_STR;
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Found unknown dtype."); }
    }

    return rval;
}

void
t_tscalar::set(t_int64 v) {
    m_type = DTYPE_INT64;
    m_data.m_int64 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_int32 v) {
    m_type = DTYPE_INT32;
    m_data.m_uint64 = 0;
    m_data.m_int32 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_int16 v) {
    m_type = DTYPE_INT16;
    m_data.m_uint64 = 0;
    m_data.m_int16 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_int8 v) {
    m_type = DTYPE_INT8;
    m_data.m_uint64 = 0;
    m_data.m_int8 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_uint64 v) {
    m_type = DTYPE_UINT64;
    m_data.m_uint64 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_uint32 v) {
    m_type = DTYPE_UINT32;
    m_data.m_uint64 = 0;
    m_data.m_uint32 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_uint16 v) {
    m_type = DTYPE_UINT16;
    m_data.m_uint64 = 0;
    m_data.m_uint16 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_uint8 v) {
    m_type = DTYPE_UINT8;
    m_data.m_uint64 = 0;
    m_data.m_uint8 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_float64 v) {
    m_type = DTYPE_FLOAT64;
    m_data.m_float64 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_float32 v) {
    m_type = DTYPE_FLOAT32;
    m_data.m_uint64 = 0;
    m_data.m_float32 = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(t_bool v) {
    m_type = DTYPE_BOOL;
    m_data.m_uint64 = 0;
    m_data.m_bool = v;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(const char* v) {
    m_type = DTYPE_STR;
    if (can_store_inplace(v)) {
        strncpy(reinterpret_cast<char*>(&m_data), v, SCALAR_INPLACE_LEN);
        m_inplace = true;
    } else {
        m_data.m_charptr = v;
        m_inplace = false;
    }

    m_status = STATUS_VALID;
}

void
t_tscalar::set(const t_date v) {
    m_type = DTYPE_DATE;
    m_data.m_uint64 = 0;
    m_data.m_uint32 = v.raw_value();
    m_status = STATUS_VALID;
}

void
t_tscalar::set(const t_time v) {
    m_type = DTYPE_TIME;
    m_data.m_int64 = v.raw_value();
    m_status = STATUS_VALID;
}

void
t_tscalar::set(const t_none v) {
    m_data.m_uint64 = 0;
    m_type = DTYPE_NONE;
    m_status = STATUS_VALID;
}

void
t_tscalar::set(const t_tscalar v) {
    m_type = v.m_type;
    memcpy(&m_data, &(v.m_data), SCALAR_INPLACE_LEN);
    m_status = v.m_status;
    m_inplace = v.m_inplace;
}

t_tscalar
t_tscalar::abs() const {
    t_tscalar rval;
    rval.clear();
    rval.m_type = m_type;

    if (!is_valid())
        return rval;

    switch (m_type) {
        case DTYPE_INT64: {
            t_int64 v = std::abs(to_double());
            rval.set(v);
        } break;
        case DTYPE_INT32: {
            t_int32 v = std::abs(to_double());
            rval.set(v);
        } break;
        case DTYPE_INT16: {
            t_int16 v = std::abs(to_double());
            rval.set(v);
        } break;
        case DTYPE_INT8: {
            t_int8 v = std::abs(to_double());
            rval.set(v);
        } break;
        case DTYPE_UINT64:
        case DTYPE_UINT32:
        case DTYPE_UINT16:
        case DTYPE_UINT8: {
            return *this;
        } break;

        case DTYPE_FLOAT64: {
            rval.set(std::abs(m_data.m_float64));
        } break;
        case DTYPE_FLOAT32: {
            rval.set(std::abs(m_data.m_float32));
        } break;
        default: {
            // no-op
        }
    }
    return rval;
}

t_tscalar
t_tscalar::negate() const {
    t_tscalar rval;
    rval.clear();
    rval.m_type = m_type;

    if (!is_valid())
        return rval;

    switch (m_type) {
        case DTYPE_INT64: {
            rval.set(-(m_data.m_int64));
        } break;
        case DTYPE_INT32: {
            rval.set(-(m_data.m_int32));
        } break;
        case DTYPE_INT16: {
            rval.set(-(m_data.m_int16));
        } break;
        case DTYPE_INT8: {
            rval.set(-(m_data.m_int8));
        } break;

        case DTYPE_UINT64: {
            rval.set(~m_data.m_uint64);
        } break;
        case DTYPE_UINT32: {
            rval.set(~m_data.m_uint32);
        } break;
        case DTYPE_UINT16: {
            rval.set(~m_data.m_uint16);
        } break;
        case DTYPE_UINT8: {
            rval.set(~m_data.m_uint8);
        } break;

        case DTYPE_FLOAT64: {
            rval.set(-(m_data.m_float64));
        } break;
        case DTYPE_FLOAT32: {
            rval.set(-(m_data.m_float32));
        } break;
        default: {
            // no-op
        }
    }
    return rval;
}

t_tscalar
t_tscalar::add(const t_tscalar& other) const {
    t_tscalar rval;
    rval.clear();
    rval.m_type = m_type;

    if (!other.is_valid())
        return *this;

    if (!is_valid())
        return other;

    if (m_type != other.m_type)
        return rval;

    if (m_type == DTYPE_NONE) {
        rval.set(other);
        return rval;
    }

    if (other.m_type == DTYPE_NONE) {
        return *this;
    }

    switch (m_type) {
        case DTYPE_INT64: {
            rval.set(m_data.m_int64 + other.m_data.m_int64);
        } break;
        case DTYPE_INT32: {
            rval.set(m_data.m_int32 + other.m_data.m_int32);
        } break;
        case DTYPE_INT16: {
            rval.set(m_data.m_int16 + other.m_data.m_int16);
        } break;
        case DTYPE_INT8: {
            rval.set(m_data.m_int8 + other.m_data.m_int8);
        } break;

        case DTYPE_UINT64: {
            rval.set(m_data.m_uint64 + other.m_data.m_uint64);
        } break;
        case DTYPE_UINT32: {
            rval.set(m_data.m_uint32 + other.m_data.m_uint32);
        } break;
        case DTYPE_UINT16: {
            rval.set(m_data.m_uint16 + other.m_data.m_uint16);
        } break;
        case DTYPE_UINT8: {
            rval.set(m_data.m_uint8 + other.m_data.m_uint8);
        } break;

        case DTYPE_FLOAT64: {
            rval.set(m_data.m_float64 + other.m_data.m_float64);
        } break;
        case DTYPE_FLOAT32: {
            rval.set(m_data.m_float32 + other.m_data.m_float32);
        } break;
        default: {
            // no-op
        }
    }
    return rval;
}

t_tscalar
t_tscalar::difference(const t_tscalar& other) const {
    t_tscalar rval;
    rval.clear();
    rval.m_type = m_type;

    if (!other.is_valid())
        return *this;

    if (!is_valid())
        return other.negate();

    if (m_type != other.m_type)
        return rval;

    if (m_type == DTYPE_NONE) {
        rval.set(other.negate());
        return rval;
    }

    if (other.m_type == DTYPE_NONE) {
        return *this;
    }

    switch (m_type) {
        case DTYPE_INT64: {
            rval.set(m_data.m_int64 - other.m_data.m_int64);
        } break;
        case DTYPE_INT32: {
            rval.set(m_data.m_int32 - other.m_data.m_int32);
        } break;
        case DTYPE_INT16: {
            rval.set(m_data.m_int16 - other.m_data.m_int16);
        } break;
        case DTYPE_INT8: {
            rval.set(m_data.m_int8 - other.m_data.m_int8);
        } break;

        case DTYPE_UINT64: {
            rval.set(m_data.m_uint64 - other.m_data.m_uint64);
        } break;
        case DTYPE_UINT32: {
            rval.set(m_data.m_uint32 - other.m_data.m_uint32);
        } break;
        case DTYPE_UINT16: {
            rval.set(m_data.m_uint16 - other.m_data.m_uint16);
        } break;
        case DTYPE_UINT8: {
            rval.set(m_data.m_uint8 - other.m_data.m_uint8);
        } break;

        case DTYPE_FLOAT64: {
            rval.set(m_data.m_float64 - other.m_data.m_float64);
        } break;
        case DTYPE_FLOAT32: {
            rval.set(m_data.m_float32 - other.m_data.m_float32);
        } break;
        default: {
            // no-op
        }
    }
    return rval;
}

t_tscalar
t_tscalar::mul(const t_tscalar& other) const {

    t_bool fp = is_floating_point() || other.is_floating_point();
    t_tscalar rval;

    if (fp) {
        rval.set(to_double() * other.to_double());
        return rval;
    }

    t_bool is_s = is_signed() || other.is_signed();
    if (is_s) {
        rval.set(to_int64() * other.to_int64());
        return rval;
    }

    rval.set(to_uint64() * other.to_uint64());
    return rval;
}

t_str
t_tscalar::repr() const {
    std::stringstream ss;
    ss << "t_tscalar< " << get_dtype_descr(static_cast<t_dtype>(m_type)) << ", " << to_string()
       << " status: " << m_status << " >";
    return ss.str();
}

bool
t_tscalar::is_valid() const {
    return m_status == STATUS_VALID;
}

bool
t_tscalar::is_floating_point() const {
    return (m_type == DTYPE_FLOAT32 || m_type == DTYPE_FLOAT64);
}

bool
t_tscalar::is_signed() const {
    return (m_type == DTYPE_INT64 || m_type == DTYPE_INT32 || m_type == DTYPE_INT16
        || m_type == DTYPE_INT8);
}

t_tscalar::operator bool() const {
    if (m_status != STATUS_VALID)
        return false;

    switch (m_type) {
        case DTYPE_INT64: {
            return bool(get<t_int64>());
        } break;
        case DTYPE_INT32: {
            return bool(get<t_int32>());
        } break;
        case DTYPE_INT16: {
            return bool(get<t_int16>());
        } break;
        case DTYPE_INT8: {
            return bool(get<t_int8>());
        } break;
        case DTYPE_UINT64: {
            return bool(get<t_uint64>());
        } break;
        case DTYPE_UINT32: {
            return bool(get<t_uint32>());
        } break;
        case DTYPE_UINT16: {
            return bool(get<t_uint16>());
        } break;
        case DTYPE_UINT8: {
            return bool(get<t_uint8>());
        } break;
        case DTYPE_FLOAT64: {
            return bool(get<t_float64>());
        } break;
        case DTYPE_FLOAT32: {
            return bool(get<t_float32>());
        } break;
        case DTYPE_DATE: {
            return bool(get<t_uint32>());
        } break;
        case DTYPE_TIME: {
            return bool(get<t_int64>());
        } break;
        case DTYPE_BOOL: {
            return bool(get<t_bool>());
        } break;
        case DTYPE_NONE: {
            return bool(false);
        } break;
        case DTYPE_STR: {
            return m_data.m_charptr != 0;
        } break;
        default: {
#ifdef PSP_DEBUG
            std::cout << __FILE__ << ":" << __LINE__ << " Reached unknown type " << m_type
                      << std::endl;
#endif
        }
    }
    return false;
}

t_str
t_tscalar::to_string(t_bool for_expr) const {
    if (m_status != STATUS_VALID)
        return t_str("null");

    std::stringstream ss;
    switch (m_type) {
        case DTYPE_NONE: {
            return t_str("");
        } break;
        case DTYPE_INT64: {
            ss << get<t_int64>();
            return ss.str();
        } break;
        case DTYPE_INT32: {
            ss << get<t_int32>();
            return ss.str();
        } break;
        case DTYPE_INT16: {
            ss << get<t_int16>();
            return ss.str();
        } break;
        case DTYPE_UINT64: {
            ss << get<t_uint64>();
            return ss.str();
        } break;
        case DTYPE_UINT32: {
            ss << get<t_uint32>();
            return ss.str();
        } break;
        case DTYPE_UINT16: {
            ss << get<t_uint16>();
            return ss.str();
        } break;
        case DTYPE_FLOAT64: {
            ss << get<t_float64>();
            return ss.str();
        } break;
        case DTYPE_FLOAT32: {
            ss << get<t_float32>();
            return ss.str();
        } break;
        case DTYPE_DATE: {
            if (for_expr) {
                auto d = get<t_date>();
                ss << "date(" << d.year() << ", " << d.month() << ", " << d.day() << ")";
            } else {
                ss << get<t_date>();
            }

            return ss.str();
        } break;
        case DTYPE_BOOL: {
            ss << get<t_bool>();
            return ss.str();
        } break;
        case DTYPE_INT8: {
            ss << t_int32(get<t_int8>());
            return ss.str();
        } break;
        case DTYPE_UINT8: {
            ss << t_uint32(get<t_uint8>());
            return ss.str();
        } break;
        case DTYPE_TIME: {
            t_time value = get<t_time>();
            struct tm t;
            bool rcode = value.as_tm(t);
            if (rcode) {
                return value.str(t);
            } else {
                return t_str("Could not return datetime value.");
            }
        } break;
        case DTYPE_STR: {
            if (for_expr) {
                ss << "'";
            }

            if (!m_data.m_charptr) {
                if (for_expr) {
                    ss << "'";
                }

                return ss.str();
            }

            ss << get_char_ptr();
            if (for_expr) {
                ss << "'";
            }

            return ss.str();
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Unrecognized dtype"); }
    }
    return t_str("null");
}

t_float64
t_tscalar::to_double() const {
    switch (m_type) {
        case DTYPE_INT64: {
            return get<t_int64>();
        } break;
        case DTYPE_INT32: {
            return get<t_int32>();
        } break;
        case DTYPE_INT16: {
            return get<t_int16>();
        } break;
        case DTYPE_INT8: {
            return get<t_int8>();
        } break;
        case DTYPE_UINT64: {
            return get<t_uint64>();
        } break;
        case DTYPE_UINT32: {
            return get<t_uint32>();
        } break;
        case DTYPE_UINT16: {
            return get<t_uint16>();
        } break;
        case DTYPE_UINT8: {
            return get<t_uint8>();
        } break;
        case DTYPE_FLOAT64: {
            return get<t_float64>();
        } break;
        case DTYPE_FLOAT32: {
            return get<t_float32>();
        } break;
        case DTYPE_DATE: {
            return get<t_uint32>();
        } break;
        case DTYPE_TIME: {
            return get<t_int64>();
        } break;
        case DTYPE_BOOL: {
            return get<t_bool>();
        } break;
        case DTYPE_NONE:
        default: { return 0; }
    }

    return 0;
}

t_tscalar
t_tscalar::coerce_numeric_dtype(t_dtype dtype) const {
    switch (dtype) {
        case DTYPE_INT64: {
            return coerce_numeric<t_int64>();
        } break;
        case DTYPE_INT32: {
            return coerce_numeric<t_int32>();
        } break;
        case DTYPE_INT16: {
            return coerce_numeric<t_int16>();
        } break;
        case DTYPE_INT8: {
            return coerce_numeric<t_int8>();
        } break;
        case DTYPE_UINT64: {
            return coerce_numeric<t_uint64>();
        } break;
        case DTYPE_UINT32: {
            return coerce_numeric<t_uint32>();
        } break;
        case DTYPE_UINT16: {
            return coerce_numeric<t_uint16>();
        } break;
        case DTYPE_UINT8: {
            return coerce_numeric<t_uint8>();
        } break;
        case DTYPE_FLOAT64: {
            return coerce_numeric<t_float64>();
        } break;
        case DTYPE_FLOAT32: {
            return coerce_numeric<t_float32>();
        } break;
        case DTYPE_BOOL: {
            return coerce_numeric<t_bool>();
        } break;
        default: { return *this; }
    }

    return mknone();
}

t_int64
t_tscalar::to_int64() const {
    switch (m_type) {
        case DTYPE_INT64: {
            return get<t_int64>();
        } break;
        case DTYPE_INT32: {
            return get<t_int32>();
        } break;
        case DTYPE_INT16: {
            return get<t_int16>();
        } break;
        case DTYPE_INT8: {
            return get<t_int8>();
        } break;
        case DTYPE_UINT64: {
            return get<t_uint64>();
        } break;
        case DTYPE_UINT32: {
            return get<t_uint32>();
        } break;
        case DTYPE_UINT16: {
            return get<t_uint16>();
        } break;
        case DTYPE_UINT8: {
            return get<t_uint8>();
        } break;
        case DTYPE_FLOAT64: {
            return get<t_float64>();
        } break;
        case DTYPE_FLOAT32: {
            return get<t_float32>();
        } break;
        case DTYPE_DATE: {
            return get<t_uint32>();
        } break;
        case DTYPE_TIME: {
            return get<t_int64>();
        } break;
        case DTYPE_BOOL: {
            return get<t_bool>();
        } break;
        case DTYPE_NONE:
        default: { return 0; }
    }

    return 0;
}

t_uint64
t_tscalar::to_uint64() const {
    switch (m_type) {
        case DTYPE_INT64: {
            return get<t_int64>();
        } break;
        case DTYPE_INT32: {
            return get<t_int32>();
        } break;
        case DTYPE_INT16: {
            return get<t_int16>();
        } break;
        case DTYPE_INT8: {
            return get<t_int8>();
        } break;
        case DTYPE_UINT64: {
            return get<t_uint64>();
        } break;
        case DTYPE_UINT32: {
            return get<t_uint32>();
        } break;
        case DTYPE_UINT16: {
            return get<t_uint16>();
        } break;
        case DTYPE_UINT8: {
            return get<t_uint8>();
        } break;
        case DTYPE_FLOAT64: {
            return get<t_float64>();
        } break;
        case DTYPE_FLOAT32: {
            return get<t_float32>();
        } break;
        case DTYPE_DATE: {
            return get<t_uint32>();
        } break;
        case DTYPE_TIME: {
            return get<t_int64>();
        } break;
        case DTYPE_BOOL: {
            return get<t_bool>();
        } break;
        case DTYPE_NONE:
        default: { return 0; }
    }

    return 0;
}

bool
t_tscalar::begins_with(const t_tscalar& other) const {
    if (m_status != STATUS_VALID || m_type != DTYPE_STR || other.m_type != DTYPE_STR)
        return false;
    t_str sstr = to_string();
    t_str ostr = other.to_string();
    boost::to_lower(sstr);
    boost::to_lower(ostr);
    return sstr.find(ostr) == 0;
}

bool
t_tscalar::ends_with(const t_tscalar& other) const {
    if (m_status != STATUS_VALID || m_type != DTYPE_STR || other.m_type != DTYPE_STR)
        return false;
    t_str sstr = to_string();
    t_str ostr = other.to_string();
    boost::to_lower(sstr);
    boost::to_lower(ostr);
    size_t idx = sstr.rfind(ostr);
    return (idx != std::string::npos) && (idx + ostr.size() == sstr.size());
}

bool
t_tscalar::contains(const t_tscalar& other) const {
    if (m_status != STATUS_VALID || m_type != DTYPE_STR || other.m_type != DTYPE_STR)
        return false;
    t_str sstr = to_string();
    t_str ostr = other.to_string();
    boost::to_lower(sstr);
    boost::to_lower(ostr);
    size_t idx = sstr.find(ostr);
    return idx != std::string::npos;
}

t_str
repr(const t_tscalar& s) {
    return s.to_string();
}

size_t
hash_value(const t_tscalar& s) {
    std::size_t seed = 0;
    if (s.m_type == DTYPE_STR) {
        const char* c = s.get_char_ptr();
        boost::hash_combine(seed, boost::hash_range(c, c + std::strlen(c)));

    } else {
        boost::hash_combine(seed, s.m_data.m_uint64);
    }

    boost::hash_combine(seed, s.m_type);
    boost::hash_combine(seed, s.m_status);
    return seed;
}

t_tscalar
mktscalar() {
    t_tscalar rval;
    rval.set(t_none());
    return rval;
}

template <>
t_int64
t_tscalar::get() const {
    return m_data.m_int64;
}

template <>
t_int32
t_tscalar::get() const {
    return m_data.m_int32;
}

template <>
t_int16
t_tscalar::get() const {
    return m_data.m_int16;
}

template <>
t_int8
t_tscalar::get() const {
    return m_data.m_int8;
}

template <>
t_uint64
t_tscalar::get() const {
    return m_data.m_uint64;
}

template <>
t_uint32
t_tscalar::get() const {
    return m_data.m_uint32;
}

template <>
t_uint16
t_tscalar::get() const {
    return m_data.m_uint16;
}

template <>
t_uint8
t_tscalar::get() const {
    return m_data.m_uint8;
}

template <>
t_float64
t_tscalar::get() const {
    return m_data.m_float64;
}

template <>
t_float32
t_tscalar::get() const {
    return m_data.m_float32;
}

template <>
t_bool
t_tscalar::get() const {
    return m_data.m_bool;
}

template <>
const char*
t_tscalar::get() const {
    return get_char_ptr();
}

template <>
t_date
t_tscalar::get() const {
    return t_date(m_data.m_uint32);
}

template <>
t_time
t_tscalar::get() const {
    return t_time(m_data.m_int64);
}

template <>
t_none
t_tscalar::get() const {
    return t_none();
}

t_dtype
t_tscalar::get_dtype() const {
    return static_cast<t_dtype>(m_type);
}

t_bool
t_tscalar::cmp(t_filter_op op, const t_tscalar& other) const {
    const t_tscalar& value = *this;

    switch (op) {
        case FILTER_OP_LT: {
            return value < other;
        } break;
        case FILTER_OP_LTEQ: {
            return value < other || other == value;
        } break;
        case FILTER_OP_GT: {
            return value > other;
        } break;
        case FILTER_OP_GTEQ: {
            return value > other || other == value;
        } break;
        case FILTER_OP_EQ: {
            return other == value;
        } break;
        case FILTER_OP_NE: {
            return other != value;
        } break;
        case FILTER_OP_BEGINS_WITH: {
            return value.begins_with(other);
        } break;
        case FILTER_OP_ENDS_WITH: {
            return value.ends_with(other);
        } break;
        case FILTER_OP_CONTAINS: {
            return value.contains(other);
        } break;
        case FILTER_OP_IS_NAN: {
            return std::isnan(to_double());
        } break;
        case FILTER_OP_IS_NOT_NAN: {
            return !std::isnan(to_double());
        } break;
        case FILTER_OP_IS_VALID: {
            return m_status == STATUS_VALID;
        } break;
        case FILTER_OP_IS_NOT_VALID: {
            return m_status != STATUS_VALID;
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Invalid filter op"); } break;
    }

    return false;
}

const char*
t_tscalar::get_char_ptr() const {
    if (is_inplace())
        return m_data.m_inplace_char;
    return m_data.m_charptr;
}

t_bool
t_tscalar::is_inplace() const {
    return m_inplace;
}

t_bool
t_tscalar::can_store_inplace(const char* s) {
    return strlen(s) + 1 <= static_cast<size_t>(SCALAR_INPLACE_LEN);
}

t_bool
t_tscalar::is_nan() const {
    if (m_type == DTYPE_FLOAT64)
        return std::isnan(get<t_float64>());
    if (m_type == DTYPE_FLOAT32)
        return std::isnan(get<t_float32>());
    return false;
}

t_tscalar
mknone() {
    t_tscalar rval;
    rval.set(t_none());
    return rval;
}

template <>
t_tscalar
t_tscalar::coerce_numeric<t_bool>() const {
    t_tscalar rv;

    if (m_type == DTYPE_STR) {
        auto v = get<const char*>();
        t_str s1("True");
        t_str s2("true");
        t_str s3("TRUE");

        if (strcmp(v, s1.c_str()) == 0 || strcmp(v, s2.c_str()) == 0
            || strcmp(v, s3.c_str()) == 0) {
            rv.set(true);
            return rv;
        }
        rv.set(false);
        return rv;
    }
    t_bool v = static_cast<t_bool>(m_data.m_uint64);
    rv.set(v);
    return rv;
}

} // end namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& os, const perspective::t_tscalar& t) {
    os << repr(t);
    return os;
}

std::ostream&
operator<<(std::ostream& os, const perspective::t_tscalvec& t) {
    for (const auto& s : t) {
        os << s << ", ";
    }
    return os;
}

} // end namespace std
