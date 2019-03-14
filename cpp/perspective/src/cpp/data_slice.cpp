/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/data_slice.h>

namespace perspective {

template <typename CTX_T>
t_data_slice<CTX_T>::t_data_slice(std::shared_ptr<CTX_T> ctx, t_uindex start_row,
    t_uindex end_row, t_uindex start_col, t_uindex end_col,
    const std::shared_ptr<std::vector<t_tscalar>>& slice, std::vector<std::string> column_names)
    : m_ctx(ctx)
    , m_start_row(start_row)
    , m_end_row(end_row)
    , m_start_col(start_col)
    , m_end_col(end_col)
    , m_slice(slice)
    , m_column_names(column_names) {
    m_stride = m_end_col - m_start_col;
}

template <typename CTX_T>
t_data_slice<CTX_T>::t_data_slice(std::shared_ptr<CTX_T> ctx, t_uindex start_row,
    t_uindex end_row, t_uindex start_col, t_uindex end_col,
    const std::shared_ptr<std::vector<t_tscalar>>& slice, std::vector<std::string> column_names,
    std::vector<t_uindex> column_indices)
    : m_ctx(ctx)
    , m_start_row(start_row)
    , m_end_row(end_row)
    , m_start_col(start_col)
    , m_end_col(end_col)
    , m_slice(slice)
    , m_column_names(column_names)
    , m_column_indices(column_indices) {
    m_stride = m_end_col - m_start_col;
}

template <typename CTX_T>
t_data_slice<CTX_T>::~t_data_slice() {}

/**
 * @brief Returns the t_tscalar at the declared indices in the data slice,
 * or an invalid t_tscalar if the indices should be skipped.
 *
 * @param ridx row index into the slice
 * @param cidx column index into the slice
 *
 * @return t_tscalar a valid scalar containing the underlying data, or a new
 * t_tscalar initialized with an invalid flag.
 */
template <typename CTX_T>
t_tscalar
t_data_slice<CTX_T>::get(t_uindex ridx, t_uindex cidx) const {
    t_uindex idx = get_slice_idx(ridx, cidx);
    t_tscalar rv;
    if (idx >= m_slice->size()) {
        rv.clear();
    } else {
        rv = m_slice->at(idx);
    }
    return rv;
}

template <>
t_tscalar
t_data_slice<t_ctx2>::get(t_uindex ridx, t_uindex cidx) const {
    t_uindex idx = get_slice_idx(ridx, cidx);
    t_tscalar rv = m_slice->operator[](idx);
    /* if (m_column_indices.size() > 0) {
        t_uindex idx_skip_headers;
    } else {

    } */
    return rv;
}

template <typename CTX_T>
std::vector<t_tscalar>
t_data_slice<CTX_T>::get_row_path(t_uindex idx) const {
    return m_ctx->unity_get_row_path(idx);
}

template <typename CTX_T>
t_uindex
t_data_slice<CTX_T>::get_slice_idx(t_uindex ridx, t_uindex cidx) const {
    t_uindex idx = (ridx - m_start_row) * m_stride + (cidx - m_start_col);
    return idx;
}

// Getters
template <typename CTX_T>
std::shared_ptr<CTX_T>
t_data_slice<CTX_T>::get_context() const {
    return m_ctx;
}

template <typename CTX_T>
std::shared_ptr<std::vector<t_tscalar>>
t_data_slice<CTX_T>::get_slice() const {
    return m_slice;
}

template <typename CTX_T>
const std::vector<std::string>&
t_data_slice<CTX_T>::get_column_names() const {
    return m_column_names;
}

template <typename CTX_T>
const std::vector<t_uindex>&
t_data_slice<CTX_T>::get_column_indices() const {
    return m_column_indices;
}

template <typename CTX_T>
bool
t_data_slice<CTX_T>::is_column_only() const {
    return false;
}

template <>
bool
t_data_slice<t_ctx2>::is_column_only() const {
    auto config = m_ctx->get_config();
    return config.is_column_only();
}

template <typename CTX_T>
t_uindex
t_data_slice<CTX_T>::get_stride() const {
    return m_stride;
}

template <typename CTX_T>
t_get_data_extents
t_data_slice<CTX_T>::get_data_extents() const {
    auto nrows = m_ctx->get_row_count();
    auto ncols = m_ctx->get_column_count();
    t_get_data_extents ext = sanitize_get_data_extents(
        nrows, ncols, m_start_row, m_end_row, m_start_col, m_end_col);
    return ext;
}

// Explicitly instantiate data slice for each context
template class t_data_slice<t_ctx0>;
template class t_data_slice<t_ctx1>;
template class t_data_slice<t_ctx2>;
} // end namespace perspective