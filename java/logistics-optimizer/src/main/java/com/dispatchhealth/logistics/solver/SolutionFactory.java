package com.*company-data-covered*.logistics.solver;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.domain.Attribute;
import com.*company-data-covered*.logistics.domain.CurrentPositionStop;
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
import com.*company-data-covered*.optimizer.SolveVRPRequest;
import com.*company-data-covered*.optimizer.VRPAttribute;
import com.*company-data-covered*.optimizer.VRPConfig;
import com.*company-data-covered*.optimizer.VRPConstraintConfig;
import com.*company-data-covered*.optimizer.VRPDescription;
import com.*company-data-covered*.optimizer.VRPDistance;
import com.*company-data-covered*.optimizer.VRPDistanceMatrix;
import com.*company-data-covered*.optimizer.VRPLocation;
import com.*company-data-covered*.optimizer.VRPRestBreak;
import com.*company-data-covered*.optimizer.VRPScore;
import com.*company-data-covered*.optimizer.VRPShiftTeam;
import com.*company-data-covered*.optimizer.VRPShiftTeamCommitment;
import com.*company-data-covered*.optimizer.VRPShiftTeamCommitments;
import com.*company-data-covered*.optimizer.VRPShiftTeamPosition;
import com.*company-data-covered*.optimizer.VRPShiftTeamRoute;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteHistory;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteStop;
import com.*company-data-covered*.optimizer.VRPShiftTeamVisit;
import com.*company-data-covered*.optimizer.VRPSolution;
import com.*company-data-covered*.optimizer.VRPStats;
import com.*company-data-covered*.optimizer.VRPTimeWindow;
import com.*company-data-covered*.optimizer.VRPUnassignedVisit;
import com.*company-data-covered*.optimizer.VRPVisit;
import com.*company-data-covered*.optimizer.VRPVisit.Builder;
import com.*company-data-covered*.optimizer.VRPVisitAcuity;
import com.*company-data-covered*.optimizer.VRPVisitLatenessTolerance;
import com.google.common.collect.ImmutableSet;
import com.google.protobuf.util.JsonFormat;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.optaplanner.core.api.score.ScoreExplanation;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;
import org.optaplanner.core.api.score.director.ScoreDirector;
import org.optaplanner.core.api.solver.SolutionManager;

public class SolutionFactory {
  private static final double E6 = 1e6;
  private static final long SEC_TO_MS = 1000;

  protected static final long MS_PER_MINUTE = Duration.ofMinutes(1).toMillis();

  public static VehicleRoutingSolution fromVRPDescription(
      VRPDescription description, DefaultProfitComponents defaultProfitComponents) {
    int locationsCount = description.getLocationsCount();
    if (locationsCount == 0) {
      throw new IllegalArgumentException("Missing locations");
    }
    List<Location> locationList = new ArrayList<>(locationsCount);
    HashMap<Long, Location> locationMap = new HashMap<>(locationsCount);
    HashMap<Long, Map<Location, Distance>> locationDistanceMap = new HashMap<>(locationsCount);
    for (VRPLocation vrpLocation : description.getLocationsList()) {
      Location location =
          new Location(
              vrpLocation.getId(),
              vrpLocation.getLatitudeE6() / E6,
              vrpLocation.getLongitudeE6() / E6);
      HashMap<Location, Distance> distanceMap = new HashMap<>();
      location.setDistanceMap(distanceMap);

      locationList.add(location);
      locationMap.put(location.getId(), location);
      locationDistanceMap.put(location.getId(), distanceMap);
    }

    for (VRPDistance vrpDistance : description.getDistanceMatrix().getDistancesList()) {
      Location fromLocation = locationMap.get(vrpDistance.getFromLocationId());
      Location toLocation = locationMap.get(vrpDistance.getToLocationId());
      if (fromLocation == null || toLocation == null) {
        throw new IllegalArgumentException("Missing location for location id");
      }

      Distance distance =
          Distance.of(vrpDistance.getDurationSec() * SEC_TO_MS, vrpDistance.getLengthMeters());
      locationDistanceMap.get(fromLocation.getId()).put(toLocation, distance);
    }

    int visitsCount = description.getVisitsCount();
    ArrayList<Customer> routeStopList =
        new ArrayList<>(
            // visits, rest breaks, and a current position and final depot stop for all shift teams.
            visitsCount + description.getRestBreaksCount() + 2 * description.getShiftTeamsCount());
    ArrayList<Customer> customerVisitList = new ArrayList<>(visitsCount);
    Map<Long, Customer> customerVisitMap = new HashMap<>(visitsCount);
    for (VRPVisit visit : description.getVisitsList()) {
      if (!locationMap.containsKey(visit.getLocationId())) {
        throw new IllegalArgumentException("Missing location for visit location id");
      }

      VRPTimeWindow arrivalTimeWindow = visit.getArrivalTimeWindow();
      Customer customer =
          new Customer(
              visit.getId(),
              locationMap.get(visit.getLocationId()),
              arrivalTimeWindow.getStartTimestampSec() * SEC_TO_MS,
              arrivalTimeWindow.getEndTimestampSec() * SEC_TO_MS,
              visit.getServiceDurationSec() * SEC_TO_MS,
              defaultProfitComponents);
      customer.setExtraSetupDurationMs(visit.getExtraSetupDurationSec() * SEC_TO_MS);
      if (visit.hasPriority()) {
        int unassignedPriorityLevel = visit.getPriority().getUnassignedPriorityLevel();
        if (unassignedPriorityLevel > 9) {
          throw new IllegalArgumentException(
              "Unsupported unassigned priority level "
                  + unassignedPriorityLevel
                  + " for visit id "
                  + visit.getId()
                  + ". The max allowed level is 9.");
        }

        customer.setPrioritizationLevel(unassignedPriorityLevel);
      }

      customer.setAssignabilityChecker(new AssignabilityChecker(visit));

      customer.setVisitValueCents(visit);

      if (visit.hasAcuity()) {
        VRPVisitAcuity acuity = visit.getAcuity();
        long acuityLevel = acuity.getLevel();
        if (acuityLevel == 0) {
          throw new IllegalArgumentException("Missing acuity level for visit id " + visit.getId());
        }
        if (acuityLevel > 9) {
          throw new IllegalArgumentException(
              "Unsupported acuity level "
                  + acuityLevel
                  + " for visit id "
                  + visit.getId()
                  + ". The max allowed level is 9.");
        }

        customer.setAcuityLevel(acuityLevel);

        if (acuity.hasTimeWindow()) {
          long startTimestampSec = acuity.getTimeWindow().getStartTimestampSec();
          long endTimestampSec = acuity.getTimeWindow().getEndTimestampSec();
          if (startTimestampSec == 0) {
            throw new IllegalArgumentException(
                "Missing start_timestamp_sec for acuity time window");
          }
          if (endTimestampSec == 0) {
            throw new IllegalArgumentException("Missing end_timestamp_sec for acuity time window");
          }
          customer.setAcuityTimeWindowStartMs(startTimestampSec * SEC_TO_MS);
          customer.setAcuityTimeWindowEndMs(endTimestampSec * SEC_TO_MS);
        }
      } else {
        throw new IllegalArgumentException("Missing acuity message for visit id " + visit.getId());
      }

      if (visit.hasOverlapSetKey()) {
        customer.setOverlapSetKey(visit.getOverlapSetKey());
      }

      customer.setIsExpendable(visit.getIsExpendable());

      routeStopList.add(customer);
      customerVisitList.add(customer);

      customerVisitMap.put(customer.getId(), customer);
    }

    HashMap<Long, Depot> depotMap = new HashMap<>(description.getShiftTeamsCount());
    for (VRPShiftTeam shiftTeam : description.getShiftTeamsList()) {
      if (!locationMap.containsKey(shiftTeam.getDepotLocationId())) {
        throw new IllegalArgumentException("Missing location for vehicle id");
      }
      Location location = locationMap.get(shiftTeam.getDepotLocationId());
      VRPTimeWindow timeWindow = shiftTeam.getAvailableTimeWindow();

      depotMap.put(
          shiftTeam.getId(),
          new Depot(
              location,
              timeWindow.getStartTimestampSec() * SEC_TO_MS,
              timeWindow.getEndTimestampSec() * SEC_TO_MS));
    }

    int restBreaksCount = description.getRestBreaksCount();
    ArrayList<RestBreak> restBreakList = new ArrayList<>(restBreaksCount);
    Map<Long, RestBreak> restBreakMap = new HashMap<>(restBreaksCount);
    for (VRPRestBreak rb : description.getRestBreaksList()) {
      if (rb.hasLocationId() && !locationMap.containsKey(rb.getLocationId())) {
        throw new IllegalArgumentException("Missing location for rest break location id");
      }

      RestBreak restBreak;
      if (rb.getUnrequested()) {
        if (!depotMap.containsKey(rb.getShiftTeamId())) {
          throw new IllegalArgumentException("Missing shift team id for rest break");
        }
        restBreak =
            RestBreak.UnrequestedRestBreak(
                rb.getId(),
                rb.getShiftTeamId(),
                depotMap.get(rb.getShiftTeamId()),
                rb.getDurationSec() * SEC_TO_MS,
                defaultProfitComponents);

      } else {
        restBreak =
            RestBreak.RequestedRestBreak(
                rb.getId(),
                rb.getShiftTeamId(),
                locationMap.get(rb.getLocationId()),
                rb.getStartTimestampSec() * SEC_TO_MS,
                rb.getDurationSec() * SEC_TO_MS,
                defaultProfitComponents);
      }

      restBreakList.add(restBreak);
      routeStopList.add(restBreak);

      restBreakMap.put(restBreak.getRestBreakId(), restBreak);
    }

    int shiftTeamsCount = description.getShiftTeamsCount();
    if (shiftTeamsCount == 0) {
      throw new IllegalArgumentException("Missing shift teams");
    }
    List<Vehicle> vehicleList = new ArrayList<>(shiftTeamsCount);
    List<DepotStop> depotStopList = new ArrayList<>();

    for (VRPShiftTeam shiftTeam : description.getShiftTeamsList()) {
      if (!locationMap.containsKey(shiftTeam.getDepotLocationId())) {
        throw new IllegalArgumentException("Missing location for vehicle id");
      }

      if (!shiftTeam.hasRouteHistory()) {
        throw new IllegalArgumentException("Missing route history for vehicle");
      }
      if (!shiftTeam.hasUpcomingCommitments()) {
        throw new IllegalArgumentException("Missing upcoming commitments for vehicle");
      }

      VRPTimeWindow timeWindow = shiftTeam.getAvailableTimeWindow();
      Location location = locationMap.get(shiftTeam.getDepotLocationId());
      Depot depot = depotMap.get(shiftTeam.getId());
      Vehicle vehicle = new Vehicle(shiftTeam.getId(), depot, defaultProfitComponents);

      if (shiftTeam.hasAppHourlyCostUsdCents()) {
        vehicle.setAPPHourlyCostUSDCents(shiftTeam.getAppHourlyCostUsdCents());
      }

      if (shiftTeam.hasDhmtHourlyCostUsdCents()) {
        vehicle.setDHMTHourlyCostUSDCents(shiftTeam.getDhmtHourlyCostUsdCents());
      }

      vehicle.setNumProviderAPP(shiftTeam.getNumAppMembers());
      vehicle.setNumProviderDHMT(shiftTeam.getNumDhmtMembers());

      DepotStop depotStop =
          new DepotStop(
              shiftTeam.getId(),
              shiftTeam.getId(),
              depot.getLocation(),
              depot.getDueTimestampMs(),
              true,
              defaultProfitComponents);
      depotStopList.add(depotStop);
      routeStopList.add(depotStop);

      if (shiftTeam.getAttributesCount() > 0) {
        ImmutableSet<Attribute> attributes =
            new ImmutableSet.Builder<Attribute>()
                .addAll(
                    shiftTeam.getAttributesList().stream()
                        .map(vrpAttribute -> Attribute.of(vrpAttribute.getId()))
                        .iterator())
                .build();
        vehicle.setAttributes(attributes);

        long shiftTeamActiveDurationMs =
            (timeWindow.getEndTimestampSec() - timeWindow.getStartTimestampSec()) * SEC_TO_MS;
        if (shiftTeam.hasAllowedCapacityRatio()) {
          vehicle.setCapacityMs(
              (long) (shiftTeam.getAllowedCapacityRatio() * shiftTeamActiveDurationMs));
        }
      }

      vehicleList.add(vehicle);

      Standstill standstill = vehicle;

      final VRPShiftTeamPosition currentPosition;
      final List<VRPShiftTeamRouteStop> stopsList;
      final List<VRPShiftTeamCommitment> commitments;
      VRPShiftTeamRouteHistory routeHistory = shiftTeam.getRouteHistory();
      currentPosition = routeHistory.getCurrentPosition();
      stopsList = routeHistory.getStopsList();
      commitments = shiftTeam.getUpcomingCommitments().getCommitmentsList();

      boolean depotIsCurrentPosition =
          currentPosition != null
              && (stopsList.isEmpty() || !stopsList.get(0).hasActualStartTimestampSec());
      if (depotIsCurrentPosition) {
        vehicle.setEarliestPossibleDepotDepartureMs(
            currentPosition.getKnownTimestampSec() * SEC_TO_MS);
      }

      boolean canPin = true;
      for (VRPShiftTeamRouteStop stop : stopsList) {
        Customer customerStop = null;
        switch (stop.getStopCase()) {
          case STOP_NOT_SET -> throw new IllegalArgumentException("invalid route stop");
          case VISIT -> {
            VRPShiftTeamVisit visit = stop.getVisit();
            customerStop = customerVisitMap.get(visit.getVisitId());
            if (customerStop == null) {
              throw new IllegalArgumentException("Unknown visit id: " + visit.getVisitId());
            }

            setCustomerTimestampsFromStop(currentPosition, stop, customerStop);
            if (visit.hasArrivalTimestampSec()) {
              customerStop.setArrivalTimestampMs(visit.getArrivalTimestampSec() * SEC_TO_MS);
            }
          }
          case REST_BREAK -> {
            customerStop = restBreakMap.get(stop.getRestBreak().getRestBreakId());
            if (customerStop == null) {
              throw new IllegalArgumentException(
                  "Unknown rest break id: " + stop.getRestBreak().getRestBreakId());
            }
            setCustomerTimestampsFromStop(currentPosition, stop, customerStop);
          }
        }
        if (customerStop == null) {
          throw new IllegalArgumentException("invalid route stop references non-existent entity");
        }

        customerStop.setVehicle(vehicle);
        customerStop.setPinned(true);

        standstill.setNextCustomer(customerStop);
        customerStop.setPreviousStandstill(standstill);
        standstill = customerStop;
      }

      if (currentPosition != null) {
        if (!locationMap.containsKey(currentPosition.getLocationId())) {
          throw new IllegalArgumentException(
              "Missing location for currentPosition: " + currentPosition.getLocationId());
        }
        long knownTimestampMs = currentPosition.getKnownTimestampSec() * SEC_TO_MS;
        // Clamp the known timestamp to the vehicle's availability window.
        //
        // If too early - the existence of the current position stop improperly
        // "teleports" the vehicle back in time to this timestamp.
        // If too late, the current position stop before the final depot stop also
        // teleports the vehicle into the future where they can't get back in time.
        if (knownTimestampMs < vehicle.getDepot().getReadyTimestampMs()) {
          knownTimestampMs = vehicle.getDepot().getReadyTimestampMs();
        }
        // TODO: When we have a stateful indication that the vehicle is actually at the depot,
        // i.e. the shift has concluded - we can use that to gate whether we clamp the end as well.

        // inject a pinned "stop" representing the current position at an instant.
        CurrentPositionStop currentPositionStop =
            new CurrentPositionStop(
                shiftTeam.getId(),
                shiftTeam.getId(),
                locationMap.get(currentPosition.getLocationId()),
                knownTimestampMs,
                defaultProfitComponents);
        routeStopList.add(currentPositionStop);

        // Put the current position after standstill, unless it represents an "in-progress" stop.
        standstill = injectCurrentPositionStop(currentPositionStop, vehicle, standstill);
      }

      for (VRPShiftTeamCommitment commitment : commitments) {
        Customer customerStop = customerVisitMap.get(commitment.getVisitId());
        if (customerStop == null) {
          throw new IllegalArgumentException("Unknown visit id: " + commitment.getVisitId());
        }
        customerStop.setVehicle(vehicle);
        customerStop.setPinned(true);

        standstill.setNextCustomer(customerStop);
        customerStop.setPreviousStandstill(standstill);
        standstill = customerStop;
      }

      depotStop.setVehicle(vehicle);
      standstill.setNextCustomer(depotStop);
      depotStop.setPreviousStandstill(standstill);
    }

    SinkVehicle sinkVehicle = new SinkVehicle(buildSinkDepot(vehicleList), defaultProfitComponents);
    vehicleList.add(sinkVehicle);
    if (description.getUnassignedVisitsCount() > 0) {
      Standstill lastCustomer = sinkVehicle;
      for (VRPUnassignedVisit unassigned : description.getUnassignedVisitsList()) {
        Customer customer = customerVisitMap.get(unassigned.getVisitId());
        customer.setPinned(unassigned.getPinned());
        customer.setVehicle(sinkVehicle);

        lastCustomer.setNextCustomer(customer);
        customer.setPreviousStandstill(lastCustomer);
        lastCustomer = customer;
      }
    }

    VehicleRoutingSolution solution = new VehicleRoutingSolution();
    solution.setVehicleList(vehicleList);
    solution.setLocationList(locationList);
    solution.setRouteStopList(routeStopList);
    solution.setCustomerVisitList(customerVisitList);
    solution.setRestBreakList(restBreakList);
    solution.setDepotStopList(depotStopList);
    solution.setOriginalDescription(description);

    return solution;
  }

  public static VehicleRoutingSolution fromVRPRequest(SolveVRPRequest vrpRequest) {
    VRPConfig vrpConfig = vrpRequest.getConfig();
    VRPDescription description = vrpRequest.getProblem().getDescription();

    VehicleRoutingSolution vehicleRoutingSolution =
        SolutionFactory.fromVRPDescription(
            description, DefaultProfitComponents.fromVRPConfig(vrpConfig));
    vehicleRoutingSolution.setConstraintConfiguration(
        SolutionFactory.constraintConfigFromVRPConfig(
            vrpConfig, description.getVisitsCount(), description.getCurrentTimestampSec()));

    return vehicleRoutingSolution;
  }

  private static void setCustomerTimestampsFromStop(
      com.*company-data-covered*.optimizer.VRPShiftTeamPosition currentPosition,
      VRPShiftTeamRouteStop stop,
      Customer customerStop)
      throws IllegalArgumentException {
    if (stop.hasActualStartTimestampSec()) {
      customerStop.setActualArrivalTimestampMs(stop.getActualStartTimestampSec() * SEC_TO_MS);
      if (stop.hasActualCompletionTimestampSec()) {
        customerStop.setActualCompletionTimestampMs(
            stop.getActualCompletionTimestampSec() * SEC_TO_MS);
        // when we know the stop is completed at a given time, we only allow the vehicle to move
        // from there at that time.
        customerStop.setEarliestPossibleDepartureMs(customerStop.getActualCompletionTimestampMs());
      }

      boolean isCurrentPosition =
          !stop.hasActualCompletionTimestampSec() && currentPosition != null;
      if (isCurrentPosition) {
        customerStop.setEarliestPossibleDepartureMs(
            currentPosition.getKnownTimestampSec() * SEC_TO_MS);
      }
    } else if (stop.hasActualCompletionTimestampSec()) {
      throw new IllegalArgumentException(
          "Visits with actual completion times require actual start times!");
    }
  }

  public static VRPSolution toVRPSolution(
      VehicleRoutingSolution solution,
      SolutionManager<VehicleRoutingSolution, BendableLongScore> solutionManager,
      boolean includeDistanceMatrix,
      boolean includeTotalStats) {
    VRPDescription inputDescription = solution.getOriginalDescription();
    Map<Long, VRPShiftTeamRouteHistory> routeHistoryMap =
        inputDescription.getShiftTeamsList().stream()
            .collect(
                Collectors.toMap(VRPShiftTeam::getId, shiftTeam -> shiftTeam.getRouteHistory()));
    Map<Long, VRPShiftTeamCommitments> upcomingCommitmentsMap =
        inputDescription.getShiftTeamsList().stream()
            .collect(
                Collectors.toMap(
                    VRPShiftTeam::getId, shiftTeam -> shiftTeam.getUpcomingCommitments()));

    VRPSolution.Builder vrpSolution = VRPSolution.newBuilder();
    VRPDescription.Builder description = VRPDescription.newBuilder();

    VRPStats.Builder vrpStatsBuilder = VRPStats.newBuilder();

    description.addAllVisits(
        solution.getCustomerVisitList().stream()
            .map(
                customer -> {
                  long serviceDurationSec = customer.getServiceDurationMs() / SEC_TO_MS;
                  vrpStatsBuilder.setServiceDurationSec(
                      vrpStatsBuilder.getServiceDurationSec() + serviceDurationSec);
                  Builder vrpCustomer =
                      VRPVisit.newBuilder()
                          .setId(customer.getId())
                          .setLocationId(customer.getLocation().getId())
                          // TODO: roundtrip the urgency window as well?
                          .setAcuity(
                              VRPVisitAcuity.newBuilder().setLevel(customer.getAcuityLevel()))
                          .setPerVisitRevenueUsdCents(customer.getVisitValueCents())
                          .setArrivalTimeWindow(
                              VRPTimeWindow.newBuilder()
                                  .setStartTimestampSec(customer.getReadyTimestampMs() / SEC_TO_MS)
                                  .setEndTimestampSec(customer.getDueTimestampMs() / SEC_TO_MS))
                          .setServiceDurationSec(serviceDurationSec)
                          .setExtraSetupDurationSec(customer.getExtraSetupDurationMs() / SEC_TO_MS);

                  if (customer.getOverlapSetKey() != Customer.NO_OVERLAP) {
                    vrpCustomer.setOverlapSetKey(customer.getOverlapSetKey().toString());
                  }

                  AssignabilityChecker assignabilityChecker = customer.getAssignabilityChecker();
                  vrpCustomer.addAllRequiredAttributes(
                      assignabilityChecker.getOrderedRequiredAttributes());
                  vrpCustomer.addAllForbiddenAttributes(
                      assignabilityChecker.getOrderedForbiddenAttributes());

                  return vrpCustomer.build();
                })
            .toList());
    description.addAllRestBreaks(
        solution.getRestBreakList().stream()
            .map(
                restBreak -> {
                  VRPRestBreak.Builder vrpRestBreak =
                      VRPRestBreak.newBuilder()
                          .setId(restBreak.getRestBreakId())
                          .setShiftTeamId(restBreak.getRestBreakShiftTeamId())
                          .setDurationSec(restBreak.getRestBreakDurationMs() / SEC_TO_MS)
                          .setUnrequested(restBreak.getIsUnrequested());
                  if (!restBreak.getIsUnrequested()) {
                    vrpRestBreak
                        .setLocationId(restBreak.getRestBreakLocation().getId())
                        .setStartTimestampSec(restBreak.getRestBreakStartTimestampMs() / SEC_TO_MS);
                  }
                  return vrpRestBreak.build();
                })
            .toList());

    description.addAllShiftTeams(
        solution.getVehicleList().stream()
            .filter(vehicle -> !vehicle.isSinkVehicle())
            .map(
                vehicle -> {
                  VRPShiftTeam.Builder vrpShiftTeam =
                      VRPShiftTeam.newBuilder()
                          .setId(vehicle.getId())
                          .setDepotLocationId(vehicle.getLocation().getId())
                          .setRouteHistory(routeHistoryMap.get(vehicle.getId()))
                          .setUpcomingCommitments(upcomingCommitmentsMap.get(vehicle.getId()))
                          .setAvailableTimeWindow(
                              VRPTimeWindow.newBuilder()
                                  .setStartTimestampSec(
                                      vehicle.getDepot().getReadyTimestampMs() / SEC_TO_MS)
                                  .setEndTimestampSec(
                                      vehicle.getDepot().getDueTimestampMs() / SEC_TO_MS))
                          .setNumAppMembers(vehicle.getNumProviderAPP())
                          .setNumDhmtMembers(vehicle.getNumProviderDHMT());
                  Set<Attribute> attributes = vehicle.getAttributes();
                  if (!attributes.isEmpty()) {
                    vrpShiftTeam.addAllAttributes(
                        attributes.stream()
                            .map(
                                attribute ->
                                    VRPAttribute.newBuilder().setId(attribute.getId()).build())
                            .toList());
                  }

                  Long depotDepartureTimestampMs = vehicle.getDepotDepartureTimestampMs();
                  Long depotArrivalTimestampMs = vehicle.getDepotArrivalTimestampMs();
                  if (includeTotalStats) {
                    Distance totalDistance = vehicle.getTotalDistance();
                    long deltaDrivingTimeSec = totalDistance.getDurationMs() / SEC_TO_MS;
                    vrpStatsBuilder.setDriveDurationSec(
                        vrpStatsBuilder.getDriveDurationSec() + deltaDrivingTimeSec);
                    vrpStatsBuilder.setDriveDistanceMeters(
                        vrpStatsBuilder.getDriveDistanceMeters() + totalDistance.getMeters());
                  }
                  VRPShiftTeamRoute.Builder route =
                      VRPShiftTeamRoute.newBuilder()
                          .setCurrentPosition(
                              routeHistoryMap.get(vehicle.getId()).getCurrentPosition())
                          .addAllStops(
                              vehicle.getRouteCustomers().stream()
                                  .filter(Customer::isVRPRouteStop)
                                  .map(customer -> customer.toVRPShiftTeamRouteStop())
                                  .toList());
                  if (depotArrivalTimestampMs != null) {
                    route.setDepotArrivalTimestampSec(depotArrivalTimestampMs / SEC_TO_MS);
                  }
                  if (depotDepartureTimestampMs != null) {
                    route.setDepotDepartureTimestampSec(depotDepartureTimestampMs / SEC_TO_MS);
                  }
                  vrpShiftTeam.setRoute(route);

                  return vrpShiftTeam.build();
                })
            .toList());

    VRPDistanceMatrix.Builder distanceMatrix = null;
    if (includeDistanceMatrix) {
      distanceMatrix = description.getDistanceMatrixBuilder();
    }
    for (Location location : solution.getLocationList()) {
      description.addLocations(
          VRPLocation.newBuilder()
              .setId(location.getId())
              .setLatitudeE6((int) (location.getLatitude() * E6))
              .setLongitudeE6((int) (location.getLongitude() * E6)));

      if (includeDistanceMatrix) {
        distanceMatrix.addAllDistances(
            location.getDistanceMap().entrySet().stream()
                .map(
                    locationDistanceEntry -> {
                      long distanceMeters = locationDistanceEntry.getValue().getMeters();
                      return VRPDistance.newBuilder()
                          .setFromLocationId(location.getId())
                          .setToLocationId(locationDistanceEntry.getKey().getId())
                          .setDurationSec(
                              locationDistanceEntry.getValue().getDurationMs() / SEC_TO_MS)
                          .setLengthMeters(distanceMeters)
                          .build();
                    })
                .toList());
      }
    }

    Optional<Vehicle> sinkVehicle =
        solution.getVehicleList().stream().filter(vehicle -> vehicle.isSinkVehicle()).findFirst();
    if (sinkVehicle.isPresent()) {
      List<VRPUnassignedVisit> unassignedVisits =
          sinkVehicle.get().getRouteCustomers().stream()
              .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
              .map(
                  customer ->
                      VRPUnassignedVisit.newBuilder()
                          .setVisitId(customer.getId())
                          .setPinned(customer.isPinned())
                          .build())
              .sorted(Comparator.comparingLong(VRPUnassignedVisit::getVisitId))
              .toList();
      description.addAllUnassignedVisits(unassignedVisits);
    }

    BendableLongScore score = solution.getScore();
    if (score != null) {
      VRPScore.Builder vrpScore =
          VRPScore.newBuilder()
              .setIsValid(score.isSolutionInitialized())
              .setHardScore(score.hardScore(0))
              .setUnassignedVisitsScore(score.hardScore(2))
              .setSoftScore(score.softScore(0));

      if (solutionManager != null) {
        ScoreExplanation<VehicleRoutingSolution, BendableLongScore> explanation =
            solutionManager.explain(solution);
        vrpScore.setDebugExplanation(explanation.getSummary());
      }
      vrpSolution.setScore(vrpScore);
    }
    if (includeTotalStats) {
      vrpSolution.setTotalStats(vrpStatsBuilder.build());
    }
    vrpSolution.setDescription(description.build());
    return vrpSolution.build();
  }

  public static VehicleRoutingSolutionConstraintConfiguration constraintConfigFromVRPConfig(
      VRPConfig config, int numVisits, long currentTimestampSec) {
    VehicleRoutingSolutionConstraintConfiguration constraintConfig =
        new VehicleRoutingSolutionConstraintConfiguration();
    if (config == null) {
      return constraintConfig;
    }

    VRPConstraintConfig vrpConstraintConfig = config.getConstraintConfig();
    if (vrpConstraintConfig == null) {
      return constraintConfig;
    }

    if (vrpConstraintConfig.hasClinicalUrgency()) {
      VRPConstraintConfig.ClinicalUrgencyConfig clinicalUrgency =
          vrpConstraintConfig.getClinicalUrgency();
      if (clinicalUrgency.getPolicyCase()
          == VRPConstraintConfig.ClinicalUrgencyConfig.PolicyCase.LINEAR_OFFSET_POLICY) {
        VRPConstraintConfig.ClinicalUrgencyConfig.LinearOffsetPolicy policy =
            clinicalUrgency.getLinearOffsetPolicy();

        constraintConfig.setLinearOffsetLatenessPriorToUrgencyWindowEndMs(
            policy.getOffsetPriorToUrgencyWindowEndMs());
        constraintConfig.setLinearOffsetUrgencyLatenessCostUSDMillsPerMs(
            policy.getLatenessCostUsdMillsPerMs());
      }
    }

    if (vrpConstraintConfig.hasLateArrival()) {
      constraintConfig.setHardLatenessThresholdMs(
          vrpConstraintConfig.getLateArrival().getHardLatenessThresholdMs());

      List<VRPVisitLatenessTolerance> visitLatenessToleranceOverridesList =
          vrpConstraintConfig.getLateArrival().getVisitLatenessToleranceOverridesList();
      if (visitLatenessToleranceOverridesList != null) {
        Map<Long, Long> visitLatenessToleranceOverrides =
            visitLatenessToleranceOverridesList.stream()
                .collect(
                    Collectors.toMap(
                        VRPVisitLatenessTolerance::getVisitId,
                        VRPVisitLatenessTolerance::getHardLatenessThresholdMs));
        constraintConfig.setVisitLatenessTolerancesMs(visitLatenessToleranceOverrides);
      }

      VRPConstraintConfig.LateArrivalConstraintConfig lateArrival =
          vrpConstraintConfig.getLateArrival();
      switch (lateArrival.getPolicyCase()) {
        case POLICY_NOT_SET -> throw new IllegalArgumentException(
            "late arrival constraint policy not set");
        case LINEAR_OFFSET_POLICY -> {
          VRPConstraintConfig.LateArrivalConstraintConfig.LinearOffsetPolicy policy =
              lateArrival.getLinearOffsetPolicy();

          constraintConfig.setLinearOffsetLatenessPriorToTimeWindowEndMs(
              policy.getOffsetPriorToTimeWindowEndMs());
          constraintConfig.setLinearOffsetLatenessCostUSDMillsPerMs(
              policy.getLatenessCostUsdMillsPerMs());
        }
        default -> throw new IllegalArgumentException(
            "unimplemented late arrival constraint policy");
      }
    }

    if (vrpConstraintConfig.hasDepotLateArrival()) {
      VRPConstraintConfig.DepotLateArrivalConstraintConfig depotLateArrival =
          vrpConstraintConfig.getDepotLateArrival();

      constraintConfig.setDepotHardLatenessThresholdMs(
          depotLateArrival.getHardLatenessThresholdMs());

      ImmutableSet<Long> disallowedLateArrivalVisitIds =
          new ImmutableSet.Builder<Long>()
              .addAll(depotLateArrival.getDisallowedLateArrivalVisitIdsList().iterator())
              .build();
      constraintConfig.setDisallowedLateArrivalVisitIds(disallowedLateArrivalVisitIds);

      switch (depotLateArrival.getPolicyCase()) {
        case POLICY_NOT_SET -> throw new IllegalArgumentException(
            "depot late arrival constraint policy not set");
        case LINEAR_OFFSET_POLICY -> {
          VRPConstraintConfig.DepotLateArrivalConstraintConfig.LinearOffsetPolicy policy =
              depotLateArrival.getLinearOffsetPolicy();
          constraintConfig.setLinearOffsetLatenessPriorToDepotDueTimeMs(
              policy.getOffsetPriorToDepotDueTimeMs());
          constraintConfig.setLinearOffsetDepotLatenessCostUSDMillsPerMs(
              policy.getLatenessCostUsdMillsPerMs());
        }
        default -> throw new IllegalArgumentException(
            "unimplemented depot late arrival constraint policy");
      }
    }

    if (vrpConstraintConfig.hasOpportunityCost()) {
      VRPConstraintConfig.OpportunityCostConstraintConfig opportunityCost =
          vrpConstraintConfig.getOpportunityCost();
      switch (opportunityCost.getPolicyCase()) {
        case POLICY_NOT_SET -> {}
        case IDLE_TIME_POLICY -> {
          // TODO(LOG-1673): implement me by configuring the constraint Java model appropriately
        }
        default -> throw new IllegalArgumentException(
            "unimplemented opportunity cost constraint policy");
      }

      switch (opportunityCost.getOnSceneCostCase()) {
        case ONSCENECOST_NOT_SET -> {}
        case LINEAR_ON_SCENE_COST -> constraintConfig.setVehicleOnSceneProviderCostScale(
            opportunityCost.getLinearOnSceneCost().getScalingFactor());
        default -> throw new IllegalArgumentException(
            "unimplemented on scene cost constraint policy");
      }

      switch (opportunityCost.getForegoneVisitCostCase()) {
        case FOREGONEVISITCOST_NOT_SET -> {}
        case LINEAR_FOREGONE_VISIT_VALUE -> {
          VRPConstraintConfig.OpportunityCostConstraintConfig.LinearForegoneVisitValuePolicy
              linearForegoneVisitValue = opportunityCost.getLinearForegoneVisitValue();

          constraintConfig.setCurrentTimestampMs(currentTimestampSec * SEC_TO_MS);

          double centsPerMinute = linearForegoneVisitValue.getCentsPerMinute();
          if (centsPerMinute < 0) {
            throw new IllegalArgumentException(
                "foregone visit value cents per minute cannot be negative");
          }
          constraintConfig.setLinearForegoneVisitValueCentsPerMs(centsPerMinute / MS_PER_MINUTE);
        }
        default -> throw new IllegalArgumentException(
            "unimplemented foregone visit cost constraint policy");
      }
    }

    if (config.hasDrivingCostUsdMillsPerKilometer()) {
      constraintConfig.setDrivingCostUSDMillsPerKilometer(
          config.getDrivingCostUsdMillsPerKilometer());
    }

    if (vrpConstraintConfig.hasWorkDistribution()) {
      switch (vrpConstraintConfig.getWorkDistribution().getPolicyCase()) {
        case POLICY_NOT_SET -> throw new IllegalArgumentException(
            "work distribution constraint policy not set");
        case EXPONENTIAL_POLICY -> {
          VRPConstraintConfig.WorkDistributionConstraintConfig.ExponentialPolicy policy =
              vrpConstraintConfig.getWorkDistribution().getExponentialPolicy();

          if (policy.getBaseDenominator() <= 0) {
            throw new IllegalArgumentException(
                "misconfigured work distribution constraint policy: non-positive base denominator");
          }
          if (policy.getFullQueueValueLimitUsdMills() < 0) {
            throw new IllegalArgumentException(
                "misconfigured work distribution constraint policy: negative queue value");
          }
          constraintConfig.setWorkDistributionExponentialPolicy(
              policy.getFullQueueValueLimitUsdMills(),
              policy.getBaseNumerator(),
              policy.getBaseDenominator(),
              numVisits);
        }
        default -> throw new IllegalArgumentException(
            "unimplemented work distribution constraint policy");
      }
    }

    return constraintConfig;
  }

  private static Standstill injectCurrentPositionStop(
      CurrentPositionStop currentPositionStop, Vehicle vehicle, Standstill lastHistoricalStop) {

    currentPositionStop.setVehicle(vehicle);

    Standstill standstillBeforeCurrentPosition = lastHistoricalStop;
    Standstill lastStandstill = currentPositionStop;

    // If the previous stop is a customer that is still "in-progress",
    // we put the current position before that stop.
    if (lastHistoricalStop instanceof Customer
        && (((Customer) lastHistoricalStop).getActualArrivalTimestampMs() == null
            || ((Customer) lastHistoricalStop).getActualCompletionTimestampMs() == null)) {

      Customer lastHistoricalCustomer = (Customer) lastHistoricalStop;
      standstillBeforeCurrentPosition = lastHistoricalCustomer.getPreviousStandstill();

      // rig up the pointers in the middle of the chain, making sure to capture the fact that
      // the end to be returned is the lastHistoricalCustomer instead of the current position stop.
      lastStandstill = lastHistoricalCustomer;
      currentPositionStop.setNextCustomer(lastHistoricalCustomer);
      lastHistoricalCustomer.setPreviousStandstill(currentPositionStop);
    }

    // And connect the current position backwards.
    standstillBeforeCurrentPosition.setNextCustomer(currentPositionStop);
    currentPositionStop.setPreviousStandstill(standstillBeforeCurrentPosition);

    return lastStandstill;
  }

  // TODO: Use SolutionManager.update instead.
  public static void recalculateArrivalTimestamps(VehicleRoutingSolution vehicleRoutingSolution) {
    ScoreDirector<VehicleRoutingSolution> scoreDirector = new DummyScoreDirector<>();
    ArrivalTimeUpdatingVariableListener variableListener =
        new ArrivalTimeUpdatingVariableListener();
    vehicleRoutingSolution
        .getVehicleList()
        .forEach(
            vehicle -> {
              Customer nextCustomer = vehicle.getNextCustomer();
              if (nextCustomer != null) {
                variableListener.updateArrivalTime(scoreDirector, nextCustomer);
              }
            });
  }

  private static Depot buildSinkDepot(List<Vehicle> vehicleList) {
    Depot firstDepot = vehicleList.get(0).getDepot();
    long earliestReadyTimestampMs = 0L;
    long latestDueTimestampMs = Long.MAX_VALUE;

    return new Depot(firstDepot.getLocation(), earliestReadyTimestampMs, latestDueTimestampMs);
  }

  public static SolveVRPRequest solveRequestFromJson(String jsonString) throws IOException {
    SolveVRPRequest.Builder solveRequestBuilder = SolveVRPRequest.newBuilder();

    JsonFormat.parser().merge(jsonString, solveRequestBuilder);
    SolveVRPRequest solveRequest = solveRequestBuilder.build();
    return solveRequest;
  }

  public static VehicleRoutingSolution fromJson(String jsonString) throws IOException {
    SolveVRPRequest solveRequest = solveRequestFromJson(jsonString);
    VRPDescription description = solveRequest.getProblem().getDescription();
    return fromVRPDescription(
        description, DefaultProfitComponents.fromVRPConfig(solveRequest.getConfig()));
  }
}
