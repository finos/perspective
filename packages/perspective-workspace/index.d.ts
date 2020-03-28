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
import {PerspectiveViewerOptions} from "@finos/perspective-viewer";

export type Side = "left" | "right";
export type Mode = "globalFilters" | "linked";

interface PerspectiveWorkspace {
    save(): PerspectiveWorkspaceOptions;
    restore(layout: PerspectiveWorkspaceOptions): void;
    tables: Map<string, Table | Promise<Table>>;
    notifyResize(): Promise<null>;
}

export interface PerspectiveWorkspaceAttributes {
    mode?: Mode;
    side?: Side;
}

interface SplitAreaConfig {
    type: "split-area";
    orientation?: "horizontal" | "vertical";
    children: AreaConfig[];
    sizes?: number[];
}

interface TabAreaConfig {
    type: "tab-area";
    currentIndex: number;
    widgets: string[];
}

type AreaConfig = SplitAreaConfig | TabAreaConfig;

export interface DetailLayoutConfig {
    main: AreaConfig | null;
}

export interface MasterLayoutConfig {
    widgets: string[];
    sizes?: number[];
}

export interface PerspectiveWorkspaceOptions {
    sizes?: Array<number>;
    master?: MasterLayoutConfig;
    detail?: DetailLayoutConfig;
    viewers: {[name: string]: PerspectiveViewerWidgetOptions};
    mode?: Mode;
}

export interface PerspectiveViewerWidgetOptions extends PerspectiveViewerOptions {
    master?: boolean;
    table?: string;
    linked?: boolean;
    name?: string;
}

export interface HTMLPerspectiveWorkspaceElement extends PerspectiveWorkspace, HTMLElement {}

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
