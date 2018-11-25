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
import { readJSON } from './json';
import { RecordBatch } from '../../recordbatch';
import { readBuffers, readBuffersAsync } from './binary';
import { readRecordBatches, readRecordBatchesAsync } from './vector';
export { readJSON, RecordBatch };
export { readBuffers, readBuffersAsync };
export { readRecordBatches, readRecordBatchesAsync };
export function read(sources) {
    var input, messages;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                input = sources;
                if (typeof input === 'string') {
                    try {
                        input = JSON.parse(input);
                    }
                    catch (e) {
                        input = sources;
                    }
                }
                if (!input || typeof input !== 'object') {
                    messages = (typeof input === 'string') ? readBuffers([input]) : [];
                }
                else {
                    messages = (typeof input[Symbol.iterator] === 'function') ? readBuffers(input) : readJSON(input);
                }
                return [5 /*yield**/, tslib_1.__values(readRecordBatches(messages))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}
export function readAsync(sources) {
    return tslib_1.__asyncGenerator(this, arguments, function readAsync_1() {
        var _a, _b, recordBatch, e_1_1, e_1, _c;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 7, 8, 13]);
                    _a = tslib_1.__asyncValues(readRecordBatchesAsync(readBuffersAsync(sources)));
                    _d.label = 1;
                case 1: return [4 /*yield*/, tslib_1.__await(_a.next())];
                case 2:
                    if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 6];
                    return [4 /*yield*/, tslib_1.__await(_b.value)];
                case 3:
                    recordBatch = _d.sent();
                    return [4 /*yield*/, recordBatch];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5: return [3 /*break*/, 1];
                case 6: return [3 /*break*/, 13];
                case 7:
                    e_1_1 = _d.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 13];
                case 8:
                    _d.trys.push([8, , 11, 12]);
                    if (!(_b && !_b.done && (_c = _a.return))) return [3 /*break*/, 10];
                    return [4 /*yield*/, tslib_1.__await(_c.call(_a))];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 12: return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    });
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlwYy9yZWFkZXIvYXJyb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkRBQTZEO0FBQzdELCtEQUErRDtBQUMvRCx3REFBd0Q7QUFDeEQsNkRBQTZEO0FBQzdELG9EQUFvRDtBQUNwRCw2REFBNkQ7QUFDN0QsNkRBQTZEO0FBQzdELEVBQUU7QUFDRiwrQ0FBK0M7QUFDL0MsRUFBRTtBQUNGLDZEQUE2RDtBQUM3RCw4REFBOEQ7QUFDOUQseURBQXlEO0FBQ3pELDREQUE0RDtBQUM1RCwwREFBMEQ7QUFDMUQscUJBQXFCOztBQUVyQixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3pELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBa0IsTUFBTSxVQUFVLENBQUM7QUFJckYsT0FBTyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQztBQUNqQyxPQUFPLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLENBQUM7QUFDekMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFFLENBQUM7QUFFckQsTUFBTSxlQUFnQixPQUFpRTs7Ozs7Z0JBQy9FLEtBQUssR0FBUSxPQUFPLENBQUM7Z0JBRXpCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQzt3QkFBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFBQyxDQUFDO29CQUNsQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7b0JBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxRQUFRLEdBQUcsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN2RSxDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLFFBQVEsR0FBRyxDQUFDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JHLENBQUM7Z0JBQ0Qsc0JBQUEsaUJBQU8saUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUEsRUFBQTs7Z0JBQWxDLFNBQWtDLENBQUM7Ozs7Q0FDdEM7QUFFRCxNQUFNLG9CQUEyQixPQUFvRDs7Ozs7OztvQkFDbkQsS0FBQSxzQkFBQSxzQkFBc0IsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBOzs7Ozs7O29CQUFoRSxXQUFXLFlBQUE7b0JBQ3RCLHFCQUFNLFdBQVcsRUFBQTs7b0JBQWpCLFNBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQUV6QiIsImZpbGUiOiJpcGMvcmVhZGVyL2Fycm93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuLy8gb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4vLyBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuLy8gcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuLy8gdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuLy8gXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4vLyB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4vLyBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuLy8gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbi8vIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuLy8gc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuLy8gdW5kZXIgdGhlIExpY2Vuc2UuXG5cbmltcG9ydCB7IHJlYWRKU09OIH0gZnJvbSAnLi9qc29uJztcbmltcG9ydCB7IFJlY29yZEJhdGNoIH0gZnJvbSAnLi4vLi4vcmVjb3JkYmF0Y2gnO1xuaW1wb3J0IHsgcmVhZEJ1ZmZlcnMsIHJlYWRCdWZmZXJzQXN5bmMgfSBmcm9tICcuL2JpbmFyeSc7XG5pbXBvcnQgeyByZWFkUmVjb3JkQmF0Y2hlcywgcmVhZFJlY29yZEJhdGNoZXNBc3luYywgVHlwZURhdGFMb2FkZXIgfSBmcm9tICcuL3ZlY3Rvcic7XG5pbXBvcnQgeyBTY2hlbWEgfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7IE1lc3NhZ2UgfSBmcm9tICcuLi9tZXRhZGF0YSc7XG5cbmV4cG9ydCB7IHJlYWRKU09OLCBSZWNvcmRCYXRjaCB9O1xuZXhwb3J0IHsgcmVhZEJ1ZmZlcnMsIHJlYWRCdWZmZXJzQXN5bmMgfTtcbmV4cG9ydCB7IHJlYWRSZWNvcmRCYXRjaGVzLCByZWFkUmVjb3JkQmF0Y2hlc0FzeW5jIH07XG5cbmV4cG9ydCBmdW5jdGlvbiogcmVhZChzb3VyY2VzOiBJdGVyYWJsZTxVaW50OEFycmF5IHwgQnVmZmVyIHwgc3RyaW5nPiB8IG9iamVjdCB8IHN0cmluZykge1xuICAgIGxldCBpbnB1dDogYW55ID0gc291cmNlcztcbiAgICBsZXQgbWVzc2FnZXM6IEl0ZXJhYmxlPHsgc2NoZW1hOiBTY2hlbWEsIG1lc3NhZ2U6IE1lc3NhZ2UsIGxvYWRlcjogVHlwZURhdGFMb2FkZXIgfT47XG4gICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdHJ5IHsgaW5wdXQgPSBKU09OLnBhcnNlKGlucHV0KTsgfVxuICAgICAgICBjYXRjaCAoZSkgeyBpbnB1dCA9IHNvdXJjZXM7IH1cbiAgICB9XG4gICAgaWYgKCFpbnB1dCB8fCB0eXBlb2YgaW5wdXQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIG1lc3NhZ2VzID0gKHR5cGVvZiBpbnB1dCA9PT0gJ3N0cmluZycpID8gcmVhZEJ1ZmZlcnMoW2lucHV0XSkgOiBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlcyA9ICh0eXBlb2YgaW5wdXRbU3ltYm9sLml0ZXJhdG9yXSA9PT0gJ2Z1bmN0aW9uJykgPyByZWFkQnVmZmVycyhpbnB1dCkgOiByZWFkSlNPTihpbnB1dCk7XG4gICAgfVxuICAgIHlpZWxkKiByZWFkUmVjb3JkQmF0Y2hlcyhtZXNzYWdlcyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogcmVhZEFzeW5jKHNvdXJjZXM6IEFzeW5jSXRlcmFibGU8VWludDhBcnJheSB8IEJ1ZmZlciB8IHN0cmluZz4pIHtcbiAgICBmb3IgYXdhaXQgKGxldCByZWNvcmRCYXRjaCBvZiByZWFkUmVjb3JkQmF0Y2hlc0FzeW5jKHJlYWRCdWZmZXJzQXN5bmMoc291cmNlcykpKSB7XG4gICAgICAgIHlpZWxkIHJlY29yZEJhdGNoO1xuICAgIH1cbn1cbiJdfQ==
