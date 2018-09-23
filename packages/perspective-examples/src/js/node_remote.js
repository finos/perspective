/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketHost} = require("@jpmorganchase/perspective/build/perspective.node.js");
const fs = require("fs");

const host = new WebSocketHost({rootDir: __dirname});
const arr = fs.readFileSync(__dirname + "/superstore.arrow");

host.open("data_source_one", arr);
