/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/exports.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/scalar.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>

namespace perspective {
/**
 * @class t_data_slice
 *
 * @brief t_data_slice contains a slice of the View's underlying data
 * with the metadata required to correctly parse it.
 *
 * - m_view: a reference to the view from which we output data
 * - m_slice: a reference to a vector of t_tscalar objects containing data
 * - m_column_names: a reference to a vector of string column names from the view.
 * - m_column_indices: an optional reference to a vector of t_uindex column indices, which
 * we use for column-pivoted views.
 *
 */
template <typename CTX_T>
class PERSPECTIVE_EXPORT t_data_slice {
public:
    t_data_slice(std::shared_ptr<CTX_T> ctx, std::shared_ptr<std::vector<t_tscalar>> slice,
        std::shared_ptr<std::vector<std::string>> column_names);

    t_data_slice(std::shared_ptr<CTX_T> ctx, std::shared_ptr<std::vector<t_tscalar>> slice,
        std::shared_ptr<std::vector<std::string>> column_names,
        std::shared_ptr<std::vector<t_uindex>> column_indices);

    ~t_data_slice();

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
    t_tscalar get(t_uindex ridx, t_uindex cidx);

    std::shared_ptr<CTX_T> get_context() const;
    std::shared_ptr<std::vector<t_tscalar>> get_slice() const;
    std::shared_ptr<std::vector<std::string>> get_column_names() const;
    std::shared_ptr<std::vector<t_uindex>> get_column_indices() const;
    bool is_column_only() const;

private:
    std::shared_ptr<CTX_T> m_ctx;
    std::shared_ptr<std::vector<t_tscalar>> m_slice;
    std::shared_ptr<std::vector<std::string>> m_column_names;
    std::shared_ptr<std::vector<t_uindex>> m_column_indices;
};
} // end namespace perspective
