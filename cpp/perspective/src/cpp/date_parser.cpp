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

#include <sstream>
#include <perspective/first.h>
#include <perspective/date_parser.h>
#include <locale>
#include <iomanip>

namespace perspective {

// Milliseconds & timezones are not currently handled
const std::string t_date_parser::VALID_FORMATS[12] = {
    "%Y%m%dT%H%M%S", // ISO "%Y%m%dT%H%M%S%F%q"
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",     // ISO extended
    "%A, %d %b %Y %H:%M:%S", // RFC 0822
    "%Y-%m-%d\\%H:%M:%S"
    "%m-%d-%Y",
    "%m/%d/%Y",
    "%m-%d-%Y",
    "%m %d %Y",
    "%m/%d/%Y",
    "%m/%d/%y",
    "%d %m %Y"
};

t_date_parser::t_date_parser() {}

bool
t_date_parser::is_valid(std::string const& datestring) {
    for (const std::string& fmt : VALID_FORMATS) {
        if (fmt != "") {
            std::tm t = {};
            std::stringstream ss(datestring);
            ss.imbue(std::locale::classic());
            ss >> std::get_time(&t, fmt.c_str());
            if (!ss.fail()) {
                return true;
            }
        }
    }
    return false;
}
} // end namespace perspective