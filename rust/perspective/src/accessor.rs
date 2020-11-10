/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

use std::collections::HashMap;

// A simple data accessor class that wraps a HashMap of float Vectors.
pub struct DataAccessor {
    pub data: HashMap<String, Vec<f64>>,
}

// Methods are not defined on the `struct` but in the `impl`.
impl DataAccessor {
    /**
     * Get a value from the column and row defined by `column_name` and `ridx`.
     *
     * If `column_name` or `ridx` is invalid, returns `None` using an Option.
     */
    fn get(&self, column_name: &str, ridx: usize) -> Option<f64> {
        if !self.data.contains_key(column_name) || ridx > self.data[column_name].len() {
            return None;
        }

        // Returns an `Option` value filled with the f64.
        return Some(self.data[column_name][ridx]);
    }
}

/**
 * Create a dataset of 4 columns and the specified `length`.
 */
pub fn make_data(length: i32) -> HashMap<String, Vec<f64>> {
    let mut data = HashMap::new();

    // `&` denotes a slice which can be iterated through.
    for col in &["a", "b", "c", "d"] {
        let mut values = Vec::new();

        // iterate through a range, i.e. for...in
        for _i in 0..length {
            let num: f64 = rand::random();
            values.push(num);
        }

        data.insert(col.to_string(), values);
    }

    return data;
}
