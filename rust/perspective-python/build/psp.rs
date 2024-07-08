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

// DO NOT EDIT THIS WITHOUT UPDATING rust/perspective-server/build/psp.rs

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::{fs, io};

use cmake::Config;

pub fn copy_dir_all(
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

pub fn cmake_build() -> Result<Option<PathBuf>, std::io::Error> {
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

    if matches!(std::env::var("DOCS_RS").as_deref(), Ok("1")) {
        return Ok(None);
    }

    let mut dst = Config::new("cpp/perspective");
    if cfg!(windows) && std::option_env!("CI").is_some() {
        std::fs::create_dir_all("D:\\psp-build")?;
        dst.out_dir("D:\\psp-build");
    }
    let profile = std::env::var("PROFILE").unwrap();
    dst.always_configure(true);
    dst.define("CMAKE_BUILD_TYPE", profile.as_str());
    if std::env::var("PSP_ARCH").as_deref() == Ok("x86_64") {
        dst.define("CMAKE_OSX_ARCHITECTURES", "x86_64");
    } else if std::env::var("PSP_ARCH").as_deref() == Ok("arm64") {
        dst.define("CMAKE_OSX_ARCHITECTURES", "arm64");
    }

    if std::env::var("TARGET")
        .unwrap_or_default()
        .contains("wasm32")
    {
        dst.define("PSP_WASM_BUILD", "1");
    } else {
        dst.define("PSP_WASM_BUILD", "0");
    }

    if cfg!(windows) {
        dst.define(
            "CMAKE_TOOLCHAIN_FILE",
            format!(
                "{}/scripts/buildsystems/vcpkg.cmake",
                std::env::var("VCPKG_ROOT").unwrap().replace("\\", "/")
            ),
        );
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

    if !cfg!(windows) {
        dst.build_arg(format!("-j{}", num_cpus::get()));
    }

    println!("cargo:warning=MESSAGE Building cmake {}", profile);
    let artifact_dir = dst.build();

    Ok(Some(artifact_dir))
}

pub fn cmake_link_deps(cmake_build_dir: &Path) -> Result<(), std::io::Error> {
    println!(
        "cargo:rustc-link-search=native={}/build",
        cmake_build_dir.display()
    );

    println!("cargo:rustc-link-lib=static=psp");
    link_cmake_static_archives(cmake_build_dir)?;
    println!("cargo:rerun-if-changed=cpp/perspective");
    Ok(())
}

pub fn install_docs() {
    if std::env::var("CARGO_FEATURE_EXTERNAL_CPP").is_ok() {
        println!("cargo:warning=MESSAGE Copying docs");
        let root_dir_env = std::env::var("PSP_ROOT_DIR").expect("Must set PSP_ROOT_DIR");
        let root_dir = Path::new(root_dir_env.as_str());
        copy_dir_all(
            Path::join(root_dir, "rust/perspective-client/docs"),
            "docs",
            &HashSet::new(),
        )
        .expect("Error installing docs");
    }
}

pub fn cxx_bridge_build() {
    println!("cargo:warning=MESSAGE Building cxx");
    let mut compiler = cxx_build::bridge("src/ffi.rs");
    compiler
        .file("src/server.cpp")
        .include("include")
        .include("cpp/perspective/src/include")
        .std("c++17");
    // .flag("-fexceptions") // TODO not needed?

    if cfg!(windows) {
        compiler.flag_if_supported("/c");
    } else {
        compiler.static_flag(true);
    }

    compiler.compile("perspective");

    println!("cargo:rerun-if-changed=include/server.h");
    println!("cargo:rerun-if-changed=src/server.cpp");
    println!("cargo:rerun-if-changed=src/lib.rs");
}

/// Walk the cmake output path and emit link instructions for all archives.
/// TODO Can this be faster pls?
pub fn link_cmake_static_archives(dir: &Path) -> Result<(), std::io::Error> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let path = entry?.path();
            if path.is_dir() {
                link_cmake_static_archives(&path)?;
            } else {
                let ext = path.extension().as_ref().map(|x| x.to_string_lossy());
                let stem = path.file_stem().as_ref().map(|x| x.to_string_lossy());
                let is_archive = (cfg!(windows)
                    && ext.as_deref() == Some("lib")
                    && stem.as_deref() != Some("perspective"))
                    || (!cfg!(windows) && ext.as_deref() == Some("a"));
                if is_archive {
                    let a = if cfg!(windows) {
                        stem.unwrap().to_string()
                    } else {
                        stem.expect("bad")[3..].to_string()
                    };

                    // println!("cargo:warning=MESSAGE static link {}", a);
                    println!("cargo:rustc-link-search=native={}", dir.display());
                    println!("cargo:rustc-link-lib=static={}", a);
                }
            }
        }
    }

    Ok(())
}
