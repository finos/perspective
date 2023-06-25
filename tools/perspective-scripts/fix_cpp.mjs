/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import sh from "./sh.mjs";

function lint(dir) {
    sh`clang-format -i -style=file ${dir}`.runSync();
}

lint(sh.path`./cpp/perspective/src/cpp/*.cpp`);
lint(sh.path`./cpp/perspective/src/include/perspective/*.h`);
lint(sh.path`./python/perspective/perspective/src/*.cpp`);
lint(sh.path`./python/perspective/perspective/include/perspective/*.h`);
lint(sh.path`./python/perspective/perspective/include/perspective/python/*.h`);
