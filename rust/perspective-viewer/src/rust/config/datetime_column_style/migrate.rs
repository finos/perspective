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

use serde_json::{Map, Value};

use crate::config::API_VERSION;
use crate::renderer::ColumnConfigMap;

/// The first release whose stored `date_format` fields inherit when missing.
const INHERITING_RELEASE: (u64, u64, u64) = (5, 7, 0);

const PART_FALLBACKS: [(&str, &str); 6] = [
    ("year", "2-digit"),
    ("month", "numeric"),
    ("day", "numeric"),
    ("hour", "numeric"),
    ("minute", "numeric"),
    ("second", "numeric"),
];

const SHAPE_KEYS: [&str; 10] = [
    "dateStyle",
    "timeStyle",
    "weekday",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "fractionalSecondDigits",
];

/// Rewrite every `date_format` in `columns` written before 5.7 into the form
/// that renders identically under inheriting semantics.
pub fn migrate_date_formats(version: Option<&str>, columns: &mut ColumnConfigMap) {
    let versioned_legacy = version.is_some_and(is_legacy_version);
    for entry in columns.values_mut() {
        if let Some(Value::Object(format)) = entry.get_mut("date_format") {
            migrate_date_format(format, versioned_legacy);
        }
    }
}

fn is_legacy_version(version: &str) -> bool {
    version != *API_VERSION && parse_version(version).is_some_and(|v| v < INHERITING_RELEASE)
}

fn parse_version(version: &str) -> Option<(u64, u64, u64)> {
    let core = version.split(['-', '+']).next()?;
    let mut parts = core.split('.').map(|x| x.parse::<u64>().ok());
    Some((parts.next()??, parts.next()??, parts.next()??))
}

fn is_disabled(value: &Value) -> bool {
    value.as_str() == Some("disabled")
}

fn migrate_date_format(format: &mut Map<String, Value>, versioned_legacy: bool) {
    if format.remove("format").is_some() {
        for (key, fallback) in PART_FALLBACKS {
            format.entry(key).or_insert_with(|| Value::from(fallback));
        }

        format.entry("hour12").or_insert(Value::Bool(true));
        if format.get("fractionalSecondDigits").and_then(Value::as_u64) == Some(0) {
            format.remove("fractionalSecondDigits");
        }
    } else if versioned_legacy || format.values().any(is_disabled) {
        format
            .entry("dateStyle")
            .or_insert_with(|| Value::from("short"));
        format
            .entry("timeStyle")
            .or_insert_with(|| Value::from("medium"));
    } else {
        return;
    }

    format.retain(|_, value| !is_disabled(value));
    if !SHAPE_KEYS.iter().any(|key| format.contains_key(*key)) {
        for key in ["year", "month", "day"] {
            format.insert(key.to_owned(), Value::from("numeric"));
        }
    }
}
