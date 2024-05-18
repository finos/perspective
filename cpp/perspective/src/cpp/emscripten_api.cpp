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

#include "perspective/exports.h"
#include <algorithm>
#include <cstdint>
#include <perspective/proto_api.h>
#include <string>
#include <tsl/hopscotch_map.h>

// TODO: use uintptr_t instead of size_t.

/// places a 32 bit number at the first 4 bytes of the given address
void
place_number(std::uint32_t num, std::uint8_t* addr) {
    addr[0] = num & 0x000000ff;
    addr[1] = (num & 0x0000ff00) >> 8;
    addr[2] = (num & 0x00ff0000) >> 16;
    addr[3] = (num & 0xff000000) >> 24;
    //   std::copy(reinterpret_cast<std::uint8_t *>(num),
    //             reinterpret_cast<std::uint8_t *>(num + sizeof(num)), addr);
}

/// copies the given vector into a new memory region that is encoded
/// for easy reading
size_t
encode_vec(std::vector<std::uint8_t> vec) {
    // TODO: this is 32-bit only! wasm64 beware
    auto* new_ptr = (std::uint32_t*)malloc(vec.size() + sizeof(std::uint32_t));
    *new_ptr = vec.size();
    // place_number(size, new_ptr);
    std::copy(vec.begin(), vec.end(), (std::uint8_t*)(new_ptr + 1));
    return (size_t)new_ptr;
}

size_t
encode_string(std::string s) {
    std::vector<uint8_t> vec(s.begin(), s.end());
    return encode_vec(vec);
}

// struct EncodedApiResp {
//     size_t data;
//     std::uint32_t size;
//     std::uint32_t client_id;
// };

/// The size_t is a pointer that points to an object:
/// [data_ptr,client_id]
/// The string (data) is a (len,data) tuple.
/// The string is copied and leaked and so is the pointer here.
/// TODO: we need to make a lot of complex `free`ing procedures.
void
encode_api_response(const ProtoApiResponse& msg, std::uint32_t* encoded) {
    // size_t data = encode_string(msg.data);

    // auto* new_ptr = (std::uint32_t*)malloc(vec.size() +
    // sizeof(std::uint32_t));
    // TODO: this is 32-bit only! wasm64 beware
    auto* data = (std::uint32_t*)malloc(msg.data.size());
    // *new_ptr = msg.data.size();
    // place_number(size, new_ptr);
    std::copy(msg.data.begin(), msg.data.end(), (std::uint8_t*)(data));

    // EncodedApiResp
    //     encoded; // = (EncodedApiResp*)malloc(sizeof(EncodedApiResp));
    *encoded = (size_t)data;
    *(encoded + 1) = msg.data.size();
    *(encoded + 2) = msg.client_id;
}

size_t
encode_api_responses(const std::vector<ProtoApiResponse>& msgs) {
    auto* encoded = (std::uint32_t*)malloc(
        msgs.size() * sizeof(std::uint32_t) * 3 + sizeof(std::uint32_t)
    );

    *encoded = msgs.size();
    auto* encoded_mem = (std::uint32_t*)(encoded + 1);
    for (int i = 0; i < msgs.size(); i++) {
        encode_api_response(msgs[i], (encoded_mem + i * 3));
    }

    return (size_t)encoded;
}

extern "C" {

PERSPECTIVE_EXPORT
ProtoApiServer*
js_new_server() {
    auto* server = new ProtoApiServer;
    return server;
}

PERSPECTIVE_EXPORT
size_t
js_handle_request(
    ProtoApiServer* server,
    std::uint32_t client_id,
    char* msg_ptr,
    std::size_t msg_len
) {
    std::string msg(msg_ptr, msg_len);
    auto msgs = server->handle_request(client_id, msg);
    return encode_api_responses(msgs);
}

PERSPECTIVE_EXPORT
size_t
js_poll(ProtoApiServer* server) {
    auto responses = server->poll();
    return encode_api_responses(responses);
}

PERSPECTIVE_EXPORT
std::size_t
js_alloc(std::size_t size) {
    auto* mem = (char*)malloc(size);
    return (size_t)mem;
}

PERSPECTIVE_EXPORT
void
js_free(void* ptr) {
    free(ptr);
}

} // end extern "C"

void
js_delete_server(void* proto_server) {
    auto* server = (ProtoApiServer*)proto_server;
    delete server;
}
