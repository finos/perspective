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

use std::collections::{HashMap, HashSet};
use std::iter::IntoIterator;
use std::ops::{Deref, DerefMut};

use crate::components::viewer::ColumnLocator;
use crate::config::*;
use crate::js::perspective::*;
use crate::utils::*;
use crate::*;

struct SessionViewExpressionMetadata {
    schema: HashMap<String, Type>,
    alias: HashMap<String, String>,
    edited: HashMap<String, String>,
}

/// Metadata state reflects data we could fetch from a `View`, but would like to
/// do so without `async`.  It must be recreated by any `async` method which
/// changes the `View` and may temporarily be out-of-sync with the
/// `View`/`ViewConfig`.
#[derive(Default)]
pub struct SessionMetadata(Option<SessionMetadataState>);

impl Deref for SessionMetadata {
    type Target = Option<SessionMetadataState>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for SessionMetadata {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

/// TODO the multiple `Option` types could probably be merged since they are
/// populated within an async lock
#[derive(Default)]
pub struct SessionMetadataState {
    column_names: Vec<String>,
    table_schema: HashMap<String, Type>,
    edit_port: f64,
    view_schema: Option<HashMap<String, Type>>,
    expr_meta: Option<SessionViewExpressionMetadata>,
}

impl SessionMetadata {
    /// Creates a new `SessionMetadata` from a `JsPerspectiveTable`.
    pub(super) async fn from_table(table: &JsPerspectiveTable) -> ApiResult<Self> {
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

        let table_schema = table.schema().await?.into_serde_ext()?;
        let edit_port = table.make_port().await?;
        Ok(Self(Some(SessionMetadataState {
            column_names,
            table_schema,
            edit_port,
            ..SessionMetadataState::default()
        })))
    }

    pub(super) fn update_view_schema(
        &mut self,
        view_schema: &JsPerspectiveViewSchema,
    ) -> ApiResult<()> {
        let view_schema = view_schema.into_serde_ext()?;
        self.as_mut().unwrap().view_schema = Some(view_schema);
        Ok(())
    }

    pub(super) fn update_expressions(
        &mut self,
        valid_recs: &JsPerspectiveValidatedExpressions,
    ) -> ApiResult<HashSet<String>> {
        if js_sys::Object::keys(&valid_recs.errors()).length() > 0 {
            return Err("Expressions invalid".into());
        }

        let expression_alias: HashMap<String, String> =
            valid_recs.expression_alias().into_serde_ext()?;

        let expression_schema: HashMap<String, Type> =
            valid_recs.expression_schema().into_serde_ext()?;

        let expression_names = expression_schema.keys().cloned().collect::<HashSet<_>>();

        let mut edited = self
            .as_mut()
            .unwrap()
            .expr_meta
            .take()
            .map(|x| x.edited)
            .unwrap_or_default();

        edited.retain(|k, _| expression_alias.get(k).is_some());
        self.as_mut().unwrap().expr_meta = Some(SessionViewExpressionMetadata {
            schema: expression_schema,
            alias: expression_alias,
            edited,
        });

        Ok(expression_names)
    }

    /// Returns the unique column names in this session that are expression
    /// columns.
    pub fn get_expression_columns(&self) -> impl Iterator<Item = &'_ String> {
        maybe!(Some(self.as_ref()?.expr_meta.as_ref()?.schema.keys()))
            .into_iter()
            .flatten()
    }

    /// Returns the full original expression `String` for an expression alias.
    /// TODO should expressions be `Rc`?
    ///
    /// # Arguments
    /// - `alias` An alias name for an expression column in this `Session`.
    pub fn get_expression_by_alias(&self, alias: &str) -> Option<String> {
        self.as_ref()?.expr_meta.as_ref()?.alias.get(alias).cloned()
    }

    /// Returns the edited expression `String` (e.g. the not-yet-saved, edited
    /// expression state of a column, if any) for an expression alias.
    ///
    /// # Arguments
    /// - `alias` An alias name for an expression column in this `Session`.
    pub fn get_edit_by_alias(&self, alias: &str) -> Option<String> {
        maybe!(self
            .as_ref()?
            .expr_meta
            .as_ref()?
            .edited
            .get(alias)
            .cloned())
    }

    pub fn set_edit_by_alias(&mut self, alias: &str, edit: String) {
        drop(maybe!(self
            .as_mut()?
            .expr_meta
            .as_mut()?
            .edited
            .insert(alias.to_owned(), edit)))
    }

    pub fn clear_edit_by_alias(&mut self, alias: &str) {
        drop(maybe!(self
            .as_mut()?
            .expr_meta
            .as_mut()?
            .edited
            .remove(alias)))
    }

    pub fn get_table_columns(&self) -> Option<&'_ Vec<String>> {
        self.as_ref().map(|meta| &meta.column_names)
    }

    pub fn is_column_expression(&self, name: &str) -> bool {
        let is_expr = maybe!(Some(
            self.as_ref()?.expr_meta.as_ref()?.schema.contains_key(name)
        ));

        is_expr.unwrap_or_default()
    }

    /// This function will find a currently existing column. If you want to
    /// create a new expression column, use ColumnLocator::Expr(None)
    pub fn get_column_locator(&self, name: Option<String>) -> Option<ColumnLocator> {
        name.and_then(|name| {
            self.as_ref().and_then(|meta| {
                if self.is_column_expression(&name) {
                    Some(ColumnLocator::Expr(Some(name)))
                } else {
                    meta.column_names
                        .iter()
                        .find_map(|n| (n == &name).then_some(ColumnLocator::Plain(name.clone())))
                }
            })
        })
    }

    /// Creates a new column name by appending a numeral corresponding to the
    /// number of columns with that name.
    pub fn make_new_column_name(&self, col: Option<&str>) -> String {
        let mut i = 0;
        loop {
            i += 1;
            let name = format!("{} {i}", col.unwrap_or("New Column"));
            if self.get_column_table_type(&name).is_none() {
                return name;
            }
        }
    }

    pub fn get_edit_port(&self) -> Option<f64> {
        self.as_ref().map(|meta| meta.edit_port)
    }

    /// Returns the type of a column name relative to the `Table`.  Despite the
    /// name, `get_column_table_type()` also returns the `Table` type for
    /// Expressions, which despite living on the `View` still have a `table`
    /// type associated with them pre-aggregation.
    ///
    /// # Arguments
    /// - `name` The column name (or expresison alias) to retrieve a principal
    ///   type.
    pub fn get_column_table_type(&self, name: &str) -> Option<Type> {
        maybe!({
            let meta = self.as_ref()?;
            meta.table_schema
                .get(name)
                .or_else(|| meta.expr_meta.as_ref()?.schema.get(name))
                .cloned()
        })
    }

    /// Returns the type of a column name relative to the `View`, including
    /// expression columns which were part of the `ViewConfig`.  Types
    /// returned from the `View` incorporate the type transform applied by
    /// their aggregate if applicable, so may differ from the type returned
    /// by `get_column_table_type()`.
    ///
    /// # Arguments
    /// - `name` The column name (or expresison alias) to retrieve a `View`
    ///   type.
    pub fn get_column_view_type(&self, name: &str) -> Option<Type> {
        maybe!(self.as_ref()?.view_schema.as_ref()?.get(name)).cloned()
    }

    pub fn get_column_aggregates<'a>(
        &'a self,
        name: &str,
    ) -> Option<Box<dyn Iterator<Item = Aggregate> + 'a>> {
        maybe!({
            let coltype = self.get_column_table_type(name)?;
            let aggregates = coltype.aggregates_iter();
            Some(match coltype {
                Type::Float | Type::Integer => {
                    let num_cols = self
                        .get_expression_columns()
                        .cloned()
                        .chain(self.get_table_columns()?.clone().into_iter())
                        .map(move |name| {
                            self.get_column_table_type(&name)
                                .map(|coltype| (name, coltype))
                        })
                        .collect::<Option<Vec<_>>>()?
                        .into_iter()
                        .filter(|(_, coltype)| *coltype == Type::Integer || *coltype == Type::Float)
                        .map(|(name, _)| {
                            Aggregate::MultiAggregate(MultiAggregate::WeightedMean, name)
                        });
                    Box::new(aggregates.chain(num_cols))
                },
                _ => aggregates,
            })
        })
    }
}
