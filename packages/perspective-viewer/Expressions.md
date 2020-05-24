## Perspective Expression Syntax

This README outlines the capabilities and syntax of Perspective's expression
engine. To create a new computed expression column, use the `Add Column` button
in the bottom left corner of the UI.

### Column Names

All column names must be wrapped with _double quotes_ or _single quotes_.
Columns can also be dragged into the expression input area using the UI.

### Operators

There are five mathematical operators:

- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `%` Percent A of B

Expressions using these should have a column name or an expression
wrapped in parentheses on either side.

### Functions

Perspective offers a variety of computation functions for different uses:

#### Math

- `sqrt` Square root
- `pow2` Power of 2
- `abs` Absolute value
- `invert` 1/x
- `bin10` Bucket column by 10
- `bin100` Bucket by 100
- `bin1000` Bucket by 1000
- `bin10th` Bucket by 0.1
- `bin100th` Bucket by 0.01
- `bin1000th` Bucket by 0.001

#### String

- `length` Length of string
- `uppercase` Uppercase string
- `lowercase` Lowercase string
- `concat_comma` Join two strings with comma
- `concat_space` Join two strings with space

#### Datetime/Date

- `hour_of_day` Hour of day (as integer)
- `day_of_week` Day of week (as string)
- `month_of_year` Month of year (as string)
- `second_bucket` Bucket by seconds
- `minute_bucket` Bucket by minute
- `hour_bucket` Bucket by hour
- `day_bucket` Bucket by day
- `week_bucket` Bucket by week
- `month_bucket` Bucket by month
- `year_bucket` Bucket by year

To use a function, simply write the function name followed by parentheses and
a column name:

`sqrt("Sales")`

Functions can have expressions inside them, but each expression __MUST__ be
wrapped in its own set of parentheses:

`invert((pow2((abs("Sales)))))`

Functions can be combined with operators, and vice versa:

`(abs("Sales")) * (pow2("Profit"))`

### Custom Column Names

Use `AS` to give your computed expression columns a custom name:

`"Sales" * "Profit" as "New Column"`

### Error Handling

The UI will validate your expression as you type, and provide error messages
when the expression is malformed or otherwise invalid.

After the expression has been validated, its inputs will be type checked
to make sure that all input column types are valid for the expression.

If any types are invalid, the error message will display the column name and
expected input types.