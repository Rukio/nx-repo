# Pull Request (PR) - Developer Practices

[Google Eng Practices Reference](https://google.github.io/eng-practices/review/developer/)

For reviewers, see [Code Reviewer Practices](reviewer.md).

<a name="good-description"></a>

## [Good PR Descriptions](#good-description)

<a name="pr-title"></a>

### [PR Title](#pr-title)

Write a concise summary of _what_ the PR is doing

- Context-free
  - Does not require reading code to understand statement
- Tracking bug (_optional_)
  - JIRA ticket
- Imperative statement
  - `Delete`, not `Deleting`

**Rationale**: Good summaries allow maintainers to quickly skim commit logs when potential problems come up in the codebase, and triage problems easily. `git blame` can also show why particular lines of code exist. This PR title format also [automatically hyperlinks the PR to the JIRA ticket](https://support.atlassian.com/jira-cloud-administration/docs/integrate-with-development-tools/).

Format:

```
[JIRA-123] <Feature>: <Description of PR>
```

Examples:

```
// Bad
Fix bug // what bug?
// Good
[PLAT-123] Load balancer: Fix intermittent connection dropping due to off-by-one error

// Bad
Enforce rules // rules for what?
// Good
[JIRA-123] Rubocop: Start enforcing formatting rules in codebase

```

<a name="pr-description"></a>

### [PR Description](#pr-description)

Add an informative description with enough context for a future maintainer to understand the PR and underlying code.

Details to include:

- Problem being solved
- Background
  - Related JIRA tickets
  - Benchmarks
- Links to screenshots in JIRA (for UI)
  - **Note:** Screenshots (and any other files) uploaded as part of a PR description or comment are publicly available to agents outside of _company-data-covered_. In order to avoid inadvertent sharing of data or IP, you are required to [upload images to the issue in Jira](https://support.atlassian.com/jira-software-cloud/docs/add-files-images-and-other-content-to-describe-an-issue/). Do **NOT** directly attach images or files to Github PRs.
- Shortcomings
- Test strategy
  - How functionality verified
- Reference docs (including external)
  - Make sure all referenced docs are accessible by everyone, not just linked

**Rationale**: Good descriptions help inform both current and future reviewers about what to expect in the code. By understanding the intent of the PR, reviewers can give better suggestions and judge whether the current approach is appropriate.

[Examples from Google Eng Practices](https://google.github.io/eng-practices/review/developer/cl-descriptions.html#good)

<a name="pr-description-review"></a>

### [Review final PR descriptions before merging](#pr-description-review)

Make sure to review PR Title and Descriptions for accuracy once again before merging.

**Rationale**: PRs can go through significant change before a merge. The description becomes public record, so should be accurate.

<a name="small-pr"></a>

## [Small PRs](#small-pr)

Make small PRs. Reviewers have discretion to reject PRs outright for being too large.

**Rationale**: All of the following benefits:

- Reviews
  - Faster - easier to review in a few minutes
  - More thorough - easier to see all problems succintly
  - Less blockage - fewer issues to block good parts on
- Fewer bugs
- Easier merges
- Simpler rollbacks

<a name="self-contained"></a>

### [Self-contained](#self-contained)

Small PRs have one self-contained, digestible change.

- Minimal change addressing one problem
  - Split refactor and functionality change
  - See [Split files](#split-files) for more strategies
- Includes related test code
- Reviewer's full context consists of:
  - PR description
  - Existing codebase
  - Other previously reviewed PRs

### [Too small](#too-small)

A PR is too small if:

- Breaks build because single PR has incomplete functionality
  - Always maintain working codebase
- Hard to understand implications
  - Introduce both API and client code in same PR

<a name="large-ok"></a>

### [Large PR exceptions](#large-ok)

Only a few exceptions are made for large PRs. Even these PRs can often be made smaller

- File deletion
  - Easy to review
  - A single file deletion counts as 1-line change
    - Should be deleting references, or explain why they don't exist.
- Trusted automated refactoring
  - Mechanical refactorings/reformats done by tested and trusted tools
- Generated code
  - Must be clearly marked with `GENERATED`.

<a name="split-files"></a>

#### [Split files](#split-files)

Split up sets of files for a big PR. Use dependent ("stacked") PRs, with appropriate base branch diffing as appropriate.

Examples:

- Refactoring
  - PR 1: Add infrastructure for refactoring
  - PR 2-N: Move over client code of refactor in separate PRs
- Adding feature flags
  - PR 1: Feature flag infrastructure
  - PR 2-N: Apply feature flags per feature
- Reformatting codebase
  - PR 1: Rule set 1
  - PR N: Rule set N

Developers should make their best effort to design small PRs that can be merged into `trunk` directly, without the need for stacked PRs.

Stacked PRs are approved with the assumption re-review will be requested if changes are required due to upstream reviews, and that they must be merged sequentially and only into `trunk`. As PR 1 is merged, PR 2 will automatically target `trunk` and may be merged, and so on.

<a name="test-code"></a>

#### [Keep related test code](#test-code)

PRs with small code changes may include lots of tests, but they should all be related to the code change.

**Corollary**: Test-only refactorings should be separate PRs.

<a name="work-in-progress"></a>

## [Work in Progress](#work-in-progress)

Use `Draft` PRs for work in progress. Optionally add `WIP: ...` as a prefix to the PR title.
When a PR is ready for review, mark it `Ready for review`.

While a PR is still in `Draft` mode and the branch needs to be updated with the origin branch,
remote changes should be brought in by using either `git rebase` or `git merge`. Once a PR is ready for review,
in order to keep a historical record of comments, ONLY `merge` can be used.

<a name="handling-comments"></a>

## [Handling Reviewer Comments](#handling-comments)

<a name="transactional-comments">

### [Respond to all comments together as single transaction (GitHub)](#transactional-comments)

Only use the `Files changed` tab to respond to comments. This will give the option to reply to comments with `Start a review`.

1. Use `Files changed` tab.
2. Address first comment, using `Start a review` button.
3. Address all other comments, changing code as necessary, replying with `Add review comment`.
   - Includes outdated comments. If they're done, respond with `"Done"`.
4. Push all code up that has addressed comments, reviewing code.
5. Click on `Review changes`, add any other comments needed for PR. `Submit review`.
   - Includes responses to general PR comments not pertaining to specific lines of code.
   - **Re-confirm all comments are addressed**, or risk waiting another review cycle.
6. If all comments have been addressed, go to bottom of `Conversation` tab, click on `Dismiss review` for any `Changes requested` that have been addressed.
7. `Re-request review`s from reviewers by clicking the "cycle" icon next to reviewers' usernames.

**Rationale**: Reviewers need to see the content changes and comments at the same time. There should be limited cycles of review/changes. Comments are often grouped, so responding to single comments does not help reviewers see full context.

<a name="resolving-comments">

### [Resolving comments (GitHub)](#resolving-comments)

Developers should not use the `Resolve Conversation` button. Reviewers should **hesitatingly** use the `Resolve Conversation` button.

Comments are for all to see in the future, so that it's easy to spot potential problem areas when looking at past PRs.

**Rationale**: It's important for everyone to see all issues discussed over the course of the PR. Even after the developer thinks the code or issue is fixed, only the reviewer can decide if it's done. Resolved conversations are hidden, and other reviewers cannot easily see where problem areas might be.

<a name="personal"></a>

### [It's not personal](#personal)

Reviews are an organizational tool meant to maintain quality of the codebase and products.

Assume the best intent of your reviewers.

**Do not respond in anger to comments.** Doing so is a breach of professional etiquette and whatever you write will live permanently for all to see in the code review.

<a name="code"></a>

### [Fix the code](#code)

Always try to fix the code to answer comments. A [`TODO` comment](style.md#todo) may be appropriate if the reviewer approves of it.

**Rationale**: When a reviewer is asking a question, it often means they don't understand what is going on. Future maintainers will likely have the same problem. Responding to comments with comments does not help future maintainers.

<a name="think"></a>

### [Think for yourself](#think)

Always consider and contemplate the reviewer feedback. Ask yourself if it's possible the reviewer is correct.

**Rationale**: Making PRs can take a lot of work. While you may believe you've done the right and obvious thing, it's possible that there's something you've missed that your reviewer has not.

**Corollary**: You may actually be doing the right thing, so when responding to comments, try to educate your reviewer on why your method is the better way.

<a name="conflicts"></a>

### [Resolving conflicts](#conflicts)

Always aim for consensus with the [reviewer first](reviewer.md#conflicts).
