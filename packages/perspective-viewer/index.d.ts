/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import React from "react";
import {Table, TableData, TableOptions, Schema} from "@finos/perspective";

export interface HTMLPerspectiveViewerElement extends PerspectiveViewerOptions, HTMLElement {
    load(data: TableData | Table, options?: TableOptions): void;
    load(schema: Schema, options?: TableOptions): void;
    update(data: TableData): void;
    notifyResize(): void;
    delete(delete_table: boolean): Promise<void>;
    clear(): void;
    replace(data: TableData): void;
    flush(): Promise<void>;
    toggleConfig(): void;
    save(): PerspectiveViewerOptions;
    reset(): void;
    restore(x: any): Promise<void>;
    restyleElement(): void;
    readonly table?: Table;
}
interface ComputedColumn {
    column: string;
    inputs: string[];
    computed_function_name: string;
}

export type Filters = Array<[string, string, string]>;
export type Sort = Array<[string, string] | string>;
export type ComputedColumns = ComputedColumn[];
export type Aggregates = {[column_name: string]: string};
export type Pivots = string[];
export type Columns = string[];

export interface PerspectiveViewerOptions {
    aggregates?: Aggregates;
    editable?: boolean;
    plugin?: string;
    columns?: Columns;
    "computed-columns"?: ComputedColumns;
    "row-pivots"?: Pivots;
    "column-pivots"?: Pivots;
    filters?: Filters;
    sort?: Sort;
    selectable?: boolean;
}

interface PerspectiveViewerHTMLAttributes extends Pick<PerspectiveViewerOptions, "editable" | "plugin" | "selectable"> {
    aggregates?: string;
    "computed-columns"?: string;
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
