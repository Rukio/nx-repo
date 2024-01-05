# Station - Data Access

This is a data access library for Station APIs, State and Types. This library should only contain reducers and selectors for domain resources. It should **not** contain any feature reducers or selectors - those should be contained in the data-access library of the consuming application.

## Note:

In order to use this package, you also need to include `@*company-data-covered*/auth0/feature` library which provides basic authorization required by this package.

## Build:

Consuming application should have file replacement options of `environments`, it is required to populate proper configuration variables during development and build time.

```json
{
  "replace": "ts/libs/station/data-access/src/lib/environments/environment.ts",
  "with": "ts/libs/station/data-access/src/lib/environments/environment.[tier].ts"
}
```
