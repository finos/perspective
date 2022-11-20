const fs = require("fs");

exports.ReplacePlugin = function ReplacePlugin(regex, replacement) {
    function setup(build) {
        build.onLoad(
            { filter: /\@finos\/perspective.+?\.[tj]s$/, namespace: "file" },
            async (args) => {
                let contents = await fs.promises.readFile(args.path, "utf8");
                contents = contents.replace(regex, replacement);
                return {
                    contents,
                    loader: args.path.match(/tsx?$/) ? "ts" : "js",
                };
            }
        );
    }

    return {
        name: "replace_string",
        setup,
    };
};
