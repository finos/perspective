import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss";
import sourcemaps from "rollup-plugin-sourcemaps";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import path from "path";

const PROJECT_PATH = path.resolve(__dirname, "..", "..");

export default () => {
    return [
        {
            input: "src/js/plugin.js",
            external: id => {
                let include = id.startsWith(".") || require.resolve(id).indexOf(PROJECT_PATH) === 0 || id.endsWith(".less");
                return !include;
            },
            output: {
                sourcemap: true,
                file: "dist/esm/perspective-viewer-datagrid.js"
            },
            plugins: [
                nodeResolve(),
                babel({
                    exclude: "node_modules/**",
                    babelHelpers: "bundled"
                }),
                filesize(),
                postcss({
                    inject: false,
                    sourceMap: false,
                    minimize: {preset: "lite"}
                }),
                sourcemaps()
            ].filter(x => x),
            watch: {
                clearScreen: false
            }
        }
    ];
};
