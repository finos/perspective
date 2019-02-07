import {TableData, TableOptions, Schema, View, AggregateConfig} from '@jpmorganchase/perspective';

declare module '@jpmorganchase/perspective-viewer' {
    export type PerspectiveViewer = {
        load(data: TableData): void;
        load(schema: Schema, options: TableOptions): void;
        update(data: TableData): void;
        delete(): void;

        notifyResize(): void;

        schema?: Schema;
        row_pivot?: Array<string>;
        column_pivot?: Array<string>;
        sort?: Array<string>;
        filter?: Array<Array<string>>;
        aggregate: Array<AggregateConfig>;
        index: string;
    } & HTMLElement;

}

export default PerspectiveViewer;
