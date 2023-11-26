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

import migrate_0_0_0 from "./migrate/0-0-0";
import migrate_2_6_1 from "./migrate/2-6-1";

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
 * `perspective-workspace` format.
 * @param options a `PerspectiveConvertOptions` object specifying the convert
 * options for this call.
 * @returns a layout for either `<perspective-viewer>` or
 * `perspective-workspace`, updated to the perspective version of this
 * script's package.
 */
export function convert(
    old: Record<string, unknown> | ArrayBuffer | string,
    { warn = true, replace_defaults = false }: PerspectiveConvertOptions = {}
): Record<string, unknown> | ArrayBuffer | string {
    if (typeof old === "object" && !(old instanceof ArrayBuffer)) {
        const copy = JSON.parse(JSON.stringify(old));
        if ("viewers" in copy && "detail" in copy) {
            return migrate_workspace(copy, { warn, replace_defaults });
        } else {
            return migrate_viewer(copy, false, { warn, replace_defaults });
        }
    } else {
        return old;
    }
}

function* null_iter() {
    while (true) yield null;
}
export type Semver = {
    major: number;
    minor: number;
    patch: number;
    build?: {
        major: number;
        minor: number;
        patch: number;
    };
};
// This gets what the semver crate calls major, minor, patch, and build values, but does not capture release.
export function parse_semver(ver: string): Semver {
    let regex = /(\d+)\.(\d+)\.(\d+)(\+.+)?/;
    let [_ver, major, minor, patch, build_str] = ver.match(regex);
    let [_build, build_major, build_minor, build_patch] =
        build_str?.match(regex) ?? null_iter();
    let build =
        build_major && build_minor && build_patch
            ? {
                  major: Number(build_major),
                  minor: Number(build_minor),
                  patch: Number(build_patch),
              }
            : null;
    return {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
        build,
    };
}

/**
 * Checks if left > right
 * @param left
 * @param right_str
 * @returns
 */
export function cmp_semver(left: Semver, right_str: string) {
    let right = parse_semver(right_str);
    return (
        left.major > right.major ||
        (left.major === right.major && left.minor > right.minor) ||
        (left.major === right.major &&
            left.minor === right.minor &&
            left.patch > right.patch)
    );
}

type PerspectiveConvertOptions = {
    warn?: boolean;
    replace_defaults?: boolean;
};

/**
 * Migrate a layout for `<perspective-workspace>`
 * @param old
 * @param options
 * @returns
 */
function migrate_workspace(old, options) {
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
function migrate_viewer(old, omit_attributes, options) {
    old.version = old.version
        ? parse_semver(old.version)
        : parse_semver("0.0.0");
    options.omit_attributes = omit_attributes;
    return chain(
        old,
        [migrate_0_0_0, migrate_2_6_1, semver_to_string],
        options
    );
}

function semver_to_string(old) {
    // intentionally ignores build
    console.warn(old.version);
    old.version = `${old.version.major}.${old.version.minor}.${old.version.patch}`;
    return old;
}

/**
 * Chains functions of `args` and apply to `old`
 * @param old
 * @param args
 * @param options
 * @returns
 */
export function chain(old, args, options) {
    for (const arg of args) {
        old = arg(old, options);
    }

    return old;
}
