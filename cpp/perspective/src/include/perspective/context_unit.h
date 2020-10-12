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
#include <perspective/traversal.h>
#include <perspective/flat_traversal.h>
#include <tsl/hopscotch_set.h>

namespace perspective {

class PERSPECTIVE_EXPORT t_ctxunit : public t_ctxbase<t_ctxunit> {
public:
    t_ctxunit();

    t_ctxunit(const t_schema& schema, const t_config& config);

    ~t_ctxunit();

    perspective::t_index get_row_count() const;

    perspective::t_index get_column_count() const;

    using t_ctxbase<t_ctxunit>::get_data;

    std::vector<t_tscalar> get_data(
        t_index start_row, t_index end_row, t_index start_col, t_index end_col) const;

    std::vector<t_tscalar> get_data(const std::vector<t_uindex>& rows) const;

    std::vector<t_tscalar> get_data(const std::vector<t_tscalar>& pkeys) const;

    void sort_by(const std::vector<t_sortspec>& sortby);

    void reset_sortby();

    // will only work on empty contexts
    void notify(const t_data_table& flattened);

    void notify(const t_data_table& flattened, const t_data_table& delta, const t_data_table& prev,
        const t_data_table& current, const t_data_table& transitions, const t_data_table& existed);

    void step_begin();

    void step_end();

    std::string repr() const;

    void init();

    void reset();

    t_index sidedness() const;

    bool get_deltas_enabled() const;
    void set_deltas_enabled(bool enabled_state);

    std::vector<t_tscalar> get_pkeys(const std::vector<std::pair<t_uindex, t_uindex>>& cells) const;

    std::vector<t_tscalar> get_cell_data(
        const std::vector<std::pair<t_uindex, t_uindex>>& cells) const;

    t_stepdelta get_step_delta(t_index bidx, t_index eidx);

    t_rowdelta get_row_delta();

    std::vector<t_uindex> get_rows_changed();

    std::vector<t_cellupd> get_cell_delta(t_index bidx, t_index eidx) const;

    void clear_deltas();

    void reset_step_state();

    void disable();

    void enable();

    std::vector<t_stree*> get_trees();

    bool has_deltas() const;

    void pprint() const;

    t_dtype get_column_dtype(t_uindex idx) const;

    std::shared_ptr<t_data_table> get_table() const;

    t_tscalar get_column_name(t_index idx);

    std::vector<std::string> get_column_names() const;

    const tsl::hopscotch_set<t_tscalar>& get_delta_pkeys() const;

    // Unity api
    std::vector<t_tscalar> unity_get_row_path(t_uindex idx) const;
    std::vector<t_tscalar> unity_get_column_path(t_uindex idx) const;
    t_uindex unity_get_row_depth(t_uindex ridx) const;
    t_uindex unity_get_column_depth(t_uindex cidx) const;
    std::vector<std::string> unity_get_column_names() const;
    std::vector<std::string> unity_get_column_display_names() const;
    std::string unity_get_column_name(t_uindex idx) const;
    std::string unity_get_column_display_name(t_uindex idx) const;
    t_uindex unity_get_column_count() const;
    t_uindex unity_get_row_count() const;
    t_data_table unity_get_table() const;
    bool unity_get_row_expanded(t_uindex idx) const;
    bool unity_get_column_expanded(t_uindex idx) const;
    void unity_init_load_step_end();

protected:
    void add_delta_pkey(t_tscalar pkey);
    
    void add_row(t_tscalar pkey, t_uindex idx);

    void update_row(t_tscalar pkey);
    
    void delete_row(t_tscalar pkey);

private:
    /**
     * The unit context does not contain `m_traversal`, as it does not need to
     * keep track of a subset of the `gnode_state`'s master table or perform
     * translations between row/column indices and primary keys. Instead, data
     * is read from the master table using row/column indices that map directly
     * to the master table's data.
     */
    tsl::hopscotch_set<t_tscalar> m_delta_pkeys;

    // A mapping of integer row indices to scalar primary keys.
    tsl::hopscotch_map<t_uindex, t_tscalar> m_pkey_index;

    t_symtable m_symtable;
    bool m_has_delta;
};

} // end namespace perspective
