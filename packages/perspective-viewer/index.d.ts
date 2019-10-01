import {Table, TableData, TableOptions, Schema, View, ViewConfig} from '@finos/perspective';

declare module '@finos/perspective-viewer' {
    export interface PerspectiveViewer extends PerspectiveViewerOptions, HTMLElement {
        load(data: TableData | Table): void;
        load(schema: Schema, options: TableOptions): void;
        update(data: TableData): void;
        notifyResize(): void;
        delete(): Promise<void>;
        flush(): Promise<void>;
        toggleConfig(): void;
        save(): any;
        restore(x: any): Promise<void>;
        restyleElement(): void;
    }

    export interface PerspectiveViewerOptions extends ViewConfig {
        plugin? : string;
        plugin_config?: any;
        filters? : Array<Array<string>>;
        computed_columns? : { [column_name:string]: string}[];
    }
    

}

export default PerspectiveViewer;
