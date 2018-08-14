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
#include <perspective/context_base.h>
#include <perspective/sort_specification.h>
#include <perspective/histogram.h>
#include <perspective/sym_table.h>
#include <perspective/shared_ptrs.h>

namespace perspective
{

class t_table;

class PERSPECTIVE_EXPORT t_ctx0 : public t_ctxbase<t_ctx0>
{
  public:
    t_ctx0();

    t_ctx0(const t_schema& schema, const t_config& config);

    ~t_ctx0();
#include <perspective/context_common_decls.h>

    // Python interface begin

    t_tscalar get_column_name(t_index idx);

    t_svec get_column_names() const;

    // Python interface end
	void sort_by();
    t_sortsvec get_sort_by() const;

    t_histogram get_histogram(const t_str& cname,
                              t_uindex nbuckets) const;

    t_histogram get_histogram(const t_str& cname,
                              t_uindex nbuckets,
                              t_bool show_filtered) const;

    t_uindex lower_bound(t_tscalvec& partial) const;

    t_index get_row_idx(t_tscalar pkey) const;

    t_table* get_pkeyed_table() const;
    using t_ctxbase<t_ctx0>::get_data;

  protected:
    void get_resolved_columns(t_idxvec& ov);

    t_tscalvec get_all_pkeys(const t_uidxpvec& cells) const;

    t_tvipair sanitize_index(t_tvidx bidx,
                             t_tvidx eidx,
                             t_tvidx lower_bound,
                             t_tvidx upper_bound) const;

    void delete_delta(const t_tscalar& pkey);

    void calc_step_delta(const t_table& flattened,
                         const t_table& prev,
                         const t_table& curr,
                         const t_table& transitions);

  private:
    t_ftrav_sptr m_traversal;
    t_sptr_zcdeltas m_deltas;
    t_minmaxvec m_minmax;
    t_symtable m_symtable;
    t_bool m_has_delta;
};

typedef std::shared_ptr<t_ctx0> t_ctx0_sptr;

} // end namespace perspective
