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
const int META_NBYTES = 1;

enum t_meta_mode
{
    META_MODE_MISSING,
    META_MODE_STR_IMM,
    META_MODE_STR_ENUM
};
}
