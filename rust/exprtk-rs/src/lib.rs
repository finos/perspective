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

use pest::iterators::Pairs;

mod exprtk;
use exprtk::parser::Rule;

mod ast {
    use crate::exprtk::parser::{ExprTkParser, Rule};
    use pest::Parser;

    use super::Ast;
    #[cxx::bridge(namespace = "exprtk_rs::parser")]
    mod parser_ffi {
        extern "Rust" {
            type Ast;

            fn parse(input: &'static str) -> Result<Box<Ast>>;
            fn debug(self: &Ast) -> String;

        }
    }

    impl Ast {
        pub fn debug(&self) -> String {
            format!("{:#?}", self)
        }
    }

    fn parse(input: &'static str) -> Result<Box<Ast>, pest::error::Error<Rule>> {
        let expr = ExprTkParser::parse(crate::Rule::expr, input)?;
        Ok(Box::new(Ast { expr }))
    }
}

mod scalar {
    use crate::exprtk::types::Scalar;

    #[cxx::bridge(namespace = "exprtk_rs::interpreter::types::scalar")]
    mod scalar {
        extern "Rust" {
            type Scalar;

            fn from_u32(value: u32) -> Box<Scalar>;
        }
    }

    fn from_u32(value: u32) -> Box<Scalar> {
        Box::new(Scalar::UInt32(value))
    }
}

#[derive(Debug, Clone)]
pub struct Ast {
    pub expr: Pairs<'static, Rule>,
}
