// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

#ifndef PSP_ENABLE_WASM
#ifdef __APPLE__

#include <perspective/first.h>
#include <perspective/compat.h>
#include <perspective/raii.h>
#include <perspective/raw_types.h>
#include <perspective/utils.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>
#include <cstdio>

namespace perspective {
static void map_file_internal_(
    const std::string& fname,
    t_fflag fflag,
    t_fflag fmode,
    t_fflag creation_disposition,
    t_fflag mprot,
    t_fflag mflag,
    bool is_read,
    t_uindex size,
    t_rfmapping& out
);

t_uindex
file_size(t_handle h) {
    struct stat st;
    t_index rcode = fstat(h, &st);
    PSP_VERBOSE_ASSERT(rcode, == 0, "Error in stat");
    return st.st_size;
}

void
close_file(t_handle h) {
    t_index rcode = close(h);
    PSP_VERBOSE_ASSERT(rcode, == 0, "Error closing file.");
}

void
flush_mapping(void* base, t_uindex len) {
    t_index rcode = msync(base, len, MS_SYNC);
    PSP_VERBOSE_ASSERT(rcode, != -1, "Error in msync");
}

t_rfmapping::~t_rfmapping() {
    t_index rcode = munmap(m_base, m_size);
    PSP_VERBOSE_ASSERT(rcode, == 0, "munmap failed.");

    rcode = close(m_fd);
    PSP_VERBOSE_ASSERT(rcode, == 0, "Error closing file.");
}

static void
map_file_internal_(
    const std::string& fname,
    t_fflag fflag,
    t_fflag fmode,
    t_fflag creation_disposition,
    t_fflag mprot,
    t_fflag mflag,
    bool is_read,
    t_uindex size,
    t_rfmapping& out
) {
    t_file_handle fh(open(fname.c_str(), fflag, fmode));

    PSP_VERBOSE_ASSERT(fh.valid(), "Error opening file");

    if (is_read) {
        size = file_size(fh.value());
    } else {
        t_index rcode = ftruncate(fh.value(), size);
        PSP_VERBOSE_ASSERT(rcode, >= 0, "ftruncate failed.");
    }

    void* ptr = mmap(nullptr, size, mprot, mflag, fh.value(), 0);

    PSP_VERBOSE_ASSERT(ptr, != MAP_FAILED, "error in mmap");

    t_handle fd = fh.value();
    fh.release();

    out.m_fd = fd;
    out.m_base = ptr;
    out.m_size = size;
}

void
map_file_read(const std::string& fname, t_rfmapping& out) {
    map_file_internal_(
        fname,
        O_RDONLY,
        S_IRUSR,
        0, // no disposition
        PROT_READ,
        MAP_SHARED,
        true,
        0,
        out
    );
}

void
map_file_write(const std::string& fname, t_uindex size, t_rfmapping& out) {
    return map_file_internal_(
        fname,
        O_RDWR | O_TRUNC | O_CREAT,
        S_IRUSR | S_IWUSR,
        0, // no disposition
        PROT_WRITE | PROT_READ,
        MAP_SHARED,
        false,
        size,
        out
    );
}

std::int64_t
psp_curtime() {
    // CLOCK_MONOTONIC and clock_gettime are not implemented in OSX < 10.12,
    // and it breaks builds on conda-forge. Because this method is only called
    // in logging and trace functions that are not called in the codebase,
    // deprecate this method for OSX and return 0.

    // struct timespec t;
    // std::int32_t rcode = clock_gettime(CLOCK_MONOTONIC, &t);
    // PSP_VERBOSE_ASSERT(rcode, == 0, "Failure in clock_gettime");
    // std::int64_t ns = t.tv_nsec + t.tv_sec * 1000000000;
    return 0;
}

std::int64_t
get_page_size() {
    static std::int64_t pgsize = getpagesize();
    return pgsize;
}

std::int64_t
psp_curmem() {
    static double multiplier = getpagesize() / 1024000.;

    struct t_statm {
        long int m_size, m_resident, m_share, m_text, m_lib, m_data, m_dt;
    };

    t_statm result;

    const char* statm_path = "/proc/self/statm";

    FILE* f = fopen(statm_path, "r");
    if (f == nullptr) {
        perror(statm_path);
        abort();
    }

    PSP_VERBOSE_ASSERT(
        fscanf(
            f,
            "%ld %ld %ld %ld %ld %ld %ld",
            &result.m_size,
            &result.m_resident,
            &result.m_share,
            &result.m_text,
            &result.m_lib,
            &result.m_data,
            &result.m_dt
        ) == 7,
        "Failed to read memory size"
    );
    fclose(f);
    return result.m_resident * multiplier;
}

void
set_thread_name(std::thread& thr, const std::string& name) {
#ifdef PSP_PARALLEL_FOR
    pthread_setname_np(name.c_str());
#endif
}

void
set_thread_name(const std::string& name) {
    // prctl(PR_SET_NAME, name.c_str(), 0, 0, 0);
    PSP_COMPLAIN_AND_ABORT("Not implemented");
}

void
rmfile(const std::string& fname) {
    unlink(fname.c_str());
}

void
launch_proc(const std::string& cmdline) {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
}

std::string
cwd() {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return "";
}

void*
psp_dbg_malloc(size_t size) {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return nullptr;
}

void
psp_dbg_free(void* mem) {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
}

} // end namespace perspective
#endif
#endif
