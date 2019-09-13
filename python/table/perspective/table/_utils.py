from perspective.table.libbinding import t_dtype
from datetime import date, datetime


def _dtype_to_pythontype(dtype):
    mapping = {
        t_dtype.DTYPE_BOOL: bool,
        t_dtype.DTYPE_FLOAT32: float,
        t_dtype.DTYPE_FLOAT64: float,
        t_dtype.DTYPE_INT8: int,
        t_dtype.DTYPE_INT16: int,
        t_dtype.DTYPE_INT32: int,
        t_dtype.DTYPE_INT64: int,
        t_dtype.DTYPE_DATE: date,
        t_dtype.DTYPE_TIME: datetime,
        t_dtype.DTYPE_STR: str
    }

    rval = mapping.get(dtype)

    if rval is None:
        raise KeyError("unsupported type: {}".format(dtype))

    return rval


def _dtype_to_str(dtype):
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
        t_dtype.DTYPE_STR: "string"
    }

    rval = mapping.get(dtype)

    if rval is None:
        raise KeyError("unsupported type: {}".format(dtype))

    return rval


def _str_to_pythontype(typestring):
    mapping = {
        "integer": int,
        "float": float,
        "boolean": bool,
        "string": str,
        "date": date,
        "datetime": datetime
    }

    rval = mapping.get(typestring)

    if rval is None:
        raise KeyError("unsupported type: {}".format(typestring))

    return rval
