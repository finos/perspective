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

use perspective_client::Session;

use crate::ffi;
use crate::server::{Server, ServerError};

/// A struct for implementing [`perspective_client::Session`] against an
/// same-process [`Server`] instance.
///
/// See also [`perspective_client::ProxySession`] for implement the trait
/// against an arbitrary remote transport.
#[derive(Debug)]
pub struct LocalSession {
    pub(crate) id: u32,
    pub(crate) server: Server,
    pub(crate) closed: bool,
}

impl Drop for LocalSession {
    fn drop(&mut self) {
        if !self.closed {
            tracing::error!("`Session` dropped without `Session::close`");
        }
    }
}

impl Session<ServerError> for LocalSession {
    async fn handle_request(&self, request: &[u8]) -> Result<(), ServerError> {
        let request = ffi::Request::from(request);
        let responses = self.server.server.handle_request(self.id, &request);
        for response in responses.iter_responses() {
            let cb = self
                .server
                .callbacks
                .read()
                .await
                .get(&response.client_id())
                .cloned();

            if let Some(f) = cb {
                f(response.msg()).await?;
            }
        }

        Ok(())
    }

    async fn poll(&self) -> Result<(), ServerError> {
        let responses = self.server.server.poll(self.id);
        for response in responses.iter_responses() {
            let cb = self
                .server
                .callbacks
                .read()
                .await
                .get(&response.client_id())
                .cloned();

            if let Some(f) = cb {
                f(response.msg()).await?;
            }
        }

        Ok(())
    }

    async fn close(mut self) {
        self.closed = true;
        self.server.server.close_session(self.id);
        self.server
            .callbacks
            .write()
            .await
            .remove(&self.id)
            .expect("Already closed");
    }
}
