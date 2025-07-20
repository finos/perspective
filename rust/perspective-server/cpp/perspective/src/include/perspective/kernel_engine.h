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

#pragma once
#include <perspective/first.h>
#include <perspective/base.h>
#include <perspective/raw_types.h>
#include <perspective/schema.h>

#ifdef PSP_ENABLE_WASM
#include <emscripten.h>
#include <emscripten/val.h>
typedef emscripten::val t_kernel;
namespace em = emscripten;
#else
typedef perspective::t_str t_kernel;
#endif

namespace perspective {

class t_kernel_evaluator {
public:
    t_kernel_evaluator();
    template <typename T>
    T reduce(const t_kernel& fn, t_uindex lvl_depth, std::vector<T> data);

private:
    std::vector<t_uint8> m_kernels;
};

#ifdef PSP_ENABLE_WASM
template <typename T>
T
t_kernel_evaluator::reduce(
    const t_kernel& fn, t_uindex lvl_depth, std::vector<T> data
) {
    auto arr = em::val(em::typed_memory_view(data.size(), data.data()));
    return fn(arr, em::val(lvl_depth)).as<T>();
}

#else
template <typename T>
T
t_kernel_evaluator::reduce(
    const t_kernel& fn, t_uindex lvl_depth, std::vector<T> data
) {
    PSP_COMPLAIN_AND_ABORT("Not implemented");
    return T();
}
#endif

t_kernel_evaluator* get_evaluator();

} // namespace perspective