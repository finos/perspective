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

    /******************************************************************************
     *
     * Context API
     */
    template <>
    std::shared_ptr<t_ctxunit> make_context(std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config, const std::string& name);

    template <>
    std::shared_ptr<t_ctx0> make_context(std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config, const std::string& name);

    template <>
    std::shared_ptr<t_ctx1> make_context(std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config, const std::string& name);

    template <>
    std::shared_ptr<t_ctx2> make_context(std::shared_ptr<Table> table,
        std::shared_ptr<t_schema> schema,
        std::shared_ptr<t_view_config> view_config, const std::string& name);

} // namespace binding
} // namespace perspective

#endif