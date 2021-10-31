const path = require("path");
const cssnano = require("cssnano");
const TerserPlugin = require("terser-webpack-plugin");
const plugins = [];

function common({no_minify, inline} = {}) {
    return {
        mode:
            process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG || no_minify
                ? "development"
                : process.env.NODE_ENV || "production",
        plugins: plugins,
        module: {
            rules: [
                // {
                //     test: /\.js$/,
                //     enforce: "pre",
                //     use: ["source-map-loader"]
                // },
                {
                    test: /\.less$/,
                    exclude: /node_modules\/(?!regular-table)/,
                    use: [
                        {loader: require.resolve("css-loader")},
                        {
                            loader: require.resolve("postcss-loader"),
                            options: {
                                postcssOptions: {
                                    minimize: true,
                                    plugins: [
                                        cssnano({
                                            preset: "lite",
                                        }),
                                    ],
                                },
                            },
                        },
                        {loader: require.resolve("less-loader")},
                    ],
                },
                {
                    test: /\.(html)$/,
                    use: {
                        loader: require.resolve("html-loader"),
                        options: {},
                    },
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules\/(?!regular-table)/,
                    loader: require.resolve("source-map-loader"),
                },
                inline
                    ? undefined
                    : {
                          test: /\.js$/,
                          exclude: /node_modules/,
                          use: [
                              {
                                  loader: require.resolve(
                                      "string-replace-loader"
                                  ),
                                  options: {
                                      search: /webpackMode:\s*?"eager"/g,
                                      replace: "",
                                  },
                              },
                          ],
                      },
                {
                    test: /\.(arrow)$/,
                    type: "javascript/auto",
                    use: {
                        loader: require.resolve("arraybuffer-loader"),
                        options: {},
                    },
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: require.resolve("css-loader"),
                            options: {sourceMap: false},
                        },
                        {
                            loader: require.resolve("postcss-loader"),
                            options: {
                                sourceMap: false,
                                postcssOptions: {
                                    map: {annotation: false},
                                    minimize: true,
                                    plugins: [
                                        cssnano({
                                            preset: "lite",
                                            discardComments: {removeAll: true},
                                        }),
                                    ],
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.ttf$/,
                    type: "asset/resource",
                },
                inline
                    ? {
                          test: /\.wasm$/,
                          type: "javascript/auto",
                          loader: require.resolve("arraybuffer-loader"),
                      }
                    : {
                          test: /\.wasm$/,
                          type: "asset/resource",
                      },
                {
                    test: /perspective\.worker\.js$/,
                    type: "javascript/auto",
                    loader: require.resolve("worker-loader"),
                    options: {
                        inline: "no-fallback",
                    },
                },
                {
                    test: /editor\.worker/,
                    type: "javascript/auto",
                    loader: require.resolve("worker-loader"),
                    options: inline
                        ? {
                              inline: "no-fallback",
                          }
                        : {},
                },
            ].filter((x) => !!x),
        },
        resolve: {
            fallback: {
                crypto: false,
            },
        },
        devtool: "source-map",
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        output: {
                            ascii_only: true,
                        },
                    },
                }),
            ],
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000,
        },
        stats: {
            modules: false,
            hash: false,
            version: false,
            builtAt: false,
            entrypoints: false,
        },
    };
}

// Remove absolute paths from webpack source-maps

const ABS_PATH = path.resolve(__dirname, "..", "..", "..", "..");
const devtoolModuleFilenameTemplate = (info) =>
    `webpack:///${path.relative(ABS_PATH, info.absoluteResourcePath)}`;

module.exports = (options, f) => {
    let new_config = Object.assign({}, common(options));
    new_config = f(new_config);
    new_config.output.devtoolModuleFilenameTemplate =
        devtoolModuleFilenameTemplate;
    return new_config;
};
