package com.*company-data-covered*.logistics.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.google.common.collect.ImmutableMap;
import org.junit.jupiter.api.Test;

class LocationTest {

  @Test
  void getDistanceTo() {
    Location loc1 = new Location(1, 1.23, 4.56);
    Location loc2 = new Location(2, 2.34, 5.67);
    Location loc3 = new Location(3, 3.45, 6.78);

    Distance distance2 = Distance.of(222, 2);
    Distance distance3 = Distance.of(333, 3);
    loc1.setDistanceMap(
        ImmutableMap.of(
            loc2, distance2,
            loc3, distance3));

    assertThat(loc1.getDistanceTo(loc2)).isEqualTo(distance2);
    assertThat(loc1.getDistanceTo(loc3)).isEqualTo(distance3);
  }
}
