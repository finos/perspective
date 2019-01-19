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
    std::vector<std::string> m_columns;
    std::vector<t_dtype> m_types;
};

struct PERSPECTIVE_EXPORT t_schema {
    typedef std::map<std::string, t_dtype> t_sdtmap;
    typedef std::map<std::string, t_uindex> t_suidxmap;

    t_schema();
    t_schema(const t_schema_recipe& recipe);
    t_schema(const std::vector<std::string>& columns, const std::vector<t_dtype>& types);
    t_uindex get_num_columns() const;
    t_uindex size() const;

    t_uindex get_colidx(const std::string& colname) const;
    t_dtype get_dtype(const std::string& colname) const;

    bool is_pkey() const;

    bool operator==(const t_schema& rhs) const;

    void add_column(const std::string& colname, t_dtype dtype);
    void retype_column(const std::string& colname, t_dtype dtype);
    t_schema_recipe get_recipe() const;
    bool has_column(const std::string& cname) const;
    const std::vector<std::string>& columns() const;
    const std::vector<t_dtype> types() const;
    t_table_static_ctx get_table_context() const;
    std::string str() const;
    t_schema drop(const std::set<std::string>& columns) const;
    t_schema operator+(const t_schema& o) const;
    std::vector<std::string> m_columns;
    std::vector<t_dtype> m_types;
    t_suidxmap m_colidx_map;
    t_sdtmap m_coldt_map;
    std::vector<bool> m_status_enabled;
    bool m_is_pkey;
    t_uindex m_pkeyidx;
    t_uindex m_opidx;
};

} // end namespace perspective

namespace std {

PERSPECTIVE_EXPORT std::ostream& operator<<(std::ostream& os, const perspective::t_schema& s);
}
