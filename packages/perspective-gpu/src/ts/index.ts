import type { HTMLPerspectiveViewerElement } from "@finos/perspective-viewer";
import GradientHeatMap from "./GradientHeatMap";

async function register() {
    await customElements.whenDefined("perspective-viewer");

    customElements
        .get("perspective-viewer")!
        .registerPlugin(GradientHeatMap.pluginName);
}

register();
