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
#include <vector>
#include <perspective/exports.h>
#include <perspective/scalar.h>

namespace perspective {

enum t_sortspec_type { SORTSPEC_TYPE_IDX, SORTSPEC_TYPE_COLNAME, SORTSPEC_TYPE_PATH };

struct PERSPECTIVE_EXPORT t_sortspec {
    t_sortspec();
    t_sortspec(t_index agg_index, t_sorttype sort_type);
    t_sortspec(const t_tscalvec& path, t_index agg_index, t_sorttype sort_type);

    bool operator==(const t_sortspec& s2) const;
    bool operator!=(const t_sortspec& s2) const;

    t_index m_agg_index;
    t_sorttype m_sort_type;
    t_bool m_colname;
    t_sortspec_type m_sortspec_type;
    t_tscalvec m_path;
};

typedef std::vector<t_sortspec> t_sortsvec;

PERSPECTIVE_EXPORT t_sorttvec get_sort_orders(const t_sortsvec& vec);

} // end namespace perspective

namespace std {
PERSPECTIVE_EXPORT std::ostream& operator<<(std::ostream& os, const perspective::t_sortspec& t);
} // end namespace std