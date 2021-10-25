/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/regex.h>

namespace perspective {

RE2*
t_regex_mapping::intern(const std::string& pattern) {
    if (m_regex_map.count(pattern) == 1) {
        return m_regex_map[pattern].get();
    }

    std::shared_ptr<RE2> compiled_pattern
        = std::make_shared<RE2>(pattern, RE2::Quiet);

    if (!compiled_pattern->ok()) {
        // TODO: provide a better error message when the regex can't compile.
        return nullptr;
    }

    m_regex_map[pattern] = compiled_pattern;
    return m_regex_map[pattern].get();
}

void
t_regex_mapping::clear() {
    m_regex_map.clear();
}

} // end namespace perspective
