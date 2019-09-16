import numpy as np
import pandas as pd
import pytz
from datetime import date, datetime
from perspective.table import Table


class TestToFormat(object):

    # to_records

    def test_to_records_int(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == data

    def test_to_records_float(self):
        data = [{"a": 1.5, "b": 2.5}, {"a": 3.5, "b": 4.5}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == data

    def test_to_records_string(self):
        data = [{"a": "string1", "b": "string2"}, {"a": "string3", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == data

    def test_to_records_date(self):
        today = date.today()
        data = [{"a": today, "b": "string2"}, {"a": today, "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        dt = datetime(today.year, today.month, today.day)
        assert view.to_records() == [{"a": dt, "b": "string2"}, {"a": dt, "b": "string4"}]

    def test_to_records_date_no_dst(self):
        # make sure that DST does not affect the way we read dates - if tm_dst in `t_date::get_tm()` isn't set to -1, it could reverse 1hr by assuming DST is not in effect.
        today = date.today()
        data = [{"a": today, "b": "string2"}, {"a": today, "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        dt = datetime(today.year, today.month, today.day)
        assert view.to_records() == [{"a": dt, "b": "string2"}, {"a": dt, "b": "string4"}]

    def test_to_records_date_str(self):
        data = [{"a": "03/11/2019", "b": "string2"}, {"a": "03/12/2019", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == [{"a": datetime(2019, 3, 11), "b": "string2"}, {"a": datetime(2019, 3, 12), "b": "string4"}]

    def test_to_records_date_str_month_first(self):
        data = [{"a": "1/2/2019", "b": "string2"}, {"a": "3/4/2019", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.schema() == {"a": date, "b": str}
        assert view.to_records() == [{"a": datetime(2019, 1, 2), "b": "string2"}, {"a": datetime(2019, 3, 4), "b": "string4"}]

    def test_to_records_date_str_month_ymd(self):
        data = [{"a": "2019/01/02", "b": "string2"}, {"a": "2019/03/04", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.schema() == {"a": date, "b": str}
        assert view.to_records() == [{"a": datetime(2019, 1, 2), "b": "string2"}, {"a": datetime(2019, 3, 4), "b": "string4"}]

    def test_to_records_datetime(self):
        dt = datetime(2019, 9, 10, 19, 30, 59, 515000)
        data = [{"a": dt, "b": "string2"}, {"a": dt, "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == data  # should have symmetric input/output

    def test_to_records_datetime_str(self):
        data = [{"a": "03/11/2019 3:15PM", "b": "string2"}, {"a": "3/11/2019 3:20PM", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == [{"a": datetime(2019, 3, 11, 15, 15), "b": "string2"}, {"a": datetime(2019, 3, 11, 15, 20), "b": "string4"}]

    def test_to_records_datetime_str_tz(self):
        dt = "2019/07/25T15:30:00+00:00"
        data = [{"a": dt}, {"a": dt}]
        tbl = Table(data)
        view = tbl.view()
        records = view.to_records()
        for r in records:
            r["a"] = r["a"].replace(tzinfo=pytz.utc)
        assert records == [{"a": datetime(2019, 7, 25, 15, 30, tzinfo=pytz.utc)}, {"a": datetime(2019, 7, 25, 15, 30, tzinfo=pytz.utc)}]

    def test_to_records_datetime_ms_str(self):
        data = [{"a": "03/11/2019 3:15:15.999PM"}, {"a": "3/11/2019 3:15:16.001PM"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == [{"a": datetime(2019, 3, 11, 15, 15, 15, 999000)}, {"a": datetime(2019, 3, 11, 15, 15, 16, 1000)}]

    def test_to_records_none(self):
        data = [{"a": None, "b": 1}, {"a": None, "b": 2}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_records() == data

    def test_to_records_one(self):
        data = [{"a": 1, "b": "string1"}, {"a": 1, "b": "string2"}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"]
        })
        assert view.to_records() == [
            {"__ROW_PATH__": [], "a": 2, "b": 2}, {"__ROW_PATH__": ["1"], "a": 2, "b": 2}
        ]

    def test_to_records_two(self):
        data = [{"a": 1, "b": "string1"}, {"a": 1, "b": "string2"}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"],
            "column-pivots": ["b"]
        })
        assert view.to_records() == [
            {"__ROW_PATH__": [], "string1|a": 1, "string1|b": 1, "string2|a": 1, "string2|b": 1},
            {"__ROW_PATH__": ["1"], "string1|a": 1, "string1|b": 1, "string2|a": 1, "string2|b": 1},
        ]

    def test_to_records_column_only(self):
        data = [{"a": 1, "b": "string1"}, {"a": 1, "b": "string2"}]
        tbl = Table(data)
        view = tbl.view({
            "column-pivots": ["b"]
        })
        assert view.to_records() == [
            {"string1|a": 1, "string1|b": "string1", "string2|a": None, "string2|b": None},
            {"string1|a": None, "string1|b": None, "string2|a": 1, "string2|b": "string2"},
        ]

    # to_dict

    def test_to_dict_int(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": [1, 3],
            "b": [2, 4]
        }

    def test_to_dict_float(self):
        data = [{"a": 1.5, "b": 2.5}, {"a": 3.5, "b": 4.5}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": [1.5, 3.5],
            "b": [2.5, 4.5]
        }

    def test_to_dict_date(self):
        today = date.today()
        dt = datetime(today.year, today.month, today.day)
        data = [{"a": today, "b": 2}, {"a": today, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": [dt, dt],
            "b": [2, 4]
        }

    def test_to_dict_datetime(self):
        dt = datetime(2019, 3, 15, 20, 30, 59, 6000)
        data = [{"a": dt, "b": 2}, {"a": dt, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": [dt, dt],
            "b": [2, 4]
        }

    def test_to_dict_bool(self):
        data = [{"a": True, "b": False}, {"a": True, "b": False}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": [True, True],
            "b": [False, False]
        }

    def test_to_dict_string(self):
        data = [{"a": "string1", "b": "string2"}, {"a": "string3", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": ["string1", "string3"],
            "b": ["string2", "string4"]
        }

    def test_to_dict_none(self):
        data = [{"a": None, "b": None}, {"a": None, "b": None}]
        tbl = Table(data)
        view = tbl.view()
        assert view.to_dict() == {
            "a": [None, None],
            "b": [None, None]
        }

    def test_to_dict_one(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"]
        })
        assert view.to_dict() == {
            "__ROW_PATH__": [[], ["1"]],
            "a": [2, 2],
            "b": [4, 4]
        }

    def test_to_dict_two(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"],
            "column-pivots": ["b"]
        })
        assert view.to_dict() == {
            "__ROW_PATH__": [[], ["1"]],
            "2|a": [2, 2],
            "2|b": [4, 4]
        }

    def test_to_dict_column_only(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        tbl = Table(data)
        view = tbl.view({
            "column-pivots": ["b"]
        })
        assert view.to_dict() == {
            "2|a": [1, 1],
            "2|b": [2, 2],
        }

    # to_numpy

    def test_to_numpy_int(self):
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array([1, 3]))
        assert np.array_equal(v["b"], np.array([2, 4]))

    def test_to_numpy_float(self):
        data = [{"a": 1.5, "b": 2.5}, {"a": 3.5, "b": 4.5}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array([1.5, 3.5]))
        assert np.array_equal(v["b"], np.array([2.5, 4.5]))

    def test_to_numpy_bool(self):
        data = [{"a": True, "b": False}, {"a": True, "b": False}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array([True, True]))
        assert np.array_equal(v["b"], np.array([False, False]))

    def test_to_numpy_date(self):
        today = date.today()
        dt = datetime(today.year, today.month, today.day)
        data = [{"a": dt, "b": 2}, {"a": dt, "b": 4}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array([dt, dt]))

    def test_to_numpy_datetime(self):
        dt = datetime(2019, 3, 15, 20, 30, 59, 6000)
        data = [{"a": dt}, {"a": dt}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array([dt, dt]))

    def test_to_numpy_string(self):
        data = [{"a": "string1", "b": "string2"}, {"a": "string3", "b": "string4"}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array(["string1", "string3"]))
        assert np.array_equal(v["b"], np.array(["string2", "string4"]))

    def test_to_numpy_none(self):
        data = [{"a": None, "b": None}, {"a": None, "b": None}]
        tbl = Table(data)
        view = tbl.view()
        v = view.to_numpy()
        assert np.array_equal(v["a"], np.array([None, None]))
        assert np.array_equal(v["b"], np.array([None, None]))

    def test_to_numpy_one(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"]
        })
        v = view.to_numpy()
        assert np.array_equal(v["__ROW_PATH__"], [[], ["1"]])
        assert np.array_equal(v["a"], np.array([2, 2]))
        assert np.array_equal(v["b"], np.array([4, 4]))

    def test_to_numpy_two(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        tbl = Table(data)
        view = tbl.view({
            "row-pivots": ["a"],
            "column-pivots": ["b"]
        })
        v = view.to_numpy()
        assert np.array_equal(v["__ROW_PATH__"], [[], ["1"]])
        assert np.array_equal(v["2|a"], np.array([2, 2]))
        assert np.array_equal(v["2|b"], np.array([4, 4]))

    def test_to_numpy_column_only(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        tbl = Table(data)
        view = tbl.view({
            "column-pivots": ["b"]
        })
        v = view.to_numpy()
        assert np.array_equal(v["2|a"], np.array([1, 1]))
        assert np.array_equal(v["2|b"], np.array([2, 2]))

    def test_to_pandas_df_simple(self):
        data = [{"a": 1, "b": 2}, {"a": 1, "b": 2}]
        df = pd.DataFrame(data)
        tbl = Table(df)
        view = tbl.view()
        df2 = view.to_df()
        assert np.array_equal(df2.columns, df.columns)
        assert np.array_equal(df2["a"].values, df["a"].values)
        assert np.array_equal(df2["b"].values, df["b"].values)

    def test_to_pandas_df_simple_series(self):
        inp = pd.Series([1, 2, 3], name="a")
        df = pd.DataFrame()
        df["a"] = pd.Series([1, 2, 3])
        tbl = Table(inp)
        view = tbl.view()
        df2 = view.to_df()
        assert np.array_equal(df2.columns, df.columns)
        assert np.array_equal(df2["a"].values, df["a"].values)
