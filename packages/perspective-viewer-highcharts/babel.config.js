module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                useBuiltIns: "usage",
                exclude: ["transform-regenerator", "transform-async-to-generator"]
            }
        ]
    ],
    sourceType: "unambiguous",
    plugins: [
        "@babel/plugin-transform-runtime",
        "module:fast-async",
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "transform-custom-element-classes",
        [
            "@babel/plugin-transform-for-of",
            {
                loose: true
            }
        ],
        ["@babel/plugin-transform-regenerator", {async: false}]
    ]
};
