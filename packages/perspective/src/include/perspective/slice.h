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
#include <perspective/scalar.h>
#include <perspective/range.h>
#include <perspective/config.h>
#include <perspective/exports.h>
#include <perspective/data.h>
#include <perspective/path.h>

namespace perspective
{

class PERSPECTIVE_EXPORT t_slice
{
public:
    const t_range& range() const;
    const t_pathvec& row_paths() const;
    const t_pathvec& column_paths() const;
    const t_idxvec& row_indices() const;
    const t_idxvec& column_indices() const;
    const t_datavec& row_data() const;
    const t_datavec& column_data() const;
    const t_uidxvec& row_depth() const;
    const t_uidxvec& column_depth() const;
    const t_config_recipe& config_recipe() const;
    const t_uidxvec& is_row_expanded() const;
    const t_uidxvec& is_column_expanded() const;

    t_range& range();
    t_pathvec& row_paths();
    t_pathvec& column_paths();
    t_idxvec& row_indices();
    t_idxvec& column_indices();
    t_datavec& row_data();
    t_datavec& column_data();
    t_uidxvec& row_depth();
    t_uidxvec& column_depth();
    t_uidxvec& is_row_expanded();
    t_uidxvec& is_column_expanded();

private:
    t_range m_range;
    t_pathvec m_row_paths;
    t_pathvec m_column_paths;
    t_idxvec m_row_indices;
    t_idxvec m_column_indices;
    t_datavec m_row_data;
    t_datavec m_column_data;
    std::vector<t_uindex> m_is_root;
    t_uidxvec m_is_row_expanded;
    t_uidxvec m_is_column_expanded;
    t_config_recipe m_config_recipe;
    t_uidxvec m_row_depth;
    t_uidxvec m_column_depth;
};

} // end namespace perspective