/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/view.h>
#include <sstream>

namespace perspective {
template <typename CTX_T>
View<CTX_T>::View(t_pool* pool, std::shared_ptr<CTX_T> ctx, std::shared_ptr<t_gnode> gnode,
    std::string name, std::string separator, t_config config)
    : m_pool(pool)
    , m_ctx(ctx)
    , m_gnode(gnode)
    , m_name(name)
    , m_separator(separator)
    , m_config(config) {

    // We should deprecate t_pivot and just use string column names throughout
    for (const t_pivot& rp : m_config.get_row_pivots()) {
        m_row_pivots.push_back(rp.name());
    }

    for (const t_pivot& cp : m_config.get_column_pivots()) {
        m_column_pivots.push_back(cp.name());
    }

    m_aggregates = m_config.get_aggregates();
    m_filters = m_config.get_fterms();
    m_sorts = m_config.get_sortspecs();
}

template <typename CTX_T>
View<CTX_T>::~View() {
    m_pool->unregister_context(m_gnode->get_id(), m_name);
}

template <>
std::int32_t
View<t_ctx0>::sides() const {
    return 0;
}

template <>
std::int32_t
View<t_ctx1>::sides() const {
    return 1;
}

template <>
std::int32_t
View<t_ctx2>::sides() const {
    return 2;
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::num_rows() const {
    if (is_column_only()) {
        return m_ctx->get_row_count() - 1;
    } else {
        return m_ctx->get_row_count();
    }
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::num_columns() const {
    return m_ctx->unity_get_column_count();
}

// Pivot table operations
template <typename CTX_T>
std::int32_t
View<CTX_T>::get_row_expanded(std::int32_t idx) const {
    return m_ctx->unity_get_row_expanded(idx);
}

template <>
t_index
View<t_ctx0>::expand(std::int32_t idx, std::int32_t row_pivot_length) {
    return idx;
}

template <>
t_index
View<t_ctx1>::expand(std::int32_t idx, std::int32_t row_pivot_length) {
    return m_ctx->open(idx);
}

template <>
t_index
View<t_ctx2>::expand(std::int32_t idx, std::int32_t row_pivot_length) {
    if (m_ctx->unity_get_row_depth(idx) < t_uindex(row_pivot_length)) {
        return m_ctx->open(t_header::HEADER_ROW, idx);
    } else {
        return idx;
    }
}

template <>
t_index
View<t_ctx0>::collapse(std::int32_t idx) {
    return idx;
}

template <>
t_index
View<t_ctx1>::collapse(std::int32_t idx) {
    return m_ctx->close(idx);
}

template <>
t_index
View<t_ctx2>::collapse(std::int32_t idx) {
    return m_ctx->close(t_header::HEADER_ROW, idx);
}

template <>
void
View<t_ctx0>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {}

template <>
void
View<t_ctx1>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {
    if (row_pivot_length >= depth) {
        m_ctx->set_depth(depth);
    } else {
        std::cout << "Cannot expand past " << std::to_string(row_pivot_length) << std::endl;
    }
}

template <>
void
View<t_ctx2>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {
    if (row_pivot_length >= depth) {
        m_ctx->set_depth(t_header::HEADER_ROW, depth);
    } else {
        std::cout << "Cannot expand past " << std::to_string(row_pivot_length) << std::endl;
    }
}

/**
 * @brief The column names of the View. If the View is aggregated, the
 * individual column names will be joined with a separator character
 * specified by the user, or defaulting to "|".
 *
 * @return std::vector<std::string>
 */
template <typename CTX_T>
std::vector<std::string>
View<CTX_T>::_column_names(bool skip, std::int32_t depth) const {
    std::vector<std::string> names;
    std::vector<std::string> aggregate_names;

    const std::vector<t_aggspec> aggs = m_ctx->get_aggregates();
    for (const t_aggspec& agg : aggs) {
        aggregate_names.push_back(agg.name());
    }

    for (t_uindex key = 0, max = m_ctx->unity_get_column_count(); key != max; ++key) {
        std::stringstream col_name;
        std::string name = aggregate_names[key % aggregate_names.size()];

        if (name == "psp_okey") {
            continue;
        }

        std::vector<t_tscalar> col_path = m_ctx->unity_get_column_path(key + 1);
        if (skip && col_path.size() < static_cast<unsigned int>(depth)) {
            continue;
        }

        for (auto path = col_path.rbegin(); path != col_path.rend(); ++path) {
            std::string path_name = path->to_string();
            // ensure that boolean columns are correctly represented
            if (path->get_dtype() == DTYPE_BOOL) {
                if (path_name == "0") {
                    col_name << "false";
                } else {
                    col_name << "true";
                }
            } else {
                col_name << path_name;
            }
            col_name << m_separator;
        }

        col_name << name;
        names.push_back(col_name.str());
    }

    return names;
}

/**
 * @brief The column names of the View. Same as above but
 * specialized for zero-sided contexts.
 *
 * @return std::vector<std::string> containing all column names
 */
template <>
std::vector<std::string>
View<t_ctx0>::_column_names(bool skip, std::int32_t depth) const {
    std::vector<std::string> names;
    std::vector<std::string> aggregate_names = m_ctx->get_column_names();

    for (t_uindex key = 0, max = m_ctx->unity_get_column_count(); key != max; ++key) {
        std::stringstream col_name;

        col_name << aggregate_names[key];
        if (col_name.str() == "psp_okey") {
            continue;
        };

        names.push_back(col_name.str());
    }

    return names;
}

/**
 * @brief The schema of this View.  A schema is an std::map, the keys of which
 * are the columns of this View, and the values are their string type names.
 * If this View is aggregated, theses will be the aggregated types;
 * otherwise these types will be the same as the columns in the underlying
 * Table.
 *
 * @return std::map<std::string, std::string>
 */
template <typename CTX_T>
std::map<std::string, std::string>
View<CTX_T>::schema() const {
    auto schema = m_gnode->get_tblschema();
    auto _types = schema.types();
    auto names = schema.columns();

    std::map<std::string, t_dtype> types;
    std::map<std::string, std::string> new_schema;

    for (std::size_t i = 0, max = names.size(); i != max; ++i) {
        types[names[i]] = _types[i];
    }

    auto col_names = _column_names(false);
    for (const std::string& name : col_names) {
        // Pull out the main aggregate column
        std::size_t last_delimiter = name.find_last_of(m_separator);
        std::string agg_name = name.substr(last_delimiter + 1);

        std::string type_string = dtype_to_str(types[agg_name]);
        new_schema[agg_name] = type_string;

        if (m_row_pivots.size() > 0 && !is_column_only()) {
            new_schema[agg_name] = _map_aggregate_types(agg_name, new_schema[agg_name]);
        }
    }

    return new_schema;
}
/**
 * @brief The schema of this View. Output and logic is as the above
 * schema(), but this version is specialized for zero-sided
 * contexts.
 *
 * @return std::map<std::string, std::string>
 */
template <>
std::map<std::string, std::string>
View<t_ctx0>::schema() const {
    t_schema schema = m_gnode->get_tblschema();
    std::vector<t_dtype> _types = schema.types();
    std::vector<std::string> names = schema.columns();

    std::map<std::string, t_dtype> types;
    for (std::size_t i = 0, max = names.size(); i != max; ++i) {
        types[names[i]] = _types[i];
    }

    std::vector<std::string> column_names = _column_names(false);
    std::map<std::string, std::string> new_schema;

    for (std::size_t i = 0, max = column_names.size(); i != max; ++i) {
        std::string name = column_names[i];
        if (name == "psp_okey") {
            continue;
        }
        new_schema[name] = dtype_to_str(types[name]);
    }

    return new_schema;
}

/**
 * @brief Returns a slice of the underlying data of the view.
 *
 * @return std::vector<t_tscalar>
 */
template <>
std::shared_ptr<t_data_slice<t_ctx0>>
View<t_ctx0>::get_data(
    t_uindex start_row, t_uindex end_row, t_uindex start_col, t_uindex end_col) {
    auto slice_ptr = std::make_shared<std::vector<t_tscalar>>(
        m_ctx->get_data(start_row, end_row, start_col, end_col));
    auto col_names = _column_names();
    auto data_slice_ptr = std::make_shared<t_data_slice<t_ctx0>>(
        m_ctx, start_row, end_row, start_col, end_col, slice_ptr, col_names);
    return data_slice_ptr;
}

template <>
std::shared_ptr<t_data_slice<t_ctx1>>
View<t_ctx1>::get_data(
    t_uindex start_row, t_uindex end_row, t_uindex start_col, t_uindex end_col) {
    auto slice_ptr = std::make_shared<std::vector<t_tscalar>>(
        m_ctx->get_data(start_row, end_row, start_col, end_col));
    auto col_names = _column_names();
    col_names.insert(col_names.begin(), "__ROW_PATH__");
    auto data_slice_ptr = std::make_shared<t_data_slice<t_ctx1>>(
        m_ctx, start_row, end_row, start_col, end_col, slice_ptr, col_names);
    return data_slice_ptr;
}

template <>
std::shared_ptr<t_data_slice<t_ctx2>>
View<t_ctx2>::get_data(
    t_uindex start_row, t_uindex end_row, t_uindex start_col, t_uindex end_col) {
    std::vector<t_tscalar> slice;
    std::vector<t_uindex> column_indices;
    std::vector<std::string> column_names;
    bool is_sorted = m_sorts.size() > 0;

    if (is_sorted) {
        auto depth = m_column_pivots.size();
        auto col_length = m_ctx->unity_get_column_count();
        column_indices.push_back(0);
        for (t_uindex i = 0; i < col_length; ++i) {
            if (m_ctx->unity_get_column_path(i + 1).size() == depth) {
                column_indices.push_back(i + 1);
            }
        }

        column_names = _column_names(true, depth);
        column_indices = std::vector<t_uindex>(column_indices.begin() + start_col,
            column_indices.begin() + std::min(end_col, (t_uindex)column_indices.size()));

        slice = m_ctx->get_data(
            start_row, end_row, column_indices.front(), column_indices.back() + 1);
    } else {
        column_names = _column_names();
        slice = m_ctx->get_data(start_row, end_row, start_col, end_col);
    }

    column_names.insert(column_names.begin(), "__ROW_PATH__");
    auto slice_ptr = std::make_shared<std::vector<t_tscalar>>(slice);
    auto data_slice_ptr = std::make_shared<t_data_slice<t_ctx2>>(
        m_ctx, start_row, end_row, start_col, end_col, slice_ptr, column_names, column_indices);
    return data_slice_ptr;
}

// Delta calculation
template <typename CTX_T>
bool
View<CTX_T>::_get_deltas_enabled() const {
    return m_ctx->get_deltas_enabled();
}

template <>
bool
View<t_ctx0>::_get_deltas_enabled() const {
    return true;
}

template <typename CTX_T>
void
View<CTX_T>::_set_deltas_enabled(bool enabled_state) {
    m_ctx->set_deltas_enabled(enabled_state);
}

template <>
void
View<t_ctx0>::_set_deltas_enabled(bool enabled_state) {}

// Getters
template <typename CTX_T>
std::shared_ptr<CTX_T>
View<CTX_T>::get_context() const {
    return m_ctx;
}

template <typename CTX_T>
std::vector<std::string>
View<CTX_T>::get_row_pivots() const {
    return m_row_pivots;
}

template <typename CTX_T>
std::vector<std::string>
View<CTX_T>::get_column_pivots() const {
    return m_column_pivots;
}

template <typename CTX_T>
std::vector<t_aggspec>
View<CTX_T>::get_aggregates() const {
    return m_aggregates;
}

template <typename CTX_T>
std::vector<t_fterm>
View<CTX_T>::get_filters() const {
    return m_filters;
}

template <typename CTX_T>
std::vector<t_sortspec>
View<CTX_T>::get_sorts() const {
    return m_sorts;
}

template <>
std::vector<t_tscalar>
View<t_ctx0>::get_row_path(t_uindex idx) const {
    return std::vector<t_tscalar>();
}

template <typename CTX_T>
std::vector<t_tscalar>
View<CTX_T>::get_row_path(t_uindex idx) const {
    return m_ctx->unity_get_row_path(idx);
}

template <typename CTX_T>
t_stepdelta
View<CTX_T>::get_step_delta(t_index bidx, t_index eidx) const {
    return m_ctx->get_step_delta(bidx, eidx);
}

template <typename CTX_T>
t_rowdelta
View<CTX_T>::get_row_delta(t_index bidx, t_index eidx) const {
    return m_ctx->get_row_delta(bidx, eidx);
}

template <typename CTX_T>
bool
View<CTX_T>::is_column_only() const {
    return m_config.is_column_only();
}

/******************************************************************************
 *
 * Private
 */

/**
 * @brief Gets the correct type for the specified aggregate, thus remapping columns
 * when they are pivoted. This ensures that we display aggregates with the correct type.
 *
 * @return std::string
 */
template <typename CTX_T>
std::string
View<CTX_T>::_map_aggregate_types(
    const std::string& name, const std::string& typestring) const {
    std::vector<std::string> INTEGER_AGGS
        = {"distinct_count", "distinct count", "distinctcount", "distinct", "count"};
    std::vector<std::string> FLOAT_AGGS
        = {"avg", "mean", "mean by count", "mean_by_count", "weighted mean", "weighted_mean",
            "pct sum parent", "pct_sum_parent", "pct sum grand total", "pct_sum_grand_total"};

    for (const t_aggspec& agg : m_aggregates) {
        if (agg.name() == name) {
            std::string agg_str = agg.agg_str();
            bool int_agg = std::find(INTEGER_AGGS.begin(), INTEGER_AGGS.end(), agg_str)
                != INTEGER_AGGS.end();
            bool float_agg
                = std::find(FLOAT_AGGS.begin(), FLOAT_AGGS.end(), agg_str) != FLOAT_AGGS.end();

            if (int_agg) {
                return "integer";
            } else if (float_agg) {
                return "float";
            } else {
                return typestring;
            }
        }
    }

    return typestring;
}

// Explicitly instantiate View for each context
template class View<t_ctx0>;
template class View<t_ctx1>;
template class View<t_ctx2>;
} // end namespace perspective