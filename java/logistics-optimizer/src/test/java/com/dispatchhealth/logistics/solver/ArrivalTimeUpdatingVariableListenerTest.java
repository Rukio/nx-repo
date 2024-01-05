package com.*company-data-covered*.logistics.solver;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.Depot;
import com.*company-data-covered*.logistics.domain.DepotStop;
import com.*company-data-covered*.logistics.domain.Location;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.google.common.collect.ImmutableMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.optaplanner.core.api.score.director.ScoreDirector;

class ArrivalTimeUpdatingVariableListenerTest {
  DefaultProfitComponents defaultProfitComponents = new DefaultProfitComponents(6000, 2200, 25000);

  private Location loc1, loc2, loc3;
  private Distance loc1Loc2Distance,
      loc1Loc3Distance,
      loc2Loc3Distance,
      loc2Loc1Distance,
      loc3Loc1Distance,
      loc3Loc2Distance;

  private final long CUSTOMER_ID_1 = 1;
  private final long CUSTOMER_ID_2 = 2;
  private final long VEHICLE_ID = 3;

  private ArrivalTimeUpdatingVariableListener updater;

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
        ImmutableMap.of(
            loc1, Distance.ZERO,
            loc2, loc1Loc2Distance,
            loc3, loc1Loc3Distance));
    loc2.setDistanceMap(
        ImmutableMap.of(
            loc1, loc2Loc1Distance,
            loc2, Distance.ZERO,
            loc3, loc2Loc3Distance));
    loc3.setDistanceMap(
        ImmutableMap.of(
            loc1, loc3Loc1Distance,
            loc2, loc3Loc2Distance,
            loc3, Distance.ZERO));

    updater = new ArrivalTimeUpdatingVariableListener();
  }

  @Test
  void updateArrivalTime_singleCustomer() {
    long vehicleReadyTimestampMs = 123L;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    long serviceDurationMs = 456L;
    Customer customer1 =
        new Customer(CUSTOMER_ID_1, loc2, 0, 0, serviceDurationMs, defaultProfitComponents);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);
    vehicle.setNextCustomer(customer1);
    attachDepotStopToEnd(vehicle, customer1);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer1);
    assertThat(customer1.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc2Distance.getDurationMs());

    assertThat(customer1.getCapacityOffsetMs()).isEqualTo(loc1Loc2Distance.getDurationMs());

    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc2Distance.getDurationMs()
                + serviceDurationMs
                + loc2Loc1Distance.getDurationMs());

    assertThat(vehicle.getOccupiedCapacityMs())
        .isEqualTo(
            loc1Loc2Distance.getDurationMs()
                + serviceDurationMs
                + loc2Loc1Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_multipleCustomer() {
    long vehicleReadyTimestampMs = 123L;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    long serviceDurationMs1 = 456L;
    Customer customer1 =
        new Customer(CUSTOMER_ID_1, loc2, 0, 0, serviceDurationMs1, defaultProfitComponents);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);

    long serviceDurationMs2 = 789L;
    Customer customer2 =
        new Customer(CUSTOMER_ID_2, loc3, 0, 0, serviceDurationMs2, defaultProfitComponents);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);
    customer1.setNextCustomer(customer2);

    vehicle.setNextCustomer(customer1);
    attachDepotStopToEnd(vehicle, customer2);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer1);

    assertThat(customer1.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc2Distance.getDurationMs());

    assertThat(customer1.getCapacityOffsetMs()).isEqualTo(loc1Loc2Distance.getDurationMs());

    assertThat(customer2.getArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs());

    assertThat(customer2.getCapacityOffsetMs())
        .isEqualTo(
            loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs());

    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs()
                + serviceDurationMs2
                + loc3Loc1Distance.getDurationMs());

    assertThat(vehicle.getOccupiedCapacityMs())
        .isEqualTo(
            +loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs()
                + serviceDurationMs2
                + loc3Loc1Distance.getDurationMs());
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
  void updateArrivalTime_multipleCustomerAfterRemoval() {
    long vehicleReadyTimestampMs = 123L;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    long serviceDurationMs1 = 456L;
    Customer customer1 =
        new Customer(CUSTOMER_ID_1, loc2, 0, 0, serviceDurationMs1, defaultProfitComponents);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);
    vehicle.setNextCustomer(customer1);

    long serviceDurationMs2 = 789L;
    Customer customer2 =
        new Customer(CUSTOMER_ID_2, loc3, 0, 0, serviceDurationMs2, defaultProfitComponents);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);
    customer1.setNextCustomer(customer2);

    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer2);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer1);

    assertThat(customer1.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc2Distance.getDurationMs());

    assertThat(customer2.getArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs());

    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs()
                + serviceDurationMs2
                + loc3Loc1Distance.getDurationMs());

    updater.beforeVariableChanged(scoreDirector, customer2);
    customer2.setPreviousStandstill(null);
    updater.afterVariableChanged(scoreDirector, customer2);

    updater.beforeVariableChanged(scoreDirector, customer1);
    customer1.setNextCustomer(depotStop);
    updater.afterVariableChanged(scoreDirector, customer1);

    updater.beforeVariableChanged(scoreDirector, depotStop);
    depotStop.setPreviousStandstill(customer1);
    updater.afterVariableChanged(scoreDirector, depotStop);

    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc1Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_noPreviousCustomerIsNull() {
    Customer customer = new Customer();

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);
    updater.updateArrivalTime(scoreDirector, customer);
    assertThat(customer.getArrivalTimestampMs()).isNull();
  }

  @Test
  void updateArrivalTime_previousCustomerUsesDuration() {
    Customer customer1 = new Customer(CUSTOMER_ID_1, loc1, 0, 0, 0, defaultProfitComponents);
    Customer customer2 = new Customer(CUSTOMER_ID_2, loc2, 0, 0, 0, defaultProfitComponents);
    Long previousDepartureTimestampMs = 123L;
    customer1.setArrivalTimestampMs(previousDepartureTimestampMs);
    customer2.setPreviousStandstill(customer1);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);
    updater.updateArrivalTime(scoreDirector, customer2);

    assertThat(customer2.getArrivalTimestampMs())
        .isEqualTo(previousDepartureTimestampMs + loc1Loc2Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_customerUsesExtraSetupDuration() {
    Customer customer1 = new Customer(CUSTOMER_ID_1, loc1, 0, 0, 0, defaultProfitComponents);
    Customer customer2 = new Customer(CUSTOMER_ID_2, loc2, 0, 0, 0, defaultProfitComponents);
    Long extraSetupDurationMs = 1000L;
    customer2.setExtraSetupDurationMs(extraSetupDurationMs);
    customer2.setPreviousStandstill(customer1);

    Long previousDepartureTimestampMs = 123L;
    customer1.setArrivalTimestampMs(previousDepartureTimestampMs);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer2);

    assertThat(customer2.getArrivalTimestampMs())
        .isEqualTo(
            previousDepartureTimestampMs + loc1Loc2Distance.getDurationMs() + extraSetupDurationMs);
  }

  @Test
  void updateArrivalTime_vehicleArrivesAfterCustomerReadyWhenVehicleStartsLate() {
    long vehicleReadyTimestampMs = 0L;
    long customerEarlyReadyTimestampMs =
        vehicleReadyTimestampMs + loc1Loc3Distance.getDurationMs() - 1;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    Customer customer =
        new Customer(
            CUSTOMER_ID_1, loc3, customerEarlyReadyTimestampMs, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer);

    assertThat(customer.getArrivalTimestampMs()).isEqualTo(loc1Loc3Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_vehicleArrivesAtCustomerReadyWhenVehicleStartsEarly() {
    long vehicleReadyTimestampMs = 0L;
    long customerLateReadyTimestampMs =
        vehicleReadyTimestampMs + loc1Loc3Distance.getDurationMs() + 1;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    Customer customer =
        new Customer(
            CUSTOMER_ID_1, loc3, customerLateReadyTimestampMs, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer);

    assertThat(customer.getArrivalTimestampMs()).isEqualTo(customerLateReadyTimestampMs);
    assertThat(customer.getCapacityOffsetMs()).isEqualTo(loc1Loc3Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_spaceInScheduleDoesNotOccupyCapacity() {
    long vehicleReadyTimestampMs = 123l;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    long customer1ReadyTimestamp = vehicleReadyTimestampMs + loc1Loc2Distance.getDurationMs() + 10;
    long serviceDurationMs1 = 456L;
    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            loc2,
            customer1ReadyTimestamp,
            0,
            serviceDurationMs1,
            defaultProfitComponents);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);

    long customer2ReadyTimestamp =
        vehicleReadyTimestampMs
            + loc1Loc2Distance.getDurationMs()
            + loc2Loc3Distance.getDurationMs()
            + 20;
    long serviceDurationMs2 = 789L;
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            loc3,
            customer2ReadyTimestamp,
            0,
            serviceDurationMs2,
            defaultProfitComponents);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);
    customer1.setNextCustomer(customer2);

    vehicle.setNextCustomer(customer1);
    attachDepotStopToEnd(vehicle, customer2);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer1);

    assertThat(vehicle.getOccupiedCapacityMs())
        .isEqualTo(
            loc1Loc2Distance.getDurationMs()
                + serviceDurationMs1
                + loc2Loc3Distance.getDurationMs()
                + serviceDurationMs2
                + loc3Loc1Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_pinnedCustomerDoesNotChangeArrivalTimestamp() {
    long vehicleReadyTimestampMs = 123L;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    Customer customer = new Customer(CUSTOMER_ID_1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);

    customer.setPinned(true);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);
    updater.updateArrivalTime(scoreDirector, customer);

    assertThat(customer.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc2Distance.getDurationMs());

    long actualArrivalTime = 125L;
    customer.setActualArrivalTimestampMs(actualArrivalTime);

    updater.updateArrivalTime(scoreDirector, customer);

    assertThat(customer.getArrivalTimestampMs()).isEqualTo(actualArrivalTime);
  }

  @Test
  void updateArrivalTime_multipleOverlapCustomers() {
    long vehicleReadyTimestampMs = 123L;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    long serviceDurationMs1 = 789L;
    Customer customer1 = new Customer(-1, loc3, 0, 0, serviceDurationMs1, defaultProfitComponents);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);

    String overlapSetKey = "planning";
    customer1.setOverlapSetKey(overlapSetKey);

    long serviceDurationMs2 = 456L;
    Customer customer2 = new Customer(-2, loc2, 0, 0, serviceDurationMs2, defaultProfitComponents);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);
    customer2.setOverlapSetKey(overlapSetKey);
    customer1.setNextCustomer(customer2);

    vehicle.setNextCustomer(customer1);
    attachDepotStopToEnd(vehicle, customer2);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer1);

    assertThat(customer1.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc3Distance.getDurationMs());

    assertThat(customer1.getCapacityOffsetMs()).isEqualTo(loc1Loc3Distance.getDurationMs());

    assertThat(customer2.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc2Distance.getDurationMs());

    assertThat(customer2.getCapacityOffsetMs()).isEqualTo(loc1Loc2Distance.getDurationMs());

    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc3Distance.getDurationMs()
                + serviceDurationMs1
                + loc3Loc1Distance.getDurationMs());

    assertThat(vehicle.getOccupiedCapacityMs())
        .isEqualTo(
            loc1Loc3Distance.getDurationMs()
                + serviceDurationMs1
                + loc3Loc1Distance.getDurationMs());
  }

  @Test
  void updateArrivalTime_multipleOverlapCustomersAndAMiddleNoOverlappedCustomer() {
    long vehicleReadyTimestampMs = 123L;
    Depot depot = new Depot(loc1, vehicleReadyTimestampMs, 0);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    long serviceDurationMs1 = 789L;
    Customer customer1 = new Customer(-1, loc3, 0, 0, serviceDurationMs1, defaultProfitComponents);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);

    String overlapSetKey = "planning";
    customer1.setOverlapSetKey(overlapSetKey);

    long serviceDurationMs2 = 456L;
    Customer customer2 =
        new Customer(CUSTOMER_ID_1, loc2, 0, 0, serviceDurationMs2, defaultProfitComponents);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);
    customer1.setNextCustomer(customer2);

    Customer customer3 = new Customer(-2, loc3, 0, 0, serviceDurationMs1, defaultProfitComponents);
    customer3.setPreviousStandstill(customer2);
    customer3.setVehicle(vehicle);
    customer3.setOverlapSetKey(overlapSetKey);
    customer2.setNextCustomer(customer3);

    vehicle.setNextCustomer(customer1);
    attachDepotStopToEnd(vehicle, customer3);

    @SuppressWarnings("unchecked")
    ScoreDirector<VehicleRoutingSolution> scoreDirector = mock(ScoreDirector.class);

    updater.updateArrivalTime(scoreDirector, customer1);

    assertThat(customer1.getArrivalTimestampMs())
        .isEqualTo(vehicleReadyTimestampMs + loc1Loc3Distance.getDurationMs());

    assertThat(customer1.getCapacityOffsetMs()).isEqualTo(loc1Loc3Distance.getDurationMs());

    assertThat(customer2.getArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc3Distance.getDurationMs()
                + loc3Loc2Distance.getDurationMs()
                + serviceDurationMs1);

    assertThat(customer2.getCapacityOffsetMs())
        .isEqualTo(
            loc1Loc3Distance.getDurationMs()
                + loc3Loc2Distance.getDurationMs()
                + serviceDurationMs1);

    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            vehicleReadyTimestampMs
                + loc1Loc3Distance.getDurationMs()
                + serviceDurationMs1
                + loc3Loc2Distance.getDurationMs()
                + serviceDurationMs2
                + loc2Loc3Distance.getDurationMs()
                + serviceDurationMs1
                + loc3Loc1Distance.getDurationMs());

    assertThat(vehicle.getOccupiedCapacityMs())
        .isEqualTo(
            loc1Loc3Distance.getDurationMs()
                + serviceDurationMs1
                + loc3Loc2Distance.getDurationMs()
                + serviceDurationMs2
                + loc2Loc3Distance.getDurationMs()
                + serviceDurationMs1
                + loc3Loc1Distance.getDurationMs());
  }
}
