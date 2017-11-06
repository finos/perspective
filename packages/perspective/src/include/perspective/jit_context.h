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
#include <perspective/simple_bitmask.h>
#include <perspective/mask.h>
#include <perspective/utils.h>
#include <perspective/table.h>
#include <perspective/exports.h>
#include <perspective/filter.h>

namespace perspective
{

PERSPECTIVE_EXPORT t_str get_bool_str(t_filter_op combiner);
PERSPECTIVE_EXPORT t_str fterms_to_str(t_filter_op fterm_combiner,
                                       const t_ftermvec& fterms);
PERSPECTIVE_EXPORT t_str
build_expr_for_jit(t_filter_op fterm_combiner,
                   const t_ftermvec& fterms,
                   const t_svec& exprs);
t_str wrap_expr(const t_str& s);

class PERSPECTIVE_EXPORT t_jit_ctx
{
    PSP_NON_COPYABLE(t_jit_ctx);

  public:
    t_jit_ctx(const t_svec& filter_exprs, t_filter_op combiner);

    // needs to be invoked with the gil
    void bind_table(const t_table& tbl);
    void bind_table(const t_table_static_ctx& ctx,
                    const t_ftermvec& fterms);
    void bind_table(const t_table_static_ctx& ctx);

    void invoke_filter(const t_table& tbl, t_simple_bitmask& m) const;
    void invoke_filter(const t_table& tbl, t_mask& m) const;

    t_bool has_fn() const;
    t_uindex size() const;

  private:
    t_str build_compound_expr(const t_ftermvec& fterms) const;

    PyObject* build_filter_fn(const t_table_static_ctx& ctx,
                              const t_ftermvec& fterms) const;

    t_svec m_filter_exprs;
    t_filter_op m_combiner;
    t_jitsptr m_jit;
};

typedef std::shared_ptr<t_jit_ctx> t_jit_ctxsptr;
typedef std::shared_ptr<const t_jit_ctx> t_jit_ctxcsptr;

PERSPECTIVE_EXPORT PyObject* make_lambda(const t_str& lambda);

} // end namespace perspective
