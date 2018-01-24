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

var data_3 = [
    {'w': 1.5, 'x': 1, 'y':'a', 'z': true},
    {'w': 2.5, 'x': 2, 'y':'b', 'z': false},
    {'w': 3.5, 'x': 3, 'y':'c', 'z': true},
    {'w': 4.5, 'x': 4, 'y':'d', 'z': false}
];

var meta_3 = {
    'w': 'float',
    'x': "integer",
    'y': "string",
    'z': "boolean"
};

var data_arrow_str = "QVJST1cxAAAACwQAABAAAAAMAA4ABgAFAAgAAAAMAAAAAAEDABAAAAAAAAoADAAAAAQACAAKAAAAqAIAAAQAAAABAAAADAAAAAgADAAEAAgACAAAAAgAAAAQAAAABgAAAHBhbmRhcwAAcAIAAHsiaW5kZXhfY29sdW1ucyI6IFtdLCAiY29sdW1uX2luZGV4ZXMiOiBbXSwgImNvbHVtbnMiOiBbeyJuYW1lIjogInciLCAiZmllbGRfbmFtZSI6ICJ3IiwgInBhbmRhc190eXBlIjogImZsb2F0NjQiLCAibnVtcHlfdHlwZSI6ICJmbG9hdDY0IiwgIm1ldGFkYXRhIjogbnVsbH0sIHsibmFtZSI6ICJ4IiwgImZpZWxkX25hbWUiOiAieCIsICJwYW5kYXNfdHlwZSI6ICJpbnQ2NCIsICJudW1weV90eXBlIjogImludDY0IiwgIm1ldGFkYXRhIjogbnVsbH0sIHsibmFtZSI6ICJ5IiwgImZpZWxkX25hbWUiOiAieSIsICJwYW5kYXNfdHlwZSI6ICJjYXRlZ29yaWNhbCIsICJudW1weV90eXBlIjogImludDgiLCAibWV0YWRhdGEiOiB7Im51bV9jYXRlZ29yaWVzIjogNCwgIm9yZGVyZWQiOiBmYWxzZX19LCB7Im5hbWUiOiAieiIsICJmaWVsZF9uYW1lIjogInoiLCAicGFuZGFzX3R5cGUiOiAiYm9vbCIsICJudW1weV90eXBlIjogImJvb2wiLCAibWV0YWRhdGEiOiBudWxsfSwgeyJuYW1lIjogInYiLCAiZmllbGRfbmFtZSI6ICJ2IiwgInBhbmRhc190eXBlIjogInVuaWNvZGUiLCAibnVtcHlfdHlwZSI6ICJvYmplY3QiLCAibWV0YWRhdGEiOiBudWxsfV0sICJwYW5kYXNfdmVyc2lvbiI6ICIwLjIyLjAifQAAAAAFAAAA/AAAALQAAABkAAAALAAAAAQAAAAq////AAABBRQAAAAMAAAABAAAAAAAAACE////AQAAAHYAAABO////AAABBhQAAAAMAAAABAAAAAAAAACo////AQAAAHoAEgAaAAgABgAHAAwAEAAUAAAAEgAAAAAAAQU8AAAANAAAABQAAAAkAAAAAAAKAAgAAAAEAAAACgAAAAQAAADI////AAAAAQgAAAAAAAAABAAEAAQAAAABAAAAeQAAAM7///8AAAECJAAAABQAAAAEAAAAAAAAAAgADAAIAAcACAAAAAAAAAFAAAAAAQAAAHgAEgAUAAgABgAHAAwAAAAQAAAAEgAAAAAAAQMgAAAAFAAAAAQAAAAAAAAAAAAGAAgABgAGAAAAAAACAAEAAAB3AAAAAAAAAAAAALQAAAAUAAAAAAAAAAwAGgAGAAUACAAMAAwAAAAAAgMAHAAAACAAAAAAAAAAAAAAAAAACgAKAAAABAAAAAoAAAAQAAAAAAAKABgADAAEAAgACgAAAEwAAAAQAAAABAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAGAAAAAAAAAAIAAAAAAAAAAAAAAABAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAADAAAABAAAAAAAAABhYmNkAAAAAFwBAAAUAAAAAAAAAAwAFgAGAAUACAAMAAwAAAAAAwMAGAAAAIAAAAAAAAAAAAAKABgADAAEAAgACgAAAMwAAAAQAAAABQAAAAAAAAAAAAAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAKAAAAAAAAAAAAAAAAAAAACgAAAAAAAAAKAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAIAAAAAAAAAFgAAAAAAAAAAAAAAAAAAABYAAAAAAAAAAgAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAGAAAAAAAAAB4AAAAAAAAAAgAAAAAAAAAAAAAAAUAAAAFAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4PwAAAAAAAARAAAAAAAAADEAAAAAAAAASQAAAAAAAABZAAQAAAAAAAAACAAAAAAAAAAMAAAAAAAAABAAAAAAAAAAFAAAAAAAAAAABAgMDAAAAFQAAAAAAAAAAAAAAAQAAAAIAAAADAAAABAAAAAUAAAAxMjM0NQAAABAAAAAMABQABgAIAAwAEAAMAAAAAAADAFQAAAAoAAAABAAAAAEAAADwBAAAAAAAAGABAAAAAAAAgAAAAAAAAAAAAAAAAQAAABgEAAAAAAAAuAAAAAAAAAAgAAAAAAAAAAAACgAMAAAABAAIAAoAAACoAgAABAAAAAEAAAAMAAAACAAMAAQACAAIAAAACAAAABAAAAAGAAAAcGFuZGFzAABwAgAAeyJpbmRleF9jb2x1bW5zIjogW10sICJjb2x1bW5faW5kZXhlcyI6IFtdLCAiY29sdW1ucyI6IFt7Im5hbWUiOiAidyIsICJmaWVsZF9uYW1lIjogInciLCAicGFuZGFzX3R5cGUiOiAiZmxvYXQ2NCIsICJudW1weV90eXBlIjogImZsb2F0NjQiLCAibWV0YWRhdGEiOiBudWxsfSwgeyJuYW1lIjogIngiLCAiZmllbGRfbmFtZSI6ICJ4IiwgInBhbmRhc190eXBlIjogImludDY0IiwgIm51bXB5X3R5cGUiOiAiaW50NjQiLCAibWV0YWRhdGEiOiBudWxsfSwgeyJuYW1lIjogInkiLCAiZmllbGRfbmFtZSI6ICJ5IiwgInBhbmRhc190eXBlIjogImNhdGVnb3JpY2FsIiwgIm51bXB5X3R5cGUiOiAiaW50OCIsICJtZXRhZGF0YSI6IHsibnVtX2NhdGVnb3JpZXMiOiA0LCAib3JkZXJlZCI6IGZhbHNlfX0sIHsibmFtZSI6ICJ6IiwgImZpZWxkX25hbWUiOiAieiIsICJwYW5kYXNfdHlwZSI6ICJib29sIiwgIm51bXB5X3R5cGUiOiAiYm9vbCIsICJtZXRhZGF0YSI6IG51bGx9LCB7Im5hbWUiOiAidiIsICJmaWVsZF9uYW1lIjogInYiLCAicGFuZGFzX3R5cGUiOiAidW5pY29kZSIsICJudW1weV90eXBlIjogIm9iamVjdCIsICJtZXRhZGF0YSI6IG51bGx9XSwgInBhbmRhc192ZXJzaW9uIjogIjAuMjIuMCJ9AAAAAAUAAAD8AAAAtAAAAGQAAAAsAAAABAAAACr///8AAAEFFAAAAAwAAAAEAAAAAAAAAIT///8BAAAAdgAAAE7///8AAAEGFAAAAAwAAAAEAAAAAAAAAKj///8BAAAAegASABoACAAGAAcADAAQABQAAAASAAAAAAABBTwAAAA0AAAAFAAAACQAAAAAAAoACAAAAAQAAAAKAAAABAAAAMj///8AAAABCAAAAAAAAAAEAAQABAAAAAEAAAB5AAAAzv///wAAAQIkAAAAFAAAAAQAAAAAAAAACAAMAAgABwAIAAAAAAAAAUAAAAABAAAAeAASABQACAAGAAcADAAAABAAAAASAAAAAAABAyAAAAAUAAAABAAAAAAAAAAAAAYACAAGAAYAAAAAAAIAAQAAAHcAAABIBAAAQVJST1cx";

function _base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

var data_arrow = _base64ToArrayBuffer(data_arrow_str);

var arrow_result = [
    {"w": 1.5, "x": 1, "y": "a", "z": true, "v": "1"},
    {"w": 2.5, "x": 0, "y": "b", "z": false, "v": "2"},
    {"w": 3.5, "x": 2, "y": "c", "z": false, "v": "3"},
    {"w": 4.5, "x": 0, "y": "d", "z": false, "v": "4"},
    {"w": 5.5, "x": 3, "y": "d", "z": false, "v": "5"}
];

var dt = new Date();
var data_4 = [
   {'v': dt}
];

var data_5 = [
    {'v': '11-09-2017'}
];

var meta_4 = {'v' : 'date'};

var csv = "x,y,z\n1,a,true\n2,b,false\n3,c,true\n4,d,false";

module.exports = (perspective) => {

 describe("Execute", function () {

    it("serialized functions in a worker", async function () {
            var table = perspective.table({
                'x': "integer",
                'y': "string",
                'z': "boolean"
            });
            table.execute(t => {
                t.update([
                    {'x': 1, 'y':'a', 'z': true},
                    {'x': 2, 'y':'b', 'z': false},
                    {'x': 3, 'y':'c', 'z': true},
                    {'x': 4, 'y':'d', 'z': false}
                ]);
            });
            let js = await table.view({}).to_json();
            expect(js).toEqual([
                {'x': 1, 'y':'a', 'z': true},
                {'x': 2, 'y':'b', 'z': false},
                {'x': 3, 'y':'c', 'z': true},
                {'x': 4, 'y':'d', 'z': false}
            ]);
        });

    });   

    describe("Constructors", function() {

        it("JSON constructor", async function () {
            var table = perspective.table(data);
            var view = table.view();
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("Arrow constructor", async function () {
            var table = perspective.table(data_arrow);
            var view = table.view();
            let result = await view.to_json();
            expect(arrow_result).toEqual(result);
        });

        it("CSV constructor", async function () {
            var table = perspective.table(csv);
            var view = table.view();
            let result = await view.to_json();
            expect(papaparse.parse(csv, {header: true, dynamicTyping: true}).data).toEqual(result);
        });

        it("Meta constructor", async function () {
            var table = perspective.table(meta);
            var view = table.view();
            let result = await view.to_json();
            expect([]).toEqual(result);
        });

        it("Handles floats", async function () {
            var table = perspective.table(data_3);
            var view = table.view();
            let result = await view.to_json();
            expect(data_3).toEqual(result);
        });

        it("has correct size", async function () {
            var table = perspective.table(data);
            let result = await table.size();
            expect(result).toEqual(4);
        });

        it("has a schema", async function () {
            var table = perspective.table(data);
            let result = await table.schema();
            expect(result).toEqual(meta);
        });

        it("has columns", async function () {
            var table = perspective.table(data);
            let result = await table.columns();
            expect(result).toEqual(['x', 'y', 'z']);
        });

        it("Handles floats schemas", async function () {
            var table = perspective.table(data_3);
            let result = await table.schema();
            expect(meta_3).toEqual(result);
        });

        it("Generates correct date schemas", async function () {
            var table = perspective.table(data_4);
            let result = await table.schema();
            expect(meta_4).toEqual(result);
        });

        it("Handles date udpates when constructed from a schema", async function () {
            var table = perspective.table(meta_4);
            table.update(data_4)
            let result = await table.view({}).to_json();
            expect([{'v': +data_4[0]['v']}]).toEqual(result);
        });

        it("Handles date values", async function () {
            var table = perspective.table(data_4);
            let result2 = await table.view({}).to_json();
            expect([{'v': +data_4[0]['v']}]).toEqual(result2);
        });

        it("Handles date strings", async function () {
            var table = perspective.table(data_5);
            let result2 = await table.view({}).to_json();
            expect([{'v': +(new Date(data_5[0]['v']))}]).toEqual(result2);
        });


    });


};

