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
#include <memory>
#include <vector>
#include <map>
#include <algorithm>
#include <functional>
#include <iostream>
#include <perspective/multi_sort.h>
#include <perspective/sort_specification.h>
#include <perspective/gnode_state.h>
#include <perspective/config.h>
#include <perspective/exports.h>
#include <perspective/sym_table.h>
#include <set>
#include <unordered_map>

namespace perspective {

class PERSPECTIVE_EXPORT t_ftrav {
    typedef std::unordered_map<t_tscalar, t_index> t_pkeyidx_map;
    typedef std::unordered_map<t_tscalar, t_mselem> t_pkmselem_map;

public:
    t_ftrav(t_bool handle_nan_sort);

    void init();

    t_tscalvec get_all_pkeys(const t_uidxpvec& cells) const;

    t_tscalvec get_pkeys(const t_uidxpvec& cells) const;

    t_tscalvec get_pkeys() const;
    t_tscalvec get_pkeys(t_tvidx begin_row, t_tvidx end_row) const;

    t_tscalar get_pkey(t_tvidx idx) const;

    void fill_sort_elem(t_gstate_csptr state, const t_config& config, const t_tscalvec& row,
        t_mselem& out_elem) const;

    void fill_sort_elem(
        t_gstate_csptr state, const t_config& config, t_tscalar pkey, t_mselem& out_elem);

    void sort_by(t_gstate_csptr state, const t_config& config, const t_sortsvec& sortby);

    t_index size() const;

    void get_row_indices(const t_tscalset& pkeys, t_tscaltvimap& out_map) const;

    void get_row_indices(
        t_tvidx bidx, t_tvidx eidx, const t_tscalset& pkeys, t_tscaltvimap& out_map) const;

    void reset();

    void check_size();

    bool validate_cells(const t_uidxpvec& cells) const;

    void step_begin();

    void step_end();

    void add_row(t_gstate_csptr state, const t_config& config, t_tscalar pkey);

    void update_row(t_gstate_csptr state, const t_config& config, t_tscalar pkey);

    void delete_row(t_tscalar pkey);

    t_sortsvec get_sort_by() const;
    t_bool empty_sort_by() const;

    void reset_step_state();

    t_uindex lower_bound_row_idx(
        t_gstate_csptr state, const t_config& config, const t_tscalvec& row) const;

    t_index get_row_idx(t_tscalar pkey) const;

private:
    t_index m_step_deletes;
    t_index m_step_inserts;
    t_pkeyidx_map m_pkeyidx;
    t_pkmselem_map m_new_elems;
    t_sortsvec m_sortby;
    t_mselemvec_sptr m_index;
    t_bool m_handle_nan_sort;
    t_symtable m_symtable;
};

typedef std::shared_ptr<t_ftrav> t_ftrav_sptr;
typedef std::shared_ptr<const t_ftrav> t_ftrav_csptr;

} // end namespace perspective
