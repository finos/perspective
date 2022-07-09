/*******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

require("dotenv").config({path: "./.perspectiverc"});
process.env.FORCE_COLOR = true;

const execSync = require("child_process").execSync;
const _path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const {promisify} = require("util");

const isWin = process.platform === "win32";

/*******************************************************************************
 *
 * Private
 */

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

function cut_last(f) {
    let x = f.split(" ");
    return x.slice(0, x.length - 1).join(" ");
}

function cut_first(f) {
    return f.split(" ").slice(1).join(" ");
}

const execute_throw = (cmd) => {
    if (process.argv.indexOf("--debug") > -1) {
        process.stdout.write(`$ ${cmd}\n`);
    }

    let env = {...process.env};
    if (!!process.env.PSP_DEBUG || process.argv.indexOf("--debug") >= 0) {
        env.PSP_DEBUG = 1;
    }

    execSync(cmd, {stdio: "inherit", env});
};

const execute = (cmd) => {
    try {
        execute_throw(cmd);
    } catch (e) {
        console.error("\n" + e.message);
        process.exit(1);
    }
};

const execute_return = async (cmd) => {
    if (process.argv.indexOf("--debug") > -1) {
        console.log(`$ ${cmd}`);
    }

    const ex = promisify(require("child_process").exec);
    return await ex(cmd);
};

/*******************************************************************************
 *
 * Public
 */

/**
 * Calls `path.join` on the result of splitting the input string by the default
 * path delimiter `/`, which allows writing simpler path statements that will
 * still be cross platform.  Can be used as an template literal.
 *
 * @param {string} path a `/` encoded path.
 * @returns {string} A system-correct path
 * @example
 * console.assert(path`a/b/c` === `a\\b\\c`) // on Windows
 */
exports.path = function path(strings, ...args) {
    return _path.join(...depath(strings, ...args));
};

/**
 * Like `path`, but uses `path.resolve` to get the absolute path, carefully
 * preserving leading delimiter.  Can be used as an template literal.
 *
 * @param {string} path a relative `/` encoded path.
 * @returns {string} A system-correct absolute path
 * @example
 * console.assert(path`a/b/c` === `${process.cwd()}\\a\\b\\v`) // on Windows
 */
const resolve = (exports.resolve = function resolve(strings, ...args) {
    return _path.resolve(...depath(strings, ...args)).replace(/\\/g, "\\");
});

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

/**
 * For working with shell commands, `bash` knows how to remove consecutive
 * text from strings when arguments are "falsey", which makes mapping flags to
 * JS expressions a breeze.  Can be used as a template literal.
 *
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * console.assert(
 *     bash`run -t${1} -u"${undefined}" task`,
 *    `run -t1 task`
 * );
 */
const bash = (exports.bash = function bash(strings, ...args) {
    let terms = [];
    if (strings.length === 1) {
        return strings[0];
    }
    for (let i = 0; i < strings.length - 1; i++) {
        const arg = args[i];
        const start = terms.length === 0 ? strings[i] : terms.pop();
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
        .replace(/[ \t\n]+/g, " ")
        .trim();
});

/**
 * Just like `bash, but executes the command immediately. Will log if the
 * `--debug` flag is used to build. If an error is encountered, it is logged
 * and the child process will exit with error code 1.
 *
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * execute`run -t${1} -u"${undefined}" task`;
 */
exports.execute = (strings, ...args) =>
    execute(Array.isArray(strings) ? bash(strings, ...args) : strings);

/**
 * Just like `execute`, except it throws anddoes not exit the child process
 * if the command throws an error.
 *
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * execute`run -t${1} -u"${undefined}" task`;
 */
exports.execute_throw = (strings, ...args) =>
    execute_throw(Array.isArray(strings) ? bash(strings, ...args) : strings);

/**
 * Just like `execute`, except it will return the output of the command
 * it runs.
 *
 * @async
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * execute`run -t${1} -u"${undefined}" task`;
 */
exports.execute_return = async (strings, ...args) =>
    await execute_return(
        Array.isArray(strings) ? bash(strings, ...args) : strings
    );

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
const getarg = (exports.getarg = function (flag, ...args) {
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
});

/**
 * A `bash` expression for running commands in Docker images
 *
 * @param {string} image The Docker image name.
 * @returns {string} A command for invoking this docker image.
 * @example
 * execute`${docker()} echo "Hello from Docker"`;
 */
exports.docker = function docker(image = "puppeteer") {
    console.log(`-- Creating quay.io/pypa/${image}_x86_64 docker image`);
    const IS_WRITE = getarg("--write") || process.env.WRITE_TESTS;
    const CPUS = parseInt(process.env.PSP_CPU_COUNT);
    const PACKAGE = process.env.PACKAGE;
    const CWD = process.cwd();
    const IS_CI = getarg("--ci");
    const IS_MANYLINUX = image.indexOf("manylinux") > -1 ? true : false;
    const IMAGE = `quay.io/pypa/${image}_x86_64`;
    let env_vars = bash`-eWRITE_TESTS=${IS_WRITE} \
        -ePACKAGE="${PACKAGE}"`;
    let flags = IS_CI ? bash`--rm` : bash`--rm -it`;

    if (IS_MANYLINUX) {
        console.log(`-- Using manylinux build`);
        env_vars += bash` -ePSP_MANYLINUX=1 `;
    }

    return bash`docker run \
        ${flags} \
        ${env_vars} \
        -v${CWD}:/usr/src/app/perspective \
        -w /usr/src/app/perspective --shm-size=2g -u root \
        --cpus="${CPUS}.0" ${IMAGE}`;
};

/**
 * Get the python version to use from env/arguments
 *
 * @returns {string} The python version to use
 */
exports.python_version = function python_version(manylinux) {
    if (manylinux) {
        if (process.env.PYTHON_VERSION) {
            const v = process.env.PYTHON_VERSION.replace(".", "");
            return `/opt/python/cp${v}-cp${v}${
                v === "37" || v === "36" ? "m" : ""
            }/bin/python`;
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
};

/**
 * Get the python tag to use from env/arguments.
 * NOTE: we only support cpython builds.
 * 
 * ref: https://cibuildwheel.readthedocs.io/en/stable/options/#build-skip
 *
 * @returns {string} The python tag to use
 */
 exports.python_tag = function python_tag(manylinux) {
     if (process.env.PYTHON_VERSION) {
         const v = process.env.PYTHON_VERSION.replace(".", "");
         return `cp${v}`;
    } else if (getarg("--python310")) {
        return "cp310";
    } else if (getarg("--python39")) {
        return "cp39";
    } else if (getarg("--python38")) {
        return "cp38";
    } else if (getarg("--python37")) {
        return "cp37";
    } else {
        return "cp39";
    }
};

/**
 * Get the docker image to use for the given image/python combination
 *
 * @param {string} image The Docker image name.
 * @param {string} python The python version requested
 * @returns {string} The docker image to use
 */
exports.python_image = function python_image(image = "", python = "") {
    console.log(
        `-- Getting image for image: '${image}' and python: '${python}'`
    );

    return `${image}`;
};

/**
 * Get the manylinux version to use from env/arguments
 *
 * @returns {string} The manylinux version to use
 */
exports.manylinux_version = function manylinux_version() {
    if (process.env.MANYLINUX) {
        return `manylinux${process.env.MANYLINUX}`;
    } else if (getarg("--manylinux2010")) {
        return "manylinux2010";
    } else if (getarg("--manylinux2014")) {
        return "manylinux2014";
    } else {
        return "manylinux2010";
    }
};
/*******************************************************************************
 *
 * Tests
 */

function run_suite(tests) {
    for (const [actual, expected] of tests) {
        console.assert(
            actual === expected,
            `"${actual}" received, expected: "${expected}"`
        );
    }
}

if (false) {
    if (isWin) {
        run_suite([
            [resolve`a/b/c`, `${process.cwd()}\\a\\b\\c`],
            [
                resolve`${__dirname}/../cpp/perspective`,
                `${process.cwd()}\\cpp\\perspective`,
            ],
            [
                resolve`${__dirname}/../python/perspective/dist`,
                _path.resolve(__dirname, "..", "python", "perspective", "dist"),
            ],
            [
                resolve`${__dirname}/../cpp/perspective`,
                _path.resolve(__dirname, "..", "cpp", "perspective"),
            ],
            [
                resolve`${__dirname}/../cmake`,
                _path.resolve(__dirname, "..", "cmake"),
            ],
            [
                resolve`${resolve`${__dirname}/../python/perspective/dist`}/cmake`,
                _path.resolve(
                    _path.resolve(
                        __dirname,
                        "..",
                        "python",
                        "perspective",
                        "dist"
                    ),
                    "cmake"
                ),
            ],
            [
                resolve`${resolve`${__dirname}/../python/perspective/dist`}/obj`,
                _path.resolve(
                    _path.resolve(
                        __dirname,
                        "..",
                        "python",
                        "perspective",
                        "dist"
                    ),
                    "obj"
                ),
            ],
        ]);
    } else {
        run_suite([
            [resolve`a/b/c`, `${process.cwd()}/a/b/c`],
            [
                resolve`${__dirname}/../cpp/perspective`,
                `${process.cwd()}/cpp/perspective`,
            ],
            [
                resolve`${__dirname}/../python/perspective/dist`,
                _path.resolve(__dirname, "..", "python", "perspective", "dist"),
            ],
            [
                resolve`${__dirname}/../cpp/perspective`,
                _path.resolve(__dirname, "..", "cpp", "perspective"),
            ],
            [
                resolve`${__dirname}/../cmake`,
                _path.resolve(__dirname, "..", "cmake"),
            ],
            [
                resolve`${resolve`${__dirname}/../python/perspective/dist`}/cmake`,
                _path.resolve(
                    _path.resolve(
                        __dirname,
                        "..",
                        "python",
                        "perspective",
                        "dist"
                    ),
                    "cmake"
                ),
            ],
            [
                resolve`${resolve`${__dirname}/../python/perspective/dist`}/obj`,
                _path.resolve(
                    _path.resolve(
                        __dirname,
                        "..",
                        "python",
                        "perspective",
                        "dist"
                    ),
                    "obj"
                ),
            ],
        ]);
    }

    run_suite([
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
        [bash`this is a test `, `this is a test `],
        [bash`--test="${undefined}.0" ${1}`, `1`],
    ]);
}
