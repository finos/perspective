/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/build_filter.h>
#include <perspective/comparators.h>

namespace perspective {

t_mask
apply_filters(const t_data_table& tbl, const std::vector<t_fterm>& filters) {
    t_mask mask(tbl.size());

    // If filters are defined
    if (filters.size() > 0) {

        // init indices
        for (int i = 0, loop_end = filters.size(); i < loop_end; i++) {
            const t_fterm& filter = filters[i];
            const std::string& column = filter.m_colname;
            t_dtype coltype = tbl.get_dtype(column);
            t_tscalar threshold = filter.m_threshold;

            if (coltype == DTYPE_STR) {
                PSP_COMPLAIN_AND_ABORT("Not implemented");
                continue;
            }

            switch (coltype) {
                case DTYPE_INT64: {
                    apply_filters_helper<std::int64_t, DTYPE_INT64>(
                        tbl, column, mask, threshold, filter);
                } break;
                case DTYPE_INT32: {
                    apply_filters_helper<std::int32_t, DTYPE_INT32>(
                        tbl, column, mask, threshold, filter);
                } break;
                case DTYPE_FLOAT64: {
                    apply_filters_helper<double, DTYPE_FLOAT64>(
                        tbl, column, mask, threshold, filter);
                } break;
                case DTYPE_FLOAT32: {
                    apply_filters_helper<float, DTYPE_FLOAT32>(
                        tbl, column, mask, threshold, filter);
                } break;
                case DTYPE_BOOL: {
                    apply_filters_helper<bool, DTYPE_BOOL>(
                        tbl, column, mask, threshold, filter);
                } break;
                case DTYPE_DATE: {
                    apply_filters_helper<std::uint32_t, DTYPE_DATE>(
                        tbl, column, mask, threshold, filter);
                } break;
                case DTYPE_TIME: {
                    apply_filters_helper<std::int64_t, DTYPE_TIME>(
                        tbl, column, mask, threshold, filter);
                } break;
                default: {
                    PSP_COMPLAIN_AND_ABORT("Unknown dtype");
                }
            }
        }
    }

    return mask;
}

} // end namespace perspective
