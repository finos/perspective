# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import numpy as np
import pandas as pd
from datetime import date, datetime
from perspective.table import Table


class TestUpdate(object):

    def test_update_from_schema(self):
        tbl = Table({
            "a": str,
            "b": int
        })
        tbl.update([{"a": "abc", "b": 123}])
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}]

    def test_update_columnar_from_schema(self):
        tbl = Table({
            "a": str,
            "b": int
        })
        tbl.update({"a": ["abc"], "b": [123]})
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}]

    def test_update_append(self):
        tbl = Table([{"a": "abc", "b": 123}])
        tbl.update([{"a": "def", "b": 456}])
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}, {"a": "def", "b": 456}]

    def test_update_partial(self):
        tbl = Table([{"a": "abc", "b": 123}], {"index": "a"})
        tbl.update([{"a": "abc", "b": 456}])
        assert tbl.view().to_records() == [{"a": "abc", "b": 456}]

    def test_update_columnar_append(self):
        tbl = Table({"a": ["abc"], "b": [123]})
        tbl.update({"a": ["def"], "b": [456]})
        assert tbl.view().to_records() == [{"a": "abc", "b": 123}, {"a": "def", "b": 456}]

    def test_update_columnar_partial(self):
        tbl = Table({"a": ["abc"], "b": [123]}, {"index": "a"})
        tbl.update({"a": ["abc"], "b": [456]})
        assert tbl.view().to_records() == [{"a": "abc", "b": 456}]

    # numpy array updates

    def test_update_np(self):
        tbl = Table({"a": [1, 2, 3, 4]})
        tbl.update({"a": np.array([5, 6, 7, 8])})
        assert tbl.view().to_dict() == {
            "a": [1, 2, 3, 4, 5, 6, 7, 8]
        }

    def test_update_np_datetime(self):
        tbl = Table({
            "a": [np.datetime64(datetime(2019, 7, 11, 11, 0))]
        })

        tbl.update({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype=datetime)
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 11, 11, 0), datetime(2019, 7, 12, 11, 0)]
        }

    def test_update_np_partial(self):
        tbl = Table({
            "a": [1, 2, 3, 4],
            "b": ["a", "b", "c", "d"]
        }, {"index": "b"})

        tbl.update({
            "a": np.array([5, 6, 7, 8]),
            "b": np.array(["a", "b", "c", "d"], dtype=object)
        })

        assert tbl.view().to_dict() == {
            "a": [5, 6, 7, 8],
            "b": ["a", "b", "c", "d"]
        }

    def test_update_np_partial_implicit(self):
        tbl = Table({"a": [1, 2, 3, 4]})

        tbl.update({
            "a": np.array([5, 6, 7, 8]),
            "__INDEX__": np.array([0, 1, 2, 3])
        })

        assert tbl.view().to_dict() == {
            "a": [5, 6, 7, 8]
        }

    def test_update_np_datetime_partial(self):
        tbl = Table({
            "a": [np.datetime64(datetime(2019, 7, 11, 11, 0))],
            "b": [1]
        }, {"index": "b"})

        tbl.update({
            "a": np.array([datetime(2019, 7, 12, 11, 0)], dtype=datetime),
            "b": np.array([1])
        })

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)],
            "b": [1]
        }

    def test_update_np_nonseq_partial(self):
        tbl = Table({
            "a": [1, 2, 3, 4],
            "b": ["a", "b", "c", "d"]
        }, {"index": "b"})

        tbl.update({
            "a": np.array([5, 6, 7]),
            "b": np.array(["a", "c", "d"], dtype=object)}
        )

        assert tbl.view().to_dict() == {
            "a": [5, 2, 6, 7],
            "b": ["a", "b", "c", "d"]
        }

    def test_update_np_with_none_partial(self):
        tbl = Table({
            "a": [1, np.nan, 3],
            "b": ["a", None, "d"]
        }, {"index": "b"})

        tbl.update({
            "a": np.array([4, 5]),
            "b": np.array(["a", "d"], dtype=object)
        })

        assert tbl.view().to_dict() == {
            "a": [None, 4, 5],
            "b": [None, "a", "d"]  # pkeys are ordered
        }

    def test_update_np_unset_partial(self):
        tbl = Table({
            "a": [1, 2, 3],
            "b": ["a", "b", "c"]
        }, {"index": "b"})

        tbl.update({
            "a": np.array([None, None]),
            "b": np.array(["a", "c"], dtype=object)
        })

        assert tbl.view().to_dict() == {
            "a": [None, 2, None],
            "b": ["a", "b", "c"]
        }

    def test_update_np_nan_partial(self):
        tbl = Table({
            "a": [1, 2, 3],
            "b": ["a", "b", "c"]
        }, {"index": "b"})

        tbl.update({
            "a": np.array([None, None]),
            "b": np.array(["a", "c"], dtype=object)
        })

        assert tbl.view().to_dict() == {
            "a": [None, 2, None],
            "b": ["a", "b", "c"]
        }

    # pandas dataframe updates

    def test_update_df(self):
        tbl = Table({"a": [1, 2, 3, 4]})

        update_data = pd.DataFrame({
            "a": [5, 6, 7, 8]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [1, 2, 3, 4, 5, 6, 7, 8]
        }

    def test_update_df_datetime(self):
        tbl = Table({"a": [np.datetime64(datetime(2019, 7, 11, 11, 0))]})

        update_data = pd.DataFrame({
            "a": [datetime(2019, 7, 12, 11, 0)]
        })

        tbl.update(update_data)
        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 11, 11, 0), datetime(2019, 7, 12, 11, 0)]
        }

    def test_update_df_partial(self):
        tbl = Table({
            "a": [1, 2, 3, 4],
            "b": ["a", "b", "c", "d"]
        }, {"index": "b"})

        update_data = pd.DataFrame({
            "a": [5, 6, 7, 8],
            "b": ["a", "b", "c", "d"]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [5, 6, 7, 8],
            "b": ["a", "b", "c", "d"]
        }

    def test_update_df_partial_implicit(self):
        tbl = Table({"a": [1, 2, 3, 4]})

        update_data = pd.DataFrame({
            "a": [5, 6, 7, 8],
            "__INDEX__": [0, 1, 2, 3]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [5, 6, 7, 8]
        }

    def test_update_df_datetime_partial(self):
        tbl = Table({
            "a": [np.datetime64(datetime(2019, 7, 11, 11, 0))],
            "b": [1]
        }, {"index": "b"})

        update_data = pd.DataFrame({
            "a": [datetime(2019, 7, 12, 11, 0)],
            "b": [1]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [datetime(2019, 7, 12, 11, 0)],
            "b": [1]
        }

    def test_update_df_nonseq_partial(self):
        tbl = Table({
            "a": [1, 2, 3, 4],
            "b": ["a", "b", "c", "d"]
        }, {"index": "b"})

        update_data = pd.DataFrame({
            "a": [5, 6, 7],
            "b": ["a", "c", "d"]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [5, 2, 6, 7],
            "b": ["a", "b", "c", "d"]
        }

    def test_update_df_with_none_partial(self):
        tbl = Table({
            "a": [1, np.nan, 3],
            "b": ["a", None, "d"]
        }, {"index": "b"})

        update_data = pd.DataFrame({
            "a": [4, 5],
            "b": ["a", "d"]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [None, 4, 5],
            "b": [None, "a", "d"]  # pkeys are ordered
        }

    def test_update_df_unset_partial(self):
        tbl = Table({
            "a": [1, 2, 3],
            "b": ["a", "b", "c"]
        }, {"index": "b"})

        update_data = pd.DataFrame({
            "a": [None, None],
            "b": ["a", "c"]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [None, 2, None],
            "b": ["a", "b", "c"]
        }

    def test_update_df_nan_partial(self):
        tbl = Table({
            "a": [1, 2, 3],
            "b": ["a", "b", "c"]
        }, {"index": "b"})

        update_data = pd.DataFrame({
            "a": [None, None],
            "b": ["a", "c"]
        })

        tbl.update(update_data)

        assert tbl.view().to_dict() == {
            "a": [None, 2, None],
            "b": ["a", "b", "c"]
        }

    # dates and datetimes
    def test_update_date(self):
        tbl = Table({"a": [date(2019, 7, 11)]})
        tbl.update([{"a": date(2019, 7, 12)}])
        assert tbl.view().to_records() == [
            {"a": datetime(2019, 7, 11, 0, 0)},
            {"a": datetime(2019, 7, 12, 0, 0)}
        ]

    def test_update_date_np(self):
        tbl = Table({"a": [date(2019, 7, 11)]})
        tbl.update([{"a": np.datetime64(date(2019, 7, 12))}])
        assert tbl.view().to_records() == [
            {"a": datetime(2019, 7, 11, 0, 0)},
            {"a": datetime(2019, 7, 12, 0, 0)}
        ]

    def test_update_datetime(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)]})
        tbl.update([{"a": datetime(2019, 7, 12, 11, 0)}])
        assert tbl.view().to_records() == [
            {"a": datetime(2019, 7, 11, 11, 0)},
            {"a": datetime(2019, 7, 12, 11, 0)}
        ]

    def test_update_datetime_np(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)]})
        tbl.update([{"a": np.datetime64(datetime(2019, 7, 12, 11, 0))}])
        assert tbl.view().to_records() == [
            {"a": datetime(2019, 7, 11, 11, 0)},
            {"a": datetime(2019, 7, 12, 11, 0)}
        ]

    def test_update_datetime_np_ts(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)]})
        tbl.update([{"a": np.datetime64("2019-07-12T11:00")}])
        assert tbl.view().to_records() == [
            {"a": datetime(2019, 7, 11, 11, 0)},
            {"a": datetime(2019, 7, 12, 11, 0)}
        ]

    # partial date & datetime updates

    def test_update_date_partial(self):
        tbl = Table({"a": [date(2019, 7, 11)], "b": [1]}, {"index": "b"})
        tbl.update([{"a": date(2019, 7, 12), "b": 1}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 0, 0), "b": 1}]

    def test_update_date_np_partial(self):
        tbl = Table({"a": [date(2019, 7, 11)], "b": [1]}, {"index": "b"})
        tbl.update([{"a": np.datetime64(date(2019, 7, 12)), "b": 1}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 0, 0), "b": 1}]

    def test_update_datetime_partial(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)], "b": [1]}, {"index": "b"})
        tbl.update([{"a": datetime(2019, 7, 12, 11, 0), "b": 1}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 11, 0), "b": 1}]

    def test_update_datetime_np_partial(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)], "b": [1]}, {"index": "b"})
        tbl.update([{"a": np.datetime64(datetime(2019, 7, 12, 11, 0)), "b": 1}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 11, 0), "b": 1}]

    def test_update_datetime_np_ts_partial(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)], "b": [1]}, {"index": "b"})
        tbl.update([{"a": np.datetime64("2019-07-12T11:00"), "b": 1}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 11, 0), "b": 1}]

    # updating dates using implicit index

    def test_update_date_partial_implicit(self):
        tbl = Table({"a": [date(2019, 7, 11)]})
        tbl.update([{"a": date(2019, 7, 12), "__INDEX__": 0}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 0, 0)}]

    def test_update_date_np_partial_implicit(self):
        tbl = Table({"a": [date(2019, 7, 11)]})
        tbl.update([{"a": np.datetime64(date(2019, 7, 12)), "__INDEX__": 0}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 0, 0)}]

    def test_update_datetime_partial_implicit(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)]})
        tbl.update([{"a": datetime(2019, 7, 12, 11, 0), "__INDEX__": 0}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 11, 0)}]

    def test_update_datetime_np_partial_implicit(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)]})
        tbl.update([{"a": np.datetime64(datetime(2019, 7, 12, 11, 0)), "__INDEX__": 0}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 11, 0)}]

    def test_update_datetime_np_ts_partial_implicit(self):
        tbl = Table({"a": [datetime(2019, 7, 11, 11, 0)]})
        tbl.update([{"a": np.datetime64("2019-07-12T11:00"), "__INDEX__": 0}])
        assert tbl.view().to_records() == [{"a": datetime(2019, 7, 12, 11, 0)}]

    # implicit index

    def test_update_implicit_index(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data)
        view = tbl.view()
        tbl.update([{
            "__INDEX__": [0],
            "a": 3,
            "b": 15
        }])
        assert view.to_records() == [{"a": 3, "b": 15}, {"a": 2, "b": 3}]

    def test_update_implicit_index_dict_should_unset(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data)
        view = tbl.view()
        tbl.update({
            "__INDEX__": [0],
            "a": [3]
        })
        assert view.to_records() == [{"a": 3, "b": None}, {"a": 2, "b": 3}]

    def test_update_implicit_index_multi(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}, {"a": 4, "b": 5}]
        tbl = Table(data)
        view = tbl.view()
        tbl.update([{
            "__INDEX__": [0],
            "a": 3,
        }, {
            "__INDEX__": [2],
            "a": 5
        }])
        assert view.to_records() == [{"a": 3, "b": 2}, {"a": 2, "b": 3}, {"a": 5, "b": 5}]

    def test_update_implicit_index_symmetric(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data)
        view = tbl.view()
        records = view.to_records({"index": True})
        idx = records[0]["__INDEX__"]
        tbl.update([{
            "__INDEX__": idx,
            "a": 3
        }])
        assert view.to_records() == [{"a": 3, "b": 2}, {"a": 2, "b": 3}]

    def test_update_explicit_index(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "a": 1,
            "b": 3
        }])
        assert view.to_records() == [{"a": 1, "b": 3}, {"a": 2, "b": 3}]

    def test_update_explicit_index_multi(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}, {"a": 3, "b": 4}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "a": 1,
            "b": 3
        }, {
            "a": 3,
            "b": 5
        }])
        assert view.to_records() == [{"a": 1, "b": 3}, {"a": 2, "b": 3}, {"a": 3, "b": 5}]

    def test_update_explicit_index_multi_append(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}, {"a": 3, "b": 4}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "a": 1,
            "b": 3
        }, {
            "a": 12,
            "b": 5
        }])
        assert view.to_records() == [{"a": 1, "b": 3}, {"a": 2, "b": 3}, {"a": 3, "b": 4}, {"a": 12, "b": 5}]

    def test_update_explicit_index_multi_append_noindex(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}, {"a": 3, "b": 4}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "a": 1,
            "b": 3
        }, {
            "b": 5
        }])
        assert view.to_records() == [{"a": None, "b": 5}, {"a": 1, "b": 3}, {"a": 2, "b": 3}, {"a": 3, "b": 4}]

    def test_update_implicit_index_with_explicit_unset(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "__INDEX__": [1],
            "b": 3
        }])
        assert view.to_records() == [{"a": 1, "b": 3}, {"a": 2, "b": 3}]

    def test_update_implicit_index_with_explicit_set(self):
        data = [{"a": 1, "b": 2}, {"a": 2, "b": 3}]
        tbl = Table(data, {"index": "a"})
        view = tbl.view()
        tbl.update([{
            "__INDEX__": [1],
            "a": 1,  # should ignore re-specification of pkey
            "b": 3
        }])
        assert view.to_records() == [{"a": 1, "b": 3}, {"a": 2, "b": 3}]
