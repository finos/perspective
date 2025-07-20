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

#include <perspective/first.h>
#include <perspective/context_handle.h>

namespace perspective {

t_ctx_handle::t_ctx_handle() : m_ctx_type(ZERO_SIDED_CONTEXT), m_ctx(nullptr) {}

t_ctx_handle::t_ctx_handle(void* ctx, t_ctx_type ctx_type) :
    m_ctx_type(ctx_type),
    m_ctx(ctx) {}

std::string
t_ctx_handle::get_type_descr() const {
    switch (m_ctx_type) {
        case TWO_SIDED_CONTEXT: {
            return "TWO_SIDED_CONTEXT";
        } break;
        case ONE_SIDED_CONTEXT: {
            return "ONE_SIDED_CONTEXT";
        } break;
        case ZERO_SIDED_CONTEXT: {
            return "ZERO_SIDED_CONTEXT";
        } break;
        case UNIT_CONTEXT: {
            return "UNIT_CONTEXT";
        } break;
        case GROUPED_PKEY_CONTEXT: {
            return "GROUPED_PKEY_CONTEXT";
        } break;
        case GROUPED_COLUMNS_CONTEXT: {
            return "GROUPED_COLUMNS_CONTEXT";
        }
        default: {
            PSP_COMPLAIN_AND_ABORT("Invalid context");
        } break;
    }
    return "ZERO_SIDED_CONTEXT";
}

} // end namespace perspective
