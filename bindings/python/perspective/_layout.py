import json
from six import iteritems
from .exception import PSPException
from .view import View
from .aggregate import Aggregate
from .sort import Sort


def validate_view(view):
    if isinstance(view, View):
        ret = view.value
    elif isinstance(view, str):
        if view not in View.options():
            raise PSPException('Unrecognized view: %s', view)
        ret = view
    else:
        raise PSPException('Cannot parse view type: %s', str(type(view)))
    return ret


def validate_columns(columns):
    if columns is None:
        ret = []
    elif isinstance(columns, str):
        ret = [columns]
    elif isinstance(columns, list):
        ret = columns
    else:
        raise PSPException('Cannot parse columns type: %s', str(type(columns)))
    return ret


def _validate_pivots(pivots):
    if pivots is None:
        ret = []
    elif isinstance(pivots, str):
        ret = [pivots]
    elif isinstance(pivots, list):
        ret = pivots
    else:
        raise PSPException('Cannot parse rowpivots type: %s', str(type(pivots)))
    return ret


def validate_rowpivots(rowpivots):
    return _validate_pivots(rowpivots)


def validate_columnpivots(columnpivots):
    return _validate_pivots(columnpivots)


def validate_aggregates(aggregates):
    if aggregates is None:
        ret = []
    elif isinstance(aggregates, dict):
        for k, v in iteritems(aggregates):
            if isinstance(v, Aggregate):
                aggregates[k] = v.value
            elif isinstance(v, str):
                if v not in Aggregate.options():
                    raise PSPException('Unrecognized aggregate: %s', v)
            else:
                raise PSPException('Cannot parse aggregation of type %s', str(type(v)))
        ret = aggregates
    else:
        raise PSPException('Cannot parse aggregates type: %s', str(type(aggregates)))
    return ret


def validate_sort(sort):
    if sort is None:
        ret = []
    elif isinstance(sort, str):
        ret = [sort]
    elif isinstance(sort, list):
        ret = []
        for col, s in sort:
            if isinstance(s, Sort):
                s = s.value
            elif not isinstance(s, str) or s not in Sort.options():
                raise PSPException('Unrecognized Sort: %s', s)
            ret.append([col, s])
    else:
        raise PSPException('Cannot parse sort type: %s', str(type(sort)))
    return ret


def layout(view='hypergrid', columns=None, rowpivots=None, columnpivots=None, aggregates=None, sort=None, settings=False, dark=False):
    ret = {}
    ret['view'] = validate_view(view)
    ret['columns'] = validate_columns(columns)
    ret['row-pivots'] = validate_rowpivots(rowpivots)
    ret['column-pivots'] = validate_columnpivots(columnpivots)
    ret['aggregates'] = validate_aggregates(aggregates)
    ret['sort'] = validate_sort(sort)
    ret['settings'] = settings
    ret['colorscheme'] = dark
    return json.dumps(ret)
