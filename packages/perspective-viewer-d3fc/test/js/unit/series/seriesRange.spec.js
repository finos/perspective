/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// import * as linearAxis from "../../../../src/js/axis/linearAxis";
// import * as seriesRange from "../../../../src/js/series/seriesRange";
// import * as sinon from "sinon";

const settings = {
    colorStyles: {
        gradient: {
            positive: [
                [0, "rgb(0, 0, 0)"],
                [1, "rgb(100, 0, 0)"],
            ],
            negative: [
                [0, "rgb(0, 0, 0)"],
                [1, "rgb(0, 100, 0)"],
            ],
            full: [
                [0, "rgb(100, 0, 0)"],
                [0.5, "rgb(0, 0, 0)"],
                [1, "rgb(0, 0, 100)"],
            ],
        },
    },
};

describe.skip("seriesRange", () => {
    let sandbox;
    let domainStub;

    beforeEach(() => {
        domainStub = sinon.stub().returns([100, 1100]);
        domainStub.valueName = sinon.stub().returns(domainStub);
        domainStub.pad = sinon.stub().returns(domainStub);

        sandbox = sinon.createSandbox();
        sandbox.stub(linearAxis, "domain").returns(domainStub);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("seriesLinearRange should", () => {
        test("get extent from domain", () => {
            const data = ["a", "b", "c"];
            seriesRange.seriesLinearRange(settings, data, "test-value");

            sinon.assert.calledWith(domainStub.valueName, "test-value");
            sinon.assert.calledWith(domainStub.pad, [0, 0]);
            sinon.assert.calledWith(domainStub, data);
        });

        test("create linear range from data extent", () => {
            const result = seriesRange.seriesLinearRange(
                settings,
                [],
                "test-value"
            );

            expect(result.domain()).toEqual([100, 1100]);
            result.range([0, 100]);

            expect(result(100)).toEqual(0);
            expect(result(500)).toEqual(40);
            expect(result(700)).toEqual(60);
            expect(result(1100)).toEqual(100);
        });

        test("create linear range from custom extent", () => {
            const result = seriesRange.seriesLinearRange(
                settings,
                [],
                "test-value",
                [200, 300]
            );

            sinon.assert.notCalled(domainStub);
            expect(result.domain()).toEqual([200, 300]);
        });
    });

    describe("seriesColorRange should", () => {
        test("get extent from domain", () => {
            const data = ["a", "b", "c"];
            seriesRange.seriesColorRange(settings, data, "test-value");

            sinon.assert.calledWith(domainStub.valueName, "test-value");
            sinon.assert.calledWith(domainStub.pad, [0, 0]);
            sinon.assert.calledWith(domainStub, data);
        });

        test("return color range from data extent", () => {
            const data = [];
            const result = seriesRange.seriesColorRange(
                settings,
                data,
                "test-value"
            );

            expect(result.domain()).toEqual([100, 1100]);

            expect(result(100)).toEqual("rgb(0, 0, 0)");
            expect(result(500)).toEqual("rgb(40, 0, 0)");
            expect(result(700)).toEqual("rgb(60, 0, 0)");
            expect(result(1100)).toEqual("rgb(100, 0, 0)");
        });

        test("create linear range from custom extent", () => {
            const result = seriesRange.seriesColorRange(
                settings,
                [],
                "test-value",
                [200, 300]
            );

            sinon.assert.notCalled(domainStub);
            expect(result.domain()).toEqual([200, 300]);
        });

        test("return negative color range from custom extent", () => {
            const result = seriesRange.seriesColorRange(
                settings,
                [],
                "test-value",
                [-200, -100]
            );

            expect(result(-200)).toEqual("rgb(0, 0, 0)");
            expect(result(-160)).toEqual("rgb(0, 40, 0)");
            expect(result(-140)).toEqual("rgb(0, 60, 0)");
            expect(result(-100)).toEqual("rgb(0, 100, 0)");
        });

        test("return full color range from custom extent", () => {
            const result = seriesRange.seriesColorRange(
                settings,
                [],
                "test-value",
                [-100, 100]
            );

            expect(result(-100)).toEqual("rgb(100, 0, 0)");
            expect(result(-40)).toEqual("rgb(40, 0, 0)");
            expect(result(0)).toEqual("rgb(0, 0, 0)");
            expect(result(40)).toEqual("rgb(0, 0, 40)");
            expect(result(100)).toEqual("rgb(0, 0, 100)");
        });
    });
});
