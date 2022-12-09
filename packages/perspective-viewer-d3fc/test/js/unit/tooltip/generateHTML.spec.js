/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const { select } = require("d3");
const { generateHtml } = require("../../../../src/js/tooltip/generateHTML");
const {
    get_type_config,
} = require("@finos/perspective/dist/cjs/perspective.node.js");

describe("tooltip generateHTML should", () => {
    let tooltip = null;
    let settings = null;

    beforeEach(() => {
        tooltip = select("body").append("div").classed("tooltip-test", true);
        tooltip.append("div").attr("id", "tooltip-values");

        settings = {
            crossValues: [],
            splitValues: [],
            mainValues: [{ name: "main-1", type: "integer" }],
            realValues: ["main-1"],
        };
    });
    afterEach(() => {
        tooltip.remove();
    });

    const getContent = () => {
        const content = [];
        tooltip.selectAll("li").each((d, i, nodes) => {
            content.push(select(nodes[i]).text());
        });
        return content;
    };

    test("show single mainValue", () => {
        const data = {
            mainValue: 101,
        };
        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual(["main-1: 101"]);
    });

    test("show multiple mainValues", () => {
        settings.mainValues.push({ name: "main-2", type: "float" });
        settings.realValues.push("main-2");
        const data = {
            mainValues: [101, 202.22],
        };
        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual(["main-1: 101", "main-2: 202.22"]);
    });

    test("format mainValue as date", () => {
        settings.mainValues[0].type = "datetime";
        const testDate = new Date("2019-04-03T15:15Z");
        const data = {
            mainValue: testDate.getTime(),
        };
        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual([
            `main-1: ${testDate.toLocaleString(
                [],
                get_type_config("datetime").format
            )}`,
        ]);
    });

    test("format mainValue as integer", () => {
        settings.mainValues[0].type = "integer";
        const data = {
            mainValue: 12345.6789,
        };
        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual(["main-1: 12,345"]);
    });

    test("format mainValue as decimal", () => {
        settings.mainValues[0].type = "float";
        const data = {
            mainValue: 12345.6789,
        };
        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual(["main-1: 12,345.679"]);
    });

    test("show with single crossValue", () => {
        settings.crossValues.push({ name: "cross-1", type: "string" });
        const data = {
            crossValue: "tc-1",
            mainValue: 101,
        };

        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual(["cross-1: tc-1", "main-1: 101"]);
    });

    test("show with multiple crossValues", () => {
        settings.crossValues.push({ name: "cross-1", type: "string" });
        settings.crossValues.push({ name: "cross-2", type: "integer" });
        const data = {
            crossValue: "tc-1|1001",
            mainValue: 101,
        };

        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual([
            "cross-1: tc-1",
            "cross-2: 1,001",
            "main-1: 101",
        ]);
    });

    test("show with single splitValue", () => {
        settings.splitValues.push({ name: "split-1", type: "string" });
        const data = {
            key: "ts-1",
            mainValue: 101,
        };

        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual(["split-1: ts-1", "main-1: 101"]);
    });

    test("show with multiple splitValues", () => {
        settings.splitValues.push({ name: "split-1", type: "string" });
        settings.splitValues.push({ name: "split-2", type: "integer" });
        const data = {
            key: "ts-1|1001",
            mainValue: 101,
        };

        generateHtml(tooltip, data, settings);
        expect(getContent()).toEqual([
            "split-1: ts-1",
            "split-2: 1,001",
            "main-1: 101",
        ]);
    });

    test("Provide default number formatting for null and undefined types", () => {
        settings.splitValues.push({ name: "split-1", type: "string" });
        settings.splitValues.push({ name: "split-2", type: null });
        settings.splitValues.push({ name: "split-3", type: undefined });

        const data = {
            key: "ts-1",
            mainValue: 101,
        };

        generateHtml(tooltip, data, settings);

        expect(getContent()).toEqual([
            "split-1: ts-1",
            "split-2: -",
            "split-3: -",
            "main-1: 101",
        ]);
    });
});
