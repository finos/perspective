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

export interface PerspectiveViewerOptions {
    aggregates?: {[column_name: string]: string};
    editable?: boolean;
    plugin?: string;
    columns?: string[];
    "computed-columns"?: {[column_name: string]: string}[];
    "row-pivots"?: string[];
    "column-pivots"?: string[];
    filters?: Array<Array<string>>;
    sort?: string[][];
    selectable?: boolean;
}

interface PerspectiveViewerHTMLAttributes<T> extends PerspectiveViewerOptions, React.HTMLAttributes<T> {}

type PerspectiveElement = React.DetailedHTMLProps<PerspectiveViewerHTMLAttributes<HTMLPerspectiveViewerElement>, HTMLPerspectiveViewerElement>;

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
