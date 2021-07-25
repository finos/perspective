////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use crate::config::*;
use crate::js::perspective::*;
use crate::utils::*;

use std::collections::HashMap;
use std::collections::HashSet;
use std::iter::IntoIterator;
use wasm_bindgen::prelude::*;

/// Metadata state reflects data we could fetch from a `View`, but would like to
/// do so without `async`.  It must be recreated by any `async` method which changes
/// the `View` and may temporarily be out-of-sync with the `View`/`ViewConfig`.
#[derive(Default)]
pub struct SessionMetadata(Option<SessionMetadataState>);

/// TODO the multiple `Option` types could probably be merged since they are
/// populated within an async lock
#[derive(Default)]
pub struct SessionMetadataState {
    column_names: Vec<String>,
    table_schema: HashMap<String, Type>,
    view_schema: Option<HashMap<String, Type>>,
    view_expression_schema: Option<HashMap<String, Type>>,
    view_expression_alias: Option<HashMap<String, String>>,
}

impl SessionMetadata {
    /// Creates a new `SessionMetadata` from a `JsPerspectiveTable`.
    pub(super) async fn from_table(
        table: &JsPerspectiveTable,
    ) -> Result<SessionMetadata, JsValue> {
        let column_names = {
            let columns = table.columns().await?;
            if columns.length() > 0 {
                (0..columns.length())
                    .map(|i| columns.get(i).as_string().unwrap())
                    .collect::<Vec<String>>()
            } else {
                vec![]
            }
        };

        let table_schema = table
            .schema()
            .await?
            .into_serde::<HashMap<String, Type>>()
            .into_jserror()?;

        Ok(SessionMetadata(Some(SessionMetadataState {
            column_names,
            table_schema,
            ..SessionMetadataState::default()
        })))
    }

    pub(super) fn update_view_schema(
        &mut self,
        view_schema: &JsPerspectiveViewSchema,
    ) -> Result<(), JsValue> {
        let view_schema = view_schema
            .into_serde::<HashMap<String, Type>>()
            .into_jserror()?;

        self.0.as_mut().unwrap().view_schema = Some(view_schema);
        Ok(())
    }

    pub(super) fn update_expressions(
        &mut self,
        // table: &JsPerspectiveTable,
        valid_recs: &JsPerspectiveValidatedExpressions,
    ) -> Result<HashSet<String>, JsValue> {
        if js_sys::Object::keys(&valid_recs.errors()).length() > 0 {
            panic!("Wormfood!");
        }

        let expression_alias = valid_recs
            .expression_alias()
            .into_serde::<HashMap<String, String>>()
            .into_jserror()?;

        self.0.as_mut().unwrap().view_expression_alias = Some(expression_alias);
        let expression_schema = valid_recs
            .expression_schema()
            .into_serde::<HashMap<String, Type>>()
            .into_jserror()?;

        let expression_names =
            expression_schema.keys().cloned().collect::<HashSet<_>>();

        self.0.as_mut().unwrap().view_expression_schema = Some(expression_schema);
        Ok(expression_names)
    }

    /// The `table`'s unique column names, including the alias columns names of
    /// expression columns.
    fn _get_all_columns(&self) -> Option<Vec<String>> {
        self.0.as_ref().map(move |meta| {
            let expressions = meta
                .view_expression_schema
                .as_ref()
                .map(|x| Box::new(x.keys()) as Box<dyn Iterator<Item = &String>>)
                .unwrap_or_else(|| Box::new([].iter()));

            meta.column_names
                .iter()
                .chain(expressions)
                .cloned()
                .collect::<Vec<_>>()
        })
    }

    /// Returns the unique column names in this session that are expression columns.
    pub fn get_expression_columns(&self) -> Vec<String> {
        self.0
            .as_ref()
            .and_then(|meta| {
                meta.view_expression_schema
                    .as_ref()
                    .map(|x| x.keys().cloned().collect::<Vec<_>>())
            })
            .unwrap_or_default()
    }

    /// Returns the full original expression `String` for an expression alias.
    ///
    /// # Arguments
    /// - `alias` An alias name for an expression column in this `Session`.
    pub fn get_alias_expression(&self, alias: &str) -> String {
        self.0
            .as_ref()
            .and_then(|meta| meta.view_expression_alias.as_ref())
            .and_then(|x| x.get(alias))
            .cloned()
            .unwrap_or_else(|| "".to_owned())
    }

    pub fn get_table_columns(&self) -> Option<Vec<String>> {
        self.0.as_ref().map(|meta| meta.column_names.clone())
    }

    pub fn iter_columns<'a>(&'a self) -> Box<dyn Iterator<Item = &'a String> + 'a> {
        Box::new(
            self.0
                .as_ref()
                .map(|meta| meta.column_names.iter())
                .into_iter()
                .flatten(),
        )
    }

    pub fn is_column_expression(&self, name: &str) -> bool {
        self.0
            .as_ref()
            .and_then(|meta| {
                meta.view_expression_schema
                    .as_ref()
                    .map(|schema| schema.contains_key(name))
            })
            .unwrap_or(false)
    }

    /// Returns the type of a column name relative to the `Table`.  Despite the name,
    /// `get_column_table_type()` also returns the `Table` type for Expressions,
    /// which despite living on the `View` still have a `table` type associated with
    /// them pre-aggregation.
    ///
    /// # Arguments
    /// - `name` The column name (or expresison alias) to retrieve a principal type.
    pub fn get_column_table_type(&self, name: &str) -> Option<Type> {
        self.0
            .as_ref()
            .and_then(|meta| {
                meta.table_schema.get(name).or_else(|| {
                    meta.view_expression_schema
                        .as_ref()
                        .and_then(|schema| schema.get(name))
                })
            })
            .cloned()
    }

    /// Returns the type of a column name relative to the `View`, including expression
    /// columns which were part of the `ViewConfig`.  Types returned from the `View`
    /// incorporate the type transform applied by their aggregate if applicable, so
    /// may differ from the type returned by `get_column_table_type()`.
    ///
    /// # Arguments
    /// - `name` The column name (or expresison alias) to retrieve a `View` type.
    pub fn get_column_view_type(&self, name: &str) -> Option<Type> {
        self.0
            .as_ref()
            .and_then(|meta| meta.view_schema.as_ref())
            .and_then(|schema| schema.get(name))
            .cloned()
    }
}
