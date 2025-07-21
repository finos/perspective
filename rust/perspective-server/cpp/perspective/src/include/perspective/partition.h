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
#include <perspective/column.h>
#include <perspective/node_processor_types.h>
#include <vector>
#include <algorithm>

/*
TODO improvements

1. Remove allocations in partition using one of the
following
approaches

    a. Direct mapping tid offset into global buffer
    b. TLS
    c. ...?
*/

namespace perspective {

template <typename DATA_T>
struct t_argsort_cmp {
    t_argsort_cmp(const DATA_T* base) : m_base(base) {}

    inline bool
    operator()(t_uindex a, t_uindex b) {
        return (*(m_base + a)) < (*(m_base + b));
    }

    const DATA_T* m_base;
};

template <typename DATA_T>
inline void
argsort(const DATA_T* b, std::vector<t_uindex>& output) {
    // Output should be the same size is erange-brange
    for (t_index i = 0, loop_end = output.size(); i != loop_end; ++i) {
        output[i] = i;
    }
    t_argsort_cmp<DATA_T> cmp(const_cast<DATA_T*>(b));
    std::sort(output.begin(), output.end(), cmp);
}

inline void
partition(
    const t_column* PSP_RESTRICT data_,
    t_column* PSP_RESTRICT leaves_,
    t_uindex bidx,
    t_uindex eidx,
    std::vector<t_chunk_value_span<t_tscalar>>& out_spans
) {
    t_uindex* leaves = leaves_->get_nth<t_uindex>(0);
    typedef t_chunk_value_span<t_tscalar> t_cvs;
    t_uindex nelems = eidx - bidx;
    switch (nelems) {
        case 0:
            break;
        case 1: {
            out_spans.push_back(t_cvs());
            t_cvs& c = out_spans[0];
            fill_chunk_value_span<t_tscalar>(
                c, data_->get_scalar(leaves[bidx]), bidx, eidx
            );
        } break;
        default: {
            std::vector<t_tscalar> buf(nelems);
            for (t_uindex idx = 0; idx < nelems; ++idx) {
                buf[idx] = data_->get_scalar(leaves[bidx + idx]);
            }

            std::vector<t_uindex> order(nelems);

            t_tscalar* buf_addr = &buf[0];
            argsort(buf_addr, order);
            std::vector<t_uindex> temp_leaves(nelems);
            for (t_uindex j = 0; j < nelems; ++j) {
                temp_leaves[j] = leaves[bidx + order[j]];
            }

            std::vector<t_tscalar> sdata(nelems);
            std::vector<t_uindex> edges;
            auto old_value = buf[order[0]];

            sdata[0] = old_value;
            for (t_uindex i = 0; i < nelems; ++i) {
                auto new_value = buf[order[i]];
                if (old_value != new_value) {
                    sdata[i] = new_value;
                    edges.push_back(i);
                }
                old_value = new_value;
            }

            if (edges.empty()) {
                out_spans.push_back(t_cvs());
                t_cvs& c = out_spans.back();
                fill_chunk_value_span<t_tscalar>(c, sdata[0], bidx, eidx);
            } else {
                t_tscalar value;
                std::vector<t_uindex> boundaries;
                boundaries.push_back(0);
                boundaries.insert(boundaries.end(), edges.begin(), edges.end());
                boundaries.push_back(order.size());

                for (t_uindex i = 0, loop_end = boundaries.size() - 1;
                     i < loop_end;
                     ++i) {
                    t_uindex begin = boundaries[i];
                    t_uindex end = boundaries[i + 1];
                    value = sdata[begin];
                    t_uindex num_new_bytes = sizeof(t_uindex) * (end - begin);
                    memcpy(
                        leaves + begin + bidx,
                        &temp_leaves[begin],
                        num_new_bytes
                    );
                    out_spans.push_back(t_cvs());
                    t_cvs& cvs = out_spans.back();
                    fill_chunk_value_span<t_tscalar>(
                        cvs, value, bidx + begin, bidx + end
                    );
                }
            }
        }

        break;
    }
}

} // end namespace perspective
