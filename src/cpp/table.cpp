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
namespace perspective {

t_table_recipe::t_table_recipe() {}

void
t_table::set_capacity(t_uindex idx) {
    m_capacity = idx;
#ifdef PSP_TABLE_VERIFY
    if (m_init) {
        for (auto c : m_columns) {
            c->verify_size();
            c->verify_size(m_capacity);
        }
    }

#endif
}

t_table::t_table(const t_table_recipe& recipe)
    : m_name(recipe.m_name)
    , m_dirname(recipe.m_dirname)
    , m_schema(recipe.m_schema)
    , m_size(recipe.m_size)
    , m_backing_store(recipe.m_backing_store)
    , m_init(false)
    , m_recipe(recipe)
    , m_from_recipe(true) {
    set_capacity(recipe.m_capacity);
}

t_table::t_table(const t_schema& s, t_uindex init_cap)
    : m_name("")
    , m_dirname("")
    , m_schema(s)
    , m_size(0)
    , m_backing_store(BACKING_STORE_MEMORY)
    , m_init(false)
    , m_from_recipe(false) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_table");
    set_capacity(init_cap);
}

t_table::t_table(const t_str& name, const t_str& dirname, const t_schema& s, t_uindex init_cap,
    t_backing_store backing_store)
    : m_name(name)
    , m_dirname(dirname)
    , m_schema(s)
    , m_size(0)
    , m_backing_store(backing_store)
    , m_init(false)
    , m_from_recipe(false) {
    PSP_TRACE_SENTINEL();
    LOG_CONSTRUCTOR("t_table");
    set_capacity(init_cap);
}

t_table::~t_table() {
    PSP_TRACE_SENTINEL();
    LOG_DESTRUCTOR("t_table");
}

const t_str&
t_table::name() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_name;
}

void
t_table::init() {
    PSP_TRACE_SENTINEL();
    LOG_INIT("t_table");
    m_columns = t_colsptrvec(m_schema.size());

    if (m_from_recipe) {
        t_uindex idx = 0;
        for (const auto& crecipe : m_recipe.m_columns) {
            m_columns[idx] = std::make_shared<t_column>(crecipe);
            m_columns[idx]->init();
            ++idx;
        }
        set_size(m_size);
        m_init = true;
        return;
    }

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0, int(m_schema.size()), 1,
        [this](int idx)
#else
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end; ++idx)
#endif
        {
            const t_str& colname = m_schema.m_columns[idx];
            t_dtype dtype = m_schema.m_types[idx];
            m_columns[idx] = make_column(colname, dtype, m_schema.m_status_enabled[idx]);
            m_columns[idx]->init();
        }
#ifdef PSP_PARALLEL_FOR
    );
#endif

    m_init = true;
}

t_col_sptr
t_table::make_column(const t_str& colname, t_dtype dtype, t_bool status_enabled) {
    t_lstore_recipe a(m_dirname, m_name + t_str("_") + colname,
        m_capacity * get_dtype_size(dtype), m_backing_store);
    return std::make_shared<t_column>(dtype, status_enabled, a, m_capacity);
}

t_uindex
t_table::num_columns() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema.size();
}

t_uindex
t_table::num_rows() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_size;
}

t_uindex
t_table::size() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return num_rows();
}

t_dtype
t_table::get_dtype(const t_str& colname) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema.get_dtype(colname);
}

t_col_sptr
t_table::get_column(const t_str& colname) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex idx = m_schema.get_colidx(colname);
    return m_columns[idx];
}

t_col_csptr
t_table::get_const_column(const t_str& colname) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex idx = m_schema.get_colidx(colname);
    return m_columns[idx];
}

t_col_csptr
t_table::get_const_column(t_uindex idx) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_columns[idx];
}

t_colptrvec
t_table::get_columns() {
    t_colptrvec rval(m_columns.size());
    t_uindex idx = 0;
    for (const auto& c : m_columns) {
        rval[idx] = c.get();
        ++idx;
    }
    return rval;
}

t_colcptrvec
t_table::get_const_columns() const {
    t_colcptrvec rval(m_columns.size());
    t_uindex idx = 0;
    for (const auto& c : m_columns) {
        rval[idx] = c.get();
        ++idx;
    }
    return rval;
}

void
t_table::extend(t_uindex nelems) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(m_init, "Table not inited");
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end; ++idx) {
        m_columns[idx]->extend_dtype(nelems);
    }
    m_size = std::max(nelems, m_size);
    set_capacity(std::max(nelems, m_capacity));
}

void
t_table::set_size(t_uindex size) {
    PSP_TRACE_SENTINEL();
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end; ++idx) {
        m_columns[idx]->set_size(size);
    }
    m_size = size;
}

void
t_table::reserve(t_uindex capacity) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    for (t_uindex idx = 0, loop_end = m_schema.size(); idx < loop_end; ++idx) {
        m_columns[idx]->reserve(capacity);
    }
    set_capacity(std::max(capacity, m_capacity));
}

t_column*
t_table::_get_column(const t_str& colname) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex idx = m_schema.get_colidx(colname);
    return m_columns[idx].get();
}

const t_schema&
t_table::get_schema() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema;
}

t_table_sptr
t_table::flatten() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(is_pkey_table(), "Not a pkeyed table");

    t_table_sptr flattened = std::make_shared<t_table>(
        "", "", m_schema, DEFAULT_EMPTY_CAPACITY, BACKING_STORE_MEMORY);
    flattened->init();
    flatten_body<t_table_sptr>(flattened);
    return flattened;
}

t_bool
t_table::is_pkey_table() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema.is_pkey();
}

t_bool
t_table::is_same_shape(t_table& tbl) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_schema == tbl.m_schema;
}

void
t_table::pprint() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    pprint(size(), &std::cout);
}

void
t_table::pprint(const t_str& fname) const {

    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    std::ofstream file;
    file.open(fname);
    pprint(size(), &file);
}

void
t_table::pprint(t_uindex nrows, std::ostream* os) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    if (!os)
        os = &std::cout;

    t_uindex nrows_ = nrows ? nrows : num_rows();
    nrows_ = std::min(nrows_, num_rows());

    t_uindex ncols = num_columns();

    t_colcptrvec columns(ncols);
    for (t_uindex idx = 0; idx < ncols; ++idx) {
        columns[idx] = m_columns[idx].get();
        (*os) << m_schema.m_columns[idx] << ", ";
    }

    (*os) << std::endl;
    (*os) << "==========================" << std::endl;

    for (t_uindex ridx = 0; ridx < nrows_; ++ridx) {
        for (t_uindex cidx = 0; cidx < ncols; ++cidx) {
            (*os) << columns[cidx]->get_scalar(ridx).to_string() << ", ";
        }
        (*os) << std::endl;
    }
}

void
t_table::pprint(const t_uidxvec& vec) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_uindex nrows = vec.size();
    t_uindex ncols = num_columns();

    t_colcptrvec columns(ncols);
    for (t_uindex idx = 0; idx < ncols; ++idx) {
        columns[idx] = m_columns[idx].get();
        std::cout << m_schema.m_columns[idx] << ", ";
    }

    std::cout << std::endl;
    std::cout << "==========================" << std::endl;

    for (t_uindex ridx = 0; ridx < nrows; ++ridx) {
        for (t_uindex cidx = 0; cidx < ncols; ++cidx) {
            std::cout << columns[cidx]->get_scalar(vec[ridx]) << ", ";
        }
        std::cout << std::endl;
    }
}

void
t_table::append(const t_table& other) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    t_uindex cursize = size();

    t_colcptrvec src_cols;
    t_colptrvec dst_cols;

    t_sset incoming;

    for (const auto& cname : other.m_schema.m_columns) {
        PSP_VERBOSE_ASSERT(
            other.get_const_column(cname)->get_dtype() == get_column(cname)->get_dtype(),
            "Mismatched column dtypes");
        src_cols.push_back(other.get_const_column(cname).get());
        dst_cols.push_back(get_column(cname).get());
        incoming.insert(cname);
    }
    t_uindex other_size = other.num_rows();

    for (const auto& cname : m_schema.m_columns) {
        if (incoming.find(cname) == incoming.end()) {
            get_column(cname)->extend_dtype(cursize + other_size);
        }
    }

#ifdef PSP_PARALLEL_FOR
    PSP_PFOR(0, int(src_cols.size()), 1,
        [&src_cols, dst_cols](int colidx)
#else
    for (t_uindex colidx = 0, loop_end = src_cols.size(); colidx < loop_end; ++colidx)
#endif
        { dst_cols[colidx]->append(*(src_cols[colidx])); }
#ifdef PSP_PARALLEL_FOR
    );
#endif
    set_capacity(std::max(m_capacity, m_size + other.num_rows()));
    set_size(m_size + other.num_rows());
}

void
t_table::clear() {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    for (t_uindex idx = 0, loop_end = m_columns.size(); idx < loop_end; ++idx) {
        m_columns[idx]->clear();
    }
    m_size = 0;
}

t_table_recipe
t_table::get_recipe() const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_table_recipe rval;
    rval.m_name = m_name;
    rval.m_dirname = m_dirname;
    rval.m_schema = m_schema.get_recipe();
    rval.m_size = m_size;
    rval.m_capacity = m_capacity;
    rval.m_backing_store = m_backing_store;
    for (const auto& cname : m_schema.m_columns) {
        t_col_csptr cptr = get_const_column(cname);
        rval.m_columns.push_back(cptr->get_recipe());
    }
    return rval;
}

t_mask
t_table::filter_cpp(t_filter_op combiner, const t_ftermvec& fterms_) const {
    auto self = const_cast<t_table*>(this);
    auto fterms = fterms_;

    t_mask mask(size());
    t_uindex fterm_size = fterms.size();
    t_uidxvec indices(fterm_size);
    t_colcptrvec columns(fterm_size);

    for (t_uindex idx = 0; idx < fterm_size; ++idx) {
        indices[idx] = m_schema.get_colidx(fterms[idx].m_colname);
        columns[idx] = get_const_column(fterms[idx].m_colname).get();
        fterms[idx].coerce_numeric(columns[idx]->get_dtype());
        if (fterms[idx].m_use_interned) {
            t_tscalar& thr = fterms[idx].m_threshold;
            auto col = self->get_column(fterms[idx].m_colname);
            auto interned = col->get_interned(thr.get_char_ptr());
            thr.set(interned);
        }
    }

    switch (combiner) {
        case FILTER_OP_AND: {
            t_tscalar cell_val;

            for (t_uindex ridx = 0, rloop_end = size(); ridx < rloop_end; ++ridx) {
                t_bool pass = true;

                for (t_uindex cidx = 0; cidx < fterm_size; ++cidx) {
                    if (!pass)
                        break;

                    const auto& ft = fterms[cidx];
                    t_bool tval;

                    if (ft.m_use_interned) {
                        cell_val.set(*(columns[cidx]->get_nth<t_stridx>(ridx)));
                        tval = ft(cell_val);
                    } else {
                        cell_val = columns[cidx]->get_scalar(ridx);
                        tval = ft(cell_val);
                    }

                    if (!cell_val.is_valid() || !tval) {
                        pass = false;
                        break;
                    }
                }

                mask.set(ridx, pass);
            }
        } break;
        case FILTER_OP_OR: {
            for (t_uindex ridx = 0, rloop_end = size(); ridx < rloop_end; ++ridx) {
                t_bool pass = false;
                for (t_uindex cidx = 0; cidx < fterm_size; ++cidx) {
                    t_tscalar cell_val = columns[cidx]->get_scalar(ridx);
                    if (fterms[cidx](cell_val)) {
                        pass = true;
                        break;
                    }
                }
                mask.set(ridx, pass);
            }
        } break;
        default: { PSP_COMPLAIN_AND_ABORT("Unknown filter op"); } break;
    }

    return mask;
}

t_uindex
t_table::get_capacity() const {
    return m_capacity;
}

t_table*
t_table::clone_(const t_mask& mask) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_schema schema = m_schema;

    t_table* rval = new t_table("", "", schema, 5, BACKING_STORE_MEMORY);
    rval->init();

    for (const auto& cname : schema.m_columns) {
        rval->set_column(cname, get_const_column(cname)->clone(mask));
    }

    rval->set_size(mask.count());
    return rval;
}

t_table_sptr
t_table::clone(const t_mask& mask) const {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    auto tbl = clone_(mask);
    return t_table_sptr(tbl);
}

t_column*
t_table::add_column(const t_str& name, t_dtype dtype, t_bool status_enabled) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(
        !m_from_recipe, "Adding columns to recipe based tables not supported yet.");

    if (m_schema.has_column(name)) {
        return m_columns.at(m_schema.get_colidx(name)).get();
    }
    m_schema.add_column(name, dtype);
    m_columns.push_back(make_column(name, dtype, status_enabled));
    m_columns.back()->init();
    m_columns.back()->reserve(std::max(size(), std::max(static_cast<t_uindex>(8), m_capacity)));
    m_columns.back()->set_size(size());
    return m_columns.back().get();
}

void
t_table::set_column(t_uindex idx, t_col_sptr col) {
    m_columns[idx] = col;
}

void
t_table::set_column(const t_str& name, t_col_sptr col) {

    t_uindex idx = m_schema.get_colidx(name);
    set_column(idx, col);
}

t_column*
t_table::clone_column(const t_str& existing_col, const t_str& new_colname) {
    PSP_TRACE_SENTINEL();
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");

    PSP_VERBOSE_ASSERT(
        !m_from_recipe, "Adding columns to recipe based tables not supported yet.");

    if (!m_schema.has_column(existing_col)) {
        std::cout << "Cannot clone non existing column";
        return 0;
    }

    t_uindex idx = m_schema.get_colidx(existing_col);

    m_schema.add_column(new_colname, m_columns[idx]->get_dtype());
    m_columns.push_back(m_columns[idx]->clone());
    m_columns.back()->reserve(std::max(size(), std::max(static_cast<t_uindex>(8), m_capacity)));
    m_columns.back()->set_size(size());
    return m_columns.back().get();
}

t_str
t_table::repr() const {
    std::stringstream ss;
    ss << "t_table<" << this << ">";
    return ss.str();
}

void
t_table::verify() const {
    for (auto& c : m_columns) {
        c->verify_size(m_capacity);
        c->verify();
    }

    auto sz = size();

    for (auto& c : m_columns) {
        PSP_VERBOSE_ASSERT(sz == c->size(), "Ragged table encountered");
    }
}

void
t_table::reset() {
    m_size = 0;
    m_capacity = DEFAULT_EMPTY_CAPACITY;
    init();
}

} // end namespace perspective
