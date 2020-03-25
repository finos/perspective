/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import React from "react";
import {Table} from "@finos/perspective";
import {PerspectiveViewer, PerspectiveViewerElement, PerspectiveViewerOptions} from "@finos/perspective-viewer";
import {SplitPanel, Widget} from "@lumino/widgets";

export type Side = "left" | "right";
export type Mode = "globalFilters" | "linked";

interface PerspectiveWorkspace extends SplitPanel {
    // Don't expose
    // addTable(name: string, table: Table | Promise<Table>): void;
    // getTable(name: string): Table;
    // removeTable(name: string): Table;
    // tables: Map<string, Table | Promise<Table>>;
    side: Side;

    // save(): PerspectiveWorkspaceOptions;
    // restore(value: PerspectiveWorkspaceOptions): void;
    // duplicate(widget: PerspectiveViewerWidget): void;
    // toggleMasterDetail(widget: PerspectiveViewerWidget): void;

    // makeMaster(widget: PerspectiveViewerWidget): void;
    // makeDetail(widget: PerspectiveViewerWidget): void;
    // isLinked(widget: PerspectiveViewerWidget): boolean;
    // toggleLink(widget: PerspectiveViewerWidget): void;

    readonly table?: Table;
}

// Don't export, use document.createElement("perspective-workspace");
// export const PerspectiveWorkspace: {
//     new (element?: HTMLElement, options?: PerspectiveWorkspaceAttributes): PerspectiveWorkspace;
// };

interface PerspectiveViewerWidget extends Widget {
    master: boolean;
    viewer: PerspectiveViewer;
    // table: Table; // don't expose
    name: string;
    linked: boolean;
    toggleConfig(): void;
    save(): PerspectiveViewerWidgetOptions;
    restore(config: PerspectiveViewerWidgetOptions): void;
}

// Don't export, use document.createElement("perspective-workspace");
// export const PerspectiveViewerWidget: {
//     new (viewer?: PerspectiveViewer, node?: HTMLElement): PerspectiveViewerWidget;
// };

export interface PerspectiveWorkspaceAttributes {
    mode?: Mode;
    side?: Side;
}

interface SplitAreaConfig {
    type: "split-area";
    orientation?: "horizontal" | "vertical";
    children: AreaConfig[];
    sizes: number[];
}

interface TabAreaConfig {
    type: "tab-area";
    currentIndex: number;
    widgets: string[];
}

type AreaConfig = SplitAreaConfig | TabAreaConfig;

interface LayoutConfig {
    widgets?: Array<string>; // names not widgets
    main?: AreaConfig;
}
export interface PerspectiveWorkspaceOptions {
    sizes?: Array<number>;
    master: LayoutConfig;
    detail: LayoutConfig;
    viewers: {[name: string]: PerspectiveViewerWidgetOptions};
    mode?: Mode;
}

export interface PerspectiveViewerWidgetOptions extends PerspectiveViewerOptions {
    master?: boolean;
    table?: string;
    linked?: boolean;
    name?: string;
}

export interface HTMLPerspectiveWorkspaceElement extends HTMLElement {
    side?: Side;
    save(): PerspectiveWorkspaceOptions;
    restore(layout: PerspectiveWorkspaceOptions): void;
    tables: Map<string, Table | Promise<Table>>;
    notifyResize(): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PerspectiveWorkspaceHTMLAttributes extends Pick<PerspectiveWorkspaceAttributes, "mode" | "side"> {}

interface ReactPerspectiveWorkspaceHTMLAttributes<T> extends PerspectiveWorkspaceHTMLAttributes, React.HTMLAttributes<T> {}

export type PerspectiveWorkspaceElement = {class?: string} & React.DetailedHTMLProps<ReactPerspectiveWorkspaceHTMLAttributes<HTMLPerspectiveWorkspaceElement>, HTMLPerspectiveWorkspaceElement>;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "perspective-workspace": PerspectiveWorkspaceElement;
        }
    }

    interface Document {
        createElement(tagName: "perspective-workspace", options?: ElementCreationOptions): HTMLPerspectiveWorkspaceElement;
    }
}
