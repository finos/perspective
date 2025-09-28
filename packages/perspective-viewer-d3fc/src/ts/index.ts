// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import type { IPerspectiveViewerPlugin } from "@finos/perspective-viewer";
import { register } from "./plugin/plugin";

await register();

declare global {
    interface CustomElementRegistry {
        get(
            tagName: "perspective-viewer-d3fc-area",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-xbar",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-candlestick",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-ybar",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-heatmap",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-yline",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-ohlc",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-sunburst",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-treemap",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-xyline",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-xyscatter",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-yscatter",
        ): typeof HTMLPerspectiveViewerD3FCPluginElement;

        whenDefined(tagName: "perspective-viewer-d3fc-area"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-xbar"): Promise<void>;
        whenDefined(
            tagName: "perspective-viewer-d3fc-candlestick",
        ): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-ybar"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-heatmap"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-xyline"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-ohlc"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-sunburst"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-treemap"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-xyline"): Promise<void>;
        whenDefined(
            tagName: "perspective-viewer-d3fc-xyscatter",
        ): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-yscatter"): Promise<void>;
    }

    export interface HTMLPerspectiveViewerD3FCPluginElement
        extends IPerspectiveViewerPlugin {}

    export class HTMLPerspectiveViewerD3FCPluginElement
        extends HTMLElement
        implements IPerspectiveViewerPlugin
    {
        static get max_cells(): number;
        static set max_cells(value: number);
    }
}
