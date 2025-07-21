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
#include <perspective/raw_types.h>
#include <perspective/base.h>
#include <perspective/scalar.h>
#include <perspective/exports.h>

namespace perspective {

class PERSPECTIVE_EXPORT t_range {
public:
    t_range(t_uindex bridx, t_uindex eridx);

    t_range(t_uindex bridx, t_uindex eridx, t_uindex bcidx, t_uindex ecidx);

    t_range(); // select all

    t_range(
        const std::vector<t_tscalar>& brpath,
        const std::vector<t_tscalar>& erpath
    );

    t_range(
        const std::vector<t_tscalar>& brpath,
        const std::vector<t_tscalar>& erpath,
        const std::vector<t_tscalar>& bcpath,
        const std::vector<t_tscalar>& ecpath
    );

    t_range(const std::string& expr_name);

    t_uindex bridx() const;
    t_uindex eridx() const;
    t_uindex bcidx() const;
    t_uindex ecidx() const;
    t_range_mode get_mode() const;

private:
    t_uindex m_bridx;
    t_uindex m_eridx;
    t_uindex m_bcidx;
    t_uindex m_ecidx;
    std::vector<t_tscalar> m_brpath;
    std::vector<t_tscalar> m_erpath;
    std::vector<t_tscalar> m_bcpath;
    std::vector<t_tscalar> m_ecpath;
    std::string m_expr_name;
    t_range_mode m_mode;
};

} // end namespace perspective
