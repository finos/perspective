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

const host = new WebSocketHost(3000);
const arr = fs.readFileSync(__dirname +'/../../build/superstore.arrow');

host.open("superstore.arrow", arr);