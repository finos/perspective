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

#include "perspective/server.h"
#include "perspective/proto_api.h"
#include <memory>

class ProtoApiServer::ProtoApiServerImpl {
public:
    std::unique_ptr<perspective::server::ProtoServer> m_server;
    ProtoApiServerImpl();
    ~ProtoApiServerImpl();
};

ProtoApiServer::ProtoApiServer() :
    m_impl(std::make_unique<ProtoApiServer::ProtoApiServerImpl>()) {}
ProtoApiServer::~ProtoApiServer() = default;

ProtoApiServer::ProtoApiServerImpl::ProtoApiServerImpl() :
    m_server(std::make_unique<perspective::server::ProtoServer>()) {}
ProtoApiServer::ProtoApiServerImpl::~ProtoApiServerImpl() = default;

std::uint32_t
ProtoApiServer::new_session() {
    return m_impl->m_server->new_session();
}

void
ProtoApiServer::close_session(const std::uint32_t& client_id) {
    return m_impl->m_server->close_session(client_id);
}

std::vector<ProtoApiResponse>
ProtoApiServer::handle_request(std::uint32_t client_id, const std::string& data)
    const {
    auto responses = m_impl->m_server->handle_request(client_id, data);
    std::vector<ProtoApiResponse> results;
    for (const auto& msg : responses) {
        ProtoApiResponse resp;
        resp.client_id = msg.client_id;
        resp.data = msg.data;
        results.push_back(resp);
    }

    return results;
}

std::vector<ProtoApiResponse>
ProtoApiServer::poll() {
    std::vector<ProtoApiResponse> results;
    for (const auto& msg : m_impl->m_server->poll()) {
        ProtoApiResponse resp;
        resp.client_id = msg.client_id;
        resp.data = msg.data;
        results.push_back(resp);
    }

    return results;
}
