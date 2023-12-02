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

const puppeteer = require("puppeteer");
const fs = require("fs");
const cp = require("child_process");
const path = require("node:path");
const mkdirp = require("mkdirp");
const EXAMPLES = require("./src/components/ExampleGallery/features.js").default;
const { convert } = require("@finos/perspective-viewer/dist/cjs/migrate.js");

const { WebSocketServer } = require("@finos/perspective");

const DEFAULT_VIEWPORT = {
    width: 400,
    height: 300,
};

function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

async function run_with_theme(page, is_dark = false) {
    await page.goto("http://localhost:8080/");
    await page.setContent(template(is_dark));
    await page.setViewport(DEFAULT_VIEWPORT);
    await page.evaluate(async function () {
        const viewer = document.querySelector("perspective-viewer");
        await viewer.flush();
        await viewer.toggleConfig();
    });

    const files = [];
    for (const idx in EXAMPLES) {
        const { config, viewport } = EXAMPLES[idx];
        await await page.setViewport(viewport || DEFAULT_VIEWPORT);
        const new_config = convert(
            Object.assign(
                {
                    plugin: "Datagrid",
                    group_by: [],
                    expressions: {},
                    split_by: [],
                    sort: [],
                    aggregates: {},
                },
                config
            )
        );
        console.log(JSON.stringify(new_config));
        await page.evaluate(async (config) => {
            const viewer = document.querySelector("perspective-viewer");
            await viewer.reset();
            await viewer.restore(config);
        }, new_config);

        await page.waitForSelector("perspective-viewer:not([updating])");
        const screenshot = await page.screenshot({
            captureBeyondViewport: false,
            fullPage: true,
        });

        const name = `static/features/feature_${idx}${
            is_dark ? "_dark" : ""
        }.png`;

        files.push(name);
        fs.writeFileSync(name, screenshot);
        cp.execSync(`convert ${name} -resize 200x150 ${name}`);
    }

    cp.execSync(
        `montage -mode concatenate -tile 5x ${shuffle(files).join(
            " "
        )} static/features/montage${is_dark ? "_dark" : "_light"}.png`
    );

    // fs.writeFileSync("features/index.html", `<html><style>img{width:200px;height:150px;</style><body>${html.join("")}</body></html>`);
}

async function run() {
    if (!fs.existsSync("static/features")) {
        mkdirp(path.join(__dirname, "static/features"));
        const server = new WebSocketServer({
            assets: [path.join(__dirname, "..")],
        });

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await run_with_theme(page);
        await run_with_theme(page, true);
        await page.close();
        await browser.close();
        await server.close();
    }

    // TODO There is a typescript module annoyingly called `blocks`.
    if (!fs.existsSync("static/blocks")) {
        fs.mkdirSync("static/blocks");
    }

    const { dist_examples } = await import("../examples/blocks/index.mjs");
    await dist_examples(`${__dirname}/static/blocks`);
}

function template(is_dark) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
        <script type="module" src="/node_modules/@finos/perspective-viewer/dist/cdn/perspective-viewer.js"></script>
        <script type="module" src="/node_modules/@finos/perspective-viewer-datagrid/dist/cdn/perspective-viewer-datagrid.js"></script>
        <script type="module" src="/node_modules/@finos/perspective-viewer-d3fc/dist/cdn/perspective-viewer-d3fc.js"></script>
        <link rel='stylesheet' href="/node_modules/@finos/perspective-viewer/dist/css/pro${
            is_dark ? "-dark" : ""
        }.css">
        <style>
            perspective-viewer {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }
            perspective-viewer[theme="Pro Light"] {
                --plugin--background:#f2f4f6
            }
        </style>
    </head>
    <body>
        <perspective-viewer editable>
        </perspective-viewer>
        <script type="module">
            import perspective from "/node_modules/@finos/perspective/dist/cdn/perspective.js";
            const WORKER = perspective.worker();
            async function on_load() {
                var el = document.getElementsByTagName('perspective-viewer')[0];
                const plugin = await el.getPlugin("Heatmap");
                plugin.render_warning = false;
                const table = WORKER.table(this.response);
                el.load(table);
                el.toggleConfig();
            }
            window.addEventListener('DOMContentLoaded', function () {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '/node_modules/superstore-arrow/superstore.lz4.arrow', true);
                xhr.responseType = "arraybuffer"
                xhr.onload = on_load.bind(xhr);
                xhr.send(null);
            });
        </script>
    </body>
    </html>`.trim();
}

run();
