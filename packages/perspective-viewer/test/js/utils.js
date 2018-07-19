/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

const cons = require('console');
const private_console = new cons.Console(process.stdout, process.stderr);
const cp = require('child_process');

let __PORT__;

function serve(response, contentType, filePath, paths) {
    if (paths.length === 0) {
        throw `file not found ${filePath}`;
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

const DEFAULT = [
    'node_modules/@jpmorganchase/perspective-viewer/',
    'node_modules/@jpmorganchase/perspective/'
];

exports.with_server = function with_server({paths = DEFAULT, port = 8252}, body) {
   
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

    beforeAll(() => server.listen(0, () => {
        __PORT__ = server.address().port;
    }));

    afterAll(() => server.close());

    body();
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

let browser, page, url, errors = [], __name = "";

beforeAll(async () => {
    browser = await puppeteer.launch({devtools: true, headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']});
    page = await browser.newPage();

    // CSS Animations break our screenshot tests, so set the
    // animation playback rate to something extreme.
    await page._client.send('Animation.setPlaybackRate', { playbackRate: 100.0 });
    page.on('console', msg => {
        let text;
        if ({}.toString.call(msg.text) === '[object Function]') {
            text = msg.text();
        } else {
            text = msg.text;
        }
        if (msg.type === 'error') {
            errors.push(text);
            private_console.log(`${__name}: ${text}`);
        }
    });
    page.on('pageerror', msg => {
        errors.push(msg.message);
        private_console.log(`${__name}: ${msg.message}`);
    });
});

afterAll(() => {
    browser.close();
    if (process.env.WRITE_TESTS) {
        fs.writeFileSync('test/results/results.json', JSON.stringify(results, null, 4));
    }
});

describe.page = (_url, body) => {
    if (!fs.existsSync('screenshots/' + _url.replace('.html', ''))) {
        fs.mkdirSync('screenshots/' + _url.replace('.html', ''));
    }
    describe(_url, () => { 
        let old = url;
        url = _url;
        let result = body();
        url = old;
        return result;
    });
};

test.run = function run(name, body) {
    let _url = url;
    test(name, async () => {
        await new Promise(setTimeout);
        await page.goto(`http://127.0.0.1:${__PORT__}/${_url}`);
        await page.waitForSelector('perspective-viewer:not([updating])');
        const body_results = await body(page);
        expect(body_results).toBe(true);
    }, 300000);
};

test.capture = function capture(name, body, timeout = 60000) {
    let _url = url;
    test(name, async () => {
        errors = [];
        __name = name;
        await new Promise(setTimeout);
        await page.goto(`http://127.0.0.1:${__PORT__}/${_url}`);
        await page.waitForSelector('perspective-viewer:not([updating])');

        await body(page);

        // let animation run;
        await page.waitForSelector('perspective-viewer:not([updating])');

        const screenshot = await page.screenshot();
       // await page.close();
        const hash = crypto.createHash('md5').update(screenshot).digest("hex");
        if (process.env.WRITE_TESTS) {
            results[_url + '/' + name] = hash;
        }
        const filename = `screenshots/${_url.replace('.html', '')}/${name.replace(/ /g, '_').replace(/\./g, '')}`;
        if (hash === results[_url + '/' + name]) {
            fs.writeFileSync(filename + ".png", screenshot);
        } else {
            fs.writeFileSync(filename + ".failed.png", screenshot);
            if (fs.existsSync(filename + ".png")) {
                cp.execSync(`composite ${filename}.png ${filename}.failed.png -compose difference ${filename}.diff.png`);
                cp.execSync(`convert ${filename}.diff.png -auto-level ${filename}.diff.png`);
            }
        }
        expect(errors).toEqual([]);
        expect(hash).toBe(results[_url + '/' + name]);
    }, timeout);
};

async function dragDrop(page, origin, target) {
    const element = await page.$(origin);
    const box = await element.boundingBox();
    const element2 = await page.$(target);
    const box2 = await element2.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitFor(1000);
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
    await page.mouse.up();
}

exports.invoke_tooltip = async function invoke_tooltip(svg_selector, page) {
    const element = await page.$(svg_selector);
    const box = await element.boundingBox();
    await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await element.hover();
    await page.waitForSelector('.highcharts-label.highcharts-tooltip');
}