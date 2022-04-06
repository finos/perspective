////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::custom_elements::filter_dropdown::*;
use crate::dragdrop::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::{posix_to_utc_str, str_to_utc_posix};
use crate::*;

use super::containers::dragdrop_list::*;
use super::containers::select::*;

use chrono::{NaiveDate, TimeZone, Utc};
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

/// A control for a single filter condition.
pub struct FilterItem {
    input: String,
    input_ref: NodeRef,
}

#[derive(Debug)]
pub enum FilterItemMsg {
    FilterInput((usize, String), String),
    Close,
    FilterOpSelect(FilterOp),
    FilterKeyDown(u32),
}

#[derive(Properties, Clone)]
pub struct FilterItemProps {
    pub filter: Filter,
    pub idx: usize,
    pub filter_dropdown: FilterDropDownElement,
    pub on_keydown: Callback<String>,
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

impl PartialEq for FilterItemProps {
    fn eq(&self, _rhs: &Self) -> bool {
        false
        // self.idx == other.idx && self.filter == other.filter
    }
}

derive_session_renderer_model!(FilterItemProps);

impl DragDropListItemProps for FilterItemProps {
    type Item = Filter;

    fn get_item(&self) -> Filter {
        self.filter.clone()
    }
}

impl FilterItemProps {
    /// Does this filter item get a "suggestions" auto-complete modal?
    fn is_suggestable(&self) -> bool {
        (self.filter.1 == FilterOp::EQ || self.filter.1 == FilterOp::NE)
            && self.get_filter_type() == Some(Type::String)
    }

    /// Get this filter's type, e.g. the type of the column.
    fn get_filter_type(&self) -> Option<Type> {
        self.session
            .metadata()
            .get_column_table_type(&self.filter.0)
    }

    // Get the string value, suitable for the `value` field of a `FilterItems`'s
    // `<input>`.
    fn get_filter_input(&self) -> Option<String> {
        let filter_type = self.get_filter_type()?;
        match (&filter_type, &self.filter.2) {
            (Type::Date, FilterTerm::Scalar(Scalar::Float(x)))
            | (Type::Date, FilterTerm::Scalar(Scalar::DateTime(x))) => {
                if *x > 0_f64 {
                    Some(
                        Utc.timestamp(*x as i64 / 1000, (*x as u32 % 1000) * 1000)
                            .format("%Y-%m-%d")
                            .to_string(),
                    )
                } else {
                    None
                }
            }
            (Type::Datetime, FilterTerm::Scalar(Scalar::Float(x)))
            | (Type::Datetime, FilterTerm::Scalar(Scalar::DateTime(x))) => {
                if self.filter.1 == FilterOp::InRecent {
                    Some(format!("{}", x))
                } else {
                    posix_to_utc_str(*x).ok()
                }
            }
            (Type::Bool, FilterTerm::Scalar(Scalar::Bool(x))) => {
                Some((if *x { "true" } else { "false" }).to_owned())
            }
            (Type::Bool, _) => Some("true".to_owned()),
            (_, x) => Some(format!("{}", x)),
        }
    }

    /// Get the allowed `FilterOp`s for this filter.
    fn get_filter_ops(&self) -> Vec<FilterOp> {
        match self.get_filter_type() {
            Some(Type::String) => vec![
                FilterOp::EQ,
                FilterOp::NE,
                FilterOp::GT,
                FilterOp::GTE,
                FilterOp::LT,
                FilterOp::LTE,
                FilterOp::BeginsWith,
                FilterOp::Contains,
                FilterOp::EndsWith,
                FilterOp::In,
                FilterOp::IsNotNull,
                FilterOp::IsNull,
            ],
            Some(Type::Datetime) => vec![
                FilterOp::EQ,
                FilterOp::NE,
                FilterOp::GT,
                FilterOp::GTE,
                FilterOp::LT,
                FilterOp::LTE,
                FilterOp::IsNotNull,
                FilterOp::IsNull,
                FilterOp::InRecent,
            ],
            Some(Type::Bool) => {
                vec![FilterOp::EQ, FilterOp::IsNull, FilterOp::IsNotNull]
            }
            Some(_) => vec![
                FilterOp::EQ,
                FilterOp::NE,
                FilterOp::GT,
                FilterOp::GTE,
                FilterOp::LT,
                FilterOp::LTE,
                FilterOp::IsNotNull,
                FilterOp::IsNull,
            ],
            _ => vec![],
        }
    }

    /// Update the filter comparison operator.
    ///
    /// # Arguments
    /// - `op` The new `FilterOp`.
    fn update_filter_op(&self, op: FilterOp) {
        let ViewConfig { mut filter, .. } = self.session.get_view_config();
        let filter_item = &mut filter.get_mut(self.idx).expect("Filter on no column");
        filter_item.1 = op;
        let update = ViewConfigUpdate {
            filter: Some(filter),
            ..ViewConfigUpdate::default()
        };

        self.update_and_render(update);
    }

    /// Update the filter value from the string input read from the DOM.
    ///
    /// # Arguments
    /// - `val` The new filter value.
    fn update_filter_input(&self, val: String) {
        let ViewConfig { mut filter, .. } = self.session.get_view_config();
        let filter_item = &mut filter.get_mut(self.idx).expect("Filter on no column");
        let filter_input = match filter_item.1 {
            FilterOp::In => Some(FilterTerm::Array(
                val.split(',')
                    .map(|x| Scalar::String(x.trim().to_owned()))
                    .collect(),
            )),
            _ => match self.get_filter_type() {
                Some(Type::String) => Some(FilterTerm::Scalar(Scalar::String(val))),
                Some(Type::Integer) => {
                    if val.is_empty() {
                        None
                    } else if let Ok(num) = val.parse::<f64>() {
                        Some(FilterTerm::Scalar(Scalar::Float(num.floor())))
                    } else {
                        None
                    }
                }
                Some(Type::Float) => {
                    if val.is_empty() {
                        None
                    } else if let Ok(num) = val.parse::<f64>() {
                        Some(FilterTerm::Scalar(Scalar::Float(num)))
                    } else {
                        None
                    }
                }
                Some(Type::Date) => match NaiveDate::parse_from_str(&val, "%Y-%m-%d") {
                    Ok(ref posix) => posix
                        .and_hms_opt(0, 0, 0)
                        .map(|x| FilterTerm::Scalar(Scalar::DateTime(x.timestamp_millis() as f64))),
                    _ => None,
                },
                Some(Type::Datetime) => if filter_item.1 == FilterOp::InRecent {
                    if val.is_empty() {
                        None
                    } else if let Ok(num) = val.parse::<f64>() {
                        Some(FilterTerm::Scalar(Scalar::Float(num.floor())))
                    } else {
                        None
                    }
                }else{
                    match str_to_utc_posix(&val) {
                        Ok(x) => Some(FilterTerm::Scalar(Scalar::DateTime(x))),
                        _ => None,
                    }
                },
                Some(Type::Bool) => Some(FilterTerm::Scalar(match val.as_str() {
                    "true" => Scalar::Bool(true),
                    _ => Scalar::Bool(false),
                })),

                // shouldn't be reachable ..
                _ => None,
            },
        };

        if let Some(input) = filter_input {
            filter_item.2 = input;
            let update = ViewConfigUpdate {
                filter: Some(filter),
                ..ViewConfigUpdate::default()
            };

            self.update_and_render(update);
        }
    }
}

type FilterOpSelector = Select<FilterOp>;

impl Component for FilterItem {
    type Message = FilterItemMsg;
    type Properties = FilterItemProps;

    fn create(ctx: &Context<Self>) -> Self {
        let input = ctx
            .props()
            .get_filter_input()
            .unwrap_or_else(|| "".to_owned());
        let input_ref = NodeRef::default();
        if let Some(Type::Bool) = ctx.props().get_filter_type() {
            ctx.props().update_filter_input(input.clone());
        }

        FilterItem { input, input_ref }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: FilterItemMsg) -> bool {
        match msg {
            FilterItemMsg::FilterInput(column, input) => {
                let target = self.input_ref.cast::<HtmlInputElement>().unwrap();
                let input = if let Some(Type::Bool) = ctx.props().get_filter_type() {
                    if target.checked() {
                        "true".to_owned()
                    } else {
                        "false".to_owned()
                    }
                } else {
                    input
                };

                if ctx.props().is_suggestable() {
                    ctx.props().filter_dropdown.autocomplete(
                        column,
                        input.clone(),
                        target.unchecked_into(),
                        ctx.props().on_keydown.clone(),
                    );
                }

                ctx.props().update_filter_input(input);
                false
            }
            FilterItemMsg::FilterKeyDown(40) => {
                if ctx.props().is_suggestable() {
                    ctx.props().filter_dropdown.item_down();
                    ctx.props().filter_dropdown.item_select();
                }
                false
            }
            FilterItemMsg::FilterKeyDown(38) => {
                if ctx.props().is_suggestable() {
                    ctx.props().filter_dropdown.item_up();
                    ctx.props().filter_dropdown.item_select();
                }
                false
            }
            FilterItemMsg::Close => {
                ctx.props().filter_dropdown.hide().unwrap();
                false
            }
            FilterItemMsg::FilterKeyDown(13) => {
                if ctx.props().is_suggestable() {
                    ctx.props().filter_dropdown.item_select();
                    ctx.props().filter_dropdown.hide().unwrap();
                }
                false
            }
            FilterItemMsg::FilterKeyDown(_) => {
                if ctx.props().is_suggestable() {
                    ctx.props().filter_dropdown.reautocomplete();
                }
                false
            }
            FilterItemMsg::FilterOpSelect(op) => {
                ctx.props().update_filter_op(op);
                true
            }
        }
    }

    fn changed(&mut self, ctx: &Context<Self>) -> bool {
        if let Some(input) = ctx.props().get_filter_input() {
            self.input = input;
            true
        } else {
            false
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let idx = ctx.props().idx;
        let filter = ctx.props().filter.clone();
        let column = filter.0.to_owned();
        let col_type = ctx
            .props()
            .session
            .metadata()
            .get_column_table_type(&column);

        let select = ctx.link().callback(FilterItemMsg::FilterOpSelect);

        let noderef = &self.input_ref;
        let input = ctx.link().callback({
            let column = column.clone();
            move |input: InputEvent| {
                FilterItemMsg::FilterInput(
                    (idx, column.clone()),
                    input
                        .target()
                        .unwrap()
                        .unchecked_into::<HtmlInputElement>()
                        .value(),
                )
            }
        });

        let focus = ctx.link().callback({
            let input = self.input.clone();
            move |_: FocusEvent| FilterItemMsg::FilterInput((idx, column.clone()), input.clone())
        });

        let blur = ctx.link().callback(|_| FilterItemMsg::Close);
        let keydown = ctx
            .link()
            .callback(move |event: KeyboardEvent| FilterItemMsg::FilterKeyDown(event.key_code()));

        let dragref = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = ctx.props().filter.0.to_owned();
            let dragref = dragref.clone();
            let dragdrop = ctx.props().dragdrop.clone();
            move |event: DragEvent| {
                let elem = dragref.cast::<HtmlElement>().unwrap();
                event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(event_name.to_string(), DragEffect::Move(DragTarget::Filter))
            }
        });

        let dragend = Callback::from({
            let dragdrop = ctx.props().dragdrop.clone();
            move |_event| dragdrop.drag_end()
        });

        let type_class = match col_type {
            Some(Type::Float) | Some(Type::Integer) => "num-filter",
            Some(Type::String) => "string-filter",
            _ => "",
        };

        let input_elem = match col_type {
            Some(Type::Integer) => html! {
                <input
                    type="number"
                    placeholder="Value"
                    class="num-filter"
                    step="1"
                    ref={ noderef.clone() }
                    onkeydown={ keydown }
                    value={ self.input.clone() }
                    oninput={ input }/>
            },
            Some(Type::Float) => html! {
                <input
                    type="number"
                    placeholder="Value"
                    class="num-filter"
                    ref={ noderef.clone() }
                    onkeydown={ keydown }
                    value={ self.input.clone() }
                    oninput={ input }/>
            },
            Some(Type::String) => html! {
                <input
                    type="text"
                    size="4"
                    placeholder="Value"
                    class="string-filter"
                    // TODO This is dirty and it may not work in the future.
                    onInput="this.parentNode.dataset.value=this.value"
                    ref={ noderef.clone() }
                    onkeydown={ keydown }
                    onfocus={ focus }
                    onblur={ blur }
                    value={ self.input.clone() }
                    oninput={ input }/>
            },
            Some(Type::Date) => html! {
                <input
                    type="date"
                    placeholder="Value"
                    class="date-filter"
                    ref={ noderef.clone() }
                    onkeydown={ keydown }
                    value={ self.input.clone() }
                    oninput={ input }/>
            },
            Some(Type::Datetime) => 
                if matches!(&filter.1, FilterOp::InRecent) {
                    html! {
                        <input
                            type="number"
                            placeholder="Value"
                            class="num-filter"
                            step="1"
                            ref={ noderef.clone() }
                            onkeydown={ keydown }
                            value={ self.input.clone() }
                            oninput={ input }/>
                    }
                } else {
                    html! {
                        <input
                            type="datetime-local"
                            placeholder="Value"
                            class="datetime-filter"
                            step="0.001"
                            ref={ noderef.clone() }
                            onkeydown={ keydown }
                            value={ self.input.clone() }
                            oninput={ input }/>
                    }
                }
            ,
            Some(Type::Bool) => {
                html! {
                    <input
                        type="checkbox"
                        ref={ noderef.clone() }
                        checked={ self.input == "true" }
                        oninput={ input }/>
                }
            }
            None => {
                html! {}
            }
        };

        let filter_ops = ctx
            .props()
            .get_filter_ops()
            .into_iter()
            .map(SelectItem::Option)
            .collect::<Vec<_>>();

        html! {
            <>
                <span
                    draggable="true"
                    ref={ dragref }
                    ondragstart={ dragstart }
                    ondragend={ dragend }>
                    {
                        filter.0.to_owned()
                    }
                </span>
                <FilterOpSelector
                    class="filterop-selector"
                    values={ filter_ops }
                    selected={ filter.1 }
                    on_select={ select }>
                </FilterOpSelector>
                {
                    if matches!(&filter.1, FilterOp::IsNotNull | FilterOp::IsNull) {
                        html! {}
                    } else if let Some(Type::Bool) = col_type {
                        html! {
                            { input_elem }
                        }
                    } else {
                        html! {
                            <label
                                class={ format!("input-sizer {}", type_class) }
                                data-value={ format!("{}", filter.2) }>
                                {
                                    input_elem
                                }
                            </label>
                        }
                    }
                }
            </>
        }
    }
}
