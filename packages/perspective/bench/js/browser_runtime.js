/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const ITERATIONS = 100;
const ITERATION_TIME = 10000;
const TOSS_ITERATIONS = 0;
const INDENT_LEVEL = 2;

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

class Benchmark {
    constructor(desc, body, indent, categories, after_each) {
        this._desc = quotechalk(desc);
        this._body = body;
        this._indent = indent;
        this._after_each = after_each;
        this._categories = categories;
    }

    log(reps, t) {
        const completed = reps - TOSS_ITERATIONS;
        const total = ITERATIONS - TOSS_ITERATIONS;
        const time = t / 1000;
        const completed_per = completed / total;
        const color = completed_per < 0.33 ? "redBright" : completed_per < 0.66 ? "yellowBright" : "greenBright";
        let log = " ".repeat(this._indent + INDENT_LEVEL);
        log += `{${color} ${completed}}{whiteBright /${total} ({${color} ${((100 * completed) / total).toFixed(2)}}%)}`;
        log += `    {whiteBright ${time.toFixed(3)}}s {whiteBright ${(time / completed).toFixed(2)}} secs/op`;
        log += `    {whiteBright ${this._desc}}`;

        console.log(log);
    }

    *case_iter() {
        let x, start, now;
        for (x = 0; x < ITERATIONS + TOSS_ITERATIONS; x++) {
            if (x >= TOSS_ITERATIONS && start == undefined) {
                start = Date.now();
            }
            now = Date.now();
            if (now - start > ITERATION_TIME) {
                this.log(x, now - start);
                return;
            }

            yield x >= TOSS_ITERATIONS;
        }
        this.log(x, now - start);
    }

    async *run() {
        try {
            const categories = this._categories();
            //console.log(quotechalk(JSON.stringify(categories)));
            for (const not_warmup of this.case_iter(this._desc)) {
                const start = performance.now();
                await this._body();
                if (not_warmup) {
                    yield {
                        test: this._desc,
                        time: performance.now() - start,
                        ...categories
                    };
                }
                if (this._after_each) {
                    await this._after_each();
                }
            }
        } catch (e) {
            console.error(`Benchmark ${this._desc} failed`, e);
        }
    }
}

class Suite {
    constructor(name, body, context, indent = 0) {
        this._benchmarks = [];
        this._indent = indent;
        this._promises = [];
        this._body = body;
        this._name = name.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
        this._context = context || [this];
        this._category = `Category ${indent / INDENT_LEVEL}`;
    }

    benchmark(desc, body) {
        const context = this._context[0];
        const stack = this._context.slice();
        context._benchmarks.push(
            new Benchmark(
                desc,
                body,
                context._indent,
                () => {
                    return stack.reduce((obj, x) => {
                        if (x instanceof Suite) {
                            obj[x._category] = x._name;
                        }
                        return obj;
                    }, {});
                },
                () => context._after_each && context._after_each()
            )
        );
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

    description(description, body) {
        const suite = new Suite(description, body, this._context, this._context[0]._indent + INDENT_LEVEL);
        this._context[0]._benchmarks.push(suite);
    }

    async *run_all_cases() {
        this._context.unshift(this);
        if (this._name) {
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
                x[col] = x[col] || "-";
            }
            return x;
        });
    }
}
