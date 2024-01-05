package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.*company-data-covered*.optimizer.VRPShiftTeamRestBreak;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteStop;

/*
HACK: subclassing Customer since we couldn't get the Stop interface to work well.
This is pretty sneaky,  but other "Stop" types may have to follow a similar pattern.
See the closed PR for more on what was tried: https://github.com/*company-data-covered*/services/pull/893

Note the convention of the rest break specific fields to be prefixed with "restBreak" to prevent accidental misuse.

TODO: Attempt a non-subclassing solution above again when we add a new Stop type.
 */
public class RestBreak extends Customer {
  private static final long SEC_TO_MS = 1000;

  private boolean isUnrequested;

  private long restBreakId;
  private long restBreakShiftTeamId;

  private Location restBreakLocation;

  private long restBreakStartTimestampMs;
  private long restBreakDurationMs;

  public RestBreak() {}

  public RestBreak(
      long id,
      Location location,
      long startTimestampMs,
      long endTimestampMs,
      long durationMs,
      DefaultProfitComponents defaultProfitComponents) {
    super(id, location, startTimestampMs, endTimestampMs, durationMs, defaultProfitComponents);
    this.restBreakId = id;
    this.restBreakLocation = location;
    this.restBreakStartTimestampMs = startTimestampMs;
    this.restBreakDurationMs = durationMs;
  }

  public static RestBreak RequestedRestBreak(
      long id,
      long shiftTeamId,
      Location location,
      long startTimestampMs,
      long durationMs,
      DefaultProfitComponents defaultProfitComponents) {

    RestBreak rb =
        new RestBreak(
            id, location, startTimestampMs, startTimestampMs, durationMs, defaultProfitComponents);
    rb.restBreakShiftTeamId = shiftTeamId;
    rb.isUnrequested = false;
    return rb;
  }

  public static RestBreak UnrequestedRestBreak(
      long id,
      long shiftTeamId,
      Depot depot,
      long durationMs,
      DefaultProfitComponents defaultProfitComponents) {

    RestBreak rb =
        new RestBreak(
            id,
            Location.UNUSED_LOCATION,
            depot.getReadyTimestampMs(),
            depot.getDueTimestampMs(),
            durationMs,
            defaultProfitComponents);

    rb.restBreakShiftTeamId = shiftTeamId;
    rb.isUnrequested = true;
    return rb;
  }

  public long getRestBreakShiftTeamId() {
    return restBreakShiftTeamId;
  }

  public long getRestBreakId() {
    return restBreakId;
  }

  public long getRestBreakStartTimestampMs() {
    return restBreakStartTimestampMs;
  }

  public boolean getIsUnrequested() {
    return isUnrequested;
  }

  public long getRestBreakDurationMs() {
    return restBreakDurationMs;
  }

  public Location getRestBreakLocation() {
    return restBreakLocation;
  }

  public boolean isCorrectShiftTeam() {
    Vehicle vehicle = getVehicle();
    if (vehicle == null) {
      return false;
    }
    return restBreakShiftTeamId == vehicle.getId();
  }

  @Override
  public Location getLocation() {
    if (isUnrequested) {
      Standstill previousStandstill = getPreviousStandstill();
      if (previousStandstill == null) {
        return null;
      }
      return previousStandstill.getLocation();
    }

    return super.getLocation();
  }

  @Override
  public Distance getDistanceTo(Location location) {
    if (isUnrequested) {
      Standstill previousStandstill = super.getPreviousStandstill();
      if (previousStandstill == null) {
        return null;
      }
      return previousStandstill.getDistanceTo(location);
    }
    return super.getDistanceTo(location);
  }

  @Override
  public VRPShiftTeamRouteStop toVRPShiftTeamRouteStop() {
    VRPShiftTeamRouteStop.Builder stopBuilder =
        VRPShiftTeamRouteStop.newBuilder()
            .setRestBreak(
                VRPShiftTeamRestBreak.newBuilder()
                    .setRestBreakId(getRestBreakId())
                    .setStartTimestampSec(getRestBreakStartTimestampMs() / SEC_TO_MS))
            .setPinned(this.isPinned());

    Long actualArrivalTimestampMs = getActualArrivalTimestampMs();
    if (actualArrivalTimestampMs != null) {
      stopBuilder.setActualStartTimestampSec(actualArrivalTimestampMs / SEC_TO_MS);
    }

    Long actualCompletionTimestampMs = getActualCompletionTimestampMs();
    if (actualCompletionTimestampMs != null) {
      stopBuilder.setActualCompletionTimestampSec(actualCompletionTimestampMs / SEC_TO_MS);
    }

    return stopBuilder.build();
  }

  @Override
  public AssignabilityChecker getAssignabilityChecker() {
    return AssignabilityChecker.EMPTY_ASSIGNABILITY_CHECKER;
  }

  @Override
  public boolean isVRPRouteStop() {
    // We only serialize out to a route stop if it's a real, requested break.
    return !this.isUnrequested;
  }

  @Override
  public String toString() {
    return "RestBreak{"
        + "restBreakId="
        + restBreakId
        + ", restBreakShiftTeamId="
        + restBreakShiftTeamId
        + ", restBreakStartTimestampMs="
        + restBreakStartTimestampMs
        + ", restBreakDurationMs="
        + restBreakDurationMs
        + '}';
  }
}
