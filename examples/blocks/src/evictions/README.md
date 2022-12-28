Demo of [Perspective](https://github.com/finos/perspective), using SF eviciton data
from 1997-present provided by
[DataSF](https://data.sfgov.org/Housing-and-Buildings/Eviction-Notices/5cei-gny5).

This example has no server component, and connects directly to DataSF's public API from
your browser. These 44,311 rows are ~2.5mb gzipped (at time of writing), but are
cached in `LocalStorage` on subsequent page visits.
