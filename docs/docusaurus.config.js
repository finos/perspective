// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const fs = require("fs");

const examples = fs.readdirSync("static/blocks").map((ex) => {
    const files = fs
        .readdirSync(`static/blocks/${ex}`)
        .filter(
            (x) =>
                !x.startsWith(".") &&
                !x.endsWith(".png") &&
                !x.endsWith(".arrow")
        )
        .map((x) => {
            return {
                name: x,
                contents: fs
                    .readFileSync(`static/blocks/${ex}/${x}`)
                    .toString(),
            };
        });

    return {
        name: ex,
        files,
    };
});

function link(title, path) {
    return `<a class="dropdown__link" href="${path}">    ${title}</a>`;
}

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "Perspective",
    // tagline: "Dinosaurs are cool",
    url: "https://perspective.finos.org",
    baseUrl: "/",
    onBrokenLinks: "warn",
    onBrokenMarkdownLinks: "warn",
    favicon: "https://www.finos.org/hubfs/FINOS/finos-logo/favicon.ico",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "finos", // Usually your GitHub org/user name.
    projectName: "perspective", // Usually your repo name.
    trailingSlash: true,

    customFields: {
        examples,
    },
    // markdown: {
    //     format: "md",
    // },

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },
    plugins: ["./plugins/perspective-loader"],
    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: false,
                // docs: {
                //     //  sidebarPath: require.resolve("./sidebars.js"),
                //     docItemComponent: require.resolve(
                //         "./src/components/DocItem"
                //     ),
                //     // Please change this to your repo.
                //     // Remove this to remove the "edit this page" links.
                //     // editUrl:
                //     //     "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
                // },
                // blog: {
                //     showReadingTime: true,
                //     // Please change this to your repo.
                //     // Remove this to remove the "edit this page" links.
                //     editUrl:
                //         "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
                // },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            colorMode: {
                defaultMode: "dark",
            },
            navbar: {
                // title: "Perspective",
                logo: {
                    alt: "Perspective",
                    src: "svg/perspective-logo-light.svg",
                },
                items: [
                    {
                        type: "dropdown",
                        position: "right",
                        label: "Docs",
                        items: [
                            {
                                type: "html",
                                value: `<a class="dropdown__link" style="font-size:16px;padding:0.25rem 0rem" href="/guide/">User Guide</a>`,
                            },
                            {
                                type: "html",
                                value: '<span style="user-select:none">Python API</span>',
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="/python/"><code>perspective</code></a>`,
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="/python/perspective/widget.html"><code>perspective.widget</code></a>`,
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="/python/perspective/handlers/aiohttp.html"><code>perspective.handlers.aiohttp</code></a>`,
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="/python/perspective/handlers/starlette.html"><code>perspective.handlers.starlette</code></a>`,
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="/python/perspective/handlers/tornado.html"><code>perspective.handlers.tornado</code></a>`,
                            },
                            {
                                type: "html",
                                value: '<span style="user-select:none">JavaScript API</span>',
                            },
                            {
                                type: "html",
                                value: link(
                                    "<code>@finos/perspective-viewer</code>",
                                    "/viewer/modules/perspective-viewer.html"
                                ),
                            },
                            {
                                type: "html",
                                value: link(
                                    "<code>@finos/perspective</code> Browser",
                                    "/browser/modules/src_ts_perspective.browser.ts.html"
                                ),
                            },
                            {
                                type: "html",
                                value: link(
                                    "<code>@finos/perspective</code> Node.js",
                                    "/node/modules/src_ts_perspective.node.ts.html"
                                ),
                            },
                            {
                                type: "html",
                                value: '<span style="user-select:none">Rust API</span>',
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="https://docs.rs/perspective-js/latest/perspective_js/"><code>perspective-js</code></a>`,
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="https://docs.rs/perspective-python/latest/perspective_python/"><code>perspective-python</code></a>`,
                            },
                            {
                                type: "html",
                                value: `<a class="dropdown__link" href="https://docs.rs/perspective/latest/perspective/"><code>perspective</code></a>`,
                            },
                        ],
                    },
                    {
                        to: "/examples",
                        position: "right",
                        label: "Examples",
                    },
                    {
                        href: "https://prospective.co/blog",
                        label: "Blog",
                        position: "right",
                    },
                    {
                        href: "https://github.com/finos/perspective",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                links: [
                    // {
                    //     title: "Docs",
                    //     items: [
                    //         {
                    //             label: "JavaScript User Guide",
                    //             to: "/docs/js",
                    //         },
                    //         {
                    //             label: "Python User Guide",
                    //             to: "/docs/python",
                    //         },
                    //     ],
                    // },
                    // {
                    //     title: "More",
                    //     items: [
                    //         {
                    //             label: "GitHub",
                    //             href: "https://github.com/finos/perspective",
                    //         },
                    //         {
                    //             href: "https://www.prospective.co/blog",
                    //             label: "Blog",
                    //             position: "right",
                    //         },
                    //     ],
                    // },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} The Perspective Authors`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
