/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

#include <perspective/base.h>
#include <perspective/arrow_csv.h>
#include <arrow/util/value_parsing.h>
#include <arrow/io/memory.h>

// This causes build warnings
// https://github.com/emscripten-core/emscripten/issues/8574
#include <perspective/vendor/arrow_single_threaded_reader.h>

namespace perspective {
namespace apachearrow {

    std::shared_ptr<::arrow::Table>
    csvToTable(std::string& csv, bool is_update,
        std::unordered_map<std::string, std::shared_ptr<arrow::DataType>>&
            schema) {
        arrow::MemoryPool* pool = arrow::default_memory_pool();
        auto input = std::make_shared<arrow::io::BufferReader>(csv);
        auto read_options = arrow::csv::ReadOptions::Defaults();
        auto parse_options = arrow::csv::ParseOptions::Defaults();
        auto convert_options = arrow::csv::ConvertOptions::Defaults();

        read_options.use_threads = false;
        convert_options.timestamp_parsers
            = std::vector<std::shared_ptr<arrow::TimestampParser>>{
                arrow::TimestampParser::MakeISO8601(),
                arrow::TimestampParser::MakeStrptime("%Y-%m-%d\\D%H:%M:%S.%f"),
                arrow::TimestampParser::MakeStrptime("%m-%d-%Y"),
                arrow::TimestampParser::MakeStrptime("%m/%d/%Y"),
                arrow::TimestampParser::MakeStrptime("%d %m %Y"),
                arrow::TimestampParser::MakeStrptime("%H:%M:%S.%f"),
            };

        if (is_update) {
            convert_options.column_types = std::move(schema);
        }

        auto maybe_reader = arrow::csv::TableReader::Make(
            pool, input, read_options, parse_options, convert_options);

        std::shared_ptr<arrow::csv::TableReader> reader = *maybe_reader;

        auto maybe_table = reader->Read();
        if (!maybe_table.ok()) {
            PSP_COMPLAIN_AND_ABORT(maybe_table.status().ToString());
        }
        return *maybe_table;
    }

} // namespace apachearrow
} // namespace perspective