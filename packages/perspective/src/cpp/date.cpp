/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/date.h>

namespace perspective {

t_date::t_date()
    : m_storage(0) {}

void
t_date::set_psp_date(t_uindex dt)

{
    m_storage = t_rawtype(dt);
}

t_date::t_date(t_int16 year, t_int8 month, t_int8 day) { set_year_month_day(year, month, day); }

void
t_date::set_year_month_day(t_int16 year, t_int8 month, t_int8 day) {
    set_year(year);
    set_month(month);
    set_day(day);
}

void
t_date::set_year(t_int16 year) {
    m_storage = (m_storage & ~YEAR_MASK) | (year << YEAR_SHIFT);
}
void
t_date::set_month(t_int8 month) {
    m_storage = (m_storage & ~MONTH_MASK) | (month << MONTH_SHIFT);
}
void
t_date::set_day(t_int8 day) {
    m_storage = (m_storage & ~DAY_MASK) | (day << DAY_SHIFT);
}

t_date::t_date(t_uint32 raw_val)
    : m_storage(raw_val) {}

t_uint32
t_date::raw_value() const {
    return m_storage;
}
// Index such that
// a.consecutive_day_idx()-b.consecutive_day_idx() is
// number of days a is after b.
//(Start point is unspecified, may not be stable and
// only works for dates after 1900AD.)
t_int32
t_date::consecutive_day_idx() const {
    t_int32 m = month();
    t_int32 y = year();
    t_int32 yP = y - 1;
    t_int32 leap_selector = (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 1 : 0;
    return day() + 365 * y + yP / 4 - yP / 100 + yP / 400
        + CUMULATIVE_DAYS[leap_selector][m - 1];
}

t_date
from_consecutive_day_idx(t_int32 idx) {
    t_int32 y = static_cast<t_int32>(idx / 365.2425);
    t_int32 yP = y - 1;
    t_int32 idx_year_removed = idx - (y * 365 + yP / 4 - yP / 100 + yP / 400);
    t_int32 tgt_substraction = (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 366 : 365;
    if (idx_year_removed > tgt_substraction) {
        idx_year_removed -= tgt_substraction;
        y += 1;
    }
    t_int32 yearkind = (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 1 : 0;
    const t_int32* const pos = std::lower_bound(CUMULATIVE_DAYS[yearkind],
                                   CUMULATIVE_DAYS[yearkind] + 13, idx_year_removed)
        - 1;
    return t_date(
        y, std::distance(CUMULATIVE_DAYS[yearkind], pos) + 1, idx_year_removed - *pos /*+1*/);
}

bool
operator<(const t_date& a, const t_date& b) {
    return a.m_storage < b.m_storage;
}
bool
operator<=(const t_date& a, const t_date& b) {
    return a.m_storage <= b.m_storage;
}
bool
operator>(const t_date& a, const t_date& b) {
    return a.m_storage > b.m_storage;
}
bool
operator>=(const t_date& a, const t_date& b) {
    return a.m_storage >= b.m_storage;
}
bool
operator==(const t_date& a, const t_date& b) {
    return a.m_storage == b.m_storage;
}
bool
operator!=(const t_date& a, const t_date& b) {
    return a.m_storage != b.m_storage;
}

t_int32
t_date::year() const {
    return ((m_storage & YEAR_MASK) >> YEAR_SHIFT);
}
t_int32
t_date::month() const {
    return ((m_storage & MONTH_MASK) >> MONTH_SHIFT);
}
t_int32
t_date::day() const {
    return ((m_storage & DAY_MASK) >> DAY_SHIFT);
}
t_str
t_date::str() const {
    std::stringstream ss;
    ss << year() << "-" << str_(month()) << "-" << str_(day());
    return ss.str();
}

} // end namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& os, const perspective::t_date& t) {
    os << t.str();
    return os;
}
} // namespace std
