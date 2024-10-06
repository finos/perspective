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

//! `perspective-bootstrap` is a self-extracting `zlib` compressed binary.
//! The _best_ way to distribute Perspective's `.wasm` components is to
//! compress them on disk, then configure your web server to apply the
//! `Content-Encoding: gzip` header _without_ zipping the content, then use
//! the browser's `WebAssembly.instantiateStreaming()` to compile the result.
//! However, _no one_ in practice does this. While the self-extracing method
//! is certainly slower, larger and more complicated, it works without any
//! special configuration, and the load performance penalty is small for
//! Perspective's payload size.
//!
//! In the interest of being small, this library does not rely on `wasm_bindgen`
//! so the API is quite low-level - the caller must independently get the size
//! and offset of the uncompressed WASM and `slice()`` this from the process'
//! `WebAssembly.Memory` externally. Afterwards, the compiled wasm archive
//! is garbage-collected by the JavaScript runtime (just like any JS object),
//! freeing the uncompressed memory from the archive.

#![no_std]
#![allow(internal_features, improper_ctypes_definitions)]
#![feature(core_intrinsics, lang_items, alloc_error_handler)]

extern crate alloc;

use alloc::vec::Vec;

use zune_inflate::DeflateDecoder;

const HEAP_SIZE: usize = if cfg!(debug_assertions) {
    512_000_000
} else {
    64_000_000
};

#[allow(unused_unsafe)]
#[global_allocator]
static ALLOCATOR: talc::Talck<talc::locking::AssumeUnlockable, talc::ClaimOnOom> = {
    static mut MEMORY: [u8; HEAP_SIZE] = [0; HEAP_SIZE];
    let span = unsafe { talc::Span::from_const_array(core::ptr::addr_of!(MEMORY)) };
    talc::Talc::new(unsafe { talc::ClaimOnOom::new(span) }).lock()
};

#[cfg(not(test))]
#[panic_handler]
#[no_mangle]
pub fn panic(_info: &::core::panic::PanicInfo) -> ! {
    ::core::intrinsics::abort();
}

#[alloc_error_handler]
#[no_mangle]
pub extern "C" fn oom(_: ::core::alloc::Layout) -> ! {
    ::core::intrinsics::abort();
}

/// The target executable is provided from the environment at compile time, but
/// this is hidden behind a feature flag so `rust-analyzer` does not freak out.
#[cfg(not(feature = "env_target"))]
const COMPRESSED_BYTES: &[u8] = &[];

#[cfg(feature = "env_target")]
const COMPRESSED_BYTES: &[u8] = include_bytes!(env!("BOOTSTRAP_TARGET"));

static mut DECOMPRESSED_BYTES: Vec<u8> = Vec::new();

#[no_mangle]
pub fn size() -> usize {
    init();
    unsafe { DECOMPRESSED_BYTES.len() }
}

#[no_mangle]
pub fn offset() -> *const u8 {
    unsafe { DECOMPRESSED_BYTES.as_ptr() }
}

fn init() {
    let mut decoder = DeflateDecoder::new(COMPRESSED_BYTES);
    let v = decoder.decode_zlib().unwrap();
    unsafe {
        DECOMPRESSED_BYTES = v;
    }
}
