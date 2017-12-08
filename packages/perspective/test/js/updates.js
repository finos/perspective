/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _  from "underscore";
import papaparse from "papaparse";

var data = [
    {'x': 1, 'y':'a', 'z': true},
    {'x': 2, 'y':'b', 'z': false},
    {'x': 3, 'y':'c', 'z': true},
    {'x': 4, 'y':'d', 'z': false}
];

var meta = {
    'x': "integer",
    'y': "string",
    'z': "boolean"
};

var data_2 = [
    {'x': 3, 'y':'c', 'z': false},
    {'x': 4, 'y':'d', 'z': true},
    {'x': 5, 'y':'g', 'z': false},
    {'x': 6, 'y':'h', 'z': true},
];

module.exports = (perspective) => {

    describe("Updates", function() {

        it("Meta constructor then `update()`", async function () {
            var table = perspective.table(meta);
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("Multiple `update()`s", async function () {
            var table = perspective.table(meta);
            table.update(data);
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(data.concat(data)).toEqual(result);
        });

        it("`update()` called after `view()`", async function () {
            var table = perspective.table(meta);
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

    });

    describe("Notifications", function() {

        it("`on_update()`", function (done) {
            var table = perspective.table(meta);
            var view = table.view();
            view.on_update(function (new_data) {
                expect(data).toEqual(new_data);
                done();
            });
            table.update(data);
        });

        it("`on_update` before and after `update()`", function (done) {
            var table = perspective.table(meta);
            var view = table.view();
            table.update(data);
            var ran = false;
            view.on_update(function (new_data) {
                if (!ran) {
                    expect(new_data).toEqual(data);
                    ran = true;
                    done();
                }
            });
            table.update(data);
        });

        it("`on_update(table.update) !`", function (done) {
            var table1 = perspective.table(meta);
            var table2 = perspective.table(meta);
            var view1 = table1.view();
            var view2 = table2.view();
            view1.on_update(async function(x) {
                table2.update(x);
                let result = await view2.to_json();
                expect(data).toEqual(result);
                done();
            });
            table1.update(data);
        });

        it("`on_update(table.update)` before and after `update()`", function (done) {
            var table1 = perspective.table(meta);
            var table2 = perspective.table(meta);
            var view1 = table1.view();
            var view2 = table2.view();

            table1.update(data);
            table2.update(data);
            view1.on_update(async function(x) {
                table2.update(x);
                let result = await view2.to_json();
                expect(data.concat(data)).toEqual(result);
                done();
            });
            table1.update(data);
        });

    });

    describe("Indexed", function() {

        it("{index: 'x'} (int)", async function () {
            var table = perspective.table(data, {index: 'x'});
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("{index: 'y'} (string)", async function () {
            var table = perspective.table(data, {index: 'y'});
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("multiple updates on {index: 'x'}", async function () {
            var table = perspective.table(data, {index: 'x'});
            var view = table.view();
            table.update(data);
            table.update(data);
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("{index: 'x'} with overlap", async function () {
            var table = perspective.table(data, {index: 'x'});
            var view = table.view();
            table.update(data);
            table.update(data_2);
            let result = await view.to_json();
            expect(data.slice(0, 2).concat(data_2)).toEqual(result);
        });

        it("update and index (int)", function (done) {
            var table = perspective.table(meta, {index: 'x'});
            var view = table.view();
            table.update(data);
            view.on_update(async function (new_data) {
                expect(data_2).toEqual(new_data);
                let json = await view.to_json();                
                expect(data.slice(0, 2).concat(data_2)).toEqual(json);
                done();
            });
            table.update(data_2);
        });

        it("update and index (string)", function (done) {
            var table = perspective.table(meta, {index: 'y'});
            var view = table.view();
            table.update(data);
            view.on_update(async function (new_data) {
                expect(data_2).toEqual(new_data);
                let json = await view.to_json();
                expect(data.slice(0, 2).concat(data_2)).toEqual(json);
                done();
            });
            table.update(data_2);
        });

    });

    describe("Viewport", function() {

        it("`height`", async function () {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    height: 2
                }
            });
            let result = await view.to_json();
            expect(data.slice(0, 2)).toEqual(result);
        });

        it("`top`", async function () {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    top: 2
                }
            });
            let result = await view.to_json();
            expect(data.slice(2)).toEqual(result);
        });

        it("`width`", async function () {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    width: 2
                }
            });
            var result2 = _.map(data, x => _.pick(x, 'x', 'y'));
            let result = await view.to_json();
            expect(result2).toEqual(result);
        });

        it("`left`", async function () {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    left: 1
                }
            });
            var result = _.map(data, function(x) { return _.pick(x, 'y', 'z'); });
            let result2 = await view.to_json();
            expect(result).toEqual(result2);
        });

        it("All", async function () {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    top: 1,
                    left: 1,
                    width: 1,
                    height: 2
                }
            });
            var result = _.map(data, function(x) { return _.pick(x, 'y'); });
            let result2 = await view.to_json();
            expect(result.slice(1, 3)).toEqual(result2);
        });
    });


};

