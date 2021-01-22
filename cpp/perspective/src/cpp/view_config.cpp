/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/view_config.h>

namespace perspective {

t_view_config::t_view_config(
        const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& column_pivots,
        const tsl::ordered_map<std::string, std::vector<std::string>>& aggregates,
        const std::vector<std::string>& columns,
        const std::vector<std::tuple<std::string, std::string, std::vector<t_tscalar>>>& filter,
        const std::vector<std::vector<std::string>>& sort,
        const std::vector<t_computed_column_definition>& computed_columns,
        const std::string& filter_op,
        bool column_only)
    : m_init(false)
    , m_row_pivots(row_pivots)
    , m_column_pivots(column_pivots)
    , m_aggregates(aggregates)
    , m_columns(columns)
    , m_filter(filter)
    , m_sort(sort)
    , m_computed_columns(computed_columns)
    , m_row_pivot_depth(-1)
    , m_column_pivot_depth(-1)
    , m_filter_op(filter_op)
    , m_column_only(column_only) {}

void
t_view_config::init(std::shared_ptr<t_schema> schema) {
    validate(schema);
    fill_aggspecs(schema);
    fill_fterm();
    fill_sortspec();

    m_init = true;
}

void
t_view_config::validate(std::shared_ptr<t_schema> schema) {
    std::unordered_set<std::string> computed_column_names;
    computed_column_names.reserve(m_computed_columns.size());

    for (const auto& c : m_computed_columns) {
        computed_column_names.insert(std::get<0>(c));
    }

    for (const std::string& col : m_columns) {
        if (schema->get_colidx_safe(col) == -1 && computed_column_names.count(col) == 0) {
            std::stringstream ss;
            ss << "Invalid column '" << col << "' found in View columns." << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
    }

    for (const auto& agg : m_aggregates) {
        const std::string& col = agg.first;
        if (schema->get_colidx_safe(col) == -1 && computed_column_names.count(col) == 0) {
            std::stringstream ss;
            ss << "Invalid column '" << col << "' found in View aggregates." << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
    }

    for (const std::string& col : m_row_pivots) {
        if (schema->get_colidx_safe(col) == -1 && computed_column_names.count(col) == 0) {
            std::stringstream ss;
            ss << "Invalid column '" << col << "' found in View row_pivots." << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
    }

    for (const std::string& col : m_column_pivots) {
        if (schema->get_colidx_safe(col) == -1 && computed_column_names.count(col) == 0) {
            std::stringstream ss;
            ss << "Invalid column '" << col << "' found in View column_pivots." << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
    }

    for (const auto& filter : m_filter) {
        const std::string& col = std::get<0>(filter);
        if (schema->get_colidx_safe(col) == -1 && computed_column_names.count(col) == 0) {
            std::stringstream ss;
            ss << "Invalid column '" << col << "' found in View filters." << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
    }

    for (const auto& sort : m_sort) {
        const std::string& col = sort[0];
        if (schema->get_colidx_safe(col) == -1 && computed_column_names.count(col) == 0) {
            std::stringstream ss;
            ss << "Invalid column '" << col << "' found in View sorts." << std::endl;
            PSP_COMPLAIN_AND_ABORT(ss.str());
        }
    }
}

void
t_view_config::add_filter_term(
    std::tuple<std::string, std::string, std::vector<t_tscalar>> term) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_filter.push_back(term);
}

void
t_view_config::set_row_pivot_depth(std::int32_t depth) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_row_pivot_depth = depth;
}

void
t_view_config::set_column_pivot_depth(std::int32_t depth) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_column_pivot_depth = depth;
}

std::vector<std::string>
t_view_config::get_row_pivots() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_row_pivots;
}

std::vector<std::string>
t_view_config::get_column_pivots() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_column_pivots;
}

std::vector<t_aggspec>
t_view_config::get_aggspecs() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_aggspecs;
}

std::vector<std::string>
t_view_config::get_columns() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_columns;
}

std::vector<t_fterm>
t_view_config::get_fterm() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_fterm;
}

std::vector<t_sortspec>
t_view_config::get_sortspec() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_sortspec;
}

std::vector<t_sortspec>
t_view_config::get_col_sortspec() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_col_sortspec;
}

std::vector<t_computed_column_definition>
t_view_config::get_computed_columns() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_computed_columns;
}

t_filter_op
t_view_config::get_filter_op() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return str_to_filter_op(m_filter_op);
}

bool
t_view_config::is_column_only() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_column_only;
}

std::int32_t
t_view_config::get_row_pivot_depth() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_row_pivot_depth;
}

std::int32_t
t_view_config::get_column_pivot_depth() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_column_pivot_depth;
}

// PRIVATE
void
t_view_config::fill_aggspecs(std::shared_ptr<t_schema> schema) {
    /*
     * Provide aggregates for columns that are shown but NOT specified in 
     * `m_aggregates`, including computed columns that are in the `columns`
     * array but not the `aggregates` map.
     */
    for (const std::string& column : m_columns) {
        if (m_aggregates.count(column) != 0) {
            continue;
        }

        t_dtype dtype = schema->get_dtype(column);
        std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
        t_aggtype agg_type
            = t_aggtype::AGGTYPE_ANY; // use aggtype here since we are not parsing aggs

        if (!m_column_only) {
            agg_type = _get_default_aggregate(dtype);
        }

        // create aggregate specification, and memoize the column name
        m_aggspecs.push_back(t_aggspec(column, agg_type, dependencies));
        m_aggregate_names.push_back(column);
    }

    /**
     * Construct aggspecs for aggregates explicitly specified in `m_aggregates`. 
     */
    for (auto const& iter : m_aggregates) {
        auto column = iter.first;
        auto aggregate = iter.second;
        if (std::find(m_columns.begin(), m_columns.end(), column) == m_columns.end()) {
            continue;
        }

        std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
        t_aggtype agg_type;

        if (m_column_only) {
            agg_type = t_aggtype::AGGTYPE_ANY;
        } else {
            if (aggregate.at(0) == "weighted mean") {
                dependencies.push_back(t_dep(aggregate.at(1), DEPTYPE_COLUMN));
                agg_type = AGGTYPE_WEIGHTED_MEAN;
            } else {
                agg_type = str_to_aggtype(aggregate.at(0));
            }
        }

        if (agg_type == AGGTYPE_FIRST || agg_type == AGGTYPE_LAST_BY_INDEX) {
            dependencies.push_back(t_dep("psp_okey", DEPTYPE_COLUMN));
            m_aggspecs.push_back(
                t_aggspec(column, column, agg_type, dependencies, SORTTYPE_ASCENDING));
        } else {
            m_aggspecs.push_back(t_aggspec(column, agg_type, dependencies));
        }

        m_aggregate_names.push_back(column);
    }

    // construct aggspecs for hidden sorts
    for (auto sort : m_sort) {
        std::string column = sort[0];

        bool is_hidden_column
            = std::find(m_columns.begin(), m_columns.end(), column) == m_columns.end();

        if (is_hidden_column) {
            bool is_row_pivot = std::find(m_row_pivots.begin(), m_row_pivots.end(), column) != m_row_pivots.end();
            bool is_column_pivot = std::find(m_column_pivots.begin(), m_column_pivots.end(), column) != m_column_pivots.end();
            bool is_column_only = m_row_pivots.size() == 0 || m_column_only;

            std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
            t_aggtype agg_type;

            if (is_column_only) {
                // Always sort by `ANY` in column only views
                agg_type = t_aggtype::AGGTYPE_ANY;
            } else if (is_row_pivot || is_column_pivot) {
                // Otherwise if the hidden column is in pivots, use `UNIQUE`
                agg_type = t_aggtype::AGGTYPE_UNIQUE;      
            } else if (m_aggregates.count(column) > 0) {
                auto col = m_aggregates.at(column);
                if (col.at(0) == "weighted mean") {
                    dependencies.push_back(t_dep(col.at(1), DEPTYPE_COLUMN));
                    agg_type = AGGTYPE_WEIGHTED_MEAN;
                } else {
                    agg_type = str_to_aggtype(col.at(0));
                }
            } else {
                t_dtype dtype = schema->get_dtype(column);
                agg_type = _get_default_aggregate(dtype);
            }

            m_aggspecs.push_back(t_aggspec(column, agg_type, dependencies));
            m_aggregate_names.push_back(column);
        }
    }
}

void
t_view_config::fill_fterm() {
    for (auto filter : m_filter) {
        t_filter_op op = str_to_filter_op(std::get<1>(filter));
        switch (op) {
            case FILTER_OP_NOT_IN:
            case FILTER_OP_IN: {
                m_fterm.push_back(
                    t_fterm(std::get<0>(filter), op, mktscalar(0), std::get<2>(filter)));
            } break;
            default: {
                t_tscalar filter_term = std::get<2>(filter)[0];
                m_fterm.push_back(
                    t_fterm(std::get<0>(filter), op, filter_term, std::vector<t_tscalar>()));
            }
        }
    }
}

void
t_view_config::fill_sortspec() {
    for (auto s : m_sort) {
        t_index agg_index = get_aggregate_index(s[0]);
        t_sorttype sort_type = str_to_sorttype(s[1]);

        auto spec = t_sortspec(s[0], agg_index, sort_type);

        bool is_column_sort = s[1].find("col") != std::string::npos;
        if (is_column_sort) {
            m_col_sortspec.push_back(spec);
        } else {
            m_sortspec.push_back(spec);
        }
    }
}

t_index
t_view_config::get_aggregate_index(const std::string& column) const {
    auto it = std::find(m_aggregate_names.begin(), m_aggregate_names.end(), column);
    if (it != m_aggregate_names.end()) {
        return t_index(std::distance(m_aggregate_names.begin(), it));
    }
    return t_index();
}

} // end namespace perspective