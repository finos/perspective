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

import type { HTMLPerspectiveViewerPluginElement } from "./plugin";
import { PerspectiveViewerElement } from "../../dist/wasm/perspective-viewer.js";
import type React from "react";

// JSX / React extensions

export type HTMLPerspectiveViewerElement = PerspectiveViewerElement &
    PerspectiveViewerElementExt &
    HTMLElement;

type ReactPerspectiveViewerAttributes<T> = React.HTMLAttributes<T>;

type JsxPerspectiveViewerElement = { class?: string } & React.DetailedHTMLProps<
    ReactPerspectiveViewerAttributes<HTMLPerspectiveViewerElement>,
    HTMLPerspectiveViewerElement
>;

declare global {
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
        querySelector<E extends Element = Element>(selectors: string): E | null;
        querySelector(
            selectors: "perspective-viewer"
        ): HTMLPerspectiveViewerElement | null;
    }

    interface CustomElementRegistry {
        get(
            tagName: "perspective-viewer"
        ): typeof PerspectiveViewerElement &
            PerspectiveViewerElementExt &
            typeof HTMLElement;
        get(
            tagName: "perspective-viewer-plugin"
        ): typeof HTMLPerspectiveViewerPluginElement;
    }
}

export interface PerspectiveViewerElementExt {
    /**
     * Register a new plugin via its custom element name.  This method is called
     * automatically as a side effect of importing a plugin module, so this
     * method should only typically be called by plugin authors.
     *
     * @category Plugin
     * @param name The `name` of the custom element to register, as supplied
     * to the `customElements.define(name)` method.
     * @example
     * ```javascript
     * customElements.get("perspective-viewer").registerPlugin("my-plugin");
     * ```
     */
    registerPlugin(name: string): Promise<void>;

    addEventListener(
        name: "perspective-click",
        cb: (e: CustomEvent) => void
    ): void;

    addEventListener(
        name: "perspective-select",
        cb: (e: CustomEvent) => void
    ): void;

    addEventListener(
        name: "perspective-toggle-settings",
        cb: (e: CustomEvent) => void
    ): void;

    addEventListener(
        name: "perspective-config-update",
        cb: (e: CustomEvent) => void
    ): void;

    removeEventListener(name: "perspective-click", cb: any): void;
    removeEventListener(name: "perspective-select", cb: any): void;
    removeEventListener(name: "perspective-toggle-settings", cb: any): void;
    removeEventListener(name: "perspective-config-update", cb: any): void;
}
