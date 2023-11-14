use yew::html::IntoPropValue;
use yew::{classes, function_component, html, Properties};

use crate::components::style::LocalStyle;
use crate::config::Type;
use crate::{css, html_template};

#[derive(PartialEq, Debug)]
pub enum TypeIconType {
    Type(Type),
    Expr,
}
impl From<Type> for TypeIconType {
    fn from(value: Type) -> Self {
        Self::Type(value)
    }
}
impl IntoPropValue<TypeIconType> for Type {
    fn into_prop_value(self) -> TypeIconType {
        TypeIconType::Type(self)
    }
}
impl std::fmt::Display for TypeIconType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TypeIconType::Type(t) => f.write_fmt(format_args!("{t}")),
            TypeIconType::Expr => f.write_str("expression"),
        }
    }
}

#[derive(PartialEq, Properties, Debug)]
pub struct TypeIconProps {
    pub ty: TypeIconType,
    #[prop_or_default]
    pub style: String,
}

#[function_component(TypeIcon)]
pub fn type_icon(p: &TypeIconProps) -> yew::Html {
    html_template! {
        <LocalStyle href={css!("type-icon")} />
        <span
            class={classes!(p.ty.to_string(), "type-icon")}
            style={p.style.clone()}
        ></span>
    }
}
