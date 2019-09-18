# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
from math import trunc
import numpy as np
from perspective.table.libbinding import get_from_data_slice_zero, get_from_data_slice_one, get_from_data_slice_two, \
    get_pkeys_from_data_slice_zero, get_pkeys_from_data_slice_one, get_pkeys_from_data_slice_two
from ._constants import COLUMN_SEPARATOR_STRING


def mod(a, b):
    '''C-style modulo function'''
    d = trunc(float(a) / b)
    return a - d * b


class _PerspectiveDataFormatter(object):
    '''Helper for exporting formatted data from Perspective.'''

    @staticmethod
    def to_format(options, view, column_names, data_slice, output_format):
        if output_format == 'records':
            data = []
        elif output_format in ('dict', 'numpy'):
            data = {}
            if options["index"]:
                data['__INDEX__'] = []

        num_columns = len(view._config.get_columns())
        num_hidden = view._num_hidden_cols()

        for ridx in range(options["start_row"], options["end_row"]):
            row_path = data_slice.get_row_path(ridx) if options["has_row_path"] else []
            if options["leaves_only"] and len(row_path) < len(view._config.get_row_pivots()):
                continue

            if output_format == 'records':
                data.append({})

            for cidx in range(options["start_col"], options["end_col"]):
                name = COLUMN_SEPARATOR_STRING.join([n.to_string(False) for n in column_names[cidx]])

                if mod((cidx - (1 if view._sides > 0 else 0)), (num_columns + num_hidden)) >= len(view._config.get_columns()):
                    # don't emit columns used for hidden sort
                    continue
                elif cidx == options["start_col"] and view._sides > 0:
                    if options["has_row_path"]:
                        paths = [path.to_string(False) for path in row_path]
                        paths.reverse()
                        if output_format == 'records':
                            data[-1]["__ROW_PATH__"] = paths
                        elif output_format in ('dict', 'numpy'):
                            if "__ROW_PATH__" not in data:
                                data["__ROW_PATH__"] = []
                            data["__ROW_PATH__"].append(paths)
                else:
                    if output_format in ('dict', 'numpy') and (name not in data):
                        # TODO: push into C++ for numpy
                        data[name] = []
                    if view._sides == 0:
                        value = get_from_data_slice_zero(data_slice, ridx, cidx)
                    elif view._sides == 1:
                        value = get_from_data_slice_one(data_slice, ridx, cidx)
                    else:
                        value = get_from_data_slice_two(data_slice, ridx, cidx)

                    if output_format == 'records':
                        data[-1][name] = value
                    else:
                        data[name].append(value)

            if options['index']:
                if view._sides == 0:
                    pkeys = get_pkeys_from_data_slice_zero(data_slice, ridx, 0)
                elif view._sides == 1:
                    pkeys = get_pkeys_from_data_slice_one(data_slice, ridx, 0)
                else:
                    pkeys = get_pkeys_from_data_slice_two(data_slice, ridx, 0)

                if output_format == 'records':
                    data[-1]['__INDEX__'] = []
                    for pkey in pkeys:
                        data[-1]['__INDEX__'].append(pkey)
                elif output_format in ('dict', 'numpy'):
                    if len(pkeys) == 0:
                        data["__INDEX__"].append([])  # ensure that `__INDEX__` has the same number of rows as returned dataset
                    for pkey in pkeys:
                        data['__INDEX__'].append([pkey])

        if output_format in ('dict', 'numpy') and (not options["has_row_path"] and ("__ROW_PATH__" in data)):
            del data["__ROW_PATH__"]

        if output_format == 'numpy':
            for k, v in data.items():
                # TODO push into C++
                data[k] = np.array(v)

        return data
