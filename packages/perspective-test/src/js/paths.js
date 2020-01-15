/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");
const path = require("path");

module.exports.IS_LOCAL_PUPPETEER = fs.existsSync(path.join(__dirname, "..", "..", "..", "..", "node_modules", "puppeteer"));
module.exports.RESULTS_TAGNAME = `${process.platform}${module.exports.IS_LOCAL_PUPPETEER ? (process.env.PSP_PAUSE_ON_FAILURE ? ".interactive" : "") : ".docker"}`;
module.exports.RESULTS_FILENAME = `${module.exports.RESULTS_TAGNAME}.json`;
