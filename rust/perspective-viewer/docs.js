/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

// Forked from gist
// https://gist.github.com/davideicardi/787df4a9dc0de66c1db8f5a57e511230

const fs = require("fs");
const { Transform, PassThrough } = require("stream");
const puppeteer = require("puppeteer");

function concatStreams(streams) {
    let pass = new PassThrough();
    let waiting = streams.length;
    for (let stream of streams) {
        pass = stream.pipe(pass, { end: false });
        stream.once("end", () => --waiting === 0 && pass.emit("end"));
    }
    return pass;
}

class AddEndOfLine extends Transform {
    constructor(options) {
        super(options);
    }
    _transform(data, encoding, callback) {
        this.push(data);
        this.push("\n\n");
        callback();
    }
}

class ConvertLinksToAnchors extends Transform {
    constructor(options) {
        super(options);
    }
    _transform(data, encoding, callback) {
        const pattern = /\[(.+)\]\((.+\.md)?(#(.+))?\)/g;
        const newData = data.toString().replace(pattern, (m, p1, p2, p3) => {
            const anchor = `${p3 && p3.length > 0 ? p3.slice(1) : p1}`;
            return `[${p1}](#${anchor})`;
        });

        this.push(newData);
        callback();
    }
}

const inPaths = [
    "./dist/docs/README.md",
    "./dist/docs/interfaces/IPerspectiveViewerElement.md",
    "./dist/docs/interfaces/IPerspectiveViewerPlugin.md",
];

const outPath = "./README.md";
const inputs = inPaths.map((x) => fs.createReadStream(x));
const output = fs.createWriteStream(outPath);

concatStreams(inputs)
    .pipe(new AddEndOfLine())
    .pipe(new ConvertLinksToAnchors())
    .pipe(output)
    .on("finish", function () {
        console.log("Done merging!");
    });

async function capture_exprtk() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.addScriptTag({
        type: "module",
        path: "dist/cdn/perspective-viewer.js",
    });
    const data = await page.evaluate(async () => {
        await customElements.whenDefined("perspective-viewer");
        const commands = await customElements
            .get("perspective-viewer")
            .getExprTKCommands();

        return JSON.stringify(commands, null, 4);
    });

    let md = `---
id: perspective-viewer-exprtk
title: ExprTK Function Reference
---

## ExprTK Function Reference

`;
    for (const item of JSON.parse(data)) {
        md += `#### \`${item.label}\`

${item.documentation}

\`\`\`
${item.insert_text}
\`\`\`

`;
    }

    fs.writeFileSync("./exprtk.md", md);
    await page.close();
    await browser.close();
}

capture_exprtk();
