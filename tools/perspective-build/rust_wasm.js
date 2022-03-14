// Forked from https://github.com/MrRefactoring/wasm-opt
// We need a specific version of `wasm-opt` due to regressions in the `-Os` and
// `-Oz` optimization targets, and there is no published version of this
// npm module for the `wasm-opt` version we want.

const fs = require("fs");
const tar = require("tar");
const path = require("path");
const fetch = require("node-fetch");
const {promisify} = require("util");

const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

const {platform} = process;

function getUrl() {
    const {arch} = process;
    const baseURL =
        "https://github.com/WebAssembly/binaryen/releases/download/version_100";

    switch (platform) {
        case "win32":
            if (arch === "x64") {
                return `${baseURL}/binaryen-version_100-x86_64-windows.tar.gz`;
            }
            break;
        case "darwin":
            if (arch === "arm64") {
                return `${baseURL}/binaryen-version_100-arm64-macos.tar.gz`;
            }
            if (arch === "x64") {
                return `${baseURL}/binaryen-version_100-x86_64-macos.tar.gz`;
            }
            break;
        case "linux":
            if (arch === "x64") {
                return `${baseURL}/binaryen-version_100-x86_64-linux.tar.gz`;
            }
            break;
    }

    throw new Error("\x1b[33mThis platform not supported\x1b[0m");
}

const EXECUTABLE_FILENAME = platform === "win32" ? "wasm-opt.exe" : "wasm-opt";

exports.download_wasm_opt = async function download_wasm_opt() {
    try {
        const binariesOutputPath = path.resolve(__dirname, "binaries.tar");
        const binaryUrl = getUrl();
        const binaryResponse = await fetch(binaryUrl);
        const binary = await binaryResponse.buffer();
        await writeFile(binariesOutputPath, binary);

        await tar.extract({
            file: binariesOutputPath,
            cwd: __dirname,
            filter: (_path, stat) => {
                const {path: filePath} = stat.header;

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
            linux: "lib64",
            darwin: "lib",
        };

        const libFolder = "lib";

        const unpackedFolder = path.resolve(__dirname, "binaryen-version_100");
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
    } catch (e) {
        throw new Error(`\x1b[31m${e}\x1b[0m`);
    }
};
