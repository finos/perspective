exports.ResolvePlugin = function ResolvePlugin(options) {
    return {
        name: "resolve",
        setup: (build) => {
            for (const moduleName of Object.keys(options)) {
                const moduleTarget = options[moduleName];
                const filter = new RegExp("^" + moduleName + "$");

                build.onResolve({ filter }, async (args) => {
                    if (args.resolveDir === "") {
                        return;
                    }

                    return {
                        path: args.path,
                        namespace: "resolve",
                        pluginData: {
                            resolveDir: args.resolveDir,
                            moduleName,
                        },
                    };
                });

                build.onLoad({ filter, namespace: "resolve" }, async (args) => {
                    const importerCode = `
                            export * from '${args.path.replace(
                                args.pluginData.moduleName,
                                moduleTarget
                            )}';
                            export { default } from '${args.path.replace(
                                args.pluginData.moduleName,
                                moduleTarget
                            )}';
                        `;
                    return {
                        contents: importerCode,
                        resolveDir: args.pluginData.resolveDir,
                    };
                });
            }
        },
    };
};
