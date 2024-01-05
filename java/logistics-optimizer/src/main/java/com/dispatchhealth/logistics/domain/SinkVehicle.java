package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;

public class SinkVehicle extends Vehicle {

  public static final long DEFAULT_ID = -1L;

  public SinkVehicle() {}

  public SinkVehicle(Depot depot, DefaultProfitComponents defaults) {
    super(DEFAULT_ID, depot, defaults);
  }

  public SinkVehicle(long id, Depot depot, DefaultProfitComponents defaults) {
    super(id, depot, defaults);
  }

  @Override
  public boolean isDepotArrivalAfterDueTime(long toleratedLatenessMs) {
    return false;
  }

  @Override
  public boolean isSinkVehicle() {
    return true;
  }

  @Override
  public Long getDepotArrivalTimestampMs() {
    return 0L;
  }

  @Override
  public int getNumProviderDHMT() {
    return 0;
  }

  @Override
  public int getNumProviderAPP() {
    return 0;
  }

  @Override
  public Distance getTotalDistance() {
    return Distance.ZERO;
  }

  @Override
  public long getTotalWorkDurationMs() {
    return 0L;
  }
}
