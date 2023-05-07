/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import tar from "tar";
import fs from "fs";
import path from "path";

export default async function run() {
    const RESULTS_PATH = path.join(__dirname, "../../results.tar.gz");
    try {
        if (fs.existsSync(RESULTS_PATH)) {
            console.log("Using results.tar.gz");
            await tar.extract({ file: RESULTS_PATH, gzip: true });
        }
    } catch (e) {
        console.error("Failed to untar results archives");
        fs.unlinkSync(RESULTS_PATH);
    }
}
