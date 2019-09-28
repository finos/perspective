# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import numpy as np
import pandas as pd
import string
import time
from datetime import date, datetime
from perspective.table import Table

size = 1000000
t1 = time.time()
arr = np.random.randn(size, 26)
t2 = time.time()
print(t2-t1)


t1 = time.time()
df_both = pd.DataFrame(arr, columns=[_ for _ in string.ascii_lowercase])
t2 = time.time()
print(t2-t1)


t1 = time.time()
table = Table(df_both)
# table = Table({_: arr[i] for i, _ in enumerate(string.ascii_lowercase)})
t2 = time.time()
print(t2-t1)

# print(table.size())
# assert table.size() == size
