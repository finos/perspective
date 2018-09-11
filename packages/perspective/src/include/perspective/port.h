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
#include <perspective/table.h>

namespace perspective
{

enum t_port_mode
{
    PORT_MODE_RAW,    // no pkeys in incoming
    PORT_MODE_PKEYED, // pkeys and op present
};

class PERSPECTIVE_EXPORT t_port
{
public:
    t_port(t_port_mode mode, const t_schema& schema);
    ~t_port();
    void init();
    t_table_sptr get_table();
    void set_table(t_table_sptr tbl);

    // append to existing table
    void send(t_table_csptr tbl);
    void send(const t_table& tbl);

    t_schema get_schema() const;

    void release();
    void release_or_clear();

private:
    t_port_mode m_mode;
    t_schema m_schema;
    t_bool m_init;
    t_table_sptr m_table;
    t_uindex m_prevsize;
};

typedef std::shared_ptr<t_port> t_port_sptr;
typedef std::vector<t_port_sptr> t_port_sptrvec;

} // end namespace perspective
