module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                modules: false,
                useBuiltIns: "usage",
                corejs: 2
            }
        ]
    ],
    sourceType: "unambiguous",
    plugins: [
        "lodash",
        "@babel/transform-runtime",
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "transform-custom-element-classes",
        [
            "@babel/plugin-transform-for-of",
            {
                loose: true
            }
        ]
    ]
};
