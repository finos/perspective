/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import type {HTMLPerspectiveViewerElement} from "./viewer";
import type {HTMLPerspectiveViewerPluginElement} from "./plugin";

// JSX / React extensions

type ReactPerspectiveViewerAttributes<T> = React.HTMLAttributes<T>;

type JsxPerspectiveViewerElement = {class?: string} & React.DetailedHTMLProps<
    ReactPerspectiveViewerAttributes<HTMLPerspectiveViewerElement>,
    HTMLPerspectiveViewerElement
>;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "perspective-viewer": JsxPerspectiveViewerElement;
        }
    }
}

// Custom Elements extensions

declare global {
    interface Document {
        createElement(
            tagName: "perspective-viewer",
            options?: ElementCreationOptions
        ): HTMLPerspectiveViewerElement;
        createElement(
            tagName: "perspective-viewer-plugin",
            options?: ElementCreationOptions
        ): HTMLPerspectiveViewerPluginElement;
    }

    interface CustomElementRegistry {
        get(tagName: "perspective-viewer"): typeof HTMLPerspectiveViewerElement;
        get(
            tagName: "perspective-viewer-plugin"
        ): typeof HTMLPerspectiveViewerPluginElement;
    }
}
