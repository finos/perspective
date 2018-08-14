/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/jit_context.h>
#include <perspective/utils.h>
#include <perspective/pythonhelpers.h>
#include <perspective/init.h>

namespace perspective
{

t_jit_ctx::t_jit_ctx(const t_svec& filter_exprs, t_filter_op combiner)
    : m_filter_exprs(filter_exprs), m_combiner(combiner)
{
    if (m_filter_exprs.empty())
        m_filter_exprs.push_back("True");
}

t_str
get_bool_str(t_filter_op combiner)
{
    switch (combiner)
    {
        case FILTER_OP_AND:
        {
            return " and ";
        }
        break;
        case FILTER_OP_OR:
        {
            return " or ";
        }
        break;
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Unknown op encountered");
        }
    }
    return "";
}

t_str
fterms_to_str(t_filter_op fterm_combiner, const t_ftermvec& fterms)
{
    t_svec strterms;
    for (const auto& ft : fterms)
    {
        strterms.push_back(ft.get_expr());
    }
    return join_str(strterms, get_bool_str(fterm_combiner));
}

t_str
build_expr_for_jit(t_filter_op fterm_combiner,
                   const t_ftermvec& fterms,
                   const t_svec& exprs)
{
    t_svec wrapped;
    for (const auto& s : exprs)
    {
        wrapped.push_back(wrap_expr(s));
    }

    auto jit_str = join_str(wrapped, get_bool_str(fterm_combiner));
    if (!fterms.empty())
    {
        jit_str = "( " + fterms_to_str(fterm_combiner, fterms) +
                  ") and (" + jit_str + ")";
    }
    return jit_str;
}
t_str
t_jit_ctx::build_compound_expr(const t_ftermvec& fterms) const
{
    return build_expr_for_jit(m_combiner, fterms, m_filter_exprs);
}

void
t_jit_ctx::invoke_filter(const t_table& tbl, t_mask& m) const
{
    t_simple_bitmask tmpmask(m.size());
    invoke_filter(tbl, tmpmask);

    for (t_uindex idx = 0, loop_end = m.size(); idx < loop_end; ++idx)
    {
        m.set(idx, tmpmask.is_set(idx));
    }
}

void
t_jit_ctx::invoke_filter(const t_table& tbl,
                         t_simple_bitmask& m) const
{
    if (!m_jit.get())
        return;
    auto dctx = tbl.get_dynamic_context();
    t_column_dynamic_ctx dctx_out;
    dctx_out.m_base = m.get_ptr();
    m_jit->invoke(dctx.data(), m.size(), &dctx_out);
}

PyObject*
t_jit_ctx::build_filter_fn(const t_table_static_ctx& ctx,
                           const t_ftermvec& fterms) const
{
    if (m_filter_exprs.empty())
        return 0;

    auto global_d = perspective_jit_global_dict();

    auto cmp_expr = build_compound_expr(fterms);

    t_str fn_str = "def fn (" + join_str(ctx.get_colnames(), ", ") +
                   "): return " + cmp_expr;

    PyObjectPtr local_d(PyDict_New());

    PyObject* res = PyRun_String(
        fn_str.c_str(), Py_file_input, global_d, local_d.get());

    if (!res)
    {
        std::cout << "Error building function for fn_str => "
                  << fn_str << std::endl;
        PyErr_Print();
        return 0;
    }

    PyObject* fn = PyDict_GetItemString(local_d.get(), "fn");
    if (fn == 0)
    {
        std::cout << "Could not retrieve function out of local_d"
                  << std::endl;
    }

    Py_XINCREF(fn);
    return fn;
}

void
t_jit_ctx::bind_table(const t_table& tbl)
{
    bind_table(tbl.get_schema().get_table_context());
}

void
t_jit_ctx::bind_table(const t_table_static_ctx& ctx)
{
    t_ftermvec tmp;
    bind_table(ctx, tmp);
}

void
t_jit_ctx::bind_table(const t_table_static_ctx& ctx,
                      const t_ftermvec& fterms)
{
    if (m_filter_exprs.empty())
        return;

    PyObjectPtr fn(build_filter_fn(ctx, fterms));

    if (!fn.get())
    {
        m_jit.reset();
        return;
    }

    namespace jc = JITCompiler;

    try
    {
        auto fn_ = reinterpret_cast<PyFunctionObject*>(fn.get());
        t_jitsptr jit =
            std::make_shared<t_jit>(fn_, ctx, DTYPE_NONE, true);

        m_jit = jit;
    }
    catch (jc::CompilationError const& exn)
    {
        std::cout << "Failed compiling expression => "
                  << build_compound_expr(fterms) << std::endl;
        std::cout << exn.what() << std::endl;
        exn.pyErrFormat();
        m_jit.reset();
    }
}

t_bool
t_jit_ctx::has_fn() const
{
    return m_jit.get() != 0;
}

t_str
wrap_expr(const t_str& s)
{
    return " ( " + s + " ) ";
}

PyObject*
make_lambda(const t_str& lambda)
{
    PyObjectPtr local_d(PyDict_New());
    auto global_d = perspective_jit_global_dict();

    t_str fn_str = "fn = " + lambda;

    PyObject* res = PyRun_String(
        fn_str.c_str(), Py_file_input, global_d, local_d.get());

    if (!res)
    {
        std::cout << "Error building function for fn_str => "
                  << fn_str << std::endl;
        PyErr_Print();
        return 0;
    }

    PyObject* fn = PyDict_GetItemString(local_d.get(), "fn");
    if (fn == 0)
    {
        std::cout << "Could not retrieve function out of local_d"
                  << std::endl;
    }

    Py_XINCREF(fn);
    return fn;
}

} // end namespace perspective
