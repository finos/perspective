/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const cp = require("child_process");
const fs = require("fs");
const termimg = require("term-img");

module.exports = class ImageViewerReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
    }

    write_img_fallback(filename) {
        process.stdout.write("\r");
        const diff = cp
            .execSync(`tiv -h 60 -w 80 ${filename} 2>&1`)
            .toString()
            .replace(/Warning.+?$/g, "");
        process.stdout.write(diff);
        process.stdout.write("\n");
    }

    write_img(title, ancestors, filename) {
        if (fs.existsSync(filename)) {
            process.stdout.write(`\n    ${ancestors.join(" > ")} > ${title}\n\n    `);
            termimg(filename, {
                width: "320px",
                height: "240px",
                fallback: () => this.write_img_fallback(filename)
            });
            process.stdout.write("\n");
        }
    }

    /**
     * Runs `tiv` to dump diff images to console in blurry format.
     */
    onTestResult(testRunConfig, testResults) {
        for (const test of testResults.testResults) {
            if (test.status === "failed") {
                const ancestors = test.ancestorTitles.filter(x => x.indexOf(".html") > -1).map(x => x.replace(".html", "").replace(/ /g, "_"));
                const desc = ancestors.join("/");
                const name = test.title.replace(/ /g, "_").replace(/[\.']/g, "");
                const filename = `${testRunConfig.path.split("/test")[0]}/screenshots/${desc}/${name}.diff.png`;
                const alt_filename = `screenshots/${desc}/${name}.diff.png`;
                if (filename) {
                    this.write_img(test.title, ancestors, filename);
                } else if (fs.existsSync(alt_filename)) {
                    this.write_img(test.title, ancestors, alt_filename);
                }
            }
        }
    }
};
