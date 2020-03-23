# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import os
import time
import pytz
import numpy as np
import pandas as pd
from datetime import date, datetime
from dateutil import tz
from perspective.table import Table

LOCAL_DATETIMES = [
    datetime(2019, 1, 11, 0, 10, 20),
    datetime(2019, 1, 11, 11, 10, 20),
    datetime(2019, 1, 11, 19, 10, 20)
]

# Test the DST transition for Continental US
LOCAL_DATETIMES_DST = [
    datetime(2019, 3, 9, 12, 10, 20),
    datetime(2019, 3, 19, 12, 10, 20),
    datetime(2019, 11, 2, 12, 10, 20),
    datetime(2019, 11, 3, 12, 10, 20)
]

LOCAL_TIMESTAMPS = [pd.Timestamp(d) for d in LOCAL_DATETIMES]
LOCAL_TIMESTAMPS_DST = [pd.Timestamp(d) for d in LOCAL_DATETIMES_DST]

# Set up testing data
UTC = pytz.UTC

UTC_DATETIMES = [UTC.localize(d) for d in LOCAL_DATETIMES]
UTC_TIMESTAMPS = [UTC.localize(d) for d in LOCAL_TIMESTAMPS]

UTC_DATETIMES_DST = [UTC.localize(d, is_dst=True) for d in LOCAL_DATETIMES_DST]
UTC_TIMESTAMPS_DST = [UTC.localize(d, is_dst=True) for d in LOCAL_TIMESTAMPS_DST]

PST = pytz.timezone("US/Pacific")
CST = pytz.timezone("US/Central")
EST = pytz.timezone("US/Eastern")
GMT = pytz.timezone("GMT")
HKT = pytz.timezone("Asia/Hong_Kong")
JPT = pytz.timezone("Asia/Tokyo")
ACT = pytz.timezone("Australia/ACT")

TIMEZONES = [PST, CST, EST, GMT, HKT, JPT, ACT]

TZ_DATETIMES = {}
TZ_TIMESTAMPS = {}

TZ_DATETIMES_DST = {}
TZ_TIMESTAMPS_DST = {}

for TZ in TIMEZONES:
    TZ_DATETIMES[TZ.zone] = [TZ.localize(d) for d in LOCAL_DATETIMES]
    TZ_TIMESTAMPS[TZ.zone] = [d.tz_localize(TZ) for d in LOCAL_TIMESTAMPS]
    TZ_DATETIMES_DST[TZ.zone] = [d.astimezone(TZ) for d in UTC_DATETIMES_DST]
    TZ_TIMESTAMPS_DST[TZ.zone] = [d.tz_convert(TZ) for d in UTC_TIMESTAMPS_DST]

if os.name != 'nt':
    # no tzset on windows, run these tests on linux/mac only

    class TestTableLocalDateTime(object):
        """Test datetimes across configurations such as local time, timezone-aware,
        timezone-naive, and UTC implementations.
        """
        def setup_method(self):
            # To make sure that local times are not changed, set timezone to EST
            os.environ["TZ"] = "US/Eastern"
            time.tzset()

        def teardown_method(self):
            # go back to UTC at end of each test method, for consistency
            os.environ["TZ"] = "UTC"
            time.tzset()

        def test_table_should_assume_local_time(self):
            """If a datetime object has no `tzinfo`, it should be assumed to be in
            local time and not be converted at all.
            """
            data = {
                "a": LOCAL_DATETIMES
            }
            table = Table(data)
            assert table.view().to_dict()["a"] == LOCAL_DATETIMES

        def test_table_should_assume_local_time_numpy_datetime64(self):
            data = {
                "a": [np.datetime64(d) for d in LOCAL_DATETIMES]
            }
            table = Table(data)
            assert table.view().to_dict()["a"] == LOCAL_DATETIMES

        def test_table_should_assume_local_time_pandas_timestamp(self):
            data = {
                "a": LOCAL_TIMESTAMPS
            }

            # Timestamps are assumed to be in UTC by pandas
            table = Table(data)

            # Timestamps are read out in local time
            assert table.view().to_dict()["a"] == LOCAL_DATETIMES

        def test_table_should_assume_local_time_pandas_timestamp_df(self):
            data = pd.DataFrame({
                "a": LOCAL_TIMESTAMPS
            })

            # Timestamps are assumed to be in UTC by pandas
            table = Table(data)

            # Timestamps are read out in local time
            assert table.view().to_dict()["a"] == [
                datetime(2019, 1, 10, 19, 10, 20),
                datetime(2019, 1, 11, 6, 10, 20),
                datetime(2019, 1, 11, 14, 10, 20)
            ]

        def test_table_should_assume_local_time_dst(self):
            """If a datetime object has no `tzinfo`, it should be assumed to be in
            local time and not be converted at all.
            """
            data = {
                "a": LOCAL_DATETIMES_DST
            }
            table = Table(data)
            assert table.view().to_dict()["a"] == LOCAL_DATETIMES_DST

        def test_table_should_assume_local_time_numpy_datetime64_dst(self):
            data = {
                "a": [np.datetime64(d) for d in LOCAL_DATETIMES_DST]
            }
            table = Table(data)
            assert table.view().to_dict()["a"] == LOCAL_DATETIMES_DST

        def test_table_should_assume_local_time_pandas_timestamp_dst(self):
            data = {
                "a": LOCAL_TIMESTAMPS_DST
            }
            table = Table(data)
            assert table.view().to_dict()["a"] == LOCAL_DATETIMES_DST

        def test_table_should_assume_local_time_pandas_timestamp_dst_df(self):
            data = pd.DataFrame({
                "a": LOCAL_TIMESTAMPS_DST
            })
            table = Table(data)
            assert table.view().to_dict()["a"] == [
                datetime(2019, 3, 9, 7, 10, 20),
                datetime(2019, 3, 19, 8, 10, 20),
                datetime(2019, 11, 2, 8, 10, 20),
                datetime(2019, 11, 3, 7, 10, 20)
            ]

    class TestTableDateTimeUTCToLocal(object):

        def teardown_method(self):
            # Set timezone to UTC, always
            os.environ["TZ"] = "UTC"
            time.tzset()

        def test_table_should_convert_UTC_to_local_time_pytz_pacific(self):
            """If the datetime has `tzinfo` set, use it to convert the datetime to
            UTC. Make sure this works with both `pytz` and `dateutil` for
            `datetime` and `pandas.Timestamp`.
            """
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "US/Pacific"
            time.tzset()

            # Should be in PST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(PST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_central(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_eastern(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_GMT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict() == {
                "a": [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_HKT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_JPT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_ACT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_pacific(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "US/Pacific"
            time.tzset()

            # Should be in PST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(PST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_central(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_eastern(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_GMT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict() == {
                "a": [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_pacific_DST(self):
            data = {
                "a": UTC_DATETIMES_DST
            }
            table = Table(data)

            os.environ["TZ"] = "US/Pacific"
            time.tzset()

            # Should be in PST now
            assert table.view().to_dict() == {
                "a": [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["US/Pacific"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_central_DST(self):
            data = {
                "a": UTC_DATETIMES_DST
            }
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict() == {
                "a": [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["US/Central"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_eastern_DST(self):
            data = {
                "a": UTC_DATETIMES_DST
            }
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict() == {
                "a": [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["US/Eastern"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_GMT_DST(self):
            data = {
                "a": UTC_DATETIMES_DST
            }
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict() == {
                "a": [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["GMT"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_pacific_DST_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS_DST
            })
            table = Table(data)

            os.environ["TZ"] = "US/Pacific"
            time.tzset()

            # Should be in PST now
            assert table.view().to_dict()["a"] == [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["US/Pacific"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_central_DST_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS_DST
            })
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict()["a"] == [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["US/Central"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_eastern_DST_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS_DST
            })
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict()["a"] == [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["US/Eastern"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_GMT_DST_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS_DST
            })
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict()["a"] == [d.replace(tzinfo=None) for d in TZ_DATETIMES_DST["GMT"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_HKT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_JPT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_dateutil_ACT(self):
            data = {
                "a": UTC_DATETIMES
            }
            table = Table(data)

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            ACT = tz.gettz("Australia/Sydney")

            assert table.view().to_dict() == {
                "a": [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_UTC_to_local_time_pytz_pacific_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "US/Pacific"
            time.tzset()

            # Should be in PST now
            assert table.view().to_dict()["a"] == [d.astimezone(PST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_pytz_central_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict()["a"] == [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_pytz_eastern_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict()["a"] == [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_pytz_GMT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict()["a"] == [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_pytz_HKT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_pytz_JPT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_pytz_ACT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_pacific_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "US/Pacific"
            time.tzset()

            # Should be in PST now
            assert table.view().to_dict()["a"] == [d.astimezone(PST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_central_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            CST = tz.gettz("US/Central")

            # Should be in CST now
            assert table.view().to_dict()["a"] == [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_eastern_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict()["a"] == [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_GMT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            GMT = tz.gettz("GMT")

            # Should be in GMT now
            assert table.view().to_dict()["a"] == [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_HKT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_JPT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_UTC_to_local_time_dateutil_ACT_timestamp(self):
            data = pd.DataFrame({
                "a": UTC_TIMESTAMPS
            })
            table = Table(data)

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]

    class TestTableDateTimeArbitaryToLocal(object):

        def teardown_method(self):
            # Set timezone to UTC, always
            os.environ["TZ"] = "UTC"
            time.tzset()

        def test_table_should_convert_PST_to_local_time_pytz_central(self):
            data = {
                "a": TZ_DATETIMES["US/Pacific"]
            }
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_CST_to_local_time_pytz_eastern(self):
            data = {
                "a": TZ_DATETIMES["US/Central"]
            }
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_EST_to_local_time_pytz_GMT(self):
            data = {
                "a": TZ_DATETIMES["US/Eastern"]
            }
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict() == {
                "a": [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_GMT_to_local_time_pytz_HKT(self):
            data = {
                "a": TZ_DATETIMES["GMT"]
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_HKT_to_local_time_pytz_JPT(self):
            data = {
                "a": TZ_DATETIMES["Asia/Hong_Kong"]
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_JPT_to_local_time_pytz_ACT(self):
            data = {
                "a": TZ_DATETIMES["Asia/Tokyo"]
            }
            table = Table(data)

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_PST_to_local_time_dateutil_central(self):
            data = {
                "a": TZ_DATETIMES["US/Pacific"]
            }
            table = Table(data)

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_CST_to_local_time_dateutil_eastern(self):
            data = {
                "a": TZ_DATETIMES["US/Central"]
            }
            table = Table(data)

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict() == {
                "a": [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_EST_to_local_time_dateutil_GMT(self):
            data = {
                "a": TZ_DATETIMES["US/Eastern"]
            }
            table = Table(data)

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict() == {
                "a": [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_GMT_to_local_time_dateutil_HKT(self):
            data = {
                "a": TZ_DATETIMES["GMT"]
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_HKT_to_local_time_dateutil_JPT(self):
            data = {
                "a": TZ_DATETIMES["Asia/Hong_Kong"]
            }
            table = Table(data)

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_JPT_to_local_time_dateutil_ACT(self):
            data = {
                "a": TZ_DATETIMES["Asia/Tokyo"]
            }
            table = Table(data)

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict() == {
                "a": [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]
            }

        def test_table_should_convert_PST_to_local_time_pytz_central_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["US/Pacific"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict()["a"] == [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_CST_to_local_time_pytz_eastern_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["US/Central"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict()["a"] == [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_EST_to_local_time_pytz_GMT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["US/Eastern"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict()["a"] == [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_GMT_to_local_time_pytz_HKT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["GMT"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_HKT_to_local_time_pytz_JPT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["Asia/Hong_Kong"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_JPT_to_local_time_pytz_ACT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["Asia/Tokyo"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_PST_to_local_time_dateutil_central_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["US/Pacific"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "US/Central"
            time.tzset()

            # Should be in CST now
            assert table.view().to_dict()["a"] == [d.astimezone(CST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_CST_to_local_time_dateutil_eastern_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["US/Central"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "US/Eastern"
            time.tzset()

            # Should be in EST now
            assert table.view().to_dict()["a"] == [d.astimezone(EST).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_EST_to_local_time_dateutil_GMT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["US/Eastern"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "GMT"
            time.tzset()

            # Should be in GMT now
            assert table.view().to_dict()["a"] == [d.astimezone(GMT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_GMT_to_local_time_dateutil_HKT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["GMT"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "Asia/Hong_Kong"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(HKT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_HKT_to_local_time_dateutil_JPT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["Asia/Hong_Kong"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "Asia/Tokyo"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(JPT).replace(tzinfo=None) for d in data["a"]]

        def test_table_should_convert_JPT_to_local_time_dateutil_ACT_timestamp(self):
            data = {
                "a": TZ_TIMESTAMPS["Asia/Tokyo"]
            }
            table = Table(pd.DataFrame(data))

            os.environ["TZ"] = "Australia/Sydney"
            time.tzset()

            assert table.view().to_dict()["a"] == [d.astimezone(ACT).replace(tzinfo=None) for d in data["a"]]


class TestTableDateTimePivots(object):

    def test_table_row_pivot_date_correct(self):
        data = {
            "a": [date(2020, i, 15) for i in range(1, 13)],
            "b": [i for i in range(1, 13)]
        }
        table = Table(data)
        view = table.view(row_pivots=["a"])
        assert view.to_columns() == {
            "__ROW_PATH__": [
                [],
                ['2020-01-15'],
                ['2020-02-15'],
                ['2020-03-15'],
                ['2020-04-15'],
                ['2020-05-15'],
                ['2020-06-15'],
                ['2020-07-15'],
                ['2020-08-15'],
                ['2020-09-15'],
                ['2020-10-15'],
                ['2020-11-15'],
                ['2020-12-15']
            ],
            "a": [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            "b": [78, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }

    def test_table_row_pivot_pandas_date_correct(self):
        data = {
            "a": [date(2020, i, 15) for i in range(1, 13)],
            "b": [i for i in range(1, 13)]
        }
        table = Table(pd.DataFrame(data))
        view = table.view(row_pivots=["a"])
        assert view.to_columns() == {
            "__ROW_PATH__": [
                [],
                ['2020-01-15'],
                ['2020-02-15'],
                ['2020-03-15'],
                ['2020-04-15'],
                ['2020-05-15'],
                ['2020-06-15'],
                ['2020-07-15'],
                ['2020-08-15'],
                ['2020-09-15'],
                ['2020-10-15'],
                ['2020-11-15'],
                ['2020-12-15']
            ],
            "index": [66, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "a": [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            "b": [78, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }

    def test_table_column_pivot_date_correct(self):
        data = {
            "a": [date(2020, i, 15) for i in range(1, 13)],
            "b": [i for i in range(1, 13)]
        }
        table = Table(data)
        view = table.view(column_pivots=["a"])
        assert view.to_columns() == {
            '2020-01-15|a': [datetime(2020, 1, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-01-15|b': [1,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-02-15|a': [None,
                             datetime(2020, 2, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-02-15|b': [None,
                             2,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-03-15|a': [None,
                             None,
                             datetime(2020, 3, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-03-15|b': [None,
                             None,
                             3,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-04-15|a': [None,
                             None,
                             None,
                             datetime(2020, 4, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-04-15|b': [None,
                             None,
                             None,
                             4,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-05-15|a': [None,
                             None,
                             None,
                             None,
                             datetime(2020, 5, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-05-15|b': [None,
                             None,
                             None,
                             None,
                             5,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-06-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 6, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-06-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             6,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-07-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 7, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-07-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             7,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-08-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 8, 15, 0, 0),
                             None,
                             None,
                             None,
                             None],
            '2020-08-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             8,
                             None,
                             None,
                             None,
                             None],
            '2020-09-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 9, 15, 0, 0),
                             None,
                             None,
                             None],
            '2020-09-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             9,
                             None,
                             None,
                             None],
            '2020-10-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 10, 15, 0, 0),
                             None,
                             None],
            '2020-10-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             10,
                             None,
                             None],
            '2020-11-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 11, 15, 0, 0),
                             None],
            '2020-11-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             11,
                             None],
            '2020-12-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 12, 15, 0, 0)],
            '2020-12-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             12]
        }

    def test_table_column_pivot_pandas_date_correct(self):
        data = {
            "a": [date(2020, i, 15) for i in range(1, 13)],
            "b": [i for i in range(1, 13)]
        }
        table = Table(pd.DataFrame(data))
        view = table.view(columns=["a", "b"], column_pivots=["a"])
        assert view.to_columns() == {
            '2020-01-15|a': [datetime(2020, 1, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-01-15|b': [1,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-02-15|a': [None,
                             datetime(2020, 2, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-02-15|b': [None,
                             2,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-03-15|a': [None,
                             None,
                             datetime(2020, 3, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-03-15|b': [None,
                             None,
                             3,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-04-15|a': [None,
                             None,
                             None,
                             datetime(2020, 4, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-04-15|b': [None,
                             None,
                             None,
                             4,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-05-15|a': [None,
                             None,
                             None,
                             None,
                             datetime(2020, 5, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-05-15|b': [None,
                             None,
                             None,
                             None,
                             5,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-06-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 6, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-06-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             6,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-07-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 7, 15, 0, 0),
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-07-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             7,
                             None,
                             None,
                             None,
                             None,
                             None],
            '2020-08-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 8, 15, 0, 0),
                             None,
                             None,
                             None,
                             None],
            '2020-08-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             8,
                             None,
                             None,
                             None,
                             None],
            '2020-09-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 9, 15, 0, 0),
                             None,
                             None,
                             None],
            '2020-09-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             9,
                             None,
                             None,
                             None],
            '2020-10-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 10, 15, 0, 0),
                             None,
                             None],
            '2020-10-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             10,
                             None,
                             None],
            '2020-11-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 11, 15, 0, 0),
                             None],
            '2020-11-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             11,
                             None],
            '2020-12-15|a': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             datetime(2020, 12, 15, 0, 0)],
            '2020-12-15|b': [None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             None,
                             12]
        }
