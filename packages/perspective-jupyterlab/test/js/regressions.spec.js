/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const packagejson = require("../../package.json");
const webpackjson = require("../../src/config/plugin.config.js");

describe("output test", () => {
    test("ensure valid jupyterlab output", () => {
        expect(packagejson.main).toEqual("dist/index.js");
        expect(webpackjson.output.filename).toEqual("index.js");
        expect(webpackjson.output.path).toEqual(path.resolve(__dirname, "../../dist"));
        console.log(webpackjson);
    });
});
