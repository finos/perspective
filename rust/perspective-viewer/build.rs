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

use std::fs;
use std::io::BufReader;

use glob::glob;
use procss::BuildCss;

fn get_version_from_package() -> Option<String> {
    let file = fs::File::open("./package.json").ok()?;
    let reader = BufReader::new(file);
    let value: serde_json::Value = serde_json::from_reader(reader).ok()?;
    let version = value.as_object().unwrap().get("version")?.as_str()?;
    Some(version.to_owned())
}

fn with_wd<T>(indir: &str, f: impl FnOnce() -> T) -> T {
    let current_dir = std::env::current_dir().unwrap();
    std::env::set_current_dir(indir).unwrap();
    let res = f();
    std::env::set_current_dir(current_dir).unwrap();
    res
}

fn glob_with_wd(indir: &str, input: &str) -> Vec<String> {
    with_wd(indir, || {
        glob(input)
            .unwrap()
            .map(|x| x.unwrap().to_string_lossy().to_string())
            .collect()
    })
}

fn main() -> Result<(), anyhow::Error> {
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let out_path = std::path::Path::new(&out_dir);

    let mut build = BuildCss::new("./src/less");
    let files = glob_with_wd("./src/less", "**/*.less");
    for src in files.iter() {
        build.add_file(src);
    }

    build.compile()?.write(out_path.join("css"))?;
    let mut build = BuildCss::new("./src/themes");
    if !cfg!(feature = "define_custom_elements_async") {
        build.add_file("variables.less");
        build.add_file("icons.less");
        build.add_file("intl.less");
        build.add_file("pro.less");
        build.add_file("pro-dark.less");
        build.add_file("monokai.less");
        build.add_file("solarized.less");
        build.add_file("solarized-dark.less");
        build.add_file("vaporwave.less");
        build.add_file("gruvbox.less");
        build.add_file("gruvbox-dark.less");
        build.add_file("dracula.less");
        build.add_file("themes.less");
        build.add_file("intl/de.less");
        build.add_file("intl/es.less");
        build.add_file("intl/fr.less");
        build.add_file("intl/ja.less");
        build.add_file("intl/pt.less");
        build.add_file("intl/zh.less");
        build.compile()?.write("./target/themes")?;
    }

    println!(
        "cargo:rustc-env=PKG_VERSION={}",
        get_version_from_package().expect("Version not detected")
    );

    Ok(())
}
