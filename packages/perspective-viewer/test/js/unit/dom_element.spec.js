/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {DomElement} from "../../../src/js/viewer/dom_element";

describe(DomElement, () => {
    describe("._autocomplete_choices", () => {
        let dom_element, json_choices;

        beforeEach(() => {
            dom_element = new DomElement();
            json_choices = [
                {__ROW_PATH__: [], foo: 2},
                {__ROW_PATH__: [undefined], foo: 25},
                {__ROW_PATH__: [null], foo: 25},
                {__ROW_PATH__: ["somestring"], foo: 3},
                {__ROW_PATH__: ["otherstring"], foo: 3}
            ];
        });

        test("the first value, null values, and undefined values are filtered out", () => {
            expect(dom_element._autocomplete_choices(json_choices)).toEqual(["somestring", "otherstring"]);
        });
    });
});
