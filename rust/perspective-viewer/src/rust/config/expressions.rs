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

use std::borrow::Cow;
use std::collections::HashMap;

use itertools::Itertools;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(untagged)]
pub enum Expressions {
    Array(Vec<String>),
    Map(HashMap<String, String>),
}

#[derive(Clone, Debug, PartialEq)]
pub struct Expression<'a> {
    pub name: Cow<'a, str>,
    pub expression: Cow<'a, str>,
}

impl Default for Expressions {
    fn default() -> Self {
        Self::Map(HashMap::default())
    }
}

impl<'a> FromIterator<Expression<'a>> for Expressions {
    fn from_iter<T: IntoIterator<Item = Expression<'a>>>(iter: T) -> Self {
        Self::Map(
            iter.into_iter()
                .map(|x| (x.name.as_ref().to_owned(), x.expression.as_ref().to_owned()))
                .collect(),
        )
    }
}

fn change(expressions: &[String]) -> HashMap<String, String> {
    expressions.iter().map(|s| {
            if let Some((name, expression)) = s.split_once('\n') && !expression.is_empty() && name.starts_with("//") {
                (name.split_at(2).1.trim().to_owned(), expression.to_owned())
            } else {
                (s.to_owned(), s.to_owned())
            }
        }).collect::<HashMap<_, _>>()
}

impl Expressions {
    #[must_use]
    pub fn len(&self) -> usize {
        match self {
            Expressions::Array(x) => x.len(),
            Expressions::Map(x) => x.len(),
        }
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    pub fn remove(&mut self, expr: &str) {
        match self {
            Expressions::Array(expressions) => {
                let mut map = change(expressions);
                map.remove(expr);
                *self = Self::Map(map);
            }
            Expressions::Map(map) => {
                map.remove(expr);
            }
        }
    }

    pub fn insert(&mut self, expr: &Expression) {
        match self {
            Expressions::Array(expressions) => {
                let mut map = change(expressions);
                map.insert(
                    expr.name.as_ref().to_owned(),
                    expr.expression.as_ref().to_owned(),
                );
                *self = Self::Map(map);
            }
            Expressions::Map(map) => {
                map.insert(
                    expr.name.as_ref().to_owned(),
                    expr.expression.as_ref().to_owned(),
                );
            }
        }
    }

    pub fn iter(&self) -> Box<dyn Iterator<Item = Expression<'_>> + '_> {
        match self {
            Expressions::Array(expressions) => {
                Box::new(expressions.iter().map(|s| {
                    if let Some( (name, expression) ) = s.split_once('\n') && !expression.is_empty() && name.starts_with("//") {
                        Expression{ name: name.split_at(2).1.trim().into(), expression: expression.into() }
                    } else {
                        Expression{ name: s.into(), expression: s.into() }
                    }
                }))
            }
            Expressions::Map(map) => {
                Box::new(map.keys().sorted().map(|x| {
                    Expression { name: x.into(), expression: map.get(x).unwrap().into() }
                }))
            },
        }
    }
}
