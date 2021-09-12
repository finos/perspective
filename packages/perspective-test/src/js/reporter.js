/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const paths = require("./paths.js");
const fs = require("fs");
const termimg = require("term-img");

module.exports = class ImageViewerReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig;
        this._options = options;
    }

    write_img_fallback(filename) {
        process.stdout.write("   <" + filename + ">\n");
    }

    write_img(title, ancestors, filename) {
        if (fs.existsSync(filename)) {
            process.stdout.write(
                `\n    ${ancestors.join(" > ")} > ${title}\n\n    `
            );
            termimg(filename, {
                width: "640px",
                height: "480px",
                fallback: () => this.write_img_fallback(filename),
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
                const name = test.title.replace(/[ \.']/g, "_");
                let desc = test.fullName
                    .replace(".html", "")
                    .replace(/ /g, "_");
                desc = desc.slice(0, desc.length - name.length - 1);
                const candidates = [
                    `${testRunConfig.path.split("/test")[0]}/test/screenshots/${
                        paths.RESULTS_TAGNAME
                    }/${desc}/${name}.diff.png`,
                    `test/screenshots/${desc}/${name}.diff.png`,
                    `${testRunConfig.path.split("/test")[0]}/test/screenshots/${
                        paths.RESULTS_TAGNAME
                    }/${desc}/${name}.failed.png`,
                    `test/screenshots/${desc}/${name}.failed.png`,
                    `${testRunConfig.path.split("/test")[0]}/test/screenshots/${
                        paths.RESULTS_TAGNAME
                    }/${desc}/${name}.png`,
                    `test/screenshots/${desc}/${name}.png`,
                ];

                for (const filename of candidates) {
                    if (fs.existsSync(filename)) {
                        this.write_img(
                            test.title,
                            test.ancestorTitles,
                            filename
                        );
                        break;
                    }
                }
            }
        }
    }
};
