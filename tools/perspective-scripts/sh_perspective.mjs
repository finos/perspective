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

import * as dotenv from "dotenv";
import * as _path from "path";
import * as fs from "fs";
import fse from "fs-extra";
import * as rimraf from "rimraf";
import { createRequire } from "node:module";
import sh from "./sh.mjs";
import * as url from "url";
import { execSync } from "child_process";

dotenv.config({ path: "./.perspectiverc" });
process.env.FORCE_COLOR = true;
const _require = createRequire(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url)).slice(0, -1);

/**
 * Calls `join` on each of the input path arguments, then `rimraf`s the path if
 * it exists.   Can be used as an template literal, and can also take multiple
 * arguments call itself in sequence.
 *
 * @param {string} [path] a `/` encode path.
 * @example
 * clean`a/b/c`; // Cleans this dir
 * clean(path`a/b/c`, path`d/e/f`); // Cleans both dirs
 */
export function clean(...dirs) {
    if (Array.isArray(dirs[0])) {
        const dir = sh.path(...dirs);
        if (fs.existsSync(dir)) {
            rimraf.sync(dir);
        }
    } else {
        for (let dir of dirs) {
            dir = sh.path([dir]);
            if (fs.existsSync(dir)) {
                rimraf.sync(dir);
            }
        }
    }
}

/**
 * Returns the value after this command-line flag, or `true` if it is the last
 * arg.  This makes it easy to null-pun for boolean flags, and capture the
 * argument for argument-providing flags, and respect quotes and parens, in
 * one function.  Can be used as a template literal - not sure why, 2 less
 * characters?
 *
 * @param {string} flag The command line flag name.  Returns all arguments if
 *     this param is `undefined`.
 * @returns {string} The next argument after this flag in the command args, or
 *     `true.
 * @example
 * console.assert(getarg`--debug`);
 */
export function getarg(flag, ...args) {
    if (Array.isArray(flag)) {
        flag = flag.map((x, i) => x + (args[i] || "")).join("");
    }
    const argv = process.argv.slice(2);
    if (flag) {
        const index = argv.indexOf(flag);
        if (index > -1) {
            const next = argv[index + 1];
            if (next) {
                return next;
            } else {
                return true;
            }
        }
    } else {
        return argv
            .map(function (arg) {
                return "'" + arg.replace(/'/g, "'\\''") + "'";
            })
            .join(" ");
    }
}

export function get_scope() {
    const package_venn = (process.env.PACKAGE || "").split(",").reduce(
        (acc, x) => {
            if (x.startsWith("!")) {
                acc.exclude.push(x);
            } else if (x != "") {
                acc.include.push(x);
            }

            return acc;
        },
        { include: [], exclude: [] }
    );

    let packages;
    if (package_venn.include.length === 0) {
        packages = JSON.parse(
            execSync(`pnpm m ls --json --depth=-1`).toString()
        )
            .filter((x) => x.name !== undefined)
            .map((x) => x.name.replace("@finos/", ""))
            .filter((x) => package_venn.exclude.indexOf(`!${x}`) === -1);
    } else {
        packages = package_venn.include.filter(
            (x) => package_venn.exclude.indexOf(`!${x}`) === -1
        );
    }

    return packages;
}

export const run_with_scope = async function run_recursive(strings, ...args) {
    let scope = get_scope();
    const cmd = strings[0].split(" ")[0];
    const filters = scope.map((x) => `--filter ${x} --if-present`).join(" ");
    execSync(`pnpm run --sequential --recursive ${filters} ${cmd}`, {
        stdio: "inherit",
    });
};

export function py_requirements() {
    const version = sh`python3 --version`
        .execSync()
        .replace("Python ", "")
        .replace(".", "")
        .replace(/\..*?$/m, "");
    return `python/perspective/requirements/requirements-${version}.txt`;
}

/**
 * Get the python version to use from env/arguments
 *
 * @returns {string} The python version to use
 */
export function python_version(manylinux) {
    if (manylinux) {
        if (process.env.PYTHON_VERSION) {
            const v = process.env.PYTHON_VERSION.replace(".", "");
            return `/opt/python/cp${v}-cp${v}${
                v === "37" || v === "36" ? "m" : ""
            }/bin/python`;
        } else if (getarg("--python311")) {
            return `/opt/python/cp311-cp311/bin/python`;
        } else if (getarg("--python310")) {
            return `/opt/python/cp310-cp310/bin/python`;
        } else if (getarg("--python39")) {
            return `/opt/python/cp39-cp39/bin/python`;
        } else if (getarg("--python38")) {
            return `/opt/python/cp38-cp38/bin/python`;
        } else if (getarg("--python37")) {
            return `/opt/python/cp37-cp37m/bin/python`;
        } else {
            return `/opt/python/cp37-cp37m/bin/python`;
        }
    } else {
        if (process.env.PYTHON_VERSION) {
            return `python${process.env.PYTHON_VERSION}`;
        } else if (getarg("--python311")) {
            return "python3.11";
        } else if (getarg("--python310")) {
            return "python3.10";
        } else if (getarg("--python39")) {
            return "python3.9";
        } else if (getarg("--python38")) {
            return "python3.8";
        } else if (getarg("--python37")) {
            return "python3.7";
        } else {
            return "python3";
        }
    }
}

function manylinux_version() {
    if (process.env.MANYLINUX) {
        return `manylinux${process.env.MANYLINUX}`;
    } else if (getarg("--manylinux2010")) {
        throw new Exception("manylinux2010 no longer supported");
    } else if (getarg("--manylinux2014")) {
        return "manylinux2014";
    } else {
        return "manylinux2014";
    }
}

sh.docker = function docker(...args) {
    const image = manylinux_version();
    console.log(`-- Creating quay.io/pypa/${image}_x86_64 docker image`);
    const IS_WRITE = getarg("--write") || process.env.WRITE_TESTS;
    const CPUS = parseInt(process.env.PSP_CPU_COUNT);
    const PACKAGE = process.env.PACKAGE;
    const CWD = process.cwd();
    const IS_CI = getarg("--ci");
    const IS_MANYLINUX = image.indexOf("manylinux") > -1 ? true : false;
    const IMAGE = `quay.io/pypa/${image}_x86_64`;
    let env_vars = sh`-eWRITE_TESTS=${IS_WRITE} -ePACKAGE="${PACKAGE}"`;
    let flags = IS_CI ? sh`` : sh`-it`;

    if (IS_MANYLINUX) {
        console.log(`-- Using manylinux build`);
        env_vars = sh`${env_vars} -ePSP_MANYLINUX=1`;
    }

    return sh`docker run \
        --rm \
        ${flags} \
        ${env_vars} \
        -v${CWD}:/usr/src/app/perspective \
        -w /usr/src/app/perspective --shm-size=2g -u root \
        --cpus="${CPUS}.0" 
        ${IMAGE} 
        bash -c ${sh(...args).toString()}`;
};

export default sh;
