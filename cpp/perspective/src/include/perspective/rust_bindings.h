/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#ifdef PSP_ENABLE_WASM

#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/scalar.h>

extern "C" {
    struct CoolStruct {
        int x;
        int y;
    };

    enum Value_Tag {
        _Int,
        _Float
    };

    struct _Int_Body {
        std::int32_t _0;
    };

    struct _Float_Body {
        double _0;
    };

    struct Value {
        Value_Tag tag;

        union {
            _Int_Body _int;
            _Float_Body _float;
        };
    };

    struct RStruct {
        const char* name;
        Value value;
    };

    void data_free(RStruct* ptr);
    RStruct* data_new();
    RStruct* data_new_param(std::int32_t v);

    void hello_world();

    // Data accessor
    void* accessor_create(perspective::t_uindex length);
    void accessor_destroy(void* accessor);
}

namespace perspective {
    /**
     * @brief A simple wrapper class for the `DataAccessor` defined in Rust.
     * 
     */
    class RustDataAccessor {
    public:
        /**
         * @brief Construct a data accessor with data of `length`.
         * 
         * @param length 
         */
        RustDataAccessor(t_uindex length);

        /**
         * @brief Destroy the data accessor - destructors need to be explictly
         * implemented to destroy the object in Rust.
         */
        ~RustDataAccessor();

        t_tscalar get(const std::string& column_name, t_uindex ridx);

    private:
        void* raw;
    };

    RustDataAccessor::RustDataAccessor(t_uindex length) {
        raw = accessor_create(length);
        if (raw == nullptr) {
            PSP_COMPLAIN_AND_ABORT("Bad rust accessor ptr");
        }
    }

    RustDataAccessor::~RustDataAccessor() {
        accessor_destroy(raw);
    }
}

#endif