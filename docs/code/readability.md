# Readability

> Unlike a traditional code review, the readability process is the one time where the assigned readability reviewer holds nothing back. Every single minor thing that could possibly be pointed out, will be. But in the end, going through the readability process made me a better programmer and code reviewer.

Source: https://www.pullrequest.com/blog/google-code-review-readability-certification/

## Overview

`Readability` here at _company-data-covered_ is, in spirit, a direct reflection of Google's own concept of [Readability](https://www.pullrequest.com/blog/google-code-review-readability-certification/).

`Readability` relates to [`Stewardship`](stewardship.md) in that both represent a history of high-quality contributions to and deep technical understanding of the codebase as both a committer and a reviewer. Stewardship represents `Readability` across the codebase as a whole while `Readability` is specific to an individual language.

### `<language>-approvers` groups

- [elixir-approvers](https://github.com/orgs/*company-data-covered*/teams/elixir-approvers)
- [go-approvers](https://github.com/orgs/*company-data-covered*/teams/go-approvers)
- [python-approvers](https://github.com/orgs/*company-data-covered*/teams/python-approvers)
- [ruby-approvers](https://github.com/orgs/*company-data-covered*/teams/ruby-approvers)
- [sql-approvers](https://github.com/orgs/*company-data-covered*/teams/sql-approvers)
- [typescript-approvers](https://github.com/orgs/*company-data-covered*/teams/typescript-approvers)

## General Principles

`Readability` applies exclusively at the language level.

Developers who have earned `Readability`:

- Understand and consistently follow all the other principles laid out in various guides, including:
  - [Code Style Guide](style.md)
  - [Developer Guide](developer.md)
  - [Reviewer Guide](reviewer.md)
- Demonstrate and apply a deep knowledge of a language's idioms and patterns
- Critique code carefully and thoroughly to guarantee maintainability and comprehensibility of the codebase
  - Are additionally capable of critiquing code above and beyond the expectations of a standard code review when vetting Readability applicants
- Collaborate actively with developers on PRs to ensure they understand our expectations and are able to apply our best practices
- Coach others to do the same and hold each other accountable to preserve the quality and usability of the codebase

## Earning `Readability`

- Actively review and contribute code in your language of interest
- Work with a sponsor who already has `Readability` in your language of interest
  - Engineers on other teams are strongly preferred to promote cross-team collaboration
- `Readability`-eligible PRs require at least two labels - failure to use appropriate labels will result in them not being accounted for:
  - [ ] A label correlating to the language for which a candidate is being assessed (e.g. `ruby` or `go`)
  - [ ] Either `readability-submitter` or `readability-reviewer` as appropriate
    - `readability-submitter` should be added to PRs when you're the author and you want the PR to be considered in your `Readability` bid
    - `readability-reviewer` should be added to PRs when you're a reviewer you want the PR to be considered in your `Readability` bid
      - [ ] When adding `readability-reviewer`, ensure you also assign yourself to the PR (under the "Assignees" section on the right sidebar when viewing the "Conversation" tab)
  - PRs of insufficient complexity may have their `Readability` labels removed
- Upon having successfully merged 5 `readability-submitter`-labeled PRs and 5 `readability-reviewer`-labeled PRs, ask your sponsor to review the list of PRs for quality and complexity
- Assuming that the sponsor does not object to any of the labels, the sponsor will post the list of these PRs in #wg-readability
  - 72 hours will be given for members of #wg-readability to object to any of the labels
  - If there are no outstanding objections after 72 hours, readability will be granted
- Any PRs that do not meet the standards of our best practice guides (see [General Principles](#general-principles)) will result in an extension or removal of labels from previously successful `Readability` PRs

### Discovering `Readability` PRs

- `readability-submitter` PRs can be identified using the `label` and `author` filters using Github's issue search
  - Example search URL for `readability-submitter` PRs in `go` for candidate `dgolosow`:
    - https://github.com/*company-data-covered*/services/pulls?q=is%3Apr+label%3Areadability-submitter+label%3Ago+author%3Adgolosow
- `readability-reviewer` PRs can be identified using the `label` and `assignee` filters using Github's issue search
  - Example search URL for `readability-reviewer` PRs in `go` for candidate `carlos-garibay`:
    - https://github.com/*company-data-covered*/services/pulls?q=is%3Apr+label%3Areadability-reviewer+label%3Ago+assignee%3Acarlos-garibay
- Note the distinction between the `author` and `assignee` filters used in conjunction with `readability-submitter` and `readability-reviewer` labels respectively

### Losing `Readability`

Engineers found to be violating our best practices may lose their `Readability`. Examples of actions that could result in this include:

- "rubber-stamping" PRs (approving with insufficient review)
- "override approvals" (approving PRs with unaddressed concerns raised by another reviewer, especially fellow `Stewards` or others with `Readability`)
- repeated failures to adhere to best practices

## Appendix

### Inspiration

`Readability` is inspired by Google's concept of the same name. More detail can be found in the [`Stewardship` doc](stewardship.md#google-code-readability).
