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

/// Use this script to update the `requirements-*.txt` files in the
/// `python/perspective` directory. This only needs to be done when the actual
/// dependencies _or_ supported Python versions change - to update these deps
/// otherwise is to invite the wrath of the CI gods.

import * as fs from "fs";

import "zx/globals";

const VERSIONS = [
    // "3.7",
    "3.8",
    "3.9",
    "3.10",
    "3.11",
];

for (const version of VERSIONS) {
    $.sync`
        pip3 install "python/perspective[dev]"
        --dry-run
        --report=report.json
        --python-version=${version}
        --only-binary=:all:
        --platform=manylinux_2_12_x86_64
        --platform=manylinux_2_17_x86_64
        --ignore-installed
        --target=.
    `.runSync();

    const data = JSON.parse(fs.readFileSync("report.json"));
    let output = "";
    const sortedInstalls = data.install.toSorted((a, b) => {
        if (a.metadata.name < b.metadata.name) return -1;
        if (a.metadata.name > b.metadata.name) return 1;
        return 0;
    });

    for (const {
        metadata: { version, name },
    } of sortedInstalls) {
        if (name !== "perspective-python") {
            output += `${name}==${version}\n`;
        }
    }

    fs.writeFileSync(
        `python/perspective/requirements/requirements-${version.replace(
            ".",
            "",
        )}.txt`,
        output,
    );
}

fs.rmSync("report.json");
