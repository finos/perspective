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
#include <perspective/port.h>
#include <perspective/schema.h>
#include <perspective/exports.h>
#include <perspective/context_handle.h>
#include <perspective/pivot.h>
#include <perspective/env_vars.h>
#include <perspective/custom_column.h>
#include <perspective/rlookup.h>
#include <perspective/gnode_state.h>
#include <perspective/sparse_tree.h>
#ifdef PSP_PARALLEL_FOR
#include <tbb/parallel_sort.h>
#include <tbb/tbb.h>
#endif
#include <chrono>

namespace perspective {

typedef std::function<void(std::shared_ptr<t_data_table>, std::shared_ptr<t_data_table>, const std::vector<t_rlookup>&)> t_computed_column_def;

PERSPECTIVE_EXPORT t_tscalar calc_delta(
    t_value_transition trans, t_tscalar oval, t_tscalar nval);

PERSPECTIVE_EXPORT t_tscalar calc_newer(
    t_value_transition trans, t_tscalar oval, t_tscalar nval);

PERSPECTIVE_EXPORT t_tscalar calc_negate(t_tscalar val);

struct PERSPECTIVE_EXPORT t_gnode_recipe {
    t_gnode_recipe() {}
    t_gnode_processing_mode m_mode;
    t_gnode_type m_gnode_type;
    t_schema_recipe m_tblschema;
    std::vector<t_schema_recipe> m_ischemas;
    std::vector<t_schema_recipe> m_oschemas;
    t_custom_column_recipevec m_custom_columns;
};

struct PERSPECTIVE_EXPORT t_gnode_options {
    t_gnode_type m_gnode_type;
    t_schema m_port_schema;
};

class t_ctx0;
class t_ctx1;
class t_ctx2;
class t_ctx_grouped_pkey;

#ifdef PSP_GNODE_VERIFY
#define PSP_GNODE_VERIFY_TABLE(X) (X)->verify()
#else
#define PSP_GNODE_VERIFY_TABLE(X)
#endif

class PERSPECTIVE_EXPORT t_gnode {
public:
    static std::shared_ptr<t_gnode> build(const t_gnode_options& options);
    t_gnode(const t_gnode_recipe& recipe);
    t_gnode(const t_gnode_options& options);
    t_gnode(const t_schema& tblschema, const t_schema& port_schema);
    t_gnode(t_gnode_processing_mode mode, const t_schema& tblschema,
        const std::vector<t_schema>& ischemas, const std::vector<t_schema>& oschemas,
        const std::vector<t_custom_column>& custom_columns);
    ~t_gnode();
    void init();

    // send data to input port with at index idx
    // schema should match port schema
    void _send(t_uindex idx, const t_data_table& fragments);
    void _send(t_uindex idx, const t_data_table& fragments, const std::vector<t_computed_column_def>& computed_lambdas);
    void _send_and_process(const t_data_table& fragments);
    void _process();
    void _process_self();
    void _register_context(const std::string& name, t_ctx_type type, std::int64_t ptr);
    void _unregister_context(const std::string& name);

    void begin_step();
    void end_step();

    void update_history(const t_data_table* tbl);

    t_data_table* _get_otable(t_uindex portidx);
    t_data_table* _get_itable(t_uindex portidx);
    t_data_table* get_table();
    const t_data_table* get_table() const;
    std::shared_ptr<t_data_table> get_table_sptr();

    void pprint() const;
    std::vector<std::string> get_registered_contexts() const;
    t_schema get_tblschema() const;
    std::vector<t_pivot> get_pivots() const;

    std::vector<t_stree*> get_trees();

    void set_id(t_uindex id);
    t_uindex get_id() const;

    void release_inputs();
    void release_outputs();
    std::vector<std::string> get_contexts_last_updated() const;

    void reset();
    std::string repr() const;
    void clear_input_ports();
    void clear_output_ports();

    t_data_table* _get_pkeyed_table() const;
    std::shared_ptr<t_data_table> get_pkeyed_table_sptr() const;
    std::shared_ptr<t_data_table> get_sorted_pkeyed_table() const;

    bool has_pkey(t_tscalar pkey) const;

    std::vector<t_tscalar> get_row_data_pkeys(const std::vector<t_tscalar>& pkeys) const;
    std::vector<t_tscalar> has_pkeys(const std::vector<t_tscalar>& pkeys) const;
    std::vector<t_tscalar> get_pkeys() const;

    std::vector<t_custom_column> get_custom_columns() const;

    t_gnode_recipe get_recipe() const;
    bool has_python_dep() const;
    void set_pool_cleanup(std::function<void()> cleanup);
    const t_schema& get_port_schema() const;
    bool was_updated() const;
    void clear_updated();

    t_uindex mapping_size() const;

    // helper function for tests
    std::shared_ptr<t_data_table> tstep(std::shared_ptr<const t_data_table> input_table);

    // helper function for JS interface
    void promote_column(const std::string& name, t_dtype new_type);

    // Gnode will steal a reference to the context
    void register_context(const std::string& name, std::shared_ptr<t_ctx0> ctx);
    void register_context(const std::string& name, std::shared_ptr<t_ctx1> ctx);
    void register_context(const std::string& name, std::shared_ptr<t_ctx2> ctx);
    void register_context(const std::string& name, std::shared_ptr<t_ctx_grouped_pkey> ctx);

    std::vector<t_computed_column_def> get_computed_lambdas() const;

protected:
    void recompute_columns(std::shared_ptr<t_data_table> table, std::shared_ptr<t_data_table> flattened, const std::vector<t_rlookup>& updated_ridxs);
    void append_computed_lambdas(std::vector<t_computed_column_def> new_lambdas);

    bool have_context(const std::string& name) const;
    void notify_contexts(const t_data_table& flattened);

    template <typename CTX_T>
    void notify_context(const t_data_table& flattened, const t_ctx_handle& ctxh);

    template <typename CTX_T>
    void notify_context(CTX_T* ctx, const t_data_table& flattened, const t_data_table& delta,
        const t_data_table& prev, const t_data_table& current, const t_data_table& transitions,
        const t_data_table& existed);

    template <typename CTX_T>
    void update_context_from_state(CTX_T* ctx, const t_data_table& tbl);

    template <typename CTX_T>
    void set_ctx_state(void* ptr);

    template <typename DATA_T>
    void _process_helper(const t_column* fcolumn, const t_column* scolumn, t_column* dcolumn,
        t_column* pcolumn, t_column* ccolumn, t_column* tcolumn, const std::uint8_t* op_base,
        std::vector<t_rlookup>& lkup, std::vector<bool>& prev_pkey_eq_vec,
        std::vector<t_uindex>& added_vec);

    t_value_transition calc_transition(bool prev_existed, bool row_pre_existed, bool exists,
        bool prev_valid, bool cur_valid, bool prev_cur_eq, bool prev_pkey_eq);

    void _update_contexts_from_state(const t_data_table& tbl);
    void _update_contexts_from_state();
    void clear_deltas();

private:
    void populate_icols_in_flattened(
        const std::vector<t_rlookup>& lkup, std::shared_ptr<t_data_table>& flat) const;

    std::shared_ptr<t_data_table> _process_table();
    
    std::vector<t_computed_column_def> m_computed_lambdas;
    t_gnode_processing_mode m_mode;
    t_gnode_type m_gnode_type;
    t_schema m_tblschema;
    std::vector<t_schema> m_ischemas;
    std::vector<t_schema> m_oschemas;
    bool m_init;
    std::vector<std::shared_ptr<t_port>> m_iports;
    std::vector<std::shared_ptr<t_port>> m_oports;
    t_sctxhmap m_contexts;
    std::shared_ptr<t_gstate> m_state;
    t_uindex m_id;
    std::chrono::high_resolution_clock::time_point m_epoch;
    std::vector<t_custom_column> m_custom_columns;
    std::set<std::string> m_expr_icols;
    std::function<void()> m_pool_cleanup;
    bool m_was_updated;
};

template <>
void t_gnode::_process_helper<std::string>(const t_column* fcolumn, const t_column* scolumn,
    t_column* dcolumn, t_column* pcolumn, t_column* ccolumn, t_column* tcolumn,
    const std::uint8_t* op_base, std::vector<t_rlookup>& lkup,
    std::vector<bool>& prev_pkey_eq_vec, std::vector<t_uindex>& added_vec);

/**
 * @brief Given a t_data_table and a context handler, construct the t_tables relating to delta
 * calculation and notify the context with the constructed tables.
 *
 * @tparam CTX_T
 * @param flattened
 * @param ctxh
 */
template <typename CTX_T>
void
t_gnode::notify_context(const t_data_table& flattened, const t_ctx_handle& ctxh) {
    CTX_T* ctx = ctxh.get<CTX_T>();
    const t_data_table& delta = *(m_oports[PSP_PORT_DELTA]->get_table().get());
    const t_data_table& prev = *(m_oports[PSP_PORT_PREV]->get_table().get());
    const t_data_table& current = *(m_oports[PSP_PORT_CURRENT]->get_table().get());
    const t_data_table& transitions = *(m_oports[PSP_PORT_TRANSITIONS]->get_table().get());
    const t_data_table& existed = *(m_oports[PSP_PORT_EXISTED]->get_table().get());
    notify_context<CTX_T>(ctx, flattened, delta, prev, current, transitions, existed);
}

/**
 * @brief Given multiple `t_data_table`s containing the different states of the context,
 * update the context with new data.
 *
 * Called on updates and additions AFTER a view is constructed from the table/context.
 *
 * @tparam CTX_T
 * @param ctx
 * @param flattened a `t_data_table` containing the flat data for the context
 * @param delta a `t_data_table` containing the changes to the dataset
 * @param prev a `t_data_table` containing the previous state
 * @param current a `t_data_table` containing the current state
 * @param transitions a `t_data_table` containing operations to transform the context
 * @param existed
 */
template <typename CTX_T>
void
t_gnode::notify_context(CTX_T* ctx, const t_data_table& flattened, const t_data_table& delta,
    const t_data_table& prev, const t_data_table& current, const t_data_table& transitions,
    const t_data_table& existed) {
    auto t1 = std::chrono::high_resolution_clock::now();
    ctx->step_begin();
    ctx->notify(flattened, delta, prev, current, transitions, existed);
    ctx->step_end();
    if (t_env::log_time_ctx_notify()) {
        auto t2 = std::chrono::high_resolution_clock::now();
        std::cout << ctx->repr() << " ctx_notify "
                  << std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count()
                  << std::endl;
    }
}

/**
 * @brief Given a flattened `t_data_table`, update the context with the table.
 *
 * Called with the context is initialized with a table.
 *
 * @tparam CTX_T the template type
 * @param ctx a pointer to a `t_context` object
 * @param flattened the flattened `t_data_table` containing data for the context
 */
template <typename CTX_T>
void
t_gnode::update_context_from_state(CTX_T* ctx, const t_data_table& flattened) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(
        m_mode == NODE_PROCESSING_SIMPLE_DATAFLOW, "Only simple dataflows supported currently");

    if (flattened.size() == 0)
        return;

    ctx->step_begin();
    ctx->notify(flattened);
    ctx->step_end();
}

template <typename DATA_T>
void
t_gnode::_process_helper(const t_column* fcolumn, const t_column* scolumn, t_column* dcolumn,
    t_column* pcolumn, t_column* ccolumn, t_column* tcolumn, const std::uint8_t* op_base,
    std::vector<t_rlookup>& lkup, std::vector<bool>& prev_pkey_eq_vec,
    std::vector<t_uindex>& added_vec) {
    for (t_uindex idx = 0, loop_end = fcolumn->size(); idx < loop_end; ++idx) {
        std::uint8_t op_ = op_base[idx];
        t_op op = static_cast<t_op>(op_);
        t_uindex added_count = added_vec[idx];

        const t_rlookup& rlookup = lkup[idx];
        bool row_pre_existed = rlookup.m_exists;

        switch (op) {
            case OP_INSERT: {
                row_pre_existed = row_pre_existed && !prev_pkey_eq_vec[idx];

                DATA_T prev_value;
                memset(&prev_value, 0, sizeof(DATA_T));
                bool prev_valid = false;

                DATA_T cur_value = *(fcolumn->get_nth<DATA_T>(idx));
                bool cur_valid = fcolumn->is_valid(idx);

                if (row_pre_existed) {
                    prev_value = *(scolumn->get_nth<DATA_T>(rlookup.m_idx));
                    prev_valid = scolumn->is_valid(rlookup.m_idx);
                }

                bool exists = cur_valid;
                bool prev_existed = row_pre_existed && prev_valid;
                bool prev_cur_eq = prev_value == cur_value;

                auto trans = calc_transition(prev_existed, row_pre_existed, exists, prev_valid,
                    cur_valid, prev_cur_eq, prev_pkey_eq_vec[idx]);

                dcolumn->set_nth<DATA_T>(
                    added_count, cur_valid ? cur_value - prev_value : DATA_T(0));
                dcolumn->set_valid(added_count, true);

                pcolumn->set_nth<DATA_T>(added_count, prev_value);
                pcolumn->set_valid(added_count, prev_valid);

                ccolumn->set_nth<DATA_T>(added_count, cur_valid ? cur_value : prev_value);

                ccolumn->set_valid(added_count, cur_valid ? cur_valid : prev_valid);

                tcolumn->set_nth<std::uint8_t>(idx, trans);
            } break;
            case OP_DELETE: {
                if (row_pre_existed) {
                    DATA_T prev_value = *(scolumn->get_nth<DATA_T>(rlookup.m_idx));
                    bool prev_valid = scolumn->is_valid(rlookup.m_idx);

                    pcolumn->set_nth<DATA_T>(added_count, prev_value);
                    pcolumn->set_valid(added_count, prev_valid);

                    ccolumn->set_nth<DATA_T>(added_count, prev_value);
                    ccolumn->set_valid(added_count, prev_valid);

                    SUPPRESS_WARNINGS_VC(4146)
                    dcolumn->set_nth<DATA_T>(added_count, -prev_value);
                    RESTORE_WARNINGS_VC()
                    dcolumn->set_valid(added_count, true);

                    tcolumn->set_nth<std::uint8_t>(added_count, VALUE_TRANSITION_NEQ_TDF);
                }
            } break;
            default: { PSP_COMPLAIN_AND_ABORT("Unknown OP"); }
        }
    }
}

} // end namespace perspective
