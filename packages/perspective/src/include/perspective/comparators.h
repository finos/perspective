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
#include <perspective/raw_types.h>
#include <perspective/column.h>
#include <perspective/exports.h>
#include <functional>
#include <cstring>

namespace perspective
{

template <typename DATA_T, int DTYPE_T>
struct PERSPECTIVE_EXPORT t_comparator
{
    inline t_comparator(const t_column* col);
    inline bool operator()(DATA_T a, DATA_T b) const;
    const t_column* m_col;
};

template <typename DATA_T, int DTYPE_T>
inline t_comparator<DATA_T, DTYPE_T>::t_comparator(
    const t_column* col)
    : m_col(col)
{
}

template <typename DATA_T, int DTYPE_T>
inline bool
t_comparator<DATA_T, DTYPE_T>::operator()(DATA_T a, DATA_T b) const
{
    std::less<DATA_T> cmp;
    return cmp(a, b);
}

template <>
inline bool
t_comparator<t_uindex, DTYPE_STR>::operator()(t_uindex a,
                                              t_uindex b) const
{
    std::less<const char*> cmp;
    return cmp(m_col->unintern_c(a), m_col->unintern_c(b));
}

template <typename DATA_T>
struct PERSPECTIVE_EXPORT t_filter_comparator
{
    bool
    operator()(DATA_T c1, DATA_T c2) const
    {
        return c1 < c2;
    }

    bool
    operator()(const char* c1, const char* c2) const
    {
        bool rv = strcmp(c1, c2) <= 0;
        return rv;
    }
};

} // end namespace perspective
