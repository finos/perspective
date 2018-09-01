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
#include <perspective/exports.h>

namespace perspective
{
class t_pool;

class PERSPECTIVE_EXPORT t_update_task
{
public:
    t_update_task(t_pool& pool);
    virtual void run();

    // Only callable if GIL is already held
    // And mutex is already held
    virtual void run(t_uindex gnode_id);

private:
    t_pool& m_pool;
};

} // end namespace perspective
