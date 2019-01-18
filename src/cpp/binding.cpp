/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <random>
#include <cmath>
#include <sstream>
#include <perspective/sym_table.h>
#include <codecvt>
#include <boost/optional.hpp>

#ifdef PSP_ENABLE_WASM
#include <perspective/emscripten.h>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;
#endif

#ifdef PSP_ENABLE_PYTHON

#endif

using namespace perspective;

namespace perspective {
namespace binding {




}
}
