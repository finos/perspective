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
#include <perspective/exports.h>
#include <boost/dynamic_bitset.hpp>
#include <boost/shared_ptr.hpp>
#include <perspective/simple_bitmask.h>

namespace perspective {

class t_mask_iterator;

class PERSPECTIVE_EXPORT t_mask {
    typedef boost::dynamic_bitset<>::size_type t_msize;

public:
    t_mask();
    t_mask(t_uindex size);

    t_mask(const t_simple_bitmask& m);

    ~t_mask();

    void clear();
    t_uindex count() const;
    bool get(t_uindex idx) const;
    void set(t_uindex idx, bool v);
    void set(t_uindex idx);

    t_mask& operator&=(const t_mask& b);
    t_mask& operator|=(const t_mask& b);
    t_mask& operator^=(const t_mask& b);
    t_mask& operator-=(const t_mask& b);

    t_uindex find_first() const;
    t_uindex find_next(t_uindex pos) const;
    static const t_uindex m_npos = boost::dynamic_bitset<>::npos;
    ;
    t_uindex size() const;
    void pprint() const;

private:
    boost::dynamic_bitset<> m_bitmap;
};

typedef std::shared_ptr<t_mask> t_masksptr;
typedef std::shared_ptr<const t_mask> t_maskcsptr;

class PERSPECTIVE_EXPORT t_mask_iterator {
public:
    t_mask_iterator();
    t_mask_iterator(t_maskcsptr m);
    ~t_mask_iterator();
    bool has_next() const;
    t_uindex next();
    t_uindex size() const;
    t_uindex count() const;

    static const t_uindex m_end = t_mask::m_npos;

private:
    t_maskcsptr m_mask;
    t_uindex m_pos;
};

} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_mask& mask);
}
