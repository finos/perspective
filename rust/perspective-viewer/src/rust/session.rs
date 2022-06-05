////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

mod column_defaults_update;
mod drag_drop_update;
mod metadata;
mod replace_expression_update;
mod view;
mod view_subscription;

use self::metadata::*;
use self::view::PerspectiveOwned;
use self::view::View;
pub use self::view_subscription::TableStats;
use self::view_subscription::*;
use crate::config::*;
use crate::dragdrop::*;
use crate::js::perspective::*;
use crate::js::plugin::*;
use crate::utils::*;
use crate::*;

use js_intern::*;
use std::cell::{Ref, RefCell};
use std::collections::HashSet;
use std::iter::IntoIterator;
use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use yew::prelude::*;

/// The `Session` struct is the principal interface to the Perspective engine,
/// the `Table` and `View` objects for this viewer, and all associated state
/// including the `ViewConfig`.
#[derive(Clone, Default)]
pub struct Session(Rc<SessionHandle>);

/// Immutable state for `Session`.
#[derive(Default)]
pub struct SessionHandle {
    session_data: RefCell<SessionData>,
    pub table_updated: PubSub<()>,
    pub table_loaded: PubSub<()>,
    pub view_created: PubSub<()>,
    pub view_config_changed: PubSub<()>,
    pub stats_changed: PubSub<()>,
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

    /// Reset this (presumably shared) `Session` to its initial state, returning
    /// a bool indicating whether this `Session` had a table which was
    /// deleted. TODO Table should be an immutable constructor parameter to
    /// `Session`.
    pub fn delete(&self) -> bool {
        self.reset(false);
        self.borrow_mut().metadata = SessionMetadata::default();
        self.borrow_mut().table = None;
        false
    }

    pub fn get_table(&self) -> Option<JsPerspectiveTable> {
        self.borrow().table.clone()
    }

    /// Reset this `Session`'s state with a new `Table`.  Implicitly clears the
    /// `ViewSubscription`, which will need to be re-initialized later via
    /// `create_view()`.
    pub async fn set_table(&self, table: JsPerspectiveTable) -> Result<JsValue, JsValue> {
        let metadata = SessionMetadata::from_table(&table).await?;
        self.borrow_mut().view_sub = None;
        self.borrow_mut().metadata = metadata;
        self.borrow_mut().table = Some(table);
        self.table_loaded.emit_all(());
        self.set_initial_stats().await
    }

    pub async fn await_table(&self) -> Result<(), JsValue> {
        if self.js_get_table().is_none() {
            self.table_loaded.listen_once().await.into_jserror()?;
            let _ = self
                .js_get_table()
                .ok_or_else(|| js_intern!("No table set"))?;
        }

        Ok(())
    }

    pub fn js_get_table(&self) -> Option<JsValue> {
        self.borrow().table.clone()?.dyn_into().ok()
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
        drop: DragTarget,
        drag: DragEffect,
        requirements: &ViewConfigRequirements,
    ) -> ViewConfigUpdate {
        self.get_view_config()
            .create_drag_drop_update(column, index, drop, drag, requirements)
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
        self.get_view_config().create_replace_expression_update(
            column,
            &old_expression,
            &new_name,
            &expression,
        )
    }

    /// Validate an expression string (as a JsValue since it comes from
    /// `monaco`), and marshall the results.
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

    pub async fn arrow_as_vec(&self, flat: bool) -> Result<Vec<u8>, JsValue> {
        let arrow = self.flat_as_jsvalue(flat).await?.to_arrow().await?;
        Ok(js_sys::Uint8Array::new(&arrow).to_vec())
    }

    pub async fn arrow_as_jsvalue(self, flat: bool) -> Result<js_sys::ArrayBuffer, JsValue> {
        self.flat_as_jsvalue(flat).await?.to_arrow().await
    }

    pub async fn json_as_jsvalue(self, flat: bool) -> Result<js_sys::Object, JsValue> {
        self.flat_as_jsvalue(flat).await?.to_columns().await
    }

    pub async fn csv_as_jsvalue(&self, flat: bool) -> Result<js_sys::JsString, JsValue> {
        let opts = js_object!("formatted", true);
        self.flat_as_jsvalue(flat).await?.to_csv(opts).await
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

    pub fn get_view_config(&self) -> Ref<ViewConfig> {
        Ref::map(self.borrow(), |x| &x.config)
    }

    /// Get all unique column values for a given column name.
    ///
    /// Use the `.to_csv()` method, as I suspected copying this large string
    /// once was more efficient than copying many smaller strings, and
    /// string copying shows up frequently when doing performance analysis.
    ///
    /// TODO Does not work with expressions yet.
    ///
    /// # Arguments
    /// - `column` The name of the column (or expression).
    pub async fn get_column_values(&self, column: String) -> Result<Vec<String>, JsValue> {
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

    pub fn set_update_column_defaults(
        &self,
        config_update: &mut ViewConfigUpdate,
        requirements: &ViewConfigRequirements,
    ) {
        config_update.set_update_column_defaults(
            &self.metadata(),
            &self.borrow().config.columns,
            requirements,
        )
    }

    /// Update the config, setting the `columns` property to the plugin defaults
    /// if provided.
    pub fn update_view_config(&self, config_update: ViewConfigUpdate) {
        self.borrow_mut().view_sub = None;
        if self.borrow_mut().config.apply_update(config_update) {
            self.view_config_changed.emit_all(());
        }
    }

    pub fn reset_stats(&self) {
        self.update_stats(TableStats::default());
    }

    #[cfg(test)]
    pub fn set_stats(&self, stats: TableStats) {
        self.update_stats(stats)
    }

    /// In order to create a new view in this session, the session must first be
    /// validated to create a `ValidSession<'_>` guard.
    pub async fn validate(&self) -> Result<ValidSession<'_>, JsValue> {
        if let Err(err) = self.validate_view_config().await {
            web_sys::console::error_3(
                &"Invalid config, resetting to default".into(),
                &JsValue::from_serde(&self.borrow().config).unwrap(),
                &err,
            );

            self.reset(true);
            self.validate_view_config().await?;
        }

        Ok(ValidSession(self))
    }

    async fn get_validated_expression_name(&self, expr: &JsValue) -> Result<String, JsValue> {
        let arr = [expr].iter().collect::<js_sys::Array>();
        let table = self.borrow().table.as_ref().unwrap().clone();
        let schema = table.validate_expressions(arr).await?.expression_schema();
        let schema_keys = js_sys::Object::keys(&schema);
        schema_keys.get(0).as_string().into_jserror()
    }

    async fn flat_as_jsvalue(&self, flat: bool) -> Result<View, JsValue> {
        if flat {
            let table = self.borrow().table.clone().into_jserror()?;
            table
                .view(&js_object!().unchecked_into())
                .await
                .map(PerspectiveOwned::new)
        } else {
            self.borrow()
                .view_sub
                .as_ref()
                .map(|x| x.get_view().clone())
                .into_jserror()
        }
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

    fn update_stats(&self, stats: TableStats) {
        self.borrow_mut().stats = Some(stats);
        self.stats_changed.emit_all(());
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
                let _existed = view_columns.insert(column);
            } else {
                return Err(format!("Unknown \"{}\" in `columns`", column).into());
            }
        }

        for column in config.group_by.iter() {
            if all_columns.contains(column) || expression_names.contains(column) {
                let _existed = view_columns.insert(column);
            } else {
                return Err(format!("Unknown \"{}\" in `group_by`", column).into());
            }
        }

        for column in config.split_by.iter() {
            if all_columns.contains(column) || expression_names.contains(column) {
                let _existed = view_columns.insert(column);
            } else {
                return Err(format!("Unknown \"{}\" in `split_by`", column).into());
            }
        }

        for sort in config.sort.iter() {
            if all_columns.contains(&sort.0) || expression_names.contains(&sort.0) {
                let _existed = view_columns.insert(&sort.0);
            } else {
                return Err(format!("Unknown \"{}\" in `sort`", sort.0).into());
            }
        }

        for filter in config.filter.iter() {
            if all_columns.contains(&filter.0) || expression_names.contains(&filter.0) {
                let _existed = view_columns.insert(&filter.0);
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
            let on_update = self.0.table_updated.callback();
            ViewSubscription::new(table, view, config, on_stats, on_update)
        };

        // self.0.borrow_mut().metadata.as_mut().unwrap().view_schema =
        // Some(view_schema);
        self.0.borrow_mut().view_sub = Some(sub);
        Ok(self.0)
    }
}

impl<'a> Drop for ValidSession<'a> {
    /// `ValidSession` is a guard for listeners of the `view_created` pubsub
    /// event.
    fn drop(&mut self) {
        self.0.view_created.emit_all(());
    }
}
