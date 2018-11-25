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
import { ChunkedData, FlatData, BoolData, DictionaryData } from './data';
import { TypeVisitor, VectorVisitor } from './visitor';
import { TimeUnit } from './type';
import { Precision, DateUnit, IntervalUnit, UnionMode } from './type';
var Vector = /** @class */ (function () {
    function Vector(data, view) {
        this.data = data;
        this.type = data.type;
        this.length = data.length;
        var nulls;
        if ((data instanceof ChunkedData) && !(view instanceof ChunkedView)) {
            this.view = new ChunkedView(data);
        }
        else if (!(view instanceof ValidityView) && (nulls = data.nullBitmap) && nulls.length > 0 && data.nullCount > 0) {
            this.view = new ValidityView(data, view);
        }
        else {
            this.view = view;
        }
    }
    Vector.create = function (data) {
        return createVector(data);
    };
    Vector.concat = function (source) {
        var others = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            others[_i - 1] = arguments[_i];
        }
        return others.reduce(function (a, b) { return a ? a.concat(b) : b; }, source);
    };
    Object.defineProperty(Vector.prototype, "nullCount", {
        get: function () { return this.data.nullCount; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector.prototype, "nullBitmap", {
        get: function () { return this.data.nullBitmap; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vector.prototype, Symbol.toStringTag, {
        get: function () {
            return "Vector<" + this.type[Symbol.toStringTag] + ">";
        },
        enumerable: true,
        configurable: true
    });
    Vector.prototype.toJSON = function () { return this.toArray(); };
    Vector.prototype.clone = function (data, view) {
        if (view === void 0) { view = this.view.clone(data); }
        return new this.constructor(data, view);
    };
    Vector.prototype.isValid = function (index) {
        return this.view.isValid(index);
    };
    Vector.prototype.get = function (index) {
        return this.view.get(index);
    };
    Vector.prototype.set = function (index, value) {
        return this.view.set(index, value);
    };
    Vector.prototype.toArray = function () {
        return this.view.toArray();
    };
    Vector.prototype.indexOf = function (value) {
        return this.view.indexOf(value);
    };
    Vector.prototype[Symbol.iterator] = function () {
        return this.view[Symbol.iterator]();
    };
    Vector.prototype.concat = function () {
        var others = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            others[_i] = arguments[_i];
        }
        if ((others = others.filter(Boolean)).length === 0) {
            return this;
        }
        var view = this.view;
        var vecs = !(view instanceof ChunkedView)
            ? tslib_1.__spread([this], others) : tslib_1.__spread(view.chunkVectors, others);
        var offsets = ChunkedData.computeOffsets(vecs);
        var chunksLength = offsets[offsets.length - 1];
        var chunkedData = new ChunkedData(this.type, chunksLength, vecs, 0, -1, offsets);
        return this.clone(chunkedData, new ChunkedView(chunkedData));
    };
    Vector.prototype.slice = function (begin, end) {
        var length = this.length;
        var size = this.view.size || 1;
        var total = length, from = (begin || 0) * size;
        var to = (typeof end === 'number' ? end : total) * size;
        if (to < 0) {
            to = total - (to * -1) % total;
        }
        if (from < 0) {
            from = total - (from * -1) % total;
        }
        if (to < from) {
            _a = tslib_1.__read([to, from], 2), from = _a[0], to = _a[1];
        }
        total = !isFinite(total = (to - from)) || total < 0 ? 0 : total;
        var slicedData = this.data.slice(from, Math.min(total, length));
        return this.clone(slicedData, this.view.clone(slicedData));
        var _a;
    };
    Vector.prototype.acceptTypeVisitor = function (visitor) {
        return TypeVisitor.visitTypeInline(visitor, this.type);
    };
    Vector.prototype.acceptVectorVisitor = function (visitor) {
        return VectorVisitor.visitTypeInline(visitor, this.type, this);
    };
    return Vector;
}());
export { Vector };
var FlatVector = /** @class */ (function (_super) {
    tslib_1.__extends(FlatVector, _super);
    function FlatVector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FlatVector.prototype, "values", {
        get: function () { return this.data.values; },
        enumerable: true,
        configurable: true
    });
    FlatVector.prototype.lows = function () { return this.asInt32(0, 2); };
    FlatVector.prototype.highs = function () { return this.asInt32(1, 2); };
    FlatVector.prototype.asInt32 = function (offset, stride) {
        if (offset === void 0) { offset = 0; }
        if (stride === void 0) { stride = 2; }
        var data = this.data.clone(new Int32());
        if (offset > 0) {
            data = data.slice(offset, this.length - offset);
        }
        var int32s = new IntVector(data, new PrimitiveView(data, stride));
        int32s.length = this.length / stride | 0;
        return int32s;
    };
    return FlatVector;
}(Vector));
export { FlatVector };
var ListVectorBase = /** @class */ (function (_super) {
    tslib_1.__extends(ListVectorBase, _super);
    function ListVectorBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ListVectorBase.prototype, "values", {
        get: function () { return this.data.values; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListVectorBase.prototype, "valueOffsets", {
        get: function () { return this.data.valueOffsets; },
        enumerable: true,
        configurable: true
    });
    ListVectorBase.prototype.getValueOffset = function (index) {
        return this.valueOffsets[index];
    };
    ListVectorBase.prototype.getValueLength = function (index) {
        return this.valueOffsets[index + 1] - this.valueOffsets[index];
    };
    return ListVectorBase;
}(Vector));
export { ListVectorBase };
var NestedVector = /** @class */ (function (_super) {
    tslib_1.__extends(NestedVector, _super);
    function NestedVector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NestedVector.prototype.getChildAt = function (index) {
        return this.view.getChildAt(index);
    };
    Object.defineProperty(NestedVector.prototype, "childData", {
        get: function () {
            var data;
            if ((data = this._childData)) {
                // Return the cached childData reference first
                return data;
            }
            else if (!((data = this.data) instanceof ChunkedData)) {
                // If data isn't chunked, cache and return NestedData's childData
                return this._childData = data.childData;
            }
            // Otherwise if the data is chunked, concatenate the childVectors from each chunk
            // to construct a single chunked Vector for each column. Then return the ChunkedData
            // instance from each unified chunked column as the childData of a chunked NestedVector
            var chunks = data.chunkVectors;
            return this._childData = chunks
                .reduce(function (cols, chunk) { return chunk.childData
                .reduce(function (cols, _, i) { return ((cols[i] || (cols[i] = [])).push(chunk.getChildAt(i))) && cols || cols; }, cols); }, [])
                .map(function (vecs) { return Vector.concat.apply(Vector, tslib_1.__spread(vecs)).data; });
        },
        enumerable: true,
        configurable: true
    });
    return NestedVector;
}(Vector));
export { NestedVector };
import { Binary, Utf8, Bool, } from './type';
import { Uint8, Uint16, Uint32, Uint64, Int8, Int16, Int32, Int64, Float16, Float32, Float64 } from './type';
import { Struct, Map_ } from './type';
import { ChunkedView } from './vector/chunked';
import { DictionaryView } from './vector/dictionary';
import { ListView, FixedSizeListView, BinaryView, Utf8View } from './vector/list';
import { UnionView, DenseUnionView, StructView, MapView } from './vector/nested';
import { FlatView, NullView, BoolView, ValidityView, PrimitiveView, FixedSizeView, Float16View } from './vector/flat';
import { DateDayView, DateMillisecondView, IntervalYearMonthView } from './vector/flat';
import { TimestampDayView, TimestampSecondView, TimestampMillisecondView, TimestampMicrosecondView, TimestampNanosecondView } from './vector/flat';
import { packBools } from './util/bit';
var NullVector = /** @class */ (function (_super) {
    tslib_1.__extends(NullVector, _super);
    function NullVector(data, view) {
        if (view === void 0) { view = new NullView(data); }
        return _super.call(this, data, view) || this;
    }
    return NullVector;
}(Vector));
export { NullVector };
var BoolVector = /** @class */ (function (_super) {
    tslib_1.__extends(BoolVector, _super);
    function BoolVector(data, view) {
        if (view === void 0) { view = new BoolView(data); }
        return _super.call(this, data, view) || this;
    }
    BoolVector.from = function (data) {
        return new BoolVector(new BoolData(new Bool(), data.length, null, packBools(data)));
    };
    Object.defineProperty(BoolVector.prototype, "values", {
        get: function () { return this.data.values; },
        enumerable: true,
        configurable: true
    });
    return BoolVector;
}(Vector));
export { BoolVector };
var IntVector = /** @class */ (function (_super) {
    tslib_1.__extends(IntVector, _super);
    function IntVector(data, view) {
        if (view === void 0) { view = IntVector.defaultView(data); }
        return _super.call(this, data, view) || this;
    }
    IntVector.from = function (data, is64) {
        if (is64 === true) {
            return data instanceof Int32Array
                ? new IntVector(new FlatData(new Int64(), data.length, null, data))
                : new IntVector(new FlatData(new Uint64(), data.length, null, data));
        }
        switch (data.constructor) {
            case Int8Array: return new IntVector(new FlatData(new Int8(), data.length, null, data));
            case Int16Array: return new IntVector(new FlatData(new Int16(), data.length, null, data));
            case Int32Array: return new IntVector(new FlatData(new Int32(), data.length, null, data));
            case Uint8Array: return new IntVector(new FlatData(new Uint8(), data.length, null, data));
            case Uint16Array: return new IntVector(new FlatData(new Uint16(), data.length, null, data));
            case Uint32Array: return new IntVector(new FlatData(new Uint32(), data.length, null, data));
        }
        throw new TypeError('Unrecognized Int data');
    };
    IntVector.defaultView = function (data) {
        return data.type.bitWidth <= 32 ? new FlatView(data) : new FixedSizeView(data, (data.type.bitWidth / 32) | 0);
    };
    return IntVector;
}(FlatVector));
export { IntVector };
var FloatVector = /** @class */ (function (_super) {
    tslib_1.__extends(FloatVector, _super);
    function FloatVector(data, view) {
        if (view === void 0) { view = FloatVector.defaultView(data); }
        return _super.call(this, data, view) || this;
    }
    FloatVector.from = function (data) {
        switch (data.constructor) {
            case Uint16Array: return new FloatVector(new FlatData(new Float16(), data.length, null, data));
            case Float32Array: return new FloatVector(new FlatData(new Float32(), data.length, null, data));
            case Float64Array: return new FloatVector(new FlatData(new Float64(), data.length, null, data));
        }
        throw new TypeError('Unrecognized Float data');
    };
    FloatVector.defaultView = function (data) {
        return data.type.precision !== Precision.HALF ? new FlatView(data) : new Float16View(data);
    };
    return FloatVector;
}(FlatVector));
export { FloatVector };
var DateVector = /** @class */ (function (_super) {
    tslib_1.__extends(DateVector, _super);
    function DateVector(data, view) {
        if (view === void 0) { view = DateVector.defaultView(data); }
        return _super.call(this, data, view) || this;
    }
    DateVector.defaultView = function (data) {
        return data.type.unit === DateUnit.DAY ? new DateDayView(data) : new DateMillisecondView(data, 2);
    };
    DateVector.prototype.lows = function () {
        return this.type.unit === DateUnit.DAY ? this.asInt32(0, 1) : this.asInt32(0, 2);
    };
    DateVector.prototype.highs = function () {
        return this.type.unit === DateUnit.DAY ? this.asInt32(0, 1) : this.asInt32(1, 2);
    };
    DateVector.prototype.asEpochMilliseconds = function () {
        var data = this.data.clone(new Int32());
        switch (this.type.unit) {
            case DateUnit.DAY: return new IntVector(data, new TimestampDayView(data, 1));
            case DateUnit.MILLISECOND: return new IntVector(data, new TimestampMillisecondView(data, 2));
        }
        throw new TypeError("Unrecognized date unit \"" + DateUnit[this.type.unit] + "\"");
    };
    return DateVector;
}(FlatVector));
export { DateVector };
var DecimalVector = /** @class */ (function (_super) {
    tslib_1.__extends(DecimalVector, _super);
    function DecimalVector(data, view) {
        if (view === void 0) { view = new FixedSizeView(data, 4); }
        return _super.call(this, data, view) || this;
    }
    return DecimalVector;
}(FlatVector));
export { DecimalVector };
var TimeVector = /** @class */ (function (_super) {
    tslib_1.__extends(TimeVector, _super);
    function TimeVector(data, view) {
        if (view === void 0) { view = TimeVector.defaultView(data); }
        return _super.call(this, data, view) || this;
    }
    TimeVector.defaultView = function (data) {
        return data.type.bitWidth <= 32 ? new FlatView(data) : new FixedSizeView(data, (data.type.bitWidth / 32) | 0);
    };
    TimeVector.prototype.lows = function () {
        return this.type.bitWidth <= 32 ? this.asInt32(0, 1) : this.asInt32(0, 2);
    };
    TimeVector.prototype.highs = function () {
        return this.type.bitWidth <= 32 ? this.asInt32(0, 1) : this.asInt32(1, 2);
    };
    return TimeVector;
}(FlatVector));
export { TimeVector };
var TimestampVector = /** @class */ (function (_super) {
    tslib_1.__extends(TimestampVector, _super);
    function TimestampVector(data, view) {
        if (view === void 0) { view = new FixedSizeView(data, 2); }
        return _super.call(this, data, view) || this;
    }
    TimestampVector.prototype.asEpochMilliseconds = function () {
        var data = this.data.clone(new Int32());
        switch (this.type.unit) {
            case TimeUnit.SECOND: return new IntVector(data, new TimestampSecondView(data, 1));
            case TimeUnit.MILLISECOND: return new IntVector(data, new TimestampMillisecondView(data, 2));
            case TimeUnit.MICROSECOND: return new IntVector(data, new TimestampMicrosecondView(data, 2));
            case TimeUnit.NANOSECOND: return new IntVector(data, new TimestampNanosecondView(data, 2));
        }
        throw new TypeError("Unrecognized time unit \"" + TimeUnit[this.type.unit] + "\"");
    };
    return TimestampVector;
}(FlatVector));
export { TimestampVector };
var IntervalVector = /** @class */ (function (_super) {
    tslib_1.__extends(IntervalVector, _super);
    function IntervalVector(data, view) {
        if (view === void 0) { view = IntervalVector.defaultView(data); }
        return _super.call(this, data, view) || this;
    }
    IntervalVector.defaultView = function (data) {
        return data.type.unit === IntervalUnit.YEAR_MONTH ? new IntervalYearMonthView(data) : new FixedSizeView(data, 2);
    };
    IntervalVector.prototype.lows = function () {
        return this.type.unit === IntervalUnit.YEAR_MONTH ? this.asInt32(0, 1) : this.asInt32(0, 2);
    };
    IntervalVector.prototype.highs = function () {
        return this.type.unit === IntervalUnit.YEAR_MONTH ? this.asInt32(0, 1) : this.asInt32(1, 2);
    };
    return IntervalVector;
}(FlatVector));
export { IntervalVector };
var BinaryVector = /** @class */ (function (_super) {
    tslib_1.__extends(BinaryVector, _super);
    function BinaryVector(data, view) {
        if (view === void 0) { view = new BinaryView(data); }
        return _super.call(this, data, view) || this;
    }
    BinaryVector.prototype.asUtf8 = function () {
        return new Utf8Vector(this.data.clone(new Utf8()));
    };
    return BinaryVector;
}(ListVectorBase));
export { BinaryVector };
var FixedSizeBinaryVector = /** @class */ (function (_super) {
    tslib_1.__extends(FixedSizeBinaryVector, _super);
    function FixedSizeBinaryVector(data, view) {
        if (view === void 0) { view = new FixedSizeView(data, data.type.byteWidth); }
        return _super.call(this, data, view) || this;
    }
    return FixedSizeBinaryVector;
}(FlatVector));
export { FixedSizeBinaryVector };
var Utf8Vector = /** @class */ (function (_super) {
    tslib_1.__extends(Utf8Vector, _super);
    function Utf8Vector(data, view) {
        if (view === void 0) { view = new Utf8View(data); }
        return _super.call(this, data, view) || this;
    }
    Utf8Vector.prototype.asBinary = function () {
        return new BinaryVector(this.data.clone(new Binary()));
    };
    return Utf8Vector;
}(ListVectorBase));
export { Utf8Vector };
var ListVector = /** @class */ (function (_super) {
    tslib_1.__extends(ListVector, _super);
    function ListVector(data, view) {
        if (view === void 0) { view = new ListView(data); }
        return _super.call(this, data, view) || this;
    }
    return ListVector;
}(ListVectorBase));
export { ListVector };
var FixedSizeListVector = /** @class */ (function (_super) {
    tslib_1.__extends(FixedSizeListVector, _super);
    function FixedSizeListVector(data, view) {
        if (view === void 0) { view = new FixedSizeListView(data); }
        return _super.call(this, data, view) || this;
    }
    return FixedSizeListVector;
}(Vector));
export { FixedSizeListVector };
var MapVector = /** @class */ (function (_super) {
    tslib_1.__extends(MapVector, _super);
    function MapVector(data, view) {
        if (view === void 0) { view = new MapView(data); }
        return _super.call(this, data, view) || this;
    }
    MapVector.prototype.asStruct = function () {
        return new StructVector(this.data.clone(new Struct(this.type.children)));
    };
    return MapVector;
}(NestedVector));
export { MapVector };
var StructVector = /** @class */ (function (_super) {
    tslib_1.__extends(StructVector, _super);
    function StructVector(data, view) {
        if (view === void 0) { view = new StructView(data); }
        return _super.call(this, data, view) || this;
    }
    StructVector.prototype.asMap = function (keysSorted) {
        if (keysSorted === void 0) { keysSorted = false; }
        return new MapVector(this.data.clone(new Map_(keysSorted, this.type.children)));
    };
    return StructVector;
}(NestedVector));
export { StructVector };
var UnionVector = /** @class */ (function (_super) {
    tslib_1.__extends(UnionVector, _super);
    function UnionVector(data, view) {
        if (view === void 0) { view = (data.type.mode === UnionMode.Sparse ? new UnionView(data) : new DenseUnionView(data)); }
        return _super.call(this, data, view) || this;
    }
    return UnionVector;
}(NestedVector));
export { UnionVector };
var DictionaryVector = /** @class */ (function (_super) {
    tslib_1.__extends(DictionaryVector, _super);
    function DictionaryVector(data, view) {
        if (view === void 0) { view = new DictionaryView(data.dictionary, new IntVector(data.indices)); }
        var _this = _super.call(this, data, view) || this;
        if (view instanceof ValidityView) {
            view = view.view;
        }
        if (data instanceof DictionaryData && view instanceof DictionaryView) {
            _this.indices = view.indices;
            _this.dictionary = data.dictionary;
        }
        else if (data instanceof ChunkedData && view instanceof ChunkedView) {
            var chunks = view.chunkVectors;
            // Assume the last chunk's dictionary data is the most up-to-date,
            // including data from DictionaryBatches that were marked as deltas
            _this.dictionary = chunks[chunks.length - 1].dictionary;
            _this.indices = chunks.reduce(function (idxs, dict) {
                return !idxs ? dict.indices : idxs.concat(dict.indices);
            }, null);
        }
        else {
            throw new TypeError("Unrecognized DictionaryVector view");
        }
        return _this;
    }
    DictionaryVector.prototype.getKey = function (index) { return this.indices.get(index); };
    DictionaryVector.prototype.getValue = function (key) { return this.dictionary.get(key); };
    DictionaryVector.prototype.reverseLookup = function (value) { return this.dictionary.indexOf(value); };
    return DictionaryVector;
}(Vector));
export { DictionaryVector };
export var createVector = (function (VectorLoader) { return (function (data) { return TypeVisitor.visitTypeInline(new VectorLoader(data), data.type); }); })(/** @class */ (function (_super) {
    tslib_1.__extends(VectorLoader, _super);
    function VectorLoader(data) {
        var _this = _super.call(this) || this;
        _this.data = data;
        return _this;
    }
    VectorLoader.prototype.visitNull = function (_type) { return new NullVector(this.data); };
    VectorLoader.prototype.visitInt = function (_type) { return new IntVector(this.data); };
    VectorLoader.prototype.visitFloat = function (_type) { return new FloatVector(this.data); };
    VectorLoader.prototype.visitBinary = function (_type) { return new BinaryVector(this.data); };
    VectorLoader.prototype.visitUtf8 = function (_type) { return new Utf8Vector(this.data); };
    VectorLoader.prototype.visitBool = function (_type) { return new BoolVector(this.data); };
    VectorLoader.prototype.visitDecimal = function (_type) { return new DecimalVector(this.data); };
    VectorLoader.prototype.visitDate = function (_type) { return new DateVector(this.data); };
    VectorLoader.prototype.visitTime = function (_type) { return new TimeVector(this.data); };
    VectorLoader.prototype.visitTimestamp = function (_type) { return new TimestampVector(this.data); };
    VectorLoader.prototype.visitInterval = function (_type) { return new IntervalVector(this.data); };
    VectorLoader.prototype.visitList = function (_type) { return new ListVector(this.data); };
    VectorLoader.prototype.visitStruct = function (_type) { return new StructVector(this.data); };
    VectorLoader.prototype.visitUnion = function (_type) { return new UnionVector(this.data); };
    VectorLoader.prototype.visitFixedSizeBinary = function (_type) { return new FixedSizeBinaryVector(this.data); };
    VectorLoader.prototype.visitFixedSizeList = function (_type) { return new FixedSizeListVector(this.data); };
    VectorLoader.prototype.visitMap = function (_type) { return new MapVector(this.data); };
    VectorLoader.prototype.visitDictionary = function (_type) { return new DictionaryVector(this.data); };
    return VectorLoader;
}(TypeVisitor)));

//# sourceMappingURL=data:application/json;charset=utf8;base64,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RCxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN2QixLQUFLLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLEtBQUssVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDMUYsS0FBSyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMxRixLQUFLLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzFGLEtBQUssV0FBVyxFQUFFLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUYsS0FBSyxXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksTUFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBQ0QsTUFBTSxJQUFJLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFD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LENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBUSxDQUFDO0lBQzdGLGdDQUFTLEdBQVQsVUFBcUIsS0FBVyxJQUFlLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBWSxDQUFDO0lBQzdGLGtDQUFXLEdBQVgsVUFBcUIsS0FBYSxJQUFhLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBVSxDQUFDO0lBQzdGLGlDQUFVLEdBQVYsVUFBcUIsS0FBWSxJQUFjLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBVyxDQUFDO0lBQzdGLDJDQUFvQixHQUFwQixVQUFxQixLQUFzQixJQUFJLE1BQU0sQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0YseUNBQWtCLEdBQWxCLFVBQXFCLEtBQW9CLElBQU0sTUFBTSxDQUFDLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUcsQ0FBQztJQUM3RiwrQkFBUSxHQUFSLFVBQXFCLEtBQVcsSUFBZSxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQWEsQ0FBQztJQUM3RixzQ0FBZSxHQUFmLFVBQXFCLEtBQWlCLElBQVMsTUFBTSxDQUFDLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sQ0FBQztJQUNqRyxtQkFBQztBQUFELENBcEJHLEFBb0JGLENBcEJpRCxXQUFXLEdBb0IzRCxDQUFDIiwiZmlsZSI6InZlY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbi8vIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuLy8gZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbi8vIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbi8vIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbi8vIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuLy8gd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuLy8gc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbi8vIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4vLyBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbi8vIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbi8vIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG5pbXBvcnQgeyBEYXRhLCBDaHVua2VkRGF0YSwgRmxhdERhdGEsIEJvb2xEYXRhLCBGbGF0TGlzdERhdGEsIE5lc3RlZERhdGEsIERpY3Rpb25hcnlEYXRhIH0gZnJvbSAnLi9kYXRhJztcbmltcG9ydCB7IFZpc2l0b3JOb2RlLCBUeXBlVmlzaXRvciwgVmVjdG9yVmlzaXRvciB9IGZyb20gJy4vdmlzaXRvcic7XG5pbXBvcnQgeyBEYXRhVHlwZSwgTGlzdFR5cGUsIEZsYXRUeXBlLCBOZXN0ZWRUeXBlLCBGbGF0TGlzdFR5cGUsIFRpbWVVbml0IH0gZnJvbSAnLi90eXBlJztcbmltcG9ydCB7IEl0ZXJhYmxlQXJyYXlMaWtlLCBQcmVjaXNpb24sIERhdGVVbml0LCBJbnRlcnZhbFVuaXQsIFVuaW9uTW9kZSB9IGZyb20gJy4vdHlwZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmVjdG9yTGlrZSB7IGxlbmd0aDogbnVtYmVyOyBudWxsQ291bnQ6IG51bWJlcjsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXc8VCBleHRlbmRzIERhdGFUeXBlPiB7XG4gICAgY2xvbmUoZGF0YTogRGF0YTxUPik6IHRoaXM7XG4gICAgaXNWYWxpZChpbmRleDogbnVtYmVyKTogYm9vbGVhbjtcbiAgICBnZXQoaW5kZXg6IG51bWJlcik6IFRbJ1RWYWx1ZSddIHwgbnVsbDtcbiAgICBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZDtcbiAgICB0b0FycmF5KCk6IEl0ZXJhYmxlQXJyYXlMaWtlPFRbJ1RWYWx1ZSddIHwgbnVsbD47XG4gICAgaW5kZXhPZihzZWFyY2g6IFRbJ1RWYWx1ZSddKTogbnVtYmVyO1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8VFsnVFZhbHVlJ10gfCBudWxsPjtcbn1cblxuZXhwb3J0IGNsYXNzIFZlY3RvcjxUIGV4dGVuZHMgRGF0YVR5cGUgPSBhbnk+IGltcGxlbWVudHMgVmVjdG9yTGlrZSwgVmlldzxUPiwgVmlzaXRvck5vZGUge1xuICAgIHB1YmxpYyBzdGF0aWMgY3JlYXRlPFQgZXh0ZW5kcyBEYXRhVHlwZT4oZGF0YTogRGF0YTxUPik6IFZlY3RvcjxUPiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVWZWN0b3IoZGF0YSk7XG4gICAgfVxuICAgIHB1YmxpYyBzdGF0aWMgY29uY2F0PFQgZXh0ZW5kcyBEYXRhVHlwZT4oc291cmNlPzogVmVjdG9yPFQ+IHwgbnVsbCwgLi4ub3RoZXJzOiBWZWN0b3I8VD5bXSk6IFZlY3RvcjxUPiB7XG4gICAgICAgIHJldHVybiBvdGhlcnMucmVkdWNlKChhLCBiKSA9PiBhID8gYS5jb25jYXQoYikgOiBiLCBzb3VyY2UhKTtcbiAgICB9XG4gICAgcHVibGljIHR5cGU6IFQ7XG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICAgIHB1YmxpYyByZWFkb25seSBkYXRhOiBEYXRhPFQ+O1xuICAgIHB1YmxpYyByZWFkb25seSB2aWV3OiBWaWV3PFQ+O1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VD4sIHZpZXc6IFZpZXc8VD4pIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy50eXBlID0gZGF0YS50eXBlO1xuICAgICAgICB0aGlzLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICBsZXQgbnVsbHM6IFVpbnQ4QXJyYXk7XG4gICAgICAgIGlmICgoPGFueT4gZGF0YSBpbnN0YW5jZW9mIENodW5rZWREYXRhKSAmJiAhKHZpZXcgaW5zdGFuY2VvZiBDaHVua2VkVmlldykpIHtcbiAgICAgICAgICAgIHRoaXMudmlldyA9IG5ldyBDaHVua2VkVmlldyhkYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmICghKHZpZXcgaW5zdGFuY2VvZiBWYWxpZGl0eVZpZXcpICYmIChudWxscyA9IGRhdGEubnVsbEJpdG1hcCEpICYmIG51bGxzLmxlbmd0aCA+IDAgJiYgZGF0YS5udWxsQ291bnQgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBuZXcgVmFsaWRpdHlWaWV3KGRhdGEsIHZpZXcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aWV3ID0gdmlldztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgbnVsbENvdW50KCkgeyByZXR1cm4gdGhpcy5kYXRhLm51bGxDb3VudDsgfVxuICAgIHB1YmxpYyBnZXQgbnVsbEJpdG1hcCgpIHsgcmV0dXJuIHRoaXMuZGF0YS5udWxsQml0bWFwOyB9XG4gICAgcHVibGljIGdldCBbU3ltYm9sLnRvU3RyaW5nVGFnXSgpIHtcbiAgICAgICAgcmV0dXJuIGBWZWN0b3I8JHt0aGlzLnR5cGVbU3ltYm9sLnRvU3RyaW5nVGFnXX0+YDtcbiAgICB9XG4gICAgcHVibGljIHRvSlNPTigpOiBhbnkgeyByZXR1cm4gdGhpcy50b0FycmF5KCk7IH1cbiAgICBwdWJsaWMgY2xvbmU8UiBleHRlbmRzIFQ+KGRhdGE6IERhdGE8Uj4sIHZpZXc6IFZpZXc8Uj4gPSB0aGlzLnZpZXcuY2xvbmUoZGF0YSkgYXMgYW55KTogdGhpcyB7XG4gICAgICAgIHJldHVybiBuZXcgKHRoaXMuY29uc3RydWN0b3IgYXMgYW55KShkYXRhLCB2aWV3KTtcbiAgICB9XG4gICAgcHVibGljIGlzVmFsaWQoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3LmlzVmFsaWQoaW5kZXgpO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0KGluZGV4OiBudW1iZXIpOiBUWydUVmFsdWUnXSB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3LmdldChpbmRleCk7XG4gICAgfVxuICAgIHB1YmxpYyBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcuc2V0KGluZGV4LCB2YWx1ZSk7XG4gICAgfVxuICAgIHB1YmxpYyB0b0FycmF5KCk6IEl0ZXJhYmxlQXJyYXlMaWtlPFRbJ1RWYWx1ZSddIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3LnRvQXJyYXkoKTtcbiAgICB9XG4gICAgcHVibGljIGluZGV4T2YodmFsdWU6IFRbJ1RWYWx1ZSddKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXcuaW5kZXhPZih2YWx1ZSk7XG4gICAgfVxuICAgIHB1YmxpYyBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFRbJ1RWYWx1ZSddIHwgbnVsbD4ge1xuICAgICAgICByZXR1cm4gdGhpcy52aWV3W1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICB9XG4gICAgcHVibGljIGNvbmNhdCguLi5vdGhlcnM6IFZlY3RvcjxUPltdKTogdGhpcyB7XG4gICAgICAgIGlmICgob3RoZXJzID0gb3RoZXJzLmZpbHRlcihCb29sZWFuKSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHZpZXcgfSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHZlY3MgPSAhKHZpZXcgaW5zdGFuY2VvZiBDaHVua2VkVmlldylcbiAgICAgICAgICAgID8gW3RoaXMsIC4uLm90aGVyc11cbiAgICAgICAgICAgIDogWy4uLnZpZXcuY2h1bmtWZWN0b3JzLCAuLi5vdGhlcnNdO1xuICAgICAgICBjb25zdCBvZmZzZXRzID0gQ2h1bmtlZERhdGEuY29tcHV0ZU9mZnNldHModmVjcyk7XG4gICAgICAgIGNvbnN0IGNodW5rc0xlbmd0aCA9IG9mZnNldHNbb2Zmc2V0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgY29uc3QgY2h1bmtlZERhdGEgPSBuZXcgQ2h1bmtlZERhdGEodGhpcy50eXBlLCBjaHVua3NMZW5ndGgsIHZlY3MsIDAsIC0xLCBvZmZzZXRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoY2h1bmtlZERhdGEsIG5ldyBDaHVua2VkVmlldyhjaHVua2VkRGF0YSkpIGFzIHRoaXM7XG4gICAgfVxuICAgIHB1YmxpYyBzbGljZShiZWdpbj86IG51bWJlciwgZW5kPzogbnVtYmVyKTogdGhpcyB7XG4gICAgICAgIGxldCB7IGxlbmd0aCB9ID0gdGhpcztcbiAgICAgICAgbGV0IHNpemUgPSAodGhpcy52aWV3IGFzIGFueSkuc2l6ZSB8fCAxO1xuICAgICAgICBsZXQgdG90YWwgPSBsZW5ndGgsIGZyb20gPSAoYmVnaW4gfHwgMCkgKiBzaXplO1xuICAgICAgICBsZXQgdG8gPSAodHlwZW9mIGVuZCA9PT0gJ251bWJlcicgPyBlbmQgOiB0b3RhbCkgKiBzaXplO1xuICAgICAgICBpZiAodG8gPCAwKSB7IHRvID0gdG90YWwgLSAodG8gKiAtMSkgJSB0b3RhbDsgfVxuICAgICAgICBpZiAoZnJvbSA8IDApIHsgZnJvbSA9IHRvdGFsIC0gKGZyb20gKiAtMSkgJSB0b3RhbDsgfVxuICAgICAgICBpZiAodG8gPCBmcm9tKSB7IFtmcm9tLCB0b10gPSBbdG8sIGZyb21dOyB9XG4gICAgICAgIHRvdGFsID0gIWlzRmluaXRlKHRvdGFsID0gKHRvIC0gZnJvbSkpIHx8IHRvdGFsIDwgMCA/IDAgOiB0b3RhbDtcbiAgICAgICAgY29uc3Qgc2xpY2VkRGF0YSA9IHRoaXMuZGF0YS5zbGljZShmcm9tLCBNYXRoLm1pbih0b3RhbCwgbGVuZ3RoKSk7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKHNsaWNlZERhdGEsIHRoaXMudmlldy5jbG9uZShzbGljZWREYXRhKSkgYXMgdGhpcztcbiAgICB9XG5cbiAgICBwdWJsaWMgYWNjZXB0VHlwZVZpc2l0b3IodmlzaXRvcjogVHlwZVZpc2l0b3IpOiBhbnkge1xuICAgICAgICByZXR1cm4gVHlwZVZpc2l0b3IudmlzaXRUeXBlSW5saW5lKHZpc2l0b3IsIHRoaXMudHlwZSk7XG4gICAgfVxuICAgIHB1YmxpYyBhY2NlcHRWZWN0b3JWaXNpdG9yKHZpc2l0b3I6IFZlY3RvclZpc2l0b3IpOiBhbnkge1xuICAgICAgICByZXR1cm4gVmVjdG9yVmlzaXRvci52aXNpdFR5cGVJbmxpbmUodmlzaXRvciwgdGhpcy50eXBlLCB0aGlzKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBGbGF0VmVjdG9yPFQgZXh0ZW5kcyBGbGF0VHlwZT4gZXh0ZW5kcyBWZWN0b3I8VD4ge1xuICAgIHB1YmxpYyBnZXQgdmFsdWVzKCkgeyByZXR1cm4gdGhpcy5kYXRhLnZhbHVlczsgfVxuICAgIHB1YmxpYyBsb3dzKCk6IEludFZlY3RvcjxJbnQzMj4geyByZXR1cm4gdGhpcy5hc0ludDMyKDAsIDIpOyB9XG4gICAgcHVibGljIGhpZ2hzKCk6IEludFZlY3RvcjxJbnQzMj4geyByZXR1cm4gdGhpcy5hc0ludDMyKDEsIDIpOyB9XG4gICAgcHVibGljIGFzSW50MzIob2Zmc2V0OiBudW1iZXIgPSAwLCBzdHJpZGU6IG51bWJlciA9IDIpOiBJbnRWZWN0b3I8SW50MzI+IHtcbiAgICAgICAgbGV0IGRhdGEgPSAodGhpcy5kYXRhIGFzIEZsYXREYXRhPGFueT4pLmNsb25lKG5ldyBJbnQzMigpKTtcbiAgICAgICAgaWYgKG9mZnNldCA+IDApIHtcbiAgICAgICAgICAgIGRhdGEgPSBkYXRhLnNsaWNlKG9mZnNldCwgdGhpcy5sZW5ndGggLSBvZmZzZXQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGludDMycyA9IG5ldyBJbnRWZWN0b3IoZGF0YSwgbmV3IFByaW1pdGl2ZVZpZXcoZGF0YSwgc3RyaWRlKSk7XG4gICAgICAgIGludDMycy5sZW5ndGggPSB0aGlzLmxlbmd0aCAvIHN0cmlkZSB8IDA7XG4gICAgICAgIHJldHVybiBpbnQzMnM7XG4gICAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTGlzdFZlY3RvckJhc2U8VCBleHRlbmRzIChMaXN0VHlwZSB8IEZsYXRMaXN0VHlwZSk+IGV4dGVuZHMgVmVjdG9yPFQ+IHtcbiAgICBwdWJsaWMgZ2V0IHZhbHVlcygpIHsgcmV0dXJuIHRoaXMuZGF0YS52YWx1ZXM7IH1cbiAgICBwdWJsaWMgZ2V0IHZhbHVlT2Zmc2V0cygpIHsgcmV0dXJuIHRoaXMuZGF0YS52YWx1ZU9mZnNldHM7IH1cbiAgICBwdWJsaWMgZ2V0VmFsdWVPZmZzZXQoaW5kZXg6IG51bWJlcikge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mZnNldHNbaW5kZXhdO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0VmFsdWVMZW5ndGgoaW5kZXg6IG51bWJlcikge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZU9mZnNldHNbaW5kZXggKyAxXSAtIHRoaXMudmFsdWVPZmZzZXRzW2luZGV4XTtcbiAgICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOZXN0ZWRWZWN0b3I8VCBleHRlbmRzIE5lc3RlZFR5cGU+IGV4dGVuZHMgVmVjdG9yPFQ+ICB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHB1YmxpYyByZWFkb25seSB2aWV3OiBOZXN0ZWRWaWV3PFQ+O1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwcm90ZWN0ZWQgX2NoaWxkRGF0YTogRGF0YTxhbnk+W107XG4gICAgcHVibGljIGdldENoaWxkQXQ8UiBleHRlbmRzIERhdGFUeXBlID0gRGF0YVR5cGU+KGluZGV4OiBudW1iZXIpOiBWZWN0b3I8Uj4gfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlldy5nZXRDaGlsZEF0PFI+KGluZGV4KTtcbiAgICB9XG4gICAgcHVibGljIGdldCBjaGlsZERhdGEoKTogRGF0YTxhbnk+W10ge1xuICAgICAgICBsZXQgZGF0YTogRGF0YTxUPiB8IERhdGE8YW55PltdO1xuICAgICAgICBpZiAoKGRhdGEgPSB0aGlzLl9jaGlsZERhdGEpKSB7XG4gICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGNhY2hlZCBjaGlsZERhdGEgcmVmZXJlbmNlIGZpcnN0XG4gICAgICAgICAgICByZXR1cm4gZGF0YSBhcyBEYXRhPGFueT5bXTtcbiAgICAgICAgfSBlbHNlIGlmICghKDxhbnk+IChkYXRhID0gdGhpcy5kYXRhKSBpbnN0YW5jZW9mIENodW5rZWREYXRhKSkge1xuICAgICAgICAgICAgLy8gSWYgZGF0YSBpc24ndCBjaHVua2VkLCBjYWNoZSBhbmQgcmV0dXJuIE5lc3RlZERhdGEncyBjaGlsZERhdGFcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jaGlsZERhdGEgPSAoZGF0YSBhcyBOZXN0ZWREYXRhPFQ+KS5jaGlsZERhdGE7XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXJ3aXNlIGlmIHRoZSBkYXRhIGlzIGNodW5rZWQsIGNvbmNhdGVuYXRlIHRoZSBjaGlsZFZlY3RvcnMgZnJvbSBlYWNoIGNodW5rXG4gICAgICAgIC8vIHRvIGNvbnN0cnVjdCBhIHNpbmdsZSBjaHVua2VkIFZlY3RvciBmb3IgZWFjaCBjb2x1bW4uIFRoZW4gcmV0dXJuIHRoZSBDaHVua2VkRGF0YVxuICAgICAgICAvLyBpbnN0YW5jZSBmcm9tIGVhY2ggdW5pZmllZCBjaHVua2VkIGNvbHVtbiBhcyB0aGUgY2hpbGREYXRhIG9mIGEgY2h1bmtlZCBOZXN0ZWRWZWN0b3JcbiAgICAgICAgY29uc3QgY2h1bmtzID0gKChkYXRhIGFzIENodW5rZWREYXRhPFQ+KS5jaHVua1ZlY3RvcnMgYXMgTmVzdGVkVmVjdG9yPFQ+W10pO1xuICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGREYXRhID0gY2h1bmtzXG4gICAgICAgICAgICAucmVkdWNlPChWZWN0b3I8VD4gfCBudWxsKVtdW10+KChjb2xzLCBjaHVuaykgPT4gY2h1bmsuY2hpbGREYXRhXG4gICAgICAgICAgICAucmVkdWNlPChWZWN0b3I8VD4gfCBudWxsKVtdW10+KChjb2xzLCBfLCBpKSA9PiAoXG4gICAgICAgICAgICAgICAgKGNvbHNbaV0gfHwgKGNvbHNbaV0gPSBbXSkpLnB1c2goY2h1bmsuZ2V0Q2hpbGRBdChpKSlcbiAgICAgICAgICAgICkgJiYgY29scyB8fCBjb2xzLCBjb2xzKSwgW10gYXMgVmVjdG9yPFQ+W11bXSlcbiAgICAgICAgLm1hcCgodmVjcykgPT4gVmVjdG9yLmNvbmNhdDxUPiguLi52ZWNzKS5kYXRhKTtcbiAgICB9XG59XG5cbmltcG9ydCB7IExpc3QsIEJpbmFyeSwgVXRmOCwgQm9vbCwgfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHsgTnVsbCwgSW50LCBGbG9hdCwgRGVjaW1hbCwgRGF0ZV8sIFRpbWUsIFRpbWVzdGFtcCwgSW50ZXJ2YWwgfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHsgVWludDgsIFVpbnQxNiwgVWludDMyLCBVaW50NjQsIEludDgsIEludDE2LCBJbnQzMiwgSW50NjQsIEZsb2F0MTYsIEZsb2F0MzIsIEZsb2F0NjQgfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHsgU3RydWN0LCBVbmlvbiwgU3BhcnNlVW5pb24sIERlbnNlVW5pb24sIEZpeGVkU2l6ZUJpbmFyeSwgRml4ZWRTaXplTGlzdCwgTWFwXywgRGljdGlvbmFyeSB9IGZyb20gJy4vdHlwZSc7XG5cbmltcG9ydCB7IENodW5rZWRWaWV3IH0gZnJvbSAnLi92ZWN0b3IvY2h1bmtlZCc7XG5pbXBvcnQgeyBEaWN0aW9uYXJ5VmlldyB9IGZyb20gJy4vdmVjdG9yL2RpY3Rpb25hcnknO1xuaW1wb3J0IHsgTGlzdFZpZXcsIEZpeGVkU2l6ZUxpc3RWaWV3LCBCaW5hcnlWaWV3LCBVdGY4VmlldyB9IGZyb20gJy4vdmVjdG9yL2xpc3QnO1xuaW1wb3J0IHsgVW5pb25WaWV3LCBEZW5zZVVuaW9uVmlldywgTmVzdGVkVmlldywgU3RydWN0VmlldywgTWFwVmlldyB9IGZyb20gJy4vdmVjdG9yL25lc3RlZCc7XG5pbXBvcnQgeyBGbGF0VmlldywgTnVsbFZpZXcsIEJvb2xWaWV3LCBWYWxpZGl0eVZpZXcsIFByaW1pdGl2ZVZpZXcsIEZpeGVkU2l6ZVZpZXcsIEZsb2F0MTZWaWV3IH0gZnJvbSAnLi92ZWN0b3IvZmxhdCc7XG5pbXBvcnQgeyBEYXRlRGF5VmlldywgRGF0ZU1pbGxpc2Vjb25kVmlldywgSW50ZXJ2YWxZZWFyTW9udGhWaWV3IH0gZnJvbSAnLi92ZWN0b3IvZmxhdCc7XG5pbXBvcnQgeyBUaW1lc3RhbXBEYXlWaWV3LCBUaW1lc3RhbXBTZWNvbmRWaWV3LCBUaW1lc3RhbXBNaWxsaXNlY29uZFZpZXcsIFRpbWVzdGFtcE1pY3Jvc2Vjb25kVmlldywgVGltZXN0YW1wTmFub3NlY29uZFZpZXcgfSBmcm9tICcuL3ZlY3Rvci9mbGF0JztcbmltcG9ydCB7IHBhY2tCb29scyB9IGZyb20gJy4vdXRpbC9iaXQnO1xuXG5leHBvcnQgY2xhc3MgTnVsbFZlY3RvciBleHRlbmRzIFZlY3RvcjxOdWxsPiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxOdWxsPiwgdmlldzogVmlldzxOdWxsPiA9IG5ldyBOdWxsVmlldyhkYXRhKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCb29sVmVjdG9yIGV4dGVuZHMgVmVjdG9yPEJvb2w+IHtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogSXRlcmFibGVBcnJheUxpa2U8Ym9vbGVhbj4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCb29sVmVjdG9yKG5ldyBCb29sRGF0YShuZXcgQm9vbCgpLCBkYXRhLmxlbmd0aCwgbnVsbCwgcGFja0Jvb2xzKGRhdGEpKSk7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgdmFsdWVzKCkgeyByZXR1cm4gdGhpcy5kYXRhLnZhbHVlczsgfVxuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8Qm9vbD4sIHZpZXc6IFZpZXc8Qm9vbD4gPSBuZXcgQm9vbFZpZXcoZGF0YSkpIHtcbiAgICAgICAgc3VwZXIoZGF0YSwgdmlldyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW50VmVjdG9yPFQgZXh0ZW5kcyBJbnQgPSBJbnQ8YW55Pj4gZXh0ZW5kcyBGbGF0VmVjdG9yPFQ+IHtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogSW50OEFycmF5KTogSW50VmVjdG9yPEludDg+O1xuICAgIHB1YmxpYyBzdGF0aWMgZnJvbShkYXRhOiBJbnQxNkFycmF5KTogSW50VmVjdG9yPEludDE2PjtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogSW50MzJBcnJheSk6IEludFZlY3RvcjxJbnQzMj47XG4gICAgcHVibGljIHN0YXRpYyBmcm9tKGRhdGE6IFVpbnQ4QXJyYXkpOiBJbnRWZWN0b3I8VWludDg+O1xuICAgIHB1YmxpYyBzdGF0aWMgZnJvbShkYXRhOiBVaW50MTZBcnJheSk6IEludFZlY3RvcjxVaW50MTY+O1xuICAgIHB1YmxpYyBzdGF0aWMgZnJvbShkYXRhOiBVaW50MzJBcnJheSk6IEludFZlY3RvcjxVaW50MzI+O1xuICAgIHB1YmxpYyBzdGF0aWMgZnJvbShkYXRhOiBJbnQzMkFycmF5LCBpczY0OiB0cnVlKTogSW50VmVjdG9yPEludDY0PjtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogVWludDMyQXJyYXksIGlzNjQ6IHRydWUpOiBJbnRWZWN0b3I8VWludDY0PjtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogYW55LCBpczY0PzogYm9vbGVhbikge1xuICAgICAgICBpZiAoaXM2NCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEgaW5zdGFuY2VvZiBJbnQzMkFycmF5XG4gICAgICAgICAgICAgICAgPyBuZXcgSW50VmVjdG9yKG5ldyBGbGF0RGF0YShuZXcgSW50NjQoKSwgZGF0YS5sZW5ndGgsIG51bGwsIGRhdGEpKVxuICAgICAgICAgICAgICAgIDogbmV3IEludFZlY3RvcihuZXcgRmxhdERhdGEobmV3IFVpbnQ2NCgpLCBkYXRhLmxlbmd0aCwgbnVsbCwgZGF0YSkpO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoZGF0YS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgY2FzZSBJbnQ4QXJyYXk6IHJldHVybiBuZXcgSW50VmVjdG9yKG5ldyBGbGF0RGF0YShuZXcgSW50OCgpLCBkYXRhLmxlbmd0aCwgbnVsbCwgZGF0YSkpO1xuICAgICAgICAgICAgY2FzZSBJbnQxNkFycmF5OiByZXR1cm4gbmV3IEludFZlY3RvcihuZXcgRmxhdERhdGEobmV3IEludDE2KCksIGRhdGEubGVuZ3RoLCBudWxsLCBkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIEludDMyQXJyYXk6IHJldHVybiBuZXcgSW50VmVjdG9yKG5ldyBGbGF0RGF0YShuZXcgSW50MzIoKSwgZGF0YS5sZW5ndGgsIG51bGwsIGRhdGEpKTtcbiAgICAgICAgICAgIGNhc2UgVWludDhBcnJheTogcmV0dXJuIG5ldyBJbnRWZWN0b3IobmV3IEZsYXREYXRhKG5ldyBVaW50OCgpLCBkYXRhLmxlbmd0aCwgbnVsbCwgZGF0YSkpO1xuICAgICAgICAgICAgY2FzZSBVaW50MTZBcnJheTogcmV0dXJuIG5ldyBJbnRWZWN0b3IobmV3IEZsYXREYXRhKG5ldyBVaW50MTYoKSwgZGF0YS5sZW5ndGgsIG51bGwsIGRhdGEpKTtcbiAgICAgICAgICAgIGNhc2UgVWludDMyQXJyYXk6IHJldHVybiBuZXcgSW50VmVjdG9yKG5ldyBGbGF0RGF0YShuZXcgVWludDMyKCksIGRhdGEubGVuZ3RoLCBudWxsLCBkYXRhKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5yZWNvZ25pemVkIEludCBkYXRhJyk7XG4gICAgfVxuICAgIHN0YXRpYyBkZWZhdWx0VmlldzxUIGV4dGVuZHMgSW50PihkYXRhOiBEYXRhPFQ+KSB7XG4gICAgICAgIHJldHVybiBkYXRhLnR5cGUuYml0V2lkdGggPD0gMzIgPyBuZXcgRmxhdFZpZXcoZGF0YSkgOiBuZXcgRml4ZWRTaXplVmlldyhkYXRhLCAoZGF0YS50eXBlLmJpdFdpZHRoIC8gMzIpIHwgMCk7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VD4sIHZpZXc6IFZpZXc8VD4gPSBJbnRWZWN0b3IuZGVmYXVsdFZpZXcoZGF0YSkpIHtcbiAgICAgICAgc3VwZXIoZGF0YSwgdmlldyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRmxvYXRWZWN0b3I8VCBleHRlbmRzIEZsb2F0ID0gRmxvYXQ8YW55Pj4gZXh0ZW5kcyBGbGF0VmVjdG9yPFQ+IHtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogVWludDE2QXJyYXkpOiBGbG9hdFZlY3RvcjxGbG9hdDE2PjtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20oZGF0YTogRmxvYXQzMkFycmF5KTogRmxvYXRWZWN0b3I8RmxvYXQzMj47XG4gICAgcHVibGljIHN0YXRpYyBmcm9tKGRhdGE6IEZsb2F0NjRBcnJheSk6IEZsb2F0VmVjdG9yPEZsb2F0NjQ+O1xuICAgIHB1YmxpYyBzdGF0aWMgZnJvbShkYXRhOiBhbnkpIHtcbiAgICAgICAgc3dpdGNoIChkYXRhLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICBjYXNlIFVpbnQxNkFycmF5OiByZXR1cm4gbmV3IEZsb2F0VmVjdG9yKG5ldyBGbGF0RGF0YShuZXcgRmxvYXQxNigpLCBkYXRhLmxlbmd0aCwgbnVsbCwgZGF0YSkpO1xuICAgICAgICAgICAgY2FzZSBGbG9hdDMyQXJyYXk6IHJldHVybiBuZXcgRmxvYXRWZWN0b3IobmV3IEZsYXREYXRhKG5ldyBGbG9hdDMyKCksIGRhdGEubGVuZ3RoLCBudWxsLCBkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIEZsb2F0NjRBcnJheTogcmV0dXJuIG5ldyBGbG9hdFZlY3RvcihuZXcgRmxhdERhdGEobmV3IEZsb2F0NjQoKSwgZGF0YS5sZW5ndGgsIG51bGwsIGRhdGEpKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbnJlY29nbml6ZWQgRmxvYXQgZGF0YScpO1xuICAgIH1cbiAgICBzdGF0aWMgZGVmYXVsdFZpZXc8VCBleHRlbmRzIEZsb2F0PihkYXRhOiBEYXRhPFQ+KTogRmxhdFZpZXc8YW55PiB7XG4gICAgICAgIHJldHVybiBkYXRhLnR5cGUucHJlY2lzaW9uICE9PSBQcmVjaXNpb24uSEFMRiA/IG5ldyBGbGF0VmlldyhkYXRhKSA6IG5ldyBGbG9hdDE2VmlldyhkYXRhIGFzIERhdGE8RmxvYXQxNj4pO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPFQ+LCB2aWV3OiBWaWV3PFQ+ID0gRmxvYXRWZWN0b3IuZGVmYXVsdFZpZXcoZGF0YSkpIHtcbiAgICAgICAgc3VwZXIoZGF0YSwgdmlldyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGF0ZVZlY3RvciBleHRlbmRzIEZsYXRWZWN0b3I8RGF0ZV8+IHtcbiAgICBzdGF0aWMgZGVmYXVsdFZpZXc8VCBleHRlbmRzIERhdGVfPihkYXRhOiBEYXRhPFQ+KSB7XG4gICAgICAgIHJldHVybiBkYXRhLnR5cGUudW5pdCA9PT0gRGF0ZVVuaXQuREFZID8gbmV3IERhdGVEYXlWaWV3KGRhdGEpIDogbmV3IERhdGVNaWxsaXNlY29uZFZpZXcoZGF0YSwgMik7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8RGF0ZV8+LCB2aWV3OiBWaWV3PERhdGVfPiA9IERhdGVWZWN0b3IuZGVmYXVsdFZpZXcoZGF0YSkpIHtcbiAgICAgICAgc3VwZXIoZGF0YSwgdmlldyk7XG4gICAgfVxuICAgIHB1YmxpYyBsb3dzKCk6IEludFZlY3RvcjxJbnQzMj4ge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnVuaXQgPT09IERhdGVVbml0LkRBWSA/IHRoaXMuYXNJbnQzMigwLCAxKSA6IHRoaXMuYXNJbnQzMigwLCAyKTtcbiAgICB9XG4gICAgcHVibGljIGhpZ2hzKCk6IEludFZlY3RvcjxJbnQzMj4ge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLnVuaXQgPT09IERhdGVVbml0LkRBWSA/IHRoaXMuYXNJbnQzMigwLCAxKSA6IHRoaXMuYXNJbnQzMigxLCAyKTtcbiAgICB9XG4gICAgcHVibGljIGFzRXBvY2hNaWxsaXNlY29uZHMoKTogSW50VmVjdG9yPEludDMyPiB7XG4gICAgICAgIGxldCBkYXRhID0gKHRoaXMuZGF0YSBhcyBGbGF0RGF0YTxhbnk+KS5jbG9uZShuZXcgSW50MzIoKSk7XG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlLnVuaXQpIHtcbiAgICAgICAgICAgIGNhc2UgRGF0ZVVuaXQuREFZOiByZXR1cm4gbmV3IEludFZlY3RvcihkYXRhLCBuZXcgVGltZXN0YW1wRGF5VmlldyhkYXRhIGFzIGFueSwgMSkgYXMgYW55KTtcbiAgICAgICAgICAgIGNhc2UgRGF0ZVVuaXQuTUlMTElTRUNPTkQ6IHJldHVybiBuZXcgSW50VmVjdG9yKGRhdGEsIG5ldyBUaW1lc3RhbXBNaWxsaXNlY29uZFZpZXcoZGF0YSBhcyBhbnksIDIpIGFzIGFueSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVW5yZWNvZ25pemVkIGRhdGUgdW5pdCBcIiR7RGF0ZVVuaXRbdGhpcy50eXBlLnVuaXRdfVwiYCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVjaW1hbFZlY3RvciBleHRlbmRzIEZsYXRWZWN0b3I8RGVjaW1hbD4ge1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8RGVjaW1hbD4sIHZpZXc6IFZpZXc8RGVjaW1hbD4gPSBuZXcgRml4ZWRTaXplVmlldyhkYXRhLCA0KSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUaW1lVmVjdG9yIGV4dGVuZHMgRmxhdFZlY3RvcjxUaW1lPiB7XG4gICAgc3RhdGljIGRlZmF1bHRWaWV3PFQgZXh0ZW5kcyBUaW1lPihkYXRhOiBEYXRhPFQ+KSB7XG4gICAgICAgIHJldHVybiBkYXRhLnR5cGUuYml0V2lkdGggPD0gMzIgPyBuZXcgRmxhdFZpZXcoZGF0YSkgOiBuZXcgRml4ZWRTaXplVmlldyhkYXRhLCAoZGF0YS50eXBlLmJpdFdpZHRoIC8gMzIpIHwgMCk7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VGltZT4sIHZpZXc6IFZpZXc8VGltZT4gPSBUaW1lVmVjdG9yLmRlZmF1bHRWaWV3KGRhdGEpKSB7XG4gICAgICAgIHN1cGVyKGRhdGEsIHZpZXcpO1xuICAgIH1cbiAgICBwdWJsaWMgbG93cygpOiBJbnRWZWN0b3I8SW50MzI+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZS5iaXRXaWR0aCA8PSAzMiA/IHRoaXMuYXNJbnQzMigwLCAxKSA6IHRoaXMuYXNJbnQzMigwLCAyKTtcbiAgICB9XG4gICAgcHVibGljIGhpZ2hzKCk6IEludFZlY3RvcjxJbnQzMj4ge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlLmJpdFdpZHRoIDw9IDMyID8gdGhpcy5hc0ludDMyKDAsIDEpIDogdGhpcy5hc0ludDMyKDEsIDIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRpbWVzdGFtcFZlY3RvciBleHRlbmRzIEZsYXRWZWN0b3I8VGltZXN0YW1wPiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxUaW1lc3RhbXA+LCB2aWV3OiBWaWV3PFRpbWVzdGFtcD4gPSBuZXcgRml4ZWRTaXplVmlldyhkYXRhLCAyKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG4gICAgcHVibGljIGFzRXBvY2hNaWxsaXNlY29uZHMoKTogSW50VmVjdG9yPEludDMyPiB7XG4gICAgICAgIGxldCBkYXRhID0gKHRoaXMuZGF0YSBhcyBGbGF0RGF0YTxhbnk+KS5jbG9uZShuZXcgSW50MzIoKSk7XG4gICAgICAgIHN3aXRjaCAodGhpcy50eXBlLnVuaXQpIHtcbiAgICAgICAgICAgIGNhc2UgVGltZVVuaXQuU0VDT05EOiByZXR1cm4gbmV3IEludFZlY3RvcihkYXRhLCBuZXcgVGltZXN0YW1wU2Vjb25kVmlldyhkYXRhIGFzIGFueSwgMSkgYXMgYW55KTtcbiAgICAgICAgICAgIGNhc2UgVGltZVVuaXQuTUlMTElTRUNPTkQ6IHJldHVybiBuZXcgSW50VmVjdG9yKGRhdGEsIG5ldyBUaW1lc3RhbXBNaWxsaXNlY29uZFZpZXcoZGF0YSBhcyBhbnksIDIpIGFzIGFueSk7XG4gICAgICAgICAgICBjYXNlIFRpbWVVbml0Lk1JQ1JPU0VDT05EOiByZXR1cm4gbmV3IEludFZlY3RvcihkYXRhLCBuZXcgVGltZXN0YW1wTWljcm9zZWNvbmRWaWV3KGRhdGEgYXMgYW55LCAyKSBhcyBhbnkpO1xuICAgICAgICAgICAgY2FzZSBUaW1lVW5pdC5OQU5PU0VDT05EOiByZXR1cm4gbmV3IEludFZlY3RvcihkYXRhLCBuZXcgVGltZXN0YW1wTmFub3NlY29uZFZpZXcoZGF0YSBhcyBhbnksIDIpIGFzIGFueSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVW5yZWNvZ25pemVkIHRpbWUgdW5pdCBcIiR7VGltZVVuaXRbdGhpcy50eXBlLnVuaXRdfVwiYCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW50ZXJ2YWxWZWN0b3IgZXh0ZW5kcyBGbGF0VmVjdG9yPEludGVydmFsPiB7XG4gICAgc3RhdGljIGRlZmF1bHRWaWV3PFQgZXh0ZW5kcyBJbnRlcnZhbD4oZGF0YTogRGF0YTxUPikge1xuICAgICAgICByZXR1cm4gZGF0YS50eXBlLnVuaXQgPT09IEludGVydmFsVW5pdC5ZRUFSX01PTlRIID8gbmV3IEludGVydmFsWWVhck1vbnRoVmlldyhkYXRhKSA6IG5ldyBGaXhlZFNpemVWaWV3KGRhdGEsIDIpO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPEludGVydmFsPiwgdmlldzogVmlldzxJbnRlcnZhbD4gPSBJbnRlcnZhbFZlY3Rvci5kZWZhdWx0VmlldyhkYXRhKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG4gICAgcHVibGljIGxvd3MoKTogSW50VmVjdG9yPEludDMyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGUudW5pdCA9PT0gSW50ZXJ2YWxVbml0LllFQVJfTU9OVEggPyB0aGlzLmFzSW50MzIoMCwgMSkgOiB0aGlzLmFzSW50MzIoMCwgMik7XG4gICAgfVxuICAgIHB1YmxpYyBoaWdocygpOiBJbnRWZWN0b3I8SW50MzI+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZS51bml0ID09PSBJbnRlcnZhbFVuaXQuWUVBUl9NT05USCA/IHRoaXMuYXNJbnQzMigwLCAxKSA6IHRoaXMuYXNJbnQzMigxLCAyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCaW5hcnlWZWN0b3IgZXh0ZW5kcyBMaXN0VmVjdG9yQmFzZTxCaW5hcnk+IHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPEJpbmFyeT4sIHZpZXc6IFZpZXc8QmluYXJ5PiA9IG5ldyBCaW5hcnlWaWV3KGRhdGEpKSB7XG4gICAgICAgIHN1cGVyKGRhdGEsIHZpZXcpO1xuICAgIH1cbiAgICBwdWJsaWMgYXNVdGY4KCkge1xuICAgICAgICByZXR1cm4gbmV3IFV0ZjhWZWN0b3IoKHRoaXMuZGF0YSBhcyBGbGF0TGlzdERhdGE8YW55PikuY2xvbmUobmV3IFV0ZjgoKSkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpeGVkU2l6ZUJpbmFyeVZlY3RvciBleHRlbmRzIEZsYXRWZWN0b3I8Rml4ZWRTaXplQmluYXJ5PiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxGaXhlZFNpemVCaW5hcnk+LCB2aWV3OiBWaWV3PEZpeGVkU2l6ZUJpbmFyeT4gPSBuZXcgRml4ZWRTaXplVmlldyhkYXRhLCBkYXRhLnR5cGUuYnl0ZVdpZHRoKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBVdGY4VmVjdG9yIGV4dGVuZHMgTGlzdFZlY3RvckJhc2U8VXRmOD4ge1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VXRmOD4sIHZpZXc6IFZpZXc8VXRmOD4gPSBuZXcgVXRmOFZpZXcoZGF0YSkpIHtcbiAgICAgICAgc3VwZXIoZGF0YSwgdmlldyk7XG4gICAgfVxuICAgIHB1YmxpYyBhc0JpbmFyeSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCaW5hcnlWZWN0b3IoKHRoaXMuZGF0YSBhcyBGbGF0TGlzdERhdGE8YW55PikuY2xvbmUobmV3IEJpbmFyeSgpKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTGlzdFZlY3RvcjxUIGV4dGVuZHMgRGF0YVR5cGUgPSBEYXRhVHlwZT4gZXh0ZW5kcyBMaXN0VmVjdG9yQmFzZTxMaXN0PFQ+PiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxMaXN0PFQ+PiwgdmlldzogVmlldzxMaXN0PFQ+PiA9IG5ldyBMaXN0VmlldyhkYXRhKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGaXhlZFNpemVMaXN0VmVjdG9yIGV4dGVuZHMgVmVjdG9yPEZpeGVkU2l6ZUxpc3Q+IHtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPEZpeGVkU2l6ZUxpc3Q+LCB2aWV3OiBWaWV3PEZpeGVkU2l6ZUxpc3Q+ID0gbmV3IEZpeGVkU2l6ZUxpc3RWaWV3KGRhdGEpKSB7XG4gICAgICAgIHN1cGVyKGRhdGEsIHZpZXcpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1hcFZlY3RvciBleHRlbmRzIE5lc3RlZFZlY3RvcjxNYXBfPiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxNYXBfPiwgdmlldzogVmlldzxNYXBfPiA9IG5ldyBNYXBWaWV3KGRhdGEpKSB7XG4gICAgICAgIHN1cGVyKGRhdGEsIHZpZXcpO1xuICAgIH1cbiAgICBwdWJsaWMgYXNTdHJ1Y3QoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3RydWN0VmVjdG9yKCh0aGlzLmRhdGEgYXMgTmVzdGVkRGF0YTxhbnk+KS5jbG9uZShuZXcgU3RydWN0KHRoaXMudHlwZS5jaGlsZHJlbikpKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJ1Y3RWZWN0b3IgZXh0ZW5kcyBOZXN0ZWRWZWN0b3I8U3RydWN0PiB7XG4gICAgY29uc3RydWN0b3IoZGF0YTogRGF0YTxTdHJ1Y3Q+LCB2aWV3OiBWaWV3PFN0cnVjdD4gPSBuZXcgU3RydWN0VmlldyhkYXRhKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG4gICAgcHVibGljIGFzTWFwKGtleXNTb3J0ZWQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gbmV3IE1hcFZlY3RvcigodGhpcy5kYXRhIGFzIE5lc3RlZERhdGE8YW55PikuY2xvbmUobmV3IE1hcF8oa2V5c1NvcnRlZCwgdGhpcy50eXBlLmNoaWxkcmVuKSkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFVuaW9uVmVjdG9yPFQgZXh0ZW5kcyAoU3BhcnNlVW5pb24gfCBEZW5zZVVuaW9uKSA9IGFueT4gZXh0ZW5kcyBOZXN0ZWRWZWN0b3I8VD4ge1xuICAgIGNvbnN0cnVjdG9yKGRhdGE6IERhdGE8VD4sIHZpZXc6IFZpZXc8VD4gPSA8YW55PiAoZGF0YS50eXBlLm1vZGUgPT09IFVuaW9uTW9kZS5TcGFyc2UgPyBuZXcgVW5pb25WaWV3PFNwYXJzZVVuaW9uPihkYXRhIGFzIERhdGE8U3BhcnNlVW5pb24+KSA6IG5ldyBEZW5zZVVuaW9uVmlldyhkYXRhIGFzIERhdGE8RGVuc2VVbmlvbj4pKSkge1xuICAgICAgICBzdXBlcihkYXRhLCB2aWV3KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEaWN0aW9uYXJ5VmVjdG9yPFQgZXh0ZW5kcyBEYXRhVHlwZSA9IERhdGFUeXBlPiBleHRlbmRzIFZlY3RvcjxEaWN0aW9uYXJ5PFQ+PiB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHB1YmxpYyByZWFkb25seSBpbmRpY2VzOiBWZWN0b3I8SW50PjtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHVibGljIHJlYWRvbmx5IGRpY3Rpb25hcnk6IFZlY3RvcjxUPjtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBEYXRhPERpY3Rpb25hcnk8VD4+LCB2aWV3OiBWaWV3PERpY3Rpb25hcnk8VD4+ID0gbmV3IERpY3Rpb25hcnlWaWV3PFQ+KGRhdGEuZGljdGlvbmFyeSwgbmV3IEludFZlY3RvcihkYXRhLmluZGljZXMpKSkge1xuICAgICAgICBzdXBlcihkYXRhIGFzIERhdGE8YW55Piwgdmlldyk7XG4gICAgICAgIGlmICh2aWV3IGluc3RhbmNlb2YgVmFsaWRpdHlWaWV3KSB7XG4gICAgICAgICAgICB2aWV3ID0gKHZpZXcgYXMgYW55KS52aWV3O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgRGljdGlvbmFyeURhdGEgJiYgdmlldyBpbnN0YW5jZW9mIERpY3Rpb25hcnlWaWV3KSB7XG4gICAgICAgICAgICB0aGlzLmluZGljZXMgPSB2aWV3LmluZGljZXM7XG4gICAgICAgICAgICB0aGlzLmRpY3Rpb25hcnkgPSBkYXRhLmRpY3Rpb25hcnk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIENodW5rZWREYXRhICYmIHZpZXcgaW5zdGFuY2VvZiBDaHVua2VkVmlldykge1xuICAgICAgICAgICAgY29uc3QgY2h1bmtzID0gdmlldy5jaHVua1ZlY3RvcnMgYXMgRGljdGlvbmFyeVZlY3RvcjxUPltdO1xuICAgICAgICAgICAgLy8gQXNzdW1lIHRoZSBsYXN0IGNodW5rJ3MgZGljdGlvbmFyeSBkYXRhIGlzIHRoZSBtb3N0IHVwLXRvLWRhdGUsXG4gICAgICAgICAgICAvLyBpbmNsdWRpbmcgZGF0YSBmcm9tIERpY3Rpb25hcnlCYXRjaGVzIHRoYXQgd2VyZSBtYXJrZWQgYXMgZGVsdGFzXG4gICAgICAgICAgICB0aGlzLmRpY3Rpb25hcnkgPSBjaHVua3NbY2h1bmtzLmxlbmd0aCAtIDFdLmRpY3Rpb25hcnk7XG4gICAgICAgICAgICB0aGlzLmluZGljZXMgPSBjaHVua3MucmVkdWNlPFZlY3RvcjxJbnQ+IHwgbnVsbD4oXG4gICAgICAgICAgICAgICAgKGlkeHM6IFZlY3RvcjxJbnQ+IHwgbnVsbCwgZGljdDogRGljdGlvbmFyeVZlY3RvcjxUPikgPT5cbiAgICAgICAgICAgICAgICAgICAgIWlkeHMgPyBkaWN0LmluZGljZXMhIDogaWR4cy5jb25jYXQoZGljdC5pbmRpY2VzISksXG4gICAgICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICAgKSE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBVbnJlY29nbml6ZWQgRGljdGlvbmFyeVZlY3RvciB2aWV3YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHVibGljIGdldEtleShpbmRleDogbnVtYmVyKSB7IHJldHVybiB0aGlzLmluZGljZXMuZ2V0KGluZGV4KTsgfVxuICAgIHB1YmxpYyBnZXRWYWx1ZShrZXk6IG51bWJlcikgeyByZXR1cm4gdGhpcy5kaWN0aW9uYXJ5LmdldChrZXkpOyB9XG4gICAgcHVibGljIHJldmVyc2VMb29rdXAodmFsdWU6IFQpIHsgcmV0dXJuIHRoaXMuZGljdGlvbmFyeS5pbmRleE9mKHZhbHVlKTsgfVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVmVjdG9yID0gKChWZWN0b3JMb2FkZXI6IG5ldyA8VCBleHRlbmRzIERhdGFUeXBlPihkYXRhOiBEYXRhPFQ+KSA9PiBUeXBlVmlzaXRvcikgPT4gKFxuICAgIDxUIGV4dGVuZHMgRGF0YVR5cGU+KGRhdGE6IERhdGE8VD4pID0+IFR5cGVWaXNpdG9yLnZpc2l0VHlwZUlubGluZShuZXcgVmVjdG9yTG9hZGVyKGRhdGEpLCBkYXRhLnR5cGUpIGFzIFZlY3RvcjxUPlxuKSkoY2xhc3MgVmVjdG9yTG9hZGVyPFQgZXh0ZW5kcyBEYXRhVHlwZT4gZXh0ZW5kcyBUeXBlVmlzaXRvciB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBkYXRhOiBEYXRhPFQ+KSB7IHN1cGVyKCk7IH1cbiAgICB2aXNpdE51bGwgICAgICAgICAgIChfdHlwZTogTnVsbCkgICAgICAgICAgICB7IHJldHVybiBuZXcgTnVsbFZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgICAgIH1cbiAgICB2aXNpdEludCAgICAgICAgICAgIChfdHlwZTogSW50KSAgICAgICAgICAgICB7IHJldHVybiBuZXcgSW50VmVjdG9yKHRoaXMuZGF0YSk7ICAgICAgICAgICAgIH1cbiAgICB2aXNpdEZsb2F0ICAgICAgICAgIChfdHlwZTogRmxvYXQpICAgICAgICAgICB7IHJldHVybiBuZXcgRmxvYXRWZWN0b3IodGhpcy5kYXRhKTsgICAgICAgICAgIH1cbiAgICB2aXNpdEJpbmFyeSAgICAgICAgIChfdHlwZTogQmluYXJ5KSAgICAgICAgICB7IHJldHVybiBuZXcgQmluYXJ5VmVjdG9yKHRoaXMuZGF0YSk7ICAgICAgICAgIH1cbiAgICB2aXNpdFV0ZjggICAgICAgICAgIChfdHlwZTogVXRmOCkgICAgICAgICAgICB7IHJldHVybiBuZXcgVXRmOFZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgICAgIH1cbiAgICB2aXNpdEJvb2wgICAgICAgICAgIChfdHlwZTogQm9vbCkgICAgICAgICAgICB7IHJldHVybiBuZXcgQm9vbFZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgICAgIH1cbiAgICB2aXNpdERlY2ltYWwgICAgICAgIChfdHlwZTogRGVjaW1hbCkgICAgICAgICB7IHJldHVybiBuZXcgRGVjaW1hbFZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgIH1cbiAgICB2aXNpdERhdGUgICAgICAgICAgIChfdHlwZTogRGF0ZV8pICAgICAgICAgICB7IHJldHVybiBuZXcgRGF0ZVZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgICAgIH1cbiAgICB2aXNpdFRpbWUgICAgICAgICAgIChfdHlwZTogVGltZSkgICAgICAgICAgICB7IHJldHVybiBuZXcgVGltZVZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgICAgIH1cbiAgICB2aXNpdFRpbWVzdGFtcCAgICAgIChfdHlwZTogVGltZXN0YW1wKSAgICAgICB7IHJldHVybiBuZXcgVGltZXN0YW1wVmVjdG9yKHRoaXMuZGF0YSk7ICAgICAgIH1cbiAgICB2aXNpdEludGVydmFsICAgICAgIChfdHlwZTogSW50ZXJ2YWwpICAgICAgICB7IHJldHVybiBuZXcgSW50ZXJ2YWxWZWN0b3IodGhpcy5kYXRhKTsgICAgICAgIH1cbiAgICB2aXNpdExpc3QgICAgICAgICAgIChfdHlwZTogTGlzdCkgICAgICAgICAgICB7IHJldHVybiBuZXcgTGlzdFZlY3Rvcih0aGlzLmRhdGEpOyAgICAgICAgICAgIH1cbiAgICB2aXNpdFN0cnVjdCAgICAgICAgIChfdHlwZTogU3RydWN0KSAgICAgICAgICB7IHJldHVybiBuZXcgU3RydWN0VmVjdG9yKHRoaXMuZGF0YSk7ICAgICAgICAgIH1cbiAgICB2aXNpdFVuaW9uICAgICAgICAgIChfdHlwZTogVW5pb24pICAgICAgICAgICB7IHJldHVybiBuZXcgVW5pb25WZWN0b3IodGhpcy5kYXRhKTsgICAgICAgICAgIH1cbiAgICB2aXNpdEZpeGVkU2l6ZUJpbmFyeShfdHlwZTogRml4ZWRTaXplQmluYXJ5KSB7IHJldHVybiBuZXcgRml4ZWRTaXplQmluYXJ5VmVjdG9yKHRoaXMuZGF0YSk7IH1cbiAgICB2aXNpdEZpeGVkU2l6ZUxpc3QgIChfdHlwZTogRml4ZWRTaXplTGlzdCkgICB7IHJldHVybiBuZXcgRml4ZWRTaXplTGlzdFZlY3Rvcih0aGlzLmRhdGEpOyAgIH1cbiAgICB2aXNpdE1hcCAgICAgICAgICAgIChfdHlwZTogTWFwXykgICAgICAgICAgICB7IHJldHVybiBuZXcgTWFwVmVjdG9yKHRoaXMuZGF0YSk7ICAgICAgICAgICAgIH1cbiAgICB2aXNpdERpY3Rpb25hcnkgICAgIChfdHlwZTogRGljdGlvbmFyeSkgICAgICB7IHJldHVybiBuZXcgRGljdGlvbmFyeVZlY3Rvcih0aGlzLmRhdGEpOyAgICAgIH1cbn0pO1xuIl19
