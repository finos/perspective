/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import sh from "./sh.mjs";
import * as url from "url";
import { lint } from "./lint.mjs";

if (import.meta.url.startsWith("file:")) {
    if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
        await import("./fix_python.mjs");
        const { default: run } = await import("./lint_headers.mjs");
        await run(true);
        lint(sh`--write`);
    }
}
