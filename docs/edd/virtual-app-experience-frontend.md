# EDD: Virtual APP Experience Frontend

**Authors:**

- Dmytro Hruzin (dmitry.hruzin@_company-data-covered_.com)
- Yurii Kirgizov (yurii.kirgizov@_company-data-covered_.com)
- Mykhailo Hladkyi (mykhailo.hladkyi@_company-data-covered_.com)

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM
- [x] EDD has been reviewed by internal team members - EM

## Resources

- PRD: [Provider migration](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EUlR7hSg-ylBkcV6Hdy4ILcBR1oZ9WaeWZgvh7WWpLjBxw?e=ebYmZg)
- PRD: [Virtual APP Experience](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EdX0mkizQexKm00JCJ2VVToBmrlqYKvBbzWXqETyvAEsow?e=r2DtYb)
- Acute & Virtual APP workflow: [Providers workflow](https://www.figma.com/file/BgzByC0xSUGhKbzAgf9mzH/Acute-vs.-Telepresentation-Visit-Workflow?type=whiteboard&node-id=0-1&t=x3B6QXaT4s74x1fp-0)

Supporting designs:

- [Virtual APP Experience Design](https://www.figma.com/file/UBo81ZjFjwtLZxJynhyEdI/Virtual-APP?type=design&node-id=38-9415&mode=design&t=DTUk6k0zMCclvMCq-0)

## Glossary

- FE - frontend
- CareManager - platform for Advanced Care workflow where providers work with Episodes and Visits.
- Dashboard - Station frontend where providers work with Care Requests
- Service - Care Manager / New one, based on BE EDD decision
- Monoliths SPA - is Single Page Application (SPA) that houses all its features and components in a single, tightly integrated codebase

## Overview

We plan to move Virtual APP users into separate platform out of Dashboard as part of bigger initiative of moving all providers.
What needs to be done:

- `Unassigned Visits` queue - list of accepted hybrid visits without assigned Virtual APP
- `Assigned Visits` queue - list of accepted hybrid visits with assigned Virtual APP
- Visit details with minimal required information
- Ability to assign/unassign visit
- Ability to add notes to a visit
- Connect virtual APPs with on-call doctors

## Goals

- Migrate Virtual APP users out of Dashboard
- Update Virtual APP experience to use new Care Model

## Design Proposals

Overview:

- In all cases already existing FE components from Services can be reused (e.g. On Call Doctor widget).
- The Virtual APP board page should be implemented:
  - Open Athena button
  - Open TytoCare button
  - On Call doctors modal
  - Unassigned / Assigned queues
  - Filter by cars
  - Filter by markets
  - Visit card contains:
    - Patient info
      - Name
      - DOB
      - MRN
      - CIN (EST)
    - Visit ID
    - Visit status (scheduled | on_route | on_scene)
    - Chief complaint
    - Care team info
      - Car name
      - Avatar
      - Provider name
      - Provider position
      - Car phone number
  - Ability to assign / unassign visits
- Side Panel on the Virtual APP board page
  - Visit statuses pipeline
  - Clinical Summary
    - Chief complaint
    - Symptoms
    - Risk strat score
    - Secondary screening note
    - Screener
  - EHR appointment
    - Patient ID
    - Encounter ID
    - Order ID
  - Care team info
    - Car name
    - Avatar
    - Provider name
    - Provider position
    - Car phone number
  - Notes
    - List notes
    - Ability to add note

Common implementation details:

- Adding new tab Virtual APP have access to
- Virtual APP experience dashboard will be visible depending on current user role. Only Virtual APP have access to their dashboard. Other tabs (Episodes) is not accessible. Relevant information about role and available markets will be taken from Station.
- Leverage StoryBooks and build from components

### Proposal 1 (recommended) – Extend `CareManager` frontend

We propose to build solution in `CareManager` frontend extending existing codebase. The Virtual APP experience dashboard will be implemented as a new tab on the UI.
The architecture of `CareManager` is slightly differs from what is used in other monorepo ts apps (like `Clinical KPI`, `Insurance Dashboard`, etc.). For example, at the data-access level, there is neither a domain level nor a feature level. Instead, hooks are used, and there is a separate folder called 'data-access-types' where queries are defined.

- New tab for Virtual APP Experience will be added to Care Manager FE
- The tab will be visible based on market role in Access Token

Pros:

- Extension of common tool already used for Advanced Care flow
- Possible reuse of implemented components
- Single tool for all Visit types

Cons:

- It works without redux that is not appropriate to our patterns.

### Proposal 2 – Build new react SPA

Build FE in small SPAs as it currently implemented with onboarding, shift scheduling, etc.

Pros:

- Small teams can work independently
- Little blast radius in case something is broken

Cons:

- Overhead of managing many small SPAs
  - Routing
  - Deploying
- Delays with page rendering due to initialization of app in browser and loading bundle
- Providers have to switch between apps

### Proposal 3 - New SPA with module federation approach

Build FE in small SPAs then connect to care manager as sep module.

Nx supports [Micro Frontend Architecture](https://nx.dev/concepts/more-concepts/micro-frontend-architecture#micro-frontend-architecture)

Pros:

- Small teams can work independently
- Little blast radius in case something is broken
- Single tool for all Visit types

Cons:

- Too many unknowns to be considered without independent exploration of how module federation could be used at the company.
- Dependencies between apps. Increasing CI complexity.

## Platform Components

Reuse of shared components will depend largely on the chosen proposal.

## Data Design & Schema Changes

DataDog logs and Slack alerts for errors

## Metrics & Data Integration

Monitoring will be done as it is today, using DataDog's APM.

## Error Handling & Alerting

## Safety

No unusual safety concerns around this designed are forecasted.

## Security

Are there any unusual security concerns around this design?

- New endpoints or methods of interaction within the system?
  - There are new endpoints, but nothing out of the ordinary compared to what these existing services were doing before.
- New dependencies on external systems?
  - No
- New third party libraries?
  - No

## Audits and Logs

No additional logging or audit is necessary, since all involved systems already have their necessary tooling in place.

## Scalability

N/A

## Cost

No additional cost is required for this change.

## Experimentation

Statsig experiment

## Testing

Manual QA
Unit tests

## Training

- Litmos course for virtual APPs
- Optisign for virtual APPs
- Knowledge Base Article

## Deployment

Usual deployment flows will be enough to launch this feature.

## Lifecycle management

No technology in danger of being sunset, abandoned or deprecated.
