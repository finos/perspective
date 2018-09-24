/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/time.h>
#include <perspective/utils.h>

namespace perspective {

t_tdelta::t_tdelta()
    : v(0) {}

t_tdelta::t_tdelta(t_int64 v)
    : v(v) {}

t_tdelta&
t_tdelta::operator*=(t_int64 multiplier) {
    v *= multiplier;
    return *this;
}

t_time::t_time()
    : m_storage(0) {}

t_time::t_time(t_int64 raw_val)
    : m_storage(raw_val) {}

t_time::t_time(int year, int month, int day, int hour, int min, int sec)
    : m_storage(to_gmtime(year, month, day, hour, min, sec) * 1000000LL) {}

t_int64
t_time::raw_value() const {
    return m_storage;
}

bool
operator<(const t_time& a, const t_time& b) {
    return a.m_storage < b.m_storage;
}

bool
operator<=(const t_time& a, const t_time& b) {
    return a.m_storage <= b.m_storage;
}

bool
operator>(const t_time& a, const t_time& b) {
    return a.m_storage > b.m_storage;
}

bool
operator>=(const t_time& a, const t_time& b) {
    return a.m_storage >= b.m_storage;
}

bool
operator==(const t_time& a, const t_time& b) {
    return a.m_storage == b.m_storage;
}

bool
operator!=(const t_time& a, const t_time& b) {
    return a.m_storage != b.m_storage;
}

bool
t_time::as_tm(struct tm& out) const {
    return gmtime(out, as_seconds(), 0) == 1;
}

t_int32
isleap(long int year) {
    return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) ? 1 : 0;
}

t_int32
t_time::gmtime(struct tm& out, t_int64 secs, t_int32 offset) const {
    t_int64 days, rem, y;
    const unsigned short int* ip;

    days = secs / SECS_PER_DAY;
    rem = secs % SECS_PER_DAY;
    rem += offset;
    while (rem < 0) {
        rem += SECS_PER_DAY;
        --days;
    }
    while (rem >= SECS_PER_DAY) {
        rem -= SECS_PER_DAY;
        ++days;
    }
    out.tm_hour = rem / SECS_PER_HOUR;
    rem %= SECS_PER_HOUR;
    out.tm_min = rem / 60;
    out.tm_sec = rem % 60;
    /* January 1, 1970 was a Thursday.  */
    out.tm_wday = (4 + days) % 7;
    if (out.tm_wday < 0)
        out.tm_wday += 7;
    y = 1970;

#define DIV(a, b) ((a) / (b) - ((a) % (b) < 0))
#define LEAPS_THRU_END_OF(y) (DIV(y, 4) - DIV(y, 100) + DIV(y, 400))

    while (days < 0 || days >= (isleap(y) ? 366 : 365)) {
        /* Guess a corrected year, assuming 365 days per
         * year.  */
        long int yg = y + days / 365 - (days % 365 < 0);

        /* Adjust DAYS and Y to match the guessed year.
         */
        days -= ((yg - y) * 365 + LEAPS_THRU_END_OF(yg - 1) - LEAPS_THRU_END_OF(y - 1));
        y = yg;
    }
    out.tm_year = y - 1900;
    if (out.tm_year != y - 1900) {
        /* The year cannot be represented due to
         * overflow.  */
        return 0;
    }
    out.tm_yday = days;
    ip = __mon_yday[isleap(y)];
    for (y = 11; days < (long int)ip[y]; --y)
        continue;
    days -= ip[y];
    out.tm_mon = y;
    out.tm_mday = days + 1;
    return 1;
}

t_int32
t_time::year(const struct tm& t) const {
    return t.tm_year + 1900;
}
t_int32
t_time::month(const struct tm& t) const {
    return t.tm_mon + 1;
}
t_int32
t_time::day(const struct tm& t) const {
    return t.tm_mday;
}
t_int32
t_time::hours(const struct tm& t) const {
    return t.tm_hour;
}
t_int32
t_time::minutes(const struct tm& t) const {
    return t.tm_min;
}
t_int32
t_time::seconds(const struct tm& t) const {
    return t.tm_sec;
}
t_int32
t_time::microseconds() const // component
{
    t_int32 micros = m_storage % 1000000;
    return micros + ((micros >> 31) & 1000000);
}

t_int64
t_time::as_seconds() const {
    if (m_storage < 0 && m_storage % 1000000)
        return m_storage / 1000000 - 1;
    return m_storage / 1000000;
}

t_str
t_time::str(const struct tm& t) const {
    std::stringstream ss;

    t_float64 s = seconds(t) + microseconds() / 1000000.0;

    ss << year(t) << "-" << str_(month(t)) << "-" << str_(day(t)) << " " << str_(hours(t))
       << ":" << str_(minutes(t)) << ":" << std::setfill('0') << std::setw(6) << std::fixed
       << std::setprecision(3) << s;

    return ss.str();
}

t_int32
days_before_year(t_int32 year) {
    t_int32 y = year - 1;
    if (y >= 0)
        return y * 365 + y / 4 - y / 100 + y / 400;
    else {
        return -366;
    }
}

t_int32
days_before_month(t_int32 year, t_int32 month) {
    if (month < 1 || month > 12)
        return 0;
    return __mon_yday[isleap(year)][month - 1];
}

t_int32
ymd_to_ord(t_int32 year, t_int32 month, t_int32 day) {
    return days_before_year(year) + days_before_month(year, month) + day;
}

t_int64
to_gmtime(t_int32 year, t_int32 month, t_int32 day, t_int32 hour, t_int32 min, t_int32 sec) {
    static t_int32 EPOCH_ORD = ymd_to_ord(1970, 1, 1);
    t_int64 days = ymd_to_ord(year, month, day) - EPOCH_ORD;
    t_int64 res = ((days * 24 + hour) * 60 + min) * 60 + sec;
    return static_cast<t_int64>(res);
}

t_time&
t_time::operator+=(const t_tdelta& d) {
    m_storage += d.v;
    return *this;
}

t_time&
t_time::operator-=(const t_tdelta& d) {
    m_storage -= d.v;
    return *this;
}

t_tdelta
operator-(const t_time& a, const t_time& b) {
    return t_tdelta(a.m_storage - b.m_storage);
}

} // end namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& s, const perspective::t_tdelta& td) {
    s << "t_tdelta(" << td.v << ")";
    return s;
}

std::ostream&
operator<<(std::ostream& os, const perspective::t_time& t) {
    struct tm tstruct;
    bool rcode = t.as_tm(tstruct);
    if (rcode) {
        os << "t_time<" << t.str(tstruct) << ">" << std::endl;
    } else {
        os << "t_time<" << t.raw_value() << ">" << std::endl;
    }

    return os;
}
} // namespace std
