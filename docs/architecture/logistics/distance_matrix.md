## Distance matrix

The logistics service computes a matrix composed of the distances between the following
segments:

```mermaid
flowchart LR
  StartDepot[Start depots]
  History[Route history stops]
  Current[Current position]
  EnRoute[Last en-route stop]
  Upcoming[Upcoming commitments]
  Planning[Planning stops]
  DepotsEnd[Back to depots]

  subgraph Pinned[Pinned stops]
    direction LR

    StartDepot --> History
    History --> Current
    Current --> EnRoute
    EnRoute --> Upcoming
  end

  Pinned --> Planning
  Planning <--> Planning
  Planning --> DepotsEnd
  Pinned --> DepotsEnd
```

### Pinned stops

Pinned stops are the unmodifiable list of stops for each shift teamd. The last stop is called **tail stop** and can connect either to the planning stops or go straight back to the depot.

#### Depots

The depots are the stops where the shift teams start and end. A market could have multiple depots.

The only case when we need distances from depots to planning stops is when the depot is the tail of the pinned stops (no route history and no upcoming commitments).

#### Route history stops

All the visits that have at least transitioned to `COMMITTED` state and breaks that have been already requested.

#### Current position

The current location of the shift team.

When an `ON_ROUTE` stop is the last route history stop, Optimizer
injects the current position "just before" that en-route stop.
Thus in that case, we need to compute the next distance from en-route stop to the next upcoming commitment.

For optimization, we normally only set the current location to the previous visit or depot.

### Planning stops

All the visits and unrequested breaks that are not in any route history yet and can be moved around and connect to each other. Thus we need to compute "planning stops to planning stops" distances.

### Upcoming commitments

These are the next visits the shift teams will handle and are pinned to their schedules.

### Examples

Here are some examples of how distances matrix would look like.

One shift team with no route history:

```mermaid
flowchart LR
  StartDepot[Depot]
  V1[Visit 1]
  V2[Visit 2]
  V3[Visit 3]
  DepotEnd[Depot]

  subgraph ST1[Shift team 1]
    direction LR

    StartDepot
  end

  subgraph  Planning[Planning stops]
    direction LR

    V1 <--> V2
    V1 <--> V3
    V2 <--> V3
  end

  StartDepot --> Planning
  Planning --> DepotEnd
```

One shift team with route history and upcoming commitment.

```mermaid
flowchart LR
  StartDepot[Depot]
  V1[Visit 1]
  V2[Visit 2]
  V3[Visit 3]
  V4[Visit 4]
  V5[Visit 5]
  V6[Visit 6]
  DepotEnd[Depot]

  subgraph ST1[Shift team 1]
    direction LR

    subgraph  Route[Route history]
      direction LR

      V1 --> V2
    end

    StartDepot --> Route

    subgraph  Upcoming[Upcoming commitment]
      direction TB

      V3
    end
  end

  subgraph  Planning[Planning stops]
    direction LR

    V4 <--> V5
    V4 <--> V6
    V5 <--> V6
  end

  Route --> Upcoming
  Upcoming --> Planning
  Planning --> DepotEnd
```

Two shift teams, one with route history and the other without route history:

```mermaid
flowchart LR
  StartDepotST1[Depot]
  StartDepotST2[Depot]
  V1[Visit 1]
  V2[Visit 2]
  V3[Visit 3]
  V4[Visit 4]
  V5[Visit 5]
  V6[Visit 6]
  DepotEndST1[Shift team 1 depot]
  DepotEndST2[Shift team 2 depot]

  subgraph ST1[Shift team 1]
    direction LR

    subgraph  RouteST1[Route history]
      direction LR

      V1 --> V2
    end

    subgraph  UpcomingST1[Upcoming commitment]
      direction TB

      V3
    end

    StartDepotST1 --> RouteST1
    RouteST1 --> UpcomingST1
  end

  subgraph ST2[Shift team 2]
    direction LR

    StartDepotST2
  end

  subgraph  Planning[Planning stops]
    direction LR

    V4 <--> V5
    V4 <--> V6
    V5 <--> V6
  end

  UpcomingST1 --> Planning
  StartDepotST2 --> Planning

  Planning --> DepotEndST1
  Planning --> DepotEndST2
```
