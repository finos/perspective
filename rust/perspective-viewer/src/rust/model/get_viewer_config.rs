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

use super::columns_iter_set::*;
use super::structural::*;
use crate::config::*;
use crate::presentation::Presentation;
use crate::renderer::*;
use crate::session::*;
use crate::*;

/// A `ViewerConfig` is constructed from various properties acrosss the
/// application state
///
/// For example, the current `Plugin`, `ViewConfig`, and `Theme`.
/// `GetViewerConfigModel` provides methods which should be used to get the
/// applications `ViewerConfig` from across these state objects.
pub trait GetViewerConfigModel: HasSession + HasRenderer + HasPresentation {
    /// As these methods are asynchronous, it is commonly useful to be able to
    /// discretely `.clone()` the state objects for dispatching to `async`.
    ///
    /// Calling `.cloned()` yields just the state object clones of
    /// `GetViewerConfigModel` which itself implements this trait and other
    /// `crate::model` traits.
    fn cloned(&self) -> GetViewerConfigModelCloned {
        GetViewerConfigModelCloned {
            renderer: self.renderer().clone(),
            session: self.session().clone(),
            presentation: self.presentation().clone(),
        }
    }

    /// Get the current ViewerConfig
    #[allow(async_fn_in_trait)]
    async fn get_viewer_config(&self) -> ApiResult<ViewerConfig> {
        let version = config::API_VERSION.to_string();
        let view_config = self.session().get_view_config().clone();
        let js_plugin = self.renderer().get_active_plugin()?;
        let settings = self.presentation().is_settings_open();
        let plugin = js_plugin.name();
        let plugin_config: serde_json::Value = js_plugin.save()?.into_serde_ext()?;
        let theme = self.presentation().get_selected_theme_name().await;
        let title = self.presentation().get_title();
        let table = self.session().get_table().map(|x| x.get_name().to_owned());
        let columns_config = self.presentation().all_columns_configs();
        Ok(ViewerConfig {
            version,
            plugin,
            title,
            plugin_config,
            columns_config,
            settings,
            table,
            view_config,
            theme,
        })
    }
}

impl<T: HasRenderer + HasSession + HasPresentation> GetViewerConfigModel for T {}

#[derive(Clone)]
pub struct GetViewerConfigModelCloned {
    renderer: Renderer,
    session: Session,
    presentation: Presentation,
}

derive_model!(Renderer, Session, Presentation for GetViewerConfigModelCloned);

pub trait ColumnIteratorModel: HasSession + HasRenderer + HasDragDrop {
    fn column_selector_iter_set<'a>(&'a self, config: &'a ViewConfig) -> ColumnsIteratorSet<'a> {
        ColumnsIteratorSet::new(config, self.session(), self.renderer(), self.dragdrop())
    }
}

impl<T: HasSession + HasRenderer + HasDragDrop> ColumnIteratorModel for T {}
