const get_banner = (deps) => ({
    js: `
    define(
        ${JSON.stringify(deps)}, 
        function (...args) {
            const exports = {};
            const module = {exports};
            const define = undefined;
            const require = (x) => args[${JSON.stringify(deps)}.indexOf(x)];
        `.trimStart(),
});

const get_footer = () => ({
    js: `
    return exports;
});`,
});

exports.AMDLoader = function AMDLoader(deps) {
    function setup(build) {
        const options = build.initialOptions;
        if (deps === undefined) {
            console.warn("Setting `deps` to [`@jupyter-widgets/base`]");
            deps = [`@jupyter-widgets/base`];
        }

        options.banner = get_banner(deps);
        options.footer = get_footer();
        if (options.format !== "cjs" && options.format !== undefined) {
            console.warn("Setting options to `cjs` for `AMDLoader`");
            options.format = "cjs";
        }
    }

    return {
        name: "amd",
        setup,
    };
};
