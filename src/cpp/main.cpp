/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/base.h>
#include <perspective/gnode.h>
#include <perspective/table.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <random>
#include <cmath>
#include <sstream>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <perspective/sym_table.h>
#include <codecvt>

using namespace perspective;
using namespace emscripten;

typedef std::codecvt_utf8<wchar_t> utf8convert_type;
typedef std::codecvt_utf8_utf16<wchar_t> utf16convert_type;

/******************************************************************************
 *
 * Data Loading
 */

t_sortsvec
_get_sort(val j_sortby) {
    t_sortsvec svec{};
    std::vector<val> sortbys = vecFromJSArray<val>(j_sortby);
    for (auto idx = 0; idx < sortbys.size(); ++idx) {
        std::vector<t_int32> sortby = vecFromJSArray<t_int32>(sortbys[idx]);
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
t_ftermvec
_get_fterms(t_schema schema, val j_filters) {
    t_ftermvec fvec{};
    std::vector<val> filters = vecFromJSArray<val>(j_filters);
    for (auto fidx = 0; fidx < filters.size(); ++fidx) {
        std::vector<val> filter = vecFromJSArray<val>(filters[fidx]);
        std::string coln = filter[0].as<std::string>();
        t_filter_op comp = filter[1].as<t_filter_op>();

        switch (comp) {
            case FILTER_OP_NOT_IN:
            case FILTER_OP_IN: {
                t_tscalvec terms{};
                std::vector<std::string> j_terms = vecFromJSArray<std::string>(filter[2]);
                for (auto jidx = 0; jidx < j_terms.size(); ++jidx) {
                    terms.push_back(mktscalar(get_interned_cstr(j_terms[jidx].c_str())));
                }
                fvec.push_back(t_fterm(coln, comp, mktscalar(0), terms));
            } break;
            default: {
                t_tscalar term;
                switch (schema.get_dtype(coln)) {
                    case DTYPE_INT32:
                        term = mktscalar(filter[2].as<t_int32>());
                        break;
                    case DTYPE_INT64:
                    case DTYPE_FLOAT64:
                        term = mktscalar(filter[2].as<t_float64>());
                        break;
                    case DTYPE_BOOL:
                        term = mktscalar(filter[2].as<bool>());
                        break;
                    case DTYPE_DATE:
                        term = mktscalar(t_date(filter[2].as<t_int32>()));
                        break;
                    case DTYPE_TIME:
                        term = mktscalar(t_time(static_cast<t_int64>(
                            filter[2].call<val>("getTime").as<t_float64>())));
                        break;
                    default: {
                        term
                            = mktscalar(get_interned_cstr(filter[2].as<std::string>().c_str()));
                    }
                }

                fvec.push_back(t_fterm(coln, comp, term, t_tscalvec()));
            }
        }
    }
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
t_aggspecvec
_get_aggspecs(val j_aggs) {
    std::vector<val> aggs = vecFromJSArray<val>(j_aggs);
    t_aggspecvec aggspecs;
    for (auto idx = 0; idx < aggs.size(); ++idx) {
        std::vector<val> agg_row = vecFromJSArray<val>(aggs[idx]);
        std::string name = agg_row[0].as<std::string>();
        t_aggtype aggtype = agg_row[1].as<t_aggtype>();

        t_depvec dependencies;
        std::vector<val> deps = vecFromJSArray<val>(agg_row[2]);
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

// Date parsing
t_date
jsdate_to_t_date(val date) {
    return t_date(date.call<val>("getFullYear").as<t_int32>(),
        date.call<val>("getMonth").as<t_int32>(), date.call<val>("getDate").as<t_int32>());
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
scalar_to_val(const t_tscalar scalar) {
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
            return val(static_cast<t_int32>(scalar.to_int64()));
        }
        case DTYPE_UINT64:
        case DTYPE_INT64: {
            // This could potentially lose precision
            return val(static_cast<t_int32>(scalar.to_int64()));
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
scalar_vec_to_val(const t_tscalvec& scalars, t_uint32 idx) {
    return scalar_to_val(scalars[idx]);
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

void
vecFromTypedArray(
    const val& typedArray, void* data, t_int32 length, const char* destType = nullptr) {
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

void
fill_col_valid(val dcol, t_col_sptr col) {
    // dcol should be the Uint8Array containing the null bitmap
    t_uindex nrows = col->size();

    // arrow packs bools into a bitmap
    for (auto i = 0; i < nrows; ++i) {
        t_uint8 elem = dcol[i / 8].as<t_uint8>();
        t_bool v = elem & (1 << (i % 8));
        col->set_valid(i, v);
    }
}

void
fill_col_dict(val dictvec, t_col_sptr col) {
    // ptaylor: This assumes the dictionary is either a Binary or Utf8 Vector. Should it support
    // other Vector types?
    val vdata = dictvec["values"];
    t_int32 vsize = vdata["length"].as<t_int32>();
    std::vector<t_uchar> data;
    data.reserve(vsize);
    data.resize(vsize);
    vecFromTypedArray(vdata, data.data(), vsize);

    val voffsets = dictvec["valueOffsets"];
    t_int32 osize = voffsets["length"].as<t_int32>();
    std::vector<t_int32> offsets;
    offsets.reserve(osize);
    offsets.resize(osize);
    vecFromTypedArray(voffsets, offsets.data(), osize);

    // Get number of dictionary entries
    t_uint32 dsize = dictvec["length"].as<t_uint32>();

    t_vocab* vocab = col->_get_vocab();
    t_str elem;

    for (t_uint32 i = 0; i < dsize; ++i) {
        t_int32 bidx = offsets[i];
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
col_to_js_typed_array(T ctx, t_tvidx idx) {
    t_tscalvec data = ctx->get_data(0, ctx->get_row_count(), idx, idx + 1);
    auto dtype = ctx->get_column_dtype(idx);
    int data_size = data.size();
    val constructor = val::undefined();
    val sentinel = val::undefined();

    switch (dtype) {
        case DTYPE_INT8: {
            data_size *= sizeof(t_int8);
            sentinel = val(std::numeric_limits<t_int8>::lowest());
            constructor = js_typed_array::Int8Array;
        } break;
        case DTYPE_INT16: {
            data_size *= sizeof(t_int16);
            sentinel = val(std::numeric_limits<t_int16>::lowest());
            constructor = js_typed_array::Int16Array;
        } break;
        case DTYPE_INT32:
        case DTYPE_INT64: {
            // scalar_to_val converts int64 into int32
            data_size *= sizeof(t_int32);
            sentinel = val(std::numeric_limits<t_int32>::lowest());
            constructor = js_typed_array::Int32Array;
        } break;
        case DTYPE_FLOAT32: {
            data_size *= sizeof(t_float32);
            sentinel = val(std::numeric_limits<t_float32>::lowest());
            constructor = js_typed_array::Float32Array;
        } break;
        case DTYPE_TIME:
        case DTYPE_FLOAT64: {
            sentinel = val(std::numeric_limits<t_float64>::lowest());
            data_size *= sizeof(t_float64);
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

template <typename T>
void
_fill_col(val dcol, t_col_sptr col, t_bool is_arrow) {
    // iterates through dcol, sets them on the c++ column
    t_uindex nrows = col->size();

    if (is_arrow) {
        val data = dcol["values"];
        arrow::vecFromTypedArray(data, col->get_nth<T>(0), nrows);
    } else {
        for (auto i = 0; i < nrows; ++i) {
            if (dcol[i].isUndefined())
                continue;

            if (dcol[i].isNull()) {
                col->unset(i);
                continue;
            }

            auto elem = dcol[i].as<T>();
            col->set_nth(i, elem);
        }
    }
}

template <>
void
_fill_col<t_int64>(val dcol, t_col_sptr col, t_bool is_arrow) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        val data = dcol["values"];
        // arrow packs 64 bit into two 32 bit ints
        arrow::vecFromTypedArray(data, col->get_nth<t_int64>(0), nrows * 2);
    } else {
        throw std::logic_error(
            "Unreachable - can't have DTYPE_INT64 column from non-arrow data");
    }
}

template <>
void
_fill_col<t_time>(val dcol, t_col_sptr col, t_bool is_arrow) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        val data = dcol["values"];
        // arrow packs 64 bit into two 32 bit ints
        arrow::vecFromTypedArray(data, col->get_nth<t_time>(0), nrows * 2);

        t_int8 unit = dcol["type"]["unit"].as<t_int8>();
        if (unit != /* Arrow.enum_.TimeUnit.MILLISECOND */ 1) {
            // Slow path - need to convert each value
            t_int64 factor = 1;
            if (unit == /* Arrow.enum_.TimeUnit.NANOSECOND */ 3) {
                factor = 1e6;
            } else if (unit == /* Arrow.enum_.TimeUnit.MICROSECOND */ 2) {
                factor = 1e3;
            }
            for (auto i = 0; i < nrows; ++i) {
                col->set_nth<t_int64>(i, *(col->get_nth<t_int64>(i)) / factor);
            }
        }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            if (dcol[i].isUndefined())
                continue;

            if (dcol[i].isNull()) {
                col->unset(i);
                continue;
            }

            auto elem = static_cast<t_int64>(dcol[i].call<val>("getTime").as<t_float64>());
            col->set_nth(i, elem);
        }
    }
}

template <>
void
_fill_col<t_date>(val dcol, t_col_sptr col, t_bool is_arrow) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // val data = dcol["values"];
        // // arrow packs 64 bit into two 32 bit ints
        // arrow::vecFromTypedArray(data, col->get_nth<t_time>(0), nrows * 2);

        // t_int8 unit = dcol["type"]["unit"].as<t_int8>();
        // if (unit != /* Arrow.enum_.TimeUnit.MILLISECOND */ 1) {
        //     // Slow path - need to convert each value
        //     t_int64 factor = 1;
        //     if (unit == /* Arrow.enum_.TimeUnit.NANOSECOND */ 3) {
        //         factor = 1e6;
        //     } else if (unit == /* Arrow.enum_.TimeUnit.MICROSECOND */ 2) {
        //         factor = 1e3;
        //     }
        //     for (auto i = 0; i < nrows; ++i) {
        //         col->set_nth<t_int32>(i, *(col->get_nth<t_int32>(i)) / factor);
        //     }
        // }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            if (dcol[i].isUndefined())
                continue;

            if (dcol[i].isNull()) {
                col->unset(i);
                continue;
            }

            col->set_nth(i, jsdate_to_t_date(dcol[i]));
        }
    }
}

template <>
void
_fill_col<t_bool>(val dcol, t_col_sptr col, t_bool is_arrow) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // arrow packs bools into a bitmap
        val data = dcol["values"];
        for (auto i = 0; i < nrows; ++i) {
            t_uint8 elem = data[i / 8].as<t_uint8>();
            t_bool v = elem & (1 << (i % 8));
            col->set_nth(i, v);
        }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            if (dcol[i].isUndefined())
                continue;

            if (dcol[i].isNull()) {
                col->unset(i);
                continue;
            }

            auto elem = dcol[i].as<t_bool>();
            col->set_nth(i, elem);
        }
    }
}

template <>
void
_fill_col<std::string>(val dcol, t_col_sptr col, t_bool is_arrow) {

    t_uindex nrows = col->size();

    if (is_arrow) {
        if (dcol["constructor"]["name"].as<t_str>() == "DictionaryVector") {

            val dictvec = dcol["dictionary"];
            arrow::fill_col_dict(dictvec, col);

            // Now process index into dictionary

            // Perspective stores string indices in a 32bit unsigned array
            // Javascript's typed arrays handle copying from various bitwidth arrays properly
            val vkeys = dcol["indices"]["values"];
            arrow::vecFromTypedArray(vkeys, col->get_nth<t_uindex>(0), nrows, "Uint32Array");

        } else if (dcol["constructor"]["name"].as<t_str>() == "Utf8Vector"
            || dcol["constructor"]["name"].as<t_str>() == "BinaryVector") {

            val vdata = dcol["values"];
            t_int32 vsize = vdata["length"].as<t_int32>();
            std::vector<t_uint8> data;
            data.reserve(vsize);
            data.resize(vsize);
            arrow::vecFromTypedArray(vdata, data.data(), vsize);

            val voffsets = dcol["valueOffsets"];
            t_int32 osize = voffsets["length"].as<t_int32>();
            std::vector<t_int32> offsets;
            offsets.reserve(osize);
            offsets.resize(osize);
            arrow::vecFromTypedArray(voffsets, offsets.data(), osize);

            t_str elem;

            for (t_int32 i = 0; i < nrows; ++i) {
                t_int32 bidx = offsets[i];
                std::size_t es = offsets[i + 1] - bidx;
                elem.assign(reinterpret_cast<char*>(data.data()) + bidx, es);
                col->set_nth(i, elem);
            }
        }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            if (dcol[i].isUndefined())
                continue;

            if (dcol[i].isNull()) {
                col->unset(i);
                continue;
            }

            std::wstring welem = dcol[i].as<std::wstring>();
            std::wstring_convert<utf16convert_type, wchar_t> converter;
            std::string elem = converter.to_bytes(welem);
            col->set_nth(i, elem);
        }
    }
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
void
_fill_data(t_table_sptr tbl, t_svec ocolnames, val j_data, std::vector<t_dtype> odt,
    t_uint32 offset, t_bool is_arrow) {
    std::vector<val> data_cols = vecFromJSArray<val>(j_data);
    for (auto cidx = 0; cidx < ocolnames.size(); ++cidx) {
        auto name = ocolnames[cidx];
        auto col = tbl->get_column(name);
        auto col_type = odt[cidx];
        auto dcol = data_cols[cidx];

        switch (col_type) {
            case DTYPE_INT8: {
                _fill_col<t_int8>(dcol, col, is_arrow);
            } break;
            case DTYPE_INT16: {
                _fill_col<t_int16>(dcol, col, is_arrow);
            } break;
            case DTYPE_INT32: {
                _fill_col<t_int32>(dcol, col, is_arrow);
            } break;
            case DTYPE_INT64: {
                _fill_col<t_int64>(dcol, col, is_arrow);
            } break;
            case DTYPE_BOOL: {
                _fill_col<t_bool>(dcol, col, is_arrow);
            } break;
            case DTYPE_FLOAT32: {
                _fill_col<t_float32>(dcol, col, is_arrow);
            } break;
            case DTYPE_FLOAT64: {
                _fill_col<t_float64>(dcol, col, is_arrow);
            } break;
            case DTYPE_DATE: {
                _fill_col<t_date>(dcol, col, is_arrow);
            } break;
            case DTYPE_TIME: {
                _fill_col<t_time>(dcol, col, is_arrow);
            } break;
            case DTYPE_STR: {
                _fill_col<std::string>(dcol, col, is_arrow);
            } break;
            default:
                break;
        }
        if (is_arrow) {
            // Fill validity bitmap
            t_uint32 null_count = dcol["nullCount"].as<t_uint32>();

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

/**
 * Create a populated table.
 *
 * Params
 * ------
 * j_colnames - a JS Array of column names.
 * j_dtypes - a JS Array of column types.
 * j_data - a JS Array of JS Array columns.
 *
 * Returns
 * -------
 * a populated table.
 */
t_table_sptr
make_table(t_uint32 size, val j_colnames, val j_dtypes, val j_data, t_uint32 offset,
    t_uint32 limit, t_str index, t_bool is_arrow, t_bool is_delete) {
    // Create the input and port schemas
    t_svec colnames = vecFromJSArray<std::string>(j_colnames);
    t_dtypevec dtypes = vecFromJSArray<t_dtype>(j_dtypes);

    // Create the table
    // TODO assert size > 0
    auto tbl = std::make_shared<t_table>(t_schema(colnames, dtypes));
    tbl->init();
    tbl->extend(size);

    _fill_data(tbl, colnames, j_data, dtypes, offset, is_arrow);

    // Set up pkey and op columns
    if (is_delete) {
        auto op_col = tbl->add_column("psp_op", DTYPE_UINT8, false);
        op_col->raw_fill<t_uint8>(OP_DELETE);
    } else {
        auto op_col = tbl->add_column("psp_op", DTYPE_UINT8, false);
        op_col->raw_fill<t_uint8>(OP_INSERT);
    }

    if (index == "") {
        // If user doesn't specify an column to use as the pkey index, just use
        // row number
        auto key_col = tbl->add_column("psp_pkey", DTYPE_INT32, true);
        auto okey_col = tbl->add_column("psp_okey", DTYPE_INT32, true);

        for (auto ridx = 0; ridx < tbl->size(); ++ridx) {
            key_col->set_nth<t_int32>(ridx, (ridx + offset) % limit);
            okey_col->set_nth<t_int32>(ridx, (ridx + offset) % limit);
        }
    } else {
        tbl->clone_column(index, "psp_pkey");
        tbl->clone_column(index, "psp_okey");
    }

    return tbl;
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
t_gnode_sptr
make_gnode(t_table_sptr table) {
    auto iscm = table->get_schema();

    t_svec ocolnames(iscm.columns());
    t_dtypevec odt(iscm.types());

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
 * Copies the internal table from a gnode
 *
 * Params
 * ------
 *
 * Returns
 * -------
 * A table.
 */
t_table_sptr
clone_gnode_table(t_gnode_sptr gnode) {
    // This creates a copy of the table
    return t_table_sptr(gnode->_get_pkeyed_table());
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
t_ctx0_sptr
make_context_zero(
    t_schema schema, t_filter_op combiner, val j_filters, val j_columns, val j_sortby) {
    auto columns = vecFromJSArray<std::string>(j_columns);
    auto fvec = _get_fterms(schema, j_filters);
    auto svec = _get_sort(j_sortby);
    auto cfg = t_config(columns, combiner, fvec);
    auto ctx0 = std::make_shared<t_ctx0>(schema, cfg);
    ctx0->init();
    ctx0->sort_by(svec);
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
t_ctx1_sptr
make_context_one(t_schema schema, val j_pivots, t_filter_op combiner, val j_filters, val j_aggs,
    val j_sortby) {
    auto fvec = _get_fterms(schema, j_filters);
    auto aggspecs = _get_aggspecs(j_aggs);
    auto pivots = vecFromJSArray<std::string>(j_pivots);
    auto svec = _get_sort(j_sortby);

    auto cfg = t_config(pivots, aggspecs, combiner, fvec);
    auto ctx1 = std::make_shared<t_ctx1>(schema, cfg);

    ctx1->init();
    ctx1->set_deltas_enabled(true);
    ctx1->sort_by(svec);
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
t_ctx2_sptr
make_context_two(t_schema schema, val j_rpivots, val j_cpivots, t_filter_op combiner,
    val j_filters, val j_aggs, val j_sortby) {
    auto fvec = _get_fterms(schema, j_filters);
    auto aggspecs = _get_aggspecs(j_aggs);
    auto rpivots = vecFromJSArray<std::string>(j_rpivots);
    auto cpivots = vecFromJSArray<std::string>(j_cpivots);
    auto svec = _get_sort(j_sortby);

    auto cfg = t_config(rpivots, cpivots, aggspecs, TOTALS_HIDDEN, combiner, fvec);
    auto ctx2 = std::make_shared<t_ctx2>(schema, cfg);

    ctx2->init();
    ctx2->set_deltas_enabled(true);
    if (svec.size() > 0) {
        ctx2->sort_by(svec);
    }
    return ctx2;
}

void
sort(t_ctx2_sptr ctx2, val j_sortby) {
    auto svec = _get_sort(j_sortby);
    if (svec.size() > 0) {
        ctx2->sort_by(svec);
    }
}

val
get_column_data(t_table_sptr table, t_str colname) {
    val arr = val::array();
    auto col = table->get_column(colname);
    for (auto idx = 0; idx < col->size(); ++idx) {
        arr.set(idx, scalar_to_val(col->get_scalar(idx)));
    }
    return arr;
}

void
set_column_nth(t_column* col, t_uindex idx, val value) {

    // Check if the value is a javascript null
    if (value.isNull()) {
        col->unset(idx);
        return;
    }

    switch (col->get_dtype()) {
        case DTYPE_BOOL: {
            col->set_nth<t_bool>(idx, value.as<t_bool>(), STATUS_VALID);
            break;
        }
        case DTYPE_FLOAT64: {
            col->set_nth<t_float64>(idx, value.as<t_float64>(), STATUS_VALID);
            break;
        }
        case DTYPE_FLOAT32: {
            col->set_nth<t_float32>(idx, value.as<t_float32>(), STATUS_VALID);
            break;
        }
        case DTYPE_UINT32: {
            col->set_nth<t_uint32>(idx, value.as<t_uint32>(), STATUS_VALID);
            break;
        }
        case DTYPE_UINT64: {
            col->set_nth<t_uint64>(idx, value.as<t_uint64>(), STATUS_VALID);
            break;
        }
        case DTYPE_INT32: {
            col->set_nth<t_int32>(idx, value.as<t_int32>(), STATUS_VALID);
            break;
        }
        case DTYPE_INT64: {
            col->set_nth<t_int64>(idx, value.as<t_int64>(), STATUS_VALID);
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
            col->set_nth<t_int64>(
                idx, static_cast<t_int64>(value.as<t_float64>()), STATUS_VALID);
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

void
table_add_computed_column(t_table_sptr table, t_str name, t_dtype dtype, val func, val inputs) {

    // Get list of input column names
    auto icol_names = vecFromJSArray<std::string>(inputs);

    // Get t_column* for all input columns
    t_colcptrvec icols;
    for (const auto& cc : icol_names) {
        icols.push_back(table->_get_column(cc));
    }

    int arity = icols.size();

    // Add new column
    t_column* out = table->add_column(name, dtype, true);

    val i1 = val::undefined(), i2 = val::undefined(), i3 = val::undefined(),
        i4 = val::undefined();

    t_uindex size = table->size();
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
get_data(T ctx, t_uint32 start_row, t_uint32 end_row, t_uint32 start_col, t_uint32 end_col) {
    auto slice = ctx->get_data(start_row, end_row, start_col, end_col);
    val arr = val::array();
    for (auto idx = 0; idx < slice.size(); ++idx) {
        arr.set(idx, scalar_to_val(slice[idx]));
    }
    return arr;
}

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
    class_<t_column>("t_column")
        .smart_ptr<std::shared_ptr<t_column>>("shared_ptr<t_column>")
        .function<void>("set_scalar", &t_column::set_scalar);

    class_<t_table>("t_table")
        .constructor<t_schema, t_uindex>()
        .smart_ptr<std::shared_ptr<t_table>>("shared_ptr<t_table>")
        .function<t_column*>("add_column", &t_table::add_column, allow_raw_pointers())
        .function<void>("pprint", &t_table::pprint)
        .function<unsigned long>(
            "size", reinterpret_cast<unsigned long (t_table::*)() const>(&t_table::size));

    class_<t_schema>("t_schema")
        .function<const t_svec&>("columns", &t_schema::columns, allow_raw_pointers())
        .function<const t_dtypevec>("types", &t_schema::types, allow_raw_pointers());

    class_<t_gnode>("t_gnode")
        .constructor<t_gnode_processing_mode, const t_schema&, const t_schemavec&,
            const t_schemavec&, const t_ccol_vec&>()
        .smart_ptr<std::shared_ptr<t_gnode>>("shared_ptr<t_gnode>")
        .function<t_uindex>(
            "get_id", reinterpret_cast<t_uindex (t_gnode::*)() const>(&t_gnode::get_id))
        .function<t_schema>("get_tblschema", &t_gnode::get_tblschema)
        .function<t_table*>("get_table", &t_gnode::get_table, allow_raw_pointers());

    class_<t_ctx0>("t_ctx0")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx0>>("shared_ptr<t_ctx0>")
        .function<t_index>("sidedness", &t_ctx0::sidedness)
        .function<unsigned long>("get_row_count",
            reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_row_count))
        .function<unsigned long>("get_column_count",
            reinterpret_cast<unsigned long (t_ctx0::*)() const>(&t_ctx0::get_column_count))
        .function<t_tscalvec>("get_data", &t_ctx0::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx0::get_step_delta)
        .function<t_cellupdvec>("get_cell_delta", &t_ctx0::get_cell_delta)
        .function<t_svec>("get_column_names", &t_ctx0::get_column_names)
        // .function<t_minmaxvec>("get_min_max", &t_ctx0::get_min_max)
        // .function<void>("set_minmax_enabled", &t_ctx0::set_minmax_enabled)
        .function<t_tscalvec>("unity_get_row_data", &t_ctx0::unity_get_row_data)
        .function<t_tscalvec>("unity_get_column_data", &t_ctx0::unity_get_column_data)
        .function<t_tscalvec>("unity_get_row_path", &t_ctx0::unity_get_row_path)
        .function<t_tscalvec>("unity_get_column_path", &t_ctx0::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx0::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx0::unity_get_column_depth)
        .function<t_str>("unity_get_column_name", &t_ctx0::unity_get_column_name)
        .function<t_str>(
            "unity_get_column_display_name", &t_ctx0::unity_get_column_display_name)
        .function<t_svec>("unity_get_column_names", &t_ctx0::unity_get_column_names)
        .function<t_svec>(
            "unity_get_column_display_names", &t_ctx0::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx0::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx0::unity_get_row_count)
        .function<t_bool>("unity_get_row_expanded", &t_ctx0::unity_get_row_expanded)
        .function<t_bool>("unity_get_column_expanded", &t_ctx0::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx0::unity_init_load_step_end);

    class_<t_ctx1>("t_ctx1")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx1>>("shared_ptr<t_ctx1>")
        .function<t_index>("sidedness", &t_ctx1::sidedness)
        .function<unsigned long>("get_row_count",
            reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_row_count))
        .function<unsigned long>("get_column_count",
            reinterpret_cast<unsigned long (t_ctx1::*)() const>(&t_ctx1::get_column_count))
        .function<t_tscalvec>("get_data", &t_ctx1::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx1::get_step_delta)
        .function<t_cellupdvec>("get_cell_delta", &t_ctx1::get_cell_delta)
        .function<void>("set_depth", &t_ctx1::set_depth)
        .function("open", select_overload<t_index(t_tvidx)>(&t_ctx1::open))
        .function("close", select_overload<t_index(t_tvidx)>(&t_ctx1::close))
        .function<t_depth>("get_trav_depth", &t_ctx1::get_trav_depth)
        .function<t_aggspecvec>("get_column_names", &t_ctx1::get_aggregates)
        .function<t_tscalvec>("unity_get_row_data", &t_ctx1::unity_get_row_data)
        .function<t_tscalvec>("unity_get_column_data", &t_ctx1::unity_get_column_data)
        .function<t_tscalvec>("unity_get_row_path", &t_ctx1::unity_get_row_path)
        .function<t_tscalvec>("unity_get_column_path", &t_ctx1::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx1::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx1::unity_get_column_depth)
        .function<t_str>("unity_get_column_name", &t_ctx1::unity_get_column_name)
        .function<t_str>(
            "unity_get_column_display_name", &t_ctx1::unity_get_column_display_name)
        .function<t_svec>("unity_get_column_names", &t_ctx1::unity_get_column_names)
        .function<t_svec>(
            "unity_get_column_display_names", &t_ctx1::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx1::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx1::unity_get_row_count)
        .function<t_bool>("unity_get_row_expanded", &t_ctx1::unity_get_row_expanded)
        .function<t_bool>("unity_get_column_expanded", &t_ctx1::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx1::unity_init_load_step_end);

    class_<t_ctx2>("t_ctx2")
        .constructor<t_schema, t_config>()
        .smart_ptr<std::shared_ptr<t_ctx2>>("shared_ptr<t_ctx2>")
        .function<t_index>("sidedness", &t_ctx2::sidedness)
        .function<unsigned long>("get_row_count",
            reinterpret_cast<unsigned long (t_ctx2::*)() const>(
                select_overload<t_index() const>(&t_ctx2::get_row_count)))
        .function<unsigned long>("get_column_count",
            reinterpret_cast<unsigned long (t_ctx2::*)() const>(&t_ctx2::get_column_count))
        .function<t_tscalvec>("get_data", &t_ctx2::get_data)
        .function<t_stepdelta>("get_step_delta", &t_ctx2::get_step_delta)
        //.function<t_cellupdvec>("get_cell_delta", &t_ctx2::get_cell_delta)
        .function<void>("set_depth", &t_ctx2::set_depth)
        .function("open", select_overload<t_index(t_header, t_tvidx)>(&t_ctx2::open))
        .function("close", select_overload<t_index(t_header, t_tvidx)>(&t_ctx2::close))
        .function<t_aggspecvec>("get_column_names", &t_ctx2::get_aggregates)
        .function<t_tscalvec>("unity_get_row_data", &t_ctx2::unity_get_row_data)
        .function<t_tscalvec>("unity_get_column_data", &t_ctx2::unity_get_column_data)
        .function<t_tscalvec>("unity_get_row_path", &t_ctx2::unity_get_row_path)
        .function<t_tscalvec>("unity_get_column_path", &t_ctx2::unity_get_column_path)
        .function<t_uindex>("unity_get_row_depth", &t_ctx2::unity_get_row_depth)
        .function<t_uindex>("unity_get_column_depth", &t_ctx2::unity_get_column_depth)
        .function<t_str>("unity_get_column_name", &t_ctx2::unity_get_column_name)
        .function<t_str>(
            "unity_get_column_display_name", &t_ctx2::unity_get_column_display_name)
        .function<t_svec>("unity_get_column_names", &t_ctx2::unity_get_column_names)
        .function<t_svec>(
            "unity_get_column_display_names", &t_ctx2::unity_get_column_display_names)
        .function<t_uindex>("unity_get_column_count", &t_ctx2::unity_get_column_count)
        .function<t_uindex>("unity_get_row_count", &t_ctx2::unity_get_row_count)
        .function<t_bool>("unity_get_row_expanded", &t_ctx2::unity_get_row_expanded)
        .function<t_bool>("unity_get_column_expanded", &t_ctx2::unity_get_column_expanded)
        .function<void>("unity_init_load_step_end", &t_ctx2::unity_init_load_step_end)
        .function<t_totals>("get_totals", &t_ctx2::get_totals)
        .function<t_tscalvec>("get_column_path_userspace", &t_ctx2::get_column_path_userspace)
        .function<void>("unity_init_load_step_end", &t_ctx2::unity_init_load_step_end);

    class_<t_pool>("t_pool")
        .constructor<emscripten::val>()
        .smart_ptr<std::shared_ptr<t_pool>>("shared_ptr<t_pool>")
        .function<unsigned int>("register_gnode", &t_pool::register_gnode, allow_raw_pointers())
        .function<void>("process", &t_pool::_process)
        .function<void>("send", &t_pool::send)
        .function<t_uindex>("epoch", &t_pool::epoch)
        .function<void>("unregister_gnode", &t_pool::unregister_gnode)
        .function<void>("set_update_delegate", &t_pool::set_update_delegate)
        .function<void>("register_context", &t_pool::register_context)
        .function<void>("unregister_context", &t_pool::unregister_context)
        .function<t_updctx_vec>("get_contexts_last_updated", &t_pool::get_contexts_last_updated)
        .function<t_uidxvec>("get_gnodes_last_updated", &t_pool::get_gnodes_last_updated)
        .function<t_gnode*>("get_gnode", &t_pool::get_gnode, allow_raw_pointers());

    class_<t_aggspec>("t_aggspec").function<std::string>("name", &t_aggspec::name);

    class_<t_tscalar>("t_tscalar");

    value_object<t_updctx>("t_updctx")
        .field("gnode_id", &t_updctx::m_gnode_id)
        .field("ctx_name", &t_updctx::m_ctx);

    value_object<t_cellupd>("t_cellupd")
        .field("row", &t_cellupd::row)
        .field("column", &t_cellupd::column)
        .field("old_value", &t_cellupd::old_value)
        .field("new_value", &t_cellupd::new_value);

    value_object<t_stepdelta>("t_stepdelta")
        .field("rows_changed", &t_stepdelta::rows_changed)
        .field("columns_changed", &t_stepdelta::columns_changed)
        .field("cells", &t_stepdelta::cells);

    register_vector<t_dtype>("t_dtypevec");
    register_vector<t_cellupd>("t_cellupdvec");
    register_vector<t_aggspec>("t_aggspecvec");
    register_vector<t_tscalar>("t_tscalvec");
    register_vector<std::string>("std::vector<std::string>");
    register_vector<t_updctx>("t_updctx_vec");
    register_vector<t_uindex>("t_uidxvec");

    enum_<t_header>("t_header")
        .value("HEADER_ROW", HEADER_ROW)
        .value("HEADER_COLUMN", HEADER_COLUMN);

    enum_<t_ctx_type>("t_ctx_type")
        .value("ZERO_SIDED_CONTEXT", ZERO_SIDED_CONTEXT)
        .value("ONE_SIDED_CONTEXT", ONE_SIDED_CONTEXT)
        .value("TWO_SIDED_CONTEXT", TWO_SIDED_CONTEXT)
        .value("GROUPED_ZERO_SIDED_CONTEXT", GROUPED_ZERO_SIDED_CONTEXT)
        .value("GROUPED_PKEY_CONTEXT", GROUPED_PKEY_CONTEXT)
        .value("GROUPED_COLUMNS_CONTEXT", GROUPED_COLUMNS_CONTEXT);

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

    enum_<t_totals>("t_totals")
        .value("TOTALS_BEFORE", TOTALS_BEFORE)
        .value("TOTALS_HIDDEN", TOTALS_HIDDEN)
        .value("TOTALS_AFTER", TOTALS_AFTER);

    function("sort", &sort);
    function("make_table", &make_table);
    function("make_gnode", &make_gnode);
    function("clone_gnode_table", &clone_gnode_table);
    function("make_context_zero", &make_context_zero);
    function("make_context_one", &make_context_one);
    function("make_context_two", &make_context_two);
    function("scalar_to_val", &scalar_to_val);
    function("scalar_vec_to_val", &scalar_vec_to_val);
    function("table_add_computed_column", &table_add_computed_column);
    function("set_column_nth", &set_column_nth, allow_raw_pointers());
    function("get_data_zero", &get_data<t_ctx0_sptr>);
    function("get_data_one", &get_data<t_ctx1_sptr>);
    function("get_data_two", &get_data<t_ctx2_sptr>);
    function("col_to_js_typed_array_zero", &col_to_js_typed_array<t_ctx0_sptr>);
    function("col_to_js_typed_array_one", &col_to_js_typed_array<t_ctx1_sptr>);
    function("col_to_js_typed_array_two", &col_to_js_typed_array<t_ctx2_sptr>);
}
