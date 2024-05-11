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

#include <perspective/emscripten.h>
#include <perspective/emscripten_api_utils.h>
#include <perspective/proto_api.h>
#include <string>
#include <tsl/hopscotch_map.h>

using namespace emscripten;
using namespace perspective;

namespace perspective::binding {
/**
 * @brief Takes a container of values and returns a matching typed array.
 *
 * Works with std::vector and std::string, but should also work with
 * any container that supports operator[].
 *
 * @tparam F
 * @tparam operator[]
 * @param vec
 * @return emscripten::val
 */
template <
    typename F,
    typename Underlying = std::remove_reference_t<decltype(std::declval<F>()[0]
    )> // Type of the underlying value in the
       // container based on operator[]
    >
static emscripten::val
to_typed_array(const F& vec) {
    static_assert(
        js_array_type<Underlying>::name,
        "Unsupported type for vecToTypedArray. Please add a specialization for "
        "this type."
    );

    auto view = emscripten::typed_memory_view(vec.size(), vec.data());
    return val(view);
}

void
handle_message(
    ProtoApiServer& server,
    const std::uint32_t client_id,
    const emscripten::val& msg,
    const emscripten::val& callback
) {
    // static std::string str_msg;
    // auto size = msg["byteLength"].as<std::int32_t>();
    // if (str_msg.capacity() < size) {
    //     str_msg.reserve(size);
    // }

    // str_msg.resize(size);
    // emscripten::val(emscripten::typed_memory_view(size, str_msg.data()))
    //     .call<void>("set", msg);

    std::string str_msg;
    auto size = msg["byteLength"].as<std::int32_t>();
    str_msg.reserve(size);
    str_msg.resize(size);
    emscripten::val(emscripten::typed_memory_view(size, str_msg.data()))
        .call<void>("set", msg);

    for (const auto& msg : server.handle_message(client_id, str_msg)) {
        callback.call<void>(
            "call",
            emscripten::val::undefined(),
            t_val(msg.client_id),
            t_val(to_typed_array(msg.data))
        );
    }
}

void
poll(ProtoApiServer& server, const emscripten::val& callback) {
    auto output = server.poll();
    for (const auto& msg : output) {
        callback.call<void>(
            "call",
            emscripten::val::undefined(),
            t_val(msg.client_id),
            t_val(to_typed_array(msg.data))
        );
    }
}

void
em_init() {}

EMSCRIPTEN_BINDINGS(perspective) {
    function("init", &em_init);

    class_<ProtoApiServer>("ProtoServer")
        .constructor()
        .smart_ptr<std::shared_ptr<ProtoApiServer>>("shared_ptr<ProtoServer>")
        .function("handle_message", &handle_message)
        .function("poll", &poll);
}
} // namespace perspective::binding
