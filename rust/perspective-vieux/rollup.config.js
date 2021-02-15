import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss";
import sourcemaps from "rollup-plugin-sourcemaps";
import path from "path";

export default () => {
    return [
        {
            input: `src/less/container.less`,
            output: {
                dir: "dist/css"
            },
            plugins: [
                postcss({
                    inject: false,
                    extract: path.resolve(`dist/css/container.css`),
                    minimize: {preset: "lite"}
                })
            ]
        },
        {
            input: "src/js/bootstrap.js",
            external: [/node_modules/, /pkg/],
            output: {
                sourcemap: true,
                dir: "dist/esm/"
            },
            plugins: [
                babel({
                    exclude: "node_modules/**",
                    babelHelpers: "bundled"
                }),
                filesize(),
                postcss({
                    inject: false,
                    sourceMap: true,
                    minimize: {mergeLonghand: false}
                }),
                sourcemaps()
            ].filter(x => x),
            watch: {
                clearScreen: false
            }
        }
    ];
};
