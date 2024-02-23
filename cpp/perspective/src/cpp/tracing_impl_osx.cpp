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

#ifdef __APPLE__
#include <perspective/first.h>
#include <perspective/tracing.h>
#include <perspective/tracing_impl_linux.h>

extern "C" {

__attribute__((__constructor__)) void
th_trace_init() {
    using namespace std;
    using namespace perspective;
    if (!th_file) {
        pid_t pid = getpid();
        pid_t tid = syscall(__NR_gettid);
        std::stringstream ss;
        ss << "psptrace_" << pid << "_" << tid << ".trace";
        th_file = fopen(ss.str().c_str(), "wb");
        PSP_VERBOSE_ASSERT(th_file != 0, "Unable to open trace file");
    } else {
        PSP_COMPLAIN_AND_ABORT("Thread file unexpectedly non null");
    }
}

__attribute__((__destructor__)) void
th_trace_fini() {
    using namespace std;
    using namespace perspective;
    flush_thbuffer(th_traceidx);
    fclose(th_file);

    pid_t pid = getpid();
    pid_t tid = syscall(__NR_gettid);

    std::stringstream sso;
    sso << "psptrace_" << pid << "_" << tid << ".syms";
    std::ofstream of(sso.str());

    std::stringstream ssi;
    ssi << "psptrace_" << pid << "_" << tid << ".trace";

    int ifd = open(ssi.str().c_str(), O_RDONLY);
    PSP_VERBOSE_ASSERT(ifd != -1, "Error opening file");

    struct stat fb;
    fstat(ifd, &fb);

    uint64_t ifsize = fb.st_size;

    if (ifsize == 0) {
        return;
    }

    void* iptr = mmap(0, ifsize, PROT_READ, MAP_SHARED, ifd, 0);

    PSP_VERBOSE_ASSERT(iptr != MAP_FAILED, "Error in mmap");
    PSP_VERBOSE_ASSERT(
        ifsize % sizeof(t_instrec) == 0, "Partial record encountered"
    );

    std::int64_t ndrecs = ifsize / sizeof(t_instrec);

    t_instrec* irecs = static_cast<t_instrec*>(iptr);

    tsl::hopscotch_set<void*> fptrs;

    for (t_index idx = 0; idx < ndrecs; ++idx) {
        t_instrec* irec = irecs + idx;
        fptrs.emplace(irec->t_fntrace.m_fn);
    }

    for (tsl::hopscotch_set<void*>::const_iterator iter = fptrs.begin();
         iter != fptrs.end();
         ++iter) {

        of << *iter << " ";
        char** mangled;
        void* code_arr[1];
        code_arr[0] = *iter;
        char** stack_strings = backtrace_symbols(code_arr, 1);

        size_t sz = THR_MAX_FUNCNAME_LEN;

        char* function = static_cast<char*>(malloc(sz));
        char *begin = 0, *end = 0;
        for (char* j = stack_strings[0]; *j; ++j) {
            if (*j == '(') {
                begin = j;
            } else if (*j == '+') {
                end = j;
            }
        }
        if (begin && end) {

            *begin++ = ' ';
            *end = '\0';
            int status;
            char* ret = abi::__cxa_demangle(begin, function, &sz, &status);
            if (ret) {
                function = ret;
            } else {
                std::strncpy(function, begin, sz);
                std::strncat(function, "()", sz);
                function[sz - 1] = ' ';
            }

            of << function << "\n";
        } else {
            of << stack_strings[0] << "\n";
        }
        free(function);
        free(stack_strings);
    }

    close(ifd);
    munmap(iptr, ifsize);
}

void
flush_thbuffer(perspective::std::int32_t elemidx) {
    using namespace std;
    using namespace perspective;
    t_instrec* mbuf = th_trace_buffer;
    fwrite(mbuf, sizeof(t_instrec), elemidx, th_file);
}
} // end extern c

#endif // end _WIN32
