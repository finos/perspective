/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute } = require("./script_utils.js");
const fs = require("fs");

if (!process.env.GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN");
}

try {
    // NPM publish
    execute`
        github_changelog_generator
        --token=${process.env.GITHUB_TOKEN}
        --max-issues 100
        --user finos
        --project perspective
        --unreleased-only
        --base CHANGELOG.md
        --output CHANGELOG.md
        --unreleased-label=v1.7.2
        --since-tag=v1.7.1
    `;

    execute`git add CHANGELOG.md`;

    console.log(`-- Building "@finos/perspective(-*)"`);
    fs.writeFileSync("./.perspectiverc", `PSP_PROJECT=js`);
    require("dotenv").config({ path: "./.perspectiverc" });
    execute`yarn clean --deps`;
    execute`rm -rf node_modules`;
    execute`yarn`;
    execute`yarn build`;

    execute`yarn lerna publish --force-publish --no-push`;
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
