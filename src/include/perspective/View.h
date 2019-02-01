/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#pragma once
#include <perspective/first.h>
#include <perspective/exports.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/gnode.h>
#include <perspective/pool.h>
#include <perspective/context_zero.h>
#include <perspective/context_one.h>
#include <perspective/context_two.h>
#include <cstddef>
#include <codecvt>
#include <memory>
#include <map>

namespace perspective {

template <typename CTX_T>
class PERSPECTIVE_EXPORT View {
public:
    View(t_pool* pool, std::shared_ptr<CTX_T> ctx, std::int32_t sides,
        std::shared_ptr<t_gnode> gnode, std::string name);

    void delete_view();

    std::int32_t sides();
    std::int32_t num_rows();
    std::int32_t num_columns();
    std::int32_t get_row_expanded(std::int32_t idx);

    std::map<std::string, std::string> schema();

    t_index expand(std::int32_t idx);
    t_index collapse(std::int32_t idx);
    void set_depth(std::int32_t depth, std::int32_t row_pivot_length);
private:
    std::vector<std::string> _column_names();
    std::vector<std::string> _column_names(bool skip = false, std::int32_t depth = 0);
    std::string map_aggregate_types(std::string name, std::string typestring);
    std::string dtype_to_string(t_dtype type);
    
    t_pool* m_pool;
    std::shared_ptr<CTX_T> m_ctx;
    std::int32_t m_nsides;
    std::shared_ptr<t_gnode> m_gnode;
    std::string m_name;
};

/******************************************************************************
 *
 * Implement in header to allow template definitions in emscripten.
 */

template <typename CTX_T>
View<CTX_T>::View(t_pool* pool, std::shared_ptr<CTX_T> ctx, std::int32_t sides,
        std::shared_ptr<t_gnode> gnode, std::string name)
        : m_pool(pool)
        , m_ctx(ctx)
        , m_nsides(sides)
        , m_gnode(gnode)
        , m_name(name)
{
}

template <typename CTX_T>
void
View<CTX_T>::delete_view() {
    m_pool->unregister_context(m_gnode->get_id(), m_name);
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::sides() {
    return m_nsides;
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::num_rows() {
    return m_ctx->get_row_count();
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::num_columns() {
    return m_ctx->unity_get_column_count();
}

template <typename CTX_T>
std::int32_t
View<CTX_T>::get_row_expanded(std::int32_t idx) {
    return m_ctx->unity_get_row_expanded(idx);
}

template <typename CTX_T>
t_index
View<CTX_T>::expand(std::int32_t idx) {
    return m_ctx->open(idx);
}

template<>
t_index
View<t_ctx2>::expand(std::int32_t idx) {
    return m_ctx->open(t_header::HEADER_ROW, idx);
}

template <typename CTX_T>
t_index
View<CTX_T>::collapse(std::int32_t idx) {
    return m_ctx->close(idx);
}

template<>
t_index
View<t_ctx2>::collapse(std::int32_t idx) {
    return m_ctx->close(t_header::HEADER_ROW, idx);
}

template <typename CTX_T>
void
View<CTX_T>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {
    if (row_pivot_length >= depth) {
        m_ctx->set_depth(depth);
    } else {
        std::cout << "Cannot expand past " 
        << std::to_string(row_pivot_length) 
        << std::endl;
    }
}

template<>
void
View<t_ctx2>::set_depth(std::int32_t depth, std::int32_t row_pivot_length) {
    if (row_pivot_length >= depth) {
        m_ctx->set_depth(t_header::HEADER_ROW, depth);
    } else {
        std::cout << "Cannot expand past " 
        << std::to_string(row_pivot_length) 
        << std::endl;
    }
}

template <typename CTX_T>
std::map<std::string, std::string>
View<CTX_T>::schema() {
    auto schema = m_gnode->get_tblschema();
    auto _types = schema.types();
    auto names = schema.columns();

    std::map<std::string, t_dtype> types;
    std::map<std::string, std::string> new_schema;

    for (auto i = 0; i < names.size(); ++i) {
        types[names[i]] = _types[i];
    }

    auto col_names = _column_names(false);
    for (const std::string& name : col_names) {
        // Pull out the main aggregate column
        std::size_t last_delimiter = name.find_last_of("|");
        std::string agg_name = name.substr(last_delimiter + 1);

        std::string type_string = dtype_to_string(types[agg_name]);
        new_schema[agg_name] = type_string;
    }

    return new_schema;
}

template <>
std::map<std::string, std::string>
View<t_ctx0>::schema() {
    t_schema schema = m_gnode->get_tblschema();
    std::vector<t_dtype> _types = schema.types();
    std::vector<std::string> names = schema.columns();

    std::map<std::string, std::string> new_schema;

    for (auto i = 0; i < names.size(); ++i) {
        if (names[i] == "psp_okey") {
            continue;
        }
        new_schema[names[i]] = dtype_to_string(_types[i]);
    }

    return new_schema;
}

// PRIVATE

template <typename CTX_T>
std::vector<std::string> 
View<CTX_T>::_column_names(bool skip, std::int32_t depth) {
    std::vector<std::string> names;
    std::vector<std::string> aggregate_names;

    const std::vector<t_aggspec> aggs = m_ctx->get_aggregates();
    for (const t_aggspec& agg : aggs) {
        aggregate_names.push_back(agg.name());
    }

    for (t_uindex key = 0, max = m_ctx->unity_get_column_count(); key != max; ++key) {
        std::stringstream col_name;      
        std::string name = aggregate_names[key % aggregate_names.size()];;
        
        if (name == "psp_okey") {
            continue;
        }

        std::vector<t_tscalar> col_path = m_ctx->unity_get_column_path(key + 1);
        if (skip && col_path.size() < depth) {
            continue;
        }
        
        for (auto cnix = col_path.size(); cnix > 0; --cnix) {
            col_name << col_path[cnix].to_string();
            col_name << "|";
        }

        col_name << name;
        names.push_back(col_name.str());
    }

    return names;
}

template<>
std::vector<std::string> 
View<t_ctx0>::_column_names() {
    std::vector<std::string> names;
    std::vector<std::string> aggregate_names = m_ctx->get_column_names();

    for (t_uindex key = 0, max = m_ctx->unity_get_column_count(); key != max; ++key) {
        std::stringstream col_name;

        col_name << aggregate_names[key];
        if (col_name.str() == "psp_okey") {
            continue;
        };
        
        names.push_back(col_name.str());
    }

    return names;
}

template <typename CTX_T>
std::string 
View<CTX_T>::map_aggregate_types(std::string name, std::string typestring) {
    return "";
}


// FIXME: how many of these do we need - one centralized one?
template <typename CTX_T>
std::string
View<CTX_T>::dtype_to_string(t_dtype type) {
    std::string str_dtype;
    switch (type) {
        case DTYPE_FLOAT32:
        case DTYPE_FLOAT64: {
            str_dtype = "float";
        } break;
        case DTYPE_INT8:
        case DTYPE_INT16:
        case DTYPE_INT32:
        case DTYPE_INT64: {
            str_dtype = "integer";
        } break;
        case DTYPE_BOOL: {
            str_dtype = "boolean";
        } break;
        case DTYPE_DATE: {
            str_dtype = "date";
        } break;
        case DTYPE_TIME: {
            str_dtype = "datetime";
        } break;
        case DTYPE_STR: {
            str_dtype = "string";
        } break;
        default: {
            PSP_COMPLAIN_AND_ABORT("Cannot convert unknown dtype to string!");
        }
    }
    
    return str_dtype;
}

} // end namespace perspective
