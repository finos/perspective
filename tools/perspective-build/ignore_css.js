exports.IgnoreCSSPlugin = function IgnoreCSSPlugin() {
    function setup(build) {
        build.onResolve({filter: /\.css$/}, async (args) => {
            return {path: args.path, namespace: "skip-css"};
        });

        build.onLoad({filter: /.*/, namespace: "skip-css"}, async (args) => ({
            contents: "",
            loader: "text",
        }));
    }

    return {
        name: "ignore_fonts",
        setup,
    };
};
