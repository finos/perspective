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
/* tslint:disable:class-name */
import { align } from '../util/bit';
import { MessageHeader } from '../type';
var Footer = /** @class */ (function () {
    function Footer(dictionaryBatches, recordBatches, schema) {
        this.dictionaryBatches = dictionaryBatches;
        this.recordBatches = recordBatches;
        this.schema = schema;
    }
    return Footer;
}());
export { Footer };
var FileBlock = /** @class */ (function () {
    function FileBlock(metaDataLength, bodyLength, offset) {
        this.metaDataLength = metaDataLength;
        this.bodyLength = bodyLength;
        this.offset = offset;
    }
    return FileBlock;
}());
export { FileBlock };
var Message = /** @class */ (function () {
    function Message(version, bodyLength, headerType) {
        this.version = version;
        this.headerType = headerType;
        this.bodyLength = typeof bodyLength === 'number' ? bodyLength : bodyLength.low;
    }
    Message.isSchema = function (m) { return m.headerType === MessageHeader.Schema; };
    Message.isRecordBatch = function (m) { return m.headerType === MessageHeader.RecordBatch; };
    Message.isDictionaryBatch = function (m) { return m.headerType === MessageHeader.DictionaryBatch; };
    return Message;
}());
export { Message };
var RecordBatchMetadata = /** @class */ (function (_super) {
    tslib_1.__extends(RecordBatchMetadata, _super);
    function RecordBatchMetadata(version, length, nodes, buffers) {
        var _this = _super.call(this, version, buffers.reduce(function (s, b) { return align(s + b.length + (b.offset - s), 8); }, 0), MessageHeader.RecordBatch) || this;
        _this.nodes = nodes;
        _this.buffers = buffers;
        _this.length = typeof length === 'number' ? length : length.low;
        return _this;
    }
    return RecordBatchMetadata;
}(Message));
export { RecordBatchMetadata };
var DictionaryBatch = /** @class */ (function (_super) {
    tslib_1.__extends(DictionaryBatch, _super);
    function DictionaryBatch(version, data, id, isDelta) {
        if (isDelta === void 0) { isDelta = false; }
        var _this = _super.call(this, version, data.bodyLength, MessageHeader.DictionaryBatch) || this;
        _this.isDelta = isDelta;
        _this.data = data;
        _this.id = typeof id === 'number' ? id : id.low;
        return _this;
    }
    DictionaryBatch.getId = function () { return DictionaryBatch.atomicDictionaryId++; };
    Object.defineProperty(DictionaryBatch.prototype, "nodes", {
        get: function () { return this.data.nodes; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DictionaryBatch.prototype, "buffers", {
        get: function () { return this.data.buffers; },
        enumerable: true,
        configurable: true
    });
    DictionaryBatch.atomicDictionaryId = 0;
    return DictionaryBatch;
}(Message));
export { DictionaryBatch };
var BufferMetadata = /** @class */ (function () {
    function BufferMetadata(offset, length) {
        this.offset = typeof offset === 'number' ? offset : offset.low;
        this.length = typeof length === 'number' ? length : length.low;
    }
    return BufferMetadata;
}());
export { BufferMetadata };
var FieldMetadata = /** @class */ (function () {
    function FieldMetadata(length, nullCount) {
        this.length = typeof length === 'number' ? length : length.low;
        this.nullCount = typeof nullCount === 'number' ? nullCount : nullCount.low;
    }
    return FieldMetadata;
}());
export { FieldMetadata };

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QSxBQU9DLElBQUE7O0FBRUQ7SUFHSSx1QkFBWSxNQUFxQixFQUFFLFNBQXdCO1FBQ3ZELElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDL0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztJQUMvRSxDQUFDO0lBQ0wsb0JBQUM7QUFBRCxDQVBBLEFBT0MsSUFBQSIsImZpbGUiOiJpcGMvbWV0YWRhdGEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4vLyBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbi8vIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4vLyByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4vLyB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4vLyBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Vcbi8vIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbi8vIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4vLyBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuLy8gS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4vLyBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4vLyB1bmRlciB0aGUgTGljZW5zZS5cblxuLyogdHNsaW50OmRpc2FibGU6Y2xhc3MtbmFtZSAqL1xuXG5pbXBvcnQgeyBhbGlnbiB9IGZyb20gJy4uL3V0aWwvYml0JztcbmltcG9ydCB7IFNjaGVtYSwgTG9uZywgTWVzc2FnZUhlYWRlciwgTWV0YWRhdGFWZXJzaW9uIH0gZnJvbSAnLi4vdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBGb290ZXIge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBkaWN0aW9uYXJ5QmF0Y2hlczogRmlsZUJsb2NrW10sIHB1YmxpYyByZWNvcmRCYXRjaGVzOiBGaWxlQmxvY2tbXSwgcHVibGljIHNjaGVtYTogU2NoZW1hKSB7fVxufVxuXG5leHBvcnQgY2xhc3MgRmlsZUJsb2NrIHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbWV0YURhdGFMZW5ndGg6IG51bWJlciwgcHVibGljIGJvZHlMZW5ndGg6IExvbmcsIHB1YmxpYyBvZmZzZXQ6IExvbmcpIHt9XG59XG5cbmV4cG9ydCBjbGFzcyBNZXNzYWdlIHtcbiAgICBwdWJsaWMgYm9keUxlbmd0aDogbnVtYmVyO1xuICAgIHB1YmxpYyB2ZXJzaW9uOiBNZXRhZGF0YVZlcnNpb247XG4gICAgcHVibGljIGhlYWRlclR5cGU6IE1lc3NhZ2VIZWFkZXI7XG4gICAgY29uc3RydWN0b3IodmVyc2lvbjogTWV0YWRhdGFWZXJzaW9uLCBib2R5TGVuZ3RoOiBMb25nIHwgbnVtYmVyLCBoZWFkZXJUeXBlOiBNZXNzYWdlSGVhZGVyKSB7XG4gICAgICAgIHRoaXMudmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgIHRoaXMuaGVhZGVyVHlwZSA9IGhlYWRlclR5cGU7XG4gICAgICAgIHRoaXMuYm9keUxlbmd0aCA9IHR5cGVvZiBib2R5TGVuZ3RoID09PSAnbnVtYmVyJyA/IGJvZHlMZW5ndGggOiBib2R5TGVuZ3RoLmxvdztcbiAgICB9XG4gICAgc3RhdGljIGlzU2NoZW1hKG06IE1lc3NhZ2UpOiBtIGlzIFNjaGVtYSB7IHJldHVybiBtLmhlYWRlclR5cGUgPT09IE1lc3NhZ2VIZWFkZXIuU2NoZW1hOyB9XG4gICAgc3RhdGljIGlzUmVjb3JkQmF0Y2gobTogTWVzc2FnZSk6IG0gaXMgUmVjb3JkQmF0Y2hNZXRhZGF0YSB7IHJldHVybiBtLmhlYWRlclR5cGUgPT09IE1lc3NhZ2VIZWFkZXIuUmVjb3JkQmF0Y2g7IH1cbiAgICBzdGF0aWMgaXNEaWN0aW9uYXJ5QmF0Y2gobTogTWVzc2FnZSk6IG0gaXMgRGljdGlvbmFyeUJhdGNoIHsgcmV0dXJuIG0uaGVhZGVyVHlwZSA9PT0gTWVzc2FnZUhlYWRlci5EaWN0aW9uYXJ5QmF0Y2g7IH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlY29yZEJhdGNoTWV0YWRhdGEgZXh0ZW5kcyBNZXNzYWdlIHtcbiAgICBwdWJsaWMgbGVuZ3RoOiBudW1iZXI7XG4gICAgcHVibGljIG5vZGVzOiBGaWVsZE1ldGFkYXRhW107XG4gICAgcHVibGljIGJ1ZmZlcnM6IEJ1ZmZlck1ldGFkYXRhW107XG4gICAgY29uc3RydWN0b3IodmVyc2lvbjogTWV0YWRhdGFWZXJzaW9uLCBsZW5ndGg6IExvbmcgfCBudW1iZXIsIG5vZGVzOiBGaWVsZE1ldGFkYXRhW10sIGJ1ZmZlcnM6IEJ1ZmZlck1ldGFkYXRhW10pIHtcbiAgICAgICAgc3VwZXIodmVyc2lvbiwgYnVmZmVycy5yZWR1Y2UoKHMsIGIpID0+IGFsaWduKHMgKyBiLmxlbmd0aCArIChiLm9mZnNldCAtIHMpLCA4KSwgMCksIE1lc3NhZ2VIZWFkZXIuUmVjb3JkQmF0Y2gpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IGJ1ZmZlcnM7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdHlwZW9mIGxlbmd0aCA9PT0gJ251bWJlcicgPyBsZW5ndGggOiBsZW5ndGgubG93O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERpY3Rpb25hcnlCYXRjaCBleHRlbmRzIE1lc3NhZ2Uge1xuICAgIHB1YmxpYyBpZDogbnVtYmVyO1xuICAgIHB1YmxpYyBpc0RlbHRhOiBib29sZWFuO1xuICAgIHB1YmxpYyBkYXRhOiBSZWNvcmRCYXRjaE1ldGFkYXRhO1xuICAgIGNvbnN0cnVjdG9yKHZlcnNpb246IE1ldGFkYXRhVmVyc2lvbiwgZGF0YTogUmVjb3JkQmF0Y2hNZXRhZGF0YSwgaWQ6IExvbmcgfCBudW1iZXIsIGlzRGVsdGE6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICBzdXBlcih2ZXJzaW9uLCBkYXRhLmJvZHlMZW5ndGgsIE1lc3NhZ2VIZWFkZXIuRGljdGlvbmFyeUJhdGNoKTtcbiAgICAgICAgdGhpcy5pc0RlbHRhID0gaXNEZWx0YTtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5pZCA9IHR5cGVvZiBpZCA9PT0gJ251bWJlcicgPyBpZCA6IGlkLmxvdztcbiAgICB9XG4gICAgcHJpdmF0ZSBzdGF0aWMgYXRvbWljRGljdGlvbmFyeUlkID0gMDtcbiAgICBwdWJsaWMgc3RhdGljIGdldElkKCkgeyByZXR1cm4gRGljdGlvbmFyeUJhdGNoLmF0b21pY0RpY3Rpb25hcnlJZCsrOyB9XG4gICAgcHVibGljIGdldCBub2RlcygpOiBGaWVsZE1ldGFkYXRhW10geyByZXR1cm4gdGhpcy5kYXRhLm5vZGVzOyB9XG4gICAgcHVibGljIGdldCBidWZmZXJzKCk6IEJ1ZmZlck1ldGFkYXRhW10geyByZXR1cm4gdGhpcy5kYXRhLmJ1ZmZlcnM7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEJ1ZmZlck1ldGFkYXRhIHtcbiAgICBwdWJsaWMgb2Zmc2V0OiBudW1iZXI7XG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICAgIGNvbnN0cnVjdG9yKG9mZnNldDogTG9uZyB8IG51bWJlciwgbGVuZ3RoOiBMb25nIHwgbnVtYmVyKSB7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdHlwZW9mIG9mZnNldCA9PT0gJ251bWJlcicgPyBvZmZzZXQgOiBvZmZzZXQubG93O1xuICAgICAgICB0aGlzLmxlbmd0aCA9IHR5cGVvZiBsZW5ndGggPT09ICdudW1iZXInID8gbGVuZ3RoIDogbGVuZ3RoLmxvdztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGaWVsZE1ldGFkYXRhIHtcbiAgICBwdWJsaWMgbGVuZ3RoOiBudW1iZXI7XG4gICAgcHVibGljIG51bGxDb3VudDogbnVtYmVyO1xuICAgIGNvbnN0cnVjdG9yKGxlbmd0aDogTG9uZyB8IG51bWJlciwgbnVsbENvdW50OiBMb25nIHwgbnVtYmVyKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdHlwZW9mIGxlbmd0aCA9PT0gJ251bWJlcicgPyBsZW5ndGggOiBsZW5ndGgubG93O1xuICAgICAgICB0aGlzLm51bGxDb3VudCA9IHR5cGVvZiBudWxsQ291bnQgPT09ICdudW1iZXInID8gbnVsbENvdW50IDogbnVsbENvdW50LmxvdztcbiAgICB9XG59XG4iXX0=
