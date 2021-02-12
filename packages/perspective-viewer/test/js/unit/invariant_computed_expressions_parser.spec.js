/* eslint-disable no-undef */
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import * as jsc from "jsverify";
import perspective from "@finos/perspective";
import {COMPUTED_EXPRESSION_PARSER} from "../../../src/js/computed_expressions/computed_expression_parser";

let TABLE;

const replicate = (n, g) => jsc.tuple(new Array(n).fill(g));

const array_equals = function(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
};

const generator = function(length = 100, start = 0) {
    const min = start ? start : 0;
    return jsc.record({
        w: replicate(length, jsc.number(min, 1000000)),
        x: replicate(length, jsc.number(min, 1000000)),
        y: replicate(length, jsc.number(min, 1000000)),
        z: replicate(length, jsc.number(min, 1000000))
    });
};

describe("Invariant computed expressions", function() {
    beforeAll(async () => {
        TABLE = await perspective.table({
            a: [1, 2, 3]
        });
        const computed_functions = await TABLE.get_computed_functions();
        COMPUTED_EXPRESSION_PARSER.init(computed_functions);
    });

    afterAll(() => {
        TABLE.delete();
    });

    /**
     * Test that the parser generates valid computed columns that are in line
     * with the properties of real numbers. This allows us to assert
     * correctness, left-to-right associativity, and the correctness of the
     * computed columns themselves after they are constructed.
     */
    describe("Properties of real numbers", () => {
        jsc.property("x + y + z == z + y + x", generator(), async data => {
            const table = await perspective.table(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" + "y" as "temp" + "z" as "first"')
            });

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"z" + "y" as "temp2" + "x" as "second"')
            });

            const expected = array_equals(await v1.to_columns()["first"], await v2.to_columns()["second"]);

            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("x + (y + z) == (x + y) + z", generator(), async data => {
            const table = await perspective.table(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" + ("y" + "z") as "first"')
            });

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('("x" + "y") + "z" as "second"')
            });

            const expected = array_equals(await v1.to_columns()["first"], await v2.to_columns()["second"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("x - x + x == x + x - x", generator(), async data => {
            const table = await perspective.table(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" - "x" as "temp" + "x" as "first"')
            });

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" + "x" as "temp2" - "x" as "second"')
            });

            const expected = array_equals(await v1.to_columns()["first"], await v2.to_columns()["second"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("x * y * z == z * y * x", generator(), async data => {
            const table = await perspective.table(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" * "y" as "temp" * "z" as "first"')
            });

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"z" * "y" as "temp2" * "x" as "second"')
            });

            const expected = array_equals(await v1.to_columns()["first"], await v2.to_columns()["second"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("x * (y * z) == (x * y) * z", generator(), async data => {
            const table = await perspective.table(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" * ("y" * "z") as "first"')
            });

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('("x" * "y") * "z" as "second"')
            });

            const expected = array_equals(await v1.to_columns()["first"], await v2.to_columns()["second"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("invert(x) * x == x * invert(x)", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('invert("x") * "x" as "first"')
            });

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"x" * invert("x")')
            });

            const r1 = await v1.to_columns();
            const r2 = await v2.to_columns();

            const expected = array_equals(r1["first"], r2["(x * (1 / x))"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });
    });

    describe("Boolean operators with associativity", () => {
        jsc.property("x + y * z == z * y + x", generator(), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const computed_columns = [
                COMPUTED_EXPRESSION_PARSER.parse('"x" + "y" * "z"'),
                COMPUTED_EXPRESSION_PARSER.parse('"z" * "y" + "x"'),
                COMPUTED_EXPRESSION_PARSER.parse('"(x + (y * z))" == "((z * y) + x)" as "final"')
            ];

            const view = await table.view({
                computed_columns: computed_columns.flat()
            });

            const result = await view.to_columns();

            const expected = array_equals(result["(x + (y * z))"], result["((z * y) + x)"]) && array_equals(result["final"], Array(100).fill(true));
            view.delete();
            table.delete();
            return expected;
        });

        jsc.property("x + y * z != (x + y) * z", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const computed_columns = [
                COMPUTED_EXPRESSION_PARSER.parse('"x" + "y" * "z"'),
                COMPUTED_EXPRESSION_PARSER.parse('("x" + "y") * "z"'),
                COMPUTED_EXPRESSION_PARSER.parse('"(x + (y * z))" != "((x + y) * z)" as "final"')
            ];

            const view = await table.view({
                computed_columns: computed_columns.flat()
            });

            const result = await view.to_columns();

            const expected = !array_equals(result["(x + (y * z))"], result["((x + y) * z)"]) && array_equals(result["final"], Array(100).fill(true));
            view.delete();
            table.delete();
            return expected;
        });
    });

    describe("Operator precedence", () => {
        jsc.property("w + x - y * z / w == w + x - ((y * z) / w)", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" - "y" * "z" / "w"')
            });

            const r1 = await v1.to_columns();

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" - (("y" * "z") / "w")')
            });

            const r2 = await v2.to_columns();

            const expected = array_equals(r1["((w + x) - ((y * z) / w)"], r2["((w + x) - ((y * z) / w)"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("w + x * y ^ z == w + x * (y ^ z)", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" - "y" * "z" / "w"')
            });

            const r1 = await v1.to_columns();

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" - (("y" * "z") / "w")')
            });

            const r2 = await v2.to_columns();

            const expected = array_equals(r1["((w + x) - ((y * z) / w)"], r2["((w + x) - ((y * z) / w)"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("w + x - pow2(y) * z == w + x - (pow2(y) * z)", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" - pow2("y") * "z"')
            });

            const r1 = await v1.to_columns();

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" - (pow2("y") * "z")')
            });

            const r2 = await v2.to_columns();

            const expected = array_equals(r1["((w + x) - (pow2(y) * z))"], r2["((w + x) - (pow2(y) * z))"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("log(w + x - y * z / w) == log(w + x - ((y * z) / w))", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('log("w" + "x" - "y" * "z" / "w")')
            });

            const r1 = await v1.to_columns();

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('log("w" + "x" - (("y" * "z") / "w"))')
            });

            const r2 = await v2.to_columns();

            const expected = array_equals(r1["log((w + x) - ((y * z) / w))"], r2["log((w + x) - ((y * z) / w))"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });

        jsc.property("w + x == y - z == (w + x) == (y - z)", generator(100, 2), async data => {
            const table = await perspective.table({
                w: "float",
                x: "float",
                y: "float",
                z: "float"
            });

            table.update(data);

            const v1 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('"w" + "x" == "y" - "z"')
            });

            const r1 = await v1.to_columns();

            const v2 = await table.view({
                computed_columns: COMPUTED_EXPRESSION_PARSER.parse('("w" + "x") == ("y" - "z")')
            });

            const r2 = await v2.to_columns();

            const expected = array_equals(r1["((w + x) == (y - z))"], r2["((w + x) == (y - z))"]);
            v2.delete();
            v1.delete();
            table.delete();
            return expected;
        });
    });
});
