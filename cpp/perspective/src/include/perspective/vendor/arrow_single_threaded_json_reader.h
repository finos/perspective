/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 * Originally forked from
 * https://github.com/apache/arrow/blob/apache-arrow-12.0.0/cpp/src/arrow/json/reader.h
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
#pragma once

#include <memory>

#include "arrow/json/options.h"
#include "arrow/io/type_fwd.h"
#include "arrow/record_batch.h"
#include "arrow/result.h"
#include "arrow/status.h"
#include "arrow/util/macros.h"
#include "arrow/util/type_fwd.h"
#include "arrow/util/visibility.h"

namespace arrow {
namespace json {

/// A class that reads an entire JSON file into a Arrow Table
///
/// The file is expected to consist of individual line-separated JSON objects
class ARROW_EXPORT TableReader {
 public:
  virtual ~TableReader() = default;

  /// Read the entire JSON file and convert it to a Arrow Table
  virtual Result<std::shared_ptr<Table>> Read() = 0;

  /// Create a TableReader instance
  static Result<std::shared_ptr<TableReader>> Make(MemoryPool* pool,
                                                   std::shared_ptr<io::InputStream> input,
                                                   const ReadOptions&,
                                                   const ParseOptions&);
};

ARROW_EXPORT Result<std::shared_ptr<RecordBatch>> ParseOne(ParseOptions options,
                                                           std::shared_ptr<Buffer> json);
}  // namespace json
}  // namespace arrow