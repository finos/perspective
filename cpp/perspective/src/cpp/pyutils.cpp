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
#ifdef PSP_ENABLE_PYTHON
namespace perspective {

PerspectiveScopedGILRelease::PerspectiveScopedGILRelease(
    std::thread::id event_loop_thread_id)
    : m_thread_state(NULL) {
    if (event_loop_thread_id != std::thread::id()) {
        if (std::this_thread::get_id() != event_loop_thread_id) {
            std::stringstream err;
            err << "Perspective called from wrong thread; Expected "
                << event_loop_thread_id << "; Got "
                << std::this_thread::get_id() << std::endl;
            PSP_COMPLAIN_AND_ABORT(err.str());
        }
        m_thread_state = PyEval_SaveThread();
    }
}

PerspectiveScopedGILRelease::~PerspectiveScopedGILRelease() {
    if (m_thread_state != NULL) {
        PyEval_RestoreThread(m_thread_state);
    }
}

} // end namespace perspective

#endif