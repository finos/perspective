////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use yew::prelude::*;

use super::containers::select::*;
use crate::config::*;
use crate::js::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[derive(Properties, PartialEq)]
pub struct PluginSelectorProps {
    pub renderer: Renderer,
    pub session: Session,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakScope<PluginSelector>,
}

derive_model!(Renderer, Session for PluginSelectorProps);

#[derive(Debug)]
pub enum PluginSelectorMsg {
    ComponentSelectPlugin(String),
    RendererSelectPlugin(String),
}

pub struct PluginSelector {
    options: Vec<SelectItem<String>>,
    _plugin_sub: Subscription,
}

impl Component for PluginSelector {
    type Message = PluginSelectorMsg;
    type Properties = PluginSelectorProps;

    fn create(ctx: &Context<Self>) -> Self {
        enable_weak_link_test!(ctx.props(), ctx.link());
        let options = generate_plugin_optgroups(&ctx.props().renderer);
        let _plugin_sub = ctx.props().renderer.plugin_changed.add_listener({
            let link = ctx.link().clone();
            move |plugin: JsPerspectiveViewerPlugin| {
                let name = plugin.name();
                link.send_message(PluginSelectorMsg::RendererSelectPlugin(name))
            }
        });

        PluginSelector {
            options,
            _plugin_sub,
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            PluginSelectorMsg::RendererSelectPlugin(_plugin_name) => true,
            PluginSelectorMsg::ComponentSelectPlugin(plugin_name) => {
                ctx.props()
                    .renderer
                    .update_plugin(&PluginUpdate::Update(plugin_name))
                    .unwrap();

                let mut update = ViewConfigUpdate::default();
                ctx.props()
                    .session
                    .set_update_column_defaults(&mut update, &ctx.props().renderer.metadata());

                ApiFuture::spawn(ctx.props().update_and_render(update));
                false
            }
        }
    }

    fn changed(&mut self, _ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let callback = ctx
            .link()
            .callback(PluginSelectorMsg::ComponentSelectPlugin);

        let plugin_name = ctx.props().renderer.get_active_plugin().unwrap().name();
        html! {
            <div id="plugin_selector_container">
                <Select<String>
                    id="plugin_selector"
                    values={ self.options.clone() }
                    selected={ plugin_name }
                    on_select={ callback }>

                </Select<String>>
            </div>
        }
    }
}

/// Generate the opt groups for the plugin selector by collecting by category
/// then sorting.
fn generate_plugin_optgroups(renderer: &Renderer) -> Vec<SelectItem<String>> {
    let mut options = renderer
        .get_all_plugin_categories()
        .into_iter()
        .map(|(category, value)| SelectItem::OptGroup(category.into(), value))
        .collect::<Vec<_>>();

    options.sort_by_key(|x| x.name());
    options
}
