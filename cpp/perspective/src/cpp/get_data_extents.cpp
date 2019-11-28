/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#include <perspective/first.h>
#include <perspective/get_data_extents.h>

namespace perspective {
t_get_data_extents
sanitize_get_data_extents(t_index nrows, t_index ncols, t_index start_row,
    t_index end_row, t_index start_col, t_index end_col) {
    start_row = std::min(start_row, nrows);
    end_row = std::min(end_row, nrows);

    start_row = std::max(t_index(0), start_row);
    end_row = std::max(t_index(0), end_row);
    end_row = std::max(start_row, end_row);

    start_col = std::min(start_col, ncols);
    end_col = std::min(end_col, ncols);

    start_col = std::max(t_index(0), start_col);
    end_col = std::max(t_index(0), end_col);
    end_col = std::max(start_col, end_col);

    t_get_data_extents rval;
    rval.m_srow = start_row;
    rval.m_erow = end_row;
    rval.m_scol = start_col;
    rval.m_ecol = end_col;

    return rval;
}
} // namespace perspective
