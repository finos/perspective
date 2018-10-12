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
#include <perspective/raw_types.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <map>
namespace perspective {

struct PERSPECTIVE_EXPORT t_schema_recipe {
    t_schema_recipe();
    t_svec m_columns;
    t_dtypevec m_types;
};

typedef std::vector<t_schema_recipe> t_schema_recipevec;

struct PERSPECTIVE_EXPORT t_schema {
    typedef std::map<t_str, t_dtype> t_sdtmap;
    typedef std::map<t_str, t_uindex> t_suidxmap;

    t_schema();
    t_schema(const t_schema_recipe& recipe);
    t_schema(const t_svec& columns, const t_dtypevec& types);
    t_uindex get_num_columns() const;
    t_uindex size() const;

    t_uindex get_colidx(const t_str& colname) const;
    t_dtype get_dtype(const t_str& colname) const;

    t_bool is_pkey() const;

    t_bool operator==(const t_schema& rhs) const;

    void add_column(const t_str& colname, t_dtype dtype);
    t_schema_recipe get_recipe() const;
    t_bool has_column(const t_str& cname) const;
    const t_svec& columns() const;
    const t_dtypevec types() const;
    t_table_static_ctx get_table_context() const;
    t_str str() const;

    t_svec m_columns;
    t_dtypevec m_types;
    t_suidxmap m_colidx_map;
    t_sdtmap m_coldt_map;
    t_boolvec m_status_enabled;
    t_bool m_is_pkey;
    t_uindex m_pkeyidx;
    t_uindex m_opidx;
};

typedef std::vector<t_schema> t_schemavec;

} // end namespace perspective

namespace std {

PERSPECTIVE_EXPORT std::ostream& operator<<(std::ostream& os, const perspective::t_schema& s);
}
