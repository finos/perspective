---
id: expressions
title: Column Expressions
---

<script src="../../../../js/index.js"></script>
<link rel="stylesheet" href="../../../../css/concepts/index.css">

Add new columns to an existing data view by using expressions based on (but not
identical to) ExprTK ([source code](https://github.com/ArashPartow/exprtk),
[homepage](http://www.partow.net/programming/exprtk/)). This can be considered
similar to formulas in Excel, utilizing existing column values or arbitrary
scalar values defined within the expression, as well as conditional and
functional statements.

## Basics

### Creating a Custom Column

Open a data view's side panel and press the "New Column" button, which will open
the expression editor.

<img src="/img/expressions/new-column.png" alt="" />

### Naming a Custom Column

A comment on the first line of an expression will be used as its name.

```html
// My Column Name
```

### Editing or Deleting a Custom Column

Once a Custom Column is added, the expression editor can be opened by pressing
the hamburger button beside the column name. The column may be deleted by
pressing the X button, but to do so, it must first be removed from the data view
by unchecking the box beside it.

<img src="/img/expressions/edit-delete-column.png" alt="" />

### Giving a Custom Column a Value

Column Expressions use an "implicit return," in this case meaning the last line
of the expression will be used as the value.

```html
// My Column Name

2 // Every cell in this column will be `2.00`.
```

Below you will see our first interactive example.

<div>
<perspective-viewer
  columns='["Sales", "Profit", "My Column Name"]'
  expressions='["// My Column Name\n\n2 // Every cell in this column will be `2.00`."]'
></perspective-viewer>
</div>

## Working with Data

### Access an Existing Column's Value

Write an existing column's name in quotes.

```html
// My Column Name

"Sales" // Every cell in this column will be identical to "Sales".
```

<div>
<perspective-viewer
  columns='["Sales", "Profit", "My Column Name"]'
  expressions='["// My Column Name\n\n\"Sales\" // Every cell in this column will be identical to \"Sales\"."]'
></perspective-viewer>
</div>

### Variables

While operations may be made directly against a column value (e.g. `"Sales" +
200`), multiple operations are better organized into variables. Variable
declarations must end with a semicolon `;`.

```html
// My Column Name

var incrementedBy200 := "Sales" + 200;
var half := incrementedBy200 / 2;

half // This returns the value of `half`.
```

<div>
<perspective-viewer
  columns='["Sales", "Profit", "My Column Name"]'
  expressions='["// My Column Name\n\nvar incrementedBy200 := \"Sales\" + 200;\nvar half := incrementedBy200 / 2;\n\nhalf // This returns the value of `half`."]'
></perspective-viewer>
</div>

## Functions

ExprTK and Perspective provide many functions for data manipulation.

> **NOTE**
>
> For as full list of capabilities *with autocomplete*, press `Ctrl+Space` in
> the expression editor.

### Functions Example

Edit the Custom Column and paste the below Column Expression into the editor.

```html
// My Column Name

var upperCustomer := upper("Customer Name");
var separator := concat(upperCustomer, ' | ');
var profitRatio := floor(percent_of("Profit", "Sales")); // Remove trailing decimal.
var combined := concat(separator, string(profitRatio));
var percentDisplay := concat(combined, '%');

percentDisplay
```

<div>
<perspective-viewer
  columns='["Customer Name", "Sales", "Profit", "My Column Name"]'
  expressions='["// My Column Name\n\n0 // REPLACE ALL AND SAVE"]'
></perspective-viewer>
</div>

### Strings (text)

* `substring('string', start_idx, length)` - Perspective uses this function
  instead of ExprTK's substring syntax. Get a portion of `string` starting at
  the position `start_idx` (where 0 is the first character) and continuing for
  `length` characters (including the starting character). The original string is
  unchanged. Ex: `substring('strawberry', 4, 2) // 'wb'`
* `concat('string1', 'string2')` - Concatenate two string into one.
* `upper('string')` - Make a string all-uppercase.
* `lower('string')` - Make a string all-lowercase.
* `match('string', 'pattern')`
* `match_all('string', 'pattern')`
* `replace('string', 'pattern', 'replacer')` - Replace the first occurrence of
  `pattern` in `string` with `replacer`.
* `replace_all('string', 'pattern', 'replacer')` - Replace all occurrences of
  `pattern` in `string` with `replacer`.
* `indexof('string', 'pattern', output_vector)`
* `search('string', 'pattern')`

### Numbers

* General Math: `min, max, avg, sum, abs, ceil, floor, round, round, exp, log,
  log10, log1p, log2, logn, pow, root, sqrt, iclamp, inrange`
* Trigonometry: `sin, cos, tan, acos, asin, atan, atan2, cosh, cot, csc, sec,
  sinh, tanh, deg2rad, rad2deg, deg2grad, grad2deg`
* `percent_of(value, total)` - Produce the ratio between the value and total.
* `random()` - Produce a random number between 0.00 and 1.00.

### Time

* `date(year, month, day)` - Generate a date.
* `datetime(timestamp)` - Generate a datetime, where `timestamp` is [Unix
  time](https://en.wikipedia.org/wiki/Unix_time) in milliseconds.
* `today()` - Present date.
* `now()` - Present datetime.
* `hour_of_day(x)`
* `day_of_week(x)`
* `month_of_year(x)`

### Type Conversions

* `integer(x)` - Convert `x` to an integer number.
* `float(x)` - Convert `x` to a decimal number.
* `boolean(x)` - Convert `x` to true/false.
* `string(x)` - Convert `x` to text.

### Misc

* `is_null(x)` - Is `true` if `x` has no value.
* `is_not_null(x)` - Is `true` if `x` has a value.
* `bucket(x, y)`
* `not(x)`
* `order("input column", value, ...)`
* `frac(x)`

## Conditional Structures

Making operations based on conditions is similar to most programming languages.

### Conditional Example

### `if-then-else` Block

### Ternary Operators

### `switch case` Block

### Conditional Return Value



## Loops

### Loops Example

### `for` Loop

### `while` Loop

### `repeat until` Loop

### `break`

### `continue`

This keyword will skip the current iteration of the loop.

## Advanced Example

This **[Mandelbrot
demo](https://bl.ocks.org/texodus/5485f6b630b08d38218822e507f09f21)** calculates
the popular fractal in a Column Expression and displays it with a heatmap. Edit
the `color` column to view and manipulate the expression, whose contents are
below:

```html
// color
var c := float("iterations");
var x := floor("index" / "height");
var y := "index" % "height";

var cx := "xmin" + (("xmax" - "xmin") * x) / ("width" - 1);
var cy := "ymin" + (("ymax" - "ymin") * y) / ("height" - 1);

var vx := 0;
var vy := 0;
var vxx := 0;
var vyy := 0;
var vxy := 0;

for (var ii := 0; ii < float("iterations"); ii += 1) {
    if (vxx + vyy <= float(4)) {
        vxy := vx * vy;
        vxx := vx * vx;
        vyy := vy * vy;
        vx := vxx - vyy + cx;
        vy := vxy + vxy + cy;
        c -= 1;
    }
};

c
```
