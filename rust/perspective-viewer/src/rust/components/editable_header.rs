use web_sys::{FocusEvent, HtmlInputElement, KeyboardEvent};
use yew::{function_component, html, Callback, Html, Properties, TargetCast};

use crate::clone;

#[derive(PartialEq, Debug, Properties)]
pub struct EditableHeaderProps {
    pub icon: Option<Html>,
    pub on_value_update: Callback<String>,
    pub editable: bool,
    pub value: String,
}

#[function_component(EditableHeader)]
pub fn editable_header(p: &EditableHeaderProps) -> Html {
    let noderef = yew::use_node_ref();
    let focused = yew::use_state(|| false);

    let onclick = yew::use_callback(noderef.clone(), |_, noderef| {
        noderef.cast::<HtmlInputElement>().unwrap().focus().unwrap();
    });
    let onfocus = yew::use_callback(focused.clone(), |_, focused| {
        focused.set(true);
    });
    let onblur = yew::use_callback(
        (focused.clone(), p.on_value_update.clone()),
        move |e: FocusEvent, (focused, on_value_update)| {
            focused.set(false);
            on_value_update.emit(e.target_unchecked_into::<HtmlInputElement>().value());
        },
    );
    let class = {
        let mut classes = vec!["sidebar_header_contents"];
        if p.editable {
            classes.push("editable");
        }
        if *focused {
            classes.push("focused");
        }
        classes.join(" ")
    };
    let onkeydown = {
        clone!(p.on_value_update);
        yew::Callback::from(move |e: KeyboardEvent| match &*e.key() {
            "Enter" | "Tab" => {
                on_value_update.emit(e.target_unchecked_into::<HtmlInputElement>().value())
            }
            _ => {}
        })
    };
    html! {
        <div
            {class}
            {onclick}
        >
            if let Some(icon) = p.icon.clone() {
                {icon}
            }
            <input
                ref={noderef}
                type="text"
                class="sidebar_header_title"
                disabled={!p.editable}
                {onblur}
                {onkeydown}
                {onfocus}
                value={p.value.clone()}
            />
        </div>
    }
}
