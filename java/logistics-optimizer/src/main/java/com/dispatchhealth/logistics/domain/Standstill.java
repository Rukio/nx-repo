package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.variable.InverseRelationShadowVariable;

@PlanningEntity
public interface Standstill {

  /**
   * @return never null
   */
  Location getLocation();

  /**
   * @return sometimes null
   */
  @InverseRelationShadowVariable(sourceVariableName = "previousStandstill")
  Customer getNextCustomer();

  void setNextCustomer(Customer nextCustomer);

  Distance getDistanceTo(Location location);
}
