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
#include <perspective/config.h>
#include <perspective/data_table.h>
#include <perspective/mask.h>

namespace perspective {

inline t_mask
filter_table_for_config(const t_data_table& tbl, const t_config& config) {

    switch (config.get_fmode()) {
        case FMODE_SIMPLE_CLAUSES: {
            return tbl.filter_cpp(config.get_combiner(), config.get_fterms());
        } break;
        default: {
        }
    }

    return t_mask(tbl.size());
}

} // end namespace perspective
