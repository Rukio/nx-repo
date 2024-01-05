# OPA

## Overview

The Open Policy Agent (OPA, pronounced “oh-pa”) is an open source, general-purpose policy engine that unifies policy enforcement across the stack.[^1]

We use OPA as a Policy Decision Point in our service architecture. Services can query the `policy-service` for a given policy, providing user and resource information and receiving an authorization determination. The centralized policy decision point allows InfoSec to provide oversight on data access, provides consistent decision-making across our services, and in the future may enable enhancements such as heuristics monitoring and intervention.

## Directory Structure

```sh
# The bundle includes all documents which will be compiled by the policy service.
.
├── bundle
|    ├── static    # Shared, static reference data
|    ├── policies  # Policies
|    └── utils     # Shared rules and functions
└── examples
     └── # reference Rego data, not bundled to server
```

## Policy Writing

Policies are written in the Rego (pronounced "ray-go") policy language.[^2] Rego is a declarative query language and helps us focus on what policies should return rather than how queries should be executed.

Policies typically follow a standard pattern:

A `package` declaration, which namespaces the policy:

```rego
package policies.carerequests
```

`import`s, which declare dependency documents:

```rego
import data.utils.actor    # Custom helpers for our standard behavior
import future.keywords.in  # OPA Built-in
```

Rules, which are the meat-and-potatoes of the policy:

```rego
default create := false  # Defaulting is optional; otherwise 'undefined' if not true

# "Create is true if (is_own AND the actor has one of the user groups)"
# "...OR Create is true if (resource is in user's market AND the actor has one of the user groups)

create {
	is_own
	actor.user_has_any_group(["user", "api"])
}

create {
	is_in_market
	actor.user_has_any_group(["provider", "admin", "beta"])
}
```

OPA recommends to define rules incrementally.[^3] Each definition is additive, and can be understood as `... OR ...`.

Multiple rules can (and should!) exist in a single, related policy. Policies should be based, broadly, on the data to which they are governing access.

## Policy Checking

A policy-check request involves the following three data points:

- The "query", which is a rule within a policy namespace
- The "input", which is the provided data which will be evaluated by the rule
- The "data", which is state internal to the system representing well-known data points or calculations

In the example above, you might have a request that looks like:

```json
{
  "query": "result = data.policies.carerequests.read",
  "input": {
    "actor": {
      "user_id": 1,
      "groups": ["myFirstGroup", "mySecondGroup"],
      "markets": ["DEN", "COL"]
    },
    "resource": {
      "care_request_id": 1,
      "owner_id": 1,
      "market": "DEN"
    }
  }
}
```

The Query API would return a boolean response with the result of the `policies.carerequest.read` evaluation. The calling service uses this response to allow or forbid access to protected actions.

We recommend using the Go `auth.PolicyClient` to perform queries. The library standardizes our common policy-checking patterns.

## Best Practices

### Managing Data

We store static, shared data in the `bundle/static` folder. When building the bundle, OPA will only pull in data which is of the format `data.json` or `data.yaml`, and the resulting document will be namespaced based on the directory structure.[^4]

For example, `opa/bundle/static/station_roles/data.json` will be loaded into OPA as a document `data.static.station_roles` when `opa/bundle` is the OPA bundle directory.

### Performance

Per OPA recommendations:

> For low-latency/high-performance use-cases, e.g. microservice API authorization, policy evaluation has a budget on the order of 1 millisecond.

The majority of our policy-writing is expected to follow OPA best practices based on our typical use-cases, and would fall well under 1ms evaluation times. See [OPA: Policy Performance](https://www.openpolicyagent.org/docs/latest/policy-performance/#equality-statements) for details on best practices.

TL;DR:

- Write linear policies following `allow { ... }` patterns, which can walk the policy once and take advantage of early-exit
- Where possible, write equality statements which are [indexable](https://www.openpolicyagent.org/docs/latest/policy-performance/#equality-statements)

To measure performance, we can run benchmarks against our tests:

```sh
opa test opa/bundle --bench
```

In benchmarking results, look for `ns/op` to compare against the `1ms` evaluation threshold.

[^1]: https://www.openpolicyagent.org/docs/latest/
[^2]: https://www.openpolicyagent.org/docs/latest/policy-language/
[^3]: https://www.openpolicyagent.org/docs/latest/policy-language/#incremental-definitions
[^4]: https://www.openpolicyagent.org/docs/latest/management-bundles/#bundle-file-format
