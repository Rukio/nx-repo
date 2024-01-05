# EDD: Adopt Vite as the default library for frontend tooling

**Authors:**

- [César Landeros](cesar.landeros@*company-data-covered*.com)
- [Kevin Anderson](kevin.anderson@*company-data-covered*.com)
- [Hugo Ramírez](hugo.ramirez@*company-data-covered*.com)

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)

## Resources

Supporting designs:

- [EDD: Remove CRA dependency from caremanager frontend](https://*company-data-covered*.sharepoint.com/:w:/r/sites/tech-team/_layouts/15/doc2.aspx?sourcedoc=%7B550922B8-7428-4EF1-B4FF-38B012521B22%7D&file=Remove%20CRA%20dependency%20from%20the%20frontend.docx&action=default&mobileredirect=true&DefaultItemOpen=1&ct=1686080950270&wdOrigin=OFFICECOM-WEB.MAIN.REC&cid=2ada5c69-626c-467c-929b-31bb92cb0ffd&wdPreviousSessionSrc=HarmonyWeb&wdPreviousSession=e0d28da3-872c-499c-8be6-30872b150e6d)
- [Pull Request: CRA to Vite](https://github.com/*company-data-covered*/caremanager-frontend/pull/644)

## Glossary

- [CRA](https://create-react-app.dev): Create React App, a popular js module for rapidly building full working react apps.
- [NextJS](https://nextjs.org) A popular React framework.
- [Remix](https://remix.run) Another full stack web framework.
- [Vite](https://vitejs.dev): "Next Generation Frontend tooling".
- [Webpack](https://webpack.js.org): JS module bundler.

## Overview

This document aims to provide options for choosing a path forward for frontend tooling. There are some weaknesses with the existing frontend projects:

- They take a significant time to build and test, which in turn causes the existing CI/CD pipeline to suffer from memory issues. This is bound to get worse as more frontend projects are added to the services monorepo.

- There is a need to update some frontend projects built with CRA, which report a number of vulnerabilities since CRA is discontinued and no longer recommended by the official React team.

## Goals

- Reduce time and resources needed to build and test frontend projects.
- Enhance development speed with faster startup times and rapid reloading.
- Ease of development by providing a simplified configuration.
- Reduce vulnerabilities by migrating existing CRA projects.

## Design Proposals

The main proposal of this document is to adopt Vite as the default frontend tooling for frontend projects, both existing and future ones. The transition from Webpack to Vite can be a beneficial move for projects seeking faster development iterations, improved performance, and simplified configuration.

Most existing frontend project use Webpack, which has a mature ecosystem and is suitable for complex projects. However, since speed, rapid feedback cycles, and a streamlined development experience are desired, Vite presents a powerful solution.

### Proposal 1 - Use Vite for new projects and consider migrating old ones - Recommended

Vite is a modern tool for building JavaScript apps. It is very easy to set up, very popular, and has a large community with a good support.

Compared to alternatives such as NextJS or Remix, migrating to Vite requires the least number of changes to the overall app code. Its only job is to build the app and provide a dev server, which it is very fast at doing. Vite's open source community has provided fixes and plugins for common problems like Typescript integration, coverage for Cypress test runs, etc. They also have a replacement for Jest so you don’t have to setup another build step to make Jest run Typescript tests.

Some examples for the community libraries are:

- [aleclarson/vite-tsconfig-paths](https://github.com/aleclarson/vite-tsconfig-paths): Support for TypeScript's path mapping in Vite.
- [iFaxity/vite-plugin-istanbul](https://github.com/iFaxity/vite-plugin-istanbul): A Vite plugin to instrument code for nyc/istanbul code coverage. In similar way as the Webpack Loader istanbul-instrumenter-loader. Only intended for use in development.

Pros:

- Very efficient build process: Vite just strips Typescript code and provides the files as MJS modules instead of a fat bundle. Steps in the CI pipeline, like linting, are skipped. This makes the bundling of the app super-fast.
- Faster development server: Vite's development server leverages native ES module imports and adopts an on-demand compilation approach. This results in significantly faster startup times, near-instantaneous hot module replacement (HMR), and rapid reloading during development. The speed of the development server can greatly enhance the developer experience and boost productivity.
- Language-level support: Vite offers native support for languages like TypeScript, Less, Sass, and Stylus, without requiring additional configuration or plugins. This makes it convenient to work with different languages and pre-processors, allowing developers to focus on writing code rather than managing tooling setup.
- Easy to setup (minimal config)
- Good community support
- Updated frequently
- Easy integration with Nx for the services monorepo

Cons:

- Vite is maintained by their community, although very active and productive, it gives no guarantee that it will not be abandoned just like CRA, which is also a community maintained tool.
- Learning Curve for Existing Webpack Users: If you or your team are already familiar with Webpack, transitioning to Vite may involve a learning curve.
- Limited Browser Support: Vite utilizes native ES module imports, which may have limited support in older browsers. If support is needed, additional workarounds or transpilation may be necessary to ensure proper functioning. A possible solution is to use [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy). More info at the [official vite documentation](https://vitejs.dev/guide/migration.html#modern-browser-baseline-change).
- The build system can’t be used to build files for Jest tests, but their solution, “Vitest” is a drop-in replacement that just uses the already existing Vite config, so no extra config needs to be done for running tests. Also, many Jest libraries seem to work fine with it. We are listing this as a con just because it will require teams to check and run the test suite to see if the tests work or need adjustments.
- There can be special cases per project in which adopting vite could prove difficult due to something that is not compatible. In the end if a project must stay with webpack or whatever tool it uses it can be done, having Vite as the default doesn't mean that absolutely all projects must adhere to it.

In summary, transitioning from Webpack to Vite can unlock significant benefits in terms of development speed, performance, and configuration simplicity. Vite's fast development server, optimized builds, language-level support, and flexible plugin system provide a compelling solution for projects seeking an efficient and streamlined frontend tooling experience. The move to Vite can enhance developer productivity, improve application performance, and simplify the overall development process.

### Proposal 2 - Next.js

Next is a fully featured framework for React apps, it is mostly designed to run in a live server and serve frontend apps as the clients request it, but it is totally capable of working with single page apps like some of the services projects. It has the best support overall, mainly because the React team and Vercel’s (the company that maintains Next.js) collaborate very closely with each other to improve both React and Next.js, so the features that Next.js provides are very well optimized and maintained.

Being a React framework, it carries the issue of been very opinionated about how to build React apps, so there are a lot of new APIs to be learn and architecture changes that existing projects may not support at the moment.

Pros:

- Very fast (they are even making a lot of improvements on their bundlers and compilers, which are written using languages like rust, to make things even faster).
- Good community support.
- Updated frequently .
- Includes some support for jest tests, although we still have to add the normal jest setup for running tests written in typescript.

Cons:

- Requires more effort to setup
- Requires some architecture changes as well as changes of how some components will work (for example the router and authentication in CareManager).
- We are anticipating some effort to integrate it with the monorepo and Nx (although Nx seems to work fine with servers like Nest.js, there are no Next.js app there yet)

### Proposal 3 - Remix

Remix is a very new React js framework, getting popularity very fast and also getting props for being fast at building apps and a great developer experience. Sadly this is another react framework, which is also very opinionated, which can result in projects needing to update or rebuild many of their components and parts of the architecture.

Pros:

- Very fast.
- A well-regarded proponent of better practices for building web apps.
- Good community support.
- Updated frequently.

Cons:

- Requires more effort to setup
- Projects would need drastic changes at how to access environment variables since there is no bundle when using Remix.
- Has no implicit support for Jest, so the basic support for TS test files in Jest has to be added.
- Same as with Next.js, there will be most likely some effort needed to use Remix alongside Nx for the monorepo integration.

### Proposal 4 - Leaving existing projects intact and keep using Webpack.

The final option is to not migrate to any new tool and keep using Webpack. For most projects this proposal represents the least amount of effort.

The only migration needed would be for those frontend apps that keep using CRA since they are vulnerable and it will just keep getting worse. These projects must eject CRA since it's practically unmaintained and rely on webpack.

Pros:

- No extra effort needed for existing Webpack projects.
- The migration to Webpack is needed only for those CRA apps in critical condition.
- Webpack has been around for a long time, it's well documented, well tested and it has a robust support by the community.
- Current teams do not need to spend time learning a new way of doing things.

Cons:

- The NX monorepo will keep suffering from long build times and memory issues, and it will get worse with new projects.
- The development cycle is still slow compared to a faster solution like Vite, since it takes longer to preview code changes in the browser.
- More effort needed to configure new projects and to migrate those that need to stop using CRA.
- Apps using CRA, which uses webpack, must deal with updating and maintaining CRA, or eject CRA and then update and maintain webpack independently, which is laborious and prone to inconsistencies across projects.

## Platform Components

The migration to Vite is on a per project basis and there isn't anything that can be shared across projects; the same applies for new projects.

## Data Design & Schema Changes

No data or schema changes needed.

## Metrics & Data Integration

No changes to metrics or data integration.

## Error Handling & Alerting

The same error handling and alerting

## Safety

No extra safety concerns.

## Security

No security concerns added by using Vite. On the contrary, existing CRA apps will benefit from moving to a more secure and more maintained solution.

Regarding supply chain attacks, this is something that could happen to any tool we choose. Keeping our apps up to date and addressing all snyk alerts should mitigate this problem.

## Audits and Logs

No additional audit and log efforts necessary, the same solutions already in place for each project will remain intact.

## Scalability

No scalability issues in sight.

## Cost

No additional costs, on the contrary, adopting a lighter solution like Vite should result in less resources needed for our CI/CD pipelines.

## Experimentation

There isn't a feasible way to put this migration behind a feature flag since it involves migrating each application as a whole.

## Testing

Testing should be done on a per project basis using our staging environments to ensure everything works correctly before deploying to production.

## Training

No user training needed since no user experience will be changed. Regarding development, Front-End developers will need to be aware of how Vite works and how to use Vitest to write tests, which shouldn't be an issue since the API is fairly similar to what it's already in place.

## Deployment

The same deployment flows will work after the migration. Nx will be configured to default to Vite, but apps can migrate as time allows because Nx supports separate executors for each project.

## Lifecycle management

Although all of these tools are actively maintained with no danger of being deprecated in sight, there's always the possibility that they could be abandoned at any point. We always should be on the lookout for new technologies and trends.
