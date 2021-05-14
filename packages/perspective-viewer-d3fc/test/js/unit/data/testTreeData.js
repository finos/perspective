export const data = [
    {
        __ROW_PATH__: ["Central", "Furniture"],
        Sales: 163797.16380000004,
        Quantity: 1827
    },
    {
        __ROW_PATH__: ["Central", "Technology"],
        Sales: 170416.31200000003,
        Quantity: 1544
    },
    {
        __ROW_PATH__: ["East", "Furniture"],
        Sales: 208291.20400000017,
        Quantity: 2214
    },
    {
        __ROW_PATH__: ["East", "Technology"],
        Sales: 264973.9810000004,
        Quantity: 1942
    }
];

const item = {
    __ROW_PATH__: ["East"],
    Quantity: 4156
};

export const agg_paths = [
    [item, item, item],
    [item, item, item],
    [item, item, item],
    [item, item, item],
    [item, item, item],
    [item, item, item]
];

export const splitData = [
    {
        __ROW_PATH__: ["Central", "Furniture"],
        "First Class|Sales": 21037.825399999994,
        "First Class|Quantity": 263,
        "Same Day|Sales": 8842.286,
        "Same Day|Quantity": 103,
        "Second Class|Sales": 31187.1234,
        "Second Class|Quantity": 343,
        "Standard Class|Sales": 102729.92900000002,
        "Standard Class|Quantity": 1118
    },
    {
        __ROW_PATH__: ["Central", "Office Supplies"],
        "First Class|Sales": 19390.004000000004,
        "First Class|Quantity": 665,
        "Same Day|Sales": 5818.718,
        "Same Day|Quantity": 235,
        "Second Class|Sales": 34307.253,
        "Second Class|Quantity": 1063,
        "Standard Class|Sales": 107510.43999999997,
        "Standard Class|Quantity": 3446
    },
    {
        __ROW_PATH__: ["Central", "Technology"],
        "First Class|Sales": 18319.086000000003,
        "First Class|Quantity": 228,
        "Same Day|Sales": 5754.406,
        "Same Day|Quantity": 54,
        "Second Class|Sales": 38055.629,
        "Second Class|Quantity": 389,
        "Standard Class|Sales": 108287.191,
        "Standard Class|Quantity": 873
    },
    {
        __ROW_PATH__: ["East", "Furniture"],
        "First Class|Sales": 29410.64399999999,
        "First Class|Quantity": 383,
        "Same Day|Sales": 12852.570999999994,
        "Same Day|Quantity": 130,
        "Second Class|Sales": 44035.93700000001,
        "Second Class|Quantity": 433,
        "Standard Class|Sales": 121992.05199999994,
        "Standard Class|Quantity": 1268
    },
    {
        __ROW_PATH__: ["East", "Office Supplies"],
        "First Class|Sales": 36483.09600000002,
        "First Class|Quantity": 1105,
        "Same Day|Sales": 9124.796000000004,
        "Same Day|Quantity": 332,
        "Second Class|Sales": 43205.097,
        "Second Class|Quantity": 1249,
        "Standard Class|Sales": 116703.0659999999,
        "Standard Class|Quantity": 3776
    },
    {
        __ROW_PATH__: ["East", "Technology"],
        "First Class|Sales": 47693.31300000001,
        "First Class|Quantity": 317,
        "Same Day|Sales": 21349.464999999997,
        "Same Day|Quantity": 111,
        "Second Class|Sales": 29304.48999999999,
        "Second Class|Quantity": 344,
        "Standard Class|Sales": 166626.71300000005,
        "Standard Class|Quantity": 1170
    }
];

export const mainValues = [
    {
        name: "Sales",
        type: "float"
    },
    {
        name: "Quantity",
        type: "integer"
    }
];

export const realValues = ["Sales", "Quantity"];

export const crossValues = [
    {
        name: "Region",
        type: "string"
    },
    {
        name: "Category",
        type: "string"
    }
];
