/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const siteConfig = {
    title: "Perspective" /* title for your website */,
    tagline: "Streaming Analytics via WebAssembly",
    url: "https://perspective.finos.org/" /* your website url */,
    cname: "perspective.finos.org",
    baseUrl: "/" /* base url for your project */,

    projectName: "perspective",
    organizationName: "finos",

    headerLinks: [
        {doc: "md/installation", label: "Docs"},
        // {doc: "obj/perspective-viewer-site", label: "API"},
        {blog: true, label: "Blog"},
        {href: "https://github.com/finos/perspective/", label: "GitHub"}
    ],

    headerIcon: "img/logo.png",
    // footerIcon: "img/perspective2.svg",
    favicon: "img/favicon.png",

    colors: {
        primaryColor: "#242526",
        secondaryColor: "#242526"
    },

    copyright: "Copyright © " + new Date().getFullYear() + " Perspective Authors",

    highlight: {
        theme: "atom-one-light"
    },

    scripts: [
        "https://buttons.github.io/buttons.js",
        "https://unpkg.com/@finos/perspective/dist/umd/perspective.js",
        "https://unpkg.com/@finos/perspective-viewer/dist/umd/perspective-viewer.js",
        "https://unpkg.com/@finos/perspective-viewer-datagrid/dist/umd/perspective-viewer-datagrid.js",
        "https://unpkg.com/@finos/perspective-viewer-d3fc/dist/umd/perspective-viewer-d3fc.js",
        "js/animation.js",
        "js/logo.js"
    ],

    stylesheets: [
        "https://fonts.googleapis.com/css?family=Material+Icons",
        "https://fonts.googleapis.com/css?family=Open+Sans",
        "https://fonts.googleapis.com/css?family=Public+Sans",
        "https://fonts.googleapis.com/css?family=Roboto+Mono",
        "https://fonts.googleapis.com/css?family=Source+Code+Pro:900&display=swap"
    ],

    onPageNav: "separate",

    ogImage: "img/perspective.png",
    twitterImage: "img/perspective.png"
};

module.exports = siteConfig;
