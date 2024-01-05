# Developer Guide

## Requirements

- [`circleci` cli](https://circleci.com/docs/local-cli)
  - install with `brew install circleci`

## Make an orb

1. Initialize an orb using `circleci orb create *company-data-covered*/<descriptive_orb_name> --private`
   1. Note: you will need `owner` permissions to do this. Reach out to engcore if you can't
2. Create a new `yml` file for your orb
3. Add all needed jobs, commands, etc. to the file
4. Validate the file using `circleci orb validate path/to/orb_file.yml`

## Publish an orb

Publish private development versions of orbs using:

```
circleci orb publish /path/to/orb_file.yml *company-data-covered*/<descriptive_orb_name>@dev:<some_tag>
```

## Promote a dev orb to production

Promote an orb in development using:

```
circleci orb publish promote *company-data-covered*/<descriptive_orb_name>@dev:<some_tag> [patch|minor|major]
```

## List available orbs

You can list available orbs by using:

```
circleci orb list *company-data-covered* --private
```

## Documenting orbs

A script has been created to generate documentation for orbs. Run the script using `./make_docs.sh` in the
`infra/circleci_orbs` directory. You will need to install and configure the circleci cli to run this script as it uses that to pull contexts.

This script will generate documents based on:

- The files in `infra/circleci_orbs/docs` are merged together into the readme
- contexts that exist in circleci
- Orbs are documented by looking for all `.yml` files in the `infra/circleci_orbs` directory:
  - The name of the file (dropping the extention) is used as the name of the orb
  - The `description` key in the orb
  - The `commands` in the orb
    - Examples in the form of valid markdown as comments within the command definition
    - The `description` key
    - The `parameters` key
  - The `jobs` in the orb
    - Examples in the form of valid markdown as comments within the command definition
    - The `description` key
    - The `parameters` key

When creating a new orb, be sure to include all of the above items including examples and then run the `make_docs.sh`
script before opening a PR.

## Resources

- [Orb docs](https://circleci.com/docs/2.0/orb-intro/)
