# EDD: Brief Summary of Design

**Author:** Lucas Peterson lucas.peterson@_company-data-covered_.com

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM

## Glossary

- Auth0 Universal Login - A login feature provided by Auth0 that allows applications to share a custom, branded login page.
- CAPTCHA (Completely Automated Public Turing test to tell Computers and Humans Apart)
- Design System - A Dispatch Health library built with Material UI for FE design
- FE (Frontend)
- OSS (Online Self-Scheduling)
- OTP (One-time password)
- PHI (Protected Health Information)
- Pre-login PHI - Information collected in OSS that can be considered
- UI (User Interface)

## Resources

[PRD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EaELV-RUeeZDjHmUIv17aKcBKJRufaUcph3EmlzvYZNTWA)

[Figma - WIP](https://www.figma.com/file/n8WkWJweyzqe78TEoKhQLX/Patient-Accounts?type=design&node-id=839-18827&t=2Ux9vBBZp6Sfd5fC-4)

[Patient Accounts EDD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EQacNNZUlttAjvFU9vsu8GUB6gsK1VuIQVGEGjR7dITEyg) - Previously Approved

## Overview

This document covers the implementation method of the login UI for patient portal login. This login will be used across multiple applications and various user workflows.

## Goals

- Determine where/how the UI for patient portal login will be implemented
- Allow the UI to be customizable for multiple user experiences
  - Use case dependent copy is the primary goal
- Maintain a high level of security in line with _company-data-covered_ and industry security practices
  - Bot detection is a desired security measure
- Easily match desired design and UX
- Ability to save pre-login PHI in OSS (and potentially other applications)
  - Context: an application using React will typically store PHI in state which does not persist through navigation or page reload without storing it. Due to the information being PHI, it _should_ not be sorted in the browser's local storage. Without a token received from login, the information would have to be saved server-side via an unsecured endpoint.
- Support use of both OTP and magic links via email

## Design Proposals

### Login UI

#### 1 - Auth0 Universal Login With Classic Templates

[Classic Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login/classic-experience) is the older, more established login experience available in Auth0. It leverages the [Lock](https://auth0.com/docs/libraries/lock/lock-ui-customization) template engine which allows configuring a branded look and feel to the page.

Pros:

- Lower maintenance than [custom](#3---auth0-universal-login-with-custom-ui) or [embedded](#4---embedded-login) solutions
- Built-in responsive design
- Built-in Auth0 bot detection using Auth0 CAPTCHA

Cons:

- Least flexible of the available options. It does allow for some customization, but significantly less than [New Universal Login Templates](#2---auth0-universal-login-with-new-templates)
- Does not support use of the Design System
- Pre-login PHI must be saved server-side due to navigation away from the consuming application

#### 2 - Auth0 Universal Login with New Templates

[New Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login/new-experience) is the new login experience available in Auth0. It leverages the [Liquid](https://liquidjs.com/tutorials/intro-to-liquid.html) template engine to allow the customization of:

- Login widget/prompt: The copy and look and feel of the login form that shows on the page (text, colors, logos, fonts).
- Login page: The layout of the login page included placement of the widget.

Pros:

- Lower maintenance than [custom](#3---auth0-universal-login-with-custom-ui) or [embedded](#4---embedded-login) solutions
- Built-in responsive design
- Ability to custom font, copy, and limited design elements to get _close_ to the a _company-data-covered_ look and feel
- Built-in bot detection using Auth0 CAPTCHA

Cons:

- Less flexible than [custom](#3---auth0-universal-login-with-custom-ui) or [embedded](#4---embedded-login) solutions. It is not possible to customize to be use-case specific.
- Does not support use of the Design System
- Does not support the use of magic links
- Pre-login PHI must be saved server-side due to navigation away from the consuming application

#### 3 - Auth0 Universal Login with Custom UI - Recommended

Recommended reasoning: Given outstanding questions from AppSec about the [Embedded](#4---embedded-login) option and the lack of flexibility in the templated options for UX/UI, this option is recommended. At such time that the AppSec questions are resolved, this recommendation might be changed.

Universal Login, both new and classic, allow for a custom UI hosted in Auth0 to be used that is built in pure HTML, CSS, and JavaScript. This allows the page to use Bootstrap or similar FE toolkit. It leverages the Auth0 Web SDK to facilitate the login flow.

Parameters can be sent as part of the URL but using those parameters to update copy occurs after the page has loaded. To work around this, we'd need to implement a more complex loading pattern to hide the elements we need to update, like behind a loading spinner. This is possible using Bootstrap, but it increases the complexity of the implementation.

Due to a limitation with New Universal Login not supporting magic links, the Custom UI would have to be used with Classic Universal Login.

Pros:

- More flexible when compared to the templated login pages. Less flexible than [embedded](#4---embedded-login) login.
- Supports integrating bot detection using the CAPTCHA provided by the [Auth0 Web SDK](https://auth0.com/docs/secure/attack-protection/bot-detection/bot-detection-custom-login-pages)

Cons:

- More maintenance than the templated options.
- Code is separate from our the majority of our FE codebase. It would either be hosted in Auth0 or stored in terraform.
- Does not support use of the Design System so it would require custom CSS to match desired designs.
- Lower than desired support for use-case specific design.
- Pre-login PHI must be saved server-side due to navigation away from the consuming application.

#### 4 - Embedded Login

An embedded login page would allow each _company-data-covered_ application to build its own custom UI for the login that is hosted in the application itself. This could leverage shared, parameterized components that would scaffold the login but allow for customization tailored to the desired UX. It would need to leverage the Auth0 React SDK to facilitate the login flow.

Pros:

- Most flexible when compared to the other proposals. Each application can tailor the login UX to their application workflow and context
- Supports use of the Design System
- Allows storing of pre-login PHI
- Lives within the consuming application
- Supports use of Google reCAPTCHA bot detection

Cons:

- Cross-origin authentication. It is less secure to send credentials across origins and recommended by Auth0 not to use this method.
  - This risk can be [partially mitigated](https://auth0.com/docs/authenticate/login/cross-origin-authentication#limitations) by setting up an Auth0 Custom Domain which increases the security because the cookies are from the same top-level domain. The Auth0 tenant used for this project will have a custom domain that will be able to be leveraged. This mitigation solves cross-origic cookie concerns but does not solve that the authentication flow traverse multiple origins which will require CORS configuration(s).
- Does not support use of Auth0 bot detection.
- [BLOCKING] AppSec has open questions regarding the OAuth flow interaction with the application hosting the login form and Auth0
  - These questions are being attempted to be resolved. In the interest of unblocking the project, this is being listed as a blocking concern forcing another option to be chosen.

### Bot Detection

#### 1 - Google reCAPTCHA

Google reCAPTCHA is an industry standard CAPTCHA system.

There are two versions of reCAPTCHA available to use:

- v2: Interrupts the user flow with a traditional CAPTCHA test to detect bot users. Has an "invisible" option that tracks user behavior to only render a test for suspicious users.
- v3: Monitors interaction on the page to return a programmatic score when a user takes a specified action (i.e., clicking a login button) so the application can decide how to respond. It does not support user-flow interruptions so it is recommended to integrate into multiple pages to increase the amount of tracking data.

Pros:

- Industry standard
- Configurable CAPTCHA types

Cons:

- Cannot be integrated into Auth0 Universal Login without a Google reCAPTCHA Enterprise account (>= 1 million checks per month)

Recommended for the [Embedded Login UI Solution](#4---embedded-login) because that solution does not support Auth0 CAPTCHA.

#### 2 - Auth0 CAPTCHA

Auth0 exposes their own CAPTCHA technology that is available for use with the following [limitations](https://auth0.com/docs/secure/attack-protection/bot-detection#flow-limitations).

Pros:

- Configurable CAPTCHA types

Cons:

- Limited to Auth0 hosted pages

Recommended for Auth0 Universal Login solutions because those solutions are hosted in Auth0 and support the Auth0 CAPTCHA.

## Platform Components

This login workflow will initially be used in the following applications:

- Patient Portal
- Online Self-Scheduling

## Data Design & Schema Changes

N/A

## Metrics & Data Integration

Embedded login would use Datadog for metrics and monitoring.

Metrics integration with Auth0 would need to be investigated.

## Error Handling & Alerting

Error handling for login will be handling in standard FE development patterns.

## Safety

There are no safety concerns for this design.

## Security

As this design related to user login, security is a primary concern and it is one of the goals to design the login design to maintain a high level of security.

## Audits and Logs

If embedded login is used, it will need to be heavily audited.

If Auth0 Universal Login is used, Auth0 will handle the auditing.

## Scalability

N/A

## Cost

These should be no extra cost associated with this solution.

## Experimentation

There will be no experimentation for this solution.

## Testing

Embedded login: standard FE/BE testing following _company-data-covered_ standards

Auth0 hosted login: manual testing to verify implemented design

## Training

N/A

## Deployment

Universal login: deployed in Auth0 via terraform eventually

Embedded login: built in each consuming application

## Lifecycle management

There are no new technology choices associated with this design. Auth0 is an existing and established provider.
