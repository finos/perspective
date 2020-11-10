/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

// Define `accessor` as a module in this crate - the name must match that
// of the file it references, i.e. `accessor.rs`.
mod accessor;

// Import 'cty' (ctypes), an external crate
extern crate cty;

// Use the following imports from the STL
use std::boxed::Box;
use std::ffi::CString;
use std::os::raw::c_char;

// Use DataAccessor from `accessor` - the `crate` keyword means the current
// crate.
use crate::accessor::DataAccessor;
use crate::accessor::make_data;

#[repr(C)]
pub struct RStruct {
    name: *const c_char,
    value: Value,
}

#[repr(C)]
pub enum Value {
    _Int(i32),
    _Float(f64),
}

#[repr(C)]
pub struct CoolStruct {
    pub x: cty::c_int,
    pub y: cty::c_int,
}

#[no_mangle]
pub extern "C" fn hello_world() {
    println!("rust function called!");
}

#[no_mangle]
pub extern "C" fn cool_function(
    x: cty::c_int,
    y: cty::c_int,
) -> * const CoolStruct {
    let s = CoolStruct { x, y, };
    let ptr = &s as * const CoolStruct;
    return ptr;
}

#[no_mangle]
pub extern "C" fn data_new_param(v: i32) -> *mut RStruct {
    // Returns a raw pointer to a boxed RStruct created on the heap.
    println!("{} passed from C++", v);

    Box::into_raw(Box::new(RStruct {
        name: CString::new("my_rstruct")
            .expect("Error: CString::new()")
            .into_raw(),
        value: Value::_Int(v),
    }))
}

#[no_mangle]
pub extern "C" fn data_new() -> *mut RStruct {
    // Returns a raw pointer to a boxed RStruct created on the heap with the
    // parameter values from C++;
    println!("Inside data_new().");

    Box::into_raw(Box::new(RStruct {
        name: CString::new("my_rstruct")
            .expect("Error: CString::new()")
            .into_raw(),
        value: Value::_Int(42),
    }))
}


#[no_mangle]
pub extern "C" fn data_free(ptr: *mut RStruct) {
    // Reconstruct a box on the heap using a raw pointer to the RStruct.
    if ptr.is_null() {
        return;
    }
    unsafe {
        Box::from_raw(ptr);
    }
}

#[no_mangle]
pub extern "C" fn accessor_create(length: i32) -> *mut DataAccessor {
    // Return a raw pointer to a new DataAccessor on the heap.
    println!("Creating dataset of length {}", length);
    let data = make_data(length);
    println!("Returning raw ptr to data accessor");
    let accessor = Box::new(DataAccessor{data});
    return Box::into_raw(accessor);
}

#[no_mangle]
pub unsafe extern "C" fn accessor_destroy(accessor: *mut DataAccessor) {
    // Free the heap memory used by the accessor by allowing it to fall
    // out of scope.
    if !accessor.is_null() {
        Box::from_raw(accessor);
    }
}

#[no_mangle]
pub extern "C" fn accessor_get(accessor: *mut DataAccessor, column_name: *const c_char, ridx: usize) {};