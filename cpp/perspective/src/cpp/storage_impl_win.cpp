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
#include <perspective/raw_types.h>
#include <perspective/storage.h>
#include <perspective/raii.h>
#include <perspective/defaults.h>
#include <perspective/compat.h>
#include <perspective/utils.h>
#include <iostream>
#include <assert.h>
#include <csignal>
#include <iostream>
#include <map>
#include <sstream>
#include <vector>
#include <csignal>

namespace perspective {

t_lstore::t_lstore(const t_lstore_recipe& a)
    : m_dirname(a.m_dirname)
    , m_colname(a.m_colname)
    , m_base(0)
    , m_fd(0)
    , m_capacity(a.m_capacity)
    , m_size(0)
    , m_alignment(a.m_alignment)
    , m_fflags(a.m_fflags)
    , m_fmode(a.m_fmode)
    , m_creation_disposition(a.m_creation_disposition)
    , m_mprot(a.m_mprot)
    , m_mflags(a.m_mflags)
    , m_backing_store(a.m_backing_store)
    , m_init(false)
    , m_resize_factor(1.3)
    , m_version(0)
    , m_from_recipe(a.m_from_recipe) {
    if (m_from_recipe) {
        m_fname = a.m_fname;
        return;
    }

    if (m_backing_store == BACKING_STORE_DISK) {
        std::stringstream ss;
        ss << a.m_dirname << "\\"
           << "_col_" << a.m_colname << "_" << this;
        m_fname = unique_path(ss.str());
    }
}

t_handle
t_lstore::create_file() {
    t_handle rval = CreateFile(m_fname.c_str(), m_fflags, m_fmode,
        0, // security
        m_creation_disposition, FILE_ATTRIBUTE_NORMAL,
        0 // template file
    );

    PSP_VERBOSE_ASSERT(rval != INVALID_HANDLE_VALUE, "Error opening file");

    if (m_from_recipe)
        return rval;

    LARGE_INTEGER sz;
    sz.QuadPart = capacity();

    auto rb = SetFilePointerEx(rval, sz, 0, FILE_BEGIN);
    PSP_VERBOSE_ASSERT(rb, "Error setting fpointer");

    rb = SetEndOfFile(rval);
    PSP_VERBOSE_ASSERT(rb, "Error setting eof");

    return rval;
}

void*
t_lstore::create_mapping() {
    std::pair<std::uint32_t, std::uint32_t> capacity = capacity_pair();

    m_winmapping_handle = CreateFileMapping(m_fd,
        0, // default security
        m_mprot, capacity.first, capacity.second,
        0 // anonymous mapping
    );

    PSP_VERBOSE_ASSERT(m_winmapping_handle != 0, "Error creating filemapping");

    void* ptr = MapViewOfFile(m_winmapping_handle, m_mflags,
        0, // 0 offset
        0, // 0 offset
        0  // entire file
    );

    PSP_VERBOSE_ASSERT(ptr != 0, "Error mapping file");

    return ptr;
}

void
t_lstore::resize_mapping(t_uindex cap_new) {
    flush_mapping(m_base, capacity());
    destroy_mapping();

    // TODO error handling
    CloseHandle(m_winmapping_handle);

    LARGE_INTEGER sz;
    sz.QuadPart = cap_new;

    auto rb = SetFilePointerEx(m_fd, sz, 0, FILE_BEGIN);
    PSP_VERBOSE_ASSERT(rb, "Error setting fpointer");

    rb = SetEndOfFile(m_fd);
    PSP_VERBOSE_ASSERT(rb, "Error setting eof");

    m_capacity = cap_new;
    m_base = create_mapping();
}

void
t_lstore::destroy_mapping() {
    auto rc = UnmapViewOfFile(m_base);
    PSP_VERBOSE_ASSERT(rc, "Error unmapping view");
    m_base = 0;
}

void
t_lstore::freeze_impl() {
    DWORD dwOld;
    if (VirtualProtect((LPVOID)this, static_cast<size_t>(get_page_size()),
            PAGE_READONLY, &dwOld)
        == 0) {
        std::cout << "Virtual protect failed addr => " << this
                  << " error code => " << GetLastError() << std::endl;
        PSP_VERBOSE_ASSERT(false, "virtual protect failed");
    }
}

void
t_lstore::unfreeze_impl() {
    DWORD dwOld;
    if (VirtualProtect((LPVOID)this, static_cast<size_t>(get_page_size()),
            PAGE_READWRITE, &dwOld)
        == 0) {
        std::cout << "Virtual protect failed addr => " << this
                  << " error code => " << GetLastError() << std::endl;
        PSP_VERBOSE_ASSERT(false, "virtual protect failed");
    }
}

} // end namespace perspective

#endif
