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
var DictionaryView = /** @class */ (function () {
    function DictionaryView(dictionary, indices) {
        this.indices = indices;
        this.dictionary = dictionary;
    }
    DictionaryView.prototype.clone = function (data) {
        return new DictionaryView(data.dictionary, this.indices.clone(data.indices));
    };
    DictionaryView.prototype.isValid = function (index) {
        return this.indices.isValid(index);
    };
    DictionaryView.prototype.get = function (index) {
        return this.dictionary.get(this.indices.get(index));
    };
    DictionaryView.prototype.set = function (index, value) {
        this.dictionary.set(this.indices.get(index), value);
    };
    DictionaryView.prototype.toArray = function () {
        return tslib_1.__spread(this);
    };
    DictionaryView.prototype[Symbol.iterator] = function () {
        var values, indices, index, n;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    values = this.dictionary, indices = this.indices;
                    index = -1, n = indices.length;
                    _a.label = 1;
                case 1:
                    if (!(++index < n)) return [3 /*break*/, 4];
                    return [4 /*yield*/, values.get(indices.get(index))];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    };
    DictionaryView.prototype.indexOf = function (search) {
        // First find the dictionary key for the desired value...
        var key = this.dictionary.indexOf(search);
        if (key === -1) {
            return key;
        }
        // ... then find the first occurence of that key in indices
        return this.indices.indexOf(key);
    };
    return DictionaryView;
}());
export { DictionaryView };

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZlY3Rvci9kaWN0aW9uYXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZEQUE2RDtBQUM3RCwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELDZEQUE2RDtBQUM3RCxvREFBb0Q7QUFDcEQsNkRBQTZEO0FBQzdELDZEQUE2RDtBQUM3RCxFQUFFO0FBQ0YsK0NBQStDO0FBQy9DLEVBQUU7QUFDRiw2REFBNkQ7QUFDN0QsOERBQThEO0FBQzlELHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsMERBQTBEO0FBQzFELHFCQUFxQjs7QUFNckI7SUFHSSx3QkFBWSxVQUFxQixFQUFFLE9BQW9CO1FBQ25ELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0lBQ2pDLENBQUM7SUFDTSw4QkFBSyxHQUFaLFVBQWEsSUFBeUI7UUFDbEMsTUFBTSxDQUFDLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFTLENBQUM7SUFDekYsQ0FBQztJQUNNLGdDQUFPLEdBQWQsVUFBZSxLQUFhO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ00sNEJBQUcsR0FBVixVQUFXLEtBQWE7UUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNNLDRCQUFHLEdBQVYsVUFBVyxLQUFhLEVBQUUsS0FBa0I7UUFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNNLGdDQUFPLEdBQWQ7UUFDSSxNQUFNLGtCQUFLLElBQUksRUFBRTtJQUNyQixDQUFDO0lBQ08seUJBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUF6Qjs7Ozs7b0JBQ1UsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7b0JBQzlDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU07Ozt5QkFBRSxDQUFBLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQTtvQkFDaEQscUJBQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUE7O29CQUFwQyxTQUFvQyxDQUFDOzs7Ozs7S0FFNUM7SUFDTSxnQ0FBTyxHQUFkLFVBQWUsTUFBbUI7UUFDOUIseURBQXlEO1FBQ3pELElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDO1FBQUMsQ0FBQztRQUUvQiwyREFBMkQ7UUFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDTCxxQkFBQztBQUFELENBcENBLEFBb0NDLElBQUEiLCJmaWxlIjoidmVjdG9yL2RpY3Rpb25hcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4vLyBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbi8vIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4vLyByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4vLyB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4vLyBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Vcbi8vIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbi8vIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4vLyBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuLy8gS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4vLyBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4vLyB1bmRlciB0aGUgTGljZW5zZS5cblxuaW1wb3J0IHsgRGF0YSB9IGZyb20gJy4uL2RhdGEnO1xuaW1wb3J0IHsgVmlldywgVmVjdG9yIH0gZnJvbSAnLi4vdmVjdG9yJztcbmltcG9ydCB7IEl0ZXJhYmxlQXJyYXlMaWtlLCBEYXRhVHlwZSwgRGljdGlvbmFyeSwgSW50IH0gZnJvbSAnLi4vdHlwZSc7XG5cbmV4cG9ydCBjbGFzcyBEaWN0aW9uYXJ5VmlldzxUIGV4dGVuZHMgRGF0YVR5cGU+IGltcGxlbWVudHMgVmlldzxUPiB7XG4gICAgcHVibGljIGluZGljZXM6IFZlY3RvcjxJbnQ+O1xuICAgIHB1YmxpYyBkaWN0aW9uYXJ5OiBWZWN0b3I8VD47XG4gICAgY29uc3RydWN0b3IoZGljdGlvbmFyeTogVmVjdG9yPFQ+LCBpbmRpY2VzOiBWZWN0b3I8SW50Pikge1xuICAgICAgICB0aGlzLmluZGljZXMgPSBpbmRpY2VzO1xuICAgICAgICB0aGlzLmRpY3Rpb25hcnkgPSBkaWN0aW9uYXJ5O1xuICAgIH1cbiAgICBwdWJsaWMgY2xvbmUoZGF0YTogRGF0YTxEaWN0aW9uYXJ5PFQ+Pik6IHRoaXMge1xuICAgICAgICByZXR1cm4gbmV3IERpY3Rpb25hcnlWaWV3KGRhdGEuZGljdGlvbmFyeSwgdGhpcy5pbmRpY2VzLmNsb25lKGRhdGEuaW5kaWNlcykpIGFzIHRoaXM7XG4gICAgfVxuICAgIHB1YmxpYyBpc1ZhbGlkKGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5kaWNlcy5pc1ZhbGlkKGluZGV4KTtcbiAgICB9XG4gICAgcHVibGljIGdldChpbmRleDogbnVtYmVyKTogVFsnVFZhbHVlJ10ge1xuICAgICAgICByZXR1cm4gdGhpcy5kaWN0aW9uYXJ5LmdldCh0aGlzLmluZGljZXMuZ2V0KGluZGV4KSk7XG4gICAgfVxuICAgIHB1YmxpYyBzZXQoaW5kZXg6IG51bWJlciwgdmFsdWU6IFRbJ1RWYWx1ZSddKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGljdGlvbmFyeS5zZXQodGhpcy5pbmRpY2VzLmdldChpbmRleCksIHZhbHVlKTtcbiAgICB9XG4gICAgcHVibGljIHRvQXJyYXkoKTogSXRlcmFibGVBcnJheUxpa2U8VFsnVFZhbHVlJ10+IHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzXTtcbiAgICB9XG4gICAgcHVibGljICpbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFRbJ1RWYWx1ZSddPiB7XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuZGljdGlvbmFyeSwgaW5kaWNlcyA9IHRoaXMuaW5kaWNlcztcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAtMSwgbiA9IGluZGljZXMubGVuZ3RoOyArK2luZGV4IDwgbjspIHtcbiAgICAgICAgICAgIHlpZWxkIHZhbHVlcy5nZXQoaW5kaWNlcy5nZXQoaW5kZXgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdWJsaWMgaW5kZXhPZihzZWFyY2g6IFRbJ1RWYWx1ZSddKSB7XG4gICAgICAgIC8vIEZpcnN0IGZpbmQgdGhlIGRpY3Rpb25hcnkga2V5IGZvciB0aGUgZGVzaXJlZCB2YWx1ZS4uLlxuICAgICAgICBjb25zdCBrZXkgPSB0aGlzLmRpY3Rpb25hcnkuaW5kZXhPZihzZWFyY2gpO1xuICAgICAgICBpZiAoa2V5ID09PSAtMSkgeyByZXR1cm4ga2V5OyB9XG5cbiAgICAgICAgLy8gLi4uIHRoZW4gZmluZCB0aGUgZmlyc3Qgb2NjdXJlbmNlIG9mIHRoYXQga2V5IGluIGluZGljZXNcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5kaWNlcy5pbmRleE9mKGtleSEpO1xuICAgIH1cbn1cbiJdfQ==
