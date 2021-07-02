declare module "@finos/perspective" {
    import * as ws from "ws";

    /**** object types ****/
    export enum TypeNames {
        STRING = "string",
        FLOAT = "float",
        INTEGER = "integer",
        BOOLEAN = "boolean",
        DATE = "date",
        DATETIME = "datetime",
        OBJECT = "object"
    }

    export type ValuesByType = {
        [key in TypeNames]: Array<string>;
    };

    export type ValueByType = {
        TypeNames: Array<string>;
    };

    export enum SortOrders {
        ASC = "asc",
        ASC_ABS = "asc abs",
        DESC = "desc",
        DESC_ABS = "desc abs",
        NONE = "none"
    }

    enum NUMBER_AGGREGATES {
        ABS_SUM = "abs sum",
        ANY = "any",
        AVERAGE = "avg",
        COUNT = "count",
        DISTINCT_COUNT = "distinct count",
        DOMINANT = "dominant",
        FIRST = "first",
        LAST = "last",
        HIGH = "high",
        LOW = "low",
        MEAN = "mean",
        MEDIAN = "median",
        PCT_SUM_PARENT = "pct sum parent",
        PCT_SUM_TOTAL = "pct sum grand total",
        STANDARD_DEVIATION = "standard deviation",
        SUM = "sum",
        SUM_ABS = "sum abs",
        SUM_NOT_NULL = "sum not null",
        UNIQUE = "unique"
    }

    enum STRING_AGGREGATES {
        ANY = "any",
        COUNT = "count",
        DISTINCT_COUNT = "distinct count",
        DISTINCT_LEAF = "distinct leaf",
        DOMINANT = "dominant",
        FIRST = "first",
        LAST = "last",
        UNIQUE = "unique"
    }

    enum BOOLEAN_AGGREGATES {
        AND = "and",
        ANY = "any",
        COUNT = "count",
        DISTINCT_COUNT = "distinct count",
        DISTINCT_LEAF = "distinct leaf",
        DOMINANT = "dominant",
        FIRST = "first",
        LAST = "last",
        OR = "or",
        UNIQUE = "unique"
    }

    /**** Schema ****/
    type SchemaType = TypeNames | NUMBER_AGGREGATES | STRING_AGGREGATES | BOOLEAN_AGGREGATES;

    export type Schema = {
        [key: string]: TypeNames;
    };

    export interface SerializeConfig {
        start_row: number;
        end_row: number;
        start_col: number;
        end_col: number;
    }

    /**** View ****/
    export type View = {
        delete(): Promise<void>;
        num_columns(): Promise<number>;
        num_rows(): Promise<number>;
        on_delete(callback: Function): void;
        on_update(callback: UpdateCallback, options?: {mode?: string}): void;
        remove_update(callback: UpdateCallback): void;
        remove_delete(callback: Function): void;
        schema(): Promise<Schema>;
        expression_schema(): Promise<Schema>;
        to_arrow(options?: SerializeConfig): Promise<ArrayBuffer>;
        to_columns(options?: SerializeConfig): Promise<Array<object>>;
        to_csv(options?: SerializeConfig & {config: object}): Promise<string>;
        to_json(options?: SerializeConfig): Promise<Array<object>>;
    };

    /**** Table ****/
    export type UpdateCallback = (updated: {port_id: number; delta: Array<object> | ArrayBuffer}) => void;

    export type TableData = string | Array<object> | {[key: string]: Array<object>} | {[key: string]: string} | ArrayBuffer;

    export interface ExpressionError {
        error_message: string;
        line: number;
        column: number;
    }

    export type ValidatedExpressions = {
        expression_schema: Schema;
        errors: {[key: string]: ExpressionError};
    };

    export type TableOptions = {
        index?: string;
        limit?: number;
    };

    export type ViewConfig = {
        columns?: Array<string>;
        row_pivots?: Array<string>;
        column_pivots?: Array<string>;
        aggregates?: {[column_name: string]: string};
        sort?: Array<Array<string>>;
        filter?: Array<Array<string>>;
        expressions?: Array<string>;
    };

    export type Table = {
        columns(): Array<string>;
        clear(): Promise<void>;
        replace(data: TableData): Promise<void>;
        delete(): Promise<void>;
        on_delete(callback: Function): void;
        validate_expressions(expressions: Array<string>): Promise<ValidatedExpressions>;
        schema(): Promise<Schema>;
        size(): Promise<number>;
        update(data: TableData, options?: {port_id?: number}): void;
        remove(data: Array<any>, options?: {port_id?: number}): void;
        view(config?: ViewConfig): Promise<View>;
        make_port(): number;
        get_index(): Promise<string | null>;
        get_limit(): Promise<number | null>;
    };

    /**** perspective ****/
    export enum PerspectiveEvents {
        PERSPECTIVE_READY = "perspective-ready"
    }

    export type PerspectiveWorker = Worker & {
        table(data: TableData | View, options?: TableOptions): Promise<Table>;
    };

    export class WebSocketClient {
        open_table(name: string): Table;
        terminate(): void;
        initialize_profile_thread(): void;
        send(msg: any): void;
    }

    export type WebSocketServerOptions = {
        assets?: string[];
        host_psp?: boolean;
        port?: number;
        on_start?: any;
    };

    export class WebSocketManager {
        add_connection(ws: ws): void;
        host_table(name: string, table: Table): void;
        eject_table(name: string): void;
        eject_view(name: string): void;
    }

    export class WebSocketServer extends WebSocketManager {
        constructor(config?: WebSocketServerOptions);
        close(): void;
    }

    export function perspective_assets(assets: string[], host_psp: boolean): (request: any, response: any) => void;

    type perspective = {
        TYPE_AGGREGATES: ValuesByType;
        TYPE_FILTERS: ValuesByType;
        SORT_ORDERS: SortOrders;
        table(data_or_schema: TableData | Schema, options?: TableOptions): Promise<Table>;
        worker(): PerspectiveWorker;
        shared_worker(): PerspectiveWorker;
        websocket(url: string): WebSocketClient;
        override: (x: any) => void;
    };

    const impl: perspective;

    export default impl;
}

declare module "@finos/perspective/build/psp.async.wasm" {
    const impl: ArrayBuffer;
    export default impl;
}

declare module "@finos/perspective/build/psp.sync.wasm" {
    const impl: ArrayBuffer;
    export default impl;
}

declare module "@finos/perspective/build/perspective.wasm.worker.js" {}
declare module "@finos/perspective/build/perspective.asmjs.worker.js" {}
