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

#[repr(C, packed)]
pub struct CppResponse {
    data_ptr: usize,
    length: u32,
    client_id: u32,
}

#[repr(C, packed)]
pub struct CppResponseBatch {
    length: u32,
    entries_ptr: usize,
}

unsafe extern "C" {
    fn psp_alloc(size: usize) -> *mut u8;
    fn psp_free(ptr: *const u8);
    fn psp_new_server(realtime_mode: bool) -> *const u8;
    fn psp_new_session(server: *const u8) -> u32;
    fn psp_delete_server(server: *const u8);
    fn psp_handle_request(
        server: *const u8,
        client_id: u32,
        buffer_ptr: *const u8,
        buffer_len: usize,
    ) -> ResponseBatch;
    fn psp_poll(server: *const u8) -> ResponseBatch;
    fn psp_close_session(server: *const u8, client_id: u32);
    fn psp_num_cpus() -> i32;
    fn psp_set_num_cpus(num_cpus: i32);
}

/// Returns the number of threads the internal threadpool will use.
pub fn num_cpus() -> i32 {
    unsafe { psp_num_cpus() }
}

/// Set the number of threads the internal threadpool will use. Can also be set
/// with `NUM_OMP_THREADS` environment variable.
pub fn set_num_cpus(num_cpus: i32) {
    unsafe { psp_set_num_cpus(num_cpus) }
}

pub struct Response(*const CppResponse);

impl Response {
    pub fn msg(&self) -> &[u8] {
        let resp = unsafe { &*self.0 };
        let data_ptr = resp.data_ptr as *const u8;
        let len = resp.length as usize;
        unsafe { std::slice::from_raw_parts(data_ptr, len) }
    }

    pub fn client_id(&self) -> u32 {
        let resp = unsafe { &*self.0 };
        resp.client_id
    }
}

impl Drop for Response {
    fn drop(&mut self) {
        unsafe {
            let resp = &*self.0;
            psp_free(resp.data_ptr as *const u8);
        }
    }
}

#[repr(transparent)]
pub struct ResponseBatch(*const CppResponseBatch);

impl ResponseBatch {
    pub fn size(&self) -> usize {
        let batch = unsafe { &*self.0 };
        batch.length as usize
    }

    pub fn iter_responses(&self) -> impl Iterator<Item = Response> + Send + Sync {
        let batch = unsafe { &*self.0 };
        let num_responses = batch.length;
        (0..num_responses).map(move |idx| {
            let entries_ptr = batch.entries_ptr as *const CppResponse;
            Response(unsafe { entries_ptr.offset(idx as isize) })
        })
    }
}

impl Drop for ResponseBatch {
    fn drop(&mut self) {
        unsafe {
            let batch = &*self.0;
            psp_free(batch.entries_ptr as *const u8);
            psp_free(self.0 as *const u8)
        }
    }
}

pub struct Request(*const u8, usize);

impl From<&[u8]> for Request {
    fn from(value: &[u8]) -> Self {
        let len = value.len();
        let ptr = unsafe { psp_alloc(len) };
        unsafe { std::ptr::copy(std::ptr::addr_of!(value[0]), ptr, len) };
        Request(ptr, len)
    }
}

impl Drop for Request {
    fn drop(&mut self) {
        unsafe {
            psp_free(self.0);
        };
    }
}

pub struct Server(*const u8);

impl Server {
    pub fn new(realtime_mode: bool) -> Self {
        Server(unsafe { psp_new_server(realtime_mode) })
    }

    pub fn new_session(&self) -> u32 {
        unsafe { psp_new_session(self.0) }
    }

    pub fn handle_request(&self, client_id: u32, request: &Request) -> ResponseBatch {
        unsafe { psp_handle_request(self.0, client_id, request.0, request.1) }
    }

    pub fn poll(&self) -> ResponseBatch {
        unsafe { psp_poll(self.0) }
    }

    pub fn close_session(&self, session_id: u32) {
        unsafe { psp_close_session(self.0, session_id) }
    }
}

impl Drop for Server {
    fn drop(&mut self) {
        unsafe { psp_delete_server(self.0) }
    }
}

unsafe impl Send for Server {}
unsafe impl Sync for Server {}

unsafe impl Send for Request {}
unsafe impl Sync for Request {}

unsafe impl Send for ResponseBatch {}
unsafe impl Sync for ResponseBatch {}

unsafe impl Send for Response {}
unsafe impl Sync for Response {}
