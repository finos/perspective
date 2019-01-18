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
#include <cstdint>
#include <limits>

namespace perspective {

void
psp_abort() {
    std::raise(SIGINT);
}

bool
is_numeric_type(t_dtype dtype) {
    switch (dtype) {
        case DTYPE_UINT8:
        case DTYPE_UINT16:
        case DTYPE_UINT32:
        case DTYPE_UINT64:
        case DTYPE_INT8:
        case DTYPE_INT16:
        case DTYPE_INT32:
        case DTYPE_INT64:
        case DTYPE_FLOAT32:
        case DTYPE_FLOAT64: {
            return true;
        } break;
        default: { return false; }
    }
}

bool
is_linear_order_type(t_dtype dtype) {
    switch (dtype) {
        case DTYPE_UINT8:
        case DTYPE_UINT16:
        case DTYPE_UINT32:
        case DTYPE_UINT64:
        case DTYPE_INT8:
        case DTYPE_INT16:
        case DTYPE_INT32:
        case DTYPE_INT64:
        case DTYPE_FLOAT32:
        case DTYPE_FLOAT64:
        case DTYPE_DATE:
        case DTYPE_TIME:
        case DTYPE_BOOL: {
            return true;
        } break;
        default: { return false; }
    }
}

bool
is_floating_point(t_dtype dtype) {
    return (dtype == DTYPE_FLOAT32 || dtype == DTYPE_FLOAT64);
}

bool
is_deterministic_sized(t_dtype dtype) {
    switch (dtype) {
        case DTYPE_PTR:
        case DTYPE_INT64:
        case DTYPE_UINT64:
        case DTYPE_INT32:
        case DTYPE_UINT32:
        case DTYPE_INT16:
        case DTYPE_UINT16:
        case DTYPE_BOOL:
        case DTYPE_INT8:
        case DTYPE_UINT8:
        case DTYPE_FLOAT64:
        case DTYPE_FLOAT32:
        case DTYPE_STR:
        case DTYPE_TIME:
        case DTYPE_DATE:
        case DTYPE_F64PAIR: {
            return true;
        }
        default: { return false; }
    }

    PSP_COMPLAIN_AND_ABORT("Reached unreachable");
    return false;
}

t_uindex
get_dtype_size(t_dtype dtype) {
    switch (dtype) {
        case DTYPE_PTR: {
            return sizeof(void*);
        }
        case DTYPE_INT64:
        case DTYPE_UINT64: {
            return sizeof(std::int64_t);
        }
        case DTYPE_INT32:
        case DTYPE_UINT32: {
            return sizeof(std::int32_t);
        }
        case DTYPE_INT16:
        case DTYPE_UINT16: {
            return 2;
        }
        case DTYPE_BOOL:
        case DTYPE_INT8:
        case DTYPE_UINT8:
        case DTYPE_NONE: {
            return 1;
        }
        case DTYPE_FLOAT64: {
            return sizeof(double);
        }
        case DTYPE_FLOAT32: {
            return sizeof(float);
        }
        case DTYPE_STR: {
            return sizeof(t_uindex);
        }
        case DTYPE_TIME: {
            return sizeof(std::int64_t);
        }
        case DTYPE_DATE: {
            return sizeof(std::uint32_t);
        }
        case DTYPE_F64PAIR: {
            return sizeof(std::pair<double, double>);
        }
        default: { PSP_COMPLAIN_AND_ABORT("Unknown dtype"); }
    }

    PSP_COMPLAIN_AND_ABORT("Reached unreachable");
    return sizeof(DTYPE_INT64);
}

bool
is_vlen_dtype(t_dtype dtype) {
    if (dtype == DTYPE_STR || dtype == DTYPE_USER_VLEN)
        return true;
    return false;
}

std::string
get_dtype_descr(t_dtype dtype) {
    switch (dtype) {
        case DTYPE_NONE: {
            return "none";
        } break;
        case DTYPE_INT64: {
            return "i64";
        } break;
        case DTYPE_INT32: {
            return "i32";
        } break;
        case DTYPE_INT16: {
            return "i16";
        } break;
        case DTYPE_INT8: {
            return "i8";
        } break;
        case DTYPE_UINT64: {
            return "u64";
        } break;
        case DTYPE_UINT32: {
            return "u32";
        } break;
        case DTYPE_UINT16: {
            return "u16";
        } break;
        case DTYPE_UINT8: {
            return "u8";
        } break;
        case DTYPE_BOOL: {
            return "bool";
        } break;
        case DTYPE_FLOAT64: {
            return "f64";
        } break;
        case DTYPE_FLOAT32: {
            return "f32";
        } break;
        case DTYPE_STR: {
            return "str";
        } break;
        case DTYPE_TIME: {
            return "time";
        } break;
        case DTYPE_DATE: {
            return "date";
        } break;
        case DTYPE_ENUM: {
            return "e";
        } break;
        case DTYPE_OID: {
            return "oid";
        } break;
        case DTYPE_USER_FIXED: {
            return "ufix";
        } break;
        case DTYPE_LAST: {
            return "last";
        } break;
        case DTYPE_USER_VLEN: {
            return "uvlen";
        } break;
        case DTYPE_F64PAIR: {
            return "f64pair";
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Encountered unknown dtype"); }
    }
    return std::string("dummy");
}

std::string
filter_op_to_str(t_filter_op op) {
    switch (op) {
        case FILTER_OP_LT: {
            return "<";
        } break;
        case FILTER_OP_LTEQ: {
            return "<=";
        } break;
        case FILTER_OP_GT: {
            return ">";
        } break;
        case FILTER_OP_GTEQ: {
            return ">=";
        } break;
        case FILTER_OP_EQ: {
            return "==";
        } break;
        case FILTER_OP_NE: {
            return "!=";
        } break;
        case FILTER_OP_BEGINS_WITH: {
            return "startswith";
        } break;
        case FILTER_OP_ENDS_WITH: {
            return "endswith";
        } break;
        case FILTER_OP_CONTAINS: {
            return "in";
        } break;
        case FILTER_OP_OR: {
            return "or";
        } break;
        case FILTER_OP_IN: {
            return "in";
        } break;
        case FILTER_OP_NOT_IN: {
            return "not in";
        } break;
        case FILTER_OP_AND: {
            return "and";
        } break;
        case FILTER_OP_IS_NAN: {
            return "is_nan";
        } break;
        case FILTER_OP_IS_NOT_NAN: {
            return "!is_nan";
        } break;
        case FILTER_OP_IS_VALID: {
            return "is not None";
        } break;
        case FILTER_OP_IS_NOT_VALID: {
            return "is None";
        } break;
    }
    PSP_COMPLAIN_AND_ABORT("Reached end of function");
    return "";
}

std::string
get_status_descr(t_status status) {
    switch (status) {
        case STATUS_INVALID: {
            return "i";
        }
        case STATUS_VALID: {
            return "v";
        }
        case STATUS_CLEAR: {
            return "c";
        }
        default: { PSP_COMPLAIN_AND_ABORT("Unexpected status found"); }
    }
    return "";
}

void
check_init(bool init, const char* file, std::int32_t line) {
    PSP_VERBOSE_ASSERT(init, "touching uninited object");
}

bool
is_neq_transition(t_value_transition t) {
    return t > VALUE_TRANSITION_EQ_TT;
}

t_uindex
root_pidx() {
    return std::numeric_limits<t_uindex>::max();
}

bool
is_internal_colname(const std::string& c) {
    return c.compare(std::string("psp_")) == 0;
}

template <>
t_dtype
type_to_dtype<std::int64_t>() {
    return DTYPE_INT64;
}

template <>
t_dtype
type_to_dtype<std::int32_t>() {
    return DTYPE_INT32;
}

template <>
t_dtype
type_to_dtype<std::int16_t>() {
    return DTYPE_INT16;
}

template <>
t_dtype
type_to_dtype<std::int8_t>() {
    return DTYPE_INT8;
}

template <>
t_dtype
type_to_dtype<std::uint64_t>() {
    return DTYPE_UINT64;
}

template <>
t_dtype
type_to_dtype<std::uint32_t>() {
    return DTYPE_UINT32;
}

template <>
t_dtype
type_to_dtype<std::uint16_t>() {
    return DTYPE_UINT16;
}

template <>
t_dtype
type_to_dtype<std::uint8_t>() {
    return DTYPE_UINT8;
}

template <>
t_dtype
type_to_dtype<double>() {
    return DTYPE_FLOAT64;
}

template <>
t_dtype
type_to_dtype<float>() {
    return DTYPE_FLOAT32;
}

template <>
t_dtype
type_to_dtype<bool>() {
    return DTYPE_BOOL;
}

template <>
t_dtype
type_to_dtype<t_time>() {
    return DTYPE_TIME;
}

template <>
t_dtype
type_to_dtype<t_date>() {
    return DTYPE_DATE;
}

template <>
t_dtype
type_to_dtype<std::string>() {
    return DTYPE_STR;
}

} // end namespace perspective

namespace std {

void
string_to_lower(string& str) {
    transform(str.begin(), str.end(), str.begin(), ::tolower);
}

} // namespace std
