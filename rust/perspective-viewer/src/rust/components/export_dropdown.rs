////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::containers::dropdown_menu::*;
use crate::*;
use yew::prelude::*;

#[derive(Clone, Copy, PartialEq)]
pub enum ExportMethod {
    Csv,
    CsvAll,
    Html,
    Png,
    Arrow,
    ArrowAll,
}

impl From<ExportMethod> for Html {
    fn from(x: ExportMethod) -> Self {
        match x {
            ExportMethod::Csv => html_template! {
                <code>{ ".csv " }</code>
            },
            ExportMethod::CsvAll => html_template! {
                <code>{ ".csv " }</code>
            },
            ExportMethod::Html => html_template! {
                <code>{ ".html " }</code>
            },
            ExportMethod::Png => html_template! {
                <code>{ ".png " }</code>
            },
            ExportMethod::Arrow => html_template! {
                <code>{ ".arrow " }</code>
            },
            ExportMethod::ArrowAll => html_template! {
                <code>{ ".arrow " }</code>
            },
        }
    }
}

pub type ExportDropDownMenu = DropDownMenu<ExportMethod>;
pub type ExportDropDownMenuProps = DropDownMenuProps<ExportMethod>;
pub type ExportDropDownMenuMsg = DropDownMenuMsg;
pub type ExportDropDownMenuItem = DropDownMenuItem<ExportMethod>;
