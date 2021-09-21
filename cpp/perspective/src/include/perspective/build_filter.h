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
#include <perspective/filter.h>
#include <perspective/data_table.h>
#include <perspective/mask.h>
#include <perspective/comparators.h>

namespace perspective {

template <typename DATA_T, int DTYPE_T, typename OPERATOR_T>
void
fop_apply(const t_data_table& tbl, const std::string& colname, t_mask& mask,
    DATA_T reference_value) {}

template <typename DATA_T, int DTYPE_T, typename OPERATOR_T>
void
fop_apply(const t_data_table& tbl, const std::string& colname, t_mask& mask,
    const std::set<DATA_T, t_filter_comparator<DATA_T>>& reference_values) {}

template <typename CTYPE_T, int DTYPE_T>
void
apply_filters_helper(const t_data_table& tbl, const std::string& column,
    t_mask& mask, t_tscalar threshold, const t_fterm& filter) {
    CTYPE_T thr = threshold.get<CTYPE_T>();

    switch (filter.m_op) {
        case FILTER_OP_LT: {
            fop_apply<CTYPE_T, DTYPE_T, t_operator_lt<CTYPE_T>>(

                tbl, column, mask, thr);
        } break;
        case FILTER_OP_LTEQ: {
            fop_apply<CTYPE_T, DTYPE_T, t_operator_lteq<CTYPE_T>>(

                tbl, column, mask, thr);
        } break;
        case FILTER_OP_GT: {
            fop_apply<CTYPE_T, DTYPE_T, t_operator_gt<CTYPE_T>>(

                tbl, column, mask, thr);
        } break;
        case FILTER_OP_GTEQ: {
            fop_apply<CTYPE_T, DTYPE_T, t_operator_gteq<CTYPE_T>>(

                tbl, column, mask, thr);
        } break;
        case FILTER_OP_NE: {
            fop_apply<CTYPE_T, DTYPE_T, t_operator_ne<CTYPE_T>>(

                tbl, column, mask, thr);
        } break;
        case FILTER_OP_EQ: {
            fop_apply<CTYPE_T, DTYPE_T, t_operator_eq<CTYPE_T>>(

                tbl, column, mask, thr);
        } break;
        case FILTER_OP_BEGINS_WITH:
        case FILTER_OP_ENDS_WITH:
        case FILTER_OP_CONTAINS:
            break;
        case FILTER_OP_IN: {
            std::set<CTYPE_T, t_filter_comparator<CTYPE_T>> values;
            for (t_uindex fidx = 0, loop_end = filter.m_bag.size();

                 fidx < loop_end; ++fidx) {
                values.insert(filter
                                  .m_bag[fidx]

                                  .get<CTYPE_T>());
            }
            fop_apply<CTYPE_T, DTYPE_T, t_operator_in<CTYPE_T, DTYPE_T>>(

                tbl, column, mask, values);
        } break;
        case FILTER_OP_NOT_IN: {
            std::set<CTYPE_T, t_filter_comparator<CTYPE_T>> values;
            for (t_uindex fidx = 0, loop_end = filter.m_bag.size();

                 fidx < loop_end; ++fidx) {
                values.insert(filter
                                  .m_bag[fidx]

                                  .get<CTYPE_T>());
            }
            fop_apply<CTYPE_T, DTYPE_T, t_operator_not_in<CTYPE_T, DTYPE_T>>(

                tbl, column, mask, values);
        } break;
        default: {
            PSP_COMPLAIN_AND_ABORT("Unknown filter_op detected");
        }
    };
}

t_mask apply_filters(
    const t_data_table& tbl, const std::vector<t_fterm>& filters);

} // end namespace perspective
