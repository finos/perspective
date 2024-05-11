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

// Forked from gist
// https://gist.github.com/davideicardi/787df4a9dc0de66c1db8f5a57e511230

const fs = require("fs");
const { Transform, PassThrough } = require("stream");

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
