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
#include <perspective/tracing.h>
#include <perspective/compat.h>
#include <sys/types.h>
#include <sys/syscall.h>
#include <sys/resource.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdlib.h>
#include <stdio.h>
#include <sstream>
#include <cxxabi.h>
#include <fstream>
#include <tsl/hopscotch_set.h>
#include <execinfo.h>
#include <cstring>

#define THR_BUFFER_NELEMS 1000000
#define THR_MAX_FUNCNAME_LEN 16000;

static thread_local perspective::t_instrec th_trace_buffer[THR_BUFFER_NELEMS];
static thread_local perspective::std::int32_t th_traceidx;
static thread_local FILE* th_file;

namespace perspective {
t_trace::t_trace() { write_record(TRACE_TYPE_FNTRACE_BEGIN); }

t_trace::~t_trace() { write_record(TRACE_TYPE_FNTRACE_END); }

void
t_trace::write_record(t_trace_type ttype) const {
    if (th_traceidx == THR_BUFFER_NELEMS) {
        flush_thbuffer(THR_BUFFER_NELEMS);
        th_traceidx = 0;
    }
    t_instrec* ptr = th_trace_buffer + th_traceidx;
    ptr = th_trace_buffer + th_traceidx;
    ptr->m_trace_type = ttype;
    ptr->m_time = psp_curtime();
    ptr->t_fntrace.m_fn
        = __builtin_extract_return_addr(__builtin_return_address(0));
    ++th_traceidx;
}

t_uindex
get_instrec_size() {
    return sizeof(t_instrec);
}

} // end namespace perspective
