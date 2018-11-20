/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
var now = new Date();

var data = [{w: now, x: 1, y: "a", z: true}, {w: now, x: 2, y: "b", z: false}, {w: now, x: 3, y: "c", z: true}, {w: yesterday, x: 4, y: "d", z: false}];

var rdata = [{w: +now, x: 1, y: "a", z: true}, {w: +now, x: 2, y: "b", z: false}, {w: +now, x: 3, y: "c", z: true}, {w: +yesterday, x: 4, y: "d", z: false}];

module.exports = perspective => {
    describe("Filters", function() {
        describe("GT & LT", function() {
            it("filters on long strings", async function() {
                var table = perspective.table([{x: 1, y: "123456789012a", z: true}, {x: 2, y: "123456789012a", z: false}, {x: 3, y: "123456789012b", z: true}, {x: 4, y: "123456789012b", z: false}]);
                var view = table.view({
                    filter: [["y", "contains", "123456789012a"]]
                });
                let json = await view.to_json();
                expect(json.length).toEqual(2);
                view.delete();
                table.delete();
            });

            it("x > 2", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", ">", 2.0]]
                });
                let json = await view.to_json();
                expect(rdata.slice(2)).toEqual(json);
                view.delete();
                table.delete();
            });

            it("x < 3", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", "<", 3.0]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 2)).toEqual(json);
                view.delete();
                table.delete();
            });

            it("x > 4", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", ">", 4]]
                });
                let json = await view.to_json();
                expect([]).toEqual(json);
                view.delete();
                table.delete();
            });

            it("x < 0", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", ">", 4]]
                });
                let json = await view.to_json();
                expect([]).toEqual(json);
                view.delete();
                table.delete();
            });
        });

        describe("EQ", function() {
            it("x == 1", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", "==", 1]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 1)).toEqual(json);
                view.delete();
                table.delete();
            });

            it("x == 5", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", "==", 5]]
                });
                let json = await view.to_json();
                expect([]).toEqual(json);
                view.delete();
                table.delete();
            });

            it("y == 'a'", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["y", "==", "a"]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 1)).toEqual(json);
                view.delete();
                table.delete();
            });

            it("y == 'e'", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["y", "==", "e"]]
                });
                let json = await view.to_json();
                expect([]).toEqual(json);
                view.delete();
                table.delete();
            });

            it("z == true", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["z", "==", true]]
                });
                let json = await view.to_json();
                expect([rdata[0], rdata[2]]).toEqual(json);
                view.delete();
                table.delete();
            });

            it("z == false", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["z", "==", false]]
                });
                let json = await view.to_json();
                expect([rdata[1], rdata[3]]).toEqual(json);
                view.delete();
                table.delete();
            });

            it("w == yesterday", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["w", "==", yesterday]]
                });
                let json = await view.to_json();
                expect([rdata[3]]).toEqual(json);
                view.delete();
                table.delete();
            });

            it("w != yesterday", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["w", "!=", yesterday]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 3)).toEqual(json);
                view.delete();
                table.delete();
            });
        });

        describe("in", function() {
            it("y in ['a', 'b']", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["y", "in", ["a", "b"]]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 2)).toEqual(json);
                view.delete();
                table.delete();
            });
        });

        describe("not in", function() {
            it("y not in ['d']", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["y", "not in", ["d"]]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 3)).toEqual(json);
                view.delete();
                table.delete();
            });
        });

        describe("contains", function() {
            it("y contains 'a'", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["y", "contains", "a"]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 1)).toEqual(json);
                view.delete();
                table.delete();
            });
        });

        describe("multiple", function() {
            it("x > 1 & x < 4", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter: [["x", ">", 1], ["x", "<", 4]]
                });
                let json = await view.to_json();
                expect(rdata.slice(1, 3)).toEqual(json);
                view.delete();
                table.delete();
            });

            it("y contains 'a' | y contains 'b'", async function() {
                var table = perspective.table(data);
                var view = table.view({
                    filter_op: "|",
                    filter: [["y", "contains", "a"], ["y", "contains", "b"]]
                });
                let json = await view.to_json();
                expect(rdata.slice(0, 2)).toEqual(json);
                view.delete();
                table.delete();
            });
        });

        describe("nulls", function() {
            it("x > 2", async function() {
                var table = perspective.table([{x: 3, y: 1}, {x: 2, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4, y: 2}, {x: null, y: 2}]);
                var view = table.view({
                    filter: [["x", ">", 2]]
                });
                var answer = [{x: 3, y: 1}, {x: 4, y: 2}];
                let result = await view.to_json();
                expect(result).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("x < 3", async function() {
                var table = perspective.table([{x: 3, y: 1}, {x: 2, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4, y: 2}, {x: null, y: 2}]);
                var view = table.view({
                    filter: [["x", "<", 3]]
                });
                var answer = [{x: 2, y: 1}];
                let result = await view.to_json();
                expect(result).toEqual(answer);
                view.delete();
                table.delete();
            });

            it("x > 2", async function() {
                var table = perspective.table({x: "float", y: "integer"});
                table.update([{x: 3.5, y: 1}, {x: 2.5, y: 1}, {x: null, y: 1}, {x: null, y: 1}, {x: 4.5, y: 2}, {x: null, y: 2}]);
                var view = table.view({
                    filter: [["x", ">", 2.5]]
                });
                var answer = [{x: 3.5, y: 1}, {x: 4.5, y: 2}];
                let result = await view.to_json();
                expect(answer).toEqual(result);
                view.delete();
                table.delete();
            });
        });
    });
};
