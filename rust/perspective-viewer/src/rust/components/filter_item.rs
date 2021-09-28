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
use crate::renderer::*;
use crate::session::*;
use crate::*;

use super::containers::dragdrop_list::*;
use super::containers::dropdown::*;

use chrono::{Local, NaiveDate, NaiveDateTime, TimeZone, Utc};
use web_sys::*;
use yew::prelude::*;
use wasm_bindgen::JsCast;

/// A control for a single filter condition.
pub struct FilterItem {
    props: FilterItemProperties,
    link: ComponentLink<FilterItem>,
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
pub struct FilterItemProperties {
    pub filter: Filter,
    pub idx: usize,
    pub filter_dropdown: FilterDropDownElement,
    pub on_keydown: Callback<String>,
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_renderable_props!(FilterItemProperties);

impl DragDropListItemProps for FilterItemProperties {
    type Item = Filter;

    fn get_item(&self) -> Filter {
        self.filter.clone()
    }
}

impl FilterItemProperties {
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
                            .with_timezone(&Local)
                            .format("%Y-%m-%d")
                            .to_string(),
                    )
                } else {
                    None
                }
            }
            (Type::Datetime, FilterTerm::Scalar(Scalar::Float(x)))
            | (Type::Datetime, FilterTerm::Scalar(Scalar::DateTime(x))) => {
                if *x > 0_f64 {
                    Some(
                        Utc.timestamp(
                            *x as i64 / 1000,
                            ((*x as i64 % 1000) * 1000000) as u32,
                        )
                        .with_timezone(&Local)
                        .format("%Y-%m-%dT%H:%M:%S%.3f")
                        .to_string(),
                    )
                } else {
                    None
                }
            }
            (Type::Bool, FilterTerm::Scalar(Scalar::Bool(x))) => {
                Some((if *x { "true" } else { "false" }).to_owned())
            }
            (Type::Bool, _) => {
                Some("true".to_owned())
            }
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
            Some(Type::Bool) => vec![
                FilterOp::EQ,
                FilterOp::IsNull,
                FilterOp::IsNotNull
            ],
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
            _ => vec![]
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
        match filter_item.1 {
            FilterOp::In => {
                filter_item.2 = FilterTerm::Array(
                    val.split(',')
                        .map(|x| Scalar::String(x.trim().to_owned()))
                        .collect(),
                );
            }
            _ => match self.get_filter_type() {
                Some(Type::String) => {
                    filter_item.2 = FilterTerm::Scalar(Scalar::String(val));
                }
                Some(Type::Integer) => {
                    if val.is_empty() {
                        filter_item.2 = FilterTerm::Scalar(Scalar::Null);
                    } else if let Ok(num) = val.parse::<f64>() {
                        filter_item.2 = FilterTerm::Scalar(Scalar::Float(num.floor()));
                    }
                }
                Some(Type::Float) => {
                    if val.is_empty() {
                        filter_item.2 = FilterTerm::Scalar(Scalar::Null);
                    } else if let Ok(num) = val.parse::<f64>() {
                        filter_item.2 = FilterTerm::Scalar(Scalar::Float(num));
                    }
                }
                Some(Type::Date) => {
                    filter_item.2 = FilterTerm::Scalar(match NaiveDate::parse_from_str(
                        &val, "%Y-%m-%d",
                    ) {
                        Ok(ref posix) => match posix.and_hms_opt(0, 0, 0) {
                            Some(x) => Scalar::DateTime(x.timestamp_millis() as f64),
                            None => Scalar::Null,
                        },
                        _ => Scalar::Null,
                    })
                }
                Some(Type::Datetime) => {
                    filter_item.2 = FilterTerm::Scalar(
                        match NaiveDateTime::parse_from_str(
                            &val,
                            "%Y-%m-%dT%H:%M:%S%.3f",
                        ) {
                            Ok(ref posix) => Scalar::DateTime(
                                Utc.from_local_datetime(posix)
                                    .unwrap()
                                    .timestamp_millis()
                                    as f64,
                            ),
                            _ => Scalar::Null,
                        },
                    )
                }
                Some(Type::Bool) => {
                    filter_item.2 = FilterTerm::Scalar(match val.as_str() {
                        "true" => Scalar::Bool(true),
                        _ => Scalar::Bool(false),
                    });
                }

                // shouldn't be reachable ..
                _ => {}
            },
        }

        let update = ViewConfigUpdate {
            filter: Some(filter),
            ..ViewConfigUpdate::default()
        };

        self.update_and_render(update);
    }
}

type FilterOpSelector = DropDown<FilterOp>;

impl Component for FilterItem {
    type Message = FilterItemMsg;
    type Properties = FilterItemProperties;

    fn create(props: FilterItemProperties, link: ComponentLink<Self>) -> Self {
        let input = props.get_filter_input().unwrap_or_else(|| "".to_owned());
        let input_ref = NodeRef::default();
        if let Some(Type::Bool) = props.get_filter_type() {
            props.update_filter_input(input.clone());
        }

        FilterItem { props, link, input, input_ref }
    }

    fn update(&mut self, msg: FilterItemMsg) -> bool {
        match msg {
            FilterItemMsg::FilterInput(column, input) => {
                let target = self.input_ref.cast::<HtmlInputElement>().unwrap();
                let input = if let Some(Type::Bool) = self.props.get_filter_type() {
                    if target.checked() {
                        "true".to_owned()
                    } else {
                        "false".to_owned()
                    }
                } else {
                    input
                };
                
                if self.props.is_suggestable() {
                    self.props.filter_dropdown.autocomplete(
                        column,
                        input.clone(),
                        target.unchecked_into(),
                        self.props.on_keydown.clone(),
                    );
                }

                self.props.update_filter_input(input);
                false
            }
            FilterItemMsg::FilterKeyDown(40) => {
                if self.props.is_suggestable() {
                    self.props.filter_dropdown.item_down();
                    self.props.filter_dropdown.item_select();
                }
                false
            }
            FilterItemMsg::FilterKeyDown(38) => {
                if self.props.is_suggestable() {
                    self.props.filter_dropdown.item_up();
                    self.props.filter_dropdown.item_select();
                }
                false
            }
            FilterItemMsg::Close => {
                self.props.filter_dropdown.hide().unwrap();
                false
            }
            FilterItemMsg::FilterKeyDown(13) => {
                if self.props.is_suggestable() {
                    self.props.filter_dropdown.item_select();
                    self.props.filter_dropdown.hide().unwrap();
                }
                false
            }
            FilterItemMsg::FilterKeyDown(_) => {
                if self.props.is_suggestable() {
                    self.props.filter_dropdown.reautocomplete();
                }
                false
            }
            FilterItemMsg::FilterOpSelect(op) => {
                self.props.update_filter_op(op);
                true
            }
        }
    }

    fn change(&mut self, props: FilterItemProperties) -> bool {
        self.props = props;
        if let Some(input) = self.props.get_filter_input() {
            self.input = input;
            true
        } else {
            false
        }
    }

    fn view(&self) -> Html {
        let idx = self.props.idx;
        let filter = self.props.filter.clone();
        let column = filter.0.to_owned();
        let col_type = self
            .props
            .session
            .metadata()
            .get_column_table_type(&column);

        let select = self.link.callback(FilterItemMsg::FilterOpSelect);

        let noderef = &self.input_ref;
        let input = self.link.callback({
            let column = column.clone();
            move |input: InputData| {
                FilterItemMsg::FilterInput((idx, column.clone()), input.value)
            }
        });

        let focus = self.link.callback({
            let input = self.input.clone();
            move |_: FocusEvent| {
                FilterItemMsg::FilterInput((idx, column.clone()), input.clone())
            }
        });

        let blur = self.link.callback(|_| FilterItemMsg::Close);
        let keydown = self.link.callback(move |event: KeyboardEvent| {
            FilterItemMsg::FilterKeyDown(event.key_code())
        });

        let dragref = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = self.props.filter.0.to_owned();
            let dragref = dragref.clone();
            let dragdrop = self.props.dragdrop.clone();
            move |event: DragEvent| {
                let elem = dragref.cast::<HtmlElement>().unwrap();
                event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(
                    event_name.to_string(),
                    DragEffect::Move(DropAction::Filter),
                )
            }
        });

        let dragend = Callback::from({
            let dragdrop = self.props.dragdrop.clone();
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
                    onfocus={ focus }
                    onblur={ blur }
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
                    onfocus={ focus }
                    onblur={ blur }
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
                    onfocus={ focus }
                    onblur={ blur }
                    value={ self.input.clone() }
                    oninput={ input }/>
            },
            Some(Type::Datetime) => html! {
                <input
                    type="datetime-local"
                    placeholder="Value"
                    class="datetime-filter"
                    step="0.001"
                    ref={ noderef.clone() }
                    onkeydown={ keydown }
                    onfocus={ focus }
                    onblur={ blur }
                    value={ self.input.clone() }
                    oninput={ input }/>
            },
            Some(Type::Bool) => {
                html! {
                    <input
                        type="checkbox"
                        ref={ noderef.clone() }
                        checked={ self.input == "true" }
                        oninput={ input }/>
                }
            },
            None => {
                html! {}
            }
        };

        let filter_ops = self
            .props
            .get_filter_ops()
            .into_iter()
            .map(DropDownItem::Option)
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
