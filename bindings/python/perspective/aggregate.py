from enum import Enum


class Aggregate(Enum):
    ANY = 'any'
    AVG = 'avg'
    COUNT = 'count'
    DISTINCT_COUNT = 'distinct count'
    DOMINANT = 'dominant'
    FIRST = 'first'
    LAST = 'last'
    HIGH = 'high'
    LOW = 'low'
    MEAN = 'mean'
    MEAN_BY_COUNT = 'mean by count'
    MEDIAN = 'median'
    PCT_SUM_PARENT = 'pct sum parent'
    PCT_SUM_GRAND_TOTAL = 'pct sum grand total'
    SUM = 'sum'
    SUM_ABS = 'sum abs'
    SUM_NOT_NULL = 'sum not null'
    UNIQUE = 'unique'

    @staticmethod
    def options():
        return list(map(lambda c: c.value, Aggregate))
