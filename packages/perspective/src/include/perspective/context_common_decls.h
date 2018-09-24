/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

t_index get_row_count() const;

t_index get_column_count() const;

t_tscalvec get_data(
    t_tvidx start_row, t_tvidx end_row, t_tvidx start_col, t_tvidx end_col) const;

void sort_by(const t_sortsvec& sortby);

void reset_sortby();

// will only work on empty contexts
void notify(const t_table& flattened);

void notify(const t_table& flattened, const t_table& delta, const t_table& prev,
    const t_table& current, const t_table& transitions, const t_table& existed);

void step_begin();

void step_end();

t_str repr() const;

void init();

void reset();

t_index sidedness() const;

void set_alerts_enabled(bool enabled_state);

void set_deltas_enabled(bool enabled_state);

void set_minmax_enabled(bool enabled_state);

void set_feature_state(t_ctx_feature feature, t_bool state);

t_tscalvec get_pkeys(const t_uidxpvec& cells) const;

t_tscalvec get_cell_data(const t_uidxpvec& cells) const;

t_minmaxvec get_min_max() const;

t_stepdelta get_step_delta(t_tvidx bidx, t_tvidx eidx);

t_cellupdvec get_cell_delta(t_tvidx bidx, t_tvidx eidx) const;

void clear_deltas();

void reset_step_state();

void disable();

void enable();

t_streeptr_vec get_trees();

t_bool has_deltas() const;

void pprint() const;

t_dtype get_column_dtype(t_uindex idx) const;

// Unity api
t_tscalvec unity_get_row_data(t_uindex idx) const;
t_tscalvec unity_get_column_data(t_uindex idx) const;
t_tscalvec unity_get_row_path(t_uindex idx) const;
t_tscalvec unity_get_column_path(t_uindex idx) const;
t_uindex unity_get_row_depth(t_uindex ridx) const;
t_uindex unity_get_column_depth(t_uindex cidx) const;
t_svec unity_get_column_names() const;
t_svec unity_get_column_display_names() const;
t_str unity_get_column_name(t_uindex idx) const;
t_str unity_get_column_display_name(t_uindex idx) const;
t_uindex unity_get_column_count() const;
t_uindex unity_get_row_count() const;
t_table unity_get_table() const;
t_bool unity_get_row_expanded(t_uindex idx) const;
t_bool unity_get_column_expanded(t_uindex idx) const;
void unity_init_load_step_end();
// TODO

// add unity api for tables
