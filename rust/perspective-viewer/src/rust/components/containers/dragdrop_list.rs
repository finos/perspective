////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::dragdrop::*;

use derivative::Derivative;
use web_sys::*;
use yew::prelude::*;

#[macro_export]
macro_rules! derive_dragdrop_list {
    ($name:ident, $context:ident, $parent:ident, $item:ident, $dragenter:ident, $dragleave:ident, $close:ident) => {
        struct $context {}

        impl DragContext<<$parent as Component>::Message> for $context {
            fn dragenter(index: usize) -> ConfigSelectorMsg {
                <$parent as Component>::Message::$dragenter(index)
            }

            fn close(index: usize) -> ConfigSelectorMsg {
                <$parent as Component>::Message::$close(index)
            }

            fn dragleave() -> ConfigSelectorMsg {
                <$parent as Component>::Message::$dragleave
            }
        }

        type $name = DragDropList<$parent, $item, $context>;
    };
}

/// Must be implemented by `Properties` of children of `DragDropList`, returning
/// the value a DragDropItem represents.
pub trait DragDropListItemProps: Properties {
    type Item: Clone + PartialEq;
    fn get_item(&self) -> Self::Item;
}

pub trait DragContext<T> {
    fn close(index: usize) -> T;
    fn dragleave() -> T;
    fn dragenter(index: usize) -> T;
}

#[derive(Properties, Derivative)]
#[derivative(Clone(bound = ""))]
pub struct DragDropListProps<T, U>
where
    T: Component,
    U: Component,
    <U as Component>::Properties: DragDropListItemProps,
{
    pub parent: ComponentLink<T>,
    pub dragdrop: DragDrop,
    pub name: &'static str,
    pub children: ChildrenWithProps<U>,

    #[prop_or_default]
    pub is_dragover: Option<(
        usize,
        <<U as Component>::Properties as DragDropListItemProps>::Item,
    )>,

    #[prop_or_default]
    pub allow_duplicates: bool,
}

pub enum DragDropListMsg {
    Freeze(bool),
}

/// A sub-selector for a list-like component of a `JsViewConfig`, such as `filters`
/// and `sort`.  `DragDropList` is parameterized by two `Component` types, the
/// parent component `T` and the inner item compnent `U`, which must additionally
/// implement `DragDropListItemProps` trait on its own `Properties` associated type.
///
/// Before you ask:  yes, `frozen_size` needs to be a float64 since `flex` containers
/// can have fractional dimensions.
pub struct DragDropList<T, U, V>
where
    T: Component,
    U: Component,
    <U as Component>::Properties: DragDropListItemProps,
    V: DragContext<T::Message> + 'static,
{
    props: DragDropListProps<T, U>,
    link: ComponentLink<Self>,
    elem: NodeRef,
    frozen_size: Option<f64>,
}

impl<T, U, V> Component for DragDropList<T, U, V>
where
    T: Component,
    U: Component,
    <U as Component>::Properties: DragDropListItemProps,
    V: DragContext<T::Message> + 'static,
{
    type Message = DragDropListMsg;
    type Properties = DragDropListProps<T, U>;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        DragDropList {
            props,
            link,
            elem: NodeRef::default(),
            frozen_size: None,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            // When a dragover occurs and a new Column is inserted into the selector,
            // the geometry of the selector may expand and cause a parent reflow,
            // which annoyingly changes the drag status and glitchiness occurs.
            // By using `Freeze` when a dragenter occurs, the element's width will be
            // frozen until `drop` or `dragleave`.
            DragDropListMsg::Freeze(freeze) => {
                if freeze && self.frozen_size.is_none() {
                    let elem = self.elem.cast::<HtmlElement>().unwrap();
                    self.frozen_size = Some({
                        // `offset_width` and family are `i32`, but Chrome _really_
                        // uses fractional pixel widths for these which can only be
                        // recovered by parsing the generated stylesheet ...
                        let txt = window()
                            .unwrap()
                            .get_computed_style(&elem)
                            .unwrap()
                            .unwrap()
                            .get_property_value("width")
                            .unwrap();

                        // Strip "px" suffix, e.g. "24.876px".
                        let px = &txt[..txt.len() - 2];
                        px.parse::<f64>().unwrap()
                    });
                    true
                } else if !freeze {
                    // Don't render because the invoker will do so through `dragdrop`.
                    self.frozen_size = None;
                    false
                } else {
                    false
                }
            }
        }
    }

    /// Should always render on change, as this component only depends on the props from
    /// its parent and has no `Msg` enums.
    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        self.props = props;
        true
    }

    fn view(&self) -> Html {
        let dragover = Callback::from(|_event: DragEvent| _event.prevent_default());

        // On dragleave, signal the parent but no need to redraw as parent will call
        // `change()` when resetting props.
        let dragleave = dragleave_helper({
            let parent = self.props.parent.clone();
            let link = self.link.clone();
            move || {
                link.send_message(DragDropListMsg::Freeze(false));
                parent.send_message(V::dragleave())
            }
        });

        let drop = Callback::from({
            let dragdrop = self.props.dragdrop.clone();
            let link = self.link.clone();
            move |_| {
                link.send_message(DragDropListMsg::Freeze(false));
                dragdrop.notify_drop();
            }
        });

        let columns_html = {
            let mut columns = self
                .props
                .children
                .iter()
                .map(Some)
                .enumerate()
                .collect::<Vec<(usize, Option<yew::virtual_dom::VChild<U>>)>>();

            if let Some((x, column)) = &self.props.is_dragover {
                let index = *x as usize;
                if !self.props.allow_duplicates {
                    columns
                        .retain(|x| x.1.as_ref().unwrap().props.get_item() != *column);
                }

                // If inserting into the middle of the list, use
                // the length of the existing element to prevent
                // jitter as the underlying dragover zone moves.
                if index < columns.len() {
                    columns.insert(index, (index, None));
                } else {
                    columns.push((index, None));
                }
            }

            columns
                .into_iter()
                .map(|(idx, column)| {
                    let close = self.props.parent.callback(move |_| V::close(idx));
                    let dragenter = self.props.parent.callback({
                        let link = self.link.clone();
                        move |event: DragEvent| {
                            event.stop_propagation();
                            event.prevent_default();
                            link.send_message(DragDropListMsg::Freeze(true));
                            V::dragenter(idx)
                        }
                    });

                    if let Some(column) = column {
                        html! {
                            <div class="pivot-column" ondragenter={ dragenter }>
                                {
                                    Html::from(column)
                                }
                                <span class="row_close" onmousedown={ close }></span>
                            </div>
                        }
                    } else {
                        html! {
                            <div class="pivot-column config-drop" ondragenter={ dragenter }>
                            </div>
                        }
                    }
                })
                .collect::<Html>()
        };

        let total = self.props.children.len();
        let dragenter = self.props.parent.callback({
            let link = self.link.clone();
            move |event: DragEvent| {
                dragenter_helper(event);
                link.send_message(DragDropListMsg::Freeze(true));
                V::dragenter(total)
            }
        });

        let style = match self.frozen_size {
            Some(x) => format!("max-width:{}px;min-width:{}px", x.floor(), x.ceil()),
            None => "".to_owned(),
        };

        html! {
            <div style={style} ref={ self.elem.clone() } class="rrow">
                <div
                    id={ self.props.name }
                    ondragover={ dragover }
                    ondragenter={ dragenter }
                    ondragleave={ dragleave }
                    ondrop={ drop }>

                    <div class="psp-text-field">
                        <ul class="psp-text-field__input" for={ self.props.name }>
                            { columns_html }
                        </ul>
                        <label class="pivot-selector-label" for={ self.props.name }></label>
                    </div>
                </div>
            </div>
        }
    }
}
