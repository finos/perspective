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
#include <perspective/utils.h>
#include <perspective/exports.h>
#include <boost/functional/hash.hpp>
#include <sstream>
#include <string>
#include <algorithm>

namespace perspective {
static const t_int32 CUMULATIVE_DAYS[2][13] = {
    {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365} /* Normal years.  */,
    {0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366} /* Leap
                                                                    years.
                                                                    */
};

// In terms of (non-tm based) inputs/outputs, t_time
// represents an instant in time as:
// A year() since year 0AD.
// A month() in the range [1..12].
// A day() of the month in the range [1..31].
class PERSPECTIVE_EXPORT t_date {
public:
    static const t_int32 YEAR_MASK = 0xFFFF0000;
    static const t_int32 MONTH_MASK = 0x0000FF00;
    static const t_int32 DAY_MASK = 0x000000FF;

    static const t_int32 YEAR_SHIFT = 16;
    static const t_int32 MONTH_SHIFT = 8;
    static const t_int32 DAY_SHIFT = 0;

public:
    typedef t_uint32 t_rawtype;

    t_date();

    t_date(t_int16 year, t_int8 month, t_int8 day);

    void set_year_month_day(t_int16 year, t_int8 month, t_int8 day);

    void set_year(t_int16 year);
    void set_month(t_int8 month);
    void set_day(t_int8 day);

    explicit t_date(t_uint32 raw_val);

    t_uint32 raw_value() const;

    // Index such that
    // a.consecutive_day_idx()-b.consecutive_day_idx() is
    // number of days a is after b.
    //(Start point is unspecified, may not be stable and
    // only works for dates after 1900AD.)
    t_int32 consecutive_day_idx() const;

    friend bool operator<(const t_date& a, const t_date& b);
    friend bool operator<=(const t_date& a, const t_date& b);
    friend bool operator>(const t_date& a, const t_date& b);
    friend bool operator>=(const t_date& a, const t_date& b);
    friend bool operator==(const t_date& a, const t_date& b);
    friend bool operator!=(const t_date& a, const t_date& b);
    t_int32 year() const;
    t_int32 month() const;
    t_int32 day() const;

    t_str str() const;
    friend inline size_t hash_value(const t_date& d);

    void set_psp_date(t_uindex dt);

private:
    t_rawtype m_storage;
};

t_date from_consecutive_day_idx(t_int32 idx);

inline size_t
hash_value(const t_date& d) {
    boost::hash<t_uint32> hasher;
    return hasher(d.m_storage);
}
} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_date& t);
}
