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

t_col_name_type::t_col_name_type(const std::string& name, t_dtype type)
    : m_name(name)
    , m_type(type) {}

t_aggspec::t_aggspec() {}

t_aggspec::t_aggspec(const std::string& name, t_aggtype agg,
    const std::vector<t_dep>& dependencies)
    : m_name(name)
    , m_disp_name(name)
    , m_agg(agg)
    , m_dependencies(dependencies) {}

t_aggspec::t_aggspec(
    const std::string& aggname, t_aggtype agg, const std::string& dep)
    : m_name(aggname)
    , m_disp_name(aggname)
    , m_agg(agg)
    , m_dependencies(std::vector<t_dep>{t_dep(dep, DEPTYPE_COLUMN)}) {}

t_aggspec::t_aggspec(t_aggtype agg, const std::string& dep)
    : m_agg(agg)
    , m_dependencies(std::vector<t_dep>{t_dep(dep, DEPTYPE_COLUMN)}) {}

t_aggspec::t_aggspec(const std::string& name, const std::string& disp_name,
    t_aggtype agg, const std::vector<t_dep>& dependencies)
    : m_name(name)
    , m_disp_name(disp_name)
    , m_agg(agg)
    , m_dependencies(dependencies) {}

t_aggspec::t_aggspec(const std::string& name, const std::string& disp_name,
    t_aggtype agg, const std::vector<t_dep>& dependencies, t_sorttype sort_type)
    : m_name(name)
    , m_disp_name(disp_name)
    , m_agg(agg)
    , m_dependencies(dependencies)
    , m_sort_type(sort_type) {}

t_aggspec::t_aggspec(const std::string& aggname,
    const std::string& disp_aggname, t_aggtype agg, t_uindex agg_one_idx,
    t_uindex agg_two_idx, double agg_one_weight, double agg_two_weight)
    : m_name(aggname)
    , m_disp_name(disp_aggname)
    , m_agg(agg)
    , m_agg_one_idx(agg_one_idx)
    , m_agg_two_idx(agg_two_idx)
    , m_agg_one_weight(agg_one_weight)
    , m_agg_two_weight(agg_two_weight) {}

t_aggspec::~t_aggspec() {}

std::string
t_aggspec::name() const {
    return m_name;
}

t_tscalar
t_aggspec::name_scalar() const {
    t_tscalar s;
    s.set(m_name.c_str());
    return s;
}

std::string
t_aggspec::disp_name() const {
    return m_disp_name;
}

t_aggtype
t_aggspec::agg() const {
    return m_agg;
}

std::string
t_aggspec::agg_str() const {
    switch (m_agg) {
        case AGGTYPE_SUM: {
            return "sum";
        } break;
        case AGGTYPE_SUM_ABS: {
            return "sum_abs";
        } break;
        case AGGTYPE_ABS_SUM: {
            return "abs_sum";
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
        case AGGTYPE_LAST_BY_INDEX: {
            return "last_by_index";
        } break;
        case AGGTYPE_LAST_MINUS_FIRST: {
            return "last_minus_first";
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
        case AGGTYPE_HIGH_MINUS_LOW: {
            return "high_minus_low";
        } break;
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
        case AGGTYPE_VARIANCE: {
            return "variance";
        }
        case AGGTYPE_STANDARD_DEVIATION: {
            return "stddev";
        }
        default: {
            PSP_COMPLAIN_AND_ABORT("Unknown agg type");
            return "unknown";
        } break;
    }
}

const std::vector<t_dep>&
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

        default: {
            PSP_COMPLAIN_AND_ABORT("Unexpected coltype");
        }
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

double
t_aggspec::get_agg_one_weight() const {
    return m_agg_one_weight;
}

double
t_aggspec::get_agg_two_weight() const {
    return m_agg_two_weight;
}

t_invmode
t_aggspec::get_inv_mode() const {
    return m_invmode;
}

std::vector<std::string>
t_aggspec::get_input_depnames() const {
    std::vector<std::string> rval;
    rval.reserve(m_dependencies.size());
    for (const auto& d : m_dependencies) {
        rval.push_back(d.name());
    }
    return rval;
}

std::vector<std::string>
t_aggspec::get_output_depnames() const {
    std::vector<std::string> rval;
    rval.reserve(m_dependencies.size());
    for (const auto& d : m_dependencies) {
        rval.push_back(d.name());
    }
    return rval;
}

std::vector<t_col_name_type>
t_aggspec::get_output_specs(const t_schema& schema) const {
    switch (agg()) {
        case AGGTYPE_SUM:
        case AGGTYPE_SUM_ABS:
        case AGGTYPE_ABS_SUM:
        case AGGTYPE_PCT_SUM_PARENT:
        case AGGTYPE_PCT_SUM_GRAND_TOTAL:
        case AGGTYPE_MUL:
        case AGGTYPE_SUM_NOT_NULL: {
            t_dtype coltype = schema.get_dtype(m_dependencies[0].name());
            return mk_col_name_type_vec(
                name(), get_simple_accumulator_type(coltype));
        }
        case AGGTYPE_ANY:
        case AGGTYPE_UNIQUE:
        case AGGTYPE_DOMINANT:
        case AGGTYPE_MEDIAN:
        case AGGTYPE_FIRST:
        case AGGTYPE_LAST_BY_INDEX:
        case AGGTYPE_LAST_MINUS_FIRST:
        case AGGTYPE_OR:
        case AGGTYPE_LAST_VALUE:
        case AGGTYPE_HIGH_WATER_MARK:
        case AGGTYPE_LOW_WATER_MARK:
        case AGGTYPE_HIGH_MINUS_LOW:
        case AGGTYPE_IDENTITY:
        case AGGTYPE_DISTINCT_LEAF: {
            t_dtype coltype = schema.get_dtype(m_dependencies[0].name());
            std::vector<t_col_name_type> rval(1);
            rval[0].m_name = name();
            rval[0].m_type = coltype;
            return rval;
        }
        case AGGTYPE_COUNT: {
            return mk_col_name_type_vec(name(), DTYPE_INT64);
        }
        case AGGTYPE_MEAN:
        case AGGTYPE_MEAN_BY_COUNT:
        case AGGTYPE_WEIGHTED_MEAN: {
            return mk_col_name_type_vec(name(), DTYPE_F64PAIR);
        }
        case AGGTYPE_JOIN: {
            return mk_col_name_type_vec(name(), DTYPE_STR);
        }
        case AGGTYPE_SCALED_DIV:
        case AGGTYPE_SCALED_ADD:
        case AGGTYPE_SCALED_MUL:
        case AGGTYPE_VARIANCE:
        case AGGTYPE_STANDARD_DEVIATION: {
            return mk_col_name_type_vec(name(), DTYPE_FLOAT64);
        }
        case AGGTYPE_UDF_COMBINER:
        case AGGTYPE_UDF_REDUCER: {
            std::vector<t_col_name_type> rval;
            rval.reserve(m_odependencies.size());
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
        default: {
            PSP_COMPLAIN_AND_ABORT("Unknown agg type");
        }
    }

    return std::vector<t_col_name_type>();
}

std::vector<t_col_name_type>
t_aggspec::mk_col_name_type_vec(const std::string& name, t_dtype dtype) const {
    std::vector<t_col_name_type> rval(1);
    rval[0].m_name = name;
    rval[0].m_type = dtype;
    return rval;
}

bool
t_aggspec::is_combiner_agg() const {
    return m_agg == AGGTYPE_UDF_COMBINER;
}

bool
t_aggspec::is_reducer_agg() const {
    return m_agg == AGGTYPE_UDF_REDUCER;
}

bool
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

std::string
t_aggspec::get_first_depname() const {
    if (m_dependencies.empty())
        return "";

    return m_dependencies[0].name();
}

} // end namespace perspective
