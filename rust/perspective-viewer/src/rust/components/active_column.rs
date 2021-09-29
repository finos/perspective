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

use super::aggregate_selector::*;
use super::expression_toolbar::*;

use itertools::Itertools;
use web_sys::*;
use yew::prelude::*;

/// The possible states of a column (row) in the active columns list, including the
/// `Option<String>` label type.
#[derive(Clone, PartialEq)]
pub enum ActiveColumnState {
    Column(Label, String),
    Required(Label),
    DragOver(Label),
}

type Label = Option<String>;

#[derive(Properties, Clone)]
pub struct ActiveColumnProps {
    pub idx: usize,
    pub name: ActiveColumnState,
    pub dragdrop: DragDrop,
    pub session: Session,
    pub renderer: Renderer,
    pub ondragenter: Callback<DragEvent>,
    pub ondragend: Callback<DragEvent>,
    pub onselect: Callback<()>,
    pub config: ViewConfig,

    #[prop_or_default]
    pub is_pivot: bool,
}

impl PartialEq for ActiveColumnProps {
    /// Equality for `ActiveColumnProps` determines when it should re-render, which
    /// is only when it has changed.
    /// TODO Aggregates & ViewConfig generally
    fn eq(&self, rhs: &ActiveColumnProps) -> bool {
        self.idx == rhs.idx && self.name == rhs.name && self.is_pivot == rhs.is_pivot
    }
}

impl ActiveColumnProps {
    fn get_name(&self) -> Option<String> {
        match &self.name {
            ActiveColumnState::DragOver(_) => {
                Some(self.dragdrop.get_drag_column().unwrap())
            }
            ActiveColumnState::Column(_, name) => Some(name.to_owned()),
            ActiveColumnState::Required(_) => None,
        }
    }

    fn get_type(&self) -> Option<Type> {
        self.get_name()
            .as_ref()
            .and_then(|x| self.session.metadata().get_column_table_type(x))
    }
}

derive_renderable_props!(ActiveColumnProps);

impl ActiveColumnProps {
    /// Remove an active column from `columns`, or alternatively make this column
    /// the only column in `columns` if the shift key is set (via the `shift` flag).
    ///
    /// # Arguments
    /// - `name` The name of the column to de-activate, which is a unique ID with
    ///   respect to `columns`.
    /// - `shift` whether to toggle or select this column.
    pub fn deactivate_column(&self, name: String, shift: bool) {
        let ViewConfig { mut columns, .. } = self.session.get_view_config();
        let max_cols = self
            .renderer
            .metadata()
            .names
            .as_ref()
            .map_or(0, |x| x.len());

        match self.renderer.metadata().mode {
            ColumnSelectMode::Toggle => {
                let index = columns
                    .iter()
                    .position(|x| x.as_ref() == Some(&name))
                    .unwrap();

                if max_cols > 0 && index < max_cols - 1 {
                    columns[index] = None;
                } else if !shift && columns.len() > 1 {
                    columns.retain(|x| x.as_ref() != Some(&name));
                } else if shift {
                    columns.clear();
                    columns.push(Some(name));
                }
            }
            ColumnSelectMode::Select => {
                columns.retain(|x| x.as_ref() != Some(&name));
            }
        }
        self.apply_columns(columns);
    }

    fn get_is_required(&self) -> bool {
        let min_cols = self.renderer.metadata().min.unwrap_or(0);
        self.idx < min_cols
    }

    fn apply_columns(&self, columns: Vec<Option<String>>) {
        self.update_and_render(ViewConfigUpdate {
            columns: Some(columns),
            ..ViewConfigUpdate::default()
        });
    }
}

pub enum ActiveColumnMsg {
    DeactivateColumn(String, bool),
}

/// An `ActiveColumn` indicates a column which is part of the `columns` field of a
/// `ViewConfig`.  It shows additional column details in context (like selected
/// aggregate), and supports drag/drop and missing entries.
/// TODO Break this into "Active", "Hover" and "Empty"?
pub struct ActiveColumn {
    link: ComponentLink<ActiveColumn>,
    props: ActiveColumnProps,
    add_expression_ref: NodeRef,
    column_type: Option<Type>,
    is_required: bool,
}

impl Component for ActiveColumn {
    type Message = ActiveColumnMsg;
    type Properties = ActiveColumnProps;

    fn create(
        props: <Self as yew::Component>::Properties,
        link: ComponentLink<Self>,
    ) -> Self {
        let add_expression_ref = NodeRef::default();
        let column_type = props.get_type();
        let is_required = props.get_is_required();
        ActiveColumn {
            link,
            props,
            add_expression_ref,
            column_type,
            is_required,
        }
    }

    fn change(&mut self, props: <Self as yew::Component>::Properties) -> ShouldRender {
        let is_required = props.get_is_required();
        let coltype = props.get_type();
        let should_render = self.props != props
            || self.column_type != coltype
            || is_required != self.is_required;
        self.column_type = coltype;
        self.is_required = is_required;
        self.props = props;
        should_render
    }

    fn update(&mut self, msg: <Self as yew::Component>::Message) -> ShouldRender {
        match msg {
            ActiveColumnMsg::DeactivateColumn(column, shift_key) => {
                self.props.deactivate_column(column, shift_key);
                self.props.onselect.emit(());
                false
            }
        }
    }

    fn view(&self) -> Html {
        let mut classes = vec!["column_selector_draggable"];
        if self.props.is_pivot {
            classes.push("show-aggregate");
        };

        let name = match &self.props.name {
            ActiveColumnState::DragOver(label) => {
                classes.push("dragover");
                (
                    label.clone(),
                    Some(self.props.dragdrop.get_drag_column().unwrap()),
                )
            }
            ActiveColumnState::Column(label, name) => {
                (label.clone(), Some(name.to_owned()))
            }
            ActiveColumnState::Required(label) => (label.clone(), None),
        };

        let col_type = self.column_type;

        match (name, col_type) {
            ((label, None), _) => {
                classes.push("empty-named");
                html! {
                    <div
                        class="column-selector-column"
                        data-label={ label }
                        data-index={ self.props.idx.to_string() }
                        ondragenter={ self.props.ondragenter.clone() }>

                        <span class="is_column_active inactive">
                        </span>
                        <div
                            class={ Itertools::intersperse(classes.iter().cloned(), " ").collect::<String>() }>

                        </div>
                    </div>
                }
            }
            ((label, Some(name)), Some(col_type)) => {
                let remove_column = if self.is_required {
                    None
                } else {
                    Some(self.link.callback({
                        let event_name = name.to_owned();
                        move |event: MouseEvent| {
                            ActiveColumnMsg::DeactivateColumn(
                                event_name.to_owned(),
                                event.shift_key(),
                            )
                        }
                    }))
                };

                let noderef = NodeRef::default();
                let dragstart = Callback::from({
                    let event_name = name.to_owned();
                    let noderef = noderef.clone();
                    let dragdrop = self.props.dragdrop.clone();
                    move |event: DragEvent| {
                        let elem = noderef.cast::<HtmlElement>().unwrap();
                        event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                        dragdrop.drag_start(
                            event_name.to_string(),
                            DragEffect::Move(DropAction::Active),
                        )
                    }
                });

                let is_expression =
                    self.props.session.metadata().is_column_expression(&name);

                let class = if self.is_required {
                    "is_column_active required"
                } else {
                    "is_column_active"
                };

                html! {
                    <div
                        class="column-selector-column"
                        data-label={ label }
                        data-index={ self.props.idx.to_string() }
                        ondragenter={ self.props.ondragenter.clone() }>

                        <span
                            class={ class }
                            onmousedown={ remove_column }>
                        </span>
                        <div
                            class={ Itertools::intersperse(classes.iter().cloned(), " ").collect::<String>() }
                            ref={ self.add_expression_ref.clone() }
                            draggable="true"
                            ondragstart={ dragstart }
                            ondragend={ self.props.ondragend.clone() }>

                            <span class="column-selector-column-title">
                                <span
                                    ref={ noderef.clone() }
                                    class={ format!("column_name {}", col_type) }>
                                    {
                                        name.clone()
                                    }
                                </span>
                                {
                                    if is_expression {
                                        html! {
                                            <ExpressionToolbar
                                                session={ self.props.session.clone() }
                                                renderer={ self.props.renderer.clone() }
                                                dragdrop={ self.props.dragdrop.clone() }
                                                name={ name.clone() }
                                                add_expression_ref={ self.add_expression_ref.clone() }>
                                            </ExpressionToolbar>
                                        }
                                    } else {
                                        html! {}
                                    }
                                }
                            </span>
                            {
                                if self.props.is_pivot {
                                    let aggregate = self
                                        .props
                                        .config
                                        .aggregates
                                        .get(&name)
                                        .cloned();
                                    html! {
                                        <AggregateSelector
                                            column={ name.clone() }
                                            aggregate={ aggregate }
                                            renderer={ self.props.renderer.clone() }
                                            session={ self.props.session.clone() }>
                                        </AggregateSelector>
                                    }
                                } else {
                                    html! {}
                                }
                            }
                        </div>
                    </div>
                }
            }
            _ => {
                // Expression columns are the only UI element which requires the
                // `View` (for its expression type), we may need to stub these
                // columns out until the new View forces a re-render (and the
                // `change()` method on this component checks for this).

                let class = Itertools::intersperse(classes.iter().cloned(), " ")
                    .collect::<String>();

                html! {
                    <div
                        class="column-selector-column">

                        <span class="is_column_active inactive">
                        </span>
                        <div
                            class={ class }>

                        </div>
                    </div>
                }
            }
        }
    }
}
