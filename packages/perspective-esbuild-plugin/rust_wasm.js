// Forked from https://github.com/MrRefactoring/wasm-opt
// We need a specific version of `wasm-opt` due to regressions in the `-Os` and
// `-Oz` optimization targets, and there is no published version of this
// npm module for the `wasm-opt` version we want.

const fs = require("fs");
const tar = require("tar");
const path = require("path");
const fetch = require("node-fetch");
const { promisify } = require("util");
const { execSync } = require("child_process");

const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

const { platform } = process;

function getUrl() {
    const { arch } = process;
    const baseURL =
        "https://github.com/WebAssembly/binaryen/releases/download/version_109";

    switch (platform) {
        case "win32":
            if (arch === "x64") {
                return `${baseURL}/binaryen-version_109-x86_64-windows.tar.gz`;
            }
            break;
        case "darwin":
            if (arch === "arm64") {
                return `${baseURL}/binaryen-version_109-arm64-macos.tar.gz`;
            }
            if (arch === "x64") {
                return `${baseURL}/binaryen-version_109-x86_64-macos.tar.gz`;
            }
            break;
        case "linux":
            if (arch === "x64") {
                return `${baseURL}/binaryen-version_109-x86_64-linux.tar.gz`;
            }
            break;
    }

    throw new Error("\x1b[33mThis platform not supported\x1b[0m");
}

const EXECUTABLE_FILENAME = platform === "win32" ? "wasm-opt.exe" : "wasm-opt";

async function download_wasm_opt() {
    const WASM_OPT = path.resolve(__dirname, `lib/wasm-opt`);
    if (fs.existsSync(WASM_OPT)) {
        return WASM_OPT;
    }

    console.log(`No \`wasm-opt\` found, installing`);
    const binariesOutputPath = path.resolve(__dirname, "binaries.tar");
    const binaryUrl = getUrl();
    const binaryResponse = await fetch(binaryUrl);
    const binary = await binaryResponse.buffer();
    await writeFile(binariesOutputPath, binary);

    await tar.extract({
        file: binariesOutputPath,
        cwd: __dirname,
        filter: (_path, stat) => {
            const { path: filePath } = stat.header;

            return [
                EXECUTABLE_FILENAME,
                "libbinaryen.dylib",
                "libbinaryen.a",
                "binaryen.lib",
            ].some((filename) => filePath.endsWith(filename));
        },
    });

    const libName = {
        win32: "binaryen.lib",
        linux: "libbinaryen.a",
        darwin: "libbinaryen.dylib",
    };

    const libFolderName = {
        win32: "lib",
        linux: "lib",
        darwin: "lib",
    };

    const libFolder = "lib";

    const unpackedFolder = path.resolve(__dirname, "binaryen-version_109");
    const unpackedLibFolder = path.resolve(
        unpackedFolder,
        libFolderName[platform]
    );
    const unpackedBinFolder = path.resolve(unpackedFolder, "bin");
    const downloadedWasmOpt = path.resolve(
        unpackedBinFolder,
        EXECUTABLE_FILENAME
    );
    const downloadedLibbinaryen = path.resolve(
        unpackedLibFolder,
        libName[platform]
    );
    const outputWasmOpt = path.resolve(
        __dirname,
        libFolder,
        EXECUTABLE_FILENAME
    );
    const outputLibbinaryen = path.resolve(
        __dirname,
        `${libFolder}/${libName[platform]}`
    );

    try {
        await mkdir(path.resolve(__dirname, `${libFolder}`));
    } catch (e) {}

    await copyFile(downloadedWasmOpt, outputWasmOpt);
    await copyFile(downloadedLibbinaryen, outputLibbinaryen);
    await unlink(binariesOutputPath);
    await unlink(downloadedWasmOpt);
    await unlink(downloadedLibbinaryen);
    await rmdir(unpackedBinFolder);
    await rmdir(unpackedLibFolder);
    await rmdir(unpackedFolder);
    return WASM_OPT;
}

const INHERIT = {
    stdio: "inherit",
    stderr: "inherit",
};

exports.wasm_bindgen = async function wasm_bindgen(project, options = {}) {
    const outdir = options.outdir || "dist/pkg";
    const version = options.version || "0.2.74";
    const target = options.targetdir || "target";

    // Find `wasm-bindgen` CLI
    const wasm_bindgen_path = path.join(
        __dirname,
        "lib",
        version,
        "bin/wasm-bindgen"
    );
    if (!fs.existsSync(wasm_bindgen_path)) {
        console.log(`No \`wasm-bindgen-cli\` found, installing`);
        execSync(
            `cargo install wasm-bindgen-cli --version ${version} --root ${path.join(
                __dirname,
                "lib",
                version
            )}`,
            INHERIT
        );
    }

    // Generate wasm-bindgen bindings
    const wasm_bindgen_debug = !!options.debug ? "--debug" : "";
    const profile_dir = !!options.debug ? "debug" : "release";
    const UNOPT_PATH = `${target}/wasm32-unknown-unknown/${profile_dir}/${project}.wasm`;
    execSync(
        `${wasm_bindgen_path} ${UNOPT_PATH} ${wasm_bindgen_debug} --out-dir ${outdir} --typescript --target web`,
        INHERIT
    );
};

exports.wasm_opt = async function wasm_opt(project, options = {}) {
    // Find `wasm-opt`
    const WASM_OPT = await download_wasm_opt();
    const outdir = options.outdir || "dist/pkg";

    // Optimize wasm
    const OPT_PATH = `${outdir}/${project}_bg.wasm`;
    const WASM_OPT_OPTIONS = [
        `--low-memory-unused`,
        `--converge`,

        // This commit to `binaryen/wasm-opt` adds 50k to wasm asset, this
        // is ths old settings.
        // https://github.com/WebAssembly/binaryen/commit/1a6efdb4233a077bc6e5e8a340baf5672bb5bced
        `--one-caller-inline-max-function-size=15`,
    ].join(" ");

    execSync(
        `${WASM_OPT} -Oz ${WASM_OPT_OPTIONS} -o wasm-opt.wasm ${OPT_PATH}`,
        INHERIT
    );

    execSync(`mv wasm-opt.wasm ${OPT_PATH}`, INHERIT);
};
