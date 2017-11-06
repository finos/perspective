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
#include <perspective/table.h>
#include <perspective/mask.h>

namespace perspective
{

inline t_mask
filter_table_for_config(const t_table& tbl, const t_config& config)
{

    switch (config.get_fmode())
    {
#ifdef PSP_ENABLE_PYTHON
        case FMODE_JIT_EXPR:
        {
            t_mask msk(tbl.size());
            if (tbl.is_pkey_table())
            {
                config.get_pkeyed_jit()->invoke_filter(tbl, msk);
            }
            else
            {
                config.get_non_pkeyed_jit()->invoke_filter(tbl, msk);
            }
            return msk;
        }
        break;
#endif
        case FMODE_SIMPLE_CLAUSES:
        {
            return tbl.filter_cpp(config.get_combiner(),
                                  config.get_fterms());
        }
        break;
        default:
        {
        }
    }

    return t_mask(tbl.size());
}

} // end namespace perspective
