import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss";
import sourcemaps from "rollup-plugin-sourcemaps";
import typescript from "@rollup/plugin-typescript";
import path from "path";
import fs from "fs";

export default function (options) {
    if (options["config-inline-css"]) {
        return [
            ...[
                "viewer",
                "column-style",
                "filter-dropdown",
                "expression-editor",
            ].map(create_inline_css),
        ];
    } else {
        return [
            ...["index", "monaco"].map(create_bundle),
            ...THEMES.map(create_theme),
        ];
    }
}

const THEMES = fs.readdirSync(path.resolve(__dirname, "src", "themes"));

function create_inline_css(name) {
    return {
        input: `src/less/${name}.less`,
        output: {
            dir: "dist/css",
        },
        plugins: [
            postcss({
                inject: false,
                extract: path.resolve(`dist/css/${name}.css`),
                minimize: {preset: "lite"},
            }),
        ],
    };
}

function create_bundle(name) {
    return {
        input: `src/ts/${name}.ts`,
        external: [/pkg/, /node_modules/, /monaco\-editor/, /^[a-zA-Z\@]/],
        output: {
            sourcemap: true,
            dir: "dist/esm/",
        },
        plugins: [
            typescript({tsconfig: "./tsconfig.json"}),
            filesize(),
            postcss({
                inject: false,
                sourceMap: true,
                minimize: {mergeLonghand: false},
            }),
            sourcemaps(),
        ],
        watch: {
            clearScreen: false,
        },
    };
}

function create_theme(theme) {
    const key = theme.replace(".less", "");
    const val = path.resolve(__dirname, "src", "themes", theme);
    return {
        input: `${val}`,
        output: {
            dir: "dist/umd",
        },
        plugins: [
            {
                name: "remove-js-after-hook",
                resolveId(source) {
                    return null;
                },
                buildEnd: () => {
                    fs.rm(
                        path.resolve(__dirname, "dist", "css", `${key}.js`),
                        () => {}
                    );
                },
                load(id) {
                    return null;
                },
            },
            postcss({
                inject: false,
                extract: path.resolve(`dist/umd/${key}.css`),
                sourceMap: false,
                minimize: false,
            }),
        ],
    };
}
