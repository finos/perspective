/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/pool.h>
#include <perspective/update_task.h>

namespace perspective
{
t_update_task::t_update_task(t_pool& pool)
    : m_pool(pool)
{
}

void
t_update_task::run()
{
    auto work_to_do = m_pool.m_data_remaining.load();
    if (work_to_do)
    {
        m_pool.m_data_remaining.store(true);
        for (auto g : m_pool.m_gnodes)
        {
            if (g)
                g->_process();
        }
        for (auto g : m_pool.m_gnodes)
        {
            if (g)
                g->clear_output_ports();
        }
        m_pool.m_data_remaining.store(false);
    }
    m_pool.py_notify_userspace();
    m_pool.inc_epoch();
}

void
t_update_task::run(t_uindex gnode_id)
{
    auto work_to_do = m_pool.m_data_remaining.load();
    if (work_to_do)
    {
        for (auto g : m_pool.m_gnodes)
        {
            if (g)
                g->_process();
        }
        m_pool.m_data_remaining.store(true);
        for (auto g : m_pool.m_gnodes)
        {
            if (g)
                g->clear_output_ports();
        }
        m_pool.m_data_remaining.store(false);
    }
    m_pool.py_notify_userspace();
    m_pool.inc_epoch();
}
} // end namespace perspective
