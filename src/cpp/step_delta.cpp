/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/step_delta.h>

namespace perspective {

// Deltas for various contexts

t_zcdelta::t_zcdelta(t_tscalar pkey, t_index colidx, t_tscalar old_value, t_tscalar new_value)
    : m_pkey(pkey)
    , m_colidx(colidx)
    , m_old_value(old_value)
    , m_new_value(new_value) {}

t_tcdelta::t_tcdelta(t_uindex nidx, t_uindex aggidx, t_tscalar old_value, t_tscalar new_value)
    : m_nidx(nidx)
    , m_aggidx(aggidx)
    , m_old_value(old_value)
    , m_new_value(new_value) {}

t_cellupd::t_cellupd(
    t_index row, t_index column, const t_tscalar& old_value, const t_tscalar& new_value)
    : row(row)
    , column(column)
    , old_value(old_value)
    , new_value(new_value) {}

t_cellupd::t_cellupd() {}

t_stepdelta::t_stepdelta() {}

t_stepdelta::t_stepdelta(bool rows_changed, bool columns_changed, const t_cellupdvec& cells)
    : rows_changed(rows_changed)
    , columns_changed(columns_changed)
    , cells(cells) {}

} // end namespace perspective

namespace std {

std::ostream&
operator<<(std::ostream& os, const perspective::t_cellupd& cell) {
    os << "t_cellupd \n{"
       << "\n\trow => " << cell.row << "\n\tcolumn => " << cell.column << "\n\told_value => "
       << cell.old_value << "\n\tnew_value => " << cell.new_value << "\n}" << std::endl;

    return os;
}

} // end namespace std
