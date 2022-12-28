// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// installed prism-react-renderer dependency
const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const fs = require("fs");

const  {init}  = require("blocks");

init();

const examples = fs.readdirSync("static/blocks").map((ex) => {
    const files = fs
        .readdirSync(`static/blocks/${ex}`)
        .filter((x) => !x.startsWith("."))
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

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },
    plugins: ["perspective-loader"],
    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    docItemComponent: require.resolve(
                        "./src/components/DocItem"
                    ),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    // editUrl:
                    //     "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
                },
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
                    src: "img/logo/logo-light.png",
                },
                items: [
                    // {to: "/blog", label: "News", position: "right"},
                    {
                        type: "doc",
                        docId: "js",
                        position: "right",
                        label: "Docs",
                    },
                    {
                        to: "/examples",
                        position: "right",
                        label: "Examples",
                    },
                    {
                        href: "https://github.com/finos/perspective",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                style: "dark",
                links: [
                    {
                        title: "Docs",
                        items: [
                            {
                                label: "Getting Started",
                                to: "/docs/js",
                            },
                        ],
                    },
                    {
                        title: "More",
                        items: [
                            {
                                label: "GitHub",
                                href: "https://github.com/finos/perspective",
                            },
                            {
                                label: "FINOS",
                                to: "https://finos.org",
                            },
                        ],
                    },
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
