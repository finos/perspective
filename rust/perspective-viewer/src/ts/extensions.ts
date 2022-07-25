/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import type * as perspective from "@finos/perspective";
import type {
    IPerspectiveViewerElement,
    PerspectiveViewerConfig,
} from "./viewer";
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

import {PerspectiveViewerElement} from "@finos/perspective-viewer/dist/pkg/perspective_viewer.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class __PerspectiveViewerElement
    extends PerspectiveViewerElement
    implements IPerspectiveViewerElement {}

/**
 * @noInheritDoc
 */
export declare class HTMLPerspectiveViewerElement
    extends HTMLElement
    implements IPerspectiveViewerElement
{
    connectedCallback(): void;
    load(table: perspective.Table | Promise<perspective.Table>): Promise<void>;
    notifyResize(force: boolean): Promise<void>;
    setAutoSize(autosize: boolean): void;
    getTable(wait_for_table?: boolean): Promise<perspective.Table>;
    getView(): Promise<perspective.View>;
    restore(
        config: string | PerspectiveViewerConfig | ArrayBuffer
    ): Promise<void>;
    save(): Promise<PerspectiveViewerConfig>;
    save(format: "json"): Promise<PerspectiveViewerConfig>;
    save(format: "arraybuffer"): Promise<ArrayBuffer>;
    save(format: "string"): Promise<string>;
    flush(): Promise<void>;
    reset(all: boolean): Promise<void>;
    delete(): Promise<void>;
    download(flat: boolean): Promise<void>;
    copy(flat: boolean): Promise<void>;
    restyleElement(): Promise<void>;
    resetThemes(themes?: string[]): Promise<void>;
    getEditPort(): number;
    setThrottle(value?: number): void;
    toggleConfig(force?: boolean): Promise<void>;
    getPlugin(name?: string): Promise<HTMLElement>;
    getAllPlugins(): HTMLElement[];
    unsafeGetModel(): number;
}
