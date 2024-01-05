package com.*company-data-covered*.logistics.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.google.common.collect.ImmutableMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CustomerTest {

  DefaultProfitComponents defaultProfitComponents = new DefaultProfitComponents(6000, 2200, 25000);

  private Location loc1, loc2, loc3;
  private Distance loc1Loc2Distance, loc1Loc3Distance, loc2Loc3Distance, loc2Loc1Distance;

  private final long CUSTOMER_ID_1 = 1;
  private final long CUSTOMER_ID_2 = 2;
  private final long VEHICLE_ID = 3;

  @BeforeEach
  void setUp() {
    loc1 = new Location(1, 1.23, 4.56);
    loc2 = new Location(2, 2.34, 5.67);
    loc3 = new Location(3, 3.45, 6.78);

    loc1Loc2Distance = Distance.of(1212, 12);
    loc1Loc3Distance = Distance.of(1313, 13);
    loc2Loc1Distance = Distance.of(2121, 21);
    loc2Loc3Distance = Distance.of(2323, 23);
    loc1.setDistanceMap(
        ImmutableMap.of(
            loc1, Distance.ZERO,
            loc2, loc1Loc2Distance,
            loc3, loc1Loc3Distance));
    loc2.setDistanceMap(
        ImmutableMap.of(
            loc1, loc2Loc1Distance,
            loc2, Distance.ZERO,
            loc3, loc2Loc3Distance));
  }

  static Depot depotAtLoc(Location location) {
    return new Depot(location, 0, 0);
  }

  @Test
  void getDistanceFromPreviousStandstill() {
    Customer previousCustomer = new Customer(CUSTOMER_ID_1, loc1, 0, 0, 0, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_2, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(previousCustomer);

    assertThat(customer.getDistanceFromPreviousStandstill()).isEqualTo(loc1Loc2Distance);
  }

  @Test
  void getDistanceFromPreviousStandstill_hasFinalDepotStop() {
    DepotStop finalDepotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, true, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_2, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(finalDepotStop);

    assertThat(customer.getDistanceFromPreviousStandstill()).isEqualTo(Distance.ZERO);
  }

  @Test
  void getDistanceFromPreviousStandstill_notFinalDepotStop() {
    DepotStop depotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, false, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_2, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(depotStop);

    assertThat(customer.getDistanceFromPreviousStandstill()).isNotEqualTo(Distance.ZERO);
  }

  @Test
  void getDistanceToDepot() {
    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depotAtLoc(loc1), defaultProfitComponents);

    customer.setVehicle(vehicle);
    assertThat(customer.getDistanceToDepot()).isEqualTo(loc2Loc1Distance);
  }

  @Test
  void getDepartureTimestampMs() {
    long beforeReadyTimestampMs = 1;
    long readyTimestampMs = 2;
    long afterReadyTimestampMs = 3;

    long dueTimestampMs = 5;
    long serviceDurationMs = 100;

    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);
    assertThat(customer.getDepartureTimestampMs()).isNull();

    customer.setArrivalTimestampMs(beforeReadyTimestampMs);
    assertThat(customer.getDepartureTimestampMs()).isEqualTo(readyTimestampMs + serviceDurationMs);

    customer.setArrivalTimestampMs(readyTimestampMs);
    assertThat(customer.getDepartureTimestampMs()).isEqualTo(readyTimestampMs + serviceDurationMs);

    customer.setArrivalTimestampMs(afterReadyTimestampMs);
    assertThat(customer.getDepartureTimestampMs())
        .isEqualTo(afterReadyTimestampMs + serviceDurationMs);

    long lastKnownTimeAtLocationMs =
        afterReadyTimestampMs + 120; // Simulate running behind schedule
    customer.setEarliestPossibleDepartureMs(lastKnownTimeAtLocationMs);
    assertThat(customer.getDepartureTimestampMs()).isEqualTo(lastKnownTimeAtLocationMs);
  }

  @Test
  void isArrivalBeforeReadyTime() {
    long beforeReadyTimestampMs = 1;
    long readyTimestampMs = 2;
    long afterReadyTimestampMs = 3;

    long dueTimestampMs = 5;
    long serviceDurationMs = 100;
    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);
    assertThat(customer.isArrivalBeforeReadyTime()).isFalse();

    customer.setArrivalTimestampMs(beforeReadyTimestampMs);
    assertThat(customer.isArrivalBeforeReadyTime()).isTrue();

    customer.setArrivalTimestampMs(readyTimestampMs);
    assertThat(customer.isArrivalBeforeReadyTime()).isFalse();

    customer.setArrivalTimestampMs(afterReadyTimestampMs);
    assertThat(customer.isArrivalBeforeReadyTime()).isFalse();
  }

  @Test
  void isArrivalAfterDueTime() {
    long readyTimestampMs = 2;

    long beforeDueTimestampMs = 4;
    long dueTimestampMs = 5;
    long afterDueTimestampMs = 7;

    long serviceDurationMs = 100;
    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);
    assertThat(customer.isArrivalAfterDueTime(0)).isFalse();

    customer.setArrivalTimestampMs(beforeDueTimestampMs);
    assertThat(customer.isArrivalAfterDueTime(0)).isFalse();

    customer.setArrivalTimestampMs(dueTimestampMs);
    assertThat(customer.isArrivalAfterDueTime(0)).isFalse();

    customer.setArrivalTimestampMs(afterDueTimestampMs);
    assertThat(customer.isArrivalAfterDueTime(0)).isTrue();
    // but the boundary condition on the threshold is okay...
    assertThat(customer.isArrivalAfterDueTime(afterDueTimestampMs - dueTimestampMs)).isFalse();
    // but one more ms is not.
    assertThat(customer.isArrivalAfterDueTime(afterDueTimestampMs - dueTimestampMs - 1)).isTrue();
  }

  @Test
  void getLatenessAfterDueTimeWithOffsetMs() {
    Customer customerJustOnTime =
        new Customer(CUSTOMER_ID_1, loc2, 1, 3, 2, defaultProfitComponents);
    customerJustOnTime.setArrivalTimestampMs(customerJustOnTime.getDueTimestampMs());

    assertThat(customerJustOnTime.getLatenessAfterDueTimeWithOffsetMs(0)).isZero();
    assertThat(customerJustOnTime.getLatenessAfterDueTimeWithOffsetMs(1)).isEqualTo(1);
  }

  @Test
  void isLast() {
    long readyTimestampMs = 2;
    long dueTimestampMs = 5;
    long serviceDurationMs = 100;

    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);
    assertThat(customer.isLast()).isTrue();

    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);
    customer.setNextCustomer(customer2);
    assertThat(customer.isLast()).isFalse();
  }

  @Test
  void isAssignedToSinkVehicle_hasSinkVehicle() {
    long readyTimestampMs = 2;
    long dueTimestampMs = 5;
    long serviceDurationMs = 100;

    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);

    customer.setVehicle(new SinkVehicle(depotAtLoc(loc1), defaultProfitComponents));

    assertThat(customer.isAssignedToSinkVehicle()).isTrue();
  }

  @Test
  void isAssignedToSinkVehicle_hasNoSinkVehicle() {
    long readyTimestampMs = 2;
    long dueTimestampMs = 5;
    long serviceDurationMs = 100;

    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);

    assertThat(customer.isAssignedToSinkVehicle()).isFalse();

    Vehicle vehicle = new Vehicle(VEHICLE_ID, depotAtLoc(loc1), defaultProfitComponents);
    customer.setVehicle(vehicle);

    assertThat(customer.isAssignedToSinkVehicle()).isFalse();
  }

  @Test
  void ignoreHardConstraints() {
    long readyTimestampMs = 2;
    long dueTimestampMs = 5;
    long serviceDurationMs = 100;

    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            readyTimestampMs,
            dueTimestampMs,
            serviceDurationMs,
            defaultProfitComponents);

    customer.setPinned(true);
    assertThat(customer.ignoreHardConstraints()).isTrue();

    customer.setPinned(false);
    assertThat(customer.ignoreHardConstraints()).isFalse();

    customer.setVehicle(new SinkVehicle(depotAtLoc(loc1), defaultProfitComponents));
    assertThat(customer.ignoreHardConstraints()).isTrue();
  }

  @Test
  void representsRealCustomerVisitAndNotAnotherStopType() {
    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 2, 5, 100, defaultProfitComponents);

    assertThat(customer.representsRealCustomerVisitAndNotAnotherStopType()).isTrue();
  }
}
