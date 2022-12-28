An example of streaming data into the perspective viewer, simulating a simple market
blotter. The example creates random rows of tick data updating the table every 50ms
and limiting the data set to 500 rows.

This example has no server component, and all market data is randomly created in the
browser. It is a good example of Perspective's optimized real-time windowing
performance using the `limit` parameter, as memory usage will stay consistent, as well
as its interactivity during frequent re-renders.
