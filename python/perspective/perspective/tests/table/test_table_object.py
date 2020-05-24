# *****************************************************************************
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#
import six
import sys
from random import randint
from perspective.table import Table
from datetime import date, datetime

class CustomObjectBlank(object):
    pass

class CustomObjectStore(object):
    def __init__(self, value):
        self._value = value

    def _psp_dtype_(self):
        return "object"

    def __int__(self):
        return int(self._value)

    def __repr__(self):
        return 'test'

class CustomObjectRepr(object):
    def __init__(self, value):
        self._value = value

    def __repr__(self):
        return str(self._value)

class CustomObjectIntPromoteToString(CustomObjectRepr):
    def _psp_dtype_(self):
        return int

class CustomObjectFloatPromoteToString(CustomObjectRepr):
    def _psp_dtype_(self):
        return float

class CustomObjectIntBoth(CustomObjectRepr):
    def _psp_dtype_(self):
        return int

    def _psp_repr_(self):
        return int(self._value) + 1

class CustomObjectFloatBoth(CustomObjectRepr):
    def _psp_dtype_(self):
        return float

    def _psp_repr_(self):
        return float(self._value) + 1.0

class CustomObjectIntConvert(CustomObjectRepr):
    def _psp_dtype_(self):
        return int

    def __int__(self):
        return int(self._value)

    def __repr__(self):
        return 'test'

class CustomObjectFloatConvert(CustomObjectRepr):
    def _psp_dtype_(self):
        return float

    def __float__(self):
        return float(self._value)

    def __repr__(self):
        return 'test'


class CustomObjectIntConvertFromFloat(CustomObjectRepr):
    def _psp_dtype_(self):
        return int

    def __float__(self):
        return float(self._value)

    def __repr__(self):
        return 'test'

class CustomObjectFloatConvertFromInt(CustomObjectRepr):
    def _psp_dtype_(self):
        return float

    def __int__(self):
        return int(self._value)

    def __repr__(self):
        return 'test'

class TestTableObjectsExtract(object):
    def test_table_custom_object(self):
        data = {"a": [CustomObjectBlank()]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

        assert tbl.size() == 1
        assert '<perspective.tests.table.test_table_object.CustomObjectBlank object at 0x' in tbl.view().to_dict()["a"][0]

    def test_table_custom_object_repr(self):
        data = {"a": [CustomObjectRepr(1), CustomObjectRepr(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": ["1", "2"]}

    def test_table_custom_object_repr_update(self):
        data = {"a": [CustomObjectIntBoth(1), CustomObjectIntBoth(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": int}
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": [2, 3]}

        tbl.update([{"a": CustomObjectIntBoth(3)}, {"a": CustomObjectIntBoth(4)}])
        assert tbl.size() == 4
        assert tbl.view().to_dict() == {"a": [2, 3, 4, 5]}

    def test_custom_object_int_promote_to_string(self):
        data = {"a": [CustomObjectIntPromoteToString(1), CustomObjectIntPromoteToString(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": ["1", "2"]}
   
    def test_custom_object_float_promote_to_string(self):
        data = {"a": [CustomObjectFloatPromoteToString(1), CustomObjectFloatPromoteToString(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": str}

        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": ["1", "2"]}
   
    def test_custom_object_int_both(self):
        data = {"a": [CustomObjectIntBoth(1), CustomObjectIntBoth(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": int}

        assert tbl.size() == 2
        # We do value + 1 just to make sure
        assert tbl.view().to_dict() == {"a": [2, 3]}

    def test_custom_object_float_both(self):
        data = {"a": [CustomObjectFloatBoth(1), CustomObjectFloatBoth(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": float}

        assert tbl.size() == 2
        # We do value + 1 just to make sure
        assert tbl.view().to_dict() == {"a": [2.0, 3.0]}

    def test_custom_object_int_convert(self):
        data = {"a": [CustomObjectIntConvert(1), CustomObjectIntConvert(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": int}

        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": [1, 2]}

    def test_custom_object_float_convert(self):
        data = {"a": [CustomObjectFloatConvert(1), CustomObjectFloatConvert(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": float}

        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": [1.0, 2.0]}

    def test_custom_object_int_convert_from_float(self):
        data = {"a": [CustomObjectIntConvertFromFloat(1), CustomObjectIntConvertFromFloat(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": int}

        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": [1, 2]}

    def test_custom_object_float_convert_from_int(self):
        data = {"a": [CustomObjectFloatConvertFromInt(1), CustomObjectFloatConvertFromInt(2)]}
        tbl = Table(data)
        assert tbl.schema() == {"a": float}
        assert tbl.size() == 2
        assert tbl.view().to_dict() == {"a": [1.0, 2.0]}
    
class TestTableObjectsStore(object):
    def test_object_passthrough(self):
        t = CustomObjectStore(1)
        t2 = CustomObjectStore(2)
        t3 = CustomObjectStore(3)

        data = {"a": [t, t2, t3]}
        tbl = Table(data)
        assert tbl.schema() == {"a": object}
        assert tbl.size() == 3
        assert tbl.view().to_dict() == {"a": [t, t2, t3]}
    

    def test_object_referencecount(self):
        t = CustomObjectStore(1)
        data = {"a": [t]}
        tbl = Table(data)
        assert tbl.schema() == {"a": object}
        assert tbl.size() == 1
        assert tbl.view().to_dict() == {"a": [t]}

        # Count references
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount, and one for the table
        assert sys.getrefcount(t) == 4

    def test_object_referencecount_update(self):
        t = CustomObjectStore(1)
        data = {"a": [t]}
        tbl = Table(data)
        assert tbl.schema() == {"a": object}
        assert tbl.size() == 1
        assert tbl.view().to_dict() == {"a": [t]}

        # Count references
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount, and one for the table
        assert sys.getrefcount(t) == 4

        count = randint(5, 10)
        for c in range(count):
            tbl.update([data])
            # c+1 new copies, +1 for original
            assert tbl.size() == (c+1) + 1
            # c+1 copies in the table now, +1 for original and +3 for others (`t`, `data`, arg to getrefcount)
            assert sys.getrefcount(t) == (c+1) + 4

    def test_object_referencecount_clear(self):
        t = CustomObjectStore(1)
        data = {"a": [t]}
        tbl = Table(data)
        assert tbl.schema() == {"a": object}
        assert tbl.size() == 1

        # Count references
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount, and one for the table
        assert sys.getrefcount(t) == 4

        tbl.clear()
        assert tbl.size() == 0
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount
        assert sys.getrefcount(t) == 3


    def test_object_referencecount_update_clear(self):
        t = CustomObjectStore(1)
        data = {"a": [t]}
        tbl = Table(data)
        assert tbl.schema() == {"a": object}
        assert tbl.size() == 1
        assert tbl.view().to_dict() == {"a": [t]}

        # Count references
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount, and one for the table
        assert sys.getrefcount(t) == 4

        # do random number of updates
        count = randint(5, 10)
        for _ in range(count):
            tbl.update([data])

        tbl.clear()
        assert tbl.size() == 0
        assert tbl.view().to_dict() == {}
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount
        assert sys.getrefcount(t) == 3

    def test_object_referencecount_update_index(self):
        t = CustomObjectStore(1)
        data = {"a": [0], "b": [t]}
        tbl = Table(data, index="a")
        assert tbl.schema() == {"a": int, "b": object}
        assert tbl.size() == 1
        assert tbl.view().to_dict() == {"a": [0], "b": [t]}

        # Count references
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount, and one for the table
        assert sys.getrefcount(t) == 4

        # do random number of updates
        count = randint(5, 10)
        for _ in range(count):
            tbl.update([data])

        # unchanged
        assert tbl.size() == 1
        assert sys.getrefcount(t) == 4

        tbl.clear()
        assert tbl.size() == 0
        assert tbl.view().to_dict() == {}
        # 1 for `t`, one for `data`, one for argument to sys.getrefcount
        assert sys.getrefcount(t) == 3

    def test_object_referencecount_update_complicatedsequence(self):
        from .object_sequence import run
        run()

    def test_object_referencecount_delete(self):
        t = CustomObjectStore(1)
        t2 = CustomObjectStore(2)
        t_ref_count = 2
        t2_ref_count = 2

        tbl = Table({"a": [1], "b": [t]}, index="a")
        t_ref_count += 1

        assert tbl.schema() == {"a": int, "b": object}
        assert tbl.size() == 1

        # Count references
        # 1 for `t`, 1 for `data`, 1 for argument to sys.getrefcount, and 1 for the table
        print(sys.getrefcount(t), "should be", t_ref_count)
        print(sys.getrefcount(t2), "should be", t2_ref_count)

        tbl.update({"a": [2], "b": [t]})
        t_ref_count += 1
        tbl.update({"a": [3], "b": [t]})
        t_ref_count += 1

        assert sys.getrefcount(t) == t_ref_count

        tbl.remove([1])

        tbl.clear()
        assert tbl.size() == 0
        assert tbl.view().to_dict() == {}
        print(sys.getrefcount(t), "should be", 2)
        assert sys.getrefcount(t) == 2
        print(sys.getrefcount(t2), "should be", 2)
        assert sys.getrefcount(t2) == 2

    def test_object_referencecount_delete(self):
        from .object_sequence import run2
        run2()
