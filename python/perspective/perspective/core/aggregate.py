#  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
#  ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
#  ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
#  ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
#  ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
#  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
#  ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
#  ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
#  ┃ This file is part of the Perspective library, distributed under the terms ┃
#  ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
#  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

from enum import Enum


class Aggregate(Enum):
    """The aggregation operators available in Perspective. Pass these into the
    `aggregates` arg in `PerspectiveWidget` or `PerspectiveViewer`.

    Examples:
        >>> widget = PerspectiveWidget(data, aggregates={"a": Aggregate.LAST})
    """

    AND = "and"
    ANY = "any"
    AVG = "avg"
    COUNT = "count"
    DISTINCT_COUNT = "distinct count"
    DISTINCT_LEAF = "distinct leaf"
    DOMINANT = "dominant"
    FIRST_BY_INDEX = "first by index"
    LAST_BY_INDEX = "last by index"
    LAST_MINUS_FIRST = "last minus first"
    LAST = "last"
    HIGH = "high"
    JOIN = "join"
    LOW = "low"
    HIGH_MINUS_LOW = "high minus low"
    MEAN = "mean"
    MEDIAN = "median"
    OR = "or"
    PCT_SUM_PARENT = "pct sum parent"
    PCT_SUM_GRAND_TOTAL = "pct sum grand total"
    STANDARD_DEVIATION = "stddev"
    SUM = "sum"
    SUM_ABS = "sum abs"
    ABS_SUM = "abs sum"
    SUM_NOT_NULL = "sum not null"
    UNIQUE = "unique"
    VARIANCE = "var"

    @staticmethod
    def options():
        return list(c.value for c in Aggregate)
