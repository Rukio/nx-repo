# Mini EDD: Dispatcher Line

**Author:** [Umeh Oscar](oscar.umeh@*company-data-covered*.com)

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [ ] Make sure PRD and EDD are aligned - EM
- [x] EDD has been reviewed by internal team members - EM

## Resources

[EDD - Online Self Scheduling](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EWgFn1Dd_WJGqcCsMx2MLZoBig-WOD-jMOYyGLf7E0cQsA?e=lNUEiy)

[Online Self Scheduling Telephony Support](https://*company-data-covered*-my.sharepoint.com/:w:/p/hatte_meneau/Ebma5hEiqp5LltTmF3uBs3QBuCVU61UwqkXV8onlXZTE1Q?e=i0X2Le)

## Glossary

<!--

List of terms, acronyms and/or abbreviations with their respective definitions that will be used across this EDD.

-->

## Overview

This design is intended to outline the approach we will be taking to storing the phone number users/patients can use to call-in in oder to support the Access Center's on/off shore dispatchers.

With the dispatcher line, we will be able to:

- obtain the correct phone number to display to patients/users based on the selected market.
- eliminate the need for using the general queue phone number in our consuming apps.

## Goals

At the moment, we have no way of showing users which number they need to call when they require the assistance of a dispatcher due to having both on-shore & off-shore dispatchers and lots of markets.

- So we will provide a way for tools like OSS (Web Request) to display the correct phone number to our patients/users when they want to call in.

## Design Proposals

### Proposal 1 – Update Existing ScreenerLine Table

We will add a new field (type) to the screener_line table that will allow us to differentiate between a nurse (screener) line & a dispatcher line. we should then be able to store the dispatcher queue details as well.

#### Pros

- We won't duplicate current logic (as proposal 2 will)

#### Cons

- We will need to update all references to the screener line in our codebase (i.e AOB, station)

### Proposal 2 – Create new table DispatcherLine

We will create a new integration (dispatcher_line) to store the dispatcher's phone numbers per state as we do for screener lines. This will require creating the model, controller and updating the Market Serializer's stateLocale object to include the dispatcher_line attribute.

#### Pros

- It won't require updating any reference in our codebase.

#### Cons

- Duplicating existing screener line logic.

### Proposal 3 - Create a new generic model CallCenterLines (Preferred)

We will create a more generic model called `call_center_lines` that we will use to manage both `screener_lines` and `dispatcher_lines`. This will require migrating existing `screener_lines` data at once to this new model. Then in a separate change, we update the existing MarketSerializer (and anywhere else screener_lines are used) using a FF to point to the CallCenterSerializer in order to pull screener or dispatcher line details. Doing this will help maintain backward compatibility in order to not break existing functionality. We will use a field (just like we planned in Proposal 1) to differentiate between a screener & a dispatcher.

#### Pros

- We won't need to duplicate current logic
- It allows for ambiguity

#### Cons

- N / A

## Platform Components

### Proposal 1

- Need to update Station FE
- Need to update Onboarding FE
- Need to update station db table with new field
- Need to update Market Serializer's stateLocale object to an array of screener lines (which will include the new field)
- Need to update all screener line references in codebase

### Proposal 2

- Need to update Station FE with new page template (EJS)
- Need to update station db with new table
- Need to update Market Serializer's stateLocale object to include a new field (dispatcherLine) which contains the phone details
- Need to create new controller(in the admin domain) with endpoints for this

### Proposal 3

- Need to update Station FE with new page template (React)
- Need to update station db with new table
- Need to update Market Serializer's stateLocale object to include a new field (dispatcherLine) which contains the phone details. we will be able to differentiate between screener & dispatcher based on the type.
- Need to create new controller (an api controller) with endpoints for this

## Data Design & Schema Changes

### Proposal 1

Station will require updating the existing screener_line table with the column below:

- type - enum of either 'screener' or 'dispatcher' with the default being 'screener'

### Proposal 2

Station will require the addition of a new table called dispatcher_line with the following columns:

- phone_number
- queue_name
- state_id

### Proposal 3

Station will require the addition of a new table called call_center_lines with the following columns:

- phone_number
- genesys_id
- queue_name
- state_id
- type - enum of either 'screener' or 'dispatcher' with the default being 'screener'

## Metrics & Data Integration

No additional metrics are required

## Error Handling & Alerting

Datadog logs & slack alerts

## Safety

There is no safety concerns

## Security

- a potential new controller with 2 endpoints (if proposal 2 is chosen)
- no new dependenices on external systems

## Audits and Logs

as stated in the alerting section, Datadog will be used for logging

## Scalability

No scalability concerns

## Cost

no Additional costs

## Experimentation

no experiments required

## Testing

will require the usual FE automated tests, endpoint test, db tests.

## Training

Should work the same as Screener Line

## Deployment

no context needed

## Lifecycle management

No technology choices in danger of being sunset, abandoned, or deprecated.
