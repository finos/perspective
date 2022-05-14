const {lessLoader} = require("esbuild-plugin-less");
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

exports.InlineCSSPlugin = function InlineCSSPlugin() {
    function setup(build) {
        build.onResolve({filter: /\.less$/}, (args) => {
            if (args.path.startsWith(".")) {
                args.path = path.join(path.dirname(args.importer), args.path);
            }

            const outfile = `dist/umd/` + crypto.randomBytes(4).readUInt32LE(0);
            const subbuild = esbuild.build({
                entryPoints: [args.path],
                outfile,
                plugins: [lessLoader()],
                minify: !process.env.PSP_DEBUG,
                bundle: true,
            });

            return {path: args.path, pluginData: {outfile, subbuild}};
        });

        build.onLoad({filter: /\.less$/}, async (args) => {
            await args.pluginData.subbuild;
            contents = fs.readFileSync(args.pluginData.outfile, "utf8");
            fs.unlinkSync(args.pluginData.outfile);
            return {contents, loader: "text"};
        });
    }

    return {
        name: "inline_less",
        setup,
    };
};
