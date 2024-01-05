package com.*company-data-covered*.logistics.domain.geo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DistanceTest {
  @Test
  void defineDistanceUnits() {
    final int durationMs = 123;
    final int meters = 456;
    Distance d = Distance.of(durationMs, meters);

    assertThat(d.getDurationMs()).isEqualTo(durationMs);
    assertThat(d.getMeters()).isEqualTo(meters);
  }

  @Test
  void addDistance() {
    Distance d1 = Distance.of(123, 456);
    Distance d2 = Distance.of(1, 2);

    Distance sum = d1.add(d2);
    assertThat(sum.getDurationMs()).isEqualTo(124);
    assertThat(sum.getMeters()).isEqualTo(458);

    assertThat(d1.add(Distance.ZERO)).isEqualTo(d1);
    assertThat(Distance.ZERO.add(d1)).isEqualTo(d1);
  }
}
