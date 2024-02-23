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
#include <perspective/scalar.h>

namespace perspective {
struct PERSPECTIVE_EXPORT t_stnode {
    t_stnode(
        t_uindex idx,
        t_uindex pidx,
        const t_tscalar& value,
        std::uint8_t depth,
        const t_tscalar& sort_value,
        t_uindex nstrands,
        t_uindex aggidx
    );

    t_stnode();

    void set_nstrands(t_index nstrands);
    void set_sort_value(t_tscalar sv);

    t_uindex m_idx;
    t_uindex m_pidx;
    std::uint8_t m_depth;
    t_tscalar m_value;
    t_tscalar m_sort_value;
    t_uindex m_nstrands;
    t_uindex m_aggidx;
};

typedef std::vector<t_stnode> t_stnode_vec;

struct PERSPECTIVE_EXPORT t_stpkey {
    t_stpkey(t_uindex idx, t_tscalar pkey);
    t_stpkey();

    t_uindex m_idx;
    t_tscalar m_pkey;
};

struct PERSPECTIVE_EXPORT t_stleaves {
    t_stleaves(t_uindex idx, t_uindex lfidx);
    t_stleaves();

    t_uindex m_idx;
    t_uindex m_lfidx;
};

// Used in t_ctx2 for mapping back into
// the forest of trees
struct t_cellinfo {
    t_cellinfo();
    t_cellinfo(
        t_index idx,
        t_depth treenum,
        t_index agg_index,
        t_uindex ridx,
        t_uindex cidx
    );

    t_index m_idx;
    t_depth m_treenum;
    t_index m_agg_index;
    t_uindex m_ridx;
    t_uindex m_cidx;
};

} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_stnode& node);

std::ostream& operator<<(std::ostream& os, const perspective::t_cellinfo& node);
} // namespace std
