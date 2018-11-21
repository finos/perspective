/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const arrow = require("../arrow/test-null.arrow");

var arrow_psp_internal_schema = [9, 10, 1, 2, 3, 4, 11, 19, 19, 12, 12, 12, 2];

module.exports = (perspective, mode) => {
    describe("Internal API", function() {
        it("is actually using the correct runtime", async function() {
            expect(perspective.__module__.wasmJSMethod).toEqual(mode === "ASMJS" ? "asmjs" : "native-wasm");
        });

        it("['z'], sum with new column syntax with wrong column arity errors", async function() {
            var table = perspective.table(arrow.slice());
            let anon = function() {
                table.view({
                    row_pivot: ["char"],
                    aggregate: [{op: "sum", column: ["f16", "f32"]}]
                });
            };
            expect(anon).toThrow();
            table.delete();
        });

        it("Arrow schema types are mapped correctly", async function() {
            // This only works for non parallel
            var table = perspective.table(arrow.slice());
            let schema, stypes;
            let types = [];
            try {
                schema = table.gnode.get_tblschema();
                stypes = schema.types();

                for (let i = 0; i < stypes.size(); i++) {
                    types.push(stypes.get(i).value);
                }
                expect(arrow_psp_internal_schema).toEqual(types);
            } finally {
                if (schema) {
                    schema.delete();
                }
                if (stypes) {
                    stypes.delete();
                }
            }
            table.delete();
        });
    });
};
