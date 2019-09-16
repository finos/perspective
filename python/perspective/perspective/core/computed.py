# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from enum import Enum


class Functions(Enum):
    HOUR_OF_DAY = 'hour_of_day'
    DAY_OF_WEEK = 'day_of_week'
    MONTH_OF_YEAR = 'month_of_year'
    HOUR_BUCKET = 'hour_bucket'
    DAY_BUCKET = 'day_bucket'
    WEEK_BUCKET = 'week_bucket'
    MONTH_BUCKET = 'month_bucket'
    UPPERCASE = 'uppercase'
    LOWERCASE = 'lowercase'
    LENGTH = 'length'
    ADD = 'add'
    SUBTRACT = 'subtract'
    MULTIPLY = 'multiply'
    DIVIDE = 'divide'
    PERCENT_A_OF_B = 'percent_a_of_b'
    CONCAT_SPACE = 'concat_space'
    CONCAT_COMMA = 'concat_comma'

    @staticmethod
    def options():
        return list(map(lambda c: c.value, Functions))
