////////////////////////////////////////////////////////////////////////////////
//
// Copyright (c) 2018, the Perspective Authors.
//
// This file is part of the Perspective library, distributed under the terms
// of the Apache License 2.0.  The full license can be found in the LICENSE
// file.

use std::collections::HashMap;

use crate::config::*;

impl ViewConfig {
    /// Create an update for this `ViewConfig` that replaces an expression
    /// column with a new one, e.g. when a user edits an expression.  This may
    /// changed either the expression alias, the expression itself, or both; as
    /// well as any other fields that reference the expression column by alias.
    ///
    /// This method is designed to be called from `crate::session` which can
    /// fill in `old_expression` and `new_alias`.
    pub(super) fn create_replace_expression_update(
        &self,
        old_alias: &str,
        old_expression: &str,
        new_alias: &str,
        new_expression: &str,
    ) -> ViewConfigUpdate {
        let expression = new_expression;
        let Self {
            columns,
            expressions,
            group_by,
            split_by,
            sort,
            filter,
            aggregates,
            ..
        } = self.clone();

        let expressions = expressions
            .into_iter()
            .map(|x| {
                if x == old_expression {
                    expression.to_owned()
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        let aggregates = aggregates
            .into_iter()
            .map(|x| {
                if x.0 == old_expression {
                    (expression.to_owned(), x.1)
                } else {
                    x
                }
            })
            .collect::<HashMap<_, _>>();

        let columns = columns
            .into_iter()
            .map(|x| match x {
                Some(x) if x == old_alias => Some(new_alias.to_owned()),
                x => x,
            })
            .collect::<Vec<_>>();

        let group_by = group_by
            .into_iter()
            .map(|x| {
                if x == old_alias {
                    new_alias.to_owned()
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        let split_by = split_by
            .into_iter()
            .map(|x| {
                if x == old_alias {
                    new_alias.to_owned()
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        let sort = sort
            .into_iter()
            .map(|x| {
                if x.0 == old_alias {
                    Sort(new_alias.to_owned(), x.1)
                } else {
                    x
                }
            })
            .collect::<Vec<_>>();

        // TODO expression editing can change type, which may invalidate filters
        let filter = filter
            .into_iter()
            .map(|x| {
                if x.0 == old_alias {
                    Filter(new_alias.to_owned(), x.1, x.2)
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
}
