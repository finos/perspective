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
import { flatbuffers } from 'flatbuffers';
import { TypeDataLoader } from './vector';
import { Message, Footer, FileBlock, RecordBatchMetadata, DictionaryBatch, BufferMetadata, FieldMetadata, } from '../metadata';
import { Schema, Field, Dictionary, Null, Binary, Bool, Utf8, Decimal, Date_, Time, Timestamp, Interval, List, Struct, Union, FixedSizeBinary, FixedSizeList, Map_, } from '../../type';
import { Int8, Uint8, Int16, Uint16, Int32, Uint32, Int64, Uint64, Float16, Float64, Float32, } from '../../type';
var ByteBuffer = flatbuffers.ByteBuffer;
export function readBuffers(sources) {
    var schema, dictionaries, readMessages, sources_1, sources_1_1, source, bb, _a, _b, message, e_1_1, e_2_1, e_2, _c, _d, e_1, _e;
    return tslib_1.__generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                schema = null;
                dictionaries = new Map();
                readMessages = null;
                if (ArrayBuffer.isView(sources) || typeof sources === 'string') {
                    sources = [sources];
                }
                _f.label = 1;
            case 1:
                _f.trys.push([1, 12, 13, 14]);
                sources_1 = tslib_1.__values(sources), sources_1_1 = sources_1.next();
                _f.label = 2;
            case 2:
                if (!!sources_1_1.done) return [3 /*break*/, 11];
                source = sources_1_1.value;
                bb = toByteBuffer(source);
                if (!((!schema && (_d = readSchema(bb), schema = _d.schema, readMessages = _d.readMessages, _d) || true) && schema && readMessages)) return [3 /*break*/, 10];
                _f.label = 3;
            case 3:
                _f.trys.push([3, 8, 9, 10]);
                _a = tslib_1.__values(readMessages(bb)), _b = _a.next();
                _f.label = 4;
            case 4:
                if (!!_b.done) return [3 /*break*/, 7];
                message = _b.value;
                return [4 /*yield*/, {
                        schema: schema, message: message,
                        loader: new BinaryDataLoader(bb, arrayIterator(message.nodes), arrayIterator(message.buffers), dictionaries)
                    }];
            case 5:
                _f.sent();
                _f.label = 6;
            case 6:
                _b = _a.next();
                return [3 /*break*/, 4];
            case 7: return [3 /*break*/, 10];
            case 8:
                e_1_1 = _f.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 10];
            case 9:
                try {
                    if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 10:
                sources_1_1 = sources_1.next();
                return [3 /*break*/, 2];
            case 11: return [3 /*break*/, 14];
            case 12:
                e_2_1 = _f.sent();
                e_2 = { error: e_2_1 };
                return [3 /*break*/, 14];
            case 13:
                try {
                    if (sources_1_1 && !sources_1_1.done && (_c = sources_1.return)) _c.call(sources_1);
                }
                finally { if (e_2) throw e_2.error; }
                return [7 /*endfinally*/];
            case 14: return [2 /*return*/];
        }
    });
}
export function readBuffersAsync(sources) {
    return tslib_1.__asyncGenerator(this, arguments, function readBuffersAsync_1() {
        var schema, dictionaries, readMessages, sources_2, sources_2_1, source, bb, _a, _b, message, e_3_1, e_4_1, e_4, _c, _d, e_3, _e;
        return tslib_1.__generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    schema = null;
                    dictionaries = new Map();
                    readMessages = null;
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 14, 15, 20]);
                    sources_2 = tslib_1.__asyncValues(sources);
                    _f.label = 2;
                case 2: return [4 /*yield*/, tslib_1.__await(sources_2.next())];
                case 3:
                    if (!(sources_2_1 = _f.sent(), !sources_2_1.done)) return [3 /*break*/, 13];
                    return [4 /*yield*/, tslib_1.__await(sources_2_1.value)];
                case 4:
                    source = _f.sent();
                    bb = toByteBuffer(source);
                    if (!((!schema && (_d = readSchema(bb), schema = _d.schema, readMessages = _d.readMessages, _d) || true) && schema && readMessages)) return [3 /*break*/, 12];
                    _f.label = 5;
                case 5:
                    _f.trys.push([5, 10, 11, 12]);
                    _a = tslib_1.__values(readMessages(bb)), _b = _a.next();
                    _f.label = 6;
                case 6:
                    if (!!_b.done) return [3 /*break*/, 9];
                    message = _b.value;
                    return [4 /*yield*/, {
                            schema: schema, message: message,
                            loader: new BinaryDataLoader(bb, arrayIterator(message.nodes), arrayIterator(message.buffers), dictionaries)
                        }];
                case 7:
                    _f.sent();
                    _f.label = 8;
                case 8:
                    _b = _a.next();
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 12];
                case 10:
                    e_3_1 = _f.sent();
                    e_3 = { error: e_3_1 };
                    return [3 /*break*/, 12];
                case 11:
                    try {
                        if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                    }
                    finally { if (e_3) throw e_3.error; }
                    return [7 /*endfinally*/];
                case 12: return [3 /*break*/, 2];
                case 13: return [3 /*break*/, 20];
                case 14:
                    e_4_1 = _f.sent();
                    e_4 = { error: e_4_1 };
                    return [3 /*break*/, 20];
                case 15:
                    _f.trys.push([15, , 18, 19]);
                    if (!(sources_2_1 && !sources_2_1.done && (_c = sources_2.return))) return [3 /*break*/, 17];
                    return [4 /*yield*/, tslib_1.__await(_c.call(sources_2))];
                case 16:
                    _f.sent();
                    _f.label = 17;
                case 17: return [3 /*break*/, 19];
                case 18:
                    if (e_4) throw e_4.error;
                    return [7 /*endfinally*/];
                case 19: return [7 /*endfinally*/];
                case 20: return [2 /*return*/];
            }
        });
    });
}
var BinaryDataLoader = /** @class */ (function (_super) {
    tslib_1.__extends(BinaryDataLoader, _super);
    function BinaryDataLoader(bb, nodes, buffers, dictionaries) {
        var _this = _super.call(this, nodes, buffers, dictionaries) || this;
        _this.bytes = bb.bytes();
        _this.messageOffset = bb.position();
        return _this;
    }
    BinaryDataLoader.prototype.readOffsets = function (type, buffer) { return this.readData(type, buffer); };
    BinaryDataLoader.prototype.readTypeIds = function (type, buffer) { return this.readData(type, buffer); };
    BinaryDataLoader.prototype.readData = function (_type, _a) {
        var _b = _a === void 0 ? this.getBufferMetadata() : _a, length = _b.length, offset = _b.offset;
        return new Uint8Array(this.bytes.buffer, this.bytes.byteOffset + this.messageOffset + offset, length);
    };
    return BinaryDataLoader;
}(TypeDataLoader));
export { BinaryDataLoader };
function arrayIterator(arr) { return tslib_1.__generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [5 /*yield**/, tslib_1.__values(arr)];
        case 1:
            _a.sent();
            return [2 /*return*/];
    }
}); }
function toByteBuffer(bytes) {
    var arr = bytes || new Uint8Array(0);
    if (typeof bytes === 'string') {
        arr = new Uint8Array(bytes.length);
        for (var i = -1, n = bytes.length; ++i < n;) {
            arr[i] = bytes.charCodeAt(i);
        }
        return new ByteBuffer(arr);
    }
    return new ByteBuffer(arr);
}
function readSchema(bb) {
    var schema, readMessages, footer;
    if (footer = readFileSchema(bb)) {
        schema = footer.schema;
        readMessages = readFileMessages(footer);
    }
    else if (schema = readStreamSchema(bb)) {
        readMessages = readStreamMessages;
    }
    else {
        throw new Error('Invalid Arrow buffer');
    }
    return { schema: schema, readMessages: readMessages };
}
var PADDING = 4;
var MAGIC_STR = 'ARROW1';
var MAGIC = new Uint8Array(MAGIC_STR.length);
for (var i = 0; i < MAGIC_STR.length; i += 1 | 0) {
    MAGIC[i] = MAGIC_STR.charCodeAt(i);
}
function checkForMagicArrowString(buffer, index) {
    if (index === void 0) { index = 0; }
    for (var i = -1, n = MAGIC.length; ++i < n;) {
        if (MAGIC[i] !== buffer[index + i]) {
            return false;
        }
    }
    return true;
}
var magicLength = MAGIC.length;
var magicAndPadding = magicLength + PADDING;
var magicX2AndPadding = magicLength * 2 + PADDING;
function readStreamSchema(bb) {
    if (!checkForMagicArrowString(bb.bytes(), 0)) {
        try {
            for (var _a = tslib_1.__values(readMessages(bb)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var message = _b.value;
                if (Message.isSchema(message)) {
                    return message;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_5) throw e_5.error; }
        }
    }
    return null;
    var e_5, _c;
}
function readStreamMessages(bb) {
    var _a, _b, message, e_6_1, e_6, _c;
    return tslib_1.__generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 9, 10, 11]);
                _a = tslib_1.__values(readMessages(bb)), _b = _a.next();
                _d.label = 1;
            case 1:
                if (!!_b.done) return [3 /*break*/, 8];
                message = _b.value;
                if (!Message.isRecordBatch(message)) return [3 /*break*/, 3];
                return [4 /*yield*/, message];
            case 2:
                _d.sent();
                return [3 /*break*/, 6];
            case 3:
                if (!Message.isDictionaryBatch(message)) return [3 /*break*/, 5];
                return [4 /*yield*/, message];
            case 4:
                _d.sent();
                return [3 /*break*/, 6];
            case 5: return [3 /*break*/, 7];
            case 6:
                // position the buffer after the body to read the next message
                bb.setPosition(bb.position() + message.bodyLength);
                _d.label = 7;
            case 7:
                _b = _a.next();
                return [3 /*break*/, 1];
            case 8: return [3 /*break*/, 11];
            case 9:
                e_6_1 = _d.sent();
                e_6 = { error: e_6_1 };
                return [3 /*break*/, 11];
            case 10:
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_6) throw e_6.error; }
                return [7 /*endfinally*/];
            case 11: return [2 /*return*/];
        }
    });
}
function readFileSchema(bb) {
    var fileLength = bb.capacity(), footerLength, footerOffset;
    if ((fileLength < magicX2AndPadding /*                     Arrow buffer too small */) ||
        (!checkForMagicArrowString(bb.bytes(), 0) /*                        Missing magic start    */) ||
        (!checkForMagicArrowString(bb.bytes(), fileLength - magicLength) /* Missing magic end      */) ||
        ((footerLength = bb.readInt32(footerOffset = fileLength - magicAndPadding)) < 1 &&
            (footerLength + magicX2AndPadding > fileLength))) {
        return null;
    }
    bb.setPosition(footerOffset - footerLength);
    return footerFromByteBuffer(bb);
}
function readFileMessages(footer) {
    return function (bb) {
        var i, batches, n, i, batches, n;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = -1, batches = footer.dictionaryBatches, n = batches.length;
                    _a.label = 1;
                case 1:
                    if (!(++i < n)) return [3 /*break*/, 4];
                    bb.setPosition(batches[i].offset.low);
                    return [4 /*yield*/, readMessage(bb, bb.readInt32(bb.position()))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 1];
                case 4:
                    i = -1, batches = footer.recordBatches, n = batches.length;
                    _a.label = 5;
                case 5:
                    if (!(++i < n)) return [3 /*break*/, 8];
                    bb.setPosition(batches[i].offset.low);
                    return [4 /*yield*/, readMessage(bb, bb.readInt32(bb.position()))];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [3 /*break*/, 5];
                case 8: return [2 /*return*/];
            }
        });
    };
}
function readMessages(bb) {
    var length, message;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(bb.position() < bb.capacity() &&
                    (length = bb.readInt32(bb.position())) > 0)) return [3 /*break*/, 3];
                if (!(message = readMessage(bb, length))) return [3 /*break*/, 2];
                return [4 /*yield*/, message];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [3 /*break*/, 0];
            case 3: return [2 /*return*/];
        }
    });
}
function readMessage(bb, length) {
    bb.setPosition(bb.position() + PADDING);
    var message = messageFromByteBuffer(bb);
    bb.setPosition(bb.position() + length);
    return message;
}
import * as File_ from '../../fb/File';
import * as Schema_ from '../../fb/Schema';
import * as Message_ from '../../fb/Message';
var Type = Schema_.org.apache.arrow.flatbuf.Type;
var Precision = Schema_.org.apache.arrow.flatbuf.Precision;
var MessageHeader = Message_.org.apache.arrow.flatbuf.MessageHeader;
var MetadataVersion = Schema_.org.apache.arrow.flatbuf.MetadataVersion;
var _Footer = File_.org.apache.arrow.flatbuf.Footer;
var _Message = Message_.org.apache.arrow.flatbuf.Message;
var _Schema = Schema_.org.apache.arrow.flatbuf.Schema;
var _RecordBatch = Message_.org.apache.arrow.flatbuf.RecordBatch;
var _DictionaryBatch = Message_.org.apache.arrow.flatbuf.DictionaryBatch;
var _Null = Schema_.org.apache.arrow.flatbuf.Null;
var _Int = Schema_.org.apache.arrow.flatbuf.Int;
var _FloatingPoint = Schema_.org.apache.arrow.flatbuf.FloatingPoint;
var _Binary = Schema_.org.apache.arrow.flatbuf.Binary;
var _Bool = Schema_.org.apache.arrow.flatbuf.Bool;
var _Utf8 = Schema_.org.apache.arrow.flatbuf.Utf8;
var _Decimal = Schema_.org.apache.arrow.flatbuf.Decimal;
var _Date = Schema_.org.apache.arrow.flatbuf.Date;
var _Time = Schema_.org.apache.arrow.flatbuf.Time;
var _Timestamp = Schema_.org.apache.arrow.flatbuf.Timestamp;
var _Interval = Schema_.org.apache.arrow.flatbuf.Interval;
var _List = Schema_.org.apache.arrow.flatbuf.List;
var _Struct = Schema_.org.apache.arrow.flatbuf.Struct_;
var _Union = Schema_.org.apache.arrow.flatbuf.Union;
var _FixedSizeBinary = Schema_.org.apache.arrow.flatbuf.FixedSizeBinary;
var _FixedSizeList = Schema_.org.apache.arrow.flatbuf.FixedSizeList;
var _Map = Schema_.org.apache.arrow.flatbuf.Map;
function footerFromByteBuffer(bb) {
    var dictionaryFields = new Map();
    var f = _Footer.getRootAsFooter(bb), s = f.schema();
    return new Footer(dictionaryBatchesFromFooter(f), recordBatchesFromFooter(f), new Schema(fieldsFromSchema(s, dictionaryFields), customMetadata(s), f.version(), dictionaryFields));
}
function messageFromByteBuffer(bb) {
    var m = _Message.getRootAsMessage(bb), type = m.headerType(), version = m.version();
    switch (type) {
        case MessageHeader.Schema: return schemaFromMessage(version, m.header(new _Schema()), new Map());
        case MessageHeader.RecordBatch: return recordBatchFromMessage(version, m.header(new _RecordBatch()));
        case MessageHeader.DictionaryBatch: return dictionaryBatchFromMessage(version, m.header(new _DictionaryBatch()));
    }
    return null;
    // throw new Error(`Unrecognized Message type '${type}'`);
}
function schemaFromMessage(version, s, dictionaryFields) {
    return new Schema(fieldsFromSchema(s, dictionaryFields), customMetadata(s), version, dictionaryFields);
}
function recordBatchFromMessage(version, b) {
    return new RecordBatchMetadata(version, b.length(), fieldNodesFromRecordBatch(b), buffersFromRecordBatch(b, version));
}
function dictionaryBatchFromMessage(version, d) {
    return new DictionaryBatch(version, recordBatchFromMessage(version, d.data()), d.id(), d.isDelta());
}
function dictionaryBatchesFromFooter(f) {
    var blocks = [];
    for (var b = void 0, i = -1, n = f && f.dictionariesLength(); ++i < n;) {
        if (b = f.dictionaries(i)) {
            blocks.push(new FileBlock(b.metaDataLength(), b.bodyLength(), b.offset()));
        }
    }
    return blocks;
}
function recordBatchesFromFooter(f) {
    var blocks = [];
    for (var b = void 0, i = -1, n = f && f.recordBatchesLength(); ++i < n;) {
        if (b = f.recordBatches(i)) {
            blocks.push(new FileBlock(b.metaDataLength(), b.bodyLength(), b.offset()));
        }
    }
    return blocks;
}
function fieldsFromSchema(s, dictionaryFields) {
    var fields = [];
    for (var i = -1, c = void 0, n = s && s.fieldsLength(); ++i < n;) {
        if (c = field(s.fields(i), dictionaryFields)) {
            fields.push(c);
        }
    }
    return fields;
}
function fieldsFromField(f, dictionaryFields) {
    var fields = [];
    for (var i = -1, c = void 0, n = f && f.childrenLength(); ++i < n;) {
        if (c = field(f.children(i), dictionaryFields)) {
            fields.push(c);
        }
    }
    return fields;
}
function fieldNodesFromRecordBatch(b) {
    var fieldNodes = [];
    for (var i = -1, n = b.nodesLength(); ++i < n;) {
        fieldNodes.push(fieldNodeFromRecordBatch(b.nodes(i)));
    }
    return fieldNodes;
}
function buffersFromRecordBatch(b, version) {
    var buffers = [];
    for (var i = -1, n = b.buffersLength(); ++i < n;) {
        var buffer = b.buffers(i);
        // If this Arrow buffer was written before version 4,
        // advance the buffer's bb_pos 8 bytes to skip past
        // the now-removed page id field.
        if (version < MetadataVersion.V4) {
            buffer.bb_pos += (8 * (i + 1));
        }
        buffers.push(bufferFromRecordBatch(buffer));
    }
    return buffers;
}
function field(f, dictionaryFields) {
    var name = f.name();
    var field;
    var nullable = f.nullable();
    var metadata = customMetadata(f);
    var dataType;
    var keysMeta, id;
    var dictMeta;
    if (!dictionaryFields || !(dictMeta = f.dictionary())) {
        if (dataType = typeFromField(f, fieldsFromField(f, dictionaryFields))) {
            field = new Field(name, dataType, nullable, metadata);
        }
    }
    else if (dataType = dictionaryFields.has(id = dictMeta.id().low)
        ? dictionaryFields.get(id).type.dictionary
        : typeFromField(f, fieldsFromField(f, null))) {
        dataType = new Dictionary(dataType, 
        // a dictionary index defaults to signed 32 bit int if unspecified
        (keysMeta = dictMeta.indexType()) ? intFromField(keysMeta) : new Int32(), id, dictMeta.isOrdered());
        field = new Field(name, dataType, nullable, metadata);
        dictionaryFields.has(id) || dictionaryFields.set(id, field);
    }
    return field || null;
}
function customMetadata(parent) {
    var data = new Map();
    if (parent) {
        for (var entry = void 0, key = void 0, i = -1, n = parent.customMetadataLength() | 0; ++i < n;) {
            if ((entry = parent.customMetadata(i)) && (key = entry.key()) != null) {
                data.set(key, entry.value());
            }
        }
    }
    return data;
}
function fieldNodeFromRecordBatch(f) {
    return new FieldMetadata(f.length(), f.nullCount());
}
function bufferFromRecordBatch(b) {
    return new BufferMetadata(b.offset(), b.length());
}
function typeFromField(f, children) {
    switch (f.typeType()) {
        case Type.NONE: return null;
        case Type.Null: return nullFromField(f.type(new _Null()));
        case Type.Int: return intFromField(f.type(new _Int()));
        case Type.FloatingPoint: return floatFromField(f.type(new _FloatingPoint()));
        case Type.Binary: return binaryFromField(f.type(new _Binary()));
        case Type.Utf8: return utf8FromField(f.type(new _Utf8()));
        case Type.Bool: return boolFromField(f.type(new _Bool()));
        case Type.Decimal: return decimalFromField(f.type(new _Decimal()));
        case Type.Date: return dateFromField(f.type(new _Date()));
        case Type.Time: return timeFromField(f.type(new _Time()));
        case Type.Timestamp: return timestampFromField(f.type(new _Timestamp()));
        case Type.Interval: return intervalFromField(f.type(new _Interval()));
        case Type.List: return listFromField(f.type(new _List()), children || []);
        case Type.Struct_: return structFromField(f.type(new _Struct()), children || []);
        case Type.Union: return unionFromField(f.type(new _Union()), children || []);
        case Type.FixedSizeBinary: return fixedSizeBinaryFromField(f.type(new _FixedSizeBinary()));
        case Type.FixedSizeList: return fixedSizeListFromField(f.type(new _FixedSizeList()), children || []);
        case Type.Map: return mapFromField(f.type(new _Map()), children || []);
    }
    throw new Error("Unrecognized type " + f.typeType());
}
function nullFromField(_type) { return new Null(); }
function intFromField(_type) {
    switch (_type.bitWidth()) {
        case 8: return _type.isSigned() ? new Int8() : new Uint8();
        case 16: return _type.isSigned() ? new Int16() : new Uint16();
        case 32: return _type.isSigned() ? new Int32() : new Uint32();
        case 64: return _type.isSigned() ? new Int64() : new Uint64();
    }
    return null;
}
function floatFromField(_type) {
    switch (_type.precision()) {
        case Precision.HALF: return new Float16();
        case Precision.SINGLE: return new Float32();
        case Precision.DOUBLE: return new Float64();
    }
    return null;
}
function binaryFromField(_type) { return new Binary(); }
function utf8FromField(_type) { return new Utf8(); }
function boolFromField(_type) { return new Bool(); }
function decimalFromField(_type) { return new Decimal(_type.scale(), _type.precision()); }
function dateFromField(_type) { return new Date_(_type.unit()); }
function timeFromField(_type) { return new Time(_type.unit(), _type.bitWidth()); }
function timestampFromField(_type) { return new Timestamp(_type.unit(), _type.timezone()); }
function intervalFromField(_type) { return new Interval(_type.unit()); }
function listFromField(_type, children) { return new List(children); }
function structFromField(_type, children) { return new Struct(children); }
function unionFromField(_type, children) { return new Union(_type.mode(), (_type.typeIdsArray() || []), children); }
function fixedSizeBinaryFromField(_type) { return new FixedSizeBinary(_type.byteWidth()); }
function fixedSizeListFromField(_type, children) { return new FixedSizeList(_type.listSize(), children); }
function mapFromField(_type, children) { return new Map_(_type.keysSorted(), children); }

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlwYy9yZWFkZXIvYmluYXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZEQUE2RDtBQUM3RCwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELDZEQUE2RDtBQUM3RCxvREFBb0Q7QUFDcEQsNkRBQTZEO0FBQzdELDZEQUE2RDtBQUM3RCxFQUFFO0FBQ0YsK0NBQStDO0FBQy9DLEVBQUU7QUFDRiw2REFBNkQ7QUFDN0QsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsMERBQTBEO0FBQzFELHFCQUFxQjs7QUFHckIsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMxQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLGFBQWEsR0FBRyxNQUFNLGFBQWEsQ0FBQztBQUMvSCxPQUFPLEVBQ0gsTUFBTSxFQUFFLEtBQUssRUFDSCxVQUFVLEVBQ3BCLElBQUksRUFDSixNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQzNCLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFDaEMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLGFBQWEsRUFBRSxJQUFJLEdBQzVELE1BQU0sWUFBWSxDQUFDO0FBRXBCLE9BQU8sRUFDSCxJQUFJLEVBQUcsS0FBSyxFQUNaLEtBQUssRUFBRSxNQUFNLEVBQ2IsS0FBSyxFQUFFLE1BQU0sRUFDYixLQUFLLEVBQUUsTUFBTSxFQUNiLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxHQUM1QixNQUFNLFlBQVksQ0FBQztBQUVwQixJQUFPLFVBQVUsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDO0FBSTNDLE1BQU0sc0JBQStELE9BQW1EOzs7OztnQkFDaEgsTUFBTSxHQUFr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RSxDQUFDLENBQUM7UUFDakUsS0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFFLENBQUMsQ0FBQztRQUMzRCxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFDO1FBQzNELEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsRUFBRSxDQUFFLENBQUMsQ0FBQztRQUNwRSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUUsQ0FBQyxDQUFDO1FBQzNELEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBRSxDQUFDLENBQUM7UUFDM0QsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUUsQ0FBQyxDQUFDO1FBQzFFLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFFLENBQUMsQ0FBQztRQUN2RSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFLENBQUUsRUFBRSxRQUFRLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0UsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FB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QyxDQUFvQyxDQUFDO0FBQ2pLLGdDQUFrQyxLQUFxQixFQUFFLFFBQWlCLElBQUksTUFBTSxDQUFDLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUE2QixDQUFDO0FBQ2pLLHNCQUFrQyxLQUFXLEVBQUUsUUFBaUIsSUFBYyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQW9DLENBQUMiLCJmaWxlIjoiaXBjL3JlYWRlci9iaW5hcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4vLyBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbi8vIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4vLyByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4vLyB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4vLyBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Vcbi8vIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbi8vIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4vLyBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuLy8gS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4vLyBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4vLyB1bmRlciB0aGUgTGljZW5zZS5cblxuaW1wb3J0IHsgVmVjdG9yIH0gZnJvbSAnLi4vLi4vdmVjdG9yJztcbmltcG9ydCB7IGZsYXRidWZmZXJzIH0gZnJvbSAnZmxhdGJ1ZmZlcnMnO1xuaW1wb3J0IHsgVHlwZURhdGFMb2FkZXIgfSBmcm9tICcuL3ZlY3Rvcic7XG5pbXBvcnQgeyBNZXNzYWdlLCBGb290ZXIsIEZpbGVCbG9jaywgUmVjb3JkQmF0Y2hNZXRhZGF0YSwgRGljdGlvbmFyeUJhdGNoLCBCdWZmZXJNZXRhZGF0YSwgRmllbGRNZXRhZGF0YSwgfSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQge1xuICAgIFNjaGVtYSwgRmllbGQsXG4gICAgRGF0YVR5cGUsIERpY3Rpb25hcnksXG4gICAgTnVsbCwgVGltZUJpdFdpZHRoLFxuICAgIEJpbmFyeSwgQm9vbCwgVXRmOCwgRGVjaW1hbCxcbiAgICBEYXRlXywgVGltZSwgVGltZXN0YW1wLCBJbnRlcnZhbCxcbiAgICBMaXN0LCBTdHJ1Y3QsIFVuaW9uLCBGaXhlZFNpemVCaW5hcnksIEZpeGVkU2l6ZUxpc3QsIE1hcF8sXG59IGZyb20gJy4uLy4uL3R5cGUnO1xuXG5pbXBvcnQge1xuICAgIEludDgsICBVaW50OCxcbiAgICBJbnQxNiwgVWludDE2LFxuICAgIEludDMyLCBVaW50MzIsXG4gICAgSW50NjQsIFVpbnQ2NCxcbiAgICBGbG9hdDE2LCBGbG9hdDY0LCBGbG9hdDMyLFxufSBmcm9tICcuLi8uLi90eXBlJztcblxuaW1wb3J0IEJ5dGVCdWZmZXIgPSBmbGF0YnVmZmVycy5CeXRlQnVmZmVyO1xuXG50eXBlIE1lc3NhZ2VSZWFkZXIgPSAoYmI6IEJ5dGVCdWZmZXIpID0+IEl0ZXJhYmxlSXRlcmF0b3I8UmVjb3JkQmF0Y2hNZXRhZGF0YSB8IERpY3Rpb25hcnlCYXRjaD47XG5cbmV4cG9ydCBmdW5jdGlvbiogcmVhZEJ1ZmZlcnM8VCBleHRlbmRzIFVpbnQ4QXJyYXkgfCBCdWZmZXIgfCBzdHJpbmc+KHNvdXJjZXM6IEl0ZXJhYmxlPFQ+IHwgVWludDhBcnJheSB8IEJ1ZmZlciB8IHN0cmluZykge1xuICAgIGxldCBzY2hlbWE6IFNjaGVtYSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBkaWN0aW9uYXJpZXMgPSBuZXcgTWFwPG51bWJlciwgVmVjdG9yPigpO1xuICAgIGxldCByZWFkTWVzc2FnZXM6IE1lc3NhZ2VSZWFkZXIgfCBudWxsID0gbnVsbDtcbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHNvdXJjZXMpIHx8IHR5cGVvZiBzb3VyY2VzID09PSAnc3RyaW5nJykge1xuICAgICAgICBzb3VyY2VzID0gW3NvdXJjZXMgYXMgVF07XG4gICAgfVxuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgICAgY29uc3QgYmIgPSB0b0J5dGVCdWZmZXIoc291cmNlKTtcbiAgICAgICAgaWYgKCghc2NoZW1hICYmICh7IHNjaGVtYSwgcmVhZE1lc3NhZ2VzIH0gPSByZWFkU2NoZW1hKGJiKSkgfHwgdHJ1ZSkgJiYgc2NoZW1hICYmIHJlYWRNZXNzYWdlcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtZXNzYWdlIG9mIHJlYWRNZXNzYWdlcyhiYikpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYSwgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVyOiBuZXcgQmluYXJ5RGF0YUxvYWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGJiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlJdGVyYXRvcihtZXNzYWdlLm5vZGVzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5SXRlcmF0b3IobWVzc2FnZS5idWZmZXJzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3Rpb25hcmllc1xuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkQnVmZmVyc0FzeW5jPFQgZXh0ZW5kcyBVaW50OEFycmF5IHwgQnVmZmVyIHwgc3RyaW5nPihzb3VyY2VzOiBBc3luY0l0ZXJhYmxlPFQ+KSB7XG4gICAgbGV0IHNjaGVtYTogU2NoZW1hIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGRpY3Rpb25hcmllcyA9IG5ldyBNYXA8bnVtYmVyLCBWZWN0b3I+KCk7XG4gICAgbGV0IHJlYWRNZXNzYWdlczogTWVzc2FnZVJlYWRlciB8IG51bGwgPSBudWxsO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgICAgY29uc3QgYmIgPSB0b0J5dGVCdWZmZXIoc291cmNlKTtcbiAgICAgICAgaWYgKCghc2NoZW1hICYmICh7IHNjaGVtYSwgcmVhZE1lc3NhZ2VzIH0gPSByZWFkU2NoZW1hKGJiKSkgfHwgdHJ1ZSkgJiYgc2NoZW1hICYmIHJlYWRNZXNzYWdlcykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtZXNzYWdlIG9mIHJlYWRNZXNzYWdlcyhiYikpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYSwgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVyOiBuZXcgQmluYXJ5RGF0YUxvYWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGJiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlJdGVyYXRvcihtZXNzYWdlLm5vZGVzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5SXRlcmF0b3IobWVzc2FnZS5idWZmZXJzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3Rpb25hcmllc1xuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJpbmFyeURhdGFMb2FkZXIgZXh0ZW5kcyBUeXBlRGF0YUxvYWRlciB7XG4gICAgcHJpdmF0ZSBieXRlczogVWludDhBcnJheTtcbiAgICBwcml2YXRlIG1lc3NhZ2VPZmZzZXQ6IG51bWJlcjtcbiAgICBjb25zdHJ1Y3RvcihiYjogQnl0ZUJ1ZmZlciwgbm9kZXM6IEl0ZXJhdG9yPEZpZWxkTWV0YWRhdGE+LCBidWZmZXJzOiBJdGVyYXRvcjxCdWZmZXJNZXRhZGF0YT4sIGRpY3Rpb25hcmllczogTWFwPG51bWJlciwgVmVjdG9yPikge1xuICAgICAgICBzdXBlcihub2RlcywgYnVmZmVycywgZGljdGlvbmFyaWVzKTtcbiAgICAgICAgdGhpcy5ieXRlcyA9IGJiLmJ5dGVzKCk7XG4gICAgICAgIHRoaXMubWVzc2FnZU9mZnNldCA9IGJiLnBvc2l0aW9uKCk7XG4gICAgfVxuICAgIHByb3RlY3RlZCByZWFkT2Zmc2V0czxUIGV4dGVuZHMgRGF0YVR5cGU+KHR5cGU6IFQsIGJ1ZmZlcj86IEJ1ZmZlck1ldGFkYXRhKSB7IHJldHVybiB0aGlzLnJlYWREYXRhKHR5cGUsIGJ1ZmZlcik7IH1cbiAgICBwcm90ZWN0ZWQgcmVhZFR5cGVJZHM8VCBleHRlbmRzIERhdGFUeXBlPih0eXBlOiBULCBidWZmZXI/OiBCdWZmZXJNZXRhZGF0YSkgeyByZXR1cm4gdGhpcy5yZWFkRGF0YSh0eXBlLCBidWZmZXIpOyB9XG4gICAgcHJvdGVjdGVkIHJlYWREYXRhPFQgZXh0ZW5kcyBEYXRhVHlwZT4oX3R5cGU6IFQsIHsgbGVuZ3RoLCBvZmZzZXQgfTogQnVmZmVyTWV0YWRhdGEgPSB0aGlzLmdldEJ1ZmZlck1ldGFkYXRhKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHRoaXMuYnl0ZXMuYnVmZmVyLCB0aGlzLmJ5dGVzLmJ5dGVPZmZzZXQgKyB0aGlzLm1lc3NhZ2VPZmZzZXQgKyBvZmZzZXQsIGxlbmd0aCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiogYXJyYXlJdGVyYXRvcihhcnI6IEFycmF5PGFueT4pIHsgeWllbGQqIGFycjsgfVxuXG5mdW5jdGlvbiB0b0J5dGVCdWZmZXIoYnl0ZXM/OiBVaW50OEFycmF5IHwgQnVmZmVyIHwgc3RyaW5nKSB7XG4gICAgbGV0IGFycjogVWludDhBcnJheSA9IGJ5dGVzIGFzIGFueSB8fCBuZXcgVWludDhBcnJheSgwKTtcbiAgICBpZiAodHlwZW9mIGJ5dGVzID09PSAnc3RyaW5nJykge1xuICAgICAgICBhcnIgPSBuZXcgVWludDhBcnJheShieXRlcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gLTEsIG4gPSBieXRlcy5sZW5ndGg7ICsraSA8IG47KSB7XG4gICAgICAgICAgICBhcnJbaV0gPSBieXRlcy5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQnl0ZUJ1ZmZlcihhcnIpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEJ5dGVCdWZmZXIoYXJyKTtcbn1cblxuZnVuY3Rpb24gcmVhZFNjaGVtYShiYjogQnl0ZUJ1ZmZlcikge1xuICAgIGxldCBzY2hlbWE6IFNjaGVtYSwgcmVhZE1lc3NhZ2VzLCBmb290ZXI6IEZvb3RlciB8IG51bGw7XG4gICAgaWYgKGZvb3RlciA9IHJlYWRGaWxlU2NoZW1hKGJiKSkge1xuICAgICAgICBzY2hlbWEgPSBmb290ZXIuc2NoZW1hO1xuICAgICAgICByZWFkTWVzc2FnZXMgPSByZWFkRmlsZU1lc3NhZ2VzKGZvb3Rlcik7XG4gICAgfSBlbHNlIGlmIChzY2hlbWEgPSByZWFkU3RyZWFtU2NoZW1hKGJiKSEpIHtcbiAgICAgICAgcmVhZE1lc3NhZ2VzID0gcmVhZFN0cmVhbU1lc3NhZ2VzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBBcnJvdyBidWZmZXInKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2NoZW1hLCByZWFkTWVzc2FnZXMgfTtcbn1cblxuY29uc3QgUEFERElORyA9IDQ7XG5jb25zdCBNQUdJQ19TVFIgPSAnQVJST1cxJztcbmNvbnN0IE1BR0lDID0gbmV3IFVpbnQ4QXJyYXkoTUFHSUNfU1RSLmxlbmd0aCk7XG5mb3IgKGxldCBpID0gMDsgaSA8IE1BR0lDX1NUUi5sZW5ndGg7IGkgKz0gMSB8IDApIHtcbiAgICBNQUdJQ1tpXSA9IE1BR0lDX1NUUi5jaGFyQ29kZUF0KGkpO1xufVxuXG5mdW5jdGlvbiBjaGVja0Zvck1hZ2ljQXJyb3dTdHJpbmcoYnVmZmVyOiBVaW50OEFycmF5LCBpbmRleCA9IDApIHtcbiAgICBmb3IgKGxldCBpID0gLTEsIG4gPSBNQUdJQy5sZW5ndGg7ICsraSA8IG47KSB7XG4gICAgICAgIGlmIChNQUdJQ1tpXSAhPT0gYnVmZmVyW2luZGV4ICsgaV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuY29uc3QgbWFnaWNMZW5ndGggPSBNQUdJQy5sZW5ndGg7XG5jb25zdCBtYWdpY0FuZFBhZGRpbmcgPSBtYWdpY0xlbmd0aCArIFBBRERJTkc7XG5jb25zdCBtYWdpY1gyQW5kUGFkZGluZyA9IG1hZ2ljTGVuZ3RoICogMiArIFBBRERJTkc7XG5cbmZ1bmN0aW9uIHJlYWRTdHJlYW1TY2hlbWEoYmI6IEJ5dGVCdWZmZXIpIHtcbiAgICBpZiAoIWNoZWNrRm9yTWFnaWNBcnJvd1N0cmluZyhiYi5ieXRlcygpLCAwKSkge1xuICAgICAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgcmVhZE1lc3NhZ2VzKGJiKSkge1xuICAgICAgICAgICAgaWYgKE1lc3NhZ2UuaXNTY2hlbWEobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZSBhcyBTY2hlbWE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uKiByZWFkU3RyZWFtTWVzc2FnZXMoYmI6IEJ5dGVCdWZmZXIpIHtcbiAgICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgcmVhZE1lc3NhZ2VzKGJiKSkge1xuICAgICAgICBpZiAoTWVzc2FnZS5pc1JlY29yZEJhdGNoKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB5aWVsZCBtZXNzYWdlO1xuICAgICAgICB9IGVsc2UgaWYgKE1lc3NhZ2UuaXNEaWN0aW9uYXJ5QmF0Y2gobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHlpZWxkIG1lc3NhZ2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBwb3NpdGlvbiB0aGUgYnVmZmVyIGFmdGVyIHRoZSBib2R5IHRvIHJlYWQgdGhlIG5leHQgbWVzc2FnZVxuICAgICAgICBiYi5zZXRQb3NpdGlvbihiYi5wb3NpdGlvbigpICsgbWVzc2FnZS5ib2R5TGVuZ3RoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRGaWxlU2NoZW1hKGJiOiBCeXRlQnVmZmVyKSB7XG4gICAgbGV0IGZpbGVMZW5ndGggPSBiYi5jYXBhY2l0eSgpLCBmb290ZXJMZW5ndGg6IG51bWJlciwgZm9vdGVyT2Zmc2V0OiBudW1iZXI7XG4gICAgaWYgKChmaWxlTGVuZ3RoIDwgbWFnaWNYMkFuZFBhZGRpbmcgLyogICAgICAgICAgICAgICAgICAgICBBcnJvdyBidWZmZXIgdG9vIHNtYWxsICovKSB8fFxuICAgICAgICAoIWNoZWNrRm9yTWFnaWNBcnJvd1N0cmluZyhiYi5ieXRlcygpLCAwKSAvKiAgICAgICAgICAgICAgICAgICAgICAgIE1pc3NpbmcgbWFnaWMgc3RhcnQgICAgKi8pIHx8XG4gICAgICAgICghY2hlY2tGb3JNYWdpY0Fycm93U3RyaW5nKGJiLmJ5dGVzKCksIGZpbGVMZW5ndGggLSBtYWdpY0xlbmd0aCkgLyogTWlzc2luZyBtYWdpYyBlbmQgICAgICAqLykgfHxcbiAgICAgICAgKC8qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEludmFsaWQgZm9vdGVyIGxlbmd0aCAgKi9cbiAgICAgICAgKGZvb3Rlckxlbmd0aCA9IGJiLnJlYWRJbnQzMihmb290ZXJPZmZzZXQgPSBmaWxlTGVuZ3RoIC0gbWFnaWNBbmRQYWRkaW5nKSkgPCAxICYmXG4gICAgICAgIChmb290ZXJMZW5ndGggKyBtYWdpY1gyQW5kUGFkZGluZyA+IGZpbGVMZW5ndGgpKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgYmIuc2V0UG9zaXRpb24oZm9vdGVyT2Zmc2V0IC0gZm9vdGVyTGVuZ3RoKTtcbiAgICByZXR1cm4gZm9vdGVyRnJvbUJ5dGVCdWZmZXIoYmIpO1xufVxuXG5mdW5jdGlvbiByZWFkRmlsZU1lc3NhZ2VzKGZvb3RlcjogRm9vdGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKiAoYmI6IEJ5dGVCdWZmZXIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IC0xLCBiYXRjaGVzID0gZm9vdGVyLmRpY3Rpb25hcnlCYXRjaGVzLCBuID0gYmF0Y2hlcy5sZW5ndGg7ICsraSA8IG47KSB7XG4gICAgICAgICAgICBiYi5zZXRQb3NpdGlvbihiYXRjaGVzW2ldLm9mZnNldC5sb3cpO1xuICAgICAgICAgICAgeWllbGQgcmVhZE1lc3NhZ2UoYmIsIGJiLnJlYWRJbnQzMihiYi5wb3NpdGlvbigpKSkgYXMgRGljdGlvbmFyeUJhdGNoO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAtMSwgYmF0Y2hlcyA9IGZvb3Rlci5yZWNvcmRCYXRjaGVzLCBuID0gYmF0Y2hlcy5sZW5ndGg7ICsraSA8IG47KSB7XG4gICAgICAgICAgICBiYi5zZXRQb3NpdGlvbihiYXRjaGVzW2ldLm9mZnNldC5sb3cpO1xuICAgICAgICAgICAgeWllbGQgcmVhZE1lc3NhZ2UoYmIsIGJiLnJlYWRJbnQzMihiYi5wb3NpdGlvbigpKSkgYXMgUmVjb3JkQmF0Y2hNZXRhZGF0YTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uKiByZWFkTWVzc2FnZXMoYmI6IEJ5dGVCdWZmZXIpIHtcbiAgICBsZXQgbGVuZ3RoOiBudW1iZXIsIG1lc3NhZ2U6IFNjaGVtYSB8IFJlY29yZEJhdGNoTWV0YWRhdGEgfCBEaWN0aW9uYXJ5QmF0Y2g7XG4gICAgd2hpbGUgKGJiLnBvc2l0aW9uKCkgPCBiYi5jYXBhY2l0eSgpICYmXG4gICAgICAgICAgKGxlbmd0aCA9IGJiLnJlYWRJbnQzMihiYi5wb3NpdGlvbigpKSkgPiAwKSB7XG4gICAgICAgIGlmIChtZXNzYWdlID0gcmVhZE1lc3NhZ2UoYmIsIGxlbmd0aCkhKSB7XG4gICAgICAgICAgICB5aWVsZCBtZXNzYWdlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZWFkTWVzc2FnZShiYjogQnl0ZUJ1ZmZlciwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICBiYi5zZXRQb3NpdGlvbihiYi5wb3NpdGlvbigpICsgUEFERElORyk7XG4gICAgY29uc3QgbWVzc2FnZSA9IG1lc3NhZ2VGcm9tQnl0ZUJ1ZmZlcihiYik7XG4gICAgYmIuc2V0UG9zaXRpb24oYmIucG9zaXRpb24oKSArIGxlbmd0aCk7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG59XG5cbmltcG9ydCAqIGFzIEZpbGVfIGZyb20gJy4uLy4uL2ZiL0ZpbGUnO1xuaW1wb3J0ICogYXMgU2NoZW1hXyBmcm9tICcuLi8uLi9mYi9TY2hlbWEnO1xuaW1wb3J0ICogYXMgTWVzc2FnZV8gZnJvbSAnLi4vLi4vZmIvTWVzc2FnZSc7XG5cbmltcG9ydCBUeXBlID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuVHlwZTtcbmltcG9ydCBQcmVjaXNpb24gPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5QcmVjaXNpb247XG5pbXBvcnQgTWVzc2FnZUhlYWRlciA9IE1lc3NhZ2VfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5NZXNzYWdlSGVhZGVyO1xuaW1wb3J0IE1ldGFkYXRhVmVyc2lvbiA9IFNjaGVtYV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLk1ldGFkYXRhVmVyc2lvbjtcbmltcG9ydCBfRm9vdGVyID0gRmlsZV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLkZvb3RlcjtcbmltcG9ydCBfQmxvY2sgPSBGaWxlXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuQmxvY2s7XG5pbXBvcnQgX01lc3NhZ2UgPSBNZXNzYWdlXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuTWVzc2FnZTtcbmltcG9ydCBfU2NoZW1hID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuU2NoZW1hO1xuaW1wb3J0IF9GaWVsZCA9IFNjaGVtYV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLkZpZWxkO1xuaW1wb3J0IF9SZWNvcmRCYXRjaCA9IE1lc3NhZ2VfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5SZWNvcmRCYXRjaDtcbmltcG9ydCBfRGljdGlvbmFyeUJhdGNoID0gTWVzc2FnZV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLkRpY3Rpb25hcnlCYXRjaDtcbmltcG9ydCBfRmllbGROb2RlID0gTWVzc2FnZV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLkZpZWxkTm9kZTtcbmltcG9ydCBfQnVmZmVyID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuQnVmZmVyO1xuaW1wb3J0IF9EaWN0aW9uYXJ5RW5jb2RpbmcgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5EaWN0aW9uYXJ5RW5jb2Rpbmc7XG5pbXBvcnQgX051bGwgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5OdWxsO1xuaW1wb3J0IF9JbnQgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5JbnQ7XG5pbXBvcnQgX0Zsb2F0aW5nUG9pbnQgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5GbG9hdGluZ1BvaW50O1xuaW1wb3J0IF9CaW5hcnkgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5CaW5hcnk7XG5pbXBvcnQgX0Jvb2wgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5Cb29sO1xuaW1wb3J0IF9VdGY4ID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuVXRmODtcbmltcG9ydCBfRGVjaW1hbCA9IFNjaGVtYV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLkRlY2ltYWw7XG5pbXBvcnQgX0RhdGUgPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5EYXRlO1xuaW1wb3J0IF9UaW1lID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuVGltZTtcbmltcG9ydCBfVGltZXN0YW1wID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuVGltZXN0YW1wO1xuaW1wb3J0IF9JbnRlcnZhbCA9IFNjaGVtYV8ub3JnLmFwYWNoZS5hcnJvdy5mbGF0YnVmLkludGVydmFsO1xuaW1wb3J0IF9MaXN0ID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuTGlzdDtcbmltcG9ydCBfU3RydWN0ID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuU3RydWN0XztcbmltcG9ydCBfVW5pb24gPSBTY2hlbWFfLm9yZy5hcGFjaGUuYXJyb3cuZmxhdGJ1Zi5VbmlvbjtcbmltcG9ydCBfRml4ZWRTaXplQmluYXJ5ID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuRml4ZWRTaXplQmluYXJ5O1xuaW1wb3J0IF9GaXhlZFNpemVMaXN0ID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuRml4ZWRTaXplTGlzdDtcbmltcG9ydCBfTWFwID0gU2NoZW1hXy5vcmcuYXBhY2hlLmFycm93LmZsYXRidWYuTWFwO1xuXG5mdW5jdGlvbiBmb290ZXJGcm9tQnl0ZUJ1ZmZlcihiYjogQnl0ZUJ1ZmZlcikge1xuICAgIGNvbnN0IGRpY3Rpb25hcnlGaWVsZHMgPSBuZXcgTWFwPG51bWJlciwgRmllbGQ8RGljdGlvbmFyeT4+KCk7XG4gICAgY29uc3QgZiA9IF9Gb290ZXIuZ2V0Um9vdEFzRm9vdGVyKGJiKSwgcyA9IGYuc2NoZW1hKCkhO1xuICAgIHJldHVybiBuZXcgRm9vdGVyKFxuICAgICAgICBkaWN0aW9uYXJ5QmF0Y2hlc0Zyb21Gb290ZXIoZiksIHJlY29yZEJhdGNoZXNGcm9tRm9vdGVyKGYpLFxuICAgICAgICBuZXcgU2NoZW1hKGZpZWxkc0Zyb21TY2hlbWEocywgZGljdGlvbmFyeUZpZWxkcyksIGN1c3RvbU1ldGFkYXRhKHMpLCBmLnZlcnNpb24oKSwgZGljdGlvbmFyeUZpZWxkcylcbiAgICApO1xufVxuXG5mdW5jdGlvbiBtZXNzYWdlRnJvbUJ5dGVCdWZmZXIoYmI6IEJ5dGVCdWZmZXIpIHtcbiAgICBjb25zdCBtID0gX01lc3NhZ2UuZ2V0Um9vdEFzTWVzc2FnZShiYikhLCB0eXBlID0gbS5oZWFkZXJUeXBlKCksIHZlcnNpb24gPSBtLnZlcnNpb24oKTtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBNZXNzYWdlSGVhZGVyLlNjaGVtYTogcmV0dXJuIHNjaGVtYUZyb21NZXNzYWdlKHZlcnNpb24sIG0uaGVhZGVyKG5ldyBfU2NoZW1hKCkpISwgbmV3IE1hcCgpKTtcbiAgICAgICAgY2FzZSBNZXNzYWdlSGVhZGVyLlJlY29yZEJhdGNoOiByZXR1cm4gcmVjb3JkQmF0Y2hGcm9tTWVzc2FnZSh2ZXJzaW9uLCBtLmhlYWRlcihuZXcgX1JlY29yZEJhdGNoKCkpISk7XG4gICAgICAgIGNhc2UgTWVzc2FnZUhlYWRlci5EaWN0aW9uYXJ5QmF0Y2g6IHJldHVybiBkaWN0aW9uYXJ5QmF0Y2hGcm9tTWVzc2FnZSh2ZXJzaW9uLCBtLmhlYWRlcihuZXcgX0RpY3Rpb25hcnlCYXRjaCgpKSEpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCBNZXNzYWdlIHR5cGUgJyR7dHlwZX0nYCk7XG59XG5cbmZ1bmN0aW9uIHNjaGVtYUZyb21NZXNzYWdlKHZlcnNpb246IE1ldGFkYXRhVmVyc2lvbiwgczogX1NjaGVtYSwgZGljdGlvbmFyeUZpZWxkczogTWFwPG51bWJlciwgRmllbGQ8RGljdGlvbmFyeT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTY2hlbWEoZmllbGRzRnJvbVNjaGVtYShzLCBkaWN0aW9uYXJ5RmllbGRzKSwgY3VzdG9tTWV0YWRhdGEocyksIHZlcnNpb24sIGRpY3Rpb25hcnlGaWVsZHMpO1xufVxuXG5mdW5jdGlvbiByZWNvcmRCYXRjaEZyb21NZXNzYWdlKHZlcnNpb246IE1ldGFkYXRhVmVyc2lvbiwgYjogX1JlY29yZEJhdGNoKSB7XG4gICAgcmV0dXJuIG5ldyBSZWNvcmRCYXRjaE1ldGFkYXRhKHZlcnNpb24sIGIubGVuZ3RoKCksIGZpZWxkTm9kZXNGcm9tUmVjb3JkQmF0Y2goYiksIGJ1ZmZlcnNGcm9tUmVjb3JkQmF0Y2goYiwgdmVyc2lvbikpO1xufVxuXG5mdW5jdGlvbiBkaWN0aW9uYXJ5QmF0Y2hGcm9tTWVzc2FnZSh2ZXJzaW9uOiBNZXRhZGF0YVZlcnNpb24sIGQ6IF9EaWN0aW9uYXJ5QmF0Y2gpIHtcbiAgICByZXR1cm4gbmV3IERpY3Rpb25hcnlCYXRjaCh2ZXJzaW9uLCByZWNvcmRCYXRjaEZyb21NZXNzYWdlKHZlcnNpb24sIGQuZGF0YSgpISksIGQuaWQoKSwgZC5pc0RlbHRhKCkpO1xufVxuXG5mdW5jdGlvbiBkaWN0aW9uYXJ5QmF0Y2hlc0Zyb21Gb290ZXIoZjogX0Zvb3Rlcikge1xuICAgIGNvbnN0IGJsb2NrcyA9IFtdIGFzIEZpbGVCbG9ja1tdO1xuICAgIGZvciAobGV0IGI6IF9CbG9jaywgaSA9IC0xLCBuID0gZiAmJiBmLmRpY3Rpb25hcmllc0xlbmd0aCgpOyArK2kgPCBuOykge1xuICAgICAgICBpZiAoYiA9IGYuZGljdGlvbmFyaWVzKGkpISkge1xuICAgICAgICAgICAgYmxvY2tzLnB1c2gobmV3IEZpbGVCbG9jayhiLm1ldGFEYXRhTGVuZ3RoKCksIGIuYm9keUxlbmd0aCgpLCBiLm9mZnNldCgpKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJsb2Nrcztcbn1cblxuZnVuY3Rpb24gcmVjb3JkQmF0Y2hlc0Zyb21Gb290ZXIoZjogX0Zvb3Rlcikge1xuICAgIGNvbnN0IGJsb2NrcyA9IFtdIGFzIEZpbGVCbG9ja1tdO1xuICAgIGZvciAobGV0IGI6IF9CbG9jaywgaSA9IC0xLCBuID0gZiAmJiBmLnJlY29yZEJhdGNoZXNMZW5ndGgoKTsgKytpIDwgbjspIHtcbiAgICAgICAgaWYgKGIgPSBmLnJlY29yZEJhdGNoZXMoaSkhKSB7XG4gICAgICAgICAgICBibG9ja3MucHVzaChuZXcgRmlsZUJsb2NrKGIubWV0YURhdGFMZW5ndGgoKSwgYi5ib2R5TGVuZ3RoKCksIGIub2Zmc2V0KCkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYmxvY2tzO1xufVxuXG5mdW5jdGlvbiBmaWVsZHNGcm9tU2NoZW1hKHM6IF9TY2hlbWEsIGRpY3Rpb25hcnlGaWVsZHM6IE1hcDxudW1iZXIsIEZpZWxkPERpY3Rpb25hcnk+PiB8IG51bGwpIHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXSBhcyBGaWVsZFtdO1xuICAgIGZvciAobGV0IGkgPSAtMSwgYzogRmllbGQgfCBudWxsLCBuID0gcyAmJiBzLmZpZWxkc0xlbmd0aCgpOyArK2kgPCBuOykge1xuICAgICAgICBpZiAoYyA9IGZpZWxkKHMuZmllbGRzKGkpISwgZGljdGlvbmFyeUZpZWxkcykpIHtcbiAgICAgICAgICAgIGZpZWxkcy5wdXNoKGMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmZ1bmN0aW9uIGZpZWxkc0Zyb21GaWVsZChmOiBfRmllbGQsIGRpY3Rpb25hcnlGaWVsZHM6IE1hcDxudW1iZXIsIEZpZWxkPERpY3Rpb25hcnk+PiB8IG51bGwpIHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXSBhcyBGaWVsZFtdO1xuICAgIGZvciAobGV0IGkgPSAtMSwgYzogRmllbGQgfCBudWxsLCBuID0gZiAmJiBmLmNoaWxkcmVuTGVuZ3RoKCk7ICsraSA8IG47KSB7XG4gICAgICAgIGlmIChjID0gZmllbGQoZi5jaGlsZHJlbihpKSEsIGRpY3Rpb25hcnlGaWVsZHMpKSB7XG4gICAgICAgICAgICBmaWVsZHMucHVzaChjKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5mdW5jdGlvbiBmaWVsZE5vZGVzRnJvbVJlY29yZEJhdGNoKGI6IF9SZWNvcmRCYXRjaCkge1xuICAgIGNvbnN0IGZpZWxkTm9kZXMgPSBbXSBhcyBGaWVsZE1ldGFkYXRhW107XG4gICAgZm9yIChsZXQgaSA9IC0xLCBuID0gYi5ub2Rlc0xlbmd0aCgpOyArK2kgPCBuOykge1xuICAgICAgICBmaWVsZE5vZGVzLnB1c2goZmllbGROb2RlRnJvbVJlY29yZEJhdGNoKGIubm9kZXMoaSkhKSk7XG4gICAgfVxuICAgIHJldHVybiBmaWVsZE5vZGVzO1xufVxuXG5mdW5jdGlvbiBidWZmZXJzRnJvbVJlY29yZEJhdGNoKGI6IF9SZWNvcmRCYXRjaCwgdmVyc2lvbjogTWV0YWRhdGFWZXJzaW9uKSB7XG4gICAgY29uc3QgYnVmZmVycyA9IFtdIGFzIEJ1ZmZlck1ldGFkYXRhW107XG4gICAgZm9yIChsZXQgaSA9IC0xLCBuID0gYi5idWZmZXJzTGVuZ3RoKCk7ICsraSA8IG47KSB7XG4gICAgICAgIGxldCBidWZmZXIgPSBiLmJ1ZmZlcnMoaSkhO1xuICAgICAgICAvLyBJZiB0aGlzIEFycm93IGJ1ZmZlciB3YXMgd3JpdHRlbiBiZWZvcmUgdmVyc2lvbiA0LFxuICAgICAgICAvLyBhZHZhbmNlIHRoZSBidWZmZXIncyBiYl9wb3MgOCBieXRlcyB0byBza2lwIHBhc3RcbiAgICAgICAgLy8gdGhlIG5vdy1yZW1vdmVkIHBhZ2UgaWQgZmllbGQuXG4gICAgICAgIGlmICh2ZXJzaW9uIDwgTWV0YWRhdGFWZXJzaW9uLlY0KSB7XG4gICAgICAgICAgICBidWZmZXIuYmJfcG9zICs9ICg4ICogKGkgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgYnVmZmVycy5wdXNoKGJ1ZmZlckZyb21SZWNvcmRCYXRjaChidWZmZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcnM7XG59XG5cbmZ1bmN0aW9uIGZpZWxkKGY6IF9GaWVsZCwgZGljdGlvbmFyeUZpZWxkczogTWFwPG51bWJlciwgRmllbGQ8RGljdGlvbmFyeT4+IHwgbnVsbCkge1xuICAgIGxldCBuYW1lID0gZi5uYW1lKCkhO1xuICAgIGxldCBmaWVsZDogRmllbGQgfCB2b2lkO1xuICAgIGxldCBudWxsYWJsZSA9IGYubnVsbGFibGUoKTtcbiAgICBsZXQgbWV0YWRhdGEgPSBjdXN0b21NZXRhZGF0YShmKTtcbiAgICBsZXQgZGF0YVR5cGU6IERhdGFUeXBlPGFueT4gfCBudWxsO1xuICAgIGxldCBrZXlzTWV0YTogX0ludCB8IG51bGwsIGlkOiBudW1iZXI7XG4gICAgbGV0IGRpY3RNZXRhOiBfRGljdGlvbmFyeUVuY29kaW5nIHwgbnVsbDtcbiAgICBpZiAoIWRpY3Rpb25hcnlGaWVsZHMgfHwgIShkaWN0TWV0YSA9IGYuZGljdGlvbmFyeSgpKSkge1xuICAgICAgICBpZiAoZGF0YVR5cGUgPSB0eXBlRnJvbUZpZWxkKGYsIGZpZWxkc0Zyb21GaWVsZChmLCBkaWN0aW9uYXJ5RmllbGRzKSkpIHtcbiAgICAgICAgICAgIGZpZWxkID0gbmV3IEZpZWxkKG5hbWUsIGRhdGFUeXBlLCBudWxsYWJsZSwgbWV0YWRhdGEpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChkYXRhVHlwZSA9IGRpY3Rpb25hcnlGaWVsZHMuaGFzKGlkID0gZGljdE1ldGEuaWQoKS5sb3cpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGRpY3Rpb25hcnlGaWVsZHMuZ2V0KGlkKSEudHlwZS5kaWN0aW9uYXJ5XG4gICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGVGcm9tRmllbGQoZiwgZmllbGRzRnJvbUZpZWxkKGYsIG51bGwpKSkge1xuICAgICAgICBkYXRhVHlwZSA9IG5ldyBEaWN0aW9uYXJ5KGRhdGFUeXBlLFxuICAgICAgICAgICAgLy8gYSBkaWN0aW9uYXJ5IGluZGV4IGRlZmF1bHRzIHRvIHNpZ25lZCAzMiBiaXQgaW50IGlmIHVuc3BlY2lmaWVkXG4gICAgICAgICAgICAoa2V5c01ldGEgPSBkaWN0TWV0YS5pbmRleFR5cGUoKSkgPyBpbnRGcm9tRmllbGQoa2V5c01ldGEpISA6IG5ldyBJbnQzMigpLFxuICAgICAgICAgICAgaWQsIGRpY3RNZXRhLmlzT3JkZXJlZCgpXG4gICAgICAgICk7XG4gICAgICAgIGZpZWxkID0gbmV3IEZpZWxkKG5hbWUsIGRhdGFUeXBlLCBudWxsYWJsZSwgbWV0YWRhdGEpO1xuICAgICAgICBkaWN0aW9uYXJ5RmllbGRzLmhhcyhpZCkgfHwgZGljdGlvbmFyeUZpZWxkcy5zZXQoaWQsIGZpZWxkIGFzIEZpZWxkPERpY3Rpb25hcnk+KTtcbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkIHx8IG51bGw7XG59XG5cbmZ1bmN0aW9uIGN1c3RvbU1ldGFkYXRhKHBhcmVudD86IF9TY2hlbWEgfCBfRmllbGQgfCBudWxsKSB7XG4gICAgY29uc3QgZGF0YSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBmb3IgKGxldCBlbnRyeSwga2V5LCBpID0gLTEsIG4gPSBwYXJlbnQuY3VzdG9tTWV0YWRhdGFMZW5ndGgoKSB8IDA7ICsraSA8IG47KSB7XG4gICAgICAgICAgICBpZiAoKGVudHJ5ID0gcGFyZW50LmN1c3RvbU1ldGFkYXRhKGkpKSAmJiAoa2V5ID0gZW50cnkua2V5KCkpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnNldChrZXksIGVudHJ5LnZhbHVlKCkhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbn1cblxuZnVuY3Rpb24gZmllbGROb2RlRnJvbVJlY29yZEJhdGNoKGY6IF9GaWVsZE5vZGUpIHtcbiAgICByZXR1cm4gbmV3IEZpZWxkTWV0YWRhdGEoZi5sZW5ndGgoKSwgZi5udWxsQ291bnQoKSk7XG59XG5cbmZ1bmN0aW9uIGJ1ZmZlckZyb21SZWNvcmRCYXRjaChiOiBfQnVmZmVyKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXJNZXRhZGF0YShiLm9mZnNldCgpLCBiLmxlbmd0aCgpKTtcbn1cblxuZnVuY3Rpb24gdHlwZUZyb21GaWVsZChmOiBfRmllbGQsIGNoaWxkcmVuPzogRmllbGRbXSk6IERhdGFUeXBlPGFueT4gfCBudWxsIHtcbiAgICBzd2l0Y2ggKGYudHlwZVR5cGUoKSkge1xuICAgICAgICBjYXNlIFR5cGUuTk9ORTogcmV0dXJuIG51bGw7XG4gICAgICAgIGNhc2UgVHlwZS5OdWxsOiByZXR1cm4gbnVsbEZyb21GaWVsZChmLnR5cGUobmV3IF9OdWxsKCkpISk7XG4gICAgICAgIGNhc2UgVHlwZS5JbnQ6IHJldHVybiBpbnRGcm9tRmllbGQoZi50eXBlKG5ldyBfSW50KCkpISk7XG4gICAgICAgIGNhc2UgVHlwZS5GbG9hdGluZ1BvaW50OiByZXR1cm4gZmxvYXRGcm9tRmllbGQoZi50eXBlKG5ldyBfRmxvYXRpbmdQb2ludCgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuQmluYXJ5OiByZXR1cm4gYmluYXJ5RnJvbUZpZWxkKGYudHlwZShuZXcgX0JpbmFyeSgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuVXRmODogcmV0dXJuIHV0ZjhGcm9tRmllbGQoZi50eXBlKG5ldyBfVXRmOCgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuQm9vbDogcmV0dXJuIGJvb2xGcm9tRmllbGQoZi50eXBlKG5ldyBfQm9vbCgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuRGVjaW1hbDogcmV0dXJuIGRlY2ltYWxGcm9tRmllbGQoZi50eXBlKG5ldyBfRGVjaW1hbCgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuRGF0ZTogcmV0dXJuIGRhdGVGcm9tRmllbGQoZi50eXBlKG5ldyBfRGF0ZSgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuVGltZTogcmV0dXJuIHRpbWVGcm9tRmllbGQoZi50eXBlKG5ldyBfVGltZSgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuVGltZXN0YW1wOiByZXR1cm4gdGltZXN0YW1wRnJvbUZpZWxkKGYudHlwZShuZXcgX1RpbWVzdGFtcCgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuSW50ZXJ2YWw6IHJldHVybiBpbnRlcnZhbEZyb21GaWVsZChmLnR5cGUobmV3IF9JbnRlcnZhbCgpKSEpO1xuICAgICAgICBjYXNlIFR5cGUuTGlzdDogcmV0dXJuIGxpc3RGcm9tRmllbGQoZi50eXBlKG5ldyBfTGlzdCgpKSEsIGNoaWxkcmVuIHx8IFtdKTtcbiAgICAgICAgY2FzZSBUeXBlLlN0cnVjdF86IHJldHVybiBzdHJ1Y3RGcm9tRmllbGQoZi50eXBlKG5ldyBfU3RydWN0KCkpISwgY2hpbGRyZW4gfHwgW10pO1xuICAgICAgICBjYXNlIFR5cGUuVW5pb246IHJldHVybiB1bmlvbkZyb21GaWVsZChmLnR5cGUobmV3IF9VbmlvbigpKSEsIGNoaWxkcmVuIHx8IFtdKTtcbiAgICAgICAgY2FzZSBUeXBlLkZpeGVkU2l6ZUJpbmFyeTogcmV0dXJuIGZpeGVkU2l6ZUJpbmFyeUZyb21GaWVsZChmLnR5cGUobmV3IF9GaXhlZFNpemVCaW5hcnkoKSkhKTtcbiAgICAgICAgY2FzZSBUeXBlLkZpeGVkU2l6ZUxpc3Q6IHJldHVybiBmaXhlZFNpemVMaXN0RnJvbUZpZWxkKGYudHlwZShuZXcgX0ZpeGVkU2l6ZUxpc3QoKSkhLCBjaGlsZHJlbiB8fCBbXSk7XG4gICAgICAgIGNhc2UgVHlwZS5NYXA6IHJldHVybiBtYXBGcm9tRmllbGQoZi50eXBlKG5ldyBfTWFwKCkpISwgY2hpbGRyZW4gfHwgW10pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVjb2duaXplZCB0eXBlICR7Zi50eXBlVHlwZSgpfWApO1xufVxuXG5mdW5jdGlvbiBudWxsRnJvbUZpZWxkICAgICAgICAgICAoX3R5cGU6IF9OdWxsKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByZXR1cm4gbmV3IE51bGwoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuZnVuY3Rpb24gaW50RnJvbUZpZWxkICAgICAgICAgICAgKF90eXBlOiBfSW50KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgc3dpdGNoIChfdHlwZS5iaXRXaWR0aCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAgODogcmV0dXJuIF90eXBlLmlzU2lnbmVkKCkgPyBuZXcgIEludDgoKSA6IG5ldyAgVWludDgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE2OiByZXR1cm4gX3R5cGUuaXNTaWduZWQoKSA/IG5ldyBJbnQxNigpIDogbmV3IFVpbnQxNigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMzI6IHJldHVybiBfdHlwZS5pc1NpZ25lZCgpID8gbmV3IEludDMyKCkgOiBuZXcgVWludDMyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSA2NDogcmV0dXJuIF90eXBlLmlzU2lnbmVkKCkgPyBuZXcgSW50NjQoKSA6IG5ldyBVaW50NjQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5mdW5jdGlvbiBmbG9hdEZyb21GaWVsZCAgICAgICAgICAoX3R5cGU6IF9GbG9hdGluZ1BvaW50KSAgICAgICAgICAgICAgICAgICAgeyBzd2l0Y2ggKF90eXBlLnByZWNpc2lvbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcmVjaXNpb24uSEFMRjogcmV0dXJuIG5ldyBGbG9hdDE2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBQcmVjaXNpb24uU0lOR0xFOiByZXR1cm4gbmV3IEZsb2F0MzIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFByZWNpc2lvbi5ET1VCTEU6IHJldHVybiBuZXcgRmxvYXQ2NCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbmZ1bmN0aW9uIGJpbmFyeUZyb21GaWVsZCAgICAgICAgIChfdHlwZTogX0JpbmFyeSkgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJldHVybiBuZXcgQmluYXJ5KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5mdW5jdGlvbiB1dGY4RnJvbUZpZWxkICAgICAgICAgICAoX3R5cGU6IF9VdGY4KSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByZXR1cm4gbmV3IFV0ZjgoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuZnVuY3Rpb24gYm9vbEZyb21GaWVsZCAgICAgICAgICAgKF90eXBlOiBfQm9vbCkgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcmV0dXJuIG5ldyBCb29sKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbmZ1bmN0aW9uIGRlY2ltYWxGcm9tRmllbGQgICAgICAgIChfdHlwZTogX0RlY2ltYWwpICAgICAgICAgICAgICAgICAgICAgICAgICB7IHJldHVybiBuZXcgRGVjaW1hbChfdHlwZS5zY2FsZSgpLCBfdHlwZS5wcmVjaXNpb24oKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5mdW5jdGlvbiBkYXRlRnJvbUZpZWxkICAgICAgICAgICAoX3R5cGU6IF9EYXRlKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyByZXR1cm4gbmV3IERhdGVfKF90eXBlLnVuaXQoKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuZnVuY3Rpb24gdGltZUZyb21GaWVsZCAgICAgICAgICAgKF90eXBlOiBfVGltZSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgcmV0dXJuIG5ldyBUaW1lKF90eXBlLnVuaXQoKSwgX3R5cGUuYml0V2lkdGgoKSBhcyBUaW1lQml0V2lkdGgpOyAgICAgICAgICAgICAgICAgIH1cbmZ1bmN0aW9uIHRpbWVzdGFtcEZyb21GaWVsZCAgICAgIChfdHlwZTogX1RpbWVzdGFtcCkgICAgICAgICAgICAgICAgICAgICAgICB7IHJldHVybiBuZXcgVGltZXN0YW1wKF90eXBlLnVuaXQoKSwgX3R5cGUudGltZXpvbmUoKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5mdW5jdGlvbiBpbnRlcnZhbEZyb21GaWVsZCAgICAgICAoX3R5cGU6IF9JbnRlcnZhbCkgICAgICAgICAgICAgICAgICAgICAgICAgeyByZXR1cm4gbmV3IEludGVydmFsKF90eXBlLnVuaXQoKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuZnVuY3Rpb24gbGlzdEZyb21GaWVsZCAgICAgICAgICAgKF90eXBlOiBfTGlzdCwgY2hpbGRyZW46IEZpZWxkW10pICAgICAgICAgIHsgcmV0dXJuIG5ldyBMaXN0KGNoaWxkcmVuKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbmZ1bmN0aW9uIHN0cnVjdEZyb21GaWVsZCAgICAgICAgIChfdHlwZTogX1N0cnVjdCwgY2hpbGRyZW46IEZpZWxkW10pICAgICAgICB7IHJldHVybiBuZXcgU3RydWN0KGNoaWxkcmVuKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5mdW5jdGlvbiB1bmlvbkZyb21GaWVsZCAgICAgICAgICAoX3R5cGU6IF9VbmlvbiwgY2hpbGRyZW46IEZpZWxkW10pICAgICAgICAgeyByZXR1cm4gbmV3IFVuaW9uKF90eXBlLm1vZGUoKSwgKF90eXBlLnR5cGVJZHNBcnJheSgpIHx8IFtdKSBhcyBUeXBlW10sIGNoaWxkcmVuKTsgfVxuZnVuY3Rpb24gZml4ZWRTaXplQmluYXJ5RnJvbUZpZWxkKF90eXBlOiBfRml4ZWRTaXplQmluYXJ5KSAgICAgICAgICAgICAgICAgIHsgcmV0dXJuIG5ldyBGaXhlZFNpemVCaW5hcnkoX3R5cGUuYnl0ZVdpZHRoKCkpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbmZ1bmN0aW9uIGZpeGVkU2l6ZUxpc3RGcm9tRmllbGQgIChfdHlwZTogX0ZpeGVkU2l6ZUxpc3QsIGNoaWxkcmVuOiBGaWVsZFtdKSB7IHJldHVybiBuZXcgRml4ZWRTaXplTGlzdChfdHlwZS5saXN0U2l6ZSgpLCBjaGlsZHJlbik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5mdW5jdGlvbiBtYXBGcm9tRmllbGQgICAgICAgICAgICAoX3R5cGU6IF9NYXAsIGNoaWxkcmVuOiBGaWVsZFtdKSAgICAgICAgICAgeyByZXR1cm4gbmV3IE1hcF8oX3R5cGUua2V5c1NvcnRlZCgpLCBjaGlsZHJlbik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuIl19
