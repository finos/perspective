/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/mask.h>
#ifdef PSP_ENABLE_PYTHON
#define NO_IMPORT_ARRAY
#define PY_ARRAY_UNIQUE_SYMBOL _perspectiveNumpy
#include <numpy/arrayobject.h>
#endif
#include <perspective/raii.h>

namespace perspective
{

t_mask::t_mask()
{
    LOG_CONSTRUCTOR("t_mask");
}

t_mask::t_mask(t_uindex size) : m_bitmap(t_msize(size))
{
    LOG_CONSTRUCTOR("t_mask");
}

#ifdef PSP_ENABLE_PYTHON
t_mask::t_mask(PyObject* mask)
{
    LOG_CONSTRUCTOR("t_mask");
    PyArrayObject* arr = reinterpret_cast<PyArrayObject*>(mask);

    PSP_VERBOSE_ASSERT(PyArray_IS_C_CONTIGUOUS(arr),
                       "Only contiguous arrays supported currently");

    PSP_VERBOSE_ASSERT(PyArray_DESCR(arr)->type_num == NPY_BOOL,
                       "Expecting bool array");

    t_bool* carr = static_cast<t_bool*>(PyArray_DATA(arr));
    t_uindex len = PyArray_SIZE(arr);
    m_bitmap = boost::dynamic_bitset<>(t_msize(len));

    for (t_uindex idx = 0; idx < len; ++idx)
    {
        set(idx, *(carr + idx));
    }
}
#endif

t_mask::t_mask(const t_simple_bitmask& m)
{
    m_bitmap = boost::dynamic_bitset<>(static_cast<size_t>(m.size()));

    for (t_uindex idx = 0, loop_end = m.size(); idx < loop_end; ++idx)
    {
        set(idx, m.is_set(idx));
    }
}

t_mask::~t_mask()
{
    LOG_DESTRUCTOR("t_mask");
}

void
t_mask::clear()
{
    m_bitmap.clear();
}

t_uindex
t_mask::count() const
{
    return m_bitmap.count();
}

t_uindex
t_mask::size() const
{
    return m_bitmap.size();
}

bool
t_mask::get(t_uindex idx) const
{
    return m_bitmap.test(t_msize(idx));
}

void
t_mask::set(t_uindex idx, bool v)
{
    m_bitmap.set(t_msize(idx), v);
}

void
t_mask::set(t_uindex idx)
{
    m_bitmap.set(t_msize(idx), true);
}

t_mask&
t_mask::operator&=(const t_mask& b)
{
    m_bitmap &= b.m_bitmap;
    return *this;
}

t_mask&
t_mask::operator|=(const t_mask& b)
{
    m_bitmap |= b.m_bitmap;
    return *this;
}

t_mask&
t_mask::operator^=(const t_mask& b)
{
    m_bitmap ^= b.m_bitmap;
    return *this;
}

t_mask&
t_mask::operator-=(const t_mask& b)
{
    m_bitmap -= b.m_bitmap;
    return *this;
}

t_uindex
t_mask::find_first() const
{
    return m_bitmap.find_first();
}

t_uindex
t_mask::find_next(t_uindex pos) const
{
    return m_bitmap.find_next(t_msize(pos));
}

#ifdef PSP_ENABLE_PYTHON
PyObject*
t_mask::as_numpy() const
{
    PyArray_Descr* descr = PyArray_DescrFromType(NPY_BOOL);

    PSP_VERBOSE_ASSERT(descr != 0, "Error building array descr");

    npy_intp dims[1];
    dims[0] = npy_int(size());

    PyObject* arr = PyArray_NewFromDescr(
        &PyArray_Type, descr, 1, dims, 0, 0, NPY_ARRAY_DEFAULT, 0);

    PyArrayObject* arr_ = reinterpret_cast<PyArrayObject*>(arr);
    t_bool* carr = static_cast<t_bool*>(PyArray_DATA(arr_));
    t_uindex len = size();

    for (t_uindex idx = 0; idx < len; ++idx)
    {
        carr[idx] = get(idx);
    }

    return arr;
}
#endif

void
t_mask::pprint() const
{
    std::cout << *this << std::endl;
}

t_uindex
t_mask_iterator::next()
{
    t_uindex rval = m_pos;
    m_pos = m_mask->find_next(rval);
    return rval;
}

bool
t_mask_iterator::has_next() const
{
    return m_pos != m_end;
}

t_mask_iterator::t_mask_iterator(t_maskcsptr m)
    : m_mask(m), m_pos(m_mask->find_first())
{
    LOG_CONSTRUCTOR("t_mask_iterator");
}

t_mask_iterator::t_mask_iterator()
{
    LOG_CONSTRUCTOR("t_mask_iterator");
}

t_uindex
t_mask_iterator::size() const
{
    return m_mask->size();
}

t_uindex
t_mask_iterator::count() const
{
    return m_mask->count();
}

t_mask_iterator::~t_mask_iterator()
{
    LOG_DESTRUCTOR("t_mask_iterator");
}

} // end namespace perspective

namespace std
{
std::ostream&
operator<<(std::ostream& os, const perspective::t_mask& mask)
{
    std::cout << "t_mask<\n";
    for (perspective::t_uindex idx = 0, loop_end = mask.size();
         idx < loop_end;
         ++idx)
    {
        std::cout << "\t" << idx << ". " << mask.get(idx)
                  << std::endl;
    }
    std::cout << ">\n";
    return os;
}
}
