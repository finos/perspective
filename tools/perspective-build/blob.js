const fs = require("fs");

exports.BlobPlugin = function BlobPlugin() {
    function setup(build) {
        build.onResolve(
            {filter: /perspective\.cpp(\.worker)?\.js$/},
            (args) => {
                return {
                    path: args.path,
                    namespace: "blob-inline",
                };
            }
        );

        build.onLoad({filter: /.*/, namespace: "blob-inline"}, async (args) => {
            const path = require.resolve(args.path);
            const contents = await fs.promises.readFile(path);
            return {
                contents: `
                    export default ${JSON.stringify(contents.toString())};
                `,
            };
        });
    }

    return {
        name: "blob",
        setup,
    };
};
