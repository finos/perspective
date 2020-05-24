/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const lernajson = require("../lerna.json");
const {execute, resolve, bash} = require("./script_utils.js");
const fs = require("fs-extra");
const tar = require("tar");
const rimraf = require("rimraf");

/**
 * Using Perspective's docker images, create a wheel built for the image
 * architecture and output it to the local filesystem.
 */
try {
    console.log("Downloading assets");

    const labextension_folder = resolve`${__dirname}/../python/perspective/perspective/labextension`;
    const nbextension_folder = resolve`${__dirname}/../python/perspective/perspective/nbextension/static`;

    const package_name = `@finos/perspective-jupyterlab@${lernajson.version}`;
    const tarball_name = `finos-perspective-jupyterlab-${lernajson.version}.tgz`;

    console.log(`Removing ${labextension_folder} for labextension...`);
    rimraf.sync(labextension_folder);
    console.log(`Removing ${nbextension_folder} for nbextension...`);
    rimraf.sync(nbextension_folder);

    console.log(`Creating ${labextension_folder} for labextension...`);
    fs.mkdirpSync(labextension_folder);
    console.log(`Creating ${nbextension_folder} for nbextension...`);
    fs.mkdirpSync(nbextension_folder);

    console.log(`Fetching ${package_name} for labextension...`);
    execute(bash`npm pack ${package_name}`);

    console.log(`Unpacking ${package_name} for nbextension...`);
    tar.extract({
        file: tarball_name,
        sync: true
    });

    console.log(`Moving tarball to labextension...`);
    fs.moveSync(`${tarball_name}`, resolve`${labextension_folder}/${tarball_name}`);

    console.log(`Moving files to nbextension...`);
    fs.moveSync(`package/dist/index.js`, resolve`${nbextension_folder}/index.js`);
    fs.moveSync(`package/dist/extension.js`, resolve`${nbextension_folder}/extension.js`);
    fs.moveSync(`package/dist/labextension.js`, resolve`${nbextension_folder}/labextension.js`);
    rimraf.sync("package");
} catch (e) {
    console.error(e.message);
    if (process.env.PERSPECTIVE_CI_SKIPJS) {
        console.log("Allowing JS bundling to fail in CI (files might have changed)");
        process.exit(0);
    } else {
        process.exit(1);
    }
}
