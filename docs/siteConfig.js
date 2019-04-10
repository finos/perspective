/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const siteConfig = {
    title: "Perspective" /* title for your website */,
    tagline: "Streaming Analytics via WebAssembly",
    url: "https://jpmorganchase.github.io/" /* your website url */,
    baseUrl: "/perspective/" /* base url for your project */,

    projectName: "perspective",
    organizationName: "jpmorganchase",

    headerLinks: [
        {doc: "md/installation", label: "Docs"},
        {doc: "obj/perspective-viewer", label: "API"},
        {blog: true, label: "Blog"},
        {href: "https://github.com/jpmorganchase/perspective/", label: "GitHub"}
    ],

    headerIcon: "img/perspective2.svg",
    footerIcon: "img/perspective2.svg",
    favicon: "img/favicon.png",

    colors: {
        primaryColor: "#242526",
        secondaryColor: "#1A7DA1"
    },

    copyright: "Copyright © " + new Date().getFullYear() + " Perspective Authors",

    highlight: {
        theme: "monokai"
    },

    scripts: [
        "https://buttons.github.io/buttons.js",
        "https://unpkg.com/@jpmorganchase/perspective/build/perspective.js",
        "https://unpkg.com/@jpmorganchase/perspective-viewer/build/perspective.view.js",
        "https://unpkg.com/@jpmorganchase/perspective-viewer-hypergrid/build/hypergrid.plugin.js",
        "https://unpkg.com/@jpmorganchase/perspective-viewer-highcharts/build/highcharts.plugin.js",
        "js/animation.js"
    ],

    stylesheets: [
        "https://fonts.googleapis.com/css?family=Montserrat:300",
        "https://fonts.googleapis.com/css?family=Material+Icons",
        "https://fonts.googleapis.com/css?family=Open+Sans",
        "https://fonts.googleapis.com/css?family=Roboto+Mono",
        "css/material.dark.css"
    ],

    onPageNav: "separate",

    ogImage: "img/perspective.png",
    twitterImage: "img/perspective.png"
};

module.exports = siteConfig;
