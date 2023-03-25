const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const {
    PerspectiveEsbuildPlugin,
} = require("@finos/perspective-esbuild-plugin");

async function build() {
    await esbuild.build({
        entryPoints: ["client/index.js"],
        plugins: [PerspectiveEsbuildPlugin()],
        outdir: "dist",
        format: "esm",
        bundle: true,
        target: "es2020",
        loader: {
            ".ttf": "file",
            ".arrow": "file",
        },
        assetNames: "[name]",
    });

    fs.writeFileSync(
        path.join(__dirname, "dist/index.html"),
        fs.readFileSync(path.join(__dirname, "client/index.html")).toString()
    );
}

build();
