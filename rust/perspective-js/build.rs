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

#![feature(exit_status_error)]

use std::collections::HashSet;
use std::io::BufReader;
use std::path::Path;
use std::{fs, io};

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

fn get_version_from_package() -> Option<String> {
    let file = fs::File::open("./package.json").ok()?;
    let reader = BufReader::new(file);
    let value: serde_json::Value = serde_json::from_reader(reader).ok()?;
    let version = value.as_object().unwrap().get("version")?.as_str()?;
    Some(version.to_owned())
}

fn main() -> Result<(), anyhow::Error> {
    println!(
        "cargo:rustc-env=PKG_VERSION={}",
        get_version_from_package().expect("Version not detected")
    );

    if std::env::var("CARGO_FEATURE_EXTERNAL_CPP").is_ok() {
        println!("cargo:warning=MESSAGE Building in development mode");
        let root_dir_env = std::env::var("PSP_ROOT_DIR").expect("Must set PSP_ROOT_DIR");
        let root_dir = Path::new(root_dir_env.as_str());
        copy_dir_all(
            Path::join(root_dir, "rust/perspective-client/docs"),
            "docs",
            &HashSet::new(),
        )?;
    }

    Ok(())
}
