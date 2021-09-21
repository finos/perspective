////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::renderer::*;
use crate::session::*;

use crate::*;

use super::containers::dropdown::*;

use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct AggregateSelectorProps {
    pub column: String,
    pub aggregate: Option<Aggregate>,
    pub renderer: Renderer,
    pub session: Session,
}

derive_renderable_props!(AggregateSelectorProps);

impl PartialEq for AggregateSelectorProps {
    fn eq(&self, rhs: &Self) -> bool {
        self.column == rhs.column && self.aggregate == rhs.aggregate
    }
}

impl AggregateSelectorProps {
    pub fn set_aggregate(&mut self, aggregate: Aggregate) {
        self.aggregate = Some(aggregate.clone());
        let ViewConfig { mut aggregates, .. } = self.session.get_view_config();
        aggregates.insert(self.column.clone(), aggregate);
        self.update_and_render(ViewConfigUpdate {
            aggregates: Some(aggregates),
            ..ViewConfigUpdate::default()
        });
    }

    pub fn get_dropdown_aggregates(&self) -> Vec<DropDownItem<Aggregate>> {
        let aggregates = self
            .session
            .metadata()
            .get_column_aggregates(&self.column)
            .expect("Bad Aggs")
            .collect::<Vec<_>>();

        let multi_aggregates = aggregates
            .iter()
            .filter(|x| matches!(x, Aggregate::MultiAggregate(_, _)))
            .cloned()
            .collect::<Vec<_>>();

        let multi_aggregates2 = if !multi_aggregates.is_empty() {
            vec![DropDownItem::OptGroup("weighted mean", multi_aggregates)]
        } else {
            vec![]
        };

        let s = aggregates
            .iter()
            .filter(|x| matches!(x, Aggregate::SingleAggregate(_)))
            .cloned()
            .map(DropDownItem::Option)
            .chain(multi_aggregates2);

        s.collect::<Vec<_>>()
    }
}

pub enum AggregateSelectorMsg {
    SetAggregate(Aggregate),
}

pub struct AggregateSelector {
    props: AggregateSelectorProps,
    link: ComponentLink<AggregateSelector>,
    aggregates: Vec<DropDownItem<Aggregate>>,
}

impl Component for AggregateSelector {
    type Message = AggregateSelectorMsg;
    type Properties = AggregateSelectorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        let aggregates = props.get_dropdown_aggregates();
        AggregateSelector {
            props,
            link,
            aggregates,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            AggregateSelectorMsg::SetAggregate(aggregate) => {
                self.props.set_aggregate(aggregate);
                false
            }
        }
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        let should_render = self.props != props;
        if should_render {
            self.props = props;
            self.aggregates = self.props.get_dropdown_aggregates();
        }

        should_render
    }

    fn view(&self) -> Html {
        let callback = self.link.callback(AggregateSelectorMsg::SetAggregate);
        let selected_agg = self
            .props
            .aggregate
            .clone()
            .or_else(|| {
                self.props
                    .session
                    .metadata()
                    .get_column_table_type(&self.props.column)
                    .map(|x| x.default_aggregate())
            })
            .unwrap();

        let values = self.aggregates.clone();

        html! {
            <div class="aggregate-selector-wrapper">
                <DropDown<Aggregate>
                    class={ "aggregate-selector" }
                    values={ values }
                    selected={ selected_agg }
                    on_select={ callback }>

                </DropDown<Aggregate>>
            </div>
        }
    }
}
