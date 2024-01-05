package com.*company-data-covered*.logistics.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SinkVehicleTest {

  private Depot depot;
  DefaultProfitComponents defaultProfitComponents = new DefaultProfitComponents(6000, 2200, 25000);

  @BeforeEach
  void setUp() {
    Location location = new Location(1, 1.23, 4.56);

    depot = new Depot(location, 0, 0);
  }

  @Test
  void isDepotArrivalAfterDueTime() {
    SinkVehicle vehicle = new SinkVehicle(depot, defaultProfitComponents);

    assertThat(vehicle.isDepotArrivalAfterDueTime(0)).isFalse();
  }

  @Test
  void getDepotArrivalTimestampMs() {
    SinkVehicle vehicle = new SinkVehicle(depot, defaultProfitComponents);

    assertThat(vehicle.getDepotArrivalTimestampMs()).isEqualTo(0L);
  }

  @Test
  void getNumProviderDHMT() {
    SinkVehicle vehicle = new SinkVehicle(depot, defaultProfitComponents);

    assertThat(vehicle.getNumProviderDHMT()).isEqualTo(0);
  }

  @Test
  void getNumProviderAPP() {
    SinkVehicle vehicle = new SinkVehicle(depot, defaultProfitComponents);

    assertThat(vehicle.getNumProviderAPP()).isEqualTo(0);
  }

  @Test
  void getTotalDistance() {
    SinkVehicle vehicle = new SinkVehicle(depot, defaultProfitComponents);

    Location location = new Location(2, 2.34, 5.67);
    Customer customer = new Customer(1, location, 0, 0, 0, defaultProfitComponents);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    assertThat(vehicle.getTotalDistance()).isEqualTo(Distance.ZERO);
  }

  @Test
  void getTotalWorkDurationMs() {
    SinkVehicle vehicle = new SinkVehicle(depot, defaultProfitComponents);

    assertThat(vehicle.getTotalWorkDurationMs()).isEqualTo(0L);
  }
}
