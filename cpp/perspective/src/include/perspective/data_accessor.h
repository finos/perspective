/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>

namespace perspective {
/**
 * @brief `t_data_accessor` allows for value retrieval from multiple data
 * formats (row, column, etc.) without copying the underlying dataset.
 *
 * For WASM builds, `t_data_accessor` is replaced by t_val through a `typedef`.
 *
 * TODO: implement `t_data_accessor` for python build
 */
class PERSPECTIVE_EXPORT t_data_accessor {};
} // namespace perspective