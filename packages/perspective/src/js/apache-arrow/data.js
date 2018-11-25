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
import { popcnt_bit_range } from './util/bit';
import { VectorType } from './type';
export function toTypedArray(ArrayType, values) {
    if (!ArrayType && ArrayBuffer.isView(values)) {
        return values;
    }
    return values instanceof ArrayType ? values
        : !values || !ArrayBuffer.isView(values) ? ArrayType.from(values || [])
            : new ArrayType(values.buffer, values.byteOffset, values.byteLength / ArrayType.BYTES_PER_ELEMENT);
}
export var kUnknownNullCount = -1;
var BaseData = /** @class */ (function () {
    function BaseData(type, length, offset, nullCount) {
        this.type = type;
        this.length = Math.floor(Math.max(length || 0, 0));
        this.offset = Math.floor(Math.max(offset || 0, 0));
        this._nullCount = Math.floor(Math.max(nullCount || 0, -1));
    }
    Object.defineProperty(BaseData.prototype, "typeId", {
        get: function () { return this.type.TType; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseData.prototype, "nullBitmap", {
        get: function () { return this[VectorType.VALIDITY]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BaseData.prototype, "nullCount", {
        get: function () {
            var nullCount = this._nullCount;
            var nullBitmap;
            if (nullCount === -1 && (nullBitmap = this[VectorType.VALIDITY])) {
                this._nullCount = nullCount = this.length - popcnt_bit_range(nullBitmap, this.offset, this.offset + this.length);
            }
            return nullCount;
        },
        enumerable: true,
        configurable: true
    });
    BaseData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new BaseData(type, length, offset, nullCount);
    };
    BaseData.prototype.slice = function (offset, length) {
        return length <= 0 ? this : this.sliceInternal(this.clone(this.type, length, this.offset + offset, +(this._nullCount === 0) - 1), offset, length);
    };
    BaseData.prototype.sliceInternal = function (clone, offset, length) {
        var arr;
        // If typeIds exist, slice the typeIds buffer
        (arr = this[VectorType.TYPE]) && (clone[VectorType.TYPE] = this.sliceData(arr, offset, length));
        // If offsets exist, only slice the offsets buffer
        (arr = this[VectorType.OFFSET]) && (clone[VectorType.OFFSET] = this.sliceOffsets(arr, offset, length)) ||
            // Otherwise if no offsets, slice the data buffer
            (arr = this[VectorType.DATA]) && (clone[VectorType.DATA] = this.sliceData(arr, offset, length));
        return clone;
    };
    BaseData.prototype.sliceData = function (data, offset, length) {
        return data.subarray(offset, offset + length);
    };
    BaseData.prototype.sliceOffsets = function (valueOffsets, offset, length) {
        return valueOffsets.subarray(offset, offset + length + 1);
    };
    return BaseData;
}());
export { BaseData };
var FlatData = /** @class */ (function (_super) {
    tslib_1.__extends(FlatData, _super);
    function FlatData(type, length, nullBitmap, data, offset, nullCount) {
        var _this = _super.call(this, type, length, offset, nullCount) || this;
        _this[VectorType.DATA] = toTypedArray(_this.ArrayType, data);
        _this[VectorType.VALIDITY] = toTypedArray(Uint8Array, nullBitmap);
        return _this;
    }
    Object.defineProperty(FlatData.prototype, "values", {
        get: function () { return this[VectorType.DATA]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FlatData.prototype, "ArrayType", {
        get: function () { return this.type.ArrayType; },
        enumerable: true,
        configurable: true
    });
    FlatData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new this.constructor(type, length, this[VectorType.VALIDITY], this[VectorType.DATA], offset, nullCount);
    };
    return FlatData;
}(BaseData));
export { FlatData };
var BoolData = /** @class */ (function (_super) {
    tslib_1.__extends(BoolData, _super);
    function BoolData() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BoolData.prototype.sliceData = function (data) { return data; };
    return BoolData;
}(FlatData));
export { BoolData };
var FlatListData = /** @class */ (function (_super) {
    tslib_1.__extends(FlatListData, _super);
    function FlatListData(type, length, nullBitmap, valueOffsets, data, offset, nullCount) {
        var _this = _super.call(this, type, length, nullBitmap, data, offset, nullCount) || this;
        _this[VectorType.OFFSET] = toTypedArray(Int32Array, valueOffsets);
        return _this;
    }
    Object.defineProperty(FlatListData.prototype, "values", {
        get: function () { return this[VectorType.DATA]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FlatListData.prototype, "valueOffsets", {
        get: function () { return this[VectorType.OFFSET]; },
        enumerable: true,
        configurable: true
    });
    FlatListData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new FlatListData(type, length, this[VectorType.VALIDITY], this[VectorType.OFFSET], this[VectorType.DATA], offset, nullCount);
    };
    return FlatListData;
}(FlatData));
export { FlatListData };
var DictionaryData = /** @class */ (function (_super) {
    tslib_1.__extends(DictionaryData, _super);
    function DictionaryData(type, dictionary, indices) {
        var _this = _super.call(this, type, indices.length, indices.offset, indices._nullCount) || this;
        _this._indices = indices;
        _this._dictionary = dictionary;
        return _this;
    }
    Object.defineProperty(DictionaryData.prototype, "indices", {
        get: function () { return this._indices; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DictionaryData.prototype, "dictionary", {
        get: function () { return this._dictionary; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DictionaryData.prototype, "nullCount", {
        get: function () { return this._indices.nullCount; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DictionaryData.prototype, "nullBitmap", {
        get: function () { return this._indices.nullBitmap; },
        enumerable: true,
        configurable: true
    });
    DictionaryData.prototype.clone = function (type, length, offset) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        var data = this._dictionary.data.clone(type.dictionary);
        return new DictionaryData(this.type, this._dictionary.clone(data), this._indices.slice(offset - this.offset, length));
    };
    DictionaryData.prototype.sliceInternal = function (clone, _offset, _length) {
        clone.length = clone._indices.length;
        clone._nullCount = clone._indices._nullCount;
        return clone;
    };
    return DictionaryData;
}(BaseData));
export { DictionaryData };
var NestedData = /** @class */ (function (_super) {
    tslib_1.__extends(NestedData, _super);
    function NestedData(type, length, nullBitmap, childData, offset, nullCount) {
        var _this = _super.call(this, type, length, offset, nullCount) || this;
        _this.childData = childData;
        _this[VectorType.VALIDITY] = toTypedArray(Uint8Array, nullBitmap);
        return _this;
    }
    NestedData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new NestedData(type, length, this[VectorType.VALIDITY], this.childData, offset, nullCount);
    };
    NestedData.prototype.sliceInternal = function (clone, offset, length) {
        if (!this[VectorType.OFFSET]) {
            clone.childData = this.childData.map(function (child) { return child.slice(offset, length); });
        }
        return _super.prototype.sliceInternal.call(this, clone, offset, length);
    };
    return NestedData;
}(BaseData));
export { NestedData };
var SingleNestedData = /** @class */ (function (_super) {
    tslib_1.__extends(SingleNestedData, _super);
    function SingleNestedData(type, length, nullBitmap, valueChildData, offset, nullCount) {
        var _this = _super.call(this, type, length, nullBitmap, [valueChildData], offset, nullCount) || this;
        _this._valuesData = valueChildData;
        return _this;
    }
    Object.defineProperty(SingleNestedData.prototype, "values", {
        get: function () { return this._valuesData; },
        enumerable: true,
        configurable: true
    });
    return SingleNestedData;
}(NestedData));
export { SingleNestedData };
var ListData = /** @class */ (function (_super) {
    tslib_1.__extends(ListData, _super);
    function ListData(type, length, nullBitmap, valueOffsets, valueChildData, offset, nullCount) {
        var _this = _super.call(this, type, length, nullBitmap, valueChildData, offset, nullCount) || this;
        _this[VectorType.OFFSET] = toTypedArray(Int32Array, valueOffsets);
        return _this;
    }
    Object.defineProperty(ListData.prototype, "valueOffsets", {
        get: function () { return this[VectorType.OFFSET]; },
        enumerable: true,
        configurable: true
    });
    ListData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new ListData(type, length, this[VectorType.VALIDITY], this[VectorType.OFFSET], this._valuesData, offset, nullCount);
    };
    return ListData;
}(SingleNestedData));
export { ListData };
var UnionData = /** @class */ (function (_super) {
    tslib_1.__extends(UnionData, _super);
    function UnionData(type, length, nullBitmap, typeIds, childData, offset, nullCount) {
        var _this = _super.call(this, type, length, nullBitmap, childData, offset, nullCount) || this;
        _this[VectorType.TYPE] = toTypedArray(Int8Array, typeIds);
        return _this;
    }
    Object.defineProperty(UnionData.prototype, "typeIds", {
        get: function () { return this[VectorType.TYPE]; },
        enumerable: true,
        configurable: true
    });
    UnionData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new UnionData(type, length, this[VectorType.VALIDITY], this[VectorType.TYPE], this.childData, offset, nullCount);
    };
    return UnionData;
}(NestedData));
export { UnionData };
var SparseUnionData = /** @class */ (function (_super) {
    tslib_1.__extends(SparseUnionData, _super);
    function SparseUnionData(type, length, nullBitmap, typeIds, childData, offset, nullCount) {
        return _super.call(this, type, length, nullBitmap, typeIds, childData, offset, nullCount) || this;
    }
    SparseUnionData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new SparseUnionData(type, length, this[VectorType.VALIDITY], this[VectorType.TYPE], this.childData, offset, nullCount);
    };
    return SparseUnionData;
}(UnionData));
export { SparseUnionData };
var DenseUnionData = /** @class */ (function (_super) {
    tslib_1.__extends(DenseUnionData, _super);
    function DenseUnionData(type, length, nullBitmap, typeIds, valueOffsets, childData, offset, nullCount) {
        var _this = _super.call(this, type, length, nullBitmap, typeIds, childData, offset, nullCount) || this;
        _this[VectorType.OFFSET] = toTypedArray(Int32Array, valueOffsets);
        return _this;
    }
    Object.defineProperty(DenseUnionData.prototype, "valueOffsets", {
        get: function () { return this[VectorType.OFFSET]; },
        enumerable: true,
        configurable: true
    });
    DenseUnionData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new DenseUnionData(type, length, this[VectorType.VALIDITY], this[VectorType.TYPE], this[VectorType.OFFSET], this.childData, offset, nullCount);
    };
    return DenseUnionData;
}(UnionData));
export { DenseUnionData };
var ChunkedData = /** @class */ (function (_super) {
    tslib_1.__extends(ChunkedData, _super);
    function ChunkedData(type, length, chunkVectors, offset, nullCount, chunkOffsets) {
        var _this = _super.call(this, type, length, offset, nullCount) || this;
        _this._chunkVectors = chunkVectors;
        _this._chunkOffsets = chunkOffsets || ChunkedData.computeOffsets(chunkVectors);
        return _this;
    }
    Object.defineProperty(ChunkedData.prototype, "chunkVectors", {
        get: function () { return this._chunkVectors; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChunkedData.prototype, "chunkOffsets", {
        get: function () { return this._chunkOffsets; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChunkedData.prototype, "chunkData", {
        get: function () {
            return this._chunkData || (this._chunkData = this._chunkVectors.map(function (_a) {
                var data = _a.data;
                return data;
            }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChunkedData.prototype, "nullCount", {
        get: function () {
            var nullCount = this._nullCount;
            if (nullCount === -1) {
                this._nullCount = nullCount = this._chunkVectors.reduce(function (x, c) { return x + c.nullCount; }, 0);
            }
            return nullCount;
        },
        enumerable: true,
        configurable: true
    });
    ChunkedData.prototype.clone = function (type, length, offset, nullCount) {
        if (length === void 0) { length = this.length; }
        if (offset === void 0) { offset = this.offset; }
        if (nullCount === void 0) { nullCount = this._nullCount; }
        return new ChunkedData(type, length, this._chunkVectors.map(function (vec) { return vec.clone(vec.data.clone(type)); }), offset, nullCount, this._chunkOffsets);
    };
    ChunkedData.prototype.sliceInternal = function (clone, offset, length) {
        var chunks = this._chunkVectors;
        var offsets = this._chunkOffsets;
        var chunkSlices = [];
        for (var childIndex = -1, numChildren = chunks.length; ++childIndex < numChildren;) {
            var child = chunks[childIndex];
            var childLength = child.length;
            var childOffset = offsets[childIndex];
            // If the child is to the right of the slice boundary, exclude
            if (childOffset >= offset + length) {
                continue;
            }
            // If the child is to the left of of the slice boundary, exclude
            if (offset >= childOffset + childLength) {
                continue;
            }
            // If the child is between both left and right boundaries, include w/o slicing
            if (childOffset >= offset && (childOffset + childLength) <= offset + length) {
                chunkSlices.push(child);
                continue;
            }
            // If the child overlaps one of the slice boundaries, include that slice
            var begin = Math.max(0, offset - childOffset);
            var end = begin + Math.min(childLength - begin, (offset + length) - childOffset);
            chunkSlices.push(child.slice(begin, end));
        }
        clone._chunkVectors = chunkSlices;
        clone._chunkOffsets = ChunkedData.computeOffsets(chunkSlices);
        return clone;
    };
    ChunkedData.computeOffsets = function (childVectors) {
        var childOffsets = new Uint32Array(childVectors.length + 1);
        for (var index = 0, length_1 = childOffsets.length, childOffset = childOffsets[0] = 0; ++index < length_1;) {
            childOffsets[index] = (childOffset += childVectors[index - 1].length);
        }
        return childOffsets;
    };
    return ChunkedData;
}(BaseData));
export { ChunkedData };

//# sourceMappingURL=data:application/json;charset=utf8;base64,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V0FBVyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDeEIsQ0FBQztJQUNMLGtCQUFDO0FBQUQsQ0EvREEsQUErREMsQ0EvRG9ELFFBQVEsR0ErRDVEIiwiZmlsZSI6ImRhdGEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4vLyBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbi8vIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4vLyByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4vLyB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4vLyBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Vcbi8vIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbi8vIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4vLyBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuLy8gS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4vLyBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4vLyB1bmRlciB0aGUgTGljZW5zZS5cblxuaW1wb3J0IHsgcG9wY250X2JpdF9yYW5nZSB9IGZyb20gJy4vdXRpbC9iaXQnO1xuaW1wb3J0IHsgVmVjdG9yTGlrZSwgVmVjdG9yIH0gZnJvbSAnLi92ZWN0b3InO1xuaW1wb3J0IHsgVmVjdG9yVHlwZSwgVHlwZWRBcnJheSwgVHlwZWRBcnJheUNvbnN0cnVjdG9yLCBEaWN0aW9uYXJ5IH0gZnJvbSAnLi90eXBlJztcbmltcG9ydCB7IEludCwgQm9vbCwgRmxhdExpc3RUeXBlLCBMaXN0LCBGaXhlZFNpemVMaXN0LCBTdHJ1Y3QsIE1hcF8gfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHsgRGF0YVR5cGUsIEZsYXRUeXBlLCBMaXN0VHlwZSwgTmVzdGVkVHlwZSwgU2luZ2xlTmVzdGVkVHlwZSwgRGVuc2VVbmlvbiwgU3BhcnNlVW5pb24gfSBmcm9tICcuL3R5cGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9UeXBlZEFycmF5PFQgZXh0ZW5kcyBUeXBlZEFycmF5PihBcnJheVR5cGU6IFR5cGVkQXJyYXlDb25zdHJ1Y3RvcjxUPiwgdmFsdWVzPzogVCB8IEFycmF5TGlrZTxudW1iZXI+IHwgSXRlcmFibGU8bnVtYmVyPiB8IG51bGwpOiBUIHtcbiAgICBpZiAoIUFycmF5VHlwZSAmJiBBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWVzKSkgeyByZXR1cm4gdmFsdWVzOyB9XG4gICAgcmV0dXJuIHZhbHVlcyBpbnN0YW5jZW9mIEFycmF5VHlwZSA/IHZhbHVlc1xuICAgICAgICAgOiAhdmFsdWVzIHx8ICFBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWVzKSA/IEFycmF5VHlwZS5mcm9tKHZhbHVlcyB8fCBbXSlcbiAgICAgICAgIDogbmV3IEFycmF5VHlwZSh2YWx1ZXMuYnVmZmVyLCB2YWx1ZXMuYnl0ZU9mZnNldCwgdmFsdWVzLmJ5dGVMZW5ndGggLyBBcnJheVR5cGUuQllURVNfUEVSX0VMRU1FTlQpO1xufVxuXG5leHBvcnQgdHlwZSBEYXRhPFQgZXh0ZW5kcyBEYXRhVHlwZT4gPSBEYXRhVHlwZXM8VD5bVFsnVFR5cGUnXV0gJiBCYXNlRGF0YTxUPjtcbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVR5cGVzPFQgZXh0ZW5kcyBEYXRhVHlwZT4ge1xuLyogICAgICAgICAgICAgICAgW1R5cGUuTk9ORV0qLyAgMDogQmFzZURhdGE8VD47XG4vKiAgICAgICAgICAgICAgICBbVHlwZS5OdWxsXSovICAxOiBGbGF0RGF0YTxUPjtcbi8qICAgICAgICAgICAgICAgICBbVHlwZS5JbnRdKi8gIDI6IEZsYXREYXRhPFQ+O1xuLyogICAgICAgICAgICAgICBbVHlwZS5GbG9hdF0qLyAgMzogRmxhdERhdGE8VD47XG4vKiAgICAgICAgICAgICAgW1R5cGUuQmluYXJ5XSovICA0OiBGbGF0TGlzdERhdGE8VD47XG4vKiAgICAgICAgICAgICAgICBbVHlwZS5VdGY4XSovICA1OiBGbGF0TGlzdERhdGE8VD47XG4vKiAgICAgICAgICAgICAgICBbVHlwZS5Cb29sXSovICA2OiBCb29sRGF0YTtcbi8qICAgICAgICAgICAgIFtUeXBlLkRlY2ltYWxdKi8gIDc6IEZsYXREYXRhPFQ+O1xuLyogICAgICAgICAgICAgICAgW1R5cGUuRGF0ZV0qLyAgODogRmxhdERhdGE8VD47XG4vKiAgICAgICAgICAgICAgICBbVHlwZS5UaW1lXSovICA5OiBGbGF0RGF0YTxUPjtcbi8qICAgICAgICAgICBbVHlwZS5UaW1lc3RhbXBdKi8gMTA6IEZsYXREYXRhPFQ+O1xuLyogICAgICAgICAgICBbVHlwZS5JbnRlcnZhbF0qLyAxMTogRmxhdERhdGE8VD47XG4vKiAgICAgICAgICAgICAgICBbVHlwZS5MaXN0XSovIDEyOiBMaXN0RGF0YTxMaXN0PFQ+Pjtcbi8qICAgICAgICAgICAgICBbVHlwZS5TdHJ1Y3RdKi8gMTM6IE5lc3RlZERhdGE8U3RydWN0Pjtcbi8qICAgICAgICAgICAgICAgW1R5cGUuVW5pb25dKi8gMTQ6IFVuaW9uRGF0YTtcbi8qICAgICBbVHlwZS5GaXhlZFNpemVCaW5hcnldKi8gMTU6IEZsYXREYXRhPFQ+O1xuLyogICAgICAgW1R5cGUuRml4ZWRTaXplTGlzdF0qLyAxNjogU2luZ2xlTmVzdGVkRGF0YTxGaXhlZFNpemVMaXN0PFQ+Pjtcbi8qICAgICAgICAgICAgICAgICBbVHlwZS5NYXBdKi8gMTc6IE5lc3RlZERhdGE8TWFwXz47XG4vKiAgW1R5cGUuRGVuc2VVbmlvbl0qLyBEZW5zZVVuaW9uOiBEZW5zZVVuaW9uRGF0YTtcbi8qW1R5cGUuU3BhcnNlVW5pb25dKi8gU3BhcnNlVW5pb246IFNwYXJzZVVuaW9uRGF0YTtcbi8qWyAgVHlwZS5EaWN0aW9uYXJ5XSovIERpY3Rpb25hcnk6IERpY3Rpb25hcnlEYXRhPGFueT47XG59XG4vLyBXaGVuIHNsaWNpbmcsIHdlIGRvIG5vdCBrbm93IHRoZSBudWxsIGNvdW50IG9mIHRoZSBzbGljZWQgcmFuZ2Ugd2l0aG91dFxuLy8gZG9pbmcgc29tZSBjb21wdXRhdGlvbi4gVG8gYXZvaWQgZG9pbmcgdGhpcyBlYWdlcmx5LCB3ZSBzZXQgdGhlIG51bGwgY291bnRcbi8vIHRvIC0xIChhbnkgbmVnYXRpdmUgbnVtYmVyIHdpbGwgZG8pLiBXaGVuIEFycmF5OjpudWxsX2NvdW50IGlzIGNhbGxlZCB0aGVcbi8vIGZpcnN0IHRpbWUsIHRoZSBudWxsIGNvdW50IHdpbGwgYmUgY29tcHV0ZWQuIFNlZSBBUlJPVy0zM1xuZXhwb3J0IHR5cGUga1Vua25vd25OdWxsQ291bnQgPSAtMTtcbmV4cG9ydCBjb25zdCBrVW5rbm93bk51bGxDb3VudCA9IC0xO1xuXG5leHBvcnQgY2xhc3MgQmFzZURhdGE8VCBleHRlbmRzIERhdGFUeXBlID0gRGF0YVR5cGU+IGltcGxlbWVudHMgVmVjdG9yTGlrZSB7XG4gICAgcHVibGljIHR5cGU6IFQ7XG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICAgIHB1YmxpYyBvZmZzZXQ6IG51bWJlcjtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHVibGljIGNoaWxkRGF0YTogRGF0YTxhbnk+W107XG4gICAgcHJvdGVjdGVkIF9udWxsQ291bnQ6IG51bWJlciB8IGtVbmtub3duTnVsbENvdW50O1xuICAgIHByb3RlY3RlZCAvKiAgW1ZlY3RvclR5cGUuT0ZGU0VUXToqLyAwPzogSW50MzJBcnJheTtcbiAgICBwcm90ZWN0ZWQgLyogICAgW1ZlY3RvclR5cGUuREFUQV06Ki8gMT86IFRbJ1RBcnJheSddO1xuICAgIHByb3RlY3RlZCAvKltWZWN0b3JUeXBlLlZBTElESVRZXToqLyAyPzogVWludDhBcnJheTtcbiAgICBwcm90ZWN0ZWQgLyogICAgW1ZlY3RvclR5cGUuVFlQRV06Ki8gMz86IEludDhBcnJheTtcbiAgICBjb25zdHJ1Y3Rvcih0eXBlOiBULCBsZW5ndGg6IG51bWJlciwgb2Zmc2V0PzogbnVtYmVyLCBudWxsQ291bnQ/OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5sZW5ndGggPSBNYXRoLmZsb29yKE1hdGgubWF4KGxlbmd0aCB8fCAwLCAwKSk7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gTWF0aC5mbG9vcihNYXRoLm1heChvZmZzZXQgfHwgMCwgMCkpO1xuICAgICAgICB0aGlzLl9udWxsQ291bnQgPSBNYXRoLmZsb29yKE1hdGgubWF4KG51bGxDb3VudCB8fCAwLCAtMSkpO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IHR5cGVJZCgpIHsgcmV0dXJuIHRoaXMudHlwZS5UVHlwZTsgfVxuICAgIHB1YmxpYyBnZXQgbnVsbEJpdG1hcCgpIHsgcmV0dXJuIHRoaXNbVmVjdG9yVHlwZS5WQUxJRElUWV07IH1cbiAgICBwdWJsaWMgZ2V0IG51bGxDb3VudCgpIHtcbiAgICAgICAgbGV0IG51bGxDb3VudCA9IHRoaXMuX251bGxDb3VudDtcbiAgICAgICAgbGV0IG51bGxCaXRtYXA6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChudWxsQ291bnQgPT09IC0xICYmIChudWxsQml0bWFwID0gdGhpc1tWZWN0b3JUeXBlLlZBTElESVRZXSkpIHtcbiAgICAgICAgICAgIHRoaXMuX251bGxDb3VudCA9IG51bGxDb3VudCA9IHRoaXMubGVuZ3RoIC0gcG9wY250X2JpdF9yYW5nZShudWxsQml0bWFwLCB0aGlzLm9mZnNldCwgdGhpcy5vZmZzZXQgKyB0aGlzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGxDb3VudDtcbiAgICB9XG4gICAgcHVibGljIGNsb25lPFIgZXh0ZW5kcyBUPih0eXBlOiBSLCBsZW5ndGggPSB0aGlzLmxlbmd0aCwgb2Zmc2V0ID0gdGhpcy5vZmZzZXQsIG51bGxDb3VudCA9IHRoaXMuX251bGxDb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3IEJhc2VEYXRhKHR5cGUsIGxlbmd0aCwgb2Zmc2V0LCBudWxsQ291bnQpO1xuICAgIH1cbiAgICBwdWJsaWMgc2xpY2Uob2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBsZW5ndGggPD0gMCA/IHRoaXMgOiB0aGlzLnNsaWNlSW50ZXJuYWwodGhpcy5jbG9uZShcbiAgICAgICAgICAgIHRoaXMudHlwZSwgbGVuZ3RoLCB0aGlzLm9mZnNldCArIG9mZnNldCwgKyh0aGlzLl9udWxsQ291bnQgPT09IDApIC0gMVxuICAgICAgICApIGFzIGFueSwgb2Zmc2V0LCBsZW5ndGgpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2xpY2VJbnRlcm5hbChjbG9uZTogdGhpcywgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgICAgIGxldCBhcnI6IGFueTtcbiAgICAgICAgLy8gSWYgdHlwZUlkcyBleGlzdCwgc2xpY2UgdGhlIHR5cGVJZHMgYnVmZmVyXG4gICAgICAgIChhcnIgPSB0aGlzW1ZlY3RvclR5cGUuVFlQRV0pICYmIChjbG9uZVtWZWN0b3JUeXBlLlRZUEVdID0gdGhpcy5zbGljZURhdGEoYXJyLCBvZmZzZXQsIGxlbmd0aCkpO1xuICAgICAgICAvLyBJZiBvZmZzZXRzIGV4aXN0LCBvbmx5IHNsaWNlIHRoZSBvZmZzZXRzIGJ1ZmZlclxuICAgICAgICAoYXJyID0gdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF0pICYmIChjbG9uZVtWZWN0b3JUeXBlLk9GRlNFVF0gPSB0aGlzLnNsaWNlT2Zmc2V0cyhhcnIsIG9mZnNldCwgbGVuZ3RoKSkgfHxcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpZiBubyBvZmZzZXRzLCBzbGljZSB0aGUgZGF0YSBidWZmZXJcbiAgICAgICAgICAgIChhcnIgPSB0aGlzW1ZlY3RvclR5cGUuREFUQV0pICYmIChjbG9uZVtWZWN0b3JUeXBlLkRBVEFdID0gdGhpcy5zbGljZURhdGEoYXJyLCBvZmZzZXQsIGxlbmd0aCkpO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzbGljZURhdGEoZGF0YTogVFsnVEFycmF5J10gJiBUeXBlZEFycmF5LCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGRhdGEuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGgpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2xpY2VPZmZzZXRzKHZhbHVlT2Zmc2V0czogSW50MzJBcnJheSwgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZU9mZnNldHMuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGggKyAxKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGbGF0RGF0YTxUIGV4dGVuZHMgRmxhdFR5cGU+IGV4dGVuZHMgQmFzZURhdGE8VD4ge1xuICAgIHB1YmxpYyAvKiAgICBbVmVjdG9yVHlwZS5EQVRBXToqLyAxOiBUWydUQXJyYXknXTtcbiAgICBwdWJsaWMgLypbVmVjdG9yVHlwZS5WQUxJRElUWV06Ki8gMjogVWludDhBcnJheTtcbiAgICBwdWJsaWMgZ2V0IHZhbHVlcygpIHsgcmV0dXJuIHRoaXNbVmVjdG9yVHlwZS5EQVRBXTsgfVxuICAgIGNvbnN0cnVjdG9yKHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyLCBudWxsQml0bWFwOiBVaW50OEFycmF5IHwgbnVsbCB8IHVuZGVmaW5lZCwgZGF0YTogSXRlcmFibGU8bnVtYmVyPiwgb2Zmc2V0PzogbnVtYmVyLCBudWxsQ291bnQ/OiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIodHlwZSwgbGVuZ3RoLCBvZmZzZXQsIG51bGxDb3VudCk7XG4gICAgICAgIHRoaXNbVmVjdG9yVHlwZS5EQVRBXSA9IHRvVHlwZWRBcnJheSh0aGlzLkFycmF5VHlwZSwgZGF0YSk7XG4gICAgICAgIHRoaXNbVmVjdG9yVHlwZS5WQUxJRElUWV0gPSB0b1R5cGVkQXJyYXkoVWludDhBcnJheSwgbnVsbEJpdG1hcCk7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgQXJyYXlUeXBlKCk6IFRbJ0FycmF5VHlwZSddIHsgcmV0dXJuIHRoaXMudHlwZS5BcnJheVR5cGU7IH1cbiAgICBwdWJsaWMgY2xvbmU8UiBleHRlbmRzIFQ+KHR5cGU6IFIsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLCBvZmZzZXQgPSB0aGlzLm9mZnNldCwgbnVsbENvdW50ID0gdGhpcy5fbnVsbENvdW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgKHRoaXMuY29uc3RydWN0b3IgYXMgYW55KSh0eXBlLCBsZW5ndGgsIHRoaXNbVmVjdG9yVHlwZS5WQUxJRElUWV0sIHRoaXNbVmVjdG9yVHlwZS5EQVRBXSwgb2Zmc2V0LCBudWxsQ291bnQpIGFzIEZsYXREYXRhPFI+O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJvb2xEYXRhIGV4dGVuZHMgRmxhdERhdGE8Qm9vbD4ge1xuICAgIHByb3RlY3RlZCBzbGljZURhdGEoZGF0YTogVWludDhBcnJheSkgeyByZXR1cm4gZGF0YTsgfVxufVxuXG5leHBvcnQgY2xhc3MgRmxhdExpc3REYXRhPFQgZXh0ZW5kcyBGbGF0TGlzdFR5cGU+IGV4dGVuZHMgRmxhdERhdGE8VD4ge1xuICAgIHB1YmxpYyAvKiAgW1ZlY3RvclR5cGUuT0ZGU0VUXToqLyAwOiBJbnQzMkFycmF5O1xuICAgIHB1YmxpYyAvKiAgICBbVmVjdG9yVHlwZS5EQVRBXToqLyAxOiBUWydUQXJyYXknXTtcbiAgICBwdWJsaWMgLypbVmVjdG9yVHlwZS5WQUxJRElUWV06Ki8gMjogVWludDhBcnJheTtcbiAgICBwdWJsaWMgZ2V0IHZhbHVlcygpIHsgcmV0dXJuIHRoaXNbVmVjdG9yVHlwZS5EQVRBXTsgfVxuICAgIHB1YmxpYyBnZXQgdmFsdWVPZmZzZXRzKCkgeyByZXR1cm4gdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF07IH1cbiAgICBjb25zdHJ1Y3Rvcih0eXBlOiBULCBsZW5ndGg6IG51bWJlciwgbnVsbEJpdG1hcDogVWludDhBcnJheSB8IG51bGwgfCB1bmRlZmluZWQsIHZhbHVlT2Zmc2V0czogSXRlcmFibGU8bnVtYmVyPiwgZGF0YTogVFsnVEFycmF5J10sIG9mZnNldD86IG51bWJlciwgbnVsbENvdW50PzogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKHR5cGUsIGxlbmd0aCwgbnVsbEJpdG1hcCwgZGF0YSwgb2Zmc2V0LCBudWxsQ291bnQpO1xuICAgICAgICB0aGlzW1ZlY3RvclR5cGUuT0ZGU0VUXSA9IHRvVHlwZWRBcnJheShJbnQzMkFycmF5LCB2YWx1ZU9mZnNldHMpO1xuICAgIH1cbiAgICBwdWJsaWMgY2xvbmU8UiBleHRlbmRzIFQ+KHR5cGU6IFIsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLCBvZmZzZXQgPSB0aGlzLm9mZnNldCwgbnVsbENvdW50ID0gdGhpcy5fbnVsbENvdW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgRmxhdExpc3REYXRhKHR5cGUsIGxlbmd0aCwgdGhpc1tWZWN0b3JUeXBlLlZBTElESVRZXSwgdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF0sIHRoaXNbVmVjdG9yVHlwZS5EQVRBXSwgb2Zmc2V0LCBudWxsQ291bnQpIGFzIEZsYXRMaXN0RGF0YTxSPjtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEaWN0aW9uYXJ5RGF0YTxUIGV4dGVuZHMgRGF0YVR5cGU+IGV4dGVuZHMgQmFzZURhdGE8RGljdGlvbmFyeTxUPj4ge1xuICAgIHByb3RlY3RlZCBfZGljdGlvbmFyeTogVmVjdG9yPFQ+O1xuICAgIHByb3RlY3RlZCBfaW5kaWNlczogRGF0YTxJbnQ8YW55Pj47XG4gICAgcHVibGljIGdldCBpbmRpY2VzKCkgeyByZXR1cm4gdGhpcy5faW5kaWNlczsgfVxuICAgIHB1YmxpYyBnZXQgZGljdGlvbmFyeSgpIHsgcmV0dXJuIHRoaXMuX2RpY3Rpb25hcnk7IH1cbiAgICBjb25zdHJ1Y3Rvcih0eXBlOiBEaWN0aW9uYXJ5PFQ+LCBkaWN0aW9uYXJ5OiBWZWN0b3I8VD4sIGluZGljZXM6IERhdGE8SW50PGFueT4+KSB7XG4gICAgICAgIHN1cGVyKHR5cGUsIGluZGljZXMubGVuZ3RoLCBpbmRpY2VzLm9mZnNldCwgKGluZGljZXMgYXMgYW55KS5fbnVsbENvdW50KTtcbiAgICAgICAgdGhpcy5faW5kaWNlcyA9IGluZGljZXM7XG4gICAgICAgIHRoaXMuX2RpY3Rpb25hcnkgPSBkaWN0aW9uYXJ5O1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IG51bGxDb3VudCgpIHsgcmV0dXJuIHRoaXMuX2luZGljZXMubnVsbENvdW50OyB9XG4gICAgcHVibGljIGdldCBudWxsQml0bWFwKCkgeyByZXR1cm4gdGhpcy5faW5kaWNlcy5udWxsQml0bWFwOyB9XG4gICAgcHVibGljIGNsb25lPFIgZXh0ZW5kcyBEaWN0aW9uYXJ5PFQ+Pih0eXBlOiBSLCBsZW5ndGggPSB0aGlzLmxlbmd0aCwgb2Zmc2V0ID0gdGhpcy5vZmZzZXQpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuX2RpY3Rpb25hcnkuZGF0YS5jbG9uZSh0eXBlLmRpY3Rpb25hcnkgYXMgYW55KTtcbiAgICAgICAgcmV0dXJuIG5ldyBEaWN0aW9uYXJ5RGF0YTxSPihcbiAgICAgICAgICAgIHRoaXMudHlwZSBhcyBhbnksXG4gICAgICAgICAgICB0aGlzLl9kaWN0aW9uYXJ5LmNsb25lKGRhdGEpIGFzIGFueSxcbiAgICAgICAgICAgIHRoaXMuX2luZGljZXMuc2xpY2Uob2Zmc2V0IC0gdGhpcy5vZmZzZXQsIGxlbmd0aClcbiAgICAgICAgKSBhcyBhbnk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzbGljZUludGVybmFsKGNsb25lOiB0aGlzLCBfb2Zmc2V0OiBudW1iZXIsIF9sZW5ndGg6IG51bWJlcikge1xuICAgICAgICBjbG9uZS5sZW5ndGggPSBjbG9uZS5faW5kaWNlcy5sZW5ndGg7XG4gICAgICAgIGNsb25lLl9udWxsQ291bnQgPSAoY2xvbmUuX2luZGljZXMgYXMgYW55KS5fbnVsbENvdW50O1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmVzdGVkRGF0YTxUIGV4dGVuZHMgTmVzdGVkVHlwZSA9IE5lc3RlZFR5cGU+IGV4dGVuZHMgQmFzZURhdGE8VD4ge1xuICAgIHB1YmxpYyAvKltWZWN0b3JUeXBlLlZBTElESVRZXToqLyAyOiBVaW50OEFycmF5O1xuICAgIGNvbnN0cnVjdG9yKHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyLCBudWxsQml0bWFwOiBVaW50OEFycmF5IHwgbnVsbCB8IHVuZGVmaW5lZCwgY2hpbGREYXRhOiBEYXRhPGFueT5bXSwgb2Zmc2V0PzogbnVtYmVyLCBudWxsQ291bnQ/OiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIodHlwZSwgbGVuZ3RoLCBvZmZzZXQsIG51bGxDb3VudCk7XG4gICAgICAgIHRoaXMuY2hpbGREYXRhID0gY2hpbGREYXRhO1xuICAgICAgICB0aGlzW1ZlY3RvclR5cGUuVkFMSURJVFldID0gdG9UeXBlZEFycmF5KFVpbnQ4QXJyYXksIG51bGxCaXRtYXApO1xuICAgIH1cbiAgICBwdWJsaWMgY2xvbmU8UiBleHRlbmRzIFQ+KHR5cGU6IFIsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLCBvZmZzZXQgPSB0aGlzLm9mZnNldCwgbnVsbENvdW50ID0gdGhpcy5fbnVsbENvdW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgTmVzdGVkRGF0YTxSPih0eXBlLCBsZW5ndGgsIHRoaXNbVmVjdG9yVHlwZS5WQUxJRElUWV0sIHRoaXMuY2hpbGREYXRhLCBvZmZzZXQsIG51bGxDb3VudCk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBzbGljZUludGVybmFsKGNsb25lOiB0aGlzLCBvZmZzZXQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzW1ZlY3RvclR5cGUuT0ZGU0VUXSkge1xuICAgICAgICAgICAgY2xvbmUuY2hpbGREYXRhID0gdGhpcy5jaGlsZERhdGEubWFwKChjaGlsZCkgPT4gY2hpbGQuc2xpY2Uob2Zmc2V0LCBsZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIuc2xpY2VJbnRlcm5hbChjbG9uZSwgb2Zmc2V0LCBsZW5ndGgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNpbmdsZU5lc3RlZERhdGE8VCBleHRlbmRzIFNpbmdsZU5lc3RlZFR5cGU+IGV4dGVuZHMgTmVzdGVkRGF0YTxUPiB7XG4gICAgcHJvdGVjdGVkIF92YWx1ZXNEYXRhOiBEYXRhPFQ+O1xuICAgIHB1YmxpYyBnZXQgdmFsdWVzKCkgeyByZXR1cm4gdGhpcy5fdmFsdWVzRGF0YTsgfVxuICAgIGNvbnN0cnVjdG9yKHR5cGU6IFQsIGxlbmd0aDogbnVtYmVyLCBudWxsQml0bWFwOiBVaW50OEFycmF5IHwgbnVsbCB8IHVuZGVmaW5lZCwgdmFsdWVDaGlsZERhdGE6IERhdGE8VD4sIG9mZnNldD86IG51bWJlciwgbnVsbENvdW50PzogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKHR5cGUsIGxlbmd0aCwgbnVsbEJpdG1hcCwgW3ZhbHVlQ2hpbGREYXRhXSwgb2Zmc2V0LCBudWxsQ291bnQpO1xuICAgICAgICB0aGlzLl92YWx1ZXNEYXRhID0gdmFsdWVDaGlsZERhdGE7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTGlzdERhdGE8VCBleHRlbmRzIExpc3RUeXBlPiBleHRlbmRzIFNpbmdsZU5lc3RlZERhdGE8VD4ge1xuICAgIHB1YmxpYyAvKiAgW1ZlY3RvclR5cGUuT0ZGU0VUXToqLyAwOiBJbnQzMkFycmF5O1xuICAgIHB1YmxpYyAvKltWZWN0b3JUeXBlLlZBTElESVRZXToqLyAyOiBVaW50OEFycmF5O1xuICAgIHB1YmxpYyBnZXQgdmFsdWVPZmZzZXRzKCkgeyByZXR1cm4gdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF07IH1cbiAgICBjb25zdHJ1Y3Rvcih0eXBlOiBULCBsZW5ndGg6IG51bWJlciwgbnVsbEJpdG1hcDogVWludDhBcnJheSB8IG51bGwgfCB1bmRlZmluZWQsIHZhbHVlT2Zmc2V0czogSXRlcmFibGU8bnVtYmVyPiwgdmFsdWVDaGlsZERhdGE6IERhdGE8VD4sIG9mZnNldD86IG51bWJlciwgbnVsbENvdW50PzogbnVtYmVyKSB7XG4gICAgICAgIHN1cGVyKHR5cGUsIGxlbmd0aCwgbnVsbEJpdG1hcCwgdmFsdWVDaGlsZERhdGEsIG9mZnNldCwgbnVsbENvdW50KTtcbiAgICAgICAgdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF0gPSB0b1R5cGVkQXJyYXkoSW50MzJBcnJheSwgdmFsdWVPZmZzZXRzKTtcbiAgICB9XG4gICAgcHVibGljIGNsb25lPFIgZXh0ZW5kcyBUPih0eXBlOiBSLCBsZW5ndGggPSB0aGlzLmxlbmd0aCwgb2Zmc2V0ID0gdGhpcy5vZmZzZXQsIG51bGxDb3VudCA9IHRoaXMuX251bGxDb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3IExpc3REYXRhPFI+KHR5cGUsIGxlbmd0aCwgdGhpc1tWZWN0b3JUeXBlLlZBTElESVRZXSwgdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF0sIHRoaXMuX3ZhbHVlc0RhdGEgYXMgYW55LCBvZmZzZXQsIG51bGxDb3VudCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVW5pb25EYXRhPFQgZXh0ZW5kcyAoRGVuc2VVbmlvbiB8IFNwYXJzZVVuaW9uKSA9IGFueT4gZXh0ZW5kcyBOZXN0ZWREYXRhPFQ+IHtcbiAgICBwdWJsaWMgLyogICAgW1ZlY3RvclR5cGUuVFlQRV06Ki8gMzogVFsnVEFycmF5J107XG4gICAgcHVibGljIGdldCB0eXBlSWRzKCkgeyByZXR1cm4gdGhpc1tWZWN0b3JUeXBlLlRZUEVdOyB9XG4gICAgY29uc3RydWN0b3IodHlwZTogVCwgbGVuZ3RoOiBudW1iZXIsIG51bGxCaXRtYXA6IFVpbnQ4QXJyYXkgfCBudWxsIHwgdW5kZWZpbmVkLCB0eXBlSWRzOiBJdGVyYWJsZTxudW1iZXI+LCBjaGlsZERhdGE6IERhdGE8YW55PltdLCBvZmZzZXQ/OiBudW1iZXIsIG51bGxDb3VudD86IG51bWJlcikge1xuICAgICAgICBzdXBlcih0eXBlLCBsZW5ndGgsIG51bGxCaXRtYXAsIGNoaWxkRGF0YSwgb2Zmc2V0LCBudWxsQ291bnQpO1xuICAgICAgICB0aGlzW1ZlY3RvclR5cGUuVFlQRV0gPSB0b1R5cGVkQXJyYXkoSW50OEFycmF5LCB0eXBlSWRzKTtcbiAgICB9XG4gICAgcHVibGljIGNsb25lPFIgZXh0ZW5kcyBUPih0eXBlOiBSLCBsZW5ndGggPSB0aGlzLmxlbmd0aCwgb2Zmc2V0ID0gdGhpcy5vZmZzZXQsIG51bGxDb3VudCA9IHRoaXMuX251bGxDb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3IFVuaW9uRGF0YTxSPih0eXBlLCBsZW5ndGgsIHRoaXNbVmVjdG9yVHlwZS5WQUxJRElUWV0sIHRoaXNbVmVjdG9yVHlwZS5UWVBFXSwgdGhpcy5jaGlsZERhdGEsIG9mZnNldCwgbnVsbENvdW50KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTcGFyc2VVbmlvbkRhdGEgZXh0ZW5kcyBVbmlvbkRhdGE8U3BhcnNlVW5pb24+IHtcbiAgICBjb25zdHJ1Y3Rvcih0eXBlOiBTcGFyc2VVbmlvbiwgbGVuZ3RoOiBudW1iZXIsIG51bGxCaXRtYXA6IFVpbnQ4QXJyYXkgfCBudWxsIHwgdW5kZWZpbmVkLCB0eXBlSWRzOiBJdGVyYWJsZTxudW1iZXI+LCBjaGlsZERhdGE6IERhdGE8YW55PltdLCBvZmZzZXQ/OiBudW1iZXIsIG51bGxDb3VudD86IG51bWJlcikge1xuICAgICAgICBzdXBlcih0eXBlLCBsZW5ndGgsIG51bGxCaXRtYXAsIHR5cGVJZHMsIGNoaWxkRGF0YSwgb2Zmc2V0LCBudWxsQ291bnQpO1xuICAgIH1cbiAgICBwdWJsaWMgY2xvbmU8UiBleHRlbmRzIFNwYXJzZVVuaW9uPih0eXBlOiBSLCBsZW5ndGggPSB0aGlzLmxlbmd0aCwgb2Zmc2V0ID0gdGhpcy5vZmZzZXQsIG51bGxDb3VudCA9IHRoaXMuX251bGxDb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3IFNwYXJzZVVuaW9uRGF0YShcbiAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgICB0aGlzW1ZlY3RvclR5cGUuVkFMSURJVFldLFxuICAgICAgICAgICAgdGhpc1tWZWN0b3JUeXBlLlRZUEVdLFxuICAgICAgICAgICAgdGhpcy5jaGlsZERhdGEsXG4gICAgICAgICAgICBvZmZzZXQsIG51bGxDb3VudFxuICAgICAgICApIGFzIGFueSBhcyBVbmlvbkRhdGE8Uj47XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVuc2VVbmlvbkRhdGEgZXh0ZW5kcyBVbmlvbkRhdGE8RGVuc2VVbmlvbj4ge1xuICAgIHB1YmxpYyAvKiAgW1ZlY3RvclR5cGUuT0ZGU0VUXToqLyAwOiBJbnQzMkFycmF5O1xuICAgIHB1YmxpYyBnZXQgdmFsdWVPZmZzZXRzKCkgeyByZXR1cm4gdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF07IH1cbiAgICBjb25zdHJ1Y3Rvcih0eXBlOiBEZW5zZVVuaW9uLCBsZW5ndGg6IG51bWJlciwgbnVsbEJpdG1hcDogVWludDhBcnJheSB8IG51bGwgfCB1bmRlZmluZWQsIHR5cGVJZHM6IEl0ZXJhYmxlPG51bWJlcj4sIHZhbHVlT2Zmc2V0czogSXRlcmFibGU8bnVtYmVyPiwgY2hpbGREYXRhOiBEYXRhPGFueT5bXSwgb2Zmc2V0PzogbnVtYmVyLCBudWxsQ291bnQ/OiBudW1iZXIpIHtcbiAgICAgICAgc3VwZXIodHlwZSwgbGVuZ3RoLCBudWxsQml0bWFwLCB0eXBlSWRzLCBjaGlsZERhdGEsIG9mZnNldCwgbnVsbENvdW50KTtcbiAgICAgICAgdGhpc1tWZWN0b3JUeXBlLk9GRlNFVF0gPSB0b1R5cGVkQXJyYXkoSW50MzJBcnJheSwgdmFsdWVPZmZzZXRzKTtcbiAgICB9XG4gICAgcHVibGljIGNsb25lPFIgZXh0ZW5kcyBEZW5zZVVuaW9uPih0eXBlOiBSLCBsZW5ndGggPSB0aGlzLmxlbmd0aCwgb2Zmc2V0ID0gdGhpcy5vZmZzZXQsIG51bGxDb3VudCA9IHRoaXMuX251bGxDb3VudCkge1xuICAgICAgICByZXR1cm4gbmV3IERlbnNlVW5pb25EYXRhKFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIGxlbmd0aCxcbiAgICAgICAgICAgIHRoaXNbVmVjdG9yVHlwZS5WQUxJRElUWV0sXG4gICAgICAgICAgICB0aGlzW1ZlY3RvclR5cGUuVFlQRV0sXG4gICAgICAgICAgICB0aGlzW1ZlY3RvclR5cGUuT0ZGU0VUXSxcbiAgICAgICAgICAgIHRoaXMuY2hpbGREYXRhLFxuICAgICAgICAgICAgb2Zmc2V0LCBudWxsQ291bnRcbiAgICAgICAgKSBhcyBhbnkgYXMgVW5pb25EYXRhPFI+O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENodW5rZWREYXRhPFQgZXh0ZW5kcyBEYXRhVHlwZT4gZXh0ZW5kcyBCYXNlRGF0YTxUPiB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHByb3RlY3RlZCBfY2h1bmtEYXRhOiBEYXRhPFQ+W107XG4gICAgcHJvdGVjdGVkIF9jaHVua1ZlY3RvcnM6IFZlY3RvcjxUPltdO1xuICAgIHByb3RlY3RlZCBfY2h1bmtPZmZzZXRzOiBVaW50MzJBcnJheTtcbiAgICBwdWJsaWMgZ2V0IGNodW5rVmVjdG9ycygpIHsgcmV0dXJuIHRoaXMuX2NodW5rVmVjdG9yczsgfVxuICAgIHB1YmxpYyBnZXQgY2h1bmtPZmZzZXRzKCkgeyByZXR1cm4gdGhpcy5fY2h1bmtPZmZzZXRzOyB9XG4gICAgcHVibGljIGdldCBjaHVua0RhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jaHVua0RhdGEgfHwgKFxuICAgICAgICAgICAgICAgdGhpcy5fY2h1bmtEYXRhID0gdGhpcy5fY2h1bmtWZWN0b3JzLm1hcCgoeyBkYXRhIH0pID0+IGRhdGEpKTtcbiAgICB9XG4gICAgY29uc3RydWN0b3IodHlwZTogVCwgbGVuZ3RoOiBudW1iZXIsIGNodW5rVmVjdG9yczogVmVjdG9yPFQ+W10sIG9mZnNldD86IG51bWJlciwgbnVsbENvdW50PzogbnVtYmVyLCBjaHVua09mZnNldHM/OiBVaW50MzJBcnJheSkge1xuICAgICAgICBzdXBlcih0eXBlLCBsZW5ndGgsIG9mZnNldCwgbnVsbENvdW50KTtcbiAgICAgICAgdGhpcy5fY2h1bmtWZWN0b3JzID0gY2h1bmtWZWN0b3JzO1xuICAgICAgICB0aGlzLl9jaHVua09mZnNldHMgPSBjaHVua09mZnNldHMgfHwgQ2h1bmtlZERhdGEuY29tcHV0ZU9mZnNldHMoY2h1bmtWZWN0b3JzKTtcbiAgICB9XG4gICAgcHVibGljIGdldCBudWxsQ291bnQoKSB7XG4gICAgICAgIGxldCBudWxsQ291bnQgPSB0aGlzLl9udWxsQ291bnQ7XG4gICAgICAgIGlmIChudWxsQ291bnQgPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9udWxsQ291bnQgPSBudWxsQ291bnQgPSB0aGlzLl9jaHVua1ZlY3RvcnMucmVkdWNlKCh4LCBjKSA9PiB4ICsgYy5udWxsQ291bnQsIDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsQ291bnQ7XG4gICAgfVxuICAgIHB1YmxpYyBjbG9uZTxSIGV4dGVuZHMgVD4odHlwZTogUiwgbGVuZ3RoID0gdGhpcy5sZW5ndGgsIG9mZnNldCA9IHRoaXMub2Zmc2V0LCBudWxsQ291bnQgPSB0aGlzLl9udWxsQ291bnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaHVua2VkRGF0YTxSPihcbiAgICAgICAgICAgIHR5cGUsIGxlbmd0aCxcbiAgICAgICAgICAgIHRoaXMuX2NodW5rVmVjdG9ycy5tYXAoKHZlYykgPT4gdmVjLmNsb25lKHZlYy5kYXRhLmNsb25lKHR5cGUpKSkgYXMgYW55LFxuICAgICAgICAgICAgb2Zmc2V0LCBudWxsQ291bnQsIHRoaXMuX2NodW5rT2Zmc2V0c1xuICAgICAgICApO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc2xpY2VJbnRlcm5hbChjbG9uZTogdGhpcywgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGNodW5rcyA9IHRoaXMuX2NodW5rVmVjdG9ycztcbiAgICAgICAgY29uc3Qgb2Zmc2V0cyA9IHRoaXMuX2NodW5rT2Zmc2V0cztcbiAgICAgICAgY29uc3QgY2h1bmtTbGljZXM6IFZlY3RvcjxUPltdID0gW107XG4gICAgICAgIGZvciAobGV0IGNoaWxkSW5kZXggPSAtMSwgbnVtQ2hpbGRyZW4gPSBjaHVua3MubGVuZ3RoOyArK2NoaWxkSW5kZXggPCBudW1DaGlsZHJlbjspIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gY2h1bmtzW2NoaWxkSW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgY2hpbGRMZW5ndGggPSBjaGlsZC5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBjaGlsZE9mZnNldCA9IG9mZnNldHNbY2hpbGRJbmRleF07XG4gICAgICAgICAgICAvLyBJZiB0aGUgY2hpbGQgaXMgdG8gdGhlIHJpZ2h0IG9mIHRoZSBzbGljZSBib3VuZGFyeSwgZXhjbHVkZVxuICAgICAgICAgICAgaWYgKGNoaWxkT2Zmc2V0ID49IG9mZnNldCArIGxlbmd0aCkgeyBjb250aW51ZTsgfVxuICAgICAgICAgICAgLy8gSWYgdGhlIGNoaWxkIGlzIHRvIHRoZSBsZWZ0IG9mIG9mIHRoZSBzbGljZSBib3VuZGFyeSwgZXhjbHVkZVxuICAgICAgICAgICAgaWYgKG9mZnNldCA+PSBjaGlsZE9mZnNldCArIGNoaWxkTGVuZ3RoKSB7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAvLyBJZiB0aGUgY2hpbGQgaXMgYmV0d2VlbiBib3RoIGxlZnQgYW5kIHJpZ2h0IGJvdW5kYXJpZXMsIGluY2x1ZGUgdy9vIHNsaWNpbmdcbiAgICAgICAgICAgIGlmIChjaGlsZE9mZnNldCA+PSBvZmZzZXQgJiYgKGNoaWxkT2Zmc2V0ICsgY2hpbGRMZW5ndGgpIDw9IG9mZnNldCArIGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNodW5rU2xpY2VzLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgdGhlIGNoaWxkIG92ZXJsYXBzIG9uZSBvZiB0aGUgc2xpY2UgYm91bmRhcmllcywgaW5jbHVkZSB0aGF0IHNsaWNlXG4gICAgICAgICAgICBjb25zdCBiZWdpbiA9IE1hdGgubWF4KDAsIG9mZnNldCAtIGNoaWxkT2Zmc2V0KTtcbiAgICAgICAgICAgIGNvbnN0IGVuZCA9IGJlZ2luICsgTWF0aC5taW4oY2hpbGRMZW5ndGggLSBiZWdpbiwgKG9mZnNldCArIGxlbmd0aCkgLSBjaGlsZE9mZnNldCk7XG4gICAgICAgICAgICBjaHVua1NsaWNlcy5wdXNoKGNoaWxkLnNsaWNlKGJlZ2luLCBlbmQpKTtcbiAgICAgICAgfVxuICAgICAgICBjbG9uZS5fY2h1bmtWZWN0b3JzID0gY2h1bmtTbGljZXM7XG4gICAgICAgIGNsb25lLl9jaHVua09mZnNldHMgPSBDaHVua2VkRGF0YS5jb21wdXRlT2Zmc2V0cyhjaHVua1NsaWNlcyk7XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG4gICAgc3RhdGljIGNvbXB1dGVPZmZzZXRzPFQgZXh0ZW5kcyBEYXRhVHlwZT4oY2hpbGRWZWN0b3JzOiBWZWN0b3I8VD5bXSkge1xuICAgICAgICBjb25zdCBjaGlsZE9mZnNldHMgPSBuZXcgVWludDMyQXJyYXkoY2hpbGRWZWN0b3JzLmxlbmd0aCArIDEpO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDAsIGxlbmd0aCA9IGNoaWxkT2Zmc2V0cy5sZW5ndGgsIGNoaWxkT2Zmc2V0ID0gY2hpbGRPZmZzZXRzWzBdID0gMDsgKytpbmRleCA8IGxlbmd0aDspIHtcbiAgICAgICAgICAgIGNoaWxkT2Zmc2V0c1tpbmRleF0gPSAoY2hpbGRPZmZzZXQgKz0gY2hpbGRWZWN0b3JzW2luZGV4IC0gMV0ubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGRPZmZzZXRzO1xuICAgIH1cbn1cbiJdfQ==
