/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#ifdef PSP_ENABLE_PYTHON
#include <arrow/util/parallel.h>
#include <arrow/status.h>
#endif

namespace perspective {

template <class FUNCTION>
void
parallel_for(int num_tasks, FUNCTION&& func) {
    auto status = arrow::internal::ParallelFor(num_tasks, func);
    if (!status.ok()) {
        PSP_COMPLAIN_AND_ABORT("ParallelFor failed");
    }
}

} // namespace perspective
