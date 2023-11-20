---
id: expressions
title: Expression Columns
---

<style>{"#new_column_highlight perspective-viewer {--column-add--border:2px solid red}"}</style>

Perspective supports _expression columns_, which are virtual columns calculated
as part of the `View`, optionally using values from its underlying `Table`'s
columns. Such expression columns are defined in Perspective's expression
language, an extended version of
[ExprTK](https://github.com/ArashPartow/exprtk), which is itself quite similar
(in design and features) to expressions in Excel.

## UI

Expression columns can be created in `<perspective-viewer>` by clicking the "New
Column" button at the bottom of the column list (in <span
style={{color:"red"}}>red</span> below), or via the API by adding the expression
to the `expressions` config key when calling `restore()`.

<div id="new_column_highlight">
<perspective-viewer></perspective-viewer>
</div>
<br/>

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
e.g. as a "Filter", "Group By", etc. Expression columns cannot be edited or
updated (as they exist on the `View()` and are generated from the `Table()`'s
_real_ columns). However, they will automatically update whenever their
dependent columns update.

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
`group_by` or `order_by` fields. When creating a new column via
`<oerspective-viewer>`'s expression editor, new columns will get a default name
(which you may delete or change):

```html
// New Column 1
```

Without such a comment, an expression will show up in the `<perspective-viewer>`
API and UI as itself (clipped to a reasonable length for the latter).

#### Referencing `Table()` Columns

Columns from the `Table()` can be referenced in an expression with _double
quotes_.

```
// Expected Sales
("Sales" * 10) + "Profit"
```

<div>
<perspective-viewer
  columns='["Sales", "Profit", "Expected Sales"]'
  expressions='{"Expected Sales": "(\"Sales\" * 10) + \"Profit\""}'
></perspective-viewer>
</div>

#### String Literals

In contrast to standard ExprTK, string literals are declared with _single
quotes_:

```
// Profitable
if ("Profit" > 0) {
  'Stonks'
} else {
  'Not Stonks'
}
```

<div>
<perspective-viewer
  columns='["Profit","Profitable"]'
  expressions='{"Profitable": "if (\"Profit\" > 0) { &apos;Stonks&apos; } else { &apos;Not Stonks&apos; }"}'
></perspective-viewer>
</div>

#### Extended Library

Perspective adds many of its own functions in addition to `ExprTK`'s standard
ones, including common functions for `datetime` and `string` types such as
`substring()`, `bucket()`, `day_of_week()`, etc. A full list of available
functions is available in the
[Expression Columns API](obj/perspective-viewer-exprtk).

## Examples

#### Casting

Just `2`, as an `integer` (numeric literals currently default to `float` unless
cast).

```
integer(2)
```

<div>
<perspective-viewer
  columns='["integer(2)"]'
  expressions='["integer(2)"]'
></perspective-viewer>
</div>
<br/>

#### Variables

```
// My Column Name
var incrementedBy200 := "Sales" + 200;
var half := incrementedBy200 / 2;
half
```

<div>
<perspective-viewer
  columns='["Sales", "My Column Name"]'
  expressions='{"My Column Name": "var incrementedBy200 := \"Sales\" + 200;\nvar half := incrementedBy200 / 2;\nhalf"}'
></perspective-viewer>
</div>
<br/>

```
// Complex Expression
var upperCustomer := upper("Customer Name");
var separator := concat(upperCustomer, ' | ');
var profitRatio := floor(percent_of("Profit", "Sales")); // Remove trailing decimal.
var combined := concat(separator, string(profitRatio));
var percentDisplay := concat(combined, '%');
percentDisplay
```

<div>
<perspective-viewer
  columns='["Complex Expression", "Customer Name", "Sales", "Profit"]'
  expressions='{"Complex Expression": "var upperCustomer := upper(\"Customer Name\");\nvar separator := concat(upperCustomer, &apos; | &apos;);\nvar profitRatio := floor(percent_of(\"Profit\", \"Sales\")); // Remove trailing decimal.\nvar combined := concat(separator, string(profitRatio));\nvar percentDisplay := concat(combined, &apos;%&apos;);\npercentDisplay"}'
></perspective-viewer>
</div>
<br/>

#### Conditionals

```
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

<div>
<perspective-viewer
  columns='["Conditional"]'
  expressions='{"Conditional": "var priceAdjustmentDate := date(2016, 6, 18);\nvar finalPrice := \"Sales\" - \"Discount\";\nvar additionalModifier := 0;\n\nif(\"Order Date\" > priceAdjustmentDate) {\n  finalPrice -= 5;\n  additionalModifier -= 2;\n}\nelse\n  finalPrice += 5;\n\nfinalPrice + additionalModifier"}'
></perspective-viewer>
</div>
