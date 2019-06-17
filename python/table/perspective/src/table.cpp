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
#include <perspective/python/accessor.h>
#include <perspective/python/base.h>
#include <perspective/python/fill.h>
#include <perspective/python/table.h>
#include <perspective/python/utils.h>

namespace perspective {
namespace binding {

/******************************************************************************
 *
 * Table API
 */

std::shared_ptr<Table> make_table_py(t_val table, t_data_accessor accessor, t_val computed,
        std::uint32_t limit, py::str index, t_op op, bool is_update, bool is_arrow) {
    std::vector<std::string> column_names;
    std::vector<t_dtype> data_types;

    // Determine metadata
    bool is_delete = op == OP_DELETE;
    if (is_arrow || (is_update || is_delete)) {
        column_names = accessor.attr("names")().cast<std::vector<std::string>>();
        data_types = accessor.attr("types")().cast<std::vector<t_dtype>>();
    } else {
        // Infer names and types
        t_val data = accessor.attr("data")();
        std::int32_t format = accessor.attr("format")().cast<std::int32_t>();
        column_names = get_column_names(data, format);
        data_types = get_data_types(data, format, column_names, accessor.attr("date_validator")().cast<t_val>());
    }

    // Check if index is valid after getting column names
    bool table_initialized = !table.is_none();
    std::shared_ptr<t_pool> pool;
    std::shared_ptr<Table> tbl;
    std::uint32_t offset;

    // If the Table has already been created, use it
    if (table_initialized) {
        // Get a reference to the Table, and update its metadata
        tbl = table.cast<std::shared_ptr<Table>>();
        pool = tbl->get_pool();
        tbl->set_column_names(column_names);
        tbl->set_data_types(data_types);
        offset = tbl->get_offset();

        auto current_gnode = tbl->get_gnode();

        // use gnode metadata to help decide if we need to update
        is_update = (is_update || current_gnode->mapping_size() > 0);

        // if performing an arrow schema update, promote columns
        auto current_data_table = current_gnode->get_table();

        if (is_arrow && is_update && current_data_table->size() == 0) {
            auto current_schema = current_data_table->get_schema();
            for (auto idx = 0; idx < current_schema.m_types.size(); ++idx) {
                if (data_types[idx] == DTYPE_INT64) {
                    WARN("Promoting int64 '" + column_names[idx] + "'");
                    current_gnode->promote_column(column_names[idx], DTYPE_INT64);
                }
            }
        }
    } else {
        pool = std::make_shared<t_pool>();
        tbl = std::make_shared<Table>(pool, column_names, data_types, limit, index);
        offset = 0;
    }

    // Create input schema - an input schema contains all columns to be displayed AND index + operation columns
    t_schema input_schema(column_names, data_types);

    // strip implicit index, if present
    auto implicit_index_it = std::find(column_names.begin(), column_names.end(), "__INDEX__");
    if (implicit_index_it != column_names.end()) {
        auto idx = std::distance(column_names.begin(), implicit_index_it);
        // position of the column is at the same index in both vectors
        column_names.erase(column_names.begin() + idx);
        data_types.erase(data_types.begin() + idx);
    }

    // Create output schema - contains only columns to be displayed to the user
    t_schema output_schema(column_names, data_types); // names + types might have been mutated at this point after implicit index removal

    std::uint32_t row_count = accessor.attr("row_count")().cast<std::int32_t>();
    t_data_table data_table(output_schema);
    data_table.init();
    data_table.extend(row_count);

    // write data at the correct row
    _fill_data(data_table, accessor, input_schema, index, offset, limit, is_arrow, is_update);

     if (!computed.is_none()) {
        // TODO
        // re-add computed columns after update, delete, etc.
        // table_add_computed_column(data_table, computed);
     }

    // calculate offset, limit, and set the gnode
    tbl->init(data_table, row_count, op);

    // FIXME: replicate JS _clear_process etc.
    pool->_process();
    return tbl;
}

std::shared_ptr<Table>
make_computed_table_py(std::shared_ptr<Table> table, t_val computed) {
    // TODO
    return table;
}

} //namespace binding
} //namespace perspective

#endif