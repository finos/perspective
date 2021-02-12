/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {WebSocketServer, table} = require("@finos/perspective");
const {read_stdin, open_browser} = require("./utils.js");
const fs = require("fs");
const path = require("path");
const program = require("commander");

/**
 * Convert data from one format to another.
 *
 * @param {*} filename
 * @param {*} options
 */
async function convert(filename, options) {
    let file;
    if (filename) {
        file = fs.readFileSync(filename).toString();
    } else {
        file = await read_stdin();
    }
    try {
        file = JSON.parse(file);
    } catch {}
    let tbl = table(file);
    let view = await tbl.view();
    let out;
    options.format = options.format || "arrow";
    if (options.format === "csv") {
        out = await view.to_csv();
    } else if (options.format === "columns") {
        out = JSON.stringify(await view.to_columns());
    } else if (options.format === "json") {
        out = JSON.stringify(await view.to_json());
    } else {
        out = await view.to_arrow();
    }
    if (options.format === "arrow") {
        if (options.output) {
            fs.writeFileSync(options.output, Buffer.from(out), "binary");
        } else {
            console.log(Buffer.from(out).toString());
        }
    } else {
        if (options.output) {
            fs.writeFileSync(options.output, out);
        } else {
            console.log(out);
        }
    }
    view.delete();
    tbl.delete();
}

/**
 * Host a Perspective on a web server.
 *
 * @param {*} filename
 * @param {*} options
 */
async function host(filename, options) {
    let files = [path.join(__dirname, "html")];
    if (options.assets) {
        files = [options.assets, ...files];
    }
    const server = new WebSocketServer({assets: files, port: options.port});
    let file;
    if (filename) {
        file = table(fs.readFileSync(filename).toString());
    } else {
        file = await read_stdin();
    }
    server.host_table("data_source_one", file);
    if (options.open) {
        open_browser(options.port);
    }
}

program
    .version(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")).toString()).version)
    .description("A convenient command-line client for Perspective.js.  Can convert between Perspective supported format, or host a local web server.")
    .action(() => program.help());

program
    .command("convert [filename]")
    .description("Convert a file into a new format.  Reads from STDIN if no filename is provided.")
    .option("-f, --format <format>", "Which output format to use:  arrow, csv, columns, json.", /^(arrow|json|columns|csv)$/i, "arrow")
    .option("-o, --output <filename>", "Filename to write to.  If not supplied, writes to STDOUT.")
    .action(convert);

program
    .command("host [filename]")
    .description("Host a file on a local Websocket/HTTP server using a server-side Perspective.  Reads from STDIN if no filename is provided")
    .option("-p, --port <port>", "Which port to bind to.", x => parseInt(x), 8080)
    .option("-a, --assets <path>", "Host from a working directory")
    .option("-o, --open", "Open a browser automagically.")
    .action(host);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.help();
}
