import perspective from "/node_modules/@finos/perspective/dist/cdn/perspective.js";

function generate_mandelbrot(params) {
    return `
// color
var height := ${params.height};
var width := ${params.width};
var xmin := ${params.xmin};
var xmax := ${params.xmax};
var ymin := ${params.ymin};
var ymax := ${params.ymax};
var iterations := ${params.iterations};

var x := floor("index" / height);
var y := "index" % height;
var c := iterations;

var cx := xmin + ((xmax - xmin) * x) / (width - 1);
var cy := ymin + ((ymax - ymin) * y) / (height - 1);

var vx := 0;
var vy := 0;
var vxx := 0;
var vyy := 0;
var vxy := 0;

for (var ii := 0; ii < iterations; ii += 1) {
    if (vxx + vyy <= float(4)) {
        vxy := vx * vy;
        vxx := vx * vx;
        vyy := vy * vy;
        vx := vxx - vyy + cx;
        vy := vxy + vxy + cy;
        c -= 1;
    }
};

c`;
}

function generate_layout(params) {
    return {
        plugin: "Heatmap",
        settings: true,
        group_by: [`floor("index" / ${params.height})`],
        split_by: [`"index" % ${params.height}`],
        columns: ["color"],
        expressions: [
            generate_mandelbrot(params).trim(),
            `floor("index" / ${params.height})`,
            `"index" % ${params.height}`,
        ],
    };
}

async function generate_data(table) {
    const run = document.getElementById("run");
    let json = new Array(width * height);
    for (let x = 0; x < width; ++x) {
        for (let y = 0; y < height; ++y) {
            const index = x * height + y;
            json[index] = {
                index,
            };
        }
    }

    await table.replace(json);
    run.innerHTML = `Run`;
}

// GUI

function get_gui_params() {
    return [
        "xmin",
        "xmax",
        "ymin",
        "ymax",
        "width",
        "height",
        "iterations",
    ].reduce((acc, x) => {
        acc[x] = window[x].valueAsNumber;
        return acc;
    }, {});
}

function make_range(x, y, range, name) {
    const title = () =>
        name +
        " [" +
        x.valueAsNumber.toFixed(1) +
        ", " +
        y.valueAsNumber.toFixed(1) +
        "]";

    x.addEventListener("input", () => {
        window.run.disabled = false;
        x.value = Math.min(x.valueAsNumber, y.valueAsNumber - 0.1);
        range.innerHTML = title();
    });

    y.addEventListener("input", () => {
        window.run.disabled = false;
        y.value = Math.max(x.valueAsNumber + 0.1, y.valueAsNumber);
        range.innerHTML = title();
    });
}

const make_run_click_callback = (worker, state) => async () => {
    if (window.run.innerHTML.trim() !== "Run") {
        window.run.innerHTML = "Run";
        return;
    }

    window.run.disabled = true;
    if (!state.table) {
        state.table = await worker.table({
            index: "integer",
        });
        window.viewer.load(Promise.resolve(state.table));
    }

    const run = document.getElementById("run");
    const params = get_gui_params();
    const new_size = params.width * params.height;
    if (!state.size || state.size !== new_size) {
        let json = { index: new Array(new_size) };
        for (let x = 0; x < new_size; ++x) {
            json.index[x] = x;
        }

        state.table.replace(json);
    }

    state.size = new_size;
    run.innerHTML = `Run`;
    window.viewer.restore(generate_layout(params));
};

function set_runnable() {
    window.run.disabled = false;
}

window.addEventListener("DOMContentLoaded", async function () {
    const heatmap_plugin = await window.viewer.getPlugin("Heatmap");
    heatmap_plugin.max_cells = 100000;
    make_range(xmin, xmax, xrange, "X");
    make_range(ymin, ymax, yrange, "Y");
    window.width.addEventListener("input", set_runnable);
    window.height.addEventListener("input", set_runnable);
    window.iterations.addEventListener("input", set_runnable);

    run.addEventListener(
        "click",
        make_run_click_callback(perspective.worker(), {})
    );
    run.dispatchEvent(new Event("click"));
});
