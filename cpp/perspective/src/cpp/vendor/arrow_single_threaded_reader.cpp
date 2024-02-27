/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 * Originally forked from
 * https://github.com/apache/arrow/blob/apache-arrow-1.0.1/cpp/src/arrow/csv/reader.cc
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
 * https://github.com/apache/arrow/blob/apache-arrow-1.0.1/cpp/src/arrow/csv/reader.cc
 * which removes references to `std::thread` such that compilation under
 * Emscripten is possible.  It should not be modified directly.
 *
 * TODO Pending a better solution or upstream fix ..
 *
 */

#include <perspective/vendor/arrow_single_threaded_reader.h>

#include <cstdint>
#include <cstring>
#include <functional>
#include <limits>
#include <memory>
#include <optional>
#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "arrow/array.h"
#include "arrow/buffer.h"
#include "arrow/csv/chunker.h"
#include "arrow/csv/column_builder.h"
#include "arrow/csv/column_decoder.h"
#include "arrow/csv/options.h"
#include "arrow/csv/parser.h"
#include "arrow/io/interfaces.h"
#include "arrow/result.h"
#include "arrow/status.h"
#include "arrow/table.h"
#include "arrow/type.h"
#include "arrow/type_fwd.h"
// #include "arrow/util/async_generator.h"
// #include "arrow/util/future.h"
#include "arrow/util/iterator.h"
#include "arrow/util/logging.h"
#include "arrow/util/macros.h"
#include "arrow/util/task_group.h"
// #include "arrow/util/thread_pool.h"
#include "arrow/util/utf8_internal.h"
#include "arrow/util/vector.h"

namespace arrow {

using internal::Executor;
using internal::TaskGroup;
using internal::UnwrapOrRaise;

namespace csv {
    namespace {

        struct ConversionSchema {
            struct Column {
                std::string name;
                // Physical column index in CSV file
                int32_t index;
                // If true, make a column of nulls
                bool is_missing;
                // If set, convert the CSV column to this type
                // If unset (and is_missing is false), infer the type from the
                // CSV column
                std::shared_ptr<DataType> type;
            };

            static Column
            NullColumn(std::string col_name, std::shared_ptr<DataType> type) {
                return Column{std::move(col_name), -1, true, std::move(type)};
            }

            static Column
            TypedColumn(
                std::string col_name,
                int32_t col_index,
                std::shared_ptr<DataType> type
            ) {
                return Column{
                    std::move(col_name), col_index, false, std::move(type)
                };
            }

            static Column
            InferredColumn(std::string col_name, int32_t col_index) {
                return Column{std::move(col_name), col_index, false, nullptr};
            }

            std::vector<Column> columns;
        };

        // An iterator of Buffers that makes sure there is no straddling CRLF
        // sequence.
        class CSVBufferIterator {
        public:
            static Iterator<std::shared_ptr<Buffer>>
            Make(Iterator<std::shared_ptr<Buffer>> buffer_iterator) {
                Transformer<std::shared_ptr<Buffer>, std::shared_ptr<Buffer>>
                    fn = CSVBufferIterator();
                return MakeTransformedIterator(std::move(buffer_iterator), fn);
            }

            //   static AsyncGenerator<std::shared_ptr<Buffer>> MakeAsync(
            //       AsyncGenerator<std::shared_ptr<Buffer>> buffer_iterator) {
            //     Transformer<std::shared_ptr<Buffer>, std::shared_ptr<Buffer>>
            //     fn =
            //         CSVBufferIterator();
            //     return MakeTransformedGenerator(std::move(buffer_iterator),
            //     fn);
            //   }

            Result<TransformFlow<std::shared_ptr<Buffer>>>
            operator()(std::shared_ptr<Buffer> buf) {
                if (buf == nullptr) {
                    // EOF
                    return TransformFinish();
                }

                int64_t offset = 0;
                if (first_buffer_) {
                    ARROW_ASSIGN_OR_RAISE(
                        auto data, util::SkipUTF8BOM(buf->data(), buf->size())
                    );
                    offset += data - buf->data();
                    DCHECK_GE(offset, 0);
                    first_buffer_ = false;
                }

                if (trailing_cr_ && buf->data()[offset] == '\n') {
                    // Skip '\r\n' line separator that started at the end of
                    // previous buffer
                    ++offset;
                }

                trailing_cr_ = (buf->data()[buf->size() - 1] == '\r');
                buf = SliceBuffer(buf, offset);
                if (buf->size() == 0) {
                    // EOF
                    return TransformFinish();
                }
                return TransformYield(buf);
            }

        protected:
            bool first_buffer_ = true;
            // Whether there was a trailing CR at the end of last received
            // buffer
            bool trailing_cr_ = false;
        };

        struct CSVBlock {
            // (partial + completion + buffer) is an entire delimited CSV
            // buffer.
            std::shared_ptr<Buffer> partial;
            std::shared_ptr<Buffer> completion;
            std::shared_ptr<Buffer> buffer;
            int64_t block_index;
            bool is_final;
            int64_t bytes_skipped;
            std::function<Status(int64_t)> consume_bytes;
        };

    } // namespace
} // namespace csv

template <>
struct IterationTraits<csv::CSVBlock> {
    static csv::CSVBlock
    End() {
        return csv::CSVBlock{{}, {}, {}, -1, true, 0, {}};
    }
    static bool
    IsEnd(const csv::CSVBlock& val) {
        return val.block_index < 0;
    }
};

namespace csv {
    namespace {

        // This is a callable that can be used to transform an iterator.  The
        // source iterator will contain buffers of data and the output iterator
        // will contain delimited CSV blocks.  std::optional is used so that
        // there is an end token (required by the iterator APIs (e.g. Visit))
        // even though an empty optional is never used in this code.
        class BlockReader {
        public:
            BlockReader(
                std::unique_ptr<Chunker> chunker,
                std::shared_ptr<Buffer> first_buffer,
                int64_t skip_rows
            ) :
                chunker_(std::move(chunker)),
                partial_(std::make_shared<Buffer>("")),
                buffer_(std::move(first_buffer)),
                skip_rows_(skip_rows) {}

        protected:
            std::unique_ptr<Chunker> chunker_;
            std::shared_ptr<Buffer> partial_, buffer_;
            int64_t skip_rows_;
            int64_t block_index_ = 0;
            // Whether there was a trailing CR at the end of last received
            // buffer
            bool trailing_cr_ = false;
        };

        // An object that reads delimited CSV blocks for serial use.
        // The number of bytes consumed should be notified after each read,
        // using CSVBlock::consume_bytes.
        class SerialBlockReader : public BlockReader {
        public:
            using BlockReader::BlockReader;

            static Iterator<CSVBlock>
            MakeIterator(
                Iterator<std::shared_ptr<Buffer>> buffer_iterator,
                std::unique_ptr<Chunker> chunker,
                const std::shared_ptr<Buffer>& first_buffer,
                int64_t skip_rows
            ) {
                auto block_reader = std::make_shared<SerialBlockReader>(
                    std::move(chunker), first_buffer, skip_rows
                );
                // Wrap shared pointer in callable
                Transformer<std::shared_ptr<Buffer>, CSVBlock> block_reader_fn =
                    [block_reader](const std::shared_ptr<Buffer>& buf) {
                        return (*block_reader)(buf);
                    };
                return MakeTransformedIterator(
                    std::move(buffer_iterator), block_reader_fn
                );
            }

            //   static AsyncGenerator<CSVBlock> MakeAsyncIterator(
            //       AsyncGenerator<std::shared_ptr<Buffer>> buffer_generator,
            //       std::unique_ptr<Chunker> chunker, std::shared_ptr<Buffer>
            //       first_buffer, int64_t skip_rows) {
            //     auto block_reader =
            //         std::make_shared<SerialBlockReader>(std::move(chunker),
            //         first_buffer, skip_rows);
            //     // Wrap shared pointer in callable
            //     Transformer<std::shared_ptr<Buffer>, CSVBlock>
            //     block_reader_fn =
            //         [block_reader](std::shared_ptr<Buffer> next) {
            //           return (*block_reader)(std::move(next));
            //         };
            //     return MakeTransformedGenerator(std::move(buffer_generator),
            //     block_reader_fn);
            //   }

            Result<TransformFlow<CSVBlock>>
            operator()(const std::shared_ptr<Buffer>& next_buffer) {
                if (buffer_ == nullptr) {
                    return TransformFinish();
                }

                bool is_final = (next_buffer == nullptr);
                int64_t bytes_skipped = 0;

                if (skip_rows_ != 0) {
                    bytes_skipped += partial_->size();
                    auto orig_size = buffer_->size();
                    RETURN_NOT_OK(chunker_->ProcessSkip(
                        partial_, buffer_, is_final, &skip_rows_, &buffer_
                    ));
                    bytes_skipped += orig_size - buffer_->size();
                    auto empty = std::make_shared<Buffer>(nullptr, 0);
                    if (skip_rows_ != 0) {
                        // Still have rows beyond this buffer to skip return
                        // empty block
                        partial_ = std::move(buffer_);
                        buffer_ = next_buffer;
                        return TransformYield<CSVBlock>(CSVBlock{
                            empty,
                            empty,
                            empty,
                            block_index_++,
                            is_final,
                            bytes_skipped,
                            [](int64_t) { return Status::OK(); }
                        });
                    }
                    partial_ = std::move(empty);
                }

                std::shared_ptr<Buffer> completion;

                if (is_final) {
                    // End of file reached => compute completion from
                    // penultimate block
                    RETURN_NOT_OK(chunker_->ProcessFinal(
                        partial_, buffer_, &completion, &buffer_
                    ));
                } else {
                    // Get completion of partial from previous block.
                    RETURN_NOT_OK(chunker_->ProcessWithPartial(
                        partial_, buffer_, &completion, &buffer_
                    ));
                }
                int64_t bytes_before_buffer =
                    partial_->size() + completion->size();

                auto consume_bytes = [this,
                                      bytes_before_buffer,
                                      next_buffer](int64_t nbytes) -> Status {
                    DCHECK_GE(nbytes, 0);
                    auto offset = nbytes - bytes_before_buffer;
                    if (offset < 0) {
                        // Should not happen
                        return Status::Invalid(
                            "CSV parser got out of sync with chunker"
                        );
                    }
                    partial_ = SliceBuffer(buffer_, offset);
                    buffer_ = next_buffer;
                    return Status::OK();
                };

                return TransformYield<CSVBlock>(CSVBlock{
                    partial_,
                    completion,
                    buffer_,
                    block_index_++,
                    is_final,
                    bytes_skipped,
                    std::move(consume_bytes)
                });
            }
        };

        struct ParsedBlock {
            std::shared_ptr<BlockParser> parser;
            int64_t block_index;
            int64_t bytes_parsed_or_skipped;
        };

        struct DecodedBlock {
            std::shared_ptr<RecordBatch> record_batch;
            // Represents the number of input bytes represented by this batch
            // This will include bytes skipped when skipping rows after the
            // header
            int64_t bytes_processed;
        };

    } // namespace

} // namespace csv

template <>
struct IterationTraits<csv::ParsedBlock> {
    static csv::ParsedBlock
    End() {
        return csv::ParsedBlock{nullptr, -1, -1};
    }
    static bool
    IsEnd(const csv::ParsedBlock& val) {
        return val.block_index < 0;
    }
};

template <>
struct IterationTraits<csv::DecodedBlock> {
    static csv::DecodedBlock
    End() {
        return csv::DecodedBlock{nullptr, -1};
    }
    static bool
    IsEnd(const csv::DecodedBlock& val) {
        return val.bytes_processed < 0;
    }
};

namespace csv {
    namespace {

        // A function object that takes in a buffer of CSV data and returns a
        // parsed batch of CSV data (CSVBlock -> ParsedBlock) for use with
        // MakeMappedGenerator. The parsed batch contains a list of offsets for
        // each of the columns so that columns can be individually scanned
        //
        // This operator is not re-entrant
        class BlockParsingOperator {
        public:
            BlockParsingOperator(
                io::IOContext io_context,
                ParseOptions parse_options,
                int num_csv_cols,
                int64_t first_row
            ) :
                io_context_(std::move(std::move(io_context))),
                parse_options_(std::move(std::move(parse_options))),
                num_csv_cols_(num_csv_cols),
                count_rows_(first_row >= 0),
                num_rows_seen_(first_row) {}

            Result<ParsedBlock>
            operator()(const CSVBlock& block) {
                constexpr int32_t max_num_rows =
                    std::numeric_limits<int32_t>::max();
                auto parser = std::make_shared<BlockParser>(
                    io_context_.pool(),
                    parse_options_,
                    num_csv_cols_,
                    num_rows_seen_,
                    max_num_rows
                );

                std::shared_ptr<Buffer> straddling;
                std::vector<std::string_view> views;
                if (block.partial->size() != 0
                    || block.completion->size() != 0) {
                    if (block.partial->size() == 0) {
                        straddling = block.completion;
                    } else if (block.completion->size() == 0) {
                        straddling = block.partial;
                    } else {
                        ARROW_ASSIGN_OR_RAISE(
                            straddling,
                            ConcatenateBuffers(
                                {block.partial, block.completion},
                                io_context_.pool()
                            )
                        );
                    }
                    views = {
                        std::string_view(*straddling),
                        std::string_view(*block.buffer)
                    };
                } else {
                    views = {std::string_view(*block.buffer)};
                }
                uint32_t parsed_size;
                if (block.is_final) {
                    RETURN_NOT_OK(parser->ParseFinal(views, &parsed_size));
                } else {
                    RETURN_NOT_OK(parser->Parse(views, &parsed_size));
                }
                if (count_rows_) {
                    num_rows_seen_ += parser->total_num_rows();
                }
                RETURN_NOT_OK(block.consume_bytes(parsed_size));
                return ParsedBlock{
                    std::move(parser),
                    block.block_index,
                    static_cast<int64_t>(parsed_size) + block.bytes_skipped
                };
            }

        private:
            io::IOContext io_context_;
            ParseOptions parse_options_;
            int num_csv_cols_;
            bool count_rows_;
            int64_t num_rows_seen_;
        };

        /////////////////////////////////////////////////////////////////////////
        // Base class for common functionality

        class ReaderMixin {
        public:
            ReaderMixin(
                io::IOContext io_context,
                std::shared_ptr<io::InputStream> input,
                ReadOptions read_options,
                ParseOptions parse_options,
                ConvertOptions convert_options,
                bool count_rows
            ) :
                io_context_(std::move(io_context)),
                read_options_(std::move(read_options)),
                parse_options_(std::move(parse_options)),
                convert_options_(std::move(convert_options)),
                count_rows_(count_rows),
                num_rows_seen_(count_rows_ ? 1 : -1),
                input_(std::move(input)) {}

        protected:
            // Read header and column names from buffer, create column builders
            // Returns the # of bytes consumed
            Result<int64_t>
            ProcessHeader(
                const std::shared_ptr<Buffer>& buf,
                std::shared_ptr<Buffer>* rest
            ) {
                const uint8_t* data = buf->data();
                const auto* const data_end = data + buf->size();
                DCHECK_GT(data_end - data, 0);

                if (read_options_.skip_rows != 0) {
                    // Skip initial rows (potentially invalid CSV data)
                    auto num_skipped_rows = SkipRows(
                        data,
                        static_cast<uint32_t>(data_end - data),
                        read_options_.skip_rows,
                        &data
                    );
                    if (num_skipped_rows < read_options_.skip_rows) {
                        return Status::Invalid(
                            "Could not skip initial ",
                            read_options_.skip_rows,
                            " rows from CSV file, "
                            "either file is too short or header is larger than "
                            "block size"
                        );
                    }
                    if (count_rows_) {
                        num_rows_seen_ += num_skipped_rows;
                    }
                }

                if (read_options_.column_names.empty()) {
                    // Parse one row (either to read column names or to know the
                    // number of columns)
                    BlockParser parser(
                        io_context_.pool(),
                        parse_options_,
                        num_csv_cols_,
                        num_rows_seen_,
                        1
                    );
                    uint32_t parsed_size = 0;
                    RETURN_NOT_OK(parser.Parse(
                        std::string_view(
                            reinterpret_cast<const char*>(data), data_end - data
                        ),
                        &parsed_size
                    ));
                    if (parser.num_rows() != 1) {
                        return Status::Invalid(
                            "Could not read first row from CSV file, either "
                            "file is too short or header is larger than block "
                            "size"
                        );
                    }
                    if (parser.num_cols() == 0) {
                        return Status::Invalid("No columns in CSV file");
                    }

                    if (read_options_.autogenerate_column_names) {
                        column_names_ = GenerateColumnNames(parser.num_cols());
                    } else {
                        // Read column names from header row
                        auto visit = [&](const uint8_t* data,
                                         uint32_t size,
                                         bool quoted) -> Status {
                            column_names_.emplace_back(
                                reinterpret_cast<const char*>(data), size
                            );
                            return Status::OK();
                        };
                        RETURN_NOT_OK(parser.VisitLastRow(visit));
                        DCHECK_EQ(
                            static_cast<size_t>(parser.num_cols()),
                            column_names_.size()
                        );
                        // Skip parsed header row
                        data += parsed_size;
                        if (count_rows_) {
                            ++num_rows_seen_;
                        }
                    }
                } else {
                    column_names_ = read_options_.column_names;
                }

                if (count_rows_) {
                    // increase rows seen to skip past rows which will be
                    // skipped
                    num_rows_seen_ += read_options_.skip_rows_after_names;
                }

                auto bytes_consumed = data - buf->data();
                *rest = SliceBuffer(buf, bytes_consumed);

                num_csv_cols_ = static_cast<int32_t>(column_names_.size());
                DCHECK_GT(num_csv_cols_, 0);

                RETURN_NOT_OK(MakeConversionSchema());
                return bytes_consumed;
            }

            std::vector<std::string>
            GenerateColumnNames(int32_t num_cols) {
                std::vector<std::string> res;
                res.reserve(num_cols);
                for (int32_t i = 0; i < num_cols; ++i) {
                    std::stringstream ss;
                    ss << "f" << i;
                    res.push_back(ss.str());
                }
                return res;
            }

            // Make conversion schema from options and parsed CSV header
            Status
            MakeConversionSchema() {
                // Append a column converted from CSV data
                auto append_csv_column = [&](std::string col_name,
                                             int32_t col_index) {
                    // Does the named column have a fixed type?
                    auto it = convert_options_.column_types.find(col_name);
                    if (it == convert_options_.column_types.end()) {
                        conversion_schema_.columns.push_back(
                            ConversionSchema::InferredColumn(
                                std::move(col_name), col_index
                            )
                        );
                    } else {
                        conversion_schema_.columns.push_back(
                            ConversionSchema::TypedColumn(
                                std::move(col_name), col_index, it->second
                            )
                        );
                    }
                };

                // Append a column of nulls
                auto append_null_column = [&](std::string col_name) {
                    // If the named column has a fixed type, use it, otherwise
                    // use null()
                    std::shared_ptr<DataType> type;
                    auto it = convert_options_.column_types.find(col_name);
                    if (it == convert_options_.column_types.end()) {
                        type = null();
                    } else {
                        type = it->second;
                    }
                    conversion_schema_.columns.push_back(
                        ConversionSchema::NullColumn(
                            std::move(col_name), std::move(type)
                        )
                    );
                };

                if (convert_options_.include_columns.empty()) {
                    // Include all columns in CSV file order
                    for (int32_t col_index = 0; col_index < num_csv_cols_;
                         ++col_index) {
                        append_csv_column(column_names_[col_index], col_index);
                    }
                } else {
                    // Include columns from `include_columns` (in that order)
                    // Compute indices of columns in the CSV file
                    std::unordered_map<std::string, int32_t> col_indices;
                    col_indices.reserve(column_names_.size());
                    for (int32_t i = 0;
                         i < static_cast<int32_t>(column_names_.size());
                         ++i) {
                        col_indices.emplace(column_names_[i], i);
                    }

                    for (const auto& col_name :
                         convert_options_.include_columns) {
                        auto it = col_indices.find(col_name);
                        if (it != col_indices.end()) {
                            append_csv_column(col_name, it->second);
                        } else if (convert_options_.include_missing_columns) {
                            append_null_column(col_name);
                        } else {
                            return Status::KeyError(
                                "Column '",
                                col_name,
                                "' in include_columns "
                                "does not exist in CSV file"
                            );
                        }
                    }
                }
                return Status::OK();
            }

            struct ParseResult {
                std::shared_ptr<BlockParser> parser;
                int64_t parsed_bytes;
            };

            Result<ParseResult>
            Parse(
                const std::shared_ptr<Buffer>& partial,
                const std::shared_ptr<Buffer>& completion,
                const std::shared_ptr<Buffer>& block,
                int64_t block_index,
                bool is_final
            ) {
                static constexpr int32_t max_num_rows =
                    std::numeric_limits<int32_t>::max();
                auto parser = std::make_shared<BlockParser>(
                    io_context_.pool(),
                    parse_options_,
                    num_csv_cols_,
                    num_rows_seen_,
                    max_num_rows
                );

                std::shared_ptr<Buffer> straddling;
                std::vector<std::string_view> views;
                if (partial->size() != 0 || completion->size() != 0) {
                    if (partial->size() == 0) {
                        straddling = completion;
                    } else if (completion->size() == 0) {
                        straddling = partial;
                    } else {
                        ARROW_ASSIGN_OR_RAISE(
                            straddling,
                            ConcatenateBuffers(
                                {partial, completion}, io_context_.pool()
                            )
                        );
                    }
                    views = {
                        std::string_view(*straddling), std::string_view(*block)
                    };
                } else {
                    views = {std::string_view(*block)};
                }
                uint32_t parsed_size;
                if (is_final) {
                    RETURN_NOT_OK(parser->ParseFinal(views, &parsed_size));
                } else {
                    RETURN_NOT_OK(parser->Parse(views, &parsed_size));
                }
                if (count_rows_) {
                    num_rows_seen_ += parser->total_num_rows();
                }
                return ParseResult{
                    std::move(parser), static_cast<int64_t>(parsed_size)
                };
            }

            io::IOContext io_context_;
            ReadOptions read_options_;
            ParseOptions parse_options_;
            ConvertOptions convert_options_;

            // Number of columns in the CSV file
            int32_t num_csv_cols_ = -1;
            // Whether num_rows_seen_ tracks the number of rows seen in the CSV
            // being parsed
            bool count_rows_;
            // Number of rows seen in the csv. Not used if count_rows is false
            int64_t num_rows_seen_;
            // Column names in the CSV file
            std::vector<std::string> column_names_;
            ConversionSchema conversion_schema_;

            std::shared_ptr<io::InputStream> input_;
            std::shared_ptr<TaskGroup> task_group_;
        };

        /////////////////////////////////////////////////////////////////////////
        // Base class for one-shot table readers

        class BaseTableReader : public ReaderMixin, public csv::TableReader {
        public:
            using ReaderMixin::ReaderMixin;

            virtual Status Init() = 0;

            //   Future<std::shared_ptr<Table>> ReadAsync() override {
            //     return Future<std::shared_ptr<Table>>::MakeFinished(Read());
            //   }

        protected:
            // Make column builders from conversion schema
            Status
            MakeColumnBuilders() {
                for (const auto& column : conversion_schema_.columns) {
                    std::shared_ptr<ColumnBuilder> builder;
                    if (column.is_missing) {
                        ARROW_ASSIGN_OR_RAISE(
                            builder,
                            ColumnBuilder::MakeNull(
                                io_context_.pool(), column.type, task_group_
                            )
                        );
                    } else if (column.type != nullptr) {
                        ARROW_ASSIGN_OR_RAISE(
                            builder,
                            ColumnBuilder::Make(
                                io_context_.pool(),
                                column.type,
                                column.index,
                                convert_options_,
                                task_group_
                            )
                        );
                    } else {
                        ARROW_ASSIGN_OR_RAISE(
                            builder,
                            ColumnBuilder::Make(
                                io_context_.pool(),
                                column.index,
                                convert_options_,
                                task_group_
                            )
                        );
                    }
                    column_builders_.push_back(std::move(builder));
                }
                return Status::OK();
            }

            Result<int64_t>
            ParseAndInsert(
                const std::shared_ptr<Buffer>& partial,
                const std::shared_ptr<Buffer>& completion,
                const std::shared_ptr<Buffer>& block,
                int64_t block_index,
                bool is_final
            ) {
                ARROW_ASSIGN_OR_RAISE(
                    auto result,
                    Parse(partial, completion, block, block_index, is_final)
                );
                RETURN_NOT_OK(ProcessData(result.parser, block_index));
                return result.parsed_bytes;
            }

            // Trigger conversion of parsed block data
            Status
            ProcessData(
                const std::shared_ptr<BlockParser>& parser, int64_t block_index
            ) {
                for (auto& builder : column_builders_) {
                    builder->Insert(block_index, parser);
                }
                return Status::OK();
            }

            Result<std::shared_ptr<Table>>
            MakeTable() {
                DCHECK_EQ(
                    column_builders_.size(), conversion_schema_.columns.size()
                );

                std::vector<std::shared_ptr<Field>> fields;
                std::vector<std::shared_ptr<ChunkedArray>> columns;

                for (int32_t i = 0;
                     i < static_cast<int32_t>(column_builders_.size());
                     ++i) {
                    const auto& column = conversion_schema_.columns[i];
                    ARROW_ASSIGN_OR_RAISE(
                        auto array, column_builders_[i]->Finish()
                    );
                    fields.push_back(::arrow::field(column.name, array->type())
                    );
                    columns.emplace_back(std::move(array));
                }
                return Table::Make(
                    schema(std::move(fields)), std::move(columns)
                );
            }

            // Column builders for target Table (in ConversionSchema order)
            std::vector<std::shared_ptr<ColumnBuilder>> column_builders_;
        };

    } // namespace

    /////////////////////////////////////////////////////////////////////////
    // Serial TableReader implementation

    class SerialTableReader : public BaseTableReader {
    public:
        using BaseTableReader::BaseTableReader;

        Status
        Init() override {
            ARROW_ASSIGN_OR_RAISE(
                auto istream_it,
                io::MakeInputStreamIterator(input_, read_options_.block_size)
            );

            // Since we're converting serially, no need to readahead more than
            // one block int32_t block_queue_size = 1;
            // ARROW_ASSIGN_OR_RAISE(auto rh_it,
            //                       MakeReadaheadIterator(std::move(istream_it),
            //                       block_queue_size));
            buffer_iterator_ = CSVBufferIterator::Make(std::move(istream_it));
            return Status::OK();
        }

        Result<std::shared_ptr<Table>>
        Read() override {
            task_group_ = TaskGroup::MakeSerial(io_context_.stop_token());

            // First block
            ARROW_ASSIGN_OR_RAISE(auto first_buffer, buffer_iterator_.Next());
            if (first_buffer == nullptr) {
                return Status::Invalid("Empty CSV file");
            }
            RETURN_NOT_OK(ProcessHeader(first_buffer, &first_buffer));
            RETURN_NOT_OK(MakeColumnBuilders());

            auto block_iterator = SerialBlockReader::MakeIterator(
                std::move(buffer_iterator_),
                MakeChunker(parse_options_),
                first_buffer,
                read_options_.skip_rows_after_names
            );
            while (true) {
                RETURN_NOT_OK(io_context_.stop_token().Poll());

                ARROW_ASSIGN_OR_RAISE(auto maybe_block, block_iterator.Next());
                if (IsIterationEnd(maybe_block)) {
                    // EOF
                    break;
                }
                ARROW_ASSIGN_OR_RAISE(
                    int64_t parsed_bytes,
                    ParseAndInsert(
                        maybe_block.partial,
                        maybe_block.completion,
                        maybe_block.buffer,
                        maybe_block.block_index,
                        maybe_block.is_final
                    )
                );
                RETURN_NOT_OK(maybe_block.consume_bytes(parsed_bytes));
            }
            // Finish conversion, create schema and table
            RETURN_NOT_OK(task_group_->Finish());
            return MakeTable();
        }

    protected:
        Iterator<std::shared_ptr<Buffer>> buffer_iterator_;
    };

    Result<std::shared_ptr<TableReader>>
    MakeTableReader(
        MemoryPool* pool,
        const io::IOContext& io_context,
        const std::shared_ptr<io::InputStream>& input,
        const ReadOptions& read_options,
        const ParseOptions& parse_options,
        const ConvertOptions& convert_options
    ) {
        RETURN_NOT_OK(parse_options.Validate());
        RETURN_NOT_OK(read_options.Validate());
        RETURN_NOT_OK(convert_options.Validate());
        std::shared_ptr<BaseTableReader> reader;
        //   if (read_options.use_threads) {
        //     auto cpu_executor = internal::GetCpuThreadPool();
        //     reader = std::make_shared<AsyncThreadedTableReader>(
        //         io_context, input, read_options, parse_options,
        //         convert_options, cpu_executor);
        //   } else {
        reader = std::make_shared<SerialTableReader>(
            io_context,
            input,
            read_options,
            parse_options,
            convert_options,
            /*count_rows=*/true
        );
        //   }
        RETURN_NOT_OK(reader->Init());
        return reader;
    }

    /////////////////////////////////////////////////////////////////////////
    // Factory functions

    Result<std::shared_ptr<TableReader>>
    TableReader::Make(
        const io::IOContext& io_context,
        const std::shared_ptr<io::InputStream>& input,
        const ReadOptions& read_options,
        const ParseOptions& parse_options,
        const ConvertOptions& convert_options
    ) {
        return MakeTableReader(
            io_context.pool(),
            io_context,
            input,
            read_options,
            parse_options,
            convert_options
        );
    }

    Result<std::shared_ptr<TableReader>>
    TableReader::Make(
        MemoryPool* pool,
        const io::IOContext& io_context,
        const std::shared_ptr<io::InputStream>& input,
        const ReadOptions& read_options,
        const ParseOptions& parse_options,
        const ConvertOptions& convert_options
    ) {
        return MakeTableReader(
            pool,
            io_context,
            input,
            read_options,
            parse_options,
            convert_options
        );
    }

} // namespace csv

} // namespace arrow
