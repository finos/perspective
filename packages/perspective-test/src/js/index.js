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

exports.with_jupyterlab = function with_jupyterlab(port, body) {
    __PORT__ = port;
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

    // https://github.com/puppeteer/puppeteer/issues/1718
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36");
    await page.setRequestInterception(true);

    // Webfonts cause tests to render inconcistently (or block) when run in a
    // firewalled environment, so for consistency abort these requests.
    page.on("request", interceptedRequest => {
        if (interceptedRequest.url().indexOf("googleapis") > -1) {
            interceptedRequest.abort();
        } else {
            interceptedRequest.continue();
        }
    });

    // Disable all alerts and dialogs, as Jupyterlab alerts when trying to
    // navigate off the page, which will block test completion.
    page.on("dialog", async dialog => {
        await dialog.accept();
    });

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

    page.shadow_type = async function(content, is_incremental, ...path) {
        if (typeof is_incremental !== "boolean") {
            path.unshift(is_incremental);
            is_incremental = false;
        }

        await this.evaluate(
            async (content, path, is_incremental) => {
                let elem = document;
                while (path.length > 0) {
                    if (elem.shadowRoot) {
                        elem = elem.shadowRoot;
                    }
                    elem = elem.querySelector(path.shift());
                }

                elem.focus();

                function triggerInputEvent(element) {
                    const event = new Event("input", {
                        bubbles: true,
                        cancelable: true
                    });

                    element.dispatchEvent(event);
                }

                if (is_incremental) {
                    while (content.length > 0) {
                        elem.value += content[0];
                        triggerInputEvent(elem);
                        await new Promise(requestAnimationFrame);
                        content = content.slice(1);
                    }
                } else {
                    elem.value = content;
                    triggerInputEvent(elem);
                }
            },
            content,
            path,
            is_incremental
        );
    };

    page.shadow_blur = async function() {
        await this.evaluate(() => {
            let elem = document.activeElement;
            while (elem) {
                elem.blur();
                elem = elem.shadowRoot?.activeElement;
            }
        });
    };

    page.shadow_focus = async function(...path) {
        await this.evaluate(path => {
            let elem = document;
            while (path.length > 0) {
                if (elem.shadowRoot) {
                    elem = elem.shadowRoot;
                }
                elem = elem.querySelector(path.shift());
            }

            elem.focus();
        }, path);
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

test.run = function run(name, body, {url = page_url, timeout = 60000, viewport = null}) {
    test(
        name,
        async () => {
            if (viewport !== null) {
                await page.setViewport({
                    width: viewport.width,
                    height: viewport.height
                });
            }
            await new Promise(setTimeout);
            await page.goto(`http://127.0.0.1:${__PORT__}/${url}`, {waitUntil: "domcontentloaded"});
            await body(page);
        },
        timeout
    );
};

test.capture = function capture(name, body, {url = page_url, timeout = 60000, viewport = null, wait_for_update = true, fail_on_errors = true, preserve_hover = false} = {}) {
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
                    await page.goto(`http://127.0.0.1:${__PORT__}/${url}#test=${encodeURIComponent(name)}`, {waitUntil: "domcontentloaded"});
                } else {
                    if (!OLD_SETTINGS[test_root + url]) {
                        await page.close();
                        page = await get_new_page();
                        await page.goto(`http://127.0.0.1:${__PORT__}/${url}#test=${encodeURIComponent(name)}`, {waitUntil: "domcontentloaded"});
                    } else {
                        await page.evaluate(async x => {
                            const viewer = document.querySelector("perspective-viewer");
                            viewer.restore(x);
                            await viewer.notifyResize();
                            await viewer.toggleConfig(false);
                        }, OLD_SETTINGS[test_root + url]);
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

                if (!_reload_page && !OLD_SETTINGS[test_root + url]) {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    OLD_SETTINGS[test_root + url] = await page.evaluate(() => {
                        const viewer = document.querySelector("perspective-viewer");
                        return viewer.save();
                    });
                }

                // Move the mouse offscreen so prev tests dont get hover effects
                await page.mouse.move(10000, 10000);
                try {
                    await body(page);
                } catch (e) {
                    if (process.env.PSP_PAUSE_ON_FAILURE) {
                        if (!process.env.WRITE_TESTS) {
                            private_console.error(`Failed ${name}, pausing`);
                            await prompt(`Failed ${name}, pausing.  Press enter to continue ..`);
                        }
                    }
                    throw e;
                }
                if (!preserve_hover) {
                    await page.mouse.move(10000, 10000);
                }

                if (wait_for_update) {
                    await page.waitForSelector("perspective-viewer:not([updating])");
                    await page.evaluate(async () => {
                        await new Promise(requestAnimationFrame);
                    });
                }

                const screenshot = await page.screenshot({captureBeyondViewport: false, fullPage: true});
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
