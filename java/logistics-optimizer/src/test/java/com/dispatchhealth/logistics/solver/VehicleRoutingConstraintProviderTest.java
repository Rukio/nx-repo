package com.*company-data-covered*.logistics.solver;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.domain.Attribute;
import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.Depot;
import com.*company-data-covered*.logistics.domain.DepotStop;
import com.*company-data-covered*.logistics.domain.Location;
import com.*company-data-covered*.logistics.domain.RestBreak;
import com.*company-data-covered*.logistics.domain.SinkVehicle;
import com.*company-data-covered*.logistics.domain.Standstill;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolutionConstraintConfiguration;
import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.optimizer.VRPVisit;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.optaplanner.test.api.score.stream.ConstraintVerifier;

class VehicleRoutingConstraintProviderTest {
  private static final long MS_PER_MINUTE = 60000;
  private static final long MS_PER_HOUR = 3600000;
  private static final long USD_MILLS_PER_CENT = 10;

  private static final long METERS_PER_KILOMETER = 1000;

  static final long defaultAPPHourlyCostUSDCents = 6000;
  static final long defaultDHMTCostUSDCents = 2200;

  static final int defaultNumShiftProviders = 1;

  static final long defaultVisitRevenueUSDCents = 25000;
  final DefaultProfitComponents defaultProfitComponents =
      new DefaultProfitComponents(
          defaultAPPHourlyCostUSDCents, defaultDHMTCostUSDCents, defaultVisitRevenueUSDCents);

  private Location loc1, loc2;
  private Distance loc1Loc2Distance, loc2Loc1Distance;

  ConstraintVerifier<VehicleRoutingConstraintProvider, VehicleRoutingSolution> constraintVerifier;

  VehicleRoutingSolutionConstraintConfiguration defaultConstraintConfig =
      new VehicleRoutingSolutionConstraintConfiguration();

  @BeforeEach
  void setUp() {
    loc1 = new Location(1, 1.23, 4.56);
    loc2 = new Location(2, 2.34, 5.67);

    loc1Loc2Distance = Distance.of(1212, 12);
    loc2Loc1Distance = Distance.of(2121, 21);
    loc1.setDistanceMap(ImmutableMap.of(loc1, Distance.ZERO, loc2, loc1Loc2Distance));
    loc2.setDistanceMap(ImmutableMap.of(loc1, loc2Loc1Distance, loc2, Distance.ZERO));

    constraintVerifier =
        ConstraintVerifier.build(
            new VehicleRoutingConstraintProvider(),
            VehicleRoutingSolution.class,
            Standstill.class,
            Vehicle.class,
            Customer.class);
  }

  // TODO: Add a test that exercises all constraints together.

  @Test
  void vehicleArrivesAtCustomerLate_earlyArrivalNoPenalty() {
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtCustomerLate)
        .given(defaultConstraintConfig)
        .penalizesBy(0);

    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, 0), defaultProfitComponents);

    long earlyArrivalTimestampMs = 1;
    long dueTimestampMs1 = 3;
    Customer customer = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer.setArrivalTimestampMs(earlyArrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtCustomerLate)
        .given(defaultConstraintConfig, customer)
        .penalizesBy(0);
  }

  @Test
  void linearOffsetLatenessToCustomerUSDMills() {
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::linearOffsetLatenessToCustomerUSDMills)
        .given(defaultConstraintConfig)
        .penalizesBy(0);

    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, 0), defaultProfitComponents);

    long dueTimestampMs1 = 3;
    long lateArrivalTimestampMs1 = 50;
    Customer customer1 = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer1.setArrivalTimestampMs(lateArrivalTimestampMs1);
    customer1.setPreviousStandstill(vehicle);

    long dueTimestampMs2 = 100;
    long lateArrivalTimestampMs2 = dueTimestampMs2 + MS_PER_MINUTE;
    Customer customer2 = new Customer(2, null, 0, dueTimestampMs2, 0, defaultProfitComponents);
    customer2.setArrivalTimestampMs(lateArrivalTimestampMs2);
    customer2.setPreviousStandstill(customer1);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::linearOffsetLatenessToCustomerUSDMills)
        .given(defaultConstraintConfig, customer1, customer2)
        // one minute late; the scaling is applied by the ConstraintWeight which isn't tested.
        .penalizesBy(1);
  }

  @Test
  void linearOffsetClinicalUrgencyLatenessToCustomerUSDMills() {
    constraintVerifier
        .verifyThat(
            VehicleRoutingConstraintProvider::linearOffsetClinicalUrgencyLatenessToCustomerUSDMills)
        .given(defaultConstraintConfig)
        .penalizesBy(0);

    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, 0), defaultProfitComponents);

    long dueTimestampMs1 = 3;
    long lateArrivalTimestampMs1 = 50;
    long acuityTWStart1 = 0;
    long acuityTWEnd1 = lateArrivalTimestampMs1;
    Customer customer1 = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer1.setArrivalTimestampMs(lateArrivalTimestampMs1);
    customer1.setAcuityTimeWindowStartMs(acuityTWStart1);
    customer1.setAcuityTimeWindowEndMs(acuityTWEnd1);
    customer1.setPreviousStandstill(vehicle);

    long dueTimestampMs2 = 100;
    long lateArrivalTimestampMs2 = dueTimestampMs2 + MS_PER_MINUTE;
    long acuityTWStart2 = 0;
    long acuityTWEnd2 = dueTimestampMs2;
    Customer customer2 = new Customer(2, null, 0, dueTimestampMs2, 0, defaultProfitComponents);
    customer2.setArrivalTimestampMs(lateArrivalTimestampMs2);
    customer2.setAcuityTimeWindowStartMs(acuityTWStart2);
    customer2.setAcuityTimeWindowEndMs(acuityTWEnd2);
    customer2.setPreviousStandstill(customer1);

    constraintVerifier
        .verifyThat(
            VehicleRoutingConstraintProvider::linearOffsetClinicalUrgencyLatenessToCustomerUSDMills)
        .given(defaultConstraintConfig, customer1, customer2)
        // one minute late; the scaling is applied by the ConstraintWeight which isn't tested.
        .penalizesBy(1);
  }

  @Test
  void linearOffsetLatenessToDepotUSDMills() {
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::linearOffsetLatenessToDepotUSDMills)
        .given(defaultConstraintConfig)
        .penalizesBy(0);

    long dueTimestampMs = 400000;
    long lateArrivalTimestampMs = 520000;

    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);

    Customer customer = new Customer(1, null, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);

    vehicle.setNextCustomer(customer);

    DepotStop depotStop =
        new DepotStop(
            vehicle.getId(),
            vehicle.getId(),
            vehicle.getDepot().getLocation(),
            vehicle.getDepot().getDueTimestampMs(),
            true,
            defaultProfitComponents);
    depotStop.setVehicle(vehicle);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);
    depotStop.setPreviousStandstill(customer);

    customer.setNextCustomer(depotStop);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::linearOffsetLatenessToDepotUSDMills)
        .given(defaultConstraintConfig, customer, vehicle, depotStop)
        .penalizesBy(2);
  }

  @Test
  void vehicleArrivesAtCustomerLate_unpinnedLateArrivalPenalty() {
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtCustomerLate)
        .given(defaultConstraintConfig)
        .penalizesBy(0);
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, 0), defaultProfitComponents);

    long dueTimestampMs1 = 3;
    long lateArrivalTimestampMs1 = 50;
    Customer customer1 = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer1.setArrivalTimestampMs(lateArrivalTimestampMs1);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);

    long dueTimestampMs2 = 100;
    long lateArrivalTimestampMs2 = 123;
    Customer customer2 = new Customer(2, null, 0, dueTimestampMs2, 0, defaultProfitComponents);
    customer2.setArrivalTimestampMs(lateArrivalTimestampMs2);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtCustomerLate)
        .given(defaultConstraintConfig, customer1, customer2)
        .penalizesBy(
            (lateArrivalTimestampMs1 - dueTimestampMs1)
                + (lateArrivalTimestampMs2 - dueTimestampMs2));
  }

  @Test
  void vehicleArrivesAtCustomerLate_pinnedLateArrivalNoPenalty() {
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, 0), defaultProfitComponents);

    long dueTimestampMs1 = 3;
    long lateArrivalTimestampMs1 = 50;
    Customer customer1 = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer1.setArrivalTimestampMs(lateArrivalTimestampMs1);
    customer1.setPreviousStandstill(vehicle);
    customer1.setPinned(true);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtCustomerLate)
        .given(defaultConstraintConfig, customer1)
        .penalizesBy(0);
  }

  @Test
  void vehicleArrivesAtDepotLate_earlyArrivalNoPenalty() {
    long earlyArrivalTimestampMs = 23;
    long dueTimestampMs = 100;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setPinned(false);
    vehicle.setNextCustomer(customer);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(earlyArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(customer, vehicle, depotStop)
        .penalizesBy(0);
  }

  @Test
  void vehicleArrivesAtDepotLate_lateArrivalPenalty() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setPinned(false);
    vehicle.setNextCustomer(customer);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(defaultConstraintConfig, customer, depotStop)
        .penalizesBy(lateArrivalTimestampMs - dueTimestampMs);
  }

  @Test
  void vehicleArrivesAtDepotLate_hardLatenessThresholdNoPenalty() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setPinned(false);
    vehicle.setNextCustomer(customer);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);

    long toleratedLatenessMs = 23;
    VehicleRoutingSolutionConstraintConfiguration configWithDepotHardLatenessThreshold =
        new VehicleRoutingSolutionConstraintConfiguration();
    configWithDepotHardLatenessThreshold.setDepotHardLatenessThresholdMs(toleratedLatenessMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(configWithDepotHardLatenessThreshold, customer, depotStop)
        // late arrival exactly at tolerated lateness doesn't exceed threshold.
        .penalizesBy(0);
  }

  @Test
  void vehicleArrivesAtDepotLate_hardLatenessThresholdAndDisallowedVisits() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setPinned(false);
    vehicle.setNextCustomer(customer);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);

    long toleratedLatenessMs = 23;
    VehicleRoutingSolutionConstraintConfiguration configWithDisallowedVisits =
        new VehicleRoutingSolutionConstraintConfiguration();
    configWithDisallowedVisits.setDepotHardLatenessThresholdMs(toleratedLatenessMs);
    configWithDisallowedVisits.setDisallowedLateArrivalVisitIds(ImmutableSet.of(customer.getId()));

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(configWithDisallowedVisits, customer, depotStop)
        // late arrival doesn't exceed threshold, but visit is disallowed.
        .penalizesBy(lateArrivalTimestampMs - dueTimestampMs);
  }

  @Test
  void vehicleArrivesAtDepotLate_allCustomersIgnoreHardConstraintNoPenalty() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);

    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPinned(true);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);

    Customer customer2 = new Customer(2, loc1, 0, 0, 0, defaultProfitComponents);
    customer2.setPinned(true);
    customer2.setPreviousStandstill(customer);
    customer2.setVehicle(vehicle);
    customer.setNextCustomer(customer2);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer2);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(customer, customer2, depotStop, vehicle)
        .penalizesBy(0);
  }

  @Test
  void vehicleArrivesAtCustomerLate_lateArrivalSinkVehicleNoPenalty() {
    SinkVehicle sinkVehicle = new SinkVehicle(new Depot(null, 0, 0), defaultProfitComponents);

    long dueTimestampMs1 = 3;
    long lateArrivalTimestampMs1 = 50;
    Customer customer1 = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer1.setArrivalTimestampMs(lateArrivalTimestampMs1);
    customer1.setPreviousStandstill(sinkVehicle);
    customer1.setVehicle(sinkVehicle);
    customer1.setPinned(false);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtCustomerLate)
        .given(defaultConstraintConfig, customer1)
        .penalizesBy(0);
  }

  @Test
  void vehicleArrivesAtDepotLate_lateArrivalSinkVehicleNoPenalty() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    SinkVehicle sinkVehicle =
        new SinkVehicle(new Depot(null, 0, dueTimestampMs), defaultProfitComponents);
    // sink vehicles don't normally have depot stops to begin with.
    DepotStop depotStop = attachDepotStopToEnd(sinkVehicle, null);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(sinkVehicle)
        .penalizesBy(0);
  }

  @Test
  void vehicleArrivesAtDepotLate_noCustomersIgnoreHardConstraintAndLateAddsPenalty() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);

    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPinned(false);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);

    Customer customer2 = new Customer(2, loc1, 0, 0, 0, defaultProfitComponents);
    customer2.setPinned(false);
    customer2.setPreviousStandstill(customer);
    customer2.setVehicle(vehicle);
    customer.setNextCustomer(customer2);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer2);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(defaultConstraintConfig, customer, customer2, depotStop)
        .penalizesBy(lateArrivalTimestampMs - dueTimestampMs);
  }

  @Test
  void vehicleArrivesAtDepotLate_someCustomersIgnoreHardConstraintAndLateAddsPenalty() {
    long dueTimestampMs = 100;
    long lateArrivalTimestampMs = 123;
    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, dueTimestampMs), defaultProfitComponents);

    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPinned(true);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);

    Customer customer2 = new Customer(2, loc1, 0, 0, 0, defaultProfitComponents);
    customer2.setPinned(false);
    customer2.setPreviousStandstill(customer);
    customer2.setVehicle(vehicle);
    customer.setNextCustomer(customer2);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer2);
    depotStop.setArrivalTimestampMs(lateArrivalTimestampMs);
    vehicle.setNextCustomer(customer);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleArrivesAtDepotLate)
        .given(defaultConstraintConfig, customer, customer2, depotStop)
        .penalizesBy(lateArrivalTimestampMs - dueTimestampMs);
  }

  @Test
  void vehicleIsOverCapacity_atCapacityNoPenalty() {
    long shiftStartTimestampMs = 100;
    long capacityMs = 50;
    long depotCapacityOffsetMs = 50;

    Vehicle vehicle =
        new Vehicle(1, new Depot(null, shiftStartTimestampMs, 0), defaultProfitComponents);
    vehicle.setCapacityMs(capacityMs);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setPinned(false);
    vehicle.setNextCustomer(customer);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setCapacityOffsetMs(depotCapacityOffsetMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleIsOverCapacity)
        .given(vehicle, customer, depotStop)
        .penalizesBy(0);
  }

  @Test
  void vehicleIsOverCapacity_overCapacityPenalty() {
    long shiftStartTimestampMs = 100;
    long capacityMs = 10;
    long depotCapacityOffsetMs = 123;

    Vehicle vehicle =
        new Vehicle(1, new Depot(null, shiftStartTimestampMs, 0), defaultProfitComponents);
    vehicle.setCapacityMs(capacityMs);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setPinned(false);
    vehicle.setNextCustomer(customer);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);

    depotStop.setCapacityOffsetMs(depotCapacityOffsetMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleIsOverCapacity)
        .given(vehicle, customer, depotStop)
        .penalizesBy(depotCapacityOffsetMs - capacityMs);
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
  void completedVisitRevenue_visitWithVehicleHasRewards() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::completedVisitRevenueUSDMills)
        .given(customer)
        .rewardsWith(defaultVisitRevenueUSDCents * USD_MILLS_PER_CENT);

    long revenue = 2000L;
    customer.setVisitValueCents(VRPVisit.newBuilder().setPerVisitRevenueUsdCents(revenue).build());
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::completedVisitRevenueUSDMills)
        .given(defaultConstraintConfig, customer)
        .rewardsWith(revenue * USD_MILLS_PER_CENT);
  }

  @Test
  void completedVisitRevenue_visitWithSinkVehicleHasNoRewards() {
    SinkVehicle sinkVehicle =
        new SinkVehicle(SinkVehicle.DEFAULT_ID, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPreviousStandstill(sinkVehicle);
    customer.setVehicle(sinkVehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::completedVisitRevenueUSDMills)
        .given(defaultConstraintConfig, customer)
        .rewardsWith(0);
  }

  @Test
  void vehicleOvertimePenalty_noOvertimeNoPenalty() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 10000), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 1500, 1600, 1000, defaultProfitComponents);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleProviderOvertimeUSDMills)
        .given(vehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void vehicleOvertimePenalty_overtimeAccruesPenalty() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 10000), defaultProfitComponents);
    vehicle.setNumProviderDHMT(defaultNumShiftProviders);
    vehicle.setNumProviderAPP(defaultNumShiftProviders);
    Customer customer = new Customer(1, loc2, 0, 1600, 10000, defaultProfitComponents);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    long latenessMs = 5000;
    depotStop.setArrivalTimestampMs(depotStop.getDueTimestampMs() + latenessMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleProviderOvertimeUSDMills)
        .given(vehicle, customer)
        .penalizesBy(
            (latenessMs
                    * (defaultNumShiftProviders * defaultAPPHourlyCostUSDCents
                        + defaultDHMTCostUSDCents * defaultNumShiftProviders)
                    * USD_MILLS_PER_CENT)
                / MS_PER_HOUR);
  }

  @Test
  void vehicleOnSceneCostPenalty() {
    long shortScheduleDurationMs = 3600000;
    long serviceDurationMs = Duration.ofHours(1).toMillis();
    double scale = 2.5;

    Location locCustomer = new Location(2, 2.34, 5.67);

    Vehicle v1 =
        new Vehicle(1, new Depot(loc1, 0, shortScheduleDurationMs), defaultProfitComponents);
    v1.setNumProviderAPP(1);
    v1.setNumProviderDHMT(2);

    Customer c1 =
        new Customer(1, locCustomer, 0, 10000, serviceDurationMs, defaultProfitComponents);
    c1.setVehicle(v1);
    v1.setNextCustomer(c1);
    c1.setPreviousStandstill(v1);

    VehicleRoutingSolutionConstraintConfiguration config =
        new VehicleRoutingSolutionConstraintConfiguration();
    config.setVehicleOnSceneProviderCostScale(scale);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleOnSceneTimeCostUSDMills)
        .given(v1, c1, config)
        .penalizesBy((long) (scale * v1.perHourProviderCostUSDCents() * USD_MILLS_PER_CENT));
  }

  @Test
  void foregoneVisitOpportunityCostPenalty() {
    long shortScheduleDurationMs = 3600000;
    long serviceDurationMs = Duration.ofMinutes(30).toMillis();

    Location locCustomer = new Location(2, 2.34, 5.67);

    Vehicle v1 =
        new Vehicle(1, new Depot(loc1, 0, shortScheduleDurationMs), defaultProfitComponents);

    VehicleRoutingSolutionConstraintConfiguration config =
        new VehicleRoutingSolutionConstraintConfiguration();
    config.setCurrentTimestampMs(0);

    double centsPerMs = 0.5 / MS_PER_MINUTE;
    config.setLinearForegoneVisitValueCentsPerMs(centsPerMs);

    Customer c1 =
        new Customer(1, locCustomer, 0, 10000, serviceDurationMs, defaultProfitComponents);
    c1.setVehicle(v1);
    v1.setNextCustomer(c1);
    c1.setPreviousStandstill(v1);

    long latestArrivalTimestampMs = Duration.ofHours(10).plus(Duration.ofMinutes(18)).toMillis();
    c1.setArrivalTimestampMs(latestArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::foregoneVisitOpportunityCostMills)
        .given(v1, c1, config)
        .penalizesBy(
            (long)
                (centsPerMs * (latestArrivalTimestampMs + serviceDurationMs) * USD_MILLS_PER_CENT));

    Customer c2 =
        new Customer(1, locCustomer, 0, 10000, serviceDurationMs, defaultProfitComponents);
    c2.setVehicle(v1);
    v1.setNextCustomer(c2);
    c2.setPreviousStandstill(v1);

    long earliestArrivalTimestampMs = Duration.ofHours(8).plus(Duration.ofMinutes(10)).toMillis();
    c2.setArrivalTimestampMs(earliestArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::foregoneVisitOpportunityCostMills)
        .given(v1, c2, config)
        .penalizesBy(
            (long)
                (centsPerMs
                    * (earliestArrivalTimestampMs + serviceDurationMs)
                    * USD_MILLS_PER_CENT));

    config.setLinearForegoneVisitValueCentsPerMs(0f);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::foregoneVisitOpportunityCostMills)
        .given(v1, c2, config)
        .penalizesBy(0);
  }

  @Test
  void foregoneVisitOpportunityCostPenalty_pinnedCustomers() {
    long shortScheduleDurationMs = 3600000;
    long serviceDurationMs = Duration.ofMinutes(30).toMillis();

    Location locCustomer = new Location(2, 2.34, 5.67);

    Vehicle vehicle =
        new Vehicle(1, new Depot(loc1, 0, shortScheduleDurationMs), defaultProfitComponents);

    VehicleRoutingSolutionConstraintConfiguration config =
        new VehicleRoutingSolutionConstraintConfiguration();

    double centsPerMs = 0.5 / MS_PER_MINUTE;
    config.setLinearForegoneVisitValueCentsPerMs(centsPerMs);

    Customer customer =
        new Customer(1, locCustomer, 0, 10000, serviceDurationMs, defaultProfitComponents);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    customer.setPinned(true);

    long arrivalTimestampMs = Duration.ofHours(10).toMillis();
    customer.setArrivalTimestampMs(arrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::foregoneVisitOpportunityCostMills)
        .given(vehicle, customer, config)
        .penalizesBy(0);
  }

  @Test
  void foregoneVisitOpportunityCostPenalty_lateToArrivalTimestamp() {
    long shortScheduleDurationMs = 3600000;
    long serviceDurationMs = Duration.ofMinutes(30).toMillis();

    Location locCustomer = new Location(2, 2.34, 5.67);

    Vehicle vehicle =
        new Vehicle(1, new Depot(loc1, 0, shortScheduleDurationMs), defaultProfitComponents);

    VehicleRoutingSolutionConstraintConfiguration config =
        new VehicleRoutingSolutionConstraintConfiguration();

    double centsPerMs = 0.5 / MS_PER_MINUTE;
    config.setLinearForegoneVisitValueCentsPerMs(centsPerMs);

    long arrivalTimestampMs = Duration.ofHours(10).toMillis();
    // Make the arrival timestamp to be in the past.
    config.setCurrentTimestampMs(
        arrivalTimestampMs + serviceDurationMs + Duration.ofMinutes(10).toMillis());

    Customer customer =
        new Customer(1, locCustomer, 0, 10000, serviceDurationMs, defaultProfitComponents);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    customer.setArrivalTimestampMs(arrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::foregoneVisitOpportunityCostMills)
        .given(vehicle, customer, config)
        .penalizesBy(0);
  }

  @Test
  void vehicleProviderBaseWageCostPenalty() {
    long shortScheduleDurationMs = 3600000;
    long longScheduleDurationMs = 7200000;
    long customAppHourlyCostUSDCents = 9000;
    long customDHMTHourlyCostUSDCents = 5000;

    Vehicle v1 =
        new Vehicle(1, new Depot(loc1, 0, shortScheduleDurationMs), defaultProfitComponents);
    v1.setNumProviderAPP(defaultNumShiftProviders);
    v1.setNumProviderDHMT(defaultNumShiftProviders);
    Vehicle v2 =
        new Vehicle(2, new Depot(loc2, 0, longScheduleDurationMs), defaultProfitComponents);
    v2.setAPPHourlyCostUSDCents(customAppHourlyCostUSDCents);
    v2.setDHMTHourlyCostUSDCents(customDHMTHourlyCostUSDCents);
    v2.setNumProviderAPP(defaultNumShiftProviders);
    v2.setNumProviderDHMT(defaultNumShiftProviders);

    long v1Penalization =
        (shortScheduleDurationMs
                * (defaultNumShiftProviders * defaultAPPHourlyCostUSDCents
                    + defaultDHMTCostUSDCents * defaultNumShiftProviders)
                * USD_MILLS_PER_CENT)
            / MS_PER_HOUR;
    long v2Penalization =
        (longScheduleDurationMs
                * (defaultNumShiftProviders * customAppHourlyCostUSDCents
                    + customDHMTHourlyCostUSDCents * defaultNumShiftProviders)
                * USD_MILLS_PER_CENT)
            / MS_PER_HOUR;

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleBaseWageCostUSDMills)
        .given(v1)
        .penalizesBy(v1Penalization);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleBaseWageCostUSDMills)
        .given(v2)
        .penalizesBy(v2Penalization);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleBaseWageCostUSDMills)
        .given(v1, v2)
        .penalizesBy(v1Penalization + v2Penalization);
  }

  @Test
  void vehicleDriveCostPenalty() {

    Location locDepot = new Location(1, 1.23, 4.56);
    Location locCustomer = new Location(2, 2.34, 5.67);
    Distance locDepotLocC1Distance = Distance.of(1212, 20000);
    Distance locC1LocDepotDistance = Distance.of(2121, 21000);
    locDepot.setDistanceMap(
        ImmutableMap.of(locDepot, Distance.ZERO, locCustomer, locDepotLocC1Distance));
    locCustomer.setDistanceMap(
        ImmutableMap.of(locCustomer, Distance.ZERO, locDepot, locC1LocDepotDistance));

    Vehicle vehicle = new Vehicle(1, new Depot(locDepot, 0, 10000), defaultProfitComponents);
    Customer c1 = new Customer(1, locCustomer, 0, 10000, 1000, defaultProfitComponents);
    c1.setVehicle(vehicle);
    vehicle.setNextCustomer(c1);
    c1.setPreviousStandstill(vehicle);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, c1);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleDriveCostUSDMills)
        .given(vehicle, c1, defaultConstraintConfig)
        .penalizesBy(
            (locDepotLocC1Distance.getMeters() + locC1LocDepotDistance.getMeters())
                / METERS_PER_KILOMETER);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_noAttributes() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void
      vehicleUnmatchedAttributesForCustomer_sinkVehicleMissingCustomerRequiredAttributesHasNoPenalty() {
    SinkVehicle sinkVehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(Attribute.of("customer only attribute")), ImmutableList.of()));
    customer.setVehicle(sinkVehicle);
    sinkVehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(sinkVehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(sinkVehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_vehicleMissingCustomerRequiredAttributesHasPenalty() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(Attribute.of("customer only attribute")), ImmutableList.of()));
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(1);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_vehicleHasSomeCustomerRequiredAttributes() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);

    Attribute commonAttribute = Attribute.of("common attribute");
    Attribute customerOnlyAttribute1 = Attribute.of("customer only attribute 1");
    Attribute customerOnlyAttribute2 = Attribute.of("customer only attribute 2");
    Attribute vehicleOnlyAttribute = Attribute.of("vehicle only attribute");

    vehicle.setAttributes(ImmutableSet.of(vehicleOnlyAttribute, commonAttribute));
    customer.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(customerOnlyAttribute1, customerOnlyAttribute2, commonAttribute),
            ImmutableList.of()));
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(2);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_vehicleHasForbiddenAttribute() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);

    Attribute commonAttribute = Attribute.of("common attribute");
    Attribute customerOnlyAttribute1 = Attribute.of("customer only attribute 1");
    Attribute customerOnlyAttribute2 = Attribute.of("customer only attribute 2");
    Attribute vehicleOnlyAttribute = Attribute.of("vehicle only attribute");

    vehicle.setAttributes(ImmutableSet.of(vehicleOnlyAttribute, commonAttribute));
    customer.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(),
            ImmutableList.of(customerOnlyAttribute1, customerOnlyAttribute2, commonAttribute)));
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(1);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_vehicleDoesNotHaveForbiddenAttribute() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);

    Attribute commonRequiredAttribute = Attribute.of("common required attribute");
    Attribute customerOnlyForbiddenAttribute1 = Attribute.of("customer only forbidden attribute");
    Attribute vehicleOnlyAttribute = Attribute.of("vehicle only attribute");

    vehicle.setAttributes(ImmutableSet.of(vehicleOnlyAttribute, commonRequiredAttribute));
    customer.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(commonRequiredAttribute),
            ImmutableList.of(customerOnlyForbiddenAttribute1)));
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_forbiddenAttributesPinnedNoPenalty() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);

    Attribute commonAttribute = Attribute.of("common attribute");
    customer.setAssignabilityChecker(
        new AssignabilityChecker(ImmutableList.of(), ImmutableList.of(commonAttribute)));
    vehicle.setAttributes(ImmutableSet.of(commonAttribute));
    customer.setPinned(true);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void vehicleUnmatchedAttributesForCustomer_missingAttributesPinnedNoPenalty() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(Attribute.of("customer only attribute")), ImmutableList.of()));
    customer.setPinned(true);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    customer.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::vehicleUnmatchedAttributesForCustomer)
        .given(vehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void unassignedCustomers_nonSinkVehicleHasNoUnassignedCustomers() {
    Vehicle vehicle = new Vehicle(1, new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    long arrivalTimestampMs = 1212L;
    customer.setArrivalTimestampMs(arrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);

    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    long totalWorkDurationMs =
        depotArrivalTimestampMs - (arrivalTimestampMs - loc1Loc2Distance.getDurationMs());

    assertThat(vehicle.getTotalWorkDurationMs()).isEqualTo(totalWorkDurationMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(vehicle, customer)
        .penalizesBy(0);
  }

  @Test
  void unassignedCustomers_sinkVehicleHasUnassignedCustomersPenalty() {
    Vehicle vehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setAcuityLevel(2);
    long arrivalTimestampMs = 123L;
    customer.setArrivalTimestampMs(arrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);
    customer.setAcuityLevel(2);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(defaultConstraintConfig, vehicle, customer, depotStop)
        .penalizesBy(1002);
  }

  @Test
  void unassignedCustomers_sinkVehicleHasUnassignedHighAcuityCustomersPenalty() {
    Vehicle vehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    long arrivalTimestampMs = 123L;
    customer.setArrivalTimestampMs(arrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setAcuityLevel(2);
    vehicle.setNextCustomer(customer);
    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(defaultConstraintConfig, vehicle, customer, depotStop)
        .penalizesBy(1002);

    customer.setAcuityLevel(2);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(defaultConstraintConfig, vehicle, customer, depotStop)
        .penalizesBy(1002);
  }

  @Test
  void unassignedCustomers_sinkVehicleHasPrioritizedCustomersPenalty() {
    Vehicle vehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    long arrivalTimestampMs = 123L;
    customer.setArrivalTimestampMs(arrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    customer.setAcuityLevel(2);
    vehicle.setNextCustomer(customer);
    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(defaultConstraintConfig, vehicle, customer, depotStop)
        .penalizesBy(1002);

    customer.setPrioritizationLevel(1);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(defaultConstraintConfig, vehicle, customer, depotStop)
        .penalizesBy(1012);
  }

  @Test
  void unassignedCustomers_sinkVehicleHasPinnedUnassignedCustomersNoPenalty() {
    Vehicle vehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setPinned(true);

    long arrivalTimestampMs = 123L;
    customer.setArrivalTimestampMs(arrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(vehicle, customer, depotStop)
        .penalizesBy(0);
  }

  @Test
  void unassignedCustomers_sinkVehicleDoesNotPenalizeRestBreaks() {
    Vehicle vehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    long badVehicleId = 123;
    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(1, badVehicleId, null, 0, 10000, defaultProfitComponents);
    restBreak.setArrivalTimestampMs(depotArrivalTimestampMs);
    restBreak.setPreviousStandstill(vehicle);
    restBreak.setVehicle(vehicle);
    vehicle.setNextCustomer(restBreak);
    DepotStop depotStop = attachDepotStopToEnd(vehicle, restBreak);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(vehicle, restBreak)
        .penalizesBy(0);
  }

  @Test
  void unassignedCustomers_sinkVehicleHasIsExpendableCustomersNoPenalty() {
    Vehicle vehicle = new SinkVehicle(new Depot(loc1, 0, 0), defaultProfitComponents);
    vehicle.setNumProviderAPP(2);
    Customer customer = new Customer(1, loc2, 0, 0, 0, defaultProfitComponents);
    customer.setIsExpendable(true);

    long arrivalTimestampMs = 123L;
    customer.setArrivalTimestampMs(arrivalTimestampMs);
    customer.setPreviousStandstill(vehicle);
    customer.setVehicle(vehicle);
    vehicle.setNextCustomer(customer);
    long depotArrivalTimestampMs = Duration.ofHours(2).toMillis();
    DepotStop depotStop = attachDepotStopToEnd(vehicle, customer);
    depotStop.setArrivalTimestampMs(depotArrivalTimestampMs);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::unassignedCustomers)
        .given(vehicle, customer, depotStop)
        .penalizesBy(0);
  }

  @Test
  void restBreakOnCorrectVehicles_correctVehicleNoPenalty() {
    long vehicleId = 1;
    Vehicle vehicle = new Vehicle(vehicleId, new Depot(loc1, 0, 0), defaultProfitComponents);
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(1, vehicleId, null, 0, 0, defaultProfitComponents);
    restBreak.setVehicle(vehicle);
    vehicle.setNextCustomer(restBreak);
    restBreak.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::restBreakOnCorrectVehicles)
        .given(vehicle, restBreak)
        .penalizesBy(0);
  }

  @Test
  void depotStopOnCorrectVehicles_correctVehicleNoPenalty() {
    long vehicleId = 1;
    Vehicle vehicle = new Vehicle(vehicleId, new Depot(loc1, 0, 0), defaultProfitComponents);
    DepotStop depotStop = new DepotStop(-1, vehicleId, null, 0, true, defaultProfitComponents);
    depotStop.setVehicle(vehicle);
    vehicle.setNextCustomer(depotStop);
    depotStop.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::depotStopsOnCorrectVehicles)
        .given(vehicle, depotStop)
        .penalizesBy(0);
  }

  @Test
  void restBreakOnCorrectVehicles_wrongVehicleHasPenalty() {
    long vehicleId = 1;
    long badVehicleId = 2;
    Vehicle vehicle = new Vehicle(vehicleId, new Depot(loc1, 0, 0), defaultProfitComponents);
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(1, badVehicleId, null, 0, 0, defaultProfitComponents);
    restBreak.setVehicle(vehicle);
    vehicle.setNextCustomer(restBreak);
    restBreak.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::restBreakOnCorrectVehicles)
        .given(vehicle, restBreak)
        .penalizesBy(1);
  }

  @Test
  void depotStopOnCorrectVehicles_wrongVehicleHasPenalty() {
    long vehicleId = 1;
    long badVehicleId = 2;
    Vehicle vehicle = new Vehicle(vehicleId, new Depot(loc1, 0, 0), defaultProfitComponents);
    DepotStop depotStop = new DepotStop(-1, badVehicleId, null, 0, true, defaultProfitComponents);
    depotStop.setVehicle(vehicle);
    vehicle.setNextCustomer(depotStop);
    depotStop.setPreviousStandstill(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::depotStopsOnCorrectVehicles)
        .given(vehicle, depotStop)
        .penalizesBy(1);
  }

  @Test
  void workDistributionExponentialPolicyUSDMills() {
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::workDistributionExponentialPolicyUSDMills)
        .given(defaultConstraintConfig)
        .rewardsWith(0);

    Vehicle vehicle = new Vehicle(1, new Depot(null, 0, 0), defaultProfitComponents);

    long dueTimestampMs1 = 3;
    long lateArrivalTimestampMs1 = 50;
    Customer customer1 = new Customer(1, null, 0, dueTimestampMs1, 0, defaultProfitComponents);
    customer1.setArrivalTimestampMs(lateArrivalTimestampMs1);
    customer1.setPreviousStandstill(vehicle);
    customer1.setVehicle(vehicle);

    long dueTimestampMs2 = 100;
    long lateArrivalTimestampMs2 = 123;
    Customer customer2 = new Customer(2, null, 0, dueTimestampMs2, 0, defaultProfitComponents);
    customer2.setArrivalTimestampMs(lateArrivalTimestampMs2);
    customer2.setPreviousStandstill(customer1);
    customer2.setVehicle(vehicle);

    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::workDistributionExponentialPolicyUSDMills)
        .given(defaultConstraintConfig, customer1, customer2, vehicle)
        .rewardsWith(0);

    VehicleRoutingSolutionConstraintConfiguration configWithWorkDistribution =
        new VehicleRoutingSolutionConstraintConfiguration();
    long fullQueueValueMills = 1000;
    int base = 2;

    configWithWorkDistribution.setWorkDistributionExponentialPolicy(
        fullQueueValueMills, base, 1, 5);
    constraintVerifier
        .verifyThat(VehicleRoutingConstraintProvider::workDistributionExponentialPolicyUSDMills)
        .given(configWithWorkDistribution, customer1, customer2, vehicle)
        // 1000, with 2 served customers --> 1000 * (1 - 1/ 2^2) --> 1000 * (3 / 4) = 750.
        .rewardsWith(Math.round(fullQueueValueMills * (1 - 1 / Math.pow(base, 2))));
  }
}
