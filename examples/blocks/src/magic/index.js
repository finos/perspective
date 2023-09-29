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

import perspective from "/node_modules/@finos/perspective/dist/cdn/perspective.js";

const WORKER = perspective.worker();

async function createDeck(rawDeck, library) {
    let fragments = [];
    let multis = [];
    for (let card of rawDeck) {
        let frag = `("setCode" == '${card[0]}' and "number" == '${card[1]}')`;
        fragments.push(frag);
        if (card[2] !== 1) {
            multis.push([frag, card[2]]);
        }
    }
    let multiExpr = "";
    if (multis.length === 0) {
        multiExpr = "1";
    } else {
        let a = multis.map(([m, n]) => `else if ${m} {${n}}`);
        multiExpr = `// count\n\nif (false) { 0 }${a.join(" ")}else { 1 }`;
    }
    let expr = fragments.join(" or ");
    let view = await library.view({
        expressions: [expr, multiExpr],
        filter: [[expr, "==", true]],
    });
    let data = await view.to_json();
    view.delete();
    return WORKER.table(data);
}

async function ensureDeckTable(name, deckContents) {
    if (window.workspace.tables.has(name)) {
        return window.workspace.tables.get(name);
    } else {
        let library = window.workspace.tables.get("__mainLibrary");
        console.log("Making ", name);
        window.message.textContent = "Building deck...";
        let deck = await createDeck(deckContents[name], library);
        window.workspace.addTable(name, deck);
        window.message.textContent = "";
        console.log("Made ", name, await deck.num_rows());
        return deck;
    }
}

async function loadLibrary() {
    window.message.textContent = "Downloading all cards...";
    let url = "/dist/magic/all_identifiers.arrow";
    const res = await fetch(url);
    const b = await res.blob();
    const ab = await new Response(b).arrayBuffer();
    let t = await WORKER.table(ab);
    window.message.textContent = "";
    return t;
}

window.addEventListener("load", async () => {
    let main = loadLibrary();
    let allLayout = await fetch("./layout_all.json").then((d) => d.json());
    let baseDeckLayout = await fetch("./layout_deck.json").then((d) =>
        d.json()
    );
    let layouts = {
        __mainLibrary: allLayout,
    };
    let rawDecks = await fetch("./decks.json").then((d) => d.json());
    let deckNames = Object.keys(rawDecks);
    for (let name of deckNames) {
        const opt = document.createElement("option");
        opt.value = opt.textContent = name;
        window.deck_selector.appendChild(opt);
        let layout = structuredClone(baseDeckLayout);
        layout.viewers.card_grid.table = name;
        layout.viewers.mana_curve.table = name;
        layout.viewers.rank_heatmap.table = name;
        layouts[name] = layout;
    }
    const allCardsOption = document.createElement("option");
    allCardsOption.value = "__mainLibrary";
    allCardsOption.textContent = "Browse All Cards";
    window.deck_selector.appendChild(allCardsOption);

    window.deck_selector.addEventListener("change", async (event) => {
        let which = event.target.value;
        await ensureDeckTable(which, rawDecks);
        console.log(`Rendering '${which}'`, window.workspace.tables, layouts);
        // FIXME: The layout does not re-set to use the new table if we do not first
        //        go through the library layout.
        //        Seems if only the 'table' property is changed, nothing happens.
        await window.workspace.restore(layouts[which]);
    });
    const initialLayout = deckNames[0];
    window.workspace.tables.set("__mainLibrary", await main);
    let t = await ensureDeckTable(initialLayout, rawDecks);
    console.log("First render: ", layouts[initialLayout], t);
    window.workspace.tables.set(deckNames[0], t);
    await window.workspace.restore(layouts[initialLayout]);
});
