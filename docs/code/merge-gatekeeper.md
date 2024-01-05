# Merge Gatekeeper

When using a repo with multiple languages, i.e. a monorepo, Github required checks have some shortcomings. If the checks are selectively
run with a path filter, the require checks will never run therefore blocking a PR indefinitely. A work around would be to simply run
all checks all the time but that creates a lot of messiness in the actions list, wasted build minutes, and other friction for developers.
[Merge Gatekeeper](https://github.com/upsidr/merge-gatekeeper) allows the use of both path filtering and required checks to reduce
friction on merges. This action becomes the only required check in the repo to allow for dynamic check runs while maintaining the
same level of quality.

We also maintain a fork here: https://github.com/*company-data-covered*/merge-gatekeeper

## What's it do?

By placing Merge Gatekeeper to run for all PRs, it can check all other CI jobs that get kicked off, and ensure all the
jobs are completed successfully. If there is any job that has failed, Merge Gatekeeper will fail as well. This allows
merge protection based on Merge Gatekeeper, which can effectively ensure any CI failure will block merge.

### Fails when

This means that Merge Gatekeeper will fail if:

1. **any** other ci job that (is not ignored in [the action yml](../../.github/workflows/merge-gatekeeper.yml)) that is run fails
2. **any** other ci job takes longer than the timeout value specified in the [the action yml](../../.github/workflows/merge-gatekeeper.yml)

### Passes when

If all other ci jobs pass within the timeout, Merge Gatekeeper will also pass

## Troubleshooting

Seeing an issue with your PR and Merge Gatekeeper that doesn't quite add up? Reach out to EngCore for help.
