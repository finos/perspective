/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// TODO `d3fc` now has `customElements` reference, which fails in jest 25.x >
// jsdom 5.x - even importing this dependency fails.  Upgrading causes havoc,
// so re-enable these post upgrade.

// const {groupAndStackData} = require("../../../../src/js/data/groupData");

describe.skip("groupAndStackData should", () => {
    test("include globals", () => {
        expect(typeof HTMLElement).toBe("function");
        expect(typeof customElements).toBe("object");
        expect(typeof customElements.define).toBe("function");
    });

    test("use settings data if no specific data is supplied", () => {
        const settings = {
            crossValues: [{name: "cross1", type: "string"}],
            data: [
                {value1: 10, __ROW_PATH__: ["CROSS1.1"]},
                {value1: 20, __ROW_PATH__: ["CROSS1.2"]},
                {value1: 30, __ROW_PATH__: ["CROSS1.1"]},
            ],
            mainValues: [{name: "value1", type: "integer"}],
            splitValues: [],
        };

        const groupedResult = groupAndStackData(settings);
        expect(groupedResult[0].length).toEqual(3);
    });

    test("use specific data if supplied", () => {
        const suppliedData = [
            {value1: 10, __ROW_PATH__: ["CROSS1.1"]},
            {value1: 20, __ROW_PATH__: ["CROSS1.2"]},
            {value1: 30, __ROW_PATH__: ["CROSS1.1"]},
        ];
        const settings = {
            crossValues: [{name: "cross1", type: "string"}],
            data: suppliedData,
            mainValues: [{name: "value1", type: "integer"}],
            splitValues: [],
        };

        const extraData = suppliedData.concat([
            {value1: 40, __ROW_PATH__: ["CROSS1.3"]},
            {value1: 50, __ROW_PATH__: ["CROSS1.3"]},
        ]);
        const groupedResult = groupAndStackData(settings, extraData);

        expect(groupedResult[0].length).toEqual(5);
    });
});
