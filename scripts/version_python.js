/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const resolve = require("path").resolve;
const execute = require("./script_utils").execute;
const VERSION = require("../packages/perspective/package.json").version;
const ENDINGS = ["alpha", "beta", "rc"];

/**
 * Converts a npm-spec version string into a bumpversion-spec version string.
 *
 * Example:
 * - "1.0.0" => "1, 0, 0"
 * - "0.3.0-alpha.1" => "0, 3, 0, alpha, 1"
 * - "0.3.5-rc.3" => "0, 3, 5, rc, 3"
 *
 * @param {string} version
 */
const parse_version = function(version) {
    let release_level = "final";
    let serial = 0;
    let has_ending = false;

    for (let e of ENDINGS) {
        if (version.includes(e)) {
            has_ending = true;
        }
    }

    // "0.3.0-rc.1" => ["0", "3", "0-rc", "1"]
    let split = version.split(".");
    let patch = split[2];

    // remove dash from alpha/beta/rc
    if (has_ending) {
        let optional_versions = split[split.length - 2].split("-");
        patch = optional_versions[0];
        release_level = optional_versions[1];
        serial = split[split.length - 1];
    }

    return `${split[0]}, ${split[1]}, ${patch}, '${release_level}', ${serial}`;
};

console.log(`Bumping \`perspective-python\` version to ${VERSION}`);
const python_path = resolve(__dirname, "..", "python", "perspective");
const version_path = resolve(__dirname, "..", "python", "perspective", "perspective", "core", "_version.py");
execute(`cd ${python_path} && bumpversion --allow-dirty --new-version "${parse_version(VERSION)}" ${version_path}`);
