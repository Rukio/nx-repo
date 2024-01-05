# Third-Party Dependency Management

## Overview

When you’re writing large bodies of code, you’ll inevitably want to pull in third-party dependencies to speed up and generally improve the development process.
This document serves as a guideline to sustainable practices and is heavily inspired by [Google’s //third_party documentation](https://opensource.google/docs/thirdparty/).

## Ownership

The decision to add a new third-party dependency to the corpus is not one that should be made without a few careful considerations.

When it comes down to operations and maintenance, the only difference between third-party dependencies and proprietary ones is that you have a slightly better chance of having a personal familiarity with the original author in the latter scenario.
Third-party dependencies are code just the same as the code you write, and they need to be treated as such.

Adopting a third-party dependency is essentially creating a PR from that dependency’s code base into our own.
As such: code needs to be reviewed, functionality evaluated, and ownership established.

## Requirements

### Security review

Consider the following when importing a new library:

- Is library maintenance sporadic, or non-existent?
- Does the library have a small number of contributors?
- Are there open vulnerabilities associated with this library? You can determine this by reaching out to InfoSec, checking the Dependabot findings for that library, or by looking in Checkmarx after it’s been implemented.
- Is the library in an alpha or pre-release state?

If the answer to any of these questions is yes, then consider using another library. If the library is our only option, reach out to InfoSec for a review.

### Licensing

If you have even the slightest doubt that we can legally use a dependency, get legal to review it.
This is **NEVER** a bad option.

[This list is a reference of Open Source Initiative-approved licenses](https://opensource.org/licenses/category) that generally allows dependencies to be freely used, modified, and shared, but refer to the paragraph above.

Example list of licenses that do not pose restrictions:

- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause

### Identified owners

This section borrows heavily from [Google’s //third_party documentation on ownership responsibilities](https://opensource.google/docs/thirdparty/responsibilities/#owner).

Maintenance, security, updates, and hand-offs are all the responsibility of the dependency owners.
By choosing to adopt a new dependency, you implicitly become the new owner.
Comments in the respective module/package files should be added to indicate this.

Specify owners with email address user ids, rather than names (e.g. `dj.ambrisco` for `dj.ambrisco@*company-data-covered*.com`).

- Typescript
  - In `package.json`, please add a “dependencyOwners” top-level key if one doesn’t exist
  - Add a key-value associating the name of the package (e.g., “leftpad”) with owners
  - Example:
    ```js
    ...,
    “dependencies”: {
        “leftpad”: “1.0.0”
    },
    “dependencyOwners”: {
        “leftpad”: [
            “dj.ambrisco”,
            “mike.zelem”
        ]
    }
    ```
- Golang
  - In `go.mod`, add a comment after the dependency with owners
  - Example:
    ```
    google.golang.org/protobuf v1.25.0 // dj.ambrisco, toliver.jue
    ```
- Installed tools
  - In the location the tool is installed, add a comment with owners
  - `Makefile` example:
    ```makefile
    # toliver.jue, dj.ambrisco
    go install github.com/kyleconroy/sqlc/cmd/sqlc@v1.11.0
    ```
- Other dependencies
  - If it doesn't already exist, create a `DEPENDENCIES.md` file
  - Add the dependency identifier (e.g., "protoc"), the list of owners, and any additional relevant information
  - Example:
    ```markdown
    - teejae.vscode-sql-formatter
      - Owners
        - toliver.jue
        - dj.ambrisco
      - Function
        - Provides a SQL formatter for VSCode
    ```

As a user of a dependency, you’re expected to assist the owners when needed.
There’s an intentionally thin line between owner and user in this context.

#### Handing off ownership

If you no longer have the capacity to maintain ownership of a third-party dependency, you're expected to hand off and transition that responsibility.
In most cases, individuals should be identified who are both able and willing to assume the role and the identification comments in the appropriate file should be updated.

## Considerations

### Sufficient and necessary

Consider whether the functionality a third-party dependency provides is both sufficient (provides functionality you would otherwise need to build) and necessary (doesn’t provide a bunch of other unneeded functionality, doesn’t duplicate existing functionality).

Most dependencies are likely to be shared across teams, so we should evaluate multiple options in partnership with other teams.
Decision frameworks and rubrics are not strictly required for each dependency, but the lack of one may be grounds for rejecting one at reviewer discretion.

Don’t fall into the trap of pulling in massive all-in-one dependencies for the sake of ease.
There are certainly cases where such libraries are genuinely worthwhile to adopt, but that decision should be made with careful consideration and with an eagerness to own that dependency as an organization.

### Maintenance commitments

When debating the adoption of a third-party dependency, consider: “are you willing to maintain the dependency’s codebase yourself?” If the answer is “no”, don’t adopt it.

GitHub is littered with unmaintained and archived dependencies, and no measure of health or activity is a guarantee that the code you’re relying on won’t one day meet a similar fate.
When that day comes, you must be ready to maintain the code for, at a minimum, the amount of time it takes to find and implement a replacement.

#### Exception: specified functionality

If the third-party dependency you’re unwilling to maintain is one that implements a specification, the “maintainable” requirement may not apply.
When leveraging this consideration, it’s advisable to use strictly the specified subset of the dependency’s functionality.

### Upgrades

This section deviates somewhat from [Google's //third_party docs](https://opensource.google/docs/thirdparty/responsibilities/#owner), but they should be referred to as supplemental material.

As dependencies fall out of date and need to be upgraded, owners and users are expected to apply those upgrades.
If applying an upgrade causes code within the monorepo to break, it is the responsibility of those performing the upgrade to fix the broken code.
Functionally, this expectation is no different than the expectation we have when the signature or functionality of an internal library is modified.

The expectation that users of a third-party dependency are to be de facto involved with dependency upgrades implies that particularly large upgrades that cause widespread code breakages may necessarily involve people across many teams.
Efforts like this should be coordinated, planned, and committed to in order to minimize interruptions.

#### Security

Dependency owners are responsible for ensuring security upgrades are applied in a timely manner.
These required upgrades will primarily be flagged by the Security team, but it is absolutely not necessary to wait for them to flag a security risk and these upgrades must be undertaken regardless of who flags the risk.

#### Incompatibility

If a dependency’s next version is not backwards-compatible, upgrading is not implicitly required.
Security concerns may force an upgrade, but general usage does not.
If users need the version to be upgraded, owners and users should work together to upgrade the dependency.

Falling too far behind has other risks (and eventually becomes a de facto fork), so the balance of when to upgrade is largely guided by the owners and users of the dependency as collective stakeholders.

When a decision to explicitly _not_ document a dependency is made, please document this in the `DEPENDENCIES.md` file.
