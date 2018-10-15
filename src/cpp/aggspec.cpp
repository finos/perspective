/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/aggspec.h>
#include <perspective/base.h>
#include <sstream>

namespace perspective {

t_col_name_type::t_col_name_type()
    : m_type(DTYPE_NONE) {}

t_col_name_type::t_col_name_type(const t_str& name, t_dtype type)
    : m_name(name)
    , m_type(type) {}

t_aggspec::t_aggspec()
    : m_kernel(0) {}

t_aggspec::t_aggspec(const t_aggspec_recipe& v)
    : m_kernel(0) {
    m_name = v.m_name;
    m_disp_name = v.m_name;
    m_agg = v.m_agg;

    for (const auto& d : v.m_dependencies) {
        m_dependencies.push_back(d);
    }

    for (const auto& d : v.m_odependencies) {
        m_odependencies.push_back(d);
    }

    m_sort_type = v.m_sort_type;
    m_agg_one_idx = v.m_agg_one_idx;
    m_agg_two_idx = v.m_agg_two_idx;
    m_agg_one_weight = v.m_agg_one_weight;
    m_agg_two_weight = v.m_agg_two_weight;
    m_invmode = v.m_invmode;
}

t_aggspec::t_aggspec(const t_str& name, t_aggtype agg, const t_depvec& dependencies)
    : m_name(name)
    , m_disp_name(name)
    , m_agg(agg)
    , m_dependencies(dependencies)
    , m_kernel(0) {}

t_aggspec::t_aggspec(const t_str& aggname, t_aggtype agg, const t_str& dep)
    : m_name(aggname)
    , m_disp_name(aggname)
    , m_agg(agg)
    , m_dependencies(t_depvec{t_dep(dep, DEPTYPE_COLUMN)})
    , m_kernel(0) {}

t_aggspec::t_aggspec(
    const t_str& name, const t_str& disp_name, t_aggtype agg, const t_depvec& dependencies)
    : m_name(name)
    , m_disp_name(disp_name)
    , m_agg(agg)
    , m_dependencies(dependencies)
    , m_kernel(0) {}

t_aggspec::t_aggspec(const t_str& name, const t_str& disp_name, t_aggtype agg,
    const t_depvec& dependencies, t_sorttype sort_type)
    : m_name(name)
    , m_disp_name(disp_name)
    , m_agg(agg)
    , m_dependencies(dependencies)
    , m_sort_type(sort_type)
    , m_kernel(0) {}

t_aggspec::t_aggspec(const t_str& aggname, const t_str& disp_aggname, t_aggtype agg,
    t_uindex agg_one_idx, t_uindex agg_two_idx, t_float64 agg_one_weight,
    t_float64 agg_two_weight)
    : m_name(aggname)
    , m_disp_name(disp_aggname)
    , m_agg(agg)
    , m_agg_one_idx(agg_one_idx)
    , m_agg_two_idx(agg_two_idx)
    , m_agg_one_weight(agg_one_weight)
    , m_agg_two_weight(agg_two_weight)
    , m_kernel(0)

{}

t_aggspec::~t_aggspec() {}

t_str
t_aggspec::name() const {
    return m_name;
}

t_str
t_aggspec::disp_name() const {
    return m_disp_name;
}

t_aggtype
t_aggspec::agg() const {
    return m_agg;
}

t_str
t_aggspec::agg_str() const {
    switch (m_agg) {
        case AGGTYPE_SUM: {
            return "sum";
        } break;
        case AGGTYPE_SUM_ABS: {
            return "sum_abs";
        } break;
        case AGGTYPE_MUL: {
            return "mul";
        } break;
        case AGGTYPE_COUNT: {
            return "count";
        } break;
        case AGGTYPE_MEAN: {
            return "mean";
        } break;
        case AGGTYPE_WEIGHTED_MEAN: {
            return "weighted_mean";
        } break;
        case AGGTYPE_UNIQUE: {
            return "unique";
        } break;
        case AGGTYPE_ANY: {
            return "any";
        } break;
        case AGGTYPE_MEDIAN: {
            return "median";
        } break;
        case AGGTYPE_JOIN: {
            return "join";
        } break;
        case AGGTYPE_SCALED_DIV: {
            return "scaled_div";
        } break;
        case AGGTYPE_SCALED_ADD: {
            return "scaled_add";
        } break;
        case AGGTYPE_SCALED_MUL: {
            return "scaled_mul";
        } break;
        case AGGTYPE_DOMINANT: {
            return "dominant";
        } break;
        case AGGTYPE_FIRST: {
            return "first";
        } break;
        case AGGTYPE_LAST: {
            return "last";
        } break;
        case AGGTYPE_PY_AGG: {
            return "py_agg";
        } break;
        case AGGTYPE_AND: {
            return "and";
        } break;
        case AGGTYPE_OR: {
            return "or";
        } break;
        case AGGTYPE_LAST_VALUE: {
            return "last_value";
        }
        case AGGTYPE_HIGH_WATER_MARK: {
            return "high_water_mark";
        }
        case AGGTYPE_LOW_WATER_MARK: {
            return "low_water_mark";
        }
        case AGGTYPE_UDF_COMBINER: {
            std::stringstream ss;
            ss << "udf_combiner_" << disp_name();
            return ss.str();
        }
        case AGGTYPE_UDF_REDUCER: {

            std::stringstream ss;
            ss << "udf_reducer_" << disp_name();
            return ss.str();
        }
        case AGGTYPE_SUM_NOT_NULL: {
            return "sum_not_null";
        }
        case AGGTYPE_MEAN_BY_COUNT: {
            return "mean_by_count";
        }
        case AGGTYPE_IDENTITY: {
            return "identity";
        }
        case AGGTYPE_DISTINCT_COUNT: {
            return "distinct_count";
        }
        case AGGTYPE_DISTINCT_LEAF: {
            return "distinct_leaf";
        }
        case AGGTYPE_PCT_SUM_PARENT: {
            return "pct_sum_parent";
        }
        case AGGTYPE_PCT_SUM_GRAND_TOTAL: {
            return "pct_sum_grand_total";
        }
        default: {
            PSP_COMPLAIN_AND_ABORT("Unknown agg type");
            return "unknown";
        } break;
    }
}

const t_depvec&
t_aggspec::get_dependencies() const {
    return m_dependencies;
}

t_dtype
get_simple_accumulator_type(t_dtype coltype) {
    switch (coltype) {
        case DTYPE_BOOL:
        case DTYPE_INT64:
        case DTYPE_INT32:
        case DTYPE_INT16:
        case DTYPE_INT8: {
            return DTYPE_INT64;
        } break;
        case DTYPE_UINT64:
        case DTYPE_UINT32:
        case DTYPE_UINT16:
        case DTYPE_UINT8: {
            return DTYPE_UINT64;
        }
        case DTYPE_FLOAT64:
        case DTYPE_FLOAT32: {
            return DTYPE_FLOAT64;
        }

        default: { PSP_COMPLAIN_AND_ABORT("Unexpected coltype"); }
    }
    return DTYPE_NONE;
}

t_sorttype
t_aggspec::get_sort_type() const {
    return m_sort_type;
}

t_uindex
t_aggspec::get_agg_one_idx() const {
    return m_agg_one_idx;
}

t_uindex
t_aggspec::get_agg_two_idx() const {
    return m_agg_two_idx;
}

t_float64
t_aggspec::get_agg_one_weight() const {
    return m_agg_one_weight;
}

t_float64
t_aggspec::get_agg_two_weight() const {
    return m_agg_two_weight;
}

t_invmode
t_aggspec::get_inv_mode() const {
    return m_invmode;
}

t_svec
t_aggspec::get_input_depnames() const {
    t_svec rval;
    for (const auto d : m_dependencies) {
        rval.push_back(d.name());
    }
    return rval;
}

t_svec
t_aggspec::get_output_depnames() const {
    t_svec rval;
    for (const auto d : m_dependencies) {
        rval.push_back(d.name());
    }
    return rval;
}

t_col_name_type_vec
t_aggspec::get_output_specs(const t_schema& schema) const {
    switch (agg()) {
        case AGGTYPE_SUM:
        case AGGTYPE_SUM_ABS:
        case AGGTYPE_PCT_SUM_PARENT:
        case AGGTYPE_PCT_SUM_GRAND_TOTAL:
        case AGGTYPE_MUL:
        case AGGTYPE_SUM_NOT_NULL: {
            t_dtype coltype = schema.get_dtype(m_dependencies[0].name());
            return mk_col_name_type_vec(name(), get_simple_accumulator_type(coltype));
        }
        case AGGTYPE_ANY:
        case AGGTYPE_UNIQUE:
        case AGGTYPE_DOMINANT:
        case AGGTYPE_MEDIAN:
        case AGGTYPE_FIRST:
        case AGGTYPE_LAST:
        case AGGTYPE_OR:
        case AGGTYPE_LAST_VALUE:
        case AGGTYPE_HIGH_WATER_MARK:
        case AGGTYPE_LOW_WATER_MARK:
        case AGGTYPE_IDENTITY:
        case AGGTYPE_DISTINCT_LEAF: {
            t_dtype coltype = schema.get_dtype(m_dependencies[0].name());
            t_col_name_type_vec rval(1);
            rval[0].m_name = name();
            rval[0].m_type = coltype;
            return rval;
        }
        case AGGTYPE_COUNT: {
            return mk_col_name_type_vec(name(), DTYPE_INT64);
        }
        case AGGTYPE_MEAN_BY_COUNT:
        case AGGTYPE_MEAN: {
            return mk_col_name_type_vec(name(), DTYPE_F64PAIR);
        }
        case AGGTYPE_WEIGHTED_MEAN: {

            return mk_col_name_type_vec(name(), DTYPE_F64PAIR);
        }
        case AGGTYPE_JOIN: {
            return mk_col_name_type_vec(name(), DTYPE_STR);
        }
        case AGGTYPE_SCALED_DIV:
        case AGGTYPE_SCALED_ADD:
        case AGGTYPE_SCALED_MUL: {
            return mk_col_name_type_vec(name(), DTYPE_FLOAT64);
        }
        case AGGTYPE_UDF_COMBINER:
        case AGGTYPE_UDF_REDUCER: {
            t_col_name_type_vec rval;
            for (const auto& d : m_odependencies) {
                t_col_name_type tp(d.name(), d.dtype());
                rval.push_back(tp);
            }
            return rval;
        }
        case AGGTYPE_AND: {
            return mk_col_name_type_vec(name(), DTYPE_BOOL);
        }
        case AGGTYPE_DISTINCT_COUNT: {
            return mk_col_name_type_vec(name(), DTYPE_UINT32);
        }
        default: { PSP_COMPLAIN_AND_ABORT("Unknown agg type"); }
    }

    return t_col_name_type_vec();
}

t_col_name_type_vec
t_aggspec::mk_col_name_type_vec(const t_str& name, t_dtype dtype) const {
    t_col_name_type_vec rval(1);
    rval[0].m_name = name;
    rval[0].m_type = dtype;
    return rval;
}

t_bool
t_aggspec::is_combiner_agg() const {
    return m_agg == AGGTYPE_UDF_COMBINER;
}

t_bool
t_aggspec::is_reducer_agg() const {
    return m_agg == AGGTYPE_UDF_REDUCER;
}

t_bool
t_aggspec::is_non_delta() const {
    switch (m_agg) {
        case AGGTYPE_LAST_VALUE:
        case AGGTYPE_LOW_WATER_MARK:
        case AGGTYPE_HIGH_WATER_MARK: {
            return true;
        }
        default:
            return false;
    }
    return false;
}

t_str
t_aggspec::get_first_depname() const {
    if (m_dependencies.empty())
        return "";

    return m_dependencies[0].name();
}

t_aggspec_recipe
t_aggspec::get_recipe() const {
    t_aggspec_recipe rv;
    rv.m_name = m_name;
    rv.m_disp_name = m_name;
    rv.m_agg = m_agg;

    for (const auto& d : m_dependencies) {
        rv.m_dependencies.push_back(d.get_recipe());
    }

    for (const auto& d : m_odependencies) {
        rv.m_odependencies.push_back(d.get_recipe());
    }

    rv.m_sort_type = m_sort_type;
    rv.m_agg_one_idx = m_agg_one_idx;
    rv.m_agg_two_idx = m_agg_two_idx;
    rv.m_agg_one_weight = m_agg_one_weight;
    rv.m_agg_two_weight = m_agg_two_weight;
    rv.m_invmode = m_invmode;

    return rv;
}

} // end namespace perspective
