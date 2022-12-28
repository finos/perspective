Demo of [Perspective](https://github.com/finos/perspective), using US COVID data from
[https://covidtracking.com](https://covidtracking.com/).

The `Group By` column is a good example of using Perspective's ExprTK column language
to clean/reformat a column. The raw "date" column, as imported from
[https://covidtracking.com](https://covidtracking.com/), use the date format `YYYYMMDD`.
Using this expression, we can parse this format into a well-typed `date()` column, then
bucket this by week to get a sensible graph:

```
// Parsed \"date\" bucket by week
var year := integer(floor(\"date\" / 10000));
var month := integer(floor(\"date\" / 100)) - year * 100;
var day := integer(\"date\" % 100);
bucket(date(year, month, day), 'W')
```
