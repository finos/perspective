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
    t_updctx(t_uindex gnode_id, const std::string& ctx);

    t_uindex m_gnode_id;
    std::string m_ctx;
};

class t_update_task;

class PERSPECTIVE_EXPORT t_pool {
    friend class t_update_task;
    typedef std::pair<t_uindex, std::string> t_ctx_id;

public:
    t_pool();
    t_uindex register_gnode(t_gnode* node);
#ifdef PSP_ENABLE_WASM
    void set_update_delegate(emscripten::val ud);
    void register_context(
        t_uindex gnode_id, const std::string& name, t_ctx_type type, std::int32_t ptr);
    void py_notify_userspace();
#else
    void register_context(
        t_uindex gnode_id, const std::string& name, t_ctx_type type, std::int64_t ptr);
    void py_notify_userspace();
#endif
    PSP_NON_COPYABLE(t_pool);

    ~t_pool();

    void unregister_gnode(t_uindex idx);

    void unregister_context(t_uindex gnode_id, const std::string& name);

    void send(t_uindex gnode_id, t_uindex port_id, const t_table& table);

    void _process();
    void _process_helper();
    void init();
    void stop();
    void set_sleep(t_uindex ms);
    std::vector<t_stree*> get_trees();

    bool get_data_remaining() const;

    std::vector<t_tscalar> get_row_data_pkeys(
        t_uindex gnode_id, const std::vector<t_tscalar>& pkeys);
    std::vector<t_updctx> get_contexts_last_updated();
    std::string repr() const;

    void pprint_registered() const;

    t_uindex epoch() const;
    void inc_epoch();
    bool has_python_dep() const;
    void flush();
    void flush(t_uindex gnode_id);
    std::vector<t_uindex> get_gnodes_last_updated();
    t_gnode* get_gnode(t_uindex gnode_id);

protected:
    // Following three functions
    // use the python api
    bool validate_gnode_id(t_uindex gnode_id) const;

private:
    std::mutex m_mtx;
    std::vector<t_gnode*> m_gnodes;

#ifdef PSP_ENABLE_WASM
    emscripten::val m_update_delegate;
#endif
    std::atomic_flag m_run;
    std::atomic<bool> m_data_remaining;
    std::atomic<t_uindex> m_sleep;
    std::atomic<t_uindex> m_epoch;
    bool m_has_python_dep;
};

} // end namespace perspective
