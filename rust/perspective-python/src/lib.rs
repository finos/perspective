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

#![doc = include_str!("../docs/lib.md")]
#![warn(unstable_features)]

mod client;
mod server;

pub use client::client_sync::{Client, ProxySession, Table, View};
use pyo3::prelude::*;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{fmt, EnvFilter};

macro_rules! inherit_docs {
    ($x:literal) => {
        include_str!(concat!(env!("PERSPECTIVE_CLIENT_DOCS_PATH"), $x))
    };
}

pub(crate) use inherit_docs;

/// Create a tracing filter which mimics the default behavior of reading from
/// env, customized to exclude timestamp.
/// [`tracing` filter docs](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/layer/index.html#per-layer-filtering)
fn init_tracing() {
    let fmt_layer = fmt::layer().without_time().with_target(true);
    let filter_layer = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new("info"))
        .unwrap();

    tracing_subscriber::registry()
        .with(filter_layer)
        .with(fmt_layer)
        .init();
}

/// A Python module implemented in Rust.
#[pymodule]
fn perspective(py: Python, m: &Bound<PyModule>) -> PyResult<()> {
    init_tracing();
    m.add_class::<client::client_sync::Client>()?;
    m.add_class::<server::PySyncServer>()?;
    m.add_class::<server::PySyncSession>()?;
    m.add_class::<client::client_sync::Table>()?;
    m.add_class::<client::client_sync::View>()?;
    m.add_class::<client::client_sync::ProxySession>()?;
    m.add(
        "PerspectiveError",
        py.get_type_bound::<client::PyPerspectiveError>(),
    )?;

    Ok(())
}
