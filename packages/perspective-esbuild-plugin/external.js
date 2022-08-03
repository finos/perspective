exports.NodeModulesExternal = function NodeModulesExternal(whitelist) {
    function setup(build) {
        build.onResolve({filter: /^[A-Za-z0-9\@]/}, (args) => {
            if (!whitelist || !args.path.startsWith(whitelist)) {
                return {
                    path: args.path,
                    external: true,
                    namespace: "skip-node-modules",
                };
            }
        });
    }

    return {
        name: "node_modules_external",
        setup,
    };
};
