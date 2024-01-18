export default function column_style_opts(type, _group) {
    const fg_colors = [
        { label: "+", value: this.model._pos_fg_color[0] },
        { label: "-", value: this.model._neg_fg_color[0] },
    ];
    const bg_colors = [
        { label: "+", value: this.model._pos_bg_color[0] },
        { label: "-", value: this.model._neg_bg_color[0] },
    ];
    const default_colors = [{ value: this.model._color[0] }];

    switch (type) {
        case "integer":
        case "float":
            return [
                {
                    label: "Precision",
                    control: "numeric-precision",
                    options: {
                        default: type === "float" ? 2 : 0,
                    },
                },
                {
                    label: "Foreground",
                    control: "color",
                    options: {
                        modes: [
                            {
                                label: "Color",
                                colors: fg_colors,
                                default: true,
                            },
                            {
                                label: "Bar",
                                colors: fg_colors,
                                max: "column", // calculated from the value of the column.
                            },
                        ],
                    },
                },
                {
                    label: "Background",
                    control: "color",
                    options: {
                        modes: [
                            {
                                label: "Color",
                                colors: bg_colors,
                            },
                            {
                                label: "Gradient",
                                colors: bg_colors,
                                max: "column",
                                gradient: true,
                            },
                            {
                                label: "Pulse (Δ)",
                                colors: bg_colors,
                            },
                        ],
                    },
                },
            ];
        case "string":
            return [
                {
                    label: "Format",
                    control: "radio",
                    options: ["Bold", "Italics", "Link"],
                },
                {
                    label: "Color",
                    control: "color",
                    options: {
                        modes: [
                            {
                                label: "Foreground",
                                colors: default_colors,
                            },
                            {
                                label: "Background",
                                colors: default_colors,
                            },
                            {
                                label: "Series",
                                colors: [
                                    {
                                        label: "Root",
                                        value: this.model._color[0],
                                    },
                                ],
                            },
                        ],
                    },
                },
            ];
        case "date":
        case "datetime":
            return [
                {
                    label: "Color",
                    control: "color",
                    options: {
                        modes: [
                            {
                                label: "Foreground",
                                colors: default_colors,
                            },
                            {
                                label: "Background",
                                colors: default_colors,
                            },
                        ],
                    },
                },
                type === "date"
                    ? {
                          label: "Date Style",
                          control: "dropdown",
                          options: [
                              "full",
                              "long",
                              "medium",
                              "short",
                              "disabled",
                          ],
                      }
                    : { control: "datetime-string-format" },
            ];
        case "boolean":
        case "object":
            return [];
    }
}
