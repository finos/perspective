////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::custom_elements::expression_editor::ExpressionEditorElement;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

use super::active_column::*;
use super::inactive_column::*;

use itertools::Itertools;
use std::cmp::Ordering;
use std::iter::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct ColumnSelectorProps {
    pub session: Session,
    pub renderer: Renderer,
    pub dragdrop: DragDrop,
}

derive_renderable_props!(ColumnSelectorProps);

impl ColumnSelectorProps {
    fn save_expr(&self, expression: &JsValue) {
        let expression = expression.as_string().unwrap();
        let ViewConfig {
            mut expressions, ..
        } = self.session.get_view_config();

        expressions.retain(|x| x != &expression);
        expressions.push(expression);
        self.update_and_render(ViewConfigUpdate {
            expressions: Some(expressions),
            ..ViewConfigUpdate::default()
        });
    }
}

pub enum ColumnSelectorMsg {
    TableLoaded,
    ViewCreated,
    HoverActiveIndex(Option<usize>),
    Drop((String, DropAction, DragEffect, usize)),
    OpenExpressionEditor,
    SaveExpression(JsValue),
}

/// A `ColumnSelector` controls the `columns` field of the `ViewConfig`, deriving its
/// options from the table columns and `ViewConfig` expressions.
pub struct ColumnSelector {
    props: ColumnSelectorProps,
    link: ComponentLink<ColumnSelector>,
    _subscriptions: [Subscription; 3],
    add_expression_ref: NodeRef,
    expression_editor: Option<ExpressionEditorElement>,
}

impl Component for ColumnSelector {
    type Message = ColumnSelectorMsg;
    type Properties = ColumnSelectorProps;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        let table_sub = {
            let cb = link.callback(|_| ColumnSelectorMsg::TableLoaded);
            props.session.on_table_loaded.add_listener(cb)
        };

        let view_sub = {
            let cb = link.callback(|_| ColumnSelectorMsg::ViewCreated);
            props.session.on_view_created.add_listener(cb)
        };

        let drop_sub = {
            let cb = link.callback(ColumnSelectorMsg::Drop);
            props.dragdrop.add_on_drop_action(cb)
        };

        ColumnSelector {
            props,
            link,
            _subscriptions: [table_sub, view_sub, drop_sub],
            add_expression_ref: NodeRef::default(),
            expression_editor: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            ColumnSelectorMsg::TableLoaded => true,
            ColumnSelectorMsg::ViewCreated => true,
            ColumnSelectorMsg::HoverActiveIndex(index) => {
                let min_cols = self.props.renderer.metadata().min;
                match index {
                    Some(to_index) => {
                        let config = self.props.session.get_view_config();
                        let is_to_empty = !config
                            .columns
                            .get(to_index)
                            .map(|x| x.is_some())
                            .unwrap_or_default();

                        let from_index =
                            self.props.dragdrop.get_drag_column().and_then(|x| {
                                config
                                    .columns
                                    .iter()
                                    .position(|z| z.as_ref() == Some(&x))
                            });

                        if min_cols
                            .and_then(|x| from_index.map(|from_index| from_index < x))
                            .unwrap_or_default()
                            && is_to_empty
                        {
                            self.props.dragdrop.drag_leave(DropAction::Active);
                            true
                        } else {
                            self.props.dragdrop.drag_enter(DropAction::Active, to_index)
                        }
                    }
                    _ => {
                        self.props.dragdrop.drag_leave(DropAction::Active);
                        true
                    }
                }
            }
            ColumnSelectorMsg::Drop((column, DropAction::Active, effect, index)) => {
                let update = self.props.session.create_drag_drop_update(
                    column,
                    index,
                    DropAction::Active,
                    effect,
                    &self.props.renderer.metadata(),
                );

                self.props.update_and_render(update);
                true
            }
            ColumnSelectorMsg::Drop((
                _,
                _,
                DragEffect::Move(DropAction::Active),
                _,
            )) => true,
            ColumnSelectorMsg::Drop((_, _, _, _)) => true,
            ColumnSelectorMsg::SaveExpression(expression) => {
                self.props.save_expr(&expression);
                self.expression_editor
                    .take()
                    .and_then(|elem| elem.destroy().ok())
                    .unwrap();

                true
            }
            ColumnSelectorMsg::OpenExpressionEditor => {
                let on_save = self.link.callback(ColumnSelectorMsg::SaveExpression);
                let mut element =
                    ExpressionEditorElement::new(self.props.session.clone(), on_save);

                let target = self.add_expression_ref.cast::<HtmlElement>().unwrap();
                element.open(target);
                self.expression_editor = Some(element);
                false
            }
        }
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        true
    }

    fn view(&self) -> Html {
        if let Some(all_columns) = self.props.session.metadata().get_table_columns() {
            let config = self.props.session.get_view_config();
            let is_dragover_column =
                self.props.dragdrop.is_dragover(DropAction::Active);

            let is_pivot = config.is_pivot();
            let expression_columns =
                self.props.session.metadata().get_expression_columns();
            let columns_iter = ColumnsIterator::new(
                &all_columns,
                &expression_columns,
                &config,
                &self.props.session,
                &self.props.renderer,
                &is_dragover_column,
            );

            let dragleave = dragleave_helper({
                let link = self.link.clone();
                move || link.send_message(ColumnSelectorMsg::HoverActiveIndex(None))
            });

            let dragover = Callback::from(|_event: DragEvent| _event.prevent_default());
            let dragenter = self.link.callback(move |event: DragEvent| {
                // Safari does not set `relatedTarget` so this event must be allowed to
                // bubble so we can count entry/exit stacks to determine true
                // `"dragleave"`.
                if event.related_target().is_some() {
                    event.stop_propagation();
                    event.prevent_default();
                }

                let index = maybe! {
                    event
                        .current_target()
                        .into_jserror()?
                        .unchecked_into::<HtmlElement>()
                        .dataset()
                        .get("index")
                        .into_jserror()?
                        .parse::<usize>()
                        .into_jserror()
                };

                ColumnSelectorMsg::HoverActiveIndex(index.ok())
            });

            let drop = Callback::from({
                let dragdrop = self.props.dragdrop.clone();
                move |_| dragdrop.notify_drop()
            });

            let dragend = Callback::from({
                let dragdrop = self.props.dragdrop.clone();
                move |_event| dragdrop.drag_end()
            });

            let add_expression = self
                .link
                .callback(|_| ColumnSelectorMsg::OpenExpressionEditor);

            let select = self.link.callback(|()| ColumnSelectorMsg::ViewCreated);
            let active_columns_class = if config.columns.len()
                == all_columns.len() + config.expressions.len()
            {
                ""
            } else {
                "collapse"
            }
            .to_owned();

            html! {
                <>
                    <div
                        id="active-columns"
                        class={ active_columns_class }
                        ondragover={ dragover }
                        ondragenter={ Callback::from(dragenter_helper) }
                        ondragleave={ dragleave }
                        ondrop={ drop }>
                        {
                            for columns_iter.active().enumerate().map(|(idx, name)| {
                                html! {
                                    <ActiveColumn
                                        idx={ idx }
                                        name={ name.clone() }
                                        dragdrop={ self.props.dragdrop.clone() }
                                        session={ self.props.session.clone() }
                                        renderer={ self.props.renderer.clone() }
                                        ondragenter={ dragenter.clone() }
                                        ondragend={ dragend.clone() }
                                        onselect={ select.clone() }
                                        config={ config.clone() }
                                        is_pivot={ is_pivot }>
                                    </ActiveColumn>
                                }
                            })
                        }
                    </div>
                    <div id="sub-columns">
                        <div id="expression-columns">
                        {
                            for columns_iter.expression().enumerate().map(|(idx, name)| {
                                html! {
                                    <InactiveColumn
                                        idx={ idx }
                                        name={ name.clone() }
                                        dragdrop={ self.props.dragdrop.clone() }
                                        session={ self.props.session.clone() }
                                        renderer={ self.props.renderer.clone() }
                                        onselect={ select.clone() }
                                        ondragend={ dragend.clone() }>
                                    </InactiveColumn>
                                }
                            })
                        }
                        </div>
                        <div id="inactive-columns">
                        {
                            for columns_iter.inactive().enumerate().map(|(idx, name)| {
                                html! {
                                    <InactiveColumn
                                        idx={ idx }
                                        name={ name.clone() }
                                        dragdrop={ self.props.dragdrop.clone() }
                                        session={ self.props.session.clone() }
                                        renderer={ self.props.renderer.clone() }
                                        onselect={ select.clone() }
                                        ondragend={ dragend.clone() }>
                                    </InactiveColumn>
                                }
                            })
                        }
                        </div>
                    </div>
                    <div
                        id="add-expression"
                        class="side_panel-action"
                        ref={ self.add_expression_ref.clone() }
                        onmousedown={ add_expression }>

                        <span class="psp-icon psp-icon__add"></span>
                        <span class="psp-title__columnName">{ "New Column" }</span>
                    </div>
                </>
            }
        } else {
            html! {}
        }
    }
}

/// Encapsulates the logic of determining which columns go in the "Active" and
/// "Inactive" column sections of the `ColumnSelector` component, via the pair of
/// iterator returning functions `active()` and `inactive()`.
struct ColumnsIterator<'a> {
    table_columns: &'a [String],
    expression_columns: &'a [String],
    config: &'a ViewConfig,
    session: &'a Session,
    renderer: &'a Renderer,
    is_dragover_column: &'a Option<(usize, String)>,
}

impl<'a> ColumnsIterator<'a> {
    pub fn new(
        table_columns: &'a [String],
        expression_columns: &'a [String],
        config: &'a ViewConfig,
        session: &'a Session,
        renderer: &'a Renderer,
        is_dragover_column: &'a Option<(usize, String)>,
    ) -> ColumnsIterator<'a> {
        ColumnsIterator {
            table_columns,
            expression_columns,
            config,
            session,
            renderer,
            is_dragover_column,
        }
    }

    /// Generate an iterator for active columns, which are represented as `Option`
    /// for dragover and missing columns.
    pub fn active(&'a self) -> Box<dyn Iterator<Item = ActiveColumnState> + 'a> {
        let named_columns = self
            .renderer
            .metadata()
            .names
            .clone()
            .unwrap_or_else(std::vec::Vec::new);

        // let named_columns = self.renderer.metadata().names

        let min_cols = named_columns.len();

        match self.is_dragover_column {
            Some((to_index, from_column)) => {
                let is_to_swap = self.renderer.metadata().is_swap(*to_index);

                let is_to_empty = self
                    .config
                    .columns
                    .get(*to_index)
                    .map(|x| x.is_none())
                    .unwrap_or_default();

                let is_from_required = self
                    .config
                    .columns
                    .iter()
                    .position(|x| x.as_ref() == Some(from_column))
                    .and_then(|x| self.renderer.metadata().min.map(|y| x < y))
                    .unwrap_or_default();

                let is_from_swap = self
                    .config
                    .columns
                    .iter()
                    .position(|x| x.as_ref() == Some(from_column))
                    .map(|x| self.renderer.metadata().is_swap(x))
                    .unwrap_or_default();

                let offset = match self.config.columns.get(*to_index) {
                    Some(Some(_)) => *to_index,
                    _ => *to_index + 1,
                };

                if is_to_swap || is_from_required {
                    Box::new(
                        self.config
                            .columns
                            .iter()
                            .filter_map(move |x| match x {
                                Some(x) if x == from_column => {
                                    if is_to_empty {
                                        None
                                    } else {
                                        Some(
                                            self.config
                                                .columns
                                                .get(*to_index)
                                                .unwrap_or(&None),
                                        )
                                    }
                                }
                                x => Some(x),
                            })
                            .pad_using(min_cols, |_| &None)
                            .take(*to_index)
                            .map(Some)
                            .chain([None].iter().cloned())
                            .chain({
                                self.config
                                    .columns
                                    .iter()
                                    .filter_map(move |x| match x {
                                        Some(x) if x == from_column => {
                                            if is_to_empty && !is_from_swap {
                                                None
                                            } else {
                                                Some(
                                                    self.config
                                                        .columns
                                                        .get(*to_index)
                                                        .unwrap_or(&None),
                                                )
                                            }
                                        }
                                        x => Some(x),
                                    })
                                    .skip(*to_index + 1)
                                    .map(Some)
                            })
                            .pad_using(min_cols, |_| Some(&None))
                            .enumerate()
                            .map(move |(idx, x)| {
                                let label = named_columns.get(idx).cloned();
                                match x {
                                    Some(None) => ActiveColumnState::Required(label),
                                    None => ActiveColumnState::DragOver(label),
                                    Some(Some(x)) => {
                                        ActiveColumnState::Column(label, x.to_owned())
                                    }
                                }
                            }),
                    )
                } else {
                    let filtered_cols = self
                        .config
                        .columns
                        .iter()
                        .filter_map(move |x| match x {
                            Some(x) if x == from_column => {
                                if !is_from_swap {
                                    None
                                } else {
                                    Some(&None)
                                }
                            }
                            x => Some(x),
                        })
                        .pad_using(min_cols, |_| &None)
                        .take(*to_index)
                        .map(Some);

                    Box::new(
                        filtered_cols
                            .chain([None].iter().cloned()) // index
                            .chain(
                                self.config
                                    .columns
                                    .iter()
                                    .filter_map(move |x| match x {
                                        Some(x) if x == from_column => {
                                            if !is_from_swap {
                                                None
                                            } else {
                                                Some(&None)
                                            }
                                        }
                                        x => Some(x),
                                    })
                                    .skip(offset)
                                    .map(Some),
                            )
                            .pad_using(min_cols, |_| Some(&None))
                            .enumerate()
                            .map(move |(idx, x)| {
                                let label = named_columns.get(idx).cloned();
                                match x {
                                    Some(None) => ActiveColumnState::Required(label),
                                    None => ActiveColumnState::DragOver(label),
                                    Some(Some(x)) => {
                                        ActiveColumnState::Column(label, x.to_owned())
                                    }
                                }
                            }),
                    )
                }
            }
            _ => Box::new(
                self.config
                    .columns
                    .iter()
                    .pad_using(min_cols, |_| &None)
                    .enumerate()
                    .map(move |(idx, x)| {
                        let label = named_columns.get(idx).cloned();
                        match x {
                            None => ActiveColumnState::Required(label),
                            Some(x) => ActiveColumnState::Column(label, x.to_owned()),
                        }
                    }),
            ),
        }
    }

    /// Generate an iterator for inactive expressions.
    pub fn expression(&'a self) -> Box<dyn Iterator<Item = &'a String> + 'a> {
        let mut filtered = self
            .expression_columns
            .iter()
            .filter(move |name| {
                !self.config.columns.contains(&Some(name.to_string()))
                    && self
                        .is_dragover_column
                        .as_ref()
                        .map(|x| &x.1 != *name)
                        .unwrap_or(true)
            })
            .collect::<Vec<_>>();

        filtered.sort_by(|x, y| self.sort_by_type(x, y));
        Box::new(filtered.into_iter())
    }

    /// Generate an iterator for inactive columns, which also shows the columns in
    /// sorted order by type, then name.
    pub fn inactive(&'a self) -> Box<dyn Iterator<Item = &'a String> + 'a> {
        let dragover_col = self.is_dragover_column.as_ref();
        let mut filtered = self
            .table_columns
            .iter()
            .filter(move |name| {
                let mut str_cols = self.config.columns.iter().flatten();
                !str_cols.any(|x| x == *name)
                    && dragover_col.map_or(true, |x| &x.1 != *name)
            })
            .collect::<Vec<_>>();

        filtered.sort_by(|x, y| self.sort_by_type(x, y));
        Box::new(filtered.into_iter())
    }

    /// A comparison function for column names, which takes into account column type as
    /// reported by the `Session`, such that column names can be sorted alphabetically
    /// after being grouped first by type.
    ///
    /// # Arguments
    /// - `x` Column name.
    /// - `y` Another column name against which to compare.
    fn sort_by_type(&'a self, x: &&'a String, y: &&'a String) -> Ordering {
        let xtype = self.session.metadata().get_column_table_type(x).unwrap();
        let ytype = self.session.metadata().get_column_table_type(y).unwrap();
        match xtype.partial_cmp(&ytype) {
            Some(Ordering::Equal) => x.partial_cmp(y).unwrap(),
            Some(x) => x,
            None => Ordering::Equal,
        }
    }
}
