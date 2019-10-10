/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/first.h>
#include <perspective/view.h>
#include <perspective/arrow.h>
#include <sstream>


namespace perspective {
template <typename CTX_T>
View<CTX_T>::View(std::shared_ptr<Table> table, std::shared_ptr<CTX_T> ctx, std::string name,
    std::string separator, t_view_config view_config)
    : m_table(table)
    , m_ctx(ctx)
    , m_name(std::move(name))
    , m_separator(std::move(separator))
    , m_col_offset(0)
    , m_view_config(std::move(view_config)) {

    m_row_pivots = m_view_config.get_row_pivots();
    m_column_pivots = m_view_config.get_column_pivots();
    m_aggregates = m_view_config.get_aggspecs();
    m_columns = m_view_config.get_columns();
    m_filter = m_view_config.get_fterm();
    m_sort = m_view_config.get_sortspec();

    // Add hidden columns used in sorts to the `m_hidden_sort` vector.
    if (m_sort.size() > 0) {
        _find_hidden_sort(m_sort);
    }

    if (m_column_pivots.size() > 0) {
        auto column_sort = m_view_config.get_col_sortspec();
        _find_hidden_sort(column_sort);
    }


    // configure data window for column-only rows
    is_column_only() ? m_row_offset = 1 : m_row_offset = 0;
}

template <typename CTX_T>
View<CTX_T>::~View() {
    auto pool = m_table->get_pool();
    auto gnode = m_table->get_gnode();
    pool->unregister_context(gnode->get_id(), m_name);
}

template <typename CTX_T>
t_view_config
View<CTX_T>::get_view_config() const {
    return m_view_config;
}

template <>
std::int32_t
View<t_ctx0>::sides() const {
    return 0;
}

template <>
std::int32_t
View<t_ctx1>::sides() const {
    return 1;
}

template <>
std::int32_t
View<t_ctx2>::sides() const {
    return 2;
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::num_rows() const {
    if (is_column_only()) {
        return m_ctx->get_row_count() - 1;
    } else {
        return m_ctx->get_row_count();
    }
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::num_columns() const {
    return m_ctx->unity_get_column_count();
}

/**
 * @brief Return correct number of columns when headers need to be skipped.
 *
 * @tparam
 * @return std::int32_t
 */
template <>
std::int32_t
View<t_ctx2>::num_columns() const {
    if (m_sort.size() > 0) {
        auto depth = m_column_pivots.size();
        auto col_length = m_ctx->unity_get_column_count();
        auto count = 0;
        for (t_uindex i = 0; i < col_length; ++i) {
            if (m_ctx->unity_get_column_path(i + 1).size() == depth) {
                count++;
            }
        }
        return count;
    } else {
        return m_ctx->unity_get_column_count();
    }
}

// Metadata construction
template <typename CTX_T>
std::vector<std::vector<t_tscalar>>
View<CTX_T>::column_names(bool skip, std::int32_t depth) const {
    std::vector<std::vector<t_tscalar>> names;
    std::vector<std::string> aggregate_names;

    const std::vector<t_aggspec> aggs = m_ctx->get_aggregates();
    for (const t_aggspec& agg : aggs) {
        aggregate_names.push_back(agg.name());
    }

    for (t_uindex key = 0, max = m_ctx->unity_get_column_count(); key != max; ++key) {
        std::string name = aggregate_names[key % aggregate_names.size()];

        if (name == "psp_okey") {
            continue;
        }

        std::vector<t_tscalar> col_path = m_ctx->unity_get_column_path(key + 1);
        if (skip && col_path.size() < static_cast<unsigned int>(depth)) {
            continue;
        }

        std::vector<t_tscalar> new_path;
        for (auto path = col_path.rbegin(); path != col_path.rend(); ++path) {
            new_path.push_back(*path);
        }
        new_path.push_back(m_ctx->get_aggregate_name(key % aggregate_names.size()));
        names.push_back(new_path);
    }

    return names;
}

template <>
std::vector<std::vector<t_tscalar>>
View<t_ctx0>::column_names(bool skip, std::int32_t depth) const {
    std::vector<std::vector<t_tscalar>> names;

    for (t_uindex key = 0, max = m_ctx->unity_get_column_count(); key != max; ++key) {
        t_tscalar name = m_ctx->get_column_name(key);
        if (name.to_string() == "psp_okey") {
            continue;
        };
        std::vector<t_tscalar> col_path;
        col_path.push_back(name);
        names.push_back(col_path);
    }

    return names;
}

template <typename CTX_T>
std::vector<std::vector<t_tscalar>>
View<CTX_T>::column_paths() const {
    auto num_column_pivots = m_column_pivots.size();
    auto names = column_names(true, num_column_pivots);

    if (sides() > 0 && !is_column_only()) {
        // prepend `__ROW_PATH__` to the output vector
        t_tscalar row_path;
        row_path.set("__ROW_PATH__");
        names.insert(names.begin(), std::vector<t_tscalar>{row_path});
    }

    if (m_hidden_sort.size() > 0) {
        // make a new vector so we don't have to erase while iterating
        std::vector<std::vector<t_tscalar>> visible_column_paths;

        for (const auto& column : names) {
            // Remove undisplayed column names used to sort
            std::string name = column.back().to_string();
            if (std::find(m_hidden_sort.begin(), m_hidden_sort.end(), name) == m_hidden_sort.end()) {
                visible_column_paths.push_back(column);
            }
        }

        return visible_column_paths;
        
    }

    return names;
}

template <typename CTX_T>
std::map<std::string, std::string>
View<CTX_T>::schema() const {
    auto schema = m_table->get_schema();
    auto _types = schema.types();
    auto names = schema.columns();

    std::map<std::string, t_dtype> types;
    std::map<std::string, std::string> new_schema;

    for (std::size_t i = 0, max = names.size(); i != max; ++i) {
        types[names[i]] = _types[i];
    }

    auto col_names = column_names(false);
    for (const std::vector<t_tscalar>& name : col_names) {
        // Pull out the main aggregate column
        std::string agg_name = name.back().to_string();
        std::string type_string = dtype_to_str(types[agg_name]);
        new_schema[agg_name] = type_string;

        if (m_row_pivots.size() > 0 && !is_column_only()) {
            new_schema[agg_name] = _map_aggregate_types(agg_name, new_schema[agg_name]);
        }
    }

    return new_schema;
}

template <>
std::map<std::string, std::string>
View<t_ctx0>::schema() const {
    t_schema schema = m_table->get_schema();
    std::vector<t_dtype> _types = schema.types();
    std::vector<std::string> names = schema.columns();

    std::map<std::string, t_dtype> types;
    for (std::size_t i = 0, max = names.size(); i != max; ++i) {
        types[names[i]] = _types[i];
    }

    std::vector<std::vector<t_tscalar>> cols = column_names(false);
    std::map<std::string, std::string> new_schema;

    for (std::size_t i = 0, max = cols.size(); i != max; ++i) {
        std::string name = cols[i].back().to_string();
        if (name == "psp_okey") {
            continue;
        }
        new_schema[name] = dtype_to_str(types[name]);
    }

    return new_schema;
}

template <typename CTX_T>
std::string
View<CTX_T>::to_arrow(
    std::shared_ptr<t_data_slice<CTX_T>> data_slice, 
    std::int32_t start_col, 
    std::int32_t end_col) const {

    // const names = this._column_names();
    // const schema = this.schema();

    // const vectors = [];

    // const start_col = options.start_col || 0;
    // const end_col = options.end_col || names.length;

    std::vector<std::vector<t_tscalar>> names = column_names(false, 0);
    std::map<std::string, std::string> sch = schema();

    std::vector<std::shared_ptr<::arrow::Array>> vectors;
    std::vector<std::shared_ptr<::arrow::Field>> fields;

    // for (let i = start_col; i < end_col; i++) {
    //     const name = names[i];
    //     const col_path = name.split(defaults.COLUMN_SEPARATOR_STRING);
    //     const type = schema[col_path[col_path.length - 1]];

    if (sides() > 0) {
        start_col++;
        end_col++;
    }

    for (auto i = start_col; i < end_col; ++i) {
        std::vector<t_tscalar> col_path = names.at(i);
        std::string column_name = col_path.at(col_path.size() - 1).to_string();
        std::string type = sch.at(column_name);
        std::string name;

        // Calculate the "concat'd" column header 
        if (col_path.size() > 1) {
            // TODO create the column name via concatenation
            PSP_COMPLAIN_AND_ABORT("No column pivot support yet")
        } else {
            name.assign(col_path.at(col_path.size() - 1).to_string());
        }

        std::cout << name << ": " << type << std::endl;
        
        // const column_to_format = function(col_name, options, format_function) {
        // const num_rows = this.num_rows();
        // const start_row = options.start_row || 0;
        // const end_row = options.end_row || num_rows;
        // const names = this._column_names();
        // let idx = names.indexOf(col_name);

        // if (idx === -1) {
        //     return undefined;
        // }

        // // mutate the column index if necessary: in pivoted views, columns start at 1
        // const num_sides = this.sides();
        // if (num_sides > 0) {
        //     idx++;
        // }

        // // use a specified data slice, if provided
        // let slice, data_slice;

        // if (!options.data_slice) {
        //     data_slice = this.get_data_slice(start_row, end_row, idx, idx + 1);
        //     slice = data_slice.get_slice();
        // } else {
        //     slice = options.data_slice.get_column_slice(idx);
        // }

        // const dtype = this._View.get_column_dtype(idx);
        
        std::shared_ptr<::arrow::Array> arr;
        t_dtype dtype = get_column_dtype(i);
        switch (dtype) {
            case DTYPE_INT32: {
                fields.push_back(::arrow::field(name, ::arrow::int32()));
                arr = arrow::col_to_array<std::int32_t, ::arrow::Int32Array>(data_slice->get_slice(), i, data_slice->get_stride());
            } break;
            case DTYPE_UINT32: {
                fields.push_back(::arrow::field(name, ::arrow::int32()));
                arr = arrow::col_to_array<std::uint32_t, ::arrow::Int32Array>(data_slice->get_slice(), i, data_slice->get_stride());
            } break;
            case DTYPE_INT64: {
                fields.push_back(::arrow::field(name, ::arrow::int64()));
                arr = arrow::col_to_array<std::int64_t, ::arrow::Int64Array>(data_slice->get_slice(), i, data_slice->get_stride());
            } break;
            case DTYPE_UINT64: {
                fields.push_back(::arrow::field(name, ::arrow::int64()));
                arr = arrow::col_to_array<std::uint64_t, ::arrow::Int64Array>(data_slice->get_slice(), i, data_slice->get_stride());
            } break;
            default: {
                PSP_COMPLAIN_AND_ABORT("Unknown type");
                return nullptr;
            }
        }
        vectors.push_back(arr);

    }

    auto s = ::arrow::schema(fields);
    std::shared_ptr<::arrow::RecordBatch> batches = ::arrow::RecordBatch::Make(s, num_rows(), vectors);

    
    std::shared_ptr<::arrow::ResizableBuffer> buffer;
    ::arrow::AllocateResizableBuffer(0, &buffer);
    
    ::arrow::io::BufferOutputStream sink(buffer);    
    
    auto options = ::arrow::ipc::IpcOptions::Defaults();
    // options.allow_64bit = true;
    // options.write_legacy_ipc_format = true;
    // options.alignment = 64;

    auto res = ::arrow::ipc::RecordBatchStreamWriter::Open(&sink, s, options);
    if (!res.ok()) {
        PSP_COMPLAIN_AND_ABORT("Failed to write Arrow");
        return nullptr;
    }
    std::shared_ptr<::arrow::ipc::RecordBatchWriter> writer = *res;

    writer->WriteRecordBatch(*batches);
    writer->Close();
    return buffer->ToString();
    
    //std::cout << buffer->ToString() << std::endl;

        //     if (type === "float") {
        //         const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
        //         vectors.push(Vector.new(Data.Float(new Float64(), 0, vals.length, nullCount, nullArray, vals)));
        //     } else if (type === "integer") {
        //         const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
        //         vectors.push(Vector.new(Data.Int(new Int32(), 0, vals.length, nullCount, nullArray, vals)));
        //     } else if (type === "boolean") {
        //         const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
        //         vectors.push(Vector.new(Data.Bool(new Bool(), 0, vals.length, nullCount, nullArray, vals)));
        //     } else if (type === "date" || type === "datetime") {
        //         const [vals, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
        //         vectors.push(Vector.new(Data.Timestamp(new TimestampMillisecond(), 0, vals.length / 2, nullCount, nullArray, vals)));
        //     } else if (type === "string") {
        //         const [vals, offsets, indices, nullCount, nullArray] = this.col_to_js_typed_array(name, options);
        //         const utf8Vector = Vector.new(Data.Utf8(new Utf8(), 0, offsets.length - 1, 0, null, offsets, vals));
        //         const type = new Dictionary(utf8Vector.type, new Int32(), null, null, utf8Vector);
        //         vectors.push(Vector.new(Data.Dictionary(type, 0, indices.length, nullCount, nullArray, indices)));
        //     } else {
        //         throw new Error(`Type ${type} not supported`);
        //     }
        // }

    //return nullptr;

        // return Table.fromVectors(vectors, names.slice(start_col, end_col)).serialize("binary", false).buffer;
};

template <>
std::shared_ptr<t_data_slice<t_ctx0>>
View<t_ctx0>::get_data(
    t_uindex start_row, t_uindex end_row, t_uindex start_col, t_uindex end_col) {
    std::vector<t_tscalar> slice = m_ctx->get_data(start_row, end_row, start_col, end_col);
    auto col_names = column_names();
    auto data_slice_ptr = std::make_shared<t_data_slice<t_ctx0>>(m_ctx, start_row, end_row,
        start_col, end_col, m_row_offset, m_col_offset, slice, col_names);
    return data_slice_ptr;
}

template <>
std::shared_ptr<t_data_slice<t_ctx1>>
View<t_ctx1>::get_data(
    t_uindex start_row, t_uindex end_row, t_uindex start_col, t_uindex end_col) {
    std::vector<t_tscalar> slice = m_ctx->get_data(start_row, end_row, start_col, end_col);
    auto col_names = column_names();
    t_tscalar row_path;
    row_path.set("__ROW_PATH__");
    col_names.insert(col_names.begin(), std::vector<t_tscalar>{row_path});
    auto data_slice_ptr = std::make_shared<t_data_slice<t_ctx1>>(m_ctx, start_row, end_row,
        start_col, end_col, m_row_offset, m_col_offset, slice, col_names);
    return data_slice_ptr;
}

template <>
std::shared_ptr<t_data_slice<t_ctx2>>
View<t_ctx2>::get_data(
    t_uindex start_row, t_uindex end_row, t_uindex start_col, t_uindex end_col) {
    std::vector<t_tscalar> slice;
    std::vector<t_uindex> column_indices;
    std::vector<std::vector<t_tscalar>> cols;
    bool is_sorted = m_sort.size() > 0;

    if (is_column_only()) {
        start_row += m_row_offset;
        end_row += m_row_offset;
    }

    if (is_sorted) {
        /**
         * Perspective generates headers for sorted columns, so we have to
         * skip them in the underlying slice.
         */
        auto depth = m_column_pivots.size();
        auto col_length = m_ctx->unity_get_column_count();
        column_indices.push_back(0);
        for (t_uindex i = 0; i < col_length; ++i) {
            if (m_ctx->unity_get_column_path(i + 1).size() == depth) {
                column_indices.push_back(i + 1);
            }
        }

        cols = column_names(true, depth);
        column_indices = std::vector<t_uindex>(column_indices.begin() + start_col,
            column_indices.begin() + std::min(end_col, (t_uindex)column_indices.size()));

        std::vector<t_tscalar> slice_with_headers = m_ctx->get_data(
            start_row, end_row, column_indices.front(), column_indices.back() + 1);

        auto iter = slice_with_headers.begin();
        while (iter != slice_with_headers.end()) {
            t_uindex prev = column_indices.front();
            for (auto idx = column_indices.begin(); idx != column_indices.end(); idx++) {
                t_uindex col_num = *idx;
                iter += col_num - prev;
                prev = col_num;
                slice.push_back(*iter);
            }
            if (iter != slice_with_headers.end())
                iter++;
        }
    } else {
        cols = column_names();
        slice = m_ctx->get_data(start_row, end_row, start_col, end_col);
    }
    t_tscalar row_path;
    row_path.set("__ROW_PATH__");
    cols.insert(cols.begin(), std::vector<t_tscalar>{row_path});
    auto data_slice_ptr = std::make_shared<t_data_slice<t_ctx2>>(m_ctx, start_row, end_row,
        start_col, end_col, m_row_offset, m_col_offset, slice, cols, column_indices);
    return data_slice_ptr;
}

// Delta calculation
template <typename CTX_T>
bool
View<CTX_T>::_get_deltas_enabled() const {
    return m_ctx->get_deltas_enabled();
}

template <>
bool
View<t_ctx0>::_get_deltas_enabled() const {
    return true;
}

template <typename CTX_T>
void
View<CTX_T>::_set_deltas_enabled(bool enabled_state) {
    m_ctx->set_deltas_enabled(enabled_state);
}

template <>
void
View<t_ctx0>::_set_deltas_enabled(bool enabled_state) {}

// Pivot table operations
template <typename CTX_T>
std::int32_t
View<CTX_T>::get_row_expanded(std::int32_t ridx) const {
    return m_ctx->unity_get_row_expanded(ridx);
}

template <>
t_index
View<t_ctx0>::expand(std::int32_t ridx, std::int32_t row_pivot_length) {
    return ridx;
}

template <>
t_index
View<t_ctx1>::expand(std::int32_t ridx, std::int32_t row_pivot_length) {
    return m_ctx->open(ridx);
}

template <>
t_index
View<t_ctx2>::expand(std::int32_t ridx, std::int32_t row_pivot_length) {
    if (m_ctx->unity_get_row_depth(ridx) < t_uindex(row_pivot_length)) {
        return m_ctx->open(t_header::HEADER_ROW, ridx);
    } else {
        return ridx;
    }
}

template <>
t_index
View<t_ctx0>::collapse(std::int32_t ridx) {
    return ridx;
}

template <>
t_index
View<t_ctx1>::collapse(std::int32_t ridx) {
    return m_ctx->close(ridx);
}

template <>
t_index
View<t_ctx2>::collapse(std::int32_t ridx) {
    return m_ctx->close(t_header::HEADER_ROW, ridx);
}

template <>
void
View<t_ctx0>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {}

template <>
void
View<t_ctx1>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {
    if (row_pivot_length >= depth) {
        m_ctx->set_depth(depth);
    } else {
        std::cout << "Cannot expand past " << std::to_string(row_pivot_length) << std::endl;
    }
}

template <>
void
View<t_ctx2>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {
    if (row_pivot_length >= depth) {
        m_ctx->set_depth(t_header::HEADER_ROW, depth);
    } else {
        std::cout << "Cannot expand past " << std::to_string(row_pivot_length) << std::endl;
    }
}

// Getters
template <typename CTX_T>
std::shared_ptr<CTX_T>
View<CTX_T>::get_context() const {
    return m_ctx;
}

template <typename CTX_T>
std::vector<std::string>
View<CTX_T>::get_row_pivots() const {
    return m_row_pivots;
}

template <typename CTX_T>
std::vector<std::string>
View<CTX_T>::get_column_pivots() const {
    return m_column_pivots;
}

template <typename CTX_T>
std::vector<t_aggspec>
View<CTX_T>::get_aggregates() const {
    return m_aggregates;
}

template <typename CTX_T>
std::vector<t_fterm>
View<CTX_T>::get_filter() const {
    return m_filter;
}

template <typename CTX_T>
std::vector<t_sortspec>
View<CTX_T>::get_sort() const {
    return m_sort;
}

template <>
std::vector<t_tscalar>
View<t_ctx0>::get_row_path(t_uindex idx) const {
    return std::vector<t_tscalar>();
}

template <typename CTX_T>
std::vector<t_tscalar>
View<CTX_T>::get_row_path(t_uindex idx) const {
    return m_ctx->unity_get_row_path(idx);
}

template <typename CTX_T>
t_stepdelta
View<CTX_T>::get_step_delta(t_index bidx, t_index eidx) const {
    return m_ctx->get_step_delta(bidx, eidx);
}

template <typename CTX_T>
std::shared_ptr<t_data_slice<CTX_T>>
View<CTX_T>::get_row_delta() const {
    t_rowdelta delta = m_ctx->get_row_delta();
    const std::vector<t_tscalar>& data = delta.data;
    t_uindex num_rows_changed = delta.num_rows_changed;
    auto data_slice_ptr = std::make_shared<t_data_slice<CTX_T>>(m_ctx, data, num_rows_changed);
    return data_slice_ptr;
}

template <typename CTX_T>
t_dtype
View<CTX_T>::get_column_dtype(t_uindex idx) const {
    return m_ctx->get_column_dtype(idx);
}

template <typename CTX_T>
bool
View<CTX_T>::is_column_only() const {
    return m_view_config.is_column_only();
}

/******************************************************************************
 *
 * Private
 */

template <typename CTX_T>
std::string
View<CTX_T>::_map_aggregate_types(
    const std::string& name, const std::string& typestring) const {

    for (const t_aggspec& agg : m_aggregates) {
        if (agg.name() == name) {
            switch (agg.agg()) {
                case AGGTYPE_DISTINCT_COUNT:
                case AGGTYPE_COUNT: {
                    return "integer";
                } break;
                case AGGTYPE_MEAN:
                case AGGTYPE_MEAN_BY_COUNT:
                case AGGTYPE_WEIGHTED_MEAN:
                case AGGTYPE_PCT_SUM_PARENT:
                case AGGTYPE_PCT_SUM_GRAND_TOTAL: {
                    return "float";
                } break;
                default: { return typestring; } break;
            }
        }
    }

    return typestring;
}

template <typename CTX_T>
void
View<CTX_T>::_find_hidden_sort(const std::vector<t_sortspec>& sort) {
    for (const t_sortspec& s : sort) {
        bool hidden = std::find(m_columns.begin(), m_columns.end(), s.m_colname) == m_columns.end();
        if (hidden) {
            // Store the actual column, not the composite column path
            m_hidden_sort.push_back(s.m_colname);
        }
    }
}

// Explicitly instantiate View for each context
template class View<t_ctx0>;
template class View<t_ctx1>;
template class View<t_ctx2>;
} // end namespace perspective