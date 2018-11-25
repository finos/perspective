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
import { DictionaryVector } from './vector';
var Value = /** @class */ (function () {
    function Value() {
    }
    Value.prototype.eq = function (other) {
        if (!(other instanceof Value)) {
            other = new Literal(other);
        }
        return new Equals(this, other);
    };
    Value.prototype.le = function (other) {
        if (!(other instanceof Value)) {
            other = new Literal(other);
        }
        return new LTeq(this, other);
    };
    Value.prototype.ge = function (other) {
        if (!(other instanceof Value)) {
            other = new Literal(other);
        }
        return new GTeq(this, other);
    };
    Value.prototype.lt = function (other) {
        return new Not(this.ge(other));
    };
    Value.prototype.gt = function (other) {
        return new Not(this.le(other));
    };
    Value.prototype.ne = function (other) {
        return new Not(this.eq(other));
    };
    return Value;
}());
export { Value };
var Literal = /** @class */ (function (_super) {
    tslib_1.__extends(Literal, _super);
    function Literal(v) {
        var _this = _super.call(this) || this;
        _this.v = v;
        return _this;
    }
    return Literal;
}(Value));
export { Literal };
var Col = /** @class */ (function (_super) {
    tslib_1.__extends(Col, _super);
    function Col(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        return _this;
    }
    Col.prototype.bind = function (batch) {
        if (!this.colidx) {
            // Assume column index doesn't change between calls to bind
            //this.colidx = cols.findIndex(v => v.name.indexOf(this.name) != -1);
            this.colidx = -1;
            var fields = batch.schema.fields;
            for (var idx = -1; ++idx < fields.length;) {
                if (fields[idx].name === this.name) {
                    this.colidx = idx;
                    break;
                }
            }
            if (this.colidx < 0) {
                throw new Error("Failed to bind Col \"" + this.name + "\"");
            }
        }
        this.vector = batch.getChildAt(this.colidx);
        return this.vector.get.bind(this.vector);
    };
    return Col;
}(Value));
export { Col };
var Predicate = /** @class */ (function () {
    function Predicate() {
    }
    Predicate.prototype.and = function (expr) { return new And(this, expr); };
    Predicate.prototype.or = function (expr) { return new Or(this, expr); };
    Predicate.prototype.not = function () { return new Not(this); };
    Predicate.prototype.ands = function () { return [this]; };
    return Predicate;
}());
export { Predicate };
var ComparisonPredicate = /** @class */ (function (_super) {
    tslib_1.__extends(ComparisonPredicate, _super);
    function ComparisonPredicate(left, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    ComparisonPredicate.prototype.bind = function (batch) {
        if (this.left instanceof Literal) {
            if (this.right instanceof Literal) {
                return this._bindLitLit(batch, this.left, this.right);
            }
            else {
                return this._bindLitCol(batch, this.left, this.right);
            }
        }
        else {
            if (this.right instanceof Literal) {
                return this._bindColLit(batch, this.left, this.right);
            }
            else {
                return this._bindColCol(batch, this.left, this.right);
            }
        }
    };
    return ComparisonPredicate;
}(Predicate));
export { ComparisonPredicate };
var CombinationPredicate = /** @class */ (function (_super) {
    tslib_1.__extends(CombinationPredicate, _super);
    function CombinationPredicate(left, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    return CombinationPredicate;
}(Predicate));
export { CombinationPredicate };
var And = /** @class */ (function (_super) {
    tslib_1.__extends(And, _super);
    function And() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    And.prototype.bind = function (batch) {
        var left = this.left.bind(batch);
        var right = this.right.bind(batch);
        return function (idx, batch) { return left(idx, batch) && right(idx, batch); };
    };
    And.prototype.ands = function () { return this.left.ands().concat(this.right.ands()); };
    return And;
}(CombinationPredicate));
export { And };
var Or = /** @class */ (function (_super) {
    tslib_1.__extends(Or, _super);
    function Or() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Or.prototype.bind = function (batch) {
        var left = this.left.bind(batch);
        var right = this.right.bind(batch);
        return function (idx, batch) { return left(idx, batch) || right(idx, batch); };
    };
    return Or;
}(CombinationPredicate));
export { Or };
var Equals = /** @class */ (function (_super) {
    tslib_1.__extends(Equals, _super);
    function Equals() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Equals.prototype._bindLitLit = function (_batch, left, right) {
        var rtrn = left.v == right.v;
        return function () { return rtrn; };
    };
    Equals.prototype._bindColCol = function (batch, left, right) {
        var left_func = left.bind(batch);
        var right_func = right.bind(batch);
        return function (idx, batch) { return left_func(idx, batch) == right_func(idx, batch); };
    };
    Equals.prototype._bindColLit = function (batch, col, lit) {
        var col_func = col.bind(batch);
        if (col.vector instanceof DictionaryVector) {
            var key_1;
            var vector_1 = col.vector;
            if (vector_1.dictionary !== this.lastDictionary) {
                key_1 = vector_1.reverseLookup(lit.v);
                this.lastDictionary = vector_1.dictionary;
                this.lastKey = key_1;
            }
            else {
                key_1 = this.lastKey;
            }
            if (key_1 === -1) {
                // the value doesn't exist in the dictionary - always return
                // false
                // TODO: special-case of PredicateFunc that encapsulates this
                // "always false" behavior. That way filtering operations don't
                // have to bother checking
                return function () { return false; };
            }
            else {
                return function (idx) {
                    return vector_1.getKey(idx) === key_1;
                };
            }
        }
        else {
            return function (idx, cols) { return col_func(idx, cols) == lit.v; };
        }
    };
    Equals.prototype._bindLitCol = function (batch, lit, col) {
        // Equals is comutative
        return this._bindColLit(batch, col, lit);
    };
    return Equals;
}(ComparisonPredicate));
export { Equals };
var LTeq = /** @class */ (function (_super) {
    tslib_1.__extends(LTeq, _super);
    function LTeq() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LTeq.prototype._bindLitLit = function (_batch, left, right) {
        var rtrn = left.v <= right.v;
        return function () { return rtrn; };
    };
    LTeq.prototype._bindColCol = function (batch, left, right) {
        var left_func = left.bind(batch);
        var right_func = right.bind(batch);
        return function (idx, cols) { return left_func(idx, cols) <= right_func(idx, cols); };
    };
    LTeq.prototype._bindColLit = function (batch, col, lit) {
        var col_func = col.bind(batch);
        return function (idx, cols) { return col_func(idx, cols) <= lit.v; };
    };
    LTeq.prototype._bindLitCol = function (batch, lit, col) {
        var col_func = col.bind(batch);
        return function (idx, cols) { return lit.v <= col_func(idx, cols); };
    };
    return LTeq;
}(ComparisonPredicate));
export { LTeq };
var GTeq = /** @class */ (function (_super) {
    tslib_1.__extends(GTeq, _super);
    function GTeq() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GTeq.prototype._bindLitLit = function (_batch, left, right) {
        var rtrn = left.v >= right.v;
        return function () { return rtrn; };
    };
    GTeq.prototype._bindColCol = function (batch, left, right) {
        var left_func = left.bind(batch);
        var right_func = right.bind(batch);
        return function (idx, cols) { return left_func(idx, cols) >= right_func(idx, cols); };
    };
    GTeq.prototype._bindColLit = function (batch, col, lit) {
        var col_func = col.bind(batch);
        return function (idx, cols) { return col_func(idx, cols) >= lit.v; };
    };
    GTeq.prototype._bindLitCol = function (batch, lit, col) {
        var col_func = col.bind(batch);
        return function (idx, cols) { return lit.v >= col_func(idx, cols); };
    };
    return GTeq;
}(ComparisonPredicate));
export { GTeq };
var Not = /** @class */ (function (_super) {
    tslib_1.__extends(Not, _super);
    function Not(child) {
        var _this = _super.call(this) || this;
        _this.child = child;
        return _this;
    }
    Not.prototype.bind = function (batch) {
        var func = this.child.bind(batch);
        return function (idx, batch) { return !func(idx, batch); };
    };
    return Not;
}(Predicate));
export { Not };
var CustomPredicate = /** @class */ (function (_super) {
    tslib_1.__extends(CustomPredicate, _super);
    function CustomPredicate(next, bind_) {
        var _this = _super.call(this) || this;
        _this.next = next;
        _this.bind_ = bind_;
        return _this;
    }
    CustomPredicate.prototype.bind = function (batch) {
        this.bind_(batch);
        return this.next;
    };
    return CustomPredicate;
}(Predicate));
export { CustomPredicate };
export function lit(v) { return new Literal(v); }
export function col(n) { return new Col(n); }
export function custom(next, bind) {
    return new CustomPredicate(next, bind);
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,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LENBQUM7SUFDckIsQ0FBQztJQUNMLHNCQUFDO0FBQUQsQ0FUQSxBQVNDLENBVG9DLFNBQVMsR0FTN0M7O0FBRUQsTUFBTSxjQUFjLENBQU0sSUFBZ0IsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRSxNQUFNLGNBQWMsQ0FBUyxJQUFjLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0QsTUFBTSxpQkFBaUIsSUFBbUIsRUFBRSxJQUFrQztJQUMxRSxNQUFNLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzNDLENBQUMiLCJmaWxlIjoicHJlZGljYXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTGljZW5zZWQgdG8gdGhlIEFwYWNoZSBTb2Z0d2FyZSBGb3VuZGF0aW9uIChBU0YpIHVuZGVyIG9uZVxuLy8gb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuICBTZWUgdGhlIE5PVElDRSBmaWxlXG4vLyBkaXN0cmlidXRlZCB3aXRoIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvblxuLy8gcmVnYXJkaW5nIGNvcHlyaWdodCBvd25lcnNoaXAuICBUaGUgQVNGIGxpY2Vuc2VzIHRoaXMgZmlsZVxuLy8gdG8geW91IHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZVxuLy8gXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlXG4vLyB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsXG4vLyBzb2Z0d2FyZSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhblxuLy8gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTllcbi8vIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZVxuLy8gc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9uc1xuLy8gdW5kZXIgdGhlIExpY2Vuc2UuXG5cbmltcG9ydCB7IFJlY29yZEJhdGNoIH0gZnJvbSAnLi9yZWNvcmRiYXRjaCc7XG5pbXBvcnQgeyBWZWN0b3IsIERpY3Rpb25hcnlWZWN0b3IgfSBmcm9tICcuL3ZlY3Rvcic7XG5cbmV4cG9ydCB0eXBlIFZhbHVlRnVuYzxUPiA9IChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IFQgfCBudWxsO1xuZXhwb3J0IHR5cGUgUHJlZGljYXRlRnVuYyA9IChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IGJvb2xlYW47XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWYWx1ZTxUPiB7XG4gICAgZXEob3RoZXI6IFZhbHVlPFQ+IHwgVCk6IFByZWRpY2F0ZSB7XG4gICAgICAgIGlmICghKG90aGVyIGluc3RhbmNlb2YgVmFsdWUpKSB7IG90aGVyID0gbmV3IExpdGVyYWwob3RoZXIpOyB9XG4gICAgICAgIHJldHVybiBuZXcgRXF1YWxzKHRoaXMsIG90aGVyKTtcbiAgICB9XG4gICAgbGUob3RoZXI6IFZhbHVlPFQ+IHwgVCk6IFByZWRpY2F0ZSB7XG4gICAgICAgIGlmICghKG90aGVyIGluc3RhbmNlb2YgVmFsdWUpKSB7IG90aGVyID0gbmV3IExpdGVyYWwob3RoZXIpOyB9XG4gICAgICAgIHJldHVybiBuZXcgTFRlcSh0aGlzLCBvdGhlcik7XG4gICAgfVxuICAgIGdlKG90aGVyOiBWYWx1ZTxUPiB8IFQpOiBQcmVkaWNhdGUge1xuICAgICAgICBpZiAoIShvdGhlciBpbnN0YW5jZW9mIFZhbHVlKSkgeyBvdGhlciA9IG5ldyBMaXRlcmFsKG90aGVyKTsgfVxuICAgICAgICByZXR1cm4gbmV3IEdUZXEodGhpcywgb3RoZXIpO1xuICAgIH1cbiAgICBsdChvdGhlcjogVmFsdWU8VD4gfCBUKTogUHJlZGljYXRlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3QodGhpcy5nZShvdGhlcikpO1xuICAgIH1cbiAgICBndChvdGhlcjogVmFsdWU8VD4gfCBUKTogUHJlZGljYXRlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3QodGhpcy5sZShvdGhlcikpO1xuICAgIH1cbiAgICBuZShvdGhlcjogVmFsdWU8VD4gfCBUKTogUHJlZGljYXRlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOb3QodGhpcy5lcShvdGhlcikpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIExpdGVyYWw8VD0gYW55PiBleHRlbmRzIFZhbHVlPFQ+IHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdjogVCkgeyBzdXBlcigpOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2w8VD0gYW55PiBleHRlbmRzIFZhbHVlPFQ+IHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHVibGljIHZlY3RvcjogVmVjdG9yO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBwdWJsaWMgY29saWR4OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nKSB7IHN1cGVyKCk7IH1cbiAgICBiaW5kKGJhdGNoOiBSZWNvcmRCYXRjaCkge1xuICAgICAgICBpZiAoIXRoaXMuY29saWR4KSB7XG4gICAgICAgICAgICAvLyBBc3N1bWUgY29sdW1uIGluZGV4IGRvZXNuJ3QgY2hhbmdlIGJldHdlZW4gY2FsbHMgdG8gYmluZFxuICAgICAgICAgICAgLy90aGlzLmNvbGlkeCA9IGNvbHMuZmluZEluZGV4KHYgPT4gdi5uYW1lLmluZGV4T2YodGhpcy5uYW1lKSAhPSAtMSk7XG4gICAgICAgICAgICB0aGlzLmNvbGlkeCA9IC0xO1xuICAgICAgICAgICAgY29uc3QgZmllbGRzID0gYmF0Y2guc2NoZW1hLmZpZWxkcztcbiAgICAgICAgICAgIGZvciAobGV0IGlkeCA9IC0xOyArK2lkeCA8IGZpZWxkcy5sZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkc1tpZHhdLm5hbWUgPT09IHRoaXMubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbGlkeCA9IGlkeDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuY29saWR4IDwgMCkgeyB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBiaW5kIENvbCBcIiR7dGhpcy5uYW1lfVwiYCk7IH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZlY3RvciA9IGJhdGNoLmdldENoaWxkQXQodGhpcy5jb2xpZHgpITtcbiAgICAgICAgcmV0dXJuIHRoaXMudmVjdG9yLmdldC5iaW5kKHRoaXMudmVjdG9yKTtcbiAgICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQcmVkaWNhdGUge1xuICAgIGFic3RyYWN0IGJpbmQoYmF0Y2g6IFJlY29yZEJhdGNoKTogUHJlZGljYXRlRnVuYztcbiAgICBhbmQoZXhwcjogUHJlZGljYXRlKTogUHJlZGljYXRlIHsgcmV0dXJuIG5ldyBBbmQodGhpcywgZXhwcik7IH1cbiAgICBvcihleHByOiBQcmVkaWNhdGUpOiBQcmVkaWNhdGUgeyByZXR1cm4gbmV3IE9yKHRoaXMsIGV4cHIpOyB9XG4gICAgbm90KCk6IFByZWRpY2F0ZSB7IHJldHVybiBuZXcgTm90KHRoaXMpOyB9XG4gICAgYW5kcygpOiBQcmVkaWNhdGVbXSB7IHJldHVybiBbdGhpc107IH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBhcmlzb25QcmVkaWNhdGU8VD0gYW55PiBleHRlbmRzIFByZWRpY2F0ZSB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGxlZnQ6IFZhbHVlPFQ+LCBwdWJsaWMgcmVhZG9ubHkgcmlnaHQ6IFZhbHVlPFQ+KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgYmluZChiYXRjaDogUmVjb3JkQmF0Y2gpIHtcbiAgICAgICAgaWYgKHRoaXMubGVmdCBpbnN0YW5jZW9mIExpdGVyYWwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJpZ2h0IGluc3RhbmNlb2YgTGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9iaW5kTGl0TGl0KGJhdGNoLCB0aGlzLmxlZnQsIHRoaXMucmlnaHQpO1xuICAgICAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgaXMgYSBDb2xcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9iaW5kTGl0Q29sKGJhdGNoLCB0aGlzLmxlZnQsIHRoaXMucmlnaHQgYXMgQ29sKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBpcyBhIENvbFxuICAgICAgICAgICAgaWYgKHRoaXMucmlnaHQgaW5zdGFuY2VvZiBMaXRlcmFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2JpbmRDb2xMaXQoYmF0Y2gsIHRoaXMubGVmdCBhcyBDb2wsIHRoaXMucmlnaHQpO1xuICAgICAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgaXMgYSBDb2xcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fYmluZENvbENvbChiYXRjaCwgdGhpcy5sZWZ0IGFzIENvbCwgdGhpcy5yaWdodCBhcyBDb2wpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IF9iaW5kTGl0TGl0KGJhdGNoOiBSZWNvcmRCYXRjaCwgbGVmdDogTGl0ZXJhbCwgcmlnaHQ6IExpdGVyYWwpOiBQcmVkaWNhdGVGdW5jO1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBfYmluZENvbENvbChiYXRjaDogUmVjb3JkQmF0Y2gsIGxlZnQ6IENvbCwgcmlnaHQ6IENvbCk6IFByZWRpY2F0ZUZ1bmM7XG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IF9iaW5kQ29sTGl0KGJhdGNoOiBSZWNvcmRCYXRjaCwgY29sOiBDb2wsIGxpdDogTGl0ZXJhbCk6IFByZWRpY2F0ZUZ1bmM7XG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IF9iaW5kTGl0Q29sKGJhdGNoOiBSZWNvcmRCYXRjaCwgbGl0OiBMaXRlcmFsLCBjb2w6IENvbCk6IFByZWRpY2F0ZUZ1bmM7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21iaW5hdGlvblByZWRpY2F0ZSBleHRlbmRzIFByZWRpY2F0ZSB7XG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGxlZnQ6IFByZWRpY2F0ZSwgcHVibGljIHJlYWRvbmx5IHJpZ2h0OiBQcmVkaWNhdGUpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBbmQgZXh0ZW5kcyBDb21iaW5hdGlvblByZWRpY2F0ZSB7XG4gICAgYmluZChiYXRjaDogUmVjb3JkQmF0Y2gpIHtcbiAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMubGVmdC5iaW5kKGJhdGNoKTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSB0aGlzLnJpZ2h0LmJpbmQoYmF0Y2gpO1xuICAgICAgICByZXR1cm4gKGlkeDogbnVtYmVyLCBiYXRjaDogUmVjb3JkQmF0Y2gpID0+IGxlZnQoaWR4LCBiYXRjaCkgJiYgcmlnaHQoaWR4LCBiYXRjaCk7XG4gICAgfVxuICAgIGFuZHMoKTogUHJlZGljYXRlW10geyByZXR1cm4gdGhpcy5sZWZ0LmFuZHMoKS5jb25jYXQodGhpcy5yaWdodC5hbmRzKCkpOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBPciBleHRlbmRzIENvbWJpbmF0aW9uUHJlZGljYXRlIHtcbiAgICBiaW5kKGJhdGNoOiBSZWNvcmRCYXRjaCkge1xuICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5sZWZ0LmJpbmQoYmF0Y2gpO1xuICAgICAgICBjb25zdCByaWdodCA9IHRoaXMucmlnaHQuYmluZChiYXRjaCk7XG4gICAgICAgIHJldHVybiAoaWR4OiBudW1iZXIsIGJhdGNoOiBSZWNvcmRCYXRjaCkgPT4gbGVmdChpZHgsIGJhdGNoKSB8fCByaWdodChpZHgsIGJhdGNoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHMgZXh0ZW5kcyBDb21wYXJpc29uUHJlZGljYXRlIHtcbiAgICAvLyBIZWxwZXJzIHVzZWQgdG8gY2FjaGUgZGljdGlvbmFyeSByZXZlcnNlIGxvb2t1cHMgYmV0d2VlbiBjYWxscyB0byBiaW5kXG4gICAgcHJpdmF0ZSBsYXN0RGljdGlvbmFyeTogVmVjdG9yfHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIGxhc3RLZXk6IG51bWJlcnx1bmRlZmluZWQ7XG5cbiAgICBwcm90ZWN0ZWQgX2JpbmRMaXRMaXQoX2JhdGNoOiBSZWNvcmRCYXRjaCwgbGVmdDogTGl0ZXJhbCwgcmlnaHQ6IExpdGVyYWwpOiBQcmVkaWNhdGVGdW5jIHtcbiAgICAgICAgY29uc3QgcnRybjogYm9vbGVhbiA9IGxlZnQudiA9PSByaWdodC52O1xuICAgICAgICByZXR1cm4gKCkgPT4gcnRybjtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2JpbmRDb2xDb2woYmF0Y2g6IFJlY29yZEJhdGNoLCBsZWZ0OiBDb2wsIHJpZ2h0OiBDb2wpOiBQcmVkaWNhdGVGdW5jIHtcbiAgICAgICAgY29uc3QgbGVmdF9mdW5jID0gbGVmdC5iaW5kKGJhdGNoKTtcbiAgICAgICAgY29uc3QgcmlnaHRfZnVuYyA9IHJpZ2h0LmJpbmQoYmF0Y2gpO1xuICAgICAgICByZXR1cm4gKGlkeDogbnVtYmVyLCBiYXRjaDogUmVjb3JkQmF0Y2gpID0+IGxlZnRfZnVuYyhpZHgsIGJhdGNoKSA9PSByaWdodF9mdW5jKGlkeCwgYmF0Y2gpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBfYmluZENvbExpdChiYXRjaDogUmVjb3JkQmF0Y2gsIGNvbDogQ29sLCBsaXQ6IExpdGVyYWwpOiBQcmVkaWNhdGVGdW5jIHtcbiAgICAgICAgY29uc3QgY29sX2Z1bmMgPSBjb2wuYmluZChiYXRjaCk7XG4gICAgICAgIGlmIChjb2wudmVjdG9yIGluc3RhbmNlb2YgRGljdGlvbmFyeVZlY3Rvcikge1xuICAgICAgICAgICAgbGV0IGtleTogYW55O1xuICAgICAgICAgICAgY29uc3QgdmVjdG9yID0gY29sLnZlY3RvciBhcyBEaWN0aW9uYXJ5VmVjdG9yO1xuICAgICAgICAgICAgaWYgKHZlY3Rvci5kaWN0aW9uYXJ5ICE9PSB0aGlzLmxhc3REaWN0aW9uYXJ5KSB7XG4gICAgICAgICAgICAgICAga2V5ID0gdmVjdG9yLnJldmVyc2VMb29rdXAobGl0LnYpO1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdERpY3Rpb25hcnkgPSB2ZWN0b3IuZGljdGlvbmFyeTtcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RLZXkgPSBrZXk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtleSA9IHRoaXMubGFzdEtleTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGtleSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgdmFsdWUgZG9lc24ndCBleGlzdCBpbiB0aGUgZGljdGlvbmFyeSAtIGFsd2F5cyByZXR1cm5cbiAgICAgICAgICAgICAgICAvLyBmYWxzZVxuICAgICAgICAgICAgICAgIC8vIFRPRE86IHNwZWNpYWwtY2FzZSBvZiBQcmVkaWNhdGVGdW5jIHRoYXQgZW5jYXBzdWxhdGVzIHRoaXNcbiAgICAgICAgICAgICAgICAvLyBcImFsd2F5cyBmYWxzZVwiIGJlaGF2aW9yLiBUaGF0IHdheSBmaWx0ZXJpbmcgb3BlcmF0aW9ucyBkb24ndFxuICAgICAgICAgICAgICAgIC8vIGhhdmUgdG8gYm90aGVyIGNoZWNraW5nXG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGlkeDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2ZWN0b3IuZ2V0S2V5KGlkeCkgPT09IGtleTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IGNvbF9mdW5jKGlkeCwgY29scykgPT0gbGl0LnY7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2JpbmRMaXRDb2woYmF0Y2g6IFJlY29yZEJhdGNoLCBsaXQ6IExpdGVyYWwsIGNvbDogQ29sKSB7XG4gICAgICAgIC8vIEVxdWFscyBpcyBjb211dGF0aXZlXG4gICAgICAgIHJldHVybiB0aGlzLl9iaW5kQ29sTGl0KGJhdGNoLCBjb2wsIGxpdCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTFRlcSBleHRlbmRzIENvbXBhcmlzb25QcmVkaWNhdGUge1xuICAgIHByb3RlY3RlZCBfYmluZExpdExpdChfYmF0Y2g6IFJlY29yZEJhdGNoLCBsZWZ0OiBMaXRlcmFsLCByaWdodDogTGl0ZXJhbCk6IFByZWRpY2F0ZUZ1bmMge1xuICAgICAgICBjb25zdCBydHJuOiBib29sZWFuID0gbGVmdC52IDw9IHJpZ2h0LnY7XG4gICAgICAgIHJldHVybiAoKSA9PiBydHJuO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBfYmluZENvbENvbChiYXRjaDogUmVjb3JkQmF0Y2gsIGxlZnQ6IENvbCwgcmlnaHQ6IENvbCk6IFByZWRpY2F0ZUZ1bmMge1xuICAgICAgICBjb25zdCBsZWZ0X2Z1bmMgPSBsZWZ0LmJpbmQoYmF0Y2gpO1xuICAgICAgICBjb25zdCByaWdodF9mdW5jID0gcmlnaHQuYmluZChiYXRjaCk7XG4gICAgICAgIHJldHVybiAoaWR4OiBudW1iZXIsIGNvbHM6IFJlY29yZEJhdGNoKSA9PiBsZWZ0X2Z1bmMoaWR4LCBjb2xzKSA8PSByaWdodF9mdW5jKGlkeCwgY29scyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iaW5kQ29sTGl0KGJhdGNoOiBSZWNvcmRCYXRjaCwgY29sOiBDb2wsIGxpdDogTGl0ZXJhbCk6IFByZWRpY2F0ZUZ1bmMge1xuICAgICAgICBjb25zdCBjb2xfZnVuYyA9IGNvbC5iaW5kKGJhdGNoKTtcbiAgICAgICAgcmV0dXJuIChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IGNvbF9mdW5jKGlkeCwgY29scykgPD0gbGl0LnY7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iaW5kTGl0Q29sKGJhdGNoOiBSZWNvcmRCYXRjaCwgbGl0OiBMaXRlcmFsLCBjb2w6IENvbCkge1xuICAgICAgICBjb25zdCBjb2xfZnVuYyA9IGNvbC5iaW5kKGJhdGNoKTtcbiAgICAgICAgcmV0dXJuIChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IGxpdC52IDw9IGNvbF9mdW5jKGlkeCwgY29scyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgR1RlcSBleHRlbmRzIENvbXBhcmlzb25QcmVkaWNhdGUge1xuICAgIHByb3RlY3RlZCBfYmluZExpdExpdChfYmF0Y2g6IFJlY29yZEJhdGNoLCBsZWZ0OiBMaXRlcmFsLCByaWdodDogTGl0ZXJhbCk6IFByZWRpY2F0ZUZ1bmMge1xuICAgICAgICBjb25zdCBydHJuOiBib29sZWFuID0gbGVmdC52ID49IHJpZ2h0LnY7XG4gICAgICAgIHJldHVybiAoKSA9PiBydHJuO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBfYmluZENvbENvbChiYXRjaDogUmVjb3JkQmF0Y2gsIGxlZnQ6IENvbCwgcmlnaHQ6IENvbCk6IFByZWRpY2F0ZUZ1bmMge1xuICAgICAgICBjb25zdCBsZWZ0X2Z1bmMgPSBsZWZ0LmJpbmQoYmF0Y2gpO1xuICAgICAgICBjb25zdCByaWdodF9mdW5jID0gcmlnaHQuYmluZChiYXRjaCk7XG4gICAgICAgIHJldHVybiAoaWR4OiBudW1iZXIsIGNvbHM6IFJlY29yZEJhdGNoKSA9PiBsZWZ0X2Z1bmMoaWR4LCBjb2xzKSA+PSByaWdodF9mdW5jKGlkeCwgY29scyk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iaW5kQ29sTGl0KGJhdGNoOiBSZWNvcmRCYXRjaCwgY29sOiBDb2wsIGxpdDogTGl0ZXJhbCk6IFByZWRpY2F0ZUZ1bmMge1xuICAgICAgICBjb25zdCBjb2xfZnVuYyA9IGNvbC5iaW5kKGJhdGNoKTtcbiAgICAgICAgcmV0dXJuIChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IGNvbF9mdW5jKGlkeCwgY29scykgPj0gbGl0LnY7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iaW5kTGl0Q29sKGJhdGNoOiBSZWNvcmRCYXRjaCwgbGl0OiBMaXRlcmFsLCBjb2w6IENvbCkge1xuICAgICAgICBjb25zdCBjb2xfZnVuYyA9IGNvbC5iaW5kKGJhdGNoKTtcbiAgICAgICAgcmV0dXJuIChpZHg6IG51bWJlciwgY29sczogUmVjb3JkQmF0Y2gpID0+IGxpdC52ID49IGNvbF9mdW5jKGlkeCwgY29scyk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTm90IGV4dGVuZHMgUHJlZGljYXRlIHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgY2hpbGQ6IFByZWRpY2F0ZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGJpbmQoYmF0Y2g6IFJlY29yZEJhdGNoKSB7XG4gICAgICAgIGNvbnN0IGZ1bmMgPSB0aGlzLmNoaWxkLmJpbmQoYmF0Y2gpO1xuICAgICAgICByZXR1cm4gKGlkeDogbnVtYmVyLCBiYXRjaDogUmVjb3JkQmF0Y2gpID0+ICFmdW5jKGlkeCwgYmF0Y2gpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEN1c3RvbVByZWRpY2F0ZSBleHRlbmRzIFByZWRpY2F0ZSB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBuZXh0OiBQcmVkaWNhdGVGdW5jLCBwcml2YXRlIGJpbmRfOiAoYmF0Y2g6IFJlY29yZEJhdGNoKSA9PiB2b2lkKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgYmluZChiYXRjaDogUmVjb3JkQmF0Y2gpIHtcbiAgICAgICAgdGhpcy5iaW5kXyhiYXRjaCk7XG4gICAgICAgIHJldHVybiB0aGlzLm5leHQ7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbGl0KHY6IGFueSk6IFZhbHVlPGFueT4geyByZXR1cm4gbmV3IExpdGVyYWwodik7IH1cbmV4cG9ydCBmdW5jdGlvbiBjb2wobjogc3RyaW5nKTogQ29sPGFueT4geyByZXR1cm4gbmV3IENvbChuKTsgfVxuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbShuZXh0OiBQcmVkaWNhdGVGdW5jLCBiaW5kOiAoYmF0Y2g6IFJlY29yZEJhdGNoKSA9PiB2b2lkKSB7XG4gICAgcmV0dXJuIG5ldyBDdXN0b21QcmVkaWNhdGUobmV4dCwgYmluZCk7XG59XG4iXX0=
