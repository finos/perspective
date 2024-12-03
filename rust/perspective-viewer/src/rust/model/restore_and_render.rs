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

use futures::Future;

use super::structural::*;
use crate::config::{OptionalUpdate, ViewerConfigUpdate};
use crate::utils::*;
use crate::*;

pub trait RestoreAndRender: HasRenderer + HasSession + HasPresentation {
    /// Apply a `ViewConfigUpdate` to the current `View` and render.
    fn restore_and_render(
        &self,
        ViewerConfigUpdate {
            plugin,
            plugin_config,
            columns_config,
            settings,
            theme: theme_name,
            title,
            mut view_config,
            ..
        }: crate::config::ViewerConfigUpdate,
        task: impl Future<Output = Result<(), ApiError>> + 'static,
    ) -> ApiFuture<()> {
        clone!(self.session(), self.renderer(), self.presentation());
        ApiFuture::new(async move {
            if !session.has_table() {
                if let OptionalUpdate::Update(x) = settings {
                    presentation.set_settings_attribute(x);
                }
            }

            if let OptionalUpdate::Update(title) = title {
                presentation.set_title(Some(title));
            } else if matches!(title, OptionalUpdate::SetDefault) {
                presentation.set_title(None);
            }

            let needs_restyle = match theme_name {
                OptionalUpdate::SetDefault => {
                    let current_name = presentation.get_selected_theme_name().await;
                    if current_name.is_some() {
                        presentation.set_theme_name(None).await?;
                        true
                    } else {
                        false
                    }
                },
                OptionalUpdate::Update(x) => {
                    let current_name = presentation.get_selected_theme_name().await;
                    if current_name.is_some() && current_name.as_ref().unwrap() != &x {
                        presentation.set_theme_name(Some(&x)).await?;
                        true
                    } else {
                        false
                    }
                },
                _ => false,
            };

            let plugin_changed = renderer.update_plugin(&plugin)?;
            if plugin_changed {
                session.set_update_column_defaults(&mut view_config, &renderer.metadata());
            }

            session.update_view_config(view_config);
            let draw_task = renderer.draw(async {
                task.await?;
                let plugin = renderer.get_active_plugin()?;
                let plugin_update = if let Some(x) = plugin_config {
                    wasm_bindgen::JsValue::from_serde_ext(&*x).unwrap()
                } else {
                    plugin.save()?
                };

                presentation.update_columns_configs(columns_config);
                let columns_config = presentation.all_columns_configs();
                plugin.restore(&plugin_update, Some(&columns_config))?;
                session.validate().await?.create_view().await
            });

            draw_task.await?;

            // TODO this should be part of the API for `draw()` above, such that
            // the plugin need not render twice when a theme is provided.
            if needs_restyle {
                let view = session.get_view().into_apierror()?;
                renderer.restyle_all(&view).await?;
            }

            Ok(())
        })
    }
}

impl<T: HasRenderer + HasSession + HasPresentation> RestoreAndRender for T {}
