const puppeteer = require("puppeteer");
const fs = require("fs");
const cp = require("child_process");
const {EXAMPLES} = require("./features.js");

const DEFAULT_VIEWPORT = {
    width: 400,
    height: 300,
};

async function run_with_theme(page, is_dark = false) {
    await page.goto("http://localhost:8080/");
    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
    <script src="/node_modules/@finos/perspective/dist/umd/perspective.js"></script>
    <script src="/node_modules/@finos/perspective-viewer/dist/umd/perspective-viewer.js"></script>
    <script src="/node_modules/@finos/perspective-viewer-datagrid/dist/umd/perspective-viewer-datagrid.js"></script>
    <script src="/node_modules/@finos/perspective-viewer-d3fc/dist/umd/perspective-viewer-d3fc.js"></script>
    <link rel='stylesheet' href="/node_modules/@finos/perspective-viewer/dist/css/material${
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
    </style>
</head>
<body>
    <perspective-viewer editable>
    </perspective-viewer>
    <script>
        const WORKER = window.perspective.worker();
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
            xhr.open('GET', '/node_modules/superstore-arrow/superstore.arrow', true);
            xhr.responseType = "arraybuffer"
            xhr.onload = on_load.bind(xhr);
            xhr.send(null);
        });
    </script>
</body>
</html>`);
    await page.setViewport(DEFAULT_VIEWPORT);
    await page.evaluate(async function () {
        const viewer = document.querySelector("perspective-viewer");
        await viewer.flush();
        await viewer.toggleConfig();
    });

    // await page.waitFor(3000);
    // let html = [];
    for (const idx in EXAMPLES) {
        const {config, viewport} = EXAMPLES[idx];
        await await page.setViewport(viewport || DEFAULT_VIEWPORT);
        const new_config = Object.assign(
            {
                plugin: "Datagrid",
                group_by: [],
                expressions: [],
                split_by: [],
                sort: [],
                aggregates: {},
            },
            config
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
        fs.writeFileSync(name, screenshot);
        cp.execSync(`convert ${name} -resize 400x300 ${name}`);
        // html.push(`<img src="./test_${idx}.png"></img>`);
    }

    // fs.writeFileSync("features/index.html", `<html><style>img{width:200px;height:150px;</style><body>${html.join("")}</body></html>`);
}

async function run() {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await run_with_theme(page);
    await run_with_theme(page, true);
    await browser.close();
}

run();
