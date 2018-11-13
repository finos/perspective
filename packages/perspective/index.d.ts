
declare module '@jpmorganchase/perspective' {
    /**** object types ****/
    export enum TypeNames {
        STRING = 'string',
        FLOAT = 'float',
        INTEGER = 'integer',
        BOOLEAN = 'boolean',
        DATE = 'date'
    }

    export type ValuesByType = {
        [ key in TypeNames ]: Array<string>
    }

    export type ValueByType = {
        TypeNames: Array<string>
    }

    export enum SortOrders {
        ASC = 'asc',
        ASC_ABS = 'asc abs',
        DESC = 'desc',
        DESC_ABS = 'desc abs',
        NONE = 'none',
    }

    enum NUMBER_AGGREGATES {
        ANY = 'any',
        AVERAGE = 'avg',
        COUNT = 'count',
        DISTINCT_COUNT = 'distinct count',
        DOMINANT = 'dominant',
        FIRST = 'first',
        LAST = 'last',
        HIGH = 'high',
        LOW = 'low',
        MEAN = 'mean',
        MEAN_COUNT = 'mean by count',
        MEDIAN = 'median',
        PCT_SUM_PARENT = 'pct sum parent',
        PCT_SUM_TOTAL = 'pct sum grand total',
        SUM = 'sum',
        SUM_ABS = 'sum abs',
        SUM_NOT_NULL = 'sum not null',
        UNIQUE = 'unique'
    }

    enum STRING_AGGREGATES {
        ANY = 'any',
        COUNT = 'count',
        DISTINCT_COUNT = 'distinct count',
        DISTINCT_LEAF = 'distinct leaf',
        DOMINANT = 'dominant',
        FIRST = 'first',
        LAST = 'last',
        MEAN_COUNT = 'mean by count',
        UNIQUE = 'unique'
    }

    enum BOOLEAN_AGGREGATES {
        AND = 'and',
        ANY = 'any',
        COUNT = 'count',
        DISTINCT_COUNT = 'distinct count',
        DISTINCT_LEAF = 'distinct leaf',
        DOMINANT = 'dominant',
        FIRST = 'first',
        LAST = 'last',
        MEAN_COUNT = 'mean by count',
        OR ='or',
        UNIQUE = 'unique'
    }

    /**** Schema ****/
    type SchemaType = TypeNames | NUMBER_AGGREGATES | STRING_AGGREGATES | BOOLEAN_AGGREGATES;

    export type Schema = {
        [ key: string ]: TypeNames ;
    }

    /**** View ****/
    export type View = {
        delete(): Promise<void>;
        num_columns(): Promise<number>;
        num_rows(): Promise<number>;
        on_update(callback: UpdateCallback): void;
        on_delete(callback: Function): void;
        schema(): Promise<Schema>;
        to_json(): Promise<Array<object>>;
        to_csv(): Promise<string>;
    }

    /**** Table ****/
    export type UpdateCallback = (data: Array<object>) => void

    export type TableData = string | Array<object> | { [key: string]: Array<object> } | { [key: string]: string }

    export type TableOptions = {
        index: string
    }

    export type AggregateConfig = {
        column: string | Array<string>;
        name?: string;
        op: NUMBER_AGGREGATES | STRING_AGGREGATES | BOOLEAN_AGGREGATES;
    };

    export type ViewConfig = {
        row_pivot?: Array<string>;
        column_pivot?: Array<string>;
        sort?: Array<string>;
        filter?: Array<Array<string>>;
        aggregate: Array<AggregateConfig>;
    };

    export type Table = {
        add_computed(): Table;
        columns(): Array<string>;
        delete(): Promise<void>;
        on_delete(callback: Function): void;
        schema(): Promise<Schema>;
        size(): Promise<number>;
        update(data: TableData): void;
        view(config: ViewConfig): View;
    }

    /**** perspective ****/
    export enum PerspectiveEvents {
        PERSPECTIVE_READY = 'perspective-ready'
    }

    export type PerspectiveWorker = {
        table(data: TableData, options?: TableOptions): Table;
    }


    type perspective = {
        TYPE_AGGREGATES: ValuesByType,
        TYPE_FILTERS: ValuesByType,
        AGGREGATE_DEFAULTS: ValueByType,
        FILTER_DEFAULTS: ValueByType,
        SORT_ORDERS: SortOrders,
        table(): Table,
        worker(): PerspectiveWorker,
        override: (x: any) => void
    }

    const impl: perspective;

    export default impl;
}



declare module "@jpmorganchase/perspective/build/psp.async.wasm" {
    const impl: ArrayBuffer;
    export default impl;
}

declare module "@jpmorganchase/perspective/build/psp.sync.wasm" {
    const impl: ArrayBuffer;
    export default impl;
}

declare module "@jpmorganchase/perspective/build/perspective.wasm.worker.js" {}
declare module "@jpmorganchase/perspective/build/perspective.asmjs.worker.js" {}

