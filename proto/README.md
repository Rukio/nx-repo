# Proto

## Adding a New Proto Package

Add the desired protos under `proto/`

For an example of the formatting, see the [Example Service proto definition](./example/service.proto).

## Style

Read Protobuf's short and concise [Style Guide](https://protobuf.dev/programming-guides/style/).

### RPC Naming Convention

When designing CRUD-like RPCs adhere to the standard method prefixes outlined in [Google's API design guide](https://cloud.google.com/apis/design/standard_methods).

Example:

```protobuf
service ExampleVisitService {
  rpc ListVisits(ListVisitsRequest) returns ListVisitsResponse;
  rpc GetVisit(GetVisitRequest) returns GetVisitResponse;
  rpc CreateVisit(CreateVisitRequest) returns CreateVisitResponse;
  rpc UpdateVisit(UpdateVisitRequest) returns UpdateVisitResponse;
  rpc DeleteVisit(DeleteVisitRequest) returns DeleteVisitResponse;
}
```

## Updating Messages In A Backwards Compatible Manner

Reference: [Proto Language Guide](https://developers.google.com/protocol-buffers/docs/proto3#updating)

### Backwards compatibility

It's one of the absolutely most important things we must do to safely operate in a distributed environment.

- Never change field numbers for existing fields
- Never change field names for existing field numbers
- Never change types for existing fields
  - even though some can be wire compatible, language specific issues can arise
- Never remove field names or numbers without reserving them
  - of course, follow the standard deprecation process (below) for such breaking changes.

### Renaming/Replacing Proto Fields

1. Add the new field in the proto, the old field stays the same

```protobuf
message Sample{
  string old_field = 1;
  string new_field = 2;
}
```

```go
sample := Sample{old_field: "test"}
```

2. Update consuming service(s) to use the new field only

```go
sample := Sample{new_field: "test"}
```

3. Remove the old field from the proto and reserve its field name and number at the bottom

```protobuf
message Sample{
  string new_field = 2;

  reserved 1;
  reserved "old_field";
}
```
