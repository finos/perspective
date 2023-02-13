////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::future::Future;
use std::pin::Pin;

use super::columns_iter_set::*;
use super::structural::*;
use crate::config::*;
use crate::renderer::*;
use crate::session::*;
use crate::theme::Theme;
use crate::utils::*;
use crate::*;

/// A `ViewerConfig` is constructed from various properties acrosss the
/// application state, including the current `Plugin`, `ViewConfig`, and
/// `Theme`.  `GetViewerConfigModel` provides methods which should be used to
/// get the applications `ViewerConfig` from across these state objects.
pub trait GetViewerConfigModel: HasSession + HasRenderer + HasTheme {
    /// As these methods are asynchronous, it is commonly useful to be able to
    /// discretely `.clone()` the state objects for dispatching to `async`.
    /// Calling `.cloned()` yields just the state object clones of
    /// `GetViewerConfigModel` which itself implements this trait and other
    /// `crate::model` traits.
    fn cloned(&self) -> GetViewerConfigModelCloned {
        GetViewerConfigModelCloned {
            renderer: self.renderer().clone(),
            session: self.session().clone(),
            theme: self.theme().clone(),
        }
    }

    /// Get the current ViewerConfig
    fn get_viewer_config(&self) -> Pin<Box<dyn Future<Output = ApiResult<ViewerConfig>>>> {
        clone!(self.renderer(), self.session(), self.theme());
        Box::pin(async move {
            let view_config = session.get_view_config().clone();
            let js_plugin = renderer.get_active_plugin()?;
            let settings = renderer.is_settings_open();
            let plugin = js_plugin.name();
            let plugin_config: serde_json::Value = js_plugin.save().into_serde_ext()?;
            let theme = theme.get_name().await;
            Ok(ViewerConfig {
                plugin,
                plugin_config,
                settings,
                view_config,
                theme,
            })
        })
    }
}

impl<T: HasRenderer + HasSession + HasTheme> GetViewerConfigModel for T {}

#[derive(Clone)]
pub struct GetViewerConfigModelCloned {
    renderer: Renderer,
    session: Session,
    theme: Theme,
}

derive_model!(Renderer, Session, Theme for GetViewerConfigModelCloned);

pub trait ColumnIteratorModel: HasSession + HasRenderer + HasDragDrop {
    fn column_selector_iter_set<'a>(&'a self, config: &'a ViewConfig) -> ColumnsIteratorSet<'a> {
        ColumnsIteratorSet::new(config, self.session(), self.renderer(), self.dragdrop())
    }
}

impl<T: HasSession + HasRenderer + HasDragDrop> ColumnIteratorModel for T {}
