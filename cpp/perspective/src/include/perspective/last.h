/******************************************************************************
 *
 * Copyright (c) 2020, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once

#ifdef PSP_ENABLE_PYTHON

/*
   Due to a very silly #define in python, this file needs
   to come after any other perspective includes, which
   themselves have to precede any arrow includes.

   The preprocessor is fun.

   https://bugs.python.org/issue24643
*/

#ifdef WIN32
#if _MSC_VER >= 1900
#undef timezone
#endif
#endif // win32

#endif
