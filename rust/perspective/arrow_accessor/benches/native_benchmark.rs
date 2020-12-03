/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
use std::fs::File;
use arrow::ipc::reader::StreamReader;
use arrow::record_batch::RecordBatch;

use criterion::{criterion_group, criterion_main, Criterion};

pub fn benchmark_load(c: &mut Criterion) {
    let filename = std::env::var("PSP_RUST_BENCHMARK_DATA").unwrap();
    let f = File::open(filename).unwrap();
    let reader = StreamReader::try_new(f).unwrap();
    let _batches = reader.map(|batch| {
        Box::new(batch.unwrap())
    }).collect::<Vec<Box<RecordBatch>>>();
}

criterion_group!(benches, benchmark_load);
criterion_main!(benches);
