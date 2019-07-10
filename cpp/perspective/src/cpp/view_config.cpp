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

t_view_config::t_view_config(std::vector<std::string> row_pivots,
    std::vector<std::string> column_pivots, std::map<std::string, std::string> aggregates,
    std::vector<std::string> columns,
    std::vector<std::tuple<std::string, std::string, std::vector<t_tscalar>>> filter,
    std::vector<std::vector<std::string>> sort, std::string filter_op, bool column_only)
    : m_row_pivots(row_pivots)
    , m_column_pivots(column_pivots)
    , m_aggregates(aggregates)
    , m_columns(columns)
    , m_filter(filter)
    , m_sort(sort)
    , m_filter_op(filter_op)
    , m_column_only(column_only) {}

void
t_view_config::add_filter_term(
    std::tuple<std::string, std::string, std::vector<t_tscalar>> term) {
    m_filter.push_back(term);
}

std::vector<std::string>
t_view_config::get_row_pivots() {
    return m_row_pivots;
}

std::vector<std::string>
t_view_config::get_column_pivots() {
    return m_column_pivots;
}

std::vector<t_aggspec>
t_view_config::get_aggregates(const t_schema& schema) {
    std::vector<t_aggspec> aggspecs;

    /**
     * Provide aggregates for columns that are shown but NOT specified in `m_aggregates`.
     */
    for (const std::string& column : m_columns) {
        if (m_aggregates.count(column) != 0) {
            continue;
        }

        t_dtype dtype = schema.get_dtype(column);
        std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
        t_aggtype agg_op
            = t_aggtype::AGGTYPE_ANY; // use aggtype here since we are not parsing aggs

        if (!m_column_only) {
            agg_op = _get_default_aggregate(dtype);
        }

        aggspecs.push_back(t_aggspec(column, agg_op, dependencies));
    }

    // Construct aggregates from config object
    // FIXME: this will NOT be in the right order unless we use `tsl::ordered_map`
    for (auto const& iter : m_aggregates) {
        auto column = iter.first;
        auto aggregate = iter.second;
        if (std::find(m_columns.begin(), m_columns.end(), column) == m_columns.end()) {
            continue;
        }

        std::vector<t_dep> dependencies;
        t_aggtype agg_type;

        if (m_column_only) {
            agg_type = t_aggtype::AGGTYPE_ANY;
        } else {
            agg_type = str_to_aggtype(aggregate);
        }

        dependencies.push_back(t_dep(column, DEPTYPE_COLUMN));

        if (agg_type == AGGTYPE_FIRST || agg_type == AGGTYPE_LAST) {
            if (dependencies.size() == 1) {
                dependencies.push_back(t_dep("psp_pkey", DEPTYPE_COLUMN));
            }
            aggspecs.push_back(
                t_aggspec(column, column, agg_type, dependencies, SORTTYPE_ASCENDING));
        } else {
            aggspecs.push_back(t_aggspec(column, agg_type, dependencies));
        }
    }

    // construct aggspecs for hidden sorts
    for (auto sort : m_sort) {
        std::string column = sort[0];

        bool is_hidden_column
            = std::find(m_columns.begin(), m_columns.end(), column) == m_columns.end();

        if (is_hidden_column) {
            bool is_pivot = (std::find(m_row_pivots.begin(), m_row_pivots.end(), column)
                                != m_row_pivots.end())
                || (std::find(m_column_pivots.begin(), m_column_pivots.end(), column)
                       != m_column_pivots.end());

            std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
            t_aggtype agg_op;

            // use the `any` agg for columns used as pivots/column_only views
            if (is_pivot || m_row_pivots.size() == 0 || m_column_only) {
                agg_op = t_aggtype::AGGTYPE_ANY;
            } else {
                t_dtype dtype = schema.get_dtype(column);
                agg_op = _get_default_aggregate(dtype);
            }

            aggspecs.push_back(t_aggspec(column, agg_op, dependencies));
        }
    }

    return aggspecs;
}

std::vector<std::string>
t_view_config::get_columns() {
    return m_columns;
}

std::vector<t_fterm>
t_view_config::get_filter() {
    std::vector<t_fterm> rval;

    for (auto filter : m_filter) {
        t_filter_op op = str_to_filter_op(std::get<1>(filter));
        switch (op) {
            case FILTER_OP_NOT_IN:
            case FILTER_OP_IN: {
                rval.push_back(
                    t_fterm(std::get<0>(filter), op, mktscalar(0), std::get<2>(filter)));
            } break;
            default: {
                t_tscalar filter_term = std::get<2>(filter)[0];
                rval.push_back(
                    t_fterm(std::get<0>(filter), op, filter_term, std::vector<t_tscalar>()));
            }
        }
    }

    return rval;
}

std::tuple<std::vector<t_sortspec>, std::vector<t_sortspec>>
t_view_config::get_sort(const std::vector<std::string>& aggregate_names) {
    std::vector<t_sortspec> sort;
    std::vector<t_sortspec> column_sort;

    for (auto s : m_sort) {
        t_index agg_index = get_aggregate_index(aggregate_names, s[0]);
        t_sorttype sort_type = str_to_sorttype(s[1]);

        auto spec = t_sortspec(agg_index, sort_type);

        bool is_column_sort = s[1].find("col") != std::string::npos;
        if (is_column_sort) {
            column_sort.push_back(spec);
        } else {
            sort.push_back(spec);
        }
    }

    return std::make_tuple(sort, column_sort);
}

t_index
t_view_config::get_aggregate_index(
    const std::vector<std::string>& aggregate_names, const std::string& column) const {
    auto it = std::find(aggregate_names.begin(), aggregate_names.end(), column);
    if (it != aggregate_names.end()) {
        return t_index(std::distance(aggregate_names.begin(), it));
    }
    return t_index();
}

std::vector<std::string>
t_view_config::get_aggregate_names(const std::vector<t_aggspec>& aggs) const {
    std::vector<std::string> names;
    for (const t_aggspec& agg : aggs) {
        names.push_back(agg.name());
    }
    return names;
}

t_filter_op
t_view_config::get_filter_op() const {
    return str_to_filter_op(m_filter_op);
}

bool
t_view_config::is_column_only() const {
    return m_column_only;
}

} // end namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& os, const perspective::t_view_config& vc) {
    os << "t_view_config"; // TODO: finish
    return os;
}
} // end namespace std