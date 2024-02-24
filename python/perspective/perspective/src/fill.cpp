// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

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
    _fill_col_time(
        t_data_accessor accessor,
        std::shared_ptr<t_column> col,
        std::string name,
        std::int32_t cidx,
        t_dtype type,
        bool is_update,
        bool is_limit
    ) {
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            if (!accessor.attr("_has_column")(i, name).cast<bool>()
                && !is_limit) {
                continue;
            }

            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            col->set_nth(i, item.cast<std::int64_t>());
        }
    }

    void
    _fill_col_date(
        t_data_accessor accessor,
        std::shared_ptr<t_column> col,
        std::string name,
        std::int32_t cidx,
        t_dtype type,
        bool is_update,
        bool is_limit
    ) {
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            if (!accessor.attr("_has_column")(i, name).cast<bool>()
                && !is_limit) {
                continue;
            }

            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            auto date_components =
                item.cast<std::map<std::string, std::int32_t>>();
            t_date dt = t_date(
                date_components["year"],
                date_components["month"],
                date_components["day"]
            );
            col->set_nth(i, dt);
        }
    }

    void
    _fill_col_bool(
        t_data_accessor accessor,
        std::shared_ptr<t_column> col,
        std::string name,
        std::int32_t cidx,
        t_dtype type,
        bool is_update,
        bool is_limit
    ) {
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            if (!accessor.attr("_has_column")(i, name).cast<bool>()
                && !is_limit) {
                continue;
            }

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

    void
    _fill_col_string(
        t_data_accessor accessor,
        std::shared_ptr<t_column> col,
        std::string name,
        std::int32_t cidx,
        t_dtype type,
        bool is_update,
        bool is_limit
    ) {

        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            if (!accessor.attr("_has_column")(i, name).cast<bool>()
                && !is_limit) {
                continue;
            }

            t_val item = accessor.attr("marshal")(cidx, i, type);

            if (item.is_none()) {
                if (is_update) {
                    col->unset(i);
                } else {
                    col->clear(i);
                }
                continue;
            }

            col->set_nth(i, item.cast<std::string>());
        }
    }

    template <>
    void
    set_column_nth(std::shared_ptr<t_column> col, t_uindex idx, t_val value) {
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
                col->set_nth<std::uint32_t>(
                    idx, value.cast<std::uint32_t>(), STATUS_VALID
                );
                break;
            }
            case DTYPE_UINT64: {
                col->set_nth<std::uint64_t>(
                    idx, value.cast<std::uint64_t>(), STATUS_VALID
                );
                break;
            }
            case DTYPE_INT32: {
                col->set_nth<std::int32_t>(
                    idx, value.cast<std::int32_t>(), STATUS_VALID
                );
                break;
            }
            case DTYPE_INT64: {
                col->set_nth<std::int64_t>(
                    idx, value.cast<std::int64_t>(), STATUS_VALID
                );
                break;
            }
            case DTYPE_STR: {
                col->set_nth(idx, value.cast<std::string>(), STATUS_VALID);
                break;
            }
            case DTYPE_DATE: {
                t_date dt = t_date(
                    value.attr("year").cast<std::int32_t>(),
                    value.attr("month").cast<std::int32_t>(),
                    value.attr("day").cast<std::int32_t>()
                );
                col->set_nth<t_date>(idx, dt, STATUS_VALID);
                break;
            }
            case DTYPE_TIME: {
                col->set_nth<std::int64_t>(
                    idx,
                    static_cast<std::int64_t>(value.cast<double>()),
                    STATUS_VALID
                );
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
    _fill_col_numeric(
        t_data_accessor accessor,
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        std::string name,
        std::int32_t cidx,
        t_dtype type,
        bool is_update,
        bool is_limit
    ) {
        t_uindex nrows = col->size();

        for (auto i = 0; i < nrows; ++i) {
            if (!accessor.attr("_has_column")(i, name).cast<bool>()
                && !is_limit) {
                continue;
            }

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
                case DTYPE_UINT8: {
                    col->set_nth(i, item.cast<std::uint8_t>());
                } break;
                case DTYPE_UINT16: {
                    col->set_nth(i, item.cast<std::uint16_t>());
                } break;
                case DTYPE_UINT32: {
                    col->set_nth(i, item.cast<std::uint32_t>());
                } break;
                case DTYPE_UINT64: {
                    col->set_nth(i, item.cast<std::uint64_t>());
                } break;
                case DTYPE_INT8: {
                    col->set_nth(i, item.cast<std::int8_t>());
                } break;
                case DTYPE_INT16: {
                    col->set_nth(i, item.cast<std::int16_t>());
                } break;
                case DTYPE_INT32: {
                    // This handles cases where a long sequence of e.g. 0
                    // precedes a clearly float value in an inferred column.
                    // Would not be needed if the type inference checked the
                    // entire column/we could reset parsing.

                    // First we need to see if we can cast to double
                    double fval;
                    if (!py::hasattr(item, "__float__")) {
                        if (py::hasattr(item, "__int__")) {
                            // promote from int
                            fval = static_cast<double>(item.cast<int>());
                        } else {
                            // not __float__ and no __int__ defined, set to NaN
                            fval = std::nan("");
                        }
                    } else {
                        fval = item.cast<double>();
                    }

                    if (!is_update
                        && (fval > 2147483647 || fval < -2147483648)) {
                        WARN("Promoting column `%s` to float from int32", name);
                        tbl.promote_column(name, DTYPE_FLOAT64, i, true);
                        col = tbl.get_column(name);
                        type = DTYPE_FLOAT64;
                        col->set_nth(i, fval);
                    } else if (!is_update && isnan(fval)) {
                        WARN(
                            "Promoting column `%s` to string from int32", name
                        );
                        tbl.promote_column(name, DTYPE_STR, i, false);
                        col = tbl.get_column(name);
                        _fill_col_string(
                            accessor,
                            col,
                            name,
                            cidx,
                            DTYPE_STR,
                            is_update,
                            is_limit
                        );
                        return;
                    } else {
                        col->set_nth(i, static_cast<std::int32_t>(fval));
                    }
                } break;
                case DTYPE_INT64: {
                    // First we need to see if we can cast to double
                    double fval;
                    if (!py::hasattr(item, "__float__")) {
                        if (py::hasattr(item, "__int__")) {
                            // promote from int
                            fval = static_cast<double>(item.cast<int>());
                        } else {
                            // not __float__ and no __int__ defined, set to NaN
                            fval = std::nan("");
                        }
                    } else {
                        fval = item.cast<double>();
                    }

                    if (!is_update && isnan(fval)) {
                        WARN(
                            "Promoting column `%s` to string from int64", name
                        );
                        tbl.promote_column(name, DTYPE_STR, i, false);
                        col = tbl.get_column(name);
                        _fill_col_string(
                            accessor,
                            col,
                            name,
                            cidx,
                            DTYPE_STR,
                            is_update,
                            is_limit
                        );
                        return;
                    } else {
                        col->set_nth(i, static_cast<std::int64_t>(fval));
                    }
                } break;
                case DTYPE_FLOAT32: {
                    col->set_nth(i, item.cast<float>());
                } break;
                case DTYPE_FLOAT64: {
                    bool is_float = py::isinstance<py::float_>(item)
                        || py::hasattr(item, "__float__")
                        || py::hasattr(item, "__int__");

                    bool is_numpy_nan = false;
                    if (py::isinstance<py::float_>(item)
                        || py::hasattr(item, "__float__")) {
                        is_numpy_nan = npy_isnan(item.cast<double>());
                    }

                    if (!is_update && (!is_float || is_numpy_nan)) {
                        WARN(
                            "Promoting column `%s` to string from float64", name
                        );
                        tbl.promote_column(name, DTYPE_STR, i, false);
                        col = tbl.get_column(name);
                        _fill_col_string(
                            accessor,
                            col,
                            name,
                            cidx,
                            DTYPE_STR,
                            is_update,
                            is_limit
                        );
                        return;
                    }

                    // If not a float directly and doesn't have __float__, must
                    // promote with __int__
                    if (!py::isinstance<py::float_>(item)
                        && !py::hasattr(item, "__float__")) {
                        col->set_nth(
                            i, static_cast<double>(item.cast<std::int64_t>())
                        );
                    } else {
                        col->set_nth(i, item.cast<double>());
                    }
                } break;
                case DTYPE_OBJECT: {
                    PSP_COMPLAIN_AND_ABORT("Object columns not supported");
                } break;
                default:
                    break;
            }
        }
    }

    void
    _fill_data_helper(
        t_data_accessor accessor,
        t_data_table& tbl,
        std::shared_ptr<t_column> col,
        std::string name,
        std::int32_t cidx,
        t_dtype type,
        bool is_update,
        bool is_limit
    ) {
        switch (type) {
            case DTYPE_BOOL: {
                _fill_col_bool(
                    accessor, col, name, cidx, type, is_update, is_limit
                );
            } break;
            case DTYPE_DATE: {
                _fill_col_date(
                    accessor, col, name, cidx, type, is_update, is_limit
                );
            } break;
            case DTYPE_TIME: {
                _fill_col_time(
                    accessor, col, name, cidx, type, is_update, is_limit
                );
            } break;
            case DTYPE_STR: {
                _fill_col_string(
                    accessor, col, name, cidx, type, is_update, is_limit
                );
            } break;
            case DTYPE_NONE: {
                break;
            }
            default:
                _fill_col_numeric(
                    accessor, tbl, col, name, cidx, type, is_update, is_limit
                );
        }
    }

    /******************************************************************************
     *
     * Fill tables with data
     */

    void
    _fill_data(
        t_data_table& tbl,
        t_data_accessor accessor,
        const t_schema& input_schema,
        const std::string& index,
        std::uint32_t offset,
        std::uint32_t limit,
        bool is_update
    ) {
        bool implicit_index = false;
        bool is_limit = limit != UINT32_MAX;
        std::vector<std::string> col_names(input_schema.columns());
        std::vector<t_dtype> data_types(input_schema.types());

        for (auto cidx = 0; cidx < col_names.size(); ++cidx) {
            auto name = col_names[cidx];
            auto type = data_types[cidx];

            if (name == "__INDEX__") {
                implicit_index = true;
                std::shared_ptr<t_column> pkey_col_sptr =
                    tbl.add_column_sptr("psp_pkey", type, true);
                _fill_data_helper(
                    accessor,
                    tbl,
                    pkey_col_sptr,
                    "psp_pkey",
                    cidx,
                    type,
                    is_update,
                    is_limit
                );
                tbl.clone_column("psp_pkey", "psp_okey");
                continue;
            }

            auto col = tbl.get_column(name);
            _fill_data_helper(
                accessor, tbl, col, name, cidx, type, is_update, is_limit
            );
        }
        // Fill index column - recreated every time a `t_data_table` is created.
        if (!implicit_index) {
            if (index == "") {
                // Use row number as index if not explicitly provided or
                // provided with `__INDEX__`
                auto key_col = tbl.add_column("psp_pkey", DTYPE_INT32, true);
                auto okey_col = tbl.add_column("psp_okey", DTYPE_INT32, true);

                for (std::uint32_t ridx = 0; ridx < tbl.size(); ++ridx) {
                    key_col->set_nth<std::int32_t>(
                        ridx, (ridx + offset) % limit
                    );
                    okey_col->set_nth<std::int32_t>(
                        ridx, (ridx + offset) % limit
                    );
                }
            } else {
                tbl.clone_column(index, "psp_pkey");
                tbl.clone_column(index, "psp_okey");
            }
        }
    }

} // namespace binding
} // namespace perspective

#endif