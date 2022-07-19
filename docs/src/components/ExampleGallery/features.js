exports.default = [
    {
        name: "Default",
        config: {},
    },
    {
        name: "Group By 1",
        config: {
            group_by: ["Sub-Category"],
        },
        aggregates: "dominant",
    },
    {
        name: "Group By 2",
        config: {
            group_by: ["Category", "Sub-Category"],
        },
    },
    {
        name: "Split By",
        config: {
            split_by: ["Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Split By 2",
        config: {
            split_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Both",
        config: {
            group_by: ["Region"],
            split_by: ["Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Both 2",
        config: {
            group_by: ["Region", "State"],
            split_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Background Row And Split By",
        config: {
            group_by: ["State"],
            split_by: ["Sub-Category"],
            columns: ["Profit"],
            sort: [["Profit", "col asc"]],
            plugin_config: {
                columns: {
                    Profit: {
                        number_color_mode: "background",
                        // gradient: 600,
                    },
                },
            },
        },
    },
    {
        name: "Gradient Row And Split By",
        config: {
            group_by: ["State"],
            split_by: ["Sub-Category"],
            columns: ["Profit"],
            sort: [["Profit", "col asc"]],
            plugin_config: {
                columns: {
                    Profit: {
                        number_color_mode: "gradient",
                        gradient: 1600,
                    },
                },
            },
        },
    },
    {
        name: "Background Row And Split By",
        config: {
            group_by: ["State"],
            split_by: ["Sub-Category"],
            columns: ["Sales"],
            aggregates: {Sales: "avg"},
            plugin_config: {
                columns: {
                    Sales: {
                        number_color_mode: "bar",
                        gradient: 600,
                    },
                },
            },
        },
    },
    {
        name: "Foreground Colors",
        config: {
            columns: [
                "Category",
                "Sales",
                "Discount",
                "Profit",
                "Sub-Category",
                "Order Date",
            ],
            plugin_config: {
                columns: {
                    Profit: {
                        pos_color: "#32cd82",
                        neg_color: "#f50fed",
                    },
                    Sales: {
                        pos_color: "#780aff",
                        neg_color: "#f5ac0f",
                    },
                    Discount: {
                        pos_color: "#f5ac0f",
                        neg_color: "#780aff",
                    },
                },
            },
            sort: [["Sub-Category", "desc"]],
        },
    },
    {
        name: "Background Colors",
        config: {
            plugin: "Datagrid",
            plugin_config: {
                columns: {
                    Discount: {
                        neg_bg_color: "#780aff",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#f5ac0f",
                    },
                    Profit: {
                        neg_bg_color: "#f50fed",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#32cd82",
                    },
                    Sales: {
                        neg_bg_color: "#f5ac0f",
                        number_bg_mode: "color",
                        number_fg_mode: "disabled",
                        pos_bg_color: "#780aff",
                    },
                },
                editable: false,
                scroll_lock: true,
            },
            columns: [
                "Category",
                "Sales",
                "Discount",
                "Profit",
                "Sub-Category",
                "Order Date",
            ],
            sort: [["Sub-Category", "desc"]],
        },
    },

    {
        name: "Gradient Colors",
        config: {
            columns: [
                "Category",
                "Sales",
                "Discount",
                "Profit",
                "Sub-Category",
                "Order Date",
            ],
            plugin_config: {
                columns: {
                    Profit: {
                        number_color_mode: "gradient",
                        gradient: 600,
                        pos_color: "#32cd82",
                        neg_color: "#f50fed",
                    },
                    Sales: {
                        number_color_mode: "gradient",
                        gradient: 2268,
                        pos_color: "#780aff",
                        neg_color: "#f5ac0f",
                    },
                    Discount: {
                        number_color_mode: "gradient",
                        gradient: 0.8,
                        pos_color: "#f5ac0f",
                        neg_color: "#780aff",
                    },
                },
            },
            sort: [["Sub-Category", "desc"]],
        },
    },
    {
        name: "Bar Colors",
        config: {
            columns: [
                "Category",
                "Sales",
                "Discount",
                "Profit",
                "Sub-Category",
                "Order Date",
            ],
            plugin_config: {
                columns: {
                    Profit: {
                        number_color_mode: "bar",
                        gradient: 600,
                        pos_color: "#32cd82",
                        neg_color: "#f50fed",
                    },
                    Sales: {
                        number_color_mode: "bar",
                        gradient: 2268,
                        pos_color: "#780aff",
                        neg_color: "#f5ac0f",
                    },
                    Discount: {
                        number_color_mode: "bar",
                        gradient: 0.8,
                        pos_color: "#f5ac0f",
                        neg_color: "#780aff",
                    },
                },
            },
            sort: [["Sub-Category", "desc"]],
        },
    },
    {
        name: "Thermometer",
        config: {
            group_by: ["State"],
            columns: ["Profit (-)", "Profit", "Profit (+)"],
            plugin_config: {
                columns: {
                    "Profit (-)": {
                        number_color_mode: "bar",
                        gradient: 10000,
                    },
                    Profit: {
                        number_color_mode: "gradient",
                        gradient: 10000,
                    },
                    "Profit (+)": {
                        number_color_mode: "bar",
                        gradient: 10000,
                    },
                },
            },
            expressions: [
                `//Profit (-)\nif("Profit"<0){"Profit"}else{0}`,
                `//Profit (+)\nif("Profit">0){"Profit"}else{0}`,
            ],
        },
    },

    // Y Bar

    {
        name: "Y Bar",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Bar, Sorted Desc By Y-Axis",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar - Row And Split By",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
        },
    },

    {
        name: "Y Bar - Group By 2 Sorted",
        config: {
            plugin: "Y Bar",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar - Group By 2 And Split By Sorted",
        config: {
            plugin: "Y Bar",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Category"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar - Group By 2 And 2 Split By Sorted",
        config: {
            plugin: "Y Bar",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Category", "Region"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar - Group By 2 And 2 Split By Sorted 2",
        config: {
            plugin: "Y Bar",
            group_by: ["State"],
            split_by: ["Profit (-/+)"],
            columns: ["Profit"],
            expressions: [`//Profit (-/+)\nif("Profit"<0){1}else{0}`],
            sort: [["Profit", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },

    // Y Bar Multi Axis

    {
        name: "Y Bar Multi Axis",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Quantity", "Sales"],
            aggregates: {Sales: "avg"},
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar Multi Axis - SPlit",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Quantity", "Sales"],
            sort: [["Sales", "desc"]],
            aggregates: {Sales: "avg"},
            plugin_config: {splitMainValues: ["Sales"]},
        },
    },

    // X Bar

    {
        name: "X Bar",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "X Bar",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            columns: ["Quantity", "Profit"],
        },
    },
    {
        name: "X Bar, Sorted Desc By X-Axis",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
            sort: [["Sales", "asc"]],
        },
    },
    {
        name: "X Bar - Row And Split By",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales"],
        },
    },
    {
        name: "X Bar - Row And Split By",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales"],
            sort: [["Sales", "asc"]],
        },
    },

    // Y Line

    {
        name: "Y Line - Datetime Axis",
        config: {
            plugin: "Y Line",
            group_by: ["Order Date"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis",
        config: {
            plugin: "Y Line",
            group_by: ["Order Date"],
            split_by: ["Segment"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis Computed",
        config: {
            plugin: "Y Line",
            group_by: ["bucket(\"Order Date\", 'M')"],
            expressions: ["bucket(\"Order Date\", 'M')"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis",
        config: {
            plugin: "Y Line",
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ["bucket(\"Order Date\", 'Y')"],
            expressions: [
                "bucket(\"Order Date\", 'M')",
                "bucket(\"Order Date\", 'Y')",
            ],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis And Split By",
        config: {
            plugin: "Y Line",
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ["Region"],
            expressions: ["bucket(\"Order Date\", 'M')"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Category Axis",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales"],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Line - Category Axis",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Line - Row and Split By",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            split_by: ["Segment"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Line - Multi Axis Split",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales", "Profit"],
            plugin_config: {splitMainValues: ["Sales"]},
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Line - Multi Axis Split",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            split_by: ["Segment"],
            columns: ["Sales", "Profit"],
            plugin_config: {splitMainValues: ["Sales"]},
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },

    // Y Area

    {
        name: "Y Area - Datetime Axis Computed",
        config: {
            plugin: "Y Area",
            group_by: ["bucket(\"Order Date\", 'M')"],
            expressions: ["bucket(\"Order Date\", 'M')"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Area - Datetime Axis",
        config: {
            plugin: "Y Area",
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ["bucket(\"Order Date\", 'Y')"],
            expressions: [
                "bucket(\"Order Date\", 'M')",
                "bucket(\"Order Date\", 'Y')",
            ],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Area - Datetime Axis And Split By",
        config: {
            plugin: "Y Area",
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ["Region"],
            expressions: ["bucket(\"Order Date\", 'M')"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Area - Category Axis",
        config: {
            plugin: "Y Area",
            group_by: ["State"],
            columns: ["Sales"],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Area - Row and Split By",
        config: {
            plugin: "Y Area",
            group_by: ["State"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Area - 2 Group By",
        config: {
            plugin: "Y Area",
            group_by: ["Region", "State"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Area - Row and Split By",
        config: {
            plugin: "Y Area",
            group_by: ["Region", "State"],
            split_by: ["Region"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Y Area - Row and Split By 2",
        config: {
            plugin: "Y Area",
            group_by: ["Region", "State"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: {width: 600, height: 450},
    },

    // X/Y Scatter

    {
        name: "X/Y Scatter",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["City"],
            columns: ["Sales", "Quantity"],
            aggregates: {Sales: "avg", Profit: "avg", Quantity: "avg"},
        },
    },
    {
        name: "X/Y Scatter - Split By",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["City"],
            split_by: ["Region"],
            columns: ["Sales", "Quantity"],
            aggregates: {Sales: "avg", Profit: "avg", Quantity: "avg"},
        },
    },
    {
        name: "X/Y Scatter - Color By Float",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["State"],
            columns: ["Sales", "Quantity", "Profit"],
            aggregates: {Sales: "avg", Profit: "avg", Quantity: "avg"},
            sort: [["Profit", "desc"]],
        },
    },
    {
        name: "X/Y Scatter - Bubble",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["Sub-Category"],
            columns: ["Sales", "Quantity", null, "Profit"],
            aggregates: {Sales: "avg", Profit: "avg", Quantity: "avg"},
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "X/Y Scatter - Bubble",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["Sub-Category"],
            split_by: ["Category"],
            columns: ["Sales", "Quantity", null, "Profit"],
            aggregates: {Sales: "avg", Profit: "avg", Quantity: "avg"},
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "X/Y Scatter - Bubble",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["Sub-Category"],
            columns: ["Sales", "Quantity", "Profit", "Row ID"],
            sort: [["Profit", "desc"]],
            aggregates: {
                Sales: "avg",
                Profit: "sum",
                Quantity: "avg",
                "Row ID": "avg",
            },
        },
        viewport: {width: 600, height: 450},
    },

    {
        name: "X/Y Scatter - Category Y Axis",
        config: {
            plugin: "X/Y Scatter",
            columns: ["Profit", "State", null, "Quantity"],
            group_by: ["City"],
            aggregates: {
                State: "dominant",
            },
        },
        viewport: {width: 600, height: 450},
    },

    {
        name: "X/Y Scatter - Category Y Axis And Size And Color",
        config: {
            plugin: "X/Y Scatter",
            columns: ["State", "Sub-Category", "Quantity", "Sales", null],
            group_by: ["State", "Sub-Category"],
            aggregates: {
                State: "dominant",
                "Sub-Category": "dominant",
                Profit: "low",
            },
        },
        viewport: {width: 600, height: 450},
    },

    // X/Y Line

    {
        name: "X/Y Line",
        config: {
            columns: ["Sales", "Profit"],
            plugin: "X/Y Line",
            aggregates: {
                "Order Date": "dominant",
                Sales: "avg",
                Profit: "avg",
            },
            group_by: ["State"],
            sort: [
                ["Profit", "desc"],
                ["Sales", "desc"],
            ],
            split_by: ["Region"],
        },
    },

    // Treemap

    {
        name: "Treemap",
        config: {
            plugin: "Treemap",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "Treemap - 2 Group By",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category", "Segment"],
            columns: ["Sales"],
        },
    },
    {
        name: "Treemap - Float Color",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Quantity"],
            sort: [["Quantity", "desc"]],
        },
    },
    {
        name: "Treemap - Category Color",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Category"],
            aggregates: {Category: "dominant"},
        },
    },
    {
        name: "Treemap - Row And Split By Float Color",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Quantity"],
            sort: [["Quantity", "desc"]],
        },
        viewport: {width: 800, height: 600},
    },
    {
        name: "Treemap - Row And Split By Category Color",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Region"],
            aggregates: {Region: "dominant"},
        },
        viewport: {width: 800, height: 600},
    },
    {
        name: "Treemap - Row And Split By Category Color 2",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Category"],
            aggregates: {Category: "dominant"},
        },
        viewport: {width: 800, height: 600},
    },
    // Sunburst

    {
        name: "Sunburst",
        config: {
            plugin: "Sunburst",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "Sunburst - 2 Group By",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category", "Segment"],
            columns: ["Sales"],
        },
    },
    {
        name: "Sunburst - Float Color",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            columns: ["Quantity", "Sales"],
            sort: [["Quantity", "desc"]],
        },
    },
    {
        name: "Sunburst - Category Color",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Category"],
            aggregates: {Category: "dominant"},
        },
    },
    {
        name: "Sunburst - Row And Split By",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales"],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Sunburst - Row And Split By Float Color",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Quantity"],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Sunburst - Row And Split By Category Color",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Region"],
            aggregates: {Region: "dominant"},
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Sunburst - Row And Split By Category Color 2",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Category"],
            aggregates: {Category: "dominant"},
        },
        viewport: {width: 600, height: 450},
    },

    // Heatmap

    {
        name: "Heatmap",
        config: {
            plugin: "Heatmap",
            group_by: ["Sub-Category"],
            split_by: ["Region"],
            columns: ["Profit"],
            sort: [
                ["Profit", "desc"],
                ["Profit", "col desc"],
            ],
            // aggregates: {Category: "dominant"}
        },
        // viewport: {width: 600, height: 200}
    },
    {
        name: "Heatmap 2",
        config: {
            plugin: "Heatmap",
            group_by: ["State"],
            split_by: ["Sub-Category"],
            columns: ["Profit"],
            sort: [
                ["Profit", "desc"],
                ["Profit", "col desc"],
            ],
            // aggregates: {Profit: "low"}
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Heatmap 3",
        config: {
            columns: ["Discount"],
            plugin: "Heatmap",
            expressions: ["bucket(\"Order Date\", 'M')"],
            aggregates: {
                "Order Date": "dominant",
                Sales: "avg",
            },
            split_by: ["Sub-Category"],
            group_by: ["bucket(\"Order Date\", 'M')"],
            sort: [["Discount", "col asc"]],
        },
        viewport: {width: 600, height: 450},
    },
    {
        name: "Heatmap 4",
        config: {
            plugin: "Heatmap",
            columns: ["Profit"],
            expressions: [
                'bucket("Profit", 100)',
                "bucket(\"Order Date\", 'M')",
            ],
            group_by: ["bucket(\"Order Date\", 'M')"],
            split_by: ['bucket("Profit", 100)'],
            plugin_config: {},
        },
        viewport: {width: 600, height: 450},
    },
];
