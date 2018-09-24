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
#include <perspective/table.h>
#include <perspective/aggregate.h>
#include <perspective/dense_tree.h>
#include <perspective/aggspec.h>
#include <perspective/exports.h>
#include <perspective/filter.h>

namespace perspective {

class PERSPECTIVE_EXPORT t_dtree_ctx {
public:
    t_dtree_ctx(t_table_csptr strands, t_table_csptr strand_deltas, const t_dtree& tree,
        const t_aggspecvec& aggspecs);
    void init();
    const t_table& get_aggtable() const;
    const t_dtree& get_tree() const;
    const t_aggspecvec& get_aggspecs() const;
    const t_aggspec& get_aggspec(const t_str& aggname) const;
    void pprint(const t_filter& fltr) const;

    std::pair<const t_uindex*, const t_uindex*> get_leaf_iterators(t_ptidx idx) const;

    t_col_csptr get_pkey_col() const;
    t_col_csptr get_strand_count_col() const;
    t_table_csptr get_strands() const;
    t_table_csptr get_strand_deltas() const;
    void pprint_strands() const;
    void pprint_strands_tree() const;

protected:
    void build_aggregates();
    t_uindex get_num_aggcols() const;

private:
    t_table_csptr m_strands;
    t_table_csptr m_strand_deltas;
    const t_dtree& m_tree;
    t_aggspecvec m_aggspecs;
    t_table_sptr m_aggregates;
    t_bool m_init;
    t_sidxmap m_aggspecmap;
};

} // end namespace perspective
