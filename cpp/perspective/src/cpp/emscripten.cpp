/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/emscripten.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <perspective/view.h>
#include <random>
#include <cmath>
#include <sstream>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <perspective/sym_table.h>
#include <codecvt>
#include <boost/optional.hpp>

using namespace emscripten;
using namespace perspective;

namespace perspective {
namespace binding {
    /******************************************************************************
     *
     * Utility
     */
    template <>
    bool
    hasValue(val item) {
        return (!item.isUndefined() && !item.isNull());
    }

    /******************************************************************************
     *
     * Data Loading
     */

    t_index
    _get_aggregate_index(const std::vector<std::string>& agg_names, std::string name) {
        for (std::size_t idx = 0, max = agg_names.size(); idx != max; ++idx) {
            if (agg_names[idx] == name) {
                return t_index(idx);
            }
        }
        return t_index();
    }

    std::vector<std::string>
    _get_aggregate_names(const std::vector<t_aggspec>& aggs) {
        std::vector<std::string> names;
        for (const t_aggspec& agg : aggs) {
            names.push_back(agg.name());
        }
        return names;
    }

    template <>
    std::vector<t_aggspec>
    _get_aggspecs(const t_schema& schema, const std::vector<std::string>& row_pivots,
        const std::vector<std::string>& column_pivots, bool column_only,
        const std::vector<std::string>& columns, const std::vector<val>& sortbys, val j_aggs) {
        std::vector<t_aggspec> aggspecs;
        val agg_columns = val::global("Object").call<val>("keys", j_aggs);
        std::vector<std::string> aggs = vecFromArray<val, std::string>(agg_columns);

        /**
         * Provide aggregates for columns that are shown but NOT specified in
         * the `j_aggs` object.
         */
        for (const std::string& column : columns) {
            if (std::find(aggs.begin(), aggs.end(), column) != aggs.end()) {
                continue;
            }

            t_dtype dtype = schema.get_dtype(column);
            std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
            t_aggtype agg_op
                = t_aggtype::AGGTYPE_ANY; // use aggtype here since we are not parsing aggs

            if (!column_only) {
                agg_op = _get_default_aggregate(dtype);
            }

            aggspecs.push_back(t_aggspec(column, agg_op, dependencies));
        }

        // Construct aggregates from config object
        for (const std::string& agg_column : aggs) {
            std::string agg_op = j_aggs[agg_column].as<std::string>();
            std::vector<t_dep> dependencies;

            if (column_only) {
                agg_op = "any";
            }

            dependencies.push_back(t_dep(agg_column, DEPTYPE_COLUMN));

            t_aggtype aggtype = str_to_aggtype(agg_op);

            if (aggtype == AGGTYPE_FIRST || aggtype == AGGTYPE_LAST) {
                if (dependencies.size() == 1) {
                    dependencies.push_back(t_dep("psp_pkey", DEPTYPE_COLUMN));
                }
                aggspecs.push_back(t_aggspec(
                    agg_column, agg_column, aggtype, dependencies, SORTTYPE_ASCENDING));
            } else {
                aggspecs.push_back(t_aggspec(agg_column, aggtype, dependencies));
            }
        }

        // construct aggspecs for hidden sorts
        for (auto sortby : sortbys) {
            std::string column = sortby[0].as<std::string>();

            bool is_hidden_column
                = std::find(columns.begin(), columns.end(), column) == columns.end();
            bool not_aggregated = std::find(aggs.begin(), aggs.end(), column) == aggs.end();

            if (is_hidden_column && not_aggregated) {
                bool is_pivot = (std::find(row_pivots.begin(), row_pivots.end(), column)
                                    != row_pivots.end())
                    || (std::find(column_pivots.begin(), column_pivots.end(), column)
                           != column_pivots.end());

                std::vector<t_dep> dependencies{t_dep(column, DEPTYPE_COLUMN)};
                t_aggtype agg_op;

                if (is_pivot) {
                    agg_op = t_aggtype::AGGTYPE_UNIQUE;
                } else {
                    t_dtype dtype = schema.get_dtype(column);
                    agg_op = _get_default_aggregate(dtype);
                }

                aggspecs.push_back(t_aggspec(column, agg_op, dependencies));
            }
        }

        return aggspecs;
    }

    template <>
    std::vector<t_sortspec>
    _get_sort(const std::vector<std::string>& columns, bool is_column_sort,
        const std::vector<val>& sortbys) {
        std::vector<t_sortspec> svec{};

        auto _is_valid_sort = [is_column_sort](val sort_item) {
            /**
             * If column sort, make sure string matches. Otherwise make
             * sure string is *not* a column sort.
             */
            std::string op = sort_item[1].as<std::string>();
            bool is_col_sortop = op.find("col") != std::string::npos;
            return (is_column_sort && is_col_sortop) || (!is_col_sortop && !is_column_sort);
        };

        for (auto idx = 0; idx < sortbys.size(); ++idx) {
            val sort_item = sortbys[idx];
            t_index agg_index;
            std::string column;
            t_sorttype sorttype;

            std::string sort_op_str;
            if (!_is_valid_sort(sort_item)) {
                continue;
            }

            column = sort_item[0].as<std::string>();
            sort_op_str = sort_item[1].as<std::string>();
            sorttype = str_to_sorttype(sort_op_str);

            agg_index = _get_aggregate_index(columns, column);

            svec.push_back(t_sortspec(agg_index, sorttype));
        }
        return svec;
    }

    template <>
    std::vector<t_fterm>
    _get_fterms(const t_schema& schema, val j_date_parser, val j_filters) {
        std::vector<t_fterm> fvec{};
        std::vector<val> filters = vecFromArray<val, val>(j_filters);

        auto _is_valid_filter = [j_date_parser](t_dtype type, std::vector<val> filter) {
            if (type == DTYPE_DATE || type == DTYPE_TIME) {
                val parsed_date = j_date_parser.call<val>("parse", filter[2]);
                return hasValue(parsed_date);
            } else {
                return hasValue(filter[2]);
            }
        };

        for (auto fidx = 0; fidx < filters.size(); ++fidx) {
            std::vector<val> filter = vecFromArray<val, val>(filters[fidx]);
            std::string col = filter[0].as<std::string>();
            t_filter_op comp = str_to_filter_op(filter[1].as<std::string>());

            // check validity and if_date
            t_dtype col_type = schema.get_dtype(col);
            bool is_valid = _is_valid_filter(col_type, filter);

            if (!is_valid) {
                continue;
            }

            switch (comp) {
                case FILTER_OP_NOT_IN:
                case FILTER_OP_IN: {
                    std::vector<t_tscalar> terms{};
                    std::vector<std::string> j_terms
                        = vecFromArray<val, std::string>(filter[2]);
                    for (auto jidx = 0; jidx < j_terms.size(); ++jidx) {
                        terms.push_back(mktscalar(get_interned_cstr(j_terms[jidx].c_str())));
                    }
                    fvec.push_back(t_fterm(col, comp, mktscalar(0), terms));
                } break;
                default: {
                    t_tscalar term;
                    switch (col_type) {
                        case DTYPE_INT32: {
                            term = mktscalar(filter[2].as<std::int32_t>());
                        } break;
                        case DTYPE_INT64:
                        case DTYPE_FLOAT64: {
                            term = mktscalar(filter[2].as<double>());
                        } break;
                        case DTYPE_BOOL: {
                            term = mktscalar(filter[2].as<bool>());
                        } break;
                        case DTYPE_DATE: {
                            val parsed_date = j_date_parser.call<val>("parse", filter[2]);
                            term = mktscalar(jsdate_to_t_date(parsed_date));
                        } break;
                        case DTYPE_TIME: {
                            val parsed_date = j_date_parser.call<val>("parse", filter[2]);
                            term = mktscalar(t_time(static_cast<std::int64_t>(
                                parsed_date.call<val>("getTime").as<double>())));
                        } break;
                        default: {
                            term = mktscalar(
                                get_interned_cstr(filter[2].as<std::string>().c_str()));
                        }
                    }

                    fvec.push_back(t_fterm(col, comp, term, std::vector<t_tscalar>()));
                }
            }
        }
        return fvec;
    }

    /******************************************************************************
     *
     * Date Parsing
     */

    t_date
    jsdate_to_t_date(val date) {
        return t_date(date.call<val>("getFullYear").as<std::int32_t>(),
            date.call<val>("getMonth").as<std::int32_t>(),
            date.call<val>("getDate").as<std::int32_t>());
    }

    val
    t_date_to_jsdate(t_date date) {
        val jsdate = val::global("Date").new_();
        jsdate.call<val>("setYear", date.year());
        jsdate.call<val>("setMonth", date.month());
        jsdate.call<val>("setDate", date.day());
        jsdate.call<val>("setHours", 0);
        jsdate.call<val>("setMinutes", 0);
        jsdate.call<val>("setSeconds", 0);
        jsdate.call<val>("setMilliseconds", 0);
        return jsdate;
    }

    /**
     * Converts a scalar value to its JS representation.
     *
     * Params
     * ------
     * t_tscalar scalar
     *
     * Returns
     * -------
     * val
     */
    val
    scalar_to_val(const t_tscalar& scalar, bool cast_double, bool cast_string) {
        if (!scalar.is_valid()) {
            return val::null();
        }
        switch (scalar.get_dtype()) {
            case DTYPE_BOOL: {
                if (scalar) {
                    return val(true);
                } else {
                    return val(false);
                }
            }
            case DTYPE_TIME: {
                if (cast_double) {
                    auto x = scalar.to_uint64();
                    double y = *reinterpret_cast<double*>(&x);
                    return val(y);
                } else if (cast_string) {
                    double ms = scalar.to_double();
                    emscripten::val date = val::global("Date").new_(ms);
                    return date.call<val>("toLocaleString");
                } else {
                    return val(scalar.to_double());
                }
            }
            case DTYPE_FLOAT64:
            case DTYPE_FLOAT32: {
                if (cast_double) {
                    auto x = scalar.to_uint64();
                    double y = *reinterpret_cast<double*>(&x);
                    return val(y);
                } else {
                    return val(scalar.to_double());
                }
            }
            case DTYPE_DATE: {
                return t_date_to_jsdate(scalar.get<t_date>()).call<val>("getTime");
            }
            case DTYPE_UINT8:
            case DTYPE_UINT16:
            case DTYPE_UINT32:
            case DTYPE_INT8:
            case DTYPE_INT16:
            case DTYPE_INT32: {
                return val(static_cast<std::int32_t>(scalar.to_int64()));
            }
            case DTYPE_UINT64:
            case DTYPE_INT64: {
                // This could potentially lose precision
                return val(static_cast<std::int32_t>(scalar.to_int64()));
            }
            case DTYPE_NONE: {
                return val::null();
            }
            case DTYPE_STR:
            default: {
                std::wstring_convert<utf8convert_type, wchar_t> converter("", L"<Invalid>");
                return val(converter.from_bytes(scalar.to_string()));
            }
        }
    }

    val
    scalar_vec_to_val(const std::vector<t_tscalar>& scalars, std::uint32_t idx) {
        return scalar_to_val(scalars[idx]);
    }

    val
    scalar_vec_to_string(const std::vector<t_tscalar>& scalars, std::uint32_t idx) {
        return scalar_to_val(scalars[idx], false, true);
    }

    template <typename T, typename U>
    std::vector<U>
    vecFromArray(T& arr) {
        return vecFromJSArray<U>(arr);
    }

    template <>
    val
    scalar_to(const t_tscalar& scalar) {
        return scalar_to_val(scalar);
    }

    template <>
    val
    scalar_vec_to(const std::vector<t_tscalar>& scalars, std::uint32_t idx) {
        return scalar_vec_to_val(scalars, idx);
    }

    /**
     * Converts a std::vector<T> to a Typed Array, slicing directly from the
     * WebAssembly heap.
     */
    template <typename T>
    val
    vector_to_typed_array(std::vector<T>& xs) {
        T* st = &xs[0];
        uintptr_t offset = reinterpret_cast<uintptr_t>(st);
        return val::module_property("HEAPU8").call<val>(
            "slice", offset, offset + (sizeof(T) * xs.size()));
    }

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */

    namespace arrow {

        template <>
        void
        vecFromTypedArray(
            const val& typedArray, void* data, std::int32_t length, const char* destType) {
            val memory = val::module_property("buffer");
            if (destType == nullptr) {
                val memoryView = typedArray["constructor"].new_(
                    memory, reinterpret_cast<std::uintptr_t>(data), length);
                memoryView.call<void>("set", typedArray.call<val>("slice", 0, length));
            } else {
                val memoryView = val::global(destType).new_(
                    memory, reinterpret_cast<std::uintptr_t>(data), length);
                memoryView.call<void>("set", typedArray.call<val>("slice", 0, length));
            }
        }

        template <>
        void
        fill_col_valid(val dcol, std::shared_ptr<t_column> col) {
            // dcol should be the Uint8Array containing the null bitmap
            t_uindex nrows = col->size();

            // arrow packs bools into a bitmap
            for (auto i = 0; i < nrows; ++i) {
                std::uint8_t elem = dcol[i / 8].as<std::uint8_t>();
                bool v = elem & (1 << (i % 8));
                col->set_valid(i, v);
            }
        }

        template <>
        void
        fill_col_dict(val dictvec, std::shared_ptr<t_column> col) {
            // ptaylor: This assumes the dictionary is either a Binary or Utf8 Vector. Should it
            // support other Vector types?
            val vdata = dictvec["values"];
            std::int32_t vsize = vdata["length"].as<std::int32_t>();
            std::vector<unsigned char> data;
            data.reserve(vsize);
            data.resize(vsize);
            vecFromTypedArray(vdata, data.data(), vsize);

            val voffsets = dictvec["valueOffsets"];
            std::int32_t osize = voffsets["length"].as<std::int32_t>();
            std::vector<std::int32_t> offsets;
            offsets.reserve(osize);
            offsets.resize(osize);
            vecFromTypedArray(voffsets, offsets.data(), osize);

            // Get number of dictionary entries
            std::uint32_t dsize = dictvec["length"].as<std::uint32_t>();

            t_vocab* vocab = col->_get_vocab();
            std::string elem;

            for (std::uint32_t i = 0; i < dsize; ++i) {
                std::int32_t bidx = offsets[i];
                std::size_t es = offsets[i + 1] - bidx;
                elem.assign(reinterpret_cast<char*>(data.data()) + bidx, es);
                t_uindex idx = vocab->get_interned(elem);
                // Make sure there are no duplicates in the arrow dictionary
                assert(idx == i);
            }
        }
    } // namespace arrow

    namespace js_typed_array {
        val ArrayBuffer = val::global("ArrayBuffer");
        val Int8Array = val::global("Int8Array");
        val Int16Array = val::global("Int16Array");
        val Int32Array = val::global("Int32Array");
        val UInt8Array = val::global("Uint8Array");
        val UInt32Array = val::global("Uint32Array");
        val Float32Array = val::global("Float32Array");
        val Float64Array = val::global("Float64Array");
    } // namespace js_typed_array

    template <typename T>
    const val typed_array = val::null();

    template <>
    const val typed_array<double> = js_typed_array::Float64Array;
    template <>
    const val typed_array<float> = js_typed_array::Float32Array;
    template <>
    const val typed_array<std::int8_t> = js_typed_array::Int8Array;
    template <>
    const val typed_array<std::int16_t> = js_typed_array::Int16Array;
    template <>
    const val typed_array<std::int32_t> = js_typed_array::Int32Array;
    template <>
    const val typed_array<std::uint32_t> = js_typed_array::UInt32Array;

    template <typename F, typename T = F>
    T get_scalar(t_tscalar& t);

    template <>
    double
    get_scalar<double>(t_tscalar& t) {
        return t.to_double();
    }
    template <>
    float
    get_scalar<float>(t_tscalar& t) {
        return t.to_double();
    }
    template <>
    std::uint8_t
    get_scalar<std::uint8_t>(t_tscalar& t) {
        return static_cast<std::uint8_t>(t.to_int64());
    }
    template <>
    std::int8_t
    get_scalar<std::int8_t>(t_tscalar& t) {
        return static_cast<std::int8_t>(t.to_int64());
    }
    template <>
    std::int16_t
    get_scalar<std::int16_t>(t_tscalar& t) {
        return static_cast<std::int16_t>(t.to_int64());
    }
    template <>
    std::int32_t
    get_scalar<std::int32_t>(t_tscalar& t) {
        return static_cast<std::int32_t>(t.to_int64());
    }
    template <>
    std::uint32_t
    get_scalar<std::uint32_t>(t_tscalar& t) {
        return static_cast<std::uint32_t>(t.to_int64());
    }
    template <>
    double
    get_scalar<t_date, double>(t_tscalar& t) {
        auto x = t.to_uint64();
        return *reinterpret_cast<double*>(&x);
    }

    template <typename T, typename F = T, typename O = T>
    val
    col_to_typed_array(std::vector<t_tscalar> data, bool column_pivot_only) {
        int start_idx = column_pivot_only ? 1 : 0;
        int data_size = data.size() - start_idx;
        std::vector<T> vals;
        vals.reserve(data.size());

        // Validity map must have a length that is a multiple of 64
        int nullSize = ceil(data_size / 64.0) * 2;
        int nullCount = 0;
        std::vector<std::uint32_t> validityMap;
        validityMap.resize(nullSize);

        for (int idx = 0; idx < data.size() - start_idx; idx++) {
            t_tscalar scalar = data[idx + start_idx];
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                vals.push_back(get_scalar<F, T>(scalar));
                // Mark the slot as non-null (valid)
                validityMap[idx / 32] |= 1 << (idx % 32);
            } else {
                vals.push_back({});
                nullCount++;
            }
        }

        val arr = val::global("Array").new_();
        arr.call<void>("push", typed_array<O>.new_(vector_to_typed_array(vals)["buffer"]));
        arr.call<void>("push", nullCount);
        arr.call<void>("push", vector_to_typed_array(validityMap));
        return arr;
    }

    template <>
    val
    col_to_typed_array<bool>(std::vector<t_tscalar> data, bool column_pivot_only) {
        int start_idx = column_pivot_only ? 1 : 0;
        int data_size = data.size() - start_idx;

        std::vector<std::int8_t> vals;
        vals.reserve(data.size());

        // Validity map must have a length that is a multiple of 64
        int nullSize = ceil(data_size / 64.0) * 2;
        int nullCount = 0;
        std::vector<std::uint32_t> validityMap;
        validityMap.resize(nullSize);

        for (int idx = 0; idx < data.size() - start_idx; idx++) {
            t_tscalar scalar = data[idx + start_idx];
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                // get boolean and write into array
                std::int8_t val = get_scalar<std::int8_t>(scalar);
                vals.push_back(val);
                // bit mask based on value in array
                vals[idx / 8] |= val << (idx % 8);
                // Mark the slot as non-null (valid)
                validityMap[idx / 32] |= 1 << (idx % 32);
            } else {
                vals.push_back({});
                nullCount++;
            }
        }

        val arr = val::global("Array").new_();
        arr.call<void>(
            "push", typed_array<std::int8_t>.new_(vector_to_typed_array(vals)["buffer"]));
        arr.call<void>("push", nullCount);
        arr.call<void>("push", vector_to_typed_array(validityMap));
        return arr;
    }

    template <>
    val
    col_to_typed_array<std::string>(std::vector<t_tscalar> data, bool column_pivot_only) {
        int start_idx = column_pivot_only ? 1 : 0;
        int data_size = data.size() - start_idx;

        t_vocab vocab;
        vocab.init(false);

        int nullSize = ceil(data_size / 64.0) * 2;
        int nullCount = 0;
        std::vector<std::uint32_t> validityMap; // = new std::uint32_t[nullSize];
        validityMap.resize(nullSize);
        val indexBuffer = js_typed_array::ArrayBuffer.new_(data_size * 4);
        val indexArray = js_typed_array::UInt32Array.new_(indexBuffer);

        for (int idx = 0; idx < data.size(); idx++) {
            t_tscalar scalar = data[idx + start_idx];
            if (scalar.is_valid() && scalar.get_dtype() != DTYPE_NONE) {
                auto adx = vocab.get_interned(scalar.to_string());
                indexArray.call<void>("fill", val(adx), idx, idx + 1);
                validityMap[idx / 32] |= 1 << (idx % 32);
            } else {
                nullCount++;
            }
        }
        val dictBuffer = js_typed_array::ArrayBuffer.new_(
            vocab.get_vlendata()->size() - vocab.get_vlenidx());
        val dictArray = js_typed_array::UInt8Array.new_(dictBuffer);
        std::vector<std::uint32_t> offsets;
        offsets.reserve(vocab.get_vlenidx() + 1);
        std::uint32_t index = 0;
        for (auto i = 0; i < vocab.get_vlenidx(); i++) {
            const char* str = vocab.unintern_c(i);
            offsets.push_back(index);
            while (*str) {
                dictArray.call<void>("fill", val(*str++), index, index + 1);
                index++;
            }
        }
        offsets.push_back(index);

        val arr = val::global("Array").new_();
        arr.call<void>("push", dictArray);
        arr.call<void>(
            "push", js_typed_array::UInt32Array.new_(vector_to_typed_array(offsets)["buffer"]));
        arr.call<void>("push", indexArray);
        arr.call<void>("push", nullCount);
        arr.call<void>("push", vector_to_typed_array(validityMap));
        return arr;
    }

    // Given a column index, serialize data to TypedArray
    template <typename T>
    val
    col_to_js_typed_array(std::shared_ptr<View<T>> view, t_index idx, bool column_pivot_only,
        t_uindex start_row, t_uindex end_row) {
        std::shared_ptr<T> ctx = view->get_context();
        std::vector<t_tscalar> data = ctx->get_data(start_row, end_row, idx, idx + 1);
        auto dtype = ctx->get_column_dtype(idx);

        switch (dtype) {
            case DTYPE_INT8: {
                return col_to_typed_array<std::int8_t>(data, column_pivot_only);
            } break;
            case DTYPE_INT16: {
                return col_to_typed_array<std::int16_t>(data, column_pivot_only);
            } break;
            case DTYPE_TIME: {
                return col_to_typed_array<double, t_date, std::int32_t>(
                    data, column_pivot_only);
            } break;
            case DTYPE_INT32:
            case DTYPE_UINT32: {
                return col_to_typed_array<std::uint32_t>(data, column_pivot_only);
            } break;
            case DTYPE_INT64: {
                return col_to_typed_array<std::int32_t>(data, column_pivot_only);
            } break;
            case DTYPE_FLOAT32: {
                return col_to_typed_array<float>(data, column_pivot_only);
            } break;
            case DTYPE_FLOAT64: {
                return col_to_typed_array<double>(data, column_pivot_only);
            } break;
            case DTYPE_BOOL: {
                return col_to_typed_array<bool>(data, column_pivot_only);
            } break;
            case DTYPE_STR: {
                return col_to_typed_array<std::string>(data, column_pivot_only);
            } break;
            default: {
                PSP_COMPLAIN_AND_ABORT("Unhandled aggregate type");
                return val::undefined();
            }
        }
    }

    void
    _fill_col_int64(val accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
        t_uindex nrows = col->size();

        if (is_arrow) {
            val data = accessor["values"];
            // arrow packs 64 bit into two 32 bit ints
            arrow::vecFromTypedArray(data, col->get_nth<std::int64_t>(0), nrows * 2);
        } else {
            PSP_COMPLAIN_AND_ABORT(
                "Unreachable - can't have DTYPE_INT64 column from non-arrow data");
        }
    }

    void
    _fill_col_time(val accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
        t_uindex nrows = col->size();

        if (is_arrow) {
            val data = accessor["values"];
            // arrow packs 64 bit into two 32 bit ints
            arrow::vecFromTypedArray(data, col->get_nth<t_time>(0), nrows * 2);

            std::int8_t unit = accessor["type"]["unit"].as<std::int8_t>();
            if (unit != /* Arrow.enum_.TimeUnit.MILLISECOND */ 1) {
                // Slow path - need to convert each value
                std::int64_t factor = 1;
                if (unit == /* Arrow.enum_.TimeUnit.NANOSECOND */ 3) {
                    factor = 1e6;
                } else if (unit == /* Arrow.enum_.TimeUnit.MICROSECOND */ 2) {
                    factor = 1e3;
                }
                for (auto i = 0; i < nrows; ++i) {
                    col->set_nth<std::int64_t>(i, *(col->get_nth<std::int64_t>(i)) / factor);
                }
            }
        } else {
            for (auto i = 0; i < nrows; ++i) {
                val item = accessor.call<val>("marshal", cidx, i, type);

                if (item.isUndefined())
                    continue;

                if (item.isNull()) {
                    if (is_update) {
                        col->unset(i);
                    } else {
                        col->clear(i);
                    }
                    continue;
                }

                auto elem = static_cast<std::int64_t>(
                    item.call<val>("getTime").as<double>()); // dcol[i].as<T>();
                col->set_nth(i, elem);
            }
        }
    }

    void
    _fill_col_date(val accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
        t_uindex nrows = col->size();

        if (is_arrow) {
            // val data = dcol["values"];
            // // arrow packs 64 bit into two 32 bit ints
            // arrow::vecFromTypedArray(data, col->get_nth<t_time>(0), nrows * 2);

            // std::int8_t unit = dcol["type"]["unit"].as<std::int8_t>();
            // if (unit != /* Arrow.enum_.TimeUnit.MILLISECOND */ 1) {
            //     // Slow path - need to convert each value
            //     std::int64_t factor = 1;
            //     if (unit == /* Arrow.enum_.TimeUnit.NANOSECOND */ 3) {
            //         factor = 1e6;
            //     } else if (unit == /* Arrow.enum_.TimeUnit.MICROSECOND */ 2) {
            //         factor = 1e3;
            //     }
            //     for (auto i = 0; i < nrows; ++i) {
            //         col->set_nth<std::int32_t>(i, *(col->get_nth<std::int32_t>(i)) / factor);
            //     }
            // }
        } else {
            for (auto i = 0; i < nrows; ++i) {
                val item = accessor.call<val>("marshal", cidx, i, type);

                if (item.isUndefined())
                    continue;

                if (item.isNull()) {
                    if (is_update) {
                        col->unset(i);
                    } else {
                        col->clear(i);
                    }
                    continue;
                }

                col->set_nth(i, jsdate_to_t_date(item));
            }
        }
    }

    void
    _fill_col_bool(val accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
        t_uindex nrows = col->size();

        if (is_arrow) {
            // bools are stored using a bit mask
            val data = accessor["values"];
            for (auto i = 0; i < nrows; ++i) {
                std::uint8_t elem = data[i / 8].as<std::uint8_t>();
                bool v = elem & (1 << (i % 8));
                col->set_nth(i, v);
            }
        } else {
            for (auto i = 0; i < nrows; ++i) {
                val item = accessor.call<val>("marshal", cidx, i, type);

                if (item.isUndefined())
                    continue;

                if (item.isNull()) {
                    if (is_update) {
                        col->unset(i);
                    } else {
                        col->clear(i);
                    }
                    continue;
                }

                auto elem = item.as<bool>();
                col->set_nth(i, elem);
            }
        }
    }

    void
    _fill_col_string(val accessor, std::shared_ptr<t_column> col, std::string name,
        std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {

        t_uindex nrows = col->size();

        if (is_arrow) {
            if (accessor["constructor"]["name"].as<std::string>() == "DictionaryVector") {

                val dictvec = accessor["dictionary"];
                arrow::fill_col_dict(dictvec, col);

                // Now process index into dictionary

                // Perspective stores string indices in a 32bit unsigned array
                // Javascript's typed arrays handle copying from various bitwidth arrays
                // properly
                val vkeys = accessor["indices"]["values"];
                arrow::vecFromTypedArray(
                    vkeys, col->get_nth<t_uindex>(0), nrows, "Uint32Array");

            } else if (accessor["constructor"]["name"].as<std::string>() == "Utf8Vector"
                || accessor["constructor"]["name"].as<std::string>() == "BinaryVector") {

                val vdata = accessor["values"];
                std::int32_t vsize = vdata["length"].as<std::int32_t>();
                std::vector<std::uint8_t> data;
                data.reserve(vsize);
                data.resize(vsize);
                arrow::vecFromTypedArray(vdata, data.data(), vsize);

                val voffsets = accessor["valueOffsets"];
                std::int32_t osize = voffsets["length"].as<std::int32_t>();
                std::vector<std::int32_t> offsets;
                offsets.reserve(osize);
                offsets.resize(osize);
                arrow::vecFromTypedArray(voffsets, offsets.data(), osize);

                std::string elem;

                for (std::int32_t i = 0; i < nrows; ++i) {
                    std::int32_t bidx = offsets[i];
                    std::size_t es = offsets[i + 1] - bidx;
                    elem.assign(reinterpret_cast<char*>(data.data()) + bidx, es);
                    col->set_nth(i, elem);
                }
            }
        } else {
            for (auto i = 0; i < nrows; ++i) {
                val item = accessor.call<val>("marshal", cidx, i, type);

                if (item.isUndefined())
                    continue;

                if (item.isNull()) {
                    if (is_update) {
                        col->unset(i);
                    } else {
                        col->clear(i);
                    }
                    continue;
                }

                std::wstring welem = item.as<std::wstring>();
                std::wstring_convert<utf16convert_type, wchar_t> converter;
                std::string elem = converter.to_bytes(welem);
                col->set_nth(i, elem);
            }
        }
    }

    void
    _fill_col_numeric(val accessor, t_table& tbl, std::shared_ptr<t_column> col,
        std::string name, std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
        t_uindex nrows = col->size();

        if (is_arrow) {
            val data = accessor["values"];

            switch (type) {
                case DTYPE_INT8: {
                    arrow::vecFromTypedArray(data, col->get_nth<std::int8_t>(0), nrows);
                } break;
                case DTYPE_INT16: {
                    arrow::vecFromTypedArray(data, col->get_nth<std::int16_t>(0), nrows);
                } break;
                case DTYPE_INT32: {
                    arrow::vecFromTypedArray(data, col->get_nth<std::int32_t>(0), nrows);
                } break;
                case DTYPE_FLOAT32: {
                    arrow::vecFromTypedArray(data, col->get_nth<float>(0), nrows);
                } break;
                case DTYPE_FLOAT64: {
                    arrow::vecFromTypedArray(data, col->get_nth<double>(0), nrows);
                } break;
                default:
                    break;
            }
        } else {
            for (auto i = 0; i < nrows; ++i) {
                val item = accessor.call<val>("marshal", cidx, i, type);

                if (item.isUndefined())
                    continue;

                if (item.isNull()) {
                    if (is_update) {
                        col->unset(i);
                    } else {
                        col->clear(i);
                    }
                    continue;
                }

                switch (type) {
                    case DTYPE_INT8: {
                        col->set_nth(i, item.as<std::int8_t>());
                    } break;
                    case DTYPE_INT16: {
                        col->set_nth(i, item.as<std::int16_t>());
                    } break;
                    case DTYPE_INT32: {
                        // This handles cases where a long sequence of e.g. 0 precedes a clearly
                        // float value in an inferred column. Would not be needed if the type
                        // inference checked the entire column/we could reset parsing.
                        double fval = item.as<double>();
                        if (fval > 2147483647 || fval < -2147483648) {
                            std::cout << "Promoting to float" << std::endl;
                            tbl.promote_column(name, DTYPE_FLOAT64, i, true);
                            col = tbl.get_column(name);
                            type = DTYPE_FLOAT64;
                            col->set_nth(i, fval);
                        } else if (isnan(fval)) {
                            std::cout << "Promoting to string" << std::endl;
                            tbl.promote_column(name, DTYPE_STR, i, false);
                            col = tbl.get_column(name);
                            _fill_col_string(
                                accessor, col, name, cidx, DTYPE_STR, is_arrow, is_update);
                            return;
                        } else {
                            col->set_nth(i, static_cast<std::int32_t>(fval));
                        }
                    } break;
                    case DTYPE_FLOAT32: {
                        col->set_nth(i, item.as<float>());
                    } break;
                    case DTYPE_FLOAT64: {
                        col->set_nth(i, item.as<double>());
                    } break;
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Fills the table with data from Javascript.
     *
     * Params
     * ------
     * tbl - pointer to the table object
     * ocolnames - vector of column names
     * accessor - the JS data accessor interface
     * odt - vector of data types
     * offset
     * is_arrow - flag for arrow data
     *
     * Returns
     * -------
     *
     */
    void
    _fill_data(t_table& tbl, std::vector<std::string> ocolnames, val accessor,
        std::vector<t_dtype> odt, std::uint32_t offset, bool is_arrow, bool is_update) {

        for (auto cidx = 0; cidx < ocolnames.size(); ++cidx) {
            auto name = ocolnames[cidx];
            auto col = tbl.get_column(name);
            auto col_type = odt[cidx];

            val dcol = val::undefined();

            if (is_arrow) {
                dcol = accessor["cdata"][cidx];
            } else {
                dcol = accessor;
            }

            switch (col_type) {
                case DTYPE_INT64: {
                    _fill_col_int64(dcol, col, name, cidx, col_type, is_arrow, is_update);
                } break;
                case DTYPE_BOOL: {
                    _fill_col_bool(dcol, col, name, cidx, col_type, is_arrow, is_update);
                } break;
                case DTYPE_DATE: {
                    _fill_col_date(dcol, col, name, cidx, col_type, is_arrow, is_update);
                } break;
                case DTYPE_TIME: {
                    _fill_col_time(dcol, col, name, cidx, col_type, is_arrow, is_update);
                } break;
                case DTYPE_STR: {
                    _fill_col_string(dcol, col, name, cidx, col_type, is_arrow, is_update);
                } break;
                case DTYPE_NONE: {
                    break;
                }
                default:
                    _fill_col_numeric(
                        dcol, tbl, col, name, cidx, col_type, is_arrow, is_update);
            }

            if (is_arrow) {
                // Fill validity bitmap
                std::uint32_t null_count = dcol["nullCount"].as<std::uint32_t>();

                if (null_count == 0) {
                    col->valid_raw_fill();
                } else {
                    val validity = dcol["nullBitmap"];
                    arrow::fill_col_valid(validity, col);
                }
            }
        }
    }

    /******************************************************************************
     *
     * Public
     */
    template <>
    void
    set_column_nth(t_column* col, t_uindex idx, val value) {

        // Check if the value is a javascript null
        if (value.isNull()) {
            col->unset(idx);
            return;
        }

        switch (col->get_dtype()) {
            case DTYPE_BOOL: {
                col->set_nth<bool>(idx, value.as<bool>(), STATUS_VALID);
                break;
            }
            case DTYPE_FLOAT64: {
                col->set_nth<double>(idx, value.as<double>(), STATUS_VALID);
                break;
            }
            case DTYPE_FLOAT32: {
                col->set_nth<float>(idx, value.as<float>(), STATUS_VALID);
                break;
            }
            case DTYPE_UINT32: {
                col->set_nth<std::uint32_t>(idx, value.as<std::uint32_t>(), STATUS_VALID);
                break;
            }
            case DTYPE_UINT64: {
                col->set_nth<std::uint64_t>(idx, value.as<std::uint64_t>(), STATUS_VALID);
                break;
            }
            case DTYPE_INT32: {
                col->set_nth<std::int32_t>(idx, value.as<std::int32_t>(), STATUS_VALID);
                break;
            }
            case DTYPE_INT64: {
                col->set_nth<std::int64_t>(idx, value.as<std::int64_t>(), STATUS_VALID);
                break;
            }
            case DTYPE_STR: {
                std::wstring welem = value.as<std::wstring>();

                std::wstring_convert<utf16convert_type, wchar_t> converter;
                std::string elem = converter.to_bytes(welem);
                col->set_nth(idx, elem, STATUS_VALID);
                break;
            }
            case DTYPE_DATE: {
                col->set_nth<t_date>(idx, jsdate_to_t_date(value), STATUS_VALID);
                break;
            }
            case DTYPE_TIME: {
                col->set_nth<std::int64_t>(
                    idx, static_cast<std::int64_t>(value.as<double>()), STATUS_VALID);
                break;
            }
            case DTYPE_UINT8:
            case DTYPE_UINT16:
            case DTYPE_INT8:
            case DTYPE_INT16:
            default: {
                // Other types not implemented
            }
        }
    }

    /**
     * Helper function for computed columns
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    template <>
    void
    table_add_computed_column(t_table& table, val computed_defs) {
        auto vcomputed_defs = vecFromArray<val, val>(computed_defs);
        for (auto i = 0; i < vcomputed_defs.size(); ++i) {
            val coldef = vcomputed_defs[i];
            std::string name = coldef["column"].as<std::string>();
            val inputs = coldef["inputs"];
            val func = coldef["func"];
            val type = coldef["type"];

            std::string stype;

            if (type.isUndefined()) {
                stype = "string";
            } else {
                stype = type.as<std::string>();
            }

            t_dtype dtype;
            if (stype == "integer") {
                dtype = DTYPE_INT32;
            } else if (stype == "float") {
                dtype = DTYPE_FLOAT64;
            } else if (stype == "boolean") {
                dtype = DTYPE_BOOL;
            } else if (stype == "date") {
                dtype = DTYPE_DATE;
            } else if (stype == "datetime") {
                dtype = DTYPE_TIME;
            } else {
                dtype = DTYPE_STR;
            }

            // Get list of input column names
            auto icol_names = vecFromArray<val, std::string>(inputs);

            // Get t_column* for all input columns
            std::vector<const t_column*> icols;
            for (const auto& cc : icol_names) {
                icols.push_back(table._get_column(cc));
            }

            int arity = icols.size();

            // Add new column
            t_column* out = table.add_column(name, dtype, true);

            val i1 = val::undefined(), i2 = val::undefined(), i3 = val::undefined(),
                i4 = val::undefined();

            t_uindex size = table.size();
            for (t_uindex ridx = 0; ridx < size; ++ridx) {
                val value = val::undefined();

                switch (arity) {
                    case 0: {
                        value = func();
                        break;
                    }
                    case 1: {
                        i1 = scalar_to_val(icols[0]->get_scalar(ridx));
                        if (!i1.isNull()) {
                            value = func(i1);
                        }
                        break;
                    }
                    case 2: {
                        i1 = scalar_to_val(icols[0]->get_scalar(ridx));
                        i2 = scalar_to_val(icols[1]->get_scalar(ridx));
                        if (!i1.isNull() && !i2.isNull()) {
                            value = func(i1, i2);
                        }
                        break;
                    }
                    case 3: {
                        i1 = scalar_to_val(icols[0]->get_scalar(ridx));
                        i2 = scalar_to_val(icols[1]->get_scalar(ridx));
                        i3 = scalar_to_val(icols[2]->get_scalar(ridx));
                        if (!i1.isNull() && !i2.isNull() && !i3.isNull()) {
                            value = func(i1, i2, i3);
                        }
                        break;
                    }
                    case 4: {
                        i1 = scalar_to_val(icols[0]->get_scalar(ridx));
                        i2 = scalar_to_val(icols[1]->get_scalar(ridx));
                        i3 = scalar_to_val(icols[2]->get_scalar(ridx));
                        i4 = scalar_to_val(icols[3]->get_scalar(ridx));
                        if (!i1.isNull() && !i2.isNull() && !i3.isNull() && !i4.isNull()) {
                            value = func(i1, i2, i3, i4);
                        }
                        break;
                    }
                    default: {
                        // Don't handle other arity values
                        break;
                    }
                }

                if (!value.isUndefined()) {
                    set_column_nth(out, ridx, value);
                }
            }
        }
    }

    /**
     * DataAccessor
     *
     * parses and converts input data into a canonical format for
     * interfacing with Perspective.
     */

    // Name parsing
    std::vector<std::string>
    column_names(val data, std::int32_t format) {
        std::vector<std::string> names;
        val Object = val::global("Object");

        if (format == 0) {
            std::int32_t max_check = 50;
            val data_names = Object.call<val>("keys", data[0]);
            names = vecFromArray<val, std::string>(data_names);
            std::int32_t check_index = std::min(max_check, data["length"].as<std::int32_t>());

            for (auto ix = 0; ix < check_index; ix++) {
                val next = Object.call<val>("keys", data[ix]);

                if (names.size() != next["length"].as<std::int32_t>()) {
                    auto old_size = names.size();
                    auto new_names = vecFromJSArray<std::string>(next);
                    if (max_check == 50) {
                        std::cout << "Data parse warning: Array data has inconsistent rows"
                                  << std::endl;
                    }

                    for (auto s = new_names.begin(); s != new_names.end(); ++s) {
                        if (std::find(names.begin(), names.end(), *s) == names.end()) {
                            names.push_back(*s);
                        }
                    }

                    std::cout << "Extended from " << old_size << "to " << names.size()
                              << std::endl;
                    max_check *= 2;
                }
            }
        } else if (format == 1 || format == 2) {
            val keys = Object.call<val>("keys", data);
            names = vecFromArray<val, std::string>(keys);
        }

        return names;
    }

    // Type inferrence for fill_col and data_types
    t_dtype
    infer_type(val x, val date_validator) {
        std::string jstype = x.typeOf().as<std::string>();
        t_dtype t = t_dtype::DTYPE_STR;

        // Unwrap numbers inside strings
        val x_number = val::global("Number").call<val>("call", val::object(), x);
        bool number_in_string = (jstype == "string") && (x["length"].as<std::int32_t>() != 0)
            && (!val::global("isNaN").call<bool>("call", val::object(), x_number));

        if (x.isNull()) {
            t = t_dtype::DTYPE_NONE;
        } else if (jstype == "number" || number_in_string) {
            if (number_in_string) {
                x = x_number;
            }
            double x_float64 = x.as<double>();
            if ((std::fmod(x_float64, 1.0) == 0.0) && (x_float64 < 10000.0)
                && (x_float64 != 0.0)) {
                t = t_dtype::DTYPE_INT32;
            } else {
                t = t_dtype::DTYPE_FLOAT64;
            }
        } else if (jstype == "boolean") {
            t = t_dtype::DTYPE_BOOL;
        } else if (x.instanceof (val::global("Date"))) {
            std::int32_t hours = x.call<val>("getHours").as<std::int32_t>();
            std::int32_t minutes = x.call<val>("getMinutes").as<std::int32_t>();
            std::int32_t seconds = x.call<val>("getSeconds").as<std::int32_t>();
            std::int32_t milliseconds = x.call<val>("getMilliseconds").as<std::int32_t>();

            if (hours == 0 && minutes == 0 && seconds == 0 && milliseconds == 0) {
                t = t_dtype::DTYPE_DATE;
            } else {
                t = t_dtype::DTYPE_TIME;
            }
        } else if (jstype == "string") {
            if (date_validator.call<val>("call", val::object(), x).as<bool>()) {
                t = t_dtype::DTYPE_TIME;
            } else {
                std::string lower = x.call<val>("toLowerCase").as<std::string>();
                if (lower == "true" || lower == "false") {
                    t = t_dtype::DTYPE_BOOL;
                } else {
                    t = t_dtype::DTYPE_STR;
                }
            }
        }

        return t;
    }

    t_dtype
    get_data_type(val data, std::int32_t format, const std::string& name, val date_validator) {
        std::int32_t i = 0;
        boost::optional<t_dtype> inferredType;

        if (format == 0) {
            // loop parameters differ slightly so rewrite the loop
            while (!inferredType.is_initialized() && i < 100
                && i < data["length"].as<std::int32_t>()) {
                if (data[i].call<val>("hasOwnProperty", name).as<bool>() == true) {
                    if (!data[i][name].isNull()) {
                        inferredType = infer_type(data[i][name], date_validator);
                    } else {
                        inferredType = t_dtype::DTYPE_STR;
                    }
                }

                i++;
            }
        } else if (format == 1) {
            while (!inferredType.is_initialized() && i < 100
                && i < data[name]["length"].as<std::int32_t>()) {
                if (!data[name][i].isNull()) {
                    inferredType = infer_type(data[name][i], date_validator);
                } else {
                    inferredType = t_dtype::DTYPE_STR;
                }

                i++;
            }
        }

        if (!inferredType.is_initialized()) {
            return t_dtype::DTYPE_STR;
        } else {
            return inferredType.get();
        }
    }

    std::vector<t_dtype>
    data_types(val data, std::int32_t format, const std::vector<std::string>& names,
        val date_validator) {
        if (names.size() == 0) {
            PSP_COMPLAIN_AND_ABORT("Cannot determine data types without column names!");
        }

        std::vector<t_dtype> types;

        if (format == 2) {
            val keys = val::global("Object").template call<val>("keys", data);
            std::vector<std::string> data_names = vecFromArray<val, std::string>(keys);

            for (const std::string& name : data_names) {
                std::string value = data[name].as<std::string>();
                t_dtype type;

                if (value == "integer") {
                    type = t_dtype::DTYPE_INT32;
                } else if (value == "float") {
                    type = t_dtype::DTYPE_FLOAT64;
                } else if (value == "string") {
                    type = t_dtype::DTYPE_STR;
                } else if (value == "boolean") {
                    type = t_dtype::DTYPE_BOOL;
                } else if (value == "datetime") {
                    type = t_dtype::DTYPE_TIME;
                } else if (value == "date") {
                    type = t_dtype::DTYPE_DATE;
                } else {
                    PSP_COMPLAIN_AND_ABORT(
                        "Unknown type '" + value + "' for key '" + name + "'");
                }

                types.push_back(type);
            }

            return types;
        } else {
            for (const std::string& name : names) {
                t_dtype type = get_data_type(data, format, name, date_validator);
                types.push_back(type);
            }
        }

        return types;
    }

    /**
     * Create a default gnode.
     *
     * Params
     * ------
     * j_colnames - a JS Array of column names.
     * j_dtypes - a JS Array of column types.
     *
     * Returns
     * -------
     * A gnode.
     */
    std::shared_ptr<t_gnode>
    make_gnode(const t_schema& iscm) {
        std::vector<std::string> ocolnames(iscm.columns());
        std::vector<t_dtype> odt(iscm.types());

        if (iscm.has_column("psp_pkey")) {
            t_uindex idx = iscm.get_colidx("psp_pkey");
            ocolnames.erase(ocolnames.begin() + idx);
            odt.erase(odt.begin() + idx);
        }

        if (iscm.has_column("psp_op")) {
            t_uindex idx = iscm.get_colidx("psp_op");
            ocolnames.erase(ocolnames.begin() + idx);
            odt.erase(odt.begin() + idx);
        }

        t_schema oscm(ocolnames, odt);

        // Create a gnode
        auto gnode = std::make_shared<t_gnode>(oscm, iscm);
        gnode->init();

        return gnode;
    }

    /**
     * Create a populated table.
     *
     * Params
     * ------
     * chunk - a JS object containing parsed data and associated metadata
     * offset
     * limit
     * index
     * is_delete - sets the table operation
     *
     * Returns
     * -------
     * a populated table.
     */
    template <>
    std::shared_ptr<t_gnode>
    make_table(t_pool* pool, val gnode, val accessor, val computed, std::uint32_t offset,
        std::uint32_t limit, std::string index, bool is_update, bool is_delete, bool is_arrow) {
        std::uint32_t size = accessor["row_count"].as<std::int32_t>();

        std::vector<std::string> colnames;
        std::vector<t_dtype> dtypes;

        // Determine metadata
        if (is_arrow || (is_update || is_delete)) {
            // TODO: fully remove intermediate passed-through JS arrays for non-arrow data
            val names = accessor["names"];
            val types = accessor["types"];
            colnames = vecFromArray<val, std::string>(names);
            dtypes = vecFromArray<val, t_dtype>(types);
        } else {
            // Infer names and types
            val data = accessor["data"];
            std::int32_t format = accessor["format"].as<std::int32_t>();
            colnames = column_names(data, format);
            dtypes = data_types(data, format, colnames, accessor["date_validator"]);
        }

        // Check if index is valid after getting column names
        bool valid_index = std::find(colnames.begin(), colnames.end(), index) != colnames.end();
        if (index != "" && !valid_index) {
            PSP_COMPLAIN_AND_ABORT("Specified index '" + index + "' does not exist in data.")
        }

        // Create the table
        // TODO assert size > 0
        t_table tbl(t_schema(colnames, dtypes));
        tbl.init();
        tbl.extend(size);

        bool is_new_gnode = gnode.isUndefined();
        std::shared_ptr<t_gnode> new_gnode;
        if (!is_new_gnode) {
            new_gnode = gnode.as<std::shared_ptr<t_gnode>>();
        }

        _fill_data(tbl, colnames, accessor, dtypes, offset, is_arrow,
            !(is_new_gnode || new_gnode->mapping_size() == 0));

        // Set up pkey and op columns
        if (is_delete) {
            auto op_col = tbl.add_column("psp_op", DTYPE_UINT8, false);
            op_col->raw_fill<std::uint8_t>(OP_DELETE);
        } else {
            auto op_col = tbl.add_column("psp_op", DTYPE_UINT8, false);
            op_col->raw_fill<std::uint8_t>(OP_INSERT);
        }

        if (index == "") {
            // If user doesn't specify an column to use as the pkey index, just use
            // row number
            auto key_col = tbl.add_column("psp_pkey", DTYPE_INT32, true);
            auto okey_col = tbl.add_column("psp_okey", DTYPE_INT32, true);

            for (auto ridx = 0; ridx < tbl.size(); ++ridx) {
                key_col->set_nth<std::int32_t>(ridx, (ridx + offset) % limit);
                okey_col->set_nth<std::int32_t>(ridx, (ridx + offset) % limit);
            }
        } else {
            tbl.clone_column(index, "psp_pkey");
            tbl.clone_column(index, "psp_okey");
        }

        if (!computed.isUndefined()) {
            table_add_computed_column(tbl, computed);
        }

        if (is_new_gnode) {
            new_gnode = make_gnode(tbl.get_schema());
            pool->register_gnode(new_gnode.get());
        }

        pool->send(new_gnode->get_id(), 0, tbl);
        pool->_process();

        return new_gnode;
    }

    /**
     * Copies the internal table from a gnode
     *
     * Params
     * ------
     *
     * Returns
     * -------
     * A gnode.
     */
    template <>
    std::shared_ptr<t_gnode>
    clone_gnode_table(t_pool* pool, std::shared_ptr<t_gnode> gnode, val computed) {
        t_table* tbl = gnode->_get_pkeyed_table();
        table_add_computed_column(*tbl, computed);
        std::shared_ptr<t_gnode> new_gnode = make_gnode(tbl->get_schema());
        pool->register_gnode(new_gnode.get());
        pool->send(new_gnode->get_id(), 0, *tbl);
        pool->_process();
        return new_gnode;
    }

    template <>
    t_config
    make_view_config(
        const t_schema& schema, std::string separator, val date_parser, val config) {
        val j_row_pivots = config["row_pivots"];
        val j_column_pivots = config["column_pivots"];
        val j_aggregates = config["aggregates"];
        val j_columns = config["columns"];
        val j_filter = config["filter"];
        val j_sort = config["sort"];

        std::vector<std::string> row_pivots;
        std::vector<std::string> column_pivots;
        std::vector<t_aggspec> aggregates;
        std::vector<std::string> aggregate_names;
        std::vector<std::string> columns;
        std::vector<t_fterm> filters;
        std::vector<val> sortbys;
        std::vector<t_sortspec> sorts;
        std::vector<t_sortspec> col_sorts;

        t_filter_op filter_op = t_filter_op::FILTER_OP_AND;

        if (hasValue(j_row_pivots)) {
            row_pivots = vecFromArray<val, std::string>(j_row_pivots);
        }

        if (hasValue(j_column_pivots)) {
            column_pivots = vecFromArray<val, std::string>(j_column_pivots);
        }

        bool column_only = false;

        if (row_pivots.size() == 0 && column_pivots.size() > 0) {
            row_pivots.push_back("psp_okey");
            column_only = true;
        }

        if (hasValue(j_sort)) {
            sortbys = vecFromArray<val, val>(j_sort);
        }

        columns = vecFromArray<val, std::string>(j_columns);
        aggregates = _get_aggspecs(
            schema, row_pivots, column_pivots, column_only, columns, sortbys, j_aggregates);
        aggregate_names = _get_aggregate_names(aggregates);

        if (hasValue(j_filter)) {
            filters = _get_fterms(schema, date_parser, j_filter);
            if (hasValue(config["filter_op"])) {
                filter_op = str_to_filter_op(config["filter_op"].as<std::string>());
            }
        }

        if (sortbys.size() > 0) {
            sorts = _get_sort(aggregate_names, false, sortbys);
            col_sorts = _get_sort(aggregate_names, true, sortbys);
        }

        auto view_config = t_config(row_pivots, column_pivots, aggregates, sorts, col_sorts,
            filter_op, filters, aggregate_names, column_only);

        return view_config;
    }

    /**
     * Creates a new View.
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     * A shared pointer to a View<CTX_T>.
     */
    template <>
    std::shared_ptr<View<t_ctx0>>
    make_view_zero(t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name,
        std::string separator, val config, val date_parser) {
        auto schema = gnode->get_tblschema();
        t_config view_config = make_view_config<val>(schema, separator, date_parser, config);

        auto col_names = view_config.get_column_names();
        auto filter_op = view_config.get_combiner();
        auto filters = view_config.get_fterms();
        auto sorts = view_config.get_sortspecs();
        auto ctx = make_context_zero(
            schema, filter_op, col_names, filters, sorts, pool, gnode, name);

        auto view_ptr
            = std::make_shared<View<t_ctx0>>(pool, ctx, gnode, name, separator, view_config);

        return view_ptr;
    }

    template <>
    std::shared_ptr<View<t_ctx1>>
    make_view_one(t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name,
        std::string separator, val config, val date_parser) {
        auto schema = gnode->get_tblschema();
        t_config view_config = make_view_config<val>(schema, separator, date_parser, config);

        auto aggregates = view_config.get_aggregates();
        auto row_pivots = view_config.get_row_pivots();
        auto filter_op = view_config.get_combiner();
        auto filters = view_config.get_fterms();
        auto sorts = view_config.get_sortspecs();

        std::int32_t pivot_depth = -1;
        if (hasValue(config["row_pivot_depth"])) {
            pivot_depth = config["row_pivot_depth"].as<std::int32_t>();
        }

        auto ctx = make_context_one(schema, row_pivots, filter_op, filters, aggregates, sorts,
            pivot_depth, pool, gnode, name);

        auto view_ptr
            = std::make_shared<View<t_ctx1>>(pool, ctx, gnode, name, separator, view_config);

        return view_ptr;
    }

    template <>
    std::shared_ptr<View<t_ctx2>>
    make_view_two(t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name,
        std::string separator, val config, val date_parser) {
        auto schema = gnode->get_tblschema();
        t_config view_config = make_view_config<val>(schema, separator, date_parser, config);

        bool column_only = view_config.is_column_only();
        auto column_names = view_config.get_column_names();
        auto row_pivots = view_config.get_row_pivots();
        auto column_pivots = view_config.get_column_pivots();
        auto aggregates = view_config.get_aggregates();
        auto filter_op = view_config.get_combiner();
        auto filters = view_config.get_fterms();
        auto sorts = view_config.get_sortspecs();
        auto col_sorts = view_config.get_col_sortspecs();

        std::int32_t rpivot_depth = -1;
        std::int32_t cpivot_depth = -1;

        if (hasValue(config["row_pivot_depth"])) {
            rpivot_depth = config["row_pivot_depth"].as<std::int32_t>();
        }

        if (hasValue(config["column_pivot_depth"])) {
            cpivot_depth = config["column_pivot_depth"].as<std::int32_t>();
        }

        auto ctx = make_context_two(schema, row_pivots, column_pivots, filter_op, filters,
            aggregates, sorts, col_sorts, rpivot_depth, cpivot_depth, column_only, pool, gnode,
            name);

        auto view_ptr
            = std::make_shared<View<t_ctx2>>(pool, ctx, gnode, name, separator, view_config);

        return view_ptr;
    }

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    std::shared_ptr<t_ctx0>
    make_context_zero(t_schema schema, t_filter_op combiner, std::vector<std::string> columns,
        std::vector<t_fterm> filters, std::vector<t_sortspec> sorts, t_pool* pool,
        std::shared_ptr<t_gnode> gnode, std::string name) {
        auto cfg = t_config(columns, combiner, filters);
        auto ctx0 = std::make_shared<t_ctx0>(schema, cfg);
        ctx0->init();
        ctx0->sort_by(sorts);
        pool->register_context(gnode->get_id(), name, ZERO_SIDED_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx0.get()));
        return ctx0;
    }

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    std::shared_ptr<t_ctx1>
    make_context_one(t_schema schema, std::vector<t_pivot> pivots, t_filter_op combiner,
        std::vector<t_fterm> filters, std::vector<t_aggspec> aggregates,
        std::vector<t_sortspec> sorts, std::int32_t pivot_depth, t_pool* pool,
        std::shared_ptr<t_gnode> gnode, std::string name) {
        auto cfg = t_config(pivots, aggregates, combiner, filters);
        auto ctx1 = std::make_shared<t_ctx1>(schema, cfg);

        ctx1->init();
        ctx1->sort_by(sorts);
        pool->register_context(gnode->get_id(), name, ONE_SIDED_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx1.get()));

        if (pivot_depth > -1) {
            ctx1->set_depth(pivot_depth - 1);
        } else {
            ctx1->set_depth(pivots.size());
        }

        return ctx1;
    }

    /**
     *
     *
     * Params
     * ------
     *
     *
     * Returns
     * -------
     *
     */
    std::shared_ptr<t_ctx2>
    make_context_two(t_schema schema, std::vector<t_pivot> rpivots,
        std::vector<t_pivot> cpivots, t_filter_op combiner, std::vector<t_fterm> filters,
        std::vector<t_aggspec> aggregates, std::vector<t_sortspec> sorts,
        std::vector<t_sortspec> col_sorts, std::int32_t rpivot_depth, std::int32_t cpivot_depth,
        bool column_only, t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name) {
        t_totals total = sorts.size() > 0 ? TOTALS_BEFORE : TOTALS_HIDDEN;

        auto cfg
            = t_config(rpivots, cpivots, aggregates, total, combiner, filters, column_only);
        auto ctx2 = std::make_shared<t_ctx2>(schema, cfg);

        ctx2->init();
        pool->register_context(gnode->get_id(), name, TWO_SIDED_CONTEXT,
            reinterpret_cast<std::uintptr_t>(ctx2.get()));

        if (rpivot_depth > -1) {
            ctx2->set_depth(t_header::HEADER_ROW, rpivot_depth - 1);
        } else {
            ctx2->set_depth(t_header::HEADER_ROW, rpivots.size());
        }

        if (cpivot_depth > -1) {
            ctx2->set_depth(t_header::HEADER_COLUMN, cpivot_depth - 1);
        } else {
            ctx2->set_depth(t_header::HEADER_COLUMN, cpivots.size());
        }

        if (sorts.size() > 0) {
            ctx2->sort_by(sorts);
        }

        if (col_sorts.size() > 0) {
            ctx2->column_sort_by(col_sorts);
        }

        return ctx2;
    }

    /******************************************************************************
     *
     * Data serialization
     */

    /**
     * @brief Get a slice of data for a single column, serialized to val.
     *
     * @tparam
     * @param table
     * @param colname
     * @return val
     */
    template <>
    val
    get_column_data(std::shared_ptr<t_table> table, std::string colname) {
        val arr = val::array();
        auto col = table->get_column(colname);
        for (auto idx = 0; idx < col->size(); ++idx) {
            arr.set(idx, scalar_to_val(col->get_scalar(idx)));
        }
        return arr;
    }

    /**
     * @brief Get the t_data_slice object, which contains an underlying slice of data and
     * metadata required to interact with it.
     *
     * @param view
     * @param start_row
     * @param end_row
     * @param start_col
     * @param end_col
     * @return val
     */
    template <typename CTX_T>
    std::shared_ptr<t_data_slice<CTX_T>>
    get_data_slice(std::shared_ptr<View<CTX_T>> view, std::uint32_t start_row,
        std::uint32_t end_row, std::uint32_t start_col, std::uint32_t end_col) {
        auto data_slice = view->get_data(start_row, end_row, start_col, end_col);
        return data_slice;
    }

    /**
     * @brief Retrieve a single value from the data slice and serialize it to an output
     * type that interfaces with the binding language.
     *
     * @param view
     * @param start_row
     * @param end_row
     * @param start_col
     * @param end_col
     * @return val
     */
    template <typename CTX_T>
    val
    get_from_data_slice(
        std::shared_ptr<t_data_slice<CTX_T>> data_slice, t_uindex ridx, t_uindex cidx) {
        auto d = data_slice->get(ridx, cidx);
        return scalar_to_val(d);
    }

} // end namespace binding
} // end namespace perspective

using namespace perspective::binding;

/**
 * Main
 */
int
main(int argc, char** argv) {
    // clang-format off
EM_ASM({

    if (typeof self !== "undefined") {
        if (self.dispatchEvent && !self._perspective_initialized && self.document) {
            self._perspective_initialized = true;
            var event = self.document.createEvent("Event");
            event.initEvent("perspective-ready", false, true);
            self.dispatchEvent(event);
        } else if (!self.document && self.postMessage) {
            self.postMessage({});
        }
    }

});
    // clang-format on
}

/******************************************************************************
 *
 * Embind
 */

EMSCRIPTEN_BINDINGS(perspective) {
    /******************************************************************************
     *
     * View
     */
    // Bind a View for each context type

    class_<View<t_ctx0>>("View_ctx0")
        .constructor<t_pool*, std::shared_ptr<t_ctx0>, std::shared_ptr<t_gnode>, std::string,
            std::string, t_config>()
        .smart_ptr<std::shared_ptr<View<t_ctx0>>>("shared_ptr<View_ctx0>")
        .function("sides", &View<t_ctx0>::sides)
        .function("num_rows", &View<t_ctx0>::num_rows)
        .function("num_columns", &View<t_ctx0>::num_columns)
        .function("get_row_expanded", &View<t_ctx0>::get_row_expanded)
        .function("schema", &View<t_ctx0>::schema)
        .function("column_names", &View<t_ctx0>::column_names)
        .function("_get_deltas_enabled", &View<t_ctx0>::_get_deltas_enabled)
        .function("_set_deltas_enabled", &View<t_ctx0>::_set_deltas_enabled)
        .function("get_context", &View<t_ctx0>::get_context, allow_raw_pointers())
        .function("get_row_pivots", &View<t_ctx0>::get_row_pivots)
        .function("get_column_pivots", &View<t_ctx0>::get_column_pivots)
        .function("get_aggregates", &View<t_ctx0>::get_aggregates)
        .function("get_filter", &View<t_ctx0>::get_filter)
        .function("get_sort", &View<t_ctx0>::get_sort)
        .function("get_step_delta", &View<t_ctx0>::get_step_delta)
        .function("get_row_delta", &View<t_ctx0>::get_row_delta)
        .function("is_column_only", &View<t_ctx0>::is_column_only);

    class_<View<t_ctx1>>("View_ctx1")
        .constructor<t_pool*, std::shared_ptr<t_ctx1>, std::shared_ptr<t_gnode>, std::string,
            std::string, t_config>()
        .smart_ptr<std::shared_ptr<View<t_ctx1>>>("shared_ptr<View_ctx1>")
        .function("sides", &View<t_ctx1>::sides)
        .function("num_rows", &View<t_ctx1>::num_rows)
        .function("num_columns", &View<t_ctx1>::num_columns)
        .function("get_row_expanded", &View<t_ctx1>::get_row_expanded)
        .function("expand", &View<t_ctx1>::expand)
        .function("collapse", &View<t_ctx1>::collapse)
        .function("set_depth", &View<t_ctx1>::set_depth)
        .function("schema", &View<t_ctx1>::schema)
        .function("column_names", &View<t_ctx1>::column_names)
        .function("_get_deltas_enabled", &View<t_ctx1>::_get_deltas_enabled)
        .function("_set_deltas_enabled", &View<t_ctx1>::_set_deltas_enabled)
        .function("get_context", &View<t_ctx1>::get_context, allow_raw_pointers())
        .function("get_row_pivots", &View<t_ctx1>::get_row_pivots)
        .function("get_column_pivots", &View<t_ctx1>::get_column_pivots)
        .function("get_aggregates", &View<t_ctx1>::get_aggregates)
        .function("get_filter", &View<t_ctx1>::get_filter)
        .function("get_sort", &View<t_ctx1>::get_sort)
        .function("get_step_delta", &View<t_ctx1>::get_step_delta)
        .function("get_row_delta", &View<t_ctx1>::get_row_delta)
        .function("is_column_only", &View<t_ctx1>::is_column_only);

    class_<View<t_ctx2>>("View_ctx2")
        .constructor<t_pool*, std::shared_ptr<t_ctx2>, std::shared_ptr<t_gnode>, std::string,
            std::string, t_config>()
        .smart_ptr<std::shared_ptr<View<t_ctx2>>>("shared_ptr<View_ctx2>")
        .function("sides", &View<t_ctx2>::sides)
        .function("num_rows", &View<t_ctx2>::num_rows)
        .function("num_columns", &View<t_ctx2>::num_columns)
        .function("get_row_expanded", &View<t_ctx2>::get_row_expanded)
        .function("expand", &View<t_ctx2>::expand)
        .function("collapse", &View<t_ctx2>::collapse)
        .function("set_depth", &View<t_ctx2>::set_depth)
        .function("schema", &View<t_ctx2>::schema)
        .function("column_names", &View<t_ctx2>::column_names)
        .function("_get_deltas_enabled", &View<t_ctx2>::_get_deltas_enabled)
        .function("_set_deltas_enabled", &View<t_ctx2>::_set_deltas_enabled)
        .function("get_context", &View<t_ctx2>::get_context, allow_raw_pointers())
        .function("get_row_pivots", &View<t_ctx2>::get_row_pivots)
        .function("get_column_pivots", &View<t_ctx2>::get_column_pivots)
        .function("get_aggregates", &View<t_ctx2>::get_aggregates)
        .function("get_filter", &View<t_ctx2>::get_filter)
        .function("get_sort", &View<t_ctx2>::get_sort)
        .function("get_row_path", &View<t_ctx2>::get_row_path)
        .function("get_step_delta", &View<t_ctx2>::get_step_delta)
        .function("get_row_delta", &View<t_ctx2>::get_row_delta)
        .function("is_column_only", &View<t_ctx2>::is_column_only);

    /******************************************************************************
     *
     * t_table
     */
    class_<t_table>("t_table")
        .smart_ptr<std::shared_ptr<t_table>>("shared_ptr<t_table>")
        .function<unsigned long>(
            "size", reinterpret_cast<unsigned long (t_table::*)() const>(&t_table::size));

    /******************************************************************************
     *
     * t_schema
     */
    class_<t_schema>("t_schema")
        .function<const std::vector<std::string>&>(
            "columns", &t_schema::columns, allow_raw_pointers())
        .function<const std::vector<t_dtype>>("types", &t_schema::types, allow_raw_pointers());

    /******************************************************************************
     *
     * t_gnode
     */
    class_<t_gnode>("t_gnode")
        .smart_ptr<std::shared_ptr<t_gnode>>("shared_ptr<t_gnode>")
        .function<t_uindex>(
            "get_id", reinterpret_cast<t_uindex (t_gnode::*)() const>(&t_gnode::get_id))
        .function<t_schema>("get_tblschema", &t_gnode::get_tblschema)
        .function<void>("reset", &t_gnode::reset)
        .function<t_table*>("get_table", &t_gnode::get_table, allow_raw_pointers());

    /******************************************************************************
     *
     * t_data_slice
     */
    class_<t_data_slice<t_ctx0>>("t_data_slice_ctx0")
        .smart_ptr<std::shared_ptr<t_data_slice<t_ctx0>>>("shared_ptr<t_data_slice<t_ctx0>>>")
        .function<const std::vector<std::vector<t_tscalar>>&>(
            "get_column_names", &t_data_slice<t_ctx0>::get_column_names);

    class_<t_data_slice<t_ctx1>>("t_data_slice_ctx1")
        .smart_ptr<std::shared_ptr<t_data_slice<t_ctx1>>>("shared_ptr<t_data_slice<t_ctx1>>>")
        .function<const std::vector<std::vector<t_tscalar>>&>(
            "get_column_names", &t_data_slice<t_ctx1>::get_column_names)
        .function<std::vector<t_tscalar>>("get_row_path", &t_data_slice<t_ctx1>::get_row_path);

    class_<t_data_slice<t_ctx2>>("t_data_slice_ctx2")
        .smart_ptr<std::shared_ptr<t_data_slice<t_ctx2>>>("shared_ptr<t_data_slice<t_ctx2>>>")
        .function<const std::vector<std::vector<t_tscalar>>&>(
            "get_column_names", &t_data_slice<t_ctx2>::get_column_names)
        .function<std::vector<t_tscalar>>("get_row_path", &t_data_slice<t_ctx2>::get_row_path);

    /******************************************************************************
     *
     * t_ctx0
     */
    class_<t_ctx0>("t_ctx0").smart_ptr<std::shared_ptr<t_ctx0>>("shared_ptr<t_ctx0>");

    /******************************************************************************
     *
     * t_ctx1
     */
    class_<t_ctx1>("t_ctx1").smart_ptr<std::shared_ptr<t_ctx1>>("shared_ptr<t_ctx1>");

    /******************************************************************************
     *
     * t_ctx2
     */
    class_<t_ctx2>("t_ctx2").smart_ptr<std::shared_ptr<t_ctx2>>("shared_ptr<t_ctx2>");

    /******************************************************************************
     *
     * t_pool
     */
    class_<t_pool>("t_pool")
        .constructor<>()
        .smart_ptr<std::shared_ptr<t_pool>>("shared_ptr<t_pool>")
        .function<void>("unregister_gnode", &t_pool::unregister_gnode)
        .function<void>("set_update_delegate", &t_pool::set_update_delegate);

    /******************************************************************************
     *
     * t_tscalar
     */
    class_<t_tscalar>("t_tscalar");

    /******************************************************************************
     *
     * t_updctx
     */
    value_object<t_updctx>("t_updctx")
        .field("gnode_id", &t_updctx::m_gnode_id)
        .field("ctx_name", &t_updctx::m_ctx);

    /******************************************************************************
     *
     * t_cellupd
     */
    value_object<t_cellupd>("t_cellupd")
        .field("row", &t_cellupd::row)
        .field("column", &t_cellupd::column)
        .field("old_value", &t_cellupd::old_value)
        .field("new_value", &t_cellupd::new_value);

    /******************************************************************************
     *
     * t_stepdelta
     */
    value_object<t_stepdelta>("t_stepdelta")
        .field("rows_changed", &t_stepdelta::rows_changed)
        .field("columns_changed", &t_stepdelta::columns_changed)
        .field("cells", &t_stepdelta::cells);

    /******************************************************************************
     *
     * t_rowdelta
     */
    value_object<t_rowdelta>("t_rowdelta")
        .field("rows_changed", &t_rowdelta::rows_changed)
        .field("rows", &t_rowdelta::rows);

    /******************************************************************************
     *
     * vector
     */
    register_vector<std::int32_t>("std::vector<std::int32_t>");
    register_vector<t_dtype>("std::vector<t_dtype>");
    register_vector<t_cellupd>("std::vector<t_cellupd>");
    register_vector<t_tscalar>("std::vector<t_tscalar>");
    register_vector<std::vector<t_tscalar>>("std::vector<std::vector<t_tscalar>>");
    register_vector<std::string>("std::vector<std::string>");
    register_vector<t_updctx>("std::vector<t_updctx>");
    register_vector<t_uindex>("std::vector<t_uindex>");

    /******************************************************************************
     *
     * map
     */
    register_map<std::string, std::string>("std::map<std::string, std::string>");

    /******************************************************************************
     *
     * t_dtype
     */
    enum_<t_dtype>("t_dtype")
        .value("DTYPE_NONE", DTYPE_NONE)
        .value("DTYPE_INT64", DTYPE_INT64)
        .value("DTYPE_INT32", DTYPE_INT32)
        .value("DTYPE_INT16", DTYPE_INT16)
        .value("DTYPE_INT8", DTYPE_INT8)
        .value("DTYPE_UINT64", DTYPE_UINT64)
        .value("DTYPE_UINT32", DTYPE_UINT32)
        .value("DTYPE_UINT16", DTYPE_UINT16)
        .value("DTYPE_UINT8", DTYPE_UINT8)
        .value("DTYPE_FLOAT64", DTYPE_FLOAT64)
        .value("DTYPE_FLOAT32", DTYPE_FLOAT32)
        .value("DTYPE_BOOL", DTYPE_BOOL)
        .value("DTYPE_TIME", DTYPE_TIME)
        .value("DTYPE_DATE", DTYPE_DATE)
        .value("DTYPE_ENUM", DTYPE_ENUM)
        .value("DTYPE_OID", DTYPE_OID)
        .value("DTYPE_PTR", DTYPE_PTR)
        .value("DTYPE_F64PAIR", DTYPE_F64PAIR)
        .value("DTYPE_USER_FIXED", DTYPE_USER_FIXED)
        .value("DTYPE_STR", DTYPE_STR)
        .value("DTYPE_USER_VLEN", DTYPE_USER_VLEN)
        .value("DTYPE_LAST_VLEN", DTYPE_LAST_VLEN)
        .value("DTYPE_LAST", DTYPE_LAST);

    /******************************************************************************
     *
     * assorted functions
     */
    function("make_table", &make_table<val>, allow_raw_pointers());
    function("clone_gnode_table", &clone_gnode_table<val>, allow_raw_pointers());
    function("scalar_vec_to_val", &scalar_vec_to_val);
    function("scalar_vec_to_string", &scalar_vec_to_string);
    function("table_add_computed_column", &table_add_computed_column<val>);
    function("col_to_js_typed_array_zero", &col_to_js_typed_array<t_ctx0>);
    function("col_to_js_typed_array_one", &col_to_js_typed_array<t_ctx1>);
    function("col_to_js_typed_array_two", &col_to_js_typed_array<t_ctx2>);
    function("make_view_zero", &make_view_zero<val>, allow_raw_pointers());
    function("make_view_one", &make_view_one<val>, allow_raw_pointers());
    function("make_view_two", &make_view_two<val>, allow_raw_pointers());
    function("get_data_slice_zero", &get_data_slice<t_ctx0>, allow_raw_pointers());
    function("get_from_data_slice_zero", &get_from_data_slice<t_ctx0>, allow_raw_pointers());
    function("get_data_slice_one", &get_data_slice<t_ctx1>, allow_raw_pointers());
    function("get_from_data_slice_one", &get_from_data_slice<t_ctx1>, allow_raw_pointers());
    function("get_data_slice_two", &get_data_slice<t_ctx2>, allow_raw_pointers());
    function("get_from_data_slice_two", &get_from_data_slice<t_ctx2>, allow_raw_pointers());
}