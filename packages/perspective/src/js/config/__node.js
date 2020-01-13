/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const NAMES = ["perspective.config.js", "perspective.config.json", "package.json"];

module.exports.default = function get_config_file() {
    // eslint-disable-next-line no-undef
    const REQUIRE = typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : module.require;
    const path = REQUIRE("path");
    const fs = REQUIRE("fs");
    const [root, ...curr] = process.cwd().split(path.sep);
    while (curr.length > 0) {
        for (const name of NAMES) {
            const candidate = `${root}${path.sep}${path.join(...curr, name)}`;
            if (fs.existsSync(candidate)) {
                if (name.endsWith("json")) {
                    const json = JSON.parse(fs.readFileSync(candidate));
                    if (name === "package.json") {
                        if (json.perspective) {
                            return json.perspective;
                        }
                    } else {
                        return json;
                    }
                } else {
                    const mod = REQUIRE(candidate);
                    return mod.default || mod;
                }
            }
        }
        curr.pop();
    }
};
