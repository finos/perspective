/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// eslint-disable-next-line no-undef
const REQUIRE = typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : module.require;
const NAMES = ["perspective.config.js", "perspective.config.json", "package.json"];

const DEFAULT_CONFIG = {
    types: {
        string: {
            filter_operator: "==",
            aggregate: "count"
        },
        float: {
            filter_operator: "==",
            aggregate: "sum"
        },
        integer: {
            filter_operator: "==",
            aggregate: "sum"
        },
        boolean: {
            filter_operator: "==",
            aggregate: "count"
        },
        datetime: {
            filter_operator: "==",
            aggregate: "count"
        },
        date: {
            filter_operator: "==",
            aggregate: "count"
        }
    }
};

module.exports.get_type_config = function(type) {
    return module.exports.get_config().types[type] || {};
};

function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, {[key]: {}});
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        }
    }

    return mergeDeep(target, ...sources);
}

function get_config_file() {
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
                    return REQUIRE(candidate);
                }
            }
        }
        curr.pop();
    }
}

let cached_config;

module.exports.override_config = function(config) {
    cached_config = config;
};

module.exports.get_config = function get_config() {
    if (!cached_config) {
        cached_config = mergeDeep(DEFAULT_CONFIG, typeof window === "undefined" ? get_config_file() : global.__TEMPLATE_CONFIG__ || {});
    }
    return cached_config;
};
