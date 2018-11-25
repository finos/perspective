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
import * as Schema_ from './fb/Schema';
import * as Message_ from './fb/Message';
import { flatbuffers } from 'flatbuffers';
import { DictionaryBatch } from './ipc/metadata';
import { TypeVisitor } from './visitor';
export var Long = flatbuffers.Long;
export var ArrowType = Schema_.org.apache.arrow.flatbuf.Type;
export var DateUnit = Schema_.org.apache.arrow.flatbuf.DateUnit;
export var TimeUnit = Schema_.org.apache.arrow.flatbuf.TimeUnit;
export var Precision = Schema_.org.apache.arrow.flatbuf.Precision;
export var UnionMode = Schema_.org.apache.arrow.flatbuf.UnionMode;
export var VectorType = Schema_.org.apache.arrow.flatbuf.VectorType;
export var IntervalUnit = Schema_.org.apache.arrow.flatbuf.IntervalUnit;
export var MessageHeader = Message_.org.apache.arrow.flatbuf.MessageHeader;
export var MetadataVersion = Schema_.org.apache.arrow.flatbuf.MetadataVersion;
var Schema = /** @class */ (function () {
    function Schema(fields, metadata, version, dictionaries) {
        if (version === void 0) { version = MetadataVersion.V4; }
        if (dictionaries === void 0) { dictionaries = new Map(); }
        this.fields = fields;
        this.version = version;
        this.metadata = metadata;
        this.dictionaries = dictionaries;
    }
    Schema.from = function (vectors) {
        return new Schema(vectors.map(function (v, i) { return new Field('' + i, v.type); }));
    };
    Object.defineProperty(Schema.prototype, "bodyLength", {
        get: function () { return this._bodyLength; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Schema.prototype, "headerType", {
        get: function () { return this._headerType; },
        enumerable: true,
        configurable: true
    });
    Schema.prototype.select = function () {
        var fieldNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fieldNames[_i] = arguments[_i];
        }
        var namesToKeep = fieldNames.reduce(function (xs, x) { return (xs[x] = true) && xs; }, Object.create(null));
        var newDictFields = new Map(), newFields = this.fields.filter(function (f) { return namesToKeep[f.name]; });
        this.dictionaries.forEach(function (f, dictId) { return (namesToKeep[f.name]) && newDictFields.set(dictId, f); });
        return new Schema(newFields, this.metadata, this.version, newDictFields);
    };
    Schema[Symbol.toStringTag] = (function (prototype) {
        prototype._bodyLength = 0;
        prototype._headerType = MessageHeader.Schema;
        return 'Schema';
    })(Schema.prototype);
    return Schema;
}());
export { Schema };
var Field = /** @class */ (function () {
    function Field(name, type, nullable, metadata) {
        if (nullable === void 0) { nullable = false; }
        this.name = name;
        this.type = type;
        this.nullable = nullable;
        this.metadata = metadata;
    }
    Field.prototype.toString = function () { return this.name + ": " + this.type; };
    Object.defineProperty(Field.prototype, "typeId", {
        get: function () { return this.type.TType; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Field.prototype, Symbol.toStringTag, {
        get: function () { return 'Field'; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Field.prototype, "indices", {
        get: function () {
            return DataType.isDictionary(this.type) ? this.type.indices : this.type;
        },
        enumerable: true,
        configurable: true
    });
    return Field;
}());
export { Field };
/**
 * *
 * Main data type enumeration:
 * *
 * Data types in this library are all *logical*. They can be expressed as
 * either a primitive physical type (bytes or bits of some fixed size), a
 * nested type consisting of other data types, or another data type (e.g. a
 * timestamp encoded as an int64)
 */
export var Type;
(function (Type) {
    Type[Type["NONE"] = 0] = "NONE";
    Type[Type["Null"] = 1] = "Null";
    Type[Type["Int"] = 2] = "Int";
    Type[Type["Float"] = 3] = "Float";
    Type[Type["Binary"] = 4] = "Binary";
    Type[Type["Utf8"] = 5] = "Utf8";
    Type[Type["Bool"] = 6] = "Bool";
    Type[Type["Decimal"] = 7] = "Decimal";
    Type[Type["Date"] = 8] = "Date";
    Type[Type["Time"] = 9] = "Time";
    Type[Type["Timestamp"] = 10] = "Timestamp";
    Type[Type["Interval"] = 11] = "Interval";
    Type[Type["List"] = 12] = "List";
    Type[Type["Struct"] = 13] = "Struct";
    Type[Type["Union"] = 14] = "Union";
    Type[Type["FixedSizeBinary"] = 15] = "FixedSizeBinary";
    Type[Type["FixedSizeList"] = 16] = "FixedSizeList";
    Type[Type["Map"] = 17] = "Map";
    Type["Dictionary"] = "Dictionary";
    Type["DenseUnion"] = "DenseUnion";
    Type["SparseUnion"] = "SparseUnion";
})(Type || (Type = {}));
var DataType = /** @class */ (function () {
    function DataType(TType, children) {
        this.TType = TType;
        this.children = children;
    }
    DataType.isNull = function (x) { return x && x.TType === Type.Null; };
    DataType.isInt = function (x) { return x && x.TType === Type.Int; };
    DataType.isFloat = function (x) { return x && x.TType === Type.Float; };
    DataType.isBinary = function (x) { return x && x.TType === Type.Binary; };
    DataType.isUtf8 = function (x) { return x && x.TType === Type.Utf8; };
    DataType.isBool = function (x) { return x && x.TType === Type.Bool; };
    DataType.isDecimal = function (x) { return x && x.TType === Type.Decimal; };
    DataType.isDate = function (x) { return x && x.TType === Type.Date; };
    DataType.isTime = function (x) { return x && x.TType === Type.Time; };
    DataType.isTimestamp = function (x) { return x && x.TType === Type.Timestamp; };
    DataType.isInterval = function (x) { return x && x.TType === Type.Interval; };
    DataType.isList = function (x) { return x && x.TType === Type.List; };
    DataType.isStruct = function (x) { return x && x.TType === Type.Struct; };
    DataType.isUnion = function (x) { return x && x.TType === Type.Union; };
    DataType.isDenseUnion = function (x) { return x && x.TType === Type.DenseUnion; };
    DataType.isSparseUnion = function (x) { return x && x.TType === Type.SparseUnion; };
    DataType.isFixedSizeBinary = function (x) { return x && x.TType === Type.FixedSizeBinary; };
    DataType.isFixedSizeList = function (x) { return x && x.TType === Type.FixedSizeList; };
    DataType.isMap = function (x) { return x && x.TType === Type.Map; };
    DataType.isDictionary = function (x) { return x && x.TType === Type.Dictionary; };
    DataType.prototype.acceptTypeVisitor = function (visitor) {
        return TypeVisitor.visitTypeInline(visitor, this);
    };
    DataType[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Array;
        return proto[Symbol.toStringTag] = 'DataType';
    })(DataType.prototype);
    return DataType;
}());
export { DataType };
var Null = /** @class */ (function (_super) {
    tslib_1.__extends(Null, _super);
    function Null() {
        return _super.call(this, Type.Null) || this;
    }
    Null.prototype.toString = function () { return "Null"; };
    Null[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'Null';
    })(Null.prototype);
    return Null;
}(DataType));
export { Null };
var Int = /** @class */ (function (_super) {
    tslib_1.__extends(Int, _super);
    function Int(isSigned, bitWidth) {
        var _this = _super.call(this, Type.Int) || this;
        _this.isSigned = isSigned;
        _this.bitWidth = bitWidth;
        return _this;
    }
    Object.defineProperty(Int.prototype, "ArrayType", {
        get: function () {
            switch (this.bitWidth) {
                case 8: return (this.isSigned ? Int8Array : Uint8Array);
                case 16: return (this.isSigned ? Int16Array : Uint16Array);
                case 32: return (this.isSigned ? Int32Array : Uint32Array);
                case 64: return (this.isSigned ? Int32Array : Uint32Array);
            }
            throw new Error("Unrecognized " + this[Symbol.toStringTag] + " type");
        },
        enumerable: true,
        configurable: true
    });
    Int.prototype.toString = function () { return (this.isSigned ? "I" : "Ui") + "nt" + this.bitWidth; };
    Int[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'Int';
    })(Int.prototype);
    return Int;
}(DataType));
export { Int };
var Int8 = /** @class */ (function (_super) {
    tslib_1.__extends(Int8, _super);
    function Int8() {
        return _super.call(this, true, 8) || this;
    }
    return Int8;
}(Int));
export { Int8 };
var Int16 = /** @class */ (function (_super) {
    tslib_1.__extends(Int16, _super);
    function Int16() {
        return _super.call(this, true, 16) || this;
    }
    return Int16;
}(Int));
export { Int16 };
var Int32 = /** @class */ (function (_super) {
    tslib_1.__extends(Int32, _super);
    function Int32() {
        return _super.call(this, true, 32) || this;
    }
    return Int32;
}(Int));
export { Int32 };
var Int64 = /** @class */ (function (_super) {
    tslib_1.__extends(Int64, _super);
    function Int64() {
        return _super.call(this, true, 64) || this;
    }
    return Int64;
}(Int));
export { Int64 };
var Uint8 = /** @class */ (function (_super) {
    tslib_1.__extends(Uint8, _super);
    function Uint8() {
        return _super.call(this, false, 8) || this;
    }
    return Uint8;
}(Int));
export { Uint8 };
var Uint16 = /** @class */ (function (_super) {
    tslib_1.__extends(Uint16, _super);
    function Uint16() {
        return _super.call(this, false, 16) || this;
    }
    return Uint16;
}(Int));
export { Uint16 };
var Uint32 = /** @class */ (function (_super) {
    tslib_1.__extends(Uint32, _super);
    function Uint32() {
        return _super.call(this, false, 32) || this;
    }
    return Uint32;
}(Int));
export { Uint32 };
var Uint64 = /** @class */ (function (_super) {
    tslib_1.__extends(Uint64, _super);
    function Uint64() {
        return _super.call(this, false, 64) || this;
    }
    return Uint64;
}(Int));
export { Uint64 };
var Float = /** @class */ (function (_super) {
    tslib_1.__extends(Float, _super);
    function Float(precision) {
        var _this = _super.call(this, Type.Float) || this;
        _this.precision = precision;
        return _this;
    }
    Object.defineProperty(Float.prototype, "ArrayType", {
        // @ts-ignore
        get: function () {
            switch (this.precision) {
                case Precision.HALF: return Uint16Array;
                case Precision.SINGLE: return Float32Array;
                case Precision.DOUBLE: return Float64Array;
            }
            throw new Error("Unrecognized " + this[Symbol.toStringTag] + " type");
        },
        enumerable: true,
        configurable: true
    });
    Float.prototype.toString = function () { return "Float" + ((this.precision << 5) || 16); };
    Float[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'Float';
    })(Float.prototype);
    return Float;
}(DataType));
export { Float };
var Float16 = /** @class */ (function (_super) {
    tslib_1.__extends(Float16, _super);
    function Float16() {
        return _super.call(this, Precision.HALF) || this;
    }
    return Float16;
}(Float));
export { Float16 };
var Float32 = /** @class */ (function (_super) {
    tslib_1.__extends(Float32, _super);
    function Float32() {
        return _super.call(this, Precision.SINGLE) || this;
    }
    return Float32;
}(Float));
export { Float32 };
var Float64 = /** @class */ (function (_super) {
    tslib_1.__extends(Float64, _super);
    function Float64() {
        return _super.call(this, Precision.DOUBLE) || this;
    }
    return Float64;
}(Float));
export { Float64 };
var Binary = /** @class */ (function (_super) {
    tslib_1.__extends(Binary, _super);
    function Binary() {
        return _super.call(this, Type.Binary) || this;
    }
    Binary.prototype.toString = function () { return "Binary"; };
    Binary[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Uint8Array;
        return proto[Symbol.toStringTag] = 'Binary';
    })(Binary.prototype);
    return Binary;
}(DataType));
export { Binary };
var Utf8 = /** @class */ (function (_super) {
    tslib_1.__extends(Utf8, _super);
    function Utf8() {
        return _super.call(this, Type.Utf8) || this;
    }
    Utf8.prototype.toString = function () { return "Utf8"; };
    Utf8[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Uint8Array;
        return proto[Symbol.toStringTag] = 'Utf8';
    })(Utf8.prototype);
    return Utf8;
}(DataType));
export { Utf8 };
var Bool = /** @class */ (function (_super) {
    tslib_1.__extends(Bool, _super);
    function Bool() {
        return _super.call(this, Type.Bool) || this;
    }
    Bool.prototype.toString = function () { return "Bool"; };
    Bool[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Uint8Array;
        return proto[Symbol.toStringTag] = 'Bool';
    })(Bool.prototype);
    return Bool;
}(DataType));
export { Bool };
var Decimal = /** @class */ (function (_super) {
    tslib_1.__extends(Decimal, _super);
    function Decimal(scale, precision) {
        var _this = _super.call(this, Type.Decimal) || this;
        _this.scale = scale;
        _this.precision = precision;
        return _this;
    }
    Decimal.prototype.toString = function () { return "Decimal[" + this.precision + "e" + (this.scale > 0 ? "+" : "") + this.scale + "]"; };
    Decimal[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Uint32Array;
        return proto[Symbol.toStringTag] = 'Decimal';
    })(Decimal.prototype);
    return Decimal;
}(DataType));
export { Decimal };
var Date_ = /** @class */ (function (_super) {
    tslib_1.__extends(Date_, _super);
    function Date_(unit) {
        var _this = _super.call(this, Type.Date) || this;
        _this.unit = unit;
        return _this;
    }
    Date_.prototype.toString = function () { return "Date" + (this.unit + 1) * 32 + "<" + DateUnit[this.unit] + ">"; };
    Date_[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Int32Array;
        return proto[Symbol.toStringTag] = 'Date';
    })(Date_.prototype);
    return Date_;
}(DataType));
export { Date_ };
var Time = /** @class */ (function (_super) {
    tslib_1.__extends(Time, _super);
    function Time(unit, bitWidth) {
        var _this = _super.call(this, Type.Time) || this;
        _this.unit = unit;
        _this.bitWidth = bitWidth;
        return _this;
    }
    Time.prototype.toString = function () { return "Time" + this.bitWidth + "<" + TimeUnit[this.unit] + ">"; };
    Time[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Uint32Array;
        return proto[Symbol.toStringTag] = 'Time';
    })(Time.prototype);
    return Time;
}(DataType));
export { Time };
var Timestamp = /** @class */ (function (_super) {
    tslib_1.__extends(Timestamp, _super);
    function Timestamp(unit, timezone) {
        var _this = _super.call(this, Type.Timestamp) || this;
        _this.unit = unit;
        _this.timezone = timezone;
        return _this;
    }
    Timestamp.prototype.toString = function () { return "Timestamp<" + TimeUnit[this.unit] + (this.timezone ? ", " + this.timezone : "") + ">"; };
    Timestamp[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Int32Array;
        return proto[Symbol.toStringTag] = 'Timestamp';
    })(Timestamp.prototype);
    return Timestamp;
}(DataType));
export { Timestamp };
var Interval = /** @class */ (function (_super) {
    tslib_1.__extends(Interval, _super);
    function Interval(unit) {
        var _this = _super.call(this, Type.Interval) || this;
        _this.unit = unit;
        return _this;
    }
    Interval.prototype.toString = function () { return "Interval<" + IntervalUnit[this.unit] + ">"; };
    Interval[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Int32Array;
        return proto[Symbol.toStringTag] = 'Interval';
    })(Interval.prototype);
    return Interval;
}(DataType));
export { Interval };
var List = /** @class */ (function (_super) {
    tslib_1.__extends(List, _super);
    function List(children) {
        var _this = _super.call(this, Type.List, children) || this;
        _this.children = children;
        return _this;
    }
    List.prototype.toString = function () { return "List<" + this.valueType + ">"; };
    Object.defineProperty(List.prototype, "ArrayType", {
        get: function () { return this.valueType.ArrayType; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(List.prototype, "valueType", {
        get: function () { return this.children[0].type; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(List.prototype, "valueField", {
        get: function () { return this.children[0]; },
        enumerable: true,
        configurable: true
    });
    List[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'List';
    })(List.prototype);
    return List;
}(DataType));
export { List };
var Struct = /** @class */ (function (_super) {
    tslib_1.__extends(Struct, _super);
    function Struct(children) {
        var _this = _super.call(this, Type.Struct, children) || this;
        _this.children = children;
        return _this;
    }
    Struct.prototype.toString = function () { return "Struct<" + this.children.map(function (f) { return f.type; }).join(", ") + ">"; };
    Struct[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'Struct';
    })(Struct.prototype);
    return Struct;
}(DataType));
export { Struct };
var Union = /** @class */ (function (_super) {
    tslib_1.__extends(Union, _super);
    function Union(mode, typeIds, children) {
        var _this = _super.call(this, (mode === UnionMode.Sparse ? Type.SparseUnion : Type.DenseUnion), children) || this;
        _this.mode = mode;
        _this.typeIds = typeIds;
        _this.children = children;
        return _this;
    }
    Union.prototype.toString = function () { return this[Symbol.toStringTag] + "<" + this.typeIds.map(function (x) { return Type[x]; }).join(" | ") + ">"; };
    Union[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Int8Array;
        return proto[Symbol.toStringTag] = 'Union';
    })(Union.prototype);
    return Union;
}(DataType));
export { Union };
var DenseUnion = /** @class */ (function (_super) {
    tslib_1.__extends(DenseUnion, _super);
    function DenseUnion(typeIds, children) {
        return _super.call(this, UnionMode.Dense, typeIds, children) || this;
    }
    DenseUnion[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'DenseUnion';
    })(DenseUnion.prototype);
    return DenseUnion;
}(Union));
export { DenseUnion };
var SparseUnion = /** @class */ (function (_super) {
    tslib_1.__extends(SparseUnion, _super);
    function SparseUnion(typeIds, children) {
        return _super.call(this, UnionMode.Sparse, typeIds, children) || this;
    }
    SparseUnion[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'SparseUnion';
    })(SparseUnion.prototype);
    return SparseUnion;
}(Union));
export { SparseUnion };
var FixedSizeBinary = /** @class */ (function (_super) {
    tslib_1.__extends(FixedSizeBinary, _super);
    function FixedSizeBinary(byteWidth) {
        var _this = _super.call(this, Type.FixedSizeBinary) || this;
        _this.byteWidth = byteWidth;
        return _this;
    }
    FixedSizeBinary.prototype.toString = function () { return "FixedSizeBinary[" + this.byteWidth + "]"; };
    FixedSizeBinary[Symbol.toStringTag] = (function (proto) {
        proto.ArrayType = Uint8Array;
        return proto[Symbol.toStringTag] = 'FixedSizeBinary';
    })(FixedSizeBinary.prototype);
    return FixedSizeBinary;
}(DataType));
export { FixedSizeBinary };
var FixedSizeList = /** @class */ (function (_super) {
    tslib_1.__extends(FixedSizeList, _super);
    function FixedSizeList(listSize, children) {
        var _this = _super.call(this, Type.FixedSizeList, children) || this;
        _this.listSize = listSize;
        _this.children = children;
        return _this;
    }
    Object.defineProperty(FixedSizeList.prototype, "ArrayType", {
        get: function () { return this.valueType.ArrayType; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FixedSizeList.prototype, "valueType", {
        get: function () { return this.children[0].type; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FixedSizeList.prototype, "valueField", {
        get: function () { return this.children[0]; },
        enumerable: true,
        configurable: true
    });
    FixedSizeList.prototype.toString = function () { return "FixedSizeList[" + this.listSize + "]<" + this.valueType + ">"; };
    FixedSizeList[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'FixedSizeList';
    })(FixedSizeList.prototype);
    return FixedSizeList;
}(DataType));
export { FixedSizeList };
var Map_ = /** @class */ (function (_super) {
    tslib_1.__extends(Map_, _super);
    function Map_(keysSorted, children) {
        var _this = _super.call(this, Type.Map, children) || this;
        _this.keysSorted = keysSorted;
        _this.children = children;
        return _this;
    }
    Map_.prototype.toString = function () { return "Map<" + this.children.join(", ") + ">"; };
    Map_[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'Map_';
    })(Map_.prototype);
    return Map_;
}(DataType));
export { Map_ };
var Dictionary = /** @class */ (function (_super) {
    tslib_1.__extends(Dictionary, _super);
    function Dictionary(dictionary, indices, id, isOrdered) {
        var _this = _super.call(this, Type.Dictionary) || this;
        _this.indices = indices;
        _this.dictionary = dictionary;
        _this.isOrdered = isOrdered || false;
        _this.id = id == null ? DictionaryBatch.getId() : typeof id === 'number' ? id : id.low;
        return _this;
    }
    Object.defineProperty(Dictionary.prototype, "ArrayType", {
        get: function () { return this.dictionary.ArrayType; },
        enumerable: true,
        configurable: true
    });
    Dictionary.prototype.toString = function () { return "Dictionary<" + this.indices + ", " + this.dictionary + ">"; };
    Dictionary[Symbol.toStringTag] = (function (proto) {
        return proto[Symbol.toStringTag] = 'Dictionary';
    })(Dictionary.prototype);
    return Dictionary;
}(DataType));
export { Dictionary };

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LFNBQVMsR0FBRyxTQUFTLElBQUksS0FBSyxDQUFDO1FBQ3BDLEtBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQzs7SUFDMUYsQ0FBQztJQUNELHNCQUFXLGlDQUFTO2FBQXBCLGNBQXlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBQ3JELDZCQUFRLEdBQWYsY0FBb0IsTUFBTSxDQUFDLGdCQUFjLElBQUksQ0FBQyxPQUFPLFVBQUssSUFBSSxDQUFDLFVBQVUsTUFBRyxDQUFDLENBQUMsQ0FBQztJQUM5RCxXQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBaUI7UUFDdkQsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsWUFBWSxDQUFDO0lBQ3BELENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM3QixpQkFBQztDQWpCRCxBQWlCQyxDQWpCbUQsUUFBUSxHQWlCM0Q7U0FqQlksVUFBVSIsImZpbGUiOiJ0eXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuLy8gb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4vLyBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuLy8gcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuLy8gdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuLy8gXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4vLyB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4vLyBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuLy8gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbi8vIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuLy8gc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuLy8gdW5kZXIgdGhlIExpY2Vuc2UuXG5cbmltcG9ydCAqIGFzIFNjaGVtYV8gZnJvbSAnLi9mYi9TY2hlbWEnO1xuaW1wb3J0ICogYXMgTWVzc2FnZV8gZnJvbSAnLi9mYi9NZXNzYWdlJztcbmltcG9ydCB7IFZlY3RvciwgVmlldyB9IGZyb20gJy4vdmVjdG9yJztcbmltcG9ydCB7IGZsYXRidWZmZXJzIH0gZnJvbSAnZmxhdGJ1ZmZlcnMnO1xuaW1wb3J0IHsgRGljdGlvbmFyeUJhdGNoIH0gZnJvbSAnLi9pcGMvbWV0YWRhdGEnO1xuaW1wb3J0IHsgVHlwZVZpc2l0b3IsIFZpc2l0b3JOb2RlIH0gZnJvbSAnLi92aXNpdG9yJztcblxuZXhwb3J0IGltcG9ydCBMb25nID0gZmxhdGJ1ZmZlcnMuTG9uZztcbmV4cG9ydCBpbXBvcnQgQXJyb3dUeXBlID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuVHlwZTtcbmV4cG9ydCBpbXBvcnQgRGF0ZVVuaXQgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5EYXRlVW5pdDtcbmV4cG9ydCBpbXBvcnQgVGltZVVuaXQgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5UaW1lVW5pdDtcbmV4cG9ydCBpbXBvcnQgUHJlY2lzaW9uID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuUHJlY2lzaW9uO1xuZXhwb3J0IGltcG9ydCBVbmlvbk1vZGUgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5Vbmlvbk1vZGU7XG5leHBvcnQgaW1wb3J0IFZlY3RvclR5cGUgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5WZWN0b3JUeXBlO1xuZXhwb3J0IGltcG9ydCBJbnRlcnZhbFVuaXQgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5JbnRlcnZhbFVuaXQ7XG5leHBvcnQgaW1wb3J0IE1lc3NhZ2VIZWFkZXIgPSBNZXNzYWdlXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuTWVzc2FnZUhlYWRlcjtcbmV4cG9ydCBpbXBvcnQgTWV0YWRhdGFWZXJzaW9uID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuTWV0YWRhdGFWZXJzaW9uO1xuXG5leHBvcnQgY2xhc3MgU2NoZW1hIHtcbiAgICBwdWJsaWMgc3RhdGljIGZyb20odmVjdG9yczogVmVjdG9yW10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTY2hlbWEodmVjdG9ycy5tYXAoKHYsIGkpID0+IG5ldyBGaWVsZCgnJyArIGksIHYudHlwZSkpKTtcbiAgICB9XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHByb3RlY3RlZCBfYm9keUxlbmd0aDogbnVtYmVyO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwcm90ZWN0ZWQgX2hlYWRlclR5cGU6IE1lc3NhZ2VIZWFkZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IGZpZWxkczogRmllbGRbXTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdmVyc2lvbjogTWV0YWRhdGFWZXJzaW9uO1xuICAgIHB1YmxpYyByZWFkb25seSBtZXRhZGF0YT86IE1hcDxzdHJpbmcsIHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGRpY3Rpb25hcmllczogTWFwPG51bWJlciwgRmllbGQ8RGljdGlvbmFyeT4+O1xuICAgIGNvbnN0cnVjdG9yKGZpZWxkczogRmllbGRbXSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YT86IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogTWV0YWRhdGFWZXJzaW9uID0gTWV0YWRhdGFWZXJzaW9uLlY0LFxuICAgICAgICAgICAgICAgIGRpY3Rpb25hcmllczogTWFwPG51bWJlciwgRmllbGQ8RGljdGlvbmFyeT4+ID0gbmV3IE1hcCgpKSB7XG4gICAgICAgIHRoaXMuZmllbGRzID0gZmllbGRzO1xuICAgICAgICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICB0aGlzLm1ldGFkYXRhID0gbWV0YWRhdGE7XG4gICAgICAgIHRoaXMuZGljdGlvbmFyaWVzID0gZGljdGlvbmFyaWVzO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0IGJvZHlMZW5ndGgoKSB7IHJldHVybiB0aGlzLl9ib2R5TGVuZ3RoOyB9XG4gICAgcHVibGljIGdldCBoZWFkZXJUeXBlKCkgeyByZXR1cm4gdGhpcy5faGVhZGVyVHlwZTsgfVxuICAgIHB1YmxpYyBzZWxlY3QoLi4uZmllbGROYW1lczogc3RyaW5nW10pOiBTY2hlbWEge1xuICAgICAgICBjb25zdCBuYW1lc1RvS2VlcCA9IGZpZWxkTmFtZXMucmVkdWNlKCh4cywgeCkgPT4gKHhzW3hdID0gdHJ1ZSkgJiYgeHMsIE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICAgICAgICBjb25zdCBuZXdEaWN0RmllbGRzID0gbmV3IE1hcCgpLCBuZXdGaWVsZHMgPSB0aGlzLmZpZWxkcy5maWx0ZXIoKGYpID0+IG5hbWVzVG9LZWVwW2YubmFtZV0pO1xuICAgICAgICB0aGlzLmRpY3Rpb25hcmllcy5mb3JFYWNoKChmLCBkaWN0SWQpID0+IChuYW1lc1RvS2VlcFtmLm5hbWVdKSAmJiBuZXdEaWN0RmllbGRzLnNldChkaWN0SWQsIGYpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTY2hlbWEobmV3RmllbGRzLCB0aGlzLm1ldGFkYXRhLCB0aGlzLnZlcnNpb24sIG5ld0RpY3RGaWVsZHMpO1xuICAgIH1cbiAgICBwdWJsaWMgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90b3R5cGU6IFNjaGVtYSkgPT4ge1xuICAgICAgICBwcm90b3R5cGUuX2JvZHlMZW5ndGggPSAwO1xuICAgICAgICBwcm90b3R5cGUuX2hlYWRlclR5cGUgPSBNZXNzYWdlSGVhZGVyLlNjaGVtYTtcbiAgICAgICAgcmV0dXJuICdTY2hlbWEnO1xuICAgIH0pKFNjaGVtYS5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgY2xhc3MgRmllbGQ8VCBleHRlbmRzIERhdGFUeXBlID0gRGF0YVR5cGU+IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdHlwZTogVDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xuICAgIHB1YmxpYyByZWFkb25seSBudWxsYWJsZTogYm9vbGVhbjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbWV0YWRhdGE/OiBNYXA8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHR5cGU6IFQsIG51bGxhYmxlID0gZmFsc2UsIG1ldGFkYXRhPzogTWFwPHN0cmluZywgc3RyaW5nPiB8IG51bGwpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5udWxsYWJsZSA9IG51bGxhYmxlO1xuICAgICAgICB0aGlzLm1ldGFkYXRhID0gbWV0YWRhdGE7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGAke3RoaXMubmFtZX06ICR7dGhpcy50eXBlfWA7IH1cbiAgICBwdWJsaWMgZ2V0IHR5cGVJZCgpOiBUWydUVHlwZSddIHsgcmV0dXJuIHRoaXMudHlwZS5UVHlwZTsgfVxuICAgIHB1YmxpYyBnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKTogc3RyaW5nIHsgcmV0dXJuICdGaWVsZCc7IH1cbiAgICBwdWJsaWMgZ2V0IGluZGljZXMoKTogVCB8IEludDxhbnk+IHtcbiAgICAgICAgcmV0dXJuIERhdGFUeXBlLmlzRGljdGlvbmFyeSh0aGlzLnR5cGUpID8gdGhpcy50eXBlLmluZGljZXMgOiB0aGlzLnR5cGU7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBUaW1lQml0V2lkdGggPSAzMiB8IDY0O1xuZXhwb3J0IHR5cGUgSW50Qml0V2lkdGggPSA4IHwgMTYgfCAzMiB8IDY0O1xuXG5leHBvcnQgdHlwZSBOdW1lcmljVHlwZSA9IEludCB8IEZsb2F0IHwgRGF0ZV8gfCBUaW1lIHwgSW50ZXJ2YWwgfCBUaW1lc3RhbXA7XG5leHBvcnQgdHlwZSBGaXhlZFNpemVUeXBlID0gSW50NjQgfCAgVWludDY0IHwgRGVjaW1hbCB8IEZpeGVkU2l6ZUJpbmFyeTtcbmV4cG9ydCB0eXBlIFByaW1pdGl2ZVR5cGUgPSBOdW1lcmljVHlwZSB8IEZpeGVkU2l6ZVR5cGU7XG5cbmV4cG9ydCB0eXBlIEZsYXRMaXN0VHlwZSA9IFV0ZjggfCBCaW5hcnk7IC8vIDwtLSB0aGVzZSB0eXBlcyBoYXZlIGBvZmZzZXRgLCBgZGF0YWAsIGFuZCBgdmFsaWRpdHlgIGJ1ZmZlcnNcbmV4cG9ydCB0eXBlIEZsYXRUeXBlID0gQm9vbCB8IFByaW1pdGl2ZVR5cGUgfCBGbGF0TGlzdFR5cGU7IC8vIDwtLSB0aGVzZSB0eXBlcyBoYXZlIGBkYXRhYCBhbmQgYHZhbGlkaXR5YCBidWZmZXJzXG5leHBvcnQgdHlwZSBMaXN0VHlwZSA9IExpc3Q8YW55PjsgLy8gPC0tIHRoZXNlIHR5cGVzIGhhdmUgYG9mZnNldGAgYW5kIGB2YWxpZGl0eWAgYnVmZmVyc1xuZXhwb3J0IHR5cGUgTmVzdGVkVHlwZSA9IE1hcF8gfCBTdHJ1Y3QgfCBMaXN0PGFueT4gfCBGaXhlZFNpemVMaXN0PGFueT4gfCBVbmlvbjxhbnk+OyAvLyA8LS0gdGhlc2UgdHlwZXMgaGF2ZSBgdmFsaWRpdHlgIGJ1ZmZlciBhbmQgbmVzdGVkIGNoaWxkRGF0YVxuZXhwb3J0IHR5cGUgU2luZ2xlTmVzdGVkVHlwZSA9IExpc3Q8YW55PiB8IEZpeGVkU2l6ZUxpc3Q8YW55PjsgLy8gPC0tIHRoZXNlIGFyZSBuZXN0ZWQgdHlwZXMgdGhhdCBjYW4gb25seSBoYXZlIGEgc2luZ2xlIGNoaWxkXG5cbi8qKlxuICogKlxuICogTWFpbiBkYXRhIHR5cGUgZW51bWVyYXRpb246XG4gKiAqXG4gKiBEYXRhIHR5cGVzIGluIHRoaXMgbGlicmFyeSBhcmUgYWxsICpsb2dpY2FsKi4gVGhleSBjYW4gYmUgZXhwcmVzc2VkIGFzXG4gKiBlaXRoZXIgYSBwcmltaXRpdmUgcGh5c2ljYWwgdHlwZSAoYnl0ZXMgb3IgYml0cyBvZiBzb21lIGZpeGVkIHNpemUpLCBhXG4gKiBuZXN0ZWQgdHlwZSBjb25zaXN0aW5nIG9mIG90aGVyIGRhdGEgdHlwZXMsIG9yIGFub3RoZXIgZGF0YSB0eXBlIChlLmcuIGFcbiAqIHRpbWVzdGFtcCBlbmNvZGVkIGFzIGFuIGludDY0KVxuICovXG4gZXhwb3J0IGVudW0gVHlwZSB7XG4gICAgTk9ORSAgICAgICAgICAgID0gIDAsICAvLyBUaGUgZGVmYXVsdCBwbGFjZWhvbGRlciB0eXBlXG4gICAgTnVsbCAgICAgICAgICAgID0gIDEsICAvLyBBIE5VTEwgdHlwZSBoYXZpbmcgbm8gcGh5c2ljYWwgc3RvcmFnZVxuICAgIEludCAgICAgICAgICAgICA9ICAyLCAgLy8gU2lnbmVkIG9yIHVuc2lnbmVkIDgsIDE2LCAzMiwgb3IgNjQtYml0IGxpdHRsZS1lbmRpYW4gaW50ZWdlclxuICAgIEZsb2F0ICAgICAgICAgICA9ICAzLCAgLy8gMiwgNCwgb3IgOC1ieXRlIGZsb2F0aW5nIHBvaW50IHZhbHVlXG4gICAgQmluYXJ5ICAgICAgICAgID0gIDQsICAvLyBWYXJpYWJsZS1sZW5ndGggYnl0ZXMgKG5vIGd1YXJhbnRlZSBvZiBVVEY4LW5lc3MpXG4gICAgVXRmOCAgICAgICAgICAgID0gIDUsICAvLyBVVEY4IHZhcmlhYmxlLWxlbmd0aCBzdHJpbmcgYXMgTGlzdDxDaGFyPlxuICAgIEJvb2wgICAgICAgICAgICA9ICA2LCAgLy8gQm9vbGVhbiBhcyAxIGJpdCwgTFNCIGJpdC1wYWNrZWQgb3JkZXJpbmdcbiAgICBEZWNpbWFsICAgICAgICAgPSAgNywgIC8vIFByZWNpc2lvbi1hbmQtc2NhbGUtYmFzZWQgZGVjaW1hbCB0eXBlLiBTdG9yYWdlIHR5cGUgZGVwZW5kcyBvbiB0aGUgcGFyYW1ldGVycy5cbiAgICBEYXRlICAgICAgICAgICAgPSAgOCwgIC8vIGludDMyX3QgZGF5cyBvciBpbnQ2NF90IG1pbGxpc2Vjb25kcyBzaW5jZSB0aGUgVU5JWCBlcG9jaFxuICAgIFRpbWUgICAgICAgICAgICA9ICA5LCAgLy8gVGltZSBhcyBzaWduZWQgMzIgb3IgNjQtYml0IGludGVnZXIsIHJlcHJlc2VudGluZyBlaXRoZXIgc2Vjb25kcywgbWlsbGlzZWNvbmRzLCBtaWNyb3NlY29uZHMsIG9yIG5hbm9zZWNvbmRzIHNpbmNlIG1pZG5pZ2h0IHNpbmNlIG1pZG5pZ2h0XG4gICAgVGltZXN0YW1wICAgICAgID0gMTAsICAvLyBFeGFjdCB0aW1lc3RhbXAgZW5jb2RlZCB3aXRoIGludDY0IHNpbmNlIFVOSVggZXBvY2ggKERlZmF1bHQgdW5pdCBtaWxsaXNlY29uZClcbiAgICBJbnRlcnZhbCAgICAgICAgPSAxMSwgIC8vIFlFQVJfTU9OVEggb3IgREFZX1RJTUUgaW50ZXJ2YWwgaW4gU1FMIHN0eWxlXG4gICAgTGlzdCAgICAgICAgICAgID0gMTIsICAvLyBBIGxpc3Qgb2Ygc29tZSBsb2dpY2FsIGRhdGEgdHlwZVxuICAgIFN0cnVjdCAgICAgICAgICA9IDEzLCAgLy8gU3RydWN0IG9mIGxvZ2ljYWwgdHlwZXNcbiAgICBVbmlvbiAgICAgICAgICAgPSAxNCwgIC8vIFVuaW9uIG9mIGxvZ2ljYWwgdHlwZXNcbiAgICBGaXhlZFNpemVCaW5hcnkgPSAxNSwgIC8vIEZpeGVkLXNpemUgYmluYXJ5LiBFYWNoIHZhbHVlIG9jY3VwaWVzIHRoZSBzYW1lIG51bWJlciBvZiBieXRlc1xuICAgIEZpeGVkU2l6ZUxpc3QgICA9IDE2LCAgLy8gRml4ZWQtc2l6ZSBsaXN0LiBFYWNoIHZhbHVlIG9jY3VwaWVzIHRoZSBzYW1lIG51bWJlciBvZiBieXRlc1xuICAgIE1hcCAgICAgICAgICAgICA9IDE3LCAgLy8gTWFwIG9mIG5hbWVkIGxvZ2ljYWwgdHlwZXNcbiAgICBEaWN0aW9uYXJ5ICAgICAgPSAnRGljdGlvbmFyeScsICAvLyBEaWN0aW9uYXJ5IGFrYSBDYXRlZ29yeSB0eXBlXG4gICAgRGVuc2VVbmlvbiAgICAgID0gJ0RlbnNlVW5pb24nLCAgLy8gRGVuc2UgVW5pb24gb2YgbG9naWNhbCB0eXBlc1xuICAgIFNwYXJzZVVuaW9uICAgICA9ICdTcGFyc2VVbmlvbicsICAvLyBTcGFyc2UgVW5pb24gb2YgbG9naWNhbCB0eXBlc1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFUeXBlPFRUeXBlIGV4dGVuZHMgVHlwZSA9IGFueT4ge1xuICAgIHJlYWRvbmx5IFRUeXBlOiBUVHlwZTtcbiAgICByZWFkb25seSBUQXJyYXk6IGFueTtcbiAgICByZWFkb25seSBUVmFsdWU6IGFueTtcbiAgICByZWFkb25seSBBcnJheVR5cGU6IGFueTtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIERhdGFUeXBlPFRUeXBlIGV4dGVuZHMgVHlwZSA9IGFueT4gaW1wbGVtZW50cyBQYXJ0aWFsPFZpc2l0b3JOb2RlPiB7XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHVibGljIFtTeW1ib2wudG9TdHJpbmdUYWddOiBzdHJpbmc7XG5cbiAgICBzdGF0aWMgICAgICAgICAgICBpc051bGwgKHg6IGFueSk6IHggaXMgTnVsbCAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5OdWxsOyAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICAgaXNJbnQgKHg6IGFueSk6IHggaXMgSW50ICAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5JbnQ7ICAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgIGlzRmxvYXQgKHg6IGFueSk6IHggaXMgRmxvYXQgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5GbG9hdDsgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgaXNCaW5hcnkgKHg6IGFueSk6IHggaXMgQmluYXJ5ICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5CaW5hcnk7ICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICBpc1V0ZjggKHg6IGFueSk6IHggaXMgVXRmOCAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5VdGY4OyAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICBpc0Jvb2wgKHg6IGFueSk6IHggaXMgQm9vbCAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5Cb29sOyAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICBpc0RlY2ltYWwgKHg6IGFueSk6IHggaXMgRGVjaW1hbCAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5EZWNpbWFsOyAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICBpc0RhdGUgKHg6IGFueSk6IHggaXMgRGF0ZV8gICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5EYXRlOyAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICBpc1RpbWUgKHg6IGFueSk6IHggaXMgVGltZSAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5UaW1lOyAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgaXNUaW1lc3RhbXAgKHg6IGFueSk6IHggaXMgVGltZXN0YW1wICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5UaW1lc3RhbXA7ICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgIGlzSW50ZXJ2YWwgKHg6IGFueSk6IHggaXMgSW50ZXJ2YWwgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5JbnRlcnZhbDsgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICBpc0xpc3QgKHg6IGFueSk6IHggaXMgTGlzdCAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5MaXN0OyAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgaXNTdHJ1Y3QgKHg6IGFueSk6IHggaXMgU3RydWN0ICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5TdHJ1Y3Q7ICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgIGlzVW5pb24gKHg6IGFueSk6IHggaXMgVW5pb24gICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5VbmlvbjsgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICBpc0RlbnNlVW5pb24gKHg6IGFueSk6IHggaXMgRGVuc2VVbmlvbiAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5EZW5zZVVuaW9uOyAgICAgIH1cbiAgICBzdGF0aWMgICAgIGlzU3BhcnNlVW5pb24gKHg6IGFueSk6IHggaXMgU3BhcnNlVW5pb24gICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5TcGFyc2VVbmlvbjsgICAgIH1cbiAgICBzdGF0aWMgaXNGaXhlZFNpemVCaW5hcnkgKHg6IGFueSk6IHggaXMgRml4ZWRTaXplQmluYXJ5IHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5GaXhlZFNpemVCaW5hcnk7IH1cbiAgICBzdGF0aWMgICBpc0ZpeGVkU2l6ZUxpc3QgKHg6IGFueSk6IHggaXMgRml4ZWRTaXplTGlzdCAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5GaXhlZFNpemVMaXN0OyAgIH1cbiAgICBzdGF0aWMgICAgICAgICAgICAgaXNNYXAgKHg6IGFueSk6IHggaXMgTWFwXyAgICAgICAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5NYXA7ICAgICAgICAgICAgIH1cbiAgICBzdGF0aWMgICAgICBpc0RpY3Rpb25hcnkgKHg6IGFueSk6IHggaXMgRGljdGlvbmFyeSAgICAgIHsgcmV0dXJuIHggJiYgeC5UVHlwZSA9PT0gVHlwZS5EaWN0aW9uYXJ5OyAgICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBUVHlwZTogVFR5cGUsXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGNoaWxkcmVuPzogRmllbGRbXSkge31cbiAgICBwdWJsaWMgYWNjZXB0VHlwZVZpc2l0b3IodmlzaXRvcjogVHlwZVZpc2l0b3IpOiBhbnkge1xuICAgICAgICByZXR1cm4gVHlwZVZpc2l0b3IudmlzaXRUeXBlSW5saW5lKHZpc2l0b3IsIHRoaXMpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogRGF0YVR5cGUpID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBBcnJheTtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnRGF0YVR5cGUnO1xuICAgIH0pKERhdGFUeXBlLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTnVsbCBleHRlbmRzIERhdGFUeXBlPFR5cGUuTnVsbD4geyBUQXJyYXk6IHZvaWQ7IFRWYWx1ZTogbnVsbDsgfVxuZXhwb3J0IGNsYXNzIE51bGwgZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLk51bGw+IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5OdWxsKTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKCkgeyByZXR1cm4gYE51bGxgOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IE51bGwpID0+IHtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnTnVsbCc7XG4gICAgfSkoTnVsbC5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludDxUVmFsdWVUeXBlID0gYW55LCBUQXJyYXlUeXBlIGV4dGVuZHMgSW50QXJyYXkgPSBJbnRBcnJheT4gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkludD4geyBUQXJyYXk6IFRBcnJheVR5cGU7IFRWYWx1ZTogVFZhbHVlVHlwZTsgfVxuZXhwb3J0IGNsYXNzIEludDxUVmFsdWVUeXBlID0gYW55LCBUQXJyYXlUeXBlIGV4dGVuZHMgSW50QXJyYXkgPSBJbnRBcnJheT4gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkludD4ge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBpc1NpZ25lZDogYm9vbGVhbixcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYml0V2lkdGg6IEludEJpdFdpZHRoKSB7XG4gICAgICAgIHN1cGVyKFR5cGUuSW50KTtcbiAgICB9XG4gICAgcHVibGljIGdldCBBcnJheVR5cGUoKTogVHlwZWRBcnJheUNvbnN0cnVjdG9yPFRBcnJheVR5cGU+IHtcbiAgICAgICAgc3dpdGNoICh0aGlzLmJpdFdpZHRoKSB7XG4gICAgICAgICAgICBjYXNlICA4OiByZXR1cm4gKHRoaXMuaXNTaWduZWQgPyAgSW50OEFycmF5IDogIFVpbnQ4QXJyYXkpIGFzIGFueTtcbiAgICAgICAgICAgIGNhc2UgMTY6IHJldHVybiAodGhpcy5pc1NpZ25lZCA/IEludDE2QXJyYXkgOiBVaW50MTZBcnJheSkgYXMgYW55O1xuICAgICAgICAgICAgY2FzZSAzMjogcmV0dXJuICh0aGlzLmlzU2lnbmVkID8gSW50MzJBcnJheSA6IFVpbnQzMkFycmF5KSBhcyBhbnk7XG4gICAgICAgICAgICBjYXNlIDY0OiByZXR1cm4gKHRoaXMuaXNTaWduZWQgPyBJbnQzMkFycmF5IDogVWludDMyQXJyYXkpIGFzIGFueTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCAke3RoaXNbU3ltYm9sLnRvU3RyaW5nVGFnXX0gdHlwZWApO1xuICAgIH1cbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7IHJldHVybiBgJHt0aGlzLmlzU2lnbmVkID8gYElgIDogYFVpYH1udCR7dGhpcy5iaXRXaWR0aH1gOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IEludCkgPT4ge1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdJbnQnO1xuICAgIH0pKEludC5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgY2xhc3MgSW50OCBleHRlbmRzIEludDxudW1iZXIsIEludDhBcnJheT4geyBjb25zdHJ1Y3RvcigpIHsgc3VwZXIodHJ1ZSwgOCk7IH0gfVxuZXhwb3J0IGNsYXNzIEludDE2IGV4dGVuZHMgSW50PG51bWJlciwgSW50MTZBcnJheT4geyBjb25zdHJ1Y3RvcigpIHsgc3VwZXIodHJ1ZSwgMTYpOyB9IH1cbmV4cG9ydCBjbGFzcyBJbnQzMiBleHRlbmRzIEludDxudW1iZXIsIEludDMyQXJyYXk+IHsgY29uc3RydWN0b3IoKSB7IHN1cGVyKHRydWUsIDMyKTsgfSB9XG5leHBvcnQgY2xhc3MgSW50NjQgZXh0ZW5kcyBJbnQ8SW50MzJBcnJheSwgSW50MzJBcnJheT4geyBjb25zdHJ1Y3RvcigpIHsgc3VwZXIodHJ1ZSwgNjQpOyB9IH1cbmV4cG9ydCBjbGFzcyBVaW50OCBleHRlbmRzIEludDxudW1iZXIsIFVpbnQ4QXJyYXk+IHsgY29uc3RydWN0b3IoKSB7IHN1cGVyKGZhbHNlLCA4KTsgfSB9XG5leHBvcnQgY2xhc3MgVWludDE2IGV4dGVuZHMgSW50PG51bWJlciwgVWludDE2QXJyYXk+IHsgY29uc3RydWN0b3IoKSB7IHN1cGVyKGZhbHNlLCAxNik7IH0gfVxuZXhwb3J0IGNsYXNzIFVpbnQzMiBleHRlbmRzIEludDxudW1iZXIsIFVpbnQzMkFycmF5PiB7IGNvbnN0cnVjdG9yKCkgeyBzdXBlcihmYWxzZSwgMzIpOyB9IH1cbmV4cG9ydCBjbGFzcyBVaW50NjQgZXh0ZW5kcyBJbnQ8VWludDMyQXJyYXksIFVpbnQzMkFycmF5PiB7IGNvbnN0cnVjdG9yKCkgeyBzdXBlcihmYWxzZSwgNjQpOyB9IH1cblxuZXhwb3J0IGludGVyZmFjZSBGbG9hdDxUQXJyYXlUeXBlIGV4dGVuZHMgRmxvYXRBcnJheSA9IEZsb2F0QXJyYXk+IGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5GbG9hdD4geyBUQXJyYXk6IFRBcnJheVR5cGU7IFRWYWx1ZTogbnVtYmVyOyB9XG5leHBvcnQgY2xhc3MgRmxvYXQ8VEFycmF5VHlwZSBleHRlbmRzIEZsb2F0QXJyYXkgPSBGbG9hdEFycmF5PiBleHRlbmRzIERhdGFUeXBlPFR5cGUuRmxvYXQ+IHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgcHJlY2lzaW9uOiBQcmVjaXNpb24pIHtcbiAgICAgICAgc3VwZXIoVHlwZS5GbG9hdCk7XG4gICAgfVxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwdWJsaWMgZ2V0IEFycmF5VHlwZSgpOiBUeXBlZEFycmF5Q29uc3RydWN0b3I8VEFycmF5VHlwZT4ge1xuICAgICAgICBzd2l0Y2ggKHRoaXMucHJlY2lzaW9uKSB7XG4gICAgICAgICAgICBjYXNlIFByZWNpc2lvbi5IQUxGOiByZXR1cm4gVWludDE2QXJyYXkgYXMgYW55O1xuICAgICAgICAgICAgY2FzZSBQcmVjaXNpb24uU0lOR0xFOiByZXR1cm4gRmxvYXQzMkFycmF5IGFzIGFueTtcbiAgICAgICAgICAgIGNhc2UgUHJlY2lzaW9uLkRPVUJMRTogcmV0dXJuIEZsb2F0NjRBcnJheSBhcyBhbnk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgJHt0aGlzW1N5bWJvbC50b1N0cmluZ1RhZ119IHR5cGVgKTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKCkgeyByZXR1cm4gYEZsb2F0JHsodGhpcy5wcmVjaXNpb24gPDwgNSkgfHwgMTZ9YDsgfVxuICAgIHByb3RlY3RlZCBzdGF0aWMgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAoKHByb3RvOiBGbG9hdCkgPT4ge1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdGbG9hdCc7XG4gICAgfSkoRmxvYXQucHJvdG90eXBlKTtcbn1cblxuZXhwb3J0IGNsYXNzIEZsb2F0MTYgZXh0ZW5kcyBGbG9hdDxVaW50MTZBcnJheT4geyBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoUHJlY2lzaW9uLkhBTEYpOyB9IH1cbmV4cG9ydCBjbGFzcyBGbG9hdDMyIGV4dGVuZHMgRmxvYXQ8RmxvYXQzMkFycmF5PiB7IGNvbnN0cnVjdG9yKCkgeyBzdXBlcihQcmVjaXNpb24uU0lOR0xFKTsgfSB9XG5leHBvcnQgY2xhc3MgRmxvYXQ2NCBleHRlbmRzIEZsb2F0PEZsb2F0NjRBcnJheT4geyBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoUHJlY2lzaW9uLkRPVUJMRSk7IH0gfVxuXG5leHBvcnQgaW50ZXJmYWNlIEJpbmFyeSBleHRlbmRzIERhdGFUeXBlPFR5cGUuQmluYXJ5PiB7IFRBcnJheTogVWludDhBcnJheTsgVFZhbHVlOiBVaW50OEFycmF5OyB9XG5leHBvcnQgY2xhc3MgQmluYXJ5IGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5CaW5hcnk+IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5CaW5hcnkpO1xuICAgIH1cbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7IHJldHVybiBgQmluYXJ5YDsgfVxuICAgIHByb3RlY3RlZCBzdGF0aWMgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAoKHByb3RvOiBCaW5hcnkpID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBVaW50OEFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdCaW5hcnknO1xuICAgIH0pKEJpbmFyeS5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFV0ZjggZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLlV0Zjg+IHsgVEFycmF5OiBVaW50OEFycmF5OyBUVmFsdWU6IHN0cmluZzsgfVxuZXhwb3J0IGNsYXNzIFV0ZjggZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLlV0Zjg+IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5VdGY4KTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKCkgeyByZXR1cm4gYFV0ZjhgOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IFV0ZjgpID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBVaW50OEFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdVdGY4JztcbiAgICB9KShVdGY4LnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQm9vbCBleHRlbmRzIERhdGFUeXBlPFR5cGUuQm9vbD4geyBUQXJyYXk6IFVpbnQ4QXJyYXk7IFRWYWx1ZTogYm9vbGVhbjsgfVxuZXhwb3J0IGNsYXNzIEJvb2wgZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkJvb2w+IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5Cb29sKTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKCkgeyByZXR1cm4gYEJvb2xgOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IEJvb2wpID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBVaW50OEFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdCb29sJztcbiAgICB9KShCb29sLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVjaW1hbCBleHRlbmRzIERhdGFUeXBlPFR5cGUuRGVjaW1hbD4geyBUQXJyYXk6IFVpbnQzMkFycmF5OyBUVmFsdWU6IFVpbnQzMkFycmF5OyB9XG5leHBvcnQgY2xhc3MgRGVjaW1hbCBleHRlbmRzIERhdGFUeXBlPFR5cGUuRGVjaW1hbD4ge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBzY2FsZTogbnVtYmVyLFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBwcmVjaXNpb246IG51bWJlcikge1xuICAgICAgICBzdXBlcihUeXBlLkRlY2ltYWwpO1xuICAgIH1cbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7IHJldHVybiBgRGVjaW1hbFske3RoaXMucHJlY2lzaW9ufWUke3RoaXMuc2NhbGUgPiAwID8gYCtgIDogYGB9JHt0aGlzLnNjYWxlfV1gOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IERlY2ltYWwpID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBVaW50MzJBcnJheTtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnRGVjaW1hbCc7XG4gICAgfSkoRGVjaW1hbC5wcm90b3R5cGUpO1xufVxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTpjbGFzcy1uYW1lICovXG5leHBvcnQgaW50ZXJmYWNlIERhdGVfIGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5EYXRlPiB7IFRBcnJheTogSW50MzJBcnJheTsgVFZhbHVlOiBEYXRlOyB9XG5leHBvcnQgY2xhc3MgRGF0ZV8gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkRhdGU+IHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgdW5pdDogRGF0ZVVuaXQpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5EYXRlKTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKCkgeyByZXR1cm4gYERhdGUkeyh0aGlzLnVuaXQgKyAxKSAqIDMyfTwke0RhdGVVbml0W3RoaXMudW5pdF19PmA7IH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogRGF0ZV8pID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBJbnQzMkFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdEYXRlJztcbiAgICB9KShEYXRlXy5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRpbWUgZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLlRpbWU+IHsgVEFycmF5OiBVaW50MzJBcnJheTsgVFZhbHVlOiBudW1iZXI7IH1cbmV4cG9ydCBjbGFzcyBUaW1lIGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5UaW1lPiB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHVuaXQ6IFRpbWVVbml0LFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaXRXaWR0aDogVGltZUJpdFdpZHRoKSB7XG4gICAgICAgIHN1cGVyKFR5cGUuVGltZSk7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBUaW1lJHt0aGlzLmJpdFdpZHRofTwke1RpbWVVbml0W3RoaXMudW5pdF19PmA7IH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogVGltZSkgPT4ge1xuICAgICAgICAoPGFueT4gcHJvdG8pLkFycmF5VHlwZSA9IFVpbnQzMkFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdUaW1lJztcbiAgICB9KShUaW1lLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZXN0YW1wIGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5UaW1lc3RhbXA+IHsgVEFycmF5OiBJbnQzMkFycmF5OyBUVmFsdWU6IG51bWJlcjsgfVxuZXhwb3J0IGNsYXNzIFRpbWVzdGFtcCBleHRlbmRzIERhdGFUeXBlPFR5cGUuVGltZXN0YW1wPiB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHVuaXQ6IFRpbWVVbml0LCBwdWJsaWMgdGltZXpvbmU/OiBzdHJpbmcgfCBudWxsKSB7XG4gICAgICAgIHN1cGVyKFR5cGUuVGltZXN0YW1wKTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKCkgeyByZXR1cm4gYFRpbWVzdGFtcDwke1RpbWVVbml0W3RoaXMudW5pdF19JHt0aGlzLnRpbWV6b25lID8gYCwgJHt0aGlzLnRpbWV6b25lfWAgOiBgYH0+YDsgfVxuICAgIHByb3RlY3RlZCBzdGF0aWMgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAoKHByb3RvOiBUaW1lc3RhbXApID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBJbnQzMkFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdUaW1lc3RhbXAnO1xuICAgIH0pKFRpbWVzdGFtcC5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVydmFsIGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5JbnRlcnZhbD4geyBUQXJyYXk6IEludDMyQXJyYXk7IFRWYWx1ZTogSW50MzJBcnJheTsgfVxuZXhwb3J0IGNsYXNzIEludGVydmFsIGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5JbnRlcnZhbD4ge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB1bml0OiBJbnRlcnZhbFVuaXQpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5JbnRlcnZhbCk7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBJbnRlcnZhbDwke0ludGVydmFsVW5pdFt0aGlzLnVuaXRdfT5gOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IEludGVydmFsKSA9PiB7XG4gICAgICAgICg8YW55PiBwcm90bykuQXJyYXlUeXBlID0gSW50MzJBcnJheTtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnSW50ZXJ2YWwnO1xuICAgIH0pKEludGVydmFsLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdDxUIGV4dGVuZHMgRGF0YVR5cGUgPSBhbnk+IGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5MaXN0PiAgeyBUQXJyYXk6IGFueTsgVFZhbHVlOiBWZWN0b3I8VD47IH1cbmV4cG9ydCBjbGFzcyBMaXN0PFQgZXh0ZW5kcyBEYXRhVHlwZSA9IGFueT4gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkxpc3Q+IHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgY2hpbGRyZW46IEZpZWxkW10pIHtcbiAgICAgICAgc3VwZXIoVHlwZS5MaXN0LCBjaGlsZHJlbik7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBMaXN0PCR7dGhpcy52YWx1ZVR5cGV9PmA7IH1cbiAgICBwdWJsaWMgZ2V0IEFycmF5VHlwZSgpIHsgcmV0dXJuIHRoaXMudmFsdWVUeXBlLkFycmF5VHlwZTsgfVxuICAgIHB1YmxpYyBnZXQgdmFsdWVUeXBlKCkgeyByZXR1cm4gdGhpcy5jaGlsZHJlblswXS50eXBlIGFzIFQ7IH1cbiAgICBwdWJsaWMgZ2V0IHZhbHVlRmllbGQoKSB7IHJldHVybiB0aGlzLmNoaWxkcmVuWzBdIGFzIEZpZWxkPFQ+OyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IExpc3QpID0+IHtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnTGlzdCc7XG4gICAgfSkoTGlzdC5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0cnVjdCBleHRlbmRzIERhdGFUeXBlPFR5cGUuU3RydWN0PiB7IFRBcnJheTogYW55OyBUVmFsdWU6IFZpZXc8YW55PjsgfVxuZXhwb3J0IGNsYXNzIFN0cnVjdCBleHRlbmRzIERhdGFUeXBlPFR5cGUuU3RydWN0PiB7XG4gICAgY29uc3RydWN0b3IocHVibGljIGNoaWxkcmVuOiBGaWVsZFtdKSB7XG4gICAgICAgIHN1cGVyKFR5cGUuU3RydWN0LCBjaGlsZHJlbik7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBTdHJ1Y3Q8JHt0aGlzLmNoaWxkcmVuLm1hcCgoZikgPT4gZi50eXBlKS5qb2luKGAsIGApfT5gOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IFN0cnVjdCkgPT4ge1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdTdHJ1Y3QnO1xuICAgIH0pKFN0cnVjdC5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFVuaW9uPFRUeXBlIGV4dGVuZHMgVHlwZSA9IGFueT4gZXh0ZW5kcyBEYXRhVHlwZTxUVHlwZT4geyBUQXJyYXk6IEludDhBcnJheTsgVFZhbHVlOiBhbnk7IH1cbmV4cG9ydCBjbGFzcyBVbmlvbjxUVHlwZSBleHRlbmRzIFR5cGUgPSBhbnk+IGV4dGVuZHMgRGF0YVR5cGU8VFR5cGU+IHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgbW9kZTogVW5pb25Nb2RlLFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSB0eXBlSWRzOiBBcnJvd1R5cGVbXSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgY2hpbGRyZW46IEZpZWxkW10pIHtcbiAgICAgICAgc3VwZXIoPFRUeXBlPiAobW9kZSA9PT0gVW5pb25Nb2RlLlNwYXJzZSA/IFR5cGUuU3BhcnNlVW5pb24gOiBUeXBlLkRlbnNlVW5pb24pLCBjaGlsZHJlbik7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGAke3RoaXNbU3ltYm9sLnRvU3RyaW5nVGFnXX08JHt0aGlzLnR5cGVJZHMubWFwKCh4KSA9PiBUeXBlW3hdKS5qb2luKGAgfCBgKX0+YDsgfVxuICAgIHByb3RlY3RlZCBzdGF0aWMgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAoKHByb3RvOiBVbmlvbikgPT4ge1xuICAgICAgICAoPGFueT4gcHJvdG8pLkFycmF5VHlwZSA9IEludDhBcnJheTtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnVW5pb24nO1xuICAgIH0pKFVuaW9uLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBEZW5zZVVuaW9uIGV4dGVuZHMgVW5pb248VHlwZS5EZW5zZVVuaW9uPiB7XG4gICAgY29uc3RydWN0b3IodHlwZUlkczogQXJyb3dUeXBlW10sIGNoaWxkcmVuOiBGaWVsZFtdKSB7XG4gICAgICAgIHN1cGVyKFVuaW9uTW9kZS5EZW5zZSwgdHlwZUlkcywgY2hpbGRyZW4pO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogRGVuc2VVbmlvbikgPT4ge1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdEZW5zZVVuaW9uJztcbiAgICB9KShEZW5zZVVuaW9uLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBTcGFyc2VVbmlvbiBleHRlbmRzIFVuaW9uPFR5cGUuU3BhcnNlVW5pb24+IHtcbiAgICBjb25zdHJ1Y3Rvcih0eXBlSWRzOiBBcnJvd1R5cGVbXSwgY2hpbGRyZW46IEZpZWxkW10pIHtcbiAgICAgICAgc3VwZXIoVW5pb25Nb2RlLlNwYXJzZSwgdHlwZUlkcywgY2hpbGRyZW4pO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogU3BhcnNlVW5pb24pID0+IHtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnU3BhcnNlVW5pb24nO1xuICAgIH0pKFNwYXJzZVVuaW9uLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRml4ZWRTaXplQmluYXJ5IGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5GaXhlZFNpemVCaW5hcnk+IHsgVEFycmF5OiBVaW50OEFycmF5OyBUVmFsdWU6IFVpbnQ4QXJyYXk7IH1cbmV4cG9ydCBjbGFzcyBGaXhlZFNpemVCaW5hcnkgZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkZpeGVkU2l6ZUJpbmFyeT4ge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBieXRlV2lkdGg6IG51bWJlcikge1xuICAgICAgICBzdXBlcihUeXBlLkZpeGVkU2l6ZUJpbmFyeSk7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBGaXhlZFNpemVCaW5hcnlbJHt0aGlzLmJ5dGVXaWR0aH1dYDsgfVxuICAgIHByb3RlY3RlZCBzdGF0aWMgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAoKHByb3RvOiBGaXhlZFNpemVCaW5hcnkpID0+IHtcbiAgICAgICAgKDxhbnk+IHByb3RvKS5BcnJheVR5cGUgPSBVaW50OEFycmF5O1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdGaXhlZFNpemVCaW5hcnknO1xuICAgIH0pKEZpeGVkU2l6ZUJpbmFyeS5wcm90b3R5cGUpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEZpeGVkU2l6ZUxpc3Q8VCBleHRlbmRzIERhdGFUeXBlID0gYW55PiBleHRlbmRzIERhdGFUeXBlPFR5cGUuRml4ZWRTaXplTGlzdD4geyBUQXJyYXk6IGFueTsgVFZhbHVlOiBWZWN0b3I8VD47IH1cbmV4cG9ydCBjbGFzcyBGaXhlZFNpemVMaXN0PFQgZXh0ZW5kcyBEYXRhVHlwZSA9IGFueT4gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkZpeGVkU2l6ZUxpc3Q+IHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgbGlzdFNpemU6IG51bWJlcixcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgY2hpbGRyZW46IEZpZWxkW10pIHtcbiAgICAgICAgc3VwZXIoVHlwZS5GaXhlZFNpemVMaXN0LCBjaGlsZHJlbik7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgQXJyYXlUeXBlKCkgeyByZXR1cm4gdGhpcy52YWx1ZVR5cGUuQXJyYXlUeXBlOyB9XG4gICAgcHVibGljIGdldCB2YWx1ZVR5cGUoKSB7IHJldHVybiB0aGlzLmNoaWxkcmVuWzBdLnR5cGUgYXMgVDsgfVxuICAgIHB1YmxpYyBnZXQgdmFsdWVGaWVsZCgpIHsgcmV0dXJuIHRoaXMuY2hpbGRyZW5bMF0gYXMgRmllbGQ8VD47IH1cbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7IHJldHVybiBgRml4ZWRTaXplTGlzdFske3RoaXMubGlzdFNpemV9XTwke3RoaXMudmFsdWVUeXBlfT5gOyB9XG4gICAgcHJvdGVjdGVkIHN0YXRpYyBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICgocHJvdG86IEZpeGVkU2l6ZUxpc3QpID0+IHtcbiAgICAgICAgcmV0dXJuIHByb3RvW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnRml4ZWRTaXplTGlzdCc7XG4gICAgfSkoRml4ZWRTaXplTGlzdC5wcm90b3R5cGUpO1xufVxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTpjbGFzcy1uYW1lICovXG5leHBvcnQgaW50ZXJmYWNlIE1hcF8gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLk1hcD4geyBUQXJyYXk6IFVpbnQ4QXJyYXk7IFRWYWx1ZTogVmlldzxhbnk+OyB9XG5leHBvcnQgY2xhc3MgTWFwXyBleHRlbmRzIERhdGFUeXBlPFR5cGUuTWFwPiB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGtleXNTb3J0ZWQ6IGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGNoaWxkcmVuOiBGaWVsZFtdKSB7XG4gICAgICAgIHN1cGVyKFR5cGUuTWFwLCBjaGlsZHJlbik7XG4gICAgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBNYXA8JHt0aGlzLmNoaWxkcmVuLmpvaW4oYCwgYCl9PmA7IH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogTWFwXykgPT4ge1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdNYXBfJztcbiAgICB9KShNYXBfLnByb3RvdHlwZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGljdGlvbmFyeTxUIGV4dGVuZHMgRGF0YVR5cGUgPSBhbnk+IGV4dGVuZHMgRGF0YVR5cGU8VHlwZS5EaWN0aW9uYXJ5PiB7IFRBcnJheTogVFsnVEFycmF5J107IFRWYWx1ZTogVFsnVFZhbHVlJ107IH1cbmV4cG9ydCBjbGFzcyBEaWN0aW9uYXJ5PFQgZXh0ZW5kcyBEYXRhVHlwZT4gZXh0ZW5kcyBEYXRhVHlwZTxUeXBlLkRpY3Rpb25hcnk+IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IG51bWJlcjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZGljdGlvbmFyeTogVDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaW5kaWNlczogSW50PGFueT47XG4gICAgcHVibGljIHJlYWRvbmx5IGlzT3JkZXJlZDogYm9vbGVhbjtcbiAgICBjb25zdHJ1Y3RvcihkaWN0aW9uYXJ5OiBULCBpbmRpY2VzOiBJbnQ8YW55PiwgaWQ/OiBMb25nIHwgbnVtYmVyIHwgbnVsbCwgaXNPcmRlcmVkPzogYm9vbGVhbiB8IG51bGwpIHtcbiAgICAgICAgc3VwZXIoVHlwZS5EaWN0aW9uYXJ5KTtcbiAgICAgICAgdGhpcy5pbmRpY2VzID0gaW5kaWNlcztcbiAgICAgICAgdGhpcy5kaWN0aW9uYXJ5ID0gZGljdGlvbmFyeTtcbiAgICAgICAgdGhpcy5pc09yZGVyZWQgPSBpc09yZGVyZWQgfHwgZmFsc2U7XG4gICAgICAgIHRoaXMuaWQgPSBpZCA9PSBudWxsID8gRGljdGlvbmFyeUJhdGNoLmdldElkKCkgOiB0eXBlb2YgaWQgPT09ICdudW1iZXInID8gaWQgOiBpZC5sb3c7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgQXJyYXlUeXBlKCkgeyByZXR1cm4gdGhpcy5kaWN0aW9uYXJ5LkFycmF5VHlwZTsgfVxuICAgIHB1YmxpYyB0b1N0cmluZygpIHsgcmV0dXJuIGBEaWN0aW9uYXJ5PCR7dGhpcy5pbmRpY2VzfSwgJHt0aGlzLmRpY3Rpb25hcnl9PmA7IH1cbiAgICBwcm90ZWN0ZWQgc3RhdGljIFtTeW1ib2wudG9TdHJpbmdUYWddID0gKChwcm90bzogRGljdGlvbmFyeSkgPT4ge1xuICAgICAgICByZXR1cm4gcHJvdG9bU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdEaWN0aW9uYXJ5JztcbiAgICB9KShEaWN0aW9uYXJ5LnByb3RvdHlwZSk7XG59XG5leHBvcnQgaW50ZXJmYWNlIEl0ZXJhYmxlQXJyYXlMaWtlPFQgPSBhbnk+IGV4dGVuZHMgQXJyYXlMaWtlPFQ+LCBJdGVyYWJsZTxUPiB7fVxuXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVkQXJyYXlDb25zdHJ1Y3RvcjxUIGV4dGVuZHMgVHlwZWRBcnJheSA9IFR5cGVkQXJyYXk+IHtcbiAgICByZWFkb25seSBwcm90b3R5cGU6IFQ7XG4gICAgcmVhZG9ubHkgQllURVNfUEVSX0VMRU1FTlQ6IG51bWJlcjtcbiAgICBuZXcgKGxlbmd0aDogbnVtYmVyKTogVDtcbiAgICBuZXcgKGVsZW1lbnRzOiBJdGVyYWJsZTxudW1iZXI+KTogVDtcbiAgICBuZXcgKGFycmF5T3JBcnJheUJ1ZmZlcjogQXJyYXlMaWtlPG51bWJlcj4gfCBBcnJheUJ1ZmZlckxpa2UpOiBUO1xuICAgIG5ldyAoYnVmZmVyOiBBcnJheUJ1ZmZlckxpa2UsIGJ5dGVPZmZzZXQ6IG51bWJlciwgbGVuZ3RoPzogbnVtYmVyKTogVDtcbiAgICBvZiguLi5pdGVtczogbnVtYmVyW10pOiBUO1xuICAgIGZyb20oYXJyYXlMaWtlOiBBcnJheUxpa2U8bnVtYmVyPiB8IEl0ZXJhYmxlPG51bWJlcj4sIG1hcGZuPzogKHY6IG51bWJlciwgazogbnVtYmVyKSA9PiBudW1iZXIsIHRoaXNBcmc/OiBhbnkpOiBUO1xufVxuXG5leHBvcnQgdHlwZSBGbG9hdEFycmF5ID0gVWludDE2QXJyYXkgfCBGbG9hdDMyQXJyYXkgfCBGbG9hdDY0QXJyYXk7XG5leHBvcnQgdHlwZSBJbnRBcnJheSA9IEludDhBcnJheSB8IEludDE2QXJyYXkgfCBJbnQzMkFycmF5IHwgVWludDhBcnJheSB8IFVpbnQxNkFycmF5IHwgVWludDMyQXJyYXk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHlwZWRBcnJheSBleHRlbmRzIEl0ZXJhYmxlPG51bWJlcj4ge1xuICAgIFtpbmRleDogbnVtYmVyXTogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGxlbmd0aDogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGJ5dGVMZW5ndGg6IG51bWJlcjtcbiAgICByZWFkb25seSBieXRlT2Zmc2V0OiBudW1iZXI7XG4gICAgcmVhZG9ubHkgYnVmZmVyOiBBcnJheUJ1ZmZlckxpa2U7XG4gICAgcmVhZG9ubHkgQllURVNfUEVSX0VMRU1FTlQ6IG51bWJlcjtcbiAgICBbU3ltYm9sLnRvU3RyaW5nVGFnXTogYW55O1xuICAgIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8bnVtYmVyPjtcbiAgICBlbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W251bWJlciwgbnVtYmVyXT47XG4gICAga2V5cygpOiBJdGVyYWJsZUl0ZXJhdG9yPG51bWJlcj47XG4gICAgdmFsdWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8bnVtYmVyPjtcbiAgICBjb3B5V2l0aGluKHRhcmdldDogbnVtYmVyLCBzdGFydDogbnVtYmVyLCBlbmQ/OiBudW1iZXIpOiB0aGlzO1xuICAgIGV2ZXJ5KGNhbGxiYWNrZm46ICh2YWx1ZTogbnVtYmVyLCBpbmRleDogbnVtYmVyLCBhcnJheTogVHlwZWRBcnJheSkgPT4gYm9vbGVhbiwgdGhpc0FyZz86IGFueSk6IGJvb2xlYW47XG4gICAgZmlsbCh2YWx1ZTogbnVtYmVyLCBzdGFydD86IG51bWJlciwgZW5kPzogbnVtYmVyKTogdGhpcztcbiAgICBmaWx0ZXIoY2FsbGJhY2tmbjogKHZhbHVlOiBudW1iZXIsIGluZGV4OiBudW1iZXIsIGFycmF5OiBUeXBlZEFycmF5KSA9PiBhbnksIHRoaXNBcmc/OiBhbnkpOiBUeXBlZEFycmF5O1xuICAgIGZpbmQocHJlZGljYXRlOiAodmFsdWU6IG51bWJlciwgaW5kZXg6IG51bWJlciwgb2JqOiBUeXBlZEFycmF5KSA9PiBib29sZWFuLCB0aGlzQXJnPzogYW55KTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGZpbmRJbmRleChwcmVkaWNhdGU6ICh2YWx1ZTogbnVtYmVyLCBpbmRleDogbnVtYmVyLCBvYmo6IFR5cGVkQXJyYXkpID0+IGJvb2xlYW4sIHRoaXNBcmc/OiBhbnkpOiBudW1iZXI7XG4gICAgZm9yRWFjaChjYWxsYmFja2ZuOiAodmFsdWU6IG51bWJlciwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IHZvaWQsIHRoaXNBcmc/OiBhbnkpOiB2b2lkO1xuICAgIGluY2x1ZGVzKHNlYXJjaEVsZW1lbnQ6IG51bWJlciwgZnJvbUluZGV4PzogbnVtYmVyKTogYm9vbGVhbjtcbiAgICBpbmRleE9mKHNlYXJjaEVsZW1lbnQ6IG51bWJlciwgZnJvbUluZGV4PzogbnVtYmVyKTogbnVtYmVyO1xuICAgIGpvaW4oc2VwYXJhdG9yPzogc3RyaW5nKTogc3RyaW5nO1xuICAgIGxhc3RJbmRleE9mKHNlYXJjaEVsZW1lbnQ6IG51bWJlciwgZnJvbUluZGV4PzogbnVtYmVyKTogbnVtYmVyO1xuICAgIG1hcChjYWxsYmFja2ZuOiAodmFsdWU6IG51bWJlciwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IG51bWJlciwgdGhpc0FyZz86IGFueSk6IFR5cGVkQXJyYXk7XG4gICAgcmVkdWNlKGNhbGxiYWNrZm46IChwcmV2aW91c1ZhbHVlOiBudW1iZXIsIGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50SW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IG51bWJlcik6IG51bWJlcjtcbiAgICByZWR1Y2UoY2FsbGJhY2tmbjogKHByZXZpb3VzVmFsdWU6IG51bWJlciwgY3VycmVudFZhbHVlOiBudW1iZXIsIGN1cnJlbnRJbmRleDogbnVtYmVyLCBhcnJheTogVHlwZWRBcnJheSkgPT4gbnVtYmVyLCBpbml0aWFsVmFsdWU6IG51bWJlcik6IG51bWJlcjtcbiAgICByZWR1Y2U8VT4oY2FsbGJhY2tmbjogKHByZXZpb3VzVmFsdWU6IFUsIGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50SW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IFUsIGluaXRpYWxWYWx1ZTogVSk6IFU7XG4gICAgcmVkdWNlUmlnaHQoY2FsbGJhY2tmbjogKHByZXZpb3VzVmFsdWU6IG51bWJlciwgY3VycmVudFZhbHVlOiBudW1iZXIsIGN1cnJlbnRJbmRleDogbnVtYmVyLCBhcnJheTogVHlwZWRBcnJheSkgPT4gbnVtYmVyKTogbnVtYmVyO1xuICAgIHJlZHVjZVJpZ2h0KGNhbGxiYWNrZm46IChwcmV2aW91c1ZhbHVlOiBudW1iZXIsIGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50SW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IG51bWJlciwgaW5pdGlhbFZhbHVlOiBudW1iZXIpOiBudW1iZXI7XG4gICAgcmVkdWNlUmlnaHQ8VT4oY2FsbGJhY2tmbjogKHByZXZpb3VzVmFsdWU6IFUsIGN1cnJlbnRWYWx1ZTogbnVtYmVyLCBjdXJyZW50SW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IFUsIGluaXRpYWxWYWx1ZTogVSk6IFU7XG4gICAgcmV2ZXJzZSgpOiBUeXBlZEFycmF5O1xuICAgIHNldChhcnJheTogQXJyYXlMaWtlPG51bWJlcj4sIG9mZnNldD86IG51bWJlcik6IHZvaWQ7XG4gICAgc2xpY2Uoc3RhcnQ/OiBudW1iZXIsIGVuZD86IG51bWJlcik6IFR5cGVkQXJyYXk7XG4gICAgc29tZShjYWxsYmFja2ZuOiAodmFsdWU6IG51bWJlciwgaW5kZXg6IG51bWJlciwgYXJyYXk6IFR5cGVkQXJyYXkpID0+IGJvb2xlYW4sIHRoaXNBcmc/OiBhbnkpOiBib29sZWFuO1xuICAgIHNvcnQoY29tcGFyZUZuPzogKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiBudW1iZXIpOiB0aGlzO1xuICAgIHN1YmFycmF5KGJlZ2luOiBudW1iZXIsIGVuZD86IG51bWJlcik6IFR5cGVkQXJyYXk7XG4gICAgdG9Mb2NhbGVTdHJpbmcoKTogc3RyaW5nO1xuICAgIHRvU3RyaW5nKCk6IHN0cmluZztcbn1cbiJdfQ==
