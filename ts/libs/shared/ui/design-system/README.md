# _company-data-covered_ Design System

React components for building frontend applications at _company-data-covered_.

## Resources

<!-- TODO: [DSYS-136] Add Storybook to services repo link once implemented -->

- [Figma of MUI components](https://www.figma.com/file/MSWEDJjUGA2CbY9mf0tRov/*company-data-covered*---MUI---WIP?node-id=4662%3A14)
- [Design System Jira board](https://jira.*company-data-covered*.com/projects/DSYS/issues/DSYS-62?filter=allopenissues)
- [Design System Slack Channel](https://dh-techteam.slack.com/archives/C04AU02EY5P)

## Using the Design System

The design-system can be used directly from within the services repository. If using outside of the services repository, it must be installed as an NPM package:

To install:

```sh
# NPM
npm install @*company-data-covered*/design-system

# Yarn
yarn add @*company-data-covered*/design-system
```

### Install the System Font

<!-- TODO: [DSYS-133] Fix issues preventing these steps from happening automatically -->

This is a one-time setup needed to load the font files. Font files should get added to the compiled package in the future and this step will no longer be necessary when that work is complete.

Add Open Sans to your package.json as a dependency from [@fontsource](https://fontsource.org/docs/getting-started). This step is already complete for the services repository.

```sh
# Yarn
npm install @fontsource/open-sans

# Yarn
yarn add @fontsource/open-sans
```

From within your app entry file, page or site component, import it in. E.g. `_app.jsx` or `index.jsx` etc.

```js
import '@fontsource/open-sans';
```

CSS font-family values are already set in the design system.

### Initial Setup

Wrap your App component inside ThemeProvider and pass theme as a prop to it:

```jsx
import { theme, ThemeProvider } from '@*company-data-covered*/design-system';

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>;
```

To import components:

```jsx
import {
  Typography,
  HomeIcon,
  useStyles,
} from '@*company-data-covered*/design-system';
```

The Design System provides its own version of `normalize.css`, `CssBaseline`, a component that provides an elegant, consistent, and simple baseline to build upon.

To import it use:

```jsx
import { CssBaseline } from '@*company-data-covered*/design-system';
```

and then add it below ThemeProvider

```jsx
import {
  theme,
  ThemeProvider,
  CssBaseline,
} from '@*company-data-covered*/design-system';

<ThemeProvider theme={theme}>
  <CssBaseline />
  <App />
</ThemeProvider>;
```

### Styling

Generally the Design System components should not require custom styling. However, some utilities like Box, Grid components may require additional styling to align with designs. In this case, ALL styling of the component should be via the `SxProps` using design-system theme variables where they exist. There should not be any other methods to style the component.

#### Icons

Our currently available Icons can be found in the Storybook instance linked under [Resources](#resources). If your work requires any MUI icon not in the design system, it can be added following the [contribution process](#contribution).

### Station Caveats

Please see documentation [here](https://github.com/*company-data-covered*/station#design-system-setup) for caveats on using the design system in Station.

## Contribution

### Overview

Types of contribution:

- A fix of a defect. While mostly relevant to code (like an IE11 bug), this also extends to an erroneous Figma library symbol label or doc site’s guideline.
- A small enhancement where an architecture otherwise remains stable, such as adding an alert color (orange for “new”) to an existing set (red for “error,” green for “success,” and so on).
- A large enhancement extends an existing feature, such as an alert’s dismissibility, description, and position (inline, block, or viewport-locked).
- A new feature is self-evident, such as adding a new alert component.

Design system contributions follow a [PROPOSE](#propose) -> [CODE](#code) -> [RELEASE](#release) process.

#### Propose

Ask in the Design System Slack channel if you're not sure that the component, hook, icon should be added to the design system. It is possible that the functionality you need already exists. Also, developers should be aware that designs for feature work should use the existing Design System components and theme. Therefore, if a developer sees a design that does not match the existing design system, they should raise this issue with the designer before assuming a new proposal to change the Design System is required.

After confirming the proposed change is needed, create new Jira task ticket with required details:

- In the description of ticket add two headings, 'Original Description' and 'Revised Description'
- Include links to screenshots and Figma design if visual component
- Include links to screenshots or to existing MUI hook, component, icon
- Include functional requirements for development
- The Revised Description will be completed after all discussion is completed if it is needed
- Request a review of the Proposal in the Design System Slack channel and provide link to the Jira ticket

Note: adding new Icon Components and/or non-component additions do not require a proposal approval.

#### Code

Code: Jira ticket for new 'Contribution' is assigned to engineer(s) and merged into component repo after successful review/approval. Typically, the team who needs the proposed feature will be first in line to implement the work.

1. Create new branch off `trunk` named with the following pattern: `DSYS-<ticket number>-short-feature-description`
2. Create files and implement component, documentation, and tests.
3. Open a pull request and announce in the Design System Slack channel
   - The code owners will automatically be added to the PR.

#### Release

Publishing a new version of the Design System package happens manually and can be triggered in GitHub actions from the trunk branch. The version does not get auto-incremented, so it must be updated in a PR that is merged to `trunk` for the publish job to succeed.

### Adding New Components

To add components, create a new directory under the `src/components`. Inside of that directory:

1. Create an `index.js` file that exports the component
2. Create a stories directory, `__storybook__`
3. Within stories create a `<Component Name>.stories.jsx` file. Confirm the setup works with 'Controls' by [running storybook locally](../../../../README.md#storybook). The controls are the basic way a user will interact with the component/icon to see what/how its used.
4. Create a tests directory, `__tests__`
5. Within the tests directory, create a `<Component Name>.test.jsx` file
6. Export the component from the component's directory in `<design-system root>/src/lib/index.js`
7. Commit changes

To add icons, create a new directory under the `src/lib/icons`. Inside of that directory:

1. Create an `index.ts` file that exports the icon
2. Add icon to `src/lib/icons/All/__storybook__/AllIcons.stories.tsx` so it is included in the story and tested.
3. Run test and update snapshots from command line with `npx nx test design-system --watch -u`
4. Export icon from `src/lib/index.ts` so it is accessible when published
