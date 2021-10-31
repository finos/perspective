/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute, clean} = require("./script_utils.js");
const fs = require("fs");

try {
    execute`
        github_changelog_generator
        --token=${process.env.GITHUB_TOKEN}
        --max-issues 100
        --user finos
        --project perspective
        --unreleased-only
        --base CHANGELOG.md
        --output CHANGELOG.md
        --unreleased-label=v1.0.1
        --since-tag=v1.0.0
    `;

    execute`git add CHANGELOG.md`;
    fs.writeFileSync("./.perspectiverc", `PSP_PROJECT=js`);
    execute`yarn clean --deps`;
    execute`rm -rf node_modules`;
    execute`yarn`;
    execute`yarn build`;

    execute`yarn lerna publish --force-publish --no-push`;
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
