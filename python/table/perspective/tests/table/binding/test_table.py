# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import os
import os.path
import numpy as np
import pandas as pd
from perspective.table.libbinding import Table, t_pool, t_op, t_dtype


class TestTable(object):
    def test_table(self):
        pool = t_pool()
        t = Table(pool,
                  ['test'],
                  [t_dtype.DTYPE_INT32],
                  0,
                  ''
                  )
