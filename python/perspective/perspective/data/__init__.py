from .base import _is_dict, _is_list, Data
from .pd import _is_pandas
from .pa import _is_pyarrow

EXPORTERS = [_is_dict, _is_list, _is_pandas, _is_pyarrow]


def type_detect(data, schema=None):
    schema = None or {}
    for foo in EXPORTERS:
        data_object = foo(data, schema)
        if data_object.type:
            return data_object
    # throw error?
    return Data.Empty()
