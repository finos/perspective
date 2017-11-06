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
SUPPRESS_WARNINGS_VC(4505)
#define NO_IMPORT_ARRAY
#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy
#include <numpy/arrayobject.h>
#include <perspective/numpy.h>
#include <perspective/column_chunk.h>
#include <perspective/raii.h>

namespace perspective
{

t_column_chunk::t_column_chunk()
    : m_darr(0), m_varr(0), m_density(COLUMN_CHUNK_DENSITY_DENSE)
{
    LOG_CONSTRUCTOR("t_column_chunk");
}

t_column_chunk::t_column_chunk(t_col_sptr& column,
                               t_column_chunk_density density,
                               t_uidxvec* indices)
    : m_darr(0), m_varr(0), m_column(column), m_base(0), m_valid(0),
      m_version(column->get_version()), m_bidx(0), m_eidx(0),
      m_init(false), m_mode(COLUMN_CHUNK_COPY),
      m_dtype(m_column->get_dtype()),
      m_elemsize(get_dtype_size(m_dtype)), m_density(density),
      m_indices(indices)
{
    LOG_CONSTRUCTOR("t_column_chunk");
}

t_column_chunk::~t_column_chunk()
{
    LOG_DESTRUCTOR("t_column_chunk");

    if (m_init)
    {
        t_dtype dtype = m_column->get_dtype();
        if (is_vlen_dtype(dtype))
        {
            release_strings();
        }

        if (m_darr)
            Py_XDECREF(m_darr);

        free(m_base);

        if (m_column->is_valid_enabled())
        {
            Py_XDECREF(m_varr);
            free(m_valid);
        }
    }
}

void
t_column_chunk::release_strings()
{
    PyObject** base = reinterpret_cast<PyObject**>(m_base);
    for (t_uindex idx = 0; idx < DEFAULT_CHUNK_SIZE; ++idx)
    {
        PyObject* oval = base[idx];
        Py_CLEAR(oval);
    }
}

void
t_column_chunk::init()
{
    LOG_INIT("t_column_chunk");

    t_dtype dtype = m_column->get_dtype();

    npy_intp dims[1];
    dims[0] = DEFAULT_CHUNK_SIZE;

    t_uindex alloc_sz;
    if (is_vlen_dtype(dtype))
    {
        alloc_sz = sizeof(PyObject*);
    }
    else
    {
        alloc_sz = get_dtype_size(dtype);
    }
    m_base = calloc(DEFAULT_CHUNK_SIZE, alloc_sz);

    PSP_VERBOSE_ASSERT(m_base, "Error allocating memory for chunk");

    if (m_column->is_valid_enabled())
    {
        m_valid = static_cast<t_bool*>(
            calloc(DEFAULT_CHUNK_SIZE, get_dtype_size(DTYPE_BOOL)));

        PSP_VERBOSE_ASSERT(m_valid, "Error valid space for chunk");

        m_varr = PyArray_SimpleNewFromData(
            1,
            dims,
            get_numpy_typenum_from_dtype(DTYPE_BOOL),
            m_valid);
    }

    PyObject* arr;

    if (dtype == DTYPE_TIME)
    {
        t_py_handle dtype_pystr(
            PyString_FromString("datetime64[us]"));
        PSP_VERBOSE_ASSERT(dtype_pystr.m_pyo,
                           "Error building pystring");

        PyArray_Descr* descr;
        t_int32 rc =
            PyArray_DescrConverter(dtype_pystr.m_pyo, &descr);

        PSP_VERBOSE_ASSERT(rc != NPY_FAIL,
                           "Error building array descr");

        arr = PyArray_NewFromDescr(&PyArray_Type,
                                   descr,
                                   1,
                                   dims,
                                   0,
                                   m_base,
                                   NPY_ARRAY_DEFAULT,
                                   0);
    }
    else
    {
        arr = PyArray_SimpleNewFromData(
            1, dims, get_numpy_typenum_from_dtype(m_dtype), m_base);
    }

    m_darr = arr;
    m_init = true;
}

void
t_column_chunk::fill_missing(t_uindex bidx, t_uindex eidx)
{
    if (m_column->is_valid_enabled())
    {
        t_bool* vbase = m_column->get_nth_valid(bidx);
        memcpy(m_valid,
               vbase,
               (eidx - bidx) * get_dtype_size(DTYPE_BOOL));
    }
}

void
t_column_chunk::fill_vlen(t_uindex bidx, t_uindex eidx)
{
    t_column* column = m_column.get();
    t_uindex nelems = eidx - bidx;
    t_uindex* cbase = column->get_nth<t_uindex>(bidx);

    PyObject** base = reinterpret_cast<PyObject**>(m_base);

    for (t_uindex idx = 0; idx < nelems; ++idx)
    {
        PyObject* oval = base[idx];
        Py_CLEAR(oval);
        const char* s = column->unintern_c(cbase[idx]);
        base[idx] = PyString_FromString(s);
        PSP_VERBOSE_ASSERT(base[idx] != 0,
                           "Error constructing python string");
    }
    fill_missing(bidx, eidx);
}

void
t_column_chunk::fill_fixed(t_uindex bidx, t_uindex eidx)
{
    void* cbase =
        static_cast<void*>(m_column->get<t_uchar>(bidx * m_elemsize));
    memcpy(m_base, cbase, (eidx - bidx) * m_elemsize);
    fill_missing(bidx, eidx);
}

void
t_column_chunk::fill(t_uindex bidx, t_uindex eidx)
{
    if (is_vlen_dtype(m_dtype))
    {
        fill_vlen(bidx, eidx);
    }
    else
    {
        fill_fixed(bidx, eidx);
    }

    m_version = m_column->get_version();

    m_bidx = bidx;
    m_eidx = eidx;

    update_dims(bidx, eidx);
}

void
t_column_chunk::update_dims(t_uindex bidx, t_uindex eidx)
{
    m_bfill = 0;
    m_efill = eidx - bidx;

    if (!m_darr)
        return;

    PyArrayObject* arr = reinterpret_cast<PyArrayObject*>(m_darr);
    npy_intp* dims = PyArray_DIMS(arr);
    dims[0] = m_efill;

    if (!m_varr)
        return;

    PyArrayObject* varr = reinterpret_cast<PyArrayObject*>(m_varr);
    npy_intp* vdims = PyArray_DIMS(varr);
    vdims[0] = m_efill;
}

void
t_column_chunk::commit_missing_dense()
{
    if (m_column->is_valid_enabled())
    {
        t_bool* vbase = m_column->get_nth_valid(0);
        memcpy(vbase + m_bidx * get_dtype_size(DTYPE_BOOL),
               m_valid,
               (m_eidx - m_bidx) * get_dtype_size(DTYPE_BOOL));
    }
}

void
t_column_chunk::commit_missing_sparse()
{
    t_uindex nelems = m_eidx - m_bidx;
    if (m_column->is_valid_enabled())
    {
        t_bool* vbase = m_column->get_nth_valid(0);
        for (t_uindex idx = 0; idx < nelems; ++idx)
        {
            vbase[(*m_indices)[idx]] = m_valid[idx];
        }
    }
}

void
t_column_chunk::commit_vlen()
{
    t_uindex nelems = m_eidx - m_bidx;
    t_column* column = m_column.get();
    t_uindex* cbase = column->get_nth<t_uindex>(m_bidx);
    PyObject** base = reinterpret_cast<PyObject**>(m_base);

    switch (m_density)
    {
        case COLUMN_CHUNK_DENSITY_DENSE:
        {
            for (t_uindex idx = 0; idx < nelems; ++idx)
            {
                PyObject* val = base[idx];
                const char* s = PyString_AsString(val);
                if (s == 0)
                {
                    cbase[idx] = column->get_interned("!!INVALID!!");
                }
                else
                {
                    cbase[idx] = column->get_interned(s);
                }
            }
            commit_missing_dense();
        }
        break;
        case COLUMN_CHUNK_DENSITY_SPARSE:
        {
            t_uindex* cbase_zero = column->get_nth<t_uindex>(0);

            for (t_uindex idx = 0; idx < nelems; ++idx)
            {
                PyObject* val = base[idx];
                const char* s = PyString_AsString(val);
                if (s == 0)
                {
                    cbase_zero[(*m_indices)[idx]] =
                        column->get_interned("!!INVALID!!");
                }
                else
                {
                    cbase_zero[(*m_indices)[idx]] =
                        column->get_interned(s);
                }
            }

            commit_missing_sparse();
        }
        break;
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Unknown density encountered");
        }
    }
}

void
t_column_chunk::commit_fixed()
{
    t_uchar* cbase = m_column->get_nth<t_uchar>(0);
    const t_uchar* base = static_cast<const t_uchar*>(m_base);

    switch (m_density)
    {
        case COLUMN_CHUNK_DENSITY_DENSE:
        {
            memcpy(cbase + m_bidx * m_elemsize,
                   m_base,
                   (m_eidx - m_bidx) * m_elemsize);
            commit_missing_dense();
        }
        break;
        case COLUMN_CHUNK_DENSITY_SPARSE:
        {
            switch (m_dtype)
            {
                case DTYPE_INT64:
                case DTYPE_UINT64:
                case DTYPE_FLOAT64:
                case DTYPE_TIME:
                {
                    for (t_uindex idx = m_bfill; idx < m_efill; ++idx)
                    {
                        t_uint64* dest =
                            reinterpret_cast<t_uint64*>(cbase) +
                            (*m_indices)[idx];

                        const t_uint64* src =
                            reinterpret_cast<const t_uint64*>(base) +
                            idx;
                        *dest = *src;
                    }
                }
                break;
                case DTYPE_INT32:
                case DTYPE_UINT32:
                case DTYPE_FLOAT32:
                case DTYPE_DATE:
                {
                    for (t_uindex idx = m_bfill; idx < m_efill; ++idx)
                    {
                        t_uint32* dest =
                            reinterpret_cast<t_uint32*>(cbase) +
                            (*m_indices)[idx];

                        const t_uint32* src =
                            reinterpret_cast<const t_uint32*>(base) +
                            idx;
                        *dest = *src;
                    }
                }
                break;
                default:
                {
                    for (t_uindex idx = m_bfill; idx < m_efill; ++idx)
                    {
                        t_uchar* dest =
                            cbase + (*m_indices)[idx] * m_elemsize;

                        const t_uchar* src = base + idx * m_elemsize;

                        memcpy(dest,
                               src,
                               (m_efill - m_bfill) * m_elemsize);
                    }
                }
                break;
            }

            commit_missing_sparse();
        }
        break;
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Unknown density mode");
        }
    }
}

void
t_column_chunk::commit()
{
    PSP_VERBOSE_ASSERT(m_version == m_column->get_version(),
                       "Differing versions detected");

    if (is_vlen_dtype(m_dtype))
    {
        commit_vlen();
    }
    else
    {
        commit_fixed();
    }
}

void
t_column_chunk::fill_vlen(const t_uidxvec& indices,
                          t_uindex bidx,
                          t_uindex eidx)
{
    t_column* column = m_column.get();
    t_uindex nelems = eidx - bidx;
    PyObject** base = reinterpret_cast<PyObject**>(m_base);

    for (t_uindex idx = 0; idx < nelems; ++idx)
    {
        PyObject* oval = base[idx];
        Py_XDECREF(oval);
        const char* s = column->unintern_c(indices[idx]);
        base[idx] = PyString_FromString(s);
        PSP_VERBOSE_ASSERT(base[idx] != 0,
                           "Error constructing python string");
    }
}

void
t_column_chunk::fill_missing(const t_uidxvec& indices,
                             t_uindex bidx,
                             t_uindex eidx)
{
    if (m_column->is_valid_enabled())
    {
        t_uindex nelems = eidx - bidx;

        t_bool* sbase = m_column->get_nth_valid(0);
        t_bool* dbase = m_valid;

        for (t_uindex idx = 0; idx < nelems; ++idx)
        {
            t_bool* dest = dbase + idx;
            const t_bool* src = sbase + indices[idx];
            *dest = *src;
        }
    }
}

void
t_column_chunk::fill_fixed(const t_uidxvec& indices,
                           t_uindex bidx,
                           t_uindex eidx)
{
    t_uindex nelems = eidx - bidx;

    const t_uchar* cbase = m_column->get_nth<const t_uchar>(0);

    t_uchar* base = static_cast<t_uchar*>(m_base);

    switch (m_dtype)
    {
        case DTYPE_INT64:
        case DTYPE_UINT64:
        case DTYPE_FLOAT64:
        case DTYPE_TIME:
        {
            for (t_uindex idx = 0; idx < nelems; ++idx)
            {
                t_uint64* dest =
                    reinterpret_cast<t_uint64*>(base) + idx;

                const t_uint64* src =
                    reinterpret_cast<const t_uint64*>(cbase) +
                    indices[idx];
                *dest = *src;
            }
        }
        break;
        case DTYPE_INT32:
        case DTYPE_UINT32:
        case DTYPE_FLOAT32:
        case DTYPE_DATE:
        {
            for (t_uindex idx = 0; idx < nelems; ++idx)
            {
                t_uint32* dest =
                    reinterpret_cast<t_uint32*>(base) + idx;

                const t_uint32* src =
                    reinterpret_cast<const t_uint32*>(cbase) +
                    indices[idx];

                *dest = *src;
            }
        }
        break;
        default:
        {
            for (t_uindex idx = 0; idx < nelems; ++idx)
            {
                t_uchar* dest = base + idx * m_elemsize;

                const t_uchar* src =
                    cbase + indices[idx] * m_elemsize;

                memcpy(dest, src, (eidx - bidx) * m_elemsize);
            }
        }
        break;
    }

    fill_missing(indices, bidx, eidx);
}

void
t_column_chunk::fill(const t_uidxvec& indices,
                     t_uindex bidx,
                     t_uindex eidx)
{
    if (is_vlen_dtype(m_dtype))
    {
        fill_vlen(indices, bidx, eidx);
    }
    else
    {
        fill_fixed(indices, bidx, eidx);
    }

    fill_missing(indices, bidx, eidx);
    m_version = m_column->get_version();

    m_bidx = bidx;
    m_eidx = eidx;

    update_dims(bidx, eidx);
}

PyObject*
t_column_chunk::data()
{
    Py_XINCREF(m_darr);
    return m_darr;
}

PyObject*
t_column_chunk::valid()
{
    Py_XINCREF(m_varr);
    return m_varr;
}

t_uindex
t_column_chunk::bfill() const
{
    return m_bfill;
}

t_uindex
t_column_chunk::efill() const
{
    return m_efill;
}

} // end namespace perspective
