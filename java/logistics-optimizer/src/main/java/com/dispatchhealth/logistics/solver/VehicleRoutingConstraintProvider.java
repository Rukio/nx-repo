package com.*company-data-covered*.logistics.solver;

import static org.optaplanner.core.api.score.stream.ConstraintCollectors.countDistinct;
import static org.optaplanner.core.api.score.stream.Joiners.equal;

import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.DepotStop;
import com.*company-data-covered*.logistics.domain.RestBreak;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolutionConstraintConfiguration;
import java.time.Duration;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;

public class VehicleRoutingConstraintProvider implements ConstraintProvider {
  // TODO(LOG-1153): Add modeling of lunch breaks.
  // Ref:
  // https://stackoverflow.com/questions/38292598/modeling-lunch-breaks-and-additional-depot-returns-in-optaplanner

  protected static final long MS_PER_MINUTE = Duration.ofMinutes(1).toMillis();
  protected static final long MS_PER_HOUR = Duration.ofHours(1).toMillis();

  protected static final long USD_MILLS_PER_CENT = 10;
  protected static final long METERS_PER_KILOMETER = 1000;

  protected static final long E6 = (long) 1e6;

  @Override
  public Constraint[] defineConstraints(ConstraintFactory factory) {
    return new Constraint[] {
      // "Super" Hard constraints (internal implementation details)
      // Units: Mixed
      depotStopsOnCorrectVehicles(factory),

      // Hard constraints
      // Units: Mixed
      vehicleArrivesAtCustomerLate(factory),
      vehicleArrivesAtDepotLate(factory),
      vehicleIsOverCapacity(factory),
      vehicleUnmatchedAttributesForCustomer(factory),
      restBreakOnCorrectVehicles(factory),

      // Unassigned customers
      // Units: Number of unassigned customers
      unassignedCustomers(factory),

      // Soft constraints
      // Units: USD mills of net revenue
      // https://en.wikipedia.org/wiki/Mill_(currency)
      completedVisitRevenueUSDMills(factory),
      vehicleDriveCostUSDMills(factory),
      vehicleBaseWageCostUSDMills(factory),
      vehicleOnSceneTimeCostUSDMills(factory),
      foregoneVisitOpportunityCostMills(factory),
      vehicleProviderOvertimeUSDMills(factory),
      linearOffsetLatenessToCustomerUSDMills(factory),
      linearOffsetLatenessToDepotUSDMills(factory),
      linearOffsetClinicalUrgencyLatenessToCustomerUSDMills(factory),
      workDistributionExponentialPolicyUSDMills(factory),
    };
  }

  // ************************************************************************
  // Hard constraints
  // ************************************************************************
  protected Constraint depotStopsOnCorrectVehicles(ConstraintFactory factory) {
    return factory
        .forEach(DepotStop.class)
        .filter(depotStop -> !(depotStop.isCorrectShiftTeam() && depotStop.isInRightOrder()))
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_DEPOT_STOP_HARD, depotStop -> 1L)
        .asConstraint("depotStopUnassignedOrOnWrongShiftTeamOrder");
  }

  protected Constraint vehicleArrivesAtCustomerLate(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .filter(customer -> !customer.ignoreHardConstraints())
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .filter(
            (customer, cfg) ->
                customer.isArrivalAfterDueTime(cfg.getVisitLatenessToleranceMs(customer.getId())))
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_HARD,
            (customer, cfg) -> customer.getArrivalTimestampMs() - customer.getDueTimestampMs())
        .asConstraint("customerArrivalAfterDueTime");
  }

  protected Constraint linearOffsetLatenessToDepotUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        // in order to handle the "keep the problem feasible if all customers are pinned"
        // we need to filter out the final DepotStop which is likely never pinned.
        .filter(customer -> !(customer instanceof DepotStop))
        .groupBy(Customer::getVehicle, countDistinct(Customer::ignoreHardConstraints))
        .filter((vehicle, numBoolValues) -> !vehicle.isSinkVehicle())
        .filter(
            (vehicle, numBoolValues) ->
                !vehicle.getNextCustomer().ignoreHardConstraints() || numBoolValues != 1)
        .filter((vehicle, numBoolValues) -> vehicle.getDepotArrivalTimestampMs() != null)
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .penalizeConfigurableLong(
            (vehicle, _numBoolValues, cfg) ->
                vehicle.getDepotLatenessAfterDueTimeWithOffsetMs(
                        cfg.getLinearOffsetLatenessPriorToDepotDueTimeMs())
                    / MS_PER_MINUTE)
        .asConstraint(
            VehicleRoutingSolutionConstraintConfiguration
                .SOFT_LATE_DEPOT_ARRIVAL_PER_MINUTE_COST_USD_MILLS);
  }

  protected Constraint restBreakOnCorrectVehicles(ConstraintFactory factory) {
    return factory
        .forEach(RestBreak.class)
        .filter(restBreak -> !restBreak.isPinned())
        // This also enforces that the rest break is not on the sink vehicle; i.e. is assigned.
        .filter(restBreak -> !restBreak.isCorrectShiftTeam())
        .penalizeLong(VehicleRoutingSolutionConstraintConfiguration.ONE_HARD, restBreak -> 1L)
        .asConstraint("restBreakUnassignedOrOnWrongShiftTeam");
  }

  protected Constraint vehicleArrivesAtDepotLate(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        // in order to handle the "keep the problem feasible if all customers are pinned"
        // we need to filter out the final DepotStop which is likely never pinned.
        .filter(customer -> !(customer instanceof DepotStop))
        .groupBy(Customer::getVehicle, countDistinct(Customer::ignoreHardConstraints))
        .filter((vehicle, numBoolValues) -> !vehicle.isSinkVehicle())
        .filter(
            (vehicle, numBoolValues) ->
                !vehicle.getNextCustomer().ignoreHardConstraints() || numBoolValues != 1)
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .filter(
            (vehicle, _numBoolValues, cfg) -> {
              long depotHardLatenessThresholdMs = 0;
              boolean containsDisallowedVisit =
                  vehicle.getRouteCustomers().stream()
                      .anyMatch(
                          customer ->
                              cfg.getDisallowedLateArrivalVisitIds().contains(customer.getId()));
              if (!containsDisallowedVisit) {
                depotHardLatenessThresholdMs = cfg.getDepotHardLatenessThresholdMs();
              }

              return vehicle.isDepotArrivalAfterDueTime(depotHardLatenessThresholdMs);
            })
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_HARD,
            (vehicle, _numBoolValues, cfg) ->
                vehicle.getDepotArrivalTimestampMs() - vehicle.getDepot().getDueTimestampMs())
        .asConstraint("depotArrivalAfterDueTime");
  }

  protected Constraint vehicleIsOverCapacity(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .groupBy(Customer::getVehicle)
        .filter((vehicle) -> !vehicle.isSinkVehicle())
        .filter((vehicle) -> vehicle.getCapacityMs() != null)
        .filter((vehicle) -> vehicle.getOccupiedCapacityMs() > vehicle.getCapacityMs())
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_HARD,
            (vehicle) -> vehicle.getOccupiedCapacityMs() - vehicle.getCapacityMs())
        .asConstraint("capacityOverMaximum");
  }

  protected Constraint vehicleUnmatchedAttributesForCustomer(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .filter(customer -> !customer.ignoreHardConstraints())
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_HARD,
            customer ->
                customer
                    .getAssignabilityChecker()
                    .checkShiftTeamAttributes(customer.getVehicle().getAttributes())
                    .problemCount())
        .asConstraint("vehicleDoesNotMatchCustomerAttributes");
  }

  // ************************************************************************
  // Unassigned Customers
  // ************************************************************************

  protected Constraint unassignedCustomers(ConstraintFactory factory) {

    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .filter(Customer::isAssignedToSinkVehicle)
        .filter(customer -> !customer.isExpendable())
        .filter(customer -> !customer.isPinned())
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_UNASSIGNED_CUSTOMER,
            (customer) -> 1000 + customer.getAcuityLevel() + 10 * customer.getPrioritizationLevel())
        .asConstraint("unassignedCustomers");
  }

  // ************************************************************************
  // Soft constraints
  // ************************************************************************

  // TODO(MARK-2476): pass mills isntead of cents for customer on solution factory
  protected Constraint completedVisitRevenueUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .filter(customer -> !customer.isAssignedToSinkVehicle())
        .rewardLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_SOFT,
            (customer) -> customer.getVisitValueCents() * USD_MILLS_PER_CENT)
        .asConstraint("visit revenue");
  }

  protected Constraint vehicleOnSceneTimeCostUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Vehicle.class)
        .filter(vehicle -> !vehicle.isSinkVehicle())
        .join(Customer.class)
        .filter(
            (vehicle, customer) ->
                customer.representsRealCustomerVisitAndNotAnotherStopType()
                    && customer.getVehicleId() == vehicle.getId())
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_SOFT,
            (vehicle, customer, cfg) ->
                (customer.getServiceDurationMs()
                        * vehicle.perHourProviderCostUSDCents()
                        * USD_MILLS_PER_CENT
                        * cfg.getVehicleOnSceneProviderCostScaleE6())
                    / MS_PER_HOUR
                    / E6)
        .asConstraint("on scene cost");
  }

  protected Constraint foregoneVisitOpportunityCostMills(ConstraintFactory factory) {
    return factory
        .forEach(Vehicle.class)
        .filter(vehicle -> !vehicle.isSinkVehicle())
        .join(Customer.class)
        .filter(
            (vehicle, customer) ->
                customer.representsRealCustomerVisitAndNotAnotherStopType()
                    && customer.getVehicleId() == vehicle.getId())
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .filter(
            (vehicle, customer, cfg) ->
                !customer.isPinned()
                    && customer.getArrivalTimestampMs() > cfg.getCurrentTimestampMs())
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_SOFT,
            (vehicle, customer, cfg) -> {
              long msLeftToArrive = customer.getArrivalTimestampMs() - cfg.getCurrentTimestampMs();

              return (long)
                      (cfg.getLinearForegoneVisitValueCentsPerMs()
                          * (customer.getServiceDurationMs() + msLeftToArrive))
                  * USD_MILLS_PER_CENT;
            })
        .asConstraint("route opportunity cost");
  }

  protected Constraint vehicleProviderOvertimeUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Vehicle.class)
        // expensive gymnastics to make sure that the customer updates are reflected in score
        // calculations.
        .join(Customer.class)
        .groupBy((v, c) -> v)
        .filter((vehicle) -> !vehicle.isSinkVehicle())
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_SOFT,
            (v) ->
                (v.getOvertimeMs() * v.perHourProviderCostUSDCents() * USD_MILLS_PER_CENT)
                    / MS_PER_HOUR)
        .asConstraint("provider overtime cost");
  }

  protected Constraint vehicleBaseWageCostUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Vehicle.class)
        .filter((vehicle) -> !vehicle.isSinkVehicle())
        .penalizeLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_SOFT,
            (v) ->
                (v.getScheduledDurationMs() * v.perHourProviderCostUSDCents() * USD_MILLS_PER_CENT)
                    / MS_PER_HOUR)
        .asConstraint("provider base wage cost");
  }

  protected Constraint vehicleDriveCostUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Vehicle.class)
        // expensive gymnastics to make sure that the customer updates are reflected in score
        // calculations.
        .join(Customer.class)
        .groupBy((v, c) -> v)
        .filter((vehicle) -> !vehicle.isSinkVehicle())
        .filter(vehicle -> vehicle.getTotalDistance().getMeters() > 0)
        .penalizeConfigurableLong(
            vehicle -> (vehicle.getTotalDistance().getMeters() / METERS_PER_KILOMETER))
        .asConstraint(
            VehicleRoutingSolutionConstraintConfiguration.DRIVING_COST_USD_MILLS_PER_KILOMETER);
  }

  protected Constraint workDistributionExponentialPolicyUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .join(Vehicle.class, equal(Customer::getVehicleId, Vehicle::getId))
        .groupBy((c, v) -> c)
        .groupBy(Customer::getVehicle, countDistinct(Customer::getId))
        .filter((vehicle, count) -> vehicle != null && !vehicle.isSinkVehicle())
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .rewardLong(
            VehicleRoutingSolutionConstraintConfiguration.ONE_SOFT,
            (vehicle, numberOfCustomersServed, cfg) ->
                cfg.getWorkDistributionExponentialPolicyUSDMills(numberOfCustomersServed))
        .asConstraint("workDistributionExponentialPolicyUSDMills");
  }

  protected Constraint linearOffsetLatenessToCustomerUSDMills(ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .filter(
            customer ->
                !customer.isAssignedToSinkVehicle() && customer.getArrivalTimestampMs() != null)
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .penalizeConfigurableLong(
            (customer, cfg) ->
                customer.getLatenessAfterDueTimeWithOffsetMs(
                        cfg.getLinearOffsetLatenessPriorToTimeWindowEndMs())
                    / MS_PER_MINUTE)
        .asConstraint(
            VehicleRoutingSolutionConstraintConfiguration
                .SOFT_LATE_ARRIVAL_PER_MINUTE_COST_USD_MILLS);
  }

  protected Constraint linearOffsetClinicalUrgencyLatenessToCustomerUSDMills(
      ConstraintFactory factory) {
    return factory
        .forEach(Customer.class)
        .filter(Customer::representsRealCustomerVisitAndNotAnotherStopType)
        .filter(Customer::hasAcuityTimeWindow)
        .filter(
            customer ->
                !customer.isAssignedToSinkVehicle() && customer.getArrivalTimestampMs() != null)
        .join(VehicleRoutingSolutionConstraintConfiguration.class)
        .penalizeConfigurableLong(
            (customer, cfg) ->
                customer.getLatenessAfterAcuityTWEndWithOffsetMs(
                        cfg.getLinearOffsetLatenessPriorToUrgencyWindowEndMs())
                    / MS_PER_MINUTE)
        .asConstraint(
            VehicleRoutingSolutionConstraintConfiguration
                .SOFT_LATE_URGENCY_ARRIVAL_PER_MINUTE_COST_USD_MILLS);
  }
}
