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
#include <perspective/scalar.h>
#include <perspective/exports.h>
#include <vector>
#include <boost/multi_index_container.hpp>
#include <boost/multi_index/member.hpp>
#include <boost/multi_index/hashed_index.hpp>
#include <boost/multi_index/ordered_index.hpp>
#include <boost/multi_index/composite_key.hpp>
#include <boost/variant/apply_visitor.hpp>

namespace perspective {

using boost::multi_index_container;
using namespace boost::multi_index;

// Deltas for various contexts

struct t_zcdelta {
    t_zcdelta(t_tscalar pkey, t_index colidx, t_tscalar old_value, t_tscalar new_value);

    t_tscalar m_pkey;
    t_index m_colidx;
    t_tscalar m_old_value;
    t_tscalar m_new_value;
};

struct by_zc_pkey_colidx {};

typedef multi_index_container<t_zcdelta,
    indexed_by<ordered_unique<tag<by_zc_pkey_colidx>,
        composite_key<t_zcdelta, BOOST_MULTI_INDEX_MEMBER(t_zcdelta, t_tscalar, m_pkey),
            BOOST_MULTI_INDEX_MEMBER(t_zcdelta, t_index, m_colidx)>>>>
    t_zcdeltas;

typedef t_zcdeltas::index<by_zc_pkey_colidx>::type::iterator iter_by_zc_pkey_colidx;

typedef std::pair<iter_by_zc_pkey_colidx, iter_by_zc_pkey_colidx> iterpair_by_zc_pkey_colidx;
typedef std::shared_ptr<t_zcdeltas> t_sptr_zcdeltas;

struct t_tcdelta {
    t_tcdelta(t_uindex nidx, t_uindex aggidx, t_tscalar old_value, t_tscalar new_value);

    t_uindex m_nidx;
    t_uindex m_aggidx;
    t_tscalar m_old_value;
    t_tscalar m_new_value;
};

struct by_tc_nidx_aggidx {};

typedef multi_index_container<t_tcdelta,
    indexed_by<ordered_unique<tag<by_tc_nidx_aggidx>,
        composite_key<t_tcdelta, BOOST_MULTI_INDEX_MEMBER(t_tcdelta, t_uindex, m_nidx),
            BOOST_MULTI_INDEX_MEMBER(t_tcdelta, t_uindex, m_aggidx)>>>>
    t_tcdeltas;

typedef t_tcdeltas::index<by_tc_nidx_aggidx>::type::iterator iter_by_tc_nidx_aggidx;

typedef std::pair<iter_by_tc_nidx_aggidx, iter_by_tc_nidx_aggidx> iterpair_by_tc_nidx_aggidx;

typedef std::shared_ptr<t_tcdeltas> t_sptr_tcdeltas;

struct PERSPECTIVE_EXPORT t_cellupd {
    t_cellupd(
        t_index row, t_index column, const t_tscalar& old_value, const t_tscalar& new_value);

    t_cellupd();

    t_int32 row;
    t_int32 column;
    t_tscalar old_value;
    t_tscalar new_value;
};

typedef std::vector<t_cellupd> t_cellupdvec;

struct PERSPECTIVE_EXPORT t_stepdelta {
    t_stepdelta();

    t_stepdelta(bool rows_changed, bool columns_changed, const t_cellupdvec& cells);

    bool rows_changed;
    bool columns_changed;
    t_cellupdvec cells;
};

} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_cellupd& cell);
}
