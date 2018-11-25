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
export function align(value, alignment) {
    return value + padding(value, alignment);
}
export function padding(value, alignment) {
    return (value % alignment === 0 ? 0 : alignment - value % alignment);
}
export function getBool(_data, _index, byte, bit) {
    return (byte & 1 << bit) !== 0;
}
export function getBit(_data, _index, byte, bit) {
    return (byte & 1 << bit) >> bit;
}
export function setBool(bytes, index, value) {
    return value ?
        !!(bytes[index >> 3] |= (1 << (index % 8))) || true :
        !(bytes[index >> 3] &= ~(1 << (index % 8))) && false;
}
export function packBools(values) {
    var n = 0, i = 0;
    var xs = [];
    var bit = 0, byte = 0;
    try {
        for (var values_1 = tslib_1.__values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
            var value = values_1_1.value;
            value && (byte |= 1 << bit);
            if (++bit === 8) {
                xs[i++] = byte;
                byte = bit = 0;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (values_1_1 && !values_1_1.done && (_a = values_1.return)) _a.call(values_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (i === 0 || bit > 0) {
        xs[i++] = byte;
    }
    if (i % 8 && (n = i + 8 - i % 8)) {
        do {
            xs[i] = 0;
        } while (++i < n);
    }
    return new Uint8Array(xs);
    var e_1, _a;
}
export function iterateBits(bytes, begin, length, context, get) {
    var bit, byteIndex, index, remaining, byte;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                bit = begin % 8;
                byteIndex = begin >> 3;
                index = 0, remaining = length;
                _a.label = 1;
            case 1:
                if (!(remaining > 0)) return [3 /*break*/, 6];
                byte = bytes[byteIndex++];
                _a.label = 2;
            case 2: return [4 /*yield*/, get(context, index++, byte, bit)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                if (--remaining > 0 && ++bit < 8) return [3 /*break*/, 2];
                _a.label = 5;
            case 5:
                bit = 0;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}
/**
 * Compute the population count (the number of bits set to 1) for a range of bits in a Uint8Array.
 * @param vector The Uint8Array of bits for which to compute the population count.
 * @param lhs The range's left-hand side (or start) bit
 * @param rhs The range's right-hand side (or end) bit
 */
export function popcnt_bit_range(data, lhs, rhs) {
    if (rhs - lhs <= 0) {
        return 0;
    }
    // If the bit range is less than one byte, sum the 1 bits in the bit range
    if (rhs - lhs < 8) {
        var sum = 0;
        try {
            for (var _a = tslib_1.__values(iterateBits(data, lhs, rhs - lhs, data, getBit)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var bit = _b.value;
                sum += bit;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return sum;
    }
    // Get the next lowest multiple of 8 from the right hand side
    var rhsInside = rhs >> 3 << 3;
    // Get the next highest multiple of 8 from the left hand side
    var lhsInside = lhs + (lhs % 8 === 0 ? 0 : 8 - lhs % 8);
    return (
    // Get the popcnt of bits between the left hand side, and the next highest multiple of 8
    popcnt_bit_range(data, lhs, lhsInside) +
        // Get the popcnt of bits between the right hand side, and the next lowest multiple of 8
        popcnt_bit_range(data, rhsInside, rhs) +
        // Get the popcnt of all bits between the left and right hand sides' multiples of 8
        popcnt_array(data, lhsInside >> 3, (rhsInside - lhsInside) >> 3));
    var e_2, _c;
}
export function popcnt_array(arr, byteOffset, byteLength) {
    var cnt = 0, pos = byteOffset | 0;
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var len = byteLength === void 0 ? arr.byteLength : pos + byteLength;
    while (len - pos >= 4) {
        cnt += popcnt_uint32(view.getUint32(pos));
        pos += 4;
    }
    while (len - pos >= 2) {
        cnt += popcnt_uint32(view.getUint16(pos));
        pos += 2;
    }
    while (len - pos >= 1) {
        cnt += popcnt_uint32(view.getUint8(pos));
        pos += 1;
    }
    return cnt;
}
export function popcnt_uint32(uint32) {
    var i = uint32 | 0;
    i = i - ((i >>> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
    return (((i + (i >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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RSxDQUFDO0FBQ2hFLENBQUMiLCJmaWxlIjoidXRpbC9iaXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBMaWNlbnNlZCB0byB0aGUgQXBhY2hlIFNvZnR3YXJlIEZvdW5kYXRpb24gKEFTRikgdW5kZXIgb25lXG4vLyBvciBtb3JlIGNvbnRyaWJ1dG9yIGxpY2Vuc2UgYWdyZWVtZW50cy4gIFNlZSB0aGUgTk9USUNFIGZpbGVcbi8vIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4vLyByZWdhcmRpbmcgY29weXJpZ2h0IG93bmVyc2hpcC4gIFRoZSBBU0YgbGljZW5zZXMgdGhpcyBmaWxlXG4vLyB0byB5b3UgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlXG4vLyBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Vcbi8vIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZyxcbi8vIHNvZnR3YXJlIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuXG4vLyBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWVxuLy8gS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4vLyBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zXG4vLyB1bmRlciB0aGUgTGljZW5zZS5cblxuaW1wb3J0IHsgVHlwZWRBcnJheSB9IGZyb20gJy4uL3R5cGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gYWxpZ24odmFsdWU6IG51bWJlciwgYWxpZ25tZW50OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBwYWRkaW5nKHZhbHVlLCBhbGlnbm1lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkZGluZyh2YWx1ZTogbnVtYmVyLCBhbGlnbm1lbnQ6IG51bWJlcikge1xuICAgIHJldHVybiAodmFsdWUgJSBhbGlnbm1lbnQgPT09IDAgPyAwIDogYWxpZ25tZW50IC0gdmFsdWUgJSBhbGlnbm1lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Qm9vbChfZGF0YTogYW55LCBfaW5kZXg6IG51bWJlciwgYnl0ZTogbnVtYmVyLCBiaXQ6IG51bWJlcikge1xuICAgIHJldHVybiAoYnl0ZSAmIDEgPDwgYml0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpdChfZGF0YTogYW55LCBfaW5kZXg6IG51bWJlciwgYnl0ZTogbnVtYmVyLCBiaXQ6IG51bWJlcik6IDAgfCAxIHtcbiAgICByZXR1cm4gKGJ5dGUgJiAxIDw8IGJpdCkgPj4gYml0IGFzICgwIHwgMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCb29sKGJ5dGVzOiBVaW50OEFycmF5LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gICAgcmV0dXJuIHZhbHVlID9cbiAgICAgICAgISEoYnl0ZXNbaW5kZXggPj4gM10gfD0gICgxIDw8IChpbmRleCAlIDgpKSkgfHwgdHJ1ZSA6XG4gICAgICAgICEoYnl0ZXNbaW5kZXggPj4gM10gJj0gfigxIDw8IChpbmRleCAlIDgpKSkgJiYgZmFsc2UgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFja0Jvb2xzKHZhbHVlczogSXRlcmFibGU8YW55Pikge1xuICAgIGxldCBuID0gMCwgaSA9IDA7XG4gICAgbGV0IHhzOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCBiaXQgPSAwLCBieXRlID0gMDtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykge1xuICAgICAgICB2YWx1ZSAmJiAoYnl0ZSB8PSAxIDw8IGJpdCk7XG4gICAgICAgIGlmICgrK2JpdCA9PT0gOCkge1xuICAgICAgICAgICAgeHNbaSsrXSA9IGJ5dGU7XG4gICAgICAgICAgICBieXRlID0gYml0ID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaSA9PT0gMCB8fCBiaXQgPiAwKSB7IHhzW2krK10gPSBieXRlOyB9XG4gICAgaWYgKGkgJSA4ICYmIChuID0gaSArIDggLSBpICUgOCkpIHtcbiAgICAgICAgZG8geyB4c1tpXSA9IDA7IH0gd2hpbGUgKCsraSA8IG4pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoeHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24qIGl0ZXJhdGVCaXRzPFQ+KGJ5dGVzOiBVaW50OEFycmF5LCBiZWdpbjogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgY29udGV4dDogYW55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXQ6IChjb250ZXh0OiBhbnksIGluZGV4OiBudW1iZXIsIGJ5dGU6IG51bWJlciwgYml0OiBudW1iZXIpID0+IFQpIHtcbiAgICBsZXQgYml0ID0gYmVnaW4gJSA4O1xuICAgIGxldCBieXRlSW5kZXggPSBiZWdpbiA+PiAzO1xuICAgIGxldCBpbmRleCA9IDAsIHJlbWFpbmluZyA9IGxlbmd0aDtcbiAgICBmb3IgKDsgcmVtYWluaW5nID4gMDsgYml0ID0gMCkge1xuICAgICAgICBsZXQgYnl0ZSA9IGJ5dGVzW2J5dGVJbmRleCsrXTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgeWllbGQgZ2V0KGNvbnRleHQsIGluZGV4KyssIGJ5dGUsIGJpdCk7XG4gICAgICAgIH0gd2hpbGUgKC0tcmVtYWluaW5nID4gMCAmJiArK2JpdCA8IDgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDb21wdXRlIHRoZSBwb3B1bGF0aW9uIGNvdW50ICh0aGUgbnVtYmVyIG9mIGJpdHMgc2V0IHRvIDEpIGZvciBhIHJhbmdlIG9mIGJpdHMgaW4gYSBVaW50OEFycmF5LlxuICogQHBhcmFtIHZlY3RvciBUaGUgVWludDhBcnJheSBvZiBiaXRzIGZvciB3aGljaCB0byBjb21wdXRlIHRoZSBwb3B1bGF0aW9uIGNvdW50LlxuICogQHBhcmFtIGxocyBUaGUgcmFuZ2UncyBsZWZ0LWhhbmQgc2lkZSAob3Igc3RhcnQpIGJpdFxuICogQHBhcmFtIHJocyBUaGUgcmFuZ2UncyByaWdodC1oYW5kIHNpZGUgKG9yIGVuZCkgYml0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwb3BjbnRfYml0X3JhbmdlKGRhdGE6IFVpbnQ4QXJyYXksIGxoczogbnVtYmVyLCByaHM6IG51bWJlcik6IG51bWJlciB7XG4gICAgaWYgKHJocyAtIGxocyA8PSAwKSB7IHJldHVybiAwOyB9XG4gICAgLy8gSWYgdGhlIGJpdCByYW5nZSBpcyBsZXNzIHRoYW4gb25lIGJ5dGUsIHN1bSB0aGUgMSBiaXRzIGluIHRoZSBiaXQgcmFuZ2VcbiAgICBpZiAocmhzIC0gbGhzIDwgOCkge1xuICAgICAgICBsZXQgc3VtID0gMDtcbiAgICAgICAgZm9yIChjb25zdCBiaXQgb2YgaXRlcmF0ZUJpdHMoZGF0YSwgbGhzLCByaHMgLSBsaHMsIGRhdGEsIGdldEJpdCkpIHtcbiAgICAgICAgICAgIHN1bSArPSBiaXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1bTtcbiAgICB9XG4gICAgLy8gR2V0IHRoZSBuZXh0IGxvd2VzdCBtdWx0aXBsZSBvZiA4IGZyb20gdGhlIHJpZ2h0IGhhbmQgc2lkZVxuICAgIGNvbnN0IHJoc0luc2lkZSA9IHJocyA+PiAzIDw8IDM7XG4gICAgLy8gR2V0IHRoZSBuZXh0IGhpZ2hlc3QgbXVsdGlwbGUgb2YgOCBmcm9tIHRoZSBsZWZ0IGhhbmQgc2lkZVxuICAgIGNvbnN0IGxoc0luc2lkZSA9IGxocyArIChsaHMgJSA4ID09PSAwID8gMCA6IDggLSBsaHMgJSA4KTtcbiAgICByZXR1cm4gKFxuICAgICAgICAvLyBHZXQgdGhlIHBvcGNudCBvZiBiaXRzIGJldHdlZW4gdGhlIGxlZnQgaGFuZCBzaWRlLCBhbmQgdGhlIG5leHQgaGlnaGVzdCBtdWx0aXBsZSBvZiA4XG4gICAgICAgIHBvcGNudF9iaXRfcmFuZ2UoZGF0YSwgbGhzLCBsaHNJbnNpZGUpICtcbiAgICAgICAgLy8gR2V0IHRoZSBwb3BjbnQgb2YgYml0cyBiZXR3ZWVuIHRoZSByaWdodCBoYW5kIHNpZGUsIGFuZCB0aGUgbmV4dCBsb3dlc3QgbXVsdGlwbGUgb2YgOFxuICAgICAgICBwb3BjbnRfYml0X3JhbmdlKGRhdGEsIHJoc0luc2lkZSwgcmhzKSArXG4gICAgICAgIC8vIEdldCB0aGUgcG9wY250IG9mIGFsbCBiaXRzIGJldHdlZW4gdGhlIGxlZnQgYW5kIHJpZ2h0IGhhbmQgc2lkZXMnIG11bHRpcGxlcyBvZiA4XG4gICAgICAgIHBvcGNudF9hcnJheShkYXRhLCBsaHNJbnNpZGUgPj4gMywgKHJoc0luc2lkZSAtIGxoc0luc2lkZSkgPj4gMylcbiAgICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9wY250X2FycmF5KGFycjogVHlwZWRBcnJheSwgYnl0ZU9mZnNldD86IG51bWJlciwgYnl0ZUxlbmd0aD86IG51bWJlcikge1xuICAgIGxldCBjbnQgPSAwLCBwb3MgPSBieXRlT2Zmc2V0ISB8IDA7XG4gICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhhcnIuYnVmZmVyLCBhcnIuYnl0ZU9mZnNldCwgYXJyLmJ5dGVMZW5ndGgpO1xuICAgIGNvbnN0IGxlbiA9ICBieXRlTGVuZ3RoID09PSB2b2lkIDAgPyBhcnIuYnl0ZUxlbmd0aCA6IHBvcyArIGJ5dGVMZW5ndGg7XG4gICAgd2hpbGUgKGxlbiAtIHBvcyA+PSA0KSB7XG4gICAgICAgIGNudCArPSBwb3BjbnRfdWludDMyKHZpZXcuZ2V0VWludDMyKHBvcykpO1xuICAgICAgICBwb3MgKz0gNDtcbiAgICB9XG4gICAgd2hpbGUgKGxlbiAtIHBvcyA+PSAyKSB7XG4gICAgICAgIGNudCArPSBwb3BjbnRfdWludDMyKHZpZXcuZ2V0VWludDE2KHBvcykpO1xuICAgICAgICBwb3MgKz0gMjtcbiAgICB9XG4gICAgd2hpbGUgKGxlbiAtIHBvcyA+PSAxKSB7XG4gICAgICAgIGNudCArPSBwb3BjbnRfdWludDMyKHZpZXcuZ2V0VWludDgocG9zKSk7XG4gICAgICAgIHBvcyArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gY250O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9wY250X3VpbnQzMih1aW50MzI6IG51bWJlcik6IG51bWJlciB7XG4gICAgbGV0IGkgPSB1aW50MzIgfCAwO1xuICAgIGkgPSBpIC0gKChpID4+PiAxKSAmIDB4NTU1NTU1NTUpO1xuICAgIGkgPSAoaSAmIDB4MzMzMzMzMzMpICsgKChpID4+PiAyKSAmIDB4MzMzMzMzMzMpO1xuICAgIHJldHVybiAoKChpICsgKGkgPj4+IDQpKSAmIDB4MEYwRjBGMEYpICogMHgwMTAxMDEwMSkgPj4+IDI0O1xufVxuIl19
