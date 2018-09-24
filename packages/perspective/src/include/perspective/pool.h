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
#include <perspective/gnode.h>
#include <perspective/exports.h>
#include <mutex>
#include <atomic>

#ifdef PSP_ENABLE_WASM
#include <emscripten/val.h>
#endif

namespace perspective {

struct PERSPECTIVE_EXPORT t_updctx {
    t_updctx();
    t_updctx(t_uindex gnode_id, const t_str& ctx);

    t_uindex m_gnode_id;
    t_str m_ctx;
};

typedef std::vector<t_updctx> t_updctx_vec;

class t_update_task;

class PERSPECTIVE_EXPORT t_pool {
    friend class t_update_task;
    typedef std::pair<t_uindex, t_str> t_ctx_id;

public:
#ifdef PSP_ENABLE_WASM
    t_pool(emscripten::val update_delegate);
    void set_update_delegate(emscripten::val ud);
    t_uindex register_gnode(t_gnode* node);
    void register_context(t_uindex gnode_id, const t_str& name, t_ctx_type type, t_int32 ptr);
    void py_notify_userspace();
#else
    t_pool();
    t_uindex register_gnode(t_gnode* node);
    void register_context(t_uindex gnode_id, const t_str& name, t_ctx_type type, t_int64 ptr);
    void set_update_delegate();
    void py_notify_userspace();
#endif
    t_pool(const t_pool& p) = delete;
    t_pool& operator=(const t_pool& p) = delete;

    ~t_pool();

    void unregister_gnode(t_uindex idx);

    void unregister_context(t_uindex gnode_id, const t_str& name);

    void send(t_uindex gnode_id, t_uindex port_id, const t_table& table);

    void _process();
    void _process_helper();
    void init();
    void stop();
    void set_sleep(t_uindex ms);
    t_streeptr_vec get_trees();

    bool get_data_remaining() const;

    t_tscalvec get_row_data_pkeys(t_uindex gnode_id, const t_tscalvec& pkeys);
    t_updctx_vec get_contexts_last_updated();
    t_str repr() const;

    void pprint_registered() const;

    t_uindex epoch() const;
    void inc_epoch();
    t_bool has_python_dep() const;
    void flush();
    void flush(t_uindex gnode_id);
    t_uidxvec get_gnodes_last_updated();
    t_gnode* get_gnode(t_uindex gnode_id);

protected:
    // Following three functions
    // use the python api
    t_bool validate_gnode_id(t_uindex gnode_id) const;

private:
    std::mutex m_mtx;
    std::vector<t_gnode*> m_gnodes;

#ifdef PSP_ENABLE_WASM
    emscripten::val m_update_delegate;
#endif
    std::atomic_flag m_run;
    std::atomic<t_bool> m_data_remaining;
    std::atomic<t_uindex> m_sleep;
    std::atomic<t_uindex> m_epoch;
    t_bool m_has_python_dep;
};

} // end namespace perspective
