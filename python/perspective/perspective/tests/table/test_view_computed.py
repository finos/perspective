# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import numpy as np
from datetime import date, datetime
from perspective.table import Table
from pytest import mark


class TestViewComputed(object):

    def test_view_computed_create(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })
        view = table.view(computed_columns=[{
            "column": "computed",
            "computed_function_name": "+",
            "inputs": ["a", "b"]
        }])
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12]
        }

    def test_view_computed_multiple_dependents(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })
        view = table.view(computed_columns=[{
                "column": "computed",
                "computed_function_name": "+",
                "inputs": ["a", "b"]
            },
            {
                "column": "final",
                "computed_function_name": "pow2",
                "inputs": ["computed"]
            }
        ])
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
            "final": [36, 64, 100, 144]
        }

    def test_view_computed_multiple_views_should_not_conflate(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })

        view = table.view(computed_columns=[{
            "column": "computed",
            "computed_function_name": "+",
            "inputs": ["a", "b"]
        }])

        view2 = table.view(computed_columns=[{
            "column": "computed2",
            "computed_function_name": "-",
            "inputs": ["a", "b"]
        }])

        assert view.schema() == {
            "a": int,
            "b": int,
            "computed": float
        }

        assert view2.schema() == {
            "a": int,
            "b": int,
            "computed2": float
        }

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12]
        }

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed2": [-4, -4, -4, -4]
        }

    def test_view_computed_delete_and_create(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })

        view = table.view(computed_columns=[{
            "column": "computed",
            "computed_function_name": "+",
            "inputs": ["a", "b"]
        }])

        assert view.schema() == {
            "a": int,
            "b": int,
            "computed": float
        }

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12]
        }

        view.delete()

        view2 = table.view(computed_columns=[{
            "column": "computed2",
            "computed_function_name": "-",
            "inputs": ["a", "b"]
        }])

        assert view2.schema() == {
            "a": int,
            "b": int,
            "computed2": float
        }

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed2": [-4, -4, -4, -4]
        }

    def test_view_computed_with_custom_columns(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })
        view = table.view(
            columns=["computed", "b"],
            computed_columns=[{
                "column": "computed",
                "computed_function_name": "+",
                "inputs": ["a", "b"]
            }]
        )
        assert view.to_columns() == {
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12]
        }

    def test_view_computed_with_row_pivots(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })
        view = table.view(
            row_pivots=["computed"],
            computed_columns=[{
                "column": "computed",
                "computed_function_name": "+",
                "inputs": ["a", "b"]
            }]
        )
        assert view.to_columns() == {
            "__ROW_PATH__": [[], ["6"], ["8"], ["10"], ["12"]],
            "a": [10, 1, 2, 3, 4],
            "b": [26, 5, 6, 7, 8],
            "computed": [36.0, 6.0, 8.0, 10.0, 12.0]
        }
    
    def test_view_computed_with_column_pivots(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })
        view = table.view(
            column_pivots=["computed"],
            computed_columns=[{
                "column": "computed",
                "computed_function_name": "+",
                "inputs": ["a", "b"]
            }]
        )
        assert view.to_columns() == {
            "6|a": [1, None, None, None],
            "6|b": [5, None, None, None],
            "6|computed": [6, None, None, None],
            "8|a": [None, 2, None, None],
            "8|b": [None, 6, None, None],
            "8|computed": [None, 8, None, None],
            "10|a": [None, None, 3, None],
            "10|b": [None, None, 7, None],
            "10|computed": [None, None, 10.0, None],
            "12|a": [None, None, None, 4],
            "12|b": [None, None, None, 8],
            "12|computed": [None, None, None, 12.0]
        }

    def test_view_computed_with_row_column_pivots(self):
        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8]
        })
        view = table.view(
            column_pivots=["computed"],
            computed_columns=[{
                "column": "computed",
                "computed_function_name": "+",
                "inputs": ["a", "b"]
            }]
        )
        assert view.to_columns() == {
            "6|a": [1, None, None, None],
            "6|b": [5, None, None, None],
            "6|computed": [6.0, None, None, None],
            "8|a": [None, 2, None, None],
            "8|b": [None, 6, None, None],
            "8|computed": [None, 8.0, None, None],
            "10|a": [None, None, 3, None],
            "10|b": [None, None, 7, None],
            "10|computed": [None, None, 10.0, None],
            "12|a": [None, None, None, 4],
            "12|b": [None, None, None, 8],
            "12|computed": [None, None, None, 12.0]
        }
    
    def test_view_computed_with_sort(self):
        table = Table({
            "a": ["a", "ab", "abc", "abcd"]
        })
        view = table.view(
            sort=[["computed", "desc"]],
            computed_columns=[{
                "column": "computed",
                "computed_function_name": "length",
                "inputs": ["a"]
            }]
        )

        assert view.to_columns() == {
            "a": ["abcd", "abc", "ab", "a"],
            "computed": [4, 3, 2, 1]
        }

    def test_view_computed_with_filter(self):
        table = Table({
            "a": ["a", "ab", "abc", "abcd"]
        })
        view = table.view(
            filter=[["computed", ">=", 3]],
            computed_columns=[{
                "column": "computed",
                "computed_function_name": "length",
                "inputs": ["a"]
            }]
        )

        assert view.to_columns() == {
            "a": ["abc", "abcd"],
            "computed": [3, 4]
        }

    @mark.skip
    def test_view_day_of_week_date(self):
        table = Table({
            "a": [date(2020, 3, i) for i in range(9, 14)]
        })
        view = table.view(
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_of_week",
                    "inputs": ["a"]
                }
            ]
        )
        assert view.schema() == {
            "a": date,
            "bucket": str
        }
        assert view.to_columns() == {
            "a": [datetime(2020, 3, i) for i in range(9, 14)],
            "bucket": ["2 Monday", "3 Tuesday", "4 Wednesday", "5 Thursday", "6 Friday"]
        }

    def test_view_day_of_week_datetime(self):
        table = Table({
            "a": [datetime(2020, 3, i, 12, 30) for i in range(9, 14)]
        })
        view = table.view(
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_of_week",
                    "inputs": ["a"]
                }
            ]
        )
        assert view.schema() == {
            "a": datetime,
            "bucket": str
        }
        assert view.to_columns() == {
            "a": [datetime(2020, 3, i, 12, 30) for i in range(9, 14)],
            "bucket": ["2 Monday", "3 Tuesday", "4 Wednesday", "5 Thursday", "6 Friday"]
        }
