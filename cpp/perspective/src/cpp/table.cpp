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

#include <perspective/table.h>

#include <utility>

// Give each Table a unique ID so that operations on it map back correctly
static perspective::t_uindex GLOBAL_TABLE_ID = 0;

namespace perspective {
Table::Table(
    std::shared_ptr<t_pool> pool,
    const std::vector<std::string>& column_names,
    const std::vector<t_dtype>& data_types,
    std::uint32_t limit,
    std::string index
) :
    m_init(false),
    m_id(GLOBAL_TABLE_ID++),
    m_pool(std::move(std::move(pool))),
    m_column_names(column_names),
    m_data_types(data_types),
    m_offset(0),
    m_limit(limit),
    m_index(std::move(index)),
    m_gnode_set(false) {
    validate_columns(m_column_names);
}

void
Table::init(
    t_data_table& data_table,
    std::uint32_t row_count,
    const t_op op,
    const t_uindex port_id
) {
    /**
     * For the Table to be initialized correctly, make sure that the operation
     * and index columns are processed before the new offset is calculated.
     * Calculating the offset before the `process_op_column` and
     * `process_index_column` causes primary keys to be misaligned.
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
    // the gstate master table has all rows including removed ones; the mapping
    // contains only the current rows in the table.
    return m_gnode->mapping_size();
}

t_schema
Table::get_schema() const {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    return m_gnode->get_output_schema();
}

t_validated_expression_map
Table::validate_expressions(
    const std::vector<std::tuple<
        std::string,
        std::string,
        std::string,
        std::vector<std::pair<std::string, std::string>>>>& expressions
) const {
    t_validated_expression_map rval = t_validated_expression_map();

    // Expression columns live on the `t_gstate` master table, so this
    // schema will always contain ALL expressions columns created by ALL views
    // on this table instance.
    auto master_table_schema = m_gnode->get_table_sptr()->get_schema();

    // However, we need to keep track of the "real" columns at the time the
    // table was instantiated, which exists on the output schema. This means
    // that we cannot create an expression column that references another
    // expression column - expressions can only reference "real" columns.
    auto gnode_schema = get_schema();

    // Use the gnode's expression vocab to validate expressions so we never
    // have string-typed scalars with nullptr.
    t_expression_vocab& expression_vocab = *(m_gnode->get_expression_vocab());
    t_regex_mapping& regex_mapping = *(m_gnode->get_expression_regex_mapping());

    for (const auto& expr : expressions) {
        const std::string& expression_alias = std::get<0>(expr);
        const std::string& expression_string = std::get<1>(expr);
        const std::string& parsed_expression_string = std::get<2>(expr);

        t_expression_error error;
        error.m_line = -1;
        error.m_column = -1;

        // Cannot overwrite a "real" column with an expression column
        if (gnode_schema.has_column(expression_alias)) {
            error.m_error_message = "Value Error - expression \""
                + expression_alias + "\" cannot overwrite an existing column.";
            error.m_line = 0;
            error.m_column = 0;
            rval.add_error(expression_alias, error);
            continue;
        }

        const auto& column_ids = std::get<3>(expr);

        t_dtype expression_dtype = t_computed_expression_parser::get_dtype(
            expression_alias,
            expression_string,
            parsed_expression_string,
            column_ids,
            m_gnode->get_table_sptr(),
            m_gnode->get_pkey_map(),
            gnode_schema,
            error,
            expression_vocab,
            regex_mapping
        );

        // FIXME: none == bad type? what about clear
        if (expression_dtype == DTYPE_NONE) {
            // extract the error from the stream and set it in the returned map
            rval.add_error(expression_alias, error);
        } else {
            rval.add_expression(
                expression_alias, dtype_to_str(expression_dtype)
            );
        }
    }

    return rval;
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
    m_gnode = std::move(gnode);
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
    PSP_VERBOSE_ASSERT(
        m_gnode_set, "Cannot make input port on a gnode that does not exist."
    );
    return m_gnode->make_input_port();
}

void
Table::remove_port(t_uindex port_id) {
    PSP_VERBOSE_ASSERT(m_init, "touching uninited object");
    PSP_VERBOSE_ASSERT(
        m_gnode_set, "Cannot remove input port on a gnode that does not exist."
    );
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
    if (!m_index.empty()) {
        // Check if index is valid after getting column names
        bool explicit_index =
            std::find(column_names.begin(), column_names.end(), m_index)
            != column_names.end();
        if (!explicit_index) {
            PSP_COMPLAIN_AND_ABORT(
                "Specified index `" + m_index + "` does not exist in dataset."
            );
        }
    }
}

void
Table::process_op_column(t_data_table& data_table, const t_op op) {
    auto* op_col = data_table.add_column("psp_op", DTYPE_UINT8, false);
    switch (op) {
        case OP_DELETE: {
            op_col->raw_fill<std::uint8_t>(OP_DELETE);
        } break;
        default: {
            op_col->raw_fill<std::uint8_t>(OP_INSERT);
        }
    }
}

} // namespace perspective
