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

use std::cell::RefCell;
use std::collections::{HashMap, HashSet};

use perspective_client::proto::ColumnType;
use perspective_js::utils::{ApiResult, JsValueSerdeExt};
use serde_json::{Map, Value, json};
use wasm_bindgen::JsValue;

use super::make_short_name;
use super::registry::*;
use crate::config::{CustomNumberFormatConfig, DatetimeFormat};
use crate::utils::{PtrEqRc, PubSub};

type ConfigMap = Map<String, Value>;

thread_local! {
    /// The page-wide `plugin_config` and `columns_config` default overrides.
    pub static CONFIG_DEFAULTS: ConfigDefaults = ConfigDefaults::default();
}

/// The page-wide default overrides, held as one immutable value that each
/// change replaces.
#[derive(Default)]
pub struct ConfigDefaults {
    slots: RefCell<PtrEqRc<ConfigDefaultsSlots>>,
    reported: RefCell<HashSet<String>>,
    pub changed: PubSub<PtrEqRc<ConfigDefaultsSlots>>,
}

impl ConfigDefaults {
    /// The current value, pointer-equal until the next [`Self::swap`].
    pub fn slots(&self) -> PtrEqRc<ConfigDefaultsSlots> {
        self.slots.borrow().clone()
    }

    /// Install `next` as the current value and announce it.
    pub fn swap(&self, next: ConfigDefaultsSlots) {
        let next = PtrEqRc::new(next);
        *self.slots.borrow_mut() = next.clone();
        self.reported.borrow_mut().clear();
        self.changed.emit(next);
    }

    /// Log `message` as an error once per installed value.
    pub fn report(&self, message: String) {
        if self.reported.borrow_mut().insert(message.clone()) {
            tracing::error!("{message}");
        }
    }
}

/// Every default override, as one value identified by pointer and never
/// compared by content.
#[derive(Clone, Debug, Default)]
pub struct ConfigDefaultsSlots {
    plugin: HashMap<Option<String>, ConfigMap>,
    column: HashMap<(Option<String>, Option<ColumnType>), ConfigMap>,
}

impl ConfigDefaultsSlots {
    /// This value with `patch` merged into the plugin slot, or `None` when that
    /// changes nothing.
    pub fn with_plugin(&self, plugin: Option<String>, patch: Option<ConfigMap>) -> Option<Self> {
        let slot = merge_slot(self.plugin.get(&plugin), patch)?;
        let mut next = self.clone();
        match slot {
            Some(map) => next.plugin.insert(plugin, map),
            None => next.plugin.remove(&plugin),
        };

        Some(next)
    }

    /// This value with `patch` merged into the column slot, or `None` when that
    /// changes nothing.
    pub fn with_column(
        &self,
        plugin: Option<String>,
        ty: Option<ColumnType>,
        patch: Option<ConfigMap>,
    ) -> Option<Self> {
        let key = (plugin, ty);
        let slot = merge_slot(self.column.get(&key), patch)?;
        let mut next = self.clone();
        match slot {
            Some(map) => next.column.insert(key, map),
            None => next.column.remove(&key),
        };

        Some(next)
    }

    /// The plugin slots that apply to `plugin`, lowest precedence first.
    pub fn plugin_layers(&self, plugin: &str) -> Vec<&ConfigMap> {
        [None, Some(plugin.to_owned())]
            .iter()
            .filter_map(|key| self.plugin.get(key))
            .collect()
    }

    /// The column slots that apply to a `ty` column of `plugin`, lowest
    /// precedence first.
    pub fn column_layers(&self, plugin: &str, ty: ColumnType) -> Vec<&ConfigMap> {
        let plugin = Some(plugin.to_owned());
        [
            (None, None),
            (None, Some(ty)),
            (plugin.clone(), None),
            (plugin, Some(ty)),
        ]
        .iter()
        .filter_map(|key| self.column.get(key))
        .collect()
    }

    /// Whether any column slot applies to some column of `plugin`.
    pub fn has_column_layers(&self, plugin: &str) -> bool {
        self.column
            .keys()
            .any(|(p, _)| p.as_deref().is_none_or(|p| p == plugin))
    }

    /// Whether no slot holds anything.
    pub fn is_empty(&self) -> bool {
        self.plugin.is_empty() && self.column.is_empty()
    }

    /// The plugin slots as JSON, unqualified first.
    pub fn snapshot_plugin(&self) -> Value {
        let mut slots: Vec<_> = self.plugin.iter().collect();
        slots.sort_by(|a, b| a.0.cmp(b.0));
        Value::Array(
            slots
                .into_iter()
                .map(|(plugin, defaults)| match plugin {
                    Some(plugin) => json!({ "plugin": plugin, "defaults": defaults }),
                    None => json!({ "defaults": defaults }),
                })
                .collect(),
        )
    }

    /// The column slots as JSON, unqualified first.
    pub fn snapshot_column(&self) -> Value {
        let mut slots: Vec<_> = self
            .column
            .iter()
            .map(|((plugin, ty), defaults)| ((plugin, ty.map(|t| t.to_string())), defaults))
            .collect();

        slots.sort_by(|a, b| a.0.cmp(&b.0));
        Value::Array(
            slots
                .into_iter()
                .map(|((plugin, ty), defaults)| {
                    let mut entry = Map::new();
                    if let Some(plugin) = plugin {
                        entry.insert("plugin".to_owned(), Value::from(plugin.clone()));
                    }

                    if let Some(ty) = ty {
                        entry.insert("type".to_owned(), Value::from(ty));
                    }

                    entry.insert("defaults".to_owned(), Value::Object(defaults.clone()));
                    Value::Object(entry)
                })
                .collect(),
        )
    }
}

impl ConfigDefaultsSlots {
    /// `Err` naming the first slot whose `date_format` or `number_format` is
    /// invalid.
    fn check_formats(&self) -> Result<(), String> {
        for slot in self.plugin.values().chain(self.column.values()) {
            if let Some(format) = slot.get("date_format") {
                serde_json::from_value::<DatetimeFormat>(format.clone())
                    .map_err(|e| e.to_string())
                    .and_then(|format| format.validate())
                    .map_err(|e| format!("Invalid `date_format` default: {e}"))?;
            }

            if let Some(format) = slot.get("number_format") {
                serde_json::from_value::<CustomNumberFormatConfig>(format.clone())
                    .map_err(|e| format!("Invalid `number_format` default: {e}"))?;
            }
        }

        Ok(())
    }
}

/// Merge `defaults` into the `plugin_config` defaults slot `plugin` names, as
/// `setPluginConfigDefaults()` does.
pub fn set_plugin_config_defaults(defaults: &JsValue, plugin: Option<&str>) -> ApiResult<()> {
    let patch = parse_patch(defaults)?;
    let plugin = plugin.map(registered_plugin).transpose()?;
    CONFIG_DEFAULTS
        .with(|registry| swap_checked(registry, registry.slots().with_plugin(plugin, patch)))
}

/// Merge `defaults` into the `columns_config` defaults slot `plugin` and `ty`
/// name, as `setColumnConfigDefaults()` does.
pub fn set_column_config_defaults(
    defaults: &JsValue,
    plugin: Option<&str>,
    ty: Option<&str>,
) -> ApiResult<()> {
    let patch = parse_patch(defaults)?;
    let plugin = plugin.map(registered_plugin).transpose()?;
    let ty = ty
        .map(|ty| {
            ColumnType::try_from(ty).map_err(|_| {
                format!(
                    "`type` must be one of `integer`, `float`, `string`, `boolean`, `date` or \
                     `datetime`, not `{ty}`"
                )
            })
        })
        .transpose()?;

    CONFIG_DEFAULTS
        .with(|registry| swap_checked(registry, registry.slots().with_column(plugin, ty, patch)))
}

/// The `plugin_config` defaults slots, as `getPluginConfigDefaults()` returns
/// them.
pub fn get_plugin_config_defaults() -> ApiResult<JsValue> {
    let snapshot = CONFIG_DEFAULTS.with(|registry| registry.slots().snapshot_plugin());
    Ok(JsValue::from_serde_ext(&snapshot)?)
}

/// The `columns_config` defaults slots, as `getColumnConfigDefaults()` returns
/// them.
pub fn get_column_config_defaults() -> ApiResult<JsValue> {
    let snapshot = CONFIG_DEFAULTS.with(|registry| registry.slots().snapshot_column());
    Ok(JsValue::from_serde_ext(&snapshot)?)
}

fn swap_checked(registry: &ConfigDefaults, next: Option<ConfigDefaultsSlots>) -> ApiResult<()> {
    if let Some(next) = next {
        next.check_formats()?;
        registry.swap(next);
    }

    Ok(())
}

fn parse_patch(defaults: &JsValue) -> ApiResult<Option<ConfigMap>> {
    if defaults.is_null() || defaults.is_undefined() {
        return Ok(None);
    }

    match defaults.into_serde_ext::<Value>()? {
        Value::Object(patch) => {
            check_patch(&patch)?;
            Ok(Some(patch))
        },
        value => Err(format!("`defaults` must be an object or `null`, not `{value}`").into()),
    }
}

fn check_patch(patch: &ConfigMap) -> Result<(), String> {
    for (key, value) in patch {
        match value {
            Value::Array(_) => {
                return Err(format!("`{key}` must be a scalar, an object or `null`"));
            },
            Value::Object(sub) => check_patch(sub)?,
            _ if (key == "date_format" || key == "number_format") && !value.is_null() => {
                return Err(format!("`{key}` must be an object or `null`"));
            },
            _ => {},
        }
    }

    Ok(())
}

fn registered_plugin(name: &str) -> Result<String, String> {
    let configs = PLUGIN_REGISTRY.plugin_configs();
    let short_name = make_short_name(name);
    configs
        .iter()
        .find(|config| make_short_name(&config.name) == short_name)
        .map(|config| config.name.clone())
        .ok_or_else(|| {
            let names = configs
                .iter()
                .map(|config| format!("`{}`", config.name))
                .collect::<Vec<_>>()
                .join(", ");

            format!("No plugin named `{name}`; registered plugins are {names}")
        })
}

fn merge_slot(current: Option<&ConfigMap>, patch: Option<ConfigMap>) -> Option<Option<ConfigMap>> {
    let mut next = current.cloned().unwrap_or_default();
    let changed = match patch {
        None => {
            let changed = !next.is_empty();
            next.clear();
            changed
        },
        Some(patch) => merge_object(&mut next, patch),
    };

    changed.then(|| (!next.is_empty()).then_some(next))
}

fn merge_object(target: &mut ConfigMap, patch: ConfigMap) -> bool {
    let mut changed = false;
    for (key, value) in patch {
        match value {
            Value::Null => changed |= target.remove(&key).is_some(),
            Value::Object(sub) => {
                let mut next = match target.get(&key) {
                    Some(Value::Object(current)) => current.clone(),
                    _ => ConfigMap::new(),
                };

                merge_object(&mut next, sub);
                let next = (!next.is_empty()).then_some(Value::Object(next));
                if target.get(&key) != next.as_ref() {
                    changed = true;
                    match next {
                        Some(next) => target.insert(key, next),
                        None => target.remove(&key),
                    };
                }
            },
            value => {
                if target.get(&key) != Some(&value) {
                    target.insert(key, value);
                    changed = true;
                }
            },
        }
    }

    changed
}
