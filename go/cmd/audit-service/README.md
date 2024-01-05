# Audit Service

The Audit Service provides a centralized method for recording audit events from diverse applications. Audit events provide a set of standard fields for identifying source systems and context as well as providing the facility for providing arbitrary data and metadata. All applications can create audit events via the Audit service GRPC service. Go applications can also submit audit event records using the audit Go package directly.

Looking for help? Ping [`#help-eng-core`](https://dh-techteam.slack.com/archives/C044WMNPRM5)

## Quick Start

```bash
make ensure-dev-db-audit

DATABASE_URL=postgres://postgres@localhost:5433/audit make run-go-audit-service
```

## Audit Event Format

| Field              | Required     | Description                                                                               |
| ------------------ | ------------ | ----------------------------------------------------------------------------------------- |
| `source`           | **Required** | The source system (i.e. service, application) generating the audit event                  |
| `agent`            | **Required** | The user or account initiating the audit event                                            |
| `event_type`       | **Required** | The name of the action or event generating the audit event data                           |
| `event_type_data`  | **Required** | The logical entity being mutated or accessed                                              |
| `event_timestamp`  | **Required** | The timestamp of the audited event                                                        |
| `event_data`       | Optional     | Any data related to the audited event and its data type itself which may also include PHI |
| `context_metadata` | Optional     | Any data related to the system context in which the audited event occurred                |

## Configuration

| Setting                  | Default                                          | Description                                                             |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `GRPC_LISTEN_ADDR`       | `:8482`                                          | GRPC address to listen to                                               |
| `AUTH0_ISSUER_URL`       | `https://<env>-auth.*company-data-covered*.com/` | The URL where Auth0 can find the OpenID Provider Configuration Document |
| `AUTH0_AUDIENCE`         | `internal.*company-data-covered*.com`            | The intended recipient of the token                                     |
| `AUTHORIZATION_DISABLED` | `false`                                          | Determines whether authorization is disabled for the service            |
| `DATABASE_URL`           |                                                  | The database connection string to the audit database                    |

## GRPC Service Usage

The audit service should be initialized using the audit service address for the targeted environment and a sensible timeout. A utility function can be used to encapsulate the GRPC connection operations. Once a GRPC connection is established an audit service client can be initialized with with the connection using the `auditpb.NewAuditServiceClient` function.

```go
// get the audit service address and timeout settings
auditServiceAddress = flag.String("audit-service-address", "127.0.0.1:8482", "gRPC address for the Audit service")
grpcDialTimeout      = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")

// create a grpc connection
dialCtx, dialCancel := context.WithTimeout(context.Background(), *grpcDialTimeout)
clientConnection, err := grpc.DialContext(dialCtx, *auditServiceAddress, opts...)

// ensure the grpc connection gets cleaned up
defer func() {
  clientConnection.Close()
  dialCancel()
}()

// initialize the audit service client with the GRPC connection
auditService := auditpb.NewAuditServiceClient(auditServiceConnection)
```

With the audit service initialized audit events can be submitted to the Audit Service via the GRPC `CreateAuditEvent` endpoint. Given a `CreatePatientRequest` a `CreateAuditEventFromCreatePatientRequest` utility function creates an `*auditpb.CreateAuditEventRequest` request which is passed to the audit service `CreateAuditEvent` endpoint.

```go
auditEventData, err := CreateAuditEventFromCreatePatientRequest(req)
if err != nil {
  return nil, err
}

response, err = auditService.CreateAuditEvent(ctx, auditEventData)
if err != nil {
  return nil, err
}
```

## GRPC Interceptor Usage

The package `github.com/*company-data-covered*/services/go/pkg/audit` provides a GRPC Unary Interceptor which can be used to wrap GRPC calls with automatic audit event generation.

At a high level, to use the interceptor:

1. Generate protos which contain `audit` rules
2. Initialize and pass the Interceptor to your GRPC server as an ExtraUnaryInterceptor

See package for full usage details.

## Ruby GRPC Service Usage

An audit event can be submitted to the Audit Service using the `create_audit_event` helper.

```ruby
create_audit_event(patient) do |model|
  {
    id: model.id,
    first_name: model.first_name,
    last_name: model.last_name,
    ssn: model.ssn,
    mobile_number: model.mobile_number,
    modified_at: model.updated_at
  }
end
```

Alternatively the audit client on `Rails.audit` can be used directly

```ruby
Rails.audit.create_audit_event(patient, user, context: context) do |model|
  {
    id: model.id,
    first_name: model.first_name,
    last_name: model.last_name,
    ssn: model.ssn,
    mobile_number: model.mobile_number,
    modified_at: model.updated_at
  }
end
```
