/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>

namespace perspective {

struct t_debug_helper {
#ifdef PSP_DEBUG_HELPER
    void*
    operator new(size_t size) {
        return PSP_MALLOC(size);
    }

    void
    operator delete(void* mem) {
        if (mem)
            PSP_FREE(mem);
    }

    void*
    operator new[](size_t size) {
        return PSP_MALLOC(size);
    }

    void
    operator delete[](void* p) {
        if (p)
            PSP_FREE(p);
    }
#endif // end PSP_DEBUG_HELPER
};

} // end namespace perspective