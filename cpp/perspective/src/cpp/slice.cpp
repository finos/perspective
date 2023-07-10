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

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/slice.h>

namespace perspective {

const t_range&
t_slice::range() const {
    return m_range;
}

const std::vector<t_path>&
t_slice::row_paths() const {
    return m_row_paths;
}

const std::vector<t_path>&
t_slice::column_paths() const {
    return m_column_paths;
}

const std::vector<t_index>&
t_slice::row_indices() const {
    return m_row_indices;
}

const std::vector<t_index>&
t_slice::column_indices() const {
    return m_column_indices;
}

const std::vector<t_data>&
t_slice::row_data() const {
    return m_row_data;
}

const std::vector<t_data>&
t_slice::column_data() const {
    return m_column_data;
}

const std::vector<t_uindex>&
t_slice::row_depth() const {

    return m_row_depth;
}

const std::vector<t_uindex>&
t_slice::column_depth() const {
    return m_column_depth;
}

const std::vector<t_uindex>&
t_slice::is_row_expanded() const {
    return m_is_row_expanded;
}

const std::vector<t_uindex>&
t_slice::is_column_expanded() const {
    return m_is_column_expanded;
}

t_range&
t_slice::range() {
    return m_range;
}

std::vector<t_path>&
t_slice::row_paths() {
    return m_row_paths;
}

std::vector<t_path>&
t_slice::column_paths() {
    return m_column_paths;
}

std::vector<t_index>&
t_slice::row_indices() {
    return m_row_indices;
}

std::vector<t_index>&
t_slice::column_indices() {
    return m_column_indices;
}

std::vector<t_data>&
t_slice::row_data() {
    return m_row_data;
}

std::vector<t_data>&
t_slice::column_data() {
    return m_column_data;
}

std::vector<t_uindex>&
t_slice::row_depth() {

    return m_row_depth;
}

std::vector<t_uindex>&
t_slice::column_depth() {
    return m_column_depth;
}

std::vector<t_uindex>&
t_slice::is_row_expanded() {
    return m_is_row_expanded;
}

std::vector<t_uindex>&
t_slice::is_column_expanded() {
    return m_is_column_expanded;
}

} // namespace perspective
