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

import { IPerspectiveViewerElement } from "@finos/perspective-viewer";

export interface Element {
    msMatchesSelector(selectors: string): boolean;
}

export interface Chart {
    (container: any, settings: any): void;
    plugin: {
        name: string;
        category: string;
        max_cells: number;
        max_columns: number;
        render_warning: boolean;
        initial: {
            type?: string;
            count?: number;
            names: string[];
        };
        selectMode?: string;
    };
}

export type PadUnit = "percent" | "domain";
export type Pad = [number, number];

export type GetSetReturn<T, Arg, Func> = T extends undefined
    ? Arg
    : T extends Arg
    ? Func
    : never;

export interface PaddingStrategy {
    (extent: any): any;
    pad: <T extends Pad | undefined = undefined>(
        nextPad?: T
    ) => GetSetReturn<T, Pad, PaddingStrategy>;
    padUnit: <T extends PadUnit | undefined = undefined>(
        nextPadUnit?: T
    ) => GetSetReturn<T, PadUnit, PaddingStrategy>;
}

export type Axis = [number, number];

export type GradientPair = [number, string];

export type GradientKey = string; // full, negative, positive

export type ColorStyles = {
    scheme: string[];
    gradient?: Record<GradientKey, GradientPair[]>; // Should this be optional?
    interpolator: { [key: string]: (value: number) => string };
    grid: { gridLineColor?: string };
    opacity?: number;
    series?: string;
    [key: `series-${number}`]: string;
};

export type DataRow = Record<string, any>; // might want to specify __ROW_PATH__

export type TextStyles = Record<string, string>; // Should this be optional?

export type DataRows = DataRow[];

export type MainValue = {
    name: string;
    type: string; // integer, float, string, date, datetime, boolean
};

// NOTE: Should these props be optional?
export type TreemapValue = {
    treemapLevel?: number;
    treemapRoute?: any[]; // string[]?
};

// Are these a particular type of settings?
// Question: Is there a better type def for this?
export type Settings = {
    hideKeys?: any[];
    agg_paths?: any; // any[]?
    axisMemo: Axis[];
    colorStyles?: ColorStyles;
    crossValues: any[]; // string[]?
    data: DataRow[];
    filter: any[];
    mainValues: MainValue[];
    splitMainValues?: string[];
    realValues: string[];
    size: DOMRect;
    splitValues: any[];
    textStyles: TextStyles;
    sunburstLevel?: any;
    treemaps?: Record<string, TreemapValue>;
};

export type Orientation = "vertical" | "horizontal";
export type Orient = "left" | "right" | "top" | "bottom";

export type SettingNameValues = "crossValues" | "mainValues" | "splitValues";
export type ValueName =
    | "crossValue"
    | "mainValue"
    | "lowValue"
    | "highValue"
    | "colorValue";

export interface Domain {
    (data: any[]): any;
    valueName: <T extends ValueName | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, ValueName, Domain>;
    valueNames: <T extends ValueName[] | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, ValueName[], Domain>;
    orient?: <T extends Orientation | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Orientation, Domain>;
    pad: <T extends Pad | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Pad, Domain>;
    padUnit: <T extends PadUnit | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, PadUnit, Domain>;
}

export type DomainTuple = [number, number];

export interface ComponentData {
    bottom: any;
    left: any;
    top: any;
    right: any;
    size?: string;
    decorate?: (s, data, index) => void;
}

export interface Component {
    (): ComponentData;

    domain: <T extends Domain | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Domain, Component>;

    orient: <T extends Orientation | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, Orientation, Component>;

    settingName: <T extends SettingNameValues | undefined = undefined>(
        ...args: T[]
    ) => GetSetReturn<T, SettingNameValues, Component>;
}

export interface ScaleSequential extends d3.ScaleSequential<string> {
    (arg: any): any;
}
// TODO: Figure out the other types of scales that this could be.
export type D3Scale = d3.ScaleOrdinal<string, unknown> | ScaleSequential;

export type NodeRect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export type HTMLSelection<E extends d3.BaseType = HTMLElement> = d3.Selection<
    E,
    unknown,
    undefined,
    unknown
>;

export interface ChartElement extends IPerspectiveViewerElement {
    _chart: Chart | null;
    _settings: Settings | null;
    render_warning: boolean;
    _initialized: boolean;
    _container: HTMLElement;

    get name(): string;
    get category(): string;
    get select_mode(): string;
    get min_config_columns(): number;
    get config_column_names(): string[];

    get max_cells(): number;
    set max_cells(value: number);

    get max_columns(): number;
    set max_columns(value: number);

    get plugin_attributes(): {
        symbol: {
            symbols: {
                name: string;
                html: string;
            }[];
        };
    };

    _draw(): void;

    getContainer(): HTMLElement;
}

// TODO: What type should this actually be?
export type TreeData = {
    name: string;
    children: unknown;
    size?: number;
    color?: number;
    tooltip?: unknown[];
};
