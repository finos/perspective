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

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
#[cfg(test)]
use wasm_bindgen_test::*;
#[cfg(test)]
use {crate::*, js_sys::Array};

use super::aggregates::*;
use super::expressions::*;
use super::filters::*;
use super::sort::*;
use crate::js::perspective::JsPerspectiveViewConfig;
use crate::utils::*;

#[derive(Clone, Debug, Deserialize, Default, PartialEq, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ViewConfig {
    #[serde(default)]
    pub group_by: Vec<String>,

    #[serde(default)]
    pub split_by: Vec<String>,

    #[serde(default)]
    pub columns: Vec<Option<String>>,

    #[serde(default)]
    pub filter: Vec<Filter>,

    #[serde(default)]
    pub sort: Vec<Sort>,

    #[serde(default)]
    pub expressions: Expressions,

    #[serde(default)]
    pub aggregates: HashMap<String, Aggregate>,
}

impl ViewConfig {
    fn _apply<T>(field: &mut T, update: Option<T>) -> bool {
        match update {
            None => false,
            Some(update) => {
                *field = update;
                true
            }
        }
    }

    pub fn as_jsvalue(&self) -> ApiResult<JsPerspectiveViewConfig> {
        let mut new_config = self.clone();
        new_config.columns.retain(|x| x.is_some());
        Ok(JsValue::from_serde_ext(&new_config).map(|x| x.unchecked_into())?)
    }

    pub fn reset(&mut self, reset_expressions: bool) {
        let mut config = Self::default();
        if !reset_expressions {
            config.expressions = self.expressions.clone();
        }
        std::mem::swap(self, &mut config);
    }

    /// Apply `ViewConfigUpdate` to a `ViewConfig`, ignoring any fields in
    /// `update` which were unset.
    pub fn apply_update(&mut self, update: ViewConfigUpdate) -> bool {
        let mut changed = false;
        changed = Self::_apply(&mut self.group_by, update.group_by) || changed;
        changed = Self::_apply(&mut self.split_by, update.split_by) || changed;
        changed = Self::_apply(&mut self.columns, update.columns) || changed;
        changed = Self::_apply(&mut self.filter, update.filter) || changed;
        changed = Self::_apply(&mut self.sort, update.sort) || changed;
        changed = Self::_apply(&mut self.aggregates, update.aggregates) || changed;
        changed = Self::_apply(&mut self.expressions, update.expressions) || changed;
        changed
    }

    pub fn is_aggregated(&self) -> bool {
        !self.group_by.is_empty()
    }

    pub fn is_column_expression_in_use(&self, name: &str) -> bool {
        let name = name.to_owned();
        self.group_by.contains(&name)
            || self.split_by.contains(&name)
            || self.sort.iter().any(|x| x.0 == name)
            || self.filter.iter().any(|x| x.0 == name)
            || self.columns.contains(&Some(name))
    }
}

#[derive(Clone, Deserialize, Default, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ViewConfigUpdate {
    #[serde(default)]
    pub group_by: Option<Vec<String>>,

    #[serde(default)]
    pub split_by: Option<Vec<String>>,

    #[serde(default)]
    pub columns: Option<Vec<Option<String>>>,

    #[serde(default)]
    pub filter: Option<Vec<Filter>>,

    #[serde(default)]
    pub sort: Option<Vec<Sort>>,

    #[serde(default)]
    pub expressions: Option<Expressions>,

    #[serde(default)]
    pub aggregates: Option<HashMap<String, Aggregate>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[wasm_bindgen_test]
    pub fn test_multiaggregate_weighted_mean() {
        let x = json!({
            "aggregates": {
                "x": ["weighted mean", "y"]
            }
        });

        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(
            *rec.aggregates.get("x").unwrap(),
            Aggregate::MultiAggregate(MultiAggregate::WeightedMean, "y".to_owned())
        );
    }

    #[wasm_bindgen_test]
    pub fn test_group_by() {
        let x = json!({
            "group_by": ["Test"]
        });

        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(rec.group_by, vec!["Test"]);
    }

    #[wasm_bindgen_test]
    pub fn test_split_by() {
        let x = json!({
            "split_by": ["Test"]
        });
        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(rec.split_by, vec!["Test"]);
    }

    #[wasm_bindgen_test]
    pub fn test_column_filters() {
        let filter = ["Test", "contains", "aaa"]
            .iter()
            .map(|x| JsValue::from(*x))
            .collect::<Array>();

        let x = json!({ "filter": [filter] });
        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(rec.filter, vec![Filter(
            "Test".to_owned(),
            FilterOp::Contains,
            FilterTerm::Scalar(Scalar::String("aaa".to_owned()))
        )]);
    }

    #[wasm_bindgen_test]
    pub fn test_column_filters_operator_and_num_arg() {
        let filter = [JsValue::from("Test"), JsValue::from("<"), JsValue::from(4)]
            .iter()
            .collect::<Array>();

        let x = json!({ "filter": [filter] });
        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(rec.filter, vec![Filter(
            "Test".to_owned(),
            FilterOp::LT,
            FilterTerm::Scalar(Scalar::Float(4_f64))
        )]);
    }

    #[wasm_bindgen_test]
    pub fn test_column_sorts() {
        let sort = ["Test", "asc"]
            .iter()
            .map(|x| JsValue::from(*x))
            .collect::<Array>();

        let x = json!({ "sort": [sort] });
        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(rec.sort, vec![Sort("Test".to_owned(), SortDir::Asc,)]);
    }

    #[wasm_bindgen_test]
    pub fn test_column_sorts_multiple() {
        let sort1 = ["Test1", "asc"]
            .iter()
            .map(|x| JsValue::from(*x))
            .collect::<Array>();

        let sort2 = ["Test2", "desc"]
            .iter()
            .map(|x| JsValue::from(*x))
            .collect::<Array>();

        let x = json!({"sort": [sort1, sort2]});
        let rec: ViewConfig = x.into_serde_ext().unwrap();
        assert_eq!(rec.sort, vec![
            Sort("Test1".to_owned(), SortDir::Asc),
            Sort("Test2".to_owned(), SortDir::Desc)
        ]);
    }

    #[wasm_bindgen_test]
    pub fn test_apply_update_empty_returns_changed_false() {
        let mut view_config = ViewConfig::default();
        let update = ViewConfigUpdate::default();
        let changed = view_config.apply_update(update);
        assert!(!changed);
        assert_eq!(view_config, ViewConfig::default());
    }

    #[wasm_bindgen_test]
    pub fn test_apply_update_group_by() {
        let mut view_config = ViewConfig::default();
        let update = ViewConfigUpdate {
            group_by: Some(vec!["Test".to_owned()]),
            ..ViewConfigUpdate::default()
        };

        assert_eq!(view_config.group_by.len(), 0);
        let changed = view_config.apply_update(update);
        assert!(changed);
        assert_eq!(view_config.group_by, vec!["Test".to_owned()]);
    }

    #[wasm_bindgen_test]
    pub fn test_apply_update_group_by_then_split_by() {
        let mut view_config = ViewConfig::default();
        let update = ViewConfigUpdate {
            group_by: Some(vec!["Test".to_owned()]),
            ..ViewConfigUpdate::default()
        };

        assert_eq!(view_config.group_by.len(), 0);
        let changed = view_config.apply_update(update);
        assert!(changed);
        assert_eq!(view_config.group_by, vec!["Test".to_owned()]);
        assert_eq!(view_config.split_by.len(), 0);
        let update = ViewConfigUpdate {
            split_by: Some(vec!["Test2".to_owned()]),
            ..ViewConfigUpdate::default()
        };

        let changed = view_config.apply_update(update);
        assert!(changed);
        assert_eq!(view_config.group_by, vec!["Test".to_owned()]);
        assert_eq!(view_config.split_by, vec!["Test2".to_owned()]);
    }
}
