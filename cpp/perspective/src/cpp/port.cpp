/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/port.h>

namespace perspective {

t_port::t_port(t_port_mode mode, const t_schema& schema)
    : m_schema(schema)
    , m_init(false)
    , m_table(nullptr)
    , m_prevsize(0) {
    LOG_CONSTRUCTOR("t_port");
}

t_port::~t_port() { LOG_DESTRUCTOR("t_port"); }

void
t_port::init() {
    m_table = nullptr;
    m_table = std::make_shared<t_data_table>(
        "", "", m_schema, DEFAULT_EMPTY_CAPACITY, BACKING_STORE_MEMORY);
    m_table->init();
    m_init = true;
}

std::shared_ptr<t_data_table>
t_port::get_table() {
    return m_table;
}

void
t_port::set_table(std::shared_ptr<t_data_table> table) {
    m_table = nullptr;
    m_table = table;
}

void
t_port::send(std::shared_ptr<const t_data_table> table) {
    m_table->append(*table.get());
}

void
t_port::send(const t_data_table& table) {
    m_table->append(table);
}

t_schema
t_port::get_schema() const {
    return m_schema;
}

void
t_port::release()

{
    if (!m_table.get())
        return;

    t_uindex size = m_table->size();

    m_table = nullptr;
    m_table = std::make_shared<t_data_table>(
        "", "", m_schema, DEFAULT_EMPTY_CAPACITY, BACKING_STORE_MEMORY);
    m_table->init();

    m_prevsize = size;
}

void
t_port::release_or_clear()

{
    if (!m_table.get())
        return;

    t_uindex size = m_table->size();

    if (static_cast<double>(size) < 0.4 * double(m_prevsize)) {
        m_table->clear();
    } else {
        release();
    }

    m_prevsize = size;
}

void
t_port::clear() {
    if (!m_table.get())
        return;

    m_table->clear();
}

} // end namespace perspective
