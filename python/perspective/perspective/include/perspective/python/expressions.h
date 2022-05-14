/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#pragma once
#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>

namespace perspective {
namespace binding {

    /**
     * @brief Initialize the expressions parser. Must be called at module
     * initialization before any interactions with the module.
     *
     */
    void init_expression_parser();

    t_validated_expression_map validate_expressions_py(
        std::shared_ptr<Table> table,
        const std::vector<std::vector<t_val>>& p_expressions);

} // namespace binding
} // namespace perspective

#endif