/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/table_iterator.h>
#include <cmath>
#include <perspective/portable.h>

SUPPRESS_WARNINGS_VC(4505)

namespace perspective

{

t_svec
map_keys(const std::map<t_str, t_uindex>& map)
{
    t_uindex idx = 0;
    t_svec rval(map.size());

    for (std::map<t_str, t_uindex>::const_iterator iter = map.begin();
         iter != map.end();
         ++iter)
    {
        rval[idx] = iter->first;
        ++idx;
    }
    return rval;
}

t_table_iter_value::t_table_iter_value() : m_map(0)
{
    LOG_CONSTRUCTOR("t_table_iter_value");
}

t_table_iter_value::t_table_iter_value(const t_map* map,
                                       t_colchunksptrvec& chunks,
                                       const t_schema* schema)
    : m_map(map), m_chunks(chunks), m_schema(schema)
{
    LOG_CONSTRUCTOR("t_table_iter_value");
}

t_table_iter_value::~t_table_iter_value()
{
    LOG_DESTRUCTOR("t_table_iter_value");
}

t_column_chunk*
t_table_iter_value::get(const t_str& c)
{
    PSP_VERBOSE_ASSERT(m_map, "Null map");

    t_map::const_iterator iter = m_map->find(c);

    PSP_VERBOSE_ASSERT(iter != m_map->end(),
                       "Looking up unknown column");

    PSP_VERBOSE_ASSERT(iter->second < m_chunks.size(),
                       "Reached beyond end of vector");

    t_column_chunk* rv = m_chunks[iter->second].get();

    PSP_VERBOSE_ASSERT(rv, "Null return value");
    return rv;
}

const t_schema*
t_table_iter_value::get_schema() const
{
    return m_schema;
}

t_table_iter_seq::t_table_iter_seq(t_table* table, t_filter* filter)
    : m_table(table), m_filter(filter), m_tblsize(table->size()),
      m_counter(0),
      m_chunks(t_colchunksptrvec(filter->columns().size())),
      m_columns(filter->columns().size())
{
    LOG_CONSTRUCTOR("t_table_iter_seq");
    switch (filter->mode())
    {
        case SELECT_MODE_ALL:
        {
            m_bidx = 0;
            m_eidx = m_tblsize;
        }
        break;
        case SELECT_MODE_RANGE:
        {
            m_bidx = filter->bidx();
            m_eidx = filter->eidx();
        }
        break;
        default:
        {
            PSP_COMPLAIN_AND_ABORT("Unexpected select mode");
        }
    }

    PSP_VERBOSE_ASSERT(m_bidx <= m_tblsize,
                       "Erroneous bidx passed in");

    PSP_VERBOSE_ASSERT(m_eidx <= m_tblsize,
                       "Erroneous eidx passed in");

    m_schema = m_table->get_schema();

    const t_svec& columns = filter->columns();

    m_len = static_cast<t_uindex>(ceil(
        t_float64(m_eidx - m_bidx) / t_float64(DEFAULT_CHUNK_SIZE)));

    for (t_uindex idx = 0, loop_end = m_columns.size();
         idx < loop_end;
         ++idx)
    {
        m_map[columns[idx]] = idx;
        m_columns[idx] = table->get_column(columns[idx]);
        m_chunks[idx] = std::make_shared<t_column_chunk>(
            m_columns[idx],
            COLUMN_CHUNK_DENSITY_DENSE,
            static_cast<t_uidxvec*>(0));
        m_chunks[idx]->init();
    }
}

t_table_iter_seq::~t_table_iter_seq()
{
    LOG_DESTRUCTOR("t_table_iter_seq");
}

bool
t_table_iter_seq::has_next() const
{
    return m_counter < m_len;
}

t_table_iter_value*
t_table_iter_seq::next()
{
    t_uindex bidx = m_bidx + m_counter * DEFAULT_CHUNK_SIZE;
    t_uindex eidx = std::min(bidx + DEFAULT_CHUNK_SIZE, m_eidx);

    for (t_uindex idx = 0, loop_end = m_columns.size();
         idx < loop_end;
         ++idx)
    {
        m_chunks[idx]->fill(bidx, eidx);
    }

    t_table_iter_value* rv =
        new t_table_iter_value(&m_map, m_chunks, &m_schema);

    ++m_counter;
    return rv;
}

t_svec
t_table_iter_seq::columns() const
{
    return map_keys(m_map);
}

t_table_iter_masked::t_table_iter_masked(t_table* table,
                                         t_filter* filter)
    : m_table(table), m_tblsize(table->size()), m_counter(0),
      m_chunks(t_colchunksptrvec(filter->columns().size())),
      m_columns(filter->columns().size()),
      m_indices(DEFAULT_CHUNK_SIZE)
{
    LOG_CONSTRUCTOR("t_table_iter_masked");

    PSP_VERBOSE_ASSERT(filter->mode() == SELECT_MODE_MASK,
                       "Unexpected select mode");

    PSP_VERBOSE_ASSERT(table->size() == filter->mask()->size(),
                       "Misaligned mask size");

    m_schema = m_table->get_schema();

    m_mask_iterator = t_mask_iterator(filter->cmask());

    t_uindex set_count = filter->mask()->count();

    m_len = static_cast<t_uindex>(
        ceil(t_float64(set_count) / t_float64(DEFAULT_CHUNK_SIZE)));

    const t_svec& columns = filter->columns();

    for (t_uindex idx = 0, loop_end = columns.size(); idx < loop_end;
         ++idx)
    {
        m_map[columns[idx]] = idx;
        m_columns[idx] = table->get_column(columns[idx]);
        m_chunks[idx] = std::make_shared<t_column_chunk>(
            m_columns[idx], COLUMN_CHUNK_DENSITY_SPARSE, &m_indices);
        m_chunks[idx]->init();
    }
}

t_table_iter_masked::~t_table_iter_masked()
{
    LOG_DESTRUCTOR("t_table_iter_masked");
}

bool
t_table_iter_masked::has_next() const
{
    return m_counter < m_len;
}

t_table_iter_value*
t_table_iter_masked::next()
{
    t_uindex bidx = m_counter * DEFAULT_CHUNK_SIZE;
    t_uindex eidx = std::min(bidx + DEFAULT_CHUNK_SIZE,
                             m_len * DEFAULT_CHUNK_SIZE);
    eidx = std::min(eidx, m_mask_iterator.count());

    t_uindex nelems = eidx - bidx;

    for (t_uindex idx = 0; idx < nelems; ++idx)
    {
        m_indices[idx] = m_mask_iterator.next();
    }

    for (t_uindex idx = 0, loop_end = m_columns.size();
         idx < loop_end;
         ++idx)
    {
        m_chunks[idx]->fill(m_indices, bidx, eidx);
    }

    t_table_iter_value* rv =
        new t_table_iter_value(&m_map, m_chunks, &m_schema);

    ++m_counter;
    return rv;
}

t_svec
t_table_iter_masked::columns() const
{
    return map_keys(m_map);
}

} // end namespace perspective
