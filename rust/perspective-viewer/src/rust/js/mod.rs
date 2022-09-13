////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

//! - State objects
//! - Use refs
//! - Relative imports should not fork

mod clipboard;
pub mod clipboard_item;
mod mimetype;
pub mod perspective;
pub mod plugin;
pub mod resize_observer;
mod testing;

#[cfg(test)]
mod tests;

pub use self::clipboard::*;
pub use self::mimetype::*;
pub use self::perspective::*;
pub use self::plugin::*;
pub use self::resize_observer::*;
// pub use self::testing::enable_weak_link_test;

#[cfg(test)]
pub use self::testing::*;
