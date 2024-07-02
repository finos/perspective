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

#include <memory>
#include <string>

#include "rust/cxx.h"
#include "perspective/proto_api.h"
#include "server.h"
#include "perspective-server/src/ffi.rs.h"

std::unique_ptr<ProtoApiServer>
new_proto_server() {
    return std::make_unique<ProtoApiServer>();
}

std::uint32_t
new_session(const ProtoApiServer& self) {
    auto& server = const_cast<ProtoApiServer&>(self);
    return server.new_session();
};

void
close_session(const ProtoApiServer& self, std::uint32_t client_id) {
    auto& server = const_cast<ProtoApiServer&>(self);
    server.close_session(client_id);
}

rust::Box<ResponseBatch>
handle_request(
    const ProtoApiServer& self,
    std::uint32_t client_id,
    rust::Slice<const std::uint8_t> message
) {

    std::string message_str(message.begin(), message.end());
    std::vector<ProtoApiResponse> responses =
        self.handle_request(client_id, message_str);
    rust::Box<ResponseBatch> batch = create_response_batch();

    for (const auto& response : responses) {
        batch->push_response(response.client_id, response.data);
    }

    return batch;
}

rust::Box<ResponseBatch>
poll(const ProtoApiServer& s) {
    auto& self = const_cast<ProtoApiServer&>(s);
    std::vector<ProtoApiResponse> responses = self.poll();
    rust::Box<ResponseBatch> batch = create_response_batch();
    for (const auto& response : responses) {
        batch->push_response(response.client_id, response.data);
    }

    return batch;
}