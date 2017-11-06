/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/computed_column_interface.h>

namespace perspective
{

t_perspective_accessor::t_perspective_accessor(t_table& table)
{
    setTable(table);
}

t_perspective_accessor::t_perspective_accessor(const t_table& table,
                                               t_uindex row_idx)
{
    setTable(const_cast<t_table&>(table));
    setRow(row_idx);
}

t_perspective_accessor::t_perspective_accessor(const t_table& table)
{
    setTable(const_cast<t_table&>(table));
}

t_perspective_accessor::t_perspective_accessor(t_table& table,
                                               t_uindex row_idx)
{
    setTable(table);
    setRow(row_idx);
}

void
t_perspective_accessor::setTable(t_table& table)
{
    for (size_t i = 0; i < table.num_columns(); ++i)
    {
        m_columns.push_back(table.get_column_by_idx(i));
    }
}

template <typename T>
void
t_perspective_accessor::read(T& dest, int64_t readSpec) const
{
    if (m_columns[readSpec]->is_valid(m_row_idx))
    {
        dest = *(m_columns[readSpec]->get_nth<T>(m_row_idx));
    }
    else
    {
        dest = T();
    }
}

void
t_perspective_accessor::readToString(std::string* dest,
                                     int64_t readSpec) const
{
    /* We can get directly instead of going via a scalar, but then we
     * lose the common .to_string() method */
    if (m_columns[readSpec]->is_valid(m_row_idx))
    {
        *dest = m_columns[readSpec]->at(m_row_idx).to_string();
    }
    else
    {
        *dest = std::string();
    }
}

// Request instantiations
template void t_perspective_accessor::read(int64_t& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(int32_t& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(int16_t& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(int8_t& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(double& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(float& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(char*& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(t_date& dest,
                                           int64_t readSpec) const;
template void t_perspective_accessor::read(t_time& dest,
                                           int64_t readSpec) const;
};
