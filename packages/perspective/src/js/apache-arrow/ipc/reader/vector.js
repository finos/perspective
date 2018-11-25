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
import { Vector } from '../../vector';
import { RecordBatch } from '../../recordbatch';
import { TypeVisitor } from '../../visitor';
import { Message } from '../metadata';
import { FlatData, ListData, NestedData, SingleNestedData, DenseUnionData, SparseUnionData, BoolData, FlatListData, DictionaryData } from '../../data';
import { UnionMode, } from '../../type';
export function readRecordBatches(messages) {
    var messages_1, messages_1_1, _a, schema, message, loader, e_1_1, e_1, _b;
    return tslib_1.__generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, 6, 7]);
                messages_1 = tslib_1.__values(messages), messages_1_1 = messages_1.next();
                _c.label = 1;
            case 1:
                if (!!messages_1_1.done) return [3 /*break*/, 4];
                _a = messages_1_1.value, schema = _a.schema, message = _a.message, loader = _a.loader;
                return [5 /*yield**/, tslib_1.__values(readRecordBatch(schema, message, loader))];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                messages_1_1 = messages_1.next();
                return [3 /*break*/, 1];
            case 4: return [3 /*break*/, 7];
            case 5:
                e_1_1 = _c.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 7];
            case 6:
                try {
                    if (messages_1_1 && !messages_1_1.done && (_b = messages_1.return)) _b.call(messages_1);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}
export function readRecordBatchesAsync(messages) {
    return tslib_1.__asyncGenerator(this, arguments, function readRecordBatchesAsync_1() {
        var messages_2, messages_2_1, _a, schema, message, loader, e_2_1, e_2, _b;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 8, 9, 14]);
                    messages_2 = tslib_1.__asyncValues(messages);
                    _c.label = 1;
                case 1: return [4 /*yield*/, tslib_1.__await(messages_2.next())];
                case 2:
                    if (!(messages_2_1 = _c.sent(), !messages_2_1.done)) return [3 /*break*/, 7];
                    return [4 /*yield*/, tslib_1.__await(messages_2_1.value)];
                case 3:
                    _a = _c.sent(), schema = _a.schema, message = _a.message, loader = _a.loader;
                    return [5 /*yield**/, tslib_1.__values(tslib_1.__asyncDelegator(tslib_1.__asyncValues(readRecordBatch(schema, message, loader))))];
                case 4: return [4 /*yield*/, tslib_1.__await.apply(void 0, [_c.sent()])];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [3 /*break*/, 1];
                case 7: return [3 /*break*/, 14];
                case 8:
                    e_2_1 = _c.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 14];
                case 9:
                    _c.trys.push([9, , 12, 13]);
                    if (!(messages_2_1 && !messages_2_1.done && (_b = messages_2.return))) return [3 /*break*/, 11];
                    return [4 /*yield*/, tslib_1.__await(_b.call(messages_2))];
                case 10:
                    _c.sent();
                    _c.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 13: return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
export function readRecordBatch(schema, message, loader) {
    var dictionaryId, dictionaries, dictionaryField, dictionaryDataType, dictionaryVector;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!Message.isRecordBatch(message)) return [3 /*break*/, 2];
                return [4 /*yield*/, new RecordBatch(schema, message.length, loader.visitFields(schema.fields))];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                if (Message.isDictionaryBatch(message)) {
                    dictionaryId = message.id;
                    dictionaries = loader.dictionaries;
                    dictionaryField = schema.dictionaries.get(dictionaryId);
                    dictionaryDataType = dictionaryField.type.dictionary;
                    dictionaryVector = Vector.create(loader.visit(dictionaryDataType));
                    if (message.isDelta && dictionaries.has(dictionaryId)) {
                        dictionaryVector = dictionaries.get(dictionaryId).concat(dictionaryVector);
                    }
                    dictionaries.set(dictionaryId, dictionaryVector);
                }
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}
var TypeDataLoader = /** @class */ (function (_super) {
    tslib_1.__extends(TypeDataLoader, _super);
    function TypeDataLoader(nodes, buffers, dictionaries) {
        var _this = _super.call(this) || this;
        _this.nodes = nodes;
        _this.buffers = buffers;
        _this.dictionaries = dictionaries;
        return _this;
    }
    TypeDataLoader.prototype.visitFields = function (fields) {
        var _this = this;
        return fields.map(function (field) { return _this.visit(field.type); });
    };
    TypeDataLoader.prototype.visitNull = function (type) { return this.visitNullType(type); };
    TypeDataLoader.prototype.visitInt = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitFloat = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitBinary = function (type) { return this.visitFlatList(type); };
    TypeDataLoader.prototype.visitUtf8 = function (type) { return this.visitFlatList(type); };
    TypeDataLoader.prototype.visitBool = function (type) { return this.visitBoolType(type); };
    TypeDataLoader.prototype.visitDecimal = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitDate = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitTime = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitTimestamp = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitInterval = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitList = function (type) { return this.visitListType(type); };
    TypeDataLoader.prototype.visitStruct = function (type) { return this.visitNestedType(type); };
    TypeDataLoader.prototype.visitUnion = function (type) { return this.visitUnionType(type); };
    TypeDataLoader.prototype.visitFixedSizeBinary = function (type) { return this.visitFlatType(type); };
    TypeDataLoader.prototype.visitFixedSizeList = function (type) { return this.visitFixedSizeListType(type); };
    TypeDataLoader.prototype.visitMap = function (type) { return this.visitNestedType(type); };
    TypeDataLoader.prototype.visitDictionary = function (type) {
        return new DictionaryData(type, this.dictionaries.get(type.id), this.visit(type.indices));
    };
    TypeDataLoader.prototype.getFieldMetadata = function () { return this.nodes.next().value; };
    TypeDataLoader.prototype.getBufferMetadata = function () { return this.buffers.next().value; };
    TypeDataLoader.prototype.readNullBitmap = function (type, nullCount, buffer) {
        if (buffer === void 0) { buffer = this.getBufferMetadata(); }
        return nullCount > 0 && this.readData(type, buffer) || new Uint8Array(0);
    };
    TypeDataLoader.prototype.visitNullType = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new FlatData(type, length, this.readNullBitmap(type, nullCount), new Uint8Array(0), 0, nullCount);
    };
    TypeDataLoader.prototype.visitFlatType = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new FlatData(type, length, this.readNullBitmap(type, nullCount), this.readData(type), 0, nullCount);
    };
    TypeDataLoader.prototype.visitBoolType = function (type, _a, data) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new BoolData(type, length, this.readNullBitmap(type, nullCount), data || this.readData(type), 0, nullCount);
    };
    TypeDataLoader.prototype.visitFlatList = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new FlatListData(type, length, this.readNullBitmap(type, nullCount), this.readOffsets(type), this.readData(type), 0, nullCount);
    };
    TypeDataLoader.prototype.visitListType = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new ListData(type, length, this.readNullBitmap(type, nullCount), this.readOffsets(type), this.visit(type.children[0].type), 0, nullCount);
    };
    TypeDataLoader.prototype.visitFixedSizeListType = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new SingleNestedData(type, length, this.readNullBitmap(type, nullCount), this.visit(type.children[0].type), 0, nullCount);
    };
    TypeDataLoader.prototype.visitNestedType = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return new NestedData(type, length, this.readNullBitmap(type, nullCount), this.visitFields(type.children), 0, nullCount);
    };
    TypeDataLoader.prototype.visitUnionType = function (type, _a) {
        var _b = _a === void 0 ? this.getFieldMetadata() : _a, length = _b.length, nullCount = _b.nullCount;
        return type.mode === UnionMode.Sparse ?
            new SparseUnionData(type, length, this.readNullBitmap(type, nullCount), this.readTypeIds(type), this.visitFields(type.children), 0, nullCount) :
            new DenseUnionData(type, length, this.readNullBitmap(type, nullCount), this.readOffsets(type), this.readTypeIds(type), this.visitFields(type.children), 0, nullCount);
    };
    return TypeDataLoader;
}(TypeVisitor));
export { TypeDataLoader };

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlwYy9yZWFkZXIvdmVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZEQUE2RDtBQUM3RCwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELDZEQUE2RDtBQUM3RCxvREFBb0Q7QUFDcEQsNkRBQTZEO0FBQzdELDZEQUE2RDtBQUM3RCxFQUFFO0FBQ0YsK0NBQStDO0FBQy9DLEVBQUU7QUFDRiw2REFBNkQ7QUFDN0QsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsMERBQTBEO0FBQzFELHFCQUFxQjs7QUFFckIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUU1QyxPQUFPLEVBQUUsT0FBTyxFQUFpQyxNQUFNLGFBQWEsQ0FBQztBQUNyRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUN2SixPQUFPLEVBT0gsU0FBUyxHQUNaLE1BQU0sWUFBWSxDQUFDO0FBRXBCLE1BQU0sNEJBQTZCLFFBQWdGOzs7Ozs7Z0JBQ3JFLGFBQUEsaUJBQUEsUUFBUSxDQUFBOzs7O2dCQUF2Qyx1QkFBMkIsRUFBekIsTUFBTSxZQUFBLEVBQUUsT0FBTyxhQUFBLEVBQUUsTUFBTSxZQUFBO2dCQUNoQyxzQkFBQSxpQkFBTyxlQUFlLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQSxFQUFBOztnQkFBL0MsU0FBK0MsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQUV2RDtBQUVELE1BQU0saUNBQXdDLFFBQXFGOzs7Ozs7O29CQUMvRSxhQUFBLHNCQUFBLFFBQVEsQ0FBQTs7Ozs7Oztv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QUUsRUFBOEQ7WUFBOUQsaURBQThELEVBQTVELGtCQUFNLEVBQUUsd0JBQVM7UUFDeEUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ25DLElBQUksZUFBZSxDQUFDLElBQW1CLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDL0osSUFBSSxjQUFjLENBQUMsSUFBa0IsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1TCxDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQXJFQSxBQXFFQyxDQXJFNEMsV0FBVyxHQXFFdkQiLCJmaWxlIjoiaXBjL3JlYWRlci92ZWN0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4vLyBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbi8vIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4vLyByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4vLyB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4vLyBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Vcbi8vIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbi8vIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4vLyBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuLy8gS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4vLyBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4vLyB1bmRlciB0aGUgTGljZW5zZS5cblxuaW1wb3J0IHsgVmVjdG9yIH0gZnJvbSAnLi4vLi4vdmVjdG9yJztcbmltcG9ydCB7IFJlY29yZEJhdGNoIH0gZnJvbSAnLi4vLi4vcmVjb3JkYmF0Y2gnO1xuaW1wb3J0IHsgVHlwZVZpc2l0b3IgfSBmcm9tICcuLi8uLi92aXNpdG9yJztcbmltcG9ydCB7IEZsYXRUeXBlLCBOZXN0ZWRUeXBlLCBMaXN0VHlwZSB9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHsgTWVzc2FnZSwgRmllbGRNZXRhZGF0YSwgQnVmZmVyTWV0YWRhdGEgfSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQgeyBGbGF0RGF0YSwgTGlzdERhdGEsIE5lc3RlZERhdGEsIFNpbmdsZU5lc3RlZERhdGEsIERlbnNlVW5pb25EYXRhLCBTcGFyc2VVbmlvbkRhdGEsIEJvb2xEYXRhLCBGbGF0TGlzdERhdGEsIERpY3Rpb25hcnlEYXRhIH0gZnJvbSAnLi4vLi4vZGF0YSc7XG5pbXBvcnQge1xuICAgIFNjaGVtYSwgRmllbGQsXG4gICAgRGljdGlvbmFyeSxcbiAgICBOdWxsLCBJbnQsIEZsb2F0LFxuICAgIEJpbmFyeSwgQm9vbCwgVXRmOCwgRGVjaW1hbCxcbiAgICBEYXRlXywgVGltZSwgVGltZXN0YW1wLCBJbnRlcnZhbCxcbiAgICBMaXN0LCBTdHJ1Y3QsIFVuaW9uLCBGaXhlZFNpemVCaW5hcnksIEZpeGVkU2l6ZUxpc3QsIE1hcF8sXG4gICAgVW5pb25Nb2RlLCBTcGFyc2VVbmlvbiwgRGVuc2VVbmlvbiwgRmxhdExpc3RUeXBlLCBEYXRhVHlwZSxcbn0gZnJvbSAnLi4vLi4vdHlwZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiogcmVhZFJlY29yZEJhdGNoZXMobWVzc2FnZXM6IEl0ZXJhYmxlPHsgc2NoZW1hOiBTY2hlbWEsIG1lc3NhZ2U6IE1lc3NhZ2UsIGxvYWRlcjogVHlwZURhdGFMb2FkZXIgfT4pIHtcbiAgICBmb3IgKGNvbnN0IHsgc2NoZW1hLCBtZXNzYWdlLCBsb2FkZXIgfSBvZiBtZXNzYWdlcykge1xuICAgICAgICB5aWVsZCogcmVhZFJlY29yZEJhdGNoKHNjaGVtYSwgbWVzc2FnZSwgbG9hZGVyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogcmVhZFJlY29yZEJhdGNoZXNBc3luYyhtZXNzYWdlczogQXN5bmNJdGVyYWJsZTx7IHNjaGVtYTogU2NoZW1hLCBtZXNzYWdlOiBNZXNzYWdlLCBsb2FkZXI6IFR5cGVEYXRhTG9hZGVyIH0+KSB7XG4gICAgZm9yIGF3YWl0IChjb25zdCB7IHNjaGVtYSwgbWVzc2FnZSwgbG9hZGVyIH0gb2YgbWVzc2FnZXMpIHtcbiAgICAgICAgeWllbGQqIHJlYWRSZWNvcmRCYXRjaChzY2hlbWEsIG1lc3NhZ2UsIGxvYWRlcik7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24qIHJlYWRSZWNvcmRCYXRjaChzY2hlbWE6IFNjaGVtYSwgbWVzc2FnZTogTWVzc2FnZSwgbG9hZGVyOiBUeXBlRGF0YUxvYWRlcikge1xuICAgIGlmIChNZXNzYWdlLmlzUmVjb3JkQmF0Y2gobWVzc2FnZSkpIHtcbiAgICAgICAgeWllbGQgbmV3IFJlY29yZEJhdGNoKHNjaGVtYSwgbWVzc2FnZS5sZW5ndGgsIGxvYWRlci52aXNpdEZpZWxkcyhzY2hlbWEuZmllbGRzKSk7XG4gICAgfSBlbHNlIGlmIChNZXNzYWdlLmlzRGljdGlvbmFyeUJhdGNoKG1lc3NhZ2UpKSB7XG4gICAgICAgIGNvbnN0IGRpY3Rpb25hcnlJZCA9IG1lc3NhZ2UuaWQ7XG4gICAgICAgIGNvbnN0IGRpY3Rpb25hcmllcyA9IGxvYWRlci5kaWN0aW9uYXJpZXM7XG4gICAgICAgIGNvbnN0IGRpY3Rpb25hcnlGaWVsZCA9IHNjaGVtYS5kaWN0aW9uYXJpZXMuZ2V0KGRpY3Rpb25hcnlJZCkhO1xuICAgICAgICBjb25zdCBkaWN0aW9uYXJ5RGF0YVR5cGUgPSAoZGljdGlvbmFyeUZpZWxkLnR5cGUgYXMgRGljdGlvbmFyeSkuZGljdGlvbmFyeTtcbiAgICAgICAgbGV0IGRpY3Rpb25hcnlWZWN0b3IgPSBWZWN0b3IuY3JlYXRlKGxvYWRlci52aXNpdChkaWN0aW9uYXJ5RGF0YVR5cGUpKTtcbiAgICAgICAgaWYgKG1lc3NhZ2UuaXNEZWx0YSAmJiBkaWN0aW9uYXJpZXMuaGFzKGRpY3Rpb25hcnlJZCkpIHtcbiAgICAgICAgICAgIGRpY3Rpb25hcnlWZWN0b3IgPSBkaWN0aW9uYXJpZXMuZ2V0KGRpY3Rpb25hcnlJZCkhLmNvbmNhdChkaWN0aW9uYXJ5VmVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBkaWN0aW9uYXJpZXMuc2V0KGRpY3Rpb25hcnlJZCwgZGljdGlvbmFyeVZlY3Rvcik7XG4gICAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVHlwZURhdGFMb2FkZXIgZXh0ZW5kcyBUeXBlVmlzaXRvciB7XG5cbiAgICBwdWJsaWMgZGljdGlvbmFyaWVzOiBNYXA8bnVtYmVyLCBWZWN0b3I+O1xuICAgIHByb3RlY3RlZCBub2RlczogSXRlcmF0b3I8RmllbGRNZXRhZGF0YT47XG4gICAgcHJvdGVjdGVkIGJ1ZmZlcnM6IEl0ZXJhdG9yPEJ1ZmZlck1ldGFkYXRhPjtcblxuICAgIGNvbnN0cnVjdG9yKG5vZGVzOiBJdGVyYXRvcjxGaWVsZE1ldGFkYXRhPiwgYnVmZmVyczogSXRlcmF0b3I8QnVmZmVyTWV0YWRhdGE+LCBkaWN0aW9uYXJpZXM6IE1hcDxudW1iZXIsIFZlY3Rvcj4pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBidWZmZXJzO1xuICAgICAgICB0aGlzLmRpY3Rpb25hcmllcyA9IGRpY3Rpb25hcmllcztcbiAgICB9XG5cbiAgICBwdWJsaWMgdmlzaXRGaWVsZHMoZmllbGRzOiBGaWVsZFtdKSB7IHJldHVybiBmaWVsZHMubWFwKChmaWVsZCkgPT4gdGhpcy52aXNpdChmaWVsZC50eXBlKSk7IH1cblxuICAgIHB1YmxpYyB2aXNpdE51bGwgICAgICAgICAgICh0eXBlOiBOdWxsKSAgICAgICAgICAgIHsgcmV0dXJuIHRoaXMudmlzaXROdWxsVHlwZSh0eXBlKTsgICB9XG4gICAgcHVibGljIHZpc2l0SW50ICAgICAgICAgICAgKHR5cGU6IEludCkgICAgICAgICAgICAgeyByZXR1cm4gdGhpcy52aXNpdEZsYXRUeXBlKHR5cGUpOyAgIH1cbiAgICBwdWJsaWMgdmlzaXRGbG9hdCAgICAgICAgICAodHlwZTogRmxvYXQpICAgICAgICAgICB7IHJldHVybiB0aGlzLnZpc2l0RmxhdFR5cGUodHlwZSk7ICAgfVxuICAgIHB1YmxpYyB2aXNpdEJpbmFyeSAgICAgICAgICh0eXBlOiBCaW5hcnkpICAgICAgICAgIHsgcmV0dXJuIHRoaXMudmlzaXRGbGF0TGlzdCh0eXBlKTsgICB9XG4gICAgcHVibGljIHZpc2l0VXRmOCAgICAgICAgICAgKHR5cGU6IFV0ZjgpICAgICAgICAgICAgeyByZXR1cm4gdGhpcy52aXNpdEZsYXRMaXN0KHR5cGUpOyAgIH1cbiAgICBwdWJsaWMgdmlzaXRCb29sICAgICAgICAgICAodHlwZTogQm9vbCkgICAgICAgICAgICB7IHJldHVybiB0aGlzLnZpc2l0Qm9vbFR5cGUodHlwZSk7ICAgfVxuICAgIHB1YmxpYyB2aXNpdERlY2ltYWwgICAgICAgICh0eXBlOiBEZWNpbWFsKSAgICAgICAgIHsgcmV0dXJuIHRoaXMudmlzaXRGbGF0VHlwZSh0eXBlKTsgICB9XG4gICAgcHVibGljIHZpc2l0RGF0ZSAgICAgICAgICAgKHR5cGU6IERhdGVfKSAgICAgICAgICAgeyByZXR1cm4gdGhpcy52aXNpdEZsYXRUeXBlKHR5cGUpOyAgIH1cbiAgICBwdWJsaWMgdmlzaXRUaW1lICAgICAgICAgICAodHlwZTogVGltZSkgICAgICAgICAgICB7IHJldHVybiB0aGlzLnZpc2l0RmxhdFR5cGUodHlwZSk7ICAgfVxuICAgIHB1YmxpYyB2aXNpdFRpbWVzdGFtcCAgICAgICh0eXBlOiBUaW1lc3RhbXApICAgICAgIHsgcmV0dXJuIHRoaXMudmlzaXRGbGF0VHlwZSh0eXBlKTsgICB9XG4gICAgcHVibGljIHZpc2l0SW50ZXJ2YWwgICAgICAgKHR5cGU6IEludGVydmFsKSAgICAgICAgeyByZXR1cm4gdGhpcy52aXNpdEZsYXRUeXBlKHR5cGUpOyAgIH1cbiAgICBwdWJsaWMgdmlzaXRMaXN0ICAgICAgICAgICAodHlwZTogTGlzdCkgICAgICAgICAgICB7IHJldHVybiB0aGlzLnZpc2l0TGlzdFR5cGUodHlwZSk7ICAgfVxuICAgIHB1YmxpYyB2aXNpdFN0cnVjdCAgICAgICAgICh0eXBlOiBTdHJ1Y3QpICAgICAgICAgIHsgcmV0dXJuIHRoaXMudmlzaXROZXN0ZWRUeXBlKHR5cGUpOyB9XG4gICAgcHVibGljIHZpc2l0VW5pb24gICAgICAgICAgKHR5cGU6IFVuaW9uKSAgICAgICAgICAgeyByZXR1cm4gdGhpcy52aXNpdFVuaW9uVHlwZSh0eXBlKTsgIH1cbiAgICBwdWJsaWMgdmlzaXRGaXhlZFNpemVCaW5hcnkodHlwZTogRml4ZWRTaXplQmluYXJ5KSB7IHJldHVybiB0aGlzLnZpc2l0RmxhdFR5cGUodHlwZSk7ICAgfVxuICAgIHB1YmxpYyB2aXNpdEZpeGVkU2l6ZUxpc3QgICh0eXBlOiBGaXhlZFNpemVMaXN0KSAgIHsgcmV0dXJuIHRoaXMudmlzaXRGaXhlZFNpemVMaXN0VHlwZSh0eXBlKTsgfVxuICAgIHB1YmxpYyB2aXNpdE1hcCAgICAgICAgICAgICh0eXBlOiBNYXBfKSAgICAgICAgICAgIHsgcmV0dXJuIHRoaXMudmlzaXROZXN0ZWRUeXBlKHR5cGUpOyB9XG4gICAgcHVibGljIHZpc2l0RGljdGlvbmFyeSAgICAgKHR5cGU6IERpY3Rpb25hcnkpICAgICAge1xuICAgICAgICByZXR1cm4gbmV3IERpY3Rpb25hcnlEYXRhKHR5cGUsIHRoaXMuZGljdGlvbmFyaWVzLmdldCh0eXBlLmlkKSEsIHRoaXMudmlzaXQodHlwZS5pbmRpY2VzKSk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBnZXRGaWVsZE1ldGFkYXRhKCkgeyByZXR1cm4gdGhpcy5ub2Rlcy5uZXh0KCkudmFsdWU7IH1cbiAgICBwcm90ZWN0ZWQgZ2V0QnVmZmVyTWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLmJ1ZmZlcnMubmV4dCgpLnZhbHVlOyB9XG4gICAgcHJvdGVjdGVkIHJlYWROdWxsQml0bWFwPFQgZXh0ZW5kcyBEYXRhVHlwZT4odHlwZTogVCwgbnVsbENvdW50OiBudW1iZXIsIGJ1ZmZlciA9IHRoaXMuZ2V0QnVmZmVyTWV0YWRhdGEoKSkge1xuICAgICAgICByZXR1cm4gbnVsbENvdW50ID4gMCAmJiB0aGlzLnJlYWREYXRhKHR5cGUsIGJ1ZmZlcikgfHwgbmV3IFVpbnQ4QXJyYXkoMCk7XG4gICAgfVxuICAgIHByb3RlY3RlZCBhYnN0cmFjdCByZWFkRGF0YTxUIGV4dGVuZHMgRGF0YVR5cGU+KHR5cGU6IFQsIGJ1ZmZlcj86IEJ1ZmZlck1ldGFkYXRhKTogYW55O1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCByZWFkT2Zmc2V0czxUIGV4dGVuZHMgRGF0YVR5cGU+KHR5cGU6IFQsIGJ1ZmZlcj86IEJ1ZmZlck1ldGFkYXRhKTogYW55O1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCByZWFkVHlwZUlkczxUIGV4dGVuZHMgRGF0YVR5cGU+KHR5cGU6IFQsIGJ1ZmZlcj86IEJ1ZmZlck1ldGFkYXRhKTogYW55O1xuICAgIHByb3RlY3RlZCB2aXNpdE51bGxUeXBlKHR5cGU6IE51bGwsIHsgbGVuZ3RoLCBudWxsQ291bnQgfTogRmllbGRNZXRhZGF0YSA9IHRoaXMuZ2V0RmllbGRNZXRhZGF0YSgpKSB7XG4gICAgICAgIHJldHVybiBuZXcgRmxhdERhdGE8YW55Pih0eXBlLCBsZW5ndGgsIHRoaXMucmVhZE51bGxCaXRtYXAodHlwZSwgbnVsbENvdW50KSwgbmV3IFVpbnQ4QXJyYXkoMCksIDAsIG51bGxDb3VudCk7XG4gICAgfVxuICAgIHByb3RlY3RlZCB2aXNpdEZsYXRUeXBlPFQgZXh0ZW5kcyBGbGF0VHlwZT4odHlwZTogVCwgeyBsZW5ndGgsIG51bGxDb3VudCB9OiBGaWVsZE1ldGFkYXRhID0gdGhpcy5nZXRGaWVsZE1ldGFkYXRhKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGbGF0RGF0YTxUPih0eXBlLCBsZW5ndGgsIHRoaXMucmVhZE51bGxCaXRtYXAodHlwZSwgbnVsbENvdW50KSwgdGhpcy5yZWFkRGF0YSh0eXBlKSwgMCwgbnVsbENvdW50KTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHZpc2l0Qm9vbFR5cGUodHlwZTogQm9vbCwgeyBsZW5ndGgsIG51bGxDb3VudCB9OiBGaWVsZE1ldGFkYXRhID0gdGhpcy5nZXRGaWVsZE1ldGFkYXRhKCksIGRhdGE/OiBVaW50OEFycmF5KSB7XG4gICAgICAgIHJldHVybiBuZXcgQm9vbERhdGEodHlwZSwgbGVuZ3RoLCB0aGlzLnJlYWROdWxsQml0bWFwKHR5cGUsIG51bGxDb3VudCksIGRhdGEgfHwgdGhpcy5yZWFkRGF0YSh0eXBlKSwgMCwgbnVsbENvdW50KTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHZpc2l0RmxhdExpc3Q8VCBleHRlbmRzIEZsYXRMaXN0VHlwZT4odHlwZTogVCwgeyBsZW5ndGgsIG51bGxDb3VudCB9OiBGaWVsZE1ldGFkYXRhID0gdGhpcy5nZXRGaWVsZE1ldGFkYXRhKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGbGF0TGlzdERhdGE8VD4odHlwZSwgbGVuZ3RoLCB0aGlzLnJlYWROdWxsQml0bWFwKHR5cGUsIG51bGxDb3VudCksIHRoaXMucmVhZE9mZnNldHModHlwZSksIHRoaXMucmVhZERhdGEodHlwZSksIDAsIG51bGxDb3VudCk7XG4gICAgfVxuICAgIHByb3RlY3RlZCB2aXNpdExpc3RUeXBlPFQgZXh0ZW5kcyBMaXN0VHlwZT4odHlwZTogVCwgeyBsZW5ndGgsIG51bGxDb3VudCB9OiBGaWVsZE1ldGFkYXRhID0gdGhpcy5nZXRGaWVsZE1ldGFkYXRhKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMaXN0RGF0YTxUPih0eXBlLCBsZW5ndGgsIHRoaXMucmVhZE51bGxCaXRtYXAodHlwZSwgbnVsbENvdW50KSwgdGhpcy5yZWFkT2Zmc2V0cyh0eXBlKSwgdGhpcy52aXNpdCh0eXBlLmNoaWxkcmVuIVswXS50eXBlKSwgMCwgbnVsbENvdW50KTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHZpc2l0Rml4ZWRTaXplTGlzdFR5cGU8VCBleHRlbmRzIEZpeGVkU2l6ZUxpc3Q+KHR5cGU6IFQsIHsgbGVuZ3RoLCBudWxsQ291bnQgfTogRmllbGRNZXRhZGF0YSA9IHRoaXMuZ2V0RmllbGRNZXRhZGF0YSgpKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2luZ2xlTmVzdGVkRGF0YTxUPih0eXBlLCBsZW5ndGgsIHRoaXMucmVhZE51bGxCaXRtYXAodHlwZSwgbnVsbENvdW50KSwgdGhpcy52aXNpdCh0eXBlLmNoaWxkcmVuIVswXS50eXBlKSwgMCwgbnVsbENvdW50KTtcbiAgICB9XG4gICAgcHJvdGVjdGVkIHZpc2l0TmVzdGVkVHlwZTxUIGV4dGVuZHMgTmVzdGVkVHlwZT4odHlwZTogVCwgeyBsZW5ndGgsIG51bGxDb3VudCB9OiBGaWVsZE1ldGFkYXRhID0gdGhpcy5nZXRGaWVsZE1ldGFkYXRhKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOZXN0ZWREYXRhPFQ+KHR5cGUsIGxlbmd0aCwgdGhpcy5yZWFkTnVsbEJpdG1hcCh0eXBlLCBudWxsQ291bnQpLCB0aGlzLnZpc2l0RmllbGRzKHR5cGUuY2hpbGRyZW4pLCAwLCBudWxsQ291bnQpO1xuICAgIH1cbiAgICBwcm90ZWN0ZWQgdmlzaXRVbmlvblR5cGUodHlwZTogRGVuc2VVbmlvbiB8IFNwYXJzZVVuaW9uLCB7IGxlbmd0aCwgbnVsbENvdW50IH06IEZpZWxkTWV0YWRhdGEgPSB0aGlzLmdldEZpZWxkTWV0YWRhdGEoKSkge1xuICAgICAgICByZXR1cm4gdHlwZS5tb2RlID09PSBVbmlvbk1vZGUuU3BhcnNlID9cbiAgICAgICAgICAgIG5ldyBTcGFyc2VVbmlvbkRhdGEodHlwZSBhcyBTcGFyc2VVbmlvbiwgbGVuZ3RoLCB0aGlzLnJlYWROdWxsQml0bWFwKHR5cGUsIG51bGxDb3VudCksIHRoaXMucmVhZFR5cGVJZHModHlwZSksIHRoaXMudmlzaXRGaWVsZHModHlwZS5jaGlsZHJlbiksIDAsIG51bGxDb3VudCkgOlxuICAgICAgICAgICAgbmV3IERlbnNlVW5pb25EYXRhKHR5cGUgYXMgRGVuc2VVbmlvbiwgbGVuZ3RoLCB0aGlzLnJlYWROdWxsQml0bWFwKHR5cGUsIG51bGxDb3VudCksIHRoaXMucmVhZE9mZnNldHModHlwZSksIHRoaXMucmVhZFR5cGVJZHModHlwZSksIHRoaXMudmlzaXRGaWVsZHModHlwZS5jaGlsZHJlbiksIDAsIG51bGxDb3VudCk7XG4gICAgfVxufVxuIl19
