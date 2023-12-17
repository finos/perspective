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

#![feature(lazy_cell)]

use std::env::args;
use std::path::Path;
use std::process::{exit, Command};
use std::sync::LazyLock;

use wasm_bindgen_cli_support::Bindgen;
use wasm_opt::OptimizationOptions;

static IS_RELEASE: LazyLock<bool> = LazyLock::new(|| args().any(|x| x == "--release"));

/// Run the packages `build` task with the appropriate flags. These can't be
/// defined in the `/.cargo/config.toml` because they would define this build
/// script's parameters also, and there is no way to reset e.g. the `target`
/// field to the host platform.
fn build(pkg: Option<&str>) {
    let mut debug_flags = vec![];
    if *IS_RELEASE {
        debug_flags.push("--release");
    }

    let mut cmd = Command::new("cargo");

    cmd.env("RUSTFLAGS", "--cfg=web_sys_unstable_apis")
        .args(["build"])
        .args(["--features", "tracing/release_max_level_error"])
        .args(["--target", "wasm32-unknown-unknown"])
        .args(["-Z", "build-std=std,panic_abort"])
        .args(["-Z", "build-std-features=panic_immediate_abort"])
        .args(debug_flags);

    if let Some(pkg) = pkg {
        cmd.args(["-p", pkg]);
    }

    cmd.execute()
}

/// Generate the `wasm-bindgen` JavaScript and WASM bindings.
fn bindgen(outdir: &Path, artifact: &str) {
    let input = Path::new("target/wasm32-unknown-unknown")
        .join(if *IS_RELEASE { "release" } else { "debug" })
        .join(format!("{}.wasm", artifact));

    Bindgen::new()
        .web(true)
        .unwrap()
        .input_path(input)
        .typescript(true)
        .generate(outdir)
        .unwrap();
}

/// Run `wasm-opt` and output the new binary on top of the old one.
fn opt(outpath: &Path) {
    if *IS_RELEASE {
        OptimizationOptions::new_optimize_for_size()
            .one_caller_inline_max_size(15)
            .run(outpath, outpath)
            .unwrap();
    }

    Command::new("cargo")
        .args(["run"])
        .args(["-p", "perspective-bootstrap"])
        .args(["--"])
        .args(["dist/pkg/perspective_bg.wasm"])
        .execute();
}

fn main() {
    let outdir = Path::new("dist/pkg");
    let artifact = "perspective";
    let outpath = &Path::new(outdir).join(format!("{}_bg.wasm", artifact));
    build(None);
    bindgen(outdir, artifact);
    opt(outpath);
}

trait SimpleCommand {
    fn execute(&mut self);
}

impl SimpleCommand for Command {
    fn execute(&mut self) {
        match self.status().ok().and_then(|x| x.code()) {
            Some(0) => (),
            Some(x) => exit(x),
            None => exit(1),
        }
    }
}
