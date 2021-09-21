/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#ifdef WIN32
#include <perspective/portable.h>
#include <perspective/first.h>
#include <perspective/raw_types.h>
#include <perspective/compat.h>
#include <perspective/raii.h>
#include <perspective/utils.h>
#include <cstdio>
#include <psapi.h>
#include <cstdint>

namespace perspective {

static void map_file_internal_(const std::string& fname, t_fflag fflag,
    t_fflag fmode, t_fflag creation_disposition, t_fflag mprot, t_fflag mflag,
    bool is_read, t_uindex size, t_rfmapping& out);

t_uindex
file_size(t_handle h) {
    LARGE_INTEGER sz;
    BOOL rb = GetFileSizeEx(h, &sz);
    PSP_VERBOSE_ASSERT(rb != 0, "Error getting filesize.");
    return sz.QuadPart;
}

void
close_file(t_handle h) {
    BOOL rb = CloseHandle(h);
    PSP_VERBOSE_ASSERT(rb != 0, "Error closing file");
}

void
flush_mapping(void* base, t_uindex len) {
    BOOL rb = FlushViewOfFile(base, size_t(len));
    PSP_VERBOSE_ASSERT(rb != 0, "Error flushing view");
}

t_rfmapping::~t_rfmapping() {
    BOOL rb = UnmapViewOfFile(m_base);
    PSP_VERBOSE_ASSERT(rb != 0, "Error unmapping view");

    close_file(m_fd);
}

static void
map_file_internal_(const std::string& fname, t_fflag fflag, t_fflag fmode,
    t_fflag creation_disposition, t_fflag mprot, t_fflag mflag, bool is_read,
    t_uindex size, t_rfmapping& out) {
    t_file_handle fh(CreateFile(fname.c_str(), fflag, FILE_SHARE_READ,
        0, // security
        creation_disposition, FILE_ATTRIBUTE_NORMAL,
        0 // template file
        ));

    PSP_VERBOSE_ASSERT(fh.valid(), "Error opening file");

    if (is_read) {
        size = file_size(fh.value());
    } else {
        LARGE_INTEGER sz;
        sz.QuadPart = size;

        auto rb = SetFilePointerEx(fh.value(), sz, 0, FILE_BEGIN);
        PSP_VERBOSE_ASSERT(rb, "Error setting fpointer");

        rb = SetEndOfFile(fh.value());
        PSP_VERBOSE_ASSERT(rb, "Error setting eof");
    }

    t_handle m = CreateFileMapping(fh.value(),
        0, // default security
        mprot, upper32(size), lower32(size),
        0 // anonymous mapping
    );

    PSP_VERBOSE_ASSERT(m != 0, "Error creating filemapping");

    void* ptr = MapViewOfFile(m, mflag,
        0, // 0 offset
        0, // 0 offset
        0  // entire file
    );

    PSP_VERBOSE_ASSERT(ptr != 0, "Error mapping file");

    // Handle is safe to close once view is
    // created for it
    CloseHandle(m);

    t_handle fd = fh.value();
    fh.release();

    out.m_fd = fd;
    out.m_base = ptr;
    out.m_size = size;
}

void
map_file_read(const std::string& fname, t_rfmapping& out) {
    map_file_internal_(fname, GENERIC_READ,
        0, // unused
        OPEN_EXISTING, PAGE_READONLY, FILE_MAP_READ, true, 0, out);
}

void
map_file_write(const std::string& fname, t_uindex size, t_rfmapping& out) {
    map_file_internal_(fname, GENERIC_READ | GENERIC_WRITE,
        0, // unused
        CREATE_ALWAYS, PAGE_READWRITE, FILE_MAP_WRITE, false,
        static_cast<size_t>(size), out);
}

int64_t
psp_curtime() {
    return GetTickCount() * static_cast<int64_t>(1000000);
}

int64_t
psp_curmem() {
    PROCESS_MEMORY_COUNTERS mem;
    GetProcessMemoryInfo(GetCurrentProcess(), &mem, sizeof(mem));
    return mem.WorkingSetSize / 1024;
}

#pragma pack(push, 8)
typedef struct t_win_thrstruct {
    DWORD dwType;     // Must be 0x1000.
    LPCSTR szName;    // Pointer to name (in user addr space).
    DWORD dwThreadID; // Thread ID (-1=caller thread).
    DWORD dwFlags;    // Reserved for future use, must be zero.
} THREADNAME_INFO;
#pragma pack(pop)

static void
set_thread_name_win(uint32_t thrid, const std::string& name) {
    const DWORD MS_VC_EXCEPTION = 0x406D1388;
    t_win_thrstruct thrstruct;
    thrstruct.dwType = 0x1000;
    thrstruct.szName = name.c_str();
    thrstruct.dwThreadID = thrid;
    thrstruct.dwFlags = 0;

    SUPPRESS_WARNINGS_VC(6320 6322)
    __try {
        RaiseException(MS_VC_EXCEPTION, 0,
            sizeof(thrstruct) / sizeof(ULONG_PTR), (ULONG_PTR*)&thrstruct);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
    }
    RESTORE_WARNINGS_VC()
}

void
set_thread_name(std::thread& thr, const std::string& name) {
    auto thrid = ::GetThreadId(static_cast<HANDLE>(thr.native_handle()));
    set_thread_name_win(thrid, name);
}

void
set_thread_name(const std::string& name) {
    set_thread_name_win(GetCurrentThreadId(), name);
}

void
rmfile(const std::string& fname) {
    DeleteFile(fname.c_str());
}

void
launch_proc(const std::string& cmdline) {
    STARTUPINFO si;
    PROCESS_INFORMATION pi;

    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    if (!CreateProcess(NULL, // No module name (use command line)
            const_cast<char*>(cmdline.c_str()), // Command line
            NULL,  // Process handle not inheritable
            NULL,  // Thread handle not inheritable
            FALSE, // Set handle inheritance to FALSE
            0,     // No creation flags
            NULL,  // Use parent's environment block
            NULL,  // Use parent's starting directory
            &si,   // Pointer to STARTUPINFO structure
            &pi)   // Pointer to PROCESS_INFORMATION structure
    ) {
        std::cout << "CreateProcess failed => " << GetLastError() << std::endl;
        return;
    }

    // Wait until child process exits.
    WaitForSingleObject(pi.hProcess, INFINITE);

    // Close process and thread handles.
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
}

std::string
cwd() {
    char path[FILENAME_MAX];
    auto rc = GetCurrentDirectory(FILENAME_MAX, path);
    PSP_VERBOSE_ASSERT(rc, "Error in cwd");
    return std::string(path);
}

int64_t
get_page_size() {
    SYSTEM_INFO info;
    GetSystemInfo(&info);
    return info.dwPageSize;
}

void*
psp_dbg_malloc(size_t size) {
    SYSTEM_INFO sys_info;
    GetSystemInfo(&sys_info);
    auto page = 2 * sys_info.dwPageSize;
    assert((page & (static_cast<size_t>(page) - 1)) == 0);
    auto rounded_size
        = (size + static_cast<size_t>(page) - 1) & (-static_cast<size_t>(page));
    BYTE* start = (BYTE*)VirtualAlloc(
        NULL, rounded_size + page, MEM_COMMIT, PAGE_READWRITE);
    DWORD old_protect;
    BOOL res = VirtualProtect(
        start + rounded_size, page, PAGE_NOACCESS, &old_protect);
    assert(res);
    UNREFERENCED_PARAMETER(res);
    return start + (rounded_size - size);
}

void
psp_dbg_free(void* mem) {
    VirtualFree(mem, 0, MEM_RELEASE);
}

void*
psp_page_aligned_malloc(int64_t size) {
    return _aligned_malloc(
        static_cast<size_t>(size), static_cast<size_t>(get_page_size()));
}

void
psp_page_aligned_free(void* mem) {
    _aligned_free(mem);
}

} // end namespace perspective

#endif
