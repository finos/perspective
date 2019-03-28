/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

let data = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
let partial = [{x: 1, y: "x"}, {x: 2, z: true}];

module.exports = perspective => {
    describe("Step delta", function() {
        it("Should calculate step delta for 0-sided contexts", async function(done) {
            let table = perspective.table(data, {index: "x"});
            let view = table.view();
            view.on_update(
                function(new_data) {
                    expect(new_data).toEqual([{x: 1, y: "x", z: true}, {x: 2, y: "b", z: true}]);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "rows"}
            );
            table.update(partial);
        });
    });

    describe("Row delta", function() {
        it("Should calculate row delta for 0-sided contexts", async function(done) {
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
            table.update(partial);
        });

        it("Should calculate row delta for 1 sided contexts", async function(done) {
            let table = perspective.table(data, {index: "x"});
            let view = table.view({
                row_pivot: ["y"]
            });
            view.on_update(
                async function(delta) {
                    // FIXME: not fully working as expected, verify
                    expect(delta).toEqual([4]);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "pkey"}
            );
            table.update([{x: 1, y: "x"}]);
        });

        it("Should calculate row delta for 2 sided contexts", async function(done) {
            let table = perspective.table(data, {index: "x"});
            let view = table.view({
                row_pivot: ["y"],
                column_pivot: ["x"]
            });
            view.on_update(
                async function(delta) {
                    expect(delta).toEqual([4]);
                    view.delete();
                    table.delete();
                    done();
                },
                {mode: "pkey"}
            );
            table.update([{x: 1, y: "x"}]);
        });
    });
};
