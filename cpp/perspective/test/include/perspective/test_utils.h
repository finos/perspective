/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/base.h>
#include <perspective/first.h>
#include <perspective/data_table.h>
#include <perspective/config.h>
#include <cstdint>

namespace perspective
{

enum class t_do_pivot
{
    PIVOT_NON_PKEYED
};

template <typename CTX_T, typename PKEY_TYPE_T = std::int64_t,
    int PKEY_DTYPE = DTYPE_INT64>
std::shared_ptr<CTX_T>
do_pivot(t_do_pivot mode, const t_data_table& tbl, const t_config& cfg)
{
    PSP_VERBOSE_ASSERT(mode == t_do_pivot::PIVOT_NON_PKEYED, "Unexpected mode");
    auto copy = tbl.clone();
    auto op_col = copy->add_column("psp_op", DTYPE_UINT8, true);
    auto pkey_col
        = copy->add_column("psp_pkey", static_cast<t_dtype>(PKEY_DTYPE), true);
    for (t_uindex idx = 0, loop_end = tbl.size(); idx < loop_end; ++idx)
    {
        op_col->set_nth<std::uint8_t>(idx, OP_INSERT);
        pkey_col->set_nth<PKEY_TYPE_T>(idx, idx);
    }
    auto rv = std::make_shared<CTX_T>(copy->get_schema(), cfg);
    rv->init();
    rv->notify(*copy);
    return rv;
}

} // end namespace perspective