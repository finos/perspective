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

import { test, expect } from "../helpers.ts";

test.beforeEach(async ({ page }) => {
    await page.goto("/rust/perspective-viewer/test/html/superstore.html");
    await page.evaluate(async () => {
        while (!window["__TEST_PERSPECTIVE_READY__"]) {
            await new Promise((x) => setTimeout(x, 10));
        }
    });

    await page.evaluate(async () => {
        await document.querySelector("perspective-viewer").restore({
            plugin: "Debug",
            title: "Grid",
        });

        window["__AGENT_CALLS__"] = [];
        window["__MAKE_ENGINE__"] = (script) => ({
            chat: {
                completions: {
                    create: async (request) => {
                        window["__AGENT_CALLS__"].push(request);
                        const results = request.messages
                            .filter((m) => m.role === "tool")
                            .map((m) => JSON.parse(m.content));

                        let step = script.shift();
                        if (!step) {
                            throw new Error("Fake engine script exhausted");
                        }

                        if (typeof step === "function") {
                            step = step(results);
                        }

                        const message = step.tool
                            ? {
                                  role: "assistant",
                                  content: "",
                                  tool_calls: [
                                      {
                                          id: `call_${script.length}`,
                                          type: "function",
                                          function: {
                                              name: step.tool,
                                              arguments: JSON.stringify(
                                                  step.args ?? {},
                                              ),
                                          },
                                      },
                                  ],
                              }
                            : { role: "assistant", content: step.text };

                        return {
                            id: `chatcmpl-${script.length}`,
                            object: "chat.completion",
                            created: 0,
                            model: "fake-model",
                            choices: [
                                {
                                    index: 0,
                                    message,
                                    finish_reason: step.tool
                                        ? "tool_calls"
                                        : "stop",
                                },
                            ],
                        };
                    },
                },
            },
        });
    });
});

async function toolResults(page) {
    return await page.evaluate(() => {
        const calls = window["__AGENT_CALLS__"];
        return calls[calls.length - 1].messages
            .filter((m) => m.role === "tool")
            .map((m) => JSON.parse(m.content));
    });
}

test.describe("llm-agent workspace layout tools", () => {
    test("add_panel then one set_workspace builds a two-over-one dashboard", async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            const table = (await viewer.save()).table;
            const [grid] = viewer.getPanelNames();
            const tab = (id) => ({
                type: "tab-layout",
                tabs: [id],
                selected: 0,
            });

            const layout = (sales, profit) => ({
                type: "split-layout",
                orientation: "vertical",
                sizes: [0.55, 0.45],
                children: [
                    {
                        type: "split-layout",
                        orientation: "horizontal",
                        sizes: [0.5, 0.5],
                        children: [tab(sales), tab(profit)],
                    },
                    tab(grid),
                ],
            });

            viewer.agentConfig({
                name: "webllm",
                maxTurns: 10,
                engine: window["__MAKE_ENGINE__"]([
                    { tool: "get_workspace" },
                    {
                        tool: "add_panel",
                        args: {
                            config: {
                                table,
                                title: "Sales",
                                plugin: "Debug",
                                columns: ["Sales"],
                            },
                        },
                    },
                    {
                        tool: "add_panel",
                        args: {
                            config: {
                                table,
                                title: "Profit",
                                plugin: "Debug",
                                columns: ["Profit"],
                            },
                        },
                    },
                    (results) => ({
                        tool: "set_workspace",
                        args: {
                            config: {
                                layout: layout(
                                    results[1].panel,
                                    results[2].panel,
                                ),
                            },
                        },
                    }),
                    { text: "Built the dashboard." },
                ]),
            });

            const answer = await viewer.agentPrompt("Build a dashboard");
            const token = await viewer.saveWorkspace();
            const [, sales, profit] = viewer.getPanelNames();
            return {
                answer,
                grid,
                token,
                expected: layout(sales, profit),
                titles: Object.fromEntries(
                    Object.entries(token.panels).map(([id, config]) => [
                        id,
                        config.title,
                    ]),
                ),
            };
        });

        expect(result.answer).toEqual("Built the dashboard.");
        expect(result.token.layout).toEqual(result.expected);
        expect(Object.values(result.titles).sort()).toEqual([
            "Grid",
            "Profit",
            "Sales",
        ]);

        const system = await page.evaluate(() =>
            JSON.stringify(window["__AGENT_CALLS__"][0].messages[0].content),
        );

        expect(system).toContain("set_workspace");
        expect(system).toContain("split-layout");

        const results = await toolResults(page);
        expect(results[0].layout).toBeDefined();
        expect(results[0].panels[result.grid].title).toEqual("Grid");
        expect(results[3].error).toBeUndefined();
        expect(results[3].layout).toEqual(result.expected);
        expect(Object.keys(results[3].panels).length).toEqual(3);
    });

    test("an invalid layout changes nothing and the corrected retry applies", async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            const table = (await viewer.save()).table;
            const [first] = viewer.getPanelNames();
            const before = (await viewer.saveWorkspace()).layout;
            viewer.agentConfig({
                name: "webllm",
                maxTurns: 10,
                engine: window["__MAKE_ENGINE__"]([
                    {
                        tool: "add_panel",
                        args: { config: { table, columns: ["Sales"] } },
                    },
                    {
                        tool: "set_workspace",
                        args: {
                            config: {
                                layout: { type: "tab-layout", tabs: [first] },
                            },
                        },
                    },
                    (results) => ({
                        tool: "set_workspace",
                        args: {
                            config: {
                                layout: {
                                    type: "tab-layout",
                                    tabs: [first, results[0].panel],
                                    selected: 1,
                                },
                            },
                        },
                    }),
                    { text: "Stacked." },
                ]),
            });

            await viewer.agentPrompt("Stack the panels as tabs");
            return {
                before,
                names: viewer.getPanelNames(),
                layout: (await viewer.saveWorkspace()).layout,
            };
        });

        const results = await toolResults(page);
        expect(results[1].error).toContain("missing");
        expect(results[2].error).toBeUndefined();
        expect(result.layout).toEqual({
            type: "tab-layout",
            tabs: result.names,
            selected: 1,
        });
    });

    test("set_workspace refuses `panels`", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            const before = viewer.getPanelNames();
            viewer.agentConfig({
                name: "webllm",
                engine: window["__MAKE_ENGINE__"]([
                    { tool: "set_workspace", args: { config: { panels: {} } } },
                    { text: "Could not." },
                ]),
            });

            await viewer.agentPrompt("Remove everything");
            return { before, after: viewer.getPanelNames() };
        });

        const results = await toolResults(page);
        expect(results[0].error).toContain("add_panel");
        expect(result.after).toEqual(result.before);
    });

    test("a derived table defined by set_workspace is bound by add_panel", async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            const table = (await viewer.save()).table;
            viewer.agentConfig({
                name: "webllm",
                maxTurns: 10,
                engine: window["__MAKE_ENGINE__"]([
                    {
                        tool: "set_workspace",
                        args: {
                            config: {
                                derived_tables: {
                                    "By Region": {
                                        table,
                                        group_by: ["Region"],
                                        columns: ["Sales"],
                                    },
                                },
                            },
                        },
                    },
                    {
                        tool: "add_panel",
                        args: {
                            config: {
                                table: "By Region",
                                title: "Regions",
                                columns: ["Sales"],
                            },
                        },
                    },
                    { text: "Added." },
                ]),
            });

            await viewer.agentPrompt("Show sales by region from a summary");
            const token = await viewer.saveWorkspace();
            return {
                derived: Object.keys(token.derived_tables ?? {}),
                tables: Object.values(token.panels).map((x) => x.table),
            };
        });

        const results = await toolResults(page);
        expect(results[0].error).toBeUndefined();
        expect(results[0].derived_tables["By Region"]).toBeDefined();
        expect(results[1].error).toBeUndefined();
        expect(result.derived).toEqual(["By Region"]);
        expect(result.tables).toContain("By Region");
    });

    test("dropping a derived table a panel reads is refused", async ({
        page,
    }) => {
        const result = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            const table = (await viewer.save()).table;
            const [first] = viewer.getPanelNames();
            await viewer.restoreWorkspace({
                derived_tables: {
                    "By Region": {
                        table,
                        group_by: ["Region"],
                        columns: ["Sales"],
                    },
                },
            });

            await viewer.addPanel({ table: "By Region", columns: ["Sales"] });
            viewer.agentConfig({
                name: "webllm",
                engine: window["__MAKE_ENGINE__"]([
                    {
                        tool: "set_workspace",
                        args: { config: { derived_tables: {} } },
                    },
                    { text: "Could not." },
                ]),
            });

            await viewer.agentPrompt("Delete the derived tables");
            const token = await viewer.saveWorkspace();
            return { first, derived: Object.keys(token.derived_tables ?? {}) };
        });

        const results = await toolResults(page);
        expect(results[0].error).toContain("COMPLETE set");
        expect(results[0].error).toContain("By Region");
        expect(result.derived).toEqual(["By Region"]);
    });

    test("a derived table reading an unknown table is refused", async ({
        page,
    }) => {
        const derived = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            viewer.agentConfig({
                name: "webllm",
                engine: window["__MAKE_ENGINE__"]([
                    {
                        tool: "set_workspace",
                        args: {
                            config: {
                                derived_tables: {
                                    Orphan: {
                                        table: "nope",
                                        group_by: ["Region"],
                                    },
                                },
                            },
                        },
                    },
                    { text: "Could not." },
                ]),
            });

            await viewer.agentPrompt("Summarize a missing table");
            return (await viewer.saveWorkspace()).derived_tables;
        });

        const results = await toolResults(page);
        expect(results[0].error).toContain("unknown table `nope`");
        expect(derived).toBeUndefined();
    });

    test("set_workspace links master and detail panels", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            const table = (await viewer.save()).table;
            const [first] = viewer.getPanelNames();
            await viewer.addPanel({ table, columns: ["Sales"] });
            viewer.agentConfig({
                name: "webllm",
                engine: window["__MAKE_ENGINE__"]([
                    {
                        tool: "set_workspace",
                        args: {
                            config: {
                                masters: [first],
                                global_filters: [["Region", "==", "West"]],
                            },
                        },
                    },
                    { text: "Linked." },
                ]),
            });

            await viewer.agentPrompt("Link the panels");
            const token = await viewer.saveWorkspace();
            return {
                first,
                masters: token.masters,
                global_filters: token.global_filters,
            };
        });

        const results = await toolResults(page);
        expect(results[0].masters).toEqual([result.first]);
        expect(result.masters).toEqual([result.first]);
        expect(result.global_filters).toEqual([["Region", "==", "West"]]);
    });

    test("withholding manage_layout hides set_workspace but not get_workspace", async ({
        page,
    }) => {
        const tools = await page.evaluate(async () => {
            const viewer = document.querySelector("perspective-viewer");
            viewer.agentConfig({
                name: "webllm",
                entitlements: ["read_view", "configure_view", "read_docs"],
                engine: window["__MAKE_ENGINE__"]([{ text: "ok" }]),
            });

            await viewer.agentPrompt("hello");
            return window["__AGENT_CALLS__"][0].tools.map(
                (x) => x.function.name,
            );
        });

        expect(tools).toContain("get_workspace");
        expect(tools).not.toContain("set_workspace");
        expect(tools).not.toContain("add_panel");
    });
});
