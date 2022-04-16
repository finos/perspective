////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

//! A collection of (de-)serializable structs which capture the application
//! state, suitable for persistence, history, etc. features.

mod aggregates;
mod column_type;
mod filters;
mod sort;
mod view_config;
mod viewer_config;

pub use aggregates::*;
pub use column_type::*;
pub use filters::*;
pub use sort::*;
pub use view_config::*;
pub use viewer_config::*;
