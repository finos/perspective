import new_perspective, { JsClient, JsTable } from "@finos/perspective";
import fs from "node:fs";
// @ts-ignore
import psp_2_10_0 from "perspective-2-10-0/dist/cjs/perspective.node.js";
import { Type, command, option, run, string } from "cmd-ts";

// const perspective = old_perspective;

interface BenchCtx {
    smallTable: JsTable;
    mediumTable: JsTable;
    largeTable: JsTable;
    randomLargeTable: JsTable;
}

// async function createTable(psp, ctx: BenchCtx) {
//     const table = await psp.table({ x: [1, 2, 3] });
//     await table.delete();
// }

async function createEmptyView(_psp: JsClient, ctx: BenchCtx) {
    const view = await ctx.smallTable.view();
    view.delete();
    await ctx.smallTable.size();
}

async function rowPivotHighCardinality(_psp: JsClient, ctx: BenchCtx) {
    const view = await ctx.largeTable.view({
        group_by: ["x"],
    });
    view.delete();
    await ctx.largeTable.size();
}

async function orderingRandomDataset(_psp: JsClient, ctx: BenchCtx) {
    const view = await ctx.largeTable.view({
        sort: [["x", "desc"]],
    });
    view.delete();
    await ctx.largeTable.size();
}

async function groupAndSplit(_psp: JsClient, ctx: BenchCtx) {
    const view = await ctx.mediumTable.view({
        group_by: ["x"],
        split_by: ["x"],
    });
    view.delete();
    await ctx.mediumTable.size();
}

const BENCHMARKS = [
    createEmptyView,
    rowPivotHighCardinality,
    orderingRandomDataset,
    groupAndSplit,
];

const ITERATIONS = 1_000;
const CONNECTIONS_PER_BENCHMARK = 100;

interface BenchmarkData {
    name: string;
    version: string;
    timing: number;
    ts: number;
}

const START_DATE = new Date();
START_DATE.setHours(0, 0, 0, 0);

async function runBenchmark(
    psp: JsClient,
    pspVersion: string,
    benchStart: bigint,
    benchmark: (_: JsClient) => Promise<void>
) {
    const start = process.hrtime.bigint();
    await benchmark(psp);
    const end = process.hrtime.bigint();
    return {
        name: (benchmark as any).theName,
        version: pspVersion,
        timing: Number(end - start),
        ts: +START_DATE + Number(start - benchStart) / 1_000_000,
    };
}

const PSP_VERSIONS = ["3.0.0", "2.10.0"] as const;
type PspVersion = typeof PSP_VERSIONS[number];
const PspVersion: Type<string, PspVersion> = {
    ...string,
    from: (s) => {
        if (PSP_VERSIONS.includes(s as any)) {
            return Promise.resolve(s as PspVersion);
        } else {
            throw new Error(
                `Invalid perspective version: ${s}\nExpected one of: ${PSP_VERSIONS.join(
                    ", "
                )}`
            );
        }
    },
    defaultValue: () => PSP_VERSIONS[0],
    description: PSP_VERSIONS.join(" | "),
};

const app = command({
    name: "bench",
    args: {
        pspVersion: option({
            type: PspVersion,
            long: "psp-version",
            short: "p",
        }),
        output: option({
            type: string,
            long: "output",
            short: "o",
            defaultValue: () => "results.arrow",
        }),
    },
    // Break circular type reference
    handler: () => {},
});

type FirstArgType<T> = T extends (arg1: infer U, ...args: any[]) => any
    ? U
    : never;
type AppOutput = FirstArgType<typeof app["handler"]>;
// Wtf? Is there not a builtin way to do this?

async function main({ pspVersion, output }: AppOutput) {
    let perspective = new_perspective;
    switch (pspVersion) {
        case "2.10.0":
            perspective = psp_2_10_0;
            break;
        case "3.0.0":
            perspective = new_perspective;
            break;
    }
    const psp = await perspective.websocket("ws://localhost:8080/ws");
    const resultTable = await psp.table(
        {
            name: "string",
            version: "string",
            timing: "float",
            ts: "datetime",
        }
        // { name: "Benchmarks" }
    );
    console.log("Running benchmarks...");
    const createCtx = async (psp: JsClient) => {
        const smallTable = await psp.table({ x: [1, 2, 3] });
        await smallTable.size();
        const mediumTable = await psp.table({
            x: new Array(1000).fill(0).map((_, i) => i),
        });
        await mediumTable.size();
        const largeTable = await psp.table({
            x: new Array(10000).fill(0).map((_, i) => i),
        });
        await largeTable.size();
        const randomLargeTable = await psp.table({
            x: new Array(10000)
                .fill(0)
                .map((_, i) => Math.random() * Number.MAX_SAFE_INTEGER),
        });
        await randomLargeTable.size();
        return {
            smallTable,
            mediumTable,
            largeTable,
            randomLargeTable,
        };
    };
    // for (const benchmark of BENCHMARKS) {
    const clientCtxMap = await BENCHMARKS.reduce(
        async (accPromise, benchmark) => {
            const acc = await accPromise;
            console.log(`Creating contexts for benchmark ${benchmark.name}...`);
            acc[benchmark.name] =
                acc[benchmark.name] ||
                (await Promise.all(
                    Array(CONNECTIONS_PER_BENCHMARK)
                        .fill(null)
                        .map(async () => {
                            const psp = await perspective.websocket(
                                "ws://localhost:8080/ws"
                            );
                            const ctx = await createCtx(psp);
                            return { ctx, client: psp };
                        })
                ));
            return acc;
        },
        Promise.resolve({}) as Promise<
            Record<string, { ctx: BenchCtx; client: JsClient }[]>
        >
    );
    const startDate = process.hrtime.bigint();
    for (const benchmark of BENCHMARKS) {
        // await Promise.all(
        // BENCHMARKS.map(async (benchmark) => {
        console.log(`Running benchmark ${benchmark.name}...`);
        const iterations: number[][] = Array.from(
            { length: Math.ceil(ITERATIONS / CONNECTIONS_PER_BENCHMARK) },
            (_, i) =>
                Array.from(
                    { length: CONNECTIONS_PER_BENCHMARK },
                    (_, j) => i * CONNECTIONS_PER_BENCHMARK + j
                )
        );
        let chunk: BenchmarkData[] = [];
        for (let clientBatch of iterations) {
            await Promise.all(
                clientBatch.map(async (i) => {
                    const { client: psp, ctx } =
                        clientCtxMap[benchmark.name][
                            i % CONNECTIONS_PER_BENCHMARK
                        ];
                    const fn = (psp: any) => benchmark(psp, ctx);
                    fn.theName = benchmark.name;
                    const data = await runBenchmark(
                        psp,
                        pspVersion,
                        startDate,
                        fn
                    );
                    chunk.push(data);
                    if (chunk.length >= 100) {
                        console.log(
                            `Benchmark ${data.name} finished chunk, updating results...`
                        );
                        resultTable.update(chunk);
                        chunk = [];
                    } else if (chunk.length % 50 === 0) {
                        console.log(
                            `Benchmark ${data.name} iteration ${chunk.length}...`
                        );
                    }
                })
            );
            // })
            // );
        }
        if (chunk.length > 0) {
            console.log("Finished last chunk, updating results...");
            resultTable.update(chunk);
            chunk = [];
        }
    }
    const v = await resultTable.view();
    fs.writeFileSync(output, new Uint8Array(await v.to_arrow()));
    process.exit(0);
}
app.handler = main;

run(app, process.argv.slice(2));
