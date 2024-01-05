package com.*company-data-covered*.logistics.solver;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.OptimizerServer;
import com.*company-data-covered*.logistics.domain.Attribute;
import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.Depot;
import com.*company-data-covered*.logistics.domain.DepotStop;
import com.*company-data-covered*.logistics.domain.Location;
import com.*company-data-covered*.logistics.domain.RestBreak;
import com.*company-data-covered*.logistics.domain.SinkVehicle;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolutionConstraintConfiguration;
import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;
import org.optaplanner.core.api.solver.SolutionManager;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.EnvironmentMode;
import org.optaplanner.core.config.solver.SolverConfig;
import org.optaplanner.core.config.solver.termination.TerminationConfig;

public class SolverTest {

  public static final long HR_TO_MS = Duration.ofHours(1).toMillis();
  DefaultProfitComponents defaultProfitComponents = new DefaultProfitComponents(6000, 2200, 25000);

  private Solver<VehicleRoutingSolution> solver;
  private SolutionManager<VehicleRoutingSolution, BendableLongScore> solutionManager;

  private Location loc1, loc2, loc3, loc4;
  private Distance loc1Loc2Distance,
      loc1Loc3Distance,
      loc1Loc4Distance,
      loc2Loc1Distance,
      loc2Loc3Distance,
      loc2Loc4Distance,
      loc3Loc1Distance,
      loc3Loc2Distance,
      loc3Loc4Distance,
      loc4Loc1Distance,
      loc4Loc2Distance,
      loc4Loc3Distance;

  private final long CUSTOMER_ID_1 = 1;
  private final long CUSTOMER_ID_2 = 2;
  private final long CUSTOMER_ID_3 = 3;
  private final long VEHICLE_ID = 1;

  @BeforeEach
  void setUp() {
    loc1 = new Location(1, 1.23, 4.56);
    loc2 = new Location(2, 2.34, 5.67);
    loc3 = new Location(3, 3.45, 6.78);
    loc4 = new Location(4, 4.56, 7.89);

    loc1Loc2Distance = Distance.of(1212, 12);
    loc1Loc3Distance = Distance.of(1313, 13);
    loc1Loc4Distance = Distance.of(1414, 14);
    loc2Loc1Distance = Distance.of(2121, 21);
    loc2Loc3Distance = Distance.of(2323, 23);
    loc2Loc4Distance = Distance.of(2424, 24);
    loc3Loc1Distance = Distance.of(3131, 31);
    loc3Loc2Distance = Distance.of(3232, 32);
    loc3Loc4Distance = Distance.of(3434, 34);
    loc4Loc1Distance = Distance.of(4141, 41);
    loc4Loc2Distance = Distance.of(4242, 42);
    loc4Loc3Distance = Distance.of(4343, 43);

    loc1.setDistanceMap(
        ImmutableMap.of(
            loc1, Distance.ZERO,
            loc2, loc1Loc2Distance,
            loc3, loc1Loc3Distance,
            loc4, loc1Loc4Distance));
    loc2.setDistanceMap(
        ImmutableMap.of(
            loc1, loc2Loc1Distance,
            loc2, Distance.ZERO,
            loc3, loc2Loc3Distance,
            loc4, loc2Loc4Distance));
    loc3.setDistanceMap(
        ImmutableMap.of(
            loc1, loc3Loc1Distance,
            loc2, loc3Loc2Distance,
            loc3, Distance.ZERO,
            loc4, loc3Loc4Distance));
    loc4.setDistanceMap(
        ImmutableMap.of(
            loc1, loc4Loc1Distance,
            loc2, loc4Loc2Distance,
            loc3, loc4Loc3Distance,
            loc4, Distance.ZERO));

    SolverConfig solverConfig =
        SolverConfig.createFromXmlResource(OptimizerServer.DEFAULT_SOLVER_CONFIG_XML);
    solverConfig.setEnvironmentMode(EnvironmentMode.FULL_ASSERT);
    SolverFactory<VehicleRoutingSolution> solverFactory =
        SolverFactory.create(
            solverConfig.withTerminationConfig(
                new TerminationConfig()
                    .withScoreCalculationCountLimit(1000L)
                    .withSpentLimit(Duration.ofMillis(500))));

    solutionManager = SolutionManager.create(solverFactory);

    solver = solverFactory.buildSolver();
  }

  @Test
  void emptyProblem() {
    VehicleRoutingSolution problem = emptySolution();
    VehicleRoutingSolution solution = solver.solve(problem);

    VehicleRoutingSolution expectedSolution = emptySolution();
    expectedSolution.setScore(VehicleRoutingSolutionConstraintConfiguration.ZERO);

    assertThat(solution).isEqualTo(expectedSolution);
  }

  @Test
  void oneCustomer_tooEarlyCustomerDueTimestampNotFeasible() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customerLoc = loc2;
    Distance depotCustomerDistance = loc1Loc2Distance;
    long vehicleReadyTimestampMs = 0;
    long tooEarlyCustomerDueTimestampMs = depotCustomerDistance.getDurationMs() - 1;
    long tooEarlyCustomerReadyTimestampMs = tooEarlyCustomerDueTimestampMs;
    long vehicleDueTimestampMs = Long.MAX_VALUE;
    Depot anytimeDepot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, anytimeDepot, defaultProfitComponents);
    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            customerLoc,
            tooEarlyCustomerReadyTimestampMs,
            tooEarlyCustomerDueTimestampMs,
            0,
            defaultProfitComponents);

    problem.setVehicleList(ImmutableList.of(vehicle));
    problem.setCustomerVisitList(ImmutableList.of(customer));
    problem.setRouteStopList(ImmutableList.of(customer));
    problem.setLocationList(ImmutableList.of(depotLoc, customerLoc));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();
  }

  @Test
  void nonRequestedRestBreak_FitsInScheduleIsFeasible() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = 10;
    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID, VEHICLE_ID, depotLoc, vehicleDueTimestampMs, true, defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    RestBreak nonRequestedRestBreakShort =
        RestBreak.UnrequestedRestBreak(
            VEHICLE_ID, VEHICLE_ID, depot, vehicleDueTimestampMs - 1, defaultProfitComponents);

    problem.setVehicleList(ImmutableList.of(vehicle));
    problem.setCustomerVisitList(ImmutableList.of());
    problem.setRestBreakList(ImmutableList.of(nonRequestedRestBreakShort));
    problem.setRouteStopList(ImmutableList.of(depotStop, nonRequestedRestBreakShort));
    problem.setLocationList(ImmutableList.of(depotLoc));
    problem.setDepotStopList(ImmutableList.of(depotStop));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isTrue();
  }

  @Test
  void nonRequestedRestBreak_DoesNotFitInScheduleIsInfeasible() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = 10;
    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID, VEHICLE_ID, depotLoc, vehicleDueTimestampMs, true, defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);

    RestBreak nonRequestedRestBreakShort =
        RestBreak.UnrequestedRestBreak(
            VEHICLE_ID, VEHICLE_ID, depot, vehicleDueTimestampMs + 1, defaultProfitComponents);

    problem.setVehicleList(ImmutableList.of(vehicle));
    problem.setCustomerVisitList(ImmutableList.of());
    problem.setRestBreakList(ImmutableList.of(nonRequestedRestBreakShort));
    problem.setRouteStopList(ImmutableList.of(depotStop, nonRequestedRestBreakShort));
    problem.setLocationList(ImmutableList.of(depotLoc));
    problem.setDepotStopList(ImmutableList.of(depotStop));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();
  }

  @Test
  void oneCustomer_tooEarlyDepotDueTimestampNotFeasible() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customerLoc = loc2;
    Distance depotCustomerDistance = loc1Loc2Distance;
    Distance customerDepotDistance = loc2Loc1Distance;
    long vehicleReadyTimestampMs = 0;
    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = Long.MAX_VALUE;
    long earlyVehicleDueTimestampMs =
        depotCustomerDistance.add(customerDepotDistance).getDurationMs() - 1;
    Depot earlyDepot = new Depot(depotLoc, vehicleReadyTimestampMs, earlyVehicleDueTimestampMs);
    DepotStop earlyDepotStop =
        new DepotStop(
            VEHICLE_ID,
            VEHICLE_ID,
            depotLoc,
            earlyVehicleDueTimestampMs,
            true,
            defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, earlyDepot, defaultProfitComponents);
    Customer anytimeCustomer =
        new Customer(
            CUSTOMER_ID_1,
            customerLoc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            0,
            defaultProfitComponents);

    problem.setVehicleList(ImmutableList.of(vehicle));
    problem.setCustomerVisitList(ImmutableList.of(anytimeCustomer));
    problem.setRouteStopList(ImmutableList.of(earlyDepotStop, anytimeCustomer));
    problem.setLocationList(ImmutableList.of(depotLoc, customerLoc));
    problem.setDepotStopList(ImmutableList.of(earlyDepotStop));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();
  }

  @Test
  void oneCustomer_everythingExactlyOnTimeIsFeasible() {
    VehicleRoutingSolution problem = emptySolution();

    long vehicleReadyTimestampMs = 0;
    Location depotLoc = loc1;
    Location customerLoc = loc2;
    Distance depotCustomerDistance = loc1Loc2Distance;
    Distance customerDepotDistance = loc2Loc1Distance;

    long customerReadyTimestampMs = depotCustomerDistance.getDurationMs();
    long customerDueTimestampMs = customerReadyTimestampMs;
    long customerServiceDurationMs = 0;

    long vehicleDueTimestampMs =
        depotCustomerDistance.add(customerDepotDistance).getDurationMs()
            + customerServiceDurationMs;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID, VEHICLE_ID, depotLoc, vehicleDueTimestampMs, true, defaultProfitComponents);

    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Vehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            customerLoc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer.setAcuityLevel(2);

    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer, depotStop));
    problem.setCustomerVisitList(ImmutableList.of(customer));
    problem.setLocationList(ImmutableList.of(depotLoc, customerLoc));
    problem.setRestBreakList(ImmutableList.of());
    problem.setDepotStopList(ImmutableList.of(depotStop));

    VehicleRoutingSolution solution = solver.solve(problem);

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).isEqualTo(ImmutableList.of(depotLoc, customerLoc, depotLoc));
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer, depotStop);
    assertThat(solution.getScore().isFeasible()).isTrue();

    Vehicle sinkVehicleFromSol = solutionVehicleList.get(1);
    assertThat(sinkVehicleFromSol.getNextCustomer()).isNull();
  }

  @Test
  void oneCustomer_oneRestBreakWithTheSamePlanningID() {
    VehicleRoutingSolution problem = emptySolution();

    long vehicleReadyTimestampMs = 0;
    Location depotLoc = loc1;
    Location customerLoc = loc2;
    Location restBreakLoc = loc3;
    Distance depotCustomerDistance = loc1Loc2Distance;

    long customerReadyTimestampMs = depotCustomerDistance.getDurationMs();
    long customerDueTimestampMs = customerReadyTimestampMs;
    long customerServiceDurationMs = 3000;

    long vehicleDueTimestampMs = Long.MAX_VALUE;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID, VEHICLE_ID, depotLoc, vehicleDueTimestampMs, true, defaultProfitComponents);

    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer =
        new Customer(
            CUSTOMER_ID_1,
            customerLoc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);

    // Colliding with the same ID doesn't seem to make us unhappy.
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(
            CUSTOMER_ID_1,
            VEHICLE_ID,
            restBreakLoc,
            Long.MAX_VALUE / 2,
            2000,
            defaultProfitComponents);

    problem.setVehicleList(ImmutableList.of(vehicle));
    problem.setCustomerVisitList(ImmutableList.of(customer));
    problem.setRouteStopList(ImmutableList.of(customer, restBreak, depotStop));
    problem.setLocationList(ImmutableList.of(depotLoc, customerLoc, restBreakLoc));
    problem.setRestBreakList(ImmutableList.of(restBreak));
    problem.setDepotStopList(ImmutableList.of(depotStop));
    VehicleRoutingSolution solution = solver.solve(problem);

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(1);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute())
        .isEqualTo(ImmutableList.of(depotLoc, customerLoc, restBreakLoc, depotLoc));
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer, restBreak, depotStop);
    assertThat(solution.getScore().isFeasible()).isTrue();
  }

  @Test
  void oneCustomer_oneRestBreakBetweenTwoVisits() {
    VehicleRoutingSolution problem = emptySolution();

    long vehicleReadyTimestampMs = 0;
    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location restBreakLoc = loc3;
    Location customer2Loc = loc4;
    Distance depotCustomerDistance = loc1Loc2Distance;

    long customer1ReadyTimestampMs = depotCustomerDistance.getDurationMs();
    long customer1DueTimestampMs = customer1ReadyTimestampMs;
    long customerServiceDurationMs = 3000;
    // the rest break is to be taken after customer1 is served.
    long restBreakStartTimestampMs = customer1DueTimestampMs + customerServiceDurationMs + 30000;
    long restBreakDurationMs = 2000;
    // customer2 is to be seen after the rest break completes.
    long customer2ReadyTimestampMs = restBreakStartTimestampMs + restBreakDurationMs + 30000;
    long customer2DueTimestampMs = customer2ReadyTimestampMs + customerServiceDurationMs + 10000;

    long vehicleDueTimestampMs = Long.MAX_VALUE;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID, VEHICLE_ID, depotLoc, vehicleDueTimestampMs, true, defaultProfitComponents);

    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customer1ReadyTimestampMs,
            customer1DueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);

    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customer2ReadyTimestampMs,
            customer2DueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);

    // Colliding with the same ID doesn't seem to make the solver unhappy.
    RestBreak restBreak =
        RestBreak.RequestedRestBreak(
            CUSTOMER_ID_1,
            VEHICLE_ID,
            restBreakLoc,
            restBreakStartTimestampMs,
            restBreakDurationMs,
            defaultProfitComponents);

    problem.setVehicleList(ImmutableList.of(vehicle));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2, restBreak, depotStop));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc, restBreakLoc));
    problem.setRestBreakList(ImmutableList.of(restBreak));
    problem.setDepotStopList(ImmutableList.of(depotStop));

    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isTrue();
    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(1);
    Vehicle v = solutionVehicleList.get(0);
    assertThat(v.getRoute())
        .isEqualTo(ImmutableList.of(depotLoc, customer1Loc, restBreakLoc, customer2Loc, depotLoc));
    assertThat(v.getRouteCustomers()).containsExactly(customer1, restBreak, customer2, depotStop);
    assertThat(solution.getScore().isFeasible()).isTrue();
  }

  // TODO: Add test for bad rest break.

  @Test
  void twoCustomer_allCustomersVisited() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location customer2Loc = loc3;

    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = Long.MAX_VALUE;

    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = Long.MAX_VALUE;
    long customerServiceDurationMs = 0;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Vehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer1.setAcuityLevel(2);
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer2.setAcuityLevel(2);

    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isTrue();

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute())
        .containsAll(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    assertThat(vehicle1.getRouteCustomers()).containsAll(ImmutableList.of(customer1, customer2));

    Vehicle sinkVehicleFromSol = solutionVehicleList.get(1);
    assertThat(sinkVehicleFromSol.getNextCustomer()).isNull();
  }

  @Test
  void twoCustomer_oneWithUnmatchedAttributeInfeasible() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location customer2Loc = loc3;

    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = Long.MAX_VALUE;

    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = Long.MAX_VALUE;
    long customerServiceDurationMs = 0;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Vehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);
    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer1.setAcuityLevel(2);
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer2.setAcuityLevel(2);
    customer1.setAssignabilityChecker(
        new AssignabilityChecker(
            ImmutableList.of(Attribute.of("customer only attribute")), ImmutableList.of()));

    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    Vehicle sinkVehicleFromSol = solutionVehicleList.get(1);
    assertThat(vehicle1.getRoute()).containsAll(ImmutableList.of(depotLoc, customer2Loc));
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer2);
    assertThat(sinkVehicleFromSol.getRouteCustomers()).containsExactly(customer1);
  }

  @Test
  void twoCustomer_differentAcuityLevelPrioritizesHigherAcuity() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location customer2Loc = loc3;

    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = 2 * HR_TO_MS;

    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = 1 * HR_TO_MS;
    long customerServiceDurationMs = 2 * HR_TO_MS;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Vehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer1.setAcuityLevel(2);
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer2.setAcuityLevel(3);

    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactly(depotLoc, customer2Loc);
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer2);

    customer1.setAcuityLevel(4);

    problem = emptySolution();
    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactly(depotLoc, customer1Loc);
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer1);
  }

  @Test
  void twoCustomer_differentPriorityLevelPrioritizesHigherPriority() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location customer2Loc = loc3;

    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = 2 * HR_TO_MS;

    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = 1 * HR_TO_MS;
    long customerServiceDurationMs = 2 * HR_TO_MS;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Vehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer2.setPrioritizationLevel(1);

    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactly(depotLoc, customer2Loc);
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer2);

    customer1.setPrioritizationLevel(1);

    problem = emptySolution();
    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactly(depotLoc, customer1Loc);
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer1);
  }

  @Test
  void twoCustomer_HighPriorityVSHighAcuityPrioritizesHigherPriority() {
    VehicleRoutingSolution problem = emptySolution();

    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location customer2Loc = loc3;

    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = 2 * HR_TO_MS;

    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = 1 * HR_TO_MS;
    long customerServiceDurationMs = 2 * HR_TO_MS;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Vehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    customer2.setAcuityLevel(3);

    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    VehicleRoutingSolution solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    List<Vehicle> solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    Vehicle vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactly(depotLoc, customer2Loc);
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer2);

    customer1.setPrioritizationLevel(1);

    problem = emptySolution();
    problem.setVehicleList(ImmutableList.of(vehicle, sinkVehicle));
    problem.setRouteStopList(ImmutableList.of(customer1, customer2));
    problem.setCustomerVisitList(ImmutableList.of(customer1, customer2));
    problem.setLocationList(ImmutableList.of(depotLoc, customer1Loc, customer2Loc));
    solution = solver.solve(problem);

    assertThat(solution.getScore().isFeasible()).isFalse();

    solutionVehicleList = solution.getVehicleList();
    assertThat(solutionVehicleList).hasSize(2);
    vehicle1 = solutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactly(depotLoc, customer1Loc);
    assertThat(vehicle1.getRouteCustomers()).containsExactly(customer1);
  }

  // TODO[LOG-1766]: fix this test so that it is not flaky
  @Disabled
  @Test
  void manyCustomers_pinningOverridesShortestDistance() {
    VehicleRoutingSolution problem = emptySolution();

    Distance shortDistance = Distance.of(Duration.ofSeconds(1234).toMillis(), 1);
    Distance longDistance = Distance.of(Duration.ofSeconds(12345).toMillis(), 6789);

    Location depotLoc = loc1;
    Location customer1Loc = loc2;
    Location customer2Loc = loc3;
    Location customer3Loc = loc4;

    depotLoc.setDistanceMap(
        ImmutableMap.of(
            depotLoc, Distance.ZERO,
            customer1Loc, shortDistance,
            customer2Loc, longDistance,
            customer3Loc, longDistance));
    customer1Loc.setDistanceMap(
        ImmutableMap.of(
            depotLoc, longDistance,
            customer1Loc, Distance.ZERO,
            customer2Loc, shortDistance,
            customer3Loc, longDistance));
    customer2Loc.setDistanceMap(
        ImmutableMap.of(
            depotLoc, longDistance,
            customer1Loc, longDistance,
            customer2Loc, Distance.ZERO,
            customer3Loc, shortDistance));
    customer3Loc.setDistanceMap(
        ImmutableMap.of(
            depotLoc, shortDistance,
            customer1Loc, longDistance,
            customer2Loc, longDistance,
            customer3Loc, Distance.ZERO));

    long vehicleReadyTimestampMs = 0;
    long vehicleDueTimestampMs = Long.MAX_VALUE;

    long customerReadyTimestampMs = 0;
    long customerDueTimestampMs = Long.MAX_VALUE;
    long customerServiceDurationMs = 0;

    Depot depot = new Depot(depotLoc, vehicleReadyTimestampMs, vehicleDueTimestampMs);
    DepotStop depotStop =
        new DepotStop(
            VEHICLE_ID, VEHICLE_ID, depotLoc, vehicleDueTimestampMs, true, defaultProfitComponents);
    Vehicle vehicle = new Vehicle(VEHICLE_ID, depot, defaultProfitComponents);
    Customer customer1 =
        new Customer(
            CUSTOMER_ID_1,
            customer1Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    Customer customer2 =
        new Customer(
            CUSTOMER_ID_2,
            customer2Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    Customer customer3 =
        new Customer(
            CUSTOMER_ID_3,
            customer3Loc,
            customerReadyTimestampMs,
            customerDueTimestampMs,
            customerServiceDurationMs,
            defaultProfitComponents);
    ImmutableList<Customer> customerList = ImmutableList.of(customer1, customer2, customer3);
    ImmutableList<Location> locationList =
        ImmutableList.of(depotLoc, customer1Loc, customer2Loc, customer3Loc);

    problem.setVehicleList(
        ImmutableList.of(vehicle, new SinkVehicle(depot, defaultProfitComponents)));
    problem.setRouteStopList(ImmutableList.of(depotStop, customer1, customer2, customer3));
    problem.setCustomerVisitList(customerList);
    problem.setLocationList(locationList);
    problem.setDepotStopList(ImmutableList.of(depotStop));

    Customer pinningCustomer = customer2;
    Location pinningCustomerLoc = customer2Loc;
    vehicle.setNextCustomer(pinningCustomer);
    pinningCustomer.setVehicle(vehicle);
    pinningCustomer.setPreviousStandstill(vehicle);
    SolutionFactory.recalculateArrivalTimestamps(problem);

    ImmutableList<Customer> shortestRouteCustomers =
        ImmutableList.of(customer1, pinningCustomer, customer3, depotStop);
    ImmutableList<Location> shortestRouteLocs =
        ImmutableList.of(depotLoc, customer1Loc, pinningCustomerLoc, customer3Loc, depotLoc);

    ImmutableList<Customer> pinnedRouteCustomers =
        ImmutableList.of(pinningCustomer, customer1, customer3, depotStop);
    ImmutableList<Location> pinnedRouteLocs =
        ImmutableList.of(depotLoc, pinningCustomerLoc, customer1Loc, customer3Loc, depotLoc);

    pinningCustomer.setPinned(false);
    SolutionFactory.recalculateArrivalTimestamps(problem);
    VehicleRoutingSolution unpinnedShortestSolution = solver.solve(problem);

    assertThat(unpinnedShortestSolution.getScore().isFeasible()).isTrue();
    List<Vehicle> shortestSolutionVehicleList = unpinnedShortestSolution.getVehicleList();
    assertThat(shortestSolutionVehicleList).hasSize(2);
    Vehicle vehicle1 = shortestSolutionVehicleList.get(0);
    assertThat(vehicle1.getRoute()).containsExactlyElementsOf(shortestRouteLocs);
    assertThat(vehicle1.getRouteCustomers()).containsExactlyElementsOf(shortestRouteCustomers);

    pinningCustomer.setPinned(true);
    VehicleRoutingSolution pinnedSolution = solver.solve(problem);

    assertThat(pinnedSolution.getScore().isFeasible()).isTrue();
    Vehicle vehicle2 = pinnedSolution.getVehicleList().get(0);
    assertThat(vehicle2.getRoute()).containsExactlyElementsOf(pinnedRouteLocs);
    assertThat(vehicle2.getRouteCustomers()).containsExactlyElementsOf(pinnedRouteCustomers);
  }

  private static VehicleRoutingSolution emptySolution() {
    VehicleRoutingSolution problem = new VehicleRoutingSolution();
    problem.setRouteStopList(ImmutableList.of());
    problem.setCustomerVisitList(ImmutableList.of());
    problem.setRestBreakList(ImmutableList.of());
    problem.setDepotStopList(ImmutableList.of());
    problem.setVehicleList(ImmutableList.of());
    problem.setLocationList(ImmutableList.of());
    VehicleRoutingSolutionConstraintConfiguration config = problem.getConstraintConfiguration();
    config.setWorkDistributionExponentialPolicy(250000, 2, 1, 20);
    problem.setConstraintConfiguration(config);
    return problem;
  }
}
