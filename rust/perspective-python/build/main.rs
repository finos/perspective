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

use std::error::Error;
use std::fs;
use std::path::PathBuf;

mod psp;

fn main() -> Result<(), Box<dyn Error>> {
    pyo3_build_config::add_extension_module_link_args();
    // Pass the `perspective_client` links metadata flag so that the `inherit_docs`
    // macro can find the path to the docs.
    println!(
        "cargo:rustc-env=PERSPECTIVE_CLIENT_DOCS_PATH={}",
        std::env::var("DEP_PERSPECTIVE_CLIENT_DOCS_PATH").unwrap()
    );

    let manifest_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR")?);
    if std::env::var("CARGO_FEATURE_EXTERNAL_CPP").is_ok() {
        println!("cargo:warning=MESSAGE Building in development mode");
        for entry in fs::read_dir(manifest_dir.join("perspective"))? {
            let entry = entry?;
            if entry.file_name().to_string_lossy().ends_with("libpsp.so") {
                fs::remove_file(entry.path())?;
            }
        }
    }

    std::env::set_var("CARGO_FEATURE_PYTHON", "1"); // Not a relevant feature for this crate, but required for consistency
    if let Some(artifact_dir) = psp::cmake_build()? {
        let source_name = match std::env::var("CARGO_CFG_TARGET_OS")?
            .to_lowercase()
            .as_str()
        {
            "emscripten" => "psppy.wasm".to_string(),
            "windows" => "libpsp.dll".to_string(),
            _ => "libpsp.so".to_string(),
        };

        let ext = if cfg!(target_os = "windows") {
            "dll"
        } else {
            "so"
        };

        let system = match std::env::var("CARGO_CFG_TARGET_OS")?.as_str() {
            "macos" => "darwin".to_string(),
            other => other.to_string(),
        };

        let machine = match std::env::var("CARGO_CFG_TARGET_ARCH")?.as_str() {
            "aarch64" => "arm64".to_string(),
            other => other.to_string(),
        };

        let dylib_name = format!("{}-{}-libpsp.{}", system, machine, ext);
        let libpath = match std::env::var("CARGO_CFG_TARGET_OS")?.as_str() {
            "windows" => artifact_dir
                .join("build")
                .join("MinSizeRel")
                .join(&source_name),
            _ => artifact_dir.join("build").join(&source_name),
        };

        let out = manifest_dir.join("perspective").join(dylib_name);
        println!("cargo:rerun-if-changed={}", out.to_string_lossy());
        std::fs::copy(libpath, out).expect("Could not copy dylib to perspective/");
    }

    Ok(())
}
