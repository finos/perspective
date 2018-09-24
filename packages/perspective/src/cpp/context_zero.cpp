/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/context_base.h>
#include <perspective/context_common.h>
#include <perspective/context_zero.h>
#include <perspective/flat_traversal.h>
#include <perspective/sym_table.h>
#include <perspective/logtime.h>
#include <perspective/filter_utils.h>

namespace perspective {

t_ctx0::t_ctx0() {}

t_ctx0::t_ctx0(const t_schema& schema, const t_config& config)
    : t_ctxbase<t_ctx0>(schema, config)
    , m_minmax(m_config.get_num_columns())
    , m_has_delta(false)

{}

t_ctx0::~t_ctx0() { m_traversal.reset(); }

t_str
t_ctx0::repr() const {
    std::stringstream ss;
    ss << "t_ctx0<" << this << ">";
    return ss.str();
}

void
t_ctx0::step_begin() {
    if (!m_init)
        return;

    m_deltas = std::make_shared<t_zcdeltas>();
    m_rows_changed = false;
    m_columns_changed = false;
    m_traversal->step_begin();
}

void
t_ctx0::step_end() {
    if (!has_deltas()) {
        return;
    }

    m_traversal->step_end();

    t_uindex ncols = m_config.get_num_columns();
    t_minmaxvec rval(ncols);

    auto pkeys = m_traversal->get_pkeys();
    auto stbl = m_state->get_table();

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0, int(ncols), 1,
        [&rval, &stbl, pkeys, this](int colidx)
#else
    for (t_uindex colidx = 0; colidx < ncols; ++colidx)
#endif
        {
            auto colname = m_config.col_at(colidx);

            if (stbl->get_dtype(colname) != DTYPE_STR) {
                auto v = m_state->reduce<
                    std::function<std::pair<t_tscalar, t_tscalar>(const t_tscalvec&)>>(
                    pkeys, colname, get_vec_min_max);

                rval[colidx].m_min = v.first;
                rval[colidx].m_max = v.second;
            }
        }
#ifdef PSP_PARALLEL_FOR
    );
#endif

    m_minmax = rval;
}

// ASGGrid data interface
t_index
t_ctx0::get_row_count() const {
    return m_traversal->size();
}

t_index
t_ctx0::get_column_count() const {
    return m_config.get_num_columns();
}

t_tscalvec
t_ctx0::get_data(t_tvidx start_row, t_tvidx end_row, t_tvidx start_col, t_tvidx end_col) const {

    auto ext = sanitize_get_data_extents(*this, start_row, end_row, start_col, end_col);

    t_index nrows = ext.m_erow - ext.m_srow;
    t_index stride = ext.m_ecol - ext.m_scol;
    t_tscalvec values(nrows * stride);

    t_tscalvec pkeys = m_traversal->get_pkeys(ext.m_srow, ext.m_erow);
    auto none = mknone();

    for (t_index cidx = ext.m_scol; cidx < ext.m_ecol; ++cidx) {
        t_tscalvec out_data(pkeys.size());
        m_state->read_column(m_config.col_at(cidx), pkeys, out_data);

        for (t_index ridx = ext.m_srow; ridx < ext.m_erow; ++ridx) {
            auto v = out_data[ridx - ext.m_srow];

            // todo: fix null handling
            if (!v.is_valid())
                v.set(none);

            values[(ridx - ext.m_srow) * stride + (cidx - ext.m_scol)] = v;
        }
    }

    return values;
}

void
t_ctx0::sort_by() {
    reset_sortby();
}

void
t_ctx0::sort_by(const t_sortsvec& sortby) {
    if (sortby.empty())
        return;
    m_traversal->sort_by(m_state, m_config, sortby);
}

void
t_ctx0::reset_sortby() {
    m_traversal->sort_by(m_state, m_config, t_sortsvec());
}

t_tscalar
t_ctx0::get_column_name(t_index idx) {
    t_str empty("");

    if (idx >= get_column_count())
        return m_symtable.get_interned_tscalar(empty.c_str());

    return m_symtable.get_interned_tscalar(m_config.col_at(idx).c_str());
}

void
t_ctx0::init() {
    m_traversal = std::make_shared<t_ftrav>(m_config.handle_nan_sort());
    m_deltas = std::make_shared<t_zcdeltas>();
    m_init = true;
}

t_tscalvec
t_ctx0::get_pkeys(const t_uidxpvec& cells) const {
    if (!m_traversal->validate_cells(cells)) {
        t_tscalvec rval;
        return rval;
    }
    return m_traversal->get_pkeys(cells);
}

t_tscalvec
t_ctx0::get_all_pkeys(const t_uidxpvec& cells) const {
    if (!m_traversal->validate_cells(cells)) {
        t_tscalvec rval;
        return rval;
    }
    return m_traversal->get_all_pkeys(cells);
}

t_tscalvec
t_ctx0::get_cell_data(const t_uidxpvec& cells) const {
    if (!m_traversal->validate_cells(cells)) {
        t_tscalvec rval;
        return rval;
    }

    t_uindex ncols = get_column_count();

    for (const auto& c : cells) {
        if (c.second >= ncols) {
            t_tscalvec rval;
            return rval;
        }
    }

    // Order aligned with cells
    t_tscalvec pkeys = get_all_pkeys(cells);
    t_tscalvec out_data;
    out_data.reserve(cells.size());

    for (t_index idx = 0, loop_end = pkeys.size(); idx < loop_end; ++idx) {
        t_str colname = m_config.col_at(cells[idx].second);
        out_data.push_back(m_state->get(pkeys[idx], colname));
    }

    return out_data;
}

t_cellupdvec
t_ctx0::get_cell_delta(t_tvidx bidx, t_tvidx eidx) const {
    t_tscalset pkeys;
    t_tscalar prev_pkey;
    prev_pkey.set(t_none());

    bidx = std::min(bidx, m_traversal->size());
    eidx = std::min(eidx, m_traversal->size());

    t_cellupdvec rval;

    if (m_traversal->empty_sort_by()) {
        t_tscalvec pkey_vec = m_traversal->get_pkeys(bidx, eidx);
        for (t_index idx = 0, loop_end = pkey_vec.size(); idx < loop_end; ++idx) {
            const t_tscalar& pkey = pkey_vec[idx];
            t_tvidx row = bidx + idx;
            iterpair_by_zc_pkey_colidx iters
                = m_deltas->get<by_zc_pkey_colidx>().equal_range(pkey);
            for (iter_by_zc_pkey_colidx iter = iters.first; iter != iters.second; ++iter) {
                t_cellupd cellupd;
                cellupd.row = row;
                cellupd.column = iter->m_colidx;
                cellupd.old_value = iter->m_old_value;
                cellupd.new_value = iter->m_new_value;
                rval.push_back(cellupd);
            }
        }
    } else {
        for (iter_by_zc_pkey_colidx iter = m_deltas->get<by_zc_pkey_colidx>().begin();
             iter != m_deltas->get<by_zc_pkey_colidx>().end(); ++iter) {
            if (prev_pkey != iter->m_pkey) {
                pkeys.insert(iter->m_pkey);
                prev_pkey = iter->m_pkey;
            }
        }

        t_tscaltvimap r_indices;
        m_traversal->get_row_indices(pkeys, r_indices);

        for (iter_by_zc_pkey_colidx iter = m_deltas->get<by_zc_pkey_colidx>().begin();
             iter != m_deltas->get<by_zc_pkey_colidx>().end(); ++iter) {
            t_tvidx row = r_indices[iter->m_pkey];
            if (bidx <= row && row <= eidx) {
                t_cellupd cellupd;
                cellupd.row = row;
                cellupd.column = iter->m_colidx;
                cellupd.old_value = iter->m_old_value;
                cellupd.new_value = iter->m_new_value;
                rval.push_back(cellupd);
            }
        }
    }
    return rval;
}

t_stepdelta
t_ctx0::get_step_delta(t_tvidx bidx, t_tvidx eidx) {
    bidx = std::min(bidx, m_traversal->size());
    eidx = std::min(eidx, m_traversal->size());
    bool rows_changed = m_rows_changed || !m_traversal->empty_sort_by();
    t_stepdelta rval(rows_changed, m_columns_changed, get_cell_delta(bidx, eidx));
    m_deltas->clear();
    clear_deltas();
    return rval;
}

t_svec
t_ctx0::get_column_names() const {
    return m_config.get_column_names();
}

t_sortsvec
t_ctx0::get_sort_by() const {
    return m_traversal->get_sort_by();
}

void
t_ctx0::reset() {
    m_traversal->reset();
    m_deltas = std::make_shared<t_zcdeltas>();
    m_minmax = t_minmaxvec(m_config.get_num_columns());
    m_has_delta = false;
}

t_index
t_ctx0::sidedness() const {
    return 0;
}

void
t_ctx0::notify(const t_table& flattened, const t_table& delta, const t_table& prev,
    const t_table& curr, const t_table& transitions, const t_table& existed) {
    psp_log_time(repr() + " notify.enter");
    t_uindex nrecs = flattened.size();
    t_col_csptr pkey_sptr = flattened.get_const_column("psp_pkey");
    t_col_csptr op_sptr = flattened.get_const_column("psp_op");
    const t_column* pkey_col = pkey_sptr.get();
    const t_column* op_col = op_sptr.get();

    t_col_csptr existed_sptr = existed.get_const_column("psp_existed");
    const t_column* existed_col = existed_sptr.get();

    t_bool delete_encountered = false;
    if (m_config.has_filters()) {
        t_mask msk_prev = filter_table_for_config(prev, m_config);
        t_mask msk_curr = filter_table_for_config(curr, m_config);

        for (t_uindex idx = 0; idx < nrecs; ++idx) {
            t_tscalar pkey = m_symtable.get_interned_tscalar(pkey_col->get_scalar(idx));

            t_uint8 op_ = *(op_col->get_nth<t_uint8>(idx));
            t_op op = static_cast<t_op>(op_);
            t_bool existed = *(existed_col->get_nth<t_bool>(idx));

            switch (op) {
                case OP_INSERT: {
                    t_bool filter_curr = msk_curr.get(idx);
                    t_bool filter_prev = msk_prev.get(idx) && existed;

                    if (filter_prev) {
                        if (filter_curr) {
                            m_traversal->update_row(m_state, m_config, pkey);
                        } else {
                            m_traversal->delete_row(pkey);
                        }
                    } else {
                        if (filter_curr) {
                            m_traversal->add_row(m_state, m_config, pkey);
                        }
                    }
                } break;
                case OP_DELETE: {
                    m_traversal->delete_row(pkey);
                    delete_encountered = true;
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unexpected OP"); } break;
            }
        }
        psp_log_time(repr() + " notify.has_filter_path.updated_traversal");
        calc_step_delta(flattened, prev, curr, transitions);
        m_has_delta = m_deltas->size() > 0 || delete_encountered;
        psp_log_time(repr() + " notify.has_filter_path.exit");

        return;
    }

    for (t_uindex idx = 0; idx < nrecs; ++idx) {
        t_tscalar pkey = m_symtable.get_interned_tscalar(pkey_col->get_scalar(idx));
        t_uint8 op_ = *(op_col->get_nth<t_uint8>(idx));
        t_op op = static_cast<t_op>(op_);
        t_bool existed = *(existed_col->get_nth<t_bool>(idx));

        switch (op) {
            case OP_INSERT: {
                if (existed) {
                    m_traversal->update_row(m_state, m_config, pkey);
                } else {
                    m_traversal->add_row(m_state, m_config, pkey);
                }
            } break;
            case OP_DELETE: {
                m_traversal->delete_row(pkey);
                delete_encountered = true;
            } break;
            case OP_CLEAR: {
                PSP_COMPLAIN_AND_ABORT("Unexpected OP");
            } break;
        }
    }

    psp_log_time(repr() + " notify.no_filter_path.updated_traversal");
    calc_step_delta(flattened, prev, curr, transitions);
    m_has_delta = m_deltas->size() > 0 || delete_encountered;
    psp_log_time(repr() + " notify.no_filter_path.exit");
}

void
t_ctx0::calc_step_delta(const t_table& flattened, const t_table& prev, const t_table& curr,
    const t_table& transitions) {
    t_uindex nrows = flattened.size();

    PSP_VERBOSE_ASSERT(prev.size() == nrows, "Shape violation detected");
    PSP_VERBOSE_ASSERT(curr.size() == nrows, "Shape violation detected");

    const t_column* pkey_col = flattened.get_const_column("psp_pkey").get();

    t_uindex ncols = m_config.get_num_columns();

    for (t_uindex cidx = 0; cidx < ncols; ++cidx) {
        t_str col = m_config.col_at(cidx);

        const t_column* tcol = transitions.get_const_column(col).get();
        const t_column* pcol = prev.get_const_column(col).get();
        const t_column* ccol = curr.get_const_column(col).get();

        for (t_uindex ridx = 0; ridx < nrows; ++ridx) {
            const t_uint8* trans_ = tcol->get_nth<t_uint8>(ridx);
            t_uint8 trans = *trans_;
            t_value_transition tr = static_cast<t_value_transition>(trans);

            switch (tr) {
                case VALUE_TRANSITION_NVEQ_FT:
                case VALUE_TRANSITION_NEQ_FT:
                case VALUE_TRANSITION_NEQ_TDT: {
                    m_deltas->insert(t_zcdelta(get_interned_tscalar(pkey_col->get_scalar(ridx)),
                        cidx, mknone(), get_interned_tscalar(ccol->get_scalar(ridx))));
                } break;
                case VALUE_TRANSITION_NEQ_TT: {
                    m_deltas->insert(t_zcdelta(get_interned_tscalar(pkey_col->get_scalar(ridx)),
                        cidx, get_interned_tscalar(pcol->get_scalar(ridx)),
                        get_interned_tscalar(ccol->get_scalar(ridx))));
                } break;
                default: {}
            }
        }
    }
}

t_minmaxvec
t_ctx0::get_min_max() const {
    return m_minmax;
}

void
t_ctx0::reset_step_state() {
    m_traversal->reset_step_state();
}

void
t_ctx0::disable() {
    m_features[CTX_FEAT_ENABLED] = false;
}

void
t_ctx0::enable() {
    m_features[CTX_FEAT_ENABLED] = true;
}

t_streeptr_vec
t_ctx0::get_trees() {
    return t_streeptr_vec();
}

t_bool
t_ctx0::has_deltas() const {
    return m_has_delta;
}

void
t_ctx0::notify(const t_table& flattened) {
    t_uindex nrecs = flattened.size();
    t_col_csptr pkey_sptr = flattened.get_const_column("psp_pkey");
    t_col_csptr op_sptr = flattened.get_const_column("psp_op");
    const t_column* pkey_col = pkey_sptr.get();
    const t_column* op_col = op_sptr.get();

    m_has_delta = true;

    if (m_config.has_filters()) {
        t_mask msk = filter_table_for_config(flattened, m_config);

        for (t_uindex idx = 0; idx < nrecs; ++idx) {
            t_tscalar pkey = m_symtable.get_interned_tscalar(pkey_col->get_scalar(idx));
            t_uint8 op_ = *(op_col->get_nth<t_uint8>(idx));
            t_op op = static_cast<t_op>(op_);

            switch (op) {
                case OP_INSERT: {
                    if (msk.get(idx)) {
                        m_traversal->add_row(m_state, m_config, pkey);
                    }
                } break;
                default: {
                    // pass
                } break;
            }
        }
        return;
    }

    for (t_uindex idx = 0; idx < nrecs; ++idx) {
        t_tscalar pkey = m_symtable.get_interned_tscalar(pkey_col->get_scalar(idx));
        t_uint8 op_ = *(op_col->get_nth<t_uint8>(idx));
        t_op op = static_cast<t_op>(op_);

        switch (op) {
            case OP_INSERT: {
                m_traversal->add_row(m_state, m_config, pkey);
            } break;
            default: { } break; }
    }
}

void
t_ctx0::pprint() const {}

t_dtype
t_ctx0::get_column_dtype(t_uindex idx) const {
    if (idx >= static_cast<t_uindex>(get_column_count()))
        return DTYPE_NONE;

    auto cname = m_config.col_at(idx);

    if (!m_schema.has_column(cname))
        return DTYPE_NONE;

    return m_schema.get_dtype(cname);
}

t_tscalvec
t_ctx0::unity_get_row_data(t_uindex idx) const {
    return get_data(idx, idx + 1, 0, get_column_count());
}

t_tscalvec
t_ctx0::unity_get_column_data(t_uindex idx) const {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return t_tscalvec();
}

t_tscalvec
t_ctx0::unity_get_row_path(t_uindex idx) const {
    return t_tscalvec(mktscalar(idx));
}

t_tscalvec
t_ctx0::unity_get_column_path(t_uindex idx) const {
    return t_tscalvec();
}

t_uindex
t_ctx0::unity_get_row_depth(t_uindex ridx) const {
    return 0;
}

t_uindex
t_ctx0::unity_get_column_depth(t_uindex cidx) const {
    return 0;
}

t_str
t_ctx0::unity_get_column_name(t_uindex idx) const {
    return m_config.col_at(idx);
}

t_str
t_ctx0::unity_get_column_display_name(t_uindex idx) const {
    return m_config.col_at(idx);
}

t_svec
t_ctx0::unity_get_column_names() const {
    return m_config.get_column_names();
}

t_svec
t_ctx0::unity_get_column_display_names() const {
    return m_config.get_column_names();
}

t_uindex
t_ctx0::unity_get_column_count() const {
    return get_column_count();
}

t_uindex
t_ctx0::unity_get_row_count() const {
    return get_row_count();
}

t_bool
t_ctx0::unity_get_row_expanded(t_uindex idx) const {
    return false;
}

t_bool
t_ctx0::unity_get_column_expanded(t_uindex idx) const {
    return false;
}

void
t_ctx0::clear_deltas() {
    m_has_delta = false;
}

void
t_ctx0::unity_init_load_step_end() {}

} // end namespace perspective
