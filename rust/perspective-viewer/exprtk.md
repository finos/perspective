---
id: perspective-viewer-exprtk
title: ExprTK Function Reference
---

## ExprTK Function Reference

### abs

Absolute value of x

```
abs(${1:x})
```

### avg

Average of all inputs

```
avg(${1:x})
```

### bucket

Bucket x by y

```
bucket(${1:x}, ${2:y})
```

### ceil

Smallest integer >= x

```
ceil(${1:x})
```

### exp

Natural exponent of x (e ^ x)

```
exp(${1:x})
```

### floor

Largest integer <= x

```
floor(${1:x})
```

### frac

Fractional portion (after the decimal) of x

```
frac(${1:x})
```

### iclamp

Inverse clamp x within a range

```
iclamp(${1:x})
```

### inrange

Returns whether x is within a range

```
inrange(${1:x})
```

### log

Natural log of x

```
log(${1:x})
```

### log10

Base 10 log of x

```
log10(${1:x})
```

### log1p

Natural log of 1 + x where x is very small

```
log1p(${1:x})
```

### log2

Base 2 log of x

```
log2(${1:x})
```

### logn

Base N log of x where N >= 0

```
logn(${1:x}, ${2:N})
```

### max

Maximum value of all inputs

```
max(${1:x})
```

### min

Minimum value of all inputs

```
min(${1:x})
```

### mul

Product of all inputs

```
mul(${1:x})
```

### percent_of

Percent y of x

```
percent_of(${1:x})
```

### pow

x to the power of y

```
pow(${1:x}, ${2:y})
```

### root

N-th root of x where N >= 0

```
root(${1:x}, ${2:N})
```

### round

Round x to the nearest integer

```
round(${1:x})
```

### sgn

Sign of x: -1, 1, or 0

```
sgn(${1:x})
```

### sqrt

Square root of x

```
sqrt(${1:x})
```

### sum

Sum of all inputs

```
sum(${1:x})
```

### trunc

Integer portion of x

```
trunc(${1:x})
```

### acos

Arc cosine of x in radians

```
acos(${1:x})
```

### acosh

Inverse hyperbolic cosine of x in radians

```
acosh(${1:x})
```

### asin

Arc sine of x in radians

```
asin(${1:x})
```

### asinh

Inverse hyperbolic sine of x in radians

```
asinh(${1:x})
```

### atan

Arc tangent of x in radians

```
atan(${1:x})
```

### atanh

Inverse hyperbolic tangent of x in radians

```
atanh(${1:x})
```

### cos

Cosine of x

```
cos(${1:x})
```

### cosh

Hyperbolic cosine of x

```
cosh(${1:x})
```

### cot

Cotangent of x

```
cot(${1:x})
```

### sin

Sine of x

```
sin(${1:x})
```

### sinc

Sine cardinal of x

```
sinc(${1:x})
```

### sinh

Hyperbolic sine of x

```
sinh(${1:x})
```

### tan

Tangent of x

```
tan(${1:x})
```

### tanh

Hyperbolic tangent of x

```
tanh(${1:x})
```

### deg2rad

Convert x from degrees to radians

```
deg2rad(${1:x})
```

### deg2grad

Convert x from degrees to gradians

```
deg2grad(${1:x})
```

### rad2deg

Convert x from radians to degrees

```
rad2deg(${1:x})
```

### grad2deg

Convert x from gradians to degrees

```
grad2deg(${1:x})
```

### concat

Concatenate string columns and string literals, such as:
concat("State".to_owned(), ', ', "City")

```
concat(${1:x}, ${2:y})
```

### order

Generates a sort order for a string column based on the input order of the parameters, such as:
order("State".to_owned(), 'Texas', 'New York')

```
order(${1:input column}, ${2:value}, ...)
```

### upper

Uppercase of x

```
upper(${1:x})
```

### lower

Lowercase of x

```
lower(${1:x})
```

### hour_of_day

Return a datetime's hour of the day as a string

```
hour_of_day(${1:x})
```

### month_of_year

Return a datetime's month of the year as a string

```
month_of_year(${1:x})
```

### day_of_week

Return a datetime's day of week as a string

```
day_of_week(${1:x})
```

### now

The current datetime in local time

```
now()
```

### today

The current date in local time

```
today()
```

### is_null

Whether x is a null value

```
is_null(${1:x})
```

### is_not_null

Whether x is not a null value

```
is_not_null(${1:x})
```

### not

not x

```
not(${1:x})
```

### true

Boolean value true

```
true
```

### false

Boolean value false

```
false
```

### string

Converts the given argument to a string

```
string(${1:x})
```

### integer

Converts the given argument to a 32-bit integer. If the result over/under-flows, null is returned

```
integer(${1:x})
```

### float

Converts the argument to a float

```
float(${1:x})
```

### date

Given a year, month (1-12) and day, create a new date

```
date(${1:year}, ${1:month}, ${1:day})
```

### datetime

Given a POSIX timestamp of milliseconds since epoch, create a new datetime

```
datetime(${1:timestamp})
```

### boolean

Converts the given argument to a boolean

```
boolean(${1:x})
```

### random

Returns a random float between 0 and 1, inclusive.

```
random()
```

### match

Returns True if any part of string matches pattern, and False otherwise.

```
match(${1:string}, ${2:pattern})
```

### match_all

Returns True if the whole string matches pattern, and False otherwise.

```
match_all(${1:string}, ${2:pattern})
```

### search

Returns the substring that matches the first capturing group in pattern, or null if there are no capturing groups in the pattern or if there are no matches.

```
search(${1:string}, ${2:pattern})
```

### indexof

Writes into index 0 and 1 of output_vector the start and end indices of the substring that matches the first capturing group in pattern.

Returns true if there is a match and output was written, or false if there are no capturing groups in the pattern, if there are no matches, or if the indices are invalid.

```
indexof(${1:string}, ${2:pattern}, ${3:output_vector})
```

### substring

Returns a substring of string from start_idx with the given length. If length is not passed in, returns substring from start_idx to the end of the string. Returns null if the string or any indices are invalid.

```
substring(${1:string}, ${2:start_idx}, ${3:length})
```

### replace

Replaces the first match of pattern in string with replacer, or return the original string if no replaces were made.

```
replace(${1:string}, ${2:pattern}, ${3:replacer})
```

### replace_all

Replaces all non-overlapping matches of pattern in string with replacer, or return the original string if no replaces were made.

```
replace(${1:string}, ${2:pattern}, ${3:replacer})
```

