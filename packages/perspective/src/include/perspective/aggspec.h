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
#include <perspective/dependency.h>
#include <perspective/exports.h>
#include <perspective/schema.h>
#include <perspective/schema_column.h>
#include <vector>

namespace perspective {

struct PERSPECTIVE_EXPORT t_col_name_type {
    t_col_name_type();
    t_col_name_type(const t_str& name, t_dtype type);
    t_str m_name;
    t_dtype m_type;
};

typedef std::vector<t_col_name_type> t_col_name_type_vec;

struct PERSPECTIVE_EXPORT t_aggspec_recipe {
    t_aggspec_recipe() {}
    t_str m_name;
    t_str m_disp_name;
    t_aggtype m_agg;
    t_dep_recipevec m_dependencies;
    t_dep_recipevec m_odependencies;
    t_sorttype m_sort_type;
    t_uindex m_agg_one_idx;
    t_uindex m_agg_two_idx;
    t_float64 m_agg_one_weight;
    t_float64 m_agg_two_weight;
    t_invmode m_invmode;
};

typedef std::vector<t_aggspec_recipe> t_aggspec_recipevec;

class PERSPECTIVE_EXPORT t_aggspec {
public:
    t_aggspec();

    ~t_aggspec();

    t_aggspec(const t_aggspec_recipe& v);

    t_aggspec(const t_str& aggname, t_aggtype agg, const t_depvec& dependencies);

    t_aggspec(const t_str& aggname, t_aggtype agg, const t_str& dep);

    t_aggspec(const t_str& aggname, const t_str& disp_aggname, t_aggtype agg,
        const t_depvec& dependencies);

    t_aggspec(const t_str& aggname, const t_str& disp_aggname, t_aggtype agg,
        const t_depvec& dependencies, t_sorttype sort_type);

    t_aggspec(const t_str& aggname, const t_str& disp_aggname, t_aggtype agg,
        t_uindex agg_one_idx, t_uindex agg_two_idx, t_float64 agg_one_weight,
        t_float64 agg_two_weight);
    t_str name() const;
    t_str disp_name() const;
    t_aggtype agg() const;
    t_str agg_str() const;
    const t_depvec& get_dependencies() const;
    t_sorttype get_sort_type() const;

    t_uindex get_agg_one_idx() const;
    t_uindex get_agg_two_idx() const;

    t_float64 get_agg_one_weight() const;
    t_float64 get_agg_two_weight() const;

    t_invmode get_inv_mode() const;

    t_svec get_input_depnames() const;
    t_svec get_output_depnames() const;

    t_col_name_type_vec get_output_specs(const t_schema& schema) const;
    t_col_name_type_vec mk_col_name_type_vec(const t_str& name, t_dtype dtype) const;
    t_bool is_combiner_agg() const;
    t_bool is_reducer_agg() const;

    t_bool is_non_delta() const;

    t_str get_first_depname() const;

    t_aggspec_recipe get_recipe() const;

private:
    t_str m_name;
    t_str m_disp_name;
    t_aggtype m_agg;
    t_depvec m_dependencies;
    t_depvec m_odependencies;
    t_sorttype m_sort_type;
    t_uindex m_agg_one_idx;
    t_uindex m_agg_two_idx;
    t_float64 m_agg_one_weight;
    t_float64 m_agg_two_weight;
    t_invmode m_invmode;
    t_uindex m_kernel;
};

typedef std::vector<t_aggspec> t_aggspecvec;

PERSPECTIVE_EXPORT t_dtype get_simple_accumulator_type(t_dtype coltype);

} // end namespace perspective
