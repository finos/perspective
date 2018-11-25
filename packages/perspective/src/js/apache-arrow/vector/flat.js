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
import { getBool, setBool, iterateBits } from '../util/bit';
var FlatView = /** @class */ (function () {
    function FlatView(data) {
        this.length = data.length;
        this.values = data.values;
    }
    FlatView.prototype.clone = function (data) {
        return new this.constructor(data);
    };
    FlatView.prototype.isValid = function () {
        return true;
    };
    FlatView.prototype.get = function (index) {
        return this.values[index];
    };
    FlatView.prototype.set = function (index, value) {
        return this.values[index] = value;
    };
    FlatView.prototype.toArray = function () {
        return this.values.subarray(0, this.length);
    };
    FlatView.prototype.indexOf = function (search) {
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
    FlatView.prototype[Symbol.iterator] = function () {
        return this.values.subarray(0, this.length)[Symbol.iterator]();
    };
    return FlatView;
}());
export { FlatView };
var NullView = /** @class */ (function () {
    function NullView(data) {
        this.length = data.length;
    }
    NullView.prototype.clone = function (data) {
        return new this.constructor(data);
    };
    NullView.prototype.isValid = function () {
        return true;
    };
    NullView.prototype.set = function () { };
    NullView.prototype.get = function () { return null; };
    NullView.prototype.toArray = function () {
        return tslib_1.__spread(this);
    };
    NullView.prototype.indexOf = function (search) {
        // if you're looking for nulls and the view isn't empty, we've got 'em!
        return search === null && this.length > 0 ? 0 : -1;
    };
    NullView.prototype[Symbol.iterator] = function () {
        var index, length_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    index = -1, length_1 = this.length;
                    _a.label = 1;
                case 1:
                    if (!(++index < length_1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, null];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    return NullView;
}());
export { NullView };
var BoolView = /** @class */ (function (_super) {
    tslib_1.__extends(BoolView, _super);
    function BoolView(data) {
        var _this = _super.call(this, data) || this;
        _this.offset = data.offset;
        return _this;
    }
    BoolView.prototype.toArray = function () { return tslib_1.__spread(this); };
    BoolView.prototype.get = function (index) {
        var boolBitIndex = this.offset + index;
        return getBool(null, index, this.values[boolBitIndex >> 3], boolBitIndex % 8);
    };
    BoolView.prototype.set = function (index, value) {
        setBool(this.values, this.offset + index, value);
    };
    BoolView.prototype[Symbol.iterator] = function () {
        return iterateBits(this.values, this.offset, this.length, this.values, getBool);
    };
    return BoolView;
}(FlatView));
export { BoolView };
var ValidityView = /** @class */ (function () {
    function ValidityView(data, view) {
        this.view = view;
        this.length = data.length;
        this.offset = data.offset;
        this.nullBitmap = data.nullBitmap;
    }
    ValidityView.prototype.clone = function (data) {
        return new ValidityView(data, this.view.clone(data));
    };
    ValidityView.prototype.toArray = function () {
        return tslib_1.__spread(this);
    };
    ValidityView.prototype.indexOf = function (search) {
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
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return -1;
        var e_2, _c;
    };
    ValidityView.prototype.isValid = function (index) {
        var nullBitIndex = this.offset + index;
        return getBool(null, index, this.nullBitmap[nullBitIndex >> 3], nullBitIndex % 8);
    };
    ValidityView.prototype.get = function (index) {
        var nullBitIndex = this.offset + index;
        return this.getNullable(this.view, index, this.nullBitmap[nullBitIndex >> 3], nullBitIndex % 8);
    };
    ValidityView.prototype.set = function (index, value) {
        if (setBool(this.nullBitmap, this.offset + index, value != null)) {
            this.view.set(index, value);
        }
    };
    ValidityView.prototype[Symbol.iterator] = function () {
        return iterateBits(this.nullBitmap, this.offset, this.length, this.view, this.getNullable);
    };
    ValidityView.prototype.getNullable = function (view, index, byte, bit) {
        return getBool(view, index, byte, bit) ? view.get(index) : null;
    };
    return ValidityView;
}());
export { ValidityView };
var PrimitiveView = /** @class */ (function (_super) {
    tslib_1.__extends(PrimitiveView, _super);
    function PrimitiveView(data, size) {
        var _this = _super.call(this, data) || this;
        _this.size = size || 1;
        _this.ArrayType = data.type.ArrayType;
        return _this;
    }
    PrimitiveView.prototype.clone = function (data) {
        return new this.constructor(data, this.size);
    };
    PrimitiveView.prototype.getValue = function (values, index, size) {
        return values[index * size];
    };
    PrimitiveView.prototype.setValue = function (values, index, size, value) {
        values[index * size] = value;
    };
    PrimitiveView.prototype.get = function (index) {
        return this.getValue(this.values, index, this.size);
    };
    PrimitiveView.prototype.set = function (index, value) {
        return this.setValue(this.values, index, this.size, value);
    };
    PrimitiveView.prototype.toArray = function () {
        return this.size > 1 ?
            new this.ArrayType(this) :
            this.values.subarray(0, this.length);
    };
    PrimitiveView.prototype[Symbol.iterator] = function () {
        var get, _a, size, values, length, index;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    get = this.getValue;
                    _a = this, size = _a.size, values = _a.values, length = _a.length;
                    index = -1;
                    _b.label = 1;
                case 1:
                    if (!(++index < length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, get(values, index, size)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    return PrimitiveView;
}(FlatView));
export { PrimitiveView };
var FixedSizeView = /** @class */ (function (_super) {
    tslib_1.__extends(FixedSizeView, _super);
    function FixedSizeView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FixedSizeView.prototype.toArray = function () {
        return this.values;
    };
    FixedSizeView.prototype.indexOf = function (search) {
        var index = 0;
        try {
            for (var _a = tslib_1.__values(this), _b = _a.next(); !_b.done; _b = _a.next()) {
                var value = _b.value;
                if (value.every(function (d, i) { return d === search[i]; })) {
                    return index;
                }
                ++index;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return -1;
        var e_3, _c;
    };
    FixedSizeView.prototype.getValue = function (values, index, size) {
        return values.subarray(index * size, index * size + size);
    };
    FixedSizeView.prototype.setValue = function (values, index, size, value) {
        values.set(value.subarray(0, size), index * size);
    };
    return FixedSizeView;
}(PrimitiveView));
export { FixedSizeView };
var Float16View = /** @class */ (function (_super) {
    tslib_1.__extends(Float16View, _super);
    function Float16View() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Float16View.prototype.toArray = function () { return new Float32Array(this); };
    Float16View.prototype.getValue = function (values, index, size) {
        return (values[index * size] - 32767) / 32767;
    };
    Float16View.prototype.setValue = function (values, index, size, value) {
        values[index * size] = (value * 32767) + 32767;
    };
    return Float16View;
}(PrimitiveView));
export { Float16View };
var DateDayView = /** @class */ (function (_super) {
    tslib_1.__extends(DateDayView, _super);
    function DateDayView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DateDayView.prototype.toArray = function () { return tslib_1.__spread(this); };
    DateDayView.prototype.getValue = function (values, index, size) {
        return epochDaysToDate(values, index * size);
    };
    DateDayView.prototype.setValue = function (values, index, size, value) {
        values[index * size] = value.valueOf() / 86400000;
    };
    return DateDayView;
}(PrimitiveView));
export { DateDayView };
var DateMillisecondView = /** @class */ (function (_super) {
    tslib_1.__extends(DateMillisecondView, _super);
    function DateMillisecondView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DateMillisecondView.prototype.toArray = function () { return tslib_1.__spread(this); };
    DateMillisecondView.prototype.getValue = function (values, index, size) {
        return epochMillisecondsLongToDate(values, index * size);
    };
    DateMillisecondView.prototype.setValue = function (values, index, size, value) {
        var epochMs = value.valueOf();
        values[index * size] = (epochMs % 4294967296) | 0;
        values[index * size + size] = (epochMs / 4294967296) | 0;
    };
    return DateMillisecondView;
}(FixedSizeView));
export { DateMillisecondView };
var TimestampDayView = /** @class */ (function (_super) {
    tslib_1.__extends(TimestampDayView, _super);
    function TimestampDayView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimestampDayView.prototype.toArray = function () { return tslib_1.__spread(this); };
    TimestampDayView.prototype.getValue = function (values, index, size) {
        return epochDaysToMs(values, index * size);
    };
    TimestampDayView.prototype.setValue = function (values, index, size, epochMs) {
        values[index * size] = (epochMs / 86400000) | 0;
    };
    return TimestampDayView;
}(PrimitiveView));
export { TimestampDayView };
var TimestampSecondView = /** @class */ (function (_super) {
    tslib_1.__extends(TimestampSecondView, _super);
    function TimestampSecondView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimestampSecondView.prototype.toArray = function () { return tslib_1.__spread(this); };
    TimestampSecondView.prototype.getValue = function (values, index, size) {
        return epochSecondsToMs(values, index * size);
    };
    TimestampSecondView.prototype.setValue = function (values, index, size, epochMs) {
        values[index * size] = (epochMs / 1000) | 0;
    };
    return TimestampSecondView;
}(PrimitiveView));
export { TimestampSecondView };
var TimestampMillisecondView = /** @class */ (function (_super) {
    tslib_1.__extends(TimestampMillisecondView, _super);
    function TimestampMillisecondView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimestampMillisecondView.prototype.toArray = function () { return tslib_1.__spread(this); };
    TimestampMillisecondView.prototype.getValue = function (values, index, size) {
        return epochMillisecondsLongToMs(values, index * size);
    };
    TimestampMillisecondView.prototype.setValue = function (values, index, size, epochMs) {
        values[index * size] = (epochMs % 4294967296) | 0;
        values[index * size + size] = (epochMs / 4294967296) | 0;
    };
    return TimestampMillisecondView;
}(PrimitiveView));
export { TimestampMillisecondView };
var TimestampMicrosecondView = /** @class */ (function (_super) {
    tslib_1.__extends(TimestampMicrosecondView, _super);
    function TimestampMicrosecondView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimestampMicrosecondView.prototype.toArray = function () { return tslib_1.__spread(this); };
    TimestampMicrosecondView.prototype.getValue = function (values, index, size) {
        return epochMicrosecondsLongToMs(values, index * size);
    };
    TimestampMicrosecondView.prototype.setValue = function (values, index, size, epochMs) {
        values[index * size] = ((epochMs / 1000) % 4294967296) | 0;
        values[index * size + size] = ((epochMs / 1000) / 4294967296) | 0;
    };
    return TimestampMicrosecondView;
}(PrimitiveView));
export { TimestampMicrosecondView };
var TimestampNanosecondView = /** @class */ (function (_super) {
    tslib_1.__extends(TimestampNanosecondView, _super);
    function TimestampNanosecondView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimestampNanosecondView.prototype.toArray = function () { return tslib_1.__spread(this); };
    TimestampNanosecondView.prototype.getValue = function (values, index, size) {
        return epochNanosecondsLongToMs(values, index * size);
    };
    TimestampNanosecondView.prototype.setValue = function (values, index, size, epochMs) {
        values[index * size] = ((epochMs / 1000000) % 4294967296) | 0;
        values[index * size + size] = ((epochMs / 1000000) / 4294967296) | 0;
    };
    return TimestampNanosecondView;
}(PrimitiveView));
export { TimestampNanosecondView };
var IntervalYearMonthView = /** @class */ (function (_super) {
    tslib_1.__extends(IntervalYearMonthView, _super);
    function IntervalYearMonthView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IntervalYearMonthView.prototype.toArray = function () { return tslib_1.__spread(this); };
    IntervalYearMonthView.prototype.getValue = function (values, index, size) {
        var interval = values[index * size];
        return new Int32Array([interval / 12, /* years */ interval % 12 /* months */]);
    };
    IntervalYearMonthView.prototype.setValue = function (values, index, size, value) {
        values[index * size] = (value[0] * 12) + (value[1] % 12);
    };
    return IntervalYearMonthView;
}(PrimitiveView));
export { IntervalYearMonthView };
var IntervalYearView = /** @class */ (function (_super) {
    tslib_1.__extends(IntervalYearView, _super);
    function IntervalYearView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IntervalYearView.prototype.toArray = function () { return tslib_1.__spread(this); };
    IntervalYearView.prototype.getValue = function (values, index, size) {
        return values[index * size] / 12;
    };
    IntervalYearView.prototype.setValue = function (values, index, size, value) {
        values[index * size] = (value * 12) + (values[index * size] % 12);
    };
    return IntervalYearView;
}(PrimitiveView));
export { IntervalYearView };
var IntervalMonthView = /** @class */ (function (_super) {
    tslib_1.__extends(IntervalMonthView, _super);
    function IntervalMonthView() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IntervalMonthView.prototype.toArray = function () { return tslib_1.__spread(this); };
    IntervalMonthView.prototype.getValue = function (values, index, size) {
        return values[index * size] % 12;
    };
    IntervalMonthView.prototype.setValue = function (values, index, size, value) {
        values[index * size] = (values[index * size] * 12) + (value % 12);
    };
    return IntervalMonthView;
}(PrimitiveView));
export { IntervalMonthView };
export function epochSecondsToMs(data, index) { return 1000 * data[index]; }
export function epochDaysToMs(data, index) { return 86400000 * data[index]; }
export function epochMillisecondsLongToMs(data, index) { return 4294967296 * (data[index + 1]) + (data[index] >>> 0); }
export function epochMicrosecondsLongToMs(data, index) { return 4294967296 * (data[index + 1] / 1000) + ((data[index] >>> 0) / 1000); }
export function epochNanosecondsLongToMs(data, index) { return 4294967296 * (data[index + 1] / 1000000) + ((data[index] >>> 0) / 1000000); }
export function epochMillisecondsToDate(epochMs) { return new Date(epochMs); }
export function epochDaysToDate(data, index) { return epochMillisecondsToDate(epochDaysToMs(data, index)); }
export function epochSecondsToDate(data, index) { return epochMillisecondsToDate(epochSecondsToMs(data, index)); }
export function epochNanosecondsLongToDate(data, index) { return epochMillisecondsToDate(epochNanosecondsLongToMs(data, index)); }
export function epochMillisecondsLongToDate(data, index) { return epochMillisecondsToDate(epochMillisecondsLongToMs(data, index)); }

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LG1DQUFtQyxJQUFnQixFQUFFLEtBQWEsSUFBSSxNQUFNLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVoSyxNQUFNLGtDQUFrQyxPQUFlLElBQUksTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RixNQUFNLDBCQUEwQixJQUFnQixFQUFFLEtBQWEsSUFBSSxNQUFNLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoSSxNQUFNLDZCQUE2QixJQUFnQixFQUFFLEtBQWEsSUFBSSxNQUFNLENBQUMsdUJBQXVCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RJLE1BQU0scUNBQXFDLElBQWdCLEVBQUUsS0FBYSxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEosTUFBTSxzQ0FBc0MsSUFBZ0IsRUFBRSxLQUFhLElBQUksTUFBTSxDQUFDLHVCQUF1QixDQUFDLHlCQUF5QixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJ2ZWN0b3IvZmxhdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbi8vIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuLy8gZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbi8vIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbi8vIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbi8vIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuLy8gd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuLy8gc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbi8vIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4vLyBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbi8vIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbi8vIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG5pbXBvcnQgeyBEYXRhIH0gZnJvbSAnLi4vZGF0YSc7XG5pbXBvcnQgeyBWaWV3IH0gZnJvbSAnLi4vdmVjdG9yJztcbmltcG9ydCB7IGdldEJvb2wsIHNldEJvb2wsIGl0ZXJhdGVCaXRzIH0gZnJvbSAnLi4vdXRpbC9iaXQnO1xuaW1wb3J0IHsgQm9vbCwgRmxvYXQxNiwgRGF0ZV8sIEludGVydmFsLCBOdWxsLCBJbnQzMiwgVGltZXN0YW1wIH0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQgeyBEYXRhVHlwZSwgRmxhdFR5cGUsIFByaW1pdGl2ZVR5cGUsIEl0ZXJhYmxlQXJyYXlMaWtlIH0gZnJvbSAnLi4vdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBGbGF0VmlldzxUIGV4dGVuZHMgRmxhdFR5cGU+IGltcGxlbWVudHMgVmlldzxUPiB7XG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICAgIHB1YmxpYyB2YWx1ZXM6IFRbJ1RBcnJheSddO1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VD4pIHtcbiAgICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSBkYXRhLnZhbHVlcztcbiAgICB9XG4gICAgcHVibGljIGNsb25lKGRhdGE6IERhdGE8VD4pOiB0aGlzIHtcbiAgICAgICAgcmV0dXJuIG5ldyAoPGFueT4gdGhpcy5jb25zdHJ1Y3RvcikoZGF0YSkgYXMgdGhpcztcbiAgICB9XG4gICAgcHVibGljIGlzVmFsaWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0KGluZGV4OiBudW1iZXIpOiBUWydUVmFsdWUnXSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF07XG4gICAgfVxuICAgIHB1YmxpYyBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcHVibGljIHRvQXJyYXkoKTogSXRlcmFibGVBcnJheUxpa2U8VFsnVFZhbHVlJ10+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzLnN1YmFycmF5KDAsIHRoaXMubGVuZ3RoKTtcbiAgICB9XG4gICAgcHVibGljIGluZGV4T2Yoc2VhcmNoOiBUWydUVmFsdWUnXSkge1xuICAgICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgICBmb3IgKGxldCB2YWx1ZSBvZiB0aGlzKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHNlYXJjaCkgeyByZXR1cm4gaW5kZXg7IH1cbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHB1YmxpYyBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFRbJ1RWYWx1ZSddPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlcy5zdWJhcnJheSgwLCB0aGlzLmxlbmd0aClbU3ltYm9sLml0ZXJhdG9yXSgpIGFzIEl0ZXJhYmxlSXRlcmF0b3I8VFsnVFZhbHVlJ10+O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bGxWaWV3IGltcGxlbWVudHMgVmlldzxOdWxsPiB7XG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8TnVsbD4pIHtcbiAgICAgICAgdGhpcy5sZW5ndGggPSBkYXRhLmxlbmd0aDtcbiAgICB9XG4gICAgcHVibGljIGNsb25lKGRhdGE6IERhdGE8TnVsbD4pOiB0aGlzIHtcbiAgICAgICAgcmV0dXJuIG5ldyAoPGFueT4gdGhpcy5jb25zdHJ1Y3RvcikoZGF0YSkgYXMgdGhpcztcbiAgICB9XG4gICAgcHVibGljIGlzVmFsaWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0KCk6IHZvaWQge31cbiAgICBwdWJsaWMgZ2V0KCkgeyByZXR1cm4gbnVsbDsgfVxuICAgIHB1YmxpYyB0b0FycmF5KCk6IEl0ZXJhYmxlQXJyYXlMaWtlPG51bGw+IHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzXTtcbiAgICB9XG4gICAgcHVibGljIGluZGV4T2Yoc2VhcmNoOiBhbnkpIHtcbiAgICAgICAgLy8gaWYgeW91J3JlIGxvb2tpbmcgZm9yIG51bGxzIGFuZCB0aGUgdmlldyBpc24ndCBlbXB0eSwgd2UndmUgZ290ICdlbSFcbiAgICAgICAgcmV0dXJuIHNlYXJjaCA9PT0gbnVsbCAmJiB0aGlzLmxlbmd0aCA+IDAgPyAwIDogLTE7XG4gICAgfVxuICAgIHB1YmxpYyAqW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxudWxsPiB7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gLTEsIGxlbmd0aCA9IHRoaXMubGVuZ3RoOyArK2luZGV4IDwgbGVuZ3RoOykge1xuICAgICAgICAgICAgeWllbGQgbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJvb2xWaWV3IGV4dGVuZHMgRmxhdFZpZXc8Qm9vbD4ge1xuICAgIHByb3RlY3RlZCBvZmZzZXQ6IG51bWJlcjtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPEJvb2w+KSB7XG4gICAgICAgIHN1cGVyKGRhdGEpO1xuICAgICAgICB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0O1xuICAgIH1cbiAgICBwdWJsaWMgdG9BcnJheSgpIHsgcmV0dXJuIFsuLi50aGlzXTsgfVxuICAgIHB1YmxpYyBnZXQoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBib29sQml0SW5kZXggPSB0aGlzLm9mZnNldCArIGluZGV4O1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbChudWxsLCBpbmRleCwgdGhpcy52YWx1ZXNbYm9vbEJpdEluZGV4ID4+IDNdLCBib29sQml0SW5kZXggJSA4KTtcbiAgICB9XG4gICAgcHVibGljIHNldChpbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBzZXRCb29sKHRoaXMudmFsdWVzLCB0aGlzLm9mZnNldCArIGluZGV4LCB2YWx1ZSk7XG4gICAgfVxuICAgIHB1YmxpYyBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdGVCaXRzPGJvb2xlYW4+KHRoaXMudmFsdWVzLCB0aGlzLm9mZnNldCwgdGhpcy5sZW5ndGgsIHRoaXMudmFsdWVzLCBnZXRCb29sKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGl0eVZpZXc8VCBleHRlbmRzIERhdGFUeXBlPiBpbXBsZW1lbnRzIFZpZXc8VD4ge1xuICAgIHByb3RlY3RlZCB2aWV3OiBWaWV3PFQ+O1xuICAgIHByb3RlY3RlZCBsZW5ndGg6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgb2Zmc2V0OiBudW1iZXI7XG4gICAgcHJvdGVjdGVkIG51bGxCaXRtYXA6IFVpbnQ4QXJyYXk7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxUPiwgdmlldzogVmlldzxUPikge1xuICAgICAgICB0aGlzLnZpZXcgPSB2aWV3O1xuICAgICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICB0aGlzLm9mZnNldCA9IGRhdGEub2Zmc2V0O1xuICAgICAgICB0aGlzLm51bGxCaXRtYXAgPSBkYXRhLm51bGxCaXRtYXAhO1xuICAgIH1cbiAgICBwdWJsaWMgY2xvbmUoZGF0YTogRGF0YTxUPik6IHRoaXMge1xuICAgICAgICByZXR1cm4gbmV3IFZhbGlkaXR5VmlldyhkYXRhLCB0aGlzLnZpZXcuY2xvbmUoZGF0YSkpIGFzIHRoaXM7XG4gICAgfVxuICAgIHB1YmxpYyB0b0FycmF5KCk6IEl0ZXJhYmxlQXJyYXlMaWtlPFRbJ1RWYWx1ZSddIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXNdO1xuICAgIH1cbiAgICBwdWJsaWMgaW5kZXhPZihzZWFyY2g6IFRbJ1RWYWx1ZSddKSB7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGZvciAobGV0IHZhbHVlIG9mIHRoaXMpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gc2VhcmNoKSB7IHJldHVybiBpbmRleDsgfVxuICAgICAgICAgICAgKytpbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgcHVibGljIGlzVmFsaWQoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBudWxsQml0SW5kZXggPSB0aGlzLm9mZnNldCArIGluZGV4O1xuICAgICAgICByZXR1cm4gZ2V0Qm9vbChudWxsLCBpbmRleCwgdGhpcy5udWxsQml0bWFwW251bGxCaXRJbmRleCA+PiAzXSwgbnVsbEJpdEluZGV4ICUgOCk7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQoaW5kZXg6IG51bWJlcik6IFRbJ1RWYWx1ZSddIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IG51bGxCaXRJbmRleCA9IHRoaXMub2Zmc2V0ICsgaW5kZXg7XG4gICAgICAgIHJldHVybiB0aGlzLmdldE51bGxhYmxlKHRoaXMudmlldywgaW5kZXgsIHRoaXMubnVsbEJpdG1hcFtudWxsQml0SW5kZXggPj4gM10sIG51bGxCaXRJbmRleCAlIDgpO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUWydUVmFsdWUnXSB8IG51bGwpOiB2b2lkIHtcbiAgICAgICAgaWYgKHNldEJvb2wodGhpcy5udWxsQml0bWFwLCB0aGlzLm9mZnNldCArIGluZGV4LCB2YWx1ZSAhPSBudWxsKSkge1xuICAgICAgICAgICAgdGhpcy52aWV3LnNldChpbmRleCwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFRbJ1RWYWx1ZSddIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gaXRlcmF0ZUJpdHM8VFsnVFZhbHVlJ10gfCBudWxsPih0aGlzLm51bGxCaXRtYXAsIHRoaXMub2Zmc2V0LCB0aGlzLmxlbmd0aCwgdGhpcy52aWV3LCB0aGlzLmdldE51bGxhYmxlKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIGdldE51bGxhYmxlKHZpZXc6IFZpZXc8VD4sIGluZGV4OiBudW1iZXIsIGJ5dGU6IG51bWJlciwgYml0OiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGdldEJvb2wodmlldywgaW5kZXgsIGJ5dGUsIGJpdCkgPyB2aWV3LmdldChpbmRleCkgOiBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFByaW1pdGl2ZVZpZXc8VCBleHRlbmRzIFByaW1pdGl2ZVR5cGU+IGV4dGVuZHMgRmxhdFZpZXc8VD4ge1xuICAgIHB1YmxpYyBzaXplOiBudW1iZXI7XG4gICAgcHVibGljIEFycmF5VHlwZTogVFsnQXJyYXlUeXBlJ107XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxUPiwgc2l6ZT86IG51bWJlcikge1xuICAgICAgICBzdXBlcihkYXRhKTtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZSB8fCAxO1xuICAgICAgICB0aGlzLkFycmF5VHlwZSA9IGRhdGEudHlwZS5BcnJheVR5cGU7XG4gICAgfVxuICAgIHB1YmxpYyBjbG9uZShkYXRhOiBEYXRhPFQ+KTogdGhpcyB7XG4gICAgICAgIHJldHVybiBuZXcgKDxhbnk+IHRoaXMuY29uc3RydWN0b3IpKGRhdGEsIHRoaXMuc2l6ZSkgYXMgdGhpcztcbiAgICB9XG4gICAgcHJvdGVjdGVkIGdldFZhbHVlKHZhbHVlczogVFsnVEFycmF5J10sIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlcik6IFRbJ1RWYWx1ZSddIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlc1tpbmRleCAqIHNpemVdO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2V0VmFsdWUodmFsdWVzOiBUWydUQXJyYXknXSwgaW5kZXg6IG51bWJlciwgc2l6ZTogbnVtYmVyLCB2YWx1ZTogVFsnVFZhbHVlJ10pOiB2b2lkIHtcbiAgICAgICAgdmFsdWVzW2luZGV4ICogc2l6ZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcHVibGljIGdldChpbmRleDogbnVtYmVyKTogVFsnVFZhbHVlJ10ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZSh0aGlzLnZhbHVlcywgaW5kZXgsIHRoaXMuc2l6ZSk7XG4gICAgfVxuICAgIHB1YmxpYyBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLnNldFZhbHVlKHRoaXMudmFsdWVzLCBpbmRleCwgdGhpcy5zaXplLCB2YWx1ZSk7XG4gICAgfVxuICAgIHB1YmxpYyB0b0FycmF5KCk6IEl0ZXJhYmxlQXJyYXlMaWtlPFRbJ1RWYWx1ZSddPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgPiAxID9cbiAgICAgICAgICAgIG5ldyB0aGlzLkFycmF5VHlwZSh0aGlzKSA6XG4gICAgICAgICAgICB0aGlzLnZhbHVlcy5zdWJhcnJheSgwLCB0aGlzLmxlbmd0aCk7XG4gICAgfVxuICAgIHB1YmxpYyAqW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxUWydUVmFsdWUnXT4ge1xuICAgICAgICBjb25zdCBnZXQgPSB0aGlzLmdldFZhbHVlO1xuICAgICAgICBjb25zdCB7IHNpemUsIHZhbHVlcywgbGVuZ3RoIH0gPSB0aGlzO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xOyArK2luZGV4IDwgbGVuZ3RoOykge1xuICAgICAgICAgICAgeWllbGQgZ2V0KHZhbHVlcywgaW5kZXgsIHNpemUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRml4ZWRTaXplVmlldzxUIGV4dGVuZHMgUHJpbWl0aXZlVHlwZT4gZXh0ZW5kcyBQcmltaXRpdmVWaWV3PFQ+IHtcbiAgICBwdWJsaWMgdG9BcnJheSgpOiBJdGVyYWJsZUFycmF5TGlrZTxUWydUVmFsdWUnXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXM7XG4gICAgfVxuICAgIHB1YmxpYyBpbmRleE9mKHNlYXJjaDogVFsnVFZhbHVlJ10pIHtcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgZm9yIChsZXQgdmFsdWUgb2YgdGhpcykge1xuICAgICAgICAgICAgaWYgKHZhbHVlLmV2ZXJ5KChkOiBudW1iZXIsIGk6IG51bWJlcikgPT4gZCA9PT0gc2VhcmNoW2ldKSkgeyByZXR1cm4gaW5kZXg7IH1cbiAgICAgICAgICAgICsraW5kZXg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHByb3RlY3RlZCBnZXRWYWx1ZSh2YWx1ZXM6IFRbJ1RBcnJheSddLCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBUWydUVmFsdWUnXSB7XG4gICAgICAgIHJldHVybiB2YWx1ZXMuc3ViYXJyYXkoaW5kZXggKiBzaXplLCBpbmRleCAqIHNpemUgKyBzaXplKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHNldFZhbHVlKHZhbHVlczogVFsnVEFycmF5J10sIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZCB7XG4gICAgICAgIHZhbHVlcy5zZXQoKHZhbHVlIGFzIFRbJ1RBcnJheSddKS5zdWJhcnJheSgwLCBzaXplKSwgaW5kZXggKiBzaXplKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGbG9hdDE2VmlldyBleHRlbmRzIFByaW1pdGl2ZVZpZXc8RmxvYXQxNj4ge1xuICAgIHB1YmxpYyB0b0FycmF5KCkgeyByZXR1cm4gbmV3IEZsb2F0MzJBcnJheSh0aGlzKTsgfVxuICAgIHByb3RlY3RlZCBnZXRWYWx1ZSh2YWx1ZXM6IFVpbnQxNkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gKHZhbHVlc1tpbmRleCAqIHNpemVdIC0gMzI3NjcpIC8gMzI3Njc7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZXM6IFVpbnQxNkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdmFsdWVzW2luZGV4ICogc2l6ZV0gPSAodmFsdWUgKiAzMjc2NykgKyAzMjc2NztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRlRGF5VmlldyBleHRlbmRzIFByaW1pdGl2ZVZpZXc8RGF0ZV8+IHtcbiAgICBwdWJsaWMgdG9BcnJheSgpIHsgcmV0dXJuIFsuLi50aGlzXTsgfVxuICAgIHByb3RlY3RlZCBnZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlcik6IERhdGUge1xuICAgICAgICByZXR1cm4gZXBvY2hEYXlzVG9EYXRlKHZhbHVlcywgaW5kZXggKiBzaXplKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHNldFZhbHVlKHZhbHVlczogSW50MzJBcnJheSwgaW5kZXg6IG51bWJlciwgc2l6ZTogbnVtYmVyLCB2YWx1ZTogRGF0ZSk6IHZvaWQge1xuICAgICAgICB2YWx1ZXNbaW5kZXggKiBzaXplXSA9IHZhbHVlLnZhbHVlT2YoKSAvIDg2NDAwMDAwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERhdGVNaWxsaXNlY29uZFZpZXcgZXh0ZW5kcyBGaXhlZFNpemVWaWV3PERhdGVfPiB7XG4gICAgcHVibGljIHRvQXJyYXkoKSB7IHJldHVybiBbLi4udGhpc107IH1cbiAgICBwcm90ZWN0ZWQgZ2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBEYXRlIHtcbiAgICAgICAgcmV0dXJuIGVwb2NoTWlsbGlzZWNvbmRzTG9uZ1RvRGF0ZSh2YWx1ZXMsIGluZGV4ICogc2l6ZSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlciwgdmFsdWU6IERhdGUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZXBvY2hNcyA9IHZhbHVlLnZhbHVlT2YoKTtcbiAgICAgICAgdmFsdWVzW2luZGV4ICogc2l6ZV0gPSAoZXBvY2hNcyAlIDQyOTQ5NjcyOTYpIHwgMDtcbiAgICAgICAgdmFsdWVzW2luZGV4ICogc2l6ZSArIHNpemVdID0gKGVwb2NoTXMgLyA0Mjk0OTY3Mjk2KSB8IDA7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGltZXN0YW1wRGF5VmlldyBleHRlbmRzIFByaW1pdGl2ZVZpZXc8VGltZXN0YW1wPiB7XG4gICAgcHVibGljIHRvQXJyYXkoKSB7IHJldHVybiBbLi4udGhpc107IH1cbiAgICBwcm90ZWN0ZWQgZ2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gZXBvY2hEYXlzVG9Ncyh2YWx1ZXMsIGluZGV4ICogc2l6ZSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlciwgZXBvY2hNczogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHZhbHVlc1tpbmRleCAqIHNpemVdID0gKGVwb2NoTXMgLyA4NjQwMDAwMCkgfCAwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRpbWVzdGFtcFNlY29uZFZpZXcgZXh0ZW5kcyBQcmltaXRpdmVWaWV3PFRpbWVzdGFtcD4ge1xuICAgIHB1YmxpYyB0b0FycmF5KCkgeyByZXR1cm4gWy4uLnRoaXNdOyB9XG4gICAgcHJvdGVjdGVkIGdldFZhbHVlKHZhbHVlczogSW50MzJBcnJheSwgaW5kZXg6IG51bWJlciwgc2l6ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIGVwb2NoU2Vjb25kc1RvTXModmFsdWVzLCBpbmRleCAqIHNpemUpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIsIGVwb2NoTXM6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB2YWx1ZXNbaW5kZXggKiBzaXplXSA9IChlcG9jaE1zIC8gMTAwMCkgfCAwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRpbWVzdGFtcE1pbGxpc2Vjb25kVmlldyBleHRlbmRzIFByaW1pdGl2ZVZpZXc8VGltZXN0YW1wPiB7XG4gICAgcHVibGljIHRvQXJyYXkoKSB7IHJldHVybiBbLi4udGhpc107IH1cbiAgICBwcm90ZWN0ZWQgZ2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gZXBvY2hNaWxsaXNlY29uZHNMb25nVG9Ncyh2YWx1ZXMsIGluZGV4ICogc2l6ZSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlciwgZXBvY2hNczogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHZhbHVlc1tpbmRleCAqIHNpemVdID0gKGVwb2NoTXMgJSA0Mjk0OTY3Mjk2KSB8IDA7XG4gICAgICAgIHZhbHVlc1tpbmRleCAqIHNpemUgKyBzaXplXSA9IChlcG9jaE1zIC8gNDI5NDk2NzI5NikgfCAwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRpbWVzdGFtcE1pY3Jvc2Vjb25kVmlldyBleHRlbmRzIFByaW1pdGl2ZVZpZXc8VGltZXN0YW1wPiB7XG4gICAgcHVibGljIHRvQXJyYXkoKSB7IHJldHVybiBbLi4udGhpc107IH1cbiAgICBwcm90ZWN0ZWQgZ2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gZXBvY2hNaWNyb3NlY29uZHNMb25nVG9Ncyh2YWx1ZXMsIGluZGV4ICogc2l6ZSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlciwgZXBvY2hNczogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHZhbHVlc1tpbmRleCAqIHNpemVdID0gKChlcG9jaE1zIC8gMTAwMCkgJSA0Mjk0OTY3Mjk2KSB8IDA7XG4gICAgICAgIHZhbHVlc1tpbmRleCAqIHNpemUgKyBzaXplXSA9ICgoZXBvY2hNcyAvIDEwMDApIC8gNDI5NDk2NzI5NikgfCAwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRpbWVzdGFtcE5hbm9zZWNvbmRWaWV3IGV4dGVuZHMgUHJpbWl0aXZlVmlldzxUaW1lc3RhbXA+IHtcbiAgICBwdWJsaWMgdG9BcnJheSgpIHsgcmV0dXJuIFsuLi50aGlzXTsgfVxuICAgIHByb3RlY3RlZCBnZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBlcG9jaE5hbm9zZWNvbmRzTG9uZ1RvTXModmFsdWVzLCBpbmRleCAqIHNpemUpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIsIGVwb2NoTXM6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB2YWx1ZXNbaW5kZXggKiBzaXplXSA9ICgoZXBvY2hNcyAvIDEwMDAwMDApICUgNDI5NDk2NzI5NikgfCAwO1xuICAgICAgICB2YWx1ZXNbaW5kZXggKiBzaXplICsgc2l6ZV0gPSAoKGVwb2NoTXMgLyAxMDAwMDAwKSAvIDQyOTQ5NjcyOTYpIHwgMDtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcnZhbFllYXJNb250aFZpZXcgZXh0ZW5kcyBQcmltaXRpdmVWaWV3PEludGVydmFsPiB7XG4gICAgcHVibGljIHRvQXJyYXkoKSB7IHJldHVybiBbLi4udGhpc107IH1cbiAgICBwcm90ZWN0ZWQgZ2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIpOiBJbnQzMkFycmF5IHtcbiAgICAgICAgY29uc3QgaW50ZXJ2YWwgPSB2YWx1ZXNbaW5kZXggKiBzaXplXTtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnQzMkFycmF5KFtpbnRlcnZhbCAvIDEyLCAvKiB5ZWFycyAqLyBpbnRlcnZhbCAlIDEyICAvKiBtb250aHMgKi9dKTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHNldFZhbHVlKHZhbHVlczogSW50MzJBcnJheSwgaW5kZXg6IG51bWJlciwgc2l6ZTogbnVtYmVyLCB2YWx1ZTogSW50MzJBcnJheSk6IHZvaWQge1xuICAgICAgICB2YWx1ZXNbaW5kZXggKiBzaXplXSA9ICh2YWx1ZVswXSAqIDEyKSArICh2YWx1ZVsxXSAlIDEyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcnZhbFllYXJWaWV3IGV4dGVuZHMgUHJpbWl0aXZlVmlldzxJbnQzMj4ge1xuICAgIHB1YmxpYyB0b0FycmF5KCkgeyByZXR1cm4gWy4uLnRoaXNdOyB9XG4gICAgcHJvdGVjdGVkIGdldFZhbHVlKHZhbHVlczogSW50MzJBcnJheSwgaW5kZXg6IG51bWJlciwgc2l6ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlc1tpbmRleCAqIHNpemVdIC8gMTI7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlciwgdmFsdWU6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB2YWx1ZXNbaW5kZXggKiBzaXplXSA9ICh2YWx1ZSAqIDEyKSArICh2YWx1ZXNbaW5kZXggKiBzaXplXSAlIDEyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcnZhbE1vbnRoVmlldyBleHRlbmRzIFByaW1pdGl2ZVZpZXc8SW50MzI+IHtcbiAgICBwdWJsaWMgdG9BcnJheSgpIHsgcmV0dXJuIFsuLi50aGlzXTsgfVxuICAgIHByb3RlY3RlZCBnZXRWYWx1ZSh2YWx1ZXM6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIsIHNpemU6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB2YWx1ZXNbaW5kZXggKiBzaXplXSAlIDEyO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2V0VmFsdWUodmFsdWVzOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyLCBzaXplOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdmFsdWVzW2luZGV4ICogc2l6ZV0gPSAodmFsdWVzW2luZGV4ICogc2l6ZV0gKiAxMikgKyAodmFsdWUgJSAxMik7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXBvY2hTZWNvbmRzVG9NcyhkYXRhOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyKSB7IHJldHVybiAxMDAwICogZGF0YVtpbmRleF07IH1cbmV4cG9ydCBmdW5jdGlvbiBlcG9jaERheXNUb01zKGRhdGE6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIpIHsgcmV0dXJuIDg2NDAwMDAwICogZGF0YVtpbmRleF07IH1cbmV4cG9ydCBmdW5jdGlvbiBlcG9jaE1pbGxpc2Vjb25kc0xvbmdUb01zKGRhdGE6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIpIHsgcmV0dXJuIDQyOTQ5NjcyOTYgKiAoZGF0YVtpbmRleCArIDFdKSArIChkYXRhW2luZGV4XSA+Pj4gMCk7IH1cbmV4cG9ydCBmdW5jdGlvbiBlcG9jaE1pY3Jvc2Vjb25kc0xvbmdUb01zKGRhdGE6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIpIHsgcmV0dXJuIDQyOTQ5NjcyOTYgKiAoZGF0YVtpbmRleCArIDFdIC8gMTAwMCkgKyAoKGRhdGFbaW5kZXhdID4+PiAwKSAvIDEwMDApOyB9XG5leHBvcnQgZnVuY3Rpb24gZXBvY2hOYW5vc2Vjb25kc0xvbmdUb01zKGRhdGE6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIpIHsgcmV0dXJuIDQyOTQ5NjcyOTYgKiAoZGF0YVtpbmRleCArIDFdIC8gMTAwMDAwMCkgKyAoKGRhdGFbaW5kZXhdID4+PiAwKSAvIDEwMDAwMDApOyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBlcG9jaE1pbGxpc2Vjb25kc1RvRGF0ZShlcG9jaE1zOiBudW1iZXIpIHsgcmV0dXJuIG5ldyBEYXRlKGVwb2NoTXMpOyB9XG5leHBvcnQgZnVuY3Rpb24gZXBvY2hEYXlzVG9EYXRlKGRhdGE6IEludDMyQXJyYXksIGluZGV4OiBudW1iZXIpIHsgcmV0dXJuIGVwb2NoTWlsbGlzZWNvbmRzVG9EYXRlKGVwb2NoRGF5c1RvTXMoZGF0YSwgaW5kZXgpKTsgfVxuZXhwb3J0IGZ1bmN0aW9uIGVwb2NoU2Vjb25kc1RvRGF0ZShkYXRhOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyKSB7IHJldHVybiBlcG9jaE1pbGxpc2Vjb25kc1RvRGF0ZShlcG9jaFNlY29uZHNUb01zKGRhdGEsIGluZGV4KSk7IH1cbmV4cG9ydCBmdW5jdGlvbiBlcG9jaE5hbm9zZWNvbmRzTG9uZ1RvRGF0ZShkYXRhOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyKSB7IHJldHVybiBlcG9jaE1pbGxpc2Vjb25kc1RvRGF0ZShlcG9jaE5hbm9zZWNvbmRzTG9uZ1RvTXMoZGF0YSwgaW5kZXgpKTsgfVxuZXhwb3J0IGZ1bmN0aW9uIGVwb2NoTWlsbGlzZWNvbmRzTG9uZ1RvRGF0ZShkYXRhOiBJbnQzMkFycmF5LCBpbmRleDogbnVtYmVyKSB7IHJldHVybiBlcG9jaE1pbGxpc2Vjb25kc1RvRGF0ZShlcG9jaE1pbGxpc2Vjb25kc0xvbmdUb01zKGRhdGEsIGluZGV4KSk7IH1cbiJdfQ==
