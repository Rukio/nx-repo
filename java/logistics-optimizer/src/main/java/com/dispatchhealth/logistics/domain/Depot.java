package com.*company-data-covered*.logistics.domain;

/** Depot is where {@link Vehicle} starts and ends. */
// TODO: Potentially integrate directly into Vehicle.
public record Depot(Location location, long readyTimestampMs, long dueTimestampMs) {

  public long getReadyTimestampMs() {
    return readyTimestampMs;
  }

  public long getDueTimestampMs() {
    return dueTimestampMs;
  }

  public Location getLocation() {
    return location;
  }
}
