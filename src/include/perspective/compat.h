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
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <thread>
#ifndef WIN32
#include <sys/mman.h>
#endif

namespace perspective {

t_uindex file_size(t_handle h);
void close_file(t_handle h);
void flush_mapping(void* base, t_uindex len);
void rmfile(const std::string& fname);

struct t_rfmapping {
    t_rfmapping();
    t_rfmapping(t_handle fd, void* base, t_uindex size);
    ~t_rfmapping();

    t_handle m_fd;
    void* m_base;
    t_uindex m_size;

    PSP_NON_COPYABLE(t_rfmapping);
};

void map_file_read(const std::string& fname, t_rfmapping& out);
void map_file_write(const std::string& fname, t_uindex size, t_rfmapping& out);

void set_thread_name(std::thread& thr, const std::string& name);
void set_thread_name(const std::string& name);

void launch_proc(const std::string& cmdline);

std::string cwd();

PERSPECTIVE_EXPORT std::int64_t get_page_size();
PERSPECTIVE_EXPORT std::int64_t psp_curtime();
PERSPECTIVE_EXPORT std::int64_t psp_curmem();

PERSPECTIVE_EXPORT void* psp_dbg_malloc(size_t size);
PERSPECTIVE_EXPORT void psp_dbg_free(void* mem);

PERSPECTIVE_EXPORT void* psp_page_aligned_malloc(std::int64_t size);
PERSPECTIVE_EXPORT void psp_page_aligned_free(void* mem);

} // end namespace perspective
