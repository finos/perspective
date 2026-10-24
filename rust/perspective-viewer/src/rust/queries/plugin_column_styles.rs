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

use perspective_client::config::ViewConfig;
use perspective_js::utils::ApiResult;

use crate::config::ColumnConfigSchema;
use crate::renderer::Renderer;
use crate::session::Session;

/// Queries the active plugin for its plugin-scoped [`ColumnConfigSchema`] as
/// it applies to `current_value`.
pub fn get_plugin_config_schema(
    renderer: &Renderer,
    view_config: &ViewConfig,
    current_value: Option<&serde_json::Map<String, serde_json::Value>>,
) -> ApiResult<ColumnConfigSchema> {
    renderer.query_plugin_config_schema(view_config, current_value)
}

/// Queries the active plugin for the per-column [`ColumnConfigSchema`].
///
/// `current_value` is the column's existing flat JSON config (if any);
/// plugins use it to dynamically gate fields based on prior state.
pub fn get_column_config_schema(
    renderer: &Renderer,
    view_config: &ViewConfig,
    session: &Session,
    column_name: &str,
    current_value: Option<&serde_json::Map<String, serde_json::Value>>,
) -> ApiResult<ColumnConfigSchema> {
    renderer.query_column_config_schema_with(
        view_config,
        session,
        column_name,
        current_value,
        &renderer.get_plugin_config(),
    )
}
