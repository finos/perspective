////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::js::perspective_viewer::*;
use crate::renderer::registry::*;
use crate::renderer::*;
use crate::utils::*;
use crate::*;

use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct PluginSelectorProps {
    pub renderer: Renderer,

    #[cfg(test)]
    #[prop_or_default]
    pub weak_link: WeakComponentLink<PluginSelector>,
}

pub enum PluginSelectorMsg {
    SelectPlugin(String),
    PluginSelected(String),
}

pub struct PluginSelector {
    props: PluginSelectorProps,
    _plugin_sub: Subscription,
    link: ComponentLink<PluginSelector>,
}

impl Component for PluginSelector {
    type Message = PluginSelectorMsg;
    type Properties = PluginSelectorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        enable_weak_link_test!(props, link);
        let _plugin_sub = props.renderer.add_on_plugin_changed({
            let callback = link.callback(|plugin: JsPerspectiveViewerPlugin| {
                PluginSelectorMsg::PluginSelected(plugin.name())
            });
            move |x| callback.emit(x)
        });

        PluginSelector {
            props,
            link,
            _plugin_sub,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            PluginSelectorMsg::SelectPlugin(plugin_name) => {
                self.props.renderer.set_plugin(Some(&plugin_name)).unwrap();
                false
            }
            PluginSelectorMsg::PluginSelected(_plugin_name) => true,
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        false
    }

    fn view(&self) -> Html {
        let callback = self.link.callback(|data: ChangeData| {
            PluginSelectorMsg::SelectPlugin(match data {
                ChangeData::Select(e) => e.value(),
                ChangeData::Value(x) => x,
                ChangeData::Files(_) => PLUGIN_REGISTRY.default_plugin_name(),
            })
        });

        html! {
            <div id="plugin_selector_container">
                <select id="plugin_selector" class="noselect" onchange=callback>{
                    for PLUGIN_REGISTRY.available_plugin_names().iter().map(|name| {
                        let selected = match self.props.renderer.get_active_plugin() {
                            Ok(plugin) => plugin.name() == *name,
                            Err(_) => false
                        };

                        html! {
                            <option
                                selected=selected
                                value=name.to_owned()>{ name }
                            </option>
                        }
                    })
                }</select>
            </div>
        }
    }
}
