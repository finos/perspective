/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/extract_aggregate.h>

namespace perspective {

t_tscalar
extract_aggregate(
    const t_aggspec& aggspec, const t_column* aggcol, t_uindex ridx, t_index pridx) {
    static t_str non_unique("-");

    switch (aggspec.agg()) {
        case AGGTYPE_PCT_SUM_PARENT: {
            t_tscalar cv = aggcol->get_scalar(ridx);

            if (pridx == INVALID_INDEX) {
                return mktscalar<t_float64>(100.0);
            }

            t_tscalar pv = aggcol->get_scalar(pridx);
            return mktscalar<t_float64>(100.0 * (cv.to_double() / pv.to_double()));
        } break;
        case AGGTYPE_PCT_SUM_GRAND_TOTAL: {
            t_tscalar cv = aggcol->get_scalar(ridx);
            t_tscalar pv = aggcol->get_scalar(ROOT_AGGIDX);
            return mktscalar<t_float64>(100.0 * (cv.to_double() / pv.to_double()));
        } break;
        case AGGTYPE_SUM:
        case AGGTYPE_SUM_ABS:
        case AGGTYPE_SUM_NOT_NULL:
        case AGGTYPE_MUL:
        case AGGTYPE_COUNT:
        case AGGTYPE_ANY:
        case AGGTYPE_DOMINANT:
        case AGGTYPE_MEDIAN:
        case AGGTYPE_FIRST:
        case AGGTYPE_LAST:
        case AGGTYPE_AND:
        case AGGTYPE_OR:
        case AGGTYPE_LAST_VALUE:
        case AGGTYPE_HIGH_WATER_MARK:
        case AGGTYPE_LOW_WATER_MARK:
        case AGGTYPE_SCALED_DIV:
        case AGGTYPE_SCALED_ADD:
        case AGGTYPE_SCALED_MUL:
        case AGGTYPE_UDF_COMBINER:
        case AGGTYPE_UDF_REDUCER:
        case AGGTYPE_JOIN:
        case AGGTYPE_IDENTITY:
        case AGGTYPE_DISTINCT_COUNT:
        case AGGTYPE_DISTINCT_LEAF: {
            t_tscalar rval = aggcol->get_scalar(ridx);
            return rval;
        } break;
        case AGGTYPE_UNIQUE: {
            t_tscalar rval = aggcol->get_scalar(ridx);
            if (!rval.is_valid()) {
                t_tscalar rv;
                rv.set(non_unique.c_str());
                return rv;
            }
            return rval;
        } break;
        case AGGTYPE_MEAN_BY_COUNT:
        case AGGTYPE_WEIGHTED_MEAN:
        case AGGTYPE_MEAN: {
            const t_f64pair* pair = aggcol->get_nth<t_f64pair>(ridx);
            t_tscalar rval;
            t_float64 second = pair->second;
            if (second > 0) {
                t_float64 mean = pair->first / second;
                rval.set(mean);
            } else {
                rval.set(t_none());
            }
            return rval;
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Unexpected agg type"); }
    }

    return mknone();
}

} // end namespace perspective
