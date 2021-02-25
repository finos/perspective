/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import React from "react";
import {Table, View} from "@finos/perspective";

export interface HTMLPerspectiveViewerElement extends PerspectiveViewerOptions, HTMLElement {
    load(data: Table): void;
    notifyResize(): void;
    delete(): Promise<void>;
    flush(): Promise<void>;
    getEditPort(): Promise<number>;
    toggleConfig(): void;
    save(): PerspectiveViewerOptions;
    reset(): void;
    restore(x: any): Promise<void>;
    restyleElement(): void;
    readonly table?: Table;
    readonly view?: View;
}

export type Filters = Array<[string, string, string]>;
export type Sort = Array<[string, string] | string>;
export type Expressions = string[];
export type Aggregates = {[column_name: string]: string};
export type Pivots = string[];
export type Columns = string[];

export interface PerspectiveViewerOptions {
    aggregates?: Aggregates;
    editable?: boolean;
    plugin?: string;
    columns?: Columns;
    expressions?: Expressions;
    "row-pivots"?: Pivots;
    "column-pivots"?: Pivots;
    filters?: Filters;
    sort?: Sort;
    selectable?: boolean;
}

interface PerspectiveViewerHTMLAttributes extends Pick<PerspectiveViewerOptions, "editable" | "plugin" | "selectable"> {
    aggregates?: string;
    expressions?: string;
    "row-pivots"?: string;
    "column-pivots"?: string;
    filters?: string;
    sort?: string;
    columns?: string;
}

interface ReactPerspectiveViewerHTMLAttributes<T> extends PerspectiveViewerHTMLAttributes, React.HTMLAttributes<T> {}

type PerspectiveElement = {class?: string} & React.DetailedHTMLProps<ReactPerspectiveViewerHTMLAttributes<HTMLPerspectiveViewerElement>, HTMLPerspectiveViewerElement>;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "perspective-viewer": PerspectiveElement;
        }
    }

    interface Document {
        createElement(tagName: "perspective-viewer", options?: ElementCreationOptions): HTMLPerspectiveViewerElement;
    }
}
