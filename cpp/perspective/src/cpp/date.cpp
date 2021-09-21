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

t_date::t_date(std::int16_t year, std::int8_t month, std::int8_t day) {
    set_year_month_day(year, month, day);
}

void
t_date::set_year_month_day(
    std::int16_t year, std::int8_t month, std::int8_t day) {
    set_year(year);
    set_month(month);
    set_day(day);
}

void
t_date::set_year(std::int16_t year) {
    m_storage = (m_storage & ~YEAR_MASK) | (year << YEAR_SHIFT);
}
void
t_date::set_month(std::int8_t month) {
    m_storage = (m_storage & ~MONTH_MASK) | (month << MONTH_SHIFT);
}
void
t_date::set_day(std::int8_t day) {
    m_storage = (m_storage & ~DAY_MASK) | (day << DAY_SHIFT);
}

t_date::t_date(std::uint32_t raw_val)
    : m_storage(raw_val) {}

std::uint32_t
t_date::raw_value() const {
    return m_storage;
}
// Index such that
// a.consecutive_day_idx()-b.consecutive_day_idx() is
// number of days a is after b.
//(Start point is unspecified, may not be stable and
// only works for dates after 1900AD.)
std::int32_t
t_date::consecutive_day_idx() const {
    std::int32_t m = month();
    std::int32_t y = year();
    std::int32_t yP = y - 1;
    std::int32_t leap_selector
        = (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 1 : 0;
    return day() + 365 * y + yP / 4 - yP / 100 + yP / 400
        + CUMULATIVE_DAYS[leap_selector][m - 1];
}

std::tm
t_date::get_tm() const {
    std::tm rval;

    rval.tm_year = year() - 1900; // tm years are since 1900
    rval.tm_mon = month();        // tm months from 0, so no need to decrement
    rval.tm_mday = day();
    rval.tm_hour = 0;
    rval.tm_min = 0;
    rval.tm_sec = 0;
    rval.tm_isdst = -1; // let std::mktime decide whether DST is in effect

    return rval;
}

t_date
from_consecutive_day_idx(std::int32_t idx) {
    std::int32_t y = static_cast<std::int32_t>(idx / 365.2425);
    std::int32_t yP = y - 1;
    std::int32_t idx_year_removed
        = idx - (y * 365 + yP / 4 - yP / 100 + yP / 400);
    std::int32_t tgt_substraction
        = (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 366 : 365;
    if (idx_year_removed > tgt_substraction) {
        idx_year_removed -= tgt_substraction;
        y += 1;
    }
    std::int32_t yearkind
        = (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 1 : 0;
    const std::int32_t* const pos
        = std::lower_bound(CUMULATIVE_DAYS[yearkind],
              CUMULATIVE_DAYS[yearkind] + 13, idx_year_removed)
        - 1;
    return t_date(y, std::distance(CUMULATIVE_DAYS[yearkind], pos) + 1,
        idx_year_removed - *pos /*+1*/);
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

std::int32_t
t_date::year() const {
    return ((m_storage & YEAR_MASK) >> YEAR_SHIFT);
}
std::int32_t
t_date::month() const {
    return ((m_storage & MONTH_MASK) >> MONTH_SHIFT);
}
std::int32_t
t_date::day() const {
    return ((m_storage & DAY_MASK) >> DAY_SHIFT);
}
std::string
t_date::str() const {
    std::stringstream ss;
    ss << year() << "-" << str_(month() + 1) << "-" << str_(day());
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
