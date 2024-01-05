# Engineering Design Documents (EDD)

Link: [Starter EDD Template](TEMPLATE.md)

EDDs are meant to document major engineering design decisions for the organization.

Benefits:

- Documents circumstances/rationales for technical directions and decisions
  - Allow revisiting decisions when circumstances change
- Clarifies criteria for making decisions
- Catalogs risks the organization is willing to take for certain goals
- Replaces institutional knowledge in human heads

## Need EDD?

You _MUST_ write an EDD for any of the following cases:

- Creating complex features
  - _Rationale_: Complex features have a large design space, with many facets and moving parts.
- Adding new technology/dependencies to the organization's codebases
  - _Rationale_: Adding dependencies often brings on risks (maintenance, security, etc)
  - Includes all repos with production facing code
- New usage patterns of existing technology
  - _Rationale_: Previous usage patterns of a technology may not fit new usage, and different teams may need to be aware.
    - _Example_: Previously, a logistics endpoint provided a single car real time location, triggered by a human request. New usage pattern is to send notifications to all patients as a car moves, using the same endpoint.
- New connections between existing services/technologies
  - _Rationale_: New dependencies may impact dependency chain, and different teams need to be aware.
- Scaling usage more than 10-100x existing usage
  - _Rationale_: Technology is often designed for a certain scale(query frequency, data volume), and rarely scales more than 2 orders of magnitude.
- Additions or modifications to overall cloud platform
  - _Rationale_: Cloud platform changes frequently have a larger blast radius for changes, affecting performance and cost.

In addition, you _MAY_ need to write an EDD for:

- Cross team projects
  - _Rationale_: Cross team projects generally need more coordination to deliver.
- Internal team technical direction
  - _Rationale_: Even a single team may need to make choices on how to get certain things done, and the same benefits apply for documenting these choices.
  - "Mini-EDDs" are similar to EDDs, but may have less formal structure or facets to discuss. Mini-EDDs may be useful to a single team, and do not require approval from [architecture-approvers](https://github.com/orgs/*company-data-covered*/teams/architecture-approvers). These should be created in the `mini` directory under each team directory.

If you have questions on whether you need an EDD, please ask in the [Slack #wg-edd channel](https://dh-techteam.slack.com/archives/C04AMA1KVGX).

## Starter Template

The EDD template is intended to provide general guidance with the intention of developing well-engineered designs.
In almost all cases, the sections within the template should be completed.
If you believe some sections do not apply to your design, please address why those sections don't apply.
In cases where the justification provided is accepted, removal of those sections will likely be encouraged during review, but it's also possible that retaining that justification will be preferred.
Please feel free to add additional sections if your design warrants them.

Some designs may necessitate deviation from the template entirely. In these cases, please provide justification for the deviation in the EDD itself.

## Engineering Design Review (EDR)

Process Documentation: https://_company-data-covered_.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review

## Old EDDs

EDDs created and reviewed prior to the transition to Github are located [in Sharepoint](https://*company-data-covered*.sharepoint.com/sites/tech-team/Shared%20Documents/Forms/AllItems.aspx?RootFolder=%2Fsites%2Ftech%2Dteam%2FShared%20Documents%2FProcesses%2FProduct%20Development%2FEngineering%20Design%20Review).
