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
#include <map>
#include <vector>

namespace perspective
{

struct t_ctx_handle
{
    t_ctx_handle();
    t_ctx_handle(void* ctx, t_ctx_type ctx_type);

    t_str get_type_descr() const;

    t_ctx_type m_ctx_type;
    void* m_ctx;
};

typedef std::vector<t_ctx_handle> t_sctxhvec;
typedef std::map<t_str, t_ctx_handle> t_sctxhmap;
} // end namespace perspective
