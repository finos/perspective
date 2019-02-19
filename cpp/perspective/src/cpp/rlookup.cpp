/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/rlookup.h>

namespace perspective {
t_rlookup::t_rlookup(t_uindex idx, bool exists)
    : m_idx(idx)
    , m_exists(exists) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_rlookup");
}

t_rlookup::t_rlookup() {}

t_rlookup::~t_rlookup() {
    PSP_TRACE_SENTINEL();
    LOG_DESTRUCTOR("t_rlookup");
}
} // namespace perspective