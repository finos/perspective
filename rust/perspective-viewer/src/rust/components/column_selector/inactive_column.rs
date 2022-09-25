////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::expression_toolbar::*;
use crate::config::*;
use crate::dragdrop::*;
use crate::js::plugin::*;
use crate::model::*;
use crate::renderer::*;
use crate::session::*;
use crate::utils::ApiFuture;
use crate::*;

use itertools::Itertools;
use web_sys::*;
use yew::prelude::*;

#[derive(Properties, Clone)]
pub struct InactiveColumnProps {
    pub idx: usize,
    pub visible: bool,
    pub name: String,
    pub dragdrop: DragDrop,
    pub session: Session,
    pub renderer: Renderer,
    pub ondragend: Callback<DragEvent>,
    pub onselect: Callback<()>,
}

impl PartialEq for InactiveColumnProps {
    /// Equality for `InactiveColumnProps` determines when it should re-render,
    /// which is only when it has changed.
    /// TODO Aggregates
    fn eq(&self, _rhs: &InactiveColumnProps) -> bool {
        false
    }
}

derive_model!(Renderer, Session for InactiveColumnProps);

impl InactiveColumnProps {
    /// Add a column to the active columns, which corresponds to the `columns`
    /// field of the `JsPerspectiveViewConfig`.
    ///
    /// # Arguments
    /// - `name` The name of the column to de-activate, which is a unique ID
    ///   with respect to `columns`.
    /// - `shift` whether to toggle or select this column.
    pub fn activate_column(&self, name: String, shift: bool) {
        let mut columns = self.session.get_view_config().columns.clone();
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
        let config = ViewConfigUpdate {
            columns: Some(columns),
            ..ViewConfigUpdate::default()
        };

        ApiFuture::spawn(self.update_and_render(config));
    }
}

impl From<InactiveColumnProps> for yew::Html {
    fn from(props: InactiveColumnProps) -> Self {
        let key = props.name.to_owned();
        html! {
            <InactiveColumn key={ key } ..props></InactiveColumn>
        }
    }
}

pub enum InactiveColumnMsg {
    ActivateColumn(bool),
}

pub struct InactiveColumn {
    add_expression_ref: NodeRef,
}

impl Component for InactiveColumn {
    type Message = InactiveColumnMsg;
    type Properties = InactiveColumnProps;

    fn create(_ctx: &Context<Self>) -> Self {
        InactiveColumn {
            add_expression_ref: NodeRef::default(),
        }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: InactiveColumnMsg) -> bool {
        match msg {
            InactiveColumnMsg::ActivateColumn(shift_key) => {
                ctx.props()
                    .activate_column(ctx.props().name.to_owned(), shift_key);
                ctx.props().onselect.emit(());
                false
            }
        }
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let col_type = ctx
            .props()
            .session
            .metadata()
            .get_column_table_type(&ctx.props().name)
            .expect("Unknown column");

        let add_column = ctx
            .link()
            .callback(|event: MouseEvent| InactiveColumnMsg::ActivateColumn(event.shift_key()));

        let noderef = NodeRef::default();
        let dragstart = Callback::from({
            let event_name = ctx.props().name.to_owned();
            let noderef = noderef.clone();
            let dragdrop = ctx.props().dragdrop.clone();
            move |_event: DragEvent| {
                let elem = noderef.cast::<HtmlElement>().unwrap();
                _event.data_transfer().unwrap().set_drag_image(&elem, 0, 0);
                dragdrop.drag_start(event_name.to_string(), DragEffect::Copy)
            }
        });

        let is_expression = ctx
            .props()
            .session
            .metadata()
            .is_column_expression(&ctx.props().name);

        html! {
            <div
                class="column-selector-column"
                style={ if ctx.props().visible { None } else { Some("display:none") } }
                data-index={ ctx.props().idx.to_string() }>

                <span
                    class="is_column_active"
                    onmousedown={ add_column }>
                </span>
                <div
                    class="column_selector_draggable column-selector-column-title"
                    draggable="true"
                    ref={ &self.add_expression_ref }
                    ondragstart={ dragstart }
                    ondragend={ &ctx.props().ondragend }>

                    <span
                        ref={ noderef.clone() }
                        class={ format!("column_name {}", col_type) }>
                        {
                            ctx.props().name.clone()
                        }
                    </span>

                    if is_expression {
                        <ExpressionToolbar
                            session={ &ctx.props().session }
                            renderer={ &ctx.props().renderer }
                            dragdrop={ &ctx.props().dragdrop }
                            name={ ctx.props().name.clone() }
                            add_expression_ref={ &self.add_expression_ref }>

                        </ExpressionToolbar>
                    }
                </div>
            </div>
        }
    }
}
