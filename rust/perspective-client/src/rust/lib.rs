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
    clippy::await_holding_refcell_ref
)]

mod client;
mod session;
mod table;
mod table_data;
mod view;

pub mod config;

#[allow(unknown_lints)]
#[allow(clippy::all)]
mod proto;
pub mod utils;

pub use crate::client::{Client, ClientHandler, Features, SystemInfo};
pub use crate::proto::{ColumnType, SortOp, ViewOnUpdateResp};
pub use crate::session::{ProxySession, Session};
pub use crate::table::{
    Schema, Table, TableInitOptions, TableReadFormat, UpdateOptions, ValidateExpressionsData,
};
pub use crate::table_data::{TableData, UpdateData};
pub use crate::view::{OnUpdateMode, OnUpdateOptions, View, ViewWindow};

pub type ClientError = utils::ClientError;
pub type ExprValidationError = crate::proto::table_validate_expr_resp::ExprValidationError;

#[doc(hidden)]
pub mod vendor {
    pub use paste;
}

/// Assert that an implementation of domain language wrapper for [`Table`]
/// implements the expected API. As domain languages have different API needs,
/// a trait isn't useful for asserting that the entire API is implemented,
/// because the signatures will not match exactly (unless every method is
/// made heavily generic). Instead, this macro complains when a method name
/// is missing.
#[doc(hidden)]
#[macro_export]
macro_rules! assert_table_api {
    ($x:ty) => {
        $crate::vendor::paste::paste! {
            #[cfg(debug_assertions)]
            fn [< _assert_table_api_ $x:lower >]() {
                let _ = (
                    &$x::clear,
                    &$x::columns,
                    &$x::delete,
                    &$x::get_index,
                    &$x::get_limit,
                    &$x::get_client,
                    &$x::make_port,
                    &$x::on_delete,
                    &$x::remove_delete,
                    &$x::replace,
                    &$x::schema,
                    &$x::size,
                    &$x::update,
                    &$x::validate_expressions,
                    &$x::view,
                );
            }
        }
    };
}

/// Similar to [`assert_table_api`], but for [`View`]. See [`assert_table_api`].
#[doc(hidden)]
#[macro_export]
macro_rules! assert_view_api {
    ($x:ty) => {
        $crate::vendor::paste::paste! {
            #[cfg(debug_assertions)]
            fn [< _assert_table_api_ $x:lower >]() {
                let _ = (
                    &$x::column_paths,
                    &$x::delete,
                    &$x::dimensions,
                    &$x::expression_schema,
                    &$x::get_config,
                    &$x::get_min_max,
                    &$x::num_rows,
                  //  &$x::on_update,
                    &$x::remove_update,
                    &$x::on_delete,
                    &$x::remove_delete,
                    &$x::schema,
                    &$x::to_arrow,
                    &$x::to_columns_string,
                    &$x::to_json_string,
                    &$x::to_csv,
                );
            }
        }
    };
}
