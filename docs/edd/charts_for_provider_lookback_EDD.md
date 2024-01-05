# EDD: Charts implementation for Provider Daily Lookback

**Author:** Alexander Primakov alexander.primakov@_company-data-covered_.com, Alexander Bilakovskyi alexander.bilakovskyi@_company-data-covered_.com, Yurii Kirgizov yurii.kirgizov@_company-data-covered_.com

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM

## Resources

PRD: [Provider Lookback PRD](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EXX3ae20oalBmhjj3FPuOS4B3yzXDoMTuwW_z9auTSTPqQ?e=PsgOaB)

Supporting designs: [Figma](https://www.figma.com/file/XB1JozOpfEmezV0XQIJdVB/Idle-Time-Reduction%3A-Daily-Performance-Lookback?node-id=1-867&t=aROKV3oicMq6m4Pt-0), [spreadsheet](https://*company-data-covered*-my.sharepoint.com/:x:/p/scott_gustin/EbaoACStfOxBh_vzIRXXbBMBCJg97YEKxeMPiKMheHV7aw?e=LOaOS4)

## Overview

This design is intended to achieve convenient and efficient way for providers to check their own performance statistics in the previous N days (not including today).

On Provider Lookback page, provider will be able to check:

- Last shift breakdown:

  - number of patients they have seen
  - average number of patients seen per shift in market
  - breakdown based on the status changes of the care requests

- Last 7 days statistics:
  - Chart with info about how many patients were seen in specific days VS average per market in a day

## Goals

Identify an UI chart React library (specifically for Lookback widget) that will meet next requirements:

- Dashed Line chart
- Customisable Grid
- Similarity to the [design](https://www.figma.com/file/XB1JozOpfEmezV0XQIJdVB/Idle-Time-Reduction%3A-Daily-Performance-Lookback?node-id=1-867&t=aROKV3oicMq6m4Pt-0)
- Regularly updated
- Detailed documentation
- A useful charts library for projects outside of the Lookback charts

### Сhart implementation

Data from BE will be used to represent statistic and charts of the [FE](https://www.figma.com/file/XB1JozOpfEmezV0XQIJdVB/Idle-Time-Reduction%3A-Daily-Performance-Lookback?node-id=1-867&t=aROKV3oicMq6m4Pt-0).

Latest Shifts’ Trend chart implementation. To implement the charts, we would need to add a third-party library. An idea is to add the chart library to the design system and re-export it for common access.

### Proposal 1

[Recharts](https://recharts.org/en-US/)

#### Pros:

- Popular React library. It has over 1 million weekly downloads.

- Still supported by creators. Last update was 1 month ago.

- It has support for the Line chart. There is an option to maintain the Grid how we want to, to set up the lines how we want to (including dashed line option), to design the dots on the lines, to configure the axes.

- Good and detailed documentation

- Typescript support

- Line Chart is similar to the one in Figma

- Backed by Open Source Community

#### Cons:

- Bundle size is 626 kB minified and 144 kB minified + gzipped

- Recharts provide much more than we really need to.

### Proposal 2

[highcharts](https://www.highcharts.com/)

#### Pros:

- Bundle size is 206Kb or 72kb gzipped

- Detailed documentation

- Has React Wrapper

- Typescript support

- Line Chart is similar to the one in Figma

#### Cons:

- [Paid for commercial applications](https://shop.highcharts.com/)

### Proposal 3

[react-chartjs-2](https://www.npmjs.com/package/react-chartjs-2)

#### Pros:

- React component syntax

- Chart.js has detailed, easy-to-understand documentation

- Typescript support

- Backed by Open Source Community

- Bundle size is 364.5 kB (minified), and 93.5 kB minified + gzipped

#### Cons:

- Based on Chart.js

- react-chartjs-2 does not have detailed documentation of its own

- Line Chart from Recharts or Highcharts is more similar to the one in Figma

## Metrics & Data Integration

No additional specific metrics are required.

## Error Handling & Alerting

Errors will be processed with standard global error handler.

## Safety

There are no any unusual safety concerns around this design.

## Security

- no new dependencies on external systems
- new third party Chart Library

## Audits and Logs

Does not require additional specific audits and logs.

## Scalability

No scalability issues should appear.

## Cost

Does not require additional cost unless we decide to use

## Testing

Will require FE React Testing Library tests

## Training

No training required

## Deployment

Would be available for common use in the design system

## Lifecycle management

Not any technology choices in danger of being sunset, abandoned, or deprecated.
