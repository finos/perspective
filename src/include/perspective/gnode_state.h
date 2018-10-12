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
#include <perspective/table.h>
#include <boost/unordered_map.hpp>
#include <boost/unordered_set.hpp>
#include <perspective/mask.h>
#include <perspective/sym_table.h>
#include <perspective/rlookup.h>

namespace perspective {

std::pair<t_tscalar, t_tscalar> get_vec_min_max(const t_tscalvec& vec);

class PERSPECTIVE_EXPORT t_gstate {
    typedef boost::unordered_map<t_tscalar, t_uindex> t_mapping;

    typedef boost::unordered_set<t_uindex> t_free_items;

public:
    t_gstate(const t_schema& tblschema, const t_schema& pkeyed_schema);
    ~t_gstate();
    void init();

    t_rlookup lookup(t_tscalar pkey) const;
    t_uindex lookup_or_create(const t_tscalar& pkey);

    void _mark_deleted(t_uindex idx);
    void erase(const t_tscalar& pkey);

    void update_history(const t_table* tbl);
    t_mask get_cpp_mask() const;

    t_tscalar get_value(const t_tscalar& pkey, const t_str& colname) const;

    void read_column(const t_str& colname, const t_tscalvec& pkeys, t_tscalvec& out_data) const;

    void read_column(const t_str& colname, const t_tscalvec& pkeys, t_f64vec& out_data) const;

    void read_column(const t_str& colname, const t_tscalvec& pkeys, t_f64vec& out_data,
        bool include_nones) const;

    t_table_sptr get_table();
    t_table_csptr get_table() const;

    t_table_sptr get_pkeyed_table(const t_schema& schema) const;
    t_table* _get_pkeyed_table(const t_schema& schema) const;
    t_table* _get_pkeyed_table(const t_schema& schema, const t_mask& mask) const;

    t_table_sptr get_pkeyed_table() const;

    t_table* _get_pkeyed_table() const;
    t_table* _get_pkeyed_table(const t_tscalvec& pkeys) const;
    t_table* _get_pkeyed_table(const t_schema& schema, const t_tscalvec& pkeys) const;

    void pprint() const;

    t_tscalar get(t_tscalar pkey, const t_str& colname) const;
    t_tscalvec get_row(t_tscalar pkey) const;

    t_bool is_unique(const t_tscalvec& pkeys, const t_str& colname, t_tscalar& value) const;

    t_bool apply(const t_tscalvec& pkeys, const t_str& colname, t_tscalar& value) const;

    t_bool apply(const t_tscalvec& pkeys, const t_str& colname, t_tscalar& value,
        std::function<t_bool(const t_tscalar&, t_tscalar&)> fn) const;

    t_bool has_pkey(t_tscalar pkey) const;

    template <typename FN_T>
    typename FN_T::result_type reduce(
        const t_tscalvec& pkeys, const t_str& colname, FN_T fn) const;

    const t_schema& get_schema() const;

    t_uindex size() const;
    t_uindex mapping_size() const;

    t_tscalvec get_row_data_pkeys(const t_tscalvec& pkeys) const;
    t_tscalvec has_pkeys(const t_tscalvec& pkeys) const;
    t_tscalvec get_pkeys() const;

    void reset();

    const t_schema& get_port_schema() const;
    t_uidxvec get_pkeys_idx(const t_tscalvec& pkeys) const;

protected:
    t_dtype get_pkey_dtype() const;

private:
    t_schema m_tblschema;
    t_schema m_pkeyed_schema;
    t_bool m_init;
    t_table_sptr m_table;
    t_mapping m_mapping;
    t_free_items m_free;
    t_symtable m_symtable;
    t_col_sptr m_pkcol;
    t_col_sptr m_opcol;
};

template <typename FN_T>
typename FN_T::result_type
t_gstate::reduce(const t_tscalvec& pkeys, const t_str& colname, FN_T fn) const {
    t_tscalvec data;
    read_column(colname, pkeys, data);
    return fn(data);
}

typedef std::shared_ptr<t_gstate> t_gstate_sptr;
typedef std::shared_ptr<const t_gstate> t_gstate_csptr;

} // end namespace perspective
