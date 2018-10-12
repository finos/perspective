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
#include <perspective/raw_types.h>

namespace perspective {

struct t_get_data_extents {
    t_tvidx m_srow;
    t_tvidx m_erow;
    t_tvidx m_scol;
    t_tvidx m_ecol;
};

template <typename CONTEXT_T>
t_get_data_extents
sanitize_get_data_extents(const CONTEXT_T& ctx, t_tvidx start_row, t_tvidx end_row,
    t_tvidx start_col, t_tvidx end_col) {
    t_index ncols = ctx.get_column_count();

    start_row = std::min(start_row, ctx.get_row_count());
    end_row = std::min(end_row, ctx.get_row_count());

    start_row = std::max(t_tvidx(0), start_row);
    end_row = std::max(t_tvidx(0), end_row);
    end_row = std::max(start_row, end_row);

    start_col = std::min(start_col, ncols);
    end_col = std::min(end_col, ncols);

    start_col = std::max(t_tvidx(0), start_col);
    end_col = std::max(t_tvidx(0), end_col);
    end_col = std::max(start_col, end_col);

    t_get_data_extents rval;
    rval.m_srow = start_row;
    rval.m_erow = end_row;
    rval.m_scol = start_col;
    rval.m_ecol = end_col;

    return rval;
}
} // namespace perspective
