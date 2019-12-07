/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("dotenv").config({path: "./.perspectiverc"});

const execSync = require("child_process").execSync;
const _path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");

function rimraf_err(e) {
    if (e) {
        console.error(e.message);
        process.exit(1);
    }
}

function depath(strings, ...args) {
    if (Array.isArray(strings)) {
        strings = strings.map((x, i) => x + (args[i] || "")).join("");
    }
    strings = strings.split("/");
    if (strings[0] === "") {
        strings = strings.slice(1);
        strings[0] = "/" + strings[0];
    }
    return strings;
}

exports.path = function path(strings, ...args) {
    return _path.join(...depath(strings, ...args));
};

const resolve = (exports.resolve = function resolve(strings, ...args) {
    return _path.resolve(...depath(strings, ...args));
});

const PATH_TESTS = [
    [resolve`a/b/c`, `${process.cwd()}/a/b/c`],
    [resolve`${__dirname}/../cpp/perspective`, `${process.cwd()}/cpp/perspective`],
    [resolve`${__dirname}/../python/perspective/dist`, _path.resolve(__dirname, "..", "python", "perspective", "dist")],
    [resolve`${__dirname}/../cpp/perspective`, _path.resolve(__dirname, "..", "cpp", "perspective")],
    [resolve`${__dirname}/../cmake`, _path.resolve(__dirname, "..", "cmake")],
    [resolve`${resolve`${__dirname}/../python/perspective/dist`}/cmake`, _path.resolve(_path.resolve(__dirname, "..", "python", "perspective", "dist"), "cmake")],
    [resolve`${resolve`${__dirname}/../python/perspective/dist`}/obj`, _path.resolve(_path.resolve(__dirname, "..", "python", "perspective", "dist"), "obj")]
];

for (const [actual, expected] of PATH_TESTS) {
    console.assert(actual === expected, `"${actual}" received, expected: "${expected}"`);
}

exports.clean = function clean(...dirs) {
    if (Array.isArray(dirs[0])) {
        const dir = exports.path(...dirs);
        if (fs.existsSync(dir)) {
            rimraf(dir, rimraf_err);
        }
    } else {
        for (let dir of dirs) {
            dir = exports.path([dir]);
            if (fs.existsSync(dir)) {
                rimraf(dir, rimraf_err);
            }
        }
    }
};

function cut_last(f) {
    let x = f.split(" ");
    return x.slice(0, x.length - 1).join(" ");
}

function cut_first(f) {
    return f
        .split(" ")
        .slice(1)
        .join(" ");
}

const bash = (exports.bash = function bash(strings, ...args) {
    let terms = [];
    if (strings.length === 1) {
        return strings[0];
    }
    for (let i = 0; i < strings.length - 1; i++) {
        const arg = args[i];
        const start = terms.pop() || strings[i];
        if (arg === undefined || arg !== arg || arg === false) {
            terms = [...terms, cut_last(start), " ", cut_first(strings[i + 1])];
        } else if (Array.isArray(arg)) {
            terms = [...terms, start, arg.join(" "), strings[i + 1]];
        } else {
            terms = [...terms, start, arg, strings[i + 1]];
        }
    }
    return terms
        .join("")
        .replace(/ +/g, " ")
        .trim();
});

const execute = cmd => {
    try {
        if (process.argv.indexOf("--debug") > -1) {
            console.log(`$ ${cmd}`);
        }
        execSync(cmd, {stdio: "inherit"});
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

exports.execute = (strings, ...args) => execute(Array.isArray(strings) ? bash(strings, ...args) : strings);

const TESTS = [
    [bash`run -t${1}`, `run -t1`],
    [bash`run -t${undefined}`, `run`],
    [bash`run -t${true}`, `run -ttrue`],
    [bash`run -t${false}`, `run`],
    [bash`run -t${1} task`, `run -t1 task`],
    [bash`run -t${undefined} task`, `run task`],
    [bash`run -t="${1}"`, `run -t="1"`],
    [bash`run -t="${undefined}"`, `run`],
    [bash`run -t="${1}" task`, `run -t="1" task`],
    [bash`run -t="${undefined}" task`, `run task`],
    [bash`run -t${1} -u${2} task`, `run -t1 -u2 task`],
    [bash`run -t${1} -u${undefined} task`, `run -t1 task`],
    [bash`run -t${undefined} -u${2} task`, `run -u2 task`],
    [bash`run -t${undefined} -u${undefined} task`, `run task`],
    [bash`run -t"${undefined}" -u"${undefined}" task`, `run task`],
    [bash`run "${undefined}" task`, `run task`],
    [bash`run ${undefined} task`, `run task`],
    [bash`TEST=${undefined} run`, `run`],
    [bash`TEST=${1} run`, `TEST=1 run`],
    [bash`TEST=${1}`, `TEST=1`],
    [bash`TEST=${undefined}`, ``],
    [bash`this is a test`, `this is a test`],
    [bash`this is a test `, `this is a test `]
];

for (const [actual, expected] of TESTS) {
    console.assert(actual === expected, `"${actual}" received, expected: "${expected}"`);
}

const getarg = (exports.getarg = function(flag) {
    const args = process.argv.slice(2);
    if (flag) {
        const index = args.indexOf(flag);
        if (index > -1) {
            return process.argv.slice(2)[index + 1] || true;
        }
    } else {
        return args;
    }
});

exports.docker = function docker(image = "puppeteer") {
    console.log(`-- Creating perspective/${image} docker image`);
    const IS_WRITE = getarg("--write") || process.env.WRITE_TESTS;
    const CPUS = parseInt(process.env.PSP_CPU_COUNT);
    const PACKAGE = process.env.PACKAGE;
    const CWD = process.cwd();
    return bash`docker run -it --rm -eWRITE_TESTS=${IS_WRITE} \
        -ePACKAGE="${PACKAGE}" -v${CWD}:/usr/src/app/perspective \
        -w /usr/src/app/perspective --shm-size=2g -u root \
        --cpus="${CPUS}.0" perspective/${image}`;
};
