package com.*company-data-covered*.logistics.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class VehicleTest {
  public static final Set<Attribute> NO_ATTRIBUTES = ImmutableSet.of();
  final DefaultProfitComponents defaultProfitComponents =
      new DefaultProfitComponents(6000, 2200, 25000);
  private Location loc1, loc2, loc3;
  private Distance loc1Loc2Distance,
      loc1Loc3Distance,
      loc2Loc3Distance,
      loc2Loc1Distance,
      loc3Loc1Distance,
      loc3Loc2Distance;

  private final long CUSTOMER_ID_1 = 1;
  private final long CUSTOMER_ID_2 = 2;
  private final long VEHICLE_ID = 1;

  @BeforeEach
  void setUp() {
    loc1 = new Location(1, 1.23, 4.56);
    loc2 = new Location(2, 2.34, 5.67);
    loc3 = new Location(3, 3.45, 6.78);

    loc1Loc2Distance = Distance.of(1212, 12);
    loc1Loc3Distance = Distance.of(1313, 13);
    loc2Loc1Distance = Distance.of(2121, 21);
    loc2Loc3Distance = Distance.of(2323, 23);
    loc3Loc1Distance = Distance.of(3131, 31);
    loc3Loc2Distance = Distance.of(3232, 32);
    loc1.setDistanceMap(
        ImmutableMap.of(loc1, Distance.ZERO, loc2, loc1Loc2Distance, loc3, loc1Loc3Distance));
    loc2.setDistanceMap(
        ImmutableMap.of(loc1, loc2Loc1Distance, loc2, Distance.ZERO, loc3, loc2Loc3Distance));
    loc3.setDistanceMap(
        ImmutableMap.of(loc1, loc3Loc1Distance, loc2, loc3Loc2Distance, loc3, Distance.ZERO));
  }

  static Depot depotAtLoc(Location location) {
    return new Depot(location, 0, 0);
  }

  @Test
  void getRoute() {
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depotAtLoc(loc1), defaultProfitComponents);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID,
            VEHICLE_ID,
            vehicle.getDepot().getLocation(),
            vehicle.getDepot().getDueTimestampMs(),
            true,
            defaultProfitComponents);
    assertThat(vehicle.getRoute()).isEmpty();

    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    customer.setNextCustomer(depotStop);
    depotStop.setPreviousStandstill(customer);
    assertThat(vehicle.getRoute())
        .isEqualTo(
            ImmutableList.of(vehicle.getLocation(), customer.getLocation(), vehicle.getLocation()));

    Customer customer2 = new Customer(CUSTOMER_ID_2, loc3, 0, 0, 0, defaultProfitComponents);
    customer.setNextCustomer(customer2);
    customer2.setNextCustomer(depotStop);
    depotStop.setPreviousStandstill(customer2);

    assertThat(vehicle.getRoute())
        .isEqualTo(
            ImmutableList.of(
                vehicle.getLocation(),
                customer.getLocation(),
                customer2.getLocation(),
                vehicle.getLocation()));
  }

  @Test
  void getRouteCustomers() {
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depotAtLoc(loc1), defaultProfitComponents);
    assertThat(vehicle.getRouteCustomers()).isEmpty();

    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    assertThat(vehicle.getRouteCustomers()).isEqualTo(ImmutableList.of(customer));

    Customer customer2 = new Customer(CUSTOMER_ID_2, loc3, 0, 0, 0, defaultProfitComponents);
    customer.setNextCustomer(customer2);
    assertThat(vehicle.getRouteCustomers()).isEqualTo(ImmutableList.of(customer, customer2));
  }

  @Test
  void getTotalDistance() {
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depotAtLoc(loc1), defaultProfitComponents);
    assertThat(vehicle.getTotalDistance()).isEqualTo(Distance.ZERO);

    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    assertThat(vehicle.getTotalDistance()).isEqualTo(loc1Loc2Distance.add(loc2Loc1Distance));

    Customer customer2 = new Customer(CUSTOMER_ID_2, loc3, 0, 0, 0, defaultProfitComponents);
    customer.setNextCustomer(customer2);
    customer2.setPreviousStandstill(customer);
    customer2.setVehicle(vehicle);
    assertThat(vehicle.getTotalDistance())
        .isEqualTo(loc1Loc2Distance.add(loc2Loc3Distance).add(loc3Loc1Distance));
  }

  DepotStop attachDepotStopToEnd(Vehicle vehicle, Customer lastCustomer) {
    DepotStop depotStop =
        new DepotStop(
            vehicle.getId(),
            vehicle.getId(),
            vehicle.getDepot().getLocation(),
            vehicle.getDepot().getDueTimestampMs(),
            true,
            defaultProfitComponents);
    depotStop.setVehicle(vehicle);
    if (lastCustomer == null) {
      vehicle.setNextCustomer(depotStop);
      depotStop.setPreviousStandstill(vehicle);
    } else {
      lastCustomer.setNextCustomer(depotStop);
      depotStop.setPreviousStandstill(lastCustomer);
    }
    return depotStop;
  }

  @Test
  void isDepotArrivalAfterDueTime() {
    long beforeDueTimestampMs = 99;
    long dueTimestampMs = 100;
    long afterDueTimestampMs = 120;
    long toleratedLatenessMs = 10;
    Depot depot = new Depot(loc1, 0, dueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);

    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);

    depotStop.setArrivalTimestampMs(beforeDueTimestampMs);
    assertThat(vehicle.isDepotArrivalAfterDueTime(toleratedLatenessMs)).isFalse();

    depotStop.setArrivalTimestampMs(dueTimestampMs);
    assertThat(vehicle.isDepotArrivalAfterDueTime(toleratedLatenessMs)).isFalse();

    depotStop.setArrivalTimestampMs(dueTimestampMs + toleratedLatenessMs);
    assertThat(vehicle.isDepotArrivalAfterDueTime(toleratedLatenessMs)).isFalse();

    depotStop.setArrivalTimestampMs(afterDueTimestampMs);
    assertThat(vehicle.isDepotArrivalAfterDueTime(toleratedLatenessMs)).isTrue();
  }

  @Test
  void getTotalWorkDurationMs_noCustomerIsZero() {
    Depot depot = new Depot(loc1, 0, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    DepotStop depotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, true, defaultProfitComponents);
    vehicle.setNextCustomer(depotStop);
    depotStop.setVehicle(vehicle);
    depotStop.setPreviousStandstill(vehicle);

    assertThat(vehicle.getTotalWorkDurationMs()).isEqualTo(0);
  }

  @Test
  void getTotalWorkDurationMs_withCustomerIsNonZero() {
    Depot depot = new Depot(loc1, 0, 0);
    DepotStop depotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, true, defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);
    customer.setNextCustomer(depotStop);
    customer.setVehicle(vehicle);
    depotStop.setVehicle(vehicle);
    depotStop.setPreviousStandstill(customer);

    assertThat(vehicle.getTotalWorkDurationMs()).isEqualTo(0);

    long customerArrivalTimestampMs = 1212L;
    long depotArrivalTimestampMs = 4321L;
    customer.setArrivalTimestampMs(customerArrivalTimestampMs);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    assertThat(vehicle.getDepotDepartureTimestampMs()).isEqualTo(depot.getReadyTimestampMs());

    assertThat(vehicle.getDepotDepartureTimestampMs())
        .isEqualTo(
            customerArrivalTimestampMs
                - vehicle.getLocation().getDistanceTo(customer.getLocation()).getDurationMs());

    assertThat(vehicle.getTotalWorkDurationMs())
        .isEqualTo(depotArrivalTimestampMs - vehicle.getDepotDepartureTimestampMs());

    long earliestPossibleDepotDepartureMs = 100L;
    vehicle.setEarliestPossibleDepotDepartureMs(earliestPossibleDepotDepartureMs);
    assertThat(vehicle.getDepotDepartureTimestampMs())
        .isEqualTo(depot.getReadyTimestampMs() + earliestPossibleDepotDepartureMs);

    assertThat(vehicle.getTotalWorkDurationMs())
        .isEqualTo(depotArrivalTimestampMs - vehicle.getDepotDepartureTimestampMs());
  }

  @Test
  void getOverTimeMs_withNoCustomers() {
    long dueTimestampMs = 3600000;
    Depot depot = new Depot(loc1, 0, dueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    assertThat(vehicle.getOvertimeMs()).isEqualTo(0);
  }

  @Test
  void getOverTimeMs_withDepotArrivalIsNULL() {
    long dueTimestampMs = 3600000;
    Depot depot = new Depot(loc1, 0, dueTimestampMs);
    DepotStop depotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, true, defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer = new Customer();
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);
    customer.setNextCustomer(depotStop);
    customer.setVehicle(vehicle);
    depotStop.setVehicle(vehicle);
    depotStop.setPreviousStandstill(customer);

    assertThat(vehicle.getOvertimeMs()).isEqualTo(0);
  }

  @Test
  void getOverTimeMs_withDepotArrivalTimestampIsLessThanDepotArrivalTimestamp() {
    long dueTimestampMs = 3600000;
    long shortArrivalTimestampMS = 500;
    Depot depot = new Depot(loc1, 0, dueTimestampMs);
    DepotStop depotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, true, defaultProfitComponents);
    depotStop.setArrivalTimestampMs(shortArrivalTimestampMS);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);
    customer.setNextCustomer(depotStop);
    customer.setVehicle(vehicle);
    depotStop.setVehicle(vehicle);
    depotStop.setPreviousStandstill(customer);

    assertThat(vehicle.getOvertimeMs()).isEqualTo(0);
  }

  @Test
  void getOverTimeMs_withDepotArrivalTimestampIsHigherThanDepotArrivalTimestamp() {
    long dueTimestampMs = 3600000;
    long arrivalTimestampMS = 4600000;
    Depot depot = new Depot(loc1, 0, dueTimestampMs);
    DepotStop depotStop =
        new DepotStop(VEHICLE_ID, VEHICLE_ID, loc1, 0, true, defaultProfitComponents);
    depotStop.setArrivalTimestampMs(arrivalTimestampMS);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);
    customer.setNextCustomer(depotStop);
    customer.setVehicle(vehicle);
    depotStop.setVehicle(vehicle);
    depotStop.setPreviousStandstill(customer);

    assertThat(vehicle.getOvertimeMs()).isEqualTo(arrivalTimestampMS - dueTimestampMs);
  }
}
