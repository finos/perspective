/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/table.h>
#include <perspective/column.h>
#include <perspective/storage.h>
#include <perspective/scalar.h>
#include <perspective/tracing.h>
#include <perspective/utils.h>
#include <perspective/logtime.h>
#include <sstream>
#ifdef PSP_ENABLE_PYTHON
#include <perspective/pyutils.h>
#include <perspective/pythonhelpers.h>
#endif
#ifdef PSP_ENABLE_PYTHON
#include <polaris/jitcompiler_psp.h>
#endif
namespace perspective
{

#ifdef PSP_ENABLE_PYTHON
t_expr_info::t_expr_info(t_jitsptr jit, const t_str& ocol)
    : m_jit(jit), m_ocol(ocol)
{
}
#endif

t_table_recipe::t_table_recipe()
{
}

void
t_table::set_capacity(t_uindex idx)
{
    m_capacity = idx;
#ifdef PSP_TABLE_VERIFY
    if (m_init)
    {
        for (auto c : m_columns)
        {
            c->verify_size();
            c->verify_size(m_capacity);
        }
    }

#endif
}

t_table::t_table(const t_table_recipe& recipe)
    : m_name(recipe.m_name), m_dirname(recipe.m_dirname),
      m_schema(recipe.m_schema), m_size(recipe.m_size),
      m_backing_store(recipe.m_backing_store), m_init(false),
      m_recipe(recipe), m_from_recipe(true)
{
    set_capacity(recipe.m_capacity);
}

t_table::t_table(const t_schema& s, t_uindex init_cap)
    : m_name(""), m_dirname(""), m_schema(s), m_size(0),
      m_backing_store(BACKING_STORE_MEMORY), m_init(false),
      m_from_recipe(false)
{
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_table");
    set_capacity(init_cap);
}

t_table::t_table(const t_str& name,
                 const t_str& dirname,
                 const t_schema& s,
                 t_uindex init_cap,
                 t_backing_store backing_store)
    : m_name(name), m_dirname(dirname), m_schema(s), m_size(0),
      m_backing_store(backing_store), m_init(false),
      m_from_recipe(false)
{
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_table");
    set_capacity(init_cap);
}

t_table::~t_table()
{
    PSP_TRACE_SENTINEL();
    LOG_DESTRUCTOR("t_table");
}

const t_str&
t_table::name() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_name;
}

void
t_table::init()
{
    PSP_TRACE_SENTINEL();
    LOG_INIT("t_table");
    m_columns = t_colsptrvec(m_schema.size());

    if (m_from_recipe)
    {
        t_uindex idx = 0;
        for (const auto& crecipe : m_recipe.m_columns)
        {
            m_columns[idx] = std::make_shared<t_column>(crecipe);
            m_columns[idx]->init();
            ++idx;
        }
        set_size(m_size);
        m_init = true;
        return;
    }

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0,
             int(m_schema.size()),
             1,
             [this](int idx)
#else
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end;
         ++idx)
#endif
             {
                 const t_str& colname = m_schema.m_columns[idx];
                 t_dtype dtype = m_schema.m_types[idx];
                 m_columns[idx] = make_column(
                     colname, dtype, m_schema.m_valid_enabled[idx]);
                 m_columns[idx]->init();
             }
#ifdef PSP_PARALLEL_FOR
             );
#endif

    m_init = true;
}

t_col_sptr
t_table::make_column(const t_str& colname,
                     t_dtype dtype,
                     t_bool valid_enabled)
{
    t_lstore_recipe a(m_dirname,
                      m_name + t_str("_") + colname,
                      m_capacity * get_dtype_size(dtype),
                      m_backing_store);
    return std::make_shared<t_column>(
        dtype, valid_enabled, a, m_capacity);
}

t_uindex
t_table::num_columns() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema.size();
}

t_uindex
t_table::num_rows() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_size;
}

t_uindex
t_table::size() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return num_rows();
}

t_uindex
t_table::num_rows(const t_mask& q) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(q.size() == size(), "Mismatch in mask size.")
    return q.count();
}

t_dtype
t_table::get_dtype(const t_str& colname) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema.get_dtype(colname);
}

t_col_sptr
t_table::get_column(const t_str& colname)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex idx = m_schema.get_colidx(colname);
    return m_columns[idx];
}

t_col_csptr
t_table::get_const_column(const t_str& colname) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex idx = m_schema.get_colidx(colname);
    return m_columns[idx];
}

t_col_sptr
t_table::get_column(t_uindex idx)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_columns[idx];
}

t_col_csptr
t_table::get_const_column(t_uindex idx) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_columns[idx];
}

t_colptrvec
t_table::get_columns()
{
    t_colptrvec rval(m_columns.size());
    t_uindex idx = 0;
    for (const auto& c : m_columns)
    {
        rval[idx] = c.get();
        ++idx;
    }
    return rval;
}

t_colcptrvec
t_table::get_const_columns() const
{
    t_colcptrvec rval(m_columns.size());
    t_uindex idx = 0;
    for (const auto& c : m_columns)
    {
        rval[idx] = c.get();
        ++idx;
    }
    return rval;
}

void
t_table::extend(t_uindex nelems)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(m_init, "Table not inited");
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end;
         ++idx)
    {
        m_columns[idx]->extend_dtype(nelems);
    }
    m_size = std::max(nelems, m_size);
    set_capacity(std::max(nelems, m_capacity));
}

void
t_table::set_size(t_uindex size)
{
    PSP_TRACE_SENTINEL();
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end;
         ++idx)
    {
        m_columns[idx]->set_size(size);
    }
    m_size = size;
}

void
t_table::reserve(t_uindex capacity)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end;
         ++idx)
    {
        m_columns[idx]->reserve(capacity);
    }
    set_capacity(std::max(capacity, m_capacity));
}

t_column*
t_table::_get_column(const t_str& colname)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex idx = m_schema.get_colidx(colname);
    return m_columns[idx].get();
}

const t_schema&
t_table::get_schema() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema;
}

t_table*
t_table::_flatten() const
{

    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(is_pkey_table(), "Not a pkeyed table");

    auto flattened = new t_table("",
                                 "",
                                 m_schema,
                                 DEFAULT_EMPTY_CAPACITY,
                                 BACKING_STORE_MEMORY);

    flattened->init();
    flatten_body<t_table*>(flattened);
    return flattened;
}

t_table_sptr
t_table::flatten() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(is_pkey_table(), "Not a pkeyed table");

    t_table_sptr flattened =
        std::make_shared<t_table>("",
                                  "",
                                  m_schema,
                                  DEFAULT_EMPTY_CAPACITY,
                                  BACKING_STORE_MEMORY);
    flattened->init();
    flatten_body<t_table_sptr>(flattened);
    return flattened;
}

void
t_table::flatten_common(const t_tscalvec& row,
                        t_uindex ncols,
                        t_table_sptr tbl,
                        std::vector<t_column*>& columns) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    for (t_uindex colidx = 0; colidx < ncols; ++colidx)
    {
        columns[colidx]->push_back(row[colidx]);
    }
    tbl->set_size(tbl->num_rows() + 1);
}

t_bool
t_table::is_pkey_table() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema.is_pkey();
}

t_bool
t_table::is_same_shape(t_table& tbl) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema == tbl.m_schema;
}

t_table_sptr
t_table::empty_like() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_schema schema = m_schema;
    return std::make_shared<t_table>(
        "", "", schema, num_rows(), BACKING_STORE_MEMORY);
}

void
t_table::pprint() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    pprint(size(), &std::cout);
}

void
t_table::pprint(const t_str& fname) const
{

    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    std::ofstream file;
    file.open(fname);
    pprint(size(), &file);
}

void
t_table::pprint(t_uindex nrows, std::ostream* os) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    if (!os)
        os = &std::cout;

    t_uindex nrows_ = nrows ? nrows : num_rows();
    nrows_ = std::min(nrows_, num_rows());

    t_uindex ncols = num_columns();

    t_colcptrvec columns(ncols);
    for (t_uindex idx = 0; idx < ncols; ++idx)
    {
        columns[idx] = m_columns[idx].get();
        (*os) << m_schema.m_columns[idx] << ", ";
    }

    (*os) << std::endl;
    (*os) << "==========================" << std::endl;

    for (t_uindex ridx = 0; ridx < nrows_; ++ridx)
    {
        for (t_uindex cidx = 0; cidx < ncols; ++cidx)
        {
            (*os) << columns[cidx]->get_scalar(ridx).to_string()
                  << ", ";
        }
        (*os) << std::endl;
    }
}

void
t_table::pprint(const t_uidxvec& vec) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex nrows = vec.size();
    t_uindex ncols = num_columns();

    t_colcptrvec columns(ncols);
    for (t_uindex idx = 0; idx < ncols; ++idx)
    {
        columns[idx] = m_columns[idx].get();
        std::cout << m_schema.m_columns[idx] << ", ";
    }

    std::cout << std::endl;
    std::cout << "==========================" << std::endl;

    for (t_uindex ridx = 0; ridx < nrows; ++ridx)
    {
        for (t_uindex cidx = 0; cidx < ncols; ++cidx)
        {
            std::cout << columns[cidx]->get_scalar(vec[ridx]) << ", ";
        }
        std::cout << std::endl;
    }
}

void
t_table::append(const t_table& other)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    t_uindex cursize = size();

    t_colcptrvec src_cols;
    t_colptrvec dst_cols;

    t_sset incoming;

    for (const auto& cname : other.m_schema.m_columns)
    {
        PSP_VERBOSE_ASSERT(
            other.get_const_column(cname)->get_dtype() ==
                get_column(cname)->get_dtype(),
            "Mismatched column dtypes");
        src_cols.push_back(other.get_const_column(cname).get());
        dst_cols.push_back(get_column(cname).get());
        incoming.insert(cname);
    }
    t_uindex other_size = other.num_rows();

    for (const auto& cname : m_schema.m_columns)
    {
        if (incoming.find(cname) == incoming.end())
        {
            get_column(cname)->extend_dtype(cursize + other_size);
        }
    }

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0,
             int(src_cols.size()),
             1,
             [&src_cols, dst_cols](int colidx)
#else
    for (t_uindex colidx = 0, loop_end = src_cols.size();
         colidx < loop_end;
         ++colidx)
#endif
             { dst_cols[colidx]->append(*(src_cols[colidx])); }
#ifdef PSP_PARALLEL_FOR
             );
#endif
    set_capacity(std::max(m_capacity, m_size + other.num_rows()));
    set_size(m_size + other.num_rows());
}

void
t_table::clear()
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    for (t_uindex idx = 0, loop_end = m_columns.size();
         idx < loop_end;
         ++idx)
    {
        m_columns[idx]->clear();
    }
    m_size = 0;
}

t_table_recipe
t_table::get_recipe() const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_table_recipe rval;
    rval.m_name = m_name;
    rval.m_dirname = m_dirname;
    rval.m_schema = m_schema.get_recipe();
    rval.m_size = m_size;
    rval.m_capacity = m_capacity;
    rval.m_backing_store = m_backing_store;
    for (const auto& cname : m_schema.m_columns)
    {
        t_col_csptr cptr = get_const_column(cname);
        rval.m_columns.push_back(cptr->get_recipe());
    }
    return rval;
}

t_mask
t_table::filter_cpp(t_filter_op combiner,
                    const t_ftermvec& fterms_) const
{

    auto self = const_cast<t_table*>(this);
    auto fterms = fterms_;

    t_mask mask(size());
    t_uindex fterm_size = fterms.size();
    t_uidxvec indices(fterm_size);
    t_colcptrvec columns(fterm_size);

    for (t_uindex idx = 0; idx < fterm_size; ++idx)
    {
        indices[idx] = m_schema.get_colidx(fterms[idx].m_colname);
        columns[idx] = get_const_column(fterms[idx].m_colname).get();
        fterms[idx].coerce_numeric(columns[idx]->get_dtype());
        auto op = fterms[idx].m_op;
        t_tscalar& thr = fterms[idx].m_threshold;
        if (fterms[idx].m_use_interned)
        {
            auto col = self->get_column(fterms[idx].m_colname);
            auto interned = col->get_interned(thr.get_char_ptr());
            thr.set(interned);
        }
    }

    switch (combiner)
    {
        case FILTER_OP_AND:
        {
            t_tscalar cell_val;

            for (t_uindex ridx = 0, rloop_end = size();
                 ridx < rloop_end;
                 ++ridx)
            {
                t_bool pass = true;

                for (t_uindex cidx = 0; cidx < fterm_size; ++cidx)
                {
                    if (!pass)
                        break;

                    const auto& ft = fterms[cidx];
                    t_bool tval;

                    if (ft.m_use_interned)
                    {
                        cell_val.set(
                            *(columns[cidx]->get_nth<t_stridx>(ridx)));
                        tval = ft(cell_val);
                    }
                    else
                    {
                        cell_val = columns[cidx]->get_scalar(ridx);
                        tval = ft(cell_val);
                    }

                    if (!tval)
                    {
                        pass = false;
                        break;
                    }
                }

                mask.set(ridx, pass);
            }
        }
        break;
        case FILTER_OP_OR:
        {
            for (t_uindex ridx = 0, rloop_end = size();
                 ridx < rloop_end;
                 ++ridx)
            {
                t_bool pass = false;
                for (t_uindex cidx = 0; cidx < fterm_size; ++cidx)
                {
                    t_tscalar cell_val =
                        columns[cidx]->get_scalar(ridx);
                    if (fterms[cidx](cell_val))
                    {
                        pass = true;
                        break;
                    }
                }
                mask.set(ridx, pass);
            }
        }
        break;
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Unknown filter op");
        }
        break;
    }

    return mask;
}

#ifdef PSP_ENABLE_PYTHON

t_mask
t_table::where(const t_str& expr) const
{
    PyObjectPtr py_expr(PyString_FromString(expr.c_str()));
    PSP_VERBOSE_ASSERT(py_expr.get(), "Error creating expression");

    PyObjectPtr locals(PyDict_New());
    PyObjectPtr globals(PyDict_New());

    PSP_VERBOSE_ASSERT(locals.get(), "Could not create dictionary");

    t_uindex idx = 0;
    for (auto& c : m_columns)
    {
        auto dtype = c->get_dtype();
        if (is_numeric_type(dtype))
        {
            PyObjectPtr pystr(
                PyString_FromString(m_schema.m_columns[idx].c_str()));

            PSP_VERBOSE_ASSERT(pystr.get(), "Error creating string");

            PyDict_SetItem(locals.get(), pystr.get(), c->_as_numpy());
        }
        ++idx;
    }

    PyObjectPtr ne(PyImport_ImportModule("numexpr"));

    if (PyErr_Occurred())
    {
        PyErr_Print();
        return t_mask();
    }

    // borrowed reference
    auto mod_dict = PyModule_GetDict(ne.get());
    if (PyErr_Occurred())
    {
        PyErr_Print();
        return t_mask();
    }

    // borrowed reference
    auto eval = PyDict_GetItemString(mod_dict, "evaluate");
    PSP_VERBOSE_ASSERT(eval, "Could not locate eval");

    PyObjectPtr args(Py_BuildValue("(s)", expr.c_str()));
    PSP_VERBOSE_ASSERT(args.get(), "Error creating tuple");

    t_str local_str("local_dict");
    t_str global_str("global_dict");
    t_str truediv_str("truediv");

    PyObjectPtr kwargs(Py_BuildValue("{s:O, s:O, s: O}",
                                     local_str.c_str(),
                                     locals.get(),
                                     global_str.c_str(),
                                     globals.get(),
                                     truediv_str.c_str(),
                                     Py_False));

    PSP_VERBOSE_ASSERT(kwargs.get(), "Error creating tuple");

    auto rv = PyObject_Call(eval, args.get(), kwargs.get());

    if (PyErr_Occurred())
    {
        PyErr_Print();
        return t_mask();
    }
    return t_mask(rv);
}

PyObject*
t_table::filter(t_filter_op combiner, const t_ftermvec& fterms) const
{
    t_mask mask = filter_cpp(combiner, fterms);
    return mask.as_numpy();
}

void
t_table::fill_expr(const t_str& expr, const t_str& output_column)
{

    auto s_icolumns = split(expr, '+');
    t_svec s_icols_trimmed;
    std::transform(s_icolumns.begin(),
                   s_icolumns.end(),
                   std::back_inserter(s_icols_trimmed),
                   [](const t_str& s) { return trimmed(s); });

    if (!std::all_of(s_icols_trimmed.begin(),
                     s_icols_trimmed.end(),
                     [this](const t_str& c) {
                         return m_schema.has_column(c);
                     }))
    {
        std::cout << "uknown column encountered in expression => "
                  << expr << std::endl;
        return;
    }

    t_svec e1, e2;
    fill_expr_helper(
        s_icols_trimmed, expr, output_column, e1, e2, "");
}

void
t_table::fill_expr_helper(const t_svec& icol_names,
                          const t_str& expr,
                          const t_str& output_column,
                          const t_svec& where_keys,
                          const t_svec& where_values,
                          const t_str& base_case)
{
    if (size() == 0)
        return;

    for (const auto& c : icol_names)
    {
        if (!m_schema.has_column(c))
        {
            std::cout << "Non existent input column encountered => "
                      << std::endl;
            return;
        }
    }

    if (!m_schema.has_column(output_column))
    {
        std::cout << "Non existent output column encountered => "
                  << std::endl;
        return;
    }
    auto ocol = m_columns[m_schema.get_colidx(output_column)].get();

#ifdef PSP_TABLE_TRACE
    std::cout << "fill_expr_helper" << std::endl;
    std::cout << "expression => " << expr << std::endl;
    std::cout << "\t output_column => " << output_column
              << " type => " << get_dtype_descr(ocol->get_dtype())
              << std::endl;

    for (const auto& c : icol_names)
    {
        std::cout << "\t\t input_column => " << c << " type => "
                  << get_dtype_descr(m_columns[m_schema.get_colidx(c)]
                                         ->get_dtype())
                  << std::endl;
    }
    std::cout << "\n\n";
#endif // PSP_TABLE_TRACE

    if (ocol->get_dtype() == DTYPE_STR &&
        expr.find("+") != t_str::npos)
    {
        t_colptrvec icols;

        for (const auto& c : icol_names)
        {
            icols.push_back(get_column(c).get());
        }

        for (t_uindex ridx = 0, loop_end = size(); ridx < loop_end;
             ++ridx)
        {
            std::stringstream ss;
            for (const auto& icol : icols)
            {
                ss << icol->get_scalar(ridx).to_string() << "_";
            }

            t_str val_str = ss.str();
            t_tscalar v;
            v.set(val_str.c_str());
            ocol->set_scalar(ridx, v);
        }

#ifdef PSP_TABLE_VERIFY
        ocol->verify();
#endif
        return;
    }

    if (ocol->get_dtype() == DTYPE_STR &&
        expr.find("where") != t_str::npos)
    {
        t_colcptrvec icols;

        for (const auto& c : icol_names)
        {
            icols.push_back(get_const_column(c).get());
        }

        if (icols.size() == 1 && icols[0]->get_dtype() == DTYPE_STR)
        {
            if (where_keys.empty() ||
                where_keys.size() != where_values.size())
            {
                std::cout << "Ill formed where clause => " << expr
                          << std::endl;
                return;
            }

            struct cmp_str
            {
                bool
                operator()(const char* a, const char* b)
                {
                    return std::strcmp(a, b) < 0;
                }
            };

            std::map<const char*, const char*, cmp_str> mapping;

            for (t_uindex widx = 0, wloop_end = where_keys.size();
                 widx < wloop_end;
                 ++widx)
            {
                mapping[where_keys[widx].c_str()] =
                    where_values[widx].c_str();
            }

            if (mapping.size() == 1 &&
                where_keys[0] == where_values[0])
            {
                for (t_uindex ridx = 0, loop_end = size();
                     ridx < loop_end;
                     ++ridx)
                {
                    auto key = icols[0]->get_nth<const char>(ridx);
                    if (!key)
                        continue;
                    auto value_iter = mapping.find(key);
                    if (value_iter == mapping.end())
                    {
                        ocol->set_nth<const char*>(ridx,
                                                   base_case.c_str());
                    }
                    else
                    {
                        ocol->set_nth<const char*>(
                            ridx, value_iter->second);
                    }
                }
            }
            else
            {
                for (t_uindex ridx = 0, loop_end = size();
                     ridx < loop_end;
                     ++ridx)
                {
                    auto key = icols[0]->get_nth<const char>(ridx);
                    if (!key)
                        continue;
                    auto value_iter = mapping.find(key);
                    if (value_iter == mapping.end())
                    {
                        ocol->set_nth<const char*>(ridx,
                                                   base_case.c_str());
                    }
                    else
                    {
                        ocol->set_nth<const char*>(
                            ridx, value_iter->second);
                    }
                }
            }

#ifdef PSP_TABLE_VERIFY
            ocol->verify();
#endif
            return;
        }

        if (icols.size() == 1 &&
            where_keys.size() == where_values.size() &&
            where_keys[0] == where_values[0])
        {
            t_str v1 = where_keys[0];
            t_str v2 = base_case;

            for (t_uindex ridx = 0, loop_end = size();
                 ridx < loop_end;
                 ++ridx)
            {
                if (icols[0]->get_scalar(ridx))
                {
                    ocol->set_nth<const char*>(ridx, v1.c_str());
                }
                else
                {
                    ocol->set_nth<const char*>(ridx, v2.c_str());
                }
            }

#ifdef PSP_TABLE_VERIFY
            ocol->verify();
#endif
            return;
        }

        if (icols.size() != 3)
        {
            std::cout << "Ill formed where clause => " << expr
                      << std::endl;
            return;
        }

        if (icols[1]->get_dtype() == DTYPE_STR &&
            icols[2]->get_dtype() == DTYPE_STR)
        {
            for (t_uindex ridx = 0, loop_end = size();
                 ridx < loop_end;
                 ++ridx)
            {
                if (icols[0]->get_scalar(ridx))
                    ocol->set_scalar(ridx,
                                     icols[1]->get_scalar(ridx));
                else
                    ocol->set_scalar(ridx,
                                     icols[2]->get_scalar(ridx));
            }
        }

#ifdef PSP_TABLE_VERIFY
        ocol->verify();
#endif
        return;
    }

    if (expr.find("where") != t_str::npos && icol_names.size() == 3)
    {
        // where(a == "foo", b, c)
        // where_keys[0] = foo
        // where_values[0] = b
        // base case = c
        if (where_keys.size() != 1 || where_values.size() != 1)
            return;

        auto threshold = where_keys[0];

        auto c1_name = where_values[0];
        auto c2_name = base_case;

        t_str c0_name;

        for (const auto& cc : icol_names)
        {
            if (cc != c1_name && cc != c2_name)
            {
                c0_name = cc;
            }
        }

        auto c0 = get_const_column(c0_name).get();
        auto c1 = get_const_column(c1_name).get();
        auto c2 = get_const_column(c2_name).get();

        if (c0->get_dtype() != DTYPE_STR)
            return;

        if (c1->get_dtype() != c2->get_dtype())
            return;

        auto dtype = c1->get_dtype();

        if (dtype != ocol->get_dtype())
            return;

        for (t_uindex ridx = 0, loop_end = size(); ridx < loop_end;
             ++ridx)
        {
            auto key = c0->get_nth<const char>(ridx);
            if (threshold == t_str(key))
                ocol->set_scalar(ridx, c1->get_scalar(ridx));
            else
                ocol->set_scalar(ridx, c2->get_scalar(ridx));
        }

#ifdef PSP_TABLE_VERIFY
        ocol->verify();
#endif
        return;
    }

    PyObjectPtr outc(ocol->_as_numpy());
    PSP_VERBOSE_ASSERT(outc.get(), "Error creating output column");

    PyObjectPtr py_expr(PyString_FromString(expr.c_str()));
    PSP_VERBOSE_ASSERT(py_expr.get(), "Error creating expression");

    PyObjectPtr locals(PyDict_New());
    PyObjectPtr globals(PyDict_New());

    PSP_VERBOSE_ASSERT(locals.get(), "Could not create dictionary");
    std::vector<PyObjectPtr> string_cols;

    t_uindex idx = 0;
    for (auto& c : m_columns)
    {
        auto dtype = c->get_dtype();

        PyObjectPtr pystr(
            PyString_FromString(m_schema.m_columns[idx].c_str()));

        PSP_VERBOSE_ASSERT(pystr.get(), "Error creating string");

        if (is_numeric_type(dtype))
        {
            PyDict_SetItem(locals.get(), pystr.get(), c->_as_numpy());
        }
        else
        {
            string_cols.push_back(PyObjectPtr(c->_as_numpy_newref()));
            PyDict_SetItem(locals.get(), pystr.get(), string_cols.back().get());   
        }
        ++idx;
    }

    PyObjectPtr ne(PyImport_ImportModule("numexpr"));

    if (PyErr_Occurred())
    {
        PyErr_Print();
        return;
    }

    // borrowed reference
    auto mod_dict = PyModule_GetDict(ne.get());
    if (PyErr_Occurred())
    {
        PyErr_Print();
        return;
    }

    // borrowed reference
    auto eval = PyDict_GetItemString(mod_dict, "evaluate");
    PSP_VERBOSE_ASSERT(eval, "Could not locate eval");

    PyObjectPtr args(Py_BuildValue("(s)", expr.c_str()));
    PSP_VERBOSE_ASSERT(args.get(), "Error creating tuple");

    t_str local_str("local_dict");
    t_str global_str("global_dict");
    t_str out_str("out");
    t_str truediv_str("truediv");

    PyObjectPtr kwargs(Py_BuildValue("{s:O, s:O, s:N, s: O}",
                                     local_str.c_str(),
                                     locals.get(),
                                     global_str.c_str(),
                                     globals.get(),
                                     out_str.c_str(),
                                     outc.get(),
                                     truediv_str.c_str(),
                                     Py_False));

    PSP_VERBOSE_ASSERT(kwargs.get(), "Error creating tuple");

    PyObject_Call(eval, args.get(), kwargs.get());

    if (PyErr_Occurred())
    {
        PyErr_Print();
    }

#ifdef PSP_TABLE_VERIFY
    ocol->verify();
#endif
}

#ifdef PSP_ENABLE_WASM
t_uindex
t_table::register_jit_expr(PyObject* fn, const t_str& output_column)
{
    return 0;
}

void
t_table::fill_expr_jit(t_uindex expr_idx)
{
}
#else
t_uindex
t_table::register_jit_expr(PyObject* fn, const t_str& output_column)
{
    if (!fn || !PyFunction_Check(fn))
    {
        std::cout << "Invalid function passed in to register_jit_expr"
                  << std::endl;
        return -1;
    }
    namespace jc = JITCompiler;

    auto fn_ = reinterpret_cast<PyFunctionObject*>(fn);

    t_dtype col_dtype = m_schema.has_column(output_column)
                            ? get_column(output_column)->get_dtype()
                            : DTYPE_NONE;
    auto s_tblctx = m_schema.get_table_context();

    try
    {
        t_jitsptr jit =
            std::make_shared<t_jit>(fn_, s_tblctx, col_dtype);
        m_einfovec.emplace_back(t_expr_info(jit, output_column));
    }
    catch (jc::CompilationError const& exn)
    {
        std::cout << "Failed compiling expression " << std::endl;
        std::cout << exn.what() << std::endl;
        exn.pyErrFormat();
        return -1;
    }

    const auto& einfo = m_einfovec.back();
    if (!m_schema.has_column(output_column))
    {
        add_column(output_column, einfo.m_jit->resultType(), true);
    }

    return m_einfovec.size() - 1;
}

void
t_table::fill_expr_jit(t_uindex expr_idx)
{
    if (expr_idx >= m_einfovec.size())
        return;

    const auto& einfo = m_einfovec[expr_idx];
    auto d_tblctx = get_dynamic_context();
    auto ocol_dctx = get_column(einfo.m_ocol)->get_dynamic_context();
    const t_jit& jit = *(einfo.m_jit);
    jit.invoke(d_tblctx.data(), size(), &ocol_dctx);
}
#endif
void
t_table::fill_expr_jit(PyObject* fn, const t_str& output_column)
{
    auto v = register_jit_expr(fn, output_column);
    fill_expr_jit(v);
}

void
t_table::fill_expr(const t_svec& icol_names,
                   const t_str& expr,
                   const t_str& output_column,
                   const t_svec& where_keys,
                   const t_svec& where_values,
                   const t_str& base_case)
{
    fill_expr_helper(icol_names,
                     expr,
                     output_column,
                     where_keys,
                     where_values,
                     base_case);

    t_colcptrvec icols;

    auto ocol = get_column(output_column).get();

    for (const auto& c : icol_names)
    {
        icols.push_back(get_column(c).get());
    }

    t_uindex nrows = size();

    for (t_uindex idx = 0; idx < nrows; ++idx)
    {
        t_bool valid = !icols.empty();

        for (auto icol : icols)
        {
            if (!*(icol->get_nth_valid(idx)))
            {
                valid = false;
                break;
            }
        }

        ocol->set_valid(idx, valid);
    }
}

#endif

t_uindex
t_table::get_capacity() const
{
    return m_capacity;
}

t_table*
t_table::clone_(const t_mask& mask) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_schema schema = m_schema;

    t_table* rval =
        new t_table("", "", schema, 5, BACKING_STORE_MEMORY);
    rval->init();

    for (const auto& cname : schema.m_columns)
    {
        rval->set_column(cname, get_const_column(cname)->clone(mask));
    }

    rval->set_size(mask.count());
    return rval;
}

t_table_sptr
t_table::clone(const t_mask& mask) const
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    auto tbl = clone_(mask);
    return t_table_sptr(tbl);
}

t_column*
t_table::add_column(const t_str& name,
                    t_dtype dtype,
                    t_bool valid_enabled)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(
        !m_from_recipe,
        "Adding columns to recipe based tables not supported yet.");

    if (m_schema.has_column(name))
    {
        return m_columns.at(m_schema.get_colidx(name)).get();
    }
    m_schema.add_column(name, dtype);
    m_columns.push_back(make_column(name, dtype, valid_enabled));
    m_columns.back()->init();
    m_columns.back()->reserve(std::max(
        size(), std::max(static_cast<t_uindex>(8), m_capacity)));
    m_columns.back()->set_size(size());
    return m_columns.back().get();
}

void
t_table::set_column(t_uindex idx, t_col_sptr col)
{
    m_columns[idx] = col;
}

void
t_table::set_column(const t_str& name, t_col_sptr col)
{

    t_uindex idx = m_schema.get_colidx(name);
    set_column(idx, col);
}

void
t_table::join_inplace(const t_svec& on,
                      const t_svec& update_cols,
                      const t_table& other)
{
    // s_ = self, o_ = other
    t_tscalvec s_term(on.size());
    t_tscalvec o_term(on.size());

    t_colcptrvec s_jcols(on.size());
    t_colcptrvec o_jcols(on.size());

    t_uindex idx = 0;
    for (const auto& cname : on)
    {
        s_jcols[idx] = get_const_column(cname).get();
        o_jcols[idx] = other.get_const_column(cname).get();
        ++idx;
    }

    t_colptrvec s_ucols(update_cols.size());
    t_colcptrvec o_ucols(update_cols.size());
    idx = 0;
    for (const auto& cname : update_cols)
    {
        s_ucols[idx] = get_column(cname).get();
        o_ucols[idx] = other.get_const_column(cname).get();
        ++idx;
    }

    t_uindex n_on = on.size();
    t_uindex n_upd = update_cols.size();

    for (t_uindex ridx = 0, loop_end = other.size(); ridx < loop_end;
         ++ridx)
    {
        for (t_uindex onidx = 0; onidx < n_on; ++onidx)
        {
            s_term[onidx].set(s_jcols[onidx]->get_scalar(ridx));
            o_term[onidx].set(o_jcols[onidx]->get_scalar(ridx));
        }

        if (!(s_term == o_term))
            continue;

        for (t_uindex updidx = 0; updidx < n_upd; ++updidx)
        {
            t_tscalar updval = o_ucols[updidx]->get_scalar(ridx);

            if (!updval.is_valid())
                continue;

            s_ucols[updidx]->set_scalar(ridx, updval);
        }
    }
}

t_column*
t_table::clone_column(const t_str& existing_col,
                      const t_str& new_colname)
{
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    PSP_VERBOSE_ASSERT(
        !m_from_recipe,
        "Adding columns to recipe based tables not supported yet.");

    if (!m_schema.has_column(existing_col))
    {
        std::cout << "Cannot clone non existing column";
        return 0;
    }

    t_uindex idx = m_schema.get_colidx(existing_col);

    m_schema.add_column(new_colname, m_columns[idx]->get_dtype());
    m_columns.push_back(m_columns[idx]->clone());
    m_columns.back()->reserve(std::max(
        size(), std::max(static_cast<t_uindex>(8), m_capacity)));
    m_columns.back()->set_size(size());
    return m_columns.back().get();
}

t_str
t_table::repr() const
{
    std::stringstream ss;
    ss << "t_table<" << this << ">";
    return ss.str();
}

t_table*
t_table::project(const t_svec& columns) const
{
    t_schema sch;
    for (const auto& cname : columns)
    {
        sch.add_column(cname, get_const_column(cname)->get_dtype());
    }

    t_table* rval = new t_table(sch, size());
    rval->init();

    for (const auto& cname : columns)
    {
        rval->set_column(cname, get_const_column(cname)->clone());
    }
    rval->set_size(size());
    return rval;
}

t_table*
t_table::select(const t_mask& mask) const
{
    return clone_(mask);
}

t_column_dynamic_ctxvec
t_table::get_dynamic_context() const
{
    t_column_dynamic_ctxvec rv;

    for (auto& c : m_columns)
    {
        rv.push_back(c->get_dynamic_context());
    }
    return rv;
}

void
t_table::verify() const
{
    for (auto& c : m_columns)
    {
        c->verify_size(m_capacity);
        c->verify();
    }

    auto sz = size();

    for (auto& c : m_columns)
    {
        PSP_VERBOSE_ASSERT(sz == c->size(),
                           "Ragged table encountered");
    }
}

t_tscalvec
t_table::_as_list() const
{
    t_tscalvec rval;
    auto columns = get_const_columns();

    for (t_uindex idx = 0, loop_end = size(); idx < loop_end; ++idx)
    {
        for (auto c : columns)
        {
            rval.push_back(c->get_scalar(idx));
        }
    }
    return rval;
}

void
t_table::reset()
{
    m_size = 0;
    m_capacity = DEFAULT_EMPTY_CAPACITY;
    init();
}

} // end namespace perspective
