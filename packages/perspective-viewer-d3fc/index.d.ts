import type { IPerspectiveViewerPlugin } from "@finos/perspective-viewer";

declare global {
    interface CustomElementRegistry {
        get(
            tagName: "perspective-viewer-d3fc-area"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-xbar"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-candlestick"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-ybar"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-heatmap"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-yline"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-ohlc"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-sunburst"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-treemap"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-xyline"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-xyscatter"
        ): HTMLPerspectiveViewerD3FCPluginElement;
        get(
            tagName: "perspective-viewer-d3fc-yscatter"
        ): HTMLPerspectiveViewerD3FCPluginElement;

        whenDefined(tagName: "perspective-viewer-d3fc-area"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-xbar"): Promise<void>;
        whenDefined(
            tagName: "perspective-viewer-d3fc-candlestick"
        ): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-ybar"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-heatmap"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-xyline"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-ohlc"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-sunburst"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-treemap"): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-xyline"): Promise<void>;
        whenDefined(
            tagName: "perspective-viewer-d3fc-xyscatter"
        ): Promise<void>;
        whenDefined(tagName: "perspective-viewer-d3fc-yscatter"): Promise<void>;
    }
}

interface HTMLPerspectiveViewerD3FCPluginElement
    extends IPerspectiveViewerPlugin {}

export declare class HTMLPerspectiveViewerD3FCPluginElement
    extends HTMLElement
    implements IPerspectiveViewerPlugin {}
