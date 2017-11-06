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
#include <perspective/storage.h>
#include <perspective/column.h>
#include <perspective/comparators.h>
#include <perspective/dense_nodes.h>
#include <perspective/node_processor_types.h>
#include <perspective/partition.h>
#include <perspective/mask.h>
#ifdef PSP_PARALLEL_FOR
#include <tbb/tbb.h>
#include <tbb/parallel_for.h>
#include <tbb/blocked_range.h>
#include <tbb/atomic.h>
#include <tbb/concurrent_vector.h>
#include <tbb/mutex.h>
#endif
#include <csignal>
#include <cmath>
#include <map>

namespace perspective
{

template <typename DATA_T, int DTYPE_T>
struct t_chunk_processor_sstate
{
    t_chunk_processor_sstate()
    {
    }

    typedef t_chunk_value_span<DATA_T> t_spans;
    typedef std::vector<t_spans> t_spanvec;
    typedef std::vector<t_spanvec> t_spanvvec;

    t_spanvvec m_spanvec;
#ifdef PSP_PARALLEL_FOR
    tbb::mutex m_spanvec_mutex;
    tbb::mutex m_tbbmut;
#endif
    PSP_NON_COPYABLE(t_chunk_processor_sstate);
};

template <typename DATA_T, int DTYPE_T>
struct t_chunk_processor
{
    typedef t_chunk_processor_sstate<DATA_T, DTYPE_T> t_sstate;
    typedef typename t_sstate::t_spans t_spans;
    typedef typename t_sstate::t_spanvec t_spanvec;
    typedef typename t_sstate::t_spanvvec t_spanvvec;

    t_chunk_processor(const t_column* data,
                      t_column* nodes,
                      t_column* values,
                      t_column* leaves,
                      t_sstate* state);
#ifdef PSP_PARALLEL_FOR
    void operator()(const tbb::blocked_range<t_uindex>& rng) const;
#endif
    const t_column* m_data;
    t_column* m_nodes;
    t_column* m_values;
    mutable t_column* m_leaves;
    mutable t_sstate* m_sstate;
};

template <typename DATA_T, int DTYPE_T>
t_chunk_processor<DATA_T, DTYPE_T>::t_chunk_processor(
    const t_column* PSP_RESTRICT data,
    t_column* PSP_RESTRICT nodes,
    t_column* PSP_RESTRICT values,
    t_column* PSP_RESTRICT leaves,
    t_sstate* PSP_RESTRICT sstate)
    : m_data(data), m_nodes(nodes), m_values(values),
      m_leaves(leaves), m_sstate(sstate)
{
}
#ifdef PSP_PARALLEL_FOR
template <typename DATA_T, int DTYPE_T>
void
t_chunk_processor<DATA_T, DTYPE_T>::
operator()(const tbb::blocked_range<t_uindex>& rng) const
{
    t_uindex bidx = rng.begin();
    t_uindex eidx = rng.end();

    t_spanvec spans;
    partition<DATA_T, DTYPE_T, DEFAULT_CHUNK_SIZE>(
        m_data, m_leaves, bidx, eidx, spans, m_sstate->m_tbbmut);
    tbb::mutex::scoped_lock slock(m_sstate->m_spanvec_mutex);
    m_sstate->m_spanvec.push_back(spans);
}
#endif

template <typename DATA_T, int DTYPE_T>
struct t_pivot_processor
{
    typedef std::map<DATA_T, t_uindex, t_comparator<DATA_T, DTYPE_T>>
        t_map;
    typedef t_chunk_processor<DATA_T, DTYPE_T> t_cp;
    typedef typename t_cp::t_spanvec t_spanvec;
#ifdef PSP_PARALLEL_FOR
    typedef tbb::blocked_range<t_uindex> t_range;
#endif
    typedef typename t_cp::t_spans t_spans;
    typedef typename t_cp::t_sstate t_sstate;

    t_pivot_processor();

    // For now we dont do any inter node
    // parallelism. this should be trivial
    // to fix in the future.
    t_uindex operator()(const t_column* data,
                        t_column* nodes,
                        t_column* values,
                        t_column* leaves,
                        t_uindex nbidx,
                        t_uindex neidx,
                        const t_mask* mask);
};

template <typename DATA_T, int DTYPE_T>
t_pivot_processor<DATA_T, DTYPE_T>::t_pivot_processor()
{
}

template <typename DATA_T, int DTYPE_T>
t_uindex
t_pivot_processor<DATA_T, DTYPE_T>::operator()(const t_column* data,
                                               t_column* nodes,
                                               t_column* values,
                                               t_column* leaves,
                                               t_uindex nbidx,
                                               t_uindex neidx,
                                               const t_mask* mask)
{
    typedef std::map<DATA_T, t_uindex, t_comparator<DATA_T, DTYPE_T>>
        t_map;
    t_lstore lcopy(leaves->data_lstore(), t_lstore_tmp_init_tag());

    // add accessor api and move these to that
    t_uindex* leaves_ptr = leaves->get_nth<t_uindex>(0);
    t_uindex* lcopy_ptr = lcopy.get_nth<t_uindex>(0);

    t_uindex lvl_nidx = neidx;

    t_uindex offset = 0;

    for (t_uindex nidx = nbidx; nidx < neidx; ++nidx)
    {
        t_dense_tnode* pnode = nodes->get_nth<t_dense_tnode>(nidx);

        t_uindex cbidx = pnode->m_flidx;
        t_uindex ceidx = pnode->m_flidx + pnode->m_nleaves;
        t_uindex parent_idx = pnode->m_idx;

        t_sstate sstate;

#ifdef PSP_PARALLEL_FOR
        t_cp cproc(data, nodes, values, leaves, &sstate);
        tbb::parallel_for(t_range(cbidx, ceidx, DEFAULT_CHUNK_SIZE),
                          cproc,
                          tbb::simple_partitioner());
#else
        {
            t_spanvec spans;
#ifdef PSP_ENABLE_WASM
            partition<DATA_T, DTYPE_T, DEFAULT_CHUNK_SIZE>(
                data, leaves, cbidx, ceidx, spans);
#else
            partition<DATA_T, DTYPE_T, DEFAULT_CHUNK_SIZE>(
                data, leaves, cbidx, ceidx, spans, sstate.m_tbbmut);
            tbb::mutex::scoped_lock slock(sstate.m_spanvec_mutex);
#endif
            sstate.m_spanvec.push_back(spans);
        }
#endif

        // map value to number of rows with value
        t_map globcount((t_comparator<DATA_T, DTYPE_T>(data)));

        for (t_index idx = 0, loop_end = sstate.m_spanvec.size();
             idx < loop_end;
             ++idx)
        {
            const t_spanvec& sp = sstate.m_spanvec[idx];
            for (t_uindex spidx = 0, sp_loop_end = sp.size();
                 spidx < sp_loop_end;
                 ++spidx)
            {
                const t_spans& vsp = sp[spidx];
                typename t_map::iterator miter =
                    globcount.find(vsp.m_value);

                if (miter == globcount.end())
                {
                    globcount[vsp.m_value] = vsp.m_eidx - vsp.m_bidx;
                }
                else
                {
                    miter->second =
                        miter->second + vsp.m_eidx - vsp.m_bidx;
                }
            }
        }

        // map value to leaf offset
        t_map globcursor((t_comparator<DATA_T, DTYPE_T>(data)));

        for (typename t_map::const_iterator
                 miter = globcount.begin(),
                 loop_end = globcount.end();
             miter != loop_end;
             ++miter)
        {
            globcursor[miter->first] = offset;
            offset += miter->second;
        }

        auto running_cursor = globcursor;

        for (t_index idx = 0, loop_end = sstate.m_spanvec.size();
             idx < loop_end;
             ++idx)
        {
            const t_spanvec& sp = sstate.m_spanvec[idx];
            for (t_index spidx = 0, sp_loop_end = sp.size();
                 spidx < sp_loop_end;
                 ++spidx)
            {
                const t_chunk_value_span<DATA_T>& cvs = sp[spidx];
                t_uindex voff = running_cursor[cvs.m_value];

                memcpy(lcopy_ptr + voff,
                       leaves_ptr + cvs.m_bidx,
                       sizeof(t_uindex) * (cvs.m_eidx - cvs.m_bidx));

                running_cursor[cvs.m_value] =
                    voff + cvs.m_eidx - cvs.m_bidx;
            }
        }

        // Update current node
        pnode->m_fcidx = lvl_nidx;
        pnode->m_nchild = globcount.size();

        t_dense_tnode* cn =
            nodes->extend<t_dense_tnode>(globcount.size());

        for (typename t_map::const_iterator
                 miter = globcursor.begin(),
                 loop_end = globcursor.end();
             miter != loop_end;
             ++miter)
        {
            fill_dense_tnode(cn,
                             lvl_nidx,
                             parent_idx,
                             0,
                             0,
                             miter->second,
                             globcount[miter->first]);
            lvl_nidx += 1;
            cn = cn + 1;
            values->push_back<DATA_T>(miter->first);
        }
    }

    t_lstore* llstore = leaves->_get_data_lstore();

    memcpy(leaves_ptr, lcopy_ptr, llstore->size());

    return lvl_nidx;
}

} // end namespace perspective
