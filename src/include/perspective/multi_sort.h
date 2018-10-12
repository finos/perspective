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
#include <perspective/scalar.h>
#include <perspective/exports.h>
#include <perspective/comparators.h>
#include <vector>
#include <boost/math/special_functions/fpclassify.hpp>

namespace perspective {

struct PERSPECTIVE_EXPORT t_mselem {
    t_mselem();
    t_mselem(const t_tscalvec& row);
    t_mselem(const t_tscalvec& row, t_uindex order);
    t_mselem(const t_tscalar& pkey, const t_tscalvec& row);
    t_mselem(const t_mselem& other);
    t_mselem(t_mselem&& other);
    t_mselem& operator=(const t_mselem& other);
    t_mselem& operator=(t_mselem&& other);

    t_tscalvec m_row;
    t_tscalar m_pkey;
    t_uindex m_order;
    bool m_deleted;
};

} // end namespace perspective

namespace std {

inline std::ostream&
operator<<(std::ostream& os, const perspective::t_mselem& t) {
    os << "mse<pkey => " << t.m_pkey << " row => " << t.m_row << " deleted => " << t.m_deleted
       << " order => " << t.m_order << ">";
    return os;
}

} // end namespace std

namespace perspective {

inline void
swap(t_mselem& a, t_mselem& b) {
    t_mselem c(std::move(a));
    a = std::move(b);
    b = std::move(c);
}

struct PERSPECTIVE_EXPORT t_minmax_idx {
    t_minmax_idx(t_index mn, t_index mx);

    t_index m_min;
    t_index m_max;
};

// Given a vector return the indices of the
// minimum and maximum elements in it.
PERSPECTIVE_EXPORT t_minmax_idx get_minmax_idx(const t_tscalvec& vec, t_sorttype stype);

typedef std::vector<t_mselem> t_mselemvec;
typedef std::shared_ptr<t_mselemvec> t_mselemvec_sptr;
typedef std::shared_ptr<const t_mselemvec> t_mselemvec_csptr;

PERSPECTIVE_EXPORT t_float64 to_double(const t_tscalar& c);

struct PERSPECTIVE_EXPORT t_nancmp {
    t_nancmp();

    bool m_active;
    t_cmp_op m_cmpval;
};

PERSPECTIVE_EXPORT t_nancmp nan_compare(
    t_sorttype order, const t_tscalar& a, const t_tscalar& b);

inline PERSPECTIVE_EXPORT t_bool
cmp_mselem(
    const t_mselem& a, const t_mselem& b, const t_sorttvec& sort_order, t_bool handle_nans) {
    typedef std::pair<t_float64, t_tscalar> dpair;

    if (a.m_row.size() != b.m_row.size() || a.m_row.size() != sort_order.size()) {
        std::cout << "ERROR detected in MultiSort." << std::endl;
        return false;
    }

    t_tscalar first_pkey = a.m_pkey;
    t_tscalar second_pkey = b.m_pkey;

    for (int idx = 0, loop_end = sort_order.size(); idx < loop_end; ++idx) {
        const t_tscalar& first = a.m_row[idx];
        const t_tscalar& second = b.m_row[idx];

        t_sorttype order = sort_order[idx];
        t_nancmp nancmp = nan_compare(order, first, second);

        if (handle_nans && first.is_floating_point() && nancmp.m_active) {
            switch (nancmp.m_cmpval) {
                case CMP_OP_LT: {
                    return true;
                } break;
                case CMP_OP_GT: {
                    return false;
                } break;
                case CMP_OP_EQ:
                default: { continue; } break;
            }
        }

        if (first == second)
            continue;

        switch (order) {
            case SORTTYPE_ASCENDING: {
                return (first < second);
            } break;
            case SORTTYPE_DESCENDING: {
                return (first > second);
            } break;
            case SORTTYPE_ASCENDING_ABS: {
                t_float64 val_a = first.to_double();
                t_float64 val_b = second.to_double();
                return dpair(std::abs(val_a), first_pkey) < dpair(std::abs(val_b), second_pkey);
            } break;
            case SORTTYPE_DESCENDING_ABS: {
                t_float64 val_a = first.to_double();
                t_float64 val_b = second.to_double();
                return dpair(std::abs(val_a), first_pkey) > dpair(std::abs(val_b), second_pkey);
            } break;
            case SORTTYPE_NONE: {
                return first_pkey < second_pkey;
            }
        }
    }

    if (a.m_order != b.m_order) {
        return a.m_order < b.m_order;
    }

    return first_pkey < second_pkey;
}

inline PERSPECTIVE_EXPORT t_bool
cmp_mselem(
    const t_mselem* a, const t_mselem* b, const t_sorttvec& sort_order, t_bool handle_nans) {
    return cmp_mselem(*a, *b, sort_order, handle_nans);
}

// Helper for sorting taking multiple sort specifications
// into account
struct PERSPECTIVE_EXPORT t_multisorter {
    t_multisorter(const t_sorttvec& order, t_bool handle_nans);

    t_multisorter(t_mselemvec_csptr elems, const t_sorttvec& order, t_bool handle_nans);

    bool operator()(const t_mselem& a, const t_mselem& b) const;

    bool operator()(t_index a, t_index b) const;

    t_sorttvec m_sort_order;
    t_mselemvec_csptr m_elems;
    t_bool m_handle_nans;
};

} // end namespace perspective
