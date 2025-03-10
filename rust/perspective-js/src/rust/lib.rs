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

#![warn(
    clippy::all,
    clippy::panic_in_result_fn,
    clippy::await_holding_refcell_ref,
    unstable_features
)]
#![allow(non_snake_case)]

extern crate alloc;

mod client;
mod table;
pub mod utils;
mod view;

#[cfg(feature = "export-init")]
use wasm_bindgen::prelude::*;

pub use crate::client::Client;
pub use crate::table::*;

#[cfg(feature = "export-init")]
#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND_CONTENT: &'static str = r#"
export type * from "../../src/ts/ts-rs/ViewWindow.d.ts";
export type * from "../../src/ts/ts-rs/TableInitOptions.d.ts";
export type * from "../../src/ts/ts-rs/ViewConfigUpdate.d.ts";
export type * from "../../src/ts/ts-rs/ViewOnUpdateResp.d.ts";
export type * from "../../src/ts/ts-rs/OnUpdateOptions.d.ts";
export type * from "../../src/ts/ts-rs/UpdateOptions.d.ts";

import type {ViewWindow} from "../../src/ts/ts-rs/ViewWindow.d.ts";
import type {TableInitOptions} from "../../src/ts/ts-rs/TableInitOptions.d.ts";
import type {ViewConfigUpdate} from "../../src/ts/ts-rs/ViewConfigUpdate.d.ts";
import type * as on_update_args from "../../src/ts/ts-rs/ViewOnUpdateResp.d.ts";
import type {OnUpdateOptions} from "../../src/ts/ts-rs/OnUpdateOptions.d.ts";
import type {UpdateOptions} from "../../src/ts/ts-rs/UpdateOptions.d.ts";
"#;

#[cfg(feature = "export-init")]
#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
    utils::set_global_logging();
}
