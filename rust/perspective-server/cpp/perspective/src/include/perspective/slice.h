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
#include <perspective/base.h>
#include <perspective/scalar.h>
#include <perspective/range.h>
#include <perspective/config.h>
#include <perspective/exports.h>
#include <perspective/data.h>
#include <perspective/path.h>

namespace perspective {

class PERSPECTIVE_EXPORT t_slice {
public:
    const t_range& range() const;
    const std::vector<t_path>& row_paths() const;
    const std::vector<t_path>& column_paths() const;
    const std::vector<t_index>& row_indices() const;
    const std::vector<t_index>& column_indices() const;
    const std::vector<t_data>& row_data() const;
    const std::vector<t_data>& column_data() const;
    const std::vector<t_uindex>& row_depth() const;
    const std::vector<t_uindex>& column_depth() const;
    const std::vector<t_uindex>& is_row_expanded() const;
    const std::vector<t_uindex>& is_column_expanded() const;

    t_range& range();
    std::vector<t_path>& row_paths();
    std::vector<t_path>& column_paths();
    std::vector<t_index>& row_indices();
    std::vector<t_index>& column_indices();
    std::vector<t_data>& row_data();
    std::vector<t_data>& column_data();
    std::vector<t_uindex>& row_depth();
    std::vector<t_uindex>& column_depth();
    std::vector<t_uindex>& is_row_expanded();
    std::vector<t_uindex>& is_column_expanded();

private:
    t_range m_range;
    std::vector<t_path> m_row_paths;
    std::vector<t_path> m_column_paths;
    std::vector<t_index> m_row_indices;
    std::vector<t_index> m_column_indices;
    std::vector<t_data> m_row_data;
    std::vector<t_data> m_column_data;
    std::vector<t_uindex> m_is_root;
    std::vector<t_uindex> m_is_row_expanded;
    std::vector<t_uindex> m_is_column_expanded;
    std::vector<t_uindex> m_row_depth;
    std::vector<t_uindex> m_column_depth;
};

} // end namespace perspective