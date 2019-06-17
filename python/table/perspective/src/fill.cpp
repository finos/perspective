/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
#ifdef PSP_ENABLE_PYTHON

#include <perspective/base.h>
#include <perspective/binding.h>
#include <perspective/python/base.h>
#include <perspective/python/fill.h>
#include <perspective/python/utils.h>

namespace perspective {
namespace binding {

/******************************************************************************
 *
 * Fill columns with data
 */

void
_fill_col_time(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // t_val data = accessor["values"];
        // arrow packs 64 bit into two 32 bit ints
        // arrow::vecFromTypedArray(data, col->get_nth<t_time>(0), nrows * 2);

        // std::int8_t unit = accessor["type"]["unit"].as<std::int8_t>();
        // if (unit != /* Arrow.enum_.TimeUnit.MILLISECOND */ 1) {
            // Slow path - need to convert each value
            // std::int64_t factor = 1;
            // if (unit == /* Arrow.enum_.TimeUnit.NANOSECOND */ 3) {
                // factor = 1e6;
            // } else if (unit == /* Arrow.enum_.TimeUnit.MICROSECOND */ 2) {
                // factor = 1e3;
            // }
            // for (auto i = 0; i < nrows; ++i) {
                // col->set_nth<std::int64_t>(i, *(col->get_nth<std::int64_t>(i)) / factor);
            // }
        // }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            col->set_nth(i, pythondatetime_to_ms(item));
        }
    }
}

// TODO: implement
void
_fill_col_date(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // t_val data = dcol["values"];
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
            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            col->set_nth(i, pythondate_to_t_date(item));
        }
    }
}

void
_fill_col_bool(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // TODO
        // bools are stored using a bit mask
        // t_val data = accessor["values"];
        // for (auto i = 0; i < nrows; ++i) {
        //     t_val item = data[i / 8];

        //     if (item.isUndefined()) {
        //         continue;
        //     }

        //     if (item.isNull()) {
        //         if (is_update) {
        //             col->unset(i);
        //         } else {
        //             col->clear(i);
        //         }
        //         continue;
        //     }

        //     std::uint8_t elem = item.as<std::uint8_t>();
        //     bool v = elem & (1 << (i % 8));
        //     col->set_nth(i, v);
        // }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            auto elem = item.cast<bool>();
            col->set_nth(i, elem);
        }
    }
}

void
_fill_col_string(t_data_accessor accessor, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {

    t_uindex nrows = col->size();

    if (is_arrow) {
        // TODO
        // if (accessor["constructor"]["name"].as<std::string>() == "DictionaryVector") {

        //     t_val dictvec = accessor["dictionary"];
        //     arrow::fill_col_dict(dictvec, col);

        //     // Now process index into dictionary

        //     // Perspective stores string indices in a 32bit unsigned array
        //     // Javascript's typed arrays handle copying from various bitwidth arrays
        //     // properly
        //     t_val vkeys = accessor["indices"]["values"];
        //     arrow::vecFromTypedArray(
        //         vkeys, col->get_nth<t_uindex>(0), nrows, "Uint32Array");

        // } else if (accessor["constructor"]["name"].as<std::string>() == "Utf8Vector"
        //     || accessor["constructor"]["name"].as<std::string>() == "BinaryVector") {

        //     t_val vdata = accessor["values"];
        //     std::int32_t vsize = vdata["length"].as<std::int32_t>();
        //     std::vector<std::uint8_t> data;
        //     data.reserve(vsize);
        //     data.resize(vsize);
        //     arrow::vecFromTypedArray(vdata, data.data(), vsize);

        //     t_val voffsets = accessor["valueOffsets"];
        //     std::int32_t osize = voffsets["length"].as<std::int32_t>();
        //     std::vector<std::int32_t> offsets;
        //     offsets.reserve(osize);
        //     offsets.resize(osize);
        //     arrow::vecFromTypedArray(voffsets, offsets.data(), osize);

        //     std::string elem;

        //     for (std::int32_t i = 0; i < nrows; ++i) {
        //         std::int32_t bidx = offsets[i];
        //         std::size_t es = offsets[i + 1] - bidx;
        //         elem.assign(reinterpret_cast<char*>(data.data()) + bidx, es);
        //         col->set_nth(i, elem);
        //     }
        // }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            std::wstring welem = item.cast<std::wstring>();
            std::wstring_convert<utf16convert_type, wchar_t> converter;
            std::string elem = converter.to_bytes(welem);
            col->set_nth(i, elem);
        }
    }
}

void
_fill_col_int64(t_data_accessor accessor, t_data_table& tbl, std::shared_ptr<t_column> col, std::string name,
    std::int32_t cidx, t_dtype type, bool is_arrow, bool is_update) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // TODO
        // t_val data = accessor["values"];
        // // arrow packs 64 bit into two 32 bit ints
        // arrow::vecFromTypedArray(data, col->get_nth<std::int64_t>(0), nrows * 2);
    } else {
        t_uindex nrows = col->size();
        for (auto i = 0; i < nrows; ++i) {
            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            double fval = item.cast<double>();
            if (isnan(fval)) {
                WARN("Promoting to string");
                tbl.promote_column(name, DTYPE_STR, i, false);
                col = tbl.get_column(name);
                _fill_col_string(
                    accessor, col, name, cidx, DTYPE_STR, is_arrow, is_update);
                return;
            } else {
                col->set_nth(i, static_cast<std::int64_t>(fval));
            }
        }
    }
}


template <>
void
set_column_nth(t_column* col, t_uindex idx, t_val value) {

    // Check if the value is a javascript null
    if (value.is_none()) {
        col->unset(idx);
        return;
    }

    switch (col->get_dtype()) {
        case DTYPE_BOOL: {
            col->set_nth<bool>(idx, value.cast<bool>(), STATUS_VALID);
            break;
        }
        case DTYPE_FLOAT64: {
            col->set_nth<double>(idx, value.cast<double>(), STATUS_VALID);
            break;
        }
        case DTYPE_FLOAT32: {
            col->set_nth<float>(idx, value.cast<float>(), STATUS_VALID);
            break;
        }
        case DTYPE_UINT32: {
            col->set_nth<std::uint32_t>(idx, value.cast<std::uint32_t>(), STATUS_VALID);
            break;
        }
        case DTYPE_UINT64: {
            col->set_nth<std::uint64_t>(idx, value.cast<std::uint64_t>(), STATUS_VALID);
            break;
        }
        case DTYPE_INT32: {
            col->set_nth<std::int32_t>(idx, value.cast<std::int32_t>(), STATUS_VALID);
            break;
        }
        case DTYPE_INT64: {
            col->set_nth<std::int64_t>(idx, value.cast<std::int64_t>(), STATUS_VALID);
            break;
        }
        case DTYPE_STR: {
            std::wstring welem = value.cast<std::wstring>();

            std::wstring_convert<utf16convert_type, wchar_t> converter;
            std::string elem = converter.to_bytes(welem);
            col->set_nth(idx, elem, STATUS_VALID);
            break;
        }
        case DTYPE_DATE: {
            col->set_nth<t_date>(idx, pythondate_to_t_date(value), STATUS_VALID);
            break;
        }
        case DTYPE_TIME: {
            col->set_nth<std::int64_t>(
                idx, static_cast<std::int64_t>(value.cast<double>()), STATUS_VALID);
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

void
_fill_col_numeric(t_data_accessor accessor, t_data_table& tbl,
    std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type,
    bool is_arrow, bool is_update) {
    t_uindex nrows = col->size();

    if (is_arrow) {
        // TODO
        // t_val data = accessor["values"];

        // switch (type) {
        //     case DTYPE_INT8: {
        //         arrow::vecFromTypedArray(data, col->get_nth<std::int8_t>(0), nrows);
        //     } break;
        //     case DTYPE_INT16: {
        //         arrow::vecFromTypedArray(data, col->get_nth<std::int16_t>(0), nrows);
        //     } break;
        //     case DTYPE_INT32: {
        //         arrow::vecFromTypedArray(data, col->get_nth<std::int32_t>(0), nrows);
        //     } break;
        //     case DTYPE_FLOAT32: {
        //         arrow::vecFromTypedArray(data, col->get_nth<float>(0), nrows);
        //     } break;
        //     case DTYPE_FLOAT64: {
        //         arrow::vecFromTypedArray(data, col->get_nth<double>(0), nrows);
        //     } break;
        //     default:
        //         break;
        // }
    } else {
        for (auto i = 0; i < nrows; ++i) {
            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            switch (type) {
                case DTYPE_INT8: {
                    col->set_nth(i, item.cast<std::int8_t>());
                } break;
                case DTYPE_INT16: {
                    col->set_nth(i, item.cast<std::int16_t>());
                } break;
                case DTYPE_INT32: {
                    // This handles cases where a long sequence of e.g. 0 precedes a clearly
                    // float value in an inferred column. Would not be needed if the type
                    // inference checked the entire column/we could reset parsing.
                    double fval = item.cast<double>();
                    if (fval > 2147483647 || fval < -2147483648) {
                        WARN("Promoting to float");
                        tbl.promote_column(name, DTYPE_FLOAT64, i, true);
                        col = tbl.get_column(name);
                        type = DTYPE_FLOAT64;
                        col->set_nth(i, fval);
                    } else if (isnan(fval)) {
                        WARN("Promoting to string");
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
                    col->set_nth(i, item.cast<float>());
                } break;
                case DTYPE_FLOAT64: {
                    col->set_nth(i, item.cast<double>());
                } break;
                default:
                    break;
            }
        }
    }
}

// TODO
// template <>
// void
// table_add_computed_column(t_data_table& table, t_val computed_defs) {
//     auto vcomputed_defs = vecFromArray<t_val, t_val>(computed_defs);
//     for (auto i = 0; i < vcomputed_defs.size(); ++i) {
//         t_val coldef = vcomputed_defs[i];
//         std::string name = coldef["column"].cast<std::string>();
//         t_val inputs = coldef["inputs"];
//         t_val func = coldef["func"];
//         t_val type = coldef["type"];

//         std::string stype;

//         if (type.isUndefined()) {
//             stype = "string";
//         } else {
//             stype = type.cast<std::string>();
//         }

//         t_dtype dtype;
//         if (stype == "integer") {
//             dtype = DTYPE_INT32;
//         } else if (stype == "float") {
//             dtype = DTYPE_FLOAT64;
//         } else if (stype == "boolean") {
//             dtype = DTYPE_BOOL;
//         } else if (stype == "date") {
//             dtype = DTYPE_DATE;
//         } else if (stype == "datetime") {
//             dtype = DTYPE_TIME;
//         } else {
//             dtype = DTYPE_STR;
//         }

//         // Get list of input column names
//         auto icol_names = vecFromArray<t_val, std::string>(inputs);

//         // Get t_column* for all input columns
//         std::vector<const t_column*> icols;
//         for (const auto& cc : icol_names) {
//             icols.push_back(table._get_column(cc));
//         }

//         int arity = icols.size();

//         // Add new column
//         t_column* out = table.add_column(name, dtype, true);

//         t_val i1 = t_val::undefined(), i2 = t_val::undefined(), i3 = t_val::undefined(),
//               i4 = t_val::undefined();

//         t_uindex size = table.size();
//         for (t_uindex ridx = 0; ridx < size; ++ridx) {
//             t_val value = t_val::undefined();

//             switch (arity) {
//                 case 0: {
//                     value = func();
//                     break;
//                 }
//                 case 1: {
//                     i1 = scalar_to_val(icols[0]->get_scalar(ridx));
//                     if (!i1.isNull()) {
//                         value = func(i1);
//                     }
//                     break;
//                 }
//                 case 2: {
//                     i1 = scalar_to_val(icols[0]->get_scalar(ridx));
//                     i2 = scalar_to_val(icols[1]->get_scalar(ridx));
//                     if (!i1.isNull() && !i2.isNull()) {
//                         value = func(i1, i2);
//                     }
//                     break;
//                 }
//                 case 3: {
//                     i1 = scalar_to_val(icols[0]->get_scalar(ridx));
//                     i2 = scalar_to_val(icols[1]->get_scalar(ridx));
//                     i3 = scalar_to_val(icols[2]->get_scalar(ridx));
//                     if (!i1.isNull() && !i2.isNull() && !i3.isNull()) {
//                         value = func(i1, i2, i3);
//                     }
//                     break;
//                 }
//                 case 4: {
//                     i1 = scalar_to_val(icols[0]->get_scalar(ridx));
//                     i2 = scalar_to_val(icols[1]->get_scalar(ridx));
//                     i3 = scalar_to_val(icols[2]->get_scalar(ridx));
//                     i4 = scalar_to_val(icols[3]->get_scalar(ridx));
//                     if (!i1.isNull() && !i2.isNull() && !i3.isNull() && !i4.isNull()) {
//                         value = func(i1, i2, i3, i4);
//                     }
//                     break;
//                 }
//                 default: {
//                     // Don't handle other arity values
//                     break;
//                 }
//             }

//             if (!value.isUndefined()) {
//                 set_column_nth(out, ridx, value);
//             }
//         }
//     }
// }

void
_fill_data_helper(t_data_accessor accessor, t_data_table& tbl,
    std::shared_ptr<t_column> col, std::string name, std::int32_t cidx, t_dtype type,
    bool is_arrow, bool is_update) {
    switch (type) {
        case DTYPE_INT64: {
            _fill_col_int64(accessor, tbl, col, name, cidx, type, is_arrow, is_update);
        } break;
        case DTYPE_BOOL: {
            _fill_col_bool(accessor, col, name, cidx, type, is_arrow, is_update);
        } break;
        case DTYPE_DATE: {
            _fill_col_date(accessor, col, name, cidx, type, is_arrow, is_update);
        } break;
        case DTYPE_TIME: {
            _fill_col_time(accessor, col, name, cidx, type, is_arrow, is_update);
        } break;
        case DTYPE_STR: {
            _fill_col_string(accessor, col, name, cidx, type, is_arrow, is_update);
        } break;
        case DTYPE_NONE: {
            break;
        }
        default:
            _fill_col_numeric(
                accessor, tbl, col, name, cidx, type, is_arrow, is_update);
    }
}

/******************************************************************************
 *
 * Fill tables with data
 */

void
_fill_data(t_data_table& tbl, t_data_accessor accessor, const t_schema& input_schema,
           const std::string& index, std::uint32_t offset, std::uint32_t limit,
           bool is_arrow, bool is_update) {
    bool implicit_index = false;
    std::vector<std::string> col_names(input_schema.columns());
    std::vector<t_dtype> data_types(input_schema.types());

    for (auto cidx = 0; cidx < col_names.size(); ++cidx) {
        auto name = col_names[cidx];
        auto type = data_types[cidx];

        t_val dcol = py::none();

        if (is_arrow) {
            //TODO
            // dcol = accessor["cdata"][cidx];
        } else {
            dcol = accessor;
        }
        if (name == "__INDEX__") {
            implicit_index = true;
            std::shared_ptr<t_column> pkey_col_sptr = tbl.add_column_sptr("psp_pkey", type, true);
            _fill_data_helper(dcol, tbl, pkey_col_sptr, "psp_pkey", cidx, type, is_arrow, is_update);
            tbl.clone_column("psp_pkey", "psp_okey");
            continue;
         }

        auto col = tbl.get_column(name);
        _fill_data_helper(dcol, tbl, col, name, cidx, type, is_arrow, is_update);

        if (is_arrow) {
            // TODO
            // // Fill validity bitmap
            // std::uint32_t null_count = dcol["nullCount"].cast<std::uint32_t>();

            // if (null_count == 0) {
            //     col->valid_raw_fill();
            // } else {
            //     t_val validity = dcol["nullBitmap"];
            //     arrow::fill_col_valid(validity, col);
            // }
        }
    }
    // Fill index column - recreated every time a `t_data_table` is created.
    if (!implicit_index) {
        if (index == "") {
            // Use row number as index if not explicitly provided or provided with `__INDEX__`
            auto key_col = tbl.add_column("psp_pkey", DTYPE_INT32, true);
            auto okey_col = tbl.add_column("psp_okey", DTYPE_INT32, true);

            for (std::uint32_t ridx = 0; ridx < tbl.size(); ++ridx) {
                key_col->set_nth<std::int32_t>(ridx, (ridx + offset) % limit);
                okey_col->set_nth<std::int32_t>(ridx, (ridx + offset) % limit);
            }
        } else {
            tbl.clone_column(index, "psp_pkey");
            tbl.clone_column(index, "psp_okey");
        }
    }
}

} //namespace binding
} //namespace perspective

#endif