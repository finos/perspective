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

export default function column_style_opts(type, _group) {
    const fg_colors = {
        "+": this.model._pos_fg_color[0],
        "-": this.model._neg_fg_color[0],
    };
    const bg_colors = {
        "+": this.model._pos_bg_color[0],
        "-": this.model._neg_bg_color[0],
    };
    const default_colors = { "": this.model._color[0] };
    const date_color = {
        control: "color",
        modes: {
            Foreground: {
                colors: default_colors,
            },
            Background: {
                colors: default_colors,
            },
        },
    };

    switch (type) {
        case "integer":
        case "float":
            return {
                Precision: {
                    control: "numeric-precision",
                    default: type === "float" ? 2 : 0,
                },
                Foreground: {
                    control: "color",
                    modes: {
                        Color: {
                            colors: fg_colors,
                            default: true,
                        },
                        Bar: {
                            colors: fg_colors,
                            max: "column", // calculated from the value of the column.
                        },
                    },
                },
                Background: {
                    control: "color",
                    modes: {
                        Color: {
                            colors: bg_colors,
                        },
                        Gradient: {
                            colors: bg_colors,
                            max: "column",
                            gradient: true,
                        },
                        "Pulse (Δ)": {
                            colors: bg_colors,
                        },
                    },
                },
            };
        case "string":
            return {
                Format: {
                    control: "radio",
                    values: ["Bold", "Italics", "Link"],
                },
                Color: {
                    control: "color",
                    modes: {
                        Foreground: {
                            colors: default_colors,
                        },
                        Background: {
                            colors: default_colors,
                        },
                        Series: {
                            colors: [
                                {
                                    label: "Root",
                                    value: this.model._color[0],
                                },
                            ],
                        },
                    },
                },
            };
        case "date":
            return {
                Color: date_color,
                Format: {
                    control: "dropdown",
                    values: ["full", "long", "medium", "short", "disabled"],
                },
            };
        case "datetime":
            return {
                Color: date_color,
                Format: { control: "datetime-string-format" },
            };
        case "boolean":
        case "object":
            return {};
    }
}
