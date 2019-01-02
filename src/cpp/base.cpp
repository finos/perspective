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
            return "DTYPE_NONE";
        } break;
        case DTYPE_INT64: {
            return "DTYPE_INT64";
        } break;
        case DTYPE_INT32: {
            return "DTYPE_INT32";
        } break;
        case DTYPE_INT16: {
            return "DTYPE_INT16";
        } break;
        case DTYPE_INT8: {
            return "DTYPE_INT8";
        } break;
        case DTYPE_UINT64: {
            return "DTYPE_UINT64";
        } break;
        case DTYPE_UINT32: {
            return "DTYPE_UINT32";
        } break;
        case DTYPE_UINT16: {
            return "DTYPE_UINT16";
        } break;
        case DTYPE_UINT8: {
            return "DTYPE_UINT8";
        } break;
        case DTYPE_BOOL: {
            return "DTYPE_BOOL";
        } break;
        case DTYPE_FLOAT64: {
            return "DTYPE_FLOAT64";
        } break;
        case DTYPE_FLOAT32: {
            return "DTYPE_FLOAT32";
        } break;
        case DTYPE_STR: {
            return "DTYPE_STR";
        } break;
        case DTYPE_TIME: {
            return "DTYPE_TIME";
        } break;
        case DTYPE_DATE: {
            return "DTYPE_DATE";
        } break;
        case DTYPE_ENUM: {
            return "DTYPE_ENUM";
        } break;
        case DTYPE_OID: {
            return "DTYPE_OID";
        } break;
        case DTYPE_USER_FIXED: {
            return "DTYPE_USER_FIXED";
        } break;
        case DTYPE_USER_VLEN: {
            return "DTYPE_USER_VLEN";
        } break;
        case DTYPE_LAST: {
            return "DTYPE_LAST";
        } break;
        case DTYPE_F64PAIR: {
            return "DTYPE_F64PAIR";
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

} // end namespace perspective
