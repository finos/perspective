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
#include <perspective/raw_types.h>

namespace perspective {

struct PERSPECTIVE_EXPORT t_rlookup {
    t_rlookup();
    t_rlookup(t_uindex idx, bool exists);
    ~t_rlookup();
    t_uindex m_idx;
    bool m_exists;
};

} // end namespace perspective