// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

use perspective_client::config::ViewConfigUpdate;
use web_sys::*;
use yew::prelude::*;

use crate::model::UpdateAndRender;
use crate::renderer::*;
use crate::session::*;
use crate::utils::*;
use crate::*;

#[derive(Clone, Default, Debug, PartialEq)]
enum StatusIconState {
    Loading,
    Updating(u32),
    Errored(String),
    Normal,

    #[default]
    Unititialized,
}

#[derive(Clone, Debug)]
enum StatusIconStateAction {
    Increment,
    Decrement,
    Load(Option<ViewStats>),
    SetError(Option<String>),
}

impl Reducible for StatusIconState {
    type Action = StatusIconStateAction;

    fn reduce(self: std::rc::Rc<Self>, action: Self::Action) -> std::rc::Rc<Self> {
        let new_status = match (&*self, action.clone()) {
            (StatusIconState::Updating(x), StatusIconStateAction::Increment) => {
                Self::Updating(x + 1)
            },
            (StatusIconState::Updating(x), StatusIconStateAction::Decrement) if *x > 1 => {
                Self::Updating(x - 1)
            },
            (_, StatusIconStateAction::Load(stats)) => {
                if stats.and_then(|x| x.num_table_cells).is_some() {
                    StatusIconState::Normal
                } else {
                    Self::Loading
                }
            },
            (_, StatusIconStateAction::SetError(Some(e))) => Self::Errored(e),
            (
                StatusIconState::Loading,
                StatusIconStateAction::Increment | StatusIconStateAction::Decrement,
            ) => StatusIconState::Loading,
            (_, StatusIconStateAction::Increment) => Self::Updating(1),
            (_, StatusIconStateAction::Decrement | StatusIconStateAction::SetError(None)) => {
                StatusIconState::Normal
            },
        };

        new_status.into()
    }
}

#[extend::ext]
impl<T: Reducible + 'static> UseReducerDispatcher<T> {
    fn callback<U>(&self, action: impl Fn(U) -> T::Action + 'static) -> Callback<U> {
        let dispatcher = self.clone();
        Callback::from(move |event| dispatcher.dispatch(action(event)))
    }
}

#[derive(Clone, Properties, PartialEq)]
pub struct StatusIndicatorProps {
    pub session: Session,
    pub renderer: Renderer,
}

derive_model!(Session, Renderer for StatusIndicatorProps);

/// An indicator component which displays the current status of the perspective
/// server as an icon. This indicator also functions as a button to invoke the
/// reconnect callback when in an error state.
#[function_component]
pub fn StatusIndicator(props: &StatusIndicatorProps) -> Html {
    let state = use_reducer_eq(|| {
        if let Some(err) = props.session.get_error() {
            StatusIconState::Errored(err)
        } else {
            StatusIconState::Normal
        }
    });

    use_effect_with(
        (props.session.clone(), state.dispatcher()),
        |(session, set_state)| {
            let subs = [
                session
                    .table_errored
                    .add_listener(set_state.callback(StatusIconStateAction::SetError)),
                session
                    .stats_changed
                    .add_listener(set_state.callback(StatusIconStateAction::Load)),
                session
                    .view_config_changed
                    .add_listener(set_state.callback(|_| StatusIconStateAction::Increment)),
                session
                    .view_created
                    .add_listener(set_state.callback(|_| StatusIconStateAction::Decrement)),
            ];

            move || drop(subs)
        },
    );

    let onclick = use_async_callback(
        (props.clone(), state.clone()),
        async move |_: MouseEvent, (props, state)| {
            if let StatusIconState::Errored(_) = &**state {
                props.session.reconnect().await?;
                let cfg = ViewConfigUpdate::default();
                props.update_and_render(cfg)?.await?;
            }

            Ok::<_, ApiError>(())
        },
    );

    let class_name = match (&*state, props.session.is_reconnect()) {
        (StatusIconState::Errored(_), true) => "errored",
        (StatusIconState::Errored(_), false) => "errored disabled",
        (StatusIconState::Normal, _) => "connected",
        (StatusIconState::Updating(_), _) => "updating",
        (StatusIconState::Loading, _) => "loading",
        (StatusIconState::Unititialized, _) => "uninitialized",
    };

    html! {
        <>
            <div class="section">
                <div id="status_reconnect" class={class_name} {onclick}>
                    <span id="status" class={class_name} />
                    <span id="status_updating" class={class_name} />
                </div>
            </div>
            if let StatusIconState::Errored(err) = &*state {
                <span class="error-dialog">{ err }</span>
            }
        </>
    }
}
