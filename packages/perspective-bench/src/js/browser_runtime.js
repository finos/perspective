/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const ITERATIONS = 100;
const ITERATION_TIME = 500;
const TOSS_ITERATIONS = 0;
const INDENT_LEVEL = 2;
const MIN_TIMEOUT = 0;
const OUTPUT_MODE = "flat";

async function* filterOutliers(someArray) {
    const values = [],
        orig = [];
    for await (const row of someArray) {
        values.push(row.time);
        orig.push(row);
    }
    values.sort((a, b) => a - b);

    const q1 = values[Math.floor(values.length / 4)];
    const q3 = values[Math.ceil(values.length * (3 / 4))];
    const iqr = q3 - q1;
    const maxValue = q3 + iqr;
    const minValue = q1 - iqr;

    for (const idx in orig) {
        let row = orig[idx];
        row.outlier = row.time > maxValue || row.time < minValue;
        yield row;
    }
}

function quotechalk(x) {
    return x.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function to_table(col_lengths, padding = 0) {
    return function(...row) {
        try {
            let result = "".padStart(padding - 2, " ");
            for (let c = 0; c < row.length; ++c) {
                let method = "padEnd";
                let col_length = col_lengths[c];
                if (Array.isArray(col_length)) {
                    [method, col_length] = col_length;
                }
                col_length = col_length || 0;
                const cell = row[c];
                let real_cell = cell.replace(/{[a-zA-Z]+? ([^{]+?)}/g, "$1");
                let real_cell_length = cell.length;
                while (real_cell.length < real_cell_length) {
                    real_cell_length = real_cell.length;
                    real_cell = cell.replace(/{[a-zA-Z]+? ([^{]+?)}/g, "$1");
                }

                if (col_length < real_cell.length) {
                    col_length = real_cell.length;
                    col_lengths[c] = [method, col_length];
                }
                const cell_length = cell.length + Math.max(0, col_length - real_cell.length);
                result += "  " + cell[method].call(cell, cell_length, " ");
            }
            console.log(result);
        } catch (e) {
            console.error(e.message);
        }
    };
}

let PRINTER, LAST_PATH;

class Benchmark {
    constructor(desc, path, body, indent, categories, after_each, iterations, timeout, toss) {
        this._desc = quotechalk(desc);
        this._body = body;
        this._path = path.slice(0, path.length - 2);
        this._indent = indent;
        this._after_each = after_each;
        this._categories = categories;
        this._iterations = iterations;
        this._timeout = timeout;
        this._toss = toss;

        const iter_length = Math.log10(ITERATIONS) * 2 + 3;
        const per_length = 9;
        this._table_printer = PRINTER =
            PRINTER ||
            to_table(
                [
                    ...(OUTPUT_MODE === "tree" ? [...path.map(() => undefined), undefined] : []),
                    ["padStart", iter_length],
                    ["padStart", per_length],
                    ["padStart", undefined],
                    ["padStart", undefined],
                    ["padStart", undefined]
                ],
                OUTPUT_MODE === "grouped" ? (indent - 1) * INDENT_LEVEL : "  "
            );
    }

    log(reps, totals) {
        const t = totals.reduce((x, y) => x + y);
        const mean = t / reps;
        const stddev = Math.sqrt(totals.map(x => Math.pow(x - mean, 2)).reduce((x, y) => x + y) / reps) / mean;
        const completed = reps;
        const total = this._iterations();
        const time = t / 1000;
        const completed_per = completed / total;
        const time_per = time / completed;
        const color = completed_per >= 1 ? "white" : completed_per < 0.33 ? "redBright" : completed_per < 0.66 ? "yellowBright" : "greenBright";
        const stddev_color = stddev < 0.25 ? "greenBright" : stddev < 0.5 ? "yellowBright" : "redBright";
        const path = [...this._path.reverse(), this._desc];
        const last_path = path.slice();
        if (LAST_PATH) {
            for (let x = 0; x < path.length; ++x) {
                if (path[x] === LAST_PATH[x]) {
                    path[x] = "-";
                    if (x > 0) {
                        path[x - 1] = "";
                    }
                } else {
                    break;
                }
            }
        }
        LAST_PATH = last_path;
        this._table_printer(
            ...(OUTPUT_MODE === "tree" ? path : []),
            `{${color} ${completed}}{whiteBright /${total}}`,
            `{${color} ${(100 * completed_per).toFixed(2)}}{whiteBright %)}`,
            `{whiteBright ${time.toFixed(3)}}s`,
            `{whiteBright ${time_per.toFixed(2)}}secs/op`,
            `{${stddev_color} ${(100 * stddev).toFixed(2)}}{whiteBright %} σ/mean`,
            ...(OUTPUT_MODE === "flat" ? this._path : []),
            ...(OUTPUT_MODE === "tree" ? [] : [`{whiteBright ${this._desc}}`])
        );
    }

    *case_iter() {
        let x, start, now;
        for (x = 0; !start || performance.now() - start < MIN_TIMEOUT || x < this._iterations() + this._toss(); x++) {
            if (x >= this._toss() && start == undefined) {
                start = performance.now();
            }
            now = performance.now();
            if (now - start > this._timeout()) {
                return;
            }

            yield x >= this._toss();
        }
    }

    async *run() {
        try {
            const categories = this._categories();
            let count = 0,
                totals = [];
            for (const not_warmup of this.case_iter(this._desc)) {
                const start = performance.now();
                await this._body();
                const stop = performance.now() - start;
                if (not_warmup) {
                    totals.push(stop);
                    count += 1;
                    yield {
                        test: this._desc,
                        time: stop,
                        ...categories
                    };
                }
                if (this._after_each) {
                    await this._after_each();
                }
            }
            this.log(count, totals);
        } catch (e) {
            console.error(`Benchmark ${this._desc} failed`, e);
        }
    }
}

function unwind(stack) {
    return stack.reduce((obj, x) => {
        if (x instanceof Suite) {
            obj[x._category] = x._name;
        }
        return obj;
    }, {});
}

class Suite {
    constructor(name, body, context, indent = 0, iterations = ITERATIONS, timeout = ITERATION_TIME, toss = TOSS_ITERATIONS) {
        this._benchmarks = [];
        this._indent = indent;
        this._promises = [];
        this._body = body;
        this._name = name.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
        this._context = context || [this];
        this._category = `Category ${indent / INDENT_LEVEL}`;
        this._iterations = iterations;
        this._timeout = timeout;
        this._toss = toss;
    }

    benchmark(desc, body) {
        const context = this._context[0];
        const stack = this._context.slice();
        context._benchmarks.push(
            new Benchmark(
                desc,
                this._context.map(x => x._name),
                body,
                context._indent,
                () => unwind(stack),
                () => context._after_each && context._after_each(),
                () => context._iterations,
                () => context._timeout,
                () => context._toss
            )
        );
    }

    setIterations(iter) {
        this._context[0]._iterations = iter;
    }

    setTimeout(timeout) {
        this._context[0]._timeout = timeout;
    }

    setToss(toss) {
        this._context[0]._toss = toss;
    }

    category(cat) {
        this._context[0]._category = cat;
    }

    beforeAll(body) {
        this._context[0]._before_all = body;
    }

    afterAll(body) {
        this._context[0]._after_all = body;
    }

    afterEach(body) {
        this._context[0]._after_each = body;
    }

    describe(description, body) {
        // todo closures here like Benchmark
        const suite = new Suite(description, body, this._context, this._context[0]._indent + INDENT_LEVEL, this._context[0]._iterations, this._context[0]._timeout, this._context[0]._toss);
        this._context[0]._benchmarks.push(suite);
    }

    commandArg(x) {
        // eslint-disable-next-line no-undef
        return __PLACEHOLDER__[x];
    }

    async *run_all_cases() {
        this._context.unshift(this);
        if (this._name && OUTPUT_MODE === "grouped") {
            console.log(`${" ".repeat(this._indent)}{whiteBright ${this._name}}`);
        }
        if (this._body) {
            await this._body();
        }
        if (this._before_all) {
            await this._before_all();
        }
        for (const benchmark of this._benchmarks) {
            if (benchmark instanceof Suite) {
                for await (const result of benchmark.run_all_cases()) {
                    yield result;
                }
            } else {
                for await (const result of filterOutliers(benchmark.run())) {
                    yield result;
                }
            }
        }
        if (this._after_all) {
            await this._after_all();
        }
        this._context.shift();
    }

    async run() {
        const results = [],
            columns = new Set();

        try {
            for await (let c of this.run_all_cases()) {
                results.push(c);
                Object.keys(c).map(x => columns.add(x));
            }
        } catch (e) {
            console.error(e.message);
        }
        return results.map(x => {
            // TODO perspective bug :(
            for (const col of columns) {
                x[col] = x[col] === undefined ? "-" : x[col];
            }
            return x;
        });
    }
}

window = window || global || {};
const mod = (window.PerspectiveBench = new Suite("perspective"));
for (const key of ["beforeAll", "afterAll", "afterEach", "describe", "benchmark"]) {
    window[key] = mod[key].bind(mod);
}
