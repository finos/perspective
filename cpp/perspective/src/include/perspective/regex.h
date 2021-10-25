/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/exports.h>
#include <tsl/hopscotch_map.h>
#include <re2/re2.h>

namespace perspective {

/**
 * @brief Caches RE2 objects by pattern string.
 */
struct PERSPECTIVE_EXPORT t_regex_mapping {

    /**
     * @brief Given a regex pattern string, store it in the map if it does not
     * exist already, and return a raw pointer to the stored RE2 object which
     * will be valid as long as the mapping is alive.
     *
     * @param pattern
     * @return RE2&
     */
    RE2* intern(const std::string& pattern);

    void clear();

    // Store pointers to RE2 objects as the default copy assignment operator
    // for RE2 is disabled.
    tsl::hopscotch_map<std::string, std::shared_ptr<RE2>> m_regex_map;
};

} // end namespace perspective
