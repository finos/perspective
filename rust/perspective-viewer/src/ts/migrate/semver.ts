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

function* null_iter() {
    while (true) yield null;
}
export default class Semver {
    major: number;
    minor: number;
    patch: number;
    build?: {
        major: number;
        minor: number;
        patch: number;
    };

    constructor(ver: string | Semver) {
        if (typeof ver !== "string") {
            this.major = ver.major;
            this.minor = ver.minor;
            this.patch = ver.patch;
            this.build = ver.build;
            return this;
        }

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

        this.major = Number(major);
        this.minor = Number(minor);
        this.patch = Number(patch);
        this.build = build;
        return this;
    }

    gt(val: string | Semver) {
        let right = new Semver(val);
        return (
            this.major > right.major ||
            (this.major === right.major && this.minor > right.minor) ||
            (this.major === right.major &&
                this.minor === right.minor &&
                this.patch > right.patch)
        );
    }
    eq(val: string | Semver) {
        let right = new Semver(val);
        return (
            this.major === right.major &&
            this.minor == right.minor &&
            this.patch == right.patch
        );
    }

    ge(val: string | Semver) {
        let right = new Semver(val);
        return this.eq(right) || this.gt(right);
    }
}
