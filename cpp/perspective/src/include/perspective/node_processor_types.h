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
#include <vector>

namespace perspective {

template <typename DATA_T>
struct t_chunk_value_span {
    DATA_T m_value;
    t_uindex m_bidx;
    t_uindex m_eidx;
};

template <typename DATA_T>
void
fill_chunk_value_span(t_chunk_value_span<DATA_T>& cvs, DATA_T value,
    t_uindex bidx, t_uindex eidx) {
    cvs.m_value = value;
    cvs.m_bidx = bidx;
    cvs.m_eidx = eidx;
}

template <typename DATA_T>
void
fill_chunk_value_span(t_chunk_value_span<DATA_T>* cvs, DATA_T value,
    t_uindex bidx, t_uindex eidx) {
    cvs->m_value = value;
    cvs->m_bidx = bidx;
    cvs->m_eidx = eidx;
}
} // namespace perspective
