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

namespace perspective
{

t_uindex file_size(t_handle h);
void close_file(t_handle h);
void flush_mapping(void* base, t_uindex len);
void rmfile(const t_str& fname);

struct t_rfmapping
{
    t_rfmapping();
    t_rfmapping(t_handle fd, void* base, t_uindex size);
    ~t_rfmapping();

    t_handle m_fd;
    void* m_base;
    t_uindex m_size;

    PSP_NON_COPYABLE(t_rfmapping);
};

void map_file_read(const t_str& fname, t_rfmapping& out);
void map_file_write(const t_str& fname, t_uindex size, t_rfmapping& out);

void set_thread_name(std::thread& thr, const t_str& name);
void set_thread_name(const t_str& name);

void launch_proc(const t_str& cmdline);

t_str cwd();

PERSPECTIVE_EXPORT t_int64 get_page_size();
PERSPECTIVE_EXPORT t_int64 psp_curtime();
PERSPECTIVE_EXPORT t_int64 psp_curmem();

PERSPECTIVE_EXPORT void* psp_dbg_malloc(size_t size);
PERSPECTIVE_EXPORT void psp_dbg_free(void* mem);

PERSPECTIVE_EXPORT void* psp_page_aligned_malloc(t_int64 size);
PERSPECTIVE_EXPORT void psp_page_aligned_free(void* mem);

} // end namespace perspective
