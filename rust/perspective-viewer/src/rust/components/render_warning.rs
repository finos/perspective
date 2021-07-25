////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::renderer::*;
use crate::session::*;

use wasm_bindgen_futures::future_to_promise;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct RenderWarningProps {
    pub dimensions: Option<(usize, usize, Option<usize>, Option<usize>)>,
    pub renderer: Renderer,
    pub session: Session,
}

pub enum RenderWarningMsg {
    DismissWarning,
}

pub struct RenderWarning {
    props: RenderWarningProps,
    link: ComponentLink<RenderWarning>,
    col_warn: Option<(usize, usize)>,
    row_warn: Option<(usize, usize)>,
}

impl RenderWarning {
    fn update_warnings(&mut self) {
        if let Some((num_cols, num_rows, max_cols, max_rows)) = self.props.dimensions {
            let count = num_cols * num_rows;
            if max_cols.map(|x| x < num_cols).unwrap_or(false) {
                self.col_warn = Some((max_cols.unwrap(), num_cols));
            } else {
                self.col_warn = None;
            }

            if max_rows.map(|x| x < num_rows).unwrap_or(false) {
                self.row_warn = Some((num_cols * max_rows.unwrap(), count));
            } else {
                self.row_warn = None;
            }
        } else {
            self.col_warn = None;
            self.row_warn = None;
        }
    }
}

impl Component for RenderWarning {
    type Message = RenderWarningMsg;
    type Properties = RenderWarningProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        // enable_weak_link_test!(props, link);
        let mut elem = RenderWarning {
            props,
            link,
            col_warn: None,
            row_warn: None,
        };

        elem.update_warnings();
        elem
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            RenderWarningMsg::DismissWarning => {
                let renderer = self.props.renderer.clone();
                let session = self.props.session.clone();
                let _promise = future_to_promise(async move {
                    renderer.disable_active_plugin_render_warning();
                    renderer.update(&session).await
                });
            }
        };
        true
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        self.props = props;
        self.update_warnings();
        true
    }

    fn view(&self) -> Html {
        if self.col_warn.is_some() || self.row_warn.is_some() {
            let warning = match (self.col_warn, self.row_warn) {
                (Some((x, y)), Some((a, b))) => html! {
                    <span style="white-space:nowrap">
                        { "Rendering" }
                        { render_pair(x, y) }
                        { "of columns and" }
                        { render_pair(a, b) }
                        { "of points." }
                    </span>
                },
                (Some((x, y)), None) => html! {
                    <span style="white-space:nowrap">
                        { "Rendering" }
                        { render_pair(x, y) }
                        { "of columns." }
                    </span>
                },
                (None, Some((x, y))) => html! {
                    <span style="white-space:nowrap">
                        { "Rendering"}
                        { render_pair(x, y) }
                        { "of points." }
                    </span>
                },
                _ => html! {
                    <div></div>
                },
            };

            let onclick = self.link.callback(|_| RenderWarningMsg::DismissWarning);
            html! {
                <div
                    class="plugin_information plugin_information--warning"
                    id="plugin_information--size">
                    <span
                        class="plugin_information__text"
                        id="plugin_information_count">{ warning }</span>
                    <span class="plugin_information__actions">
                        <span class="plugin_information__action" onclick=onclick>{ "Render all points" }</span>
                    </span>
                </div>
            }
        } else {
            html! {}
        }
    }
}

fn pretty_print_int(i: usize) -> String {
    let mut s = String::new();
    let i_str = i.to_string();
    let a = i_str.chars().rev().enumerate();
    for (idx, val) in a {
        if idx != 0 && idx % 3 == 0 {
            s.insert(0, ',');
        }
        s.insert(0, val);
    }
    s
}

fn render_pair(n: usize, d: usize) -> Html {
    let x = pretty_print_int(n);
    let y = pretty_print_int(d);
    let total = ((n as f64 / d as f64) * 100_f64).floor() as usize;
    html! {
        <span
            title={ format!("${} / ${}", x, y) }
            class="plugin_information--overflow-hint">
            { "\u{00a0}" }
            <span
                class="plugin_information--overflow-hint-percent">{
                    format!("{}%", total)
            }</span>
            { "\u{00a0}" }
        </span>
    }
}
