# _company-data-covered_ CircleCI Orbs

This directory contains private orbs that _company-data-covered_ maintains.

- [Using an orb](#using-an-orb)
- [Contexts](#contexts)
- [Developer Guide](#developer-guide)
  - [Requirements](#requirements)
  - [Make an orb](#make-an-orb)
  - [Publish an orb](#publish-an-orb)
  - [Promote a dev orb to production](#promote-a-dev-orb-to-production)
  - [List available orbs](#list-available-orbs)
  - [Documenting orbs](#documenting-orbs)
  - [Resources](#resources)
- [Available Orbs](#available-orbs)
  - [Aptible](#aptible)
  - [Docker](#docker)
  - [Releasehub](#releasehub)

<!-- WARNING: This document is automatically created using the make_docs.sh script and should not be directly edited -->

# Using an orb

Add an `orbs` section to the CircleCI config and reference the orb needed like so:

```yml
orbs:
  <orb_name>: *company-data-covered*/<orb_name>@<orb_version>
```

The orb is now available to use its commands/jobs:

**Command**

```yml
orbs:
  <orb_name>: *company-data-covered*/<orb_name>@<orb_version>

jobs:
  my_job:
    docker:
      - image: <some_image>
    resource_class: <some_size>
    steps:
      - <orb_name>/<command>:
          <command_parameter1>: value1
          <command_parameter2>: value2

workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - <context_for_job1>
            - <context_for_job2>
```

**Job**

```yml
orbs:
  <orb_name>: *company-data-covered*/<orb_name>@<orb_version>

workflows:
  my_workflow:
    jobs:
      - <orb_name>/<orb_job>:
          <orb_parameter1>: value1
          <orb_parameter2>: value2
          context:
            - <context_for_job1>
            - <context_for_job2>
```

# Contexts

Many commands and jobs have expected environment variables. Contexts are entities in circleci that contain environment variables at an organizational or project level. These allow shared sets of secrets under a specified scope. Keep in mind, contexts can only be passed to jobs.

### Providing context to an orb job

Providing a context to a job:

```yml
workflows:
  my_workflow:
    jobs:
      - aptible/deploy:
          aptible_app_name: my_app
          docker_image: registry.*company-data-covered*.com/my_image:0.0.1
          context:
            - DH_REGISTRY
            - APTIBLE_ROBOTS
```

### Providing context to an orb command

To provide a command with a context, we must define a job that uses the command and provide the context to the job:

```yml
jobs:
  my_job:
    docker:
      - image: cimg/base:current
    steps:
      - aptible/setup
workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - APTIBLE_ROBOTS
```

### Available Contexts

- `DH_REGISTRY`
  - `DH_REGISTRY_PASSWORD`
  - `DH_REGISTRY_URL`
  - `DH_REGISTRY_USERNAME`
- `APTIBLE_ROBOTS`
  - `APTIBLE_LOGIN`
  - `APTIBLE_PASS`
- `AWS_KEYS`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_REGION`
  - `AWS_SECRET_ACCESS_KEY`
  - `CLOUDFRONT_DISTRIBUTION_ID`
  - `ENV`
- `DEPLOY_HALT`
  - `REMOVE_ME_TO_HALT_DEPLOYS`
- `AWS_CIRCLE_CI_USER_STAGING`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_REGION`
  - `AWS_SECRET_ACCESS_KEY`
- `AWS_CODEARTIFACT`
  - `REPOSITORY_DOMAIN`
  - `REPOSITORY_DOMAIN_OWNER`
  - `REPOSITORY_NAME`
  - `REPOSITORY_REGION`
- `STATION_STAGE`
  - `DH_REGISTRY_WRITE_PASSWORD`
  - `DH_REGISTRY_WRITE_USERNAME`
- `DATADOG_UAT`
  - `DD_DOGSTATSD_URL`
  - `DD_TRACE_AGENT_URL`
- `PAGERDUTY`
  - `PAGER_DUTY_API_TOKEN`
  - `PAGER_DUTY_EMAIL`
  - `PAGER_DUTY_SERVICE_ID_STATION`
- `CHECKMARX_SAST`
  - `CX_BASE_AUTH_URI`
  - `CX_BASE_URI`
  - `CX_CLIENT_ID`
  - `CX_CLIENT_SECRET`
  - `CX_TENANT`
- `AWS_CIRCLE_CI_USER_PROD`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
- `RELEASEHUB_CREDS`
  - `RELEASE_ACCOUNT_ID`
  - `RELEASE_LOGIN`
  - `RELEASE_TOKEN`
- `GITHUB_CREDS`
  - `GITHUB_TOKEN`
- `us-west-2`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_CLI_URL`
  - `AWS_REGION`
  - `AWS_SECRET_ACCESS_KEY`
- `AWS_ECR_PUSH_PULL`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_ECR_REGISTRY_ID`
  - `AWS_REGION`
  - `AWS_SECRET_ACCESS_KEY`

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

# Available Orbs

---

## Aptible

Aptible jobs and commands

Expects the usage of the `APTIBLE_ROBOTS` context to use the environment variables:

- `APTIBLE_LOGIN`
- `APTIBLE_PASS`

The following environment variables can be set (use DH_REGISTRY context):

- `DH_REGISTRY_USERNAME`
- `DH_REGISTRY_PASSWORD`

### Commands

#### `setup`

Install `aptible-cli` using `dpkg` and login.
Expects the following context: `APTIBLE_ROBOTS`

##### Parameters

None

##### Example Usage

```yml
jobs:
  my_job:
    docker:
      - image: cimg/base:current
    resource_class: small
    steps:
      - aptible/setup
workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - APTIBLE_ROBOTS
```

#### `deploy`

Deploy a docker image to an Aptible app.
Expects image to exist and `aptible-cli` to be installed and logged in.

##### Parameters

| PARAMETER                   | DESCRIPTION                                                                                                              | REQUIRED |          DEFAULT          |  TYPE  |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :------: | :-----------------------: | :----: |
| `app_name`                  | Name of the Aptible app to deploy the docker image to                                                                    |   yes    |             -             | string |
| `docker_image`              | The docker image to deploy (ex: registry._company-data-covered_.com/my_image:0.0.1)                                      |   yes    |             -             | string |
| `private_registry_username` | Username of the private docker registry that `docker_image` is pulled from. Defaults to the env var DH_REGISTRY_USERNAME |    no    | `${DH_REGISTRY_USERNAME}` | string |
| `private_registry_password` | Password of the private docker registry that `docker_image` is pulled from. Defaults to the env var DH_REGISTRY_PASSWORD |    no    | `${DH_REGISTRY_PASSWORD}` | string |

##### Example Usage

```yml
jobs:
  my_job:
    docker:
      - image: cimg/base:current
    resource_class: small
    steps:
      - ecr/ecr-login
      - run: echo "export DOCKER_PASS=$(aws ecr get-login-password --region us-east-1)" >> "$BASH_ENV"
      - aptible/setup
      - aptible/deploy:
          app_name: my-app
          docker_image: 651625208281.dkr.ecr.us-east-1.amazonaws.com/my_image:0.0.1
          private_registry_username: AWS
          private_registry_password: $DOCKER_PASS
workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - APTIBLE_ROBOTS
            - AWS_ECR_PUSH_PULL
```

#### `ssh_command`

Execute a command over ssh on an Aptible app.
Expects `aptible-cli` to be installed and logged in.

##### Parameters

| PARAMETER  | DESCRIPTION                            | REQUIRED | DEFAULT |  TYPE  |
| :--------- | :------------------------------------- | :------: | :-----: | :----: |
| `app_name` | Aptible app name to perform command on |   yes    |    -    | string |
| `command`  | Command to run on the Aptible app      |   yes    |    -    | string |

##### Example Usage

```yml
jobs:
  my_job:
    docker:
      - image: cimg/base:current
    resource_class: small
    steps:
      - aptible/setup
      - aptible/ssh_command:
          app_name: my-app
          command: bundle exec rake patients:cypress_delete_all
workflows:
  my_workflow:
    jobs:
      - my_job:
          context:
            - APTIBLE_ROBOTS
```

### Jobs

#### `deploy`

Install `aptible-cli` and login to deploy a docker image to an Aptible app.
Expects the context: `APTIBLE_ROBOTS`

##### Parameters

| PARAMETER                   | DESCRIPTION                                                                                                              | REQUIRED |          DEFAULT          |  TYPE  |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :------: | :-----------------------: | :----: |
| `aptible_app_name`          | Name of the Aptible app to deploy the docker image to                                                                    |   yes    |             -             | string |
| `docker_image`              | The docker image to deploy (ex: registry._company-data-covered_.com/my_image:0.0.1)                                      |   yes    |             -             | string |
| `private_registry_username` | Username of the private docker registry that `docker_image` is pulled from. Defaults to the env var DH_REGISTRY_USERNAME |    no    | `${DH_REGISTRY_USERNAME}` | string |
| `private_registry_password` | Password of the private docker registry that `docker_image` is pulled from. Defaults to the env var DH_REGISTRY_PASSWORD |    no    | `${DH_REGISTRY_PASSWORD}` | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - aptible/deploy:
          aptible_app_name: my_app
          docker_image: registry.*company-data-covered*.com/my_image:0.0.1
          context:
            - APTIBLE_ROBOTS
          environment:
```

#### `ssh_command`

Install `aptible-cli` and login to execute a command via SSH on an Aptible app.
Expects the following context: `APTIBLE_ROBOTS`

##### Parameters

| PARAMETER          | DESCRIPTION                                           | REQUIRED | DEFAULT |  TYPE  |
| :----------------- | :---------------------------------------------------- | :------: | :-----: | :----: |
| `aptible_app_name` | Name of the Aptible app to deploy the docker image to |   yes    |    -    | string |
| `command`          | The command to run in the Aptible app                 |   yes    |    -    | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - aptible/ssh_command:
          aptible_app_name: my_app
          command: bundle exec rake patients:cypress_delete_all
          context:
            - DH_REGISTRY
            - APTIBLE_ROBOTS
```

---

## Docker

This orb has been deprecated in favor of the [aws-ecr orb](https://circleci.com/developer/orbs/orb/circleci/aws-ecr) or the [official docker orb](https://circleci.com/developer/orbs/orb/circleci/docker)

### Commands

### Jobs

---

## Releasehub

Releasehub jobs and commands

The following environment variables are expected to be set (use the RELEASEHUB_CREDS context):

- `RELEASE_LOGIN`
- `RELEASE_TOKEN`
- `RELEASE_ACCOUNT_ID`

### Commands

#### `login`

Login to Releasehub
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

None

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - my_job:
          executor: releasehub-executor
          steps:
            - releasehub/login
          context:
            - RELEASEHUB_CREDS
```

#### `fetch_environment`

Fetch a list of current Releasehub environments for a given Releasehub app.
Parse the list and persist the current releasehub env in the `RH_OUTPUT_ENV` env var.
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

| PARAMETER     | DESCRIPTION                | REQUIRED |     DEFAULT      |  TYPE  |
| :------------ | :------------------------- | :------: | :--------------: | :----: |
| `app_name`    | Name of the Releasehub app |   yes    |        -         | string |
| `branch_name` | Name of the branch to use  |    no    | `$CIRCLE_BRANCH` | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - my_job:
          executor: releasehub-executor
          steps:
            - releasehub/fetch_environment:
                app_name: my-app
                branch_name: my-optional-branch-override
          context:
            - RELEASEHUB_CREDS
```

#### `create_or_update_environment`

Read persisted list of existing releasehub environments
Create a new release environment for the given circle branch if one doesn't currently exist
Additionally, if new environment, update env config with `auto-deploy=false` so all updates are handled only by the pipeline
After, deploy the latest changes to the existing environment
Persist the url of the releasehub environment in the `/persist/releasehub/env_url.txt` file
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

| PARAMETER     | DESCRIPTION                | REQUIRED |     DEFAULT      |  TYPE  |
| :------------ | :------------------------- | :------: | :--------------: | :----: |
| `app_name`    | Name of the Releasehub app |   yes    |        -         | string |
| `branch_name` | Name of the branch to use  |    no    | `$CIRCLE_BRANCH` | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - my_job:
          executor: releasehub-executor
          steps:
            - releasehub/login
            - releasehub/fetch_environment
                app_name: my-app
                branch_name: my-optional-branch-override
            - releasehub/create_or_update_environment:
                app_name: my-app
                branch_name: my-optional-branch-override
          context:
            - RELEASEHUB_CREDS
```

#### `delete_environment`

Delete the releasehub environment of the corresponding branch
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

| PARAMETER  | DESCRIPTION                | REQUIRED | DEFAULT |  TYPE  |
| :--------- | :------------------------- | :------: | :-----: | :----: |
| `app_name` | Name of the Releasehub app |   yes    |    -    | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - my_job:
          executor: releasehub-executor
          steps:
            - releasehub/login
            - releasehub/fetch_environment:
                app_name: my-app
                branch_name: my-optional-branch-override
            - releasehub/delete_environment:
                app_name: my-app
          context:
            - RELEASEHUB_CREDS
```

### Jobs

#### `fetch_environment`

Fetch a list of current Releasehub environments for a given Releasehub app.
Parse the list and persist the current releasehub env in the `RH_OUTPUT_ENV` env var.
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

| PARAMETER     | DESCRIPTION                | REQUIRED |     DEFAULT      |  TYPE  |
| :------------ | :------------------------- | :------: | :--------------: | :----: |
| `app_name`    | Name of the Releasehub app |   yes    |        -         | string |
| `branch_name` | Name of the branch to use  |    no    | `$CIRCLE_BRANCH` | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - releasehub/fetch_environment:
          app_name: my_app
          branch_name: my-optional-branch-override
          context:
            - RELEASEHUB_CREDS
```

#### `create_or_update_environment`

Read persisted list of existing releasehub environments
Create a new release environment for the given circle branch if one doesn't currently exist
Else, deploy the latest changes to the existing environment
Persist the url of the releasehub environment in the `/persist/releasehub/env_url.txt` file
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

| PARAMETER     | DESCRIPTION                | REQUIRED |     DEFAULT      |  TYPE  |
| :------------ | :------------------------- | :------: | :--------------: | :----: |
| `app_name`    | Name of the Releasehub app |   yes    |        -         | string |
| `branch_name` | Name of the branch to use  |    no    | `$CIRCLE_BRANCH` | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - releasehub/create_or_update_environment:
          app_name: my_app
          branch_name: my-optional-branch-override
          context:
            - RELEASEHUB_CREDS
```

#### `delete_environment`

Delete the releasehub environment of the corresponding branch
Expects the following context: `RELEASEHUB_CREDS`

##### Parameters

| PARAMETER     | DESCRIPTION                | REQUIRED |     DEFAULT      |  TYPE  |
| :------------ | :------------------------- | :------: | :--------------: | :----: |
| `app_name`    | Name of the Releasehub app |   yes    |        -         | string |
| `branch_name` | Name of the branch to use  |    no    | `$CIRCLE_BRANCH` | string |

##### Example Usage

```yml
workflows:
  my_workflow:
    jobs:
      - releasehub/delete_environment:
          app_name: my_app
          branch_name: my-optional-branch-override
          context:
            - RELEASEHUB_CREDS
```

---
