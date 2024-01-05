package com.*company-data-covered*.logistics.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.google.common.collect.ImmutableMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class RestBreakTest {
  DefaultProfitComponents defaultProfitComponents = new DefaultProfitComponents(6000, 2200, 25000);

  @BeforeEach
  void setUp() {}

  @Test
  void representsRealCustomerVisitAndNotAnotherStopType() {
    RestBreak restBreak = new RestBreak();
    assertThat(restBreak.representsRealCustomerVisitAndNotAnotherStopType()).isFalse();
  }

  @Test
  void isCorrectShiftTeam() {
    int shiftTeamID = 2;
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(1, shiftTeamID, null, 3, 4, defaultProfitComponents);
    Vehicle rightVehicle =
        new Vehicle(shiftTeamID, new Depot(null, 0, 10), defaultProfitComponents);
    Vehicle wrongVehicle = new Vehicle(123, new Depot(null, 0, 10), defaultProfitComponents);
    restBreak.setVehicle(rightVehicle);
    assertThat(restBreak.isCorrectShiftTeam()).isTrue();
    restBreak.setVehicle(wrongVehicle);
    assertThat(restBreak.isCorrectShiftTeam()).isFalse();
  }

  @Test
  void unrequestedRestBreak_locationComesFromPreviousStandstill() {
    int shiftTeamID = 2;
    int durationMs = 3;
    Depot depot = new Depot(Location.UNUSED_LOCATION, 0, 1);
    RestBreak restBreak =
        RestBreak.UnrequestedRestBreak(1, shiftTeamID, depot, durationMs, defaultProfitComponents);

    assertThat(restBreak.getLocation()).isNull();
    assertThatThrownBy(restBreak::getDistanceFromPreviousStandstill)
        .isInstanceOf(IllegalStateException.class);

    Location location2 = new Location(2, 0, 0);
    location2.setDistanceMap(ImmutableMap.of(location2, Distance.ZERO));
    Vehicle vehicle =
        new Vehicle(shiftTeamID, new Depot(location2, 0, 10), defaultProfitComponents);
    restBreak.setPreviousStandstill(vehicle);
    assertThat(restBreak.getLocation()).isEqualTo(location2);
    assertThat(restBreak.getDistanceFromPreviousStandstill()).isEqualTo(Distance.ZERO);
  }

  @Test
  void requestedRestBreak_locationIsConstant() {
    int shiftTeamID = 2;
    int durationMs = 3;
    Location location = new Location(1, 0, 0);
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(
            1, shiftTeamID, location, 0, durationMs, defaultProfitComponents);

    assertThat(restBreak.getLocation()).isEqualTo(location);
    assertThatThrownBy(restBreak::getDistanceFromPreviousStandstill)
        .isInstanceOf(IllegalStateException.class);

    Location location2 = new Location(2, 0, 0);
    Customer customer = new Customer(1, location2, 0, 0, 0, defaultProfitComponents);
    restBreak.setPreviousStandstill(customer);

    assertThat(restBreak.getLocation()).isEqualTo(location);

    Distance distance = Distance.of(1, 2);
    location2.setDistanceMap(ImmutableMap.of(location, distance));
    assertThat(restBreak.getDistanceFromPreviousStandstill()).isEqualTo(distance);
  }
}
