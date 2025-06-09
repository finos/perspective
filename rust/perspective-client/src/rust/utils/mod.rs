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

//! Utility functions that are common to the Perspective crates.

mod clone;
mod logging;

#[cfg(test)]
mod tests;

use std::sync::Arc;

use rand_unique::{RandomSequence, RandomSequenceBuilder};
use thiserror::*;

use crate::proto;

#[derive(Clone, Error, Debug)]
pub enum ClientError {
    #[error("View not found")]
    ViewNotFound,

    #[error("Abort(): {0}")]
    Internal(String),

    #[error("Client not yet initialized")]
    NotInitialized,

    #[error("Unknown error: {0}")]
    Unknown(String),

    #[error("Unwrapped option")]
    Option,

    #[error("Unexpected response {0:?}")]
    OptionResponseFailed(Box<Option<proto::response::ClientResp>>),

    #[error("Bad string")]
    Utf8(#[from] std::str::Utf8Error),

    #[error("Undecipherable server message {0:?}")]
    DecodeError(#[from] prost::DecodeError),

    #[error("Unexpected response {0:?}")]
    ResponseFailed(Box<proto::response::ClientResp>),

    #[error("Not yet implemented {0:?}")]
    NotImplemented(&'static str),

    #[error("Can't use both `limit` and `index` arguments")]
    BadTableOptions,

    #[error("External error: {0}")]
    ExternalError(Arc<Box<dyn std::error::Error + Send + Sync>>),

    #[error("Undecipherable proto message")]
    ProtoError(#[from] prost::EncodeError),

    #[error("Duplicate name {0}")]
    DuplicateNameError(String),
}

pub type ClientResult<T> = Result<T, ClientError>;

impl From<Box<dyn std::error::Error + Send + Sync>> for ClientError {
    fn from(value: Box<dyn std::error::Error + Send + Sync>) -> Self {
        ClientError::ExternalError(Arc::new(value))
    }
}

impl<'a, A> From<std::sync::PoisonError<std::sync::MutexGuard<'a, A>>> for ClientError {
    fn from(_: std::sync::PoisonError<std::sync::MutexGuard<'a, A>>) -> Self {
        ClientError::Internal("Lock Error".to_owned())
    }
}

impl From<proto::response::ClientResp> for ClientError {
    fn from(value: proto::response::ClientResp) -> Self {
        match value {
            proto::response::ClientResp::ServerError(x) => match x.status_code() {
                proto::StatusCode::ServerError => ClientError::Internal(x.message),
                proto::StatusCode::ViewNotFound => ClientError::ViewNotFound,
            },
            x => ClientError::ResponseFailed(Box::new(x)),
        }
    }
}

pub trait PerspectiveResultExt {
    fn unwrap_or_log(&self);
}

impl<T, E> PerspectiveResultExt for Result<T, E>
where
    E: std::error::Error,
{
    fn unwrap_or_log(&self) {
        if let Err(e) = self {
            tracing::warn!("{}", e);
        }
    }
}

/// Generate a sequence of IDs
#[derive(Clone)]
pub struct IDGen(Arc<std::sync::Mutex<RandomSequence<u32>>>);

impl Default for IDGen {
    fn default() -> Self {
        Self(Arc::new(std::sync::Mutex::new(Self::new_seq())))
    }
}

impl IDGen {
    fn new_seq() -> RandomSequence<u32> {
        let mut rng = rand::rngs::ThreadRng::default();
        let config = RandomSequenceBuilder::<u32>::rand(&mut rng);
        config.into_iter()
    }

    pub fn next(&self) -> u32 {
        let mut idgen = self.0.lock().unwrap();
        if let Some(x) = idgen.next() {
            x
        } else {
            *idgen = Self::new_seq();
            idgen.next().unwrap()
        }
    }
}
