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

import cp from "cpy";
import decompress from "decompress";
import decompressUnzip from "decompress-unzip";
import { promises as fs } from "fs";
import { Octokit } from "octokit";
import readline from "readline";

const CURRENT_TAG = execSync("git describe --exact-match --tags")
    .toString()
    .trim();

// Artifacts Docs:
// https://docs.github.com/en/rest/actions/artifacts
// Example run:
// https://github.com/finos/perspective/suites/2454745307
if (!process.env.GITHUB_TOKEN) {
    throw new Error("Missing Personal Access Token (GITHUB_TOKEN)");
}

if (!process.env.GITHUB_WORKFLOW_ID) {
    throw new Error("Missing Github Actions Workflow ID (GITHUB_WORKFLOW_ID)");
}

if (!process.env.COMMIT) {
    console.warn(
        "Running a dry run, this WILL NOT publish. Set the env var COMMIT to publish."
    );
}

const gh_js_dist_aliases = {
    "perspective-dist": "packages/perspective/dist",
    "perspective-viewer-dist": "rust/perspective-viewer/dist",
    "perspective-viewer-datagrid-dist":
        "packages/perspective-viewer-datagrid/dist",
    "perspective-viewer-d3fc-dist": "packages/perspective-viewer-d3fc/dist",
    "perspective-viewer-openlayers-dist":
        "packages/perspective-viewer-openlayers/dist",
    "perspective-workspace-dist": "packages/perspective-workspace/dist",
    "perspective-jupyterlab-dist": "packages/perspective-jupyterlab/dist",
    "perspective-cli-dist": "packages/perspective-cli/dist",
    "perspective-esbuild-plugin-dist":
        "packages/perspective-esbuild-plugin/dist",
    "perspective-webpack-plugin-dist":
        "packages/perspective-webpack-plugin/dist",
};

const gh_js_dist_folders = Object.keys(gh_js_dist_aliases);

// Folders for artifacts on GitHub Actions
const gh_python_dist_folders = [
    // // https://github.com/actions/virtual-environments
    "perspective-python-dist-pyodide",

    // Mac 11
    // https://github.com/actions/setup-python/issues/682
    "perspective-python-dist-macos-11-3.7",
    "perspective-python-dist-macos-11-3.8",
    "perspective-python-dist-macos-11-3.9",
    "perspective-python-dist-macos-11-3.10",
    "perspective-python-dist-macos-11-3.11",
    // Ubuntu (Manylinux 2014 docker images)
    "perspective-python-dist-ubuntu-20.04-3.7",
    "perspective-python-dist-ubuntu-20.04-3.8",
    "perspective-python-dist-ubuntu-20.04-3.9",
    "perspective-python-dist-ubuntu-20.04-3.10",
    "perspective-python-dist-ubuntu-20.04-3.11",
    // Windows 2019 (No 3.6 on windows)
    "perspective-python-dist-windows-2019-3.7",
    "perspective-python-dist-windows-2019-3.8",
    "perspective-python-dist-windows-2019-3.9",
    "perspective-python-dist-windows-2019-3.10",
    "perspective-python-dist-windows-2019-3.11",
    // Windows 2022
    // NOTE: omit these for now, rely on 2019 wheels
    // "perspective-python-dist-windows-2022-3.7",
    // "perspective-python-dist-windows-2022-3.8",
    // "perspective-python-dist-windows-2022-3.9",
    // "perspective-python-dist-windows-2022-3.10",
    // "perspective-python-dist-windows-2022-3.11",

    "perspective-python-sdist",
];

// Artifacts inside those folders
const wheels = [
    "cp311-cp311-emscripten_3_1_32_wasm32",
    // Mac 11
    "cp37-cp37-macosx_11_0_x86_64",
    "cp38-cp38-macosx_11_0_x86_64",
    "cp39-cp39-macosx_11_0_x86_64",
    "cp310-cp310-macosx_11_0_x86_64",
    "cp311-cp311-macosx_11_0_x86_64",
    // Manylinux 2014
    "cp37-cp37-manylinux2014_x86_64",
    "cp38-cp38-manylinux2014_x86_64",
    "cp39-cp39-manylinux2014_x86_64",
    "cp310-cp310-manylinux2014_x86_64",
    "cp311-cp311-manylinux2014_x86_64",
    // Windows (use 2019)
    "cp37-cp37-win_amd64",
    "cp38-cp38-win_amd64",
    "cp39-cp39-win_amd64",
    "cp310-cp310-win_amd64",
    "cp311-cp311-win_amd64",
];

// GitHub API Wrapper
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

// Helper function to prompt for user input
function askQuestion(query, ciDecision = "y") {
    if (process.env.CI) {
        return Promise.resolve("y");
    }
    // https://stackoverflow.com/questions/18193953/waiting-for-user-to-enter-input-in-node-js
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}

// Page to fetch
let page = 1;
let resp;

// assets loaded
let python_dist_folders = [];
let js_dist_folders = [];
do {
    console.log(`Fetching page ${page}`);

    // Fetch the artifacts
    resp = await octokit.request(
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts?page={page}",
        {
            owner: "finos",
            repo: "perspective",
            run_id: process.env.GITHUB_WORKFLOW_ID,
            page,
        }
    );

    // Concatenate to existing artifacts
    python_dist_folders = [
        ...python_dist_folders,
        ...resp.data.artifacts.filter(
            (artifact) => gh_python_dist_folders.indexOf(artifact.name) >= 0
        ),
    ];
    js_dist_folders = [
        ...js_dist_folders,
        ...resp.data.artifacts.filter((artifact) => {
            return gh_js_dist_folders.indexOf(artifact.name) >= 0;
        }),
    ];
    page += 1;
} while (!resp || resp.data.artifacts.length > 0);

// Print out our results, and what we expected
console.log(
    `Found ${python_dist_folders.length} python folders, expected ${gh_python_dist_folders.length}`
);
console.log(
    `Found ${js_dist_folders.length} javascript folders, expected ${gh_js_dist_folders.length}`
);

// If they vary (e.g. a partial run), ask the user if they're sure
// they want to proceed
let proceed = "y";
if (
    python_dist_folders.length !== gh_python_dist_folders.length ||
    js_dist_folders.length !== gh_js_dist_folders.length
) {
    proceed = "n";
    proceed = await askQuestion("Proceed? (y/N)", "n");
}

// If everything good, or they say they want to proceed,
// pull the artifacts locally into a temp folder
if (proceed.toLowerCase() === "y") {
    const dist_folder = `dist/pypi-${process.env.GITHUB_WORKFLOW_ID}`;
    const wheel_folder = `dist/pypi-wheel-${process.env.GITHUB_WORKFLOW_ID}/wheels`;

    // Remove if exists
    await fs.rm(dist_folder, {
        recursive: true,
        force: true,
    });

    // Make directories
    await fs.mkdir(dist_folder, {
        recursive: true,
    });
    await fs.mkdir(wheel_folder, {
        recursive: true,
    });

    const release = await octokit.request(
        "POST /repos/{owner}/{repo}/releases",
        {
            owner: "finos",
            repo: "perspective",
            tag_name: CURRENT_TAG,
            name: CURRENT_TAG,
            body: "Release of perspective",
            draft: false,
            prerelease: false,
            generate_release_notes: false,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    // Download the artifact folders
    await Promise.all(
        python_dist_folders.map(async (artifact) => {
            // Download the Artifact
            const download = await octokit.request(
                "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
                {
                    owner: "finos",
                    repo: "perspective",
                    artifact_id: `${artifact.id}`,
                    archive_format: "zip",
                }
            );

            await octokit.request({
                method: "POST",
                url: release.data.upload_url,
                owner: "finos",
                repo: "perspective",
                data: download.data,
                name: `${artifact.name}.zip`,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });

            if (!artifact.name.includes("pyodide")) {
                // Write out the zip file
                await fs.appendFile(
                    `${dist_folder}/${artifact.name}.zip`,
                    Buffer.from(download.data)
                );
            }
        })
    );

    // Unzip the folders
    await Promise.all(
        python_dist_folders.map(async (artifact) => {
            await decompress(
                `${dist_folder}/${artifact.name}.zip`,
                `${dist_folder}/${artifact.name}`,
                {
                    plugins: [decompressUnzip()],
                }
            );
        })
    );

    // Move the wheels
    await Promise.all(
        python_dist_folders.map(async (artifact) => {
            await cp(
                [`${dist_folder}/${artifact.name}/*.whl`],
                `${wheel_folder}`
            );
            await cp(
                [`${dist_folder}/${artifact.name}/*.tar.gz`],
                `${wheel_folder}`
            );
        })
    );

    // List the wheels
    const downloaded_wheels = await fs.readdir(wheel_folder);

    // Print out our results, and what we expected
    console.log(
        `Found ${downloaded_wheels.length} wheels, expected ${
            wheels.length + 1
        }`
    );
    const js_dist_folder = `dist/npm-${process.env.GITHUB_WORKFLOW_ID}`;
    await fs.rm(js_dist_folder, {
        recursive: true,
        force: true,
    });
    await fs.mkdir(js_dist_folder, {
        recursive: true,
    });
    await Promise.all(
        js_dist_folders.map(async (artifact) => {
            // Download the Artifact
            const download = await octokit.request(
                "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
                {
                    owner: "finos",
                    repo: "perspective",
                    artifact_id: `${artifact.id}`,
                    archive_format: "zip",
                }
            );

            await octokit.request({
                method: "POST",
                url: release.data.upload_url,
                owner: "finos",
                repo: "perspective",
                data: download.data,
                name: `${artifact.name}.zip`,
                headers: {
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });

            // Write out the zip file
            await fs.appendFile(
                `${js_dist_folder}/${artifact.name}.zip`,
                Buffer.from(download.data)
            );
        })
    );
    async function isError(promise) {
        try {
            await promise;
            return false;
        } catch (e) {
            return true;
        }
    }

    // Unzip the folders
    await Promise.all(
        js_dist_folders.map(async (artifact) => {
            const js_dist_dir = gh_js_dist_aliases[artifact.name];
            if (!(await isError(fs.stat(js_dist_dir)))) {
                await fs.rm(js_dist_dir, {
                    recursive: true,
                });
            }
            await fs.mkdir(js_dist_dir);
            await decompress(
                `${js_dist_folder}/${artifact.name}.zip`,
                gh_js_dist_aliases[artifact.name],
                {
                    plugins: [decompressUnzip()],
                    map: (file) => {
                        if (file.type === "file" && file.path.endsWith("/")) {
                            file.type = "directory";
                        }
                        return file;
                    },
                }
            );
        })
    );

    // List the wheels
    const downloaded_pkgs = await fs.readdir(js_dist_folder);
    await Promise.all(
        js_dist_folders.map((artifact) =>
            fs.rm(`${js_dist_folder}/${artifact.name}.zip`)
        )
    );

    // Print out our results, and what we expected
    console.log(
        `Found ${downloaded_pkgs.length} pkgs, expected ${gh_js_dist_folders.length}`
    );

    // If they vary (e.g. a partial run), ask the user if they're sure
    // they want to proceed
    proceed = "y";
    if (downloaded_wheels.length !== wheels.length + 1) {
        proceed = "n";
        proceed = await askQuestion("Proceed? (y/N)");
    }
    if (proceed === "y") {
        const pypi = downloaded_wheels.join("\n\t");
        const npm = gh_js_dist_folders.join("\n\t");
        console.log(
            `Uploading to pypi:\n\t${pypi}\nUploading to npm:\n\t${npm}`
        );
        if (!process.env.COMMIT) {
            console.error(
                "Skipping twine/npm upload, marked as dry run.\nSet env var COMMIT=1 to run fo real."
            );
        } else {
            sh`twine upload ${wheel_folder}/*`.runSync();
            for (const name of gh_js_dist_folders) {
                const path = gh_js_dist_aliases[name]
                    .split("/")
                    .slice(0, -1)
                    .join("/");

                const pkg = JSON.parse(
                    await fs.readFile(`${path}/package.json`)
                );

                sh`npm --workspace ${pkg.name} publish`.runSync();
            }
        }
    }
}
