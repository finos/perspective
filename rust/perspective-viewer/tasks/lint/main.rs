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

use glob::glob;
pub fn main() {
    let mut args = std::env::args();
    args.next();
    let mut args = args.collect::<Vec<String>>();
    let mut check = false;
    if let Some((i, _)) = args.iter().enumerate().find(|(_i, val)| **val == "--check") {
        args.remove(i);
        check = true;
    }
    let check_args = if check {
        vec!["--check".into()]
    } else {
        vec![]
    };

    let mut paths = vec![];
    for arg in args {
        let glob = glob(&arg)
            .unwrap()
            .filter_map(Result::ok)
            .map(|buf| buf.to_string_lossy().to_string())
            .collect::<Vec<String>>();
        paths.push(glob);
    }
    let paths = paths.concat();
    let fmt_args = vec!["--edition".into(), "2021".into()];
    let fmt_args = [fmt_args, check_args, paths].concat();
    let exit_code = std::process::Command::new(env!("CARGO_BIN_FILE_YEW_FMT"))
        .args(fmt_args)
        .spawn()
        .expect("Could not spawn process")
        .wait()
        .expect("Process did not start");
    std::process::exit(exit_code.code().unwrap())
}
