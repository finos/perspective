import babel from "@rollup/plugin-babel";
import {string} from "rollup-plugin-string";
import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss";
import sourcemaps from "rollup-plugin-sourcemaps";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import path from "path";
import fs from "fs";

const THEMES = fs.readdirSync(path.resolve(__dirname, "..", "themes"));
const PROJECT_PATH = path.resolve(__dirname, "..", "..");

export default () => {
    function reducer(key, val) {
        return {
            input: `${val}`,
            output: {
                dir: "dist/umd"
            },
            plugins: [
                postcss({
                    inject: false,
                    extract: path.resolve(`dist/umd/${key}.css`),
                    sourceMap: false,
                    minimize: false
                })
            ]
        };
    }

    return [
        ...THEMES.map(theme => reducer(theme.replace(".less", ""), path.resolve(__dirname, "..", "themes", theme))),
        {
            input: "src/js/viewer.js",
            external: id => {
                // `@finos/perspective-vieux` is inlined for now.  So we need to
                // bundle:
                // * Files in this package (starting with '.')
                // * Anything else in the package root ..
                //     * .. including the inlined `@finos/perspective-vieux` ..
                //         * .. but not its own `/pkg/`, because
                //           `@finos/perspective-vieux` itself does not.
                // * Vendor CSS that goes in the Shadow DOM
                let include = id.startsWith(".") || (require.resolve(id).indexOf(PROJECT_PATH) === 0 && require.resolve(id).indexOf("@finos/perspective-vieux/pkg/") === -1) || id.endsWith(".css");
                return !include;
            },
            output: {
                sourcemap: true,
                dir: "dist/esm/"
            },
            plugins: [
                nodeResolve(),
                babel({
                    exclude: "node_modules/**",
                    babelHelpers: "bundled"
                }),
                string({
                    include: "**/*.html"
                }),
                filesize(),
                postcss({
                    inject: false,
                    sourceMap: false,
                    minimize: false
                }),
                sourcemaps()
            ].filter(x => x),
            watch: {
                clearScreen: false
            }
        }
    ];
};
