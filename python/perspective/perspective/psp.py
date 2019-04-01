from functools import wraps
from .widget import PerspectiveWidget


def _or_default(name, _def):
    return name if name else _def


@wraps(PerspectiveWidget.__init__)
def psp(data=None,
        view='hypergrid',
        schema=None,
        columns=None,
        rowpivots=None,
        columnpivots=None,
        aggregates=None,
        sort=None,
        index='',
        limit=-1,
        computedcolumns=None,
        settings=True,
        dark=False,
        helper_config=None):
    data = [] if data is None else data
    return PerspectiveWidget(data, view, schema, columns, rowpivots, columnpivots, aggregates, sort, index, limit, computedcolumns, settings, dark)
