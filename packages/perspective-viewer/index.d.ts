import {TableData, TableOptions, Schema, View, AggregateConfig} from '@finos/perspective';

declare module '@finos/perspective-viewer' {
    export type PerspectiveViewer = {
        load(data: TableData): void;
        load(schema: Schema, options: TableOptions): void;
        update(data: TableData): void;
        notifyResize(): void;
        delete(): Promise<void>;
        flush(): Promise<void>;
        toggleConfig(): void;
        save(): any;
        restore(x: any): Promise<void>;


        sort?: Array<string>;
        columns?: Array<string>;
        aggregates?: Array<AggregateConfig>;
        filters?: Array<Array<string>>;
        view?: string;
        column_pivots?: Array<string>;
        row_pivots?: Array<string>;

        schema?: Schema;
        index?: string;
        limit?: number;

    } & HTMLElement;

}

export default PerspectiveViewer;
