# EDD: Station Development Direction

**Author:** [Toliver Jue](toliver.jue@*company-data-covered*.com)

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM

## Resources

- [Station codebase](https://github.com/*company-data-covered*/station)

## Glossary

- BE - backend
- FE - frontend
- DE - Data Engineering team

## Overview

This EDD is meant to select a development direction for the current Station codebase. While we acknowledge there are projects in flight, this should not preclude us from choosing a different direction if it makes sense.

Station is the main monolithic binary that runs most of _company-data-covered_'s main business.

Roles:

- API Gateway
- Main database with almost all important data
- Frontend server
- Authorization
- Coordination
- Auditing

Characteristics:

- Ruby on Rails BE
  - Ability to use rails console to debug prod
  - Duplicated controllers/functionality under `/admin`
- Multi Technology FE
  - Javascript
    - Convoluted codebase
    - Webpack bundled
    - Additional JS/CSS dependencies bundled by Ruby
  - Ruby erb template files
    - Setup/Bootstrap
    - Random configs
    - Cannot use Design System styling
- Postgres DB
  - Accessed mostly via Rails models
    - Many devs do not understand cost of database calls
    - Hard to debug performance problems
    - Too much data being requested
  - Unclear data domains
    - Lots of code accesses random parts of various tables
  - No history of updates for various domains
    - Many tables are update in place, making it hard to get snapshots of data over time
    - DE takes snapshots and tries to reconstruct history
- Cron jobs
  - Lots of cron jobs to handle updates
- Async jobs
  - Sidekiq/Redis
- Caching
  - Cache crispies/Redis
  - Elastic search
- Unclear/undocumented API
  - without reading code, very hard to determine how to call various APIs, w/ variations
- Testing
  - very slow
- Permissioning
  - very coarse permissioning of functionality
- Coarse resource scaling
  - monolith is harder to scale less-performant parts of the system
- Auditability
  - Coarse auditability of certain models

## Goals

- Documented API between FE/BE
  - Want to have API be documented and testable
- Documented Database Schema
  - Want to have all fields semantically documented
- Diagnosable database queries
  - Be able to tell during code review the efficiency characteristics of various queries
- Single codepath ownership of data
  - Maintain clear boundaries of what code owns which data (in database/redis/etc)
- Grokkable codebase interactions
  - Ability to easily trace how data flows without enormous effort
- Granular permissioning of functionality
  - Use ACLs/ABACs to control access to functionality
- Auditability
  - Be able to audit access to all endpoints
- Developability
  - Ease of development on a laptop, without having overly complex setup
- Deployment agility
  - Ability to quickly deploy service to production
- Single technology FE
  - Use single technology for all FE implementation
- Minimize risk to business continuity
  - Station is the primary monolith with lots of business logic, and if it's ever completely down, we cannot accept business, and lose money

## Design Proposals

### Proposal 1 – Keep using Station in Rails as-is

Keep using Station in Rails. No change to the architecture.

Pros:

- It has worked so far
- There's already institutional knowledge about how things work
- Minimizes business continuity risks

Cons:

- All the problems detailed in Overview
  - Loosely documented API
  - Database queries are hard to parse in Rails
  - Unclear data ownership
  - Codebase is sprawling
  - Unclear way to granularly permission functionality

<!-- Pros and cons of proposal, and evaluation against above listed goals -->

### Proposal 1a – Rewrite/move FE to another codebase

Move or rewrite the frontend in a different codebase, porting only the currently used workflows.

Note: Separate EDD for Frontend.

Pros:

- Only currently used workflows will be ported
- Can design new easier workflows

Cons:

- Battle tested code will be thrown away
- May need to large portions of UI/users all at once
  - Large breakage scenarios
- Retraining users

### Proposal 2 – Keep using Rails monolith, but split into separate GRPC services all in same server

Slowly partition Station into separate service domains, each with a GRPC API. All calls across service boundaries occur using GRPC.

Pros:

- Station is already running multiple GRPC services
- Documentation will be built up via GRPC proto docs
- Data ownership will become more clear with service boundaries
- Reuse already working code
- Permissioning will use GRPC ACLs
- Minimizes business continuity risks

Cons:

- Database queries are still hard to parse in Rails
- Ruby is still a slow language
- Will probably need some HTTP->GRPC translation for various edge cases
- Poor Rails GRPC support

### Proposal 3 - Create a new API Gateway that fronts Station BE

Add an API Gateway (proxy) in front of Station. Start by passing through all traffic, and slowly divert functionality away from Station.

Pros:

- Can add auditing/permissioning at new layer
- Slowly add documentation to the new API
- Allows bringing together all functionality under single domain (onboarding, shift team, etc)
- Allows migrating Station code to Go more easily. See Proposal 4

Cons:

- Still need to decide on what to do with Station code
- Most cons from Proposal 1

### Proposal 4 - Rewrite all of Station in Go (Recommended)

Rewrite all of Station, replacing functionality with Go.

Pros:

- DB queries will be more easy to understand
- Go is the preferred language of the company
- Opportunity to rewrite DB schema

Cons:

- Will likely be very hard to keep perfect API compatibility with Ruby Station
- Need to figure out how to migrate Database content
- Will likely need a variant of Proposal 3's API Gateway to slowly migrate

#### Proposal 4a - Monolith

Rewrite as a monolith.

Pros:

- Developability will be high because only single codebase
- May still share single Database.

Cons:

- Will likely be very hard to keep perfect API compatibility with Ruby Station
- Need to figure out how to migrate Database content
- Resource scaling cannot be as granular as with more microservices

#### Proposal 4b - Microservices/Service Oriented Architecture (Recommended)

Rewrite as a few services, with separate Databases for each service. Not necessarily a single service per partition of data.

Pros:

- Guaranteed single codepath ownership
- Database schema grokkability may increase due to likely simpler schemas
- Facilitates splitting ownership by domain/teams
- Faster deployments with smaller services
- Faster individual service testing

Cons:

- Developability will suffer with increased number of services
  - More independent parts running creates larger chances of problems
- Grokkability may suffer tracing across multiple codebases
- More moving parts need to be deployed per feature
- Testing matrix increases O(n^2)
- Database schema may become duplicative for some content
- Increased orchestration complexity
- Higher risk from deployment ordering complexity
  - Features may require more complex gating/coordinated deployments to bring up

## Platform Components

## Data Design & Schema Changes

## Metrics & Data Integration

## Error Handling & Alerting

## Safety

## Security

## Audits and Logs

## Scalability

## Cost

## Experimentation

## Testing

## Training

## Deployment

## Lifecycle management
