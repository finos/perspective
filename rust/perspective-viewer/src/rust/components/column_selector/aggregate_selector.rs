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

use std::collections::HashSet;
use std::rc::Rc;

use perspective_client::config::*;
use perspective_client::utils::PerspectiveResultExt;
use yew::prelude::*;

use crate::components::containers::select::*;
use crate::components::style::LocalStyle;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::*;

#[derive(Properties)]
pub struct AggregateSelectorProps {
    pub column: String,
    pub aggregate: Option<Aggregate>,
    pub renderer: Renderer,
    pub session: Session,
}

derive_model!(Renderer, Session for AggregateSelectorProps);

impl PartialEq for AggregateSelectorProps {
    fn eq(&self, rhs: &Self) -> bool {
        self.column == rhs.column && self.aggregate == rhs.aggregate
    }
}

pub enum AggregateSelectorMsg {
    SetAggregate(Aggregate),
}

pub struct AggregateSelector {
    aggregates: Rc<Vec<SelectItem<Aggregate>>>,
    aggregate: Option<Aggregate>,
}

impl Component for AggregateSelector {
    type Message = AggregateSelectorMsg;
    type Properties = AggregateSelectorProps;

    fn create(ctx: &Context<Self>) -> Self {
        let mut selector = Self {
            aggregates: Rc::new(vec![]),
            aggregate: ctx.props().aggregate.clone(),
        };

        selector.aggregates = Rc::new(selector.get_dropdown_aggregates(ctx));
        selector
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            AggregateSelectorMsg::SetAggregate(aggregate) => {
                self.set_aggregate(ctx, aggregate);
                false
            },
        }
    }

    fn changed(&mut self, ctx: &Context<Self>, _old: &Self::Properties) -> bool {
        self.aggregates = Rc::new(self.get_dropdown_aggregates(ctx));
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let callback = ctx.link().callback(AggregateSelectorMsg::SetAggregate);
        let selected_agg = ctx
            .props()
            .aggregate
            .clone()
            .or_else(|| {
                ctx.props()
                    .session
                    .metadata()
                    .get_column_table_type(&ctx.props().column)
                    .map(|x| x.default_aggregate())
            })
            .unwrap();

        let values = self.aggregates.clone();
        let label = ctx.props().aggregate.as_ref().map(|x| match x {
            Aggregate::SingleAggregate(_) => "".to_string(),
            Aggregate::MultiAggregate(x, _) => format!("{}", x),
        });

        html! {
            <>
                <LocalStyle href={css!("aggregate-selector")} />
                <div class="aggregate-selector-wrapper">
                    <Select<Aggregate>
                        wrapper_class="aggregate-selector"
                        {values}
                        label={label.map(|x| x.into())}
                        selected={selected_agg}
                        on_select={callback}
                    />
                </div>
            </>
        }
    }
}

impl AggregateSelector {
    pub fn set_aggregate(&mut self, ctx: &Context<Self>, aggregate: Aggregate) {
        self.aggregate = Some(aggregate.clone());
        let mut aggregates = ctx.props().session.get_view_config().aggregates.clone();
        aggregates.insert(ctx.props().column.clone(), aggregate);
        let config = ViewConfigUpdate {
            aggregates: Some(aggregates),
            ..ViewConfigUpdate::default()
        };

        ctx.props()
            .update_and_render(config)
            .map(ApiFuture::spawn)
            .unwrap_or_log();
    }

    pub fn get_dropdown_aggregates(&self, ctx: &Context<Self>) -> Vec<SelectItem<Aggregate>> {
        let aggregates = ctx
            .props()
            .session
            .metadata()
            .get_column_aggregates(&ctx.props().column)
            .expect("Bad Aggs")
            .collect::<Vec<_>>();

        let multi_aggregates2 = aggregates
            .clone()
            .into_iter()
            .flat_map(|x| match x {
                Aggregate::MultiAggregate(x, _) => Some(x),
                _ => None,
            })
            .collect::<HashSet<_>>()
            .into_iter()
            .map(|x| match x {
                MultiAggregate::WeightedMean => SelectItem::OptGroup(
                    "weighted mean".into(),
                    aggregates
                        .iter()
                        .filter(|x| {
                            matches!(
                                x,
                                Aggregate::MultiAggregate(MultiAggregate::WeightedMean, _)
                            )
                        })
                        .cloned()
                        .collect(),
                ),
                MultiAggregate::MaxBy => SelectItem::OptGroup(
                    "max by".into(),
                    aggregates
                        .iter()
                        .filter(|x| {
                            matches!(x, Aggregate::MultiAggregate(MultiAggregate::MaxBy, _))
                        })
                        .cloned()
                        .collect(),
                ),
                MultiAggregate::MinBy => SelectItem::OptGroup(
                    "min by".into(),
                    aggregates
                        .iter()
                        .filter(|x| {
                            matches!(x, Aggregate::MultiAggregate(MultiAggregate::MinBy, _))
                        })
                        .cloned()
                        .collect(),
                ),
            })
            .collect::<Vec<_>>();

        let s = aggregates
            .iter()
            .filter(|x| matches!(x, Aggregate::SingleAggregate(_)))
            .cloned()
            .map(SelectItem::Option)
            .chain(multi_aggregates2);

        s.collect::<Vec<_>>()
    }
}
