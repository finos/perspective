/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

let data = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
//let partial_change_x = [{x: 5, y: "a"}, {x: 6, y: "b"}];
let partial_change_y = [{x: 1, y: "string1"}, {x: 2, y: "string2"}];
let partial_change_z = [{x: 1, z: false}, {x: 2, z: true}];
let partial_change_y_z = [{x: 1, y: "string1", z: false}, {x: 2, y: "string2", z: true}];
let partial_change_nonseq = [{x: 1, y: "string1", z: false}, undefined, undefined, {x: 4, y: "string2", z: true}];

module.exports = perspective => {
    describe("Step delta", function() {
        it("Should calculate step delta for 0-sided contexts", async function(done) {
            let table = perspective.table(data, {index: "x"});
            let view = table.view();
            view.on_update(
                function(new_data) {
                    expect(new_data).toEqual([{x: 1, y: "string1", z: true}, {x: 2, y: "string2", z: false}]);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "rows"}
            );
            table.update(partial_change_y);
        });

        it.skip("Should calculate step delta for 0-sided contexts during non-sequential updates", async function(done) {
            let table = perspective.table(data, {index: "x"});
            let view = table.view();
            view.on_update(
                function(new_data) {
                    expect(new_data).toEqual([{x: 1, y: "string1", z: true}, {x: 4, y: "string2", z: false}]);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "rows"}
            );
            table.update(partial_change_nonseq);
        });
    });

    describe("Row delta", function() {
        describe("0-sided row delta", function() {
            it("returns changed rows", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view();
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([0, 1]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_y);
            });

            it("returns changed rows in sorted context", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view({
                    sort: [["x", "desc"]]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([2, 3]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_y);
            });

            it.skip("returns changed rows in non-sequential update", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view();
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([2, 3]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_nonseq);
            });
        });

        describe("1-sided row delta", function() {
            it("returns changed rows", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view({
                    row_pivots: ["y"]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([3, 4]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_y);
            });

            it("returns nothing when updated data is not in pivot", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view({
                    row_pivots: ["y"]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_z);
            });
        });

        describe("2-sided row delta", function() {
            it("returns changed rows when updated data in row pivot", async function(done) {
                let table = perspective.table(data, {index: "y"});
                let view = table.view({
                    row_pivots: ["y"],
                    column_pivots: ["x"]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([0, 5, 6]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_y);
            });

            it("returns changed rows when updated data in column pivot", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view({
                    row_pivots: ["y"],
                    column_pivots: ["z"]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([0, 1, 2]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_z);
            });

            it("returns changed rows when updated data in row and column pivot", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view({
                    row_pivots: ["y"],
                    column_pivots: ["z"]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([0, 3, 4]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_y_z);
            });

            it("returns nothing when updated data is not in pivot", async function(done) {
                let table = perspective.table(data, {index: "x"});
                let view = table.view({
                    row_pivots: ["y"],
                    column_pivots: ["x"]
                });
                view.on_update(
                    async function(delta) {
                        expect(delta).toEqual([]);
                        view.delete();
                        table.delete();
                        done();
                    },
                    {mode: "pkey"}
                );
                table.update(partial_change_z);
            });
        });
    });
};
