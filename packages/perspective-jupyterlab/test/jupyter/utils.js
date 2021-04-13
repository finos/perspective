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
const rimraf = require("rimraf");
const notebook_template = require("./notebook_template.json");

const DIST_ROOT = path.join(__dirname, "..", "..", "dist", "umd");
const TEST_CONFIG_ROOT = path.join(__dirname, "..", "config", "jupyter");

const remove_jupyter_artifacts = () => {
    rimraf(path.join(TEST_CONFIG_ROOT, "lab"), () => {});
    rimraf(path.join(DIST_ROOT, ".ipynb_checkpoints"), () => {});
};

/**
 * Generate a new Jupyter notebook using the standard JSON template, and
 * save it into dist/umd so that the tests can use the resulting notebook.
 *
 * @param {String} notebook_name
 * @param {Array<String>} cells
 */
const generate_notebook = (notebook_name, cells) => {
    const notebook_path = path.join(DIST_ROOT, notebook_name);

    // deepcopy the notebook template so we are not modifying a shared object
    const nb = JSON.parse(JSON.stringify(notebook_template));

    // import perspective, set up test data etc.
    nb["cells"] = [
        {
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: ["import perspective\n", "import pandas as pd\n", "import numpy as np\n", "arrow_data = None\n", "with open('test.arrow', 'rb') as arrow: \n    arrow_data = arrow.read()"]
        }
    ];

    // Cells defined in the test as an array of arrays - each inner array
    // is a new cell to be added to the notebook.
    for (const cell of cells) {
        nb["cells"].push({
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: cell
        });
    }

    // Write the notebook to dist/umd, which acts as the working directory
    // for the Jupyterlab test server.
    fs.writeFileSync(notebook_path, JSON.stringify(nb));
};

// Add Jupyterlab-specific bindings to the global Jest objects
describe.jupyter = (body, {name, root} = {}) => {
    if (!root) throw new Error("Jupyter tests require a test root!");

    // Remove the automatically generated workspaces directory, as it
    // will try to redirect single-document URLs to the last URL opened.
    beforeEach(remove_jupyter_artifacts);
    afterAll(remove_jupyter_artifacts);

    // URL is null because each test.capture_jupyterlab will have its own
    // unique notebook generated.
    return describe.page(null, body, {check_results: false, name: name, root: root});
};

/**
 * Execute body() on a Jupyter notebook without taking any screenshots.
 *
 * @param {*} name
 * @param {*} cells
 * @param {*} body
 */
test.jupyterlab = async (name, cells, body, args = {}) => {
    const notebook_name = `${name.replace(/[ \.']/g, "_")}.ipynb`;
    generate_notebook(notebook_name, cells);
    args = Object.assign(args, {
        url: `doc/tree/${notebook_name}`
    });

    await test.run(name, body, args);
};

module.exports = {
    execute_all_cells: async page => {
        await page.waitForFunction(async () => !!document.title);
        await page.waitForSelector(".p-Widget", {visible: true});
        await page.waitForSelector(".jp-NotebookPanel-toolbar", {visible: true});
        await page.waitForTimeout(1000);

        // Use our custom keyboard shortcut to run all cells
        await page.keyboard.press("R");
        await page.keyboard.press("R");

        await page.evaluate(() => (document.scrollTop = 0));
    }
};
