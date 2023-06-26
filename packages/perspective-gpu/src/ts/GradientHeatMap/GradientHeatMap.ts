import { View } from "@finos/perspective";
import {
    createScene,
    renderScene,
    GradientHeatMapScene,
    updateScene,
    setCanvasDimensions,
    SceneOptions,
} from "./render";
import chroma from "chroma-js";
import debounce from "lodash.debounce";

function getBackgroundColor() {
    const el = document.querySelector("perspective-viewer");

    let color: [number, number, number, number] = [255, 255, 255, 255];

    if (el) {
        const hexColor = getComputedStyle(el).getPropertyValue(
            "--plugin--background"
        );

        color = chroma(hexColor).rgba();
    }

    return color;
}

export const defaultSceneOptions: SceneOptions = {
    heatMax: 10.0,
    pointSize: 0.001,
    intensity: 0.5,
    backgroundColor: [255, 255, 255, 255],
};

class GradientHeatMap extends HTMLElement {
    static pluginName = "gradient-heatmap";

    #maxCells = 100000;

    #maxColumns = 5000;

    container: HTMLDivElement;

    canvas: HTMLCanvasElement;

    scene: GradientHeatMapScene | null = null;

    currentColPaths: string[] = [];

    _stagedView: View | null = null;

    initialized = false;

    sceneOptions = defaultSceneOptions;

    connectedCallback() {
        if (!this.initialized) {
            this.attachShadow({ mode: "open" });

            this.shadowRoot.innerHTML = `
          <style>
            #container {
              height: 100%;
            }

            #gradient-heatmap-canvas {
              display: block;
              margin: 0;
              width: 100%;
              height: 100%;
            }
          </style>
          <div id="container" class="chart">
            <canvas id="gradient-heatmap-canvas"></canvas>
          </div>
        `;

            this.container = this.shadowRoot.querySelector("#container");
            this.canvas = this.shadowRoot.querySelector(
                "#gradient-heatmap-canvas"
            );
            this.initialized = true;
        }
    }

    get name() {
        return "Gradient Heatmap";
    }

    get category() {
        return "Gradient Heatmap";
    }

    get select_mode() {
        return "toggle";
    }

    get min_config_columns() {
        return 2;
    }

    get config_column_names() {
        return ["X Axis", "Y Axis"];
    }

    get max_cells() {
        return this.#maxCells;
    }

    set max_cells(x) {
        this.#maxCells = x;
    }

    get max_columns() {
        return this.#maxColumns;
    }

    set max_columns(x) {
        this.#maxColumns = x;
    }

    draw = async (view, end_col, end_row) => {
        console.log("draw");
        this._stagedView = view;
        this.sceneOptions.backgroundColor = getBackgroundColor(); // might not want to do this on every draw call, but for now...

        if (!this.scene) {
            this.scene = await createScene(
                this.canvas,
                view,
                this.sceneOptions
            );
        }

        const nextColPaths = await view.column_paths();
        const samePaths = nextColPaths.every(
            (x, i) => x === this.currentColPaths[i]
        );

        if (!samePaths) {
            this.currentColPaths = nextColPaths;

            this.scene = await updateScene(this.scene, view, this.sceneOptions);
        }

        await renderScene(this.scene, this.sceneOptions);
    };

    async clear() {
        if (this.container) {
            this.container.innerHTML = "";
        }
    }

    #debouncedResize = debounce(async () => {
        if (this._stagedView) {
            await this.update(this._stagedView);
        }
    }, 500);

    resize = async () => {
        this.#debouncedResize();
    };

    update = async (view) => {
        console.log("update");
        if (this.scene) {
            setCanvasDimensions(this.scene.context.canvas);
            this.sceneOptions.backgroundColor = getBackgroundColor();

            this.scene = await updateScene(this.scene, view, this.sceneOptions);
        }

        if (this.scene) {
            await renderScene(this.scene, this.sceneOptions);
        }
    };

    restyle = async (view) => {
        this._stagedView = view;

        await this.update(this._stagedView);
    };

    async delete() {
        // unimplemented
    }

    save() {
        // unimplemented
        return {};
    }

    restore(settings) {
        // unimplemented
    }
}

customElements.define(GradientHeatMap.pluginName, GradientHeatMap);

export default GradientHeatMap;
