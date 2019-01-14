module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                useBuiltIns: "usage"
            }
        ]
    ],
    sourceType: "unambiguous",
    plugins: [
        "module:fast-async",
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
