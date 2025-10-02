// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const notebook_template = JSON.parse(
    fs.readFileSync(__dirname + "/notebook_template.json", {
        encoding: "utf-8",
    }),
);

const DIST_ROOT = path.join(__dirname, "..", "..", "dist", "esm");
const TEST_CONFIG_ROOT = path.join(__dirname, "..", "config", "jupyter");

const remove_jupyter_artifacts = () => {
    fs.rmSync(path.join(TEST_CONFIG_ROOT, "lab"), {
        recursive: true,
        force: true,
    });

    fs.rmSync(path.join(DIST_ROOT, ".ipynb_checkpoints"), {
        recursive: true,
        force: true,
    });
};

/**
 * Generate a new Jupyter notebook using the standard JSON template, and
 * save it into dist/esm so that the tests can use the resulting notebook.
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
            metadata: {},
            execution_count: null,
            outputs: [],
            source: [
                "import perspective\n",
                "import perspective.widget\n",
                "import pandas as pd\n",
                "import numpy as np\n",
                "arrow_data = None\n",
                "with open('test.arrow', 'rb') as arrow: \n    arrow_data = arrow.read()",
            ],
        },
    ];

    // Cells defined in the test as an array of arrays - each inner array
    // is a new cell to be added to the notebook.
    for (const cell of cells) {
        nb["cells"].push({
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: cell,
        });
    }

    // Write the notebook to dist/esm, which acts as the working directory
    // for the Jupyterlab test server.
    fs.writeFileSync(notebook_path, JSON.stringify(nb));
};

// Add Jupyterlab-specific bindings to the global Jest objects
export function describe_jupyter(body, { name, root } = {}) {
    // Remove the automatically generated workspaces directory, as it
    // will try to redirect single-document URLs to the last URL opened.
    test.beforeEach(remove_jupyter_artifacts);
    test.afterAll(remove_jupyter_artifacts);

    // URL is null because each test.capture_jupyterlab will have its own
    // unique notebook generated.
    return test.describe(`Blank Notebook`, body);
}

/**
 * Execute body() on a Jupyter notebook without taking any screenshots.
 *
 * @param {*} name
 * @param {*} cells
 * @param {*} body
 */
export function test_jupyter(name, cells, body) {
    const notebook_name = `${name.replace(/[ \.']/g, "_")}.ipynb`;
    generate_notebook(notebook_name, cells);
    const url = `doc/tree/${notebook_name}`;
    test(name, async ({ page }) => {
        await page.goto(
            `http://127.0.0.1:${process.env.__JUPYTERLAB_PORT__}/${url}`,
            { waitUntil: "domcontentloaded" },
        );
        await body({ page });
    });
}

export async function default_body(page) {
    await execute_all_cells(page);
    const viewer = await page.waitForSelector(
        ".jp-OutputArea-output perspective-viewer",
        { visible: true },
    );
    await viewer.evaluate(async (viewer) => await viewer.flush());
    return viewer;
}
export async function execute_all_cells(page) {
    await page.waitForFunction(async () => !!document.title);
    await page.waitForSelector(".lm-Widget", { visible: true });
    await page.waitForSelector(".jp-NotebookPanel-toolbar", {
        visible: true,
    });

    // wait for a cell to be active
    try {
        await page.waitForSelector(
            '.jp-Notebook-ExecutionIndicator:not([data-status="idle"])',
            { timeout: 1000 },
        );
    } catch (e) {}
    // await new Promise((x) => setTimeout(x, 2000));

    await page.waitForSelector(
        '.jp-Notebook-ExecutionIndicator[data-status="idle"]',
    );

    // Use our custom keyboard shortcut to run all cells
    await page.keyboard.press("R");
    await page.keyboard.press("R");
    await page.evaluate(() => (document.scrollTop = 0));
}

export async function add_and_execute_cell(page, cell_content) {
    // wait for a code cell to be visible
    await page.waitForSelector(".jp-CodeCell", {
        visible: true,
    });

    // find and click the a cell in the notebook
    await page.click(".jp-CodeCell");
    await new Promise((x) => setTimeout(x, 100));
    // find and click the "new cell" button
    await page.click('jp-button[data-command="notebook:insert-cell-below"]');
    await new Promise((x) => setTimeout(x, 100));
    // after clicking new cell, the document will auto
    // focus the new cell, so lets grab it
    const el = await page.evaluateHandle(() => document.activeElement);
    await el.type(cell_content);

    await new Promise((x) => setTimeout(x, 100));
    // now while the element is still focused, click the run cell button
    await page.click(
        'jp-button[data-command="notebook:run-cell-and-select-next"]',
    );
    await new Promise((x) => setTimeout(x, 100));
    // wait for kernel to stop running
    // await page.waitForSelector(
    //     "//div.jp-InputPrompt[contains(text(),'[*]:')]",
    //     {
    //         hidden: true,
    //     }
    // );
}
export async function assert_no_error_in_cell(page, cell_content) {
    // run the cell
    await add_and_execute_cell(page, cell_content);

    // wait for jupyter to render any frontend exceptions
    return await Promise.race([
        page
            .waitForSelector(
                'div[data-mime-type="application/vnd.jupyter.stderr"]',
            )
            .then(() => false),
        page
            .waitForSelector("//div//pre[contains(text(),\"'Passed'\")]")
            .then(() => true),
    ]);
}
