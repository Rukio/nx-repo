package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.AssignabilityChecker;
import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.ArrivalTimeUpdatingVariableListener;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.*company-data-covered*.optimizer.VRPShiftTeamRouteStop;
import com.*company-data-covered*.optimizer.VRPShiftTeamVisit;
import com.*company-data-covered*.optimizer.VRPVisit;
import com.*company-data-covered*.optimizer.VRPVisitValue;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.collect.ImmutableSet;
import java.util.Objects;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.entity.PlanningPin;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.AnchorShadowVariable;
import org.optaplanner.core.api.domain.variable.PlanningVariable;
import org.optaplanner.core.api.domain.variable.PlanningVariableGraphType;
import org.optaplanner.core.api.domain.variable.ShadowVariable;

@JsonIgnoreProperties({"previousStandstill", "nextCustomer", "vehicle"})
// TODO: Add DifficultyWeightFactoryClass.
@PlanningEntity
public class Customer implements Standstill, VRPStop {

  private static final long SEC_TO_MS = 1000;

  private static final ImmutableSet<Attribute> NO_ATTRIBUTES = ImmutableSet.of();

  @PlanningId private long id;
  private Location location;
  private AssignabilityChecker assignabilityChecker;

  private long readyTimestampMs;
  private long dueTimestampMs;
  private long serviceDurationMs;
  private long extraSetupDurationMs;

  private long earliestPossibleDepartureMs;

  private boolean isExpendable = false;

  @PlanningPin private boolean pinned = false;

  // Planning variable: changes during planning, between score calculations.
  @PlanningVariable(
      valueRangeProviderRefs = {"vehicleRange", "routeStopRange"},
      graphType = PlanningVariableGraphType.CHAINED)
  private Standstill previousStandstill;

  // Shadow variables
  private Customer nextCustomer;
  private Long arrivalTimestampMs;
  private Long capacityOffsetMs;

  private Long actualArrivalTimestampMs;

  private Long actualCompletionTimestampMs;

  private long acuityLevel;

  private long prioritizationLevel;

  private Long acuityTimeWindowStartMs;
  private Long acuityTimeWindowEndMs;

  private long visitValueCents;

  public static final Object NO_OVERLAP =
      new Object() {
        @Override
        public boolean equals(Object obj) {
          return false;
        }
      };
  private Object overlapSetKey = NO_OVERLAP;

  @AnchorShadowVariable(sourceVariableName = "previousStandstill")
  private Vehicle vehicle;

  public Customer(
      long id,
      Location location,
      long readyTimestampMs,
      long dueTimestampMs,
      long serviceDurationMs,
      DefaultProfitComponents defaultProfitComponents) {
    this.id = id;
    this.location = location;
    this.readyTimestampMs = readyTimestampMs;
    this.dueTimestampMs = dueTimestampMs;
    this.serviceDurationMs = serviceDurationMs;
    this.assignabilityChecker = AssignabilityChecker.EMPTY_ASSIGNABILITY_CHECKER;
    this.earliestPossibleDepartureMs = 0L;
    long defaultVisitRevenueUSDCents = defaultProfitComponents.visitRevenueUSDCents();
    this.setVisitValueCents(
        VRPVisit.newBuilder().setPerVisitRevenueUsdCents(defaultVisitRevenueUSDCents).build());
  }

  public Customer() {}

  @ShadowVariable(
      variableListenerClass = ArrivalTimeUpdatingVariableListener.class,
      // Arguable, to adhere to API specs (although this works), nextCustomer should also be a
      // source,
      // because this shadow must be triggered after nextCustomer (but there is no need to be
      // triggered by nextCustomer)
      sourceVariableName = "previousStandstill")
  public Long getArrivalTimestampMs() {
    return arrivalTimestampMs;
  }

  public void setArrivalTimestampMs(Long arrivalTimestampMs) {
    this.arrivalTimestampMs = arrivalTimestampMs;
  }

  public Long getCapacityOffsetMs() {
    return capacityOffsetMs;
  }

  public void setCapacityOffsetMs(Long capacityOffsetMs) {
    this.capacityOffsetMs = capacityOffsetMs;
  }

  public Long getVehicleId() {
    if (vehicle == null) {
      return null;
    }
    return vehicle.getId();
  }

  public long getReadyTimestampMs() {
    return readyTimestampMs;
  }

  public long getDueTimestampMs() {
    return dueTimestampMs;
  }

  public void setDueTimestampMs(Long dueTimestampMs) {
    this.dueTimestampMs = dueTimestampMs;
  }

  public long getServiceDurationMs() {
    return serviceDurationMs;
  }

  public long getEarliestPossibleDepartureMs() {
    return earliestPossibleDepartureMs;
  }

  public void setEarliestPossibleDepartureMs(long earliestPossibleDepartureMs) {
    this.earliestPossibleDepartureMs = earliestPossibleDepartureMs;
  }

  public Long getActualArrivalTimestampMs() {
    return actualArrivalTimestampMs;
  }

  public void setActualArrivalTimestampMs(Long actualArrivalTimestampMs) {
    this.actualArrivalTimestampMs = actualArrivalTimestampMs;
  }

  public Long getActualCompletionTimestampMs() {
    return actualCompletionTimestampMs;
  }

  public void setActualCompletionTimestampMs(Long actualCompletionTimestampMs) {
    this.actualCompletionTimestampMs = actualCompletionTimestampMs;
  }

  public boolean isPinned() {
    return pinned;
  }

  public void setPinned(boolean pinned) {
    this.pinned = pinned;
  }

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  @Override
  public Location getLocation() {
    return location;
  }

  public void setLocation(Location location) {
    this.location = location;
  }

  public boolean isAssignedToSinkVehicle() {
    return vehicle != null && vehicle.isSinkVehicle();
  }

  public boolean ignoreHardConstraints() {
    return isPinned() || isAssignedToSinkVehicle();
  }

  public AssignabilityChecker getAssignabilityChecker() {
    return assignabilityChecker;
  }

  public void setAssignabilityChecker(AssignabilityChecker assignabilityChecker) {
    this.assignabilityChecker = assignabilityChecker;
  }

  public void setAcuityTimeWindowStartMs(long startTimestampMs) {
    this.acuityTimeWindowStartMs = startTimestampMs;
  }

  public void setAcuityTimeWindowEndMs(long endTimestampMs) {
    this.acuityTimeWindowEndMs = endTimestampMs;
  }

  public boolean hasAcuityTimeWindow() {
    return this.acuityTimeWindowStartMs != null && this.acuityTimeWindowEndMs != null;
  }

  public long getAcuityLevel() {
    return acuityLevel;
  }

  public void setAcuityLevel(long level) {
    this.acuityLevel = level;
  }

  public long getPrioritizationLevel() {
    return prioritizationLevel;
  }

  public void setPrioritizationLevel(long prioritizationLevel) {
    this.prioritizationLevel = prioritizationLevel;
  }

  public Standstill getPreviousStandstill() {
    return previousStandstill;
  }

  public void setPreviousStandstill(Standstill previousStandstill) {
    this.previousStandstill = previousStandstill;
  }

  @Override
  public Customer getNextCustomer() {
    return nextCustomer;
  }

  @Override
  public void setNextCustomer(Customer nextCustomer) {
    this.nextCustomer = nextCustomer;
  }

  public Vehicle getVehicle() {
    return vehicle;
  }

  public void setVehicle(Vehicle vehicle) {
    this.vehicle = vehicle;
  }

  public void setVisitValueCents(VRPVisit visit) {
    if (visit.hasValue()) {
      VRPVisitValue value = visit.getValue();
      if (value.hasCompletionValueCents()) {
        this.visitValueCents = value.getCompletionValueCents();
      }
    } else if (visit.hasPerVisitRevenueUsdCents()) {
      this.visitValueCents = visit.getPerVisitRevenueUsdCents();
    }
  }

  public long getVisitValueCents() {
    return this.visitValueCents;
  }

  public long getExtraSetupDurationMs() {
    return this.extraSetupDurationMs;
  }

  public void setExtraSetupDurationMs(long duration) {
    this.extraSetupDurationMs = duration;
  }

  public Object getOverlapSetKey() {
    return this.overlapSetKey;
  }

  public void setOverlapSetKey(Object overlapSetKey) {
    if (overlapSetKey == null) {
      this.overlapSetKey = NO_OVERLAP;
      return;
    }
    this.overlapSetKey = overlapSetKey;
  }

  public boolean isExpendable() {
    return isExpendable;
  }

  public void setIsExpendable(boolean isExpendable) {
    this.isExpendable = isExpendable;
  }

  public boolean representsRealCustomerVisitAndNotAnotherStopType() {
    // due to the subclassing hacks for RestBreaks and other "stops",
    // we use this dynamic class reflection to make sure we apply "customer stop"
    // constraints only to actual customer stops (and not rest breaks, which "are" Customers)
    return this.getClass() == Customer.class;
  }

  // ************************************************************************
  // Complex methods
  // ************************************************************************

  /**
   * Distance from the previous standstill (a vehicle's depot or a customer).
   *
   * @return distance from the previous standstill
   */
  @JsonIgnore
  public Distance getDistanceFromPreviousStandstill() {
    if (previousStandstill == null) {
      throw new IllegalStateException(
          "This method must not be called when the previousStandstill is not initialized yet.");
    }
    return previousStandstill.getDistanceTo(getLocation());
  }

  @Override
  public Distance getDistanceTo(Location location) {
    return getLocation().getDistanceTo(location);
  }

  /**
   * Distance to the depot where the vehicle visiting this customer started.
   *
   * @return distance to the depot
   */
  @JsonIgnore
  public Distance getDistanceToDepot() {
    return getLocation().getDistanceTo(vehicle.getLocation());
  }

  public Long getCapacityOffsetAtDepartureMs() {
    if (capacityOffsetMs == null) {
      return serviceDurationMs;
    }
    return capacityOffsetMs + serviceDurationMs;
  }

  /**
   * @return a positive number, if there's an arrivalTimestampMs
   */
  public Long getDepartureTimestampMs() {
    if (arrivalTimestampMs == null) {
      return null;
    }
    Long actualCompletionTimestampMs = getActualCompletionTimestampMs();
    if (actualCompletionTimestampMs != null) {
      return actualCompletionTimestampMs;
    }
    long calculatedDepartureTimeMs =
        Math.max(arrivalTimestampMs, readyTimestampMs) + serviceDurationMs;
    return Math.max(calculatedDepartureTimeMs, getEarliestPossibleDepartureMs());
  }

  public boolean isArrivalBeforeReadyTime() {
    return arrivalTimestampMs != null && arrivalTimestampMs < readyTimestampMs;
  }

  /**
   * @return whether the arrival timestamp is after the customer's due timestamp (with a buffer).
   * @param toleratedLatenessMs how long after the due timestamp is tolerated as not late.
   */
  public boolean isArrivalAfterDueTime(long toleratedLatenessMs) {
    return arrivalTimestampMs != null
        && arrivalTimestampMs > (dueTimestampMs + toleratedLatenessMs);
  }

  public long getLatenessAfterDueTimeWithOffsetMs(long offsetPriorToTimeWindowEndMs) {
    return Math.max(0, (arrivalTimestampMs - dueTimestampMs) + offsetPriorToTimeWindowEndMs);
  }

  public long getLatenessAfterAcuityTWEndWithOffsetMs(long offsetPriorToTimeWindowEndMs) {
    return Math.max(0, (arrivalTimestampMs - acuityTimeWindowEndMs) + offsetPriorToTimeWindowEndMs);
  }

  public boolean isVRPRouteStop() {
    return true;
  }

  @Override
  public VRPShiftTeamRouteStop toVRPShiftTeamRouteStop() {
    VRPShiftTeamVisit.Builder visit = VRPShiftTeamVisit.newBuilder().setVisitId(getId());
    VRPShiftTeamRouteStop.Builder stopBuilder = VRPShiftTeamRouteStop.newBuilder();

    Long arrivalTimestampMs = getArrivalTimestampMs();
    if (arrivalTimestampMs != null) {
      visit.setArrivalTimestampSec(arrivalTimestampMs / SEC_TO_MS);
    }

    Long actualArrivalTimestampMs = getActualArrivalTimestampMs();
    if (actualArrivalTimestampMs != null) {
      stopBuilder.setActualStartTimestampSec(actualArrivalTimestampMs / SEC_TO_MS);
    }

    Long actualCompletionTimestampMs = getActualCompletionTimestampMs();
    if (actualCompletionTimestampMs != null) {
      stopBuilder.setActualCompletionTimestampSec(actualCompletionTimestampMs / SEC_TO_MS);
    }

    return stopBuilder.setVisit(visit.build()).setPinned(isPinned()).build();
  }

  /**
   * Whether this customer is the last in a chain.
   *
   * @return true, if this customer has no next customer
   */
  public boolean isLast() {
    return nextCustomer == null;
  }

  // TODO: Add more more fields for testing as needed.
  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Customer customer = (Customer) o;
    return id == customer.id
        && readyTimestampMs == customer.readyTimestampMs
        && dueTimestampMs == customer.dueTimestampMs
        && serviceDurationMs == customer.serviceDurationMs
        && Objects.equals(location, customer.location);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, location, readyTimestampMs, dueTimestampMs, serviceDurationMs);
  }

  @Override
  public String toString() {
    return "Customer{"
        + "id="
        + id
        + ", location="
        + location
        + ", readyTimestampMs="
        + readyTimestampMs
        + ", dueTimestampMs="
        + dueTimestampMs
        + ", serviceDurationMs="
        + serviceDurationMs
        + ", arrivalTimestampMs="
        + arrivalTimestampMs
        + ", actualArrivalTimestampMs="
        + actualArrivalTimestampMs
        + ", actualCompletionTimestampMs="
        + actualCompletionTimestampMs
        + ", earliestPossibleDepartureMs="
        + earliestPossibleDepartureMs
        + ", vehicle="
        + vehicle
        + ", pinned="
        + isPinned()
        + '}';
  }
}
