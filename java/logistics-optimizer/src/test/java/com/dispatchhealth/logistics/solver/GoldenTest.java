package com.*company-data-covered*.logistics.solver;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.OptimizerServer;
import com.*company-data-covered*.logistics.domain.Attribute;
import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.Depot;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.optimizer.*;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;
import org.optaplanner.core.api.solver.SolutionManager;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.EnvironmentMode;
import org.optaplanner.core.config.solver.SolverConfig;
import org.optaplanner.core.config.solver.termination.TerminationConfig;

public class GoldenTest {
  private Solver<VehicleRoutingSolution> solver;
  private SolutionManager<VehicleRoutingSolution, BendableLongScore> solutionManager;

  @BeforeEach
  void setUp() {

    SolverConfig solverConfig =
        SolverConfig.createFromXmlResource(OptimizerServer.DEFAULT_SOLVER_CONFIG_XML);
    solverConfig.setEnvironmentMode(EnvironmentMode.FULL_ASSERT);
    SolverFactory<VehicleRoutingSolution> solverFactory =
        SolverFactory.create(
            solverConfig.withTerminationConfig(
                new TerminationConfig()
                    .withScoreCalculationCountLimit(
                        2000L) // If tests fail inexplicably, try changing these two values
                    .withSpentLimit(Duration.ofMillis(500))));

    solutionManager = SolutionManager.create(solverFactory);

    solver = solverFactory.buildSolver();
  }

  @Test
  void visitLateness() throws Exception {
    String filename = "src/test/resources/visit_lateness_hc_not_violated.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isTrue();

    Customer customer = solution.getCustomerVisitList().get(0);
    customer.setDueTimestampMs(customer.getDueTimestampMs() - 1000L);

    SolutionFactory.recalculateArrivalTimestamps(solution);
    solution = solver.solve(solution);
    assertThat(solution.getScore().isFeasible()).isFalse();
    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
    // TODO(LOG-1897): Add data consistency / logic invariant checks
  }

  @Test
  void visitLatenessWithToleranceOverride() throws Exception {
    String filename = "src/test/resources/visit_lateness_with_tolerance_override.json";

    String jsonString = new String(Files.readAllBytes(Paths.get(filename)));
    SolveVRPRequest vrpRequest = SolutionFactory.solveRequestFromJson(jsonString);

    VehicleRoutingSolution solution = solveSolutionFromSolveVRPRequest(vrpRequest);

    assertThat(solution.getScore().isFeasible()).isFalse();

    // clear the tolerance override from the VRPRequest.
    SolveVRPRequest.Builder vrpRequestBuilder =
        SolutionFactory.solveRequestFromJson(jsonString).toBuilder();
    VRPConstraintConfig.LateArrivalConstraintConfig.Builder lateArrivalBuilder =
        vrpRequestBuilder.getConfigBuilder().getConstraintConfigBuilder().getLateArrivalBuilder();
    lateArrivalBuilder.clearVisitLatenessToleranceOverrides();

    solution = solveSolutionFromSolveVRPRequest(vrpRequestBuilder.build());

    assertThat(solution.getScore().isFeasible()).isTrue();
  }

  @Test
  void middleOfRouteHistoryDoesntNeedDistancesOutOfOrder() throws Exception {
    String filename =
        "src/test/resources/middle_of_route_history_doesnt_need_distances_out_of_order.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    // really this test is simply checking that we don't throw for the missing distances
    // in the distance matrix for Visit 2 -> 4 in the middle of the route history when
    // we solve in this e2e test.
    //
    // NOTE: we need distances for 2 -> 3; and 3 -> 4 in the route history;  but we don't need a
    // distance from 2 -> 4; as the planner should never be allowed to move those around such that
    // 2 -> 4 in any route that gets scored.
    assertThat(solution.getScore().isFeasible()).isTrue();

    // and assert that we can still map it back to proto.
    VRPSolution soln = SolutionFactory.toVRPSolution(solution, solutionManager, true, true);

    System.out.println(soln.getDescription().getShiftTeamsList().get(0));
    // And we ensure that the actuals are unchanged after being solved.
    assertThat(
            soln.getDescription()
                .getShiftTeamsList()
                .get(0)
                .getRoute()
                .getStops(0)
                .getActualStartTimestampSec())
        .isEqualTo(2);
    assertThat(
            soln.getDescription()
                .getShiftTeamsList()
                .get(0)
                .getRoute()
                .getStops(1)
                .getActualStartTimestampSec())
        .isEqualTo(3);
  }

  @Test
  void depotLateness() throws Exception {
    String filename = "src/test/resources/vehicle_depot_lateness_hc_not_violated.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isTrue();

    Vehicle vehicle = solution.getVehicleList().get(0);
    Depot depot = vehicle.getDepot();
    vehicle.setDepot(
        new Depot(
            depot.getLocation(), depot.getReadyTimestampMs(), (depot.getDueTimestampMs() - 1000L)));

    SolutionFactory.recalculateArrivalTimestamps(solution);
    solution = solver.solve(solution);
    assertThat(solution.getScore().isFeasible()).isFalse();
    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }

  @Test
  void vehicleTotalDistance() throws Exception {
    String filename = "src/test/resources/vehicle_total_distance.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isTrue();

    Vehicle vehicle1 = solution.getVehicleList().get(0);
    assertThat(vehicle1.getTotalDistance().getMeters()).isEqualTo(600);

    Vehicle vehicle2 = solution.getVehicleList().get(1);
    assertThat(vehicle2.getTotalDistance().getMeters()).isEqualTo(600);

    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }

  @Test
  void vehicleDepotArrivalWithGroupedCustomers() throws Exception {
    String filename = "src/test/resources/vehicle_total_time_grouped_customers.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isTrue();

    Customer customer2 = solution.getCustomerVisitList().get(1);
    Customer customer3 = solution.getCustomerVisitList().get(2);

    // check grouped costumers with same location to have same arrival time
    assertThat(customer2.getActualArrivalTimestampMs())
        .isEqualTo(customer3.getActualArrivalTimestampMs());

    Vehicle vehicle = solution.getVehicleList().get(0);
    Depot depot = vehicle.getDepot();
    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            customer3.getDepartureTimestampMs()
                + customer3.getDistanceTo(depot.location()).getDurationMs());
    assertThat(vehicle.getDepotArrivalTimestampMs())
        .isEqualTo(
            customer2.getDepartureTimestampMs()
                + customer2.getDistanceTo(depot.location()).getDurationMs());

    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }

  @Test
  void distancesUnrequestedRestBreaksUpcomingCommitments() throws Exception {
    String filename =
        "src/test/resources/distances_unrequested_rest_breaks_upcoming_commitments.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isTrue();

    Vehicle vehicle1 = solution.getVehicleList().get(0);
    assertThat(vehicle1.getTotalDistance().getMeters()).isEqualTo(700);

    Vehicle vehicle2 = solution.getVehicleList().get(1);
    assertThat(vehicle2.getTotalDistance().getMeters()).isEqualTo(700);

    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }

  @Test
  void distancesUnrequestedRestBreaksAndNoUpcomingCommitments() throws Exception {
    String filename =
        "src/test/resources/distances_unrequested_rest_breaks_no_upcoming_commitments.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isTrue();

    Vehicle vehicle = solution.getVehicleList().get(0);
    assertThat(vehicle.getTotalDistance().getMeters()).isEqualTo(700);

    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }

  @Test
  void unassignedUncommitedVsCommited() throws Exception {
    String filename = "src/test/resources/unassignedcust_hc_no_obligation_visit_unassigned.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    assertThat(solution.getScore().isFeasible()).isFalse();

    Customer customer = solution.getCustomerVisitList().get(2);
    customer.setPinned(true);

    SolutionFactory.recalculateArrivalTimestamps(solution);
    solution = solver.solve(solution);
    assertThat(solution.getScore().isFeasible()).isTrue();
    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }

  @Test
  void visitValueOverridesDistance() throws Exception {
    // This test confirms that in the presence of visit value, value is prioritized.
    String filename = "src/test/resources/visit_value_overrides_distance.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);
    VRPSolution vrpSolution = SolutionFactory.toVRPSolution(solution, null, false, false);

    List<Long> unassignedIds = new ArrayList<>();
    for (VRPUnassignedVisit unassigned : vrpSolution.getDescription().getUnassignedVisitsList()) {
      Long id = unassigned.getVisitId();
      unassignedIds.add(id);
    }

    assertThat(unassignedIds).containsExactlyInAnyOrder(6L, 7L, 10L);
  }

  @Test
  void onScenePenaltyOverridesDistance() throws Exception {
    // This test confirms that the team that has only a DHMT and not an APP will get the single
    // visit,
    // even though this team is farther away from the visit.
    String filename = "src/test/resources/on_scene_penalty_overrides_distance.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);
    long employedVehicleId = solution.getCustomerVisitList().get(0).getVehicleId();
    assertThat(employedVehicleId).isEqualTo(9);
  }

  @Test
  void foregoneVisitCostIdleVehicle() throws Exception {
    String filename = "src/test/resources/idle_vehicle_without_forgone_visit_value.json";

    String jsonString = new String(Files.readAllBytes(Paths.get(filename)));
    SolveVRPRequest vrpRequest = SolutionFactory.solveRequestFromJson(jsonString);

    VehicleRoutingSolution solution = solveSolutionFromSolveVRPRequest(vrpRequest);

    assertThat(solution.getScore().isFeasible()).isTrue();

    VRPDescription description = vrpRequest.getProblem().getDescription();

    VRPShiftTeam firstShiftTeam = description.getShiftTeams(0);
    VRPShiftTeam secondShiftTeam = description.getShiftTeams(1);

    List<Customer> visitList = solution.getCustomerVisitList();

    assertThat(visitList.get(0).getVehicleId()).isEqualTo(firstShiftTeam.getId());
    assertThat(visitList.get(1).getVehicleId()).isEqualTo(firstShiftTeam.getId());

    SolveVRPRequest.Builder vrpRequestBuilder =
        SolutionFactory.solveRequestFromJson(jsonString).toBuilder();

    VRPConstraintConfig.OpportunityCostConstraintConfig.LinearForegoneVisitValuePolicy.Builder
        foregoneVisitValueBuilder =
            VRPConstraintConfig.OpportunityCostConstraintConfig.LinearForegoneVisitValuePolicy
                .newBuilder();
    foregoneVisitValueBuilder.setCentsPerMinute(5.5f);

    VRPConstraintConfig.OpportunityCostConstraintConfig.Builder opportunityCostBuilder =
        vrpRequestBuilder
            .getConfigBuilder()
            .getConstraintConfigBuilder()
            .getOpportunityCostBuilder();
    opportunityCostBuilder.setLinearForegoneVisitValue(foregoneVisitValueBuilder);

    solution = solveSolutionFromSolveVRPRequest(vrpRequestBuilder.build());

    assertThat(solution.getScore().isFeasible()).isTrue();
    List<Customer> visitListWithForegoneVisitValue = solution.getCustomerVisitList();

    assertThat(visitListWithForegoneVisitValue.get(0).getVehicleId())
        .isEqualTo(firstShiftTeam.getId());
    assertThat(visitListWithForegoneVisitValue.get(1).getVehicleId())
        .isEqualTo(secondShiftTeam.getId());
  }

  @Test
  void visitValueAcuityOverridesValue() throws Exception {
    // This test confirms that in the presence of visit value, acuity is still prioritized.
    String filename = "src/test/resources/acuity_overrides_visit_value.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);
    VRPSolution vrpSolution = SolutionFactory.toVRPSolution(solution, null, false, false);

    List<Long> unassignedIds = new ArrayList<>();
    for (VRPUnassignedVisit unassigned : vrpSolution.getDescription().getUnassignedVisitsList()) {
      Long id = unassigned.getVisitId();
      unassignedIds.add(id);
    }

    assertThat(unassignedIds).containsExactlyInAnyOrder(6L, 7L, 11L);
  }

  VehicleRoutingSolution solveSolutionFromSolveVRPRequest(SolveVRPRequest vrpRequest)
      throws Exception {
    VehicleRoutingSolution vehicleRoutingSolution = SolutionFactory.fromVRPRequest(vrpRequest);

    SolutionFactory.recalculateArrivalTimestamps(vehicleRoutingSolution);

    return solver.solve(vehicleRoutingSolution);
  }

  VehicleRoutingSolution solveSolutionFromJsonFile(String filename) throws Exception {

    String jsonString = new String(Files.readAllBytes(Paths.get(filename)));
    SolveVRPRequest requestFromJson = SolutionFactory.solveRequestFromJson(jsonString);

    return solveSolutionFromSolveVRPRequest(requestFromJson);
  }

  @Test
  void matchingAttributes() throws Exception {
    String filename =
        "src/test/resources/vehicle_unmatched_attributes_for_customer_hc_assigned_nearest_visits.json";

    VehicleRoutingSolution solution = solveSolutionFromJsonFile(filename);

    Customer customer1 = solution.getCustomerVisitList().get(0);
    Customer customer2 = solution.getCustomerVisitList().get(1);

    // When all skills match, customers are assigned to the closest vehicles
    assertThat(solution.getScore().isFeasible()).isTrue();
    assertThat(customer1.getVehicleId()).isEqualTo(1);
    assertThat(customer2.getVehicleId()).isEqualTo(2);

    Vehicle vehicle1 = solution.getVehicleList().get(0);
    Vehicle vehicle2 = solution.getVehicleList().get(1);

    Attribute skill1 = Attribute.of("skill:1");
    Attribute skill2 = Attribute.of("skill:2");
    Attribute skill3 = Attribute.of("skill:3");

    vehicle1.setAttributes(ImmutableSet.of(skill1, skill3));
    vehicle2.setAttributes(ImmutableSet.of(skill1, skill2));

    customer1.setAssignabilityChecker(
        new AssignabilityChecker(ImmutableList.of(skill2), ImmutableList.of()));
    customer2.setAssignabilityChecker(
        new AssignabilityChecker(ImmutableList.of(skill3), ImmutableList.of()));

    SolutionFactory.recalculateArrivalTimestamps(solution);
    solution = solver.solve(solution);

    customer1 = solution.getCustomerVisitList().get(0);
    customer2 = solution.getCustomerVisitList().get(1);

    // When attributes only match the furthest vehicles, customers are assigned to the furthest
    // vehicles
    assertThat(solution.getScore().isFeasible()).isTrue();
    assertThat(customer1.getVehicleId()).isEqualTo(2);
    assertThat(customer2.getVehicleId()).isEqualTo(1);

    vehicle1 = solution.getVehicleList().get(0);
    vehicle2 = solution.getVehicleList().get(1);

    vehicle1.setAttributes(ImmutableSet.of(skill1, skill2));
    vehicle2.setAttributes(ImmutableSet.of(skill1, skill2));

    SolutionFactory.recalculateArrivalTimestamps(solution);
    solution = solver.solve(solution);

    // When no vehicle matches skill3
    assertThat(solution.getScore().isFeasible()).isFalse();
    // and assert that we can still map it back to proto.
    SolutionFactory.toVRPSolution(solution, solutionManager, true, true);
  }
}
