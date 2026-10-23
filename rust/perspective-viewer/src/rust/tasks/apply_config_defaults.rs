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

use futures::FutureExt;
use perspective_client::clone;
use perspective_js::utils::*;
use wasm_bindgen::JsValue;

use crate::renderer::{CONFIG_DEFAULTS, Renderer};
use crate::session::{EditDelta, OpKind, Session};
use crate::utils::{AddListener, Subscription};

/// Re-deliver this panel's plugin config whenever the page-wide config defaults
/// change.
pub(crate) fn wire_config_defaults_sub(session: &Session, renderer: &Renderer) -> Subscription {
    CONFIG_DEFAULTS.with(|defaults| {
        defaults.changed.add_listener({
            clone!(session, renderer);
            move |_| apply_config_defaults(&session, &renderer)
        })
    })
}

fn apply_config_defaults(session: &Session, renderer: &Renderer) {
    let kind = OpKind::Edit {
        delta: EditDelta::Renderer,
        swaps_plugin: false,
    };

    let ticket = session.submit(kind, {
        clone!(session, renderer);
        move |_ctx| {
            Box::pin(async move {
                Ok(Some(
                    async move {
                        if renderer.active_plugin().is_some() && session.get_view().is_some() {
                            deliver_config_defaults(&session, &renderer).await?;
                        }

                        renderer.config_defaults_changed.emit(());
                        Ok(())
                    }
                    .boxed_local(),
                ))
            })
        }
    });

    ApiFuture::spawn(ticket.settle());
}

async fn deliver_config_defaults(session: &Session, renderer: &Renderer) -> ApiResult<()> {
    let view_config = session.committed_view_config().clone();
    let plugin_token = JsValue::from_serde_ext(&renderer.plugin_config_materialized(&view_config))?;

    let columns_configs = renderer
        .all_columns_configs_materialized(&view_config, session)
        .await;

    renderer
        .ensure_plugin_selected()?
        .restore(&plugin_token, Some(&columns_configs))?;

    if renderer.is_plugin_hidden() {
        renderer.set_data_stale();
        return Ok(());
    }

    clone!(session);
    renderer
        .update_lazy(async move { Ok(session.get_view_with_dimensions()) })
        .await?;

    Ok(())
}
