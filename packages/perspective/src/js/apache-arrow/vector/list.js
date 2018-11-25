// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import * as tslib_1 from "tslib";
import { createVector } from '../vector';
import { TextEncoder, TextDecoder } from 'text-encoding-utf-8';
export var encodeUtf8 = (function (encoder) {
    return encoder.encode.bind(encoder);
})(new TextEncoder('utf-8'));
export var decodeUtf8 = (function (decoder) {
    return decoder.decode.bind(decoder);
})(new TextDecoder('utf-8'));
var ListViewBase = /** @class */ (function () {
    function ListViewBase(data) {
        this.length = data.length;
        this.values = data.values;
    }
    ListViewBase.prototype.clone = function (data) {
        return new this.constructor(data);
    };
    ListViewBase.prototype.isValid = function () {
        return true;
    };
    ListViewBase.prototype.toArray = function () {
        return tslib_1.__spread(this);
    };
    ListViewBase.prototype.get = function (index) {
        return this.getList(this.values, index, this.valueOffsets);
    };
    ListViewBase.prototype.set = function (index, value) {
        return this.setList(this.values, index, value, this.valueOffsets);
    };
    ListViewBase.prototype[Symbol.iterator] = function () {
        var get, length, values, valueOffsets, index;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    get = this.getList, length = this.length;
                    values = this.values, valueOffsets = this.valueOffsets;
                    index = -1;
                    _a.label = 1;
                case 1:
                    if (!(++index < length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, get(values, index, valueOffsets)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    ListViewBase.prototype.indexOf = function (search) {
        var index = 0;
        try {
            for (var _a = tslib_1.__values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                if (value === search) {
                    return index;
                }
                ++index;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return -1;
        var e_1, _c;
    };
    return ListViewBase;
}());
export { ListViewBase };
var VariableListViewBase = /** @class */ (function (_super) {
    tslib_1.__extends(VariableListViewBase, _super);
    function VariableListViewBase(data) {
        var _this = _super.call(this, data) || this;
        _this.length = data.length;
        _this.valueOffsets = data.valueOffsets;
        return _this;
    }
    return VariableListViewBase;
}(ListViewBase));
export { VariableListViewBase };
var ListView = /** @class */ (function (_super) {
    tslib_1.__extends(ListView, _super);
    function ListView(data) {
        var _this = _super.call(this, data) || this;
        _this.values = createVector(data.values);
        return _this;
    }
    ListView.prototype.getList = function (values, index, valueOffsets) {
        return values.slice(valueOffsets[index], valueOffsets[index + 1]);
    };
    ListView.prototype.setList = function (values, index, value, valueOffsets) {
        var idx = -1;
        var offset = valueOffsets[index];
        var end = Math.min(value.length, valueOffsets[index + 1] - offset);
        while (offset < end) {
            values.set(offset++, value.get(++idx));
        }
    };
    return ListView;
}(VariableListViewBase));
export { ListView };
var FixedSizeListView = /** @class */ (function (_super) {
    tslib_1.__extends(FixedSizeListView, _super);
    function FixedSizeListView(data) {
        var _this = _super.call(this, data) || this;
        _this.size = data.type.listSize;
        _this.values = createVector(data.values);
        return _this;
    }
    FixedSizeListView.prototype.getList = function (values, index) {
        var size = this.size;
        return values.slice(index *= size, index + size);
    };
    FixedSizeListView.prototype.setList = function (values, index, value) {
        var size = this.size;
        for (var idx = -1, offset = index * size; ++idx < size;) {
            values.set(offset + idx, value.get(++idx));
        }
    };
    return FixedSizeListView;
}(ListViewBase));
export { FixedSizeListView };
var BinaryView = /** @class */ (function (_super) {
    tslib_1.__extends(BinaryView, _super);
    function BinaryView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BinaryView.prototype.getList = function (values, index, valueOffsets) {
        return values.subarray(valueOffsets[index], valueOffsets[index + 1]);
    };
    BinaryView.prototype.setList = function (values, index, value, valueOffsets) {
        var offset = valueOffsets[index];
        values.set(value.subarray(0, valueOffsets[index + 1] - offset), offset);
    };
    return BinaryView;
}(VariableListViewBase));
export { BinaryView };
var Utf8View = /** @class */ (function (_super) {
    tslib_1.__extends(Utf8View, _super);
    function Utf8View() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Utf8View.prototype.getList = function (values, index, valueOffsets) {
        return decodeUtf8(values.subarray(valueOffsets[index], valueOffsets[index + 1]));
    };
    Utf8View.prototype.setList = function (values, index, value, valueOffsets) {
        var offset = valueOffsets[index];
        values.set(encodeUtf8(value).subarray(0, valueOffsets[index + 1] - offset), offset);
    };
    return Utf8View;
}(VariableListViewBase));
export { Utf8View };

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFDTCxlQUFDO0FBQUQsQ0FSQSxBQVFDLENBUjZCLG9CQUFvQixHQVFqRCIsImZpbGUiOiJ2ZWN0b3IvbGlzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbi8vIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuLy8gZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbi8vIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbi8vIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbi8vIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuLy8gd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuLy8gc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbi8vIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4vLyBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbi8vIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbi8vIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG5pbXBvcnQgeyBEYXRhIH0gZnJvbSAnLi4vZGF0YSc7XG5pbXBvcnQgeyBWaWV3LCBWZWN0b3IsIGNyZWF0ZVZlY3RvciB9IGZyb20gJy4uL3ZlY3Rvcic7XG5pbXBvcnQgeyBUZXh0RW5jb2RlciwgVGV4dERlY29kZXIgfSBmcm9tICd0ZXh0LWVuY29kaW5nLXV0Zi04JztcbmltcG9ydCB7IExpc3QsIEJpbmFyeSwgVXRmOCwgRml4ZWRTaXplTGlzdCwgRmxhdExpc3RUeXBlIH0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQgeyBMaXN0VHlwZSwgRGF0YVR5cGUsIEl0ZXJhYmxlQXJyYXlMaWtlIH0gZnJvbSAnLi4vdHlwZSc7XG5cbmV4cG9ydCBjb25zdCBlbmNvZGVVdGY4ID0gKChlbmNvZGVyKSA9PlxuICAgIGVuY29kZXIuZW5jb2RlLmJpbmQoZW5jb2RlcikgYXMgKGlucHV0Pzogc3RyaW5nKSA9PiBVaW50OEFycmF5XG4pKG5ldyBUZXh0RW5jb2RlcigndXRmLTgnKSk7XG5cbmV4cG9ydCBjb25zdCBkZWNvZGVVdGY4ID0gKChkZWNvZGVyKSA9PlxuICAgIGRlY29kZXIuZGVjb2RlLmJpbmQoZGVjb2RlcikgYXMgKGlucHV0PzogQXJyYXlCdWZmZXJMaWtlIHwgQXJyYXlCdWZmZXJWaWV3KSA9PiBzdHJpbmdcbikobmV3IFRleHREZWNvZGVyKCd1dGYtOCcpKTtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIExpc3RWaWV3QmFzZTxUIGV4dGVuZHMgKExpc3RUeXBlIHwgRmxhdExpc3RUeXBlIHwgRml4ZWRTaXplTGlzdCk+IGltcGxlbWVudHMgVmlldzxUPiB7XG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICAgIHB1YmxpYyB2YWx1ZXM6IFRbJ1RBcnJheSddO1xuICAgIHB1YmxpYyB2YWx1ZU9mZnNldHM/OiBJbnQzMkFycmF5O1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VD4pIHtcbiAgICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBkYXRhLnZhbHVlcztcbiAgICB9XG4gICAgcHVibGljIGNsb25lKGRhdGE6IERhdGE8VD4pOiB0aGlzIHtcbiAgICAgICAgcmV0dXJuIG5ldyAoPGFueT4gdGhpcy5jb25zdHJ1Y3RvcikoZGF0YSkgYXMgdGhpcztcbiAgICB9XG4gICAgcHVibGljIGlzVmFsaWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBwdWJsaWMgdG9BcnJheSgpOiBJdGVyYWJsZUFycmF5TGlrZTxUWydUVmFsdWUnXT4ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXNdO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0KGluZGV4OiBudW1iZXIpOiBUWydUVmFsdWUnXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldExpc3QodGhpcy52YWx1ZXMsIGluZGV4LCB0aGlzLnZhbHVlT2Zmc2V0cyk7XG4gICAgfVxuICAgIHB1YmxpYyBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldExpc3QodGhpcy52YWx1ZXMsIGluZGV4LCB2YWx1ZSwgdGhpcy52YWx1ZU9mZnNldHMpO1xuICAgIH1cbiAgICBwdWJsaWMgKltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8VFsnVFZhbHVlJ10+IHtcbiAgICAgICAgY29uc3QgZ2V0ID0gdGhpcy5nZXRMaXN0LCBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgdmFsdWVzID0gdGhpcy52YWx1ZXMsIHZhbHVlT2Zmc2V0cyA9IHRoaXMudmFsdWVPZmZzZXRzO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xOyArK2luZGV4IDwgbGVuZ3RoOykge1xuICAgICAgICAgICAgeWllbGQgZ2V0KHZhbHVlcywgaW5kZXgsIHZhbHVlT2Zmc2V0cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGluZGV4T2Yoc2VhcmNoOiBUWydUVmFsdWUnXSkge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKGxldCB2YWx1ZSBvZiB0aGlzKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHNlYXJjaCkgeyByZXR1cm4gaW5kZXg7IH1cbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBnZXRMaXN0KHZhbHVlczogVFsnVEFycmF5J10sIGluZGV4OiBudW1iZXIsIHZhbHVlT2Zmc2V0cz86IEludDMyQXJyYXkpOiBUWydUVmFsdWUnXTtcbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3Qgc2V0TGlzdCh2YWx1ZXM6IFRbJ1RBcnJheSddLCBpbmRleDogbnVtYmVyLCB2YWx1ZTogVFsnVFZhbHVlJ10sIHZhbHVlT2Zmc2V0cz86IEludDMyQXJyYXkpOiB2b2lkO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVmFyaWFibGVMaXN0Vmlld0Jhc2U8VCBleHRlbmRzIChMaXN0VHlwZSB8IEZsYXRMaXN0VHlwZSk+IGV4dGVuZHMgTGlzdFZpZXdCYXNlPFQ+IHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPFQ+KSB7XG4gICAgICAgIHN1cGVyKGRhdGEpO1xuICAgICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICB0aGlzLnZhbHVlT2Zmc2V0cyA9IGRhdGEudmFsdWVPZmZzZXRzO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIExpc3RWaWV3PFQgZXh0ZW5kcyBEYXRhVHlwZT4gZXh0ZW5kcyBWYXJpYWJsZUxpc3RWaWV3QmFzZTxMaXN0PFQ+PiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxMaXN0PFQ+Pikge1xuICAgICAgICBzdXBlcihkYXRhKTtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBjcmVhdGVWZWN0b3IoZGF0YS52YWx1ZXMpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgZ2V0TGlzdCh2YWx1ZXM6IFZlY3RvcjxUPiwgaW5kZXg6IG51bWJlciwgdmFsdWVPZmZzZXRzOiBJbnQzMkFycmF5KSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXMuc2xpY2UodmFsdWVPZmZzZXRzW2luZGV4XSwgdmFsdWVPZmZzZXRzW2luZGV4ICsgMV0pIGFzIFZlY3RvcjxUPjtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHNldExpc3QodmFsdWVzOiBWZWN0b3I8VD4sIGluZGV4OiBudW1iZXIsIHZhbHVlOiBWZWN0b3I8VD4sIHZhbHVlT2Zmc2V0czogSW50MzJBcnJheSk6IHZvaWQge1xuICAgICAgICBsZXQgaWR4ID0gLTE7XG4gICAgICAgIGxldCBvZmZzZXQgPSB2YWx1ZU9mZnNldHNbaW5kZXhdO1xuICAgICAgICBsZXQgZW5kID0gTWF0aC5taW4odmFsdWUubGVuZ3RoLCB2YWx1ZU9mZnNldHNbaW5kZXggKyAxXSAtIG9mZnNldCk7XG4gICAgICAgIHdoaWxlIChvZmZzZXQgPCBlbmQpIHtcbiAgICAgICAgICAgIHZhbHVlcy5zZXQob2Zmc2V0KyssIHZhbHVlLmdldCgrK2lkeCkpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRml4ZWRTaXplTGlzdFZpZXc8VCBleHRlbmRzIERhdGFUeXBlPiBleHRlbmRzIExpc3RWaWV3QmFzZTxGaXhlZFNpemVMaXN0PFQ+PiB7XG4gICAgcHVibGljIHNpemU6IG51bWJlcjtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPEZpeGVkU2l6ZUxpc3Q8VD4+KSB7XG4gICAgICAgIHN1cGVyKGRhdGEpO1xuICAgICAgICB0aGlzLnNpemUgPSBkYXRhLnR5cGUubGlzdFNpemU7XG4gICAgICAgIHRoaXMudmFsdWVzID0gY3JlYXRlVmVjdG9yKGRhdGEudmFsdWVzKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIGdldExpc3QodmFsdWVzOiBWZWN0b3I8VD4sIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgICAgcmV0dXJuIHZhbHVlcy5zbGljZShpbmRleCAqPSBzaXplLCBpbmRleCArIHNpemUpIGFzIFZlY3RvcjxUPjtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHNldExpc3QodmFsdWVzOiBWZWN0b3I8VD4sIGluZGV4OiBudW1iZXIsIHZhbHVlOiBWZWN0b3I8VD4pOiB2b2lkIHtcbiAgICAgICAgbGV0IHNpemUgPSB0aGlzLnNpemU7XG4gICAgICAgIGZvciAobGV0IGlkeCA9IC0xLCBvZmZzZXQgPSBpbmRleCAqIHNpemU7ICsraWR4IDwgc2l6ZTspIHtcbiAgICAgICAgICAgIHZhbHVlcy5zZXQob2Zmc2V0ICsgaWR4LCB2YWx1ZS5nZXQoKytpZHgpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJpbmFyeVZpZXcgZXh0ZW5kcyBWYXJpYWJsZUxpc3RWaWV3QmFzZTxCaW5hcnk+IHtcbiAgICBwcm90ZWN0ZWQgZ2V0TGlzdCh2YWx1ZXM6IFVpbnQ4QXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlT2Zmc2V0czogSW50MzJBcnJheSkge1xuICAgICAgICByZXR1cm4gdmFsdWVzLnN1YmFycmF5KHZhbHVlT2Zmc2V0c1tpbmRleF0sIHZhbHVlT2Zmc2V0c1tpbmRleCArIDFdKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHNldExpc3QodmFsdWVzOiBVaW50OEFycmF5LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogVWludDhBcnJheSwgdmFsdWVPZmZzZXRzOiBJbnQzMkFycmF5KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHZhbHVlT2Zmc2V0c1tpbmRleF07XG4gICAgICAgIHZhbHVlcy5zZXQodmFsdWUuc3ViYXJyYXkoMCwgdmFsdWVPZmZzZXRzW2luZGV4ICsgMV0gLSBvZmZzZXQpLCBvZmZzZXQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFV0ZjhWaWV3IGV4dGVuZHMgVmFyaWFibGVMaXN0Vmlld0Jhc2U8VXRmOD4ge1xuICAgIHByb3RlY3RlZCBnZXRMaXN0KHZhbHVlczogVWludDhBcnJheSwgaW5kZXg6IG51bWJlciwgdmFsdWVPZmZzZXRzOiBJbnQzMkFycmF5KSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVdGY4KHZhbHVlcy5zdWJhcnJheSh2YWx1ZU9mZnNldHNbaW5kZXhdLCB2YWx1ZU9mZnNldHNbaW5kZXggKyAxXSkpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2V0TGlzdCh2YWx1ZXM6IFVpbnQ4QXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcsIHZhbHVlT2Zmc2V0czogSW50MzJBcnJheSk6IHZvaWQge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB2YWx1ZU9mZnNldHNbaW5kZXhdO1xuICAgICAgICB2YWx1ZXMuc2V0KGVuY29kZVV0ZjgodmFsdWUpLnN1YmFycmF5KDAsIHZhbHVlT2Zmc2V0c1tpbmRleCArIDFdIC0gb2Zmc2V0KSwgb2Zmc2V0KTtcbiAgICB9XG59XG4iXX0=
