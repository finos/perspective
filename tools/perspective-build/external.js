exports.NodeModulesExternal = function NodeModulesExternal() {
    function setup(build) {
        build.onResolve({filter: /^[A-Za-z0-9\@]/}, (args) => {
            return {
                path: args.path,
                external: true,
                namespace: "skip-node-modules",
            };
        });
    }

    return {
        name: "node_modules_external",
        setup,
    };
};
