const {NodeModulesExternal} = require("@finos/perspective-build/external");
const {InlineCSSPlugin} = require("@finos/perspective-build/inline_css");
const {UMDLoader} = require("@finos/perspective-build/umd");
const {build} = require("@finos/perspective-build/build");

const BUILD = [
    {
        entryPoints: ["src/js/plugin/plugin.js"],
        plugins: [InlineCSSPlugin(), NodeModulesExternal()],
        format: "esm",
        outfile: "dist/esm/perspective-viewer-openlayers.js",
    },
    {
        entryPoints: ["src/js/plugin/plugin.js"],
        globalName: "perspective_openlayers",
        plugins: [InlineCSSPlugin(), UMDLoader()],
        format: "cjs",
        outfile: "dist/umd/perspective-viewer-openlayers.js",
    },
    {
        entryPoints: ["src/js/plugin/plugin.js"],
        plugins: [InlineCSSPlugin()],
        format: "esm",
        outfile: "dist/cdn/perspective-viewer-openlayers.js",
    },
];

async function build_all() {
    await Promise.all(BUILD.map(build)).catch(() => process.exit(1));
}

build_all();
