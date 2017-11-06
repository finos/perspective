/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/init.h>
#include <perspective/numpy.h>
#ifdef PSP_ENABLE_PYTHON
#include <polaris/jitcompiler_psp.h>
#endif

namespace perspective
{

PyObject*
perspective_jit_global_dict()
{
    static PyObject* global_d = 0;

#ifdef PSP_ENABLE_PYTHON
    if (!global_d)
    {
        global_d = PyDict_New();
        if (global_d)
        {
            PyDict_SetItemString(
                global_d,
                "date",
                JITCompiler::newBuiltin("perspective.date"));

            PyDict_SetItemString(
                global_d,
                "istr",
                JITCompiler::newBuiltin("perspective.istr"));

            PyDict_SetItemString(
                global_d,
                "psp_col",
                JITCompiler::newBuiltin("perspective.psp_col"));

            PyObject* const modules =
                PyThreadState_GET()->interp->modules;

            PyDict_SetItemString(
                global_d,
                "math",
                PyDict_GetItemString(modules, "math"));

            JITCompiler::bindKnownScope("perspective", global_d);
        }
    }
#endif

    return global_d;
}

void
perspective_init()
{
}

void
perspective_finalize()
{
}

} // end namespace perspective
