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
#include <perspective/exports.h>
#include <iostream>

namespace perspective {
struct PERSPECTIVE_EXPORT t_none {
    t_none();

    template <class DATA_T>
    bool operator==(const DATA_T&) const;
    bool operator==(const t_none&) const;

    template <class DATA_T>
    bool operator<(const DATA_T&) const;
    bool operator<(const t_none&) const;

    template <class DATA_T>
    bool operator>(const DATA_T&) const;
    bool operator>(const t_none&) const;

    template <class DATA_T>
    bool operator>=(const DATA_T&) const;
    bool operator>=(const t_none&) const;

    template <class DATA_T>
    bool operator<=(const DATA_T&) const;
    bool operator<=(const t_none&) const;
};

template <class DATA_T>
bool
t_none::operator==(const DATA_T&) const {
    return false;
}

template <class DATA_T>
bool
t_none::operator<(const DATA_T&) const {
    return true;
}

template <class DATA_T>
bool
t_none::operator<=(const DATA_T&) const {
    return true;
}

template <class DATA_T>
bool
t_none::operator>(const DATA_T&) const {
    return false;
}

template <class DATA_T>
bool
t_none::operator>=(const DATA_T&) const {
    return false;
}

size_t hash_value(const t_none& none);

} // end namespace perspective

namespace std {
std::ostream& operator<<(std::ostream& os, const perspective::t_none& dt);
}
