# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from .base import _is_dict, _is_list, Data
from .pd import _is_pandas
from .pa import _is_pyarrow

EXPORTERS = [_is_dict, _is_list, _is_pandas, _is_pyarrow]


def type_detect(data, schema=None, columns=None, transfer_as_arrow=False):
    schema = schema or {}
    for foo in EXPORTERS:
        data_object = foo(data, schema=schema, columns=columns, transfer_as_arrow=transfer_as_arrow)
        if data_object.type:
            if transfer_as_arrow and foo != _is_pyarrow:
                return _is_pyarrow(data_object.data, data_object.schema, data_object.columns)
            else:
                return data_object
    # throw error?
    return Data.Empty()
