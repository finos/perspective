/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#ifdef WIN32
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raii.h>

namespace perspective {

t_file_handle::~t_file_handle() {
    if (valid()) {
        auto rb = CloseHandle(m_value);
        PSP_VERBOSE_ASSERT(rb, "Error closing file");
    }
}

bool
t_file_handle::valid() const {
    return m_value != INVALID_HANDLE_VALUE;
}

void
t_file_handle::release() {
    m_value = INVALID_HANDLE_VALUE;
}

t_mmap_handle::~t_mmap_handle() {
    if (valid()) {
        auto rc = UnmapViewOfFile(m_value);
        PSP_VERBOSE_ASSERT(rc, "Error unmapping view");
    }
}

bool
t_mmap_handle::valid() {
    return m_value != 0;
}

} // end namespace perspective

#endif