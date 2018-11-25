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
import { Vector } from '../vector';
var ChunkedView = /** @class */ (function () {
    function ChunkedView(data) {
        this.chunkVectors = data.chunkVectors;
        this.chunkOffsets = data.chunkOffsets;
    }
    ChunkedView.prototype.clone = function (data) {
        return new ChunkedView(data);
    };
    ChunkedView.prototype[Symbol.iterator] = function () {
        var _a, _b, vector, e_1_1, e_1, _c;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 5, 6, 7]);
                    _a = tslib_1.__values(this.chunkVectors), _b = _a.next();
                    _d.label = 1;
                case 1:
                    if (!!_b.done) return [3 /*break*/, 4];
                    vector = _b.value;
                    return [5 /*yield**/, tslib_1.__values(vector)];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    _b = _a.next();
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5:
                    e_1_1 = _d.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 7];
                case 6:
                    try {
                        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    };
    ChunkedView.prototype.getChildAt = function (index) {
        return index < 0 ? null
            : (this._children || (this._children = []))[index] ||
                (this._children[index] = Vector.concat.apply(Vector, tslib_1.__spread(this.chunkVectors
                    .map(function (chunk) { return chunk.getChildAt(index); }))));
    };
    ChunkedView.prototype.isValid = function (index) {
        // binary search to find the child vector and value index offset (inlined for speed)
        var offsets = this.chunkOffsets, pos = 0;
        var lhs = 0, mid = 0, rhs = offsets.length - 1;
        while (index < offsets[rhs] && index >= (pos = offsets[lhs])) {
            if (lhs + 1 === rhs) {
                return this.chunkVectors[lhs].isValid(index - pos);
            }
            mid = lhs + ((rhs - lhs) / 2) | 0;
            index >= offsets[mid] ? (lhs = mid) : (rhs = mid);
        }
        return false;
    };
    ChunkedView.prototype.get = function (index) {
        // binary search to find the child vector and value index offset (inlined for speed)
        var offsets = this.chunkOffsets, pos = 0;
        var lhs = 0, mid = 0, rhs = offsets.length - 1;
        while (index < offsets[rhs] && index >= (pos = offsets[lhs])) {
            if (lhs + 1 === rhs) {
                return this.chunkVectors[lhs].get(index - pos);
            }
            mid = lhs + ((rhs - lhs) / 2) | 0;
            index >= offsets[mid] ? (lhs = mid) : (rhs = mid);
        }
        return null;
    };
    ChunkedView.prototype.set = function (index, value) {
        // binary search to find the child vector and value index offset (inlined for speed)
        var offsets = this.chunkOffsets, pos = 0;
        var lhs = 0, mid = 0, rhs = offsets.length - 1;
        while (index < offsets[rhs] && index >= (pos = offsets[lhs])) {
            if (lhs + 1 === rhs) {
                return this.chunkVectors[lhs].set(index - pos, value);
            }
            mid = lhs + ((rhs - lhs) / 2) | 0;
            index >= offsets[mid] ? (lhs = mid) : (rhs = mid);
        }
    };
    ChunkedView.prototype.toArray = function () {
        var chunks = this.chunkVectors;
        var numChunks = chunks.length;
        if (numChunks === 1) {
            return chunks[0].toArray();
        }
        var sources = new Array(numChunks);
        var sourcesLen = 0, ArrayType = Array;
        for (var index = -1; ++index < numChunks;) {
            var source = chunks[index].toArray();
            sourcesLen += (sources[index] = source).length;
            if (ArrayType !== source.constructor) {
                ArrayType = source.constructor;
            }
        }
        var target = new ArrayType(sourcesLen);
        var setValues = ArrayType === Array ? arraySet : typedArraySet;
        for (var index = -1, offset = 0; ++index < numChunks;) {
            offset = setValues(sources[index], target, offset);
        }
        return target;
    };
    ChunkedView.prototype.indexOf = function (search) {
        var offset = 0, result;
        try {
            for (var _a = tslib_1.__values(this.chunkVectors), _b = _a.next(); !_b.done; _b = _a.next()) {
                var vector = _b.value;
                result = vector.indexOf(search);
                if (result !== -1) {
                    return result + offset;
                }
                offset += vector.length;
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
    return ChunkedView;
}());
export { ChunkedView };
function typedArraySet(source, target, index) {
    return target.set(source, index) || index + source.length;
}
function arraySet(source, target, index) {
    var dstIdx = index - 1, srcIdx = -1, srcLen = source.length;
    while (++srcIdx < srcLen) {
        target[++dstIdx] = source[srcIdx];
    }
    return dstIdx;
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QyxDQUFDO2dCQUM5QyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQzthQUMzQjs7Ozs7Ozs7O1FBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztJQUNkLENBQUM7SUFDTCxrQkFBQztBQUFELENBOUZBLEFBOEZDLElBQUE7O0FBRUQsdUJBQXVCLE1BQWtCLEVBQUUsTUFBa0IsRUFBRSxLQUFhO0lBQ3hFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUM5RCxDQUFDO0FBRUQsa0JBQWtCLE1BQWEsRUFBRSxNQUFhLEVBQUUsS0FBYTtJQUN6RCxJQUFJLE1BQU0sR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM1RCxPQUFPLEVBQUUsTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNsQixDQUFDIiwiZmlsZSI6InZlY3Rvci9jaHVua2VkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuLy8gb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4vLyBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuLy8gcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuLy8gdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuLy8gXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4vLyB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4vLyBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuLy8gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbi8vIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuLy8gc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuLy8gdW5kZXIgdGhlIExpY2Vuc2UuXG5cbmltcG9ydCB7IENodW5rZWREYXRhIH0gZnJvbSAnLi4vZGF0YSc7XG5pbXBvcnQgeyBWaWV3LCBWZWN0b3IsIE5lc3RlZFZlY3RvciB9IGZyb20gJy4uL3ZlY3Rvcic7XG5pbXBvcnQgeyBEYXRhVHlwZSwgVHlwZWRBcnJheSwgSXRlcmFibGVBcnJheUxpa2UgfSBmcm9tICcuLi90eXBlJztcblxuZXhwb3J0IGNsYXNzIENodW5rZWRWaWV3PFQgZXh0ZW5kcyBEYXRhVHlwZT4gaW1wbGVtZW50cyBWaWV3PFQ+IHtcbiAgICBwdWJsaWMgY2h1bmtWZWN0b3JzOiBWZWN0b3I8VD5bXTtcbiAgICBwdWJsaWMgY2h1bmtPZmZzZXRzOiBVaW50MzJBcnJheTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHJvdGVjdGVkIF9jaGlsZHJlbjogVmVjdG9yPGFueT5bXTtcbiAgICBjb25zdHJ1Y3RvcihkYXRhOiBDaHVua2VkRGF0YTxUPikge1xuICAgICAgICB0aGlzLmNodW5rVmVjdG9ycyA9IGRhdGEuY2h1bmtWZWN0b3JzO1xuICAgICAgICB0aGlzLmNodW5rT2Zmc2V0cyA9IGRhdGEuY2h1bmtPZmZzZXRzO1xuICAgIH1cbiAgICBwdWJsaWMgY2xvbmUoZGF0YTogQ2h1bmtlZERhdGE8VD4pOiB0aGlzIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDaHVua2VkVmlldyhkYXRhKSBhcyB0aGlzO1xuICAgIH1cbiAgICBwdWJsaWMgKltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8VFsnVFZhbHVlJ10gfCBudWxsPiB7XG4gICAgICAgIGZvciAoY29uc3QgdmVjdG9yIG9mIHRoaXMuY2h1bmtWZWN0b3JzKSB7XG4gICAgICAgICAgICB5aWVsZCogdmVjdG9yO1xuICAgICAgICB9XG4gICAgfVxuICAgIHB1YmxpYyBnZXRDaGlsZEF0PFIgZXh0ZW5kcyBEYXRhVHlwZSA9IERhdGFUeXBlPihpbmRleDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBpbmRleCA8IDAgPyBudWxsXG4gICAgICAgICAgICA6ICh0aGlzLl9jaGlsZHJlbiB8fCAodGhpcy5fY2hpbGRyZW4gPSBbXSkpW2luZGV4XSB8fFxuICAgICAgICAgICAgICAodGhpcy5fY2hpbGRyZW5baW5kZXhdID0gVmVjdG9yLmNvbmNhdDxSPihcbiAgICAgICAgICAgICAgICAgIC4uLig8YW55PiB0aGlzLmNodW5rVmVjdG9ycyBhcyBOZXN0ZWRWZWN0b3I8YW55PltdKVxuICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGNodW5rKSA9PiBjaHVuay5nZXRDaGlsZEF0PFI+KGluZGV4KSkpKTtcbiAgICB9XG4gICAgcHVibGljIGlzVmFsaWQoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgICAgICAvLyBiaW5hcnkgc2VhcmNoIHRvIGZpbmQgdGhlIGNoaWxkIHZlY3RvciBhbmQgdmFsdWUgaW5kZXggb2Zmc2V0IChpbmxpbmVkIGZvciBzcGVlZClcbiAgICAgICAgbGV0IG9mZnNldHMgPSB0aGlzLmNodW5rT2Zmc2V0cywgcG9zID0gMDtcbiAgICAgICAgbGV0IGxocyA9IDAsIG1pZCA9IDAsIHJocyA9IG9mZnNldHMubGVuZ3RoIC0gMTtcbiAgICAgICAgd2hpbGUgKGluZGV4IDwgb2Zmc2V0c1tyaHNdICYmIGluZGV4ID49IChwb3MgPSBvZmZzZXRzW2xoc10pKSB7XG4gICAgICAgICAgICBpZiAobGhzICsgMSA9PT0gcmhzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2h1bmtWZWN0b3JzW2xoc10uaXNWYWxpZChpbmRleCAtIHBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtaWQgPSBsaHMgKyAoKHJocyAtIGxocykgLyAyKSB8IDA7XG4gICAgICAgICAgICBpbmRleCA+PSBvZmZzZXRzW21pZF0gPyAobGhzID0gbWlkKSA6IChyaHMgPSBtaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcHVibGljIGdldChpbmRleDogbnVtYmVyKTogVFsnVFZhbHVlJ10gfCBudWxsIHtcbiAgICAgICAgLy8gYmluYXJ5IHNlYXJjaCB0byBmaW5kIHRoZSBjaGlsZCB2ZWN0b3IgYW5kIHZhbHVlIGluZGV4IG9mZnNldCAoaW5saW5lZCBmb3Igc3BlZWQpXG4gICAgICAgIGxldCBvZmZzZXRzID0gdGhpcy5jaHVua09mZnNldHMsIHBvcyA9IDA7XG4gICAgICAgIGxldCBsaHMgPSAwLCBtaWQgPSAwLCByaHMgPSBvZmZzZXRzLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpbmRleCA8IG9mZnNldHNbcmhzXSAmJiBpbmRleCA+PSAocG9zID0gb2Zmc2V0c1tsaHNdKSkge1xuICAgICAgICAgICAgaWYgKGxocyArIDEgPT09IHJocykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNodW5rVmVjdG9yc1tsaHNdLmdldChpbmRleCAtIHBvcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtaWQgPSBsaHMgKyAoKHJocyAtIGxocykgLyAyKSB8IDA7XG4gICAgICAgICAgICBpbmRleCA+PSBvZmZzZXRzW21pZF0gPyAobGhzID0gbWlkKSA6IChyaHMgPSBtaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUWydUVmFsdWUnXSB8IG51bGwpOiB2b2lkIHtcbiAgICAgICAgLy8gYmluYXJ5IHNlYXJjaCB0byBmaW5kIHRoZSBjaGlsZCB2ZWN0b3IgYW5kIHZhbHVlIGluZGV4IG9mZnNldCAoaW5saW5lZCBmb3Igc3BlZWQpXG4gICAgICAgIGxldCBvZmZzZXRzID0gdGhpcy5jaHVua09mZnNldHMsIHBvcyA9IDA7XG4gICAgICAgIGxldCBsaHMgPSAwLCBtaWQgPSAwLCByaHMgPSBvZmZzZXRzLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChpbmRleCA8IG9mZnNldHNbcmhzXSAmJiBpbmRleCA+PSAocG9zID0gb2Zmc2V0c1tsaHNdKSkge1xuICAgICAgICAgICAgaWYgKGxocyArIDEgPT09IHJocykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNodW5rVmVjdG9yc1tsaHNdLnNldChpbmRleCAtIHBvcywgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWlkID0gbGhzICsgKChyaHMgLSBsaHMpIC8gMikgfCAwO1xuICAgICAgICAgICAgaW5kZXggPj0gb2Zmc2V0c1ttaWRdID8gKGxocyA9IG1pZCkgOiAocmhzID0gbWlkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdWJsaWMgdG9BcnJheSgpOiBJdGVyYWJsZUFycmF5TGlrZTxUWydUVmFsdWUnXSB8IG51bGw+IHtcbiAgICAgICAgY29uc3QgY2h1bmtzID0gdGhpcy5jaHVua1ZlY3RvcnM7XG4gICAgICAgIGNvbnN0IG51bUNodW5rcyA9IGNodW5rcy5sZW5ndGg7XG4gICAgICAgIGlmIChudW1DaHVua3MgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBjaHVua3NbMF0udG9BcnJheSgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzb3VyY2VzID0gbmV3IEFycmF5PGFueT4obnVtQ2h1bmtzKTtcbiAgICAgICAgbGV0IHNvdXJjZXNMZW4gPSAwLCBBcnJheVR5cGU6IGFueSA9IEFycmF5O1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xOyArK2luZGV4IDwgbnVtQ2h1bmtzOykge1xuICAgICAgICAgICAgbGV0IHNvdXJjZSA9IGNodW5rc1tpbmRleF0udG9BcnJheSgpO1xuICAgICAgICAgICAgc291cmNlc0xlbiArPSAoc291cmNlc1tpbmRleF0gPSBzb3VyY2UpLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChBcnJheVR5cGUgIT09IHNvdXJjZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIEFycmF5VHlwZSA9IHNvdXJjZS5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgdGFyZ2V0ID0gbmV3IEFycmF5VHlwZShzb3VyY2VzTGVuKTtcbiAgICAgICAgbGV0IHNldFZhbHVlcyA9IEFycmF5VHlwZSA9PT0gQXJyYXkgPyBhcnJheVNldCA6IHR5cGVkQXJyYXlTZXQgYXMgYW55O1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IC0xLCBvZmZzZXQgPSAwOyArK2luZGV4IDwgbnVtQ2h1bmtzOykge1xuICAgICAgICAgICAgb2Zmc2V0ID0gc2V0VmFsdWVzKHNvdXJjZXNbaW5kZXhdLCB0YXJnZXQsIG9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG4gICAgcHVibGljIGluZGV4T2Yoc2VhcmNoOiBUWydUVmFsdWUnXSkge1xuICAgICAgICBsZXQgb2Zmc2V0ID0gMCwgcmVzdWx0O1xuICAgICAgICBmb3IgKGNvbnN0IHZlY3RvciBvZiB0aGlzLmNodW5rVmVjdG9ycykge1xuICAgICAgICAgICAgcmVzdWx0ID0gdmVjdG9yLmluZGV4T2Yoc2VhcmNoKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IC0xKSB7IHJldHVybiByZXN1bHQgKyBvZmZzZXQ7IH1cbiAgICAgICAgICAgIG9mZnNldCArPSB2ZWN0b3IubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVNldChzb3VyY2U6IFR5cGVkQXJyYXksIHRhcmdldDogVHlwZWRBcnJheSwgaW5kZXg6IG51bWJlcikge1xuICAgIHJldHVybiB0YXJnZXQuc2V0KHNvdXJjZSwgaW5kZXgpIHx8IGluZGV4ICsgc291cmNlLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gYXJyYXlTZXQoc291cmNlOiBhbnlbXSwgdGFyZ2V0OiBhbnlbXSwgaW5kZXg6IG51bWJlcikge1xuICAgIGxldCBkc3RJZHggPSBpbmRleCAtIDEsIHNyY0lkeCA9IC0xLCBzcmNMZW4gPSBzb3VyY2UubGVuZ3RoO1xuICAgIHdoaWxlICgrK3NyY0lkeCA8IHNyY0xlbikge1xuICAgICAgICB0YXJnZXRbKytkc3RJZHhdID0gc291cmNlW3NyY0lkeF07XG4gICAgfVxuICAgIHJldHVybiBkc3RJZHg7XG59XG4iXX0=
