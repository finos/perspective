import {Table, TableData, TableOptions, Schema, View, ViewConfig} from '@finos/perspective';

declare module '@finos/perspective-viewer' {
    export interface PerspectiveViewer extends PerspectiveViewerOptions, HTMLElement {
        load(data: TableData | Table, options: TableOptions): void;
        load(schema: Schema, options: TableOptions): void;
        update(data: TableData): void;
        notifyResize(): void;
        delete(delete_table: boolean): Promise<void>;
        clear() : void;
        replace(data: TableData) : void;
        flush(): Promise<void>;
        toggleConfig(): void;
        save(): PerspectiveViewerOptions;
        reset(): void;
        restore(x: any): Promise<void>;
        restyleElement(): void;
        readonly table?: Table;
    }

    export interface PerspectiveViewerOptions extends Omit<ViewConfig, "row_pivots"|"column_pivots"|"filter" > {
        aggregates?: { [column_name:string]: string};
        editable? : boolean;
        plugin? : string;
        columns? : string[];
        "computed-columns"? : { [column_name:string]: string}[];
        "row-pivots"? : string[];
        "column-pivots"? : string[];
        filters?: Array<Array<string>>;
        sort?: string[][];
    }
    

}

export default PerspectiveViewer;
