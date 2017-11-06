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
#ifdef PSP_ENABLE_PYTHON
#include <perspective/pythonhelpers.h>
#include <thread>
#endif

namespace perspective
{
t_update_task::t_update_task(t_pool& pool) : m_pool(pool)
{
}

#ifdef PSP_ENABLE_WASM
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
#else
void
t_update_task::run()
{
    auto work_to_do = m_pool.m_data_remaining.load();
    if (work_to_do)
    {
        if (m_pool.has_python_dep())
        {
            // GIL is only needed for numexpr based
            // computed columns
            PythonGuard guard;
            std::lock_guard<std::mutex> lg(m_pool.m_mtx);
            for (auto g : m_pool.m_gnodes)
            {
                if (g)
                    g->_process();
            }
            m_pool.m_data_remaining.store(false);
            for (auto g : m_pool.m_gnodes)
            {
                if (g)
                    g->clear_output_ports();
            }

            // The block of code above is in a new scope
            // so that the pool mutex is released when
            // this scope is exited
            // This is necessary because the call to
            // py_notify_userspace
            // might potentially release the GIL and we do not
            // want to land up in a situation where we continue
            // to hold the mutex while having released the GIL
        }
        else
        {
            std::lock_guard<std::mutex> lg(m_pool.m_mtx);
            auto n_gnodes = m_pool.m_gnodes.size();

#ifdef PSP_PARALLEL_FOR
            PSP_PFOR(0,
                     int(n_gnodes),
                     1,
                     [this](int gidx)
#else
            for (t_uindex gidx = 0; gidx < n_gnodes; ++gidx)
#endif
                     {
                         auto g = m_pool.m_gnodes[gidx];
                         if (g)
                         {
                             g->_process();
                             g->clear_output_ports();
                         }
                     }
#ifdef PSP_PARALLEL_FOR
                     );
#endif
            m_pool.m_data_remaining.store(false);
        }

        {
            PythonGuard guard;
            m_pool.py_notify_userspace();
        }
    }
    m_pool.inc_epoch();
}

void
t_update_task::run(t_uindex gnode_id)
{
    if (gnode_id > m_pool.m_gnodes.size() ||
        !m_pool.m_gnodes[gnode_id])
        return;
    auto g = m_pool.m_gnodes[gnode_id];
    g->_process();
    g->clear_output_ports();
    m_pool.py_notify_userspace();
    m_pool.inc_epoch();
}
#endif
} // end namespace perspective