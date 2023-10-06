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

const LOCAL_EXAMPLES = [
    "editable",
    "file",
    "fractal",
    "market",
    "raycasting",
    "evictions",
    "streaming",
    "covid",
    "movies",
    "superstore",
    "citibike",
    "olympics",
];

exports.LOCAL_EXAMPLES = LOCAL_EXAMPLES;

exports.get_examples = function get_examples(
    root = "https://perspective.finos.org/",
) {
    const standalone = [
        {
            img: "https://perspective.finos.org/img/jupyterlab.png",
            url: "http://beta.mybinder.org/v2/gh/finos/perspective/master?urlpath=lab/tree/examples/jupyter-notebooks",
            name: "jupyterlab",
        },
        {
            img: "https://perspective.finos.org/img/mtg_preview.png",
            url: "https://texodus.github.io/mtg-perspective/?seasons-in-the-abyss-67",
            name: "magic",
        },
        {
            img: "https://raw.githubusercontent.com/sc1f/pudgy-penguin-perspective/pages/meta.png",
            url: "https://sc1f.github.io/pudgy-penguin-perspective/",
            name: "nft",
        },
        {
            img: "https://texodus.github.io/nypd-ccrb/preview.png",
            url: "https://texodus.github.io/nypd-ccrb/",
            name: "nypd ccrb",
        },
    ];

    const hashes = LOCAL_EXAMPLES.map((x) => ({
        img: `${root}blocks/${x}/preview.png`,
        url: `${root}block?example=${x}`,
        name: x,
    }));

    return hashes.concat(standalone);
};
