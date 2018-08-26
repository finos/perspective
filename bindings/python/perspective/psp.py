import ujson
from ._type import type_detect
from ._layout import layout
from ._schema import schema as _schema
from ._config import config


def psp(data, view='hypergrid', schema=None, columns=None, rowpivots=None, columnpivots=None, aggregates=None, sort=None, settings=False, dark=False, helper_config=None):
    '''Render a perspective javascript widget in jupyter

    Arguments:
        data {dataframe or live source} -- The static or live datasource

    Keyword Arguments:
        view {str/View} -- what view to use. available in the enum View (default: {'hypergrid'})
        columns {[string]} -- what columns to display
        rowpivots {[string]} -- what names to use as rowpivots
        columnpivots {[string]} -- what names to use as columnpivots
        aggregates {dict(str, str/Aggregate)} -- dictionary of name to aggregate type (either string or enum Aggregate)
        settings {bool} -- display settings
    '''
    from IPython.display import display

    typ, dat_orig, dat = type_detect(data, True)
    if schema and not isinstance(schema, str):
        schema = ujson.dumps(schema)

    bundle = {}
    bundle['application/psp+json'] = {
        'data': dat,
        'schema': schema or _schema(dat_orig, typ),
        'layout': layout(view, columns, rowpivots, columnpivots, aggregates, sort, settings, dark),
        'config': config(helper_config, dat_orig)
    }
    print(bundle)
    return display(bundle, raw=True)
