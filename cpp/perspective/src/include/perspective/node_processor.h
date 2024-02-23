// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

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
#include <csignal>
#include <cmath>
#include <map>

namespace perspective {

template <int DTYPE_T>
struct t_pivot_processor {
    typedef t_chunk_value_span<t_tscalar> t_spans;
    typedef std::vector<t_spans> t_spanvec;
    typedef std::vector<t_spanvec> t_spanvvec;
    typedef std::map<t_tscalar, t_uindex, t_comparator<t_tscalar, DTYPE_T>>
        t_map;

    // For now we dont do any inter node
    // parallelism. this should be trivial
    // to fix in the future.
    t_uindex operator()(
        const t_column* data,
        std::vector<t_dense_tnode>* nodes,
        t_column* values,
        t_column* leaves,
        t_uindex nbidx,
        t_uindex neidx,
        const t_mask* mask
    );
};

template <int DTYPE_T>
t_uindex
t_pivot_processor<DTYPE_T>::operator()(
    const t_column* data,
    std::vector<t_dense_tnode>* nodes,
    t_column* values,

    t_column* leaves,
    t_uindex nbidx,
    t_uindex neidx,
    const t_mask* mask
) {

    t_lstore lcopy(leaves->data_lstore(), t_lstore_tmp_init_tag());

    // add accessor api and move these to that
    t_uindex* leaves_ptr = leaves->get_nth<t_uindex>(0);
    t_uindex* lcopy_ptr = lcopy.get_nth<t_uindex>(0);
    t_uindex lvl_nidx = neidx;
    t_uindex offset = 0;

    for (t_uindex nidx = nbidx; nidx < neidx; ++nidx) {
        t_dense_tnode* pnode = &nodes->at(nidx);
        t_uindex cbidx = pnode->m_flidx;
        t_uindex ceidx = pnode->m_flidx + pnode->m_nleaves;
        t_uindex parent_idx = pnode->m_idx;
        t_spanvvec spanvec;
        {
            t_spanvec spans;
            partition(data, leaves, cbidx, ceidx, spans);
            spanvec.push_back(spans);
        }

        // map value to number of rows with value
        t_map globcount((t_comparator<t_tscalar, DTYPE_T>()));

        for (t_index idx = 0, loop_end = spanvec.size(); idx < loop_end;
             ++idx) {
            const t_spanvec& sp = spanvec[idx];
            for (t_uindex spidx = 0, sp_loop_end = sp.size();
                 spidx < sp_loop_end;
                 ++spidx) {
                const t_spans& vsp = sp[spidx];
                auto miter = globcount.find(vsp.m_value);
                if (miter == globcount.end()) {
                    globcount[vsp.m_value] = vsp.m_eidx - vsp.m_bidx;
                } else {
                    miter->second = miter->second + vsp.m_eidx - vsp.m_bidx;
                }
            }
        }

        // map value to leaf offset
        t_map globcursor((t_comparator<t_tscalar, DTYPE_T>()));

        for (typename t_map::const_iterator miter = globcount.begin(),
                                            loop_end = globcount.end();
             miter != loop_end;
             ++miter) {
            globcursor[miter->first] = offset;
            offset += miter->second;
        }

        auto running_cursor = globcursor;
        for (t_index idx = 0, loop_end = spanvec.size(); idx < loop_end;
             ++idx) {
            const t_spanvec& sp = spanvec[idx];
            for (t_index spidx = 0, sp_loop_end = sp.size();
                 spidx < sp_loop_end;
                 ++spidx) {
                const auto& cvs = sp[spidx];
                t_uindex voff = running_cursor[cvs.m_value];
                memcpy(
                    lcopy_ptr + voff,
                    leaves_ptr + cvs.m_bidx,
                    sizeof(t_uindex) * (cvs.m_eidx - cvs.m_bidx)
                );

                running_cursor[cvs.m_value] = voff + cvs.m_eidx - cvs.m_bidx;
            }
        }

        // Update current node
        pnode->m_fcidx = lvl_nidx;
        pnode->m_nchild = globcount.size();

        for (typename t_map::const_iterator miter = globcursor.begin(),
                                            loop_end = globcursor.end();
             miter != loop_end;
             ++miter) {
            nodes->push_back(
                {lvl_nidx,
                 parent_idx,
                 0,
                 0,
                 miter->second,
                 globcount[miter->first]}
            );
            lvl_nidx += 1;
            values->push_back<t_tscalar>(miter->first);
        }
    }

    t_lstore* llstore = leaves->_get_data_lstore();

    memcpy(leaves_ptr, lcopy_ptr, llstore->size());

    return lvl_nidx;
}

} // end namespace perspective
