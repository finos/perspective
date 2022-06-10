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
of the expression will be used as the value. This is called a "return value."

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

Write an existing column's name in double quotes.

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

### Text Values (Strings)

A string is represented with single quotes `var keyphrase := 'Hello World'`.

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

### Strings (Text)

* `substring('string', start_idx, length)` - Perspective uses this function
  instead of ExprTK's substring syntax. Get a portion of `string` starting at
  the position `start_idx` (where 0 is the first character) and continuing for
  `length` characters (including the starting character). The original string is
  unchanged. Ex: `substring('strawberry', 4, 2) // 'wb'`
* `concat('string1', 'string2')` - Concatenate two string into one.
* `upper('string')` - Make a string all-uppercase.
* `lower('string')` - Make a string all-lowercase.
* `match('string', 'pattern')` - It returns `true` if `pattern` is found within `string`, and `false` otherwise.
* `replace('string', 'pattern', 'replacer')` - Replace the first occurrence of
  `pattern` in `string` with `replacer`.
* `replace_all('string', 'pattern', 'replacer')` - Replace all occurrences of
  `pattern` in `string` with `replacer`.
<!-- TODO: Could not make this work. -->
<!-- * `match_all('string', 'pattern')` -->
<!-- TODO: Could not make this work. -->
<!-- * `indexof('string', 'pattern', output_vector)` -->
<!-- TODO: Could not make this work. -->
<!-- * `search('string', 'pattern')` -->

### Numbers

* General Math: `min, max, avg, sum, abs, ceil, floor, round, round, exp, log,
  log10, log1p, log2, logn, pow, root, sqrt`
* Trigonometry: `sin, cos, tan, acos, asin, atan, atan2, cosh, cot, csc, sec,
  sinh, tanh, deg2rad, rad2deg, deg2grad, grad2deg`
* `iclamp(min, value, max)` - If `value` is between `min` and `max`, then the
  function produces the number to which `value` is closest, using `min` if the
  distance is equal. If `value` is not in range, then `value` is used as-is.
* `inrange(min, value, max)` - Produces `true` or `false` depending on whether
  `value` is between `min` and `max` (inclusive).
* `percent_of(value, total)` - Produce the ratio between the value and total.
* `random()` - Produce a random number between 0.00 and 1.00.
* `frac(x)` - Fractional portion (after the decimal) of `x`

### Time

* `date(year, month, day)` - Generate a date.
* `datetime(timestamp)` - Generate a datetime, where `timestamp` is [Unix
  time](https://en.wikipedia.org/wiki/Unix_time) in milliseconds.
* `today()` - Present date.
* `now()` - Present datetime.
* `hour_of_day(x)` - Return a datetime's hour of the day as a string.
* `day_of_week(x)` - Return a datetime's day of week as a string.
* `month_of_year(x)`- Return a datetime's month of the year as a string.

### Type Conversions

* `integer(x)` - Convert `x` to an integer number.
* `float(x)` - Convert `x` to a decimal number.
* `boolean(x)` - Convert `x` to true/false.
* `string(x)` - Convert `x` to text.

### Misc

* `is_null(x)` - Is `true` if `x` has no value.
* `is_not_null(x)` - Is `true` if `x` has a value.
* `order("input column", 'value', ...)` - Generates a sort order for a string
  column based on the input order of the parameters, such as: `order("State",
  'Texas', 'New York')`. This would produce the following output:

  | State       | My Column    |
  | ----------- | ------------ |
  | Texas       | 0.00         |
  | New York    | 1.00         |
  | Connecticut | 2.00         |
  | Maine       | 2.00         |
  | Oregon      | 2.00         |

<!-- TODO: Could not make this work. -->
<!-- * `not(x)` -->

### Bucket

`bucket(x, y)` - Bucket value `x` by `y`, where `y` is dependent on `x`'s value
type.

#### Bucketing by Number

`bucket("Sales", 100)` - Produces number bucketed by increments of 100 (always
rounded down).

<div>
<perspective-viewer
  columns='["Sales", "My Column Name"]'
  expressions='["// My Column Name\n\nbucket(\"Sales\", 100)"]'
></perspective-viewer>
</div>

#### Bucketing by Date

`bucket("Order Date", 'D')` - Produces date from datetime.
`bucket("Order Date", 'W')` - Produces date from the first day of that week.
`bucket("Order Date", 'M')` - Produces date from the first day of that month.
`bucket("Order Date", 'Y')` - Produces date from the first day of that year.

## Conditional Structures

Acting based on conditions is similar to most programming languages.

### `if-then-else` Block

An `if` block will be executed if the condition in parentheses is true. Commands
within the block must be indented. If there is more than one command in the
block, they must be wrapped in curly braces `{}`. An optional `else` block may
be used as a catch-all when the `if` condition is not met.

```html
// My Column Name

var priceAdjustmentDate := date(2016, 6, 18);
var finalPrice := "Sales" - "Discount";
var additionalModifier := 0;

if("Order Date" > priceAdjustmentDate) {
  finalPrice -= 5;
  additionalModifier -= 2;
}
else
  finalPrice += 5;

finalPrice + additionalModifier;
```

<div>
<perspective-viewer
  columns='["Sales", "Discount", "Order Date", "My Column Name"]'
  expressions='["// My Column Name\n\nvar priceAdjustmentDate := date(2016, 6, 18);\nvar finalPrice := \"Sales\" - \"Discount\";\nvar additionalModifier := 0;\n\nif(\"Order Date\" > priceAdjustmentDate) {\n  finalPrice -= 5;\n  additionalModifier -= 2;\n}\nelse\n  finalPrice += 5;\n\nfinalPrice + additionalModifier;"]'
></perspective-viewer>
</div>

### Conditional Return Value

One of the commands in a conditional block may be a return value.

```html
// My Column Name

var priceAdjustmentDate := date(2016, 6, 18);
var initialPrice := "Sales" - "Discount";

if("Order Date" > priceAdjustmentDate)
  initialPrice - 10; // This value will be returned.
else
  initialPrice + 5; // A different return value.
```

<div>
<perspective-viewer
  columns='["Sales", "Discount", "Order Date", "My Column Name"]'
  expressions='["// My Column Name\n\nvar priceAdjustmentDate := date(2016, 6, 18);\nvar initialPrice := \"Sales\" - \"Discount\";\n\nif(\"Order Date\" > priceAdjustmentDate)\n  initialPrice - 10; // This value will be returned.\nelse\n  initialPrice + 5; // A different return value."]'
></perspective-viewer>
</div>

### Ternary Operators

This can be used to create a value based on a condition. It may be used anywhere
a value is expected, such as a variable assignment or a return value.

The format is `CONDITION ? VALUE_WHEN_TRUE : VALUE_WHEN_FALSE;`.

```html
// My Column Name

var priceAdjustmentDate := date(2016, 6, 18);
var initialPrice := "Sales" - "Discount";

"Order Date" > priceAdjustmentDate ? initialPrice - 5 : initialPrice + 5;
```

<div>
<perspective-viewer
  columns='["Sales", "Discount", "Order Date", "My Column Name"]'
  expressions='["// My Column Name\n\nvar priceAdjustmentDate := date(2016, 6, 18);\nvar initialPrice := \"Sales\" - \"Discount\";\n\n\"Order Date\" > priceAdjustmentDate ? initialPrice - 5 : initialPrice + 5;"]'
></perspective-viewer>
</div>

### `switch case` Block

Run different commands based on any number of exclusive conditions. The optional
`default` condition is taken when no other conditions are met.

```html
// My Column Name

var priceAdjustmentDate := date(2015, 10, 11);
var price := "Sales" - "Discount";

switch {
  case "Order Date" > priceAdjustmentDate:
    price -= 5;
  case "Order Date" < priceAdjustmentDate:
    price += 5;
  default:
    price := max(price - 100, 0); // Special discount on day of adjustment.
}

price;
```

<div>
<perspective-viewer
  columns='["Sales", "Discount", "Order Date", "My Column Name"]'
  expressions='["// My Column Name\n\nvar priceAdjustmentDate := date(2015, 10, 11);\nvar price := \"Sales\" - \"Discount\";\n\nswitch {\n  case \"Order Date\" > priceAdjustmentDate:\n    price -= 5;\n  case \"Order Date\" < priceAdjustmentDate:\n    price += 5;\n  default:\n    price := max(price - 100, 0); // Special discount on day of adjustment.\n}\n\nprice;"]'
></perspective-viewer>
</div>

## Loops

Repeat the same actions for aggregate effect.

### `for` Loop

The basic form of this loop is such:

```html
for (var x := 0; x < NUMBER_OF_REPETITIONS; x += 1) {
  // COMMANDS
}
```

#### `for` Example

```html
// My Column Name

var count := 0;
for (var x := 0; x < 5; x += 1) {
  count += 1;
}

count;
```

<div>
<perspective-viewer
  columns='["Sales", "Discount", "Order Date", "My Column Name"]'
  expressions='["// My Column Name\n\nvar count := 0;\nfor (var x := 0; x < 5; x += 1) {\n  count += 1;\n}\n\ncount;"]'
></perspective-viewer>
</div>

<!-- TODO: Could not make this work. -->
<!-- ### `while` Loop -->

<!-- TODO: Could not make this work. -->
<!-- ### `repeat until` Loop -->

<!-- TODO: Could not make this work. -->
<!-- ### `break` -->

<!-- TODO: Could not make this work. -->
<!-- ### `continue` -->

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
