const pluginConfig = require("./d3fc.plugin.config");

const rules = []; //pluginConfig.module.rules.slice(0);
rules.push({
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "babel-loader",
    options: {
        presets: ["@babel/preset-env"]
    }
});

module.exports = Object.assign({}, pluginConfig, {
    entry: "./src/js/index.js",
    module: Object.assign({}, pluginConfig.module, {
        rules
    })
});
