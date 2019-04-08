module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                useBuiltIns: "usage",
                corejs: 2
            }
        ]
    ],
    sourceType: "unambiguous",
    plugins: [
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
