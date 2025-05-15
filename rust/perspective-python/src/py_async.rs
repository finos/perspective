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

use std::future::Future;
use std::pin::{Pin, pin};
use std::task::{Context, Poll};

use pyo3::Python;
#[cfg(not(target_os = "emscripten"))]
pub use pyo3_async_runtimes::tokio::into_future as py_into_future;

#[cfg(target_os = "emscripten")]
pub use self::trivial::into_future as py_into_future;

// https://pyo3.rs/main/async-await#release-the-gil-across-await
pub struct AllowThreads<F>(pub F);

impl<F> Future for AllowThreads<F>
where
    F: Future + Unpin + Send,
    F::Output: Send,
{
    type Output = F::Output;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let waker = cx.waker();
        Python::with_gil(|py| {
            py.allow_threads(|| pin!(&mut self.0).poll(&mut Context::from_waker(waker)))
        })
    }
}

/// This do-nothing, panic all the time runtime is sufficient in emscripten
/// for the primitive test suite in test_smoke.py to pass
mod trivial {
    use std::future::Future;

    use pyo3::prelude::*;
    use pyo3_async_runtimes::generic::{ContextExt, JoinError, Runtime};

    struct TrivialJoinError {}
    impl JoinError for TrivialJoinError {
        fn is_panic(&self) -> bool {
            unimplemented!("TrivialJoinError::is_panic")
        }

        fn into_panic(self) -> Box<dyn std::any::Any + Send + 'static> {
            unimplemented!("TrivialJoinError::into_panic")
        }
    }
    struct TrivialJoinHandle {}
    impl Future for TrivialJoinHandle {
        type Output = Result<(), TrivialJoinError>;

        fn poll(
            self: std::pin::Pin<&mut Self>,
            _cx: &mut std::task::Context<'_>,
        ) -> std::task::Poll<Self::Output> {
            unimplemented!("TrivialJoinHandle::poll")
        }
    }

    struct TrivialRuntime {}

    impl Runtime for TrivialRuntime {
        type JoinError = TrivialJoinError;
        type JoinHandle = TrivialJoinHandle;

        fn spawn<F>(_fut: F) -> Self::JoinHandle
        where
            F: std::future::Future<Output = ()> + Send + 'static,
        {
            unimplemented!("TrivialRuntime::spawn")
        }
    }

    impl ContextExt for TrivialRuntime {
        fn get_task_locals() -> Option<pyo3_async_runtimes::TaskLocals> {
            None
        }

        fn scope<F, R>(
            _locals: pyo3_async_runtimes::TaskLocals,
            _fut: F,
        ) -> std::pin::Pin<Box<dyn std::future::Future<Output = R> + Send>>
        where
            F: std::future::Future<Output = R> + Send + 'static,
        {
            unimplemented!("TrivialRuntime::scope")
        }
    }

    #[allow(unused)]
    pub fn into_future(
        awaitable: Bound<PyAny>,
    ) -> PyResult<impl Future<Output = PyResult<PyObject>> + Send + use<>> {
        pyo3_async_runtimes::generic::into_future::<TrivialRuntime>(awaitable)
    }
}
