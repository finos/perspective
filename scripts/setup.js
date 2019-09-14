/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;
const execute = cmd => execSync(cmd, {stdio: "inherit"});

const inquirer = require("inquirer");
const fs = require("fs");

const CONFIG = new Proxy(
    new (class {
        constructor() {
            this.config = [];
            this._values = require("dotenv").config({path: "./.perspectiverc"}).parsed || {};
        }

        add(new_config) {
            for (const key in new_config) {
                if (new_config[key] !== "") {
                    this._values[key] = new_config[key];
                    this.config.push(`${key}=${new_config[key]}`);
                }
            }
        }

        write() {
            fs.writeFileSync("./.perspectiverc", this.config.join("\n"));
            if (process.env.PSP_BUILD_IMMEDIATELY) {
                execute("node scripts/build.js");
            }
        }
    })(),
    {
        set: function(target, name, val) {
            target.add({[name]: val});
        },
        get: function(target, name) {
            if (name in target._values) {
                return target._values[name];
            } else {
                return target[name];
            }
        }
    }
);

function focus_package() {
    inquirer
        .prompt([
            {
                type: "expand",
                name: "PACKAGE",
                message: "Focus NPM package?",
                default: CONFIG["PACKAGE"] || "h",
                choices: [
                    {
                        key: "a",
                        name: "(all)",
                        value: ""
                    },
                    {
                        key: "p",
                        name: "perspective",
                        value: "perspective"
                    },
                    {
                        key: "v",
                        name: "perspective-viewer",
                        value: "perspective-viewer"
                    },
                    {
                        key: "g",
                        name: "perspective-viewer-hypergrid",
                        value: "perspective-viewer-hypergrid"
                    },
                    {
                        key: "d",
                        name: "perspective-viewer-d3fc",
                        value: "perspective-viewer-d3fc"
                    },
                    {
                        key: "c",
                        name: "perspective-viewer-highcharts",
                        value: "perspective-viewer-highcharts"
                    }
                ]
            }
        ])
        .then(new_config => {
            CONFIG.add(new_config);
            CONFIG.write();
        });
}

function main() {
    inquirer
        .prompt([
            {
                type: "expand",
                name: "PSP_PROJECT",
                message: "Focus (J)avascript, (P)ython, (C)++, (A)ll?",
                default: CONFIG["PSP_PROJECT"] || "js",
                choices: [
                    {
                        key: "j",
                        name: "Javascript",
                        value: "js"
                    },
                    {
                        key: "p",
                        name: "python",
                        value: "python"
                    },
                    {
                        key: "c",
                        name: "C++",
                        value: "cpp"
                    },

                    {
                        key: "a",
                        name: "(all)",
                        value: ""
                    }
                ]
            }
        ])
        .then(answers => {
            CONFIG.add(answers);
            if (CONFIG.PSP_PROJECT === "js") {
                focus_package();
            } else {
                CONFIG.write();
            }
        });
}

main();
