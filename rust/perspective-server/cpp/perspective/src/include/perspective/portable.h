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

#pragma once
#include <perspective/first.h>

// standalone build, no ASGUtils
#if defined(__GNUC__)
#define __ALWAYS_INLINE__ __attribute__((always_inline))
#ifndef NOINLINE
#define NOINLINE __attribute__((noinline))
#endif // NOINLINE

#ifndef NORETURN
#define NORETURN __attribute__((__noreturn__)) void
#endif // NORETURN

#define UNUSED __attribute__((unused))
#define PRAGMA_GCC(X_) _Pragma(#X_)
#define PRAGMA_VC(X_)
#else // __GNUC__

#define __ALWAYS_INLINE__ __forceinline

// TODO: Resolve collision on NOINLINE and NORETURN with fxalib
#ifndef NOINLINE
#define NOINLINE __declspec(noinline)
#endif

#ifndef NORETURN
#define NORETURN __declspec(noreturn) void
#endif

#define UNUSED
#define PRAGMA_GCC(X_)
#define PRAGMA_VC(X_) __pragma(X_)

#endif // else

#define SUPPRESS_WARNINGS_GCC(X_)                                              \
    PRAGMA_GCC(GCC diagnostic push) PRAGMA_GCC(GCC diagnostic ignored #X_)
#define RESTORE_WARNINGS_GCC() PRAGMA_GCC(GCC diagnostic pop)

#define SUPPRESS_WARNINGS_VC(X_)                                               \
    PRAGMA_VC(warning(push)) PRAGMA_VC(warning(disable : X_))
#define RESTORE_WARNINGS_VC() PRAGMA_VC(warning(pop))
