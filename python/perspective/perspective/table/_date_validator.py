# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
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
        '''
        try:
            return parse(str)
        except (ValueError, OverflowError):
            return None

    def format(self, str):
        '''Return either t_dtype.DTYPE_DATE or t_dtype.DTYPE_TIME depending on the format of the parsed date.

        If the parsed date is invalid, return t_dtype.DTYPE_STR to prevent further attempts at conversion.

        Params:
            str (str) : the datestring to parse
        '''
        try:
            parsed = parse(str)
            if (parsed.hour, parsed.minute, parsed.second, parsed.microsecond) == (0, 0, 0, 0):
                return t_dtype.DTYPE_DATE
            else:
                return t_dtype.DTYPE_TIME
        except (ValueError, OverflowError):
            return t_dtype.DTYPE_STR
