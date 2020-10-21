/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

module.exports = perspective => {
    describe("Clear", function() {
        it("removes the rows from the table", async function() {
            const table = perspective.table([{x: 1}]);
            const view = table.view();
            let json = await view.to_json();
            expect(json).toHaveLength(1);
            table.clear();
            json = await view.to_json();
            expect(json).toHaveLength(0);
            view.delete();
            table.delete();
        });

        it("Should call an on_clear() callback", async function(done) {
            const table = perspective.table([{x: 1}]);
            const view = table.view();
            let json = await view.to_json();
            expect(json).toHaveLength(1);

            const clear_callback = async function() {
                expect(await table.size()).toEqual(0);
                view.delete();
                table.delete();
                done();
            };

            table.on_clear(clear_callback);
            table.clear();
        });

        it("Should call multiple on_clear() callbacks in order", async function(done) {
            const table = perspective.table([{x: 1}]);
            const view = table.view();
            let json = await view.to_json();
            expect(json).toHaveLength(1);

            const order = [];

            const finish = function() {
                if (order.length === 3) {
                    expect(order).toEqual([0, 1, 2]);
                    view.delete();
                    table.delete();
                    done();
                }
            };

            for (let i = 0; i < 3; i++) {
                table.on_clear(async () => {
                    expect(await table.size()).toEqual(0);
                    order.push(i);
                    finish();
                });
            }

            table.clear();
        });
    });

    describe("Replace", function() {
        it("replaces the rows in the table with the input data", async function() {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);
            const view = table.view();
            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);
            table.replace([{x: 5, y: 6}]);
            json = await view.to_json();
            expect(json).toHaveLength(1);
            expect(json).toEqual([{x: 5, y: 6}]);
            view.delete();
            table.delete();
        });

        it("replaces the rows in the table with the input data and fires on_clear", async function() {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);
            const view = table.view();

            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            let cleared = false;
            table.on_clear(async () => {
                expect(await table.size()).toEqual(0);
                cleared = true;
            });

            table.replace([{x: 5, y: 6}]);

            expect(cleared).toEqual(true);

            json = await view.to_json();
            expect(json).toHaveLength(1);
            expect(json).toEqual([{x: 5, y: 6}]);

            view.delete();
            table.delete();
        });

        it("replaces the rows in the table with the input data and fires an on_update", async function(done) {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            const view = table.view();

            const callback = async function(updated) {
                expect(updated.port_id).toEqual(0);
                const json = await view.to_json();
                expect(json).toHaveLength(1);
                expect(json).toEqual([{x: 5, y: 6}]);
                view.delete();
                table.delete();
                done();
            };

            view.on_update(callback);

            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            table.replace([{x: 5, y: 6}]);
        });

        it("replaces the rows in the table with the input data and fires an on_clear before on_update", async function(done) {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            const view = table.view();

            let cleared = false;

            const callback = async function(updated) {
                expect(cleared).toEqual(true);
                expect(await table.size()).toEqual(1);
                expect(updated.port_id).toEqual(0);
                const json = await view.to_json();
                expect(json).toHaveLength(1);
                expect(json).toEqual([{x: 5, y: 6}]);
                view.delete();
                table.delete();
                done();
            };

            view.on_update(callback);

            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            table.on_clear(async () => {
                expect(await table.size()).toEqual(0);
                cleared = true;
            });

            table.replace([{x: 5, y: 6}]);
        });

        it("replaces the rows in the table with the input data and fires an on_update with the correct delta", async function(done) {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            const view = table.view();

            const callback = async function(updated) {
                expect(updated.port_id).toEqual(0);
                const table2 = perspective.table(updated.delta);
                const view2 = table2.view();

                const json = await view.to_json();
                expect(json).toHaveLength(1);
                expect(json).toEqual([{x: 5, y: 6}]);

                const json2 = await view2.to_json();
                expect(json2).toEqual(json);

                view2.delete();
                table2.delete();
                view.delete();
                table.delete();
                done();
            };

            view.on_update(callback, {mode: "row"});

            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            table.replace([{x: 5, y: 6}]);
        });

        it("replaces the rows in the table with the input data and fires an on_clear and then on_update with the correct delta", async function(done) {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            const view = table.view();

            let cleared = false;

            const callback = async function(updated) {
                expect(cleared).toEqual(true);
                expect(updated.port_id).toEqual(0);
                const table2 = perspective.table(updated.delta);
                const view2 = table2.view();

                const json = await view.to_json();
                expect(json).toHaveLength(1);
                expect(json).toEqual([{x: 5, y: 6}]);

                const json2 = await view2.to_json();
                expect(json2).toEqual(json);

                view2.delete();
                table2.delete();
                view.delete();
                table.delete();
                done();
            };

            view.on_update(callback, {mode: "row"});

            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);

            table.on_clear(async () => {
                cleared = true;
                expect(await table.size()).toEqual(0);
            });

            table.replace([{x: 5, y: 6}]);
        });

        it("replace the rows in the table atomically", async function() {
            const table = perspective.table([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);
            const view = table.view();
            setTimeout(() => table.replace([{x: 5, y: 6}]));
            let json = await view.to_json();
            expect(json).toHaveLength(2);
            expect(json).toEqual([
                {x: 1, y: 2},
                {x: 3, y: 4}
            ]);
            await new Promise(setTimeout);
            json = await view.to_json();
            expect(json).toHaveLength(1);
            expect(json).toEqual([{x: 5, y: 6}]);
            view.delete();
            table.delete();
        });

        it("Preserves sort order with 2-sided pivot", async function() {
            const input = [
                {x: 1, y: 7, z: "a"},
                {x: 1, y: 6, z: "b"},
                {x: 2, y: 5, z: "a"},
                {x: 2, y: 4, z: "b"},
                {x: 3, y: 3, z: "a"},
                {x: 3, y: 2, z: "b"}
            ];
            const table = perspective.table(input);
            const view = table.view({row_pivots: ["z"], column_pivots: ["x"], sort: [["y", "asc"]], columns: ["y"]});
            setTimeout(() => table.replace(input));
            let json = await view.to_json();
            await new Promise(setTimeout);
            let json2 = await view.to_json();
            expect(json).toEqual(json2);
            view.delete();
            table.delete();
        });
    });
};
