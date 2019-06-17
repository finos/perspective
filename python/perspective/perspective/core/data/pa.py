# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import sys
from .base import Data


class ArrowData(Data):
    def __init__(self, data, schema=None, columns=None, **kwargs):
        super(ArrowData, self).__init__('arrow', data.to_pybytes(), schema, columns, **kwargs)


def _is_pyarrow(data, schema, columns, transfer_as_arrow=False):
    try:
        if 'pyarrow' in sys.modules:
            import pyarrow as pa
            if isinstance(data, pa.lib.Buffer):
                return ArrowData(data, schema, columns)
    except ImportError:
        return Data.Empty()
    return Data.Empty()
