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
    if (fs.existsSync("../../results.tar.gz")) {
        console.log("\nReplacing results.tar.gz");
    } else {
        console.log("\nCreating results.tar.gz");
    }

    // https://github.com/isaacs/node-tar/issues/176#issuecomment-391904257
    await new Promise((x) =>
        tar.create(
            {
                gzip: true,
                file: path.join(__dirname, "../../results.tar.gz"),
                sync: false,
                portable: true,
                noMtime: true,
                filter: (path, stat) => {
                    stat.mtime = null;
                    stat.atime = null;
                    stat.ctime = null;
                    stat.birthtime = null;
                    return (
                        !path.startsWith(".DS_Store") &&
                        (fs.lstatSync(path).isDirectory() ||
                            path.endsWith(".hash.txt"))
                    );
                },
            },
            ["tools/perspective-test/dist/snapshots"],
            x
        )
    );

    if (fs.existsSync(`../../dist/results.tar.gz`)) {
        console.log("Replacing results.debug.tar.gz");
    } else {
        console.log("Creating results.debug.tar.gz");
    }

    await new Promise((x) =>
        tar.create(
            {
                gzip: true,
                file: path.join(__dirname, "../../dist/results.debug.tar.gz"),
                sync: false,
                portable: true,
                noMtime: true,
                filter: (path, stat) => {
                    stat.mtime = null;
                    stat.atime = null;
                    stat.ctime = null;
                    stat.birthtime = null;
                    return (
                        !path.startsWith(".DS_Store") &&
                        (fs.lstatSync(path).isDirectory() ||
                            !path.endsWith(".hash.txt"))
                    );
                },
            },
            ["tools/perspective-test/dist/snapshots"],
            x
        )
    );
}
