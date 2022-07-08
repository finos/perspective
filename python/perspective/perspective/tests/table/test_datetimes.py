################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

from pytest import raises
import pytz
import pandas as pd
import perspective
from datetime import date, datetime, timedelta

TIMEZONE = pytz.timezone("America/New_York")


class TestException(object):
    def test_datetime_seconds_string_with_period_sep_parses_correctly(self):
        dt = datetime(2022, 7, 8, 5, 15, 35).astimezone(TIMEZONE)
        dt_str = dt.strftime("%m/%d/%Y %H:%M.%S %p")
        df = pd.DataFrame(
            [
                {
                    "datetime": dt,
                    "datetime_str": dt_str,
                }
            ]
        )

        tbl = perspective.Table(df)
        view = tbl.view()
        result = view.to_records()
        assert result[0]["datetime"].second == result[0]["datetime_str"].second

    def test_datetime_seconds_string_with_colon_sep_parses_correctly(self):
        dt = datetime(2022, 7, 8, 5, 15, 35).astimezone(TIMEZONE)
        dt_str = dt.strftime("%m/%d/%Y %H:%M:%S %p")
        df = pd.DataFrame(
            [
                {
                    "datetime": dt,
                    "datetime_str": dt_str,
                }
            ]
        )

        tbl = perspective.Table(df)
        view = tbl.view()
        result = view.to_records()
        assert result[0]["datetime"].second == result[0]["datetime_str"].second
