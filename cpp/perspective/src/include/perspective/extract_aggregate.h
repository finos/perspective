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
#include <perspective/scalar.h>
#include <perspective/column.h>
#include <perspective/aggspec.h>
#include <perspective/base.h>

namespace perspective {

t_tscalar extract_aggregate(const t_aggspec& aggspec, const t_column* aggcol,
    t_uindex ridx, t_index pridx);
} // end namespace perspective
