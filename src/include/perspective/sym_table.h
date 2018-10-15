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
#include <perspective/scalar.h>
#include <unordered_map>

namespace perspective {

class t_symtable {
    typedef std::unordered_map<const char*, const char*, t_cchar_umap_hash, t_cchar_umap_cmp>
        t_mapping;

public:
    t_symtable();
    ~t_symtable();

    const t_char* get_interned_cstr(const t_char* s);
    t_tscalar get_interned_tscalar(const t_char* s);
    t_tscalar get_interned_tscalar(const t_tscalar& s);
    t_uindex size() const;

private:
    t_mapping m_mapping;
};

const t_char* get_interned_cstr(const t_char* s);
t_tscalar get_interned_tscalar(const t_char* s);
t_tscalar get_interned_tscalar(const t_tscalar& s);

} // end namespace perspective
