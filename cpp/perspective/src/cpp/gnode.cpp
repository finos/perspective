/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/context_zero.h>
#include <perspective/context_grouped_pkey.h>
#include <perspective/gnode.h>
#include <perspective/gnode_state.h>
#include <perspective/mask.h>
#include <perspective/tracing.h>
#include <perspective/env_vars.h>
#include <perspective/logtime.h>
#include <perspective/utils.h>

namespace perspective {

t_tscalar
calc_delta(t_value_transition trans, t_tscalar oval, t_tscalar nval) {
    return nval.difference(oval);
}

t_tscalar
calc_newer(t_value_transition trans, t_tscalar oval, t_tscalar nval) {
    if (nval.is_valid())
        return nval;
    return oval;
}

t_tscalar
calc_negate(t_tscalar val) {
    return val.negate();
}

t_gnode::t_gnode(const t_gnode_recipe& recipe)
    : m_mode(recipe.m_mode)
    , m_tblschema(recipe.m_tblschema)
    , m_init(false)
    , m_id(0)
    , m_pool_cleanup([]() {}) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_gnode");

    PSP_VERBOSE_ASSERT(recipe.m_mode == NODE_PROCESSING_SIMPLE_DATAFLOW,
        "Only simple dataflows supported currently");

    for (const auto& s : recipe.m_ischemas) {
        m_ischemas.push_back(t_schema(s));
    }

    PSP_VERBOSE_ASSERT(m_ischemas.size() == 1, "Single input port supported currently");

    for (const auto& s : recipe.m_oschemas) {
        m_oschemas.push_back(t_schema(s));
    }

    for (const auto& cc : recipe.m_custom_columns) {
        m_custom_columns.push_back(t_custom_column(cc));
    }

    m_epoch = std::chrono::high_resolution_clock::now();

    for (const auto& ccol : m_custom_columns) {
        for (const auto& icol : ccol.get_icols()) {
            m_expr_icols.insert(icol);
        }
    }
}

t_gnode::t_gnode(const t_gnode_options& options)
    : m_mode(NODE_PROCESSING_SIMPLE_DATAFLOW)
    , m_gnode_type(options.m_gnode_type)
    , m_tblschema(options.m_port_schema.drop({"psp_op", "psp_pkey"}))
    , m_init(false)
    , m_id(0)
    , m_pool_cleanup([]() {}) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_gnode");

    std::vector<t_dtype> trans_types(m_tblschema.size());
    for (t_uindex idx = 0; idx < trans_types.size(); ++idx) {
        trans_types[idx] = DTYPE_UINT8;
    }

    t_schema port_schema(options.m_port_schema);
    if (!(port_schema.is_pkey())) {
        PSP_COMPLAIN_AND_ABORT("gnode type specified as explicit pkey, however input "
                                "schema is missing required columns.");
    }

    t_schema trans_schema(m_tblschema.columns(), trans_types);
    t_schema existed_schema(
        std::vector<std::string>{"psp_existed"}, std::vector<t_dtype>{DTYPE_BOOL});

    m_ischemas = std::vector<t_schema>{port_schema};
    m_oschemas = std::vector<t_schema>{
        port_schema, m_tblschema, m_tblschema, m_tblschema, trans_schema, existed_schema};
    m_epoch = std::chrono::high_resolution_clock::now();
}

std::shared_ptr<t_gnode>
t_gnode::build(const t_gnode_options& options) {
    auto rv = std::make_shared<t_gnode>(options);
    rv->init();
    return rv;
}

t_gnode::t_gnode(const t_schema& tblschema, const t_schema& portschema)
    : m_mode(NODE_PROCESSING_SIMPLE_DATAFLOW)
    , m_gnode_type(GNODE_TYPE_PKEYED)
    , m_tblschema(tblschema)
    , m_ischemas(std::vector<t_schema>{portschema})
    , m_init(false)
    , m_id(0)
    , m_pool_cleanup([]() {}) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_gnode");

    std::vector<t_dtype> trans_types(m_tblschema.size());
    for (t_uindex idx = 0; idx < trans_types.size(); ++idx) {
        trans_types[idx] = DTYPE_UINT8;
    }

    t_schema trans_schema(m_tblschema.columns(), trans_types);
    t_schema existed_schema(
        std::vector<std::string>{"psp_existed"}, std::vector<t_dtype>{DTYPE_BOOL});

    m_oschemas = std::vector<t_schema>{
        portschema, m_tblschema, m_tblschema, m_tblschema, trans_schema, existed_schema};
    m_epoch = std::chrono::high_resolution_clock::now();
}

t_gnode::t_gnode(t_gnode_processing_mode mode, const t_schema& tblschema,
    const std::vector<t_schema>& ischemas, const std::vector<t_schema>& oschemas,
    const std::vector<t_custom_column>& custom_columns)
    : m_mode(mode)
    , m_gnode_type(GNODE_TYPE_PKEYED)
    , m_tblschema(tblschema)
    , m_ischemas(ischemas)
    , m_oschemas(oschemas)
    , m_init(false)
    , m_id(0)
    , m_custom_columns(custom_columns)
    , m_pool_cleanup([]() {}) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_gnode");

    PSP_VERBOSE_ASSERT(
        mode == NODE_PROCESSING_SIMPLE_DATAFLOW, "Only simple dataflows supported currently");

    PSP_VERBOSE_ASSERT(m_ischemas.size() == 1, "Single input port supported currently");
    m_epoch = std::chrono::high_resolution_clock::now();

    for (const auto& ccol : custom_columns) {
        for (const auto& icol : ccol.get_icols()) {
            m_expr_icols.insert(icol);
        }
    }
}

t_gnode::~t_gnode() {
    PSP_TRACE_SENTINEL();
    LOG_DESTRUCTOR("t_gnode");
    m_pool_cleanup();
}

void
t_gnode::init() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_ischemas.size() == 1, "Single input port supported currently");

    m_state = std::make_shared<t_gstate>(m_tblschema, m_ischemas[0]);
    m_state->init();

    for (t_uindex idx = 0, loop_end = m_ischemas.size(); idx < loop_end; ++idx) {
        std::shared_ptr<t_port> port
            = std::make_shared<t_port>(PORT_MODE_PKEYED, m_ischemas[idx]);
        port->init();
        m_iports.push_back(port);
    }

    for (t_uindex idx = 0, loop_end = m_oschemas.size(); idx < loop_end; ++idx) {
        t_port_mode mode = idx == 0 ? PORT_MODE_PKEYED : PORT_MODE_RAW;

        std::shared_ptr<t_port> port = std::make_shared<t_port>(mode, m_oschemas[idx]);

        port->init();
        m_oports.push_back(port);
    }

    std::shared_ptr<t_port>& iport = m_iports[0];
    std::shared_ptr<t_data_table> flattened = iport->get_table()->flatten();
    m_init = true;
}

std::string
t_gnode::repr() const {
    std::stringstream ss;
    ss << "t_gnode<" << this << ">";
    return ss.str();
}

void
t_gnode::_send(t_uindex portid, const t_data_table& fragments) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(portid == 0, "Only simple dataflows supported currently");

    std::shared_ptr<t_port>& iport = m_iports[portid];
    iport->send(fragments);
}

void
t_gnode::_send_and_process(const t_data_table& fragments) {
    _send(0, fragments);
    _process();
}

t_value_transition
t_gnode::calc_transition(bool prev_existed, bool row_pre_existed, bool exists, bool prev_valid,
    bool cur_valid, bool prev_cur_eq, bool prev_pkey_eq) {
    t_value_transition trans = VALUE_TRANSITION_EQ_FF;

    if (!row_pre_existed && !cur_valid && !t_env::backout_invalid_neq_ft()) {
        trans = VALUE_TRANSITION_NEQ_FT;
    } else if (row_pre_existed && !prev_valid && !cur_valid
        && !t_env::backout_eq_invalid_invalid()) {
        trans = VALUE_TRANSITION_EQ_TT;
    } else if (!prev_existed && !exists) {
        trans = VALUE_TRANSITION_EQ_FF;
    } else if (row_pre_existed && exists && !prev_valid && cur_valid
        && !t_env::backout_nveq_ft()) {
        trans = VALUE_TRANSITION_NVEQ_FT;
    } else if (prev_existed && exists && prev_cur_eq) {
        trans = VALUE_TRANSITION_EQ_TT;
    } else if (!prev_existed && exists) {
        trans = VALUE_TRANSITION_NEQ_FT;
    } else if (prev_existed && !exists) {
        trans = VALUE_TRANSITION_NEQ_TF;
    }

    else if (prev_existed && exists && !prev_cur_eq) {
        trans = VALUE_TRANSITION_NEQ_TT;
    } else if (prev_pkey_eq) {
        // prev op must have been a delete
        trans = VALUE_TRANSITION_NEQ_TDT;
    } else {
        PSP_COMPLAIN_AND_ABORT("Hit unexpected condition");
    }
    return trans;
}

void
t_gnode::populate_icols_in_flattened(
    const std::vector<t_rlookup>& lkup, std::shared_ptr<t_data_table>& flat) const {
    PSP_VERBOSE_ASSERT(lkup.size() == flat->size(), "Mismatched sizes encountered");

    t_uindex nrows = lkup.size();
    t_uindex ncols = m_expr_icols.size();

    std::vector<const t_column*> icols(ncols);
    std::vector<t_column*> ocols(ncols);
    std::vector<std::string> cnames(ncols);

    t_uindex count = 0;
    const t_data_table* stable = get_table();

    for (const auto& cname : m_expr_icols) {
        icols[count] = stable->get_const_column(cname).get();
        ocols[count] = flat->get_column(cname).get();
        cnames[count] = cname;
        ++count;
    }

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0, int(ncols), 1,
        [&lkup, &icols, &ocols, nrows](int colidx)
#else
    for (t_uindex colidx = 0; colidx < ncols; ++colidx)
#endif
        {
            auto icol = icols[colidx];
            auto ocol = ocols[colidx];

            for (t_uindex ridx = 0; ridx < nrows; ++ridx) {
                const auto& lk = lkup[ridx];
                if (!ocol->is_valid(ridx) && lk.m_exists) {
                    ocol->set_scalar(ridx, icol->get_scalar(lk.m_idx));
                }
            }
        }

#ifdef PSP_PARALLEL_FOR
    );
#endif
}

void
t_gnode::clear_deltas() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    for (auto& kv : m_contexts) {
        switch (kv.second.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                static_cast<t_ctx2*>(kv.second.m_ctx)->clear_deltas();
            } break;
            case ONE_SIDED_CONTEXT: {
                static_cast<t_ctx1*>(kv.second.m_ctx)->clear_deltas();
            } break;
            case ZERO_SIDED_CONTEXT: {
                static_cast<t_ctx0*>(kv.second.m_ctx)->clear_deltas();
            } break;
            case GROUPED_PKEY_CONTEXT: {
                static_cast<t_ctx_grouped_pkey*>(kv.second.m_ctx)->clear_deltas();
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    }
}

std::shared_ptr<t_data_table>
t_gnode::_process_table() {

    m_was_updated = false;
    auto t1 = std::chrono::high_resolution_clock::now();

    std::shared_ptr<t_port>& iport = m_iports[0];

    if (iport->get_table()->size() == 0) {
        return nullptr;
    }

    m_was_updated = true;
    std::shared_ptr<t_data_table> flattened(iport->get_table()->flatten());
    PSP_GNODE_VERIFY_TABLE(flattened);
    PSP_GNODE_VERIFY_TABLE(get_table());

    psp_log_time(repr() + " _process.post_flatten");

    if (t_env::log_data_gnode_flattened()) {
        std::cout << repr() << "gnode_process_flattened" << std::endl;
        flattened->pprint();
    }

    if (t_env::log_schema_gnode_flattened()) {
        std::cout << repr() << "gnode_schema_flattened" << std::endl;
        std::cout << flattened->get_schema();
    }

    if (m_state->mapping_size() == 0) {
        psp_log_time(repr() + " _process.init_path.post_fill_expr");

        m_state->update_history(flattened.get());
        psp_log_time(repr() + " _process.init_path.post_update_history");
        _update_contexts_from_state(*flattened);
        psp_log_time(repr() + " _process.init_path.post_update_contexts_from_state");
        m_oports[PSP_PORT_FLATTENED]->set_table(flattened);

        release_inputs();
        psp_log_time(repr() + " _process.init_path.post_release_inputs");

        release_outputs();
        psp_log_time(repr() + " _process.init_path.exit");

#ifdef PSP_GNODE_VERIFY
        auto stable = get_table();
        PSP_GNODE_VERIFY_TABLE(stable);
#endif

        return nullptr;
    }

    for (t_uindex idx = 0, loop_end = m_iports.size(); idx < loop_end; ++idx) {
        m_iports[idx]->release_or_clear();
    }

    t_uindex fnrows = flattened->num_rows();

    std::shared_ptr<t_data_table> delta = m_oports[PSP_PORT_DELTA]->get_table();
    delta->clear();
    delta->reserve(fnrows);

    std::shared_ptr<t_data_table> prev = m_oports[PSP_PORT_PREV]->get_table();
    prev->clear();
    prev->reserve(fnrows);

    std::shared_ptr<t_data_table> current = m_oports[PSP_PORT_CURRENT]->get_table();
    current->clear();
    current->reserve(fnrows);

    std::shared_ptr<t_data_table> transitions = m_oports[PSP_PORT_TRANSITIONS]->get_table();
    transitions->clear();
    transitions->reserve(fnrows);

    std::shared_ptr<t_data_table> existed = m_oports[PSP_PORT_EXISTED]->get_table();
    existed->clear();
    existed->reserve(fnrows);
    existed->set_size(fnrows);

    const t_schema& fschema = flattened->get_schema();

    std::shared_ptr<t_column> pkey_col_sptr = flattened->get_column("psp_pkey");
    std::shared_ptr<t_column> op_col_sptr = flattened->get_column("psp_op");

    t_column* pkey_col = pkey_col_sptr.get();
    t_column* op_col = op_col_sptr.get();
    t_data_table* stable = get_table();
    PSP_GNODE_VERIFY_TABLE(stable);
    const t_schema& sschema = m_state->get_schema();

    std::vector<const t_column*> fcolumns(flattened->num_columns());
    t_uindex ncols = sschema.get_num_columns();

    std::vector<const t_column*> scolumns(ncols);
    std::vector<t_column*> dcolumns(ncols);
    std::vector<t_column*> pcolumns(ncols);
    std::vector<t_column*> ccolumns(ncols);
    std::vector<t_column*> tcolumns(ncols);

    std::vector<t_uindex> col_translation(stable->num_columns());
    t_uindex count = 0;

    std::string opname("psp_op");
    std::string pkeyname("psp_pkey");

    for (t_uindex idx = 0, loop_end = fschema.size(); idx < loop_end; ++idx) {
        const std::string& cname = fschema.m_columns[idx];
        if (cname != opname && cname != pkeyname) {
            col_translation[count] = idx;
            fcolumns[idx] = flattened->get_column(cname).get();
            ++count;
        }
    }

    for (t_uindex idx = 0, loop_end = sschema.size(); idx < loop_end; ++idx) {
        const std::string& cname = sschema.m_columns[idx];
        scolumns[idx] = stable->get_column(cname).get();
        pcolumns[idx] = prev->get_column(cname).get();
        ccolumns[idx] = current->get_column(cname).get();
        dcolumns[idx] = delta->get_column(cname).get();
        tcolumns[idx] = transitions->get_column(cname).get();
    }

    t_column* ecolumn = existed->get_column("psp_existed").get();

    t_tscalar prev_pkey;
    prev_pkey.clear();

    const t_gstate& cstate = *(m_state.get());

    std::vector<t_tscalar> existing_insert_pkeys;

    t_mask mask(fnrows);

    t_uindex added_count = 0;

    std::uint8_t* op_base = op_col->get_nth<std::uint8_t>(0);
    std::vector<t_uindex> added_offset(fnrows);
    std::vector<t_rlookup> lkup(fnrows);
    std::vector<bool> prev_pkey_eq_vec(fnrows);

    for (t_uindex idx = 0; idx < fnrows; ++idx) {
        t_tscalar pkey = pkey_col->get_scalar(idx);
        std::uint8_t op_ = op_base[idx];
        t_op op = static_cast<t_op>(op_);

        lkup[idx] = cstate.lookup(pkey);
        bool row_pre_existed = lkup[idx].m_exists;
        prev_pkey_eq_vec[idx] = pkey == prev_pkey;

        added_offset[idx] = added_count;

        switch (op) {
            case OP_INSERT: {
                row_pre_existed = row_pre_existed && !prev_pkey_eq_vec[idx];
                mask.set(idx, true);
                ecolumn->set_nth(added_count, row_pre_existed);
                ++added_count;
            } break;
            case OP_DELETE: {
                if (row_pre_existed) {
                    mask.set(idx, true);
                    ecolumn->set_nth(added_count, row_pre_existed);
                    ++added_count;
                } else {
                    mask.set(idx, false);
                }
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unknown OP"); }
        }

        prev_pkey = pkey;
    }

    auto mask_count = mask.count();

    PSP_VERBOSE_ASSERT(mask_count == added_count, "Expected equality");

    delta->set_size(mask_count);
    prev->set_size(mask_count);
    current->set_size(mask_count);
    transitions->set_size(mask_count);
    existed->set_size(mask_count);

    psp_log_time(repr() + " _process.noinit_path.post_rlkup_loop");
    if (!m_expr_icols.empty()) {
        populate_icols_in_flattened(lkup, flattened);
    }

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0, int(ncols), 1,
        [&fcolumns, &scolumns, &dcolumns, &pcolumns, &ccolumns, &tcolumns, &col_translation,
            &op_base, &lkup, &prev_pkey_eq_vec, &added_offset, this](int colidx)
#else
    for (t_uindex colidx = 0; colidx < ncols; ++colidx)
#endif
        {
            auto fcolumn = fcolumns[col_translation[colidx]];
            auto scolumn = scolumns[colidx];
            auto dcolumn = dcolumns[colidx];
            auto pcolumn = pcolumns[colidx];
            auto ccolumn = ccolumns[colidx];
            auto tcolumn = tcolumns[colidx];

            t_dtype col_dtype = fcolumn->get_dtype();

            switch (col_dtype) {
                case DTYPE_INT64: {
                    _process_helper<std::int64_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_INT32: {
                    _process_helper<std::int32_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_INT16: {
                    _process_helper<std::int16_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_INT8: {
                    _process_helper<std::int8_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_UINT64: {
                    _process_helper<std::uint64_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_UINT32: {
                    _process_helper<std::uint32_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_UINT16: {
                    _process_helper<std::uint16_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_UINT8: {
                    _process_helper<std::uint8_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_FLOAT64: {
                    _process_helper<double>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_FLOAT32: {
                    _process_helper<float>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn, tcolumn,
                        op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_BOOL: {
                    _process_helper<std::uint8_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_TIME: {
                    _process_helper<std::int64_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_DATE: {
                    _process_helper<std::uint32_t>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                case DTYPE_STR: {
                    _process_helper<std::string>(fcolumn, scolumn, dcolumn, pcolumn, ccolumn,
                        tcolumn, op_base, lkup, prev_pkey_eq_vec, added_offset);
                } break;
                default: { PSP_COMPLAIN_AND_ABORT("Unsupported column dtype"); }
            }
        }
#ifdef PSP_PARALLEL_FOR
    );
#endif

    psp_log_time(repr() + " _process.noinit_path.post_process_helper");

    std::shared_ptr<t_data_table> flattened_masked
        = mask.count() == flattened->size() ? flattened : flattened->clone(mask);
    PSP_GNODE_VERIFY_TABLE(flattened_masked);
#ifdef PSP_GNODE_VERIFY
    {
        auto updated_table = get_table();
        PSP_GNODE_VERIFY_TABLE(updated_table);
    }
#endif
    m_state->update_history(flattened_masked.get());
#ifdef PSP_GNODE_VERIFY
    {
        auto updated_table = get_table();
        PSP_GNODE_VERIFY_TABLE(updated_table);
    }
#endif

    psp_log_time(repr() + " _process.noinit_path.post_update_history");

    m_oports[PSP_PORT_FLATTENED]->set_table(flattened_masked);

    if (t_env::log_data_gnode_flattened()) {
        std::cout << repr() << "gnode_process_flattened_mask" << std::endl;
        flattened_masked->pprint();
    }

    if (t_env::log_data_gnode_delta()) {
        std::cout << repr() << "gnode_process_delta" << std::endl;
        delta->pprint();
    }

    if (t_env::log_data_gnode_prev()) {
        std::cout << repr() << "gnode_process_prev" << std::endl;
        prev->pprint();
    }

    if (t_env::log_data_gnode_current()) {
        std::cout << repr() << "gnode_process_current" << std::endl;
        current->pprint();
    }

    if (t_env::log_data_gnode_transitions()) {
        std::cout << repr() << "gnode_process_transitions" << std::endl;
        transitions->pprint();
    }

    if (t_env::log_data_gnode_existed()) {
        std::cout << repr() << "gnode_process_existed" << std::endl;
        existed->pprint();
    }

    if (t_env::log_time_gnode_process()) {
        auto t2 = std::chrono::high_resolution_clock::now();
        std::cout << repr() << " gnode_process_time "
                  << std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count()
                  << std::endl;
        std::cout << repr() << "gnode_process_time since begin=> "
                  << std::chrono::duration_cast<std::chrono::milliseconds>(t2 - m_epoch).count()
                  << std::endl;
    }

    return flattened_masked;
}

void
t_gnode::_process() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(
        m_mode == NODE_PROCESSING_SIMPLE_DATAFLOW, "Only simple dataflows supported currently");
    psp_log_time(repr() + " _process.enter");

    std::shared_ptr<t_data_table> flattened_masked = _process_table();
    if (flattened_masked) {
        notify_contexts(*flattened_masked);
    }

    psp_log_time(repr() + " _process.noinit_path.exit");
}

t_uindex
t_gnode::mapping_size() const {
    return m_state->mapping_size();
}

t_data_table*
t_gnode::_get_otable(t_uindex portidx) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(portidx < m_oports.size(), "Invalid port number");
    return m_oports[portidx]->get_table().get();
}

t_data_table*
t_gnode::_get_itable(t_uindex portidx) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(portidx < m_iports.size(), "Invalid port number");
    return m_iports[portidx]->get_table().get();
}

t_data_table*
t_gnode::get_table() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_state->get_table().get();
}

const t_data_table*
t_gnode::get_table() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_state->get_table().get();
}

std::shared_ptr<t_data_table>
t_gnode::get_table_sptr() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_state->get_table();
}

/**
 * Convenience method for promoting a column.  This is a hack used to
 * interop with javascript more efficiently, and does not handle all
 * possible type conversions.  Non-public.
 */
void
t_gnode::promote_column(const std::string& name, t_dtype new_type) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    get_table()->promote_column(name, new_type, 0, false);
    _get_otable(0)->promote_column(name, new_type, 0, false);
    _get_itable(0)->promote_column(name, new_type, 0, false);
    m_tblschema.retype_column(name, new_type);
    m_ischemas[0].retype_column(name, new_type);
    m_oschemas[0].retype_column(name, new_type);
}

void
t_gnode::pprint() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_state->pprint();
}

template <typename CTX_T>
void
t_gnode::set_ctx_state(void* ptr) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    CTX_T* ctx = static_cast<CTX_T*>(ptr);
    ctx->set_state(m_state);
}

void
t_gnode::_update_contexts_from_state(const t_data_table& tbl) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    for (auto& kv : m_contexts) {
        auto& ctxh = kv.second;
        switch (ctxh.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                auto ctx = static_cast<t_ctx2*>(ctxh.m_ctx);
                ctx->reset();
                update_context_from_state<t_ctx2>(ctx, tbl);
            } break;
            case ONE_SIDED_CONTEXT: {
                auto ctx = static_cast<t_ctx1*>(ctxh.m_ctx);
                ctx->reset();
                update_context_from_state<t_ctx1>(ctx, tbl);
            } break;
            case ZERO_SIDED_CONTEXT: {
                auto ctx = static_cast<t_ctx0*>(ctxh.m_ctx);
                ctx->reset();
                update_context_from_state<t_ctx0>(ctx, tbl);
            } break;
            case GROUPED_PKEY_CONTEXT: {
                auto ctx = static_cast<t_ctx_grouped_pkey*>(ctxh.m_ctx);
                ctx->reset();
                update_context_from_state<t_ctx_grouped_pkey>(ctx, tbl);
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    }
}

std::vector<std::string>
t_gnode::get_registered_contexts() const {
    std::vector<std::string> rval;

    for (const auto& kv : m_contexts) {
        std::stringstream ss;
        const auto& ctxh = kv.second;
        ss << "(ctx_name => " << kv.first << ", ";

        switch (ctxh.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                auto ctx = static_cast<const t_ctx2*>(ctxh.m_ctx);
                ss << ctx->repr() << ")";
            } break;
            case ONE_SIDED_CONTEXT: {
                auto ctx = static_cast<const t_ctx1*>(ctxh.m_ctx);
                ss << ctx->repr() << ")";
            } break;
            case ZERO_SIDED_CONTEXT: {
                auto ctx = static_cast<const t_ctx0*>(ctxh.m_ctx);
                ss << ctx->repr() << ")";
            } break;
            case GROUPED_PKEY_CONTEXT: {
                auto ctx = static_cast<const t_ctx_grouped_pkey*>(ctxh.m_ctx);
                ss << ctx->repr() << ")";
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }

        rval.push_back(ss.str());
    }

    return rval;
}

void
t_gnode::_update_contexts_from_state() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    auto flattened = m_state->get_pkeyed_table();
    _update_contexts_from_state(*flattened);
}

void
t_gnode::_register_context(const std::string& name, t_ctx_type type, std::int64_t ptr) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    void* ptr_ = reinterpret_cast<void*>(ptr);
    t_ctx_handle ch(ptr_, type);
    m_contexts[name] = ch;

    bool should_update = m_state->mapping_size() > 0;

    std::shared_ptr<t_data_table> flattened;

    if (should_update) {
        flattened = m_state->get_pkeyed_table();
    }

    auto pkeyed_tblcontext = m_state->get_port_schema().get_table_context();

    auto non_pkeyed_tblcontext = m_state->get_table()->get_schema().get_table_context();

    switch (type) {
        case TWO_SIDED_CONTEXT: {
            set_ctx_state<t_ctx2>(ptr_);
            t_ctx2* ctx = static_cast<t_ctx2*>(ptr_);
            if (t_env::log_progress()) {
                std::cout << repr() << " << gnode.register_context: "
                          << " name => " << name << " type => " << type << " ctx => "
                          << ctx->repr() << std::endl;
            }

            ctx->reset();

            if (should_update)
                update_context_from_state<t_ctx2>(ctx, *flattened);
        } break;
        case ONE_SIDED_CONTEXT: {
            set_ctx_state<t_ctx1>(ptr_);
            t_ctx1* ctx = static_cast<t_ctx1*>(ptr_);
            if (t_env::log_progress()) {
                std::cout << repr() << " << gnode.register_context: "
                          << " name => " << name << " type => " << type << " ctx => "
                          << ctx->repr() << std::endl;
            }

            ctx->reset();

            if (should_update)
                update_context_from_state<t_ctx1>(ctx, *flattened);
        } break;
        case ZERO_SIDED_CONTEXT: {
            set_ctx_state<t_ctx0>(ptr_);
            t_ctx0* ctx = static_cast<t_ctx0*>(ptr_);
            if (t_env::log_progress()) {
                std::cout << repr() << " << gnode.register_context: "
                          << " name => " << name << " type => " << type << " ctx => "
                          << ctx->repr() << std::endl;
            }

            ctx->reset();

            if (should_update)
                update_context_from_state<t_ctx0>(ctx, *flattened);
        } break;
        case GROUPED_PKEY_CONTEXT: {
            set_ctx_state<t_ctx0>(ptr_);
            auto ctx = static_cast<t_ctx_grouped_pkey*>(ptr_);
            if (t_env::log_progress()) {
                std::cout << repr() << " << gnode.register_context: "
                          << " name => " << name << " type => " << type << " ctx => "
                          << ctx->repr() << std::endl;
            }

            ctx->reset();

            if (should_update)
                update_context_from_state<t_ctx_grouped_pkey>(ctx, *flattened);
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
    }
}

void
t_gnode::_unregister_context(const std::string& name) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    if ((m_contexts.find(name) == m_contexts.end()))
        return;

    PSP_VERBOSE_ASSERT(m_contexts.find(name) != m_contexts.end(), "Context not found.");
    m_contexts.erase(name);
}

void
t_gnode::notify_contexts(const t_data_table& flattened) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    psp_log_time(repr() + "notify_contexts.enter");
    t_index num_ctx = m_contexts.size();
    t_sctxhvec ctxhvec(num_ctx);

    t_index ctxh_count = 0;
    for (t_sctxhmap::const_iterator iter = m_contexts.begin(); iter != m_contexts.end();
         ++iter) {
        ctxhvec[ctxh_count] = iter->second;
        ctxh_count++;
    }

    auto notify_context_helper = [this, &ctxhvec, &flattened](t_index ctxidx) {
        const t_ctx_handle& ctxh = ctxhvec[ctxidx];
        switch (ctxh.get_type()) {
            case TWO_SIDED_CONTEXT: {
                notify_context<t_ctx2>(flattened, ctxh);
            } break;
            case ONE_SIDED_CONTEXT: {
                notify_context<t_ctx1>(flattened, ctxh);
            } break;
            case ZERO_SIDED_CONTEXT: {
                notify_context<t_ctx0>(flattened, ctxh);
            } break;
            case GROUPED_PKEY_CONTEXT: {
                notify_context<t_ctx_grouped_pkey>(flattened, ctxh);
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    };

    if (has_python_dep()) {
        for (t_index ctxidx = 0; ctxidx < num_ctx; ++ctxidx) {
            notify_context_helper(ctxidx);
        }
    } else {
#ifdef PSP_PARALLEL_FOR
        PSP_PFOR(0, int(num_ctx), 1,
            [&notify_context_helper](int ctxidx)
#else
        for (t_index ctxidx = 0; ctxidx < num_ctx; ++ctxidx)
#endif
            { notify_context_helper(ctxidx); }

#ifdef PSP_PARALLEL_FOR
        );
#endif
    }

    psp_log_time(repr() + "notify_contexts.exit");
}

std::vector<t_pivot>
t_gnode::get_pivots() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    std::vector<t_pivot> rval;

    for (t_sctxhmap::const_iterator iter = m_contexts.begin(); iter != m_contexts.end();
         ++iter) {
        auto ctxh = iter->second;

        switch (ctxh.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                const t_ctx2* ctx = static_cast<const t_ctx2*>(ctxh.m_ctx);
                auto pivots = ctx->get_pivots();
                rval.insert(std::end(rval), std::begin(pivots), std::end(pivots));
            } break;
            case ONE_SIDED_CONTEXT: {
                const t_ctx1* ctx = static_cast<const t_ctx1*>(ctxh.m_ctx);
                auto pivots = ctx->get_pivots();
                rval.insert(std::end(rval), std::begin(pivots), std::end(pivots));
            } break;
            case ZERO_SIDED_CONTEXT:
            case GROUPED_PKEY_CONTEXT: {
                // no pivots
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    }

    return rval;
}

t_schema
t_gnode::get_tblschema() const {
    return m_tblschema;
}

std::vector<t_stree*>
t_gnode::get_trees() {

    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    std::vector<t_stree*> rval;

    for (const auto& kv : m_contexts) {
        auto& ctxh = kv.second;

        switch (ctxh.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx2*>(ctxh.m_ctx);
                auto trees = ctx->get_trees();
                rval.insert(rval.end(), std::begin(trees), std::end(trees));
            } break;
            case ONE_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx1*>(ctxh.m_ctx);
                auto trees = ctx->get_trees();
                rval.insert(rval.end(), std::begin(trees), std::end(trees));
            } break;
            case ZERO_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx0*>(ctxh.m_ctx);
                auto trees = ctx->get_trees();
                rval.insert(rval.end(), std::begin(trees), std::end(trees));
            } break;
            case GROUPED_PKEY_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx_grouped_pkey*>(ctxh.m_ctx);
                auto trees = ctx->get_trees();
                rval.insert(rval.end(), std::begin(trees), std::end(trees));
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    }
    return rval;
}

void
t_gnode::set_id(t_uindex id) {
    m_id = id;
}

t_uindex
t_gnode::get_id() const {
    return m_id;
}

void
t_gnode::release_inputs() {
    for (const auto& p : m_iports) {
        p->release();
    }
}

void
t_gnode::release_outputs() {
    for (const auto& p : m_oports) {
        p->release();
    }
}

std::vector<std::string>
t_gnode::get_contexts_last_updated() const {
    std::vector<std::string> rval;

    for (const auto& kv : m_contexts) {
        auto ctxh = kv.second;
        switch (ctxh.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx2*>(ctxh.m_ctx);
                if (ctx->has_deltas()) {
                    rval.push_back(kv.first);
                }
            } break;
            case ONE_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx1*>(ctxh.m_ctx);
                if (ctx->has_deltas()) {
                    rval.push_back(kv.first);
                }
            } break;
            case ZERO_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx0*>(ctxh.m_ctx);
                if (ctx->has_deltas()) {
                    rval.push_back(kv.first);
                }
            } break;
            case GROUPED_PKEY_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx_grouped_pkey*>(ctxh.m_ctx);
                if (ctx->has_deltas()) {
                    rval.push_back(kv.first);
                }
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    }

    if (t_env::log_progress()) {
        std::cout << "get_contexts_last_updated<" << std::endl;
        for (const auto& s : rval) {
            std::cout << "\t" << s << std::endl;
        }
        std::cout << ">\n";
    }
    return rval;
}

std::vector<t_tscalar>
t_gnode::get_row_data_pkeys(const std::vector<t_tscalar>& pkeys) const {
    return m_state->get_row_data_pkeys(pkeys);
}

std::vector<t_tscalar>
t_gnode::has_pkeys(const std::vector<t_tscalar>& pkeys) const {
    return m_state->has_pkeys(pkeys);
}

std::vector<t_tscalar>
t_gnode::get_pkeys() const {
    return m_state->get_pkeys();
}

void
t_gnode::reset() {
    std::vector<std::string> rval;

    for (const auto& kv : m_contexts) {
        auto ctxh = kv.second;
        switch (ctxh.m_ctx_type) {
            case TWO_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx2*>(ctxh.m_ctx);
                ctx->reset();
            } break;
            case ONE_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx1*>(ctxh.m_ctx);
                ctx->reset();
            } break;
            case ZERO_SIDED_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx0*>(ctxh.m_ctx);
                ctx->reset();
            } break;
            case GROUPED_PKEY_CONTEXT: {
                auto ctx = reinterpret_cast<t_ctx_grouped_pkey*>(ctxh.m_ctx);
                ctx->reset();
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unexpected context type"); } break;
        }
    }

    m_state->reset();
}

void
t_gnode::clear_input_ports() {
    for (t_uindex idx = 0, loop_end = m_oports.size(); idx < loop_end; ++idx) {
        m_iports[idx]->get_table()->clear();
    }
}

void
t_gnode::clear_output_ports() {
    for (t_uindex idx = 0, loop_end = m_oports.size(); idx < loop_end; ++idx) {
        m_oports[idx]->get_table()->clear();
    }
}

template <>
void
t_gnode::_process_helper<std::string>(const t_column* fcolumn, const t_column* scolumn,
    t_column* dcolumn, t_column* pcolumn, t_column* ccolumn, t_column* tcolumn,
    const std::uint8_t* op_base, std::vector<t_rlookup>& lkup,
    std::vector<bool>& prev_pkey_eq_vec, std::vector<t_uindex>& added_vec) {
    pcolumn->borrow_vocabulary(*scolumn);

    for (t_uindex idx = 0, loop_end = fcolumn->size(); idx < loop_end; ++idx) {
        std::uint8_t op_ = op_base[idx];
        t_op op = static_cast<t_op>(op_);
        t_uindex added_count = added_vec[idx];

        const t_rlookup& rlookup = lkup[idx];
        bool row_pre_existed = rlookup.m_exists;

        switch (op) {
            case OP_INSERT: {
                row_pre_existed = row_pre_existed && !prev_pkey_eq_vec[idx];

                const char* prev_value = 0;
                bool prev_valid = false;

                auto cur_value = fcolumn->get_nth<const char>(idx);
                std::string curs(cur_value);

                bool cur_valid = fcolumn->is_valid(idx);

                if (row_pre_existed) {
                    prev_value = scolumn->get_nth<const char>(rlookup.m_idx);
                    prev_valid = scolumn->is_valid(rlookup.m_idx);
                }

                bool exists = cur_valid;
                bool prev_existed = row_pre_existed && prev_valid;
                bool prev_cur_eq
                    = prev_value && cur_value && strcmp(prev_value, cur_value) == 0;

                auto trans = calc_transition(prev_existed, row_pre_existed, exists, prev_valid,
                    cur_valid, prev_cur_eq, prev_pkey_eq_vec[idx]);

                if (prev_valid) {
                    pcolumn->set_nth<t_uindex>(
                        added_count, *(scolumn->get_nth<t_uindex>(rlookup.m_idx)));
                }

                pcolumn->set_valid(added_count, prev_valid);

                if (cur_valid) {
                    ccolumn->set_nth<const char*>(added_count, cur_value);
                }

                if (!cur_valid && prev_valid) {
                    ccolumn->set_nth<const char*>(added_count, prev_value);
                }

                ccolumn->set_valid(added_count, cur_valid ? cur_valid : prev_valid);

                tcolumn->set_nth<std::uint8_t>(idx, trans);
            } break;
            case OP_DELETE: {
                if (row_pre_existed) {
                    auto prev_value = scolumn->get_nth<const char>(rlookup.m_idx);

                    bool prev_valid = scolumn->is_valid(rlookup.m_idx);

                    pcolumn->set_nth<const char*>(added_count, prev_value);

                    pcolumn->set_valid(added_count, prev_valid);

                    ccolumn->set_nth<const char*>(added_count, prev_value);

                    ccolumn->set_valid(added_count, prev_valid);

                    tcolumn->set_nth<std::uint8_t>(added_count, VALUE_TRANSITION_NEQ_TDF);
                }
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unknown OP"); }
        }
    }
}

t_data_table*
t_gnode::_get_pkeyed_table() const {
    return m_state->_get_pkeyed_table();
}

std::vector<t_custom_column>
t_gnode::get_custom_columns() const {
    return m_custom_columns;
}

t_gnode_recipe
t_gnode::get_recipe() const {
    t_gnode_recipe rv;
    rv.m_mode = m_mode;

    rv.m_tblschema = m_tblschema.get_recipe();

    for (const auto& s : m_ischemas) {
        rv.m_ischemas.push_back(s.get_recipe());
    }

    for (const auto& s : m_oschemas) {
        rv.m_oschemas.push_back(s.get_recipe());
    }

    for (const auto& cc : m_custom_columns) {
        rv.m_custom_columns.push_back(cc.get_recipe());
    }
    return rv;
}

bool
t_gnode::has_python_dep() const {
    return !m_custom_columns.empty();
}

void
t_gnode::set_pool_cleanup(std::function<void()> cleanup) {
    m_pool_cleanup = cleanup;
}

const t_schema&
t_gnode::get_port_schema() const {
    return m_state->get_port_schema();
}

bool
t_gnode::was_updated() const {
    return m_was_updated;
}

void
t_gnode::clear_updated() {
    m_was_updated = false;
}

std::shared_ptr<t_data_table>
t_gnode::get_sorted_pkeyed_table() const {
    return m_state->get_sorted_pkeyed_table();
}

void
t_gnode::register_context(const std::string& name, std::shared_ptr<t_ctx0> ctx) {
    _register_context(name, ZERO_SIDED_CONTEXT, reinterpret_cast<std::int64_t>(ctx.get()));
}

void
t_gnode::register_context(const std::string& name, std::shared_ptr<t_ctx1> ctx) {
    _register_context(name, ONE_SIDED_CONTEXT, reinterpret_cast<std::int64_t>(ctx.get()));
}

void
t_gnode::register_context(const std::string& name, std::shared_ptr<t_ctx2> ctx) {
    _register_context(name, TWO_SIDED_CONTEXT, reinterpret_cast<std::int64_t>(ctx.get()));
}
void
t_gnode::register_context(const std::string& name, std::shared_ptr<t_ctx_grouped_pkey> ctx) {
    _register_context(name, GROUPED_PKEY_CONTEXT, reinterpret_cast<std::int64_t>(ctx.get()));
}

} // end namespace perspective
