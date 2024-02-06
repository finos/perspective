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

type CustomDatetimeFormat =
    | "long"
    | "short"
    | "narrow"
    | "numeric"
    | "2-digit"
    | "disabled";
type SimpleDatetimeFormat = "full" | "long" | "medium" | "short" | "disabled";

export type PerspectiveColumnConfig = {
    [column_name: string]: PerspectiveColumnConfigValue;
};

export type PerspectiveColumnConfigValue = {
    datagrid_number_style?: {
        number_fg_mode?: "color" | "bar";
        number_bg_mode?: "color" | "gradient" | "pulse";
        fixed?: number;
        pos_fg_color?: string;
        neg_fg_color?: string;
        pos_bg_color?: string;
        neg_bg_color?: string;
        fg_gradient?: number;
        bg_gradient?: number;
    };
    datagrid_datetime_style?: {
        timeZone?: string;
        datetime_color_mode?: "foreground" | "background";
        color?: string;
    } & (
        | {
              format?: "custom";
              fractionalSecondDigits?: number;
              second?: CustomDatetimeFormat;
              minute?: CustomDatetimeFormat;
              hour?: CustomDatetimeFormat;
              day?: CustomDatetimeFormat;
              weekday?: CustomDatetimeFormat;
              month?: CustomDatetimeFormat;
              year?: CustomDatetimeFormat;
              hour12?: boolean;
          }
        | {
              dateStyle?: SimpleDatetimeFormat;
              timeStyle?: SimpleDatetimeFormat;
          }
    );
    datagrid_string_style?: {
        string_color_mode?: "foreground" | "background" | "series";
        format?: "link" | "image" | "bold" | "italics";
        color?: string;
    };
    symbols?: Record<string, string>;
};
