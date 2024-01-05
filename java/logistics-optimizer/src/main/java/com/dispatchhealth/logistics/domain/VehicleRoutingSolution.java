package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.optimizer.VRPDescription;
import java.util.List;
import java.util.Objects;
import org.optaplanner.core.api.domain.constraintweight.ConstraintConfigurationProvider;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;

@PlanningSolution
public class VehicleRoutingSolution {

  private String name;

  @ProblemFactCollectionProperty private List<Location> locationList;

  @ConstraintConfigurationProvider
  private VehicleRoutingSolutionConstraintConfiguration constraintConfiguration =
      new VehicleRoutingSolutionConstraintConfiguration();

  // TODO: Add distance matrix as problem fact for updating real-time traffic when needed.

  @PlanningEntityCollectionProperty
  @ValueRangeProvider(id = "vehicleRange")
  private List<Vehicle> vehicleList;

  @PlanningEntityCollectionProperty
  @ValueRangeProvider(id = "routeStopRange")
  private List<Customer> routeStopList;

  // customer visits that are not other types of "stops".
  private List<Customer> customerVisitList;

  @PlanningScore(
      bendableHardLevelsSize = VehicleRoutingSolutionConstraintConfiguration.HARD_LEVELS_SIZE,
      bendableSoftLevelsSize = VehicleRoutingSolutionConstraintConfiguration.SOFT_LEVELS_SIZE)
  private BendableLongScore score;

  private List<RestBreak> restBreakList;

  private List<DepotStop> depotStopList;
  private VRPDescription originalDescription;

  public VehicleRoutingSolution() {}

  public VehicleRoutingSolutionConstraintConfiguration getConstraintConfiguration() {
    return constraintConfiguration;
  }

  public void setConstraintConfiguration(
      VehicleRoutingSolutionConstraintConfiguration constraintConfiguration) {
    this.constraintConfiguration = constraintConfiguration;
  }

  public boolean hasNoDemand() {
    return restBreakList.isEmpty() && customerVisitList.isEmpty();
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public List<Location> getLocationList() {
    return locationList;
  }

  public void setLocationList(List<Location> locationList) {
    this.locationList = locationList;
  }

  public List<Vehicle> getVehicleList() {
    return vehicleList;
  }

  public void setVehicleList(List<Vehicle> vehicleList) {
    this.vehicleList = vehicleList;
  }

  public List<Customer> getRouteStopList() {
    return routeStopList;
  }

  public void setRouteStopList(List<Customer> routeStopList) {
    this.routeStopList = routeStopList;
  }

  public List<Customer> getCustomerVisitList() {
    return customerVisitList;
  }

  public void setCustomerVisitList(List<Customer> customerVisitList) {
    this.customerVisitList = customerVisitList;
  }

  public BendableLongScore getScore() {
    return score;
  }

  public List<RestBreak> getRestBreakList() {
    return restBreakList;
  }

  public void setRestBreakList(List<RestBreak> restBreakList) {
    this.restBreakList = restBreakList;
  }

  public List<DepotStop> getDepotStopList() {
    return depotStopList;
  }

  public void setDepotStopList(List<DepotStop> depotStopList) {
    this.depotStopList = depotStopList;
  }

  public void setScore(BendableLongScore score) {
    this.score = score;
  }

  public void setOriginalDescription(VRPDescription originalDescription) {
    this.originalDescription = originalDescription;
  }

  public VRPDescription getOriginalDescription() {
    return originalDescription;
  }

  public int numPlanningVisits() {
    return numUnpinnedEntities(customerVisitList);
  }

  public int numPlanningRestBreaks() {
    return numUnpinnedEntities(List.copyOf(restBreakList));
  }

  private static int numUnpinnedEntities(List<Customer> entities) {
    return (int) entities.stream().filter(customer -> !customer.isPinned()).count();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    VehicleRoutingSolution that = (VehicleRoutingSolution) o;
    return Objects.equals(name, that.name)
        && Objects.equals(locationList, that.locationList)
        && Objects.equals(vehicleList, that.vehicleList)
        && Objects.equals(routeStopList, that.routeStopList)
        && Objects.equals(restBreakList, that.restBreakList)
        && Objects.equals(depotStopList, that.depotStopList)
        && Objects.equals(score, that.score);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, locationList, vehicleList, routeStopList, restBreakList, score);
  }

  @Override
  public String toString() {
    return "VehicleRoutingSolution{"
        + "name='"
        + name
        + '\''
        + ", locationList="
        + locationList
        + ", vehicleList="
        + vehicleList
        + ", routeStopList="
        + routeStopList
        + ", score="
        + score
        + '}';
  }
}
