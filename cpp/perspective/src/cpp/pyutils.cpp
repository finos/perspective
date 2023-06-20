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
#include <perspective/pyutils.h>

namespace perspective {

#ifdef PSP_ENABLE_PYTHON
PerspectiveGILUnlock::PerspectiveGILUnlock()
    : m_thread_state(PyEval_SaveThread()) {}

PerspectiveGILUnlock::~PerspectiveGILUnlock() {
    PyEval_RestoreThread(m_thread_state);
}
#endif

} // end namespace perspective
