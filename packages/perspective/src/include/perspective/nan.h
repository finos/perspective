/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

namespace perspective
{

enum t_nan_handling_mode
{
    NAN_HANDLING_MODE_CANONICAL_SUBSTITUTE,
    NAN_HANDLING_MODE_PROPAGATE_NANS,
    NAN_HANDLING_MODE_IGNORE_NANS
};

enum t_nan_sorting_mode
{
    // leave nans alone and allow
    // underlying sort to handle
    // them as they see fit
    NAN_SORTING_MODE_PASSTHROUGH,

    // nans should sort as being
    // smaller than any other
    // value
    NAN_SORTING_MODE_NAN_LT
};

} // end namespace perspective
