# Segment integration for CompanionAPI

**Author:** Guillermo Jimenez (guillermo.jimenez@_company-data-covered_.com)

<!--

EDD "Pre-review Checklist" doesn't apply to this document

-->

<!--

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [ ] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [ ] Make sure PRD and EDD are aligned - EM

-->

## Resources

- PRD: N/A

- Heap events to be replicated after implementing Segment on CompanionAPI:
  [`https://*company-data-covered*.sharepoint.com/:x:/s/tech-team/EaG3xr_NvBpOjSDdlLtbS7ABbm3yCKSUFONrvFqXLfDeVw`](https://*company-data-covered*.sharepoint.com/:x:/s/tech-team/EaG3xr_NvBpOjSDdlLtbS7ABbm3yCKSUFONrvFqXLfDeVw)

- PR removing Heap event tracking implementation on CompanionAPI:
  https://github.com/*company-data-covered*/services/pull/4322

## Overview

After removing Heap from CompanionAPI, we are looking to replicate some of the events that used to be tracked, now through Segment.

The initial purpose of this document is to choose a way to integrate Segment event-tracking, as well as choosing what library this integration should be built on.

## Goals

- Integrate CompanionAPI and Segment to track events.

## Design Proposals

### Library

The preferred library proposal is [Library Proposal 1 – Segment Analytics 2.0 (node)](#library-proposal-1--segment-analytics-20-node)

#### Library Proposal 1 – Segment Analytics 2.0 (node)

Segment Analytics 2.0:

- Documentation: https://segment.com/docs/connections/sources/catalog/libraries/server/node/
- Repository: https://github.com/segmentio/analytics-next/tree/master/packages/node

Pros:

- Compatible with our current Node.js version.
- Owned by Segment and being actively worked on (as of the time of writing)
- Besides the HTTP Tracking API call wrapper, it implements:
  - Event subscription
  - Call batching (by default)
  - Graceful shutdown and unflushed events collection
  - Plugin architecture

Cons:

- Currently in public beta.
  - The old Segment node package (https://github.com/segmentio/analytics-node) is no longer viable as an option as Segment has deprecated Analytics Classic (https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/upgrade-to-ajs2/) and it is no longer possible to create sources for Classic.
  - According to maintainer, it can considered a production-ready Release Candidate with a stable API (https://github.com/segmentio/analytics-next/issues/732#issuecomment-1360146393).
- Library API defined by Segment, which may differ from other logging / event-tracking libraries (`winston`, NestJS logger, Statsig) usage.
  - This would be solved by wrapping library usage in a CompanionAPI (or shared) module that exposes a common interface.

#### (Rejected) Library Proposal 2 – Analytics.js Segment plugin (node)

Analytics.js:

- Library Documentation: https://getanalytics.io/
- Segment plugin documentation: https://getanalytics.io/plugins/segment/
- Repository: https://github.com/DavidWells/analytics
- Plugin code: https://github.com/DavidWells/analytics/tree/master/packages/analytics-plugin-segment

Pros:

- Provides a common abstraction over several third-party tracking tools (https://getanalytics.io/plugins/#supported-analytic-tools)
  - This enables adding/changing analytics / event-tracking services easily.

Cons:

- Analytics.js Segment plugin seems to be under no active development or maintenance.
  - Segment plugin is based on `analytics-node` which is based on deprecated and unavailable Segment classic sources.
- Both library and Segment plugin created and maintained by third parties (No Segment ownership).

#### Library Proposal 3 – Implement HTTP Tracking API custom library

HTTP Tracking API:

- Documentation: https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/

Pros:

- Potentially a smaller footprint/size than a full-fledged official third-party library
- Tailored to our needs
- Code ownership
- No new dependencies would be added.

Cons:

- In-house development, support and maintenance.

### Architecture

The preferred architecture option proposal is [Architecture Proposal 3 – Replicate previous Heap implementation structure](#architecture-proposal-3--replicate-heap-structure-nestjs-custom-provider)

#### Architecture Proposal 1 – Direct-use module

A module that can be directly initialized and utilized in any part of the application.

Pros:

- Self-contained:
  - Eaiser to potentially import / port into other applications.
  - Independent from NestJS architecture

Cons:

- Usage potentially more complicated than alternatives.
- Inconsistent with other CompanionAPI modules implementation (NestJS custom providers)

#### Architecture Proposal 2 – Logger service

Update the current logger custom provider (`winston` wrapper) to turn it into a log/event demux.

Pros:

- Create a consistent API for logging / event-tracking.
- Other logging/event-tracking modules could be integrated into logger.

Cons:

- Logger responsabilities would change/increase.
- Would involve significantly changing an already existing module.

#### Architecture Proposal 3 – Replicate previous Heap implementation structure (NestJS Custom Provider)

Create a custom provider to use within the application. Implement the module as an NPM package (e.g., [Statsig and Datadog](/ts/libs/nest/)).

Pros:

- Consistent with other module implementations within CompanionAPI.

Cons:

- Porting the resulting module to another library/architecture could become difficult (depending on internal abstraction/integration level).

## Platform Components

A new shared library ([NPM package](#architecture-proposal-3-–-replicate-previous-heap-implementation-structure-nestjs-custom-provider)) might be developed as part of this solution.

## Data Design & Schema Changes

No database changes are required.

A corresponding Segment Protocols Tracking Plan (https://segment.com/docs/protocols/tracking-plan/create/) should be designed and implemented. The Heap events spreadsheet should be used as a basis for this (at least for CompanionAPI).

## Metrics & Data Integration

Tracked Events Metrics and data integration with other services is beyond the scope of this document.

## Error Handling & Alerting

Event-tracking should be done asynchronously as to not delay application flows. Therefore, errors produced by Segment calls should not break nor block the calling function execution.

## Safety

A BAA (Business Associate Agreement) with Segment is set in place, so PHI can be shared with the service.

Segment might be configured to send events to Statsig or other destinations, in which case PHI becomes a concern. Segment destinations are outside of the scope of this document, so it will not be covered beyond mention.

## Security

Depending on which library proposal is selected, a new third-party dependency might be added.

## Audits and Logs

No extra logs besides events themselves are to be created.

Segment provides business-tier accounts an [Audit Trail](https://segment.com/docs/segment-app/iam/audit-trail/) to track app resource changes.

## Scalability

No resource scalability concerns.

To prevent the Segment API from becoming a bottleneck, the Segment module described in this document should expose asynchronous methods.

## Cost

There are no significant costs associated to this implementation. No new services or infrastructure are needed.

<!--

## Experimentation

How do we enable experimentation for different features?

- Add answer here

-->

## Testing

A test suite should be added for the selected implementation as part of its development.

[Segment Source Debugger](https://segment.com/docs/getting-started/06-testing-debugging/#the-source-debugger) will be used to test events are arriving to Segment sources created source for this implementation.

In case of choosing to create a custom library (e.g., a [HTTP Tracking API wrapper](#library-proposal-3-–-implement-http-tracking-api-custom-library)), a test suite should be developed for the library itself. [Segment's Node library](#library-proposal-1-–-segment-analytics-20-node) [already has tests](https://github.com/segmentio/analytics-next/tree/master/packages/node/src/__tests__). [Analytics.js Segment plugin](#rejected-library-proposal-2-–-analyticsjs-segment-plugin-node) doesn't seem to have any tests implemented.

## Training

Developers may need to adjust to a new API and/or process for integrating event tracking into modules.

## Deployment

No changes to deployment process.

A new environment variable for the Segment app key will be added as part of this implementation.

## Lifecycle management

All proposed libraries in the [Design Proposals](#design-proposals) section of this document are under active development and pose no risk of deprecation or sunsetting at the moment.
