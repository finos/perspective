---
title: NYC Citibike Analytics in Real-Time, Part 1
author: Andrew Stein
authorURL: http://github.com/texodus
authorImageURL: https://avatars3.githubusercontent.com/u/60666?s=400&v=4
---

There are many well-known perks to living in New York City - the world class
restaurants, museums, two mediocre NFL teams (taken together, that's one pretty
good NFL team!).  Seldom mentioned, though, is the city's world-class Open Data!

In this post, we'll be taking advantage of NYC's abundance of Open Data and 
the Perspective library to build some real-time analytics visualizations that 
seek to answer one burning question: Where are all of New York's
[Citibikes](https://www.citibikenyc.com/)?

<!--truncate-->

<script src="../../../../js/nyc-citibike-analysis/index.js"></script>
<link rel="stylesheet" href="../../../../css/nyc-citibike-analysis/index.css">

Here's what we'll be building, a real-time map of NYC Citibike stations colored
by the number of bikes availble at each.  There is no server involved, all data
subscriptions, analytics logics, and visualization is done entirely in your 
browser with Perspective.  This examples is live - go ahead and 
try it out!

<br/>
<div id="grid">
<perspective-viewer row-pivots='["name"]' columns='["num_bikes_available"]' sort='[["num_bikes_available","desc"]]'>
</perspective-viewer>
<perspective-viewer view='xy_scatter' row-pivots='["name"]' columns='["lon","lat","num_bikes_available"]' sort='[["num_bikes_available","asc"]]'>
</perspective-viewer>
</div>

## Setup

We're going to need a few libraries, which perspective-heads will no doubt 
already be quite familiar with (Yes, perspective-heads is a real term that real
people other than me use):

```html
<script src="https://unpkg.com/@jpmorganchase/perspective/build/perspective.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer/build/perspective.view.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-hypergrid/build/hypergrid.plugin.js"></script>
<script src="https://unpkg.com/@jpmorganchase/perspective-viewer-highcharts/build/highcharts.plugin.js"></script>
```

You're also going to need a relatively up-to-date browser, as this example makes use
of several [ES2017 features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/New_in_JavaScript/ECMAScript_Next_support_in_Mozilla)
like `async`/`await`.

## Getting the data

The [NYC Citibike program](https://www.citibikenyc.com/) gratiously provides
access to their [real-time station data](https://www.citibikenyc.com/system-data)
via a pretty stand REST/JSON API, and they've even done us the favor of properly
configuring [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)!
This means we should have no problem fetching and reading this data directly in
a Web Browser, no server required!  From skimming the
[General Bikeshare Feed Specification](https://github.com/NABSA/gbfs/blob/master/gbfs.md), 
it looks like the feeds we're interested in are:

* [station_information.json](https://gbfs.citibikenyc.com/gbfs/en/station_information.json) Mostly static list of all stations, their capacities and locations. Required of systems utilizing docks.

* [station_status.json](https://gbfs.citibikenyc.com/gbfs/en/station_status.json) Number of available bikes and docks at each station and station availability. Required of systems utilizing docks.

First thing we're going to want is some rote-standard code to fetch these feeds
via [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).
As we're going to be making lots of Asynchronous calls in this study, it will be convenient
to write a quick wrapper function `get()` which wraps up the common boilerplate
for `XMLHttpRequest` in a `Promise`;  this will allow us to later call `get()`
with simpler `async`/`await` semantics, even in deeply nested asynchronous code,
greatly simplifying ... well everything, really.  This will also compose nicely
with our `perspective` API calls we'll be making, as they also exclusively
return `Promise`s.

```javascript
function get(url) {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "json";
        xhr.onload = () => resolve(xhr.response);
        xhr.send(null);
    });
}
```

Of course, we'd like a function for getting <i>feeds</i> specifically, which
share some common strucutre we can encapsulate in a function, so let's go ahead and make
a specialized function `get_feed()` just for this purpose.  It will need to take
a `feedname` to parameterize the URL, and a `callback` parameter for when we intend
to have the feed <i>polled</i>;  when this parameter is present, we will
continuously `get()` the feed at some interval and invoke `callback` with the
results, rather than `return` them.

From the specification, we know that the data we're interested in is in the 
`stations` field of the object in the `data` field.  We're also conveniently
provided a TTL value at the top level of each object, which we can use to
calculate a poll frequency for the feed, as we'll want to update it as often 
as it is available.

```javascript
async function get_feed(feedname, callback) {
    const url = `https://gbfs.citibikenyc.com/gbfs/en/${feedname}.json`;
    const {data: {stations}, ttl} = await get(url);
    if (typeof callback === "function") {
        callback(stations);
        setTimeout(() => get_feed(feedname, callback), ttl * 1000);
    } else {
        return stations;
    }
}
```

## Inferring a feed's <i>schema</i>

From looking at the schemas for these feeds, it looks like we're going to want 
to join these two feeds on `station_id`, which means we're going to need to
give Perspective a <i>schema</i> so it knows what column data to expect, as each
row update will only have some fields depending on which feed it is coming from.
Unfortunately, the schemas presented in the specification are not JSON, nor do
they provide their types (both requirements of Perspective);  more
unfortunately, I have the patience of a small child, so spending 10 minutes
manually writing a schema is simply out of the question.  Time to give up!

...

Just kidding - we can trivially utilize Perspective's own column inference to do 
this for us!  All we have to do is load the JSON data into a Perspective
`table()`, then call its `schema()` method.  First thing's first, though - 
Perspective is designed to run in a
[Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API),
so we'll need to create an instance of one that we can then create `table()`s
in.

```javascript
const worker = perspective.worker();
```

Now the engine is instantiated and we can call methods on it to create &
transform data in a separate Web Worker process.  Let's now use it to make a 
function `get_schema()` for inferring <i>schemas</i> from feeds, since we'll 
want to re-use this logic for both of our feeds.

```javascript
async function get_schema(feed) {
    const table = worker.table(feed);
    const schema = await table.schema();
    table.delete();
    return schema;
}
```

The call to `table.delete()` is important!  Perspective uses Web Assembly to
achieve its barnstorming performance, and unfortunately as of today, 
[Web Assembly does not support VM Garbage Collection](https://github.com/WebAssembly/design/issues/1079);
without this call then, the `table()` instantiated in this method would 
<i>leak</i> when it falls out of scope, leaving the underlying table memory
allocated forever.

With `get_schema()` in hand, it's easy to create the ultimate merged schema we
seek.

```javascript
async function merge_schemas(feeds) {
    const schemas = await Promise.all(feeds.map(get_schema));
    return Object.assign({}, ...schemas);
}
```

Testing this out in the Chrome Javascript Console is easy!  The Console supports
`await` directly (unlike Javascript, where this keyword cannot exist outside an
`async` function block), so all we need to do is copy/paste our function
invocation, exaclty as we'll use it in our finished script.

```javascript
const feednames = ["station_status", "station_information"];
const feeds = await Promise.all(feednames.map(get_feed));
const schema = await merge_schemas(feeds);
```

This returns exactly what we were looking for - the merged <i>schema</i> for
the `station_status` and `station_information` feeds, with types as inferred by
the Perspective inferrence algorithm directly from the data itself.

```json
{
    "station_id": "float",
    "num_bikes_available": "integer",
    "num_ebikes_available": "float",
    "num_bikes_disabled": "integer",
    "num_docks_available": "integer",
    "num_docks_disabled": "float",
    "is_installed": "integer",
    "is_renting": "integer",
    "is_returning": "integer",
    "last_reported": "float",
    "eightd_has_available_keys": "boolean",
    "eightd_active_station_services": "float",
    "name": "string",
    "short_name": "float",
    "lat": "float",
    "lon": "float",
    "region_id": "integer",
    "rental_methods": "float",
    "capacity": "integer",
    "rental_url": "string",
    "eightd_has_key_dispenser": "boolean",
    "eightd_station_services": "float",
    "has_kiosk": "boolean"
}
```

## Creating a `table` by joining feeds with an <i>index</i>

Now that we have our <i>schema</i>, and a convenient `get_feed()` method for
fetching our feeds, the next step is to load the feeds we've fetched into
Perspective.  The basic data primitive in Perspective is the `table()` object,
and creating one from a <i>schema</i> is easy - we just pass the `schema` object 
we created above to the `table()` constructor on the `worker`, just like we did
for the table we used to infer the constituent <i>schemas</i> in our
`get_schema()` function.

```javascript
const table = worker.table(schema, {index: "station_id"});
for (let feed of feeds) {
    table.update(feed);
}
```

Ah, but wait - this is just the state of Citibike at the moment of page load!
What about the real-time support we were promised in the title, and diligently
prepared for in our `get_feed()` function?  Turns out, that diligent
preparation indeed makes this pretty trivial - we just dispatch our `callback`
parameter to our `table.update()` method.  The <i>index</i> field of the
<i>options object</i> passed as the second parameter to
`table()` makes sure that each updated row overwrites existing <i>rows</i> 
joined by `station_id`, and Perspective's support for 
[partial updates](https://jpmorganchase.github.io/perspective/docs/usage.html#partial-i-row-i-updates-via-undefined)
means only the fields actually defined in the `station_status` feed are updated,
while the `station_information` fields are left alone.  Without this property,
<i>rows</i> added via the `table.update()` method would simply append, and we'd
need to join the `station_status` fields with the `station_information` fields
via a much more complex `<perspective-viewer>` configuration.

```javascript
get_feed("station_status", table.update);
```

## Loading a `table` in a `<perspective-viewer>`

Now that we have a `table()` with our Citibike subscription all wired up, the
last thing to do is view it!  For this, we need a `<perspective-viewer>`.  We
could create one via Javascript through the standard DOM APIs such as
`document.createElement()`, but one of the nice features of
[Web Components]() is that they can be used declaritively directly in your 
application's HTML without any special pre-processing.

```html
<perspective-viewer></perspective-viewer>
```

 Next, we capture references to all `<perspective-viewer>`s on our page through
 the standard DOM APIs, such that we may call their side-effecting
 methods such as `load()`, which we'll use to bind our Citibike `table()`.
 We can freely share this `table()` among as many `<perspective-viewer>`s as
 we need, so we'll just iterate through all of them - even our `update()` calls
 will be shared, causing all bound `<perspective-viewer>`s to re-render when
 the `table()` changes.

```javascript
for (viewer of document.getElementsByTagName("perspective-viewer")) {
    viewer.load(table);
}
```

And just like that, we have our live, joined dataset loaded in a fully interactive
`<perspective-viewer>`, ready to slice & dice!  (This isn't a screenshot, its
a live perspective viewer with real data, so go ahead and play around!)

<br/>
<div>
<perspective-viewer id="view1">
</perspective-viewer>
</div>

## Where are the Citibikes?

While we can see our data now and transform/visualize it to our heart's content,
the default view on initial load is not super interesting, so let's <i>kick it
up a notch!</i>  Wait, no, that's probably going to get us in trouble ... er,
let's <i>put some Perspective on it!</i>

Regarding our instigating question, there are a number of good potential
visualizations that may help us understand the answer, including
an incredibly obvious and easy one - a list of Citibike stations ordered by
the `"num_bikes_available"`.  We can make this the default view on a
`<perspective-viewer>` easily in HTML, through its
[Attribute API](https://jpmorganchase.github.io/perspective/docs/usage.html#setting-reading-viewer-configuration-via-attributes).

In this case, we'll want to set the `columns` attribute to our column set,
`["num_bikes_available"]`, and the `sort` attribute to a list of sort
descriptors `[["num_bikes_available","desc"]]`, or in other words, that we 
want the list arranged with the values of the `"num_bikes_available"` column
descending.  We also provide the `"name"` field to the `row-pivots` property,
though there will only be one row in the Citibike data per `"name"`.  While we
could have accomplished something similar by leaving this view un-pivoted and
instead added `"name"` to the `columns` attribute, making it a `row-pivot`
gives us a pretty tree axis indicating visually that `"name"` is the intended
<i>axis</i> of the view, as well as creating a `TOTAL` aggregate row showing
the sum total of all `"num_bikes_available"`.

```html
<perspective-viewer id="top-by-availble-bikes"
    row-pivots='["name"]'
    columns='["num_bikes_available"]'
    sort='[["num_bikes_available","desc"]]'>

</perspective-viewer>
```

Because our `table()` are shared, we can easily make another view on the
same data by just configuring another `<perspective-viewer>` - how about a
heat map of station availability?  The schema conveniently has `lon` and `lat` 
fields, which one surmise stand for Longitude and Latitude.  
`<perspective-viewer>` uses hard-coded mappings for displaying a `view()` 
configuration, and for Scatter Charts, it maps selected
`columns` to "X Axis", "Y Axis", "Color" and "Size" in that order.  Sure enough, 
setting columns to `lon` and `lat`, plus an interesting field like 
`num_bikes_available`, as well as the `view` attribute to `xy_scatter`, 
should give us something that looks roughly like the classic profile of the Five 
Bouroughs, colored by Citibike availability:

```html
<perspective-viewer id="available-bikes-heatmap"
    view='xy_scatter'
    row-pivots='["name"]'
    columns='["lon","lat","num_bikes_available"]'
    sort='[["num_bikes_available","asc"]]'>

</perspective-viewer>
```

Finally, at long last, we have our live & ticking Citibike Analytics Dashboard:

<br/>
<div id="grid">
<perspective-viewer id="view3" row-pivots='["name"]' columns='["num_bikes_available"]' sort='[["num_bikes_available","desc"]]'>
</perspective-viewer>
<perspective-viewer id="view2" view='xy_scatter' row-pivots='["name"]' columns='["lon","lat","num_bikes_available"]' sort='[["num_bikes_available","asc"]]'>
</perspective-viewer>
</div>

## Appendix - the Entire Application

For your covenience, the entire Javascript application at once is available
[in the `examples/` directory of the Perspective github repository](https://github.com/jpmorganchase/perspective/blob/master/examples/simple/citibike.html), as well as
[in a JSFiddle](https://jsfiddle.net/texodus/m2rwz690)