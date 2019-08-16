/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const DEFAULT_CONFIG = require("./settings.js").default;

const NAMES = ["perspective.config.js", "perspective.config.json", "package.json"];

module.exports.get_types = function() {
    return Object.keys(module.exports.get_config().types);
};

module.exports.get_type_config = function(type) {
    const config = {};
    if (module.exports.get_config().types[type]) {
        Object.assign(config, module.exports.get_config().types[type]);
    }
    if (config.type) {
        const props = module.exports.get_type_config(config.type);
        Object.assign(props, config);
        return props;
    } else {
        return config;
    }
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
}

global.__PERSPECTIVE_CONFIG__ = undefined;

module.exports.override_config = function(config) {
    if (global.__PERSPECTIVE_CONFIG__) {
        console.warn("Config already initialized!");
    }
    global.__PERSPECTIVE_CONFIG__ = mergeDeep(DEFAULT_CONFIG, config);
};

module.exports.get_config = function get_config() {
    if (!global.__PERSPECTIVE_CONFIG__) {
        global.__PERSPECTIVE_CONFIG__ = mergeDeep(DEFAULT_CONFIG, typeof window === "undefined" ? get_config_file() : global.__TEMPLATE_CONFIG__ || {});
    }
    return global.__PERSPECTIVE_CONFIG__;
};
