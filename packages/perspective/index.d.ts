// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

declare module "@finos/perspective" {
    import * as ws from "ws";

    export type Type =
        | "string"
        | "float"
        | "integer"
        | "boolean"
        | "date"
        | "datetime"
        | "object";

    export type SortDir =
        | "asc"
        | "asc abs"
        | "desc"
        | "desc abs"
        | "col asc"
        | "col asc abs"
        | "col desc"
        | "col desc abs";

    export type Aggregate =
        | "abs sum"
        | "and"
        | "any"
        | "avg"
        | "count"
        | "distinct count"
        | "distinct leaf"
        | "dominant"
        | "first"
        | "high"
        | "last"
        | "low"
        | "or"
        | "median"
        | "pct sum parent"
        | "pct sum grand total"
        | "stddev"
        | "sum"
        | "sum abs"
        | "sum not null"
        | "unique"
        | "var"
        | ["weighted mean", ColumnName];

    export type FilterOp =
        | "<"
        | ">"
        | "<="
        | ">="
        | "=="
        | "!="
        | "is null"
        | "is not null"
        | "in"
        | "not in"
        | "begins with"
        | "contains";

    export type Schema = {
        [key: string]: Type;
    };

    export interface SerializeConfig {
        start_row?: number;
        end_row?: number;
        start_col?: number;
        end_col?: number;
    }

    // RowPath is the __ROW_PATH__ column on a Data Row. It is kept as a separate
    // type for now because if it was added to DataRow, the resulting type for properties
    // would be a union of string | boolean | Date | number | (string | number)[], which is
    // not specific enough.
    export type RowPath = (string | number)[];
    export type DataRow = Record<string, string | boolean | Date | number>;

    /**** View ****/
    export type View = {
        delete(): Promise<void>;
        expression_schema(): Promise<Schema>;
        num_columns(): Promise<number>;
        num_rows(): Promise<number>;
        on_delete(callback: () => void): void;
        on_update(callback: UpdateCallback, options?: { mode?: string }): void;
        remove_update(callback: UpdateCallback): void;
        remove_delete(callback: () => void): void;
        schema(): Promise<Schema>;
        set_depth(depth?: number): void;
        to_arrow(options?: SerializeConfig): Promise<ArrayBuffer>;
        to_columns(
            options?: SerializeConfig
        ): Promise<Record<string, Array<string | boolean | Date | number>>>;
        to_csv(
            options?: SerializeConfig & { config: unknown }
        ): Promise<string>;
        to_json(options?: SerializeConfig): Promise<Array<DataRow>>;
    };

    /**** Table ****/
    export type UpdateCallback = (updated: {
        port_id: number;
        delta:
            | Array<Record<string, Array<string | boolean | Date | number>>>
            | ArrayBuffer;
    }) => void;

    export type TableData =
        | string
        | Array<Record<string, Array<string | boolean | Date | number>>>
        | { [key: string]: Array<string | boolean | Date | number> }
        | { [key: string]: string }
        | ArrayBuffer;

    export interface ExpressionError {
        error_message: string;
        line: number;
        column: number;
    }

    export type ValidatedExpressions = {
        expression_schema: Schema;
        errors: { [key: string]: ExpressionError };
    };

    export type TableOptions = {
        index?: string;
        limit?: number;
    };

    export type ColumnName = string | null;
    export type Expressions = Record<string, string>;
    export type Filter = [
        ColumnName,
        FilterOp,
        (
            | string
            | number
            | Date
            | boolean
            | Array<string | number | Date | boolean>
        )
    ];
    export type Sort = [ColumnName, SortDir];

    export type ViewConfig = {
        columns?: Array<ColumnName>;
        group_by?: Array<ColumnName>;
        split_by?: Array<ColumnName>;
        aggregates?: { [column_name: string]: Aggregate };
        sort?: Array<Sort>;
        filter?: Array<Filter>;
        expressions?: Expressions;
    };

    export type Table = {
        columns(): Promise<Array<string>>;
        clear(): Promise<void>;
        replace(data: TableData): Promise<void>;
        delete(): Promise<void>;
        on_delete(callback: () => void): void;
        validate_expressions(
            expressions: Expressions
        ): Promise<ValidatedExpressions>;
        schema(): Promise<Schema>;
        size(): Promise<number>;
        update(data: TableData, options?: { port_id?: number }): void;
        remove(data: Array<any>, options?: { port_id?: number }): void;
        view(config?: ViewConfig): Promise<View>;
        make_port(): number;
        get_index(): Promise<string | null>;
        get_limit(): Promise<number | null>;
        get_num_views(): Promise<number>;
    };

    /**** perspective ****/
    export enum PerspectiveEvents {
        PERSPECTIVE_READY = "perspective-ready",
    }

    export type PerspectiveWorker = Worker & {
        table(data: TableData | View, options?: TableOptions): Promise<Table>;
    };

    export class WebSocketClient {
        open_table(name: string): Promise<Table>;
        terminate(): void;
        initialize_profile_thread(): void;
        send(msg: unknown): void;
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

    export function perspective_assets(
        assets: string[],
        host_psp: boolean
    ): (request: any, response: any) => void;

    type perspective = {
        table(
            data_or_schema: TableData | Schema,
            options?: TableOptions
        ): Promise<Table>;
        worker(): PerspectiveWorker;
        shared_worker(): PerspectiveWorker;
        websocket(url: string): WebSocketClient;
        override: (x: any) => void;
    };

    const impl: perspective;

    export default impl;
}
