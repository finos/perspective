/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/none.h>
namespace perspective {

t_none::t_none() {}

bool
t_none::operator==(const t_none&) const {
    return true;
}

bool
t_none::operator<(const t_none&) const {
    return false;
}

bool
t_none::operator<=(const t_none&) const {
    return true;
}

bool
t_none::operator>(const t_none&) const {
    return true;
}

bool
t_none::operator>=(const t_none&) const {
    return true;
}

size_t
hash_value(const t_none& none) {
    boost::hash<long> hasher;
    return hasher(static_cast<long>(-1));
}
} // namespace perspective

namespace std {
std::ostream&
operator<<(std::ostream& os, const perspective::t_none& dt) {
    os << "<t_none>";
    return os;
}
} // namespace std
