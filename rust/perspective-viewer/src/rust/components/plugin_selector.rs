////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::js::plugin::*;
use crate::renderer::registry::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use super::containers::dropdown::DropDown;

use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct PluginSelectorProps {
    pub renderer: Renderer,
    pub session: Session,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakComponentLink<PluginSelector>,
}

derive_renderable_props!(PluginSelectorProps);

pub enum PluginSelectorMsg {
    ComponentSelectPlugin(String),
    RendererSelectPlugin(String),
}

pub struct PluginSelector {
    props: PluginSelectorProps,
    link: ComponentLink<PluginSelector>,
    _plugin_sub: Subscription,
}

impl Component for PluginSelector {
    type Message = PluginSelectorMsg;
    type Properties = PluginSelectorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        enable_weak_link_test!(props, link);
        let _plugin_sub = props.renderer.on_plugin_changed.add_listener({
            clone!(link);
            move |plugin: JsPerspectiveViewerPlugin| {
                let name = plugin.name();
                link.send_message(PluginSelectorMsg::RendererSelectPlugin(name))
            }
        });

        PluginSelector {
            props,
            link,
            _plugin_sub,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            PluginSelectorMsg::RendererSelectPlugin(_plugin_name) => true,
            PluginSelectorMsg::ComponentSelectPlugin(plugin_name) => {
                self.props.renderer.set_plugin(Some(&plugin_name)).unwrap();
                let mut update = ViewConfigUpdate::default();
                self.props.session.set_update_column_defaults(
                    &mut update,
                    &self.props.renderer.metadata(),
                );

                self.props.update_and_render(update);
                false
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        false
    }

    fn view(&self) -> Html {
        let callback = self.link.callback(PluginSelectorMsg::ComponentSelectPlugin);
        let plugin_name = self.props.renderer.get_active_plugin().unwrap().name();

        html! {
            <div id="plugin_selector_container">
                <DropDown<String>
                    id="plugin_selector"
                    values={ PLUGIN_REGISTRY.available_plugin_names() }
                    selected={ plugin_name }
                    on_select={ callback }>

                </DropDown<String>>
            </div>
        }
    }
}
