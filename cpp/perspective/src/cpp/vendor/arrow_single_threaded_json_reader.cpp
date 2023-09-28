/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 * Originally forked from
 * https://github.com/apache/arrow/blob/apache-arrow-12.0.0/cpp/src/arrow/json/reader.cc
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

/* * * * WARNING * * *
 *
 * This file and respective header is a fork of
 * https://github.com/apache/arrow/blob/apache-arrow-12.0.0/cpp/src/arrow/json/reader.cc
 * which removes references to `std::thread` such that compilation under
 * Emscripten is possible.  It should not be modified directly.
 *
 * TODO Pending a better solution or upstream fix ..
 *
*/

#include <perspective/vendor/arrow_single_threaded_json_reader.h>

#include <string_view>
#include <utility>
#include <vector>

#include "arrow/array.h"
#include "arrow/buffer.h"
#include "arrow/io/interfaces.h"
#include "arrow/json/chunked_builder.h"
#include "arrow/json/chunker.h"
#include "arrow/json/converter.h"
#include "arrow/json/parser.h"
#include "arrow/record_batch.h"
#include "arrow/table.h"
// #include "arrow/util/async_generator.h"
#include "arrow/util/checked_cast.h"
#include "arrow/util/iterator.h"
#include "arrow/util/logging.h"
#include "arrow/util/task_group.h"
// #include "arrow/util/thread_pool.h"

namespace arrow {

using std::string_view;

using internal::checked_cast;
using internal::Executor;
// using internal::GetCpuThreadPool;
using internal::TaskGroup;
// using internal::ThreadPool;

namespace json {
namespace {

struct ChunkedBlock {
  std::shared_ptr<Buffer> partial;
  std::shared_ptr<Buffer> completion;
  std::shared_ptr<Buffer> whole;
  int64_t index = -1;
};

struct DecodedBlock {
  std::shared_ptr<RecordBatch> record_batch;
  int64_t num_bytes = 0;
};

}  // namespace
}  // namespace json

template <>
struct IterationTraits<json::ChunkedBlock> {
  static json::ChunkedBlock End() { return json::ChunkedBlock{}; }
  static bool IsEnd(const json::ChunkedBlock& val) { return val.index < 0; }
};

template <>
struct IterationTraits<json::DecodedBlock> {
  static json::DecodedBlock End() { return json::DecodedBlock{}; }
  static bool IsEnd(const json::DecodedBlock& val) { return !val.record_batch; }
};

namespace json {
namespace {

// Holds related parameters for parsing and type conversion
class DecodeContext {
 public:
  explicit DecodeContext(MemoryPool* pool)
      : DecodeContext(ParseOptions::Defaults(), pool) {}
  explicit DecodeContext(ParseOptions options = ParseOptions::Defaults(),
                         MemoryPool* pool = default_memory_pool())
      : pool_(pool) {
    SetParseOptions(std::move(options));
  }

  void SetParseOptions(ParseOptions options) {
    parse_options_ = std::move(options);
    if (parse_options_.explicit_schema) {
      conversion_type_ = struct_(parse_options_.explicit_schema->fields());
    } else {
      parse_options_.unexpected_field_behavior = UnexpectedFieldBehavior::InferType;
      conversion_type_ = struct_({});
    }
    promotion_graph_ =
        parse_options_.unexpected_field_behavior == UnexpectedFieldBehavior::InferType
            ? GetPromotionGraph()
            : nullptr;
  }

  void SetSchema(std::shared_ptr<Schema> explicit_schema,
                 UnexpectedFieldBehavior unexpected_field_behavior) {
    parse_options_.explicit_schema = std::move(explicit_schema);
    parse_options_.unexpected_field_behavior = unexpected_field_behavior;
    SetParseOptions(std::move(parse_options_));
  }
  void SetSchema(std::shared_ptr<Schema> explicit_schema) {
    SetSchema(std::move(explicit_schema), parse_options_.unexpected_field_behavior);
  }
  // Set the schema but ensure unexpected fields won't be accepted
  void SetStrictSchema(std::shared_ptr<Schema> explicit_schema) {
    auto unexpected_field_behavior = parse_options_.unexpected_field_behavior;
    if (unexpected_field_behavior == UnexpectedFieldBehavior::InferType) {
      unexpected_field_behavior = UnexpectedFieldBehavior::Error;
    }
    SetSchema(std::move(explicit_schema), unexpected_field_behavior);
  }

  [[nodiscard]] MemoryPool* pool() const { return pool_; }
  [[nodiscard]] const ParseOptions& parse_options() const { return parse_options_; }
  [[nodiscard]] const PromotionGraph* promotion_graph() const { return promotion_graph_; }
  [[nodiscard]] const std::shared_ptr<DataType>& conversion_type() const {
    return conversion_type_;
  }

 private:
  ParseOptions parse_options_;
  std::shared_ptr<DataType> conversion_type_;
  const PromotionGraph* promotion_graph_;
  MemoryPool* pool_;
};

Result<std::shared_ptr<Array>> ParseBlock(const ChunkedBlock& block,
                                          const ParseOptions& parse_options,
                                          MemoryPool* pool, int64_t* out_size = nullptr) {
  std::unique_ptr<BlockParser> parser;
  RETURN_NOT_OK(BlockParser::Make(pool, parse_options, &parser));

  int64_t size = block.partial->size() + block.completion->size() + block.whole->size();
  RETURN_NOT_OK(parser->ReserveScalarStorage(size));

  if (block.partial->size() || block.completion->size()) {
    std::shared_ptr<Buffer> straddling;
    if (!block.completion->size()) {
      straddling = block.partial;
    } else if (!block.partial->size()) {
      straddling = block.completion;
    } else {
      ARROW_ASSIGN_OR_RAISE(straddling,
                            ConcatenateBuffers({block.partial, block.completion}, pool));
    }
    RETURN_NOT_OK(parser->Parse(straddling));
  }
  if (block.whole->size()) {
    RETURN_NOT_OK(parser->Parse(block.whole));
  }

  std::shared_ptr<Array> parsed;
  RETURN_NOT_OK(parser->Finish(&parsed));

  if (out_size) *out_size = size;

  return parsed;
}

class ChunkingTransformer {
 public:
  explicit ChunkingTransformer(std::unique_ptr<Chunker> chunker)
      : chunker_(std::move(chunker)) {}

  template <typename... Args>
  static Transformer<std::shared_ptr<Buffer>, ChunkedBlock> Make(Args&&... args) {
    return [self = std::make_shared<ChunkingTransformer>(std::forward<Args>(args)...)](
               std::shared_ptr<Buffer> buffer) { return (*self)(std::move(buffer)); };
  }

 private:
  Result<TransformFlow<ChunkedBlock>> operator()(std::shared_ptr<Buffer> next_buffer) {
    if (!buffer_) {
      if (ARROW_PREDICT_TRUE(!next_buffer)) {
        DCHECK_EQ(partial_, nullptr) << "Logic error: non-null partial with null buffer";
        return TransformFinish();
      }
      partial_ = std::make_shared<Buffer>("");
      buffer_ = std::move(next_buffer);
      return TransformSkip();
    }
    DCHECK_NE(partial_, nullptr);

    std::shared_ptr<Buffer> whole, completion, next_partial;
    if (!next_buffer) {
      // End of file reached => compute completion from penultimate block
      RETURN_NOT_OK(chunker_->ProcessFinal(partial_, buffer_, &completion, &whole));
    } else {
      std::shared_ptr<Buffer> starts_with_whole;
      // Get completion of partial from previous block.
      RETURN_NOT_OK(chunker_->ProcessWithPartial(partial_, buffer_, &completion,
                                                 &starts_with_whole));
      // Get all whole objects entirely inside the current buffer
      RETURN_NOT_OK(chunker_->Process(starts_with_whole, &whole, &next_partial));
    }

    buffer_ = std::move(next_buffer);
    return TransformYield(ChunkedBlock{std::exchange(partial_, next_partial),
                                       std::move(completion), std::move(whole),
                                       index_++});
  }

  std::unique_ptr<Chunker> chunker_;
  std::shared_ptr<Buffer> partial_;
  std::shared_ptr<Buffer> buffer_;
  int64_t index_ = 0;
};

template <typename... Args>
Iterator<ChunkedBlock> MakeChunkingIterator(Iterator<std::shared_ptr<Buffer>> source,
                                            Args&&... args) {
  return MakeTransformedIterator(std::move(source),
                                 ChunkingTransformer::Make(std::forward<Args>(args)...));
}

class TableReaderImpl : public TableReader,
                        public std::enable_shared_from_this<TableReaderImpl> {
 public:
  TableReaderImpl(MemoryPool* pool, const ReadOptions& read_options,
                  const ParseOptions& parse_options,
                  std::shared_ptr<TaskGroup> task_group)
      : decode_context_(parse_options, pool),
        read_options_(read_options),
        task_group_(std::move(task_group)) {}

  Status Init(std::shared_ptr<io::InputStream> input) {
    ARROW_ASSIGN_OR_RAISE(auto it,
                          io::MakeInputStreamIterator(input, read_options_.block_size));
    return MakeReadaheadIterator(std::move(it), task_group_->parallelism())
        .Value(&buffer_iterator_);
  }

  Result<std::shared_ptr<Table>> Read() override {
    auto block_it = MakeChunkingIterator(std::move(buffer_iterator_),
                                         MakeChunker(decode_context_.parse_options()));

    bool did_read = false;
    while (true) {
      ARROW_ASSIGN_OR_RAISE(auto block, block_it.Next());
      if (IsIterationEnd(block)) break;
      if (!did_read) {
        did_read = true;
        RETURN_NOT_OK(MakeBuilder());
      }
      task_group_->Append(
          [self = shared_from_this(), block] { return self->ParseAndInsert(block); });
    }
    if (!did_read) {
      return Status::Invalid("Empty JSON file");
    }

    std::shared_ptr<ChunkedArray> array;
    RETURN_NOT_OK(builder_->Finish(&array));
    return Table::FromChunkedStructArray(array);
  }

 private:
  Status MakeBuilder() {
    return MakeChunkedArrayBuilder(task_group_, decode_context_.pool(),
                                   decode_context_.promotion_graph(),
                                   decode_context_.conversion_type(), &builder_);
  }

  Status ParseAndInsert(const ChunkedBlock& block) {
    ARROW_ASSIGN_OR_RAISE(auto parsed, ParseBlock(block, decode_context_.parse_options(),
                                                  decode_context_.pool()));
    builder_->Insert(block.index, field("", parsed->type()), parsed);
    return Status::OK();
  }

  DecodeContext decode_context_;
  ReadOptions read_options_;
  std::shared_ptr<TaskGroup> task_group_;
  Iterator<std::shared_ptr<Buffer>> buffer_iterator_;
  std::shared_ptr<ChunkedArrayBuilder> builder_;
};

// Callable object for parsing/converting individual JSON blocks. The class itself can be
// called concurrently but reads from the `DecodeContext` aren't synchronized
class DecodingOperator {
 public:
  explicit DecodingOperator(std::shared_ptr<const DecodeContext> context)
      : context_(std::move(context)) {}

  Result<DecodedBlock> operator()(const ChunkedBlock& block) const {
    int64_t num_bytes;
    ARROW_ASSIGN_OR_RAISE(auto unconverted, ParseBlock(block, context_->parse_options(),
                                                       context_->pool(), &num_bytes));

    std::shared_ptr<ChunkedArrayBuilder> builder;
    RETURN_NOT_OK(MakeChunkedArrayBuilder(TaskGroup::MakeSerial(), context_->pool(),
                                          context_->promotion_graph(),
                                          context_->conversion_type(), &builder));
    builder->Insert(0, field("", unconverted->type()), unconverted);

    std::shared_ptr<ChunkedArray> chunked;
    RETURN_NOT_OK(builder->Finish(&chunked));
    ARROW_ASSIGN_OR_RAISE(
        auto batch, RecordBatch::FromStructArray(chunked->chunk(0), context_->pool()));

    return DecodedBlock{std::move(batch), num_bytes};
  }

 private:
  std::shared_ptr<const DecodeContext> context_;
};

}  // namespace

Result<std::shared_ptr<TableReader>> TableReader::Make(
    MemoryPool* pool, std::shared_ptr<io::InputStream> input,
    const ReadOptions& read_options, const ParseOptions& parse_options) {
  std::shared_ptr<TableReaderImpl> ptr;
  // if (read_options.use_threads) {
  //   ptr = std::make_shared<TableReaderImpl>(pool, read_options, parse_options,
  //                                           TaskGroup::MakeThreaded(GetCpuThreadPool()));
  // } else {
    ptr = std::make_shared<TableReaderImpl>(pool, read_options, parse_options,
                                            TaskGroup::MakeSerial());
  // }
  RETURN_NOT_OK(ptr->Init(input));
  return ptr;
}

Result<std::shared_ptr<RecordBatch>> ParseOne(ParseOptions options,
                                              std::shared_ptr<Buffer> json) {
  DecodeContext context(std::move(options));

  std::unique_ptr<BlockParser> parser;
  RETURN_NOT_OK(BlockParser::Make(context.parse_options(), &parser));
  RETURN_NOT_OK(parser->Parse(json));
  std::shared_ptr<Array> parsed;
  RETURN_NOT_OK(parser->Finish(&parsed));

  std::shared_ptr<ChunkedArrayBuilder> builder;
  RETURN_NOT_OK(MakeChunkedArrayBuilder(TaskGroup::MakeSerial(), context.pool(),
                                        context.promotion_graph(),
                                        context.conversion_type(), &builder));

  builder->Insert(0, field("", context.conversion_type()), parsed);
  std::shared_ptr<ChunkedArray> converted_chunked;
  RETURN_NOT_OK(builder->Finish(&converted_chunked));

  return RecordBatch::FromStructArray(converted_chunked->chunk(0), context.pool());
}

}  // namespace json
}  // namespace arrow