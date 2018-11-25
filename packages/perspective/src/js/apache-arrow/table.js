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
import { RecordBatch } from './recordbatch';
import { Col } from './predicate';
import { Schema, Field } from './type';
import { read, readAsync } from './ipc/reader/arrow';
import { isPromise, isAsyncIterable } from './util/compat';
import { DictionaryVector, IntVector } from './vector';
import { ChunkedView } from './vector/chunked';
var Table = /** @class */ (function () {
    function Table() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // List of inner Vectors, possibly spanning batches
        this._columns = [];
        var schema;
        var batches;
        if (args[0] instanceof Schema) {
            schema = args[0];
            batches = Array.isArray(args[1][0]) ? args[1][0] : args[1];
        }
        else if (args[0] instanceof RecordBatch) {
            schema = (batches = args)[0].schema;
        }
        else {
            schema = (batches = args[0])[0].schema;
        }
        this.schema = schema;
        this.batches = batches;
        this.batchesUnion = batches.length == 0 ?
            new RecordBatch(schema, 0, []) :
            batches.reduce(function (union, batch) { return union.concat(batch); });
        this.length = this.batchesUnion.length;
        this.numCols = this.batchesUnion.numCols;
    }
    Table.empty = function () { return new Table(new Schema([]), []); };
    Table.from = function (sources) {
        if (sources) {
            var schema = void 0;
            var recordBatches = [];
            try {
                for (var _a = tslib_1.__values(read(sources)), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var recordBatch = _b.value;
                    schema = schema || recordBatch.schema;
                    recordBatches.push(recordBatch);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return new Table(schema || new Schema([]), recordBatches);
        }
        return Table.empty();
        var e_1, _c;
    };
    Table.fromAsync = function (sources) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var schema, recordBatches, _a, _b, recordBatch, e_2_1, _c, _d, e_2, _e;
            return tslib_1.__generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!isAsyncIterable(sources)) return [3 /*break*/, 14];
                        schema = void 0;
                        recordBatches = [];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 7, 8, 13]);
                        _a = tslib_1.__asyncValues(readAsync(sources));
                        _f.label = 2;
                    case 2: return [4 /*yield*/, _a.next()];
                    case 3:
                        if (!(_b = _f.sent(), !_b.done)) return [3 /*break*/, 6];
                        return [4 /*yield*/, _b.value];
                    case 4:
                        recordBatch = _f.sent();
                        schema = schema || recordBatch.schema;
                        recordBatches.push(recordBatch);
                        _f.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_2_1 = _f.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _f.trys.push([8, , 11, 12]);
                        if (!(_b && !_b.done && (_e = _a.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _e.call(_a)];
                    case 9:
                        _f.sent();
                        _f.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13: return [2 /*return*/, new Table(schema || new Schema([]), recordBatches)];
                    case 14:
                        if (!isPromise(sources)) return [3 /*break*/, 16];
                        _d = (_c = Table).from;
                        return [4 /*yield*/, sources];
                    case 15: return [2 /*return*/, _d.apply(_c, [_f.sent()])];
                    case 16:
                        if (sources) {
                            return [2 /*return*/, Table.from(sources)];
                        }
                        _f.label = 17;
                    case 17: return [2 /*return*/, Table.empty()];
                }
            });
        });
    };
    Table.fromStruct = function (struct) {
        var schema = new Schema(struct.type.children);
        var chunks = struct.view instanceof ChunkedView ?
            struct.view.chunkVectors :
            [struct];
        return new Table(chunks.map(function (chunk) { return new RecordBatch(schema, chunk.length, chunk.view.childData); }));
    };
    Table.prototype.get = function (index) {
        return this.batchesUnion.get(index);
    };
    Table.prototype.getColumn = function (name) {
        return this.getColumnAt(this.getColumnIndex(name));
    };
    Table.prototype.getColumnAt = function (index) {
        return index < 0 || index >= this.numCols
            ? null
            : this._columns[index] || (this._columns[index] = this.batchesUnion.getChildAt(index));
    };
    Table.prototype.getColumnIndex = function (name) {
        return this.schema.fields.findIndex(function (f) { return f.name === name; });
    };
    Table.prototype[Symbol.iterator] = function () {
        return this.batchesUnion[Symbol.iterator]();
    };
    Table.prototype.filter = function (predicate) {
        return new FilteredDataFrame(this.batches, predicate);
    };
    Table.prototype.scan = function (next, bind) {
        var batches = this.batches, numBatches = batches.length;
        for (var batchIndex = -1; ++batchIndex < numBatches;) {
            // load batches
            var batch = batches[batchIndex];
            if (bind) {
                bind(batch);
            }
            // yield all indices
            for (var index = -1, numRows = batch.length; ++index < numRows;) {
                next(index, batch);
            }
        }
    };
    Table.prototype.count = function () { return this.length; };
    Table.prototype.countBy = function (name) {
        var batches = this.batches, numBatches = batches.length;
        var count_by = typeof name === 'string' ? new Col(name) : name;
        // Assume that all dictionary batches are deltas, which means that the
        // last record batch has the most complete dictionary
        count_by.bind(batches[numBatches - 1]);
        var vector = count_by.vector;
        if (!(vector instanceof DictionaryVector)) {
            throw new Error('countBy currently only supports dictionary-encoded columns');
        }
        // TODO: Adjust array byte width based on overall length
        // (e.g. if this.length <= 255 use Uint8Array, etc...)
        var counts = new Uint32Array(vector.dictionary.length);
        for (var batchIndex = -1; ++batchIndex < numBatches;) {
            // load batches
            var batch = batches[batchIndex];
            // rebind the countBy Col
            count_by.bind(batch);
            var keys = count_by.vector.indices;
            // yield all indices
            for (var index = -1, numRows = batch.length; ++index < numRows;) {
                var key = keys.get(index);
                if (key !== null) {
                    counts[key]++;
                }
            }
        }
        return new CountByResult(vector.dictionary, IntVector.from(counts));
    };
    Table.prototype.select = function () {
        var columnNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            columnNames[_i] = arguments[_i];
        }
        return new Table(this.batches.map(function (batch) { return batch.select.apply(batch, tslib_1.__spread(columnNames)); }));
    };
    Table.prototype.toString = function (separator) {
        var str = '';
        try {
            for (var _a = tslib_1.__values(this.rowsToString(separator)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var row = _b.value;
                str += row + '\n';
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return str;
        var e_3, _c;
    };
    Table.prototype.rowsToString = function (separator) {
        if (separator === void 0) { separator = ' | '; }
        return new TableToStringIterator(tableRowsToString(this, separator));
    };
    return Table;
}());
export { Table };
var FilteredDataFrame = /** @class */ (function () {
    function FilteredDataFrame(batches, predicate) {
        this.batches = batches;
        this.predicate = predicate;
    }
    FilteredDataFrame.prototype.scan = function (next, bind) {
        // inlined version of this:
        // this.parent.scan((idx, columns) => {
        //     if (this.predicate(idx, columns)) next(idx, columns);
        // });
        var batches = this.batches;
        var numBatches = batches.length;
        for (var batchIndex = -1; ++batchIndex < numBatches;) {
            // load batches
            var batch = batches[batchIndex];
            // TODO: bind batches lazily
            // If predicate doesn't match anything in the batch we don't need
            // to bind the callback
            if (bind) {
                bind(batch);
            }
            var predicate = this.predicate.bind(batch);
            // yield all indices
            for (var index = -1, numRows = batch.length; ++index < numRows;) {
                if (predicate(index, batch)) {
                    next(index, batch);
                }
            }
        }
    };
    FilteredDataFrame.prototype.count = function () {
        // inlined version of this:
        // let sum = 0;
        // this.parent.scan((idx, columns) => {
        //     if (this.predicate(idx, columns)) ++sum;
        // });
        // return sum;
        var sum = 0;
        var batches = this.batches;
        var numBatches = batches.length;
        for (var batchIndex = -1; ++batchIndex < numBatches;) {
            // load batches
            var batch = batches[batchIndex];
            var predicate = this.predicate.bind(batch);
            // yield all indices
            for (var index = -1, numRows = batch.length; ++index < numRows;) {
                if (predicate(index, batch)) {
                    ++sum;
                }
            }
        }
        return sum;
    };
    FilteredDataFrame.prototype.filter = function (predicate) {
        return new FilteredDataFrame(this.batches, this.predicate.and(predicate));
    };
    FilteredDataFrame.prototype.countBy = function (name) {
        var batches = this.batches, numBatches = batches.length;
        var count_by = typeof name === 'string' ? new Col(name) : name;
        // Assume that all dictionary batches are deltas, which means that the
        // last record batch has the most complete dictionary
        count_by.bind(batches[numBatches - 1]);
        var vector = count_by.vector;
        if (!(vector instanceof DictionaryVector)) {
            throw new Error('countBy currently only supports dictionary-encoded columns');
        }
        // TODO: Adjust array byte width based on overall length
        // (e.g. if this.length <= 255 use Uint8Array, etc...)
        var counts = new Uint32Array(vector.dictionary.length);
        for (var batchIndex = -1; ++batchIndex < numBatches;) {
            // load batches
            var batch = batches[batchIndex];
            var predicate = this.predicate.bind(batch);
            // rebind the countBy Col
            count_by.bind(batch);
            var keys = count_by.vector.indices;
            // yield all indices
            for (var index = -1, numRows = batch.length; ++index < numRows;) {
                var key = keys.get(index);
                if (key !== null && predicate(index, batch)) {
                    counts[key]++;
                }
            }
        }
        return new CountByResult(vector.dictionary, IntVector.from(counts));
    };
    return FilteredDataFrame;
}());
var CountByResult = /** @class */ (function (_super) {
    tslib_1.__extends(CountByResult, _super);
    function CountByResult(values, counts) {
        return _super.call(this, new RecordBatch(new Schema([
            new Field('values', values.type),
            new Field('counts', counts.type)
        ]), counts.length, [values, counts])) || this;
    }
    CountByResult.prototype.toJSON = function () {
        var values = this.getColumnAt(0);
        var counts = this.getColumnAt(1);
        var result = {};
        for (var i = -1; ++i < this.length;) {
            result[values.get(i)] = counts.get(i);
        }
        return result;
    };
    return CountByResult;
}(Table));
export { CountByResult };
var TableToStringIterator = /** @class */ (function () {
    function TableToStringIterator(iterator) {
        this.iterator = iterator;
    }
    TableToStringIterator.prototype[Symbol.iterator] = function () { return this.iterator; };
    TableToStringIterator.prototype.next = function (value) { return this.iterator.next(value); };
    TableToStringIterator.prototype.throw = function (error) { return this.iterator.throw && this.iterator.throw(error) || { done: true, value: '' }; };
    TableToStringIterator.prototype.return = function (value) { return this.iterator.return && this.iterator.return(value) || { done: true, value: '' }; };
    TableToStringIterator.prototype.pipe = function (stream) {
        var _this = this;
        var res;
        var write = function () {
            if (stream['writable']) {
                do {
                    if ((res = _this.next()).done) {
                        break;
                    }
                } while (stream['write'](res.value + '\n', 'utf8'));
            }
            if (!res || !res.done) {
                stream['once']('drain', write);
            }
            else if (!stream['isTTY']) {
                stream['end']('\n');
            }
        };
        write();
    };
    return TableToStringIterator;
}());
export { TableToStringIterator };
function tableRowsToString(table, separator) {
    if (separator === void 0) { separator = ' | '; }
    var fields, header, maxColumnWidths, i, n, val, row, j, k, i;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fields = table.schema.fields;
                header = tslib_1.__spread(['row_id'], fields.map(function (f) { return "" + f; })).map(stringify);
                maxColumnWidths = header.map(function (x) { return x.length; });
                // Pass one to convert to strings and count max column widths
                for (i = -1, n = table.length - 1; ++i < n;) {
                    val = void 0, row = tslib_1.__spread([i], table.get(i));
                    for (j = -1, k = row.length; ++j < k;) {
                        val = stringify(row[j]);
                        maxColumnWidths[j] = Math.max(maxColumnWidths[j], val.length);
                    }
                }
                return [4 /*yield*/, header.map(function (x, j) { return leftPad(x, ' ', maxColumnWidths[j]); }).join(separator)];
            case 1:
                _a.sent();
                i = -1;
                _a.label = 2;
            case 2:
                if (!(++i < table.length)) return [3 /*break*/, 5];
                return [4 /*yield*/, tslib_1.__spread([i], table.get(i)).map(function (x) { return stringify(x); })
                        .map(function (x, j) { return leftPad(x, ' ', maxColumnWidths[j]); })
                        .join(separator)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [3 /*break*/, 2];
            case 5: return [2 /*return*/];
        }
    });
}
function leftPad(str, fill, n) {
    return (new Array(n + 1).join(fill) + str).slice(-1 * n);
}
function stringify(x) {
    return typeof x === 'string' ? "\"" + x + "\"" : ArrayBuffer.isView(x) ? "[" + x + "]" : JSON.stringify(x);
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZEQUE2RDtBQUM3RCwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELDZEQUE2RDtBQUM3RCxvREFBb0Q7QUFDcEQsNkRBQTZEO0FBQzdELDZEQUE2RDtBQUM3RCxFQUFFO0FBQ0YsK0NBQStDO0FBQy9DLEVBQUU7QUFDRiw2REFBNkQ7QUFDN0QsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsMERBQTBEO0FBQzFELHFCQUFxQjs7QUFFckIsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUUsR0FBRyxFQUFhLE1BQU0sYUFBYSxDQUFDO0FBQzdDLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFVLE1BQU0sUUFBUSxDQUFDO0FBQy9DLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDckQsT0FBTyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDM0QsT0FBTyxFQUFVLGdCQUFnQixFQUFFLFNBQVMsRUFBZ0IsTUFBTSxVQUFVLENBQUM7QUFDN0UsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBWS9DO0lBd0RJO1FBQVksY0FBYzthQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7WUFBZCx5QkFBYzs7UUFiMUIsbURBQW1EO1FBQ2hDLGFBQVEsR0FBa0IsRUFBRSxDQUFDO1FBYTVDLElBQUksTUFBYyxDQUFDO1FBQ25CLElBQUksT0FBc0IsQ0FBQztRQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksTUFBTSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDeEMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osTUFBTSxHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUMzQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQUMsS0FBSyxFQUFFLEtBQUssSUFBSyxPQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQW5CLENBQW1CLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUM7SUFDN0MsQ0FBQztJQXpFTSxXQUFLLEdBQVosY0FBaUIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqRCxVQUFJLEdBQVgsVUFBWSxPQUFrRTtRQUMxRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ1YsSUFBSSxNQUFNLFNBQW9CLENBQUM7WUFDL0IsSUFBSSxhQUFhLEdBQWtCLEVBQUUsQ0FBQzs7Z0JBQ3RDLEdBQUcsQ0FBQyxDQUFvQixJQUFBLEtBQUEsaUJBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBLGdCQUFBO29CQUFoQyxJQUFJLFdBQVcsV0FBQTtvQkFDaEIsTUFBTSxHQUFHLE1BQU0sSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDO29CQUN0QyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2lCQUNuQzs7Ozs7Ozs7O1lBQ0QsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7SUFDekIsQ0FBQztJQUNZLGVBQVMsR0FBdEIsVUFBdUIsT0FBcUQ7Ozs7Ozs2QkFDcEUsZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUF4Qix5QkFBd0I7d0JBQ3BCLE1BQU0sU0FBb0IsQ0FBQzt3QkFDM0IsYUFBYSxHQUFrQixFQUFFLENBQUM7Ozs7d0JBQ1IsS0FBQSxzQkFBQSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUE7Ozs7Ozs7d0JBQWpDLFdBQVcsWUFBQTt3QkFDdEIsTUFBTSxHQUFHLE1BQU0sSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDO3dCQUN0QyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2QkFFcEMsc0JBQU8sSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxFQUFDOzs2QkFDbkQsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFsQix5QkFBa0I7d0JBQ2xCLEtBQUEsQ0FBQSxLQUFBLEtBQUssQ0FBQSxDQUFDLElBQUksQ0FBQTt3QkFBQyxxQkFBTSxPQUFPLEVBQUE7NkJBQS9CLHNCQUFPLGNBQVcsU0FBYSxFQUFDLEVBQUM7O3dCQUM5QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOzRCQUNqQixNQUFNLGdCQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUM7d0JBQy9CLENBQUM7OzZCQUNELHNCQUFPLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBQzs7OztLQUN4QjtJQUNNLGdCQUFVLEdBQWpCLFVBQWtCLE1BQW9CO1FBQ2xDLElBQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksWUFBWSxXQUFXLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQStCLENBQUMsQ0FBQztZQUM5QyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBSyxJQUFLLE9BQUEsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBM0QsQ0FBMkQsQ0FBQyxDQUFDLENBQUM7SUFDekcsQ0FBQztJQXVDTSxtQkFBRyxHQUFWLFVBQVcsS0FBYTtRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUM7SUFDekMsQ0FBQztJQUNNLHlCQUFTLEdBQWhCLFVBQWlCLElBQVk7UUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFDTSwyQkFBVyxHQUFsQixVQUFtQixLQUFhO1FBQzVCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTztZQUNyQyxDQUFDLENBQUMsSUFBSTtZQUNOLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBQ00sOEJBQWMsR0FBckIsVUFBc0IsSUFBWTtRQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQWYsQ0FBZSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUNNLGdCQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBeEI7UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQVMsQ0FBQztJQUN2RCxDQUFDO0lBQ00sc0JBQU0sR0FBYixVQUFjLFNBQW9CO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUNNLG9CQUFJLEdBQVgsVUFBWSxJQUFjLEVBQUUsSUFBZTtRQUN2QyxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzFELEdBQUcsQ0FBQyxDQUFDLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDO1lBQ25ELGVBQWU7WUFDZixJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFBQyxDQUFDO1lBQzFCLG9CQUFvQjtZQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssR0FBRyxPQUFPLEdBQUcsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFDTSxxQkFBSyxHQUFaLGNBQXlCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUN2Qyx1QkFBTyxHQUFkLFVBQWUsSUFBa0I7UUFDN0IsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUMxRCxJQUFNLFFBQVEsR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDakUsc0VBQXNFO1FBQ3RFLHFEQUFxRDtRQUNyRCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBMEIsQ0FBQztRQUNuRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxZQUFZLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsNERBQTRELENBQUMsQ0FBQztRQUNsRixDQUFDO1FBQ0Qsd0RBQXdEO1FBQ3hELHNEQUFzRDtRQUN0RCxJQUFNLE1BQU0sR0FBZ0IsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RSxHQUFHLENBQUMsQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQztZQUNuRCxlQUFlO1lBQ2YsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLHlCQUF5QjtZQUN6QixRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLElBQU0sSUFBSSxHQUFJLFFBQVEsQ0FBQyxNQUEyQixDQUFDLE9BQU8sQ0FBQztZQUMzRCxvQkFBb0I7WUFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEdBQUcsT0FBTyxHQUFHLENBQUM7Z0JBQzlELElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUFDLENBQUM7WUFDeEMsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxhQUFhLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUNNLHNCQUFNLEdBQWI7UUFBYyxxQkFBd0I7YUFBeEIsVUFBd0IsRUFBeEIscUJBQXdCLEVBQXhCLElBQXdCO1lBQXhCLGdDQUF3Qjs7UUFDbEMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBSyxJQUFLLE9BQUEsS0FBSyxDQUFDLE1BQU0sT0FBWixLQUFLLG1CQUFXLFdBQVcsSUFBM0IsQ0FBNEIsQ0FBQyxDQUFDLENBQUM7SUFDaEYsQ0FBQztJQUNNLHdCQUFRLEdBQWYsVUFBZ0IsU0FBa0I7UUFDOUIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDOztZQUNiLEdBQUcsQ0FBQyxDQUFjLElBQUEsS0FBQSxpQkFBQSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFBLGdCQUFBO2dCQUF6QyxJQUFNLEdBQUcsV0FBQTtnQkFDVixHQUFHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQzthQUNyQjs7Ozs7Ozs7O1FBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQzs7SUFDZixDQUFDO0lBQ00sNEJBQVksR0FBbkIsVUFBb0IsU0FBaUI7UUFBakIsMEJBQUEsRUFBQSxpQkFBaUI7UUFDakMsTUFBTSxDQUFDLElBQUkscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNMLFlBQUM7QUFBRCxDQXJKQSxBQXFKQyxJQUFBOztBQUVEO0lBR0ksMkJBQWEsT0FBc0IsRUFBRSxTQUFvQjtRQUNyRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUMvQixDQUFDO0lBQ00sZ0NBQUksR0FBWCxVQUFZLElBQWMsRUFBRSxJQUFlO1FBQ3ZDLDJCQUEyQjtRQUMzQix1Q0FBdUM7UUFDdkMsNERBQTREO1FBQzVELE1BQU07UUFDTixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzdCLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDbEMsR0FBRyxDQUFDLENBQUMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxVQUFVLEdBQUcsVUFBVSxHQUFHLENBQUM7WUFDbkQsZUFBZTtZQUNmLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsQyw0QkFBNEI7WUFDNUIsaUVBQWlFO1lBQ2pFLHVCQUF1QjtZQUN2QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUFDLENBQUM7WUFDMUIsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0Msb0JBQW9CO1lBQ3BCLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxHQUFHLE9BQU8sR0FBRyxDQUFDO2dCQUM5RCxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUFDLENBQUM7WUFDeEQsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBQ00saUNBQUssR0FBWjtRQUNJLDJCQUEyQjtRQUMzQixlQUFlO1FBQ2YsdUNBQXVDO1FBQ3ZDLCtDQUErQztRQUMvQyxNQUFNO1FBQ04sY0FBYztRQUNkLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDN0IsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxHQUFHLENBQUMsQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQztZQUNuRCxlQUFlO1lBQ2YsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdDLG9CQUFvQjtZQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssR0FBRyxPQUFPLEdBQUcsQ0FBQztnQkFDOUQsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUMsRUFBRSxHQUFHLENBQUM7Z0JBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0wsQ0FBQztRQUNELE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDZixDQUFDO0lBQ00sa0NBQU0sR0FBYixVQUFjLFNBQW9CO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLGlCQUFpQixDQUN4QixJQUFJLENBQUMsT0FBTyxFQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUNoQyxDQUFDO0lBQ04sQ0FBQztJQUNNLG1DQUFPLEdBQWQsVUFBZSxJQUFrQjtRQUM3QixJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzFELElBQU0sUUFBUSxHQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNqRSxzRUFBc0U7UUFDdEUscURBQXFEO1FBQ3JELFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUEwQixDQUFDO1FBQ25ELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLFlBQVksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw0REFBNEQsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFDRCx3REFBd0Q7UUFDeEQsc0RBQXNEO1FBQ3RELElBQU0sTUFBTSxHQUFnQixJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLEdBQUcsQ0FBQyxDQUFDLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDO1lBQ25ELGVBQWU7WUFDZixJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEMsSUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MseUJBQXlCO1lBQ3pCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsSUFBTSxJQUFJLEdBQUksUUFBUSxDQUFDLE1BQTJCLENBQUMsT0FBTyxDQUFDO1lBQzNELG9CQUFvQjtZQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssR0FBRyxPQUFPLEdBQUcsQ0FBQztnQkFDOUQsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUIsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxDQUFDO1lBQ25FLENBQUM7UUFDTCxDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksYUFBYSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFDTCx3QkFBQztBQUFELENBbkZBLEFBbUZDLElBQUE7QUFFRDtJQUFtQyx5Q0FBSztJQUNwQyx1QkFBWSxNQUFjLEVBQUUsTUFBc0I7ZUFDOUMsa0JBQ0ksSUFBSSxXQUFXLENBQUMsSUFBSSxNQUFNLENBQUM7WUFDdkIsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDaEMsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUM7U0FDbkMsQ0FBQyxFQUNGLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQ2xDLENBQUM7SUFDTixDQUFDO0lBQ00sOEJBQU0sR0FBYjtRQUNJLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDcEMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUUsQ0FBQztRQUNwQyxJQUFNLE1BQU0sR0FBRyxFQUFvQyxDQUFDO1FBQ3BELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUNMLG9CQUFDO0FBQUQsQ0FuQkEsQUFtQkMsQ0FuQmtDLEtBQUssR0FtQnZDOztBQUVEO0lBQ0ksK0JBQW9CLFFBQWtDO1FBQWxDLGFBQVEsR0FBUixRQUFRLENBQTBCO0lBQUcsQ0FBQztJQUMxRCxnQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQWpCLGNBQXNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM3QyxvQ0FBSSxHQUFKLFVBQUssS0FBVyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQscUNBQUssR0FBTCxVQUFNLEtBQVcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0csc0NBQU0sR0FBTixVQUFPLEtBQVcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDaEgsb0NBQUksR0FBSixVQUFLLE1BQTZCO1FBQWxDLGlCQWVDO1FBZEcsSUFBSSxHQUEyQixDQUFDO1FBQ2hDLElBQUksS0FBSyxHQUFHO1lBQ1IsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsR0FBRyxDQUFDO29CQUNBLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQUMsS0FBSyxDQUFDO29CQUFDLENBQUM7Z0JBQzVDLENBQUMsUUFBUSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDeEQsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFFLE1BQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4QixDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBQ0YsS0FBSyxFQUFFLENBQUM7SUFDWixDQUFDO0lBQ0wsNEJBQUM7QUFBRCxDQXRCQSxBQXNCQyxJQUFBOztBQUVELDJCQUE0QixLQUFZLEVBQUUsU0FBaUI7SUFBakIsMEJBQUEsRUFBQSxpQkFBaUI7Ozs7O2dCQUNqRCxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQzdCLE1BQU0sR0FBRyxrQkFBQyxRQUFRLEdBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLEtBQUcsQ0FBRyxFQUFOLENBQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDakUsZUFBZSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxFQUFSLENBQVEsQ0FBQyxDQUFDO2dCQUNsRCw2REFBNkQ7Z0JBQzdELEdBQUcsQ0FBQyxDQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7b0JBQzFDLEdBQUcsU0FBQSxFQUFFLEdBQUcscUJBQUksQ0FBQyxHQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDcEMsR0FBRyxDQUFDLENBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBSSxDQUFDO3dCQUN6QyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN4QixlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNsRSxDQUFDO2dCQUNMLENBQUM7Z0JBQ0QscUJBQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBbkMsQ0FBbUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBQTs7Z0JBQS9FLFNBQStFLENBQUM7Z0JBQ3ZFLENBQUMsR0FBRyxDQUFDLENBQUM7OztxQkFBRSxDQUFBLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7Z0JBQy9CLHFCQUFNLGtCQUFDLENBQUMsR0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUNwQixHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQVosQ0FBWSxDQUFDO3lCQUN4QixHQUFHLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsT0FBTyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQW5DLENBQW1DLENBQUM7eUJBQ2xELElBQUksQ0FBQyxTQUFTLENBQUMsRUFBQTs7Z0JBSHBCLFNBR29CLENBQUM7Ozs7OztDQUU1QjtBQUVELGlCQUFpQixHQUFXLEVBQUUsSUFBWSxFQUFFLENBQVM7SUFDakQsTUFBTSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUVELG1CQUFtQixDQUFNO0lBQ3JCLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQUksQ0FBQyxPQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQUksQ0FBQyxNQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkcsQ0FBQyIsImZpbGUiOiJ0YWJsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIExpY2Vuc2VkIHRvIHRoZSBBcGFjaGUgU29mdHdhcmUgRm91bmRhdGlvbiAoQVNGKSB1bmRlciBvbmVcbi8vIG9yIG1vcmUgY29udHJpYnV0b3IgbGljZW5zZSBhZ3JlZW1lbnRzLiAgU2VlIHRoZSBOT1RJQ0UgZmlsZVxuLy8gZGlzdHJpYnV0ZWQgd2l0aCB0aGlzIHdvcmsgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cbi8vIHJlZ2FyZGluZyBjb3B5cmlnaHQgb3duZXJzaGlwLiAgVGhlIEFTRiBsaWNlbnNlcyB0aGlzIGZpbGVcbi8vIHRvIHlvdSB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGVcbi8vIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZVxuLy8gd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuLy8gc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbi8vIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4vLyBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbi8vIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbi8vIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG5pbXBvcnQgeyBSZWNvcmRCYXRjaCB9IGZyb20gJy4vcmVjb3JkYmF0Y2gnO1xuaW1wb3J0IHsgQ29sLCBQcmVkaWNhdGUgfSBmcm9tICcuL3ByZWRpY2F0ZSc7XG5pbXBvcnQgeyBTY2hlbWEsIEZpZWxkLCBTdHJ1Y3QgfSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IHsgcmVhZCwgcmVhZEFzeW5jIH0gZnJvbSAnLi9pcGMvcmVhZGVyL2Fycm93JztcbmltcG9ydCB7IGlzUHJvbWlzZSwgaXNBc3luY0l0ZXJhYmxlIH0gZnJvbSAnLi91dGlsL2NvbXBhdCc7XG5pbXBvcnQgeyBWZWN0b3IsIERpY3Rpb25hcnlWZWN0b3IsIEludFZlY3RvciwgU3RydWN0VmVjdG9yIH0gZnJvbSAnLi92ZWN0b3InO1xuaW1wb3J0IHsgQ2h1bmtlZFZpZXcgfSBmcm9tICcuL3ZlY3Rvci9jaHVua2VkJztcblxuZXhwb3J0IHR5cGUgTmV4dEZ1bmMgPSAoaWR4OiBudW1iZXIsIGJhdGNoOiBSZWNvcmRCYXRjaCkgPT4gdm9pZDtcbmV4cG9ydCB0eXBlIEJpbmRGdW5jID0gKGJhdGNoOiBSZWNvcmRCYXRjaCkgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBEYXRhRnJhbWUge1xuICAgIGZpbHRlcihwcmVkaWNhdGU6IFByZWRpY2F0ZSk6IERhdGFGcmFtZTtcbiAgICBzY2FuKG5leHQ6IE5leHRGdW5jLCBiaW5kPzogQmluZEZ1bmMpOiB2b2lkO1xuICAgIGNvdW50KCk6IG51bWJlcjtcbiAgICBjb3VudEJ5KGNvbDogKENvbHxzdHJpbmcpKTogQ291bnRCeVJlc3VsdDtcbn1cblxuZXhwb3J0IGNsYXNzIFRhYmxlIGltcGxlbWVudHMgRGF0YUZyYW1lIHtcbiAgICBzdGF0aWMgZW1wdHkoKSB7IHJldHVybiBuZXcgVGFibGUobmV3IFNjaGVtYShbXSksIFtdKTsgfVxuICAgIHN0YXRpYyBmcm9tKHNvdXJjZXM/OiBJdGVyYWJsZTxVaW50OEFycmF5IHwgQnVmZmVyIHwgc3RyaW5nPiB8IG9iamVjdCB8IHN0cmluZykge1xuICAgICAgICBpZiAoc291cmNlcykge1xuICAgICAgICAgICAgbGV0IHNjaGVtYTogU2NoZW1hIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHJlY29yZEJhdGNoZXM6IFJlY29yZEJhdGNoW10gPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHJlY29yZEJhdGNoIG9mIHJlYWQoc291cmNlcykpIHtcbiAgICAgICAgICAgICAgICBzY2hlbWEgPSBzY2hlbWEgfHwgcmVjb3JkQmF0Y2guc2NoZW1hO1xuICAgICAgICAgICAgICAgIHJlY29yZEJhdGNoZXMucHVzaChyZWNvcmRCYXRjaCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFRhYmxlKHNjaGVtYSB8fCBuZXcgU2NoZW1hKFtdKSwgcmVjb3JkQmF0Y2hlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFRhYmxlLmVtcHR5KCk7XG4gICAgfVxuICAgIHN0YXRpYyBhc3luYyBmcm9tQXN5bmMoc291cmNlcz86IEFzeW5jSXRlcmFibGU8VWludDhBcnJheSB8IEJ1ZmZlciB8IHN0cmluZz4pIHtcbiAgICAgICAgaWYgKGlzQXN5bmNJdGVyYWJsZShzb3VyY2VzKSkge1xuICAgICAgICAgICAgbGV0IHNjaGVtYTogU2NoZW1hIHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHJlY29yZEJhdGNoZXM6IFJlY29yZEJhdGNoW10gPSBbXTtcbiAgICAgICAgICAgIGZvciBhd2FpdCAobGV0IHJlY29yZEJhdGNoIG9mIHJlYWRBc3luYyhzb3VyY2VzKSkge1xuICAgICAgICAgICAgICAgIHNjaGVtYSA9IHNjaGVtYSB8fCByZWNvcmRCYXRjaC5zY2hlbWE7XG4gICAgICAgICAgICAgICAgcmVjb3JkQmF0Y2hlcy5wdXNoKHJlY29yZEJhdGNoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgVGFibGUoc2NoZW1hIHx8IG5ldyBTY2hlbWEoW10pLCByZWNvcmRCYXRjaGVzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1Byb21pc2Uoc291cmNlcykpIHtcbiAgICAgICAgICAgIHJldHVybiBUYWJsZS5mcm9tKGF3YWl0IHNvdXJjZXMpO1xuICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBUYWJsZS5mcm9tKHNvdXJjZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBUYWJsZS5lbXB0eSgpO1xuICAgIH1cbiAgICBzdGF0aWMgZnJvbVN0cnVjdChzdHJ1Y3Q6IFN0cnVjdFZlY3Rvcikge1xuICAgICAgICBjb25zdCBzY2hlbWEgPSBuZXcgU2NoZW1hKHN0cnVjdC50eXBlLmNoaWxkcmVuKTtcbiAgICAgICAgY29uc3QgY2h1bmtzID0gc3RydWN0LnZpZXcgaW5zdGFuY2VvZiBDaHVua2VkVmlldyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHN0cnVjdC52aWV3LmNodW5rVmVjdG9ycyBhcyBTdHJ1Y3RWZWN0b3JbXSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtzdHJ1Y3RdO1xuICAgICAgICByZXR1cm4gbmV3IFRhYmxlKGNodW5rcy5tYXAoKGNodW5rKSA9PiBuZXcgUmVjb3JkQmF0Y2goc2NoZW1hLCBjaHVuay5sZW5ndGgsIGNodW5rLnZpZXcuY2hpbGREYXRhKSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWFkb25seSBzY2hlbWE6IFNjaGVtYTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGVuZ3RoOiBudW1iZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IG51bUNvbHM6IG51bWJlcjtcbiAgICAvLyBMaXN0IG9mIGlubmVyIFJlY29yZEJhdGNoZXNcbiAgICBwdWJsaWMgcmVhZG9ubHkgYmF0Y2hlczogUmVjb3JkQmF0Y2hbXTtcbiAgICAvLyBMaXN0IG9mIGlubmVyIFZlY3RvcnMsIHBvc3NpYmx5IHNwYW5uaW5nIGJhdGNoZXNcbiAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgX2NvbHVtbnM6IFZlY3Rvcjxhbnk+W10gPSBbXTtcbiAgICAvLyBVbmlvbiBvZiBhbGwgaW5uZXIgUmVjb3JkQmF0Y2hlcyBpbnRvIG9uZSBSZWNvcmRCYXRjaCwgcG9zc2libHkgY2h1bmtlZC5cbiAgICAvLyBJZiB0aGUgVGFibGUgaGFzIGp1c3Qgb25lIGlubmVyIFJlY29yZEJhdGNoLCB0aGlzIHBvaW50cyB0byB0aGF0LlxuICAgIC8vIElmIHRoZSBUYWJsZSBoYXMgbXVsdGlwbGUgaW5uZXIgUmVjb3JkQmF0Y2hlcywgdGhlbiB0aGlzIGlzIGEgQ2h1bmtlZCB2aWV3XG4gICAgLy8gb3ZlciB0aGUgbGlzdCBvZiBSZWNvcmRCYXRjaGVzLiBUaGlzIGFsbG93cyB1cyB0byBkZWxlZ2F0ZSB0aGUgcmVzcG9uc2liaWxpdHlcbiAgICAvLyBvZiBpbmRleGluZywgaXRlcmF0aW5nLCBzbGljaW5nLCBhbmQgdmlzaXRpbmcgdG8gdGhlIE5lc3RlZC9DaHVua2VkIERhdGEvVmlld3MuXG4gICAgcHVibGljIHJlYWRvbmx5IGJhdGNoZXNVbmlvbjogUmVjb3JkQmF0Y2g7XG5cbiAgICBjb25zdHJ1Y3RvcihiYXRjaGVzOiBSZWNvcmRCYXRjaFtdKTtcbiAgICBjb25zdHJ1Y3RvciguLi5iYXRjaGVzOiBSZWNvcmRCYXRjaFtdKTtcbiAgICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYSwgYmF0Y2hlczogUmVjb3JkQmF0Y2hbXSk7XG4gICAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWEsIC4uLmJhdGNoZXM6IFJlY29yZEJhdGNoW10pO1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgIGxldCBzY2hlbWE6IFNjaGVtYTtcbiAgICAgICAgbGV0IGJhdGNoZXM6IFJlY29yZEJhdGNoW107XG4gICAgICAgIGlmIChhcmdzWzBdIGluc3RhbmNlb2YgU2NoZW1hKSB7XG4gICAgICAgICAgICBzY2hlbWEgPSBhcmdzWzBdO1xuICAgICAgICAgICAgYmF0Y2hlcyA9IEFycmF5LmlzQXJyYXkoYXJnc1sxXVswXSkgPyBhcmdzWzFdWzBdIDogYXJnc1sxXTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmdzWzBdIGluc3RhbmNlb2YgUmVjb3JkQmF0Y2gpIHtcbiAgICAgICAgICAgIHNjaGVtYSA9IChiYXRjaGVzID0gYXJncylbMF0uc2NoZW1hO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NoZW1hID0gKGJhdGNoZXMgPSBhcmdzWzBdKVswXS5zY2hlbWE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zY2hlbWEgPSBzY2hlbWE7XG4gICAgICAgIHRoaXMuYmF0Y2hlcyA9IGJhdGNoZXM7XG4gICAgICAgIHRoaXMuYmF0Y2hlc1VuaW9uID0gYmF0Y2hlcy5sZW5ndGggPT0gMCA/XG4gICAgICAgICAgICBuZXcgUmVjb3JkQmF0Y2goc2NoZW1hLCAwLCBbXSkgOlxuICAgICAgICAgICAgYmF0Y2hlcy5yZWR1Y2UoKHVuaW9uLCBiYXRjaCkgPT4gdW5pb24uY29uY2F0KGJhdGNoKSk7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5iYXRjaGVzVW5pb24ubGVuZ3RoO1xuICAgICAgICB0aGlzLm51bUNvbHMgPSB0aGlzLmJhdGNoZXNVbmlvbi5udW1Db2xzO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0KGluZGV4OiBudW1iZXIpOiBTdHJ1Y3RbJ1RWYWx1ZSddIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmF0Y2hlc1VuaW9uLmdldChpbmRleCkhO1xuICAgIH1cbiAgICBwdWJsaWMgZ2V0Q29sdW1uKG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb2x1bW5BdCh0aGlzLmdldENvbHVtbkluZGV4KG5hbWUpKTtcbiAgICB9XG4gICAgcHVibGljIGdldENvbHVtbkF0KGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLm51bUNvbHNcbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiB0aGlzLl9jb2x1bW5zW2luZGV4XSB8fCAoXG4gICAgICAgICAgICAgIHRoaXMuX2NvbHVtbnNbaW5kZXhdID0gdGhpcy5iYXRjaGVzVW5pb24uZ2V0Q2hpbGRBdChpbmRleCkhKTtcbiAgICB9XG4gICAgcHVibGljIGdldENvbHVtbkluZGV4KG5hbWU6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2hlbWEuZmllbGRzLmZpbmRJbmRleCgoZikgPT4gZi5uYW1lID09PSBuYW1lKTtcbiAgICB9XG4gICAgcHVibGljIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8U3RydWN0WydUVmFsdWUnXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5iYXRjaGVzVW5pb25bU3ltYm9sLml0ZXJhdG9yXSgpIGFzIGFueTtcbiAgICB9XG4gICAgcHVibGljIGZpbHRlcihwcmVkaWNhdGU6IFByZWRpY2F0ZSk6IERhdGFGcmFtZSB7XG4gICAgICAgIHJldHVybiBuZXcgRmlsdGVyZWREYXRhRnJhbWUodGhpcy5iYXRjaGVzLCBwcmVkaWNhdGUpO1xuICAgIH1cbiAgICBwdWJsaWMgc2NhbihuZXh0OiBOZXh0RnVuYywgYmluZD86IEJpbmRGdW5jKSB7XG4gICAgICAgIGNvbnN0IGJhdGNoZXMgPSB0aGlzLmJhdGNoZXMsIG51bUJhdGNoZXMgPSBiYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgYmF0Y2hJbmRleCA9IC0xOyArK2JhdGNoSW5kZXggPCBudW1CYXRjaGVzOykge1xuICAgICAgICAgICAgLy8gbG9hZCBiYXRjaGVzXG4gICAgICAgICAgICBjb25zdCBiYXRjaCA9IGJhdGNoZXNbYmF0Y2hJbmRleF07XG4gICAgICAgICAgICBpZiAoYmluZCkgeyBiaW5kKGJhdGNoKTsgfVxuICAgICAgICAgICAgLy8geWllbGQgYWxsIGluZGljZXNcbiAgICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gLTEsIG51bVJvd3MgPSBiYXRjaC5sZW5ndGg7ICsraW5kZXggPCBudW1Sb3dzOykge1xuICAgICAgICAgICAgICAgIG5leHQoaW5kZXgsIGJhdGNoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBwdWJsaWMgY291bnQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMubGVuZ3RoOyB9XG4gICAgcHVibGljIGNvdW50QnkobmFtZTogQ29sIHwgc3RyaW5nKTogQ291bnRCeVJlc3VsdCB7XG4gICAgICAgIGNvbnN0IGJhdGNoZXMgPSB0aGlzLmJhdGNoZXMsIG51bUJhdGNoZXMgPSBiYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgY291bnRfYnkgPSB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgPyBuZXcgQ29sKG5hbWUpIDogbmFtZTtcbiAgICAgICAgLy8gQXNzdW1lIHRoYXQgYWxsIGRpY3Rpb25hcnkgYmF0Y2hlcyBhcmUgZGVsdGFzLCB3aGljaCBtZWFucyB0aGF0IHRoZVxuICAgICAgICAvLyBsYXN0IHJlY29yZCBiYXRjaCBoYXMgdGhlIG1vc3QgY29tcGxldGUgZGljdGlvbmFyeVxuICAgICAgICBjb3VudF9ieS5iaW5kKGJhdGNoZXNbbnVtQmF0Y2hlcyAtIDFdKTtcbiAgICAgICAgY29uc3QgdmVjdG9yID0gY291bnRfYnkudmVjdG9yIGFzIERpY3Rpb25hcnlWZWN0b3I7XG4gICAgICAgIGlmICghKHZlY3RvciBpbnN0YW5jZW9mIERpY3Rpb25hcnlWZWN0b3IpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdW50QnkgY3VycmVudGx5IG9ubHkgc3VwcG9ydHMgZGljdGlvbmFyeS1lbmNvZGVkIGNvbHVtbnMnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBBZGp1c3QgYXJyYXkgYnl0ZSB3aWR0aCBiYXNlZCBvbiBvdmVyYWxsIGxlbmd0aFxuICAgICAgICAvLyAoZS5nLiBpZiB0aGlzLmxlbmd0aCA8PSAyNTUgdXNlIFVpbnQ4QXJyYXksIGV0Yy4uLilcbiAgICAgICAgY29uc3QgY291bnRzOiBVaW50MzJBcnJheSA9IG5ldyBVaW50MzJBcnJheSh2ZWN0b3IuZGljdGlvbmFyeS5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBiYXRjaEluZGV4ID0gLTE7ICsrYmF0Y2hJbmRleCA8IG51bUJhdGNoZXM7KSB7XG4gICAgICAgICAgICAvLyBsb2FkIGJhdGNoZXNcbiAgICAgICAgICAgIGNvbnN0IGJhdGNoID0gYmF0Y2hlc1tiYXRjaEluZGV4XTtcbiAgICAgICAgICAgIC8vIHJlYmluZCB0aGUgY291bnRCeSBDb2xcbiAgICAgICAgICAgIGNvdW50X2J5LmJpbmQoYmF0Y2gpO1xuICAgICAgICAgICAgY29uc3Qga2V5cyA9IChjb3VudF9ieS52ZWN0b3IgYXMgRGljdGlvbmFyeVZlY3RvcikuaW5kaWNlcztcbiAgICAgICAgICAgIC8vIHlpZWxkIGFsbCBpbmRpY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xLCBudW1Sb3dzID0gYmF0Y2gubGVuZ3RoOyArK2luZGV4IDwgbnVtUm93czspIHtcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0ga2V5cy5nZXQoaW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IG51bGwpIHsgY291bnRzW2tleV0rKzsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ291bnRCeVJlc3VsdCh2ZWN0b3IuZGljdGlvbmFyeSwgSW50VmVjdG9yLmZyb20oY291bnRzKSk7XG4gICAgfVxuICAgIHB1YmxpYyBzZWxlY3QoLi4uY29sdW1uTmFtZXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIHJldHVybiBuZXcgVGFibGUodGhpcy5iYXRjaGVzLm1hcCgoYmF0Y2gpID0+IGJhdGNoLnNlbGVjdCguLi5jb2x1bW5OYW1lcykpKTtcbiAgICB9XG4gICAgcHVibGljIHRvU3RyaW5nKHNlcGFyYXRvcj86IHN0cmluZykge1xuICAgICAgICBsZXQgc3RyID0gJyc7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMucm93c1RvU3RyaW5nKHNlcGFyYXRvcikpIHtcbiAgICAgICAgICAgIHN0ciArPSByb3cgKyAnXFxuJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBwdWJsaWMgcm93c1RvU3RyaW5nKHNlcGFyYXRvciA9ICcgfCAnKTogVGFibGVUb1N0cmluZ0l0ZXJhdG9yIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUYWJsZVRvU3RyaW5nSXRlcmF0b3IodGFibGVSb3dzVG9TdHJpbmcodGhpcywgc2VwYXJhdG9yKSk7XG4gICAgfVxufVxuXG5jbGFzcyBGaWx0ZXJlZERhdGFGcmFtZSBpbXBsZW1lbnRzIERhdGFGcmFtZSB7XG4gICAgcHJpdmF0ZSBwcmVkaWNhdGU6IFByZWRpY2F0ZTtcbiAgICBwcml2YXRlIGJhdGNoZXM6IFJlY29yZEJhdGNoW107XG4gICAgY29uc3RydWN0b3IgKGJhdGNoZXM6IFJlY29yZEJhdGNoW10sIHByZWRpY2F0ZTogUHJlZGljYXRlKSB7XG4gICAgICAgIHRoaXMuYmF0Y2hlcyA9IGJhdGNoZXM7XG4gICAgICAgIHRoaXMucHJlZGljYXRlID0gcHJlZGljYXRlO1xuICAgIH1cbiAgICBwdWJsaWMgc2NhbihuZXh0OiBOZXh0RnVuYywgYmluZD86IEJpbmRGdW5jKSB7XG4gICAgICAgIC8vIGlubGluZWQgdmVyc2lvbiBvZiB0aGlzOlxuICAgICAgICAvLyB0aGlzLnBhcmVudC5zY2FuKChpZHgsIGNvbHVtbnMpID0+IHtcbiAgICAgICAgLy8gICAgIGlmICh0aGlzLnByZWRpY2F0ZShpZHgsIGNvbHVtbnMpKSBuZXh0KGlkeCwgY29sdW1ucyk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICBjb25zdCBiYXRjaGVzID0gdGhpcy5iYXRjaGVzO1xuICAgICAgICBjb25zdCBudW1CYXRjaGVzID0gYmF0Y2hlcy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGJhdGNoSW5kZXggPSAtMTsgKytiYXRjaEluZGV4IDwgbnVtQmF0Y2hlczspIHtcbiAgICAgICAgICAgIC8vIGxvYWQgYmF0Y2hlc1xuICAgICAgICAgICAgY29uc3QgYmF0Y2ggPSBiYXRjaGVzW2JhdGNoSW5kZXhdO1xuICAgICAgICAgICAgLy8gVE9ETzogYmluZCBiYXRjaGVzIGxhemlseVxuICAgICAgICAgICAgLy8gSWYgcHJlZGljYXRlIGRvZXNuJ3QgbWF0Y2ggYW55dGhpbmcgaW4gdGhlIGJhdGNoIHdlIGRvbid0IG5lZWRcbiAgICAgICAgICAgIC8vIHRvIGJpbmQgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICBpZiAoYmluZCkgeyBiaW5kKGJhdGNoKTsgfVxuICAgICAgICAgICAgY29uc3QgcHJlZGljYXRlID0gdGhpcy5wcmVkaWNhdGUuYmluZChiYXRjaCk7XG4gICAgICAgICAgICAvLyB5aWVsZCBhbGwgaW5kaWNlc1xuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAtMSwgbnVtUm93cyA9IGJhdGNoLmxlbmd0aDsgKytpbmRleCA8IG51bVJvd3M7KSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZShpbmRleCwgYmF0Y2gpKSB7IG5leHQoaW5kZXgsIGJhdGNoKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBjb3VudCgpOiBudW1iZXIge1xuICAgICAgICAvLyBpbmxpbmVkIHZlcnNpb24gb2YgdGhpczpcbiAgICAgICAgLy8gbGV0IHN1bSA9IDA7XG4gICAgICAgIC8vIHRoaXMucGFyZW50LnNjYW4oKGlkeCwgY29sdW1ucykgPT4ge1xuICAgICAgICAvLyAgICAgaWYgKHRoaXMucHJlZGljYXRlKGlkeCwgY29sdW1ucykpICsrc3VtO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gcmV0dXJuIHN1bTtcbiAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgIGNvbnN0IGJhdGNoZXMgPSB0aGlzLmJhdGNoZXM7XG4gICAgICAgIGNvbnN0IG51bUJhdGNoZXMgPSBiYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgYmF0Y2hJbmRleCA9IC0xOyArK2JhdGNoSW5kZXggPCBudW1CYXRjaGVzOykge1xuICAgICAgICAgICAgLy8gbG9hZCBiYXRjaGVzXG4gICAgICAgICAgICBjb25zdCBiYXRjaCA9IGJhdGNoZXNbYmF0Y2hJbmRleF07XG4gICAgICAgICAgICBjb25zdCBwcmVkaWNhdGUgPSB0aGlzLnByZWRpY2F0ZS5iaW5kKGJhdGNoKTtcbiAgICAgICAgICAgIC8vIHlpZWxkIGFsbCBpbmRpY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xLCBudW1Sb3dzID0gYmF0Y2gubGVuZ3RoOyArK2luZGV4IDwgbnVtUm93czspIHtcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlKGluZGV4LCBiYXRjaCkpIHsgKytzdW07IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH1cbiAgICBwdWJsaWMgZmlsdGVyKHByZWRpY2F0ZTogUHJlZGljYXRlKTogRGF0YUZyYW1lIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGaWx0ZXJlZERhdGFGcmFtZShcbiAgICAgICAgICAgIHRoaXMuYmF0Y2hlcyxcbiAgICAgICAgICAgIHRoaXMucHJlZGljYXRlLmFuZChwcmVkaWNhdGUpXG4gICAgICAgICk7XG4gICAgfVxuICAgIHB1YmxpYyBjb3VudEJ5KG5hbWU6IENvbCB8IHN0cmluZyk6IENvdW50QnlSZXN1bHQge1xuICAgICAgICBjb25zdCBiYXRjaGVzID0gdGhpcy5iYXRjaGVzLCBudW1CYXRjaGVzID0gYmF0Y2hlcy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGNvdW50X2J5ID0gdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnID8gbmV3IENvbChuYW1lKSA6IG5hbWU7XG4gICAgICAgIC8vIEFzc3VtZSB0aGF0IGFsbCBkaWN0aW9uYXJ5IGJhdGNoZXMgYXJlIGRlbHRhcywgd2hpY2ggbWVhbnMgdGhhdCB0aGVcbiAgICAgICAgLy8gbGFzdCByZWNvcmQgYmF0Y2ggaGFzIHRoZSBtb3N0IGNvbXBsZXRlIGRpY3Rpb25hcnlcbiAgICAgICAgY291bnRfYnkuYmluZChiYXRjaGVzW251bUJhdGNoZXMgLSAxXSk7XG4gICAgICAgIGNvbnN0IHZlY3RvciA9IGNvdW50X2J5LnZlY3RvciBhcyBEaWN0aW9uYXJ5VmVjdG9yO1xuICAgICAgICBpZiAoISh2ZWN0b3IgaW5zdGFuY2VvZiBEaWN0aW9uYXJ5VmVjdG9yKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VudEJ5IGN1cnJlbnRseSBvbmx5IHN1cHBvcnRzIGRpY3Rpb25hcnktZW5jb2RlZCBjb2x1bW5zJyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogQWRqdXN0IGFycmF5IGJ5dGUgd2lkdGggYmFzZWQgb24gb3ZlcmFsbCBsZW5ndGhcbiAgICAgICAgLy8gKGUuZy4gaWYgdGhpcy5sZW5ndGggPD0gMjU1IHVzZSBVaW50OEFycmF5LCBldGMuLi4pXG4gICAgICAgIGNvbnN0IGNvdW50czogVWludDMyQXJyYXkgPSBuZXcgVWludDMyQXJyYXkodmVjdG9yLmRpY3Rpb25hcnkubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgYmF0Y2hJbmRleCA9IC0xOyArK2JhdGNoSW5kZXggPCBudW1CYXRjaGVzOykge1xuICAgICAgICAgICAgLy8gbG9hZCBiYXRjaGVzXG4gICAgICAgICAgICBjb25zdCBiYXRjaCA9IGJhdGNoZXNbYmF0Y2hJbmRleF07XG4gICAgICAgICAgICBjb25zdCBwcmVkaWNhdGUgPSB0aGlzLnByZWRpY2F0ZS5iaW5kKGJhdGNoKTtcbiAgICAgICAgICAgIC8vIHJlYmluZCB0aGUgY291bnRCeSBDb2xcbiAgICAgICAgICAgIGNvdW50X2J5LmJpbmQoYmF0Y2gpO1xuICAgICAgICAgICAgY29uc3Qga2V5cyA9IChjb3VudF9ieS52ZWN0b3IgYXMgRGljdGlvbmFyeVZlY3RvcikuaW5kaWNlcztcbiAgICAgICAgICAgIC8vIHlpZWxkIGFsbCBpbmRpY2VzXG4gICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xLCBudW1Sb3dzID0gYmF0Y2gubGVuZ3RoOyArK2luZGV4IDwgbnVtUm93czspIHtcbiAgICAgICAgICAgICAgICBsZXQga2V5ID0ga2V5cy5nZXQoaW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IG51bGwgJiYgcHJlZGljYXRlKGluZGV4LCBiYXRjaCkpIHsgY291bnRzW2tleV0rKzsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ291bnRCeVJlc3VsdCh2ZWN0b3IuZGljdGlvbmFyeSwgSW50VmVjdG9yLmZyb20oY291bnRzKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ291bnRCeVJlc3VsdCBleHRlbmRzIFRhYmxlIGltcGxlbWVudHMgRGF0YUZyYW1lIHtcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZXM6IFZlY3RvciwgY291bnRzOiBJbnRWZWN0b3I8YW55Pikge1xuICAgICAgICBzdXBlcihcbiAgICAgICAgICAgIG5ldyBSZWNvcmRCYXRjaChuZXcgU2NoZW1hKFtcbiAgICAgICAgICAgICAgICBuZXcgRmllbGQoJ3ZhbHVlcycsIHZhbHVlcy50eXBlKSxcbiAgICAgICAgICAgICAgICBuZXcgRmllbGQoJ2NvdW50cycsIGNvdW50cy50eXBlKVxuICAgICAgICAgICAgXSksXG4gICAgICAgICAgICBjb3VudHMubGVuZ3RoLCBbdmFsdWVzLCBjb3VudHNdXG4gICAgICAgICkpO1xuICAgIH1cbiAgICBwdWJsaWMgdG9KU09OKCk6IE9iamVjdCB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuZ2V0Q29sdW1uQXQoMCkhO1xuICAgICAgICBjb25zdCBjb3VudHMgPSB0aGlzLmdldENvbHVtbkF0KDEpITtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge30gYXMgeyBbazogc3RyaW5nXTogbnVtYmVyIHwgbnVsbCB9O1xuICAgICAgICBmb3IgKGxldCBpID0gLTE7ICsraSA8IHRoaXMubGVuZ3RoOykge1xuICAgICAgICAgICAgcmVzdWx0W3ZhbHVlcy5nZXQoaSldID0gY291bnRzLmdldChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRhYmxlVG9TdHJpbmdJdGVyYXRvciBpbXBsZW1lbnRzIEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBpdGVyYXRvcjogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+KSB7fVxuICAgIFtTeW1ib2wuaXRlcmF0b3JdKCkgeyByZXR1cm4gdGhpcy5pdGVyYXRvcjsgfVxuICAgIG5leHQodmFsdWU/OiBhbnkpIHsgcmV0dXJuIHRoaXMuaXRlcmF0b3IubmV4dCh2YWx1ZSk7IH1cbiAgICB0aHJvdyhlcnJvcj86IGFueSkgeyByZXR1cm4gdGhpcy5pdGVyYXRvci50aHJvdyAmJiB0aGlzLml0ZXJhdG9yLnRocm93KGVycm9yKSB8fCB7IGRvbmU6IHRydWUsIHZhbHVlOiAnJyB9OyB9XG4gICAgcmV0dXJuKHZhbHVlPzogYW55KSB7IHJldHVybiB0aGlzLml0ZXJhdG9yLnJldHVybiAmJiB0aGlzLml0ZXJhdG9yLnJldHVybih2YWx1ZSkgfHwgeyBkb25lOiB0cnVlLCB2YWx1ZTogJycgfTsgfVxuICAgIHBpcGUoc3RyZWFtOiBOb2RlSlMuV3JpdGFibGVTdHJlYW0pIHtcbiAgICAgICAgbGV0IHJlczogSXRlcmF0b3JSZXN1bHQ8c3RyaW5nPjtcbiAgICAgICAgbGV0IHdyaXRlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHN0cmVhbVsnd3JpdGFibGUnXSkge1xuICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChyZXMgPSB0aGlzLm5leHQoKSkuZG9uZSkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgIH0gd2hpbGUgKHN0cmVhbVsnd3JpdGUnXShyZXMudmFsdWUgKyAnXFxuJywgJ3V0ZjgnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXJlcyB8fCAhcmVzLmRvbmUpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW1bJ29uY2UnXSgnZHJhaW4nLCB3cml0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEoc3RyZWFtIGFzIGFueSlbJ2lzVFRZJ10pIHtcbiAgICAgICAgICAgICAgICBzdHJlYW1bJ2VuZCddKCdcXG4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgd3JpdGUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiB0YWJsZVJvd3NUb1N0cmluZyh0YWJsZTogVGFibGUsIHNlcGFyYXRvciA9ICcgfCAnKSB7XG4gICAgY29uc3QgZmllbGRzID0gdGFibGUuc2NoZW1hLmZpZWxkcztcbiAgICBjb25zdCBoZWFkZXIgPSBbJ3Jvd19pZCcsIC4uLmZpZWxkcy5tYXAoKGYpID0+IGAke2Z9YCldLm1hcChzdHJpbmdpZnkpO1xuICAgIGNvbnN0IG1heENvbHVtbldpZHRocyA9IGhlYWRlci5tYXAoeCA9PiB4Lmxlbmd0aCk7XG4gICAgLy8gUGFzcyBvbmUgdG8gY29udmVydCB0byBzdHJpbmdzIGFuZCBjb3VudCBtYXggY29sdW1uIHdpZHRoc1xuICAgIGZvciAobGV0IGkgPSAtMSwgbiA9IHRhYmxlLmxlbmd0aCAtIDE7ICsraSA8IG47KSB7XG4gICAgICAgIGxldCB2YWwsIHJvdyA9IFtpLCAuLi50YWJsZS5nZXQoaSldO1xuICAgICAgICBmb3IgKGxldCBqID0gLTEsIGsgPSByb3cubGVuZ3RoOyArK2ogPCBrOyApIHtcbiAgICAgICAgICAgIHZhbCA9IHN0cmluZ2lmeShyb3dbal0pO1xuICAgICAgICAgICAgbWF4Q29sdW1uV2lkdGhzW2pdID0gTWF0aC5tYXgobWF4Q29sdW1uV2lkdGhzW2pdLCB2YWwubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB5aWVsZCBoZWFkZXIubWFwKCh4LCBqKSA9PiBsZWZ0UGFkKHgsICcgJywgbWF4Q29sdW1uV2lkdGhzW2pdKSkuam9pbihzZXBhcmF0b3IpO1xuICAgIGZvciAobGV0IGkgPSAtMTsgKytpIDwgdGFibGUubGVuZ3RoOykge1xuICAgICAgICB5aWVsZCBbaSwgLi4udGFibGUuZ2V0KGkpXVxuICAgICAgICAgICAgLm1hcCgoeCkgPT4gc3RyaW5naWZ5KHgpKVxuICAgICAgICAgICAgLm1hcCgoeCwgaikgPT4gbGVmdFBhZCh4LCAnICcsIG1heENvbHVtbldpZHRoc1tqXSkpXG4gICAgICAgICAgICAuam9pbihzZXBhcmF0b3IpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbGVmdFBhZChzdHI6IHN0cmluZywgZmlsbDogc3RyaW5nLCBuOiBudW1iZXIpIHtcbiAgICByZXR1cm4gKG5ldyBBcnJheShuICsgMSkuam9pbihmaWxsKSArIHN0cikuc2xpY2UoLTEgKiBuKTtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5KHg6IGFueSkge1xuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N0cmluZycgPyBgXCIke3h9XCJgIDogQXJyYXlCdWZmZXIuaXNWaWV3KHgpID8gYFske3h9XWAgOiBKU09OLnN0cmluZ2lmeSh4KTtcbn1cbiJdfQ==
