# Configuration defaults

Every plugin declares a default for each `plugin_config` and `columns_config`
key it understands. Two static methods on the `<perspective-viewer>` element
class replace those defaults for every viewer on the page:

```javascript
const Viewer = customElements.get("perspective-viewer");

// Every plugin that declares `group_pad` now defaults it to 10.
Viewer.setPluginConfigDefaults({ group_pad: 10 });

// Datetime columns render in UTC in every plugin.
Viewer.setColumnConfigDefaults(
    { date_format: { timeZone: "UTC" } },
    { type: "datetime" },
);
```

A replaced default behaves exactly like the plugin's own:

- The settings and column style editors show it as the unedited value.
- A value equal to it is left out of `save()`, `saveWorkspace()` and the
  `perspective-config-update` event, so a column nobody edited saves nothing.
- The plugin renders it wherever the stored config leaves the key out.
- `restore()` drops a value equal to it, like any other default.

Defaults are part of the host application, like registered plugins and themes.
They are never saved, and `restore()` and `reset()` never change them.

## Narrowing

Both methods take an `options` object:

| Option   | Method                    | Effect                                                                                                   |
| -------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `plugin` | both                      | Applies only to the named plugin, e.g. `"Datagrid"` or `"X/Y Line"`                                      |
| `type`   | `setColumnConfigDefaults` | Applies only to columns of this view type: `integer`, `float`, `string`, `boolean`, `date` or `datetime` |

Without `plugin`, a default applies to every plugin that declares the key and is
ignored by the rest. When several defaults set the same key, the most specific
wins:

| Precedence (low to high)                              |
| ----------------------------------------------------- |
| The plugin's declared default                         |
| `setColumnConfigDefaults(defaults)`                   |
| `setColumnConfigDefaults(defaults, { type })`         |
| `setColumnConfigDefaults(defaults, { plugin })`       |
| `setColumnConfigDefaults(defaults, { plugin, type })` |
| The column's own stored config                        |

`plugin_config` defaults follow the same order without the `type` levels.

## Merging and removing

Each call merges into the defaults set by earlier calls with the same options.
`null` removes a default at any depth:

| Call                                  | Effect                                       |
| ------------------------------------- | -------------------------------------------- |
| `{ group_pad: 10 }`                   | Sets `group_pad`, keeping everything else    |
| `{ group_pad: null }`                 | Removes `group_pad`                          |
| `{ date_format: { timeZone: null } }` | Removes only `timeZone` from `date_format`   |
| `null`                                | Removes every default set with these options |

`getPluginConfigDefaults()` and `getColumnConfigDefaults()` return the current
defaults, one entry per combination of options.

## Formats

`date_format` and `number_format` defaults combine with the plugin's declared
format and with a column's stored format by group rather than as a whole:

| Format          | Applies as one group                                                                                              | Applies individually |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- |
| `date_format`   | `dateStyle`, `timeStyle`, `weekday`, `year`, `month`, `day`, `hour`, `minute`, `second`, `fractionalSecondDigits` | `timeZone`, `hour12` |
| `number_format` | `style` and its `currency*`/`unit*` options; `notation` and `compactDisplay`                                      | everything else      |

So a page-wide `timeZone` reaches a column whose user picked a long date, while
a default `dateStyle` never mixes with a column's own per-part fields. A
`number_format` default that sets one digit bound inherits the other from the
plugin, so `{ maximumFractionDigits: 4 }` on a datagrid float column means 2 to
4 digits.

In the charts, a `date_format` default that sets only `timeZone` or `hour12`
keeps the adaptive axis labels, which choose their precision from the zoom
level. A default that sets a display field, or any `number_format` default,
fixes that type's axis labels to the format, as a format chosen in the column
style editor does.

## Setting defaults before restoring

Call these methods before `load()` and `restore()`. `restore()` drops values
equal to the defaults in force at that moment, so a config restored first loses
any value equal to the plugin's own default, and a default set afterwards then
replaces it.

Saved configs leave out values equal to the defaults. Restoring one in an
application without the same defaults renders the plugins' own defaults instead.

A default for a key whose plugin default comes from the column's data, such as a
gradient's maximum, replaces that computed value with the fixed one.

## Errors

A call throws when its arguments are malformed: `defaults` is not an object or
`null`, `plugin` names no registered plugin, `type` is not a column type, or a
`date_format` mixes `dateStyle`/`timeStyle` with per-part fields. A value that a
particular plugin cannot use, such as an `Enum` value outside its choices or a
number outside its range, is logged as an error naming the plugin, column and
key, and that plugin keeps its own default.
