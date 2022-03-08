////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use super::containers::dropdown_menu::*;
use crate::model::*;

pub fn get_menu_items(has_render: bool) -> Vec<CopyDropDownMenuItem> {
    vec![
        CopyDropDownMenuItem::OptGroup(
            "Current View",
            if has_render {
                vec![ExportMethod::Csv, ExportMethod::Json, ExportMethod::Png]
            } else {
                vec![ExportMethod::Csv, ExportMethod::Json]
            },
        ),
        CopyDropDownMenuItem::OptGroup(
            "All",
            vec![ExportMethod::CsvAll, ExportMethod::JsonAll],
        ),
        CopyDropDownMenuItem::OptGroup("Config", vec![ExportMethod::JsonConfig]),
    ]
}

pub type CopyDropDownMenu = DropDownMenu<ExportMethod>;
pub type CopyDropDownMenuProps = DropDownMenuProps<ExportMethod>;
pub type CopyDropDownMenuMsg = DropDownMenuMsg;
pub type CopyDropDownMenuItem = DropDownMenuItem<ExportMethod>;
