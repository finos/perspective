/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/compat.h>
#include <perspective/raii.h>
#include <perspective/utils.h>

#ifndef WIN32
#include <sys/mman.h>
#include <fcntl.h>
#endif

namespace perspective {

std::pair<std::uint32_t, std::uint32_t>
file_size_pair(t_handle h) {
    t_uindex sz = file_size(h);
    return std::pair<std::uint32_t, std::uint32_t>(upper32(sz), lower32(sz));
}

t_rfmapping::t_rfmapping() {}

t_rfmapping::t_rfmapping(t_handle fd, void* base, t_uindex size)
    : m_fd(fd)
    , m_base(base)
    , m_size(size) {}

} // end namespace perspective
