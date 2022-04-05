/******************************************************************************
 *
 * Copyright (c) 2022, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");

const MAX_TRY = 5;
const SLEEP_INTERVAL = 1000 * 60 * 5;

import("node-fetch").then(async ({default: fetch}) => {
    if (process.argv.length < 4) {
        throw "Must provide output and buildId";
    }
    const buildId = process.argv[2];
    const outputDir = process.argv[3];

    let count = 0;
    while (count < MAX_TRY) {
        try {
            // Fetch job data
            const res = await fetch(
                `https://dev.azure.com/finosfoundation/perspective/_apis/build/builds/${buildId}/artifacts?artifactName=perspective-jupyterlab-dist`
            );

            // get the data
            const data = await res.json();

            // extract the download url
            const downloadUrl = data.resource.downloadUrl;

            // fetch the asset
            const zipFile = await fetch(downloadUrl);

            // extract the data
            // const zipFileData = await zipFile.arrayBuffer();
            const fileStream = fs.createWriteStream(
                `${outputDir}/perspective-jupyterlab-dist.zip`
            );

            // pipe to file
            await zipFile.body.pipe(fileStream);

            // don't try again
            count = MAX_TRY;
        } catch (e) {
            // log error
            console.error(`error ${e}, retrying...`);

            // increment try count
            count += 1;

            // sleep
            await new Promise((resolve) => setTimeout(resolve, SLEEP_INTERVAL));
        }
    }
});
