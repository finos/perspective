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

use std::str::FromStr;
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
    pub fn set_aggregate(&self, aggregate: Aggregate) {
        let ViewConfig { mut aggregates, .. } = self.session.get_view_config();
        aggregates.insert(self.column.clone(), aggregate);
        self.update_and_render(ViewConfigUpdate {
            aggregates: Some(aggregates),
            ..ViewConfigUpdate::default()
        });
    }
}

pub enum AggregateSelectorMsg {
    SetAggregate(Aggregate),
}

pub struct AggregateSelector {
    props: AggregateSelectorProps,
    link: ComponentLink<AggregateSelector>,
}

impl Component for AggregateSelector {
    type Message = AggregateSelectorMsg;
    type Properties = AggregateSelectorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        AggregateSelector { props, link }
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
        self.props = props;
        should_render
    }

    fn view(&self) -> Html {
        let callback = self.link.callback(|data: ChangeData| match data {
            ChangeData::Select(e) => {
                AggregateSelectorMsg::SetAggregate(Aggregate::SingleAggregate(
                    SingleAggregate::from_str(e.value().as_str()).unwrap(),
                ))
            }
            ChangeData::Value(x) => {
                AggregateSelectorMsg::SetAggregate(Aggregate::SingleAggregate(
                    SingleAggregate::from_str(x.as_str()).unwrap(),
                ))
            }
            ChangeData::Files(_) => panic!("No idea ..."),
        });

        let session = &self.props.session;
        let coltype = session
            .metadata()
            .get_column_table_type(&self.props.column)
            .unwrap();
        let aggregates = coltype.aggregates_iter();

        html! {
            <div class="aggregate-selector-wrapper">
                <select
                    class="aggregate-selector noselect"
                    onchange={ callback }>

                    {
                        for aggregates.map(|value| {
                            let selected = value == self.props.aggregate.clone().unwrap_or_else(|| {
                                coltype.aggregates_iter().next().unwrap()
                            });

                            html! {
                                <option
                                    selected={ selected }
                                    value={ format!("{}", value) }>

                                    { format!("{}", value) }
                                </option>
                            }
                        })
                    }
                </select>
            </div>
        }
    }
}
