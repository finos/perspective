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

use std::collections::HashSet;
use std::path::Path;
use std::{fs, io};

use cmake::Config;

fn copy_dir_all(
    src: impl AsRef<Path>,
    dst: impl AsRef<Path>,
    skip: &HashSet<&str>,
) -> io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            if !skip.contains(&*entry.file_name().to_string_lossy()) {
                copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()), skip)?;
            }
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }

    Ok(())
}

fn cmake_build() -> Result<(), std::io::Error> {
    if std::env::var("CARGO_FEATURE_EXTERNAL_CPP").is_ok() {
        println!("cargo:warning=MESSAGE Building in development mode");
        let root_dir_env = std::env::var("PSP_ROOT_DIR").expect("Must set PSP_ROOT_DIR");
        let root_dir = Path::new(root_dir_env.as_str());
        copy_dir_all(Path::join(root_dir, "cpp"), "cpp", &HashSet::from(["dist"]))?;
        copy_dir_all(Path::join(root_dir, "cmake"), "cmake", &HashSet::new())?;
        println!(
            "cargo:rerun-if-changed={}/cpp/perspective",
            root_dir.display()
        );
    }

    let mut dst = Config::new("cpp/perspective");
    let profile = std::env::var("PROFILE").unwrap();
    dst.always_configure(true);
    dst.define("CMAKE_BUILD_TYPE", profile.as_str());

    if std::env::var("TARGET")
        .unwrap_or_default()
        .contains("wasm32")
    {
        dst.define("PSP_WASM_BUILD", "1");
    } else {
        dst.define("PSP_WASM_BUILD", "0");
    }
    if std::env::var("CARGO_FEATURE_PYTHON").is_ok() {
        dst.define("CMAKE_POSITION_INDEPENDENT_CODE", "ON");
        dst.define("PSP_PYTHON_BUILD", "1");
    }
    if std::env::var("CARGO_FEATURE_EXTERNAL_CPP").is_err() {
        dst.env("PSP_DISABLE_CLANGD", "1");
    }

    // WASM Exceptions don't work with the prebuilt Pyodide distribution.
    // It must be rebuilt with WASM exceptions enabled
    if std::env::var("CARGO_FEATURE_WASM_EXCEPTIONS").is_ok() {
        dst.define("PSP_WASM_EXCEPTIONS", "1");
    } else {
        dst.define("PSP_WASM_EXCEPTIONS", "0");
    }

    dst.build_arg(format!("-j{}", num_cpus::get()));
    println!("cargo:warning=MESSAGE Building cmake {}", profile);
    let artifact = dst.build();
    println!("cargo:warning=MESSAGE Building cxx");
    cxx_build::bridge("src/ffi.rs")
        .file("src/server.cpp")
        .include("include")
        .include("cpp/perspective/src/include")
        .flag_if_supported("-std=c++17") // TODO not needed?
        .flag("-fexceptions") // TODO not needed?
        .static_flag(true)
        .compile("perspective");

    println!(
        "cargo:rustc-link-search=native={}/build",
        artifact.display()
    );

    println!("cargo:rustc-link-lib=static=psp");
    link_cmake_static_archives(artifact.as_path())?;
    println!("cargo:rerun-if-changed=cpp/perspective");
    println!("cargo:rerun-if-changed=include/server.h");
    println!("cargo:rerun-if-changed=src/server.cpp");
    println!("cargo:rerun-if-changed=src/lib.rs");
    Ok(())
}

/// Walk the cmake output path and emit link instructions for all archives.
/// TODO Can this be faster pls?
fn link_cmake_static_archives(dir: &Path) -> Result<(), std::io::Error> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let path = entry?.path();
            if path.is_dir() {
                link_cmake_static_archives(&path)?;
            } else {
                let ext = path.extension().as_ref().map(|x| x.to_string_lossy());
                let stem = path.file_stem().as_ref().map(|x| x.to_string_lossy());
                if ext.as_deref() == Some("a")
                    && stem.as_deref() != Some("libpsp")
                    && stem.as_deref() != Some("libperspective")
                {
                    let a = stem.expect("bad")[3..].to_string();
                    println!("cargo:rustc-link-search=native={}", dir.display());
                    println!("cargo:rustc-link-lib=static={}", a);
                }
            }
        }
    }

    Ok(())
}

fn main() -> Result<(), std::io::Error> {
    cmake_build()
}
