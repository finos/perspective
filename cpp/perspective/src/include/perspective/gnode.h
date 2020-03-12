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
#include <perspective/process_state.h>
#include <perspective/computed.h>
#include <perspective/computed_function.h>
#ifdef PSP_PARALLEL_FOR
#include <tbb/parallel_sort.h>
#include <tbb/tbb.h>
#endif
#include <chrono>

namespace perspective {

PERSPECTIVE_EXPORT t_tscalar calc_delta(
    t_value_transition trans, t_tscalar oval, t_tscalar nval);

PERSPECTIVE_EXPORT t_tscalar calc_newer(
    t_value_transition trans, t_tscalar oval, t_tscalar nval);

PERSPECTIVE_EXPORT t_tscalar calc_negate(t_tscalar val);

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
    /**
     * @brief Construct a new `t_gnode`. A `t_gnode` manages the accumulated
     * internal state of a `Table` - it handles updates, calculates the
     * transition state between each `update()` call, and manages/notifies
     * contexts (`View`s) created from the `Table`.
     * 
     * A `t_gnode` is created with two `t_schema`s:
     * 
     * `input_schema`: the canonical `t_schema` for the `Table`, which cannot
     * be mutated after creation. This schema contains the `psp_pkey` and
     * `psp_op` columns, which are used internally.
     * 
     * `output_schema`: the `t_schema` that contains all columns provided
     * by the dataset, excluding `psp_pkey` and `psp_op`.
     * 
     * @param input_schema 
     * @param output_schema 
     */
    t_gnode(const t_schema& input_schema, const t_schema& output_schema);
    ~t_gnode();

    void init();
    void reset();

    // send data to input port with at index idx
    // schema should match port schema
    void _send(t_uindex idx, const t_data_table& fragments);
    void _send_and_process(const t_data_table& fragments);
    void _process();

    void _register_context(const std::string& name, t_ctx_type type, std::int64_t ptr);
    void _unregister_context(const std::string& name);

    const t_data_table* get_table() const;
    t_data_table* get_table();

    std::shared_ptr<t_data_table> get_table_sptr();

    t_data_table* _get_otable(t_uindex portidx);
    t_data_table* _get_itable(t_uindex portidx);

    t_schema get_output_schema() const;
    const t_schema& get_state_input_schema() const;

    std::vector<t_pivot> get_pivots() const;
    std::vector<t_stree*> get_trees();

    void set_id(t_uindex id);
    t_uindex get_id() const;

    void release_inputs();
    void release_outputs();
    std::vector<std::string> get_registered_contexts() const;
    std::vector<std::string> get_contexts_last_updated() const;

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

    void set_pool_cleanup(std::function<void()> cleanup);
    bool was_updated() const;
    void clear_updated();

    t_uindex mapping_size() const;

    // helper function for JS interface
    void promote_column(const std::string& name, t_dtype new_type);

    // Gnode will steal a reference to the context
    void register_context(const std::string& name, std::shared_ptr<t_ctx0> ctx);
    void register_context(const std::string& name, std::shared_ptr<t_ctx1> ctx);
    void register_context(const std::string& name, std::shared_ptr<t_ctx2> ctx);
    void register_context(const std::string& name, std::shared_ptr<t_ctx_grouped_pkey> ctx);

    /**
     * @brief Add computed columns from `ctx` to `tbl`.
     * 
     * @tparam CTX_T 
     * @param ctx 
     * @param tbl 
     */
    template <typename CTX_T>
    void _compute_columns_sptr(CTX_T* ctx, std::shared_ptr<t_data_table> tbl);

    void pprint() const;
    std::string repr() const;

protected:
    /**
     * @brief Given `tbl`, notify each registered context with `tbl`.
     * 
     * @param tbl 
     */
    void _update_contexts_from_state(const t_data_table& tbl);

    /**
     * @brief Notify a single registered `ctx` with `tbl`.
     * 
     * @tparam CTX_T 
     * @param ctx 
     * @param tbl 
     * @param flattened 
     * @param delta 
     * @param prev 
     * @param current 
     * @param transitions 
     * @param changed_rows 
     */
    template <typename CTX_T>
    void update_context_from_state(CTX_T* ctx, const t_data_table& tbl);

    /**
     * @brief Provide the registered `t_ctx*` with a pointer to this gnode's
     * `m_gstate` object. `t_ctx*` are assumed to access/mutate this state
     * object arbitrarily at runtime.
     * 
     * @tparam CTX_T 
     * @param ptr 
     */
    template <typename CTX_T>
    void set_ctx_state(void* ptr);

    bool have_context(const std::string& name) const;
    void notify_contexts(const t_data_table& flattened);

    template <typename CTX_T>
    void notify_context(const t_data_table& flattened, const t_ctx_handle& ctxh);

    template <typename CTX_T>
    void notify_context(CTX_T* ctx, const t_data_table& flattened, const t_data_table& delta,
        const t_data_table& prev, const t_data_table& current, const t_data_table& transitions,
        const t_data_table& existed);

    /**
     * @brief Given the process state, create a `t_mask` bitset set to true for
     * all rows in `flattened`, UNLESS the row is an `OP_DELETE`.
     * 
     * Mutates the `t_process_state` object that is passed in.
     * 
     * @param process_state
     */
    t_mask _process_mask_existed_rows(t_process_state& process_state);

    /**
     * @brief Given a flattened column, the master column from `m_gstate`, and
     * all transitional columns containing metadata, process and calculate
     * transitional values.
     * 
     * @tparam DATA_T 
     * @param fcolumn 
     * @param scolumn 
     * @param dcolumn 
     * @param pcolumn 
     * @param ccolumn 
     * @param tcolumn 
     * @param process_state 
     */
    template <typename T>
    void _process_column(const t_column* fcolumn, const t_column* scolumn, t_column* dcolumn,
        t_column* pcolumn, t_column* ccolumn, t_column* tcolumn, const t_process_state& process_state);

    /**
     * @brief Calculate the transition state for a single cell, which depends
     * on whether the cell is/was valid, existed, or is new.
     * 
     * @param prev_existed 
     * @param row_pre_existed 
     * @param exists 
     * @param prev_valid 
     * @param cur_valid 
     * @param prev_cur_eq 
     * @param prev_pkey_eq 
     * @return t_value_transition 
     */
    t_value_transition calc_transition(bool prev_existed, bool row_pre_existed, bool exists,
        bool prev_valid, bool cur_valid, bool prev_cur_eq, bool prev_pkey_eq);

    /**
     * @brief Add the computed columns typed as `dtype` from `ctx` to `tbl',
     * but don't apply any computations. Used when computed columns are
     * required to be present on a table but not actually read.
     * 
     * @tparam CTX_T 
     * @param ctx 
     * @param tbl 
     */
    template <typename CTX_T>
    void _add_computed_column_sptr(
        CTX_T* ctx, std::shared_ptr<t_data_table> tbl, t_dtype dtype);

    /**
     * @brief For all registered contexts, recompute computed columns using
     * both the `flattened` data table and the master `m_table` of `m_state`.
     * 
     * @param tbl 
     * @param flattened 
     * @param changed_rows 
     */
    void
    _recompute_columns_for_all_contexts(
        std::shared_ptr<t_data_table> tbl,
        std::shared_ptr<t_data_table> flattened,
        const std::vector<t_rlookup>& changed_rows);

    /**
     * @brief For each registered context, add its computed columns to `table`
     * with the specified `dtype`. If `dtype` is not specified, it defaults to
     * `DTYPE_UINT8` which corresponds to the dtype of the `transitions` data
     * table.
     * 
     * @param table 
     * @param dtype 
     */
    void _add_computed_columns_sptr_for_all_contexts(
        std::shared_ptr<t_data_table> table,
        t_dtype dtype);

    /**
     * @brief For each `t_data_table` passed into the variadic parameter pack
     * `table`, add computed columns from all registered contexts.
     * 
     * TODO: replace vector param with parameter pack
     * 
     * @param table 
     */
    void _compute_columns_for_all_contexts(
        std::vector<std::shared_ptr<t_data_table>> tables);

    /**
     * @brief For each context registered to the gnode, compute columns.
     *
     * @param tbl
     */
    void _process_computed_columns(
        std::shared_ptr<t_data_table> tbl,
        std::shared_ptr<t_data_table> flattened,
        std::shared_ptr<t_data_table> delta,
        std::shared_ptr<t_data_table> prev,
        std::shared_ptr<t_data_table> current,
        std::shared_ptr<t_data_table> transitions,
        const std::vector<t_rlookup>& changed_rows);

    /**
     * @brief Apply the computed columns from `ctx` to `tbl`.
     * 
     * @tparam CTX_T 
     * @param ctx 
     * @param tbl 
     */
    template <typename CTX_T>
    void _compute_columns(CTX_T* ctx, const t_data_table& tbl);

    /**
     * @brief Reapply the computed columns from `ctx` to `flattened`,
     * using information from both `flattened` and `tbl`.
     * 
     * @tparam CTX_T 
     * @param ctx 
     * @param tbl 
     */
    template <typename CTX_T>
    void _recompute_columns(
        CTX_T* ctx,
        std::shared_ptr<t_data_table> table,
        std::shared_ptr<t_data_table> flattened,
        const std::vector<t_rlookup>& changed_rows);
private:
    /**
     * @brief Process the input data table by flattening it, calculating
     * transitional values, and returning a new masked version.
     * 
     * @return std::shared_ptr<t_data_table> 
     */
    std::shared_ptr<t_data_table> _process_table();

    t_gnode_processing_mode m_mode;
    t_gnode_type m_gnode_type;

    // A `t_schema` containing all columns, including internal metadata columns.
    t_schema m_input_schema;

    // A `t_schema` containing all columns (excluding internal columns).
    t_schema m_output_schema;

    // A vector of `t_schema`s for each transitional `t_data_table`.
    std::vector<t_schema> m_transitional_schemas;

    bool m_init;
    std::vector<std::shared_ptr<t_port>> m_iports;
    std::vector<std::shared_ptr<t_port>> m_oports;
    std::map<std::string, t_ctx_handle> m_contexts;
    std::shared_ptr<t_gstate> m_gstate;
    t_uindex m_id;
    std::chrono::high_resolution_clock::time_point m_epoch;
    std::vector<t_custom_column> m_custom_columns;
    std::function<void()> m_pool_cleanup;
    bool m_was_updated;
};

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
    // These tables are guaranteed to have all computed columns.
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
    auto ctx_config = ctx->get_config();
    auto computed_columns = ctx_config.get_computed_columns();

    ctx->step_begin();
    // Flattened has the computed columns at this point, as it has
    // passed through the body of `process_table`.
    ctx->notify(flattened, delta, prev, current, transitions, existed);
    ctx->step_end();
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
        m_mode == NODE_PROCESSING_SIMPLE_DATAFLOW, "Only simple dataflows supported currently")

    if (flattened.size() == 0)
        return;

    // Flattened won't have the computed columns if it didn't pass through the
    // main body of `process_table`, i.e. creating a 1/2 sided context, so
    // compute again here.
    auto ctx_config = ctx->get_config();
    auto computed_columns = ctx_config.get_computed_columns();

    if (computed_columns.size() > 0) {
        _compute_columns<CTX_T>(ctx, flattened);
    }

    ctx->step_begin();
    ctx->notify(flattened);
    ctx->step_end();
}

template <typename CTX_T>
void
t_gnode::_compute_columns(CTX_T* ctx, const t_data_table& tbl) {
    // `get_column` does not work on a const `t_data_table`
    t_data_table& flattened = const_cast<t_data_table&>(tbl);
    auto computed_columns = ctx->get_config().get_computed_columns();

    for (auto c : computed_columns) {
        std::vector<t_dtype> input_types;
        std::vector<std::shared_ptr<t_column>> input_columns;

        std::string computed_column_name = std::get<0>(c);
        t_computed_function_name computed_function_name = std::get<1>(c);
        std::vector<std::string> input_column_names = std::get<2>(c);

        for (const auto& name : input_column_names) {
            auto column = flattened.get_column(name);
            input_columns.push_back(column);
            input_types.push_back(column->get_dtype());
        }

        t_computation computation = t_computed_column::get_computation(
            computed_function_name, input_types);
        if (computation.m_name == INVALID_COMPUTED_FUNCTION) {
            std::cerr 
                << "Cannot compute column `"
                << computed_column_name
                << "` in gnode."
                << std::endl;
                continue;
        }
        t_dtype output_column_type = computation.m_return_type;

        auto output_column = flattened.add_column_sptr(
            computed_column_name, output_column_type, true);
        output_column->reserve(input_columns[0]->size());

        t_computed_column::apply_computation(
            input_columns,
            output_column,
            computation);   
    }
}

template <typename CTX_T>
void
t_gnode::_compute_columns_sptr(CTX_T* ctx, std::shared_ptr<t_data_table> tbl) {
    auto computed_columns = ctx->get_config().get_computed_columns();

    for (const auto& c : computed_columns) {
        std::vector<t_dtype> input_types;
        std::vector<std::shared_ptr<t_column>> input_columns;

        std::string computed_column_name = std::get<0>(c);
        t_computed_function_name computed_function_name = std::get<1>(c);
        std::vector<std::string> input_column_names = std::get<2>(c);
        
        for (const auto& name : input_column_names) {
            auto column = tbl->get_column(name);
            input_columns.push_back(column);
            input_types.push_back(column->get_dtype());
        }

        t_computation computation = t_computed_column::get_computation(
            computed_function_name, input_types);
        if (computation.m_name == INVALID_COMPUTED_FUNCTION) {
            std::cerr 
                << "Cannot re-compute column `"
                << computed_column_name
                << "` in gnode."
                << std::endl;
                continue;
        }
        t_dtype output_column_type = computation.m_return_type;

        auto output_column = tbl->add_column_sptr(
            computed_column_name, output_column_type, true);
        output_column->reserve(input_columns[0]->size());

        t_computed_column::apply_computation(
            input_columns,
            output_column,
            computation);   
    }
}


template <typename CTX_T>
void
t_gnode::_recompute_columns(
    CTX_T* ctx,
    std::shared_ptr<t_data_table> table,
    std::shared_ptr<t_data_table> flattened,
    const std::vector<t_rlookup>& changed_rows) {
    auto computed_columns = ctx->get_config().get_computed_columns();

    for (const auto& c : computed_columns) {
        std::vector<t_dtype> input_types;
        std::vector<std::shared_ptr<t_column>> table_columns;
        std::vector<std::shared_ptr<t_column>> flattened_columns;

        std::string computed_column_name = std::get<0>(c);
        t_computed_function_name computed_function_name = std::get<1>(c);
        std::vector<std::string> input_column_names = std::get<2>(c);
        
        for (const auto& name : input_column_names) {
            auto table_column = table->get_column(name);
            auto flattened_column = flattened->get_column(name);
            table_columns.push_back(table_column);
            flattened_columns.push_back(flattened_column);
            input_types.push_back(table_column->get_dtype());
        }

        t_computation computation = t_computed_column::get_computation(
            computed_function_name, input_types);
        t_dtype output_column_type = computation.m_return_type;

        auto output_column = flattened->add_column_sptr(
            computed_column_name, output_column_type, true);
        output_column->reserve(table_columns[0]->size());

        t_computed_column::reapply_computation(
            table_columns,
            flattened_columns,
            changed_rows,
            output_column,
            computation);   
    }
}

template <typename CTX_T>
void
t_gnode::_add_computed_column_sptr(
    CTX_T* ctx, std::shared_ptr<t_data_table> tbl, t_dtype dtype) {
    auto computed_columns = ctx->get_config().get_computed_columns();

    for (const auto& c : computed_columns) {
        std::string computed_column_name = std::get<0>(c);
        auto output_column = tbl->add_column_sptr(
            computed_column_name, dtype, true);
    }
}

template <>
void
t_gnode::_process_column<std::string>(
    const t_column* fcolumn,
    const t_column* scolumn,
    t_column* dcolumn,
    t_column* pcolumn,
    t_column* ccolumn,
    t_column* tcolumn,
    const t_process_state& process_state);

template <typename DATA_T>
void
t_gnode::_process_column(
    const t_column* fcolumn,
    const t_column* scolumn,
    t_column* dcolumn,
    t_column* pcolumn,
    t_column* ccolumn,
    t_column* tcolumn,
    const t_process_state& process_state) {
    for (t_uindex idx = 0, loop_end = fcolumn->size(); idx < loop_end; ++idx) {
        std::uint8_t op_ = process_state.m_op_base[idx];
        t_op op = static_cast<t_op>(op_);
        t_uindex added_count = process_state.m_added_offset[idx];

        const t_rlookup& rlookup = process_state.m_lookup[idx];
        bool row_pre_existed = rlookup.m_exists;
        auto prev_pkey_eq = process_state.m_prev_pkey_eq_vec[idx];

        switch (op) {
            case OP_INSERT: {
                row_pre_existed = row_pre_existed && !prev_pkey_eq;

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
                    cur_valid, prev_cur_eq, prev_pkey_eq);

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
