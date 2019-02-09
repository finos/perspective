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
#include <perspective/base.h>

namespace perspective {

class t_file_handle {
    t_handle m_value;

public:
    t_file_handle(t_handle value);
    ~t_file_handle();
    t_handle value();
    bool valid() const;
    void release();
};

class t_mmap_handle {
    void* m_value;
    t_uindex m_len;

public:
    t_mmap_handle(void* value, t_uindex len);
    ~t_mmap_handle();
    void* value();
    t_uindex len() const;
    bool valid();
};

} // end namespace perspective
