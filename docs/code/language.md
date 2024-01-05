# Monorepo Supported Code Languages and Frameworks

## General

Without extenuating circumstances, all backends should be written in [go](https://go.dev/). This helps us achieve a level maintainability and support throughout the organization.

## Backend

- Go
  - All future backends should use Go

### Exceptions

#### Grandfathered Codebases

Exceptions will be made for codebases that existed prior to the monorepo and that will be imported into this monorepo.

Imported code will be migrated into a special "grandfathered" subdirectory, and aim to merge into the main monorepo as we build out needed components.

- NodeJS in TypeScript
  - [Companion API](https://github.com/*company-data-covered*/companion-api)
  - [Onboarding API](https://github.com/*company-data-covered*/onboarding-api)

#### Available Technology

Exceptions will be made for limited use of third-party software packages/technology not easily available in other languages.

- Java
  - [Optaplanner](https://www.optaplanner.org/)

#### Policy

## Frontend

- TypeScript
  - React
  - Cypress
    - Test code
