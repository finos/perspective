/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#ifdef __unix
#define OPEN_MODE_BINARY 0
#define OPEN_PMODE 0644
#else
#define OPEN_MODE_BINARY O_BINARY
#define OPEN_PMODE ( FILE_SHARE_READ | FILE_SHARE_WRITE )
#define strcasecmp stricmp
#endif

#define CXX_FINAL    final
#define CXX_OVERRIDE override

#ifdef __GNUC__
#define CXX_NOEXCEPT noexcept(true)
#else
#define CXX_NOEXCEPT
#endif

#if defined( __GNUC__ )

#define __ALWAYS_INLINE__ __attribute__(( always_inline ))
#define NOINLINE __attribute__(( noinline ))
#define NORETURN __attribute__((__noreturn__)) void
#define UNUSED __attribute__(( unused ))
#define PRAGMA_GCC( X_ ) _Pragma( #X_ )
#define PRAGMA_VC( X_ )
#define ASG_BREAK() __asm__( "int3" )

#else

#define __ALWAYS_INLINE__ __forceinline
#define NOINLINE __declspec( noinline )
#define NORETURN __declspec( noreturn ) void
#define UNUSED
#define PRAGMA_GCC( X_ )
#define PRAGMA_VC( X_ ) __pragma( X_ )
#define ASG_BREAK() DebugBreak()

#endif

#define SUPPRESS_WARNINGS_GCC( X_ ) PRAGMA_GCC( GCC diagnostic push ) PRAGMA_GCC( GCC diagnostic ignored #X_ )
#define RESTORE_WARNINGS_GCC() PRAGMA_GCC( GCC diagnostic pop )

#define SUPPRESS_WARNINGS_VC( X_ ) PRAGMA_VC( warning( push ) ) PRAGMA_VC( warning( disable: X_ ) )
#define RESTORE_WARNINGS_VC() PRAGMA_VC( warning( pop ) )
