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

import re
from datetime import date, datetime
from functools import partial
from .libpsppy import t_dtype

ALIAS_REGEX = re.compile(r"//(.+)\n")
EXPRESSION_COLUMN_NAME_REGEX = re.compile(r"\"(.*?[^\\])\"")
STRING_LITERAL_REGEX = re.compile(r"'(.*?[^\\])'")
FUNCTION_LITERAL_REGEX = re.compile(r"(bucket|match|match_all|search|indexof)\(.*?,\s*(intern\(\'(.+)\'\)).*\)")
MATCH_INTERNED_ARGS_REGEX = re.compile(r"intern\('([^']*)'\)")
REPLACE_FN_REGEX = re.compile(r"(replace_all|replace)\(.*?,\s*(intern\(\'(.*)\'\)),.*\)")
BOOLEAN_LITERAL_REGEX = re.compile(r"([a-zA-Z_]+[a-zA-Z0-9_]*)")


def _extract_type(type, typemap):
    rval = typemap.get(type)

    if rval is None:
        return None

    return rval


def _dtype_to_pythontype(dtype):
    """Returns the native Python type from a Perspective type"""
    mapping = {
        t_dtype.DTYPE_BOOL: bool,
        t_dtype.DTYPE_FLOAT32: float,
        t_dtype.DTYPE_FLOAT64: float,
        t_dtype.DTYPE_UINT8: int,
        t_dtype.DTYPE_UINT16: int,
        t_dtype.DTYPE_UINT32: int,
        t_dtype.DTYPE_UINT64: int,
        t_dtype.DTYPE_INT8: int,
        t_dtype.DTYPE_INT16: int,
        t_dtype.DTYPE_INT32: int,
        t_dtype.DTYPE_INT64: int,
        t_dtype.DTYPE_DATE: date,
        t_dtype.DTYPE_TIME: datetime,
        t_dtype.DTYPE_STR: str,
    }

    return _extract_type(dtype, mapping)


def _dtype_to_str(dtype):
    """Returns the normalized string representation of a Perspective type,
    compatible with Perspective.js.
    """
    mapping = {
        t_dtype.DTYPE_BOOL: "boolean",
        t_dtype.DTYPE_FLOAT32: "float",
        t_dtype.DTYPE_FLOAT64: "float",
        t_dtype.DTYPE_INT8: "integer",
        t_dtype.DTYPE_INT16: "integer",
        t_dtype.DTYPE_INT32: "integer",
        t_dtype.DTYPE_INT64: "integer",
        t_dtype.DTYPE_DATE: "date",
        t_dtype.DTYPE_TIME: "datetime",
        t_dtype.DTYPE_STR: "string",
    }

    return _extract_type(dtype, mapping)


def _str_to_pythontype(typestring):
    """Returns a Python type from the normalized string representation of a
    Perspective type, i.e. from Perspective.js.
    """
    mapping = {
        "boolean": bool,
        "float": float,
        "integer": int,
        "date": date,
        "datetime": datetime,
        "string": str,
        "object": object,
    }

    return _extract_type(typestring, mapping)


def _pythontype_to_str(typestring):
    """Returns the normalized string representation of a Perspective type from
    a Python type object.
    """
    mapping = {
        bool: "boolean",
        float: "float",
        int: "integer",
        date: "date",
        datetime: "datetime",
        str: "string",
        object: "object",
    }

    return _extract_type(typestring, mapping)


def _replace_expression_column_name(column_name_map, column_id_map, running_cidx, match_obj):
    """Replace column names in the expression syntax with a column ID,
    filling the column_name_map and column_id_map."""
    column_name = match_obj.group(1)

    # first, replace escaped single quotes inside the column name, assuming that
    # they are escaping a single apostrophe. Because Python treats backslashes
    # as escapes, users need to write two backslashes in order to properly
    # escape single quotes - i.e. "here\\'s an apostrophe".
    if column_name not in column_name_map:
        column_id = "COLUMN{0}".format(running_cidx[0])
        column_name_map[column_name] = column_id
        column_id_map[column_id] = column_name

    running_cidx[0] += 1

    return column_name_map[column_name]


def _replace_interned_param(match_obj):
    """Replace the intern('unit') in `bucket()` with just the string
    literal, because the unit determines the return type of the column and the
    function would not be able to validate a unit if it was interned."""
    full = match_obj.group(0)
    intern_fn = match_obj.group(2)
    value = match_obj.group(3)
    intern_idx = full.index(intern_fn)

    # from fn(param, intern('string'), param, param...) to
    # fn (param, 'string', ...)
    return "{}'{}'{}".format(full[0:intern_idx], value, full[intern_idx + len(intern_fn) :])


def _parse_expression_strings(expressions):
    """Given a list of string expressions, parse out column names and string
    literals using regex and return a list of lists that contain three items
    in each inner list:

    0: the original expression that the user typed
    1: the parsed expression that will be computed
    2: a `dict` of column IDs (`COLUMN0`, `COLUMN1` etc.) to actual column
       names, which will be used by the engine.
    """
    validated_expressions = []
    alias_map = {}

    for expression in expressions:
        if '""' in expression:
            raise ValueError("Cannot reference empty column in expression!")

        column_id_map = {}
        column_name_map = {}

        alias_match = re.match(ALIAS_REGEX, expression)

        # initialize `parsed` here so we keep `expression` unedited as the
        # user typed it into Perspective
        parsed = expression

        if alias_match:
            alias = alias_match.group(1).strip()
        else:
            # Expression itself is the alias
            alias = expression

        # we need to be able to modify the running_cidx inside of every call to
        # replacer_fn - must pass by reference unfortunately
        running_cidx = [0]

        replacer_fn = partial(
            _replace_expression_column_name,
            column_name_map,
            column_id_map,
            running_cidx,
        )

        parsed = re.sub(
            BOOLEAN_LITERAL_REGEX,
            lambda match: "True" if match.group(0) == "true" else ("False" if match.group(0) == "false" else match.group(0)),
            parsed,
        )

        parsed = re.sub(EXPRESSION_COLUMN_NAME_REGEX, replacer_fn, parsed)
        parsed = re.sub(
            STRING_LITERAL_REGEX,
            lambda match: "intern({0})".format(match.group(0)),
            parsed,
        )

        # remove the `intern()` in bucket and regex functions that take
        # string literal parameters. TODO this logic should be centralized
        # in C++ instead of being duplicated.
        parsed = re.sub(FUNCTION_LITERAL_REGEX, _replace_interned_param, parsed)
        parsed = re.sub(REPLACE_FN_REGEX, _replace_interned_param, parsed)

        validated = [alias, expression, parsed, column_id_map]

        if alias_map.get(alias) is not None:
            idx = alias_map[alias]
            validated_expressions[idx] = validated
        else:
            validated_expressions.append(validated)
            alias_map[alias] = len(validated_expressions) - 1

    return validated_expressions
