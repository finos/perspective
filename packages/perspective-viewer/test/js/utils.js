/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var http = require('http');
var fs = require('fs');
var path = require('path');

function serve(response, contentType, filePath, paths) {
    if (paths.length === 0) {
        throw 'file not found';
    }
    fs.readFile(paths.shift() + filePath, function(error, content) {
        if (error) {
            serve(response, contentType, filePath, paths);
            return;
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}

exports.run_server = function run_server(paths = []) {

    const server = http.createServer(function (request, response) {

        var filePath = 'build' + request.url;
        var extname = path.extname(filePath);
        var contentType = 'text/html';

        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;      
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.csv':
                contentType = 'test/csv';
                break;
        }

        serve(response, contentType, filePath, [''].concat(paths));

    })

    server.listen(8125);

    return server;
}

const results = (() => {
    if (fs.existsSync('test/results/results.json')) {
        return JSON.parse(fs.readFileSync('test/results/results.json'));
    } else {
        return {};
    }
})();

if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
}

const puppeteer = require('puppeteer');
let browser;

var crypto = require('crypto');

beforeAll(async () => {
    browser = await puppeteer.launch();
});

afterAll(() => {
    browser.close();
    if (process.env.WRITE_TESTS) {
        fs.writeFileSync('test/results/results.json', JSON.stringify(results));
    }
});

let url;

describe.page = (_url, body) => {
    describe(_url, () => { 
        let old = url;
        url = _url;
        let result = body();
        url = old;
        return result;
    });
}

const cons = require('console');
const private_console = new cons.Console(process.stdout, process.stderr);

test.capture = function capture(name, body, timeout = 10000) {
    test(name, async () => {
        let errors = [];
        if (process.env.DEBUG) private_console.log("---- " + name + " -----------------------------");
        const page = await browser.newPage();
        page.on('console', msg => {
            if (process.env.DEBUG) {
                private_console.log(msg.text);
            }
        });
        page.on('pageerror', msg => {
            errors.push(msg.message);
            if (process.env.DEBUG) {
                private_console.error(msg.message);
            }
        });
        await page.goto('http://127.0.0.1:8125/' + (url || 'superstore.html'));
        await page.waitForSelector('perspective-viewer[render_time]');
        await body(page);
        await page.waitFor(1000)
        const screenshot = await page.screenshot();
        const hash = crypto.createHash('md5').update(screenshot).digest("hex");
        if (process.env.WRITE_TESTS) {
            results[name] = hash;
        }
        fs.writeFileSync('screenshots/' + name.replace(/ /g, '_').replace(/\./g, '') + ".png", screenshot);
        expect(hash).toBe(results[name]);
        expect(errors).toEqual([]);
    }, timeout);
}

async function dragDrop(page, origin, target) {
    const element = await page.$(origin);
    const box = await element.boundingBox();
    const element2 = await page.$(target);
    const box2 = await element2.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitFor(1000)
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await page.mouse.up();
}
