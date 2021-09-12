module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    chrome: "70",
                    node: "8",
                    ios: "12",
                    safari: "12",
                    edge: "44",
                },
                modules: false,
                useBuiltIns: "usage",
                corejs: 3,
            },
        ],
    ],
    sourceType: "unambiguous",
    plugins: [
        "lodash",
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "transform-custom-element-classes",
    ],
};
