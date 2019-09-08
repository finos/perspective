module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    chrome: "57",
                    node: "8",
                    ios: "11",
                    safari: "11",
                    edge: "16",
                    firefox: "52"
                },
                modules: false,
                useBuiltIns: "usage",
                corejs: 2
            }
        ]
    ],
    sourceType: "unambiguous",
    plugins: ["lodash", ["@babel/plugin-proposal-decorators", {legacy: true}], "transform-custom-element-classes"]
};
