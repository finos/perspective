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
    let mut build = BuildCss::new("./src/less");
    for src in glob_with_wd("./src/less", "**/*.less") {
        build.add(&src);
    }

    build.compile()?.write("./build/css")?;

    let mut build = BuildCss::new("./src/themes");
    build.add("variables.less");
    build.add("fonts.less");
    build.add("material.less");
    build.add("material-dark.less");
    build.add("monokai.less");
    build.add("solarized.less");
    build.add("solarized-dark.less");
    build.add("vaporwave.less");
    build.add("themes.less");
    build.compile()?.write("./dist/css")?;

    println!(
        "cargo:rustc-env=PKG_VERSION={}",
        get_version_from_package().expect("Version not detected")
    );

    Ok(())
}
