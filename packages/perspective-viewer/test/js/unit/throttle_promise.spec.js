/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {throttlePromise} from "../../../src/js/utils.js";

class TestClass {
    @throttlePromise(true)
    async test_clear() {
        await new Promise(x => setTimeout(x, 10));
        this.x = (this.x || 0) + 1;
    }

    removeAttribute() {}

    dispatchEvent() {}

    @throttlePromise
    async test() {
        await new Promise(x => setTimeout(x, 10));
        this.x = (this.x || 0) + 1;
    }
}

describe("throttlePromise", () => {
    test("calls are not debounced when unlocked", async () => {
        const x = new TestClass();
        x.test();
        await x.test();
        expect(x.x).toEqual(2);
    });

    test("calls are debounced when the function is locked", async () => {
        const x = new TestClass();
        x.test();
        x.test();
        await x.test();
        expect(x.x).toEqual(2);
    });

    test("calls from different event frames debounce when the function is locked", async () => {
        const x = new TestClass();
        x.test();
        await new Promise(requestAnimationFrame);
        x.test();
        x.test();
        x.test();
        await x.test();
        expect(x.x).toEqual(3);
    });

    describe("clear mode", () => {
        test("calls are debounced when unlocked", async () => {
            const x = new TestClass();
            x.test_clear();
            await x.test_clear();
            expect(x.x).toEqual(1);
        });

        test("calls are debounced when the function is locked", async () => {
            const x = new TestClass();
            x.test_clear();
            x.test_clear();
            await x.test_clear();
            expect(x.x).toEqual(1);
        });

        test("calls from different event frames are not debounced", async () => {
            const x = new TestClass();
            x.test_clear();
            await new Promise(requestAnimationFrame);
            await x.test_clear();
            expect(x.x).toEqual(2);
        });

        test("calls from different event frames are debounced when locked", async () => {
            const x = new TestClass();
            x.test_clear();
            await new Promise(requestAnimationFrame);
            x.test_clear();
            x.test_clear();
            x.test_clear();
            await x.test_clear();
            expect(x.x).toEqual(2);
        });
    });
});
