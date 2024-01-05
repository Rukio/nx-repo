# consumer-web-types

This library provides Typescript interface and types definitions for onboarding apps.

## Installation

To install:

```sh
# NPM
npm install @*company-data-covered*/consumer-web-types -D

# Yarn
yarn add @*company-data-covered*/consumer-web-types -D
```

## Usage

To use this module, import it into your app module as follows:

```typescript
import {
  CareRequest,
  ServiceLine,
} from '@*company-data-covered*/consumer-web-types';

const hasSecondaryScreenings = (careRequest: Partial<CareRequest>) =>
  careRequest.secondaryScreenings?.length || false;

const matchesScreeningRequirements = (
  serviceLine: ServiceLine,
  careRequest: Partial<CareRequest>
) => {
  const upgradeableWithScreening =
    serviceLine.upgradeableWithScreening || false;
  return hasSecondaryScreenings(careRequest) ? upgradeableWithScreening : true;
};
```

For details on all available methods, see [index.ts](./src/lib/index.ts).
