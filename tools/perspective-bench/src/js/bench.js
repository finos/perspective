const fs = require("fs");
const microtime = require("microtime");
const psp = require("@finos/perspective");
const path = require("path");

const VERSIONS = [
    "@finos/perspective",
    ...Object.keys(
        JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json")))
            .dependencies
    ),
];

function load_version(path) {
    const module = require(path);
    const {version} = JSON.parse(
        fs.readFileSync(require.resolve(`${path}/package.json`))
    );

    return {version, perspective: module.default || module};
}

const MODULES = VERSIONS.map(load_version);

const SUPERSTORE_ARROW = fs.readFileSync(
    require.resolve("superstore-arrow/superstore.arrow")
).buffer;

const ITERATIONS = 10;
const WARM_UP_ITERATIONS = 1;

Object.defineProperty(Array.prototype, "push_if", {
    value: function (x) {
        if (x !== undefined) {
            this.push(x);
        }
    },
});

Object.defineProperty(Array.prototype, "sum", {
    value: function () {
        return this.reduce((x, y) => x + y, 0);
    },
});

async function benchmark({name, before, before_all, test, after, after_all}) {
    let obs_records = [];
    for (const {version, perspective} of MODULES) {
        const args = [];
        args.push_if(await before_all?.(perspective));
        const observations = [];
        for (let i = 0; i < ITERATIONS + WARM_UP_ITERATIONS; i++) {
            const args2 = args.slice();
            args2.push_if(await before?.(perspective, ...args2));
            const start = microtime.now();
            args2.push_if(await test(perspective, ...args2));
            if (i >= WARM_UP_ITERATIONS) {
                observations.push(microtime.now() - start);
            }

            await after?.(perspective, ...args2);
        }

        const avg = observations.sum() / observations.length / 1000;
        console.log(`${version} ${avg.toFixed(3)}ms`);
        await after_all?.(perspective, ...args);

        obs_records = obs_records.concat(
            observations.map((obs) => ({
                version: version,
                time: obs,
                benchmark: name,
            }))
        );
    }

    const table = await OBS_TABLE;
    const view = await OBS_VIEW;
    await table.update(obs_records);
    const arrow = await view.to_arrow();
    fs.writeFileSync(
        path.join(__dirname, "../../dist/benchmark.arrow"),
        Buffer.from(arrow),
        "binary"
    );
}

const OBS_TABLE = psp.table({
    version: "string",
    time: "float",
    benchmark: "string",
});

const OBS_VIEW = OBS_TABLE.then((table) => table.view());

async function to_data_suite() {
    async function before_all(perspective) {
        const table = await perspective.table(SUPERSTORE_ARROW.slice());
        const view = await table.view();
        return {table, view};
    }

    async function after_all(perspective, {table, view}) {
        await view.delete();
        await table.delete();
    }

    await benchmark({
        name: `.to_arrow()`,
        before_all,
        after_all,
        async test(_perspective, {view}) {
            const _arrow = await view.to_arrow();
        },
    });

    await benchmark({
        name: `.to_csv()`,
        before_all,
        after_all,
        async test(_perspective, {view}) {
            const _csv = await view.to_csv();
        },
    });

    await benchmark({
        name: `.to_columns()`,
        before_all,
        after_all,
        async test(_perspective, {view}) {
            const _columns = await view.to_columns();
        },
    });

    await benchmark({
        name: `.to_json()`,
        before_all,
        after_all,
        async test(_perspective, {view}) {
            const _json = await view.to_json();
        },
    });
}

async function view_suite() {
    async function before_all(perspective) {
        const table = await perspective.table(SUPERSTORE_ARROW.slice());
        for (let i = 0; i < 4; i++) {
            await table.update(SUPERSTORE_ARROW.slice());
        }

        return table;
    }

    async function after_all(perspective, table) {
        await table.delete();
    }

    async function after(perspective, table, view) {
        await view.delete();
    }

    await benchmark({
        name: `.view()`,
        before_all,
        after_all,
        after,
        async test(_perspective, table) {
            return await table.view();
        },
    });
}

async function table_suite() {
    await benchmark({
        name: `.table(arrow)`,
        async after(_perspective, table) {
            await table.delete();
        },
        async test(perspective) {
            return await perspective.table(SUPERSTORE_ARROW.slice());
        },
    });
}

async function bench_all() {
    await to_data_suite();
    await view_suite();
    await table_suite();
}

bench_all();
