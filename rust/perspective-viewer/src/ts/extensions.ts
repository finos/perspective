/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

/**
 * Module for the `<perspective-viewer>` custom element.  This module has no
 * (real) exports, but importing it has a side effect: the
 * `PerspectiveViewerElement`class is registered as a custom element, after
 * which it can be used as a standard DOM element.
 *
 * Though `<perspective-viewer>` is written mostly in Rust, the nature
 * of WebAssembly's compilation makes it a dynamic module;  in order to
 * guarantee that the Custom Elements extension methods are registered
 * synchronously with this package's import, we need perform said registration
 * within this wrapper module.
 *
 * The documentation in this module defines the instance structure of a
 * `<perspective-viewer>` DOM object instantiated typically, through HTML or any
 * relevent DOM method e.g. `document.createElement("perspective-viewer")` or
 * `document.getElementsByTagName("perspective-viewer")`.
 *
 * @module perspective-viewer
 */

import {PerspectiveViewerElement} from "./viewer";
import {PerspectiveViewerPluginElement} from "./plugin";

// JSX / React extensions

type ReactPerspectiveViewerAttributes<T> = React.HTMLAttributes<T>;

type JsxPerspectiveViewerElement = {class?: string} & React.DetailedHTMLProps<
    ReactPerspectiveViewerAttributes<PerspectiveViewerElement>,
    PerspectiveViewerElement
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
        ): PerspectiveViewerElement;
        createElement(
            tagName: "perspective-viewer-plugin",
            options?: ElementCreationOptions
        ): PerspectiveViewerPluginElement;
    }

    interface CustomElementRegistry {
        get(tagName: "perspective-viewer"): typeof PerspectiveViewerElement;
        get(
            tagName: "perspective-viewer-plugin"
        ): typeof PerspectiveViewerPluginElement;
    }
}
