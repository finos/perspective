/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {execute} = require("./script_utils.js");
const fs = require("fs");
var http = require("https");
const cpy = require("cpy");

if (!process.env.AZURE_TOKEN) {
    throw new Error("Missing AZURE_TOKEN");
}

if (!process.env.AZURE_BUILD_ID) {
    throw new Error("Missing AZURE_BUILD_ID");
}

if (!process.env.GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN");
}

async function get(host, path, binary = false) {
    return await new Promise((resolve) => {
        const callback = function (response) {
            if (response.statusCode !== 200) {
                console.log(response.statusCode);
            }

            let str = [];
            response.on("data", function (chunk) {
                str.push(chunk);
            });

            response.on("end", function () {
                if (binary) {
                    resolve(Buffer.concat(str));
                } else {
                    resolve(str.join(""));
                }
            });
        };

        const opts = {
            host,
            path,
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        "user:" + process.env.AZURE_TOKEN,
                        "utf8"
                    ).toString("base64"),
            },
        };

        http.request(opts, callback).end();
    });
}

try {
    const build = process.env.AZURE_BUILD_ID;
    const artifacts = [
        "cp37-cp37m-macosx_10_15_x86_64",
        "cp37-cp37m-manylinux2010_x86_64",
        "cp37-cp37m-manylinux2014_x86_64",
        "cp37-cp37m-win64_amd",
        "cp38-cp38-macosx_10_15_x86_64",
        "cp38-cp38-manylinux2010_x86_64",
        "cp38-cp38-manylinux2014_x86_64",
        "cp38-cp38m-win64_amd",
        "cp39-cp39-macosx_10_15_x86_64",
        "cp39-cp39-macosx_11_0_x86_64",
        "cp39-cp39-manylinux2010_x86_64",
        "cp39-cp39-manylinux2014_x86_64",
        "cp39-cp39m-win64_amd",
    ];

    (async function () {
        for (const artifact of artifacts) {
            console.log(`-- Downloading artifact "${artifact}"`);
            const path = `/finosfoundation/perspective/_apis/pipelines/1/runs/${build}/artifacts?artifactName=${artifact}&$expand=signedContent&api-version=6.0-preview.1`;
            const x = await get("dev.azure.com", path);
            const json = JSON.parse(x);
            const url = new URL(json.signedContent.url);
            const buff = await get(url.host, url.pathname + url.search, true);
            fs.writeFileSync(`${artifact}.tar.gz`, buff, "binary");
            execute`ls -lah ${artifact}.tar.gz`;
            execute`tar -xzf ${artifact}.tar.gz`;
            const files = fs.readdirSync(artifact);
            for (const file of files) {
                if (file.endsWith(".whl")) {
                    console.log(`-- Uploading artifact "${file}"`);
                    execute`twine upload ${artifact}/${file}`;
                    break;
                }
            }

            fs.rmdirSync(artifact, {recursive: true, force: true});
        }

        // publish is run after version, so any package.json has the right version
        const pkg_json = require("@finos/perspective/package.json");
        const PERSPECTIVE_VERSION = pkg_json.version;

        // Python publish
        console.log(`-- Building "perspective-python" ${PERSPECTIVE_VERSION}`);
        fs.writeFileSync("./.perspectiverc", `PSP_PROJECT=python`);
        require("dotenv").config({path: "./.perspectiverc"});
        execute`yarn clean --deps`;
        execute`yarn build`;

        // sdist into `python/perspective/dist`, and test the sdist as well.
        execute`cd ./python/perspective && ./scripts/build_sdist.sh`;
        const sdist_name = `perspective-python-${PERSPECTIVE_VERSION}.tar.gz`;

        console.log(
            `-- Uploading source distribution "${sdist_name}" to PyPi"`
        );
        execute`cd python/perspective && python3 -m twine upload ./dist/${sdist_name}`;
    })();
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
