module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    chrome: "74",
                    node: "15",
                    ios: "13",
                },
                modules: false,
            },
        ],
    ],
    sourceType: "unambiguous",
};
