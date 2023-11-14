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

//! Here lies Perspective's attempt to avoid a monolithic Application State
//! object.  The major components which hold `PerspectiveViewer`-scoped state
//! are broken up roughly by some single resource responsibility -
//!
//! - `Session` manages the `@finos/perspective` engine `Table` and `View`
//!   objects, plus caches some related metadata `Schema`.
//! - `Renderer` manages the JavaScript Custom Element plugin.
//! - .. etc.
//!
//! For complex tasks which involve overlapping state/coordination between >1 of
//! these Application State objects, Perspective uses a set of respective `Has*`
//! traits, (e.g. `HasSession`), to provide extra functions for object which
//! implement more than one such trait.  These can be conveniently derived by
//! consistently naming the application state object clones when used as struct
//! fields, then applying the `derive_model!()` macro for the state object you
//! wish to expose.
//!
//! # Examples
//!
//! ```rust
//! struct A {
//!     session: Session,
//! }
//!
//! struct B {
//!     renderer: Renderer,
//! }
//!
//! struct C {
//!     session: Session,
//!     renderer: Renderer,
//! }
//!
//! derive_model!(Session for A);
//! derive_model!(Renderer for B);
//! derive_model!(Session, Renderer for C);
//!
//! trait SessionRenderModel: HasSession + HasRenderer {
//!     fn render_session_now(&self) {
//!         // Do some thing that requires `.session()` and `.renderer()`
//!     }
//! }
//!
//! impl<T: HasSession + HasRenderer> SessionRenderModel for T {}
//!
//! fn test(session: Session, renderer: Renderer) {
//!     // Type errors
//!     (A { session }).render_session_now();
//!     (B { renderer }).render_session_now();
//!
//!     // The method exists only when both state object clones exist
//!     (C { session, renderer }).render_session_now();
//! }
//! ```

mod columns_iter_set;
mod copy_export;
mod edit_expression;
mod export_app;
mod export_method;
mod get_viewer_config;
mod intersection_observer;
mod is_invalid_drop;
mod plugin_config;
mod resize_observer;
mod structural;
mod update_and_render;

pub use self::columns_iter_set::*;
pub use self::copy_export::*;
pub use self::edit_expression::*;
pub use self::export_method::*;
pub use self::get_viewer_config::*;
pub use self::intersection_observer::*;
pub use self::is_invalid_drop::*;
pub use self::plugin_config::*;
pub use self::resize_observer::*;
pub use self::structural::*;
pub use self::update_and_render::*;
