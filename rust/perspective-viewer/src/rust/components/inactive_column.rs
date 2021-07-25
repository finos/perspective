////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::dragdrop::*;
use crate::js::plugin::*;
use crate::renderer::*;
use crate::session::*;
use crate::*;

use super::expression_toolbar::*;

use itertools::Itertools;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct InactiveColumnProps {
    pub idx: usize,
    pub name: String,
    pub dragdrop: DragDrop,
    pub session: Session,
    pub renderer: Renderer,
    pub ondragend: Callback<DragEvent>,
    pub onselect: Callback<()>,
}

impl PartialEq for InactiveColumnProps {
    /// Equality for `InactiveColumnProps` determines when it should re-render, which
    /// is only when it has changed.
    /// TODO Aggregates
    fn eq(&self, rhs: &InactiveColumnProps) -> bool {
        self.idx == rhs.idx && self.name == rhs.name
    }
}

derive_renderable_props!(InactiveColumnProps);

impl InactiveColumnProps {
    /// Add a column to the active columns, which corresponds to the `columns` field
    /// of the `JsPerspectiveViewConfig`.
    ///
    /// # Arguments
    /// - `name` The name of the column to de-activate, which is a unique ID with
    ///   respect to `columns`.
    /// - `shift` whether to toggle or select this column.
    pub fn activate_column(&self, name: String, shift: bool) {
        let ViewConfig { mut columns, .. } = self.session.get_view_config();
        let max_cols = self
            .renderer
            .metadata()
            .names
            .as_ref()
            .map_or(0, |x| x.len());
        let mode = self.renderer.metadata().mode;

        // Don't treat `None` at the end of the column list as columns, we'll refill
        // these later
        let last_filled = columns.iter().rposition(|x| !x.is_none()).unwrap();
        columns.truncate(last_filled + 1);

        if (mode == ColumnSelectMode::Select) ^ shift {
            columns.clear();
        } else {
            columns.retain(|x| x.as_ref() != Some(&name));
        }

        columns.push(Some(name));
        self.apply_columns(
            columns
                .into_iter()
                .pad_using(max_cols, |_| None)
                .collect::<Vec<_>>(),
        );
    }

    fn apply_columns(&self, columns: Vec<Option<String>>) {
        self.update_and_render(ViewConfigUpdate {
            columns: Some(columns),
            ..ViewConfigUpdate::default()
        });
    }
}

pub enum InactiveColumnMsg {
    ActivateColumn(bool),
}

pub struct InactiveColumn {
    link: ComponentLink<InactiveColumn>,
    props: InactiveColumnProps,
    add_expression_ref: NodeRef,
}

impl Component for InactiveColumn {
    type Message = InactiveColumnMsg;
    type Properties = InactiveColumnProps;

    fn create(
        props: <Self as yew::Component>::Properties,
        link: ComponentLink<Self>,
    ) -> Self {
        InactiveColumn {
            link,
            props,
            add_expression_ref: NodeRef::default(),
        }
    }

    fn change(&mut self, props: <Self as yew::Component>::Properties) -> ShouldRender {
        // let should_render = self.props != props;
        // TODO this can be avoided by checking is_closable
        self.props = props;
        true
    }

    fn update(&mut self, msg: <Self as yew::Component>::Message) -> ShouldRender {
        match msg {
            InactiveColumnMsg::ActivateColumn(shift_key) => {
                self.props
                    .activate_column(self.props.name.to_owned(), shift_key);
                self.props.onselect.emit(());
                false
            }
        }
    }

    fn view(&self) -> Html {
        let col_type = self
            .props
            .session
            .metadata()
            .get_column_table_type(&self.props.name)
            .expect("Unknown column");

        let add_column = self.link.callback(|event: MouseEvent| {
            InactiveColumnMsg::ActivateColumn(event.shift_key())
        });

        let noderef = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = self.props.name.to_owned();
            let noderef = noderef.clone();
            let dragdrop = self.props.dragdrop.clone();
            move |_event: DragEvent| {
                let elem = noderef.cast::<HtmlElement>().unwrap();
                _event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(event_name.to_string(), DragEffect::Copy)
            }
        });

        let is_expression = self
            .props
            .session
            .metadata()
            .is_column_expression(&self.props.name);

        html! {
            <div
                class="column-selector-column"
                data-index={ self.props.idx.to_string() }>

                <span
                    class="is_column_active"
                    onmousedown={ add_column }>
                </span>
                <div
                    class="column_selector_draggable"
                    draggable="true"
                    ref={ self.add_expression_ref.clone() }
                    ondragstart={ dragstart }
                    ondragend={ self.props.ondragend.clone() }>

                    <span
                        ref={ noderef.clone() }
                        class={ format!("column_name {}", col_type) }>
                        {
                            self.props.name.clone()
                        }
                    </span>
                    {
                        if is_expression {
                            html! {
                                <ExpressionToolbar
                                    session={ self.props.session.clone() }
                                    renderer={ self.props.renderer.clone() }
                                    name={ self.props.name.clone() }
                                    add_expression_ref={ self.add_expression_ref.clone() }>

                                </ExpressionToolbar>
                            }
                        } else {
                            html! {}
                        }
                    }
                </div>
            </div>
        }
    }
}
