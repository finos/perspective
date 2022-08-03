const get_banner = ({globalName}) => ({
    js: `
    (function (root, factory) {
        if (typeof define === 'function' && define.amd) {
            define(['exports'], factory);
        } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
            factory(exports);
        } else {
            factory((root.${globalName} = {}));
        }
    }(typeof self !== 'undefined' ? self : this, function (exports) {
    `.trimStart(),
});

const get_footer = () => ({
    js: `
}));
`.trimStart(),
});

exports.UMDLoader = function UMDLoader() {
    function setup(build) {
        const options = build.initialOptions;
        if (options.globalName === undefined) {
            console.warn("Setting `globalName` to `perspective`");
            options.globalName = "perspective";
        }

        options.banner = get_banner(options);
        options.footer = get_footer(options);
        if (options.format !== "cjs" && options.format !== undefined) {
            console.warn("Setting options to `cjs` for `UMDLoader`");
            options.format = "cjs";
        }
    }

    return {
        name: "umd",
        setup,
    };
};
