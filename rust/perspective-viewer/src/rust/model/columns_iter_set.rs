////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::dragdrop::*;
use crate::renderer::*;
use crate::session::*;
use crate::*;
use itertools::Itertools;
use std::collections::HashSet;

/// The possible states of a column (row) in the active columns list, including the
/// `Option<String>` label type.
#[derive(Clone, PartialEq)]
pub enum ActiveColumnState {
    Column(Label, String),
    Required(Label),
    DragOver(Label),
}

type Label = Option<String>;

/// Encapsulates the logic of determining which columns go in the "Active" and
/// "Inactive" column sections of the `ColumnSelector` component, via the
/// iterator returning functions `active()`, `inactive()` and `expression()`.
pub struct ColumnsIteratorSet<'a> {
    config: &'a ViewConfig,
    session: &'a Session,
    renderer: &'a Renderer,
    metadata: MetadataRef<'a>,
    is_dragover_column: Option<(usize, String)>,
}

impl<'a> ColumnsIteratorSet<'a> {
    pub fn new(
        config: &'a ViewConfig,
        session: &'a Session,
        renderer: &'a Renderer,
        dragdrop: &DragDrop,
    ) -> ColumnsIteratorSet<'a> {
        let is_dragover_column = dragdrop.is_dragover(DropAction::Active);
        ColumnsIteratorSet {
            config,
            session,
            renderer,
            metadata: session.metadata(),
            is_dragover_column,
        }
    }

    /// Generate an iterator for active columns, which are represented as `Option`
    /// for dragover and missing columns.
    pub fn active(&'a self) -> impl Iterator<Item = ActiveColumnState> + 'a {
        let min_cols = self
            .renderer
            .metadata()
            .names
            .as_ref()
            .map_or(0, |x| x.len());

        match &self.is_dragover_column {
            Some((to_index, from_column)) => {
                let is_to_swap = self.renderer.metadata().is_swap(*to_index);
                let to_column = self.config.columns.get(*to_index);
                let is_to_empty = to_column.map(|x| x.is_none()).unwrap_or_default();
                let is_from_required = self
                    .config
                    .columns
                    .iter()
                    .position(|x| x.as_ref() == Some(from_column))
                    .and_then(|x| self.renderer.metadata().min.map(|y| x < y))
                    .unwrap_or_default();

                let is_from_swap = self
                    .config
                    .columns
                    .iter()
                    .position(|x| x.as_ref() == Some(from_column))
                    .map(|x| self.renderer.metadata().is_swap(x))
                    .unwrap_or_default();

                if is_to_swap || is_from_required {
                    let all_columns =
                        self.config.columns.iter().filter_map(move |x| match x {
                            Some(x) if x == from_column => {
                                if is_to_empty && !is_from_swap {
                                    None
                                } else {
                                    Some(to_column.unwrap_or(&None))
                                }
                            }
                            x => Some(x),
                        });

                    let before_cols = all_columns
                        .clone()
                        .pad_using(min_cols, |_| &None)
                        .take(*to_index)
                        .map(Some);

                    let after_cols = all_columns.skip(*to_index + 1).map(Some);
                    self.to_active_column_state(Box::new(
                        before_cols.chain([None].iter().cloned()).chain(after_cols),
                    ))
                } else {
                    let to_offset = match to_column {
                        Some(Some(_)) => *to_index,
                        _ => *to_index + 1,
                    };

                    let all_columns =
                        self.config.columns.iter().filter_map(move |x| match x {
                            Some(x) if x == from_column => {
                                if !is_from_swap {
                                    None
                                } else {
                                    Some(&None)
                                }
                            }
                            x => Some(x),
                        });

                    let before_cols = all_columns
                        .clone()
                        .pad_using(min_cols, |_| &None)
                        .take(*to_index)
                        .map(Some);

                    let after_cols = all_columns.skip(to_offset).map(Some);
                    self.to_active_column_state(Box::new(
                        before_cols.chain([None].iter().cloned()).chain(after_cols),
                    ))
                }
            }
            _ => self
                .to_active_column_state(Box::new(self.config.columns.iter().map(Some))),
        }
    }

    fn to_active_column_state(
        &self,
        iter: Box<dyn Iterator<Item = Option<&'a Option<String>>> + 'a>,
    ) -> impl Iterator<Item = ActiveColumnState> + 'a {
        let named_columns = self
            .renderer
            .metadata()
            .names
            .clone()
            .unwrap_or_else(std::vec::Vec::new);

        iter.pad_using(named_columns.len(), |_| Some(&None))
            .enumerate()
            .map(move |(idx, x)| {
                let label = named_columns.get(idx).cloned();
                match x {
                    Some(None) => ActiveColumnState::Required(label),
                    None => ActiveColumnState::DragOver(label),
                    Some(Some(x)) => ActiveColumnState::Column(label, x.to_owned()),
                }
            })
    }

    /// Generate an iterator for inactive expressions.
    pub fn expression(&'a self) -> impl Iterator<Item = OrderedColumn<'a>> {
        self.order_columns(self.metadata.get_expression_columns())
    }

    /// Generate an iterator for inactive columns, which also shows the columns in
    /// sorted order by type, then name.
    pub fn inactive(&'a self) -> impl Iterator<Item = OrderedColumn<'a>> {
        self.order_columns(self.metadata.get_table_columns().into_iter().flatten())
    }

    fn order_columns(
        &'a self,
        values: impl Iterator<Item = &'a String>,
    ) -> impl Iterator<Item = OrderedColumn<'a>> {
        let is_drag_active = maybe! {
            let dragover_col = self.is_dragover_column.as_ref();
            let cols = &self.config.columns;
            let (_, drag_name) = dragover_col?;
            let is_drag_active = cols.iter().flatten().any(|x| x == drag_name);
            Some(is_drag_active)
        };

        let col_set = self.config.columns.iter().collect::<HashSet<_>>();

        let mut filtered = values
            .filter_map(move |name| {
                self.to_ordered_column(name, is_drag_active, &col_set)
            })
            .collect::<Vec<_>>();

        filtered.sort();
        filtered.into_iter()
    }

    /// Convert a column `name` into an `OrderedColumn` based on whether it is
    /// active or in a drag state where an immediate drop would make it active.
    fn to_ordered_column(
        &'a self,
        name: &'a str,
        is_drag_active: Option<bool>,
        col_set: &HashSet<&Option<String>>,
    ) -> Option<OrderedColumn<'a>> {
        let dragover_col = self.is_dragover_column.as_ref();
        let cols = &self.config.columns;
        let is_active = col_set.contains(&Some(name.to_string())); // cols.iter().flatten().any(|x| x == name);
        let is_swap_over = maybe! {
            let (drop_index, _) = dragover_col?;
            let is_swap = self.renderer.metadata().is_swap(*drop_index);
            let is_over = cols.get(*drop_index)?.as_ref()? == name;
            Some(is_swap && is_over && !is_drag_active?)
        };

        if !is_active || is_swap_over.unwrap_or_default() {
            let col_type = self.session.metadata().get_column_table_type(name)?;
            let is_visible = !dragover_col.map_or(false, |(_, x)| x == name);
            Some(OrderedColumn {
                is_visible,
                name,
                col_type,
            })
        } else {
            None
        }
    }
}

pub struct OrderedColumn<'a> {
    pub is_visible: bool,
    pub name: &'a str,
    col_type: Type,
}

impl<'a> PartialEq for OrderedColumn<'a> {
    fn eq(&self, rhs: &OrderedColumn<'a>) -> bool {
        self.col_type == rhs.col_type && self.name == rhs.name
    }
}

impl<'a> Eq for OrderedColumn<'a> {}

impl<'a> PartialOrd for OrderedColumn<'a> {
    fn partial_cmp(&self, rhs: &OrderedColumn<'a>) -> Option<std::cmp::Ordering> {
        Some(self.cmp(rhs))
    }
}

impl<'a> Ord for OrderedColumn<'a> {
    fn cmp(&self, rhs: &OrderedColumn<'a>) -> std::cmp::Ordering {
        self.col_type
            .cmp(&rhs.col_type)
            .then(self.name.cmp(rhs.name))
    }
}
