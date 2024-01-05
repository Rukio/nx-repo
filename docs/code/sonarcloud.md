# SonarCloud

- [Sonarcloud Dashboard](https://sonarcloud.io/organizations/*company-data-covered*/projects?sort=name)

## Quality Gate

A quality gate is a set of conditions that are applied to the results of each code-analysis in order to identify if incoming and existing code meets a minimum level of project-defined standards.

The org-wide _company-data-covered_ Quality gate is defined below for new and overall code

[Quality Gate Conditions](https://sonarcloud.io/organizations/*company-data-covered*/quality_gates/show/59672)

### New Code

**REQUIRED TO PASS**

Quality gate that's applied to all incoming PRs pre-merge.
If any conditions fail the PR will be prevented from being merged.

### Overall Code

Quality gate that's applied to the main(trunk) branch to provide feedback on the overall state of the project's releasable branch.

## Bypass Gate

The Sonarcloud gate job can be bypassed by Github Admins under certain acceptable instances

1. Sev1/2 time-sensitive fixes
2. Large refactor changes

**Before Bypassing, engineers should review the include/exclude patterns defined in the `sonar-project.properties`**

If an override is needed, reach out to a [Github Admin](https://github.com/orgs/*company-data-covered*/people?query=role%3Aowner) and discuss the details of the bypass for approval.

## TODOs

- Migrate all existing Sonarcloud documentation from Confluence once restored
  https://confluence.*company-data-covered*.com/display/DEV/SonarCloud+Process
