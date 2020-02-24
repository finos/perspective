/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Tests the correctness of each string computation function in various
 * environments and parameters - different types, nulls, undefined, etc.
 */
module.exports = perspective => {
    describe("String, arity 1", function() {
        it("Length", async function() {
            const table = perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "length",
                        inputs: ["a"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => x.length));
            view.delete();
            table.delete();
        });

        it("Length with null", async function() {
            const table = perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "length",
                        inputs: ["a"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x.length : null)));
            view.delete();
            table.delete();
        });

        it("Uppercase", async function() {
            const table = perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Uppercase",
                        inputs: ["a"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => x.toUpperCase()));
            view.delete();
            table.delete();
        });

        it("Uppercase with null", async function() {
            const table = perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Uppercase",
                        inputs: ["a"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x.toUpperCase() : null)));
            view.delete();
            table.delete();
        });

        it.skip("Uppercase, non-utf8", async function() {
            const table = perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "upper1",
                        computed_function_name: "Uppercase",
                        inputs: ["a"]
                    },
                    {
                        column: "upper2",
                        computed_function_name: "Uppercase",
                        inputs: ["b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected1 = result.upper1.map(x => (x ? x.toUpperCase() : null));
            let expected2 = result.upper2.map(x => (x ? x.toUpperCase() : null));
            expect(result.upper1).toEqual(expected1);
            expect(result.upper2).toEqual(expected2);
            view.delete();
            table.delete();
        });

        it("Lowercase", async function() {
            const table = perspective.table({
                a: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Lowercase",
                        inputs: ["a"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => x.toLowerCase()));
            view.delete();
            table.delete();
        });

        it("Lowercase with null", async function() {
            const table = perspective.table({
                a: ["ABC", "DEF", null, undefined, "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "Lowercase",
                        inputs: ["a"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map(x => (x ? x.toLowerCase() : null)));
            view.delete();
            table.delete();
        });

        it("Lowercase, non-utf8", async function() {
            const table = perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "lower1",
                        computed_function_name: "Lowercase",
                        inputs: ["a"]
                    },
                    {
                        column: "lower2",
                        computed_function_name: "Lowercase",
                        inputs: ["b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected1 = result.lower1.map(x => (x ? x.toLowerCase() : null));
            let expected2 = result.lower2.map(x => (x ? x.toLowerCase() : null));
            expect(result.lower1).toEqual(expected1);
            expect(result.lower2).toEqual(expected2);
            view.delete();
            table.delete();
        });
    });

    describe("String, arity 2", function() {
        it("Concat with space", async function() {
            const table = perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_space",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map((x, idx) => x + " " + result.b[idx]));
            view.delete();
            table.delete();
        });

        it("Concat with comma", async function() {
            const table = perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_comma",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.computed).toEqual(result.a.map((x, idx) => x + ", " + result.b[idx]));
            view.delete();
            table.delete();
        });

        it("Concats with space, nulls", async function() {
            const table = perspective.table({
                a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_space",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected = result.a.map((x, idx) => x + " " + result.b[idx]);
            expected[1] = null;
            expected[2] = null;
            expect(result.computed).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats with comma, nulls", async function() {
            const table = perspective.table({
                a: ["ABC", "DEF", undefined, "HIjK", "lMNoP"],
                b: ["ABC", null, "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_comma",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected = result.a.map((x, idx) => x + ", " + result.b[idx]);
            expected[1] = null;
            expected[2] = null;
            expect(result.computed).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats with space, extra long", async function() {
            const table = perspective.table({
                a: ["ABC".repeat(10), "DEF".repeat(10), null, "HIjK".repeat(10), "lMNoP".repeat(10)],
                b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_space",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected = result.a.map((x, idx) => x + " " + result.b[idx]);
            expected[1] = null;
            expected[2] = null;
            expect(result.computed).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats with comma, extra long", async function() {
            const table = perspective.table({
                a: ["ABC".repeat(10), "DEF".repeat(10), undefined, "HIjK".repeat(10), "lMNoP".repeat(10)],
                b: ["ABC", null, "EfG", "HIjK", "lMNoP"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_comma",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected = result.a.map((x, idx) => x + ", " + result.b[idx]);
            expected[1] = null;
            expected[2] = null;
            expect(result.computed).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats with space, non-utf8", async function() {
            const table = perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_space",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected = result.a.map((x, idx) => x + " " + result.b[idx]);
            expected[2] = null;
            expect(result.computed).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats with comma, non-utf8", async function() {
            const table = perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = table.view({
                computed_columns: [
                    {
                        column: "computed",
                        computed_function_name: "concat_comma",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            let expected = result.a.map((x, idx) => x + ", " + result.b[idx]);
            expected[2] = null;
            expect(result.computed).toEqual(expected);
            view.delete();
            table.delete();
        });
    });
};
