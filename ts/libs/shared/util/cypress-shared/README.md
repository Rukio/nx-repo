# _company-data-covered_ Cypress-Shared

This library contains Cypress helpers for building frontend integration and end-to-end tests.

## How to Add to a Project

Make sure you have a `.npmrc` file in the root of your repository. This step is [already implemented](../../../../../.npmrc) in the services repository and can be used as an example for other repositories.

Install the package (if adding to a project outside of the services repository): `npm install @*company-data-covered*/cypress-shared`

Import the library in the Cypress support file:

```typescript
// <Cypress source directory>/support/index.(js|ts)
import '@*company-data-covered*/cypress-shared';
```

Add `"@*company-data-covered*/cypress-shared"` to types (if adding to a project outside of the services repository):

```typescript
// <project root directory>/tsconfig.json
{
    "compilerOptions": {
      // ...
      "types": ["@*company-data-covered*/cypress-shared", "cypress"],
    }
    // ...
}
```

## Commands

<!-- TODO: [PT-1059] Move all documentation of specific commands to JSDoc and TypeScript types. -->

There are three types of Cypress custom commands.

- **Action**: reusable commands that "do something". (get an element, skip a test, get a radio option, etc)
- **Validation**: common and reusable commands used by elements to validate the FE (check text, href attributes, button is enabled, etc)
- **API**: commands that wrap API method calls used for test setup and modification (create a care request, create a shift, etc)

### API Commands

Below is a list of API Helpers that cypress-shared currently supports.

- **Core commands** are the API commands that should typically be used during testing.
- **Support commands** can be used but are typically already wrapped up in the other core commands

#### Core Commands

- `cy.setupCareRequestAssignment()`

  _Command that creates a shift, assigns it, and updates the care request status to en route. Should be the core helper in handling assignment_

  _After using, the engineer can use created shift info in their test by calling the `currentShiftsInfo` Cypress env var_

  To Use:

  ```typescript
  cy.setupCareRequestAssignment({
    assignmentInfo: {
      market: SUPPORTED_TEST_MARKETS.columbus,
      shifts: [
        { shifType: SHIFT_TYPES.acute_care, isVirtual: true },
        {
          shiftType: SHIFT_TYPES.telepresentation_virtual_app,
          isSelfShift: true,
          isTomorrow: true,
        },
      ],
      crId: myCareRequestId,
      loginUser: 'optimizer',
      endShiftsFirst: false,
    },
  }).then(() => {
    const myShiftInfo = Cypress.env('currentShiftsInfo')[0];
    /* myShiftInfo contains
        endTime, id, marketId, nearbyMarketIds, shiftMemberList, shiftType, startTime, vehicleId and vehicleName
      */
  });
  ```

- `cy.updateVehicleGeoLocation()`

  _Command that updates a vehicle's geo location, used particularly for the LV1 BE service and Rover testing_

  To Use:

  ```typescript
  cy.updateVehicleGeoLocation({
    id: myVehicleId,
    currentLat: TEST_MARKET.careRequestAddress.latitude,
    currentLong: TEST_MARKET.careRequestAddress.longitude,
  });
  ```

- `cy.archiveOpenCareRequests()`

  _Command that recursively archives open care requests. Used primarily to clean up queues for specific queue tests_

  To Use:

  ```typescript
  cy.archiveOpenCareRequests({
    statuses: ['on_scene', 'accepted'],
    marketIds: `${SUPPORTED_TEST_MARKETS.portland.id},${SUPPORTED_TEST_MARKETS.denver.id}`,
  });
  ```

- `cy.archiveCareRequest()`

  _Command that archives a care requests. Used primarily to clean up a care request after a test finishes_

  To Use:

  ```typescript
  cy.archiveCareRequest({ id: myCareRequestId });
  ```

- `cy.getCurrentUser()`

  _Command that returns the current logged-in user data_

  To Use:

  ```typescript
  cy.getCurrentUser().then((user) => {
    /* use current user */
  });
  ```

**Support Commands:**

- `cy.createVehiclesIfNotExist()`

  _Command that creates a suite of test vehicles if they currently don't exist in the given environment_

  To Use:

  ```typescript
  cy.createVehiclesIfNotExist({
    market: SUPPORTED_TEST_MARKETS.denver,
    count: 2,
  });
  ```

- `cy.createTestUsersIfNotExist()`

  _Command that creates a suite of test users if they currently don't exist in the given environment_

  To Use:

  ```typescript
  cy.createTestUsersIfNotExist({
    market: SUPPORTED_TEST_MARKETS.denver,
    shifts: [{ isVirtual: true }, { isSelfShift: true }],
    loginUser: 'admin',
  });
  ```

- `cy.createShiftDataIfNotExist()`

  _Command that creates a suite of test vehicles and users if they currently don't exist in the given environment_

  To Use:

  ```typescript
  cy.createShiftDataIfNotExist({
    market: SUPPORTED_TEST_MARKETS.denver,
    shifts: [{ isVirtual: true }, { isSelfShift: true }],
    loginUser: 'admin',
  });
  ```

- `cy.createShiftsIfNotExist()`

  _Command that creates a shift if it currently doesn't exist in the given environment_

  To Use:

  ```typescript
  cy.createShiftsIfNotExist({
    shifts: [{ shiftType: SHIFT_TYPES.acute_care, isVirtual: true }],
    market: SUPPORTED_TEST_MARKETS.denver,
    endShiftsFirst: true,
    loginUser: 'admin',
  });
  ```

- `cy.endAllShifts()`

  _Command that ends all shifts for a given market_

  To Use:

  ```typescript
  cy.endAllShifts({ id: SUPPORTED_TEST_MARKETS.denver.id });
  ```

- `cy.assignCareRequest()`

  _Command that assigns a care request to a specific shift_

  To Use:

  ```typescript
  cy.assignCareRequest({
    id: myCareRequestId,
    shiftId: myShiftId,
    assignTomorrow: false,
    assignVirtual: true,
  });
  ```

- `cy.updateCareRequestStatus()`

  _Command that updates a care request to the en route status_

  To Use:

  ```typescript
  cy.updateCareRequestStatus({ id: myCareRequestId, status: 'on_route' });
  ```

## Helpers

### EL

Method used to fetch elements for FE interaction and validation.

The provided string param must match the value of a `data-testid` attribute on the element desired.

To Use:

```typescript
import { el } from '@*company-data-covered*/cypress-shared';

const MY_DATA_TEST_ID_BUTTON = 'my-data-test-id-button';

el(MY_DATA_TEST_ID_BUTTON).isVisible();
```

### TimeoutOptions

Object used for explicit and implicit waits for consistent timeout options.

To Use:

```typescript
import { timeoutOptions } from '@*company-data-covered*/cypress-shared';

// Explicit Wait
cy.wait(timeoutOptions.MEDIUM_MS);

// Implicit Wait
el(MY_DATA_TEST_ID_BUTTON, { timeout: timeoutOptions.SHORT_MS }).isVisible();
```

### Intercept

Set of methods to be used by `interceptHelper.ts` files to help stub network requests.

To Use:

1. Import the `Intercept` helper:

   `import { Intercept } from '@*company-data-covered*/cypress-shared';`

2. Destructure Intercept Object

   ```typescript
   const {
     setBasePath,
     intercept,
     getGETRequestObject,
     getPOSTRequestObject,
     getPATCHRequestObject,
     getPUTRequestObject,
     getDELETERequestObject,
     getResponseObject,
   } = Intercept;
   ```

3. Set the Base Path for the project. Example: `setBasePath('/companion')`
4. Add intercepts using core `intercept` method. Provide a request and response object using the `getXRequestObject` and `getResponseObject` methods. Provide additional options, such as `pathname` for the Request and `body` or `fixture` for the Response

If using another method than `GET, POST, PATCH, DELETE` you can use the base `getRequestObject` method and provide another valid `HttpMethod`.

```typescript
import { Intercept } from '@*company-data-covered*/cypress-shared';

const { setBasePath, intercept, getGETRequestObject, getResponseObject } =
  Intercept;

setBasePath('/companion');

/* GET */
export const interceptGETCareRequestStatus = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: '**/status' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture: 'status' }),
    }),
  }).as('interceptGETCareRequestStatus');
```

### DateTime

Set of methods to be used for formatting Date and Time to a readable state

To Use:

1. Import

   `import { DateTime } from '@*company-data-covered*/cypress-shared';`

2. Destructure DateTime Object for desired method(s)

   `const { format, increment, subtract, getTimeZoneAbbrv, TODAYS_DATE, TOMORROWS_DATE, DATE_TIME_FORMATS } = DateTime`

3. Use helper method(s) to modify date times as needed

   ```typescript
   const myDateTime = new Date();

   //Format a Date Time
   format({
     dateTime: myDateTime,
     dateTimeFormat: DATE_TIME_FORMATS.YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE,
   });

   // Increase a date time
   increment({
   dateTime: myDateTime,
   duration: { days: 1 } },
   });

   // Subtract a date time
   subtract({
   dateTime: myDateTime,
   duration: { days: 1 } }, });

   // Get Time Zone of a date time
   formatWithTimeZone({
   dateTime: myDateTime,
   timeZone: 'Denver',
   dateTimeFormat = DATE_TIME_FORMATS.YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE});

   // Current date in the format 'yyyy-MM-dd'
   TODAYS_DATE;

   // Tomorrow's date in the format 'yyyy-MM-dd'
   DateTime.TOMORROWS_DATE;
   ```

### Request

Set of methods to be used by `/support/apiHelper/**` files to help make request calls for test setup

To Use:

Import the `Request` object:

```typescript
import { Request } from '@*company-data-covered*/cypress-shared';
```

Destructure the `Request` object for desired methods:

```typescript
const {
  sendGETRequest,
  sendPOSTRequest,
  sendPATCHRequest,
  sendPUTRequest,
  sendDELETERequest,
} = Request;
```

Add request methods using desired `sendXRequest` helper. Provide any additional options, such as `url` and `body` for the API Request.

If using another method than `GET, POST, PATCH, DELETE` you can use the base `sendRequest` method and provide another valid `HttpMethod`.

```typescript
import { Request } from '@*company-data-covered*/cypress-shared';

const { sendPOSTRequest } = Request;

function createPatient(patient: Record<string, unknown>) {
  return sendPOSTRequest({
    url: '/api/patients',
    body: patient,
  });
}
```

### Statsig

Set of methods to obtain and override the current list of Statsig feature gate and experiment values for the given environment

To Use:

Import the helper:

```typescript
import { Statsig } from '@*company-data-covered*/cypress-shared';
```

Create a new instance of the `Statsig` method while providing the valid `options`, `featureGateList` and `experimentList` params. After creating the new instance, make sure to call `yourStatsigInstance.initialize()` to initialize statsig.

```typescript
const statsigClientKey = Cypress.env('statsigClientKey') as string;

const statsigUser = null;
const statsigTier: StatsigEnvironment['tier'] =
  Cypress.env('statsigEnv') ?? 'development';
const statsigOptions: StatsigOptions = {
  localMode: true,
  environment: {
    tier: statsigTier,
  },
};
```

The value of `featureGateList` should each be an object with each key being a test name for the feature gate and each value referring to a valid Statsig feature gate.

- If there are no feature gates in your repro, provide an empty object `{}`.
- `experimentList` should each be an object with each key being a test name for the experiment and each value referring to a valid Statsig experiment .
  - If there are no experiments in your repro, provide an empty object `{}`.

```typescript
const myExperimentList: Record<StatsigOverrides.ExperimentKey, string> = {
  myTestExperiment1: 'my_test_experiment_1',
  myTestExperiment2: 'my_test_experiment_2',
};

const myFeatureGateList: Record<StatsigOverrides.FeatureGateKey, string> = {
  myTestFeatureGate1: 'my_test_feature_gate_1',
  myTestFeatureGate2: 'my_test_feature_gate_2',
};

const myStatsig = new Statsig({
  initializeOptions: {
    user: statsigUser,
    clientKey: statsigClientKey,
    ...statsigOptions,
  },
  featureGateList: myFeatureGateList,
  experimentList: myExperimentList,
});

myStatsig.initialize(); // DON'T FORGET THIS

export default myStatsig;
```

For Typescript, you can override the default `ExperimentKey`, `ExperimentOverrideParamMap`, `FeatureGateKey` and `FeatureGateOverrideParamMap` types. For the project, declare a `StatsigOverrides` namespace and defines these types as necessary.

- `ExperimentKey` and `FeatureGateKey` should be set of string values matching to test keys defined in the `experimentList` and `featureGateList`.

- `ExperimentOverrideParamMap` and `FeatureGateOverrideParamMap` should be objects with each key matching the test key defined in the `experimentList` and `featureGateList`. The value should refer to a defined param override type. Typically for feature gates the type is always just `{ value: boolean }`. For experiments this typed object can change based on experiment param setup.

```typescript
const MyTestExperiment1Params: MyTestExperimentParams[] = [
  { value1: false, value2: 'blue' },
  { value1: true, value2: 'red' },
];

const MyTestFeatureGate1Params: MyTestFeatureGateParams[] = [
  { value: false },
  { value: true },
];

type MyTestExperimentParams = {
  value1: boolean;
  value2: string;
};

type MyTestFeatureGateParams = {
  value: boolean;
};

interface MyExperimentOverrideParamMap {
  myTestExperiment1: MyTestExperimentParams;
  myTestExperiment2: MyTestExperimentParams;
}

interface MyFeatureGateOverrideParamMap {
  myTestFeatureGate1: MyTestFeatureGateParams;
  myTestFeatureGate2: MyTestFeatureGateParams;
}

declare namespace StatsigOverrides {
  type ExperimentKey = 'myTestExperiment1' | 'myTestExperiment2';
  type ExperimentOverrideParamMap = MyExperimentOverrideParamMap;
  type FeatureGateKey = 'myTestFeatureGate1' | 'myTestFeatureGate2';
  type FeatureGateOverrideParamMap = MyFeatureGateOverrideParamMap;
}
```

### Themes

For a bit of fun, the theme of the Cypress Runner can be modified by adding a `theme` env variable into the consuming project's `cypress.config.ts` file.

The current list of supported themes is `dark`, `halloween`, and `christmas`.

```typescript
// cypress.config.ts
module.exports = defineConfig({
  // base cypress configs
  env: {
    // other cypress env variables
    theme: 'dark',
  },
  e2e: {
    // other cypress e2e configs
  },
});
```
