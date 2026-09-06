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

//! `MainPanel::stamp_frame_themes`: mirror each panel's effective theme
//! *background* onto its `<regular-layout-frame>`.
//!
//! The frames live in the viewer's shadow DOM, so the document theme rules
//! (`perspective-viewer [theme="X"]`) can never match them — the
//! `--psp--background-color` their `::part(container)` background resolves
//! (viewer.css) inherits down from the viewer host, i.e. always the *host*
//! theme. A frame is normally covered by its slotted plugin (which paints its
//! own per-panel themed background), but while the plugin is missing — not yet
//! mounted, first draw pending, or torn down — the host-theme container shows
//! through a panel themed differently, as a visible artifact.

use wasm_bindgen::prelude::*;
use yew::prelude::*;

use super::MainPanel;
use crate::utils::PtrEqRc;
use crate::workspace::PanelId;

/// The custom property mirrored onto each frame: what viewer.css's
/// `.rl-panel::part(container)` background resolves.
const BACKGROUND_VAR: &str = "--psp--background-color";

/// The inputs the frame backgrounds were last computed from.
pub(super) type FrameThemeSnapshot = (
    Vec<PanelId>,
    Vec<(String, Option<String>)>,
    PtrEqRc<Vec<String>>,
);

impl MainPanel {
    /// Mirror each panel's effective theme background.
    pub(super) fn stamp_frame_themes(&mut self, ctx: &Context<Self>) {
        let Some(layout) = self.layout_ref.cast::<web_sys::Element>() else {
            return;
        };

        let props = ctx.props();
        let snapshot: FrameThemeSnapshot = (
            props.panel_ids.clone(),
            props.panel_themes.clone(),
            props.presentation_props.available_themes.clone(),
        );

        if self.stamped_frame_themes.as_ref() == Some(&snapshot) {
            return;
        }

        if let Some((_, _, prev_themes)) = &self.stamped_frame_themes
            && prev_themes != &snapshot.2
        {
            self.theme_backgrounds.clear();
        }

        let viewer = props.presentation.viewer_elem().clone();
        let mut complete = true;
        let children = layout.children();
        for i in 0..children.length() {
            let Some(frame) = children.item(i) else {
                continue;
            };

            if !frame
                .tag_name()
                .eq_ignore_ascii_case("regular-layout-frame")
            {
                continue;
            }

            let Some(name) = frame.get_attribute("name") else {
                continue;
            };

            let theme = props.effective_panel_theme(&name);

            let background = theme.as_ref().and_then(|theme| {
                let fresh = read_plugin_background(&viewer, &name, theme);
                if let Some(color) = &fresh {
                    self.theme_backgrounds.insert(theme.clone(), color.clone());
                }

                let value = fresh.or_else(|| self.theme_backgrounds.get(theme).cloned());
                complete &= value.is_some();
                value
            });

            let style = frame.unchecked_ref::<web_sys::HtmlElement>().style();
            match background {
                Some(color) => {
                    let _ = style.set_property(BACKGROUND_VAR, &color);
                },
                None => {
                    let _ = style.remove_property(BACKGROUND_VAR);
                },
            }
        }

        self.stamped_frame_themes = complete.then_some(snapshot);
    }
}

/// Read the computed [`BACKGROUND_VAR`] off `slot`'s plugin element.
fn read_plugin_background(viewer: &web_sys::Element, slot: &str, theme: &str) -> Option<String> {
    let children = viewer.children();
    let plugin = (0..children.length())
        .filter_map(|i| children.item(i))
        .filter(|el| el.get_attribute("slot").as_deref() == Some(slot))
        .find(|el| el.get_attribute("theme").as_deref() == Some(theme))?;

    let value = web_sys::window()?
        .get_computed_style(&plugin)
        .ok()??
        .get_property_value(BACKGROUND_VAR)
        .ok()?;

    let value = value.trim();
    (!value.is_empty()).then(|| value.to_owned())
}
