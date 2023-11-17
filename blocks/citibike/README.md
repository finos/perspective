Demo of [Perspective](https://github.com/finos/perspective).

A real-time map of NYC Citi Bike stations, colored by the number of bikes available at
each station, updating once per second. This example uses a perspective `Table` with
partial updates (`update()` calls with only some columns present) to affect a _join_ of
the real-time updates of bike availability, to the immutable station reference data
which is only ever udpated once - similar to a market price monitor.

This example connects directly to [https://citibikenyc.com](https://citibikenyc.com)
public APIs from the browser itself, for both real-time and reference (station) data,
and does not have a server component.
