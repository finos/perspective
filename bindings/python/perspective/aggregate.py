from enum import Enum


class Aggregate(Enum):
    ANY = 'any'
    AVG = 'avg'
    COUNT = 'count'
    DISTINCT_COUNT = 'distinct_count'
    DOMINANT = 'dominant'
    FIRST = 'first'
    LAST = 'last'
    HIGH = 'high'
    LOW = 'low'
    MEAN = 'mean'
    MEAN_BY_COUNT = 'mean_by_count'
    MEDIAN = 'median'
    PCT_SUM_PARENT = 'pct_sum_parent'
    PCT_SUM_GRAND_TOTAL = 'pct_sum_grand_total'
    SUM = 'sum'
    SUM_ABS = 'sum_abs'
    SUM_NOT_NULL = 'sum_not_null'
    UNIQUE = 'unique'

    @staticmethod
    def options():
        return list(map(lambda c: c.value, Aggregate))
