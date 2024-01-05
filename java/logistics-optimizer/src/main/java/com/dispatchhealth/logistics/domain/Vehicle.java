package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.*company-data-covered*.logistics.solver.DefaultProfitComponents;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.collect.ImmutableSet;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.PiggybackShadowVariable;

@JsonIgnoreProperties({"nextCustomer"})
@PlanningEntity
public class Vehicle implements Standstill {

  protected static final long MS_PER_MINUTE = Duration.ofMinutes(1).toMillis();
  protected static final long MS_PER_HOUR = Duration.ofHours(1).toMillis();
  protected static final long MINUTES_PER_HOUR = Duration.ofHours(1).toMinutes();
  protected static final ImmutableSet<Attribute> NO_ATTRIBUTES = ImmutableSet.of();

  @PlanningId private long id;
  private Depot depot;

  private ImmutableSet<Attribute> attributes;

  // A hack to have a shadow variable on the class so Optaplanner doesn't yell, because:
  // 1. Needs to be a PlanningEntity
  // 2. Can't have a genuine PlanningVariable
  // 3. All PlanningEntities need either a PlanningVariable or ShadowVariable.
  //
  // Can remove if we come up with another shadow variable to keep on here that's actually useful.
  private long hackShadowVar = 0;

  // Shadow variable
  private Customer nextCustomer;

  private long earliestPossibleDepotDepartureMs;

  private int numProviderDHMT;
  private int numProviderAPP;

  private long appHourlyCostUSDCents;
  private long dhmtHourlyCostUSDCents;

  private Long capacityMs;

  public Vehicle() {}

  public Vehicle(long id, Depot depot, DefaultProfitComponents defaults) {
    this.id = id;
    this.depot = depot;
    this.attributes = NO_ATTRIBUTES;
    this.setAPPHourlyCostUSDCents(defaults.appHourlyCostUSDCents());
    this.setDHMTHourlyCostUSDCents(defaults.dhmtHourlyCostUSDCents());
  }

  public Long getDepotArrivalTimestampMs() {
    Customer customer = getNextCustomer();
    Depot depot = getDepot();
    // TODO: if we add a starting depot stop, this will need to change.
    boolean hasNoCustomerVisit =
        (customer == null)
            || (customer instanceof DepotStop && ((DepotStop) customer).getIsFinalStop());

    if (hasNoCustomerVisit) {
      return depot.getDueTimestampMs();
    }

    while ((customer != null) && !(customer instanceof DepotStop)) {
      customer = customer.getNextCustomer();
    }

    if (customer instanceof DepotStop && ((DepotStop) customer).getIsFinalStop()) {
      if (customer.getArrivalTimestampMs() == null) {
        return null;
      }
      // for trivial routes with only the current position and final depot stop;
      // we need to floor the arrival timestamp to the ready timestamp -- otherwise
      // when the current depot position is in the past, we would say the vehicle could arrive then.
      return Math.max(depot.getReadyTimestampMs(), customer.getArrivalTimestampMs());
    }

    return null;
  }

  public long getId() {
    return id;
  }

  public void setId(long id) {
    this.id = id;
  }

  public Depot getDepot() {
    return depot;
  }

  public void setDepot(Depot depot) {
    this.depot = depot;
  }

  @PiggybackShadowVariable(
      shadowEntityClass = Customer.class,
      shadowVariableName = "arrivalTimestampMs")
  public Long getHackShadowVar() {
    return this.hackShadowVar;
  }

  @Override
  public Customer getNextCustomer() {
    return nextCustomer;
  }

  @Override
  public void setNextCustomer(Customer nextCustomer) {
    this.nextCustomer = nextCustomer;
  }

  @Override
  public Location getLocation() {
    return depot.getLocation();
  }

  public Long getCapacityMs() {
    return capacityMs;
  }

  public void setCapacityMs(Long capacityMs) {
    this.capacityMs = capacityMs;
  }

  public int getNumProviderDHMT() {
    return numProviderDHMT;
  }

  public void setNumProviderDHMT(int numProviderDHMT) {
    this.numProviderDHMT = numProviderDHMT;
  }

  public int getNumProviderAPP() {
    return numProviderAPP;
  }

  public void setNumProviderAPP(int numProviderAPP) {
    this.numProviderAPP = numProviderAPP;
  }

  public ImmutableSet<Attribute> getAttributes() {
    return attributes;
  }

  public void setAttributes(ImmutableSet<Attribute> attributes) {
    this.attributes = attributes;
  }

  public void setAPPHourlyCostUSDCents(long appHourlyCostUSDCents) {
    this.appHourlyCostUSDCents = appHourlyCostUSDCents;
  }

  public long getAPPHourlyCostUSDCents() {
    return appHourlyCostUSDCents;
  }

  public void setDHMTHourlyCostUSDCents(long dhmtHourlyCostUSDCents) {
    this.dhmtHourlyCostUSDCents = dhmtHourlyCostUSDCents;
  }

  public long getDHMTHourlyCostUSDCents() {
    return dhmtHourlyCostUSDCents;
  }

  public boolean isSinkVehicle() {
    return false;
  }

  // ************************************************************************
  // Complex methods
  // ************************************************************************

  /**
   * @return The total capacity occupied for the shift team, I.e., sum of all drive times + sum of
   *     all service durations
   */
  public long getOccupiedCapacityMs() {
    Customer customer = getNextCustomer();
    while ((customer != null) && !(customer instanceof DepotStop)) {
      customer = customer.getNextCustomer();
    }

    if (customer != null
        && customer instanceof DepotStop
        && ((DepotStop) customer).getIsFinalStop()) {
      if (customer.getCapacityOffsetMs() == null) {
        return 0;
      }
      return customer.getCapacityOffsetMs();
    }

    return 0;
  }

  /**
   * @return route of the vehicle
   */
  public List<Location> getRoute() {
    if (getNextCustomer() == null) {
      return Collections.emptyList();
    }

    List<Location> route = new ArrayList<>();

    // TODO: remove this when we incorporate the starting depot stop as a "customer".
    route.add(depot.getLocation());

    // add list of customer location
    Customer customer = getNextCustomer();
    while (customer != null) {
      route.add(customer.getLocation());
      customer = customer.getNextCustomer();
    }

    return route;
  }

  /**
   * TODO: Rename to getRouteStops.
   *
   * @return route of the vehicle
   */
  public List<Customer> getRouteCustomers() {
    if (getNextCustomer() == null) {
      return Collections.emptyList();
    }

    List<Customer> customers = new ArrayList<>();

    // add list of customer location
    Customer customer = getNextCustomer();
    while (customer != null) {
      customers.add(customer);
      customer = customer.getNextCustomer();
    }

    return customers;
  }

  public Distance getTotalDistance() {
    Distance totalDistance = Distance.ZERO;
    Customer customer = getNextCustomer();
    Customer lastCustomer = null;
    while (customer != null) {
      totalDistance = totalDistance.add(customer.getDistanceFromPreviousStandstill());
      lastCustomer = customer;
      customer = customer.getNextCustomer();
    }

    if (lastCustomer != null) {
      totalDistance = totalDistance.add(lastCustomer.getDistanceToDepot());
    }
    return totalDistance;
  }

  public Long getDepotDepartureTimestampMs() {
    return Math.max(getDepot().getReadyTimestampMs(), earliestPossibleDepotDepartureMs);
  }

  public long getEarliestPossibleDepotDepartureMs() {
    return earliestPossibleDepotDepartureMs;
  }

  public void setEarliestPossibleDepotDepartureMs(long earliestPossibleDepotDepartureMs) {
    this.earliestPossibleDepotDepartureMs = earliestPossibleDepotDepartureMs;
  }

  // Total duration from leaving depot to coming back.
  public long getTotalWorkDurationMs() {
    // TODO: Consider making this a shadow variable calculation so that the
    // constraints that use it don't have to select on customers?
    Long depotDepartureTimestampMs = getDepotDepartureTimestampMs();
    Long depotArrivalTimestampMs = getDepotArrivalTimestampMs();

    if (depotDepartureTimestampMs == null || depotArrivalTimestampMs == null) {
      return 0;
    }

    return depotArrivalTimestampMs - depotDepartureTimestampMs;
  }

  public long getOvertimeMs() {
    long shiftEndTimeMs = depot.getDueTimestampMs();
    Long depotArrivalTimestampMs = getDepotArrivalTimestampMs();
    if (depotArrivalTimestampMs == null) {
      return 0L;
    }
    if (depotArrivalTimestampMs <= shiftEndTimeMs) {
      return 0L;
    }
    long overtimeMs = depotArrivalTimestampMs - shiftEndTimeMs;
    return overtimeMs;
  }

  public long getScheduledDurationMs() {
    long durationMs = depot.getDueTimestampMs() - depot.getReadyTimestampMs();
    return durationMs;
  }

  public long perHourProviderCostUSDCents() {
    long appPerHourCostUSDCents = numProviderAPP * appHourlyCostUSDCents;
    long dhmtPerHourCostUSDCents = numProviderDHMT * dhmtHourlyCostUSDCents;
    return appPerHourCostUSDCents + dhmtPerHourCostUSDCents;
  }

  public boolean isDepotArrivalAfterDueTime(long toleratedLatenessMs) {
    Long depotArrivalTimestampMs = getDepotArrivalTimestampMs();
    if (depotArrivalTimestampMs == null) {
      return false;
    }
    return depotArrivalTimestampMs > (depot.getDueTimestampMs() + toleratedLatenessMs);
  }

  public long getDepotLatenessAfterDueTimeWithOffsetMs(long offsetPriorToDueTimestampMs) {
    Long depotArrivalTimestampMs = getDepotArrivalTimestampMs();
    Long depotDueTimestampMs = depot.getDueTimestampMs();
    return Math.max(
        0, (depotArrivalTimestampMs - depotDueTimestampMs) + offsetPriorToDueTimestampMs);
  }

  // TODO: Add more more fields for testing as needed.
  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Vehicle vehicle = (Vehicle) o;
    return id == vehicle.id && depot.equals(vehicle.depot);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, depot);
  }

  @Override
  public String toString() {
    return "Vehicle{"
        + "id="
        + id
        + ",  earliestPossibleDepotDepartureMs="
        + earliestPossibleDepotDepartureMs
        + '}';
  }

  @Override
  public Distance getDistanceTo(Location location) {
    return getLocation().getDistanceTo(location);
  }
}
