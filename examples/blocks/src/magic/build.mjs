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
    if (fs.existsSync(`${__dirname}/all_identifiers.arrow`)) {
        return;
    }

    const buffer = JSON.parse(
        await download_json(`https://mtgjson.com/api/v5/AllIdentifiers.json`)
    );

    let { _schema, accessors } = inferSchema(
        buffer.data[Object.keys(buffer.data)[0]]
    );

    const schema = {
        name: "string",
        manaCost: "string",
        convertedManaCost: "float",
        types: "string",
        colorIdentity: "string",
        text: "string",
        keywords: "string",
        artist: "string",
        artistIds: "string",
        artistIds_0: "string",
        availability: "string",
        availability_0: "string",
        borderColor: "string",
        colorIdentity_0: "string",
        colors: "string",
        colors_0: "string",
        colors_1: "string",
        colors_2: "string",
        colors_3: "string",
        edhrecRank: "integer",
        edhrecSaltiness: "float",
        finishes: "string",
        finishes_0: "string",
        flavorText: "string",
        // "foreignData": "string",
        frameVersion: "string",
        keywords_0: "string",
        keywords_1: "string",
        keywords_2: "string",
        language: "string",
        layout: "string",
        manaValue: "integer",
        number: "string",
        power: "string",
        // printings: "string",
        // printings_0: "string",
        // printings_1: "string",
        promoTypes: "string",
        promoTypes_0: "string",
        promoTypes_1: "string",
        promoTypes_2: "string",
        rarity: "string",
        // rulings: "string",
        // rulings_0: "string",
        securityStamp: "string",
        setCode: "string",
        subtypes: "string",
        subtypes_0: "string",
        supertypes: "string",
        toughness: "string",
        type: "string",
        types_0: "string",
        types_1: "string",
        types_2: "string",
        uuid: "string",
        scryfallId: "string",
    };

    // schema["scryfallId"] = "string";
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
}

await main();
