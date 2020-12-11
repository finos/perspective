# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from pytest import raises
from datetime import date, datetime
from perspective import Table, PerspectiveCppError


class TestViewComputed(object):
    def test_view_computed_schema_empty(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view()
        assert view.to_columns() == {"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]}
        assert view.computed_schema() == {}

    def test_view_computed_create(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ]
        )
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }
        assert view.computed_schema() == {"computed": float}

    def test_view_computed_invalid_type_should_throw(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        with raises(PerspectiveCppError) as ex:
            table.view(
                computed_columns=[
                    {
                        "column": "computed",
                        "computed_function_name": "uppercase",
                        "inputs": ["a"],
                    }
                ]
            )
        assert str(ex.value) == "View creation failed: could not build computed column 'computed' as the input column types are invalid.\n"

    def test_view_computed_should_not_overwrite_real(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        with raises(PerspectiveCppError) as ex:
            table.view(
                computed_columns=[
                    {
                        "column": "a",  # invalid - col already exists
                        "computed_function_name": "+",
                        "inputs": ["a", "b"],
                    }
                ]
            )
        assert str(ex.value) == "View creation failed: cannot overwrite Table column 'a' with a computed column.\n"

    def test_view_computed_should_not_overwrite_real_dependencies(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        with raises(PerspectiveCppError) as ex:
            table.view(
                computed_columns=[
                    {
                        "column": "computed",
                        "computed_function_name": "+",
                        "inputs": ["a", "b"],
                    },
                    {
                        "column": "computed2",
                        "computed_function_name": "sqrt",
                        "inputs": ["computed"],
                    },
                    {
                        "column": "a",  # invalid
                        "computed_function_name": "+",
                        "inputs": ["computed", "computed2"],
                    },
                    {
                        "column": "computed3",  # will be skipped
                        "computed_function_name": "+",
                        "inputs": ["a", "computed2"],
                    },
                    {
                        "column": "computed4",  # will not be skipped
                        "computed_function_name": "+",
                        "inputs": ["computed", "computed2"],
                    }
                ]
            )
        assert str(ex.value) == "View creation failed: cannot overwrite Table column 'a' with a computed column.\n"

    def test_view_computed_dependencies(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                },
                {
                    "column": "computed2",
                    "computed_function_name": "sqrt",
                    "inputs": ["computed"],
                },
                {
                    "column": "computed3",
                    "computed_function_name": "exp",
                    "inputs": ["computed"],
                },
                {
                    "column": "computed4",
                    "computed_function_name": "pow2",
                    "inputs": ["computed3"],
                },
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

        assert view.computed_schema() == {
            "computed": float,
            "computed2": float,
            "computed3": float,
            "computed4": float,
        }

    def test_view_computed_dependencies_do_not_cross_over_different_views(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                },
                {
                    "column": "computed2",
                    "computed_function_name": "sqrt",
                    "inputs": ["computed"],
                },
                {
                    "column": "computed3",
                    "computed_function_name": "exp",
                    "inputs": ["computed"],
                },
                {
                    "column": "computed4",
                    "computed_function_name": "pow2",
                    "inputs": ["computed3"],
                },
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

        assert view.computed_schema() == {
            "computed": float,
            "computed2": float,
            "computed3": float,
            "computed4": float,
        }

        with raises(PerspectiveCppError) as ex:
            table.view(
                computed_columns=[
                    {
                        "column": "computed5",
                        "computed_function_name": "pow2",
                        "inputs": ["computed3"],
                    },
                ]
            )

        assert str(ex.value) == "Could not get dtype for column `computed3` as it does not exist in the schema.\n"

    def test_view_computed_create_no_columns(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=[],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
        )
        assert view.to_columns() == {}
        assert view.schema() == {}

        # computed column should still exist
        assert view.computed_schema() == {"computed": float}

    def test_view_computed_create_columns(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=["computed"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
        )
        assert view.to_columns() == {"computed": [6, 8, 10, 12]}
        assert view.schema() == {"computed": float}
        # computed column should still exist
        assert view.computed_schema() == {"computed": float}

    def test_view_computed_multiple_dependents(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                },
                {
                    "column": "final",
                    "computed_function_name": "pow2",
                    "inputs": ["computed"],
                },
            ]
        )
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
            "final": [36, 64, 100, 144],
        }

    def test_view_computed_create_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
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

    def test_view_computed_multiple_dependents_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                },
                {
                    "column": "final",
                    "computed_function_name": "pow2",
                    "inputs": ["computed"],
                },
            ]
        )
        assert view.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
            "final": [36, 64, 100, 144],
        }
        table.clear()
        assert view.schema() == {
            "a": int,
            "b": int,
            "computed": float,
            "final": float,
        }
        assert view.to_columns() == {}

    def test_view_computed_create_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
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

    def test_view_computed_multiple_dependents_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                },
                {
                    "column": "final",
                    "computed_function_name": "pow2",
                    "inputs": ["computed"],
                },
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

    def test_view_computed_multiple_views_should_not_conflate(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ]
        )

        view2 = table.view(
            computed_columns=[
                {
                    "column": "computed2",
                    "computed_function_name": "-",
                    "inputs": ["a", "b"],
                }
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

    def test_view_computed_multiple_views_should_all_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ]
        )

        view2 = table.view(
            computed_columns=[
                {
                    "column": "computed2",
                    "computed_function_name": "-",
                    "inputs": ["a", "b"],
                }
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

    def test_view_computed_multiple_views_should_all_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ]
        )

        view2 = table.view(
            computed_columns=[
                {
                    "column": "computed2",
                    "computed_function_name": "-",
                    "inputs": ["a", "b"],
                }
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

    def test_view_computed_delete_and_create(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
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
            computed_columns=[
                {
                    "column": "computed2",
                    "computed_function_name": "-",
                    "inputs": ["a", "b"],
                }
            ]
        )

        assert view2.schema() == {"a": int, "b": int, "computed2": float}

        assert view2.to_columns() == {
            "a": [1, 2, 3, 4],
            "b": [5, 6, 7, 8],
            "computed2": [-4, -4, -4, -4],
        }

    def test_view_computed_delete_and_create_with_updates(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ]
        )

        assert view.schema() == {"a": int, "b": int, "computed": float}

        table.update({"a": [5, 6], "b": [9, 10]})

        assert view.to_columns() == {
            "a": [1, 2, 3, 4, 5, 6],
            "b": [5, 6, 7, 8, 9, 10],
            "computed": [6, 8, 10, 12, 14, 16],
        }

        view.delete()

        view2 = table.view(
            computed_columns=[
                {
                    "column": "computed2",
                    "computed_function_name": "-",
                    "inputs": ["a", "b"],
                }
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

    def test_view_delete_with_scope(self):
        """Tests that `View`'s `__del__` method, when called by the Python
        reference counter, leaves an empty `Table` in a clean state.
        """
        table = Table(
            {"id": int, "msg": str, "val": float},
            index="id",
        )
        table.view(
            computed_columns=[
                {
                    "column": "inverted",
                    "computed_function_name": "invert",
                    "inputs": ["val"],
                }
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

    def test_view_computed_with_custom_columns(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            columns=["computed", "b"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
        )
        assert view.to_columns() == {
            "b": [5, 6, 7, 8],
            "computed": [6, 8, 10, 12],
        }

    def test_view_computed_with_row_pivots(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            row_pivots=["computed"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
        )
        assert view.to_columns() == {
            "__ROW_PATH__": [[], [6], [8], [10], [12]],
            "a": [10, 1, 2, 3, 4],
            "b": [26, 5, 6, 7, 8],
            "computed": [36.0, 6.0, 8.0, 10.0, 12.0],
        }

    def test_view_computed_with_row_pivots_clear(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            row_pivots=["computed"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
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

    def test_view_computed_with_row_pivots_replace(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})

        view = table.view(
            row_pivots=["computed"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
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

    def test_view_computed_with_column_pivots(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            column_pivots=["computed"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
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

    def test_view_computed_with_row_column_pivots(self):
        table = Table({"a": [1, 2, 3, 4], "b": [5, 6, 7, 8]})
        view = table.view(
            column_pivots=["computed"],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "+",
                    "inputs": ["a", "b"],
                }
            ],
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

    def test_view_computed_with_sort(self):
        table = Table({"a": ["a", "ab", "abc", "abcd"]})
        view = table.view(
            sort=[["computed", "desc"]],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "length",
                    "inputs": ["a"],
                }
            ],
        )

        assert view.to_columns() == {
            "a": ["abcd", "abc", "ab", "a"],
            "computed": [4, 3, 2, 1],
        }

    def test_view_computed_with_filter(self):
        table = Table({"a": ["a", "ab", "abc", "abcd"]})
        view = table.view(
            filter=[["computed", ">=", 3]],
            computed_columns=[
                {
                    "column": "computed",
                    "computed_function_name": "length",
                    "inputs": ["a"],
                }
            ],
        )

        assert view.to_columns() == {"a": ["abc", "abcd"], "computed": [3, 4]}

    def test_view_day_of_week_date(self):
        table = Table({"a": [date(2020, 3, i) for i in range(9, 14)]})
        view = table.view(
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_of_week",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_of_week",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "month_of_year",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "month_of_year",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_bucket",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_bucket",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "day_bucket",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "month_bucket",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "month_bucket",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "month_bucket",
                    "inputs": ["a"],
                }
            ]
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
            computed_columns=[
                {
                    "column": "bucket",
                    "computed_function_name": "month_bucket",
                    "inputs": ["a"],
                }
            ]
        )
        assert view.schema() == {"a": datetime, "bucket": date}
        assert view.to_columns() == {
            "a": [datetime(2020, 1, 1), None, None, datetime(2020, 3, 15)],
            "bucket": [datetime(2020, 1, 1), None, None, datetime(2020, 3, 1)],
        }
