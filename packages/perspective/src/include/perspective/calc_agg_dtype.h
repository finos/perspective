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
#include <perspective/schema.h>
#include <perspective/aggspec.h>
#include <perspective/exports.h>

namespace perspective
{

PERSPECTIVE_EXPORT t_dtype calc_agg_dtype(const t_schema& schema,
                                          const t_aggspec& spec);

} // end namespace perspective
