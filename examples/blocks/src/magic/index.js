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

let DECKS = {};

async function createDeck(deck, library) {
    let fragments = [];
    let multis = [];
    for (let card of deck) {
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

async function getDeckTable(name, decks) {
    let main = DECKS["__mainLibrary"];
    if (DECKS[name] !== undefined) {
        return DECKS[name];
    }
    window.message.textContent = "Building deck...";
    let deck = await createDeck(decks[name], main);
    console.log("New Deck: ", deck);
    DECKS[name] = deck;
    window.message.textContent = "";
    return DECKS[name];
}

async function createMainTable() {
    window.message.textContent = "Downloading...";
    let url = "/dist/magic/all_identifiers.arrow";
    const res = await fetch(url);
    const b = await res.blob();
    const ab = await new Response(b).arrayBuffer();
    let t = await WORKER.table(ab);
    window.message.textContent = "";
    return t;
}

window.addEventListener("load", async () => {
    // either "deck" or "all".
    let main = createMainTable();
    let allLayout = await (await fetch("./all_layout.json")).json();
    let deckLayout = await (await fetch("./layout.json")).json();
    let decks = await (await fetch("./decks.json")).json();
    let names = Object.keys(decks);
    for (let name of names) {
        const opt = document.createElement("option");
        opt.value = opt.textContent = name;
        window.deck_selector.appendChild(opt);
    }

    const allCardsOption = document.createElement("option");
    allCardsOption.value = allCardsOption.textContent = "all";
    window.deck_selector.appendChild(allCardsOption);

    window.deck_selector.addEventListener("change", async () => {
        let which = window.deck_selector.value;
        let newTable;
        if (which === "all") {
            await window.workspace.restore(allLayout);
            newTable = DECKS["__mainLibrary"];
        } else {
            await window.workspace.restore(deckLayout);
            newTable = getDeckTable(window.deck_selector.value, decks);
        }
        window.workspace.tables.set("deck", newTable);
    });
    main = await main;
    DECKS["__mainLibrary"] = main;
    window.workspace.tables.set("deck", getDeckTable(names[0], decks));
    await window.workspace.restore(deckLayout);

    await window.workspace.restore(decks[names[0]]);
});
