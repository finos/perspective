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
    describe("String, arity 1 computed", function() {
        it("Length", async function() {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["abc", "deeeeef", null, undefined, "abcdefghijk"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["ABC", "DEF", null, undefined, "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = await table.view({
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

    describe("String, arity 2 computed", function() {
        it("is", async function() {
            const table = await perspective.table({
                a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                b: ["ABC", undefined, null, "HIjK", "lMNoP"]
            });

            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });

            let result = await view.to_columns();
            expect(result.result).toEqual([true, null, null, true, true]);
            view.delete();
            table.delete();
        });

        it("is with dependencies is not null", async function() {
            const table = await perspective.table({
                a: ["ABC", "DEF", "cba", "HIjK", "lMNoP"],
                b: ["ABC", "ad", "asudfh", "HIjK", "lMNoP"]
            });

            let view = await table.view({
                computed_columns: [
                    {
                        column: "computed1",
                        computed_function_name: "concat_comma",
                        inputs: ["a", "b"]
                    }
                ]
            });

            let view2 = await table.view({
                computed_columns: [
                    {
                        column: "computed1",
                        computed_function_name: "concat_comma",
                        inputs: ["a", "b"]
                    },
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["computed1", "computed1"]
                    }
                ]
            });

            let result = await view2.to_columns();
            expect(result.result).toEqual([true, true, true, true, true]);
            view2.delete();
            view.delete();
            table.delete();
        });

        it("is, nulls", async function() {
            const table = await perspective.table({
                a: ["ABC", "DEF", undefined, null, null],
                b: ["ABC", "not", "EfG", "HIjK", null]
            });

            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });

            let result = await view.to_columns();
            expect(result.result).toEqual([true, false, null, null, null]);
            view.delete();
            table.delete();
        });

        it("is, extra long", async function() {
            const table = await perspective.table({
                a: ["ABC".repeat(10), "DEF".repeat(10), null, "HIjK".repeat(10), "lMNoP"],
                b: ["ABC".repeat(10), "DEF".repeat(10), undefined, "HIjK", "lMNoP"]
            });

            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });

            let result = await view.to_columns();
            console.log(result);
            expect(result.result).toEqual([true, true, null, false, true]);
            view.delete();
            table.delete();
        });

        it("is, short", async function() {
            const table = await perspective.table({
                a: ["A", "E", null, "h", "l"],
                b: ["a", "E", undefined, "h", "l"]
            });

            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });

            let result = await view.to_columns();
            expect(result.result).toEqual([false, true, null, true, true]);
            view.delete();
            table.delete();
        });

        it("is, mixed length", async function() {
            const table = await perspective.table({
                a: ["ABC".repeat(100), "DEF".repeat(10), null, "hijk".repeat(10), "lm"],
                b: ["arc".repeat(50), "DEf".repeat(10), undefined, "HIjK", "lMNoP"]
            });

            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });

            let result = await view.to_columns();
            expect(result.result).toEqual([false, false, null, false, false]);
            view.delete();
            table.delete();
        });

        it("is, UTF-8", async function() {
            const table = await perspective.table({
                a: [
                    ">ﺐ{׆Meڱ㒕宾ⷭ̽쉱L𞔚Ո拏۴ګPظǭPۋV|팺㺞㷾墁鴦򒲹|ۿ򧊊䭪񪩛𬦢񺣠񦋳򵾳蛲񖑐iM񊪝񆷯",
                    "灙𬡍瀳։󷿙񅈕ǐ-kʂiJ!P񙺍󵝳̃੝w𬾐򕕉耨󉋦o򰵏詂3򒤹J<ꑭ񃕱Ӏ𛤦4u򉠚UPf􂢳P##Q񪂈",
                    "ĈᔞZ񇌖Qఋ?x?#$12ボլ㕢ﺧ𷛘󽙮[񲸧I񟭝򋨰魏ճכ󽺴ۏ󫨫䆐'㓔ǃ[ְ੬䎕寽𤩚ߨ袧򲕊򓰷|%",
                    "ęԛ򓍯󍩁𨞟㰢󇂣õ􌁇΍Ԥ⥯۷˝㿙צּ񬆩򤿭顂ݦۍ式+=ԋ帋񃴕譋ⴏ0l􅏎߳cί򇈊iȞڈU򆐹񍖮򷡦̥𩮏Ǳ",
                    "0ой3֝󻙋򑨮꾪߫0󏜬󆑝w󊭟񑓫򾷄𶳿o󏉃纊ʫ􅋶聍𾋊ô򓨼쀨ˆ퍨׽ȿKOŕ􅽾󙸹Ѩ󶭆j񽪌򸢐p򊘏׷򿣂dｇD쩖"
                ],
                b: [
                    ">ﺐ{׆Meڱ㒕宾ⷭ̽쉱L𞔚Ո拏۴ګPظǭPۋV|팺㺞㷾墁鴦򒲹|ۿ򧊊䭪񪩛𬦢񺣠񦋳򵾳蛲񖑐iM񊪝񆷯",
                    "灙𬡍瀳։󷿙񅈕ǐ-kʂiJ!P񙺍󵝳̃੝w𬾐򕕉耨󉋦o򰵏詂3򒤹J<ꑭ񃕱Ӏ𛤦4u򉠚UPf􂢳P##Q񪂈",
                    "ĈᔞZ񇌖Qఋ?x?#$12ボլ㕢ﺧ𷛘󽙮[񲸧I񟭝򋨰魏ճכ󽺴ۏ󫨫䆐'㓔ǃ[ְ੬䎕寽𤩚ߨ袧򲕊򓰷|%",
                    "ęԛ򓍯󍩁𨞟㰢󇂣õ􌁇΍Ԥ⥯۷˝㿙צּ񬆩򤿭顂ݦۍ式+=ԋ帋񃴕譋ⴏ0l􅏎߳cί򇈊iȞڈU򆐹񍖮򷡦̥𩮏Ǳ",
                    "0ой3֝󻙋򑨮꾪߫0󏜬󆑝w󊭟񑓫򾷄𶳿o󏉃纊ʫ􅋶聍𾋊ô򓨼쀨ˆ퍨׽ȿKOŕ􅽾󙸹Ѩ󶭆j񽪌򸢐p򊘏׷򿣂dｇD쩖2"
                ]
            });
            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.result).toEqual([true, true, true, true, false]);
            view.delete();
            table.delete();
        });

        it("is, UTF-8 converted to Unicode", async function() {
            const table = await perspective.table({
                a: [">{MeLPPV||iM", "-kiJ!Pwo3J<4uUPfP##Q", "ZQ?x?#$12[I'[|%", "ܦf+=0lciU", "030wo􎼨KOjpdD"],
                b: [">{MeLPPV||iM", "-kiJ!Pwo3J<4uUPfP##Q", "ZQ?x?#$12[I'[|%", "ܦf+=0lciU", "030wo􎼨KOjpdD2"]
            });
            let view = await table.view({
                computed_columns: [
                    {
                        column: "result",
                        computed_function_name: "is",
                        inputs: ["a", "b"]
                    }
                ]
            });
            let result = await view.to_columns();
            expect(result.result).toEqual([true, true, true, true, false]);
            view.delete();
            table.delete();
        });

        it("Concat with space", async function() {
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["abc", "deeeeef", "fg", "hhs", "abcdefghijk"],
                b: ["ABC", "DEF", "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["ABC", "DEF", null, "HIjK", "lMNoP"],
                b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["ABC", "DEF", undefined, "HIjK", "lMNoP"],
                b: ["ABC", null, "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["ABC".repeat(10), "DEF".repeat(10), null, "HIjK".repeat(10), "lMNoP".repeat(10)],
                b: ["ABC", undefined, "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["ABC".repeat(10), "DEF".repeat(10), undefined, "HIjK".repeat(10), "lMNoP".repeat(10)],
                b: ["ABC", null, "EfG", "HIjK", "lMNoP"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = await table.view({
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
            const table = await perspective.table({
                a: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝓊⋁ẅ⤫𝛾𝓏", null],
                b: ["𝕙ḗľᶅở щṏᵲɭⅾ", "𝑢ⱴⱳẍ𝘺𝘇ӑṣᶑᵴ", "EfG"]
            });
            const view = await table.view({
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
