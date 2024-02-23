// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

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
    t_col_name_type(std::string name, t_dtype type);
    std::string m_name;
    t_dtype m_type;
};

class PERSPECTIVE_EXPORT t_aggspec {
public:
    t_aggspec();

    ~t_aggspec();

    t_aggspec(
        const std::string& aggname,
        t_aggtype agg,
        const std::vector<t_dep>& dependencies
    );

    t_aggspec(
        const std::string& aggname, t_aggtype agg, const std::string& dep
    );

    t_aggspec(t_aggtype agg, const std::string& dep);

    t_aggspec(
        std::string aggname,
        std::string disp_name,
        t_aggtype agg,
        const std::vector<t_dep>& dependencies
    );

    t_aggspec(
        std::string aggname,
        std::string disp_name,
        t_aggtype agg,
        const std::vector<t_dep>& dependencies,
        t_sorttype sort_type
    );

    t_aggspec(
        std::string aggname,
        std::string disp_aggname,
        t_aggtype agg,
        t_uindex agg_one_idx,
        t_uindex agg_two_idx,
        double agg_one_weight,
        double agg_two_weight
    );

    std::string name() const;
    t_tscalar name_scalar() const;
    std::string disp_name() const;
    t_aggtype agg() const;
    std::string agg_str() const;
    const std::vector<t_dep>& get_dependencies() const;
    t_sorttype get_sort_type() const;

    t_uindex get_agg_one_idx() const;
    t_uindex get_agg_two_idx() const;

    double get_agg_one_weight() const;
    double get_agg_two_weight() const;

    t_invmode get_inv_mode() const;

    std::vector<std::string> get_input_depnames() const;
    std::vector<std::string> get_output_depnames() const;

    std::vector<t_col_name_type> get_output_specs(const t_schema& schema) const;
    std::vector<t_col_name_type>
    mk_col_name_type_vec(const std::string& name, t_dtype dtype) const;
    bool is_combiner_agg() const;
    bool is_reducer_agg() const;

    bool is_non_delta() const;

    std::string get_first_depname() const;

private:
    std::string m_name;
    std::string m_disp_name;
    t_aggtype m_agg;
    std::vector<t_dep> m_dependencies;
    std::vector<t_dep> m_odependencies;
    t_sorttype m_sort_type;
    t_uindex m_agg_one_idx;
    t_uindex m_agg_two_idx;
    double m_agg_one_weight;
    double m_agg_two_weight;
    t_invmode m_invmode;
    // t_uindex m_kernel;
};

PERSPECTIVE_EXPORT t_dtype get_simple_accumulator_type(t_dtype coltype);

} // end namespace perspective
