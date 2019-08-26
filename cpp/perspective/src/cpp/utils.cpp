/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <boost/uuid/uuid_io.hpp>
#ifndef PSP_ENABLE_WASM
// emscripten llvm-upstream fails to compile this module ..
#include <boost/uuid/uuid_generators.hpp>
#endif
#include <perspective/raw_types.h>
#include <string>
#include <sstream>

namespace perspective {

std::string
unique_path(const std::string& path_prefix) {
#ifdef PSP_ENABLE_WASM
    return "";
#else
    std::stringstream ss;
    ss << path_prefix << boost::uuids::random_generator()();
    return ss.str();
#endif
}
} // namespace perspective
