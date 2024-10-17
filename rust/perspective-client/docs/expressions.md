Perspective supports _expression columns_, which are virtual columns calculated
as part of the [`crate::View`], optionally using values from its underlying
[`crate::Table`]'s columns. Such expression columns are defined in Perspective's
expression language, an extended version of
[ExprTK](https://github.com/ArashPartow/exprtk), which is itself quite similar
(in design and features) to expressions in Excel.

## UI

Expression columns can be created in `<perspective-viewer>` by clicking the "New
Column" button at the bottom of the column list, or via the API by adding the
expression to the `expressions` config key when calling `viewer.restore()`.

By default, such expression columns are not "used", and will appear above the
`Table`'s other deselected columns in the column list, with an additional set of
buttons for:

-   _Editing_ the column's expression. Doing so will update the definitions of
    _all_ usage of the expression column.
-   _Deleting_ the column. Clicking `Reset` (or calling the `reset()` method)
    will not delete expressions unless the `Shift` key is held (or `true`
    parameter supplied, respectively). This button only appears if the
    expression column i unused.

To use the column, just drag/select the column as you would a normal column,
e.g. as a "Filter", "Group By", etc. Expression columns will recalculate
whenever their dependent columns update.

## Perspective Extensions to ExprTK

ExprTK has its own
[excellent documentation](http://www.partow.net/programming/exprtk/) which
covers the core langauge in depth, which is an excellent place to start in
learning the basics. In addition to these features, Perspective adds a few of
its own custom extensions and syntax.

#### Static Typing

In addition to `float` values which ExprTK supports natively, Perspective's
expression language also supports Perspective's other types `date`, `datetime`,
`integer`, `boolean`; as well as rudimentary type-checking, which will report an
<span>error</span> when the values/columns supplied as arguments cannot be
resolved to the expected type, e.g. `length(x)` expects an argument `x` of type
`string` and is not a valid expression for an `x` of another type. Perspective
supplies a set of _cast_ functions for converting between types where possible
e.g. `string(x)` to cast a variable `x` to a `string`.

#### Expression Column Name

Expressions can be _named_ by providing a comment as the first line of the
expression. This name will be used in the `<perspective-viewer>` UI when
referring to the column, but will also be used in the API when specifying e.g.
`group_by` or `sort` fields. When creating a new column via
`<oerspective-viewer>`'s expression editor, new columns will get a default name
(which you may delete or change):

```html
// New Column 1
```

Without such a comment, an expression will show up in the `<perspective-viewer>`
API and UI as itself (clipped to a reasonable length for the latter).

#### Referencing [`crate::Table`] Columns

Columns from the [`crate::Table`] can be referenced in an expression with
_double quotes_.

```text
// Expected Sales ("Sales" * 10) + "Profit"
```

#### String Literals

In contrast to standard ExprTK, string literals are declared with _single
quotes_:

```text
// Profitable
if ("Profit" > 0) {
  'Stonks'
} else {
  'Not Stonks'
}
```

#### Extended Library

Perspective adds many of its own functions in addition to `ExprTK`'s standard
ones, including common functions for `datetime` and `string` types such as
`substring()`, `bucket()`, `day_of_week()`, etc. A full list of available
functions is available in the
[Expression Columns API](../obj/perspective-viewer-exprtk).

## Examples

#### Casting

Just `2`, as an `integer` (numeric literals currently default to `float` unless
cast).

```text
integer(2)
```

#### Variables

```text
// My Column Name
var incrementedBy200 := "Sales" + 200;
var half := incrementedBy200 / 2;
half
```

```text
// Complex Expression
var upperCustomer := upper("Customer Name");
var separator := concat(upperCustomer, ' | ');
var profitRatio := floor(percent_of("Profit", "Sales")); // Remove trailing decimal.
var combined := concat(separator, string(profitRatio));
var percentDisplay := concat(combined, '%');
percentDisplay
```

#### Conditionals

```text
// Conditional
var priceAdjustmentDate := date(2016, 6, 18);
var finalPrice := "Sales" - "Discount";
var additionalModifier := 0;

if("Order Date" > priceAdjustmentDate) {
  finalPrice -= 5;
  additionalModifier -= 2;
}
else
  finalPrice += 5;

finalPrice + additionalModifier
```
