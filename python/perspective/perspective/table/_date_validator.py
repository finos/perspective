# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import time
import numpy
from datetime import datetime
from re import search
from dateutil.parser import parse
from perspective.table.libbinding import t_dtype


class _PerspectiveDateValidator(object):
    '''Validate and parse dates using the `dateutil` package.'''

    def parse(self, str):
        '''Return a datetime.datetime object containing the parsed date, or None if the date is invalid.

        If a ISO date string with a timezone is provided, there is no guarantee that timezones will be properly handled,
        as the core engine stores the timestamp as milliseconds since epoch. When a datetime is retrieved from the engine,
        it is constructed with the timestamp, thus any timezone set on the input data will not apply to the output data.

        Params:
            str (str) : the datestring to parse

        Returns:
            A datetime.date or datetime.datetime object if parse is successful, None otherwise
        '''
        try:
            return parse(str)
        except (ValueError, OverflowError):
            return None

    def to_date_components(self, d):
        '''Return a dictionary of string keys and integer values for `year`, `month`, and `day`.

        This method converts both datetime.date and numpy.datetime64 objects that contain datetime.date.
        '''
        if d is None:
            return d

        if isinstance(d, numpy.datetime64):
            if str(d) == "NaT":
                return None
            dt = d.astype(datetime)
            return {
                "year": dt.year,
                "month": dt.month,
                "day": dt.day
            }

        return {
            "year": d.year,
            "month": d.month,
            "day": d.day
        }

    def to_timestamp(self, d):
        '''Return an integer that corresponds to the Unix timestamp, i.e. number of milliseconds since epoch.

        This method converts both datetime.datetime and numpy.datetime64 objects.
        '''
        if d is None:
            return d

        if isinstance(d, numpy.datetime64):
            if str(d) == "NaT":
                return None

            d = d.astype(datetime)

            if isinstance(d, int):
                # sometimes `astype(datetime)` returns an int timestamp in nanoseconds - parse this.
                return round(d / 1000000)

        # Convert `datetime.datetime` and `pandas.Timestamp` to millisecond timestamps
        return int((time.mktime(d.timetuple()) + d.microsecond / 1000000.0) * 1000)

    def format(self, str):
        '''Return either t_dtype.DTYPE_DATE or t_dtype.DTYPE_TIME depending on the format of the parsed date.

        If the parsed date is invalid, return t_dtype.DTYPE_STR to prevent further attempts at conversion.

        Attempt to use heuristics about dates to minimize false positives, i.e. do not parse dates without separators.

        Params:
            str (str) : the datestring to parse
        '''
        has_separators = bool(search(r"[/. -]", str))  # match commonly-used date separators
        dtype = t_dtype.DTYPE_STR

        if has_separators:
            try:
                parsed = parse(str)
                if (parsed.hour, parsed.minute, parsed.second, parsed.microsecond) == (0, 0, 0, 0):
                    dtype = t_dtype.DTYPE_DATE
                else:
                    dtype = t_dtype.DTYPE_TIME
            except (ValueError, OverflowError):
                # unparsable dates should be coerced to string
                dtype = t_dtype.DTYPE_STR

        return dtype
