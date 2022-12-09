/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "/node_modules/@finos/perspective/dist/cdn/perspective.js";

const WIDTH = 200;
const HEIGHT = 200;

const vertices = [
    [-100, -100, -100],
    [-100, -100, 100],
    [-100, 100, 100],

    [100, 100, -100],
    [-100, -100, -100],
    [-100, 100, -100],

    [100, -100, 100],
    [-100, -100, -100],
    [100, -100, -100],

    [100, 100, -100],
    [100, -100, -100],
    [-100, -100, -100],

    [-100, -100, -100],
    [-100, 100, 100],
    [-100, 100, -100],

    [100, -100, 100],
    [-100, -100, 100],
    [-100, -100, -100],

    [-100, 100, 100],
    [-100, -100, 100],
    [100, -100, 100],

    [100, 100, 100],
    [100, -100, -100],
    [100, 100, -100],

    [100, -100, -100],
    [100, 100, 100],
    [100, -100, 100],

    [100, 100, 100],
    [100, 100, -100],
    [-100, 100, -100],

    [100, 100, 100],
    [-100, 100, -100],
    [-100, 100, 100],

    [100, 100, 100],
    [-100, 100, 100],
    [100, -100, 100],
];

const colors = [3, 1, 2, 1, 3, 2, 6, 4, 4, 5, 5, 6];

function generate_scene() {
    let vertices2 = [];
    let colors2 = [];
    for (let i = 0; i < 50; i++) {
        const x_offset = Math.random() * 2000 - 1000;
        const y_offset = Math.random() * 2000 - 1000;
        const z_offset = Math.random() * 2000;
        for (const v in vertices) {
            const vertex = structuredClone(vertices[v]);
            vertex[0] += x_offset;
            vertex[1] += y_offset;
            vertex[2] += z_offset;
            vertices2.push(vertex);
            if (v % 3 === 0) {
                colors2.push(colors[(v / 3) % colors.length]);
            }
        }
    }

    return [vertices2, colors2];
}

function generate_mandelbrot() {
    const [vertices2, colors2] = generate_scene();

    return `
// color
var d[3] := {floor("index" / ${HEIGHT}) - ${HEIGHT} / 2, "index" % ${HEIGHT} - ${HEIGHT} / 2, 50};
var p[3] := {0, 0, -500};

var vs[9 * ${vertices2.flat().length / 9}] := {${vertices2.flat().join(", ")}};
var cs[${colors2.flat().length}] := {${colors2.flat().join(", ")}};
var color := 0;
var depth := 1000000;

for (var i := 0; i < ${vertices2.flat().length / 9}; i += 1) {
    var v0[3] := {vs[i * 9], vs[i * 9 + 1], vs[i * 9 + 2]};
    var v1[3] := {vs[i * 9 + 3], vs[i * 9 + 4], vs[i * 9 + 5]};
    var v2[3] := {vs[i * 9 + 6], vs[i * 9 + 7], vs[i * 9 + 8]};

    var e1[3];
    diff3(v1, v0, e1);
    var e2[3];
    diff3(v2, v0, e2);

    var h[3];
    cross_product3(d, e2, h);
    var a := dot_product3(e1, h);

    if (a < -0.000001 or a > 0.000001) {
        var f := 1 / a;
        var s[3];
        diff3(p, v0, s);
        var u := f * dot_product3(s, h);

        if (u > 0 and u < 1) {
            var q[3];
            cross_product3(s, e1, q);
            var v := f * dot_product3(d, q);
            if (v > 0 and u + v < 1) {
                var t := f * dot_product3(e2, q);
                if (t > -0.0000001) {
                    var t2 := 1 - u - v;
                    var d1[3] := {
                        t2 * v0[0] + u * v1[0] + v * v2[0],
                        t2 * v0[1] + u * v1[1] + v * v2[1],
                        t2 * v0[2] + u * v1[2] + v * v2[2]
                    };

                    var d2[3];
                    diff3(d1, p, d2);
                    var dist := norm3(d2);
                    if (dist < depth) {
                        depth := dist;
                        color := cs[i];
                    }
                }
            }
        }
    }
};

color
`;
}

function generate_layout() {
    return {
        plugin: "Heatmap",
        settings: true,
        group_by: [`floor("index" / ${HEIGHT}) - ${HEIGHT} / 2`],
        split_by: [`"index" % ${HEIGHT} - ${HEIGHT} / 2`],
        columns: ["color"],
        expressions: [
            generate_mandelbrot().trim(),
            `floor("index" / ${HEIGHT}) - ${HEIGHT} / 2`,
            `"index" % ${HEIGHT} - ${HEIGHT} / 2`,
        ],
    };
}

async function generate_data(table) {
    let json = new Array(WIDTH * HEIGHT);
    for (let x = 0; x < WIDTH; ++x) {
        for (let y = 0; y < HEIGHT; ++y) {
            const index = x * HEIGHT + y;
            json[index] = {
                index,
            };
        }
    }

    await table.replace(json);
}

window.addEventListener("DOMContentLoaded", async function () {
    const heatmap_plugin = await window.viewer.getPlugin("Heatmap");
    heatmap_plugin.max_cells = 100000;
    const worker = perspective.worker();
    const table = await worker.table({
        index: "integer",
    });
    generate_data(table);
    window.viewer.load(Promise.resolve(table));
    await window.viewer.restore(generate_layout());
});
