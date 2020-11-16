/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
use arrow::array::*;
use arrow::datatypes::*;
use arrow::record_batch::RecordBatch;
use chrono::naive::NaiveDate;
use std::collections::HashMap;
use std::fmt;
use std::str;
use std::sync::Arc;

pub struct ArrowAccessor {
    pub schema: HashMap<String, DataType>,
    pub column_names: Vec<String>,
    data: HashMap<String, ArrayRef>,
}

impl ArrowAccessor {
    pub fn new(batch: Box<RecordBatch>, batch_schema: SchemaRef) -> Self {
        let num_columns = batch.num_columns();
        let mut schema: HashMap<String, DataType> = HashMap::new();
        let mut column_names: Vec<String> = Vec::new();
        let mut data: HashMap<String, ArrayRef> = HashMap::new();

        for cidx in 0..num_columns {
            let col = batch.column(cidx);
            let field = batch_schema.field(cidx);
            let name = field.name();
            let dtype = col.data_type();
            let column_data = col.data();

            let new_array = match dtype {
                DataType::Boolean => Arc::new(BooleanArray::from(column_data)) as ArrayRef,
                DataType::Int32 => Arc::new(Int32Array::from(column_data)) as ArrayRef,
                DataType::Int64 => Arc::new(Int64Array::from(column_data)) as ArrayRef,
                DataType::Float64 => Arc::new(Float64Array::from(column_data)) as ArrayRef,
                DataType::Date32(DateUnit::Day) => {
                    Arc::new(Date32Array::from(column_data)) as ArrayRef
                }
                DataType::Timestamp(TimeUnit::Millisecond, _) => {
                    Arc::new(TimestampMillisecondArray::from(column_data)) as ArrayRef
                }
                DataType::Dictionary(ref key_type, _) => match key_type.as_ref() {
                    DataType::Int32 => {
                        Arc::new(DictionaryArray::<Int32Type>::from(column_data)) as ArrayRef
                    }
                    dtype => panic!("Unexpected dictionary key type {:?}", dtype),
                },
                dtype => panic!("Unexpected data type {:?}", dtype),
            };

            column_names.push(name.clone());
            schema.insert(name.clone(), dtype.clone());
            data.insert(name.clone(), new_array);
        }

        ArrowAccessor {
            schema,
            column_names,
            data,
        }
    }

    // Returns a value from an i32 column. Does not perform validity or bounds
    // checking - use `ArrowAccessor::is_valid` first to confirm valid lookup.
    pub fn get_i32(&self, column_name: &str, ridx: usize) -> Option<i32> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let col = &self.data[column_name]
                .as_any()
                .downcast_ref::<Int32Array>()
                .take()
                .unwrap();
            Some(col.value(ridx))
        }
    }

    // Returns a value from an i64 column. Does not perform validity or bounds
    // checking - use `ArrowAccessor::is_valid` first to confirm valid lookup.
    pub fn get_i64(&self, column_name: &str, ridx: usize) -> Option<i64> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let col = &self.data[column_name]
                .as_any()
                .downcast_ref::<Int64Array>()
                .take()
                .unwrap();
            Some(col.value(ridx))
        }
    }

    // Returns a value from a f64 column. Does not perform validity or bounds
    // checking - use `ArrowAccessor::is_valid` first to confirm valid lookup.
    pub fn get_f64(&self, column_name: &str, ridx: usize) -> Option<f64> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let col = &self.data[column_name]
                .as_any()
                .downcast_ref::<Float64Array>()
                .take()
                .unwrap();
            Some(col.value(ridx))
        }
    }

    // Returns a value from a date column. Does not perform validity or bounds
    // checking - use `ArrowAccessor::is_valid` first to confirm valid lookup.
    pub fn get_date(&self, column_name: &str, ridx: usize) -> Option<NaiveDate> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let col = &self.data[column_name]
                .as_any()
                .downcast_ref::<Date32Array>()
                .take()
                .unwrap();
            Some(col.value_as_date(ridx).unwrap())
        }
    }

    // Returns a value from a datetime column. Does not perform validity or
    // bounds checking - use `ArrowAccessor::is_valid` first to confirm
    // valid lookup.
    pub fn get_datetime(&self, column_name: &str, ridx: usize) -> Option<i64> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let col = &self.data[column_name]
                .as_any()
                .downcast_ref::<TimestampMillisecondArray>()
                .take()
                .unwrap();
            Some(col.value(ridx))
        }
    }

    // Returns a value from a boolean column. Does not perform validity or
    // bounds checking - use `ArrowAccessor::is_valid` first to confirm
    // valid lookup.
    pub fn get_bool(&self, column_name: &str, ridx: usize) -> Option<bool> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let col = &self.data[column_name]
                .as_any()
                .downcast_ref::<BooleanArray>()
                .take()
                .unwrap();
            Some(col.value(ridx))
        }
    }

    // Returns a value from a string column. Does not perform validity or
    // bounds checking - use `ArrowAccessor::is_valid` first to confirm
    // valid lookup.
    pub fn get_string(&self, column_name: &str, ridx: usize) -> Option<String> {
        if !self.is_valid(column_name, ridx) {
            None
        } else {
            let dict_array = &self.data[column_name]
                .as_any()
                .downcast_ref::<Int32DictionaryArray>()
                .take()
                .unwrap();
            let values = dict_array.values();
            let strings = values
                .as_any()
                .downcast_ref::<StringArray>()
                .take()
                .unwrap();
            let key = dict_array.keys_array().value(ridx) as usize;
            Some(String::from(strings.value(key)))
        }
    }
    
    // Returns whether the lookup is valid - the column exists, the row is not
    // over the column length, and whether the value at column[row] is valid
    // and not null.
    pub fn is_valid(&self, column_name: &str, ridx: usize) -> bool {
        match self.data.get(column_name) {
            Some(col) => {
                ridx < self.data[column_name].len() && col.is_valid(ridx) && !col.is_null(ridx)
            }
            None => false,
        }
    }
}

impl fmt::Display for ArrowAccessor {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for (name, column) in &self.data {
            let dtype = column.data_type();
            write!(f, "{}: {:?}\n", name, dtype.to_json());
        }
        write!(f, "\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{NaiveDate, NaiveDateTime};

    // Load all datatypes generated by Perspective
    #[test]
    fn load_arrow() {
        let strings = vec!["abc", "def", "abc", "hij", "klm"];
        let dict_array: DictionaryArray<Int32Type> = strings.into_iter().collect();

        let arrays: Vec<ArrayRef> = vec![
            Arc::new(Int32Array::from(vec![1, 2, 3, 4, 5])),
            Arc::new(Int64Array::from(vec![1, 2, 3, 4, 5])),
            Arc::new(Float64Array::from(vec![1.5, 2.5, 3.5, 4.5, 5.5])),
            Arc::new(Date32Array::from(vec![18000, 18100, 18200, 18300, 18400])),
            Arc::new(TimestampMillisecondArray::from(vec![
                NaiveDateTime::parse_from_str("2020-01-15 12:30:45", "%Y-%m-%d %H:%M:%S")
                    .unwrap()
                    .timestamp(),
                NaiveDateTime::parse_from_str("2020-02-29 22:55:45", "%Y-%m-%d %H:%M:%S")
                    .unwrap()
                    .timestamp(),
                NaiveDateTime::parse_from_str("2020-03-30 05:12:45", "%Y-%m-%d %H:%M:%S")
                    .unwrap()
                    .timestamp(),
                NaiveDateTime::parse_from_str("2020-04-01 09:59:45", "%Y-%m-%d %H:%M:%S")
                    .unwrap()
                    .timestamp(),
                NaiveDateTime::parse_from_str("2020-05-15 19:01:45", "%Y-%m-%d %H:%M:%S")
                    .unwrap()
                    .timestamp(),
            ])),
            Arc::new(BooleanArray::from(vec![true, false, true, false, true])),
            Arc::new(dict_array),
        ];

        // Arrow schema created using `Field`
        let schema = Schema::new(vec![
            Field::new("a", DataType::Int32, false),
            Field::new("b", DataType::Int64, false),
            Field::new("c", DataType::Float64, false),
            Field::new("d", DataType::Date32(DateUnit::Day), false),
            Field::new("e", DataType::Timestamp(TimeUnit::Millisecond, None), false),
            Field::new("f", DataType::Boolean, false),
            Field::new(
                "g",
                DataType::Dictionary(Box::new(DataType::Int32), Box::new(DataType::Utf8)),
                false,
            ),
        ]);

        let schema_ref = SchemaRef::new(schema);

        let try_batch = RecordBatch::try_new(schema_ref.clone(), arrays);

        // Accessor schema of names to `DataType`
        let mut accessor_schema: HashMap<String, DataType> = HashMap::new();

        for field in schema_ref.fields() {
            accessor_schema.insert(field.name().clone(), field.data_type().clone());
        }

        match try_batch {
            Ok(batch) => {
                let accessor = ArrowAccessor::new(Box::new(batch), schema_ref.clone());

                // Metadata should be correct
                assert_eq!(
                    accessor.column_names,
                    vec!("a", "b", "c", "d", "e", "f", "g")
                );
                assert_eq!(accessor.schema, accessor_schema);

                // Get values from each column in the accessor
                assert_eq!(accessor.get_i32("a", 1), Some(2));
                assert_eq!(accessor.get_i64("b", 4), Some(5));
                assert_eq!(accessor.get_f64("c", 3), Some(4.5));
                assert_eq!(
                    accessor.get_date("d", 0),
                    Some(NaiveDate::parse_from_str("2019-04-14", "%Y-%m-%d").unwrap())
                );
                assert_eq!(
                    accessor.get_datetime("e", 0),
                    Some(
                        NaiveDateTime::parse_from_str("2020-01-15 12:30:45", "%Y-%m-%d %H:%M:%S")
                            .unwrap()
                            .timestamp()
                    )
                );
                assert_eq!(accessor.get_bool("f", 3), Some(false));
                assert_eq!(accessor.get_string("g", 2), Some(String::from("abc")));

                // Try some invalid row reads
                assert_eq!(accessor.get_i32("a", 123), None);
                assert_eq!(accessor.get_i64("b", 6), None);
                assert_eq!(accessor.get_f64("c", 100), None);
                assert_eq!(accessor.get_date("d", 10), None);
                assert_eq!(accessor.get_datetime("e", 15), None);
                assert_eq!(accessor.get_bool("f", 55), None);
                assert_eq!(accessor.get_string("g", 100), None);

                // And invalid columns
                assert_eq!(accessor.get_i32("x", 1), None);
                assert_eq!(accessor.get_i64("y", 1), None);
                assert_eq!(accessor.get_f64("cde", 1), None);
                assert_eq!(accessor.get_date("def", 1), None);
                assert_eq!(accessor.get_datetime("efg", 1), None);
                assert_eq!(accessor.get_bool("hijk", 1), None);
                assert_eq!(accessor.get_string("lmn", 1), None);
            }
            Err(err) => panic!("Failed to create record batch: {}", err),
        }
    }

    #[test]
    fn load_arrow_nullable() {
        let strings = vec![Some("abc"), None, None, Some("hij"), Some("klm")];
        let dict_array: DictionaryArray<Int32Type> = strings.into_iter().collect();

        let arrays: Vec<ArrayRef> = vec![
            Arc::new(Int32Array::from(vec![None, Some(2), None, Some(4), None])),
            Arc::new(Int64Array::from(vec![None, Some(2), Some(3), Some(4), Some(5)])),
            Arc::new(Float64Array::from(vec![Some(1.5), Some(2.5), None, None, Some(5.5)])),
            Arc::new(Date32Array::from(vec![
                None, Some(737000), Some(736000), None, None,
            ])),
            Arc::new(TimestampMillisecondArray::from(vec![
                None,
                Some(NaiveDateTime::parse_from_str("2020-02-29 22:55:45", "%Y-%m-%d %H:%M:%S")
                    .unwrap()
                    .timestamp()),
                None,
                None,
                None,
            ])),
            Arc::new(BooleanArray::from(vec![None, Some(true), None, None, Some(false)])),
            Arc::new(dict_array),
        ];

        // Arrow schema created using `Field`
        let schema = Schema::new(vec![
            Field::new("a", DataType::Int32, true),
            Field::new("b", DataType::Int64, true),
            Field::new("c", DataType::Float64, true),
            Field::new("d", DataType::Date32(DateUnit::Day), true),
            Field::new("e", DataType::Timestamp(TimeUnit::Millisecond, None), true),
            Field::new("f", DataType::Boolean, true),
            Field::new(
                "g",
                DataType::Dictionary(Box::new(DataType::Int32), Box::new(DataType::Utf8)),
                true,
            ),
        ]);

        let schema_ref = SchemaRef::new(schema);

        let try_batch = RecordBatch::try_new(schema_ref.clone(), arrays);

        // Accessor schema of names to `DataType`
        let mut accessor_schema: HashMap<String, DataType> = HashMap::new();

        for field in schema_ref.fields() {
            accessor_schema.insert(field.name().clone(), field.data_type().clone());
        }

        match try_batch {
            Ok(batch) => {
                let accessor = ArrowAccessor::new(Box::new(batch), schema_ref.clone());

                // Metadata should be correct
                assert_eq!(
                    accessor.column_names,
                    vec!("a", "b", "c", "d", "e", "f", "g")
                );
                assert_eq!(accessor.schema, accessor_schema);

                // Get values from each column in the accessor
                assert_eq!(accessor.get_i32("a", 1), Some(2));
                assert_eq!(accessor.get_i64("b", 0), None);
                assert_eq!(accessor.get_f64("c", 3), None);
                assert_eq!(accessor.get_date("d", 0), None);
                assert_eq!(accessor.get_datetime("e", 0), None);
                assert_eq!(accessor.get_bool("f", 3), None);
                assert_eq!(accessor.get_string("g", 2), None);

                // Try some invalid row reads
                assert_eq!(accessor.get_i32("a", 123), None);
                assert_eq!(accessor.get_i64("b", 6), None);
                assert_eq!(accessor.get_f64("c", 100), None);
                assert_eq!(accessor.get_date("d", 10), None);
                assert_eq!(accessor.get_datetime("e", 15), None);
                assert_eq!(accessor.get_bool("f", 55), None);
                assert_eq!(accessor.get_string("g", 100), None);

                // And invalid columns
                assert_eq!(accessor.get_i32("x", 1), None);
                assert_eq!(accessor.get_i64("y", 1), None);
                assert_eq!(accessor.get_f64("cde", 1), None);
                assert_eq!(accessor.get_date("def", 1), None);
                assert_eq!(accessor.get_datetime("efg", 1), None);
                assert_eq!(accessor.get_bool("hijk", 1), None);
                assert_eq!(accessor.get_string("lmn", 1), None);
            }
            Err(err) => panic!("Failed to create record batch: {}", err),
        }
    }
}