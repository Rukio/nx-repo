package com.*company-data-covered*.logistics.domain.geo;

import java.util.Objects;

public class Distance {
  public static final Distance ZERO = new Distance(0, 0);
  private final long durationMs;
  private final long meters;

  public Distance(long durationMs, long meters) {
    this.durationMs = durationMs;
    this.meters = meters;
  }

  public static Distance of(long durationMs, long meters) {
    return new Distance(durationMs, meters);
  }

  public long getMeters() {
    return meters;
  }

  public long getDurationMs() {
    return durationMs;
  }

  public Distance add(Distance d) {
    return Distance.of(this.durationMs + d.durationMs, this.meters + d.meters);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Distance distance = (Distance) o;
    return durationMs == distance.durationMs && meters == distance.meters;
  }

  @Override
  public int hashCode() {
    return Objects.hash(durationMs, meters);
  }
}
