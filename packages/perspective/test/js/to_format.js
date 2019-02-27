/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

var int_float_string_data = [
    {int: 1, float: 2.25, string: "a", datetime: new Date()},
    {int: 2, float: 3.5, string: "b", datetime: new Date()},
    {int: 3, float: 4.75, string: "c", datetime: new Date()},
    {int: 4, float: 5.25, string: "d", datetime: new Date()}
];

module.exports = perspective => {
    describe("to_json", function() {
        it("should emit same number of column names as number of pivots", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({
                row_pivot: ["int"],
                column_pivot: ["float", "string"],
                sort: [["int", "asc"]]
            });
            let json = await view.to_json();
            // Get the first emitted column name that is not __ROW_PATH__
            let name = Object.keys(json[0])[1];
            // make sure that number of separators = num of column pivots
            expect((name.match(/\|/g) || []).length).toEqual(2);
        });
    });

    describe("to_arrow()", function() {
        it("Transitive arrow output 0-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view();
            let arrow = await view.to_arrow();
            let json2 = await view.to_json();
            expect(arrow.byteLength).toEqual(940);

            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json = await view2.to_json();
            expect(json).toEqual(json2);

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 1-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({row_pivot: ["string"]});
            let json = await view.to_json();
            let arrow = await view.to_arrow();
            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json2 = await view2.to_json();

            expect(json2).toEqual(
                json.map(x => {
                    delete x["__ROW_PATH__"];
                    return x;
                })
            );

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 2-sided", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({row_pivot: ["string"], col_pivot: ["int"]});
            let json = await view.to_json();
            let arrow = await view.to_arrow();
            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json2 = await view2.to_json();

            expect(json2).toEqual(
                json.map(x => {
                    delete x["__ROW_PATH__"];
                    return x;
                })
            );

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });

        it("Transitive arrow output 2-sided column only", async function() {
            let table = perspective.table(int_float_string_data);
            let view = table.view({col_pivot: ["string"]});
            let json = await view.to_json();
            let arrow = await view.to_arrow();
            let table2 = perspective.table(arrow);
            let view2 = table2.view();
            let json2 = await view2.to_json();

            expect(json2).toEqual(
                json.map(x => {
                    delete x["__ROW_PATH__"];
                    return x;
                })
            );

            view2.delete();
            table2.delete();
            view.delete();
            table.delete();
        });
    });
};
