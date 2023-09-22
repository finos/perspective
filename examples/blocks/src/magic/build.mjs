/******************************************************************************
 *
 * Copyright (c) 2021, the `mtg-perspective` Authors.
 *
 * This file is part of the `mtg-perspective` library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from "@finos/perspective";

import * as fs from "fs";
import * as https from "https";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const ARRAY_SIZE_HINTS = {
    colors: 4,
    keywords: 3,
    types: 3,
};

function inferSchema(card) {
    const schema = {
        name: undefined,
        manaCost: undefined,
        convertedManaCost: undefined,
        types: undefined,
        colorIdentity: undefined,
        keywords: undefined,
    };
    const accessors = {};
    for (const field of Object.keys(card)) {
        const value = card[field];
        if (typeof value === "string") {
            schema[field] = "string";
            accessors[field] = (card) => card[field] || "-";
        } else if (typeof value === "number") {
            schema[field] = "integer";
            accessors[field] = (card) => card[field] || null;
        } else if (Array.isArray(value)) {
            schema[field] = "string";
            accessors[field] = (card) => (card[field] || ["-"]).join(",");
            for (
                let i = 0;
                i < (ARRAY_SIZE_HINTS[field] || value.length);
                i++
            ) {
                let frozen_i = i;
                schema[`${field}_${i}`] = "string";
                accessors[`${field}_${i}`] = (card) =>
                    card[field] ? card[field][frozen_i] || "-" : "-";
            }
        } else {
            console.warn(
                `Dropping column "${field}" from ${JSON.stringify(card[field])}`
            );
        }
    }
    return { schema, accessors };
}

function download_json(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (resp) => {
                let data = "";
                resp.on("data", (chunk) => {
                    data += chunk;
                });
                resp.on("end", () => {
                    resolve(data);
                });
            })
            .on("error", reject);
    });
}

async function main() {
    if (!fs.existsSync(`${__dirname}/AllIdentifiers.json`)) {
        const json = await download_json(
            `https://mtgjson.com/api/v5/AllIdentifiers.json`
        );

        fs.writeFileSync(`${__dirname}/AllIdentifiers.json`, json);
    }

    const buffer = JSON.parse(
        fs.readFileSync(`${__dirname}/AllIdentifiers.json`)
    );
    let { schema, accessors } = inferSchema(
        buffer.data[Object.keys(buffer.data)[0]]
    );

    schema["scryfallId"] = "string";
    accessors["scryfallId"] = (card) => card.identifiers.scryfallId;

    const table = await perspective.table(schema, { index: "uuid" });

    let rows = [];
    for (const uuid of Object.keys(buffer.data)) {
        const card = buffer.data[uuid];
        const row = {};
        for (const field of Object.keys(schema)) {
            try {
                row[field] = accessors[field](card);
            } catch (e) {
                console.error(field);
                throw e;
            }
        }
        rows.push(row);
        if (rows.length > 100) {
            table.update(rows);
            rows = [];
        }
    }

    table.update(rows);
    const arrow = await (await table.view()).to_arrow();
    fs.writeFileSync(
        `${__dirname}/all_identifiers.arrow`,
        Buffer.from(arrow),
        "binary"
    );

    // schema = {
    //     name: "string",
    //     count: "integer",
    //     manaCost: "string",
    //     convertedManaCost: "integer",
    //     types: "string",
    //     colorIdentity: "string",
    //     keywords: "string",
    //     group: "string",
    //     ...schema,
    // };

    // const deck_table = await perspective.table(schema);
    // const arrow2 = await (await deck_table.view()).to_arrow();
    // fs.writeFileSync("./data/deck.arrow", Buffer.from(arrow2), "binary");

    // if (!fs.existsSync("data/symbology.json")) {
    //     const json = await download_json(`https://api.scryfall.com/symbology`);
    //     fs.writeFileSync("data/symbology.json", json);
    // }

    // const json2 = require("../data/symbology.json");
    // const symbology = await perspective.table(json2.data, { index: "symbol" });
    // const arrow3 = await (await symbology.view()).to_arrow();
    // fs.writeFileSync("./data/symbology.arrow", Buffer.from(arrow3), "binary");
}

await main();
