use js_sys::Number;
use tracing::Event;
use web_sys::InputEvent;
use yew::{html, Component, Properties};

use crate::components::containers::select::{Select, SelectItem};
use crate::components::form::optional_field::OptionalField;
use crate::config::{
    self, CompactDisplay, CurrencyNumberFormatStyle, CustomNumberStringFormat, NumberFormatStyle,
    Unit, UnitNumberFormatStyle,
};

#[derive(Properties, PartialEq, Clone)]
pub struct CustomNumberFormatProps {}

pub enum CustomNumberFormatMsg {
    StyleChanged(NumberStyle),
    NotationChanged(Option<Notation>),
}

#[derive(Default)]
pub struct CustomNumberFormat {
    config: CustomNumberStringFormat,
    style: NumberStyle,
    // currency: CurrencyNumberFormatStyle,
    notation: Notation,
}
impl Component for CustomNumberFormat {
    type Message = CustomNumberFormatMsg;
    type Properties = CustomNumberFormatProps;

    fn create(ctx: &yew::prelude::Context<Self>) -> Self {
        Self::default()
    }

    fn update(&mut self, ctx: &yew::prelude::Context<Self>, msg: Self::Message) -> bool {
        match msg {
            CustomNumberFormatMsg::StyleChanged(style) => {
                let new_style = match style {
                    NumberStyle::Decimal => NumberFormatStyle::Decimal,
                    NumberStyle::Percent => NumberFormatStyle::Percent,
                    NumberStyle::Currency => {
                        NumberFormatStyle::Currency(CurrencyNumberFormatStyle::default())
                    },
                    NumberStyle::Unit => NumberFormatStyle::Unit(UnitNumberFormatStyle {
                        unit: Unit::Todo,
                        unit_display: None,
                    }),
                };
                self.config._style = Some(new_style);
                true
            },
            CustomNumberFormatMsg::NotationChanged(notation) => {
                self.config._notation = notation.map(|notation| match notation {
                    Notation::Standard => config::Notation::Standard,
                    Notation::Scientific => config::Notation::Scientific,
                    Notation::Engineering => config::Notation::Engineering,
                    Notation::Compact => config::Notation::Compact(CompactDisplay::default()),
                });
                if let Some(notation) = notation {
                    self.notation = notation;
                }
                true
            },
        }
    }

    fn view(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        html! {
            <>{ self.style_section(ctx) }{ self.digits_section(ctx) }{ self.misc_section(ctx) }</>
        }
    }
}

impl CustomNumberFormat {
    fn style_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let section = match self.config._style {
            Some(NumberFormatStyle::Currency(_)) => Some(html! { { "CURRENCY" } }),
            Some(NumberFormatStyle::Unit(_)) => Some(html! { { "UNIT" } }),
            _ => None,
        };
        html! {
            <>
                <div class="column-style-label"><label class="indent">{ "Style" }</label></div>
                <Select<NumberStyle>
                    values={NumberStyle::values()}
                    selected={self.style}
                    on_select={ctx.link().callback(CustomNumberFormatMsg::StyleChanged)}
                />
                { section }
            </>
        }
    }

    fn digits_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        html! { { "TODO" } }
    }

    fn misc_section(&self, ctx: &yew::prelude::Context<Self>) -> yew::prelude::Html {
        let compact_display_checkbox =
            if let Some(config::Notation::Compact(val)) = self.config._notation.as_ref() {
                Some(html! {})
            } else {
                None
            };

        html! {
            <>
                <OptionalField
                    label="Notation"
                    on_check={ctx.link().callback(|_| {CustomNumberFormatMsg::NotationChanged(None)})}
                    checked={self.config._notation.is_some()}
                >
                    <Select<Notation>
                        values={Notation::values()}
                        selected={self.notation}
                        on_select={ctx.link().callback(|notation| CustomNumberFormatMsg::NotationChanged(Some(notation)))}
                    />
                </OptionalField>
            </>
        }
    }
}

#[derive(Clone, PartialEq, Debug, Copy, Default)]
enum NumberStyle {
    #[default]
    Decimal,
    Percent,
    Currency,
    Unit,
}
impl std::fmt::Display for NumberStyle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("{self:?}"))
    }
}
impl NumberStyle {
    fn values() -> Vec<SelectItem<Self>> {
        vec![
            SelectItem::Option(Self::Decimal),
            SelectItem::Option(Self::Percent),
            SelectItem::Option(Self::Currency),
            SelectItem::Option(Self::Unit),
        ]
    }
}

#[derive(Clone, PartialEq, Debug, Copy, Default)]
enum Notation {
    #[default]
    Standard,
    Scientific,
    Engineering,
    Compact,
}
impl std::fmt::Display for Notation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!("{self:?}"))
    }
}
impl Notation {
    fn values() -> Vec<SelectItem<Self>> {
        vec![
            SelectItem::Option(Self::Standard),
            SelectItem::Option(Self::Scientific),
            SelectItem::Option(Self::Engineering),
            SelectItem::Option(Self::Compact),
        ]
    }
}
