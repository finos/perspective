////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod copy;
mod download;
mod metadata;
mod view;
mod view_subscription;

use self::metadata::*;
use self::view::View;
pub use self::view_subscription::TableStats;
use self::view_subscription::*;
use crate::config::*;
use crate::dragdrop::*;
use crate::js::perspective::*;
use crate::js::plugin::*;
use crate::utils::*;
use crate::*;

use copy::*;
use download::*;

use futures::channel::oneshot::*;
use itertools::Itertools;
use js_intern::*;
use std::cell::{Ref, RefCell};
use std::collections::HashMap;
use std::collections::HashSet;
use std::iter::IntoIterator;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;

use yew::prelude::*;

/// The `Session` struct is the principal interface to the Perspective engine, the
/// `Table` and `View` obejcts for this viewer, and all associated state including
/// the `ViewConfig`.
#[derive(Clone, Default)]
pub struct Session(Rc<SessionHandle>);

/// Immutable state for `Session`.
#[derive(Default)]
pub struct SessionHandle {
    session_data: RefCell<SessionData>,
    pub on_update: PubSub<()>,
    pub on_table_loaded: PubSub<()>,
    pub on_view_created: PubSub<()>,
    pub on_view_config_updated: PubSub<()>,
    pub on_stats: PubSub<()>,
}

/// Mutable state for `Session`.
#[derive(Default)]
pub struct SessionData {
    table: Option<JsPerspectiveTable>,
    metadata: SessionMetadata,
    config: ViewConfig,
    view_sub: Option<ViewSubscription>,
    stats: Option<TableStats>,
}

impl Deref for Session {
    type Target = SessionHandle;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl PartialEq for Session {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl Deref for SessionHandle {
    type Target = RefCell<SessionData>;
    fn deref(&self) -> &Self::Target {
        &self.session_data
    }
}

pub type MetadataRef<'a> = std::cell::Ref<'a, SessionMetadata>;
pub type MetadataMutRef<'a> = std::cell::RefMut<'a, SessionMetadata>;

impl Session {
    pub fn metadata(&self) -> MetadataRef<'_> {
        std::cell::Ref::map(self.borrow(), |x| &x.metadata)
    }

    pub fn metadata_mut(&self) -> MetadataMutRef<'_> {
        std::cell::RefMut::map(self.borrow_mut(), |x| &mut x.metadata)
    }

    /// Reset this `Session`'s `View` state, but preserve the `Table`.
    ///
    /// # Arguments
    /// - `keep_expressions` Whether to reset the `expressions` property.
    pub fn reset(&self, reset_expressions: bool) {
        self.borrow_mut().view_sub = None;
        self.borrow_mut().config.reset(reset_expressions);
    }

    /// Reset this (presumably shared) `Session` to its initial state, returning a
    /// bool indicating whether this `Session` had a table which was deleted.
    /// TODO Table should be an immutable constructor parameter to `Session`.
    pub fn delete(&self) -> bool {
        self.reset(false);
        self.borrow_mut().metadata = SessionMetadata::default();
        self.borrow_mut().table = None;
        false
    }

    /// Reset this `Session`'s state with a new `Table`.  Implicitly clears the
    /// `ViewSubscription`, which will need to be re-initialized later via
    /// `create_view()`.
    pub async fn set_table(
        &self,
        table: JsPerspectiveTable,
    ) -> Result<JsValue, JsValue> {
        let metadata = SessionMetadata::from_table(&table).await?;
        self.borrow_mut().view_sub = None;
        self.borrow_mut().metadata = metadata;
        self.borrow_mut().table = Some(table);

        self.on_table_loaded.emit_all(());
        self.set_initial_stats().await?;
        Ok(JsValue::UNDEFINED)
    }

    pub async fn await_table(&self) -> Result<(), JsValue> {
        if self.js_get_table().is_none() {
            let (sender, receiver) = channel::<()>();
            let sender = RefCell::new(Some(sender));
            let _sub = self.on_table_loaded.add_listener(move |x| {
                sender.borrow_mut().take().unwrap().send(x).unwrap()
            });

            receiver.await.into_jserror()?;
            let _ = self
                .js_get_table()
                .ok_or_else(|| js_intern!("No table set"))?;
        }

        Ok(())
    }

    pub fn js_get_table(&self) -> Option<JsValue> {
        self.borrow()
            .table
            .clone()
            .map(|x| x.unchecked_into::<JsValue>())
    }

    pub fn js_get_view(&self) -> Option<JsValue> {
        Some(self.borrow().view_sub.as_ref()?.get_view().as_jsvalue())
    }

    pub fn is_column_expression_in_use(&self, name: &str) -> bool {
        self.borrow().config.is_column_expression_in_use(name)
    }

    pub fn create_drag_drop_update(
        &self,
        column: String,
        index: usize,
        drop: DropAction,
        drag: DragEffect,
        requirements: &ViewConfigRequirements,
    ) -> ViewConfigUpdate {
        let mut config = self.get_view_config();
        let mut update = ViewConfigUpdate::default();
        let is_to_swap = requirements.is_swap(index);
        let from_index = config
            .columns
            .iter()
            .position(|x| x.as_ref() == Some(&column));

        let is_from_required = from_index
            .and_then(|x| requirements.min.map(|z| x < z))
            .unwrap_or_default();

        let is_from_swap = from_index
            .map(|x| requirements.is_swap(x))
            .unwrap_or_default();

        let is_to_empty = config
            .columns
            .get(index)
            .map(|x| x.is_none())
            .unwrap_or_default();

        match drag {
            DragEffect::Copy => (),
            DragEffect::Move(DropAction::Active) => {
                let is_to_group_or_split =
                    matches!(drop, DropAction::GroupBy | DropAction::SplitBy);

                if ((!is_to_swap && is_from_swap)
                    || (is_to_swap && !is_from_swap && is_to_empty)
                    || is_to_group_or_split)
                    && config.columns.len() > 1
                    && !is_from_required
                {
                    // Is not a swap
                    if !is_to_swap && !is_to_group_or_split {
                        config.columns.iter_mut().for_each(|x| {
                            if x.as_ref() == Some(&column) {
                                *x = None;
                            }
                        });
                    } else {
                        config.columns.retain(|x| x.as_ref() != Some(&column));
                    }

                    update.columns = Some(config.columns.clone());
                }
            }
            DragEffect::Move(DropAction::GroupBy) => {
                config.group_by.retain(|x| x != &column);
                update.group_by = Some(config.group_by.clone());
            }
            DragEffect::Move(DropAction::SplitBy) => {
                config.split_by.retain(|x| x != &column);
                update.split_by = Some(config.split_by.clone());
            }
            DragEffect::Move(DropAction::Sort) => {
                config.sort.retain(|x| x.0 != column);
                update.sort = Some(config.sort.clone());
            }
            DragEffect::Move(DropAction::Filter) => {
                config.filter.retain(|x| x.0 != column);
                update.filter = Some(config.filter.clone());
            }
        }

        match drop {
            DropAction::Active => {
                if is_to_swap || is_from_required {
                    let column = Some(column);
                    config.columns.extend(std::iter::repeat(None).take({
                        let fill_to = requirements
                            .names
                            .as_ref()
                            .map(|x| std::cmp::max(x.len() - 1, index))
                            .unwrap_or(index);

                        if fill_to >= (config.columns.len() - 1) {
                            fill_to + 1 - config.columns.len()
                        } else {
                            0
                        }
                    }));

                    if let Some(prev) = config.columns.iter().position(|x| *x == column)
                    {
                        config.columns.swap(index, prev);
                    } else {
                        config.columns[index] = column;
                    }
                } else {
                    config.columns.retain(|x| x.as_ref() != Some(&column));
                    config.columns.extend(std::iter::repeat(None).take(
                        if index >= config.columns.len() {
                            index - config.columns.len()
                        } else {
                            0
                        },
                    ));

                    if is_to_empty {
                        config.columns[index] = Some(column)
                    } else {
                        config.columns.insert(index, Some(column));
                    }
                }

                update.columns = Some(config.columns);
            }
            DropAction::GroupBy => {
                config.group_by.retain(|x| x != &column);
                let index = std::cmp::min(index as usize, config.group_by.len());
                config.group_by.insert(index, column);
                update.group_by = Some(config.group_by);
            }
            DropAction::SplitBy => {
                config.split_by.retain(|x| x != &column);
                let index = std::cmp::min(index as usize, config.split_by.len());
                config.split_by.insert(index, column);
                update.split_by = Some(config.split_by);
            }
            DropAction::Sort => {
                let index = std::cmp::min(index as usize, config.sort.len());
                config.sort.insert(index, Sort(column, SortDir::Asc));
                update.sort = Some(config.sort);
            }
            DropAction::Filter => {
                let index = std::cmp::min(index as usize, config.filter.len());
                config.filter.insert(
                    index,
                    Filter(column, FilterOp::EQ, FilterTerm::Scalar(Scalar::Null)),
                );
                update.filter = Some(config.filter);
            }
        }

        update
    }

    /// An async task which replaces a `column` aliased expression with another.
    pub async fn create_replace_expression_update(
        &self,
        column: &str,
        expression: &JsValue,
    ) -> ViewConfigUpdate {
        let old_expression = self.metadata().get_expression_by_alias(column).unwrap();
        let new_name = self
            .get_validated_expression_name(expression)
            .await
            .unwrap();

        let expression = expression.as_string().unwrap();
        let ViewConfig {
            columns,
            expressions,
            group_by,
            split_by,
            sort,
            filter,
            aggregates,
            ..
        } = self.get_view_config();

        let expressions = expressions
            .into_iter()
            .map(|x| {
                if x == old_expression {
                    expression.clone()
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        let aggregates = aggregates
            .into_iter()
            .map(|x| {
                if x.0 == old_expression {
                    (expression.clone(), x.1)
                } else {
                    x
                }
            })
            .collect::<HashMap<_, _>>();

        let columns = columns
            .into_iter()
            .map(|x| match x {
                Some(x) if x == column => Some(new_name.clone()),
                x => x,
            })
            .collect::<Vec<_>>();

        let group_by = group_by
            .into_iter()
            .map(|x| if x == column { new_name.clone() } else { x })
            .collect::<Vec<_>>();

        let split_by = split_by
            .into_iter()
            .map(|x| if x == column { new_name.clone() } else { x })
            .collect::<Vec<_>>();

        let sort = sort
            .into_iter()
            .map(|x| {
                if x.0 == column {
                    Sort(new_name.clone(), x.1)
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        // TODO expression editing can change type, which may invalidate filters
        let filter = filter
            .into_iter()
            .map(|x| {
                if x.0 == column {
                    Filter(new_name.clone(), x.1, x.2)
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        ViewConfigUpdate {
            columns: Some(columns),
            aggregates: Some(aggregates),
            expressions: Some(expressions),
            group_by: Some(group_by),
            split_by: Some(split_by),
            sort: Some(sort),
            filter: Some(filter),
        }
    }

    async fn get_validated_expression_name(
        &self,
        expr: &JsValue,
    ) -> Result<String, JsValue> {
        let arr = [expr].iter().collect::<js_sys::Array>();
        let table = self.borrow().table.as_ref().unwrap().clone();
        let schema = table.validate_expressions(arr).await?.expression_schema();
        let schema_keys = js_sys::Object::keys(&schema);
        schema_keys.get(0).as_string().into_jserror()
    }

    /// Validate an expression string (as a JsValue since it comes from `monaco`),
    /// and marshall the results.
    pub async fn validate_expr(
        &self,
        expr: JsValue,
    ) -> Result<Option<PerspectiveValidationError>, JsValue> {
        let arr = [expr].iter().collect::<js_sys::Array>();
        let table = self.borrow().table.as_ref().unwrap().clone();
        let errors = table.validate_expressions(arr).await?.errors();
        let error_keys = js_sys::Object::keys(&errors);
        if error_keys.length() > 0 {
            let js_err = js_sys::Reflect::get(&errors, &error_keys.get(0))?;
            Ok(Some(js_err.into_serde().unwrap()))
        } else {
            Ok(None)
        }
    }

    pub async fn copy_to_clipboard(self, flat: bool) -> Result<(), JsValue> {
        if flat {
            let table = self.borrow().table.clone();
            if let Some(table) = table {
                copy_flat(&table).await?;
            }
        } else {
            let view = self
                .borrow()
                .view_sub
                .as_ref()
                .map(|x| x.get_view().clone());

            if let Some(view) = view {
                copy(&view).await?;
            }
        };

        Ok(())
    }

    pub async fn download_as_csv(self, flat: bool) -> Result<(), JsValue> {
        if flat {
            let table = self.borrow().table.clone();
            if let Some(table) = table {
                download_flat(&table).await?;
            }
        } else {
            let view = self
                .borrow()
                .view_sub
                .as_ref()
                .map(|x| x.get_view().clone());

            if let Some(view) = view {
                download(&view).await?;
            }
        };

        Ok(())
    }

    pub fn get_view(&self) -> Option<View> {
        self.borrow()
            .view_sub
            .as_ref()
            .map(|sub| sub.get_view().clone())
    }

    pub fn get_table_stats(&self) -> Option<TableStats> {
        self.borrow().stats.clone()
    }

    /// TODO view_config could be a ref
    pub fn get_view_config(&self) -> ViewConfig {
        self.borrow().config.clone()
    }

    pub fn borrow_view_config(&self) -> Ref<ViewConfig> {
        Ref::map(self.borrow(), |x| &x.config)
    }

    /// Get all unique column values for a given column name.
    ///
    /// Use the `.to_csv()` method, as I suspected copying this large string once
    /// was more efficient than copying many smaller strings, and string copying
    /// shows up frequently when doing performance analysis.
    ///
    /// TODO Does not work with expressions yet.
    ///
    /// # Arguments
    /// - `column` The name of the column (or expression).
    pub async fn get_column_values(
        &self,
        column: String,
    ) -> Result<Vec<String>, JsValue> {
        let expressions = self.borrow().config.expressions.clone();
        let config = ViewConfig {
            group_by: vec![column],
            columns: vec![],
            expressions,
            ..ViewConfig::default()
        };

        let js_config = config.as_jsvalue()?;
        let table = self.borrow().table.clone().unwrap();
        let view = table.view(&js_config).await?;
        let csv = view
            .to_csv(js_object!())
            .await?
            .as_string()
            .ok_or_else(|| JsValue::from("Bad CSV"))?;

        let _ = future_to_promise(async move {
            view.delete().await?;
            Ok(JsValue::UNDEFINED)
        });

        Ok(csv
            .lines()
            .map(|x| {
                if x.len() > 1 {
                    str::replace(&x[1..x.len() - 1], "\"\"", "\"")
                } else {
                    x.to_owned()
                }
            })
            .skip(2)
            .collect::<Vec<String>>())
    }
}

impl Session {
    pub fn set_update_column_defaults(
        &self,
        config_update: &mut ViewConfigUpdate,
        requirements: &ViewConfigRequirements,
    ) {
        if let (
            None,
            ViewConfigRequirements {
                min: Some(min_cols),
                names,
                ..
            },
        ) = (&config_update.columns, &requirements)
        {
            // first try to take 2 numeric columns from existing config
            let numeric_config_columns = self
                .borrow()
                .config
                .columns
                .iter()
                .flatten()
                .filter(|x| {
                    matches!(
                        self.metadata().get_column_table_type(x),
                        Some(Type::Float) | Some(Type::Integer)
                    )
                })
                .take(*min_cols)
                .cloned()
                .map(Some)
                .collect::<Vec<_>>();

            if numeric_config_columns.len() == *min_cols {
                config_update.columns = Some(
                    numeric_config_columns
                        .into_iter()
                        .pad_using(names.as_ref().map_or(0, |x| x.len()), |_| None)
                        .collect::<Vec<_>>(),
                );
            } else {
                // Append numeric columns from all columns and try again
                let config_columns = numeric_config_columns
                    .clone()
                    .into_iter()
                    .chain(
                        self.metadata()
                            .get_table_columns()
                            .into_iter()
                            .flatten()
                            .filter(|x| {
                                !numeric_config_columns
                                    .iter()
                                    .any(|y| y.as_ref().map_or(false, |z| z == *x))
                            })
                            .filter(|x| {
                                matches!(
                                    self.metadata().get_column_table_type(x),
                                    Some(Type::Float) | Some(Type::Integer)
                                )
                            })
                            .cloned()
                            .map(Some),
                    )
                    .take(*min_cols)
                    .collect::<Vec<_>>();

                if config_columns.len() == *min_cols {
                    config_update.columns = Some(
                        config_columns
                            .into_iter()
                            .pad_using(names.as_ref().map_or(0, |x| x.len()), |_| None)
                            .collect::<Vec<_>>(),
                    );
                } else {
                    config_update.columns = Some(
                        self.metadata()
                            .get_table_columns()
                            .into_iter()
                            .flatten()
                            .take(*min_cols)
                            .cloned()
                            .map(Some)
                            .collect::<Vec<_>>(),
                    );
                }
            }
        } else if config_update.columns.is_none() {
            let mut columns = self.borrow().config.columns.clone();
            let initial_len = columns.len();
            if let Some(last_filled) = columns.iter().rposition(|x| x.is_some()) {
                columns.truncate(last_filled + 1);
                if let ViewConfigRequirements {
                    names: Some(names), ..
                } = &requirements
                {
                    columns = columns
                        .into_iter()
                        .enumerate()
                        .filter(|(idx, x)| *idx < names.len() || x.is_some())
                        .map(|(_, x)| x)
                        .pad_using(names.len(), |_| None)
                        .collect::<Vec<_>>();
                } else {
                    columns = columns
                        .into_iter()
                        .filter(|x| x.is_some())
                        .collect::<Vec<_>>();
                }

                if initial_len != columns.len() {
                    config_update.columns = Some(columns);
                }
            }
        }
    }

    /// Update the config, setting the `columns` property to the plugin defaults if
    /// provided.
    pub fn update_view_config(&self, config_update: ViewConfigUpdate) {
        self.borrow_mut().view_sub = None;
        self.borrow_mut().config.apply_update(config_update);
        self.on_view_config_updated.emit_all(());
    }

    /// In order to create a new view in this session, the session must first be
    /// validated to create a `ValidSession<'_>` guard.
    pub async fn validate(&self) -> ValidSession<'_> {
        if let Err(err) = self.validate_view_config().await {
            web_sys::console::error_3(
                &"Invalid config, resetting to default".into(),
                &JsValue::from_serde(&self.borrow().config).unwrap(),
                &err,
            );

            self.reset(true);
            self.validate_view_config().await.unwrap();
        }

        ValidSession(self)
    }
}

/// A newtype wrapper which only provides `create_view()`
pub struct ValidSession<'a>(&'a Session);

impl<'a> ValidSession<'a> {
    /// Set a new `View` (derived from this `Session`'s `Table`), and create the
    /// `update()` subscription, consuming this `ValidSession<'_>` and returning
    /// the original `&Session`.
    pub async fn create_view(&self) -> Result<&'a Session, JsValue> {
        let js_config = self.0.borrow().config.as_jsvalue()?;
        let table = self
            .0
            .borrow()
            .table
            .clone()
            .ok_or("`restore()` called before `load()`")?;

        let view = table.view(&js_config).await?;
        let view_schema = view.schema().await?;
        self.0.metadata_mut().update_view_schema(&view_schema)?;

        let on_stats = Callback::from({
            let this = self.0.clone();
            move |stats| this.update_stats(stats)
        });

        let sub = {
            let config = self.0.borrow().config.clone();
            let on_update = self.0.on_update.callback();
            ViewSubscription::new(table, view, config, on_stats, on_update)
        };

        // self.0.borrow_mut().metadata.as_mut().unwrap().view_schema = Some(view_schema);
        self.0.borrow_mut().view_sub = Some(sub);
        Ok(self.0)
    }
}

impl<'a> Drop for ValidSession<'a> {
    /// `ValidSession` is a guard for listeners of the `view_created` pubsub
    /// event.
    fn drop(&mut self) {
        self.0.on_view_created.emit_all(());
    }
}

impl Session {
    pub fn reset_stats(&self) {
        self.update_stats(TableStats::default());
    }

    /// Update the this `Session`'s `TableStats` data from the `Table`.
    async fn set_initial_stats(&self) -> Result<JsValue, JsValue> {
        let table = self.borrow().table.clone();
        let num_rows = table.unwrap().size().await? as u32;
        let stats = TableStats {
            is_pivot: false,
            num_rows: Some(num_rows),
            virtual_rows: None,
        };

        self.update_stats(stats);
        Ok(JsValue::UNDEFINED)
    }

    #[cfg(test)]
    pub fn set_stats(&self, stats: TableStats) {
        self.update_stats(stats)
    }

    fn update_stats(&self, stats: TableStats) {
        self.borrow_mut().stats = Some(stats);
        self.on_stats.emit_all(());
    }

    async fn validate_view_config(&self) -> Result<(), JsValue> {
        let config = self.borrow().config.clone();
        let table_columns = self
            .metadata()
            .get_table_columns()
            .into_iter()
            .flatten()
            .cloned()
            .collect::<Vec<String>>();

        let all_columns: HashSet<String> = table_columns.iter().cloned().collect();

        let mut view_columns: HashSet<&str> = HashSet::new();

        let table = self
            .borrow()
            .table
            .as_ref()
            .ok_or("`restore()` called before `load()`")?
            .clone();

        let arr = config
            .expressions
            .iter()
            .map(JsValue::from)
            .collect::<js_sys::Array>();

        let valid_recs = table.validate_expressions(arr).await?;
        let expression_names = self.metadata_mut().update_expressions(&valid_recs)?;

        // re-fetch config after `await`; `expressions` and `all_columns` are ok,
        // but `config` may have changed as it is unlocked.
        let mut config = self.borrow().config.clone();

        if config.columns.is_empty() {
            config.columns = table_columns.into_iter().map(Some).collect();
        }

        for column in config.columns.iter().flatten() {
            if all_columns.contains(column) || expression_names.contains(column) {
                view_columns.insert(column);
            } else {
                return Err(format!("Unknown \"{}\" in `columns`", column).into());
            }
        }

        for column in config.group_by.iter() {
            if all_columns.contains(column) || expression_names.contains(column) {
                view_columns.insert(column);
            } else {
                return Err(format!("Unknown \"{}\" in `group_by`", column).into());
            }
        }

        for column in config.split_by.iter() {
            if all_columns.contains(column) || expression_names.contains(column) {
                view_columns.insert(column);
            } else {
                return Err(format!("Unknown \"{}\" in `split_by`", column).into());
            }
        }

        for sort in config.sort.iter() {
            if all_columns.contains(&sort.0) || expression_names.contains(&sort.0) {
                view_columns.insert(&sort.0);
            } else {
                return Err(format!("Unknown \"{}\" in `sort`", sort.0).into());
            }
        }

        for filter in config.filter.iter() {
            if all_columns.contains(&filter.0) || expression_names.contains(&filter.0) {
                view_columns.insert(&filter.0);
            } else {
                return Err(format!("Unknown \"{}\" in `filter`", &filter.0).into());
            }
        }

        config
            .aggregates
            .retain(|column, _| view_columns.contains(column.as_str()));

        self.borrow_mut().config = config;
        Ok(())
    }
}
