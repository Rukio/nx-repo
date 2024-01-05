# TypeScript

## Nx Build System

The services monorepo uses the Nx build system to manage TypeScript projects. It uses plugins to help with application management for common workflows in TypeScript applications. Nx has their own [official packages](https://nx.dev/packages) and also support the building of custom plugins and generators.

### Useful References

- [Intro to Nx](https://nx.dev/getting-started/intro)
- [Nx Configuration](https://nx.dev/configuration/projectjson)

### Upgrading Nx

Nx performs its own migrations using the `nx migrate` CLI. For more details, see [Nx - Automate Updating Dependencies](https://nx.dev/core-features/automate-updating-dependencies).

Note: It is recommended to keep the generated `migrations.json` file checked-in after migrating so it can be run for any branches that are out of sync. It will be regenerated each time the migration CLI is used. The file can be run using `npx nx migrate --run-migrations`.

### Generation

Nx build system promotes using generators to create consistency across TypeScript applications.

Examples of generation commands:

```sh
# Generate a React application
npx nx generate @nx/react:app \
  --name my-react-app

# Generate a React library
npx nx generate @nx/react:lib \
  --name my-react-lib

# Generate a TypeScript library
npx nx generate @nx/js:lib \
  --name my-ts-lib

# Generate a publishable TypeScript library
npx nx generate @nx/js:lib \
  --name my-publishable-ts-lib \
  --importPath @*company-data-covered*/my-publishable-ts-lib
```

After generating a project, add a `typecheck` target by running the [DispatcHealth typecheck generator](./libs/plugins/core/README.MD#typecheck).

### Applications and Libraries

Relevant references:

- [Nx: Applications and Libraries](https://nx.dev/more-concepts/applications-and-libraries)
- [Nx: Library Types](https://nx.dev/more-concepts/applications-and-libraries)
- [Nx: Grouping Libraries](https://nx.dev/more-concepts/grouping-libraries)

Nx proposes a distinctive separation between applications and libraries:

> A common mental model is to see the application as "containers" that link, bundle and compile functionality implemented in libraries for being deployed. As such, if we follow a 80/20 approach:
>
> - place 80% of your logic into the `libs/` folder
> - and 20% into `apps/`
>
> Note, these libraries don’t necessarily need to be built separately, but are rather consumed and built by the application itself directly. Hence, nothing changes from a pure deployment point of view.

The services monorepo follows the Nx recommended structure using the following library types:

- Feature libraries:

  Developers should consider feature libraries as libraries that implement smart UI (with access to data sources) for specific business use cases or pages in an application. Most feature libraries will likely be application specific, but a good example of a shared feature library could contain a workflow that is shared across multiple applications. At Dispatch Health, there are multiple applications that contain insurance image upload workflows which could be a good candidate for a feature library.

  Tag: `type:feature`

  Naming convention:

  - `feature` assuming it is nested in a grouping folder and contains all features. This will be more common for smaller applications.
  - `feature-*` for specific features (e.g., feature-home). This will be more common for larger applications.

- UI libraries:

  A UI library contains only presentational components (also called "dumb" components). A good example of this at Dispatch Health is the design-system.

  Tag: `type:ui`

  Naming convention:

  - [Preferred] `ui` assuming it is nested in a grouping folder.
  - `ui-*` for specific ui components (e.g., ui-buttons).

- Data-access libraries:

  A data-access library contains code for interacting with a back-end system. It also includes all the code related to state management. Data-access libraries could be used to create shared API adapters for APIs that are called by multiple applications.

  Tag: `type:data-access`

  Naming convention:

  - [Preferred] `data-access` assuming it is nested in a grouping folder.
  - `data-access-*` for specific data-access (e.g., data-access-station).

- Utility libraries:

  A utility library contains low-level utilities used by many libraries and applications. The large majority of these libraries will likely be shared, but there might be a case for an application specific utility library. A good example could be a shared formatting library concerned with formatting dates, times, strings, etc.

  Tag: `type:util`

  Utility libraries should be very specific to their purpose. Please see [Avoid package names like base, util, or common](https://dave.cheney.net/2019/01/08/avoid-package-names-like-base-util-or-common).

  Naming convention:

  - [Preferred] `<topic specific name>` assuming it is nested in a grouping folder.
  - `util-*` for specific utility methods (e.g., util-formatting).

- Nest

  A Nest Library contains a sharable NestJS module. Nest libraries live in their own directory under `libs/`. A good example of this is the nest-datadog library that is currently in use.

  Note: new TypeScript backends are not supported at Dispatch Health. NestJS libraries should only be created to support the two existing NestJS applications: [Companion API](https://github.com/*company-data-covered*/companion-api) and [Onboarding API](https://github.com/*company-data-covered*/onboarding-api). For more information, see the [code language documentation](../docs/code/language.md#grandfathered-codebases).

  Tag: `type:nest`

  Naming convention:

  - `<topic specific name>` assuming it is nested under `ts/libs/nest/`.

An example directory structure would look like this:

```text
ts
├── apps
│   └── example-app
└── libs
    ├── example-app                   <--- grouping folder
    │   ├── data-access               <--- library
    │   ├── feature                   <--- library
    │   └── ui                        <--- library
    └── shared                        <--- grouping folder
        ├── some-shared-application   <--- grouping folder
        │   └── data-access           <--- library
        └── util                      <--- grouping folder
        │   └── formatting            <--- library
        │   └── dates                 <--- library
```

The application in the above case, example-app, would only contain the files necessary to compose the application. For some larger applications, the `feature` library might be further split up into more specific libraries, `feature-*`, instead of a single `feature` library.

To generate a nested, React library for `example-app`:

```sh
npx nx g @nx/react:lib data-access \
  --directory="example-app" \
  --tags type:data-access,scope:shared
```

The above snippet adds a project called `example-app-data-access` to the workspace located under `ts/libs/example-app` and importable from `@*company-data-covered*/example-app/data-access`.

To generate a nested, shared utility library:

```sh
npx nx g @nx/js:lib formatting \
  --directory="shared/util" \
  --tags type:util,scope:shared
```

The above snippet adds a project called `shared-util-formatting` to the workspace located under `ts/libs/shared/util` and importable from `@*company-data-covered*/shared/util/formatting`.

### Module Boundaries

Relevant references:

- [Nx- Enforcing Project Boundaries](https://nx.dev/core-features/enforce-project-boundaries)

Module boundaries are enforced by Nx via an ESLint rule. It utilizes project tags to keep appropriate boundaries between projects. This increases the ability to enforce application and library structure in a scalable manner.

Currently, this repository enforces boundaries using the following tag namespaces:

- `scope:*`: The access scope of the project. This usually corresponds to application scopes. It can also be "shared" using `scope:shared`.

  - Applications are able to access the scopes of other applications, but it must be specifically declared in the ESLint configuration.

    ```json
    {
      "sourceTag": "scope:application-one",
      "onlyDependOnLibsWithTags": [
        "scope:application-one", // own application scope
        "scope:application-two", // dependent application scope
        "scope:shared" // any shared scope
      ]
    }
    ```

- `type:*`: The project type (e.g., application, library type):
  - `type:app`
  - `type:ui`
  - `type:data-access`
  - `type:feature`
  - `type:util`
  - `type:nest`

The rules for this repository are defined in the base [.eslintrc.json](../.eslintrc.json).

Projects without tags will not be able to use libraries, so it is encouraged to add them during generation with the `--tags` CLI parameter. They can also be added after generation in the `"tags"` field of the `project.json` file for the project.

### Creating a Publishable Library

Publishable libraries allow projects that are not in the services monorepo to share in the benefits of code reuse. Multiple Nx plugins support generating [publishable libraries](https://nx.dev/more-concepts/buildable-and-publishable-libraries#publishable-and-buildable-nx-libraries) for this exact purpose.

All _company-data-covered_ packages are published to and consumable from the Github Packages repository. They should be scoped to `@*company-data-covered*` to support this.

The examples below will be using the `@nx/react` plugin, but the same is possible with other plugins.

#### Generate the initial library

Run:

```sh
npx nx g @nx/react:lib example-lib \
  --importPath=@*company-data-covered*/example-lib \
  --directory="shared" \
  --buildable \
  --tags type:ui,scope:shared
```

Notes:

- the `--publishable` flag is omitted on purpose here. It generates a script to publish a package that is not necessary at this time.
- the `--directory` flag is added here to demonstrate that libraries can be placed under directories within the `libs` directory. It is not required.

#### Modify the generated library

Add a `publish` target to the project.json file for the generated library to allow Nx to publish this package:

```json
{
  "name": "example-lib",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "ts/libs/shared/example-lib/src",
  "projectType": "library",
  "targets": {
    // ...
    "publish": {
      "executor": "nx:run-commands",
      "dependsOn": [
        {
          "target": "build"
        }
      ],
      "options": {
        "cwd": "dist/ts/libs/shared/example-lib",
        "command": "npm publish"
      }
    }
  }
}
```

Add the repository details to the package.json for the generated library to allow the published package to inherit access permissions from this repository:

```json
{
  "name": "@*company-data-covered*/example-lib",
  "version": "0.0.1",
  "type": "commonjs",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/*company-data-covered*/services.git",
    "directory": "ts/libs/shared/example-lib"
  }
}
```

Add an entry for the new library in [manual_publish_npm_pkg.yaml](/.github/workflows/manual_publish_npm_pkg.yaml):

```yaml
on:
  workflow_dispatch:
    inputs:
      project_name:
        ...
        options:
          - ...
          - example-lib
```

After merging these changes to `trunk`, the library can be published by triggering the corresponding [GitHub Action](https://github.com/*company-data-covered*/services/actions/workflows/manual_publish_npm_pkg.yaml).

## Storybook

The use of Storybook is encouraged for UI libraries. The services repository is already configured for Storybook globally, so it can be added to any project as needed.

```sh
# configure a project for Storybook
npx nx g @nx/storybook:configuration example-library-ui --uiFramework=@storybook/react --tsConfiguration=true

# run Storybook
npx nx run example-library-ui:storybook

# build Storybook
npx nx run example-library-ui:build-storybook

# generate a story for all components within a project
npx nx g @nx/react:stories example-library-ui

# generate a story for a specific component within a project
npx nx g @nx/react:component-story example-library-ui --componentPath="path/to/component/ExampleComponent.tsx"
```

Note: The `componentPath` is based from the `src` directory of the project.

More detailed documentation of the Nx Storybook package can be found [here](https://nx.dev/packages/storybook). The `@nx/react` package also has several Storybook related generators which are detailed [here](https://nx.dev/packages/react#generators).

## Storybook Deployment

The monorepo uses a separate [Storybook Host](./libs/shared/ui/storybook-host/) library that contains stories from all UI libraries. Storybook Host is being deployed automatically via Github Actions when any changes in UI library are merged into trunk. [The workflow can be found here](../.github/workflows/deploy_storybook_host.yml)

Storybook Host in Github Pages: https://_company-data-covered_.github.io/services

## Application Deployment

FE Applications at _company-data-covered_ are typically deployed using a combination of AWS resources: S3, CloudFront, and LambdaEdge.

The first step in deploying an application is to create the AWS resources for each environment the application needs to be deployed to. All non-production resources are added to the staging AWS account. All production resources are added to the production AWS account. An example PR for adding these resource can be found [here](https://github.com/*company-data-covered*/services/pull/1802).

The next step need add your static app name to CI workflow `.github/workflows/manual_deploy_static_ts_app.yml` file to options on line 50
