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
