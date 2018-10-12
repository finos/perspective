const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const prettier = require("prettier");

const argv = require("minimist")(process.argv.slice(2));

/**
 * ASMJS Output Options
 */
const WEB_ASMJS_OPTIONS = {
    inputFile: "psp.asmjs.js",
    format: false,
    packageName: "perspective",
    build: !!argv.asmjs // should we build asm?
};

/**
 * WASM Output Options
 */
const WEB_WASM_OPTIONS = {
    inputFile: "psp.async.js",
    inputWasmFile: "psp.async.wasm",
    format: true,
    packageName: "perspective",
    build: !!argv.wasm // flag as to whether to build
};

/**
 * Node.JS Output Options
 */
const NODE_OPTIONS = {
    inputFile: "psp.sync.js",
    inputWasmFile: "psp.sync.wasm",
    format: true,
    packageName: "perspective",
    build: !!argv.node // flag as to whether to build the node version
};

/**
 * Filter for the runtimes we should build
 */
const AVAILABLE_RUNTIMES = [WEB_ASMJS_OPTIONS, WEB_WASM_OPTIONS, NODE_OPTIONS];

// Select the runtimes - if no builds are specified then build everything
const RUNTIMES = AVAILABLE_RUNTIMES.filter(runtime => runtime.build).length ? AVAILABLE_RUNTIMES.filter(runtime => runtime.build) : AVAILABLE_RUNTIMES;

// Directory of Emscripten output
const BASE_DIRECTORY = path.join(__dirname, "..", "obj", "build");
const getOuputDir = packageName => path.join(__dirname, "..", "packages", packageName, "obj");

const templateSource = source => `
var window = window || {};

exports.load_perspective = function (Module) {
    ${source};
    return Module;
};`;

function compileRuntime({inputFile, inputWasmFile, format, packageName}) {
    console.log("Building %s", inputFile);

    const OUTPUT_DIRECTORY = getOuputDir(packageName);

    mkdirp.sync(OUTPUT_DIRECTORY);

    if (inputWasmFile) {
        console.log("Copying WASM file %s", inputWasmFile);
        fs.copyFileSync(path.join(BASE_DIRECTORY, inputWasmFile), path.join(OUTPUT_DIRECTORY, inputWasmFile));
    }

    console.debug("Creating wrapped js runtime");
    const runtimeText = String(
        fs.readFileSync(path.join(BASE_DIRECTORY, inputFile), {
            encoding: "utf8"
        })
    );

    let source = templateSource(runtimeText);
    if (format) {
        console.debug("Formatting code");
        source = prettier.format(source, {
            printWidth: 200,
            tabWidth: 4,
            parser: "babylon"
        });
    }

    fs.writeFileSync(path.join(OUTPUT_DIRECTORY, inputFile), source);
    console.log("Completed runtime %s", inputFile);
}

RUNTIMES.map(compileRuntime);
