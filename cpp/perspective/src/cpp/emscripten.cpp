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
 * Data Loading
 */

template <>
std::vector<t_sortspec> _get_sort(val j_sortby) {
    std::vector<t_sortspec> svec{};
    std::vector<val> sortbys = vecFromArray<val, val>(j_sortby);
    for (auto idx = 0; idx < sortbys.size(); ++idx) {
        std::vector<std::int32_t> sortby = vecFromArray<val, std::int32_t>(sortbys[idx]);
        t_sorttype sorttype;
        switch (sortby[1]) {
            case 0:
                sorttype = SORTTYPE_ASCENDING;
                break;
            case 1:
                sorttype = SORTTYPE_DESCENDING;
                break;
            case 2:
                sorttype = SORTTYPE_NONE;
                break;
            case 3:
                sorttype = SORTTYPE_ASCENDING_ABS;
                break;
            case 4:
                sorttype = SORTTYPE_DESCENDING_ABS;
                break;
        }
        svec.push_back(t_sortspec(sortby[0], sorttype));
    }
    return svec;
}

/**
 * @brief specify sort parameters
 * 
 * @tparam T 
 * @param j_fterms 
 * @return std::vector<t_sortspec> 
 */
template <>
std::vector<t_sortspec> make_sort(val j_fterms) {
    std::vector<t_sortspec> svec{};
    return svec;
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
template <>
std::vector<t_fterm>
_get_fterms(t_schema schema, val j_filters) {
    std::vector<t_fterm> fvec{};
    std::vector<val> filters = vecFromArray<val, val>(j_filters);
    for (auto fidx = 0; fidx < filters.size(); ++fidx) {
        std::vector<val> filter = vecFromArray<val, val>(filters[fidx]);
        std::string coln = filter[0].as<std::string>();
        t_filter_op comp = filter[1].as<t_filter_op>();

        switch (comp) {
            case FILTER_OP_NOT_IN:
            case FILTER_OP_IN: {
                std::vector<t_tscalar> terms{};
                std::vector<std::string> j_terms = vecFromArray<val, std::string>(filter[2]);
                for (auto jidx = 0; jidx < j_terms.size(); ++jidx) {
                    terms.push_back(mktscalar(get_interned_cstr(j_terms[jidx].c_str())));
                }
                fvec.push_back(t_fterm(coln, comp, mktscalar(0), terms));
            } break;
            default: {
                t_tscalar term;
                switch (schema.get_dtype(coln)) {
                    case DTYPE_INT32:
                        term = mktscalar(filter[2].as<std::int32_t>());
                        break;
                    case DTYPE_INT64:
                    case DTYPE_FLOAT64:
                        term = mktscalar(filter[2].as<double>());
                        break;
                    case DTYPE_BOOL:
                        term = mktscalar(filter[2].as<bool>());
                        break;
                    case DTYPE_DATE:
                        term = mktscalar(t_date(filter[2].as<std::int32_t>()));
                        break;
                    case DTYPE_TIME:
                        term = mktscalar(t_time(static_cast<std::int64_t>(
                            filter[2].call<val>("getTime").as<double>())));
                        break;
                    default: {
                        term
                            = mktscalar(get_interned_cstr(filter[2].as<std::string>().c_str()));
                    }
                }

                fvec.push_back(t_fterm(coln, comp, term, std::vector<t_tscalar>()));
            }
        }
    }
    return fvec;
}

/**
 * @brief specify filter terms
 * 
 * @tparam T 
 * @param j_fterms 
 * @return std::vector<t_fterm> 
 */
template <>
std::vector<t_fterm> _make_fterms(val j_fterms) {
    std::vector<t_fterm> fvec{};
    return fvec;
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
std::vector<t_aggspec>
_get_aggspecs(val j_aggs) {
    std::vector<val> aggs = vecFromArray<val, val>(j_aggs);
    std::vector<t_aggspec> aggspecs;
    for (auto idx = 0; idx < aggs.size(); ++idx) {
        std::vector<val> agg_row = vecFromArray<val, val>(aggs[idx]);
        std::string name = agg_row[0].as<std::string>();
        t_aggtype aggtype = agg_row[1].as<t_aggtype>();

        std::vector<t_dep> dependencies;
        std::vector<val> deps = vecFromArray<val, val>(agg_row[2]);
        for (auto didx = 0; didx < deps.size(); ++didx) {
            if (deps[didx].isUndefined()) {
                continue;
            }
            std::string dep = deps[didx].as<std::string>();
            dependencies.push_back(t_dep(dep, DEPTYPE_COLUMN));
        }
        if (aggtype == AGGTYPE_FIRST || aggtype == AGGTYPE_LAST) {
            if (dependencies.size() == 1) {
                dependencies.push_back(t_dep("psp_pkey", DEPTYPE_COLUMN));
            }
            aggspecs.push_back(
                t_aggspec(name, name, aggtype, dependencies, SORTTYPE_ASCENDING));
        } else {
            aggspecs.push_back(t_aggspec(name, aggtype, dependencies));
        }
    }
    return aggspecs;
}

/**
 * @brief specify aggregations
 * 
 * @tparam T 
 * @param j_aggs 
 * @return std::vector<t_aggspec> 
 */
template <>
std::vector<t_aggspec> _make_aggspecs(val j_aggs) {
    std::vector<t_aggspec> aggspecs;
    return aggspecs;
}

// Date parsing
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
scalar_to_val(const t_tscalar& scalar) {
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
        case DTYPE_TIME:
        case DTYPE_FLOAT64:
        case DTYPE_FLOAT32: {
            return val(scalar.to_double());
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
    val Float32Array = val::global("Float32Array");
    val Float64Array = val::global("Float64Array");
} // namespace js_typed_array

// Given a column index, serialize data to TypedArray
template <typename T>
val
col_to_js_typed_array(T ctx, t_index idx) {
    std::vector<t_tscalar> data = ctx->get_data(0, ctx->get_row_count(), idx, idx + 1);
    auto dtype = ctx->get_column_dtype(idx);
    int data_size = data.size();
    val constructor = val::undefined();
    val sentinel = val::undefined();

    switch (dtype) {
        case DTYPE_INT8: {
            data_size *= sizeof(std::int8_t);
            sentinel = val(std::numeric_limits<std::int8_t>::lowest());
            constructor = js_typed_array::Int8Array;
        } break;
        case DTYPE_INT16: {
            data_size *= sizeof(std::int16_t);
            sentinel = val(std::numeric_limits<std::int16_t>::lowest());
            constructor = js_typed_array::Int16Array;
        } break;
        case DTYPE_INT32:
        case DTYPE_INT64: {
            // scalar_to_val converts int64 into int32
            data_size *= sizeof(std::int32_t);
            sentinel = val(std::numeric_limits<std::int32_t>::lowest());
            constructor = js_typed_array::Int32Array;
        } break;
        case DTYPE_FLOAT32: {
            data_size *= sizeof(float);
            sentinel = val(std::numeric_limits<float>::lowest());
            constructor = js_typed_array::Float32Array;
        } break;
        case DTYPE_TIME:
        case DTYPE_FLOAT64: {
            sentinel = val(std::numeric_limits<double>::lowest());
            data_size *= sizeof(double);
            constructor = js_typed_array::Float64Array;
        } break;
        default:
            return constructor;
    }

    val buffer = js_typed_array::ArrayBuffer.new_(data_size);
    val arr = constructor.new_(buffer);

    for (int idx = 0; idx < data.size(); idx++) {
        t_tscalar scalar = data[idx];
        if (scalar.get_dtype() == DTYPE_NONE) {
            arr.call<void>("fill", sentinel, idx, idx + 1);
        } else {
            arr.call<void>("fill", scalar_to_val(scalar), idx, idx + 1);
        }
    }

    return arr;
}

void
_fill_col_int64(val accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow) {
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
    std::int32_t cidx, t_dtype type, bool is_arrow) {
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
                col->unset(i);
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
    std::int32_t cidx, t_dtype type, bool is_arrow) {
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
                col->unset(i);
                continue;
            }

            col->set_nth(i, jsdate_to_t_date(item));
        }
    }
}

void
_fill_col_bool(val accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // arrow packs bools into a bitmap
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
                col->unset(i);
                continue;
            }

            auto elem = item.as<bool>();
            col->set_nth(i, elem);
        }
    }
}

void
_fill_col_string(val accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow) {

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
                col->unset(i);
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
    std::string name, std::int32_t cidx, t_dtype type, bool is_arrow) {
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
                col->unset(i);
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
                        _fill_col_string(accessor, col, name, cidx, DTYPE_STR, is_arrow);
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
    std::vector<t_dtype> odt, std::uint32_t offset, bool is_arrow) {

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
                _fill_col_int64(dcol, col, name, cidx, col_type, is_arrow);
            } break;
            case DTYPE_BOOL: {
                _fill_col_bool(dcol, col, name, cidx, col_type, is_arrow);
            } break;
            case DTYPE_DATE: {
                _fill_col_date(dcol, col, name, cidx, col_type, is_arrow);
            } break;
            case DTYPE_TIME: {
                _fill_col_time(dcol, col, name, cidx, col_type, is_arrow);
            } break;
            case DTYPE_STR: {
                _fill_col_string(dcol, col, name, cidx, col_type, is_arrow);
            } break;
            case DTYPE_NONE: {
                break;
            }
            default:
                _fill_col_numeric(dcol, tbl, col, name, cidx, col_type, is_arrow);
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
make_gnode(const t_table& table) {
    auto iscm = table.get_schema();

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

    _fill_data(tbl, colnames, accessor, dtypes, offset, is_arrow);

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

    std::shared_ptr<t_gnode> new_gnode;

    if (gnode.isUndefined()) {
        new_gnode = make_gnode(tbl);
        pool->register_gnode(new_gnode.get());
    } else {
        new_gnode = gnode.as<std::shared_ptr<t_gnode>>();
    }

    if (!computed.isUndefined()) {
        table_add_computed_column(tbl, computed);
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
    std::shared_ptr<t_gnode> new_gnode = make_gnode(*tbl);
    pool->register_gnode(new_gnode.get());
    pool->send(new_gnode->get_id(), 0, *tbl);
    pool->_process();
    return new_gnode;
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
std::shared_ptr<t_gnode> new_gnode = make_gnode(*tbl);
pool->register_gnode(new_gnode.get());
pool->send(new_gnode->get_id(), 0, *tbl);
pool->_process();
return new_gnode;
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
template <typename CTX_T>
std::shared_ptr<View<CTX_T>>
make_view(t_pool* pool, std::shared_ptr<CTX_T> ctx, std::int32_t sides,
std::shared_ptr<t_gnode> gnode, std::string name, std::string separator, val config) {
val js_row_pivot = config["row_pivot"];
val js_column_pivot = config["column_pivot"];
val js_aggregate = config["aggregate"];
val js_filter = config["filter"];
val js_sort = config["sort"];

std::vector<std::string> row_pivot;
std::vector<std::string> column_pivot;
std::vector<std::pair<std::vector<std::string>, std::string> > aggregate;
std::vector<std::vector<std::string> > filter;
std::vector<std::vector<std::string> > sort;

if (!js_row_pivot.isUndefined()) {
    row_pivot = vecFromArray<val, std::string>(js_row_pivot);
} 

if (!js_column_pivot.isUndefined()) {
    column_pivot = vecFromArray<val, std::string>(js_column_pivot);
}

if (!js_aggregate.isUndefined()) {
    std::int32_t agg_length = js_aggregate["length"].as<std::int32_t>();
    
    for (auto i = 0; i < agg_length; ++i) {
        std::vector<std::string> agg;

        val current_aggregate = js_aggregate[i];
        val col = current_aggregate["column"];

        // TODO: make the API for aggregate configs clearer
        if (col.typeOf().as<std::string>() == "string") {
            agg.push_back(col.as<std::string>());
        } else {
            agg.push_back(col[0].as<std::string>());
        }

        std::string op = current_aggregate["op"].as<std::string>();

        auto parsed_agg = std::make_pair(agg, op); 
        aggregate.push_back(parsed_agg);
    }
}

if (!js_filter.isUndefined()) {
    std::int32_t filter_length = js_filter["length"].as<std::int32_t>();

    for (auto i = 0; i < filter_length; ++i) {
        val current_filter = js_filter[i];
        std::vector<std::string> filt;

        for (auto idx = 0; idx < current_filter["length"].as<std::int32_t>(); ++idx) {
            val item = current_filter[idx];
            std::string item_type = item.typeOf().as<std::string>();
            std::stringstream ss;
            
            // FIXME: streamline this a bit
            if (item_type == "number") {
                ss << item.as<double>();
            } else if (item_type == "boolean") {
                ss << item.as<bool>();
            } else if (!item.isNull() && !item.isUndefined() && item_type == "object" && !item.call<val>("toString").isUndefined()) {
                // FIXME: lol
                ss << item.call<val>("toString").as<std::string>();
            } else {
                // FIXME: implement properly
                ss << "";
            }

            filt.push_back(ss.str());
        }
        
        filter.push_back(filt);
    }
} 

if (!js_sort.isUndefined()) {
    std::int32_t sort_length = js_sort["length"].as<std::int32_t>();

    for (auto i = 0; i < sort_length; ++i) {
        val current_sort = js_sort[i];
        sort.push_back(vecFromArray<val, std::string>(current_sort));
    }
}

auto view_ptr = std::make_shared<View<CTX_T> >(pool, ctx, sides, gnode, name, separator, row_pivot, column_pivot, aggregate, filter, sort);
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
template <>
std::shared_ptr<t_ctx0>
make_context_zero(t_schema schema, t_filter_op combiner, val j_filters, val j_columns,
val j_sortby, t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name) {
auto columns = vecFromArray<val, std::string>(j_columns);
auto fvec = _get_fterms(schema, j_filters);
auto svec = _get_sort(j_sortby);
auto cfg = t_config(columns, combiner, fvec);
auto ctx0 = std::make_shared<t_ctx0>(schema, cfg);
ctx0->init();
ctx0->sort_by(svec);
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
template <>
std::shared_ptr<t_ctx0>
make_context_zero(t_schema schema, t_filter_op combiner, val j_filters, val j_columns,
    val j_sortby, t_pool* pool, std::shared_ptr<t_gnode> gnode, std::string name) {
    auto columns = vecFromArray<val, std::string>(j_columns);
    auto fvec = _get_fterms(schema, j_filters);
    auto svec = _get_sort(j_sortby);
    auto cfg = t_config(columns, combiner, fvec);
    auto ctx0 = std::make_shared<t_ctx0>(schema, cfg);
    ctx0->init();
    ctx0->sort_by(svec);
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
template <>
std::shared_ptr<t_ctx1>
make_context_one(t_schema schema, val j_pivots, t_filter_op combiner, val j_filters,
    val j_aggs, val j_sortby, t_pool* pool, std::shared_ptr<t_gnode> gnode,
    std::string name) {
    auto fvec = _get_fterms(schema, j_filters);
    auto aggspecs = _get_aggspecs(j_aggs);
    auto pivots = vecFromArray<val, std::string>(j_pivots);
    auto svec = _get_sort(j_sortby);

    auto cfg = t_config(pivots, aggspecs, combiner, fvec);
    auto ctx1 = std::make_shared<t_ctx1>(schema, cfg);

    ctx1->init();
    ctx1->sort_by(svec);
    pool->register_context(gnode->get_id(), name, ONE_SIDED_CONTEXT,
        reinterpret_cast<std::uintptr_t>(ctx1.get()));
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
template <>
std::shared_ptr<t_ctx2>
make_context_two(t_schema schema, val j_rpivots, val j_cpivots, t_filter_op combiner,
    val j_filters, val j_aggs, bool show_totals, t_pool* pool,
    std::shared_ptr<t_gnode> gnode, std::string name) {
    auto fvec = _get_fterms(schema, j_filters);
    auto aggspecs = _get_aggspecs(j_aggs);
    auto rpivots = vecFromArray<val, std::string>(j_rpivots);
    auto cpivots = vecFromArray<val, std::string>(j_cpivots);
    t_totals total = show_totals ? TOTALS_BEFORE : TOTALS_HIDDEN;

    auto cfg = t_config(rpivots, cpivots, aggspecs, total, combiner, fvec);
    auto ctx2 = std::make_shared<t_ctx2>(schema, cfg);

    ctx2->init();
    pool->register_context(gnode->get_id(), name, TWO_SIDED_CONTEXT,
        reinterpret_cast<std::uintptr_t>(ctx2.get()));
    return ctx2;
}

template <>
void
sort(std::shared_ptr<t_ctx2> ctx2, val j_sortby, val j_column_sortby) {
    auto svec = _get_sort(j_sortby);
    if (svec.size() > 0) {
        ctx2->sort_by(svec);
    }
    ctx2->column_sort_by(_get_sort(j_column_sortby));
}

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
template <typename T>
val
get_data(T ctx, std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
    std::uint32_t end_col) {
    auto slice = ctx->get_data(start_row, end_row, start_col, end_col);
    val arr = val::array();
    for (auto idx = 0; idx < slice.size(); ++idx) {
        arr.set(idx, scalar_to_val(slice[idx]));
    }
    return arr;
}

template <>
val
get_data_two_skip_headers(std::shared_ptr<t_ctx2> ctx, std::uint32_t depth,
    std::uint32_t start_row, std::uint32_t end_row, std::uint32_t start_col,
    std::uint32_t end_col) {
    auto col_length = ctx->unity_get_column_count();
    std::vector<t_uindex> col_nums;
    col_nums.push_back(0);
    for (t_uindex i = 0; i < col_length; ++i) {
        if (ctx->unity_get_column_path(i + 1).size() == depth) {
            col_nums.push_back(i + 1);
        }
    }
    col_nums = std::vector<t_uindex>(col_nums.begin() + start_col,
        col_nums.begin() + std::min(end_col, (std::uint32_t)col_nums.size()));
    auto slice = ctx->get_data(start_row, end_row, col_nums.front(), col_nums.back() + 1);
    val arr = val::array();
    t_uindex i = 0;
    auto iter = slice.begin();
    while (iter != slice.end()) {
        t_uindex prev = col_nums.front();
        for (auto idx = col_nums.begin(); idx != col_nums.end(); idx++, i++) {
            t_uindex col_num = *idx;
            iter += col_num - prev;
            prev = col_num;
            arr.set(i, scalar_to_val(*iter));
        }
        if (iter != slice.end())
            iter++;
    }
    return arr;
}

} // end namespace binding
} // end namespace perspective

using namespace perspective::binding;

/**
 * Main
 */
int
main(int argc, char** argv) {
std::cout << "Perspective initialized successfully" << std::endl;

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
<<<<<<< master
    /******************************************************************************
     *
     * View
     */
    // Bind a View for each context type

    class_<View<t_ctx0>>("View_ctx0")
        .constructor<t_pool*, std::shared_ptr<t_ctx0>, std::int32_t, std::shared_ptr<t_gnode>,
            std::string, std::string>()
        .smart_ptr<std::shared_ptr<View<t_ctx0>>>("shared_ptr<View_ctx0>")
        .function("delete_view", &View<t_ctx0>::delete_view)
        .function("num_rows", &View<t_ctx0>::num_rows)
        .function("num_columns", &View<t_ctx0>::num_columns)
        .function("get_row_expanded", &View<t_ctx0>::get_row_expanded)
        .function("schema", &View<t_ctx0>::schema)
        .function("_column_names", &View<t_ctx0>::_column_names);

    class_<View<t_ctx1>>("View_ctx1")
        .constructor<t_pool*, std::shared_ptr<t_ctx1>, std::int32_t, std::shared_ptr<t_gnode>,
            std::string, std::string>()
        .smart_ptr<std::shared_ptr<View<t_ctx1>>>("shared_ptr<View_ctx1>")
        .function("delete_view", &View<t_ctx1>::delete_view)
        .function("num_rows", &View<t_ctx1>::num_rows)
        .function("num_columns", &View<t_ctx1>::num_columns)
        .function("get_row_expanded", &View<t_ctx1>::get_row_expanded)
        .function("expand", &View<t_ctx1>::expand)
        .function("collapse", &View<t_ctx1>::collapse)
        .function("set_depth", &View<t_ctx1>::set_depth)
        .function("schema", &View<t_ctx1>::schema)
        .function("_column_names", &View<t_ctx1>::_column_names);

    class_<View<t_ctx2>>("View_ctx2")
        .constructor<t_pool*, std::shared_ptr<t_ctx2>, std::int32_t, std::shared_ptr<t_gnode>,
            std::string, std::string>()
        .smart_ptr<std::shared_ptr<View<t_ctx2>>>("shared_ptr<View_ctx2>")
        .function("delete_view", &View<t_ctx2>::delete_view)
        .function("num_rows", &View<t_ctx2>::num_rows)
        .function("num_columns", &View<t_ctx2>::num_columns)
        .function("get_row_expanded", &View<t_ctx2>::get_row_expanded)
        .function("expand", &View<t_ctx2>::expand)
        .function("collapse", &View<t_ctx2>::collapse)
        .function("set_depth", &View<t_ctx2>::set_depth)
        .function("schema", &View<t_ctx2>::schema)
        .function("_column_names", &View<t_ctx2>::_column_names);

    /******************************************************************************
     *
     * t_column
     */
    class_<t_column>("t_column")
        .smart_ptr<std::shared_ptr<t_column>>("shared_ptr<t_column>")
        .function<void>("set_scalar", &t_column::set_scalar);

    /******************************************************************************
     *
     * t_table
     */
    class_<t_table>("t_table")
        .constructor<t_schema, t_uindex>()
        .smart_ptr<std::shared_ptr<t_table>>("shared_ptr<t_table>")
        .function<t_column*>("add_column", &t_table::add_column, allow_raw_pointers())
        .function<void>("pprint", &t_table::pprint)
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
        .constructor<t_gnode_processing_mode, const t_schema&, const std::vector<t_schema>&,
            const std::vector<t_schema>&, const std::vector<t_custom_column>&>()
        .smart_ptr<std::shared_ptr<t_gnode>>("shared_ptr<t_gnode>")
        .function<t_uindex>(
            "get_id", reinterpret_cast<t_uindex (t_gnode::*)() const>(&t_gnode::get_id))
        .function<t_schema>("get_tblschema", &t_gnode::get_tblschema)
        .function<void>("reset", &t_gnode::reset)
        .function<t_table*>("get_table", &t_gnode::get_table, allow_raw_pointers());

    /******************************************************************************
     *
     * t_ctx0
     */
    class_<t_ctx0>("t_ctx0")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx0>>("shared_ptr<t_ctx0>")
        .function<t_index>("sidedness", &t_ctx0::sidedness)
        .function<unsigned long>("get_row_count",
            reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_row_count))
        .function<unsigned long>("get_column_count",
            reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_column_count))
        .function<std::vector<t_tscalar>>("get_data", &t_ctx0::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx0::get_step_delta)
        .function<std::vector<t_cellupd>>("get_cell_delta", &t_ctx0::get_cell_delta)
        .function<std::vector<std::string>>("get_column_names", &t_ctx0::get_column_names)
        // .function<std::vector<t_minmax>>("get_min_max", &t_ctx0::get_min_max)
        // .function<void>("set_minmax_enabled", &t_ctx0::set_minmax_enabled)
        .function<std::vector<t_tscalar>>("unity_get_row_data", &t_ctx0::unity_get_row_data)
        .function<std::vector<t_tscalar>>(
            "unity_get_column_data", &t_ctx0::unity_get_column_data)
        .function<std::vector<t_tscalar>>("unity_get_row_path", &t_ctx0::unity_get_row_path)
        .function<std::vector<t_tscalar>>(
            "unity_get_column_path", &t_ctx0::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx0::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx0::unity_get_column_depth)
        .function<std::string>("unity_get_column_name", &t_ctx0::unity_get_column_name)
        .function<std::string>(
            "unity_get_column_display_name", &t_ctx0::unity_get_column_display_name)
        .function<std::vector<std::string>>(
            "unity_get_column_names", &t_ctx0::unity_get_column_names)
        .function<std::vector<std::string>>(
            "unity_get_column_display_names", &t_ctx0::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx0::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx0::unity_get_row_count)
        .function<bool>("unity_get_row_expanded", &t_ctx0::unity_get_row_expanded)
        .function<bool>("unity_get_column_expanded", &t_ctx0::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx0::unity_init_load_step_end);

    /******************************************************************************
     *
     * t_ctx1
     */
    class_<t_ctx1>("t_ctx1")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx1>>("shared_ptr<t_ctx1>")
        .function<t_index>("sidedness", &t_ctx1::sidedness)
        .function<unsigned long>("get_row_count",
            reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_row_count))
        .function<unsigned long>("get_column_count",
            reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_column_count))
        .function<std::vector<t_tscalar>>("get_data", &t_ctx1::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx1::get_step_delta)
        .function<std::vector<t_cellupd>>("get_cell_delta", &t_ctx1::get_cell_delta)
        .function<void>("set_depth", &t_ctx1::set_depth)
        .function("open", select_overload<t_index(t_index)>(&t_ctx1::open))
        .function("close", select_overload<t_index(t_index)>(&t_ctx1::close))
        .function<t_depth>("get_trav_depth", &t_ctx1::get_trav_depth)
        .function<std::vector<t_aggspec>>("get_column_names", &t_ctx1::get_aggregates)
        .function<std::vector<t_tscalar>>("unity_get_row_data", &t_ctx1::unity_get_row_data)
        .function<std::vector<t_tscalar>>(
            "unity_get_column_data", &t_ctx1::unity_get_column_data)
        .function<std::vector<t_tscalar>>("unity_get_row_path", &t_ctx1::unity_get_row_path)
        .function<std::vector<t_tscalar>>(
            "unity_get_column_path", &t_ctx1::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx1::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx1::unity_get_column_depth)
        .function<std::string>("unity_get_column_name", &t_ctx1::unity_get_column_name)
        .function<std::string>(
            "unity_get_column_display_name", &t_ctx1::unity_get_column_display_name)
        .function<std::vector<std::string>>(
            "unity_get_column_names", &t_ctx1::unity_get_column_names)
        .function<std::vector<std::string>>(
            "unity_get_column_display_names", &t_ctx1::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx1::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx1::unity_get_row_count)
        .function<bool>("unity_get_row_expanded", &t_ctx1::unity_get_row_expanded)
        .function<bool>("unity_get_column_expanded", &t_ctx1::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx1::unity_init_load_step_end);

    /******************************************************************************
     *
     * t_ctx2
     */
    class_<t_ctx2>("t_ctx2")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx2>>("shared_ptr<t_ctx2>")
        .function<t_index>("sidedness", &t_ctx2::sidedness)
        .function<unsigned long>("get_row_count",
            reinterpret_cast<unsigned long (t_ctx2::*)() const>(
                select_overload<t_index() const>(&t_ctx2::get_row_count)))
        .function<unsigned long>("get_column_count",
            reinterpret_cast<unsigned long (t_ctx2::*)() const>(&t_ctx2::get_column_count))
        .function<std::vector<t_tscalar>>("get_data", &t_ctx2::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx2::get_step_delta)
        //.function<std::vector<t_cellupd>>("get_cell_delta", &t_ctx2::get_cell_delta)
        .function<void>("set_depth", &t_ctx2::set_depth)
        .function("open", select_overload<t_index(t_header, t_index)>(&t_ctx2::open))
        .function("close", select_overload<t_index(t_header, t_index)>(&t_ctx2::close))
        .function<std::vector<t_aggspec>>("get_column_names", &t_ctx2::get_aggregates)
        .function<std::vector<t_tscalar>>("unity_get_row_data", &t_ctx2::unity_get_row_data)
        .function<std::vector<t_tscalar>>(
            "unity_get_column_data", &t_ctx2::unity_get_column_data)
        .function<std::vector<t_tscalar>>("unity_get_row_path", &t_ctx2::unity_get_row_path)
        .function<std::vector<t_tscalar>>(
            "unity_get_column_path", &t_ctx2::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx2::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx2::unity_get_column_depth)
        .function<std::string>("unity_get_column_name", &t_ctx2::unity_get_column_name)
        .function<std::string>(
            "unity_get_column_display_name", &t_ctx2::unity_get_column_display_name)
        .function<std::vector<std::string>>(
            "unity_get_column_names", &t_ctx2::unity_get_column_names)
        .function<std::vector<std::string>>(
            "unity_get_column_display_names", &t_ctx2::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx2::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx2::unity_get_row_count)
        .function<bool>("unity_get_row_expanded", &t_ctx2::unity_get_row_expanded)
        .function<bool>("unity_get_column_expanded", &t_ctx2::unity_get_column_expanded)
        .function<t_totals>("get_totals", &t_ctx2::get_totals)
        .function<std::vector<t_tscalar>>(
            "get_column_path_userspace", &t_ctx2::get_column_path_userspace)
        .function<void>("unity_init_load_step_end", &t_ctx2::unity_init_load_step_end);

    /******************************************************************************
     *
     * t_pool
     */
    class_<t_pool>("t_pool")
        .constructor<>()
        .smart_ptr<std::shared_ptr<t_pool>>("shared_ptr<t_pool>")
        .function<unsigned int>("register_gnode", &t_pool::register_gnode, allow_raw_pointers())
        .function<void>("process", &t_pool::_process)
        .function<void>("send", &t_pool::send)
        .function<t_uindex>("epoch", &t_pool::epoch)
        .function<void>("unregister_gnode", &t_pool::unregister_gnode)
        .function<void>("set_update_delegate", &t_pool::set_update_delegate)
        .function<void>("register_context", &t_pool::register_context)
        .function<void>("unregister_context", &t_pool::unregister_context)
        .function<std::vector<t_updctx>>(
            "get_contexts_last_updated", &t_pool::get_contexts_last_updated)
        .function<std::vector<t_uindex>>(
            "get_gnodes_last_updated", &t_pool::get_gnodes_last_updated)
        .function<t_gnode*>("get_gnode", &t_pool::get_gnode, allow_raw_pointers());

    /******************************************************************************
     *
     * t_aggspec
     */
    class_<t_aggspec>("t_aggspec").function<std::string>("name", &t_aggspec::name);

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
     * vector
     */
    register_vector<t_dtype>("std::vector<t_dtype>");
    register_vector<t_cellupd>("std::vector<t_cellupd>");
    register_vector<t_aggspec>("std::vector<t_aggspec>");
    register_vector<t_tscalar>("std::vector<t_tscalar>");
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
     * t_header
     */
    enum_<t_header>("t_header")
        .value("HEADER_ROW", HEADER_ROW)
        .value("HEADER_COLUMN", HEADER_COLUMN);

    /******************************************************************************
     *
     * t_ctx_type
     */
    enum_<t_ctx_type>("t_ctx_type")
        .value("ZERO_SIDED_CONTEXT", ZERO_SIDED_CONTEXT)
        .value("ONE_SIDED_CONTEXT", ONE_SIDED_CONTEXT)
        .value("TWO_SIDED_CONTEXT", TWO_SIDED_CONTEXT)
        .value("GROUPED_ZERO_SIDED_CONTEXT", GROUPED_ZERO_SIDED_CONTEXT)
        .value("GROUPED_PKEY_CONTEXT", GROUPED_PKEY_CONTEXT)
        .value("GROUPED_COLUMNS_CONTEXT", GROUPED_COLUMNS_CONTEXT);

    /******************************************************************************
     *
     * t_filter_op
     */
    enum_<t_filter_op>("t_filter_op")
        .value("FILTER_OP_LT", FILTER_OP_LT)
        .value("FILTER_OP_LTEQ", FILTER_OP_LTEQ)
        .value("FILTER_OP_GT", FILTER_OP_GT)
        .value("FILTER_OP_GTEQ", FILTER_OP_GTEQ)
        .value("FILTER_OP_EQ", FILTER_OP_EQ)
        .value("FILTER_OP_NE", FILTER_OP_NE)
        .value("FILTER_OP_BEGINS_WITH", FILTER_OP_BEGINS_WITH)
        .value("FILTER_OP_ENDS_WITH", FILTER_OP_ENDS_WITH)
        .value("FILTER_OP_CONTAINS", FILTER_OP_CONTAINS)
        .value("FILTER_OP_OR", FILTER_OP_OR)
        .value("FILTER_OP_IN", FILTER_OP_IN)
        .value("FILTER_OP_NOT_IN", FILTER_OP_NOT_IN)
        .value("FILTER_OP_AND", FILTER_OP_AND)
        .value("FILTER_OP_IS_NAN", FILTER_OP_IS_NAN)
        .value("FILTER_OP_IS_NOT_NAN", FILTER_OP_IS_NOT_NAN)
        .value("FILTER_OP_IS_VALID", FILTER_OP_IS_VALID)
        .value("FILTER_OP_IS_NOT_VALID", FILTER_OP_IS_NOT_VALID);

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
     * t_aggtype
     */
    enum_<t_aggtype>("t_aggtype")
        .value("AGGTYPE_SUM", AGGTYPE_SUM)
        .value("AGGTYPE_MUL", AGGTYPE_MUL)
        .value("AGGTYPE_COUNT", AGGTYPE_COUNT)
        .value("AGGTYPE_MEAN", AGGTYPE_MEAN)
        .value("AGGTYPE_WEIGHTED_MEAN", AGGTYPE_WEIGHTED_MEAN)
        .value("AGGTYPE_UNIQUE", AGGTYPE_UNIQUE)
        .value("AGGTYPE_ANY", AGGTYPE_ANY)
        .value("AGGTYPE_MEDIAN", AGGTYPE_MEDIAN)
        .value("AGGTYPE_JOIN", AGGTYPE_JOIN)
        .value("AGGTYPE_SCALED_DIV", AGGTYPE_SCALED_DIV)
        .value("AGGTYPE_SCALED_ADD", AGGTYPE_SCALED_ADD)
        .value("AGGTYPE_SCALED_MUL", AGGTYPE_SCALED_MUL)
        .value("AGGTYPE_DOMINANT", AGGTYPE_DOMINANT)
        .value("AGGTYPE_FIRST", AGGTYPE_FIRST)
        .value("AGGTYPE_LAST", AGGTYPE_LAST)
        .value("AGGTYPE_PY_AGG", AGGTYPE_PY_AGG)
        .value("AGGTYPE_AND", AGGTYPE_AND)
        .value("AGGTYPE_OR", AGGTYPE_OR)
        .value("AGGTYPE_LAST_VALUE", AGGTYPE_LAST_VALUE)
        .value("AGGTYPE_HIGH_WATER_MARK", AGGTYPE_HIGH_WATER_MARK)
        .value("AGGTYPE_LOW_WATER_MARK", AGGTYPE_LOW_WATER_MARK)
        .value("AGGTYPE_UDF_COMBINER", AGGTYPE_UDF_COMBINER)
        .value("AGGTYPE_UDF_REDUCER", AGGTYPE_UDF_REDUCER)
        .value("AGGTYPE_SUM_ABS", AGGTYPE_SUM_ABS)
        .value("AGGTYPE_SUM_NOT_NULL", AGGTYPE_SUM_NOT_NULL)
        .value("AGGTYPE_MEAN_BY_COUNT", AGGTYPE_MEAN_BY_COUNT)
        .value("AGGTYPE_IDENTITY", AGGTYPE_IDENTITY)
        .value("AGGTYPE_DISTINCT_COUNT", AGGTYPE_DISTINCT_COUNT)
        .value("AGGTYPE_DISTINCT_LEAF", AGGTYPE_DISTINCT_LEAF)
        .value("AGGTYPE_PCT_SUM_PARENT", AGGTYPE_PCT_SUM_PARENT)
        .value("AGGTYPE_PCT_SUM_GRAND_TOTAL", AGGTYPE_PCT_SUM_GRAND_TOTAL);

    /******************************************************************************
     *
     * t_totals
     */
    enum_<t_totals>("t_totals")
        .value("TOTALS_BEFORE", TOTALS_BEFORE)
        .value("TOTALS_HIDDEN", TOTALS_HIDDEN)
        .value("TOTALS_AFTER", TOTALS_AFTER);

    /******************************************************************************
     *
     * assorted functions
     */
    function("sort", &sort<val>);
    function("make_table", &make_table<val>, allow_raw_pointers());
    function("make_gnode", &make_gnode);
    function("clone_gnode_table", &clone_gnode_table<val>, allow_raw_pointers());
    function("make_context_zero", &make_context_zero<val>, allow_raw_pointers());
    function("make_context_one", &make_context_one<val>, allow_raw_pointers());
    function("make_context_two", &make_context_two<val>, allow_raw_pointers());
    function("scalar_to_val", &scalar_to_val);
    function("scalar_vec_to_val", &scalar_vec_to_val);
    function("table_add_computed_column", &table_add_computed_column<val>);
    function("set_column_nth", &set_column_nth<val>, allow_raw_pointers());
    function("get_data_zero", &get_data<std::shared_ptr<t_ctx0>>);
    function("get_data_one", &get_data<std::shared_ptr<t_ctx1>>);
    function("get_data_two", &get_data<std::shared_ptr<t_ctx2>>);
    function("get_data_two_skip_headers", &get_data_two_skip_headers<val>);
    function("col_to_js_typed_array_zero", &col_to_js_typed_array<std::shared_ptr<t_ctx0>>);
    function("col_to_js_typed_array_one", &col_to_js_typed_array<std::shared_ptr<t_ctx1>>);
    function("col_to_js_typed_array_two", &col_to_js_typed_array<std::shared_ptr<t_ctx2>>);
    function("make_view_zero", &make_view<t_ctx0>, allow_raw_pointers());
    function("make_view_one", &make_view<t_ctx1>, allow_raw_pointers());
    function("make_view_two", &make_view<t_ctx2>, allow_raw_pointers());
=======
/******************************************************************************
 *
 * View
 */
// Bind a View for each context type

class_<View<t_ctx0> >("View_ctx0")
    // FIXME: lmao
    .constructor<t_pool*, std::shared_ptr<t_ctx0>, std::int32_t, std::shared_ptr<t_gnode>,
    std::string, std::string, std::vector<std::string>, std::vector<std::string>, 
    std::vector<std::pair<std::vector<std::string>, std::string> >,
    std::vector<std::vector<std::string> >,
    std::vector<std::vector<std::string> > >()
    .smart_ptr<std::shared_ptr<View<t_ctx0> > >("shared_ptr<View_ctx0>")
    .function("delete_view", &View<t_ctx0>::delete_view)
    .function("num_rows", &View<t_ctx0>::num_rows)
    .function("num_columns", &View<t_ctx0>::num_columns)
    .function("get_row_expanded", &View<t_ctx0>::get_row_expanded)
    .function("schema", &View<t_ctx0>::schema)
    .function("_column_names", &View<t_ctx0>::_column_names);
    
class_<View<t_ctx1> >("View_ctx1")
    .constructor<t_pool*, std::shared_ptr<t_ctx1>, std::int32_t, std::shared_ptr<t_gnode>, 
    std::string, std::string, std::vector<std::string>, std::vector<std::string>, 
    std::vector<std::pair<std::vector<std::string>, std::string> >,
    std::vector<std::vector<std::string> >,
    std::vector<std::vector<std::string> > >()
    .smart_ptr<std::shared_ptr<View<t_ctx1> > >("shared_ptr<View_ctx1>")
    .function("delete_view", &View<t_ctx1>::delete_view)
    .function("num_rows", &View<t_ctx1>::num_rows)
    .function("num_columns", &View<t_ctx1>::num_columns)
    .function("get_row_expanded", &View<t_ctx1>::get_row_expanded)
    .function("expand", &View<t_ctx1>::expand)
    .function("collapse", &View<t_ctx1>::collapse)
    .function("set_depth", &View<t_ctx1>::set_depth)
    .function("schema", &View<t_ctx1>::schema)
    .function("_column_names", &View<t_ctx1>::_column_names);

class_<View<t_ctx2> >("View_ctx2")
    .constructor<t_pool*, std::shared_ptr<t_ctx2>, std::int32_t, std::shared_ptr<t_gnode>, 
    std::string, std::string, std::vector<std::string>, std::vector<std::string>, 
    std::vector<std::pair<std::vector<std::string>, std::string> >, 
    std::vector<std::vector<std::string> >,
    std::vector<std::vector<std::string> > >()
    .smart_ptr<std::shared_ptr<View<t_ctx2> > >("shared_ptr<View_ctx2>")
    .function("delete_view", &View<t_ctx2>::delete_view)
    .function("num_rows", &View<t_ctx2>::num_rows)
    .function("num_columns", &View<t_ctx2>::num_columns)
    .function("get_row_expanded", &View<t_ctx2>::get_row_expanded)
    .function("expand", &View<t_ctx2>::expand)
    .function("collapse", &View<t_ctx2>::collapse)
    .function("set_depth", &View<t_ctx2>::set_depth)
    .function("schema", &View<t_ctx2>::schema)
    .function("_column_names", &View<t_ctx2>::_column_names);

/******************************************************************************
 *
 * t_column
 */
class_<t_column>("t_column")
    .smart_ptr<std::shared_ptr<t_column>>("shared_ptr<t_column>")
    .function<void>("set_scalar", &t_column::set_scalar);

/******************************************************************************
 *
 * t_table
 */
class_<t_table>("t_table")
    .constructor<t_schema, t_uindex>()
    .smart_ptr<std::shared_ptr<t_table>>("shared_ptr<t_table>")
    .function<t_column*>("add_column", &t_table::add_column, allow_raw_pointers())
    .function<void>("pprint", &t_table::pprint)
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
    .constructor<t_gnode_processing_mode, const t_schema&, const std::vector<t_schema>&,
        const std::vector<t_schema>&, const std::vector<t_custom_column>&>()
    .smart_ptr<std::shared_ptr<t_gnode>>("shared_ptr<t_gnode>")
    .function<t_uindex>(
        "get_id", reinterpret_cast<t_uindex (t_gnode::*)() const>(&t_gnode::get_id))
    .function<t_schema>("get_tblschema", &t_gnode::get_tblschema)
    .function<t_table*>("get_table", &t_gnode::get_table, allow_raw_pointers());

/******************************************************************************
 *
 * t_ctx0
 */
class_<t_ctx0>("t_ctx0")
    .constructor<t_schema, t_config>()
    .smart_ptr<std::shared_ptr<t_ctx0>>("shared_ptr<t_ctx0>")
    .function<t_index>("sidedness", &t_ctx0::sidedness)
    .function<unsigned long>("get_row_count",
        reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_row_count))
    .function<unsigned long>("get_column_count",
        reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_column_count))
    .function<std::vector<t_tscalar>>("get_data", &t_ctx0::get_data)
    .function<t_stepdelta>("get_step_delta", &t_ctx0::get_step_delta)
    .function<std::vector<t_cellupd>>("get_cell_delta", &t_ctx0::get_cell_delta)
    .function<std::vector<std::string>>("get_column_names", &t_ctx0::get_column_names)
    // .function<std::vector<t_minmax>>("get_min_max", &t_ctx0::get_min_max)
    // .function<void>("set_minmax_enabled", &t_ctx0::set_minmax_enabled)
    .function<std::vector<t_tscalar>>("unity_get_row_data", &t_ctx0::unity_get_row_data)
    .function<std::vector<t_tscalar>>(
        "unity_get_column_data", &t_ctx0::unity_get_column_data)
    .function<std::vector<t_tscalar>>("unity_get_row_path", &t_ctx0::unity_get_row_path)
    .function<std::vector<t_tscalar>>(
        "unity_get_column_path", &t_ctx0::unity_get_column_path)
    .function<t_uindex>("unity_get_row_depth", &t_ctx0::unity_get_row_depth)
    .function<t_uindex>("unity_get_column_depth", &t_ctx0::unity_get_column_depth)
    .function<std::string>("unity_get_column_name", &t_ctx0::unity_get_column_name)
    .function<std::string>(
        "unity_get_column_display_name", &t_ctx0::unity_get_column_display_name)
    .function<std::vector<std::string>>(
        "unity_get_column_names", &t_ctx0::unity_get_column_names)
    .function<std::vector<std::string>>(
        "unity_get_column_display_names", &t_ctx0::unity_get_column_display_names)
    .function<t_uindex>("unity_get_column_count", &t_ctx0::unity_get_column_count)
    .function<t_uindex>("unity_get_row_count", &t_ctx0::unity_get_row_count)
    .function<bool>("unity_get_row_expanded", &t_ctx0::unity_get_row_expanded)
    .function<bool>("unity_get_column_expanded", &t_ctx0::unity_get_column_expanded)
    .function<void>("unity_init_load_step_end", &t_ctx0::unity_init_load_step_end);

/******************************************************************************
 *
 * t_ctx1
 */
class_<t_ctx1>("t_ctx1")
    .constructor<t_schema, t_config>()
    .smart_ptr<std::shared_ptr<t_ctx1>>("shared_ptr<t_ctx1>")
    .function<t_index>("sidedness", &t_ctx1::sidedness)
    .function<unsigned long>("get_row_count",
        reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_row_count))
    .function<unsigned long>("get_column_count",
        reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_column_count))
    .function<std::vector<t_tscalar>>("get_data", &t_ctx1::get_data)
    .function<t_stepdelta>("get_step_delta", &t_ctx1::get_step_delta)
    .function<std::vector<t_cellupd>>("get_cell_delta", &t_ctx1::get_cell_delta)
    .function<void>("set_depth", &t_ctx1::set_depth)
    .function("open", select_overload<t_index(t_index)>(&t_ctx1::open))
    .function("close", select_overload<t_index(t_index)>(&t_ctx1::close))
    .function<t_depth>("get_trav_depth", &t_ctx1::get_trav_depth)
    .function<std::vector<t_aggspec>>("get_column_names", &t_ctx1::get_aggregates)
    .function<std::vector<t_tscalar>>("unity_get_row_data", &t_ctx1::unity_get_row_data)
    .function<std::vector<t_tscalar>>(
        "unity_get_column_data", &t_ctx1::unity_get_column_data)
    .function<std::vector<t_tscalar>>("unity_get_row_path", &t_ctx1::unity_get_row_path)
    .function<std::vector<t_tscalar>>(
        "unity_get_column_path", &t_ctx1::unity_get_column_path)
    .function<t_uindex>("unity_get_row_depth", &t_ctx1::unity_get_row_depth)
    .function<t_uindex>("unity_get_column_depth", &t_ctx1::unity_get_column_depth)
    .function<std::string>("unity_get_column_name", &t_ctx1::unity_get_column_name)
    .function<std::string>(
        "unity_get_column_display_name", &t_ctx1::unity_get_column_display_name)
    .function<std::vector<std::string>>(
        "unity_get_column_names", &t_ctx1::unity_get_column_names)
    .function<std::vector<std::string>>(
        "unity_get_column_display_names", &t_ctx1::unity_get_column_display_names)
    .function<t_uindex>("unity_get_column_count", &t_ctx1::unity_get_column_count)
    .function<t_uindex>("unity_get_row_count", &t_ctx1::unity_get_row_count)
    .function<bool>("unity_get_row_expanded", &t_ctx1::unity_get_row_expanded)
    .function<bool>("unity_get_column_expanded", &t_ctx1::unity_get_column_expanded)
    .function<void>("unity_init_load_step_end", &t_ctx1::unity_init_load_step_end);

/******************************************************************************
 *
 * t_ctx2
 */
class_<t_ctx2>("t_ctx2")
    .constructor<t_schema, t_config>()
    .smart_ptr<std::shared_ptr<t_ctx2>>("shared_ptr<t_ctx2>")
    .function<t_index>("sidedness", &t_ctx2::sidedness)
    .function<unsigned long>("get_row_count",
        reinterpret_cast<unsigned long (t_ctx2::*)() const>(
            select_overload<t_index() const>(&t_ctx2::get_row_count)))
    .function<unsigned long>("get_column_count",
        reinterpret_cast<unsigned long (t_ctx2::*)() const>(&t_ctx2::get_column_count))
    .function<std::vector<t_tscalar>>("get_data", &t_ctx2::get_data)
    .function<t_stepdelta>("get_step_delta", &t_ctx2::get_step_delta)
    //.function<std::vector<t_cellupd>>("get_cell_delta", &t_ctx2::get_cell_delta)
    .function<void>("set_depth", &t_ctx2::set_depth)
    .function("open", select_overload<t_index(t_header, t_index)>(&t_ctx2::open))
    .function("close", select_overload<t_index(t_header, t_index)>(&t_ctx2::close))
    .function<std::vector<t_aggspec>>("get_column_names", &t_ctx2::get_aggregates)
    .function<std::vector<t_tscalar>>("unity_get_row_data", &t_ctx2::unity_get_row_data)
    .function<std::vector<t_tscalar>>(
        "unity_get_column_data", &t_ctx2::unity_get_column_data)
    .function<std::vector<t_tscalar>>("unity_get_row_path", &t_ctx2::unity_get_row_path)
    .function<std::vector<t_tscalar>>(
        "unity_get_column_path", &t_ctx2::unity_get_column_path)
    .function<t_uindex>("unity_get_row_depth", &t_ctx2::unity_get_row_depth)
    .function<t_uindex>("unity_get_column_depth", &t_ctx2::unity_get_column_depth)
    .function<std::string>("unity_get_column_name", &t_ctx2::unity_get_column_name)
    .function<std::string>(
        "unity_get_column_display_name", &t_ctx2::unity_get_column_display_name)
    .function<std::vector<std::string>>(
        "unity_get_column_names", &t_ctx2::unity_get_column_names)
    .function<std::vector<std::string>>(
        "unity_get_column_display_names", &t_ctx2::unity_get_column_display_names)
    .function<t_uindex>("unity_get_column_count", &t_ctx2::unity_get_column_count)
    .function<t_uindex>("unity_get_row_count", &t_ctx2::unity_get_row_count)
    .function<bool>("unity_get_row_expanded", &t_ctx2::unity_get_row_expanded)
    .function<bool>("unity_get_column_expanded", &t_ctx2::unity_get_column_expanded)
    .function<t_totals>("get_totals", &t_ctx2::get_totals)
    .function<std::vector<t_tscalar>>(
        "get_column_path_userspace", &t_ctx2::get_column_path_userspace)
    .function<void>("unity_init_load_step_end", &t_ctx2::unity_init_load_step_end);

/******************************************************************************
 *
 * t_pool
 */
class_<t_pool>("t_pool")
    .constructor<>()
    .smart_ptr<std::shared_ptr<t_pool>>("shared_ptr<t_pool>")
    .function<unsigned int>("register_gnode", &t_pool::register_gnode, allow_raw_pointers())
    .function<void>("process", &t_pool::_process)
    .function<void>("send", &t_pool::send)
    .function<t_uindex>("epoch", &t_pool::epoch)
    .function<void>("unregister_gnode", &t_pool::unregister_gnode)
    .function<void>("set_update_delegate", &t_pool::set_update_delegate)
    .function<void>("register_context", &t_pool::register_context)
    .function<void>("unregister_context", &t_pool::unregister_context)
    .function<std::vector<t_updctx>>(
        "get_contexts_last_updated", &t_pool::get_contexts_last_updated)
    .function<std::vector<t_uindex>>(
        "get_gnodes_last_updated", &t_pool::get_gnodes_last_updated)
    .function<t_gnode*>("get_gnode", &t_pool::get_gnode, allow_raw_pointers());

/******************************************************************************
 *
 * t_aggspec
 */
class_<t_aggspec>("t_aggspec").function<std::string>("name", &t_aggspec::name);

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
 * vector
 */
register_vector<t_dtype>("std::vector<t_dtype>");
register_vector<t_cellupd>("std::vector<t_cellupd>");
register_vector<t_aggspec>("std::vector<t_aggspec>");
register_vector<t_tscalar>("std::vector<t_tscalar>");
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
 * t_header
 */
enum_<t_header>("t_header")
    .value("HEADER_ROW", HEADER_ROW)
    .value("HEADER_COLUMN", HEADER_COLUMN);

/******************************************************************************
 *
 * t_ctx_type
 */
enum_<t_ctx_type>("t_ctx_type")
    .value("ZERO_SIDED_CONTEXT", ZERO_SIDED_CONTEXT)
    .value("ONE_SIDED_CONTEXT", ONE_SIDED_CONTEXT)
    .value("TWO_SIDED_CONTEXT", TWO_SIDED_CONTEXT)
    .value("GROUPED_ZERO_SIDED_CONTEXT", GROUPED_ZERO_SIDED_CONTEXT)
    .value("GROUPED_PKEY_CONTEXT", GROUPED_PKEY_CONTEXT)
    .value("GROUPED_COLUMNS_CONTEXT", GROUPED_COLUMNS_CONTEXT);

/******************************************************************************
 *
 * t_filter_op
 */
enum_<t_filter_op>("t_filter_op")
    .value("FILTER_OP_LT", FILTER_OP_LT)
    .value("FILTER_OP_LTEQ", FILTER_OP_LTEQ)
    .value("FILTER_OP_GT", FILTER_OP_GT)
    .value("FILTER_OP_GTEQ", FILTER_OP_GTEQ)
    .value("FILTER_OP_EQ", FILTER_OP_EQ)
    .value("FILTER_OP_NE", FILTER_OP_NE)
    .value("FILTER_OP_BEGINS_WITH", FILTER_OP_BEGINS_WITH)
    .value("FILTER_OP_ENDS_WITH", FILTER_OP_ENDS_WITH)
    .value("FILTER_OP_CONTAINS", FILTER_OP_CONTAINS)
    .value("FILTER_OP_OR", FILTER_OP_OR)
    .value("FILTER_OP_IN", FILTER_OP_IN)
    .value("FILTER_OP_NOT_IN", FILTER_OP_NOT_IN)
    .value("FILTER_OP_AND", FILTER_OP_AND)
    .value("FILTER_OP_IS_NAN", FILTER_OP_IS_NAN)
    .value("FILTER_OP_IS_NOT_NAN", FILTER_OP_IS_NOT_NAN)
    .value("FILTER_OP_IS_VALID", FILTER_OP_IS_VALID)
    .value("FILTER_OP_IS_NOT_VALID", FILTER_OP_IS_NOT_VALID);

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
 * t_aggtype
 */
enum_<t_aggtype>("t_aggtype")
    .value("AGGTYPE_SUM", AGGTYPE_SUM)
    .value("AGGTYPE_MUL", AGGTYPE_MUL)
    .value("AGGTYPE_COUNT", AGGTYPE_COUNT)
    .value("AGGTYPE_MEAN", AGGTYPE_MEAN)
    .value("AGGTYPE_WEIGHTED_MEAN", AGGTYPE_WEIGHTED_MEAN)
    .value("AGGTYPE_UNIQUE", AGGTYPE_UNIQUE)
    .value("AGGTYPE_ANY", AGGTYPE_ANY)
    .value("AGGTYPE_MEDIAN", AGGTYPE_MEDIAN)
    .value("AGGTYPE_JOIN", AGGTYPE_JOIN)
    .value("AGGTYPE_SCALED_DIV", AGGTYPE_SCALED_DIV)
    .value("AGGTYPE_SCALED_ADD", AGGTYPE_SCALED_ADD)
    .value("AGGTYPE_SCALED_MUL", AGGTYPE_SCALED_MUL)
    .value("AGGTYPE_DOMINANT", AGGTYPE_DOMINANT)
    .value("AGGTYPE_FIRST", AGGTYPE_FIRST)
    .value("AGGTYPE_LAST", AGGTYPE_LAST)
    .value("AGGTYPE_PY_AGG", AGGTYPE_PY_AGG)
    .value("AGGTYPE_AND", AGGTYPE_AND)
    .value("AGGTYPE_OR", AGGTYPE_OR)
    .value("AGGTYPE_LAST_VALUE", AGGTYPE_LAST_VALUE)
    .value("AGGTYPE_HIGH_WATER_MARK", AGGTYPE_HIGH_WATER_MARK)
    .value("AGGTYPE_LOW_WATER_MARK", AGGTYPE_LOW_WATER_MARK)
    .value("AGGTYPE_UDF_COMBINER", AGGTYPE_UDF_COMBINER)
    .value("AGGTYPE_UDF_REDUCER", AGGTYPE_UDF_REDUCER)
    .value("AGGTYPE_SUM_ABS", AGGTYPE_SUM_ABS)
    .value("AGGTYPE_SUM_NOT_NULL", AGGTYPE_SUM_NOT_NULL)
    .value("AGGTYPE_MEAN_BY_COUNT", AGGTYPE_MEAN_BY_COUNT)
    .value("AGGTYPE_IDENTITY", AGGTYPE_IDENTITY)
    .value("AGGTYPE_DISTINCT_COUNT", AGGTYPE_DISTINCT_COUNT)
    .value("AGGTYPE_DISTINCT_LEAF", AGGTYPE_DISTINCT_LEAF)
    .value("AGGTYPE_PCT_SUM_PARENT", AGGTYPE_PCT_SUM_PARENT)
    .value("AGGTYPE_PCT_SUM_GRAND_TOTAL", AGGTYPE_PCT_SUM_GRAND_TOTAL);

/******************************************************************************
 *
 * t_totals
 */
enum_<t_totals>("t_totals")
    .value("TOTALS_BEFORE", TOTALS_BEFORE)
    .value("TOTALS_HIDDEN", TOTALS_HIDDEN)
    .value("TOTALS_AFTER", TOTALS_AFTER);

/******************************************************************************
 *
 * assorted functions
 */
function("sort", &sort<val>);
function("make_table", &make_table<val>, allow_raw_pointers());
function("make_gnode", &make_gnode);
function("clone_gnode_table", &clone_gnode_table<val>, allow_raw_pointers());
function("make_context_zero", &make_context_zero<val>, allow_raw_pointers());
function("make_context_one", &make_context_one<val>, allow_raw_pointers());
function("make_context_two", &make_context_two<val>, allow_raw_pointers());
function("scalar_to_val", &scalar_to_val);
function("scalar_vec_to_val", &scalar_vec_to_val);
function("table_add_computed_column", &table_add_computed_column<val>);
function("set_column_nth", &set_column_nth<val>, allow_raw_pointers());
function("get_data_zero", &get_data<std::shared_ptr<t_ctx0>>);
function("get_data_one", &get_data<std::shared_ptr<t_ctx1>>);
function("get_data_two", &get_data<std::shared_ptr<t_ctx2>>);
function("get_data_two_skip_headers", &get_data_two_skip_headers<val>);
function("col_to_js_typed_array_zero", &col_to_js_typed_array<std::shared_ptr<t_ctx0>>);
function("col_to_js_typed_array_one", &col_to_js_typed_array<std::shared_ptr<t_ctx1>>);
function("col_to_js_typed_array_two", &col_to_js_typed_array<std::shared_ptr<t_ctx2>>);
function("make_view_zero", &make_view<t_ctx0>, allow_raw_pointers());
function("make_view_one", &make_view<t_ctx1>, allow_raw_pointers());
function("make_view_two", &make_view<t_ctx2>, allow_raw_pointers());
>>>>>>> parse config variables in make_view
}
