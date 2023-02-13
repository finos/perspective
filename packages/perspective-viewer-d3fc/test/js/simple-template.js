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

const SIMPLE_TEMPLATE = "simple-template";
const DEFAULT_COLUMNS = ["Sales"];

const withTemplate = (
    name,
    view,
    { template = SIMPLE_TEMPLATE, columns = DEFAULT_COLUMNS } = {}
) => {
    const dir_name = path.join(__dirname, "..", "..", "..", "dist", "umd");
    const templateContent = fs.readFileSync(
        path.join(dir_name, `${template}.html`),
        "utf8"
    );
    const content = templateContent
        .replace("__view_name", view)
        .replace("__columns", JSON.stringify(columns));
    fs.writeFileSync(path.join(dir_name, `${name}.html`), content);
};

module.exports = { withTemplate };
