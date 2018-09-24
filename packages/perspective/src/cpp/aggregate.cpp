/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/aggregate.h>

namespace perspective {

t_aggregate::t_aggregate(
    const t_dtree& tree, t_aggtype aggtype, t_colcsptrvec icolumns, t_col_sptr ocolumn)
    : m_tree(tree)
    , m_aggtype(aggtype)
    , m_icolumns(icolumns)
    , m_ocolumn(ocolumn) {}

void
t_aggregate::init() {
    switch (m_aggtype) {
        case AGGTYPE_SUM:
        case AGGTYPE_PCT_SUM_PARENT:
        case AGGTYPE_PCT_SUM_GRAND_TOTAL: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_sum<t_int64, t_int64, t_int64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_sum<t_int32, t_int64, t_int64>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_sum<t_int16, t_int64, t_int64>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_sum<t_int8, t_int64, t_int64>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_sum<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_sum<t_uint32, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_sum<t_uint16, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_sum<t_uint8, t_uint64, t_uint64>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_sum<t_float64, t_float64, t_float64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_sum<t_float32, t_float64, t_float64>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_sum<t_uint8, t_uint64, t_uint64>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        case AGGTYPE_MUL: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_mul<t_int64, t_int64, t_int64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_mul<t_int32, t_int64, t_int64>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_mul<t_int16, t_int64, t_int64>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_mul<t_int8, t_int64, t_int64>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_mul<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_mul<t_uint32, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_mul<t_uint16, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_mul<t_uint8, t_uint64, t_uint64>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_mul<t_float64, t_float64, t_float64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_mul<t_float32, t_float64, t_float64>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_mul<t_uint8, t_uint64, t_uint64>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        case AGGTYPE_COUNT: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_STR: {
                    build_aggregate<t_aggimpl_count<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_TIME:
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_count<t_int64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_count<t_int32, t_uint64, t_uint64>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_count<t_int16, t_uint64, t_uint64>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_count<t_int8, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_count<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_DATE:
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_count<t_uint32, t_uint32, t_uint32>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_count<t_uint16, t_uint64, t_uint64>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_count<t_uint8, t_uint64, t_uint64>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_count<t_float64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_count<t_float32, t_uint64, t_uint64>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_count<t_uint8, t_uint64, t_uint64>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        case AGGTYPE_MEAN: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_mean<t_int64, t_f64pair, t_float64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_mean<t_int32, t_f64pair, t_float64>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_mean<t_int16, t_f64pair, t_float64>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_mean<t_int8, t_f64pair, t_float64>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_mean<t_uint64, t_f64pair, t_float64>>();
                } break;
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_mean<t_uint32, t_f64pair, t_float64>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_mean<t_uint16, t_f64pair, t_float64>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_mean<t_uint8, t_f64pair, t_float64>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_mean<t_float64, t_f64pair, t_float64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_mean<t_float32, t_f64pair, t_float64>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_mean<t_uint8, t_f64pair, t_float64>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        case AGGTYPE_LAST_VALUE: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_TIME:
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_last_value<t_int64, t_int64, t_int64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_last_value<t_int32, t_int32, t_int32>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_last_value<t_int16, t_int16, t_int16>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_last_value<t_int8, t_int8, t_int8>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_last_value<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_DATE:
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_last_value<t_uint32, t_uint32, t_uint32>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_last_value<t_uint16, t_uint16, t_uint16>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_last_value<t_uint8, t_uint8, t_uint8>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_last_value<t_float64, t_float64, t_float64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_last_value<t_float32, t_float32, t_float32>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_last_value<t_uint8, t_uint8, t_uint8>>();
                } break;
                case DTYPE_STR: {
                    build_aggregate<
                        t_aggimpl_last_value<const char*, const char*, const char*>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        case AGGTYPE_HIGH_WATER_MARK: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_TIME:
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_hwm<t_int64, t_int64, t_int64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_hwm<t_int32, t_int32, t_int32>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_hwm<t_int16, t_int16, t_int16>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_hwm<t_int8, t_int8, t_int8>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_hwm<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_DATE:
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_hwm<t_uint32, t_uint32, t_uint32>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_hwm<t_uint16, t_uint16, t_uint16>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_hwm<t_uint8, t_uint8, t_uint8>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_hwm<t_float64, t_float64, t_float64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_hwm<t_float32, t_float32, t_float32>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_hwm<t_uint8, t_uint8, t_uint8>>();
                } break;
                case DTYPE_STR: {
                    build_aggregate<t_aggimpl_hwm<const char*, const char*, const char*>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        case AGGTYPE_LOW_WATER_MARK: {
            switch (m_icolumns[0]->get_dtype()) {
                case DTYPE_TIME:
                case DTYPE_INT64: {
                    build_aggregate<t_aggimpl_lwm<t_int64, t_int64, t_int64>>();
                } break;
                case DTYPE_INT32: {
                    build_aggregate<t_aggimpl_lwm<t_int32, t_int32, t_int32>>();
                } break;
                case DTYPE_INT16: {
                    build_aggregate<t_aggimpl_lwm<t_int16, t_int16, t_int16>>();
                } break;
                case DTYPE_INT8: {
                    build_aggregate<t_aggimpl_lwm<t_int8, t_int8, t_int8>>();
                } break;
                case DTYPE_UINT64: {
                    build_aggregate<t_aggimpl_lwm<t_uint64, t_uint64, t_uint64>>();
                } break;
                case DTYPE_DATE:
                case DTYPE_UINT32: {
                    build_aggregate<t_aggimpl_lwm<t_uint32, t_uint32, t_uint32>>();
                } break;
                case DTYPE_UINT16: {
                    build_aggregate<t_aggimpl_lwm<t_uint16, t_uint16, t_uint16>>();
                } break;
                case DTYPE_UINT8: {
                    build_aggregate<t_aggimpl_lwm<t_uint8, t_uint8, t_uint8>>();
                } break;
                case DTYPE_FLOAT64: {
                    build_aggregate<t_aggimpl_lwm<t_float64, t_float64, t_float64>>();
                } break;
                case DTYPE_FLOAT32: {
                    build_aggregate<t_aggimpl_lwm<t_float32, t_float32, t_float32>>();
                } break;
                case DTYPE_BOOL: {
                    build_aggregate<t_aggimpl_lwm<t_uint8, t_uint8, t_uint8>>();
                } break;
                case DTYPE_STR: {
                    build_aggregate<t_aggimpl_lwm<const char*, const char*, const char*>>();
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected dtype"); }
            }
        } break;
        default: {
            // Other aggregates will be filled in later
        }
    }
}
} // end namespace perspective
