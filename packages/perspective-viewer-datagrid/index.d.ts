import type { IPerspectiveViewerPlugin } from "@finos/perspective-viewer";

declare global {
    interface CustomElementRegistry {
        get(
            tagName: "perspective-viewer-datagrid"
        ): HTMLPerspectiveViewerDatagridPluginElement;

        // TODO is this needed?
        whenDefined(tagName: "perspective-viewer-datagrid"): Promise<void>;
    }
}

interface HTMLPerspectiveViewerDatagridPluginElement
    extends IPerspectiveViewerPlugin {}

export declare class HTMLPerspectiveViewerDatagridPluginElement
    extends HTMLElement
    implements IPerspectiveViewerPlugin {}
