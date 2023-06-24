/*******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const execSync = require("child_process").execSync;
const { promisify } = require("util");
const exec_promise = promisify(require("child_process").exec);
const path = require("path");

const DEFAULT_OPTIONS = {
    env: { ...process.env },
    maxBuffer: 1024 * 1024 * 100,
};

class Command extends Function {
    #command;
    #options;

    constructor(...args) {
        super();
        this.#command = parse_bind_args(...args);
        this.#options = structuredClone(DEFAULT_OPTIONS);
        for (const prop of Object.getOwnPropertyNames(Command.prototype)) {
            this[prop] = this[prop].bind(this);
        }
    }

    /**
     * Convert to a callable function.
     * @returns {Proxy<Command>}
     */
    callable() {
        const self = this;
        return new Proxy(self, {
            apply() {
                return self.exec();
            },
        });
    }

    /**
     * Calls `path.resolve` on the result of splitting the input string by the
     * default path delimiter `/`, which allows writing simpler path statements
     * that will still be cross platform.  Can be used as an template literal.
     *
     * @param {string} path a relative `/` encoded path.
     * @returns {string} A system-correct absolute path
     * @example
     * console.assert(path`a/b/c` === `${process.cwd()}\\a\\b\\v`) // on Windows
     */
    static path(strings, ...args) {
        return path.resolve(...depath(strings, ...args)).replace(/\\/g, "\\");
    }
    /**
     * Creates a new class which extends `Command`, but with a different
     * default environment `env`.
     * @param {object} env The environment dictionary to use for this
     *     `Command`'s execution.
     * @returns {typeof Command}
     */
    static env(env) {
        return new Proxy(Command, {
            apply(_, __, args) {
                return sh(...args).env(env);
            },
        });
    }

    /**
     * Synchronously & fluently log this `Command`'s string representation.
     * @returns {Command}
     */
    log() {
        process.stdout.write(`$ ${this.#command}\n`);
        return this;
    }

    /**
     * Mutably & fluently append this `Command` with additional shell script.
     * Can be used as a template literal.
     * @param  {...any} args
     * @returns
     */
    sh(...args) {
        return this.#extend_sh("", ...args);
    }

    /**
     * Mutably & fluently sequence this `Command` with additional shell script,
     * using `&&`. Can be used as a template literal.
     * @param  {...any} args
     * @returns
     */
    and_sh(...args) {
        return this.#extend_sh("&&", ...args);
    }

    /**
     * Is this `Command` empty as e.g. `sh("")`?
     * @returns {boolean} `true` if this `Command` has no script.
     */
    isEmpty() {
        return this.#command.trim().length === 0;
    }

    /**
     * Mutably & fluently extend or override this `Command` with additional
     * environment variables. Existing environment variables will be overridden
     * in the event of a conflict.
     * @param {object} env Dictionary of environment variables to extend this
     *     `Command`'s environment with.
     * @returns
     */
    env(env) {
        this.#options.env = { ...this.#options.env, ...env };
        return this;
    }

    /**
     * Render this `Command` as a string without executing it.
     * @returns {string} The script as a string
     */
    toString() {
        return this.#command;
    }

    /**
     * Execut this command, but log rather than throw on failure.
     * @returns {string | false} The `Command`'s output, or `false` if it fails.
     */
    tryExecSync() {
        try {
            return this.execSync();
        } catch (e) {
            console.error("Failed with error: " + e.message);
            return false;
        }
    }

    /**
     * Execute this command with native `stdio`.
     */
    runSync() {
        return execSync(this.#command, {
            ...this.#options,
            stdio: "inherit",
        });
    }

    /**
     * Execute this command, returning the output and logging. Logs for
     * `execSync` don't occur until the command is completed - for live logging
     * without capture, use `runSync()`.
     */
    execSync() {
        const output = execSync(this.#command, { ...this.#options })
            .toString()
            .trim();

        process.stdout.write(output);
        process.stdout.write("\n");
        return output;
    }

    /**
     * Execute the command asynchronously, logging and returning the result.
     * @returns {string} The `Command`'s output.
     */
    async exec() {
        const obj = await exec_promise(this.#command, this.#options);
        return obj.stdout.trim();
    }

    toJSON() {
        return this.toString();
    }

    valueOf() {
        return this.toString();
    }

    // then(f) {
    //     return this.exec().then(f);
    // }

    #extend_sh(joint, ...args) {
        const cmd = sh(...args);
        if (this.isEmpty()) {
            this.#command = cmd.toString();
        } else {
            this.#command = `${this.#command} ${joint} ${cmd.toString()}`;
        }

        return this;
    }
}

/**
 * `sh` is a JavaScript _template literal_ function which generates and executes
 * shell scripts. `sh` knows how to remove consecutive text from fragments when
 * arguments are "falsey", which makes mapping flags to JS expressions a breeze.
 *
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * console.assert(
 *     bash`run -t${1} -u"${undefined}" task`,
 *    `run -t1 task`
 * );
 */
const sh = new Proxy(Command, {
    apply(...args) {
        return new Command(...args[2]).callable().callable();
    },
});

exports.default = sh;

/*******************************************************************************
 *
 * Private
 */

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

function parse_arg(arg) {
    if (typeof arg === "string") {
        return `"${arg.replace(/\"/g, '\\"')}"`;
    } else {
        return arg;
    }
}

function parse_bind_args(fragments, ...args) {
    if (typeof fragments === "undefined") {
        return "";
    }

    if (!Array.isArray(fragments)) {
        return fragments.toString();
    }

    const terms = [];
    if (fragments.length === 1) {
        return fragments[0];
    }

    for (let i = 0; i < fragments.length - 1; i++) {
        const arg = args[i];
        const start = terms.length === 0 ? fragments[i] : terms.pop();
        if (arg === undefined || arg !== arg || arg === false) {
            terms.push(start.split(" ").slice(0, -1).join(" "));
            terms.push(" ");
            terms.push(fragments[i + 1].split(" ").slice(1).join(" "));
        } else if (Array.isArray(arg)) {
            terms.push(start);
            terms.push(arg.map(parse_arg).join(" "));
            terms.push(fragments[i + 1]);
        } else {
            terms.push(start);
            terms.push(parse_arg(arg));
            terms.push(fragments[i + 1]);
        }
    }

    return terms
        .join("")
        .replace(/[ \t\n]+/g, " ")
        .trim();
}

/*******************************************************************************
 *
 * Tests
 */

function run_suite(tests) {
    for (const [actual, expected] of tests) {
        console.assert(
            actual == expected,
            `"${actual}" received, expected: "${expected}"\n${JSON.stringify([
                actual,
                expected,
            ])}`
        );
    }
}

async function run_tests() {
    run_suite([
        [sh`run -t${1}`, `run -t1`],
        [sh`run -t${undefined}`, `run`],
        [sh`run -t${true}`, `run -ttrue`],
        [sh`run -t${false}`, `run`],
        [sh`run -t${1} task`, `run -t1 task`],
        [sh`run -t${undefined} task`, `run task`],
        [sh`run -t="${1}"`, `run -t="1"`],
        [sh`run -t="${undefined}"`, `run`],
        [sh`run -t="${1}" task`, `run -t="1" task`],
        [sh`run -t="${undefined}" task`, `run task`],
        [sh`run -t${1} -u${2} task`, `run -t1 -u2 task`],
        [sh`run -t${1} -u${undefined} task`, `run -t1 task`],
        [sh`run -t${undefined} -u${2} task`, `run -u2 task`],
        [sh`run -t${undefined} -u${undefined} task`, `run task`],
        [sh`run -t"${undefined}" -u"${undefined}" task`, `run task`],
        [sh`run "${undefined}" task`, `run task`],
        [sh`run ${undefined} task`, `run task`],
        [sh`TEST=${undefined} run`, `run`],
        [sh`TEST=${1} run`, `TEST=1 run`],
        [sh`TEST=${1}`, `TEST=1`],
        [sh`TEST=${undefined}`, ``],
        [sh`this is a test`, `this is a test`],
        [sh`this is a test `, `this is a test `],
        [sh`echo ${"test"}`, 'echo "test"'],
        [
            sh`bash -c "${sh`./execute launch_rockets`}"`,
            `bash -c "./execute launch_rockets"`,
        ],
        [
            sh`bash -c ${sh`./execute launch_rockets`.toString()}`,
            `bash -c "./execute launch_rockets"`,
        ],
        [
            sh`bash -c ${sh`./execute launch_rockets`}`,
            `bash -c ./execute launch_rockets`,
        ],
        [
            sh`bash -c ${`./execute launch_rockets`}`,
            `bash -c "./execute launch_rockets"`,
        ],
        [
            sh`echo $(${sh`./execute launch_rockets`})`,
            `echo $(./execute launch_rockets)`,
        ],
        [
            sh`cd python/perspective`.and_sh(sh`python3 setup.py`),
            `cd python/perspective && python3 setup.py`,
        ],
        [sh`--test="${undefined}.0" ${1}`, `1`],
        [sh`echo $TEST`.env({ TEST: "test" }).execSync(), `test`],
        [await sh`echo test`.exec(), `test`],
        // [await sh`echo test`, `test`],
        [await sh`echo test`(), `test`],
        [sh.env({ TEST: "test2" })`echo $TEST`.execSync(), `test2`],
        [sh`echo ${sh.path`./test`}`, `echo \"${process.cwd()}/test\"`],
        [sh`echo ${sh.path`test/obj`}`, `echo \"${process.cwd()}/test/obj\"`],
        [
            sh`echo ${sh.path`${__dirname}/test/obj`}`,
            `echo \"${__dirname}/test/obj\"`,
        ],
    ]);
}

if (require.main === module) {
    run_tests();
}
