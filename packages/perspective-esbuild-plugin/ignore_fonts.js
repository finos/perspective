exports.IgnoreFontsPlugin = function IgnoreFontsPlugin() {
    function setup(build) {
        build.onResolve({ filter: /^https:\/\// }, async (args) => {
            return { path: args.path, external: true, namespace: "skip-ttf" };
        });
    }

    return {
        name: "ignore_fonts",
        setup,
    };
};
