// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { Octokit } from "octokit";
import sh from "./sh.mjs";
import fs from "node:fs/promises";

// GitHub API Wrapper
const OCTOKIT = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const CURRENT_TAG = sh`git describe --exact-match --tags`.execSync();

const IS_DIRTY = await sh`git status --untracked-files=no --porcelain`
    .exec()
    .then((x) => x.length > 0);

async function get_release_assets() {
    const resp = await OCTOKIT.request("GET /repos/{owner}/{repo}/releases", {
        owner: "finos",
        repo: "perspective",
    });

    for (const release of resp.data) {
        if (release.tag_name === CURRENT_TAG) {
            return release.assets;
        }
    }

    throw new Error(`No release ${CURRENT_TAG} found`);
}

async function download_release_assets(releases) {
    await Promise.all(
        releases.map(async (release) => {
            const resp = await OCTOKIT.request(
                "GET /repos/{owner}/{repo}/releases/assets/{asset_id}",
                {
                    owner: "finos",
                    repo: "perspective",
                    asset_id: release.id,
                    headers: {
                        Accept: "application/octet-stream",
                    },
                }
            );

            console.log(`Writing ${release.name}`);
            await fs.writeFile(release.name, Buffer.from(resp.data));
        })
    );
}

async function publish_release_assets(releases) {
    if (process.env.COMMIT) {
        for (const release of releases) {
            if (release.name.endsWith("whl")) {
                sh`twine upload ${release.name}`.runSync();
            } else {
                sh`npm publish ${release.name}`.runSync();
            }
        }

        sh`cargo publish`.cwd("rust/perspective-viewer").runSync();
    } else {
        console.warn(`COMMIT not specified, aborting`);
    }
}

if (!process.env.GITHUB_TOKEN) {
    throw new Error("Missing Personal Access Token (GITHUB_TOKEN)");
}

if (!process.env.COMMIT) {
    console.warn(
        "Running a dry run, this WILL NOT publish. Set the env var COMMIT to publish."
    );
}

if (IS_DIRTY) {
    throw new Error("Working tree dirty, aborting");
}

const releases = await get_release_assets();
console.log(`Found ${releases.length} artifacts for ${CURRENT_TAG}`);
for (const release of releases) {
    console.log(`  ${release.name}`);
}

await download_release_assets(releases);
await publish_release_assets(releases);
