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

exports.default = [
    {
        name: "Default",
        description: "Data grid",
        config: {},
    },
    {
        name: "Group By 1",
        description: "Data grid with 1 level of groups for rows",
        config: {
            group_by: ["Sub-Category"],
        },
        aggregates: "dominant",
    },
    {
        name: "Group By 2",
        description: "Data grid with 2 levels of groups for rows",
        config: {
            group_by: ["Category", "Sub-Category"],
        },
    },
    {
        name: "Split By",
        description: "Data grid with 1 level of categories for columns",
        config: {
            split_by: ["Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Split By 2",
        description: "Data grid with 2 levels of categories and columns",
        config: {
            split_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Both",
        description: "Data grid with grouped rows and categorized columns",
        config: {
            group_by: ["Region"],
            split_by: ["Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Both 2",
        description:
            "Data grid with 2 levels of groups and 2 levels of categories",
        config: {
            group_by: ["Region", "State"],
            split_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Quantity", "Discount", "Profit"],
        },
    },
    {
        name: "Background Row And Split By",
        description:
            "Data grid with groups, categories, and solid color conditional highlighting",
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
        description:
            "Data grid with groups, categories, and gradient conditional highlighting",
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
        description: "Data grid with groups, categories, and a bar chart",
        config: {
            group_by: ["State"],
            split_by: ["Sub-Category"],
            columns: ["Sales"],
            aggregates: { Sales: "avg" },
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
        description:
            "Data grid with 6 categories. 3 categories have conditional formatting using foreground colors.",
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
        description:
            "Data grid with 6 categories. 3 categories have custom, solid color conditional formatting.",
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
        description:
            "Data grid with 6 categories. 3 categories have custom, gradient color conditional formatting.",
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
        description:
            "Data grid with 6 categories. 3 categories have custom colored bars.",
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
        description:
            "Data grid with 1 group and 3 columns. 2 columns use bars and 1 column uses gradient conditional highlighting.",
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
        description:
            "Bar chart with 17 bars. X is 'Sub-Category', and Y is 'Sales'.",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Bar, Sorted Desc By Y-Axis",
        description:
            "Bar chart with 17 bars sorted descending. X is 'Sub-Category', and Y is 'Sales'.",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar - Row And Split By",
        description:
            "Stacked bar chart with 17 bars. X is 'Sub-Category', Y is 'Sales', and subgroup is 'Ship Mode'",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
        },
    },

    {
        name: "Y Bar - Group By 2 Sorted",
        description:
            "Bar chart with 3 categories and 17 total subcategories, sorted descending within each category.",
        config: {
            plugin: "Y Bar",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar - Group By 2 And Split By Sorted",
        description:
            "Bar chart with 3 colored categories and 17 total subcategories, sorted descending within each category.",
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
        description:
            "Stacked bar chart with 3 categories and 17 total subcategories, sorted descending within each category. X is 'Category, Sub-Category', y is 'Sales', subgroup is 'Region'",
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
        description:
            "Bar chart. X is 'State', Y is 'Profit'. Each state has, when applicable, 2 bars: Profit and Loss. States are sorted by Net.",
        config: {
            plugin: "Y Bar",
            group_by: ["State"],
            split_by: ["Profit (-/+)"],
            columns: ["Profit"],
            expressions: [`//Profit (-/+)\nif("Profit"<0){1}else{0}`],
            sort: [["Profit", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },

    // Y Bar Multi Axis

    {
        name: "Y Bar Multi Axis",
        description:
            "Groupd bar chart. X is 'Sub-Category', Y is 'Quantity' and 'Sales'. Each X value has 2 bars.",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Quantity", "Sales"],
            aggregates: { Sales: "avg" },
            sort: [["Sales", "desc"]],
        },
    },
    {
        name: "Y Bar Multi Axis - SPlit",
        description:
            "Groupd bar chart. X is 'Sub-Category', Y is 'Quantity', and the second Y is 'Sales'. Each X value has 2 bars.",
        config: {
            plugin: "Y Bar",
            group_by: ["Sub-Category"],
            columns: ["Quantity", "Sales"],
            sort: [["Sales", "desc"]],
            aggregates: { Sales: "avg" },
            plugin_config: { splitMainValues: ["Sales"] },
        },
    },

    // X Bar

    {
        name: "X Bar",
        description:
            "Horizontal bar chart with 17 bars. X is 'Sub-Category' and Y is 'Sales'.",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "X Bar",
        description:
            "Grouped horizontal bar chart. X is 'Sub-Category' and Y is 'Quantity, Profit'.",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            columns: ["Quantity", "Profit"],
        },
    },
    {
        name: "X Bar, Sorted Desc By X-Axis",
        description:
            "Sorted horizontal bar chart. X is 'Sub-Category' and Y is 'Sales'.",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
            sort: [["Sales", "asc"]],
        },
    },
    {
        name: "X Bar - Row And Split By",
        description:
            "Stacked horizontal bar chart. X is 'Sub-Category', Y is 'Sales', and subgroup is 'Region'",
        config: {
            plugin: "X Bar",
            group_by: ["Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales"],
        },
    },
    {
        name: "X Bar - Row And Split By",
        description:
            "Sorted stacked horizontal bar chart. X is 'Sub-Category', Y is 'Sales', and subgroup is 'Region'",
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
        description:
            "Line chart. X is Order Date from January 2014 to December 2017. Y is 'Sales'.",
        config: {
            plugin: "Y Line",
            group_by: ["Order Date"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis",
        description:
            "Line chart with 3 lines. X is Order Date, Y is Sales, and the lines are 'Consumer', 'Corporate', and 'Home Office'.",
        config: {
            plugin: "Y Line",
            group_by: ["Order Date"],
            split_by: ["Segment"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis Computed",
        description:
            "Line Chart. X is 'Order Date', summarized by month. Y is 'Sales'",
        config: {
            plugin: "Y Line",
            group_by: ["bucket(\"Order Date\", 'M')"],
            expressions: ["bucket(\"Order Date\", 'M')"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Line - Datetime Axis",
        description:
            "Line Chart with 4 lines. X is 'Order Date' from January 2014 to December 2017. Y is 'Sales'. Each line is for each year.",
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
        description:
            "Line Chart with 4 lines. X is Order Date, Y is Sales, and the lines track different regions.",
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
        description: "Line Chart. X is State and Y is Sales.",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales"],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Line - Category Axis",
        description:
            "Line Chart. X is State and Y is Sales. Sorted descending.",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Line - Row and Split By",
        description:
            "Line chart with 3 lines. X is State, Y is Sales, and each line tracks a customer segment. States are sorted descending by total sales.",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            split_by: ["Segment"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Line - Multi Axis Split",
        description:
            "Line chart with 2 lines. X is State, Y is Profit, and second Y is Sales. States are sorted descending by Sales.",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            columns: ["Sales", "Profit"],
            plugin_config: { splitMainValues: ["Sales"] },
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Line - Multi Axis Split",
        description:
            "Line chart with 2 lines. X is State, Y is Profit, second Y is Sales, and each line is profit/sales for each customer segment. States are sorted descending by total Sales.",
        config: {
            plugin: "Y Line",
            group_by: ["State"],
            split_by: ["Segment"],
            columns: ["Sales", "Profit"],
            plugin_config: { splitMainValues: ["Sales"] },
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },

    // Y Area

    {
        name: "Y Area - Datetime Axis Computed",
        description:
            "Area chart. X is 'Order Date', bucketed by month. Y is Sales.",
        config: {
            plugin: "Y Area",
            group_by: ["bucket(\"Order Date\", 'M')"],
            expressions: ["bucket(\"Order Date\", 'M')"],
            columns: ["Sales"],
        },
    },
    {
        name: "Y Area - Datetime Axis",
        description:
            "Area chart. X is 'Order Date', bucketed by month. Y is sales. Each year is its own color and area.",
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
        description:
            "Stacked area chart. X is 'Order Date', bucketed by month. Y is sales. Subgroup is Region.",
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
        description: "Area chart. X is 'State'. Y is Sales.",
        config: {
            plugin: "Y Area",
            group_by: ["State"],
            columns: ["Sales"],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Area - Row and Split By",
        description:
            "Stacked area chart. X is 'State'. Y is 'Sales'. Subgroup is customer segment.",
        config: {
            plugin: "Y Area",
            group_by: ["State"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Area - 2 Group By",
        description:
            "Grouped area chart. X is State, grouped by Region. Y is sales. Sorted descending by Sales for each region.",
        config: {
            plugin: "Y Area",
            group_by: ["Region", "State"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Area - Row and Split By",
        description:
            "Grouped area chart. X is State, grouped by Region. Y is sales. Sorted descending by Sales for each region. Each group is a different color.",
        config: {
            plugin: "Y Area",
            group_by: ["Region", "State"],
            split_by: ["Region"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Y Area - Row and Split By 2",
        description:
            "Stacked grouped area chart. X is State, grouped by Region. Y is sales. Subgroup is customer segment. Sorted descending by total sales.",
        config: {
            plugin: "Y Area",
            group_by: ["Region", "State"],
            split_by: ["Ship Mode"],
            columns: ["Sales"],
            sort: [["Sales", "desc"]],
        },
        viewport: { width: 600, height: 450 },
    },

    // X/Y Scatter

    {
        name: "X/Y Scatter",
        description: "Scatter plot. X is Sales. Y is Quantity.",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["City"],
            columns: ["Sales", "Quantity"],
            aggregates: { Sales: "avg", Profit: "avg", Quantity: "avg" },
        },
    },
    {
        name: "X/Y Scatter - Split By",
        description:
            "Grouped Scatter plot. X is Sales. Y is Quantity. Group is Region.",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["City"],
            split_by: ["Region"],
            columns: ["Sales", "Quantity"],
            aggregates: { Sales: "avg", Profit: "avg", Quantity: "avg" },
        },
    },
    {
        name: "X/Y Scatter - Color By Float",
        description:
            "Scatter plot. X is Sales. Y is Quantity. Each dot is colored by Profit.",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["State"],
            columns: ["Sales", "Quantity", "Profit"],
            aggregates: { Sales: "avg", Profit: "avg", Quantity: "avg" },
            sort: [["Profit", "desc"]],
        },
    },
    {
        name: "X/Y Scatter - Bubble",
        description: "Bubble plot. X is Sales. Y is Quantity. Size is Profit.",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["Sub-Category"],
            columns: ["Sales", "Quantity", null, "Profit"],
            aggregates: { Sales: "avg", Profit: "avg", Quantity: "avg" },
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "X/Y Scatter - Bubble",
        description:
            "Grouped bubble plot. X is Sales. Y is Quantity. Size is Profit. Group is Product Sub-Category.",
        config: {
            plugin: "X/Y Scatter",
            group_by: ["Sub-Category"],
            split_by: ["Category"],
            columns: ["Sales", "Quantity", null, "Profit"],
            aggregates: { Sales: "avg", Profit: "avg", Quantity: "avg" },
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "X/Y Scatter - Bubble",
        description:
            "Colored bubble plot. X is Sales. Y is Quantity. Size is Row ID. Color is Profit.",
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
        viewport: { width: 600, height: 450 },
    },

    {
        name: "X/Y Scatter - Category Y Axis",
        description:
            "Horizontal Bubble plot. X is State. Y is Profit. Size is Quantity.",
        config: {
            plugin: "X/Y Scatter",
            columns: ["Profit", "State", null, "Quantity"],
            group_by: ["City"],
            aggregates: {
                State: "dominant",
            },
        },
        viewport: { width: 600, height: 450 },
    },

    {
        name: "X/Y Scatter - Category Y Axis And Size And Color",
        description:
            "Colored Bubble plot. X is State. Y is product sub-category. Size is Sales. Color is Quantity.",
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
        viewport: { width: 600, height: 450 },
    },

    // X/Y Line

    {
        name: "X/Y Line",
        description:
            "Line chart with 4 lines. X is Sales. Y is Profit. Each line represents a region.",
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
        description:
            "Treemap with 1-level hierarchy and 17 tiles. Each tile is a product sub-category, and the tile's size represents sales",
        config: {
            plugin: "Treemap",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "Treemap - 2 Group By",
        description:
            "Treemap with 2-level hierarchies for Category and Sub-Category. Size is Sales.",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category", "Segment"],
            columns: ["Sales"],
        },
    },
    {
        name: "Treemap - Float Color",
        description:
            "Colored treemap with 2-level hierarchies for Category and Sub-Category. Size is Sales. Color is Quantity.",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Quantity"],
            sort: [["Quantity", "desc"]],
        },
    },
    {
        name: "Treemap - Category Color",
        description:
            "Treemap with 2-level hierarchies for Category and Sub-Category, with each Category colored differently. Size is Sales.",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Category"],
            aggregates: { Category: "dominant" },
        },
    },
    {
        name: "Treemap - Row And Split By Float Color",
        description:
            "Colored treemap with 3-level hierarchies for Region, Category, and Sub-Category. Size is Sales. Color is Quantity.",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Quantity"],
            sort: [["Quantity", "desc"]],
        },
        viewport: { width: 800, height: 600 },
    },
    {
        name: "Treemap - Row And Split By Category Color",
        description:
            "Treemap with 3-level hierarchies for Region, Category, and Sub-Category, with each Region colored differently. Size is Sales.",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Region"],
            aggregates: { Region: "dominant" },
        },
        viewport: { width: 800, height: 600 },
    },
    {
        name: "Treemap - Row And Split By Category Color 2",
        description:
            "Treemap with 3-level hierarchies for Region, Category, and Sub-Category, with each Category colored differently. Size is Sales.",
        config: {
            plugin: "Treemap",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Category"],
            aggregates: { Category: "dominant" },
        },
        viewport: { width: 800, height: 600 },
    },
    // Sunburst

    {
        name: "Sunburst",
        description:
            "Sunburst with 1-level hierarchy. Hierarchy is Category. Size is Sales.",
        config: {
            plugin: "Sunburst",
            group_by: ["Sub-Category"],
            columns: ["Sales"],
        },
    },
    {
        name: "Sunburst - 2 Group By",
        description:
            "Sunburst with 3-level hierarchy. Hierarchies are Category, Sub-category, and Customer Segment.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category", "Segment"],
            columns: ["Sales"],
        },
    },
    {
        name: "Sunburst - Float Color",
        description:
            "Colored sunburst with 2-level hierarchy. Hierarchies are Category and Sub-category. Size is Quantity. Color is Sales.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            columns: ["Quantity", "Sales"],
            sort: [["Quantity", "desc"]],
        },
    },
    {
        name: "Sunburst - Category Color",
        description:
            "Colored sunburst with 2-level hierarchy. Hierarchies are Category and Sub-category. Size is Sales. Color is also Category.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            columns: ["Sales", "Category"],
            aggregates: { Category: "dominant" },
        },
    },
    {
        name: "Sunburst - Row And Split By",
        description:
            "Grouped sunbursts with 2-level hierarchy. Hierarchies are Category and Sub-category. Size is Sales. Each sunburst is a different region.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales"],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Sunburst - Row And Split By Float Color",
        description:
            "Grouped colored sunbursts with 2-level hierarchy. Hierarchies are Category and Sub-category. Size is Sales. Color is Quantity. Each sunburst is a different region.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Quantity"],
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Sunburst - Row And Split By Category Color",
        description:
            "Grouped sunbursts with 2-level hierarchy. Hierarchies are Category and Sub-category. Size is Sales. Each sunburst is a different region and color.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Region"],
            aggregates: { Region: "dominant" },
        },
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Sunburst - Row And Split By Category Color 2",
        description:
            "Grouped sunbursts with 2-level hierarchy. Hierarchies are Category and Sub-category. Size is Sales. Each sunburst is a different region, and each category is colored.",
        config: {
            plugin: "Sunburst",
            group_by: ["Category", "Sub-Category"],
            split_by: ["Region"],
            columns: ["Sales", "Category"],
            aggregates: { Category: "dominant" },
        },
        viewport: { width: 600, height: 450 },
    },

    // Heatmap

    {
        name: "Heatmap",
        description:
            "Heatmap. Columns are Sub-Category. Rows are Region. Color is Profit.",
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
        description:
            "Heatmap. Columns are State. Rows are Sub-Category. Color is Profit.",
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
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Heatmap 3",
        description:
            "Heatmaps. Columns are order date, bucketed by month. Rows are Sub-Category. Color is Discount.",
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
        viewport: { width: 600, height: 450 },
    },
    {
        name: "Heatmap 4",
        description:
            "Heatmap. Columns are order date, bucketed by month. Rows are Profit, bucketed by 100. Color is Profit.",
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
        viewport: { width: 600, height: 450 },
    },
];
