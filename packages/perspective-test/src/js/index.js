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
const path = require("path");
const execSync = require("child_process").execSync;
const {track_mouse} = require("./mouse_helper.js");

const readline = require("readline");

const cons = require("console");
const private_console = new cons.Console(process.stdout, process.stderr);
const cp = require("child_process");

const {WebSocketServer} = require("@finos/perspective");

const {IS_LOCAL_PUPPETEER, RESULTS_TAGNAME, RESULTS_FILENAME} = require("./paths.js");

let __PORT__;

exports.with_server = function with_server({paths}, body) {
    let server;
    beforeAll(() => {
        if (test_root === "") {
            throw "ERROR";
        }
        server = new WebSocketServer({
            assets: paths || [path.join(test_root, "dist", "umd")],
            port: 0,
            on_start: () => {
                __PORT__ = server._server.address().port;
            }
        });
    });

    afterAll(() => server.close());

    body();
};

let results;
const seen_results = new Set();

const new_results = {};

let browser,
    page,
    page_url,
    page_reload,
    test_root = "",
    errors = [];

async function get_new_page() {
    page = await browser.newPage();

    page.track_mouse = track_mouse.bind(page);
    page.shadow_click = async function(...path) {
        await this.evaluate(path => {
            let elem = document;
            while (path.length > 0) {
                if (elem.shadowRoot) {
                    elem = elem.shadowRoot;
                }
                elem = elem.querySelector(path.shift());
            }

            function triggerMouseEvent(node, eventType) {
                var clickEvent = document.createEvent("MouseEvent");
                clickEvent.initEvent(eventType, true, true);
                node.dispatchEvent(clickEvent);
            }

            triggerMouseEvent(elem, "mouseover");
            triggerMouseEvent(elem, "mousedown");
            triggerMouseEvent(elem, "mouseup");
            triggerMouseEvent(elem, "click");
        }, path);
    };

    page.shadow_type = async function(content, ...path) {
        await this.evaluate(
            (content, path) => {
                let elem = document;
                while (path.length > 0) {
                    if (elem.shadowRoot) {
                        elem = elem.shadowRoot;
                    }
                    elem = elem.querySelector(path.shift());
                }

                elem.focus();

                function triggerKeyEvent(key, eventType) {
                    const keyEvent = new KeyboardEvent(eventType, {
                        bubbles: true,
                        cancelable: true,
                        key: key
                    });
                    document.dispatchEvent(keyEvent);
                }

                for (let i = 0; i < content.length; i++) {
                    const char = content[i];
                    triggerKeyEvent(char, "keydown");
                    triggerKeyEvent(char, "keyUp");
                    elem.value += char;
                }

                if (elem.value !== content) {
                    elem.value = content;
                }
            },
            content,
            path
        );
    };

    // CSS Animations break our screenshot tests, so set the
    // animation playback rate to something extreme.
    await page._client.send("Animation.setPlaybackRate", {playbackRate: 100.0});
    page.on("console", async msg => {
        if (msg.type() === "error" || msg.type() === "warn") {
            const args = await msg.args();
            args.forEach(async arg => {
                const val = await arg.jsonValue();
                // value is serializable
                if (JSON.stringify(val) !== JSON.stringify({})) console.log(val);
                // value is unserializable (or an empty oject)
                else {
                    const {type, subtype, description} = arg._remoteObject;
                    private_console.log(`${subtype}: ${description}`);
                    if (msg.type() === "error") errors.push(`${type}/${subtype}: ${description}`);
                }
            });
        }
    });
    page.on("pageerror", msg => {
        errors.push(msg.message);
    });
    return page;
}

beforeAll(async done => {
    try {
        browser = await puppeteer.connect({browserWSEndpoint: process.env.PSP_BROWSER_ENDPOINT});

        page = await get_new_page();

        results = (() => {
            const dir_name = path.join(test_root, "test", "results", RESULTS_FILENAME);
            if (fs.existsSync(dir_name)) {
                return JSON.parse(fs.readFileSync(dir_name));
            } else if (fs.existsSync(dir_name)) {
            } else {
                return {};
            }
        })();

        if (results.__GIT_COMMIT__) {
            const hash = execSync(`git cat-file -e ${results.__GIT_COMMIT__}`);
            if (!hash || hash.toString().length != 0) {
                private_console.error(`-- WARNING - Test results generated from non-existent commit ${results.__GIT_COMMIT__}.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        done();
    }
}, 30000);

afterAll(() => {
    try {
        if (process.env.WRITE_TESTS) {
            const dir_name = path.join(test_root, "test", "results", RESULTS_FILENAME);
            const results2 = (() => {
                if (fs.existsSync(dir_name)) {
                    return JSON.parse(fs.readFileSync(dir_name));
                } else {
                    return {};
                }
            })();
            for (let key of Object.keys(new_results)) {
                results2[key] = new_results[key];
            }
            results2.__GIT_COMMIT__ = execSync("git rev-parse HEAD")
                .toString()
                .trim();
            fs.writeFileSync(dir_name, JSON.stringify(results2, null, 4));
        }
        if (page) {
            page.close();
        }
    } catch (e) {
        private_console.error(e);
    }
});

function mkdirSyncRec(targetDir) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : "";
    const baseDir = ".";
    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {}
        return curDir;
    }, initDir);
}

describe.page = (url, body, {reload_page = true, name, root} = {}) => {
    let _url = url ? url : page_url;
    test_root = root ? root : test_root;

    describe(name ? name : _url, () => {
        let old = page_url;
        let old_reload = page_reload;
        page_url = _url;
        page_reload = reload_page;
        let result = body();
        page_url = old;
        page_reload = old_reload;
        return result;
    });

    if (IS_LOCAL_PUPPETEER && !fs.existsSync(path.join(test_root, "test", "results", RESULTS_FILENAME)) && !process.env.WRITE_TESTS) {
        throw new Error(`
        
ERROR: Running in puppeteer tests without "${RESULTS_FILENAME}"

Please re-run with "yarn test --write" to generate initial screenshot diffs
for your local OS.

`);
    }
};

test.run = function run(name, body, viewport = null) {
    let _url = page_url;
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

const OLD_SETTINGS = {};

expect.extend({
    toNotError(received) {
        if (received.length > 0) {
            return {
                message: () => `Errors emitted during evaluation: \n${received.map(x => `    ${x}`).join("\n")}`,
                pass: false
            };
        }
        return {
            message: () => ``,
            pass: true
        };
    }
});

test.capture = function capture(name, body, {timeout = 60000, viewport = null, wait_for_update = true, fail_on_errors = true, preserve_hover = false} = {}) {
    const _url = page_url;
    const _reload_page = page_reload;
    const spec = test(
        name,
        async () => {
            errors = [];

            if (viewport !== null)
                await page.setViewport({
                    width: viewport.width,
                    height: viewport.height
                });

            const iterations = process.env.PSP_SATURATE ? 10 : 1;

            const test_name = `${name.replace(/[ \.']/g, "_")}`;
            const path_name = `${spec.result.fullName.replace(".html", "").replace(/[ \.']/g, "_")}`;
            let dir_name = path.join(test_root, "screenshots", RESULTS_TAGNAME, path_name);
            dir_name = dir_name.slice(0, dir_name.length - test_name.length - 1);
            const filename = path.join(dir_name, test_name);
            if (!fs.existsSync(dir_name)) {
                mkdirSyncRec(dir_name);
            }

            for (let x = 0; x < iterations; x++) {
                if (_reload_page) {
                    await page.close();
                    page = await get_new_page();
                    await page.goto(`http://127.0.0.1:${__PORT__}/${_url}#test=${encodeURIComponent(name)}`, {waitUntil: "domcontentloaded"});
                } else {
                    if (!OLD_SETTINGS[test_root + _url]) {
                        await page.close();
                        page = await get_new_page();
                        await page.goto(`http://127.0.0.1:${__PORT__}/${_url}#test=${encodeURIComponent(name)}`, {waitUntil: "domcontentloaded"});
                    } else {
                        await page.evaluate(async x => {
                            const viewer = document.querySelector("perspective-viewer");
                            viewer._show_config = true;
                            viewer.restore(x);
                            await viewer.notifyResize();
                            await viewer.toggleConfig();
                        }, OLD_SETTINGS[test_root + _url]);
                    }
                }

                if (wait_for_update) {
                    await page.waitFor(() => {
                        const elem = document.getElementsByTagName("perspective-viewer");
                        return elem.length > 0 && elem[0].view !== undefined;
                    });
                    await page.waitForSelector("perspective-viewer:not([updating])");
                } else {
                    await page.waitForSelector("perspective-viewer");
                }

                if (!_reload_page && !OLD_SETTINGS[test_root + _url]) {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    OLD_SETTINGS[test_root + _url] = await page.evaluate(() => {
                        const viewer = document.querySelector("perspective-viewer");
                        return viewer.save();
                    });
                }

                // Move the mouse offscreen so prev tests dont get hover effects
                await page.mouse.move(10000, 10000);
                await body(page);
                if (!preserve_hover) {
                    await page.mouse.move(10000, 10000);
                }

                if (wait_for_update) {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(async () => {
                        await new Promise(requestAnimationFrame);
                    });
                }

                const screenshot = await page.screenshot();
                // await page.close();
                const hash = crypto
                    .createHash("md5")
                    .update(screenshot)
                    .digest("hex");

                if (hash === results[path_name]) {
                    fs.writeFileSync(filename + ".png", screenshot);
                } else {
                    fs.writeFileSync(filename + ".failed.png", screenshot);
                    if (fs.existsSync(filename + ".png")) {
                        try {
                            cp.execSync(`compare ${filename}.png ${filename}.failed.png  ${filename}.diff.png`);
                        } catch (e) {
                            // exits 1
                        }
                    }
                }

                if (process.env.WRITE_TESTS) {
                    new_results[path_name] = hash;
                }

                if (process.env.PSP_PAUSE_ON_FAILURE) {
                    if (!process.env.WRITE_TESTS && (hash !== results[path_name] || errors.length > 0)) {
                        private_console.error(`Failed ${name}, pausing`);
                        await prompt(`Failed ${name}, pausing.  Press enter to continue ..`);
                    }
                }
                if (fail_on_errors) {
                    expect(errors).toNotError();
                }
                expect(hash).toBe(results[path_name]);
                expect(seen_results.has(path_name)).toBeFalsy();
            }
            seen_results.add(path_name);
        },
        timeout
    );
};

function prompt(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve =>
        rl.question(query, ans => {
            rl.close();
            resolve(ans);
        })
    );
}

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

const highcharts_selector_center = async function(svg_selector, page) {
    await page.mouse.move(0, 0);
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
    await handle.asElement().hover();
    const box = await handle.asElement().boundingBox();
    return {x: box.x + box.width / 2, y: box.y + box.height / 2};
};

exports.invoke_tooltip = async function invoke_tooltip(svg_selector, page) {
    const viewer = await page.$("perspective-viewer");
    const coords = await highcharts_selector_center(svg_selector, page);
    await page.mouse.move(coords.x, coords.y);
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

exports.click_highcharts = async function click_highcharts(svg_selector, page) {
    const coords = await highcharts_selector_center(svg_selector, page);
    await page.mouse.click(coords.x, coords.y);
};

exports.render_warning = {
    set_warning_threshold: async function(page, plugin_name, threshold) {
        await page.evaluate(() => {
            window.getPlugin(plugin_name).max_cells = threshold;
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
