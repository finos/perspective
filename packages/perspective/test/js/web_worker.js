/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {int_float_str_arrow} from "./test_arrows";

module.exports = perspective => {
    describe("Transferables", function() {
        it("Should transfer arraybuffers in load()", async () => {
            const worker = perspective.worker();
            expect(worker._worker.transferable).toBe(true);

            const arrow = int_float_str_arrow.slice();
            const table = worker.table(arrow);
            expect(await table.schema()).toEqual({
                a: "integer",
                b: "float",
                c: "string"
            });
            expect(arrow.byteLength).toBe(0);
        });

        it("Should transfer arraybuffers in update()", async () => {
            const worker = perspective.worker();
            expect(worker._worker.transferable).toBe(true);

            const arrow = int_float_str_arrow.slice();
            const table = worker.table({
                a: "integer",
                b: "float",
                c: "string"
            });
            table.update(arrow);
            expect(await table.size()).toBe(4);
            expect(arrow.byteLength).toBe(0);
        });

        it("Should not transfer arraybuffers in load() if transferable is false", async () => {
            const worker = perspective.worker();
            worker._worker.transferable = false;
            expect(worker._worker.transferable).toBe(false);

            const arrow = int_float_str_arrow.slice();
            const table = worker.table(arrow);
            expect(await table.schema()).toEqual({
                a: "integer",
                b: "float",
                c: "string"
            });
            expect(arrow.byteLength).toBe(100);
        });

        it("Should nottransfer arraybuffers in update() if transferable is false", async () => {
            const worker = perspective.worker();
            worker._worker.transferable = false;
            expect(worker._worker.transferable).toBe(false);

            const arrow = int_float_str_arrow.slice();
            const table = worker.table({
                a: "integer",
                b: "float",
                c: "string"
            });
            table.update(arrow);
            expect(await table.size()).toBe(4);
            expect(arrow.byteLength).toBe(100);
        });
    });
};
