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

import os from "os";
import * as fs from "node:fs";
import { mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { getWorkspaceRoot, getWorkspacePackageJson } from "./workspace.mjs";

const pkg = getWorkspacePackageJson();

const LLVM_VERSION = pkg.llvm;
const DOWNLOAD_DIR = path.join(getWorkspaceRoot(), ".llvm", "llvm-toolchain");

function getLLVMPackageName() {
    const system = os.platform();
    const arch = os.arch();

    if (arch === "arm64" && system === "linux") {
        return `clang+llvm-${LLVM_VERSION}-aarch64-linux-gnu.tar.xz`;
    } else if (arch === "x64" && system === "linux") {
        return `clang+llvm-${LLVM_VERSION}-x86_64-linux-gnu-ubuntu-22.04.tar.xz`;
    } else if (arch === "x64" && system === "darwin") {
        return `clang+llvm-${LLVM_VERSION}-x86_64-apple-darwin21.0.tar.xz`;
    } else if (arch === "arm64" && system === "darwin") {
        return `clang+llvm-${LLVM_VERSION}-arm64-apple-darwin22.0.tar.xz`;
    } else {
        throw new Error(`Unsupported system: ${arch} on ${system}`);
    }
}

async function downloadLLVM(packageName) {
    const llvmUrl = `https://github.com/llvm/llvm-project/releases/download/llvmorg-${LLVM_VERSION}/${packageName}`;
    const outputPath = path.join(DOWNLOAD_DIR, packageName);

    console.log(`Downloading LLVM ${LLVM_VERSION} from ${llvmUrl}...`);

    mkdirSync(DOWNLOAD_DIR, { recursive: true });
    fs.writeFileSync(`${DOWNLOAD_DIR}/.llvm-version`, LLVM_VERSION);
    execSync(`wget -O ${outputPath} ${llvmUrl}`, { stdio: "inherit" });
    execSync(`tar -xvf ${outputPath} -C ${DOWNLOAD_DIR} --strip-components=1`, {
        stdio: "inherit",
    });
    execSync(`rm ${outputPath}`, { stdio: "inherit" });
}

const llvmPackageName = getLLVMPackageName();

if (fs.existsSync(DOWNLOAD_DIR)) {
    console.log(`LLVM ${LLVM_VERSION} already downloaded`);
    if (
        !fs.existsSync(`${DOWNLOAD_DIR}/.llvm-version`) ||
        fs.readFileSync(`${DOWNLOAD_DIR}/.llvm-version`).toString().trim() !==
            LLVM_VERSION
    ) {
        console.log(`LLVM version mismatch, re-downloading...`);
        fs.rmdirSync(DOWNLOAD_DIR, { recursive: true });
        downloadLLVM(llvmPackageName);
    }
} else {
    downloadLLVM(llvmPackageName);
}
