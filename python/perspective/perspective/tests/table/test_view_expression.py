# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from pytest import raises
from datetime import date, datetime
from time import mktime
from perspective import Table, PerspectiveCppError
from .test_view import compare_delta


class TestViewExpression(object):
    def test_table_validate_expressions_empty(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        validate = table.validate_expressions([])
        assert validate["expression_schema"] == {}
        assert validate["errors"] == {}

    def test_view_expression_schema_empty(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view()
        assert view.to_columns() == {"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]}
        assert view.expression_schema() == {}

    def test_table_validate_expressions_with_errors(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        validate = table.validate_expressions(
            ['"Sales" + "Profit"', "datetime()", "string()", "for () {}"]
        )
        assert validate["expression_schema"] == {}
        assert validate["errors"] == {
            '"Sales" + "Profit"': {
                "column": 0,
                "error_message": 'Value Error - Input column "Sales" does not exist.',
                "line": 0,
            },
            "datetime()": {
                "column": 10,
                "error_message": "Parser Error - Zero parameter call to generic function: datetime not allowed",
                "line": 0,
            },
            "for () {}": {
                "column": 5,
                "error_message": "Parser Error - Premature end of expression[2]",
                "line": 0,
            },
            "string()": {
                "column": 8,
                "error_message": "Parser Error - Zero parameter call to generic function: string not allowed",
                "line": 0,
            },
        }

    def test_view_expression_create(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(expressions=['// computed \n "a" + "b"'])
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }
        assert view.expression_schema() == {"computed": float}

    def test_view_expression_create_no_alias(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(expressions=['"a" + "b"'])
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            '"a" + "b"': [6, 8, 10, 12],
        }
        assert view.expression_schema() == {'"a" + "b"': float}

    def test_view_expression_should_not_overwrite_real(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        with raises(PerspectiveCppError) as ex:
            table.view(expressions=['// a \n upper("a")'])
        assert (
            str(ex.value)
            == "View creation failed: cannot create expression column 'a' that overwrites a column that already exists.\n"
        )

    def test_view_expression_should_resolve_to_last_alias(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=["abc"],
            expressions=['// abc \n "a" + "b"', '// abc \n "a" - "b"'],
        )
        assert view.to_columns() == {"abc": [-4, -4, -4, -4]}

    def test_view_expression_multiple_alias(
        self,
    ):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
                '// computed2 \n "a" + "b"',
                '// computed3 \n "a" + "b"',
                '// computed4 \n "a" + "b"',
            ]
        )
        assert view.schema() == {
            "a": int,
            "b": int,
            "computed": float,
            "computed2": float,
            "computed3": float,
            "computed4": float,
        }

        assert view.expression_schema() == {
            "computed": float,
            "computed2": float,
            "computed3": float,
            "computed4": float,
        }

    def test_view_expression_multiple_views_with_the_same_alias_should_not_overwrite(
        self,
    ):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=['// computed \n "a" + "b"']
        )

        view2 = table.view(
            expressions=['// computed \n "a" * "b"']
        )

        assert view.expression_schema() == {
            "computed": float
        }

        assert view2.expression_schema() == {
            "computed": float,
        }

        assert view.to_dict()["computed"] == [6, 8, 10, 12]
        assert view2.to_dict()["computed"] == [5, 12, 21, 32]

    def test_view_expression_multiple_views_with_the_same_alias_pivoted(
        self,
    ):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            row_pivots=["computed"],
            aggregates={
                "computed": ["weighted mean", "b"]
            },
            expressions=['// computed \n "a" + "b"']
        )

        view2 = table.view(
            row_pivots=["computed"],
            aggregates={
                "computed": "last"
            },
            expressions=['// computed \nconcat(\'abc\', \' \', \'def\')']
        )

        assert view.expression_schema() == {
            "computed": float
        }

        assert view2.expression_schema() == {
            "computed": str,
        }

        result = view.to_dict()
        result2 = view2.to_dict()

        assert result["__ROW_PATH__"] == [[], [6], [8], [10], [12]]
        assert result2["__ROW_PATH__"] == [[], ["abc def"]]

        assert result["computed"] == [9.384615384615385, 6, 8, 10, 12]
        assert result2["computed"] == ["abc def", "abc def"]


    def test_view_expression_multiple_views_with_the_same_alias_all_types(
        self,
    ):
        now = datetime.now()
        today = date.today()

        month_bucketed = datetime(today.year, today.month, 1)
        minute_bucketed = datetime(now.year, now.month, now.day, now.hour, now.minute, 0, 0)

        table = Table({
            "a": [1, 2, 3, 4],
            "b": [5.5, 6.5, 7.5, 8.5],
            "c": [datetime.now() for _ in range(4)],
            "d": [date.today() for _ in range(4)],
            "e": [True, False, True, False],
            "f": ["a", "b", "c", "d"]
        })

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
                '// computed2 \n bucket("c", \'M\')',
                '// computed3 \n concat(\'a\', \'b\', \'c\')',
                '// computed4 \n \'new string\'',
            ]
        )

        view2 = table.view(
            expressions=[
                '// computed \n upper("f")',
                '// computed2 \n 20 + ("b" * "a")',
                '// computed4 \n bucket("c", \'m\')',
            ]
        )

        assert view.expression_schema() == {
            "computed": float,
            "computed2": date,
            "computed3": str,
            "computed4": str,
        }

        assert view2.expression_schema() == {
            "computed": str,
            "computed2": float,
            "computed4": datetime,
        }

        result = view.to_dict()
        result2 = view2.to_dict()

        assert result["computed"] == [6.5, 8.5, 10.5, 12.5]
        assert result2["computed"] == ["A", "B", "C", "D"]
        
        assert result["computed2"] == [month_bucketed for _ in range(4)]
        assert result2["computed2"] == [25.5, 33, 42.5, 54]

        assert result["computed3"] == ["abc", "abc", "abc", "abc"]
        assert "computed3" not in result2

        assert result["computed4"] == ["new string" for _ in range(4)]
        assert result2["computed4"] == [minute_bucketed for _ in range(4)]

    def test_view_expression_create_no_columns(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=[],
            expressions=[
                '// computed \n "a" + "b"'
            ]
        )
        assert view.to_columns() == {}
        assert view.schema() == {}

        # computed column should still exist
        assert view.expression_schema() == {"computed": float}

    def test_view_expression_create_columns(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=["computed"],
            expressions=[
                '// computed \n "a" + "b"'
            ]
        )
        assert view.to_columns() == {"computed": [6, 8, 10, 12]}
        assert view.schema() == {"computed": float}
        # computed column should still exist
        assert view.expression_schema() == {"computed": float}

    def test_view_expression_create_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            expressions=[
                '// computed \n "a" + "b"'
            ]
        )
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }
        table.clear()
        assert view.schema() == {"a": int, "b": int, "computed": float}
        assert view.to_columns() == {}

    def test_view_expression_create_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            expressions=[
                '// computed \n "a" + "b"'
            ]
        )
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }
        table.replace({"a": [10, 20, 30, 40], "b": [50, 60, 70, 80]})
        assert view.schema() == {"a": int, "b": int, "computed": float}
        assert view.to_columns() == {
            "a": [10, 20, 30, 40],
            "b": [50, 60, 70, 80],
            "computed": [60, 80, 100, 120],
        }

    def test_view_expression_multiple_dependents_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
                '// final \n ("a" + "b") ^ 2'
            ]
        )
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
            "final": [36, 64, 100, 144],
        }
        table.replace({"a": [10, 20, 30, 40], "b": [50, 60, 70, 80]})
        assert view.schema() == {
            "a": int,
            "b": int,
            "computed": float,
            "final": float,
        }
        assert view.to_columns() == {
            "a": [10, 20, 30, 40],
            "b": [50, 60, 70, 80],
            "computed": [60, 80, 100, 120],
            "final": [3600, 6400, 10000, 14400],
        }

    def test_view_expression_multiple_views_should_not_conflate(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        view2 = table.view(
            expressions=[
                '// computed2 \n "a" - "b"'
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float}

        assert view2.schema() == {"a": int, "b": int, "computed2": float}

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed2": [-4, -4, -4, -4],
        }

    def test_view_expression_multiple_views_should_all_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        view2 = table.view(
            expressions=[
                '// computed2 \n "a" - "b"'
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float}

        assert view2.schema() == {"a": int, "b": int, "computed2": float}

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed2": [-4, -4, -4, -4],
        }

        table.clear()

        assert view.schema() == {"a": int, "b": int, "computed": float}

        assert view2.schema() == {"a": int, "b": int, "computed2": float}

        assert view.to_columns() == {}

        assert view2.to_columns() == {}

    def test_view_expression_multiple_views_should_all_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        view2 = table.view(
            expressions=[
                '// computed2 \n "a" - "b"'
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float}

        assert view2.schema() == {"a": int, "b": int, "computed2": float}

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed2": [-4, -4, -4, -4],
        }

        table.replace({"a": [10, 20, 30, 40], "b": [50, 60, 70, 80]})

        assert view.to_columns() == {
            "a": [10, 20, 30, 40],
            "b": [50, 60, 70, 80],
            "computed": [60, 80, 100, 120],
        }

        assert view2.to_columns() == {
            "a": [10, 20, 30, 40],
            "b": [50, 60, 70, 80],
            "computed2": [-40, -40, -40, -40],
        }

    def test_view_expression_delete_and_create(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )
        assert view.schema() == {"a": int, "b": int, "computed": float}

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

        view.delete()

        view2 = table.view(
            expressions=[
                '// computed \n "a" - "b"'
            ]
        )

        assert view2.schema() == {"a": int, "b": int, "computed": float}

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [-4, -4, -4, -4],
        }

    def test_view_expression_delete_and_create_with_updates(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
                "upper(concat('abc', 'def'))"
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float, "upper(concat('abc', 'def'))": str}

        table.update({"a": [5, 6], "b": [9, 10]})

        assert view.to_columns() == {
            "a": [1, 2, 3, 4, 5, 6],
            "b": [5, 6, 7, 8, 9, 10],
            "computed": [6, 8, 10, 12, 14, 16],
            "upper(concat('abc', 'def'))": ["ABCDEF" for _ in range(6)]
        }

        view.delete()

        view2 = table.view(
            expressions=[
                '// computed2 \n "a" - "b"',
            ]
        )

        assert view2.schema() == {"a": int, "b": int, "computed2": float}

        table.update({"a": [5, 6], "b": [9, 10]})

        table.update({"a": [5, 6], "b": [9, 10]})

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4, 5, 6, 5, 6, 5, 6],
            "b": [5, 6, 7, 8, 9, 10, 9, 10, 9, 10],
            "computed2": [-4, -4, -4, -4, -4, -4, -4, -4, -4, -4],
        }

    def test_view_expression_append(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float}
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

        table.update({"a": [5, 6], "b": [9, 10]})

        assert view.to_columns() == {
            "a": [1, 2, 3, 4, 5, 6],
            "b": [5, 6, 7, 8, 9, 10],
            "computed": [6, 8, 10, 12, 14, 16],
        }

    def test_view_expression_delta_zero(self, util):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float}

        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

        def updater(port, delta):
            compare_delta(delta, {"a": [5, 6], "b": [9, 10]})


        table.update({"a": [5, 6], "b": [9, 10]})

        assert view.to_columns() == {
            "a": [1, 2, 3, 4, 5, 6],
            "b": [5, 6, 7, 8, 9, 10],
            "computed": [6, 8, 10, 12, 14, 16],
        }
    def test_view_delete_with_scope(self):
        """Tests that `View`'s `__del__` method, when called by the Python
        reference counter, leaves an empty `Table` in a clean state.
        """
        table = Table(
            {"id": int, "msg": str, "val": float},
            index="id",
        )

        table.view(
            expressions=[
                '// inverted \n 1 / "val"',
            ],
            columns=["inverted"],
        )
        table.update(
            [
                {
                    "id": 1,
                    "msg": "test",
                    "val": 1.0,
                }
            ]
        )

    def test_view_expression_with_custom_columns(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=["computed", "b"],
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )
        assert view.to_columns() == {
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

    def test_view_expression_with_row_pivots(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            row_pivots=["computed"],
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )
        assert view.to_columns() == {
            "__ROW_PATH__": [[], [6], [8], [10], [12]],
            "a": [10, 1, 2, 3, 4],
            "b": [26, 5, 6, 7, 8],
            "computed": [36.0, 6.0, 8.0, 10.0, 12.0],
        }

    def test_view_expression_with_row_pivots_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            row_pivots=["computed"],
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        assert view.to_columns() == {
            "__ROW_PATH__": [[], [6], [8], [10], [12]],
            "a": [10, 1, 2, 3, 4],
            "b": [26, 5, 6, 7, 8],
            "computed": [36.0, 6.0, 8.0, 10.0, 12.0],
        }

        table.clear()

        assert view.to_columns() == {
            "__ROW_PATH__": [[]],
            "a": [None],
            "b": [None],
            "computed": [None],
        }

    def test_view_expression_with_row_pivots_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            row_pivots=["computed"],
            expressions=[
                '// computed \n "a" + "b"',
            ]
        )

        assert view.to_columns() == {
            "__ROW_PATH__": [[], [6], [8], [10], [12]],
            "a": [10, 1, 2, 3, 4],
            "b": [26, 5, 6, 7, 8],
            "computed": [36.0, 6.0, 8.0, 10.0, 12.0],
        }

        table.replace({"a": [10, 20, 30, 40], "b": [50, 60, 70, 80]})

        assert view.to_columns() == {
            "__ROW_PATH__": [[], [60], [80], [100], [120]],
            "a": [100, 10, 20, 30, 40],
            "b": [260, 50, 60, 70, 80],
            "computed": [360.0, 60.0, 80.0, 100.0, 120.0],
        }

    def test_view_expression_with_column_pivots(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            column_pivots=["computed"],
            expressions=[
                '// computed \n "a" + "b"',
            ]
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
            "12|computed": [None, None, None, 12.0],
        }

    def test_view_expression_with_row_column_pivots(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            column_pivots=["computed"],
            expressions=[
                '// computed \n "a" + "b"',
            ]
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
            "12|computed": [None, None, None, 12.0],
        }

    def test_view_expression_with_sort(self):
        table = Table({"a": ["a", "ab", "abc", "abcd"]})
        view = table.view(
            sort=[["computed", "desc"]],
            expressions=['// computed \n length("a")']
        )

        assert view.to_columns() == {
            "a": ["abcd", "abc", "ab", "a"],
            "computed": [4, 3, 2, 1],
        }

    def test_view_expression_with_filter(self):
        table = Table({"a": ["a", "ab", "abc", "abcd"]})
        view = table.view(
            filter=[["computed", ">=", 3]],
            expressions=['// computed \n length("a")']
        )

        assert view.to_columns() == {"a": ["abc", "abcd"], "computed": [3, 4]}

    def test_view_day_of_week_date(self):
        table = Table({"a": [date(2020, 3, i) for i in range(9, 14)]})
        view = table.view(
            expressions=['// bucket \n day_of_week("a")']
        )
        assert view.schema() == {"a": date, "bucket": str}
        assert view.to_columns() == {
            "a": [datetime(2020, 3, i) for i in range(9, 14)],
            "bucket": [
                "2 Monday",
                "3 Tuesday",
                "4 Wednesday",
                "5 Thursday",
                "6 Friday",
            ],
        }

    def test_view_day_of_week_datetime(self):
        table = Table(
            {"a": [datetime(2020, 3, i, 12, 30) for i in range(9, 14)]}
        )
        view = table.view(
            expressions=['// bucket \n day_of_week("a")']
        )
        assert view.schema() == {"a": datetime, "bucket": str}
        assert view.to_columns() == {
            "a": [datetime(2020, 3, i, 12, 30) for i in range(9, 14)],
            "bucket": [
                "2 Monday",
                "3 Tuesday",
                "4 Wednesday",
                "5 Thursday",
                "6 Friday",
            ],
        }

    def test_view_month_of_year_date(self):
        table = Table({"a": [date(2020, i, 15) for i in range(1, 13)]})
        view = table.view(
            expressions=['// bucket \n month_of_year("a")']
        )
        assert view.schema() == {"a": date, "bucket": str}
        assert view.to_columns() == {
            "a": [datetime(2020, i, 15) for i in range(1, 13)],
            "bucket": [
                "01 January",
                "02 February",
                "03 March",
                "04 April",
                "05 May",
                "06 June",
                "07 July",
                "08 August",
                "09 September",
                "10 October",
                "11 November",
                "12 December",
            ],
        }

    def test_view_month_of_year_datetime(self):
        table = Table(
            {
                "a": [datetime(2020, i, 15) for i in range(1, 13)],
            }
        )
        view = table.view(
            expressions=['// bucket \n month_of_year("a")']
        )
        assert view.schema() == {"a": datetime, "bucket": str}
        assert view.to_columns() == {
            "a": [datetime(2020, i, 15) for i in range(1, 13)],
            "bucket": [
                "01 January",
                "02 February",
                "03 March",
                "04 April",
                "05 May",
                "06 June",
                "07 July",
                "08 August",
                "09 September",
                "10 October",
                "11 November",
                "12 December",
            ],
        }

    # bucketing
    def test_view_day_bucket_date(self):
        table = Table(
            {
                "a": [
                    date(2020, 1, 1),
                    date(2020, 1, 1),
                    date(2020, 2, 29),
                    date(2020, 3, 1),
                ],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'D')"]
        )
        assert view.schema() == {"a": date, "bucket": date}
        assert view.to_columns() == {
            "a": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 1),
                datetime(2020, 2, 29),
                datetime(2020, 3, 1),
            ],
            "bucket": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 1),
                datetime(2020, 2, 29),
                datetime(2020, 3, 1),
            ],
        }

    def test_view_day_bucket_date_with_null(self):
        table = Table(
            {
                "a": [
                    date(2020, 1, 1),
                    None,
                    date(2020, 2, 29),
                    date(2020, 3, 15),
                ],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'D')"]
        )
        assert view.schema() == {"a": date, "bucket": date}
        assert view.to_columns() == {
            "a": [
                datetime(2020, 1, 1),
                None,
                datetime(2020, 2, 29),
                datetime(2020, 3, 15),
            ],
            "bucket": [
                datetime(2020, 1, 1),
                None,
                datetime(2020, 2, 29),
                datetime(2020, 3, 15),
            ],
        }

    def test_view_day_bucket_datetime(self):
        table = Table(
            {
                "a": [
                    datetime(2020, 1, 1, 5),
                    datetime(2020, 1, 1, 23),
                    datetime(2020, 2, 29, 1),
                    datetime(2020, 3, 1, 0),
                ],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'D')"]
        )
        assert view.schema() == {"a": datetime, "bucket": date}
        assert view.to_columns() == {
            "a": [
                datetime(2020, 1, 1, 5),
                datetime(2020, 1, 1, 23),
                datetime(2020, 2, 29, 1),
                datetime(2020, 3, 1, 0),
            ],
            "bucket": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 1),
                datetime(2020, 2, 29),
                datetime(2020, 3, 1),
            ],
        }

    def test_view_month_bucket_date(self):
        table = Table(
            {
                "a": [
                    date(2020, 1, 1),
                    date(2020, 1, 28),
                    date(2020, 2, 29),
                    date(2020, 3, 15),
                ],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'M')"]
        )
        assert view.schema() == {"a": date, "bucket": date}
        assert view.to_columns() == {
            "a": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 28),
                datetime(2020, 2, 29),
                datetime(2020, 3, 15),
            ],
            "bucket": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 1),
                datetime(2020, 2, 1),
                datetime(2020, 3, 1),
            ],
        }

    def test_view_month_bucket_date_with_null(self):
        table = Table(
            {
                "a": [
                    date(2020, 1, 1),
                    None,
                    date(2020, 2, 29),
                    date(2020, 3, 15),
                ],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'M')"]
        )
        assert view.schema() == {"a": date, "bucket": date}
        assert view.to_columns() == {
            "a": [
                datetime(2020, 1, 1),
                None,
                datetime(2020, 2, 29),
                datetime(2020, 3, 15),
            ],
            "bucket": [
                datetime(2020, 1, 1),
                None,
                datetime(2020, 2, 1),
                datetime(2020, 3, 1),
            ],
        }

    def test_view_month_bucket_datetime(self):
        table = Table(
            {
                "a": [
                    datetime(2020, 1, 1),
                    datetime(2020, 1, 28),
                    datetime(2020, 2, 29),
                    datetime(2020, 3, 15),
                ],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'M')"]
        )
        assert view.schema() == {"a": datetime, "bucket": date}
        assert view.to_columns() == {
            "a": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 28),
                datetime(2020, 2, 29),
                datetime(2020, 3, 15),
            ],
            "bucket": [
                datetime(2020, 1, 1),
                datetime(2020, 1, 1),
                datetime(2020, 2, 1),
                datetime(2020, 3, 1),
            ],
        }

    def test_view_month_bucket_datetime_with_null(self):
        table = Table(
            {
                "a": [datetime(2020, 1, 1), None, None, datetime(2020, 3, 15)],
            }
        )
        view = table.view(
            expressions=["// bucket \n bucket(\"a\", 'M')"]
        )
        assert view.schema() == {"a": datetime, "bucket": date}
        assert view.to_columns() == {
            "a": [datetime(2020, 1, 1), None, None, datetime(2020, 3, 15)],
            "bucket": [datetime(2020, 1, 1), None, None, datetime(2020, 3, 1)],
        }

    def test_view_integer_expression(self):
        table = Table({
            "x": int,
            "y": date,
            "z": float
        })

        view = table.view(
            expressions=[
                '// computed\n integer(2147483648)',
                '// computed2\n integer(-2147483649)',
                '// computed3 \n integer(123.456)',
                '// computed4 \n integer("x")',
                '// computed5 \n integer("y")',
                '// computed6 \n integer("z")'
            ]
        )

        table.update({
            "x": [12136582],
            "y": [date(2020, 6, 30)],
            "z": [1.23456]
        })

        assert view.expression_schema() == {
            "computed": int,
            "computed2": int,
            "computed3": int,
            "computed4": int,
            "computed5": int,
            "computed6": int,
        }

        result = view.to_dict()

        assert result["computed"] == [2147483648]
        assert result["computed2"] == [-2147483649]
        assert result["computed3"] == [123]
        assert result["computed4"] == [12136582]
        assert result["computed5"] == [132384030]
        assert result["computed6"] == [1]

    def test_view_float_expression(self):
        table = Table({
            "w": datetime,
            "x": int,
            "y": date,
            "z": float
        })

        view = table.view(
            expressions=[
                '// computed\n float(2147483648)',
                '// computed2\n float(-2147483649)',
                '// computed3 \n float(123.456789123)',
                '// computed4 \n float("x")',
                '// computed5 \n float("y")',
                '// computed6 \n float("z")',
                '// computed7 \n float("w")'
            ]
        )

        dt = datetime(2018, 8, 12, 15, 32, 55)

        table.update({
            "w": [dt],
            "x": [12136582],
            "y": [date(2020, 6, 30)],
            "z": [1.23456]
        })

        assert view.expression_schema() == {
            "computed": float,
            "computed2": float,
            "computed3": float,
            "computed4": float,
            "computed5": float,
            "computed6": float,
            "computed7": float,
        }

        result = view.to_dict()

        seconds_timestamp = mktime(dt.timetuple()) + dt.microsecond / 1000000.0
        ms_timestamp = int(seconds_timestamp * 1000)

        assert result["computed"] == [2147483648]
        assert result["computed2"] == [-2147483649]
        assert result["computed3"] == [123.456789123]
        assert result["computed4"] == [12136582]
        assert result["computed5"] == [132384030]
        assert result["computed6"] == [1.23456]
        assert result["computed7"] == [ms_timestamp]
    
    def test_view_date_expression(self):
        table = Table({
            "x": [1]
        })

        view = table.view(
            expressions=[
                '// computed\n date(2020, 5, 30)',
                '// computed2\n date(1997, 8, 31)'
            ]
        )

        assert view.expression_schema() == {
            "computed": date,
            "computed2": date
        }

        result = view.to_dict()

        assert result["computed"] == [datetime(2020, 5, 30)]
        assert result["computed2"] == [datetime(1997, 8, 31)]

    def test_view_datetime_expression(self):
        table = Table({
            "x": [1]
        })

        dt = datetime(2015, 11, 29, 23, 59, 59)
        seconds_timestamp = mktime(dt.timetuple()) + dt.microsecond / 1000000.0
        ms_timestamp = int(seconds_timestamp * 1000)

        view = table.view(
            expressions=[
                '// computed\n datetime({})'.format(ms_timestamp)
            ]
        )

        assert view.expression_schema() == {
            "computed": datetime
        }

        result = view.to_dict()

        assert result["computed"] == [datetime(2015, 11, 29, 23, 59, 59)]

    def test_view_datetime_expression_roundtrip(self):
        table = Table({
            "x": [datetime(2015, 11, 29, 23, 59, 59)]
        })

        view = table.view(
            expressions=[
                '// computed\n datetime(float("x"))'
            ]
        )

        assert view.expression_schema() == {
            "computed": datetime
        }

        result = view.to_dict()

        assert result["computed"] == [datetime(2015, 11, 29, 23, 59, 59)]

    def test_view_string_expression(self):
        table = Table({
            "a": date,
            "b": datetime,
            "c": int,
            "d": float,
            "e": str,
            "f": bool
        })

        view = table.view(
            expressions=[
                '// computed\n string("a")',
                '// computed2\n string("b")',
                '// computed3\n string("c")',
                '// computed4\n string("d")',
                '// computed5\n string("e")',
                '// computed6\n string("f")',
                '// computed7\n string(1234.5678)'
            ]
        )

        table.update({
            "a": [date(2020, 5, 30), date(2021, 7, 13)],
            "b": [datetime(2015, 11, 29, 23, 59, 59), datetime(2016, 11, 29, 23, 59, 59)],
            "c": [12345678, 1293879852],
            "d": [1.2792013981, 19.218975981],
            "e": ["abcdefghijklmnop", "def"],
            "f": [False, True]
        })

        assert view.expression_schema() == {
            "computed": str,
            "computed2": str,
            "computed3": str,
            "computed4": str,
            "computed5": str,
            "computed6": str,
            "computed7": str
        }

        result = view.to_dict()

        assert result["computed"] == ["2020-05-30", "2021-07-13"]
        assert result["computed2"] == ["2015-11-29 23:59:59.000", "2016-11-29 23:59:59.000"]
        assert result["computed3"] == ["12345678", "1293879852"]
        assert result["computed4"] == ["1.2792", "19.219"]
        assert result["computed5"] == ["abcdefghijklmnop", "def"]
        assert result["computed6"] == ["false", "true"]
        assert result["computed7"] == ["1234.57"] * 2
