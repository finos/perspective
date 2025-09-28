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

import { execSync } from "child_process";
import { exec } from "child_process";
import * as path from "path";
import * as url from "url";
import chalk from "chalk";
import * as _path from "path";

const DEFAULT_OPTIONS = {
    env: { ...process.env },
    maxBuffer: 1024 * 1024 * 100,
};

class Command extends Function {
    #command;
    #options;
    #modified_env;

    /**
     * Protected constructor as `Command` class is private to this module. Use
     * `sh` factory function to construct isntances of `Command`.
     * @param  {...any} args
     */
    constructor(...args) {
        super();
        this.#command = parse_bind_args(...args);
        this.#options = structuredClone(DEFAULT_OPTIONS);
        this.#modified_env = {};
        for (const prop of Object.getOwnPropertyNames(Command.prototype)) {
            this[prop] = this[prop].bind(this);
        }
    }

    /**
     * Calls `path.sh.path` on the result of splitting the input string by the
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

    cwd(cwd) {
        this.#options.cwd = cwd;
        return this;
    }

    /**
     * Synchronously & fluently log this `Command`'s string representation.
     * @returns {Command}
     */
    log() {
        process.stdout.write(`> ${this.#command}\n`);
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
    sh(...args) {
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
        this.#modified_env = { ...this.#modified_env, ...env };
        this.#options.env = { ...this.#options.env, ...env };
        return this;
    }

    /**
     * Render this `Command` as a string without executing it.
     * @returns {string} The script as a string
     */
    toString() {
        let cmd = this.#command;
        if (Object.keys(this.#modified_env).length > 0) {
            console.warn(
                `${chalk.bgYellow.black` Warning `} env '${JSON.stringify(
                    this.#modified_env,
                )}' won't serialize'`,
            );

            for (const key of Object.keys(this.#modified_env)) {
                cmd = `${sh(key)}=${this.#modified_env[key]} ${cmd}`;
            }
        }

        if (typeof this.#options.cwd !== "undefined") {
            console.warn(
                `${chalk.bgYellow.black` Warning `} cwd '${
                    this.#options.cwd
                }' won't serialize`,
            );

            cmd = `cd ${this.#options.cwd} && ${cmd}`;
        }

        return cmd;
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
    async exec({ silent = false } = { silent: false }) {
        const options = {
            ...this.#options,
        };

        return await new Promise((resolve, reject) => {
            const subproc = exec(
                this.#command,
                options,
                (err, stdout, strerr) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(stdout.trimEnd());
                    }
                },
            );

            if (!silent) {
                subproc.stdout.pipe(process.stdout);
                subproc.stderr.pipe(process.stderr);
            }
        });
    }

    toJSON() {
        return this.toString();
    }

    valueOf() {
        return this.toString();
    }

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
 * @type {Command & {(): Command & {(): Promise<string>}}}
 * @param {string} expression a bash command to be templated.
 * @returns {string} A command with the missing argument's flags removed.
 * @example
 * console.assert(
 *     sh`run -t${1} -u"${undefined}" task`,
 *     sh`run -t1 task`
 * );
 */
const sh = new Proxy(Command, {
    apply(...args) {
        return make_callable(new Command(...args[2]));
    },
});

export default sh;

/*******************************************************************************
 *
 * Private
 */

function make_callable(self) {
    return new Proxy(self, {
        apply() {
            return self.exec();
        },
    });
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

function parse_arg(arg) {
    if (typeof arg === "string") {
        return `"${arg.replace(/\"/g, '\\"')}"`;
    } else if (arg instanceof Command) {
        return arg;
    } else if (typeof arg === "string" && arg.trim() === "") {
        return null;
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
        if (arg === undefined || Number.isNaN(arg) || arg === false) {
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

process
    .on("unhandledRejection", (reason, p) => {
        console.error(
            `${chalk.bgCyan.black` Unhandled Rejection `} ${chalk.bold(reason)}`,
        );
    })
    .on("uncaughtException", (err) => {
        console.error(
            `${chalk.bgRed.whiteBright.bold` Uncaught Exception `} ${chalk.bold(
                err.message,
            )}`,
        );

        console.debug(`\n${err.stack}\n`);
        process.exit(1);
    });
