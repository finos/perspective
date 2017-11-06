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
#include <perspective/table.h>
#include <perspective/exports.h>
#include <perspective/column.h>
#include <perspective/column_chunk.h>
#include <perspective/filter.h>
#include <map>

namespace perspective
{

class PERSPECTIVE_EXPORT t_table_iter_value
{
  public:
    typedef std::map<t_str, t_uindex> t_map;

    t_table_iter_value();
    ~t_table_iter_value();

    t_table_iter_value(const t_map* colmap,
                       t_colchunksptrvec& chunks,
                       const t_schema* schema);

    t_column_chunk* get(const t_str& c);
    const t_schema* get_schema() const;

  private:
    // doesnt own map
    const t_map* m_map;

    t_colchunksptrvec m_chunks;

    // doesnt own schema
    const t_schema* m_schema;
};

class PERSPECTIVE_EXPORT t_table_iter_seq
{
    typedef std::map<t_str, t_uindex> t_map;

  public:
    t_table_iter_seq(t_table* table, t_filter* filter);
    ~t_table_iter_seq();
    bool has_next() const;

    // ownership belongs to caller
    t_table_iter_value* next();

    t_svec columns() const;

  private:
    t_table* m_table;
    t_schema m_schema;
    t_filter* m_filter;
    t_uindex m_bidx;
    t_uindex m_eidx;
    t_uindex m_tblsize;
    t_uindex m_len;
    t_uindex m_counter;
    t_colchunksptrvec m_chunks;
    t_colsptrvec m_columns;
    t_map m_map;
    PSP_NON_COPYABLE(t_table_iter_seq);
};

class PERSPECTIVE_EXPORT t_table_iter_masked
{
    typedef std::map<t_str, t_uindex> t_map;

  public:
    t_table_iter_masked(t_table* table, t_filter* filter);
    ~t_table_iter_masked();
    bool has_next() const;

    // ownership belongs to caller
    t_table_iter_value* next();
    t_svec columns() const;

  private:
    t_table* m_table;
    t_schema m_schema;
    t_filter* m_filter;
    t_uindex m_tblsize;
    t_uindex m_len;
    t_uindex m_counter; // niterations
    t_uindex m_elem_counter;
    t_colchunksptrvec m_chunks;
    t_colsptrvec m_columns;
    t_map m_map;
    t_mask_iterator m_mask_iterator;
    t_uidxvec m_indices;
    PSP_NON_COPYABLE(t_table_iter_masked);
};

} // end namespace perspective
