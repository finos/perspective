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

#[cxx::bridge]
mod ffi_internal {
    extern "Rust" {
        type ResponseBatch;
        fn create_response_batch() -> Box<ResponseBatch>;
        fn push_response(self: &mut ResponseBatch, client_id: u32, resp: Vec<u8>);
    }
    unsafe extern "C++" {
        include!("server.h");
        type ProtoApiServer;
        fn new_proto_server() -> UniquePtr<ProtoApiServer>;
        fn new_session(server: &ProtoApiServer) -> u32;
        fn handle_request(
            server: &ProtoApiServer,
            client_id: u32,
            val: &Vec<u8>,
        ) -> Box<ResponseBatch>;
        fn poll(server: &ProtoApiServer) -> Box<ResponseBatch>;
    }
}

pub struct Response {
    pub client_id: u32,
    pub resp: Vec<u8>,
}
pub struct ResponseBatch(pub Vec<Response>);

impl Deref for ResponseBatch {
    type Target = Vec<Response>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl ResponseBatch {
    fn push_response(&mut self, client_id: u32, resp: Vec<u8>) {
        self.0.push(Response { client_id, resp });
    }
}

fn create_response_batch() -> Box<ResponseBatch> {
    Box::new(ResponseBatch(vec![]))
}

unsafe impl Send for ffi_internal::ProtoApiServer {}
unsafe impl Sync for ffi_internal::ProtoApiServer {}

use std::ops::Deref;

pub use ffi_internal::*;
