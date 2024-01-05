package com.*company-data-covered*.logistics.solver;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.Depot;
import com.*company-data-covered*.logistics.domain.Location;
import com.*company-data-covered*.logistics.domain.RestBreak;
import com.*company-data-covered*.logistics.domain.SinkVehicle;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.optimizer.VRPAttribute;
import com.*company-data-covered*.optimizer.VRPDescription;
import com.*company-data-covered*.optimizer.VRPDistance;
import com.*company-data-covered*.optimizer.VRPDistanceMatrix;
import com.*company-data-covered*.optimizer.VRPLocation;
import com.*company-data-covered*.optimizer.VRPRestBreak;
import com.*company-data-covered*.optimizer.VRPScore;
import com.*company-data-covered*.optimizer.VRPShiftTeam;
import com.*company-data-covered*.optimizer.VRPShiftTeamCommitments;
import com.*company-data-covered*.optimizer.VRPShiftTeamPosition;
import com.*company-data-covered*.optimizer.VRPShiftTeamRestBreak;
import com.*company-data-covered*.optimizer.VRPShiftTeamRoute;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteHistory;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteStop;
import com.*company-data-covered*.optimizer.VRPShiftTeamVisit;
import com.*company-data-covered*.optimizer.VRPSolution;
import com.*company-data-covered*.optimizer.VRPTimeWindow;
import com.*company-data-covered*.optimizer.VRPUnassignedVisit;
import com.*company-data-covered*.optimizer.VRPVisit;
import com.*company-data-covered*.optimizer.VRPVisitAcuity;
import com.*company-data-covered*.optimizer.VRPVisitValue;
import com.google.common.collect.ImmutableList;
import com.google.protobuf.util.JsonFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;

class SolutionFactoryTest {

  DefaultProfitComponents defaultProfitComponents = new DefaultProfitComponents(6000, 2200, 25000);
  long locationId2 = 2;
  long lastStopRestBreakCompletionTimestampSec = 5;

  List<VRPShiftTeamRouteStop> stopsList =
      ImmutableList.of(
          VRPShiftTeamRouteStop.newBuilder()
              .setActualStartTimestampSec(2)
              .setActualCompletionTimestampSec(2)
              .setVisit(
                  VRPShiftTeamVisit.newBuilder().setArrivalTimestampSec(2).setVisitId(1).build())
              .setPinned(true)
              .build(),
          VRPShiftTeamRouteStop.newBuilder()
              .setActualStartTimestampSec(3)
              .setVisit(
                  VRPShiftTeamVisit.newBuilder().setArrivalTimestampSec(3).setVisitId(2).build())
              .setPinned(true)
              .build(),
          VRPShiftTeamRouteStop.newBuilder()
              .setRestBreak(
                  VRPShiftTeamRestBreak.newBuilder()
                      .setRestBreakId(3)
                      .setStartTimestampSec(4)
                      .build())
              .setActualStartTimestampSec(4)
              .setActualCompletionTimestampSec(lastStopRestBreakCompletionTimestampSec)
              .setPinned(true)
              .build());

  VRPDescription.Builder fullDescription() {
    VRPDescription.Builder description = VRPDescription.newBuilder();
    description.addAllShiftTeams(
        ImmutableList.of(
            VRPShiftTeam.newBuilder()
                .setId(1)
                .setDepotLocationId(1)
                .setAvailableTimeWindow(
                    VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(2))
                .addAllAttributes(
                    ImmutableList.of(
                        VRPAttribute.newBuilder().setId("some vehicle attribute 1").build(),
                        VRPAttribute.newBuilder().setId("some vehicle attribute 2").build()))
                .setRouteHistory(
                    VRPShiftTeamRouteHistory.newBuilder()
                        .addAllStops(stopsList)
                        .setCurrentPosition(
                            VRPShiftTeamPosition.newBuilder()
                                .setLocationId(locationId2)
                                .setKnownTimestampSec(lastStopRestBreakCompletionTimestampSec)))
                .setUpcomingCommitments(VRPShiftTeamCommitments.newBuilder())
                .setRoute(
                    VRPShiftTeamRoute.newBuilder()
                        .setDepotArrivalTimestampSec(1)
                        .addAllStops(stopsList)
                        .setCurrentPosition(
                            VRPShiftTeamPosition.newBuilder()
                                .setLocationId(locationId2)
                                .setKnownTimestampSec(lastStopRestBreakCompletionTimestampSec)))
                .setNumAppMembers(1)
                .setNumDhmtMembers(2)
                .build()));

    description.addAllVisits(
        ImmutableList.of(
            VRPVisit.newBuilder()
                .setId(1)
                .setOverlapSetKey("group1")
                .setLocationId(locationId2)
                .setArrivalTimeWindow(
                    VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(2))
                .setServiceDurationSec(3)
                .setAcuity(VRPVisitAcuity.newBuilder().setLevel(2))
                .addAllRequiredAttributes(
                    ImmutableList.of(
                        VRPAttribute.newBuilder().setId("some customer attribute 1").build(),
                        VRPAttribute.newBuilder().setId("some customer attribute 2").build()))
                .setExtraSetupDurationSec(1)
                .build(),
            VRPVisit.newBuilder()
                .setId(2)
                .setOverlapSetKey("group2")
                .setLocationId(locationId2)
                .setArrivalTimeWindow(
                    VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(2))
                .setServiceDurationSec(3)
                .setAcuity(VRPVisitAcuity.newBuilder().setLevel(2))
                .addAllRequiredAttributes(
                    ImmutableList.of(
                        VRPAttribute.newBuilder().setId("some customer attribute 1").build(),
                        VRPAttribute.newBuilder().setId("some customer attribute 2").build()))
                .addAllForbiddenAttributes(
                    ImmutableList.of(
                        VRPAttribute.newBuilder()
                            .setId("some customer forbidden attribute 1")
                            .build(),
                        VRPAttribute.newBuilder()
                            .setId("some customer forbidden attribute 2")
                            .build()))
                .setExtraSetupDurationSec(2)
                .build(),
            VRPVisit.newBuilder()
                .setId(4)
                .setOverlapSetKey("group3")
                .setLocationId(locationId2)
                .setAcuity(VRPVisitAcuity.newBuilder().setLevel(2))
                .setArrivalTimeWindow(
                    VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(2))
                .setServiceDurationSec(3)
                .setExtraSetupDurationSec(3)
                .build(),
            VRPVisit.newBuilder()
                .setId(5)
                .setLocationId(locationId2)
                .setAcuity(VRPVisitAcuity.newBuilder().setLevel(2))
                .setArrivalTimeWindow(
                    VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(2))
                .setServiceDurationSec(3)
                .setExtraSetupDurationSec(4)
                .build()));

    description.addAllUnassignedVisits(
        ImmutableList.of(
            VRPUnassignedVisit.newBuilder().setVisitId(4).setPinned(true).build(),
            VRPUnassignedVisit.newBuilder().setVisitId(5).setPinned(false).build()));
    description.addAllLocations(
        ImmutableList.of(
            VRPLocation.newBuilder().setId(1).setLatitudeE6(123456).setLongitudeE6(456789).build(),
            VRPLocation.newBuilder()
                .setId(locationId2)
                .setLatitudeE6(234567)
                .setLongitudeE6(567890)
                .build()));
    description.addAllRestBreaks(
        ImmutableList.of(
            VRPRestBreak.newBuilder()
                .setLocationId(1)
                .setStartTimestampSec(4)
                .setId(3)
                .setShiftTeamId(1)
                .setUnrequested(false)
                .setDurationSec(4000)
                .build(),
            VRPRestBreak.newBuilder()
                .setId(4)
                .setShiftTeamId(1)
                .setUnrequested(true)
                .setDurationSec(4000)
                .build()));

    description.setDistanceMatrix(
        VRPDistanceMatrix.newBuilder()
            .addAllDistances(
                ImmutableList.of(
                    VRPDistance.newBuilder()
                        .setFromLocationId(1)
                        .setToLocationId(locationId2)
                        .setLengthMeters(1212)
                        .setDurationSec(12)
                        .build(),
                    VRPDistance.newBuilder()
                        .setFromLocationId(locationId2)
                        .setToLocationId(1)
                        .setLengthMeters(2121)
                        .setDurationSec(21)
                        .build())));

    return description;
  }

  @Test
  void fromVRPDescription_fullDescriptionHasNoException() {
    VRPDescription.Builder description = fullDescription();

    assertThatCode(
            () -> SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents))
        .doesNotThrowAnyException();
  }

  @Test
  void fromVRPDescription_withPastShiftTeam() {
    VRPDescription.Builder description = fullDescription();
    VRPShiftTeam.Builder shiftTeamBuilder = description.getShiftTeamsList().get(0).toBuilder();
    VRPShiftTeamRoute.Builder routeBuilder = shiftTeamBuilder.getRouteBuilder();
    VRPShiftTeamRouteHistory.Builder routeHistoryBuilder =
        shiftTeamBuilder.getRouteHistoryBuilder();

    VRPShiftTeamPosition atDepot =
        routeBuilder.getCurrentPositionBuilder().setKnownTimestampSec(3).setLocationId(1).build();
    routeBuilder.setCurrentPosition(atDepot);
    routeHistoryBuilder.setCurrentPosition(atDepot);
    shiftTeamBuilder.setRoute(routeBuilder.clearStops().build());
    shiftTeamBuilder.setRouteHistory(routeHistoryBuilder.clearStops().build());
    VRPShiftTeam shiftTeam = shiftTeamBuilder.build();
    description.clearShiftTeams();
    description.addAllShiftTeams(ImmutableList.of(shiftTeam));

    VehicleRoutingSolution solutionWithRouteHistory =
        SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents);

    assertThat(
            solutionWithRouteHistory.getVehicleList().get(0).getEarliestPossibleDepotDepartureMs())
        .isEqualTo(3000);
  }

  @Test
  void fromVRPDescription_missingArrivalTimestampDoesNotThrowNPE() {
    VRPDescription.Builder description = fullDescription();
    VRPShiftTeam.Builder shiftTeamBuilder = description.getShiftTeamsList().get(0).toBuilder();
    shiftTeamBuilder.getRouteBuilder().clearDepotArrivalTimestampSec().build();
    VRPShiftTeam shiftTeam = shiftTeamBuilder.build();
    description.clearShiftTeams();
    description.addAllShiftTeams(ImmutableList.of(shiftTeam));

    assertThatCode(
            () -> SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents))
        .doesNotThrowAnyException();
  }

  @Test
  void fromVRPDescription_hasSinkVehicle() {
    VRPDescription.Builder description = fullDescription();
    VehicleRoutingSolution solution =
        SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents);

    List<Vehicle> vehicleList = solution.getVehicleList();

    Optional<Vehicle> sinkVehicleOrNull =
        vehicleList.stream().filter(Vehicle::isSinkVehicle).findFirst();

    Vehicle sinkVehicle = sinkVehicleOrNull.get();
    assertThat(sinkVehicle.getClass()).isEqualTo(SinkVehicle.class);
  }

  @Test
  void fromVRPDescription_sinkVehicleIncludesUnassigned() {
    VRPDescription.Builder description = fullDescription();

    long unassignedPinnedId = 4L;
    long unassignedUnpinnedId = 5L;

    VehicleRoutingSolution solution =
        SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents);

    List<Vehicle> vehicleList = solution.getVehicleList();

    Optional<Vehicle> sinkVehicleOrNull =
        vehicleList.stream().filter(Vehicle::isSinkVehicle).findFirst();

    Vehicle sinkVehicle = sinkVehicleOrNull.get();
    assertThat(sinkVehicle.getClass()).isEqualTo(SinkVehicle.class);

    List<Customer> unassigned = sinkVehicle.getRouteCustomers().stream().toList();
    assertThat(unassigned.size()).isEqualTo(2);

    assertThat(unassigned.get(0).getId()).isEqualTo(unassignedPinnedId);
    assertThat(unassigned.get(0).isPinned()).isTrue();

    assertThat(unassigned.get(1).getId()).isEqualTo(unassignedUnpinnedId);
    assertThat(unassigned.get(1).isPinned()).isFalse();
  }

  @Test
  void fromVRPDescription_withVisitValue() {
    VRPDescription.Builder description = fullDescription();
    VRPVisit.Builder visitBuilder = description.getVisitsList().get(0).toBuilder();
    VRPVisitValue.Builder valueBuilder = visitBuilder.getValue().toBuilder();

    int valueCents = 1111;

    valueBuilder.setCompletionValueCents(valueCents);
    visitBuilder.setValue(valueBuilder);

    VRPVisit visit = visitBuilder.build();

    description.addVisits(0, visit);

    VehicleRoutingSolution solution =
        SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents);

    assertThat(solution.getCustomerVisitList().get(0).getVisitValueCents()).isEqualTo(valueCents);
  }

  @Test
  void fromVRPDescription_withAllowedCapacity() {
    VRPDescription.Builder description = fullDescription();
    VRPShiftTeam.Builder shiftTeamBuilder = description.getShiftTeamsList().get(0).toBuilder();

    float allowedCapacityRatio = 0.5f;
    int startTimestampSec = 10;
    int endTimestampSec = 20;
    VRPTimeWindow timeWindow =
        VRPTimeWindow.newBuilder()
            .setStartTimestampSec(startTimestampSec)
            .setEndTimestampSec(endTimestampSec)
            .build();

    shiftTeamBuilder.setAllowedCapacityRatio(allowedCapacityRatio);
    shiftTeamBuilder.setAvailableTimeWindow(timeWindow);

    VRPShiftTeam shiftTeam = shiftTeamBuilder.build();
    description.addShiftTeams(0, shiftTeam);

    VehicleRoutingSolution solution =
        SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents);

    long expectedCapacitySec =
        (long) (allowedCapacityRatio * (endTimestampSec - startTimestampSec));
    assertThat(solution.getVehicleList().get(0).getCapacityMs())
        .isEqualTo(expectedCapacitySec * 1000);
  }

  @Test
  void toVRPSolution_hasUnassignedVisits() {
    Location location = new Location(1, 1.23, 4.56);
    Depot depot = new Depot(location, 0, 0);
    SinkVehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    VehicleRoutingSolution solution = new VehicleRoutingSolution();
    Customer unassignedCustomer = new Customer(333, location, 0, 0, 456L, defaultProfitComponents);
    unassignedCustomer.setAcuityLevel(2);
    unassignedCustomer.setAssignabilityChecker(AssignabilityChecker.EMPTY_ASSIGNABILITY_CHECKER);
    unassignedCustomer.setVehicle(sinkVehicle);
    sinkVehicle.setNextCustomer(unassignedCustomer);
    solution.setRouteStopList(List.of(unassignedCustomer));
    solution.setCustomerVisitList(List.of(unassignedCustomer));
    solution.setVehicleList(List.of(sinkVehicle));
    solution.setRestBreakList(Collections.emptyList());
    solution.setLocationList(List.of(location));
    solution.setOriginalDescription(VRPDescription.newBuilder().build());

    VRPSolution vrpSolution = SolutionFactory.toVRPSolution(solution, null, false, false);
    assertThat(vrpSolution.getDescription().getUnassignedVisitsList()).isNotEmpty();
  }

  @Test
  void toVRPSolution_unassignedVisitsExcludesRestBreaks() {
    Location location = new Location(1, 1.23, 4.56);
    Depot depot = new Depot(location, 0, 0);
    SinkVehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);

    VehicleRoutingSolution solution = new VehicleRoutingSolution();
    RestBreak unassignedRestBreak = new RestBreak(444, location, 0, 0, 0, defaultProfitComponents);
    Customer unassignedCustomer = new Customer(333, location, 0, 0, 456L, defaultProfitComponents);
    List<Customer> customerList =
        Arrays.asList(new Customer[] {unassignedRestBreak, unassignedCustomer});
    unassignedCustomer.setAcuityLevel(2);
    unassignedCustomer.setAssignabilityChecker(AssignabilityChecker.EMPTY_ASSIGNABILITY_CHECKER);
    unassignedCustomer.setVehicle(sinkVehicle);
    unassignedRestBreak.setVehicle(sinkVehicle);
    sinkVehicle.setNextCustomer(unassignedRestBreak);
    unassignedRestBreak.setNextCustomer(unassignedCustomer);
    solution.setRouteStopList(customerList);
    solution.setCustomerVisitList(customerList);
    solution.setVehicleList(List.of(sinkVehicle));
    solution.setRestBreakList(Collections.emptyList());
    solution.setLocationList(List.of(location));
    solution.setOriginalDescription(VRPDescription.newBuilder().build());

    VRPSolution vrpSolution = SolutionFactory.toVRPSolution(solution, null, false, false);
    assertThat(vrpSolution.getDescription().getUnassignedVisitsList().size()).isEqualTo(1);
  }

  @Test
  void toVRPSolution_roundtripVRPScore() {
    VehicleRoutingSolution solution =
        SolutionFactory.fromVRPDescription(fullDescription().build(), defaultProfitComponents);
    solution.setScore(BendableLongScore.of(new long[] {11, 0, -97}, new long[] {33}));

    VRPScore score = SolutionFactory.toVRPSolution(solution, null, true, false).getScore();

    VRPScore expectedVRPScore =
        VRPScore.newBuilder()
            .setHardScore(11)
            .setUnassignedVisitsScore(-97)
            .setSoftScore(33)
            .setIsValid(true)
            .build();

    assertThat(score).isEqualTo(expectedVRPScore);
  }

  @Test
  void toVRPSolution_visitUsesExtraSetupDuration() {
    Location location = new Location(1, 1.23, 4.56);
    Customer customer = new Customer(123, location, 0, 0, 456L, defaultProfitComponents);
    Depot depot = new Depot(location, 0, 0);
    SinkVehicle sinkVehicle = new SinkVehicle(depot, defaultProfitComponents);
    Long extraSetupDurationMs = 15000L;
    customer.setExtraSetupDurationMs(extraSetupDurationMs);
    sinkVehicle.setNextCustomer(customer);

    VehicleRoutingSolution solution = new VehicleRoutingSolution();
    solution.setCustomerVisitList(List.of(customer));
    solution.setLocationList(List.of(location));
    solution.setOriginalDescription(VRPDescription.getDefaultInstance());
    solution.setRestBreakList(Collections.emptyList());
    solution.setVehicleList(List.of(sinkVehicle));

    VRPSolution vrpSolution = SolutionFactory.toVRPSolution(solution, null, false, false);
    assertThat(customer.getExtraSetupDurationMs()).isEqualTo(extraSetupDurationMs);
    assertThat(vrpSolution.getDescription().getVisitsList().get(0).getExtraSetupDurationSec())
        .isEqualTo(extraSetupDurationMs / 1000);
  }

  @Test
  void toVRPSolution_roundTripVisitValue() {
    VRPDescription.Builder description = fullDescription();
    VRPVisit.Builder visitBuilder = description.getVisitsList().get(0).toBuilder();
    VRPVisitValue.Builder valueBuilder = visitBuilder.getValue().toBuilder();

    long valueCents = 1111;

    valueBuilder.setCompletionValueCents(valueCents);
    visitBuilder.setValue(valueBuilder);

    VRPVisit visit = visitBuilder.build();

    description.addVisits(0, visit);

    VehicleRoutingSolution solution =
        SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents);

    VRPSolution vrpSolution = SolutionFactory.toVRPSolution(solution, null, false, false);

    assertThat(vrpSolution.getDescription().getVisits(0).getPerVisitRevenueUsdCents())
        .isEqualTo(description.getVisits(0).getValue().getCompletionValueCents());
  }

  @Test
  void fromVRPDescription_missingLocationsThrowsIAE() {
    VRPDescription.Builder description = fullDescription();
    description.clearLocations();

    assertThatThrownBy(
            () -> SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void fromVRPDescription_missingShiftTeamsThrowsIAE() {
    VRPDescription.Builder description = fullDescription();
    description.clearShiftTeams();

    assertThatThrownBy(
            () -> SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void fromVRPDescription_missingShiftTeamForRestBreakThrowsIAE() {
    VRPDescription.Builder description = fullDescription();
    description.clearShiftTeams();

    assertThatThrownBy(
            () -> SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void fromVRPDescription_missingRouteReferencedRestBreakThrowsIAE() {
    VRPDescription.Builder description = fullDescription();
    description.clearRestBreaks();

    assertThatThrownBy(
            () -> SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void roundtripVRPDescription_isEqual() throws Exception {
    // TODO(LOG-1610): Add unassigned visits to sink vehicles, and add to roundtrip test.

    VRPDescription.Builder description = fullDescription();

    VRPDescription desc =
        SolutionFactory.toVRPSolution(
                SolutionFactory.fromVRPDescription(description.build(), defaultProfitComponents),
                null,
                true,
                false)
            .getDescription();

    // Gymnastics to clear out the routes of both in the input and output which is not
    // mapped thorough.
    List<VRPShiftTeam> toVRPSolutionShiftTeams = desc.getShiftTeamsList();
    desc =
        desc.toBuilder()
            .clearShiftTeams()
            .addAllShiftTeams(
                toVRPSolutionShiftTeams.stream()
                    .map(st -> st.toBuilder().clearRoute().build())
                    .toList())
            .build();

    List<VRPShiftTeam> fullDescriptionShiftTeams = description.getShiftTeamsList();
    description =
        description
            .clearShiftTeams()
            .addAllShiftTeams(
                fullDescriptionShiftTeams.stream()
                    .map(st -> st.toBuilder().clearRoute().build())
                    .toList());

    List<VRPVisit> toVRPSolutionVisits = description.getVisitsList();
    description =
        description
            .clearVisits()
            .addAllVisits(
                toVRPSolutionVisits.stream()
                    .map(
                        visit ->
                            visit.toBuilder()
                                .setPerVisitRevenueUsdCents(
                                    defaultProfitComponents.visitRevenueUSDCents())
                                .build())
                    .toList());

    assertThat(desc).isEqualTo(description.build());
  }

  @Test
  void fromJson() throws Exception {
    VRPDescription.Builder description = fullDescription();

    JsonFormat.TypeRegistry registry =
        JsonFormat.TypeRegistry.newBuilder().add(description.getDescriptorForType()).build();
    JsonFormat.Printer jsonPrinter = JsonFormat.printer().usingTypeRegistry(registry);
    String jsonString =
        "{ \"problem\": { \"description\": "
            + jsonPrinter.print(description)
            + "}, \"config\": { \"termination_duration_ms\": 1000, \"termination_type\": \"TERMINATION_TYPE_BEST_FOR_TIME\", \"include_intermediate_solutions\": false, \"include_intermediate_infeasible_solutions\": false, \"include_distance_matrix\": false, \"per_visit_revenue_usd_cents\": 20000, \"app_hourly_cost_usd_cents\": 7200, \"dhmt_hourly_cost_usd_cents\": 3600, \"random_seed\": 0, \"constraint_config\": { \"work_distribution\": { \"exponential_policy\": { \"base_numerator\": 2, \"base_denominator\": 1, \"full_queue_value_limit_usd_mills\": 250000 } }, \"late_arrival\": { \"linear_offset_policy\": { \"lateness_cost_usd_mills_per_ms\": 0.0, \"offset_prior_to_time_window_end_ms\": 0 }, \"hard_lateness_threshold_ms\": 1800000 } } }}";

    VehicleRoutingSolution exampleSolution =
        SolutionFactory.fromVRPDescription(fullDescription().build(), defaultProfitComponents);

    VehicleRoutingSolution solutionFromJson = SolutionFactory.fromJson(jsonString);
    assertThat(solutionFromJson).isEqualTo(exampleSolution);
  }
}
