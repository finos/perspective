/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");
const crypto = require("crypto");
const puppeteer = require("puppeteer");

const cons = require("console");
const private_console = new cons.Console(process.stdout, process.stderr);
const cp = require("child_process");

const {WebSocketHost} = require("@jpmorganchase/perspective");

let __PORT__;

exports.with_server = function with_server({paths}, body) {
    let server;
    beforeAll(() => {
        server = new WebSocketHost({
            assets: paths || ["build"],
            port: 0,
            on_start: () => {
                __PORT__ = server._server.address().port;
            }
        });
    });

    afterAll(() => server.close());

    body();
};

const results = (() => {
    if (fs.existsSync("test/results/results.json")) {
        return JSON.parse(fs.readFileSync("test/results/results.json"));
    } else {
        return {};
    }
})();

const new_results = {};

if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots");
}

let browser,
    page,
    url,
    errors = [],
    __name = "";

beforeAll(async () => {
    browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", '--proxy-server="direct://"', "--proxy-bypass-list=*"]});
    page = await browser.newPage();

    // CSS Animations break our screenshot tests, so set the
    // animation playback rate to something extreme.
    await page._client.send("Animation.setPlaybackRate", {playbackRate: 100.0});
    page.on("console", msg => {
        let text;
        if ({}.toString.call(msg.text) === "[object Function]") {
            text = msg.text();
        } else {
            text = msg.text;
        }
        if (msg.type() === "error") {
            errors.push(text);
            private_console.log(`${__name}: ${text}\n`);
        }
    });
    page.on("pageerror", msg => {
        errors.push(msg.message);
        private_console.log(`${__name}: ${msg.message}`);
    });
});

afterAll(() => {
    browser.close();
    if (process.env.WRITE_TESTS) {
        const results2 = (() => {
            if (fs.existsSync("test/results/results.json")) {
                return JSON.parse(fs.readFileSync("test/results/results.json"));
            } else {
                return {};
            }
        })();
        for (let key of Object.keys(new_results)) {
            results2[key] = new_results[key];
        }
        fs.writeFileSync("test/results/results.json", JSON.stringify(results2, null, 4));
    }
});

describe.page = (_url, body) => {
    if (!fs.existsSync("screenshots/" + _url.replace(".html", ""))) {
        fs.mkdirSync("screenshots/" + _url.replace(".html", ""));
    }
    describe(_url, () => {
        let old = url;
        url = _url;
        let result = body();
        url = old;
        return result;
    });
};

test.run = function run(name, body, viewport = null) {
    let _url = url;
    test(name, async () => {
        if (viewport !== null)
            await page.setViewport({
                width: viewport.width,
                height: viewport.height
            });

        await new Promise(setTimeout);
        await page.goto(`http://127.0.0.1:${__PORT__}/${_url}`);
        await page.waitForSelector("perspective-viewer:not([updating])");
        const body_results = await body(page);
        expect(body_results).toBe(true);
    });
};

test.capture = function capture(name, body, timeout = 60000, viewport = null, wait_for_update = true) {
    let _url = url;
    test(
        name,
        async () => {
            errors = [];
            __name = name;

            if (viewport !== null)
                await page.setViewport({
                    width: viewport.width,
                    height: viewport.height
                });

            await new Promise(setTimeout);
            await page.goto(`http://127.0.0.1:${__PORT__}/${_url}`);
            const viewer_selector = wait_for_update ? "perspective-viewer:not([updating])" : "perspective-viewer";
            await page.waitForSelector(viewer_selector);

            await body(page);

            // let animation run;
            await page.waitForSelector(viewer_selector);

            const screenshot = await page.screenshot();
            // await page.close();
            const hash = crypto
                .createHash("md5")
                .update(screenshot)
                .digest("hex");
            const filename = `screenshots/${_url.replace(".html", "")}/${name.replace(/ /g, "_").replace(/[\.']/g, "")}`;
            if (hash === results[_url + "/" + name]) {
                fs.writeFileSync(filename + ".png", screenshot);
            } else {
                fs.writeFileSync(filename + ".failed.png", screenshot);
                if (fs.existsSync(filename + ".png")) {
                    cp.execSync(`composite ${filename}.png ${filename}.failed.png -compose difference ${filename}.diff.png`);
                    cp.execSync(`convert ${filename}.diff.png -auto-level ${filename}.diff.png`);
                }
            }
            if (process.env.WRITE_TESTS) {
                new_results[_url + "/" + name] = hash;
            }
            expect(errors).toEqual([]);
            expect(hash).toBe(results[_url + "/" + name]);
        },
        timeout
    );
};

exports.drag_drop = async function drag_drop(page, origin, target) {
    const element = await page.$(origin);
    const box = await element.boundingBox();
    process.stdout.write(element, box);
    const element2 = await page.$(target);
    const box2 = await element2.boundingBox();
    process.stdout.write(element2, box2);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {steps: 100});
    await page.mouse.down();
    await page.waitFor(1000);
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, {steps: 100});
    await page.mouse.up();
};

exports.invoke_tooltip = async function invoke_tooltip(svg_selector, page) {
    const viewer = await page.$("perspective-viewer");
    const handle = await page.waitFor(
        (viewer, selector) => {
            const elem = viewer.shadowRoot.querySelector("perspective-highcharts").shadowRoot.querySelector(selector);
            if (elem) {
                return elem;
            }
        },
        {},
        viewer,
        svg_selector
    );
    const box = await handle.asElement().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await handle.asElement().hover();
    await page.waitFor(
        element => {
            let elem = element.shadowRoot.querySelector("perspective-highcharts").shadowRoot.querySelector(".highcharts-label.highcharts-tooltip");
            if (elem) {
                return (
                    window.getComputedStyle(elem).opacity !== "0" &&
                    elem.querySelector("text tspan").textContent.indexOf("Loading") === -1 &&
                    elem.querySelector("text tspan").textContent.trim() !== ""
                );
            }
        },
        {},
        viewer
    );
};

exports.render_warning = {
    set_warning_threshold: async function(page, plugin_name, threshold) {
        await page.evaluate(() => {
            window.getPlugin(plugin_name).max_size = threshold;
        });
    },
    wait_for_warning: async function(page, viewer) {
        await page.waitForFunction(
            element => {
                return !element.shadowRoot.querySelector(".plugin_information.hidden");
            },
            {},
            viewer
        );
    }
};
