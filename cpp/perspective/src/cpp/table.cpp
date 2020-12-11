/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/table.h>

// Give each Table a unique ID so that operations on it map back correctly
static perspective::t_uindex GLOBAL_TABLE_ID = 0;

namespace perspective {
Table::Table(
        std::shared_ptr<t_pool> pool,
        const std::vector<std::string>& column_names,
        const std::vector<t_dtype>& data_types,
        std::uint32_t limit,
        const std::string& index)
    : m_init(false)
    , m_id(GLOBAL_TABLE_ID++)
    , m_pool(pool)
    , m_column_names(column_names)
    , m_data_types(data_types)
    , m_offset(0)
    , m_limit(limit)
    , m_index(index)
    , m_gnode_set(false) {
        validate_columns(m_column_names);
    }

void
Table::init(t_data_table& data_table, std::uint32_t row_count, const t_op op, const t_uindex port_id) {
    /**
     * For the Table to be initialized correctly, make sure that the operation and index columns are
     * processed before the new offset is calculated. Calculating the offset before the `process_op_column`
     * and `process_index_column` causes primary keys to be misaligned.
     */
    process_op_column(data_table, op);
    calculate_offset(row_count);

    if (!m_gnode_set) {
        // create a new gnode, send it to the table
        auto new_gnode = make_gnode(data_table.get_schema());
        set_gnode(new_gnode);
        m_pool->register_gnode(m_gnode.get());
    }

    PSP_VERBOSE_ASSERT(m_gnode_set, "gnode is not set!");
    m_pool->send(m_gnode->get_id(), port_id, data_table);

    m_init = true;
}

t_uindex
Table::size() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_gnode->get_table()->size();
}

t_schema
Table::get_schema() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_gnode->get_output_schema();
}

t_schema 
Table::get_computed_schema(
    std::vector<t_computed_column_definition> computed_columns) const {
    std::vector<std::string> computed_column_names;
    std::vector<t_dtype> computed_column_types;

    computed_column_names.reserve(computed_columns.size());
    computed_column_types.reserve(computed_columns.size());
    
    // Computed columns live on the `t_gstate` master table, so this
    // schema will always contain ALL computed columns created by ALL views
    // on this table instance.
    auto master_table_schema = m_gnode->get_table_sptr()->get_schema();

    // However, we need to keep track of the "real" columns at the time the
    // table was instantiated, which exists on the output schema that will
    // not be mutated at a later time.
    auto gnode_schema = get_schema();

    // Validate each computed column: check that the name does not collide
    // with any "real" columns, that the input columns are valid and exist,
    // and that the computation is valid given the input types.
    for (const auto& computed : computed_columns) {
        bool skip = false;
        std::string name = std::get<0>(computed);
        t_computed_function_name computed_function_name = std::get<1>(computed);
        std::vector<std::string> input_columns = std::get<2>(computed);

        // Cannot overwrite real columns - this column and all columns to its
        // right are invalidated.
        if (gnode_schema.has_column(name)) {
            std::cerr 
                << "Cannot overwrite non-computed column `"
                << name
                << "` with a computed column."
                << std::endl;
            break;
        }

        // Validate that all input columns for each computed column exist.
        std::vector<t_dtype> input_types;
        for (const auto& input_column : input_columns) {
            t_dtype type;

            // If input column is not in the master table schema, then it must
            // be in the computed schema as the column definitions read L-R,
            // so all valid dependents for this column have already been
            // processed at this point.
            if (!master_table_schema.has_column(input_column)) {
                auto it = std::find(
                    computed_column_names.begin(),
                    computed_column_names.end(),
                    input_column);
                if (it == computed_column_names.end()) {
                    // Column doesn't exist anywhere, so treat this column
                    // as completely invalid. This also means that columns
                    // on its right, which may or may not depend on this column,
                    // are invalidated, and we stop iteration entirely.
                    std::cerr 
                        << "Input column `"
                        << input_column
                        << "` does not exist."
                        << std::endl;
                    skip = true;
                    break;
                } else {
                    auto name_idx = std::distance(
                        computed_column_names.begin(), it);
                    type = computed_column_types[name_idx];
                }
            } else {
                type = master_table_schema.get_dtype(input_column);
            }
            input_types.push_back(type);
        }

        if (skip) {
            // this column depends on a column that does not exist, so it
            // does not need to be typechecked.
            continue;
        }

        // Inputs are valid - get the computation and its expected types.
        t_computation computation = t_computed_column::get_computation(
            computed_function_name, input_types);

        // The computed column we are looking for already exists and is not
        // a "real" column, but we need to check whether we are overwriting
        // it with the same dtype - if the new column type is different,
        // this column is invalid.
        if (master_table_schema.has_column(name)) {
            t_dtype existing_dtype = master_table_schema.get_dtype(name);

            // Invalid - trying to overwrite a column with a different type.
            if (existing_dtype != computation.m_return_type) {
                std::cerr 
                    << "Cannot overwrite computed column '"
                    << name
                    << "' with a column of a different type."
                    << std::endl;
            } else {
                // Valid - replacing it with the same type.
                computed_column_names.push_back(name);
                computed_column_types.push_back(existing_dtype);
            }

            // No need to type check - column already valid or is invalid.
            continue;
        }

        // Type check the computation by taking the string function name
        // and input types and try to match it to a valid computation enum.
        if (computation.m_name == INVALID_COMPUTED_FUNCTION) {
            // Build error message and continue to the next computed column.
            std::vector<t_dtype> expected_dtypes = 
                t_computed_column::get_computation_input_types(computed_function_name);

            std::stringstream ss;
            ss
                << "Error: `"
                << computed_function_name_to_string(computed_function_name)
                << "`"
                << " expected input column types: [";
            for (t_dtype dtype : expected_dtypes) {
                ss << "'" << get_dtype_descr(dtype) << "' ";
            }
            ss << "], but received: [";
            for (t_dtype dtype : input_types) {
                ss << "'" << get_dtype_descr(dtype) << "' ";
            }
            ss << "]." << std::endl;
            std::cerr << ss.str();
            continue;
        }

        t_dtype output_column_type = computation.m_return_type;

        computed_column_names.push_back(name);
        computed_column_types.push_back(output_column_type);
    }

    t_schema computed_schema(computed_column_names, computed_column_types);

    return computed_schema;
}

std::shared_ptr<t_gnode>
Table::make_gnode(const t_schema& in_schema) {
    t_schema out_schema = in_schema.drop({"psp_pkey", "psp_op"}); 
    auto gnode = std::make_shared<t_gnode>(in_schema, out_schema);
    gnode->init();
    return gnode;
}

void
Table::set_gnode(std::shared_ptr<t_gnode> gnode) {
    m_gnode = gnode;
    m_gnode_set = true;
}

void
Table::unregister_gnode(t_uindex id) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    m_pool->unregister_gnode(id);
}

void
Table::reset_gnode(t_uindex id) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    t_gnode* gnode = m_pool->get_gnode(id);
    gnode->reset();
}

t_uindex
Table::make_port() {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(m_gnode_set, "Cannot make input port on a gnode that does not exist.");
    return m_gnode->make_input_port();
}

void
Table::remove_port(t_uindex port_id) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(m_gnode_set, "Cannot remove input port on a gnode that does not exist.");
    m_gnode->remove_input_port(port_id);
}

void
Table::calculate_offset(std::uint32_t row_count) {
    m_offset = (m_offset + row_count) % m_limit;
}

t_uindex
Table::get_id() const {
    return m_id;
}

std::shared_ptr<t_pool>
Table::get_pool() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_pool;
}

std::shared_ptr<t_gnode>
Table::get_gnode() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_gnode;
}

const std::vector<std::string>&
Table::get_column_names() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_column_names;
}

const std::vector<t_dtype>&
Table::get_data_types() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_data_types;
}

const std::string&
Table::get_index() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_index;
}

std::uint32_t
Table::get_offset() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_offset;
}

std::uint32_t
Table::get_limit() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_limit;
}

void 
Table::set_column_names(const std::vector<std::string>& column_names) {
    validate_columns(column_names);
    m_column_names = column_names;
}

void 
Table::set_data_types(const std::vector<t_dtype>& data_types) {
    m_data_types = data_types;
}

void
Table::validate_columns(const std::vector<std::string>& column_names) {
    if (m_index != "") {
        // Check if index is valid after getting column names
        bool explicit_index
            = std::find(column_names.begin(), column_names.end(), m_index) != column_names.end();
        if (!explicit_index) {
            PSP_COMPLAIN_AND_ABORT(
                "Specified index `" + m_index + "` does not exist in dataset.");
        }
    }
}

void
Table::process_op_column(t_data_table& data_table, const t_op op) {
    auto op_col = data_table.add_column("psp_op", DTYPE_UINT8, false);
    switch (op) {
        case OP_DELETE: {
            op_col->raw_fill<std::uint8_t>(OP_DELETE);
        } break;
        default: { op_col->raw_fill<std::uint8_t>(OP_INSERT); }
    }
}

} // namespace perspective
