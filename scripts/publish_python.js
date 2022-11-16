/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const { execute } = require("./script_utils.js");
const cp = require("cpy");
const decompress = require("decompress");
const decompressUnzip = require("decompress-unzip");
const fs = require("fs").promises;
const { Octokit } = require("octokit");
const readline = require("readline");

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
        "Running a dry run, this WILL NOT publish to pypi. Set the env var COMMIT to publish."
    );
}

// Folders for artifacts on GitHub Actions
const dist_folders = [
    // // https://github.com/actions/virtual-environments

    // Mac 11
    "perspective-python-dist-macos-11-3.8",
    "perspective-python-dist-macos-11-3.9",
    "perspective-python-dist-macos-11-3.10",
    "perspective-python-dist-macos-11-3.11",

    // Ubuntu (Manylinux 2014 docker images)
    "perspective-python-dist-ubuntu-20.04-3.8",
    "perspective-python-dist-ubuntu-20.04-3.9",
    "perspective-python-dist-ubuntu-20.04-3.10",
    "perspective-python-dist-ubuntu-20.04-3.11",

    // Windows 2019 (No 3.6 on windows)
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

    "perspective-python-sdist",
];

// Artifacts inside those folders
const wheels = [
    // Mac 11
    "cp38-cp38-macosx_11_0_x86_64",
    "cp39-cp39-macosx_11_0_x86_64",
    "cp310-cp310-macosx_11_0_x86_64",
    "cp311-cp311-macosx_11_0_x86_64",

    // Manylinux 2014
    "cp38-cp38-manylinux2014_x86_64",
    "cp39-cp39-manylinux2014_x86_64",
    "cp310-cp310-manylinux2014_x86_64",
    "cp311-cp311-manylinux2014_x86_64",

    // Windows (use 2019)
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
function askQuestion(query) {
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

(async function () {
    try {
        // Page to fetch
        let page = 1;
        let resp;

        // assets loaded
        let python_dist_folders = [];
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
                    (artifact) => dist_folders.indexOf(artifact.name) >= 0
                ),
            ];

            page += 1;
        } while (!resp || resp.data.artifacts.length > 0);

        // Print out our results, and what we expected
        console.log(
            `Found ${python_dist_folders.length} python folders, expected ${dist_folders.length}`
        );

        // If they vary (e.g. a partial run), ask the user if they're sure
        // they want to proceed
        let proceed = "y";
        if (python_dist_folders.length !== dist_folders.length) {
            proceed = "n";
            proceed = await askQuestion("Proceed? (y/N)");
        }

        // If everything good, or they say they want to proceed,
        // pull the artifacts locally into a temp folder
        if (proceed.toLowerCase() === "y") {
            const dist_folder = `perspective-wheel-dist-${process.env.GITHUB_WORKFLOW_ID}`;
            const wheel_folder = `perspective-wheel-dist-${process.env.GITHUB_WORKFLOW_ID}/wheels`;

            // Remove if exists
            await fs.rm(dist_folder, {
                recursive: true,
                force: true,
            });

            // Make directories
            await fs.mkdir(dist_folder);
            await fs.mkdir(wheel_folder);

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

                    // Write out the zip file
                    await fs.appendFile(
                        `${dist_folder}/${artifact.name}.zip`,
                        Buffer.from(download.data)
                    );
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

            // If they vary (e.g. a partial run), ask the user if they're sure
            // they want to proceed
            proceed = "y";
            if (downloaded_wheels.length !== wheels.length + 1) {
                proceed = "n";
                proceed = await askQuestion("Proceed? (y/N)");
            }

            if (proceed === "y") {
                if (!process.env.COMMIT) {
                    console.log(
                        `Uploading:\n\t${downloaded_wheels.join("\n\t")}`
                    );
                    console.error(
                        "Skipping twine upload, marked as dry run.\nSet env var COMMIT=1 to run fo real."
                    );
                } else {
                    execute`twine upload ${wheel_folder}/*`;
                }
            }
        }
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
})();
