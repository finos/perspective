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

#![feature(lazy_cell)]

use std::collections::HashMap;
use std::sync::{Arc, LazyLock, RwLock};

use cxx::UniquePtr;

mod ffi;

#[derive(Clone)]
pub struct Server {
    server: Arc<UniquePtr<ffi::ProtoApiServer>>,
}

pub type SessionCallback = Arc<dyn Fn(u32, &Vec<u8>) + 'static + Sync + Send>;

impl Default for Server {
    fn default() -> Self {
        let server = Arc::new(ffi::new_proto_server());
        Self { server }
    }
}

static CALLBACKS: LazyLock<RwLock<HashMap<u32, SessionCallback>>> =
    LazyLock::new(|| RwLock::new(HashMap::new()));

#[no_mangle]
#[allow(clippy::not_unsafe_ptr_arg_deref)]
pub extern "C" fn psp_global_session_handler(client_id: u32, data: *const u8, length: u32) {
    let data = unsafe { std::slice::from_raw_parts(data, length as usize) };
    let data_vec = data.to_owned();
    // Print process and thread id
    let thread_id = std::thread::current().id();
    let process_id = std::process::id();
    tracing::info!(
        "Global session handler called for client_id: {}, thread_id: {:?}, process_id: {}",
        client_id,
        thread_id,
        process_id
    );

    let cb = CALLBACKS
        .read()
        .expect("lock poisoned")
        .get(&client_id)
        .cloned();

    if let Some(cb) = cb {
        cb(client_id, &data_vec);
    } else {
        tracing::info!("No callback found for client_id: {}", client_id);
    }
}

impl Server {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn new_session(&self) -> u32 {
        ffi::new_session(&self.server)
    }

    pub fn register_session_cb(&mut self, cb: SessionCallback) -> u32 {
        let client_id = ffi::new_session(&self.server);
        tracing::info!("Registering session callback for client_id: {}", client_id);
        CALLBACKS
            .write()
            .expect("lock poisoned")
            .insert(client_id, cb);
        client_id
    }

    pub fn unregister_session_cb(&mut self, client_id: u32) {
        CALLBACKS.write().expect("lock poisoned").remove(&client_id);
    }

    pub fn handle_request(
        &self,
        client_id: u32,
        val: &Vec<u8>,
    ) -> impl Iterator<Item = (u32, Vec<u8>)> {
        let response_batch = ffi::handle_request(&self.server, client_id, val);
        response_batch.0.into_iter().map(|x| (x.client_id, x.resp))
    }

    pub fn poll(&self) -> impl Iterator<Item = (u32, Vec<u8>)> {
        let response_batch = ffi::poll(&self.server);
        response_batch.0.into_iter().map(|x| (x.client_id, x.resp))
    }
}
