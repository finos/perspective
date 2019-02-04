/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const perspective = require("@jpmorganchase/perspective").default;
require("./index.less");

require("@jpmorganchase/perspective-viewer");
require("@jpmorganchase/perspective-viewer-hypergrid");
require("@jpmorganchase/perspective-viewer-highcharts");

window.addEventListener("WebComponentsReady", () => {
    const worker = perspective.worker();
    const table = worker.table([{x: 1, y: 2}, {x: 2, y: 2}]);
    const elem = document.getElementsByTagName("perspective-viewer")[0];
    elem.load(table);
});
