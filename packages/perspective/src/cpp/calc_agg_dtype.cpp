/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/calc_agg_dtype.h>

namespace perspective
{
t_dtype
calc_agg_dtype(const t_schema& schema, const t_aggspec& spec)
{
    t_dtype rval;
    const t_depvec& deps = spec.get_dependencies();

    switch (spec.agg())
    {
        case AGGTYPE_DISTINCT_LEAF:
        case AGGTYPE_IDENTITY:
        {
            t_dtype coltype = schema.get_dtype(deps[0].name());
            return coltype;
        }
        break;
        case AGGTYPE_PCT_SUM_PARENT:
        case AGGTYPE_PCT_SUM_GRAND_TOTAL:
        case AGGTYPE_SUM:
        {
            t_dtype coltype = schema.get_dtype(deps[0].name());
            return get_simple_accumulator_type(coltype);
        }
        break;
        case AGGTYPE_MUL:
        {
            t_dtype coltype = schema.get_dtype(deps[0].name());
            return get_simple_accumulator_type(coltype);
        }
        break;
        case AGGTYPE_COUNT:
        {
            return DTYPE_INT64;
        }
        break;
        case AGGTYPE_MEAN:
        {
            return DTYPE_F64PAIR;
        }
        break;
        case AGGTYPE_DISTINCT_COUNT:
        {
            return DTYPE_UINT32;
        }
        break;
        case AGGTYPE_WEIGHTED_MEAN:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_UNIQUE:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_ANY:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_MEDIAN:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_JOIN:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_SCALED_DIV:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_SCALED_ADD:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_SCALED_MUL:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_DOMINANT:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_FIRST:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_LAST:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_PY_AGG:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_AND:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_OR:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_LAST_VALUE:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_HIGH_WATER_MARK:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        case AGGTYPE_LOW_WATER_MARK:
        {
            PSP_COMPLAIN_AND_ABORT("Unimplemented");
        }
        break;
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Unknown agg type");
        }
    }

    return rval;
}

} // end namespace perspective
