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

import Semver from "./migrate/semver";
import migrate_0_0_0 from "./migrate/0-0-0";
import migrate_2_6_1 from "./migrate/2-6-1";
import migrate_2_7_1 from "./migrate/2-7-1";
import packageJSON from "@finos/perspective/package.json" assert { type: "json" };
import { PerspectiveViewerConfig } from "./viewer";

const PKG_VERSION = packageJSON.version;

/**
 * A migration utility for `@finos/perspective-viewer` and
 * `@finos/perspective-workspace` persisted state objects.  If you have an
 * application which persists tokens returned by the `.save()` method of a
 * Perspective Custom Element, and you want to upgrade Perspective to the latest
 * version, this module is for you!  You know who you are!
 *
 * Say you have a `<perspective-viewer>` Custom Element from
 * `@finos/perspective-viewer>=0.8.3`, and have persisted an arbitrary persistence
 * token object:
 *
 * ```javascript
 * const old_elem = document.querySelector("perspective-viewer");
 * const old_token = await old_elem.save();
 * ```
 *
 * To migrate this token to the version of `@finos/perspective-migrate` itself:
 *
 * ```javascript
 * import {convert} from "@finos/perspective-viewer`;
 *
 * // ...
 *
 * const new_elem = document.querySelector("perspective-viewer");
 * const new_token = convert(old_token);
 * await new_elem.restore(new_token);
 * ```
 *
 * `convert` can also be imported in node for converting persisted tokens
 * outside the browser.
 *
 * ```javascript
 * const {convert} = require("@finos/perspective-viewer/dist/cjs/migrate.js");
 * ```
 * @param old the layout to convert, in `<perspective-viewer>` or
 * `<perspective-workspace>` format.
 * @param options a `PerspectiveConvertOptions` object specifying the convert
 * options for this call.
 * @returns a layout for either `<perspective-viewer>` or
 * `<perspective-workspace>`, updated to the perspective version of this
 * script's package.
 */
export function convert(
    old: InitialConfig | ArrayBuffer | string,
    {
        warn = true,
        verbose = false,
        replace_defaults = false,
    }: PerspectiveConvertOptions = {}
): PerspectiveViewerConfig | ArrayBuffer | string {
    if (typeof old === "object" && !(old instanceof ArrayBuffer)) {
        const copy = JSON.parse(JSON.stringify(old));
        let options = {
            warn: verbose ? true : warn,
            verbose,
            replace_defaults,
        };
        if ("viewers" in copy && "detail" in copy) {
            return migrate_workspace(copy, options);
        } else {
            return migrate_viewer(copy, false, options);
        }
    } else {
        return old;
    }
}

type InitialConfig = Record<string, unknown>;

export type PerspectiveConvertOptions = {
    warn?: boolean;
    verbose?: boolean;
    replace_defaults?: boolean;
    omit_attributes?: boolean;
};

export type Options = PerspectiveConvertOptions & { version_chain?: string[] };

/**
 * Migrate a layout for `<perspective-workspace>`
 * @param old - TODO this should get a WorkspaceConfig type
 * @param options
 * @returns
 */
function migrate_workspace(old: any, options: Options) {
    for (const key in old.viewers) {
        old.viewers[key] = migrate_viewer(old.viewers[key], true, options);
        if (!("master" in old.viewers[key])) {
            old.viewers[key].master = false;
            if (options.warn) {
                console.warn(
                    `Deprecated perspective missing attribute "master" set to default`
                );
            }
        }

        if (!("linked" in old.viewers[key])) {
            old.viewers[key].linked = false;
            if (options.warn) {
                console.warn(
                    `Deprecated perspective missing attribute "linked" set to default`
                );
            }
        }
    }

    return old;
}

/**
 * Migrate a layout for `<perspective-viewer>`
 * @param old
 * @param options
 * @returns
 */
function migrate_viewer(old: any, omit_attributes: boolean, options: Options) {
    old.version = old.version ? new Semver(old.version) : new Semver("0.0.0");
    options.omit_attributes = omit_attributes;
    // This array details the "next version" in line. It begins with 2.6.1
    // and continues until the latest migration. Then, the current package
    // version is appended to the end, in case the latest migration
    // is older than the latest release. Each migration will shift the array.
    // Note that because we will be working with the latest version on master,
    // and those versions will need to update from themselves to themselves,
    // migration scripts must be idempotent.
    options.version_chain = ["2.6.1", "2.7.1"];
    options.version_chain.push(PKG_VERSION);
    let res = chain(
        old,
        [
            migrate_0_0_0,
            migrate_2_6_1,
            migrate_2_7_1,
            assure_latest,
            (old) => {
                return {
                    ...old,
                    version: old.version.to_string(),
                };
            },
        ],
        options
    );
    if (options.verbose) {
        console.log("Final result -> ", res);
    }
    return res;
}

function assure_latest(old: { version: Semver }) {
    if (old.version.gt(PKG_VERSION)) {
        throw new Error("Migrated version is newer than package version!");
    } else {
        old.version = new Semver(PKG_VERSION);
        return old;
    }
}

/**
 * Chains functions of `args` and apply to `old`
 * @param old
 * @param args
 * @param options
 * @returns
 */
export function chain(old: object, args: Function[], options: Options) {
    for (const arg of args) {
        old = arg(old, options);
    }

    return old;
}
