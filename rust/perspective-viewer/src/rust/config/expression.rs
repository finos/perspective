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

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct Expression {
    pub name: String,
    pub expr: String,
}
impl Expression {
    pub fn new<S1: ToString, S2: ToString>(name: S1, expr: S2) -> Self {
        Self {
            name: name.to_string(),
            expr: expr.to_string(),
        }
    }
}
impl PartialEq<ExprSerde> for Expression {
    fn eq(&self, other: &ExprSerde) -> bool {
        other.name() == self.name && other.expr() == self.expr
    }
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(untagged)]
pub enum ExprSerde {
    Str(String),
    Struct(Expression),
}
impl ExprSerde {
    pub fn name(&self) -> &str {
        match self {
            Self::Struct(s) => &s.name,
            Self::Str(s) => 
                if let Some( (name, expr) ) = s.split_once('\n') && !expr.is_empty() && name.starts_with("//") {
                    name.split_at(2).1
                } else {
                    s
                }
        }
    }
    pub fn expr(&self) -> &str {
        match self {
            Self::Struct(s) => &s.expr,
            Self::Str(s) => 
                if let Some( (name, expr) ) = s.split_once('\n') && !expr.is_empty() && name.starts_with("//") {
                    expr
                } else {
                    s
                }
        }
    }
}
impl From<Expression> for ExprSerde {
    fn from(value: Expression) -> Self {
        ExprSerde::Struct(value)
    }
}
impl<S: ToString> From<S> for ExprSerde {
    fn from(value: S) -> Self {
        ExprSerde::Str(value.to_string())
    }
}
impl From<ExprSerde> for Expression {
    fn from(value: ExprSerde) -> Self {
        match value {
            ExprSerde::Struct(s) => s,
            ExprSerde::Str(s) => {
                if let Some( (name, expr) ) = s.split_once('\n') && !expr.is_empty() && name.starts_with("//") {
                    Self {
                        name: name.split_at(2).1.to_owned(),
                        expr: expr.to_owned(),
                    }
                } else {
                    Self {
                        name: s.clone(),
                        expr: s.clone(),
                    }
                }
            }
        }
    }
}

#[test]
fn test_expression_conversion() {
    let expr_strs = ["1", "//expr\n2"];
    let expr_structs = [Expression::new("1", "1"), Expression::new("expr", "2")];
    for i in [0, 1] {
        let str_serde: ExprSerde = expr_strs[i].into();
        assert_eq!(expr_structs[i], str_serde)
    }
}
