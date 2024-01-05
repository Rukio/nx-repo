package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;

public class DepotStop extends Customer {
  private long depotStopId;
  private long depotShiftTeamId;
  private long endShiftTimestampMs;

  private boolean isFinalStop;

  public DepotStop() {}

  public DepotStop(
      long id,
      long shiftTeamId,
      Location location,
      long endShiftTimestampMs,
      boolean isFinalStop,
      DefaultProfitComponents defaultProfitComponents) {
    super(id, location, endShiftTimestampMs, endShiftTimestampMs, 0, defaultProfitComponents);

    this.depotStopId = id;
    this.depotShiftTeamId = shiftTeamId;
    this.endShiftTimestampMs = endShiftTimestampMs;
    this.isFinalStop = isFinalStop;
  }

  public long getDepotShiftTeamId() {
    return depotShiftTeamId;
  }

  public long getDepotStopId() {
    return depotStopId;
  }

  public long getEndShiftTimestampMs() {
    return endShiftTimestampMs;
  }

  public boolean isCorrectShiftTeam() {
    Vehicle vehicle = getVehicle();
    if (vehicle == null) {
      return false;
    }
    return depotShiftTeamId == vehicle.getId();
  }

  public boolean getIsFinalStop() {
    return this.isFinalStop;
  }

  public boolean isInRightOrder() {
    if (getIsFinalStop()) {
      boolean isLastStop = getNextCustomer() == null;
      return isLastStop;
    }

    boolean isFirstStop = getPreviousStandstill() == getVehicle();
    return isFirstStop;
  }

  @Override
  public boolean isVRPRouteStop() {
    return false;
  }

  @Override
  public String toString() {
    return "DepotStop{"
        + "depotStopId="
        + depotStopId
        + ", depotShiftTeamId="
        + depotShiftTeamId
        + ", endShiftTimestampMs="
        + endShiftTimestampMs
        + ", customer="
        + super.toString()
        + '}';
  }

  @Override
  public Distance getDistanceTo(Location location) {
    if (isFinalStop) {
      return Distance.ZERO;
    }
    return super.getDistanceTo(location);
  }
}
