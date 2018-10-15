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
#include <perspective/scalar.h>
#include <perspective/exports.h>
#include <vector>

namespace perspective {

struct PERSPECTIVE_EXPORT t_dep_recipe {
    t_dep_recipe() {}
    t_str m_name;
    t_str m_disp_name;
    t_deptype m_type;
    t_tscalar m_imm;
    t_dtype m_dtype;
};

typedef std::vector<t_dep_recipe> t_dep_recipevec;

class PERSPECTIVE_EXPORT t_dep {
public:
    t_dep(const t_dep_recipe& v);
    t_dep(const t_str& name, t_deptype type);

    t_dep(const t_str& name, const t_str& disp_name, t_deptype type, t_dtype dtype);

    t_dep(t_tscalar dep);

    const t_str& name() const;
    const t_str& disp_name() const;

    t_deptype type() const;
    t_tscalar imm() const;
    t_dtype dtype() const;
    t_dep_recipe get_recipe() const;

private:
    t_str m_name;
    t_str m_disp_name;
    t_deptype m_type;
    t_tscalar m_imm;
    t_dtype m_dtype;
};

typedef std::vector<t_dep> t_depvec;

} // end namespace perspective
