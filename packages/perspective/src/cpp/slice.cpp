/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/slice.h>

namespace perspective
{

const t_range&
t_slice::range() const
{
    return m_range;
}

const t_pathvec&
t_slice::row_paths() const
{
    return m_row_paths;
}

const t_pathvec&
t_slice::column_paths() const
{
    return m_column_paths;
}

const t_idxvec&
t_slice::row_indices() const
{
    return m_row_indices;
}

const t_idxvec&
t_slice::column_indices() const
{
    return m_column_indices;
}

const t_datavec&
t_slice::row_data() const
{
    return m_row_data;
}

const t_datavec&
t_slice::column_data() const
{
    return m_column_data;
}

const t_uidxvec&
t_slice::row_depth() const
{

    return m_row_depth;
}

const t_uidxvec&
t_slice::column_depth() const
{
    return m_column_depth;
}

const t_uidxvec&
t_slice::is_row_expanded() const
{
    return m_is_row_expanded;
}

const t_uidxvec&
t_slice::is_column_expanded() const
{
    return m_is_column_expanded;
}

t_range&
t_slice::range()
{
    return m_range;
}

t_pathvec&
t_slice::row_paths()
{
    return m_row_paths;
}

t_pathvec&
t_slice::column_paths()
{
    return m_column_paths;
}

t_idxvec&
t_slice::row_indices()
{
    return m_row_indices;
}

t_idxvec&
t_slice::column_indices()
{
    return m_column_indices;
}

t_datavec&
t_slice::row_data()
{
    return m_row_data;
}

t_datavec&
t_slice::column_data()
{
    return m_column_data;
}

t_uidxvec&
t_slice::row_depth()
{

    return m_row_depth;
}

t_uidxvec&
t_slice::column_depth()
{
    return m_column_depth;
}

t_uidxvec&
t_slice::is_row_expanded()
{
    return m_is_row_expanded;
}

t_uidxvec&
t_slice::is_column_expanded()
{
    return m_is_column_expanded;
}

} // namespace perspective
