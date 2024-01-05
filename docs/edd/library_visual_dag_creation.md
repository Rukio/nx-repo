# EDD: Library for Visual DAG Creation

**Author:** [Bernabe Felix](bernabe.felix@*company-data-covered*.com)

## Pre-review Checklist

Before scheduling your design review, ensure that you have checked all of the following boxes:

- [x] Familiarize yourself with our [EDR process](https://*company-data-covered*.atlassian.net/wiki/spaces/EN/pages/52002922/Process+Engineering+Design+Review)
- [x] Make sure PRD and EDD are aligned - EM
- [x] EDD has been reviewed by internal team members - EM

## Resources

[PRD: Risk Strat Service ](https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EbbW1wxRpG1JqAbmZL9XEpYBudicbY3bhcYooTb2M9frIw?e=jOAtxi)

Supporting designs:

- [EDD: Risk Strat service](https://github.com/*company-data-covered*/services/pull/4787)
- [Figma Design](https://www.figma.com/file/qaveqnX7cqal0X0ghbgRvp/%F0%9F%A6%81--Risk-Stratification-Service?type=design&node-id=1468-130925&mode=design&t=h34YM8gk2bNdhuEe-0)

## Glossary

#### DAG

Directed acyclic graph. This is the term that we use to refer to a set of risk stratification questions in a tree with question and terminal nodes that is associated to a Time Sensitive Concern.

#### Edge

An edge is a connection between two nodes in a DAG. It can be a connection between a question node and an outcome node or between two question nodes.

#### Outcome Node

A node in a DAG that dictates a conclusion (vs another question). These conclusions could be things like “requires secondary screen”.

#### Question Node

A node in a DAG that asks a question. It can have age and gender restrictions.

## Overview

This document aims to provide options for choosing a library to create DAGs for the new Risk Stratification service.

## Goals

- Implement a DAG as a React component.
- Create custom shapes and styling for nodes and edges.
- Delete and replace nodes without having to re-render the whole graph.
- Use our design system as much as possible, e.g. to add inputs/icons to nodes.
- Control zoom/panning/dragging from the UI and/or programmatically.

## Design Proposals

The main proposal of this document is to adopt React Flow library for DAG creation.

Most of the other libraries that we found are either to handle simple scenarios (just plain node trees) or not made for React.

### Proposal 1 – [React Flow](https://reactflow.dev/) - Recommended

React Flow is a highly customizable React library for building node-based editors and interactive graphs.

React Flow is a wrapper around D3 with a simple API, thus we have all the benefits of D3 without having to deal with its complexity.
React Flow is a blank canvas that we can use to create our DAGs with the level of customization that we need.

React Flow has 6 dependencies and weights 47 kB min + gzip ([more info](https://bundlephobia.com/package/reactflow@11.7.4))

Pros:

- Made specifically for our use case (node-based diagrams).
- Developed for React, it has native integration with our codebase and we can create and customize nodes as regular components.
- Controlling zoom/panning/dragging is simple.
- Open-source, maintained and trusted by big companies like Stripe.
- Plenty of [examples](https://reactflow.dev/docs/examples/overview/) and [documentation](https://reactflow.dev/docs/api/react-flow-props/).
- Can be integrated with other D3 libraries to create richer graphs (e.g. [dagre-d3](https://reactflow.dev/docs/examples/layout/dagre/), [d3-hierarchy](https://reactflow.dev/docs/examples/layout/expand-collapse/))
- Is written in Typescript, no need to install the types separately.

Cons:

- Node positions require manual calculation.\*\*.
  - We need to take node collisions into account (they have a [function](https://reactflow.dev/docs/examples/nodes/intersections/) to handle it though).
  - Have to use fixed width or height (based on the orientation) for custom nodes.

\*\* If we buy their PRO version, we can use their PRO layout to automatically calculate the position of the nodes.

### Proposal 2 – [D3](https://d3js.org/)

D3 is a JavaScript library for visualizing data. It's one if not the most popular library for creating graphs and charts. You can use it to create simple bar charts to orthographic maps.

That's the problem with D3, although we can do pretty much anything, it's too complex for our use case it'll take us a lot of time to build what we need from scratch.

D3 has 30 dependencies and weights 90.6 kB min + gzip ([more info](https://bundlephobia.com/package/d3@7.8.5)).

Pros:

- Lots of examples and documentation.
- Modular, import as needed.
- Handle large and complex datasets.

Cons:

- Learning curve is steep.
- Not made for React, so we would have a hard time integrating our codebase.
- Hard code and maintain. Writing hundred lines of code to create a simple graph is not uncommon.

## Platform Components

We will use our design system components. Mainly those to create forms and dialogs.

## Data Design & Schema Changes

Not applicable

## Metrics & Data Integration

Not applicable.

## Error Handling & Alerting

Not applicable

## Safety

Not applicable

## Security

React Flow dependencies are minimal and based in D3, which is a well known and trusted library as well as its parent company, Observable.

## Audits and Logs

Not applicable

## Scalability

So far we've tested it with our biggest DAG (~30 nodes) and it works fine.

## Cost

Not applicable unless we buy their PRO version $139 month, which is not necessary although it could save us some time and have a better support from the creators.

## Experimentation

Not applicable

## Testing

With any of the libraries we choose, we'll have to manually test diagrams as they are on a canvas and not regular HTML elements.

## Training

Not applicable

## Deployment

Not applicable

## Lifecycle management

React Flow was open-sourced 3 years but the development started in 2014, 11 versions so far with the last one being released 9 months ago. Webkid, the company behind it, supports it with their Pro Service Plan. Although it is actively maintained with several companies paying the Pro service, there's always the possibility that it could be abandoned at any point as with any open-source project.
