/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/pyutils.h>
#include <frameobject.h>
#include <iostream>
#include <perspective/pythonhelpers.h>

namespace perspective {

bool
curthread_has_gil() {
    auto tstate = _PyThreadState_Current;
    return tstate && (tstate == PyGILState_GetThisThreadState());
}

void
print_python_stack() {
    auto tstate = PyThreadState_GET();
    if (0 != tstate && 0 != tstate->frame) {
        auto f = tstate->frame;
        std::cout << "Python stack trace:" << std::endl;
        while (0 != f) {
            auto line = PyCode_Addr2Line(f->f_code, f->f_lasti);
            auto filename = PyString_AsString(f->f_code->co_filename);
            auto funcname = PyString_AsString(f->f_code->co_name);
            std::cout << "\t" << filename << ":" << line << " : " << funcname << std::endl;
            f = f->f_back;
        }
    }
}

std::string
repr(PyObject* pyo) {
    PyObjectPtr repr(PyObject_Repr(pyo));
    return std::string(PyString_AsString(repr.get()));
}

} // end namespace perspective