exports.EmptyPlugin = function EmptyPlugin(options) {
    return {
        name: "empty",
        setup: (build) => {
            for (const moduleName of options) {
                const filter = new RegExp(moduleName);
                build.onResolve({ filter }, async (args) => {
                    if (args.resolveDir === "") {
                        return;
                    }

                    return {
                        path: args.path,
                        namespace: "empty",
                        pluginData: {
                            resolveDir: args.resolveDir,
                            moduleName,
                        },
                    };
                });

                build.onLoad({ filter, namespace: "empty" }, async (args) => {
                    return {
                        contents: "",
                        resolveDir: args.pluginData.resolveDir,
                    };
                });
            }
        },
    };
};
