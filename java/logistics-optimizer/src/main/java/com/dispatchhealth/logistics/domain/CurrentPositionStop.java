package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;

public class CurrentPositionStop extends Customer {
  private long currentPositionStopId;
  private long currentPositionStopShiftTeamId;
  private long knownTimestampMs;

  public CurrentPositionStop() {}

  public CurrentPositionStop(
      long id,
      long shiftTeamId,
      Location location,
      long knownTimestampMs,
      DefaultProfitComponents defaultProfitComponents) {
    super(id, location, knownTimestampMs, knownTimestampMs, 0, defaultProfitComponents);

    this.currentPositionStopId = id;
    this.currentPositionStopShiftTeamId = shiftTeamId;
    this.knownTimestampMs = knownTimestampMs;
    // current position stops are pinned in the route, and pinned to a time instant.
    this.setPinned(true);
    // When the latest route history stop is on-scene or en-route, we should not have a current
    // position stop. With that invariant in place, we can indeed set the "actual" timestamps here.
    this.setActualArrivalTimestampMs(knownTimestampMs);
    this.setActualCompletionTimestampMs(knownTimestampMs);
    this.setEarliestPossibleDepartureMs(knownTimestampMs);
    this.setArrivalTimestampMs(knownTimestampMs);
  }

  public long getCurrentPositionStopId() {
    return currentPositionStopId;
  }

  public long getCurrentPositionStopShiftTeamId() {
    return currentPositionStopShiftTeamId;
  }

  public long getKnownTimestampMs() {
    return knownTimestampMs;
  }

  @Override
  public boolean isVRPRouteStop() {
    return false;
  }

  @Override
  public String toString() {
    return "CurrentPositionStop{"
        + "currentPositionStopId="
        + currentPositionStopId
        + ", currentPositionStopShiftTeamId="
        + currentPositionStopShiftTeamId
        + ", knownTimestampMs="
        + knownTimestampMs
        + ", customer="
        + super.toString()
        + '}';
  }
}
