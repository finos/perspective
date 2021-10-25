/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const {string} = require("jsverify");

const CHARS = ` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`;
const randint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + 1;
/**
 * Generate a random string for testing. If `is_null` is true, randomly returns
 * null with a 50% chance.
 *
 * @param {*} is_null
 */
const random_string = (max_length = 100, is_null = false) => {
    if (is_null && Math.random() > 0.5) return null;
    const length = randint(1, max_length);
    const output = [];

    for (let i = 0; i < length; i++) {
        output.push(CHARS[randint(0, CHARS.length)]);
    }

    return output.join("");
};

/**
 * Tests the correctness of each string computation function in various
 * environments and parameters - different types, nulls, undefined, etc.
 *
 * TODO: add tests for shared vocab after clear()
 */
module.exports = (perspective) => {
    describe("String functions", function () {
        it("Comparisons", async function () {
            const table = await perspective.table({
                x: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                y: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"],
            });
            const view = await table.view({
                expressions: [
                    `// a \n 'abcdefghijklmnopqrstuvwxyz' == 'abcdefghijklmnopqrstuvwxyz'`,
                    `// b \n "x" == lower("y")`,
                    `// c \n if("x" == 'abc', 100, 0)`,
                    `// d \n if("x" != 'abc', 'new string 1', 'new string 2')`,
                    `// e \n 'd' > 'a'`,
                    `// f \n 'efz' > 'efy'`, // lexicographic
                ],
            });

            let result = await view.to_columns();

            expect(result["a"]).toEqual(Array(5).fill(true));
            expect(result["b"]).toEqual([true, false, false, false, false]);
            expect(result["c"]).toEqual([100, 0, 0, 0, 0]);
            expect(result["d"]).toEqual([
                "new string 2",
                "new string 1",
                "new string 1",
                "new string 1",
                "new string 1",
            ]);
            expect(result["e"]).toEqual(Array(5).fill(true));
            expect(result["f"]).toEqual(Array(5).fill(true));

            view.delete();
            table.delete();
        });

        it("Pivoted", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"],
                c: [2, 2, 4, 4, 5],
            });
            const view = await table.view({
                aggregates: {column: "last"},
                row_pivots: ["column"],
                expressions: [
                    `//column\nconcat("a", ', ', 'here is a long string, ', "b")`,
                ],
            });
            let result = await view.to_columns();

            expect(result["column"]).toEqual([
                "hhs, here is a long string, HIjK",
                "abc, here is a long string, ABC",
                "abcdefghijk, here is a long string, lMNoP",
                "deeeeef, here is a long string, DEF",
                "fg, here is a long string, EfG",
                "hhs, here is a long string, HIjK",
            ]);

            view.delete();
            table.delete();
        });

        it("Filtered", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"],
                c: [2, 2, 4, 4, 5],
            });
            const view = await table.view({
                filter: [["column", "==", "hhs, here is a long string, HIjK"]],
                expressions: [
                    `//column\nconcat("a", ', ', 'here is a long string, ', "b")`,
                ],
            });
            let result = await view.to_columns();
            expect(result["column"]).toEqual([
                "hhs, here is a long string, HIjK",
            ]);
            view.delete();
            table.delete();
        });

        it("Length", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
            });
            const view = await table.view({
                expressions: ['length("a")'],
            });
            let result = await view.to_columns();
            expect(result['length("a")']).toEqual(
                result.a.map((x) => x.length)
            );
            view.delete();
            table.delete();
        });

        it("Length with null", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"],
            });
            const view = await table.view({
                expressions: ['length("a")'],
            });
            let result = await view.to_columns();
            expect(result['length("a")']).toEqual(
                result.a.map((x) => (x ? x.length : null))
            );
            view.delete();
            table.delete();
        });

        it("Order", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
            });

            const validate = await table.validate_expressions([
                `// col\norder("a", 'deeeeef', 'fg', 'abcdefghijk', 'hhs', 'abc')`,
            ]);

            expect(validate.expression_schema).toEqual({
                col: "float",
            });

            const view = await table.view({
                expressions: [
                    `order("a", 'deeeeef', 'fg', 'abcdefghijk', 'hhs', 'abc')`,
                ],
            });

            let result = await view.to_columns();
            expect(
                result[
                    `order("a", 'deeeeef', 'fg', 'abcdefghijk', 'hhs', 'abc')`
                ]
            ).toEqual([4, 0, 1, 3, 2]);

            view.delete();
            table.delete();
        });

        it("Order type validates", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: [1, 2, 3, 4, 5],
            });

            const validate = await table.validate_expressions([
                `// col\norder("a", 'deeeeef', 'fg', 'abcdefghijk', 'hhs', 'abc')`,
                `//col2\norder('a', 'b', today())`,
                `//col3\norder("b")`,
                `//col4\norder()`,
            ]);

            expect(validate.expression_schema).toEqual({
                col: "float",
            });

            expect(validate.errors).toEqual({
                col2: {
                    column: 0,
                    error_message:
                        "Type Error - inputs do not resolve to a valid expression.",
                    line: 0,
                },
                col3: {
                    column: 0,
                    error_message:
                        "Type Error - inputs do not resolve to a valid expression.",
                    line: 0,
                },
                col4: {
                    column: 8,
                    error_message:
                        "Parser Error - Zero parameter call to generic function: order not allowed",
                    line: 1,
                },
            });

            await table.delete();
        });

        it("Order with partial specification", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
            });
            const view = await table.view({
                expressions: [`order("a", 'deeeeef', 'fg')`],
            });
            let result = await view.to_columns();
            expect(result[`order("a", 'deeeeef', 'fg')`]).toEqual([
                2, 0, 1, 2, 2,
            ]);
            view.delete();
            table.delete();
        });

        it("Order with null", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"],
            });
            const view = await table.view({
                expressions: [`order("a", 'deeeeef', 'abcdefghijk', 'abc')`],
            });
            let result = await view.to_columns();
            expect(
                result[`order("a", 'deeeeef', 'abcdefghijk', 'abc')`]
            ).toEqual([2, 0, null, null, 1]);
            view.delete();
            table.delete();
        });

        it("Upper", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
            });
            const view = await table.view({
                expressions: ['upper("a")'],
            });
            let result = await view.to_columns();
            expect(result['upper("a")']).toEqual(
                result.a.map((x) => x.toUpperCase())
            );
            view.delete();
            table.delete();
        });

        it("Uppercase with null", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"],
            });
            const view = await table.view({
                expressions: ['upper("a")'],
            });
            let result = await view.to_columns();
            expect(result['upper("a")']).toEqual(
                result.a.map((x) => (x ? x.toUpperCase() : null))
            );
            view.delete();
            table.delete();
        });

        it.skip("Uppercase, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });
            const view = await table.view({
                expressions: ['upper("a")', 'upper("b")'],
            });
            let result = await view.to_columns();
            expect(result['upper("a")']).toEqual(
                result.a.map((x) => (x ? x.toUpperCase() : null))
            );
            expect(result['upper("b")']).toEqual(
                result.b.map((x) => (x ? x.toUpperCase() : null))
            );
            view.delete();
            table.delete();
        });

        it("Lowercase", async function () {
            const table = await perspective.table({
                a: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"],
            });
            const view = await table.view({
                expressions: ['lower("a")'],
            });
            let result = await view.to_columns();
            expect(result['lower("a")']).toEqual(
                result.a.map((x) => x.toLowerCase())
            );
            view.delete();
            table.delete();
        });

        it("Lowercase with null", async function () {
            const table = await perspective.table({
                a: ["ABC", "DEF", null, undefined, "lMNoP"],
            });
            const view = await table.view({
                expressions: ['lower("a")'],
            });
            let result = await view.to_columns();
            expect(result['lower("a")']).toEqual(
                result.a.map((x) => (x ? x.toLowerCase() : null))
            );
            view.delete();
            table.delete();
        });

        it("Lowercase, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });

            const view = await table.view({
                expressions: ['lower("a")', 'lower("b")'],
            });

            let result = await view.to_columns();
            expect(result['lower("a")']).toEqual(
                result.a.map((x) => (x ? x.toLowerCase() : null))
            );
            expect(result['lower("b")']).toEqual(
                result.b.map((x) => (x ? x.toLowerCase() : null))
            );
            view.delete();
            table.delete();
        });

        it("Concat", async function () {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"],
            });
            const view = await table.view({
                expressions: [
                    `concat("a", ', ', 'here is a long string, ', "b")`,
                ],
            });
            let result = await view.to_columns();
            expect(
                result[`concat("a", ', ', 'here is a long string, ', "b")`]
            ).toEqual(
                result.a.map(
                    (x, idx) => x + ", here is a long string, " + result.b[idx]
                )
            );
            view.delete();
            table.delete();
        });

        it("Concats, nulls", async function () {
            const table = await perspective.table({
                a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"],
            });
            const view = await table.view({
                expressions: [
                    `concat("a", ', ', 'here is a long string, ', "b")`,
                ],
            });
            let result = await view.to_columns();
            let expected = result.a.map(
                (x, idx) => x + ", here is a long string, " + result.b[idx]
            );
            expected[1] = null;
            expected[2] = null;
            expect(
                result[`concat("a", ', ', 'here is a long string, ', "b")`]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats, extra long", async function () {
            const table = await perspective.table({
                a: [
                    "ABC".repeat(10),
                    "DEF".repeat(10),
                    null,
                    "HIjK".repeat(10),
                    "lMNoP".repeat(10),
                ],
                b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"],
            });
            const view = await table.view({
                expressions: [
                    `concat("a", ', ', 'here is a long string, ', "b")`,
                ],
            });
            let result = await view.to_columns();
            let expected = result.a.map(
                (x, idx) => x + ", here is a long string, " + result.b[idx]
            );
            expected[1] = null;
            expected[2] = null;
            expect(
                result[`concat("a", ', ', 'here is a long string, ', "b")`]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Concats, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `concat("a", ', ', 'here is a long string, ', "b")`,
                ],
            });
            let result = await view.to_columns();
            let expected = result.a.map(
                (x, idx) => x + ", here is a long string, " + result.b[idx]
            );
            expected[2] = null;
            expect(
                result[`concat("a", ', ', 'here is a long string, ', "b")`]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Upper concats", async function () {
            const table = await perspective.table({
                a: [
                    "hello world",
                    "abakshdaskjhlgkjasdiukjqewlkjesaljhgdaskd",
                    null,
                ],
                b: ["asjdhlkhfdshafiywhjklsjfaksdgjadkjlv", "abc", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `upper(concat("a", ', ', 'here is a long string, ', "b"))`,
                ],
            });
            let result = await view.to_columns();
            let expected = result[
                `upper(concat("a", ', ', 'here is a long string, ', "b"))`
            ].map((x) => (x ? x.toUpperCase() : null));
            expected[2] = null;
            expect(
                result[
                    `upper(concat("a", ', ', 'here is a long string, ', "b"))`
                ]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Lower concats", async function () {
            const table = await perspective.table({
                a: [
                    "HELLO WORLD SADJKHFUOIWNS:AJKSKJDJBCL",
                    "KJBSJHDBGASHJDB ASCBAKISJHDKJSAHNDKASJ SJKHDJKAS",
                    null,
                ],
                b: [
                    "LDJSA:KJFGHJAKLSoijSJDM:ALKJDAS)oewqSAPDOD",
                    "ASdhnlsaadkjhASJKDSAHIUEHYWIUDSHDNBKJSAD",
                    "EfG",
                ],
            });
            const view = await table.view({
                expressions: [
                    `lower(concat("a", ', ', 'HERE is a long string, ', "b"))`,
                ],
            });
            let result = await view.to_columns();
            let expected = result[
                `lower(concat("a", ', ', 'HERE is a long string, ', "b"))`
            ].map((x) => (x ? x.toLowerCase() : null));
            expected[2] = null;
            expect(
                result[
                    `lower(concat("a", ', ', 'HERE is a long string, ', "b"))`
                ]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Order lower concats", async function () {
            const table = await perspective.table({
                a: ["HELLO WORLD", "VERY LONG STRING HERE", null],
                b: ["ALSO HELLO WORLD", "ANOTHER LONG STRING IS HERE", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `order(lower(concat("a", ', ', 'HERE is a long string, ', "b")), 'very long string here, here is a long string, another long string is here')`,
                ],
            });
            let result = await view.to_columns();
            expect(
                result[
                    `order(lower(concat("a", ', ', 'HERE is a long string, ', "b")), 'very long string here, here is a long string, another long string is here')`
                ]
            ).toEqual([1, 0, null]);
            view.delete();
            table.delete();
        });

        it.skip("Upper concats, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `upper(concat("a", ', ', 'here is a long string, ', "b"))`,
                ],
            });
            let result = await view.to_columns();
            let expected = result[
                `upper(concat("a", ', ', 'here is a long string, ', "b"))`
            ].map((x) => (x ? x.toUpperCase() : null));
            expected[2] = null;
            expect(
                result[
                    `upper(concat("a", ', ', 'here is a long string, ', "b"))`
                ]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it("Lower concats, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `lower(concat("a", ', ', 'HERE is a long string, ', "b"))`,
                ],
            });
            let result = await view.to_columns();
            let expected = result[
                `lower(concat("a", ', ', 'HERE is a long string, ', "b"))`
            ].map((x) => (x ? x.toLowerCase() : null));
            expect(
                result[
                    `lower(concat("a", ', ', 'HERE is a long string, ', "b"))`
                ]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it.skip("Length concats, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `length(concat("a", ', ', 'here is a long string, ', "b"))`,
                ],
            });
            let result = await view.to_columns();
            let expected = result.a.map(
                (x, idx) =>
                    (x + ", here is a long string, " + result.b[idx]).length
            );
            expected[2] = null;
            expect(
                result[
                    `length(concat("a", ', ', 'here is a long string, ', "b"))`
                ]
            ).toEqual(expected);
            view.delete();
            table.delete();
        });

        it.skip("Order concats, non-utf8", async function () {
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"],
            });
            const view = await table.view({
                expressions: [
                    `var x := concat("a", ', ', 'here is a long string, ', "b"); order(x, '𝓊⋁ẅ⤫𝛾𝓏, here is a long string, 𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ', '𝕙ḗľᶅở щṏᵲɭⅾ, here is a long string, 𝕙ḗľᶅở щṏᵲɭⅾ')`,
                ],
            });
            let result = await view.to_columns();
            expect(
                result[
                    `var x := concat("a", ', ', 'here is a long string, ', "b"); order(x, '𝓊⋁ẅ⤫𝛾𝓏, here is a long string, 𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ', '𝕙ḗľᶅở щṏᵲɭⅾ, here is a long string, 𝕙ḗľᶅở щṏᵲɭⅾ')`
                ]
            ).toEqual([1, 0, 2]);

            view.delete();
            table.delete();
        });
    });

    describe("String comparison", function () {
        it("==", async function () {
            const table = await perspective.table({
                a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                b: ["ABC", undefined, null, "HIjK", "lMNoP"],
            });

            let view = await table.view({
                expressions: ['"a" == "b"'],
            });

            let result = await view.to_columns();

            // null == null is true here
            expect(result['"a" == "b"']).toEqual([
                true,
                false,
                true,
                true,
                true,
            ]);
            view.delete();
            table.delete();
        });

        it("== on expression output", async function () {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cba", "HIjK", "lMNoP"],
                b: ["ABC", "ad", "asudfh", "HIjK", "lMNoP"],
            });

            let view = await table.view({
                expressions: [
                    `concat("a", ', ', "b") == concat("a", ', ', "b")`,
                ],
            });

            let result = await view.to_columns();
            expect(
                result[`concat("a", ', ', "b") == concat("a", ', ', "b")`]
            ).toEqual([true, true, true, true, true]);
            view.delete();
            table.delete();
        });

        it("==, nulls", async function () {
            const table = await perspective.table({
                a: ["ABC", "DEF", undefined, null, null],
                b: ["ABC", "not", "EfG", "HIjK", null],
            });

            let view = await table.view({
                expressions: ['"a" == "b"'],
            });

            let result = await view.to_columns();
            expect(result['"a" == "b"']).toEqual([
                true,
                false,
                false,
                false,
                true,
            ]);
            view.delete();
            table.delete();
        });

        it("==, extra long", async function () {
            const table = await perspective.table({
                a: [
                    "ABC".repeat(10),
                    "DEF".repeat(10),
                    null,
                    "HIjK".repeat(10),
                    "lMNoP",
                ],
                b: [
                    "ABC".repeat(10),
                    "DEF".repeat(10),
                    undefined,
                    "HIjK",
                    "lMNoP",
                ],
            });

            let view = await table.view({
                expressions: ['"a" == "b"'],
            });

            let result = await view.to_columns();
            expect(result['"a" == "b"']).toEqual([
                true,
                true,
                true,
                false,
                true,
            ]);
            view.delete();
            table.delete();
        });

        it("==, short", async function () {
            const table = await perspective.table({
                a: ["A", "E", null, "h", "l"],
                b: ["a", "E", undefined, "h", "l"],
            });

            let view = await table.view({
                expressions: ['"a" == "b"'],
            });

            let result = await view.to_columns();
            expect(result['"a" == "b"']).toEqual([
                false,
                true,
                false,
                true,
                true,
            ]);
            view.delete();
            table.delete();
        });

        it("==, mixed length", async function () {
            const table = await perspective.table({
                a: [
                    "ABC".repeat(100),
                    "DEF".repeat(10),
                    null,
                    "hijk".repeat(10),
                    "lm",
                ],
                b: [
                    "arc".repeat(50),
                    "DEf".repeat(10),
                    undefined,
                    "HIjK",
                    "lMNoP",
                ],
            });

            let view = await table.view({
                expressions: ['"a" == "b"'],
            });

            let result = await view.to_columns();
            expect(result['"a" == "b"']).toEqual([
                false,
                false,
                false,
                false,
                false,
            ]);
            view.delete();
            table.delete();
        });

        it("==, UTF-8", async function () {
            const table = await perspective.table({
                a: [
                    ">ﺐ{׆Meڱ㒕宾ⷭ̽쉱L𞔚Ո拏۴ګPظǭPۋV|팺㺞㷾墁鴦򒲹|ۿ򧊊䭪񪩛𬦢񺣠񦋳򵾳蛲񖑐iM񊪝񆷯",
                    "灙𬡍瀳։󷿙񅈕ǐ-kʂiJ!P񙺍󵝳̃੝w𬾐򕕉耨󉋦o򰵏詂3򒤹J<ꑭ񃕱Ӏ𛤦4u򉠚UPf􂢳P##Q񪂈",
                    "ĈᔞZ񇌖Qఋ?x?#$12ボլ㕢ﺧ𷛘󽙮[񲸧I񟭝򋨰魏ճכ󽺴ۏ󫨫䆐'㓔ǃ[ְ੬䎕寽𤩚ߨ袧򲕊򓰷|%",
                    "ęԛ򓍯󍩁𨞟㰢󇂣õ􌁇΍Ԥ⥯۷˝㿙צּ񬆩򤿭顂ݦۍ式+=ԋ帋񃴕譋ⴏ0l􅏎߳cί򇈊iȞڈU򆐹񍖮򷡦̥𩮏Ǳ",
                    "0ой3֝󻙋򑨮꾪߫0󏜬󆑝w󊭟񑓫򾷄𶳿o󏉃纊ʫ􅋶聍𾋊ô򓨼쀨ˆ퍨׽ȿKOŕ􅽾󙸹Ѩ󶭆j񽪌򸢐p򊘏׷򿣂dｇD쩖",
                ],
                b: [
                    ">ﺐ{׆Meڱ㒕宾ⷭ̽쉱L𞔚Ո拏۴ګPظǭPۋV|팺㺞㷾墁鴦򒲹|ۿ򧊊䭪񪩛𬦢񺣠񦋳򵾳蛲񖑐iM񊪝񆷯",
                    "灙𬡍瀳։󷿙񅈕ǐ-kʂiJ!P񙺍󵝳̃੝w𬾐򕕉耨󉋦o򰵏詂3򒤹J<ꑭ񃕱Ӏ𛤦4u򉠚UPf􂢳P##Q񪂈",
                    "ĈᔞZ񇌖Qఋ?x?#$12ボլ㕢ﺧ𷛘󽙮[񲸧I񟭝򋨰魏ճכ󽺴ۏ󫨫䆐'㓔ǃ[ְ੬䎕寽𤩚ߨ袧򲕊򓰷|%",
                    "ęԛ򓍯󍩁𨞟㰢󇂣õ􌁇΍Ԥ⥯۷˝㿙צּ񬆩򤿭顂ݦۍ式+=ԋ帋񃴕譋ⴏ0l􅏎߳cί򇈊iȞڈU򆐹񍖮򷡦̥𩮏Ǳ",
                    "0ой3֝󻙋򑨮꾪߫0󏜬󆑝w󊭟񑓫򾷄𶳿o󏉃纊ʫ􅋶聍𾋊ô򓨼쀨ˆ퍨׽ȿKOŕ􅽾󙸹Ѩ󶭆j񽪌򸢐p򊘏׷򿣂dｇD쩖2",
                ],
            });
            let view = await table.view({
                expressions: ['"a" == "b"'],
            });
            let result = await view.to_columns();
            expect(result['"a" == "b"']).toEqual([
                true,
                true,
                true,
                true,
                false,
            ]);
            view.delete();
            table.delete();
        });

        it("==, UTF-8 converted to Unicode", async function () {
            const table = await perspective.table({
                a: [
                    ">{MeLPPV||iM",
                    "-kiJ!Pwo3J<4uUPfP##Q",
                    "ZQ?x?#$12[I'[|%",
                    "ܦf+=0lciU",
                    "030wo􎼨KOjpdD",
                ],
                b: [
                    ">{MeLPPV||iM",
                    "-kiJ!Pwo3J<4uUPfP##Q",
                    "ZQ?x?#$12[I'[|%",
                    "ܦf+=0lciU",
                    "030wo􎼨KOjpdD2",
                ],
            });
            let view = await table.view({
                expressions: ['"a" == "b"'],
            });
            let result = await view.to_columns();
            expect(result['"a" == "b"']).toEqual([
                true,
                true,
                true,
                true,
                false,
            ]);
            view.delete();
            table.delete();
        });
    });

    describe("Regular Expressions", () => {
        it("Match string with string", async () => {
            const table = await perspective.table({
                a: "string",
                b: "string",
                c: "string",
            });

            table.update({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["ABC", "ad", "asudfh", "HIjK", "lMNoP"],
                c: [
                    "1234567890",
                    "123x4567",
                    "abcdefg123",
                    "4567123",
                    "1?2?3?",
                ],
            });

            const expressions = [
                `match("a", 'ABC')`,
                "match('aBc', '[aAbBcC]{3}')",
                `match("a", 'A')`,
                `match("c", '[0-9]{3}')`,
                `match("c", '4567')`,
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();
            expect(results[expressions[0]]).toEqual([
                true,
                false,
                false,
                false,
                false,
            ]);
            expect(results[expressions[1]]).toEqual(Array(5).fill(true));
            expect(results[expressions[2]]).toEqual([
                true,
                false,
                true,
                false,
                false,
            ]);
            expect(results[expressions[3]]).toEqual([
                true,
                true,
                true,
                true,
                false,
            ]);
            expect(results[expressions[4]]).toEqual([
                true,
                true,
                false,
                true,
                false,
            ]);

            await view.delete();
            await table.delete();
        });

        it("fullmatch string with string", async () => {
            const table = await perspective.table({
                a: "string",
                b: "string",
                c: "string",
            });

            table.update({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["ABC", "ad", "asudfh", "HIjK", "lMNoP"],
                c: ["1234567890", "123x4567", "abcdefg123", "4567123", "123"],
            });

            const expressions = [
                `fullmatch("a", 'ABC')`,
                "fullmatch('aBc', '[aAbBcC]{3}')",
                `fullmatch("a", 'A')`,
                `fullmatch("c", '[0-9]{3}')`,
                `fullmatch("c", '4567')`,
                `fullmatch("c", '4567123')`,
                `fullmatch("c", '[0-9]+')`,
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();
            expect(results[expressions[0]]).toEqual([
                true,
                false,
                false,
                false,
                false,
            ]);
            expect(results[expressions[1]]).toEqual(Array(5).fill(true));
            expect(results[expressions[2]]).toEqual(Array(5).fill(false));
            expect(results[expressions[3]]).toEqual([
                false,
                false,
                false,
                false,
                true,
            ]);
            expect(results[expressions[4]]).toEqual(Array(5).fill(false));
            expect(results[expressions[5]]).toEqual([
                false,
                false,
                false,
                true,
                false,
            ]);
            expect(results[expressions[6]]).toEqual([
                true,
                false,
                false,
                true,
                true,
            ]);

            await view.delete();
            await table.delete();
        });

        it("Match string with bad regex should fail type-checking", async () => {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["ABC", "ad", "asudfh", "HIjK", "lMNoP"],
            });

            const expressions = [
                `match("a", '*.')`,
                "match('abc', '(?=a)')",
                `match("a", '?')`,
            ];

            const validated = await table.validate_expressions(expressions);
            expect(validated.expression_schema).toEqual({});

            for (const expr of expressions) {
                expect(validated.expression_schema[expr]).toBeUndefined();
                expect(validated.errors[expr]).toEqual({
                    line: 0,
                    column: 0,
                    error_message:
                        "Type Error - inputs do not resolve to a valid expression.",
                });
            }

            // Because a bad regex does not raise a parse error, it is still
            // valid to create a view from them.
            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();
            const results = await view.to_columns();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
                expect(results[expr]).toEqual(Array(5).fill(null));
            }

            await view.delete();
            await table.delete();
        });

        it("fullmatch string with bad regex should fail type-checking", async () => {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["ABC", "ad", "asudfh", "HIjK", "lMNoP"],
            });

            const expressions = [
                `fullmatch("a", '*.')`,
                "fullmatch('abc', '(?=a)')",
                `fullmatch("a", '?')`,
                `fullmatch("a", '+.')`,
            ];

            const validated = await table.validate_expressions(expressions);
            expect(validated.expression_schema).toEqual({});

            for (const expr of expressions) {
                expect(validated.expression_schema[expr]).toBeUndefined();
                expect(validated.errors[expr]).toEqual({
                    line: 0,
                    column: 0,
                    error_message:
                        "Type Error - inputs do not resolve to a valid expression.",
                });
            }

            // FIXME: because a bad regex does not raise a parser error,
            // it is still valid to create a view from them without validation,
            // but this path is only accessible through the View API and
            // not the viewer.
            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();
            const results = await view.to_columns();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
                expect(results[expr]).toEqual(Array(5).fill(null));
            }

            await view.delete();
            await table.delete();
        });

        it("Match should only work on strings", async () => {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["abc123", "abc567", "abc56", "1234567", "aaa000"],
            });

            const expressions = [
                `match("a", 123)`,
                `match(today(), '[a-z]{3}[0-9]{3}')`,
                `match(False, '[0-9]{7}')`,
            ];

            const validated = await table.validate_expressions(expressions);

            for (const expr of expressions) {
                expect(validated.expression_schema[expr]).toBeUndefined();
            }

            expect(validated.errors[expressions[0]].error_message).toEqual(
                "Parser Error - Failed parameter type check for function 'match', Expected 'TS' call set: 'TT'"
            );

            expect(validated.errors[expressions[1]]).toEqual({
                line: 0,
                column: 0,
                error_message:
                    "Type Error - inputs do not resolve to a valid expression.",
            });

            expect(validated.errors[expressions[2]]).toEqual({
                line: 0,
                column: 0,
                error_message:
                    "Type Error - inputs do not resolve to a valid expression.",
            });

            await table.delete();
        });

        it("fullmatch should only work on strings", async () => {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["abc123", "abc567", "abc56", "1234567", "aaa000"],
            });

            const expressions = [
                `fullmatch("a", 123)`,
                `fullmatch(today(), '[a-z]{3}[0-9]{3}')`,
                `fullmatch(False, '[0-9]{7}')`,
            ];

            const validated = await table.validate_expressions(expressions);

            for (const expr of expressions) {
                expect(validated.expression_schema[expr]).toBeUndefined();
            }

            expect(validated.errors[expressions[0]].error_message).toEqual(
                "Parser Error - Failed parameter type check for function 'fullmatch', Expected 'TS' call set: 'TT'"
            );

            expect(validated.errors[expressions[1]]).toEqual({
                line: 0,
                column: 0,
                error_message:
                    "Type Error - inputs do not resolve to a valid expression.",
            });

            expect(validated.errors[expressions[2]]).toEqual({
                line: 0,
                column: 0,
                error_message:
                    "Type Error - inputs do not resolve to a valid expression.",
            });

            await table.delete();
        });

        it("Match string with regex", async () => {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["abc123", "abc567", "abc56", "1234567", "aaa000"],
            });

            const expressions = [
                `match("a", '.*')`,
                `match("b", '[a-z]{3}[0-9]{3}')`,
                `match("b", '[0-9]{7}')`,
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();
            expect(results[expressions[0]]).toEqual(Array(5).fill(true));
            expect(results[expressions[1]]).toEqual([
                true,
                true,
                false,
                false,
                true,
            ]);
            expect(results[expressions[2]]).toEqual([
                false,
                false,
                false,
                true,
                false,
            ]);

            await view.delete();
            await table.delete();
        });

        it("fullmatch string with regex", async () => {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cbA", "HIjK", "lMNoP"],
                b: ["abc123", "abc567", "abc56", "1234567", "aaa0001234"],
            });

            const expressions = [
                `fullmatch("a", '.*')`,
                `fullmatch("b", '[a-z]{3}[0-9]{3}')`,
                `fullmatch("b", '[0-9]{7}')`,
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();
            expect(results[expressions[0]]).toEqual(Array(5).fill(true));
            expect(results[expressions[1]]).toEqual([
                true,
                true,
                false,
                false,
                false,
            ]);
            expect(results[expressions[2]]).toEqual([
                false,
                false,
                false,
                true,
                false,
            ]);

            await view.delete();
            await table.delete();
        });

        it("Match string with regex, randomized", async () => {
            const data = {a: []};

            for (let i = 0; i < 500; i++) {
                data.a.push(random_string(100, true));
            }

            const table = await perspective.table(data);

            const expressions = [
                `match("a", '.*')`, // should match everything
                `match("a", '.{100}')`, // should match strings the size of max
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();

            for (let i = 0; i < 500; i++) {
                const a = results[expressions[0]][i];
                const b = results[expressions[1]][i];
                const source = data.a[i];

                if (source === null) {
                    expect(a).toEqual(null);
                    expect(b).toEqual(null);
                } else {
                    expect(a).toEqual(true);
                    expect(b).toEqual(source.length === 100);
                }
            }

            await view.delete();
            await table.delete();
        });

        it("fullmatch string with regex, randomized", async () => {
            const data = {a: []};

            for (let i = 0; i < 500; i++) {
                data.a.push(random_string(100, true));
            }

            const table = await perspective.table(data);

            const expressions = [
                `fullmatch("a", '.*')`, // should match everything
                `fullmatch("a", '.{100}')`, // should match strings the size of max
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();

            for (let i = 0; i < 500; i++) {
                const a = results[expressions[0]][i];
                const b = results[expressions[1]][i];
                const source = data.a[i];

                if (source === null) {
                    expect(a).toEqual(null);
                    expect(b).toEqual(null);
                } else {
                    expect(a).toEqual(true);
                    expect(b).toEqual(source.length === 100);
                }
            }

            await view.delete();
            await table.delete();
        });

        it("Match string and null with regex", async () => {
            const table = await perspective.table({
                a: ["ABC", "abc", null, "AbC", "12345"],
            });

            console.error(await table.schema());

            const expressions = [
                `match("a", '.*')`,
                `match("a", '[aAbBcC]{3}')`,
                `match("a", '[0-9]{5}')`,
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();
            console.error(results);
            expect(results[expressions[0]]).toEqual([
                true,
                true,
                null,
                true,
                true,
            ]);
            expect(results[expressions[1]]).toEqual([
                true,
                true,
                null,
                true,
                false,
            ]);
            expect(results[expressions[2]]).toEqual([
                false,
                false,
                null,
                false,
                true,
            ]);

            await view.delete();
            await table.delete();
        });

        it("fullmatch string and null with regex", async () => {
            const table = await perspective.table({
                a: ["ABC", "abc", null, "AbC", "12345", "123456"],
            });

            console.error(await table.schema());

            const expressions = [
                `fullmatch("a", '.*')`,
                `fullmatch("a", '[aAbBcC]{3}')`,
                `fullmatch("a", '[0-9]{5}')`,
            ];

            const view = await table.view({
                expressions,
            });

            const schema = await view.expression_schema();

            for (const expr of expressions) {
                expect(schema[expr]).toEqual("boolean");
            }

            const results = await view.to_columns();
            console.error(results);
            expect(results[expressions[0]]).toEqual([
                true,
                true,
                null,
                true,
                true,
                true,
            ]);
            expect(results[expressions[1]]).toEqual([
                true,
                true,
                null,
                true,
                false,
                false,
            ]);
            expect(results[expressions[2]]).toEqual([
                false,
                false,
                null,
                false,
                true,
                false,
            ]);

            await view.delete();
            await table.delete();
        });
    });
};
