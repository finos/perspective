////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

#![feature(lazy_cell)]

use std::env::args;
use std::io::Write;
use std::path::Path;
use std::process::{exit, Command};
use std::sync::LazyLock;

use flate2::write::GzEncoder;
use flate2::Compression;
use wasm_bindgen_cli_support::Bindgen;
use wasm_opt::OptimizationOptions;

static IS_RELEASE: LazyLock<bool> = LazyLock::new(|| args().any(|x| x == "--release"));

/// Run the packages `build` task with the appropriate flags. These can't be
/// defined in the `/.cargo/config.toml` because they would define this build
/// script's parameters also, and there is no way to reset e.g. the `target`
/// field to the host platform.
fn build() {
    let mut debug_flags = vec![];
    if *IS_RELEASE {
        debug_flags.push("--release");
    }

    Command::new("cargo")
        .env("RUSTFLAGS", "--cfg=web_sys_unstable_apis")
        .args(["build"])
        .args(["--target", "wasm32-unknown-unknown"])
        .args(["-Z", "build-std=std,panic_abort"])
        .args(["-Z", "build-std-features=panic_immediate_abort"])
        .args(debug_flags)
        .execute()
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
        OptimizationOptions::new_opt_level_4()
            .one_caller_inline_max_size(15)
            .run(outpath, outpath)
            .unwrap();
    }
}

/// Gzip the binary.
fn zip(outpath: &Path) {
    let input = std::fs::read(outpath).unwrap();
    let mut encoder = GzEncoder::new(Vec::new(), Compression::best());
    encoder.write_all(&input).unwrap();
    let encoded = encoder.finish().unwrap();
    std::fs::write(outpath, encoded).unwrap();
}

fn main() {
    let outdir = Path::new("dist/pkg");
    let artifact = "perspective";
    let outpath = &Path::new(outdir).join(format!("{}_bg.wasm", artifact));
    build();
    bindgen(outdir, artifact);
    opt(outpath);
    zip(outpath);
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
