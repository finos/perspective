////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

//! `components` contains all Yew `Component` types, but only exports the 4 necessary
//! for public Custom Elements.  The rest are internal components of these 4.

pub mod column_style;
pub mod expression_editor;
pub mod filter_dropdown;
pub mod viewer;

mod active_column;
mod aggregate_selector;
mod column_selector;
mod config_selector;
mod containers;
mod expression_toolbar;
mod filter_item;
mod font_loader;
mod inactive_column;
mod pivot_item;
mod plugin_selector;
mod render_warning;
mod sort_item;
mod status_bar;
mod status_bar_counter;

#[cfg(test)]
mod tests;
