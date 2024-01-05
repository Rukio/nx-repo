package com.*company-data-covered*.logistics.solver;

import com.*company-data-covered*.logistics.domain.Customer;
import com.*company-data-covered*.logistics.domain.Location;
import com.*company-data-covered*.logistics.domain.Standstill;
import com.*company-data-covered*.logistics.domain.Vehicle;
import com.*company-data-covered*.logistics.domain.VehicleRoutingSolution;
import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.google.common.collect.Lists;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.optaplanner.core.api.domain.variable.VariableListener;
import org.optaplanner.core.api.score.director.ScoreDirector;

public class ArrivalTimeUpdatingVariableListener
    implements VariableListener<VehicleRoutingSolution, Customer> {

  public ArrivalTimeUpdatingVariableListener() {}

  @Override
  public void beforeEntityAdded(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer customer) {
    // Do nothing
  }

  @Override
  public void afterEntityAdded(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer customer) {
    updateArrivalTime(scoreDirector, customer);
  }

  @Override
  public void beforeVariableChanged(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer customer) {}

  @Override
  public void afterVariableChanged(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer customer) {
    updateArrivalTime(scoreDirector, customer);
  }

  @Override
  public void beforeEntityRemoved(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer customer) {
    // Do nothing
  }

  @Override
  public void afterEntityRemoved(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer customer) {
    // Do nothing
  }

  public void updateArrivalTime(
      ScoreDirector<VehicleRoutingSolution> scoreDirector, Customer sourceCustomer) {
    if (sourceCustomer.isAssignedToSinkVehicle()) {
      // no-op; no need to do book keeping on sink vehicle
      return;
    }

    Standstill previousStandstill = sourceCustomer.getPreviousStandstill();
    GroupSet groupSet = new GroupSet();
    if (previousStandstill != null) {
      if (previousStandstill instanceof Customer previousCustomer) {
        groupSet = GroupSet.fromSourceCustomer(previousCustomer);
      } else {
        groupSet = GroupSet.fromVehicle((Vehicle) previousStandstill);
      }
    }

    Customer shadowCustomer = sourceCustomer;
    Long arrivalTimestampMs = groupSet.calculateArrivalToCustomerTimestampMs(shadowCustomer);
    Long capacityOffsetMs = groupSet.calculateCapacityOffsetMs(shadowCustomer);

    while (shadowCustomer != null) {
      scoreDirector.beforeVariableChanged(shadowCustomer, "arrivalTimestampMs");
      shadowCustomer.setArrivalTimestampMs(arrivalTimestampMs);
      shadowCustomer.setCapacityOffsetMs(capacityOffsetMs);
      scoreDirector.afterVariableChanged(shadowCustomer, "arrivalTimestampMs");

      groupSet = groupSet.includeOrLink(shadowCustomer);
      shadowCustomer = shadowCustomer.getNextCustomer();
      arrivalTimestampMs = groupSet.calculateArrivalToCustomerTimestampMs(shadowCustomer);
      capacityOffsetMs = groupSet.calculateCapacityOffsetMs(shadowCustomer);
    }
  }

  private static class GroupSet {
    // Union type of List<Customer> or Vehicle
    private List<Customer> customers = new ArrayList<>();
    private Vehicle vehicle;

    private Object key;
    private GroupSet previousSet;

    private GroupSet() {
      key = Customer.NO_OVERLAP;
    }

    public enum CalculationType {
      ARRIVAL(
          Customer::getDepartureTimestampMs,
          GroupSet::vehicleArrivalAtCustomerWitReadyPaddingTimestampMs),
      CAPACITY(
          Customer::getCapacityOffsetAtDepartureMs, GroupSet::vehicleToCustomerDrivingDurationMs);

      public final Function<Customer, Long> departureTimestampMsProvider;
      public final BiFunction<Vehicle, Customer, Long> vehicleArrivalTimestampMsProvider;

      private CalculationType(
          Function<Customer, Long> departureTimestampMsProvider,
          BiFunction<Vehicle, Customer, Long> vehicleArrivalTimestampMsProvider) {
        this.departureTimestampMsProvider = departureTimestampMsProvider;
        this.vehicleArrivalTimestampMsProvider = vehicleArrivalTimestampMsProvider;
      }
    }

    public static GroupSet fromSourceCustomer(Customer customer) {
      GroupSet overlapCustomers = fromCustomer(customer);

      Object nextKey = Customer.NO_OVERLAP;
      if (customer.getNextCustomer() != null) {
        nextKey = customer.getOverlapSetKey();
      }

      Object key = customer.getOverlapSetKey();
      Standstill standstill = overlapCustomers.customers.get(0).getPreviousStandstill();
      boolean needPreviousGroup = key.equals(nextKey);
      if (standstill != null && needPreviousGroup) {
        if (standstill instanceof Vehicle vehicle) {
          overlapCustomers.previousSet = fromVehicle(vehicle);
        } else if (standstill instanceof Customer previousCustomer) {
          overlapCustomers.previousSet = fromCustomer(previousCustomer);
        } else {
          throw new IllegalStateException(
              "Standstill is not an instance of Vehicle or Customer classes");
        }
      }

      return overlapCustomers;
    }

    private static GroupSet fromCustomer(Customer customer) {
      List<Customer> reversedCustomers = new ArrayList<>();
      reversedCustomers.add(customer);
      Object key = customer.getOverlapSetKey();
      Standstill standstill = customer.getPreviousStandstill();
      while (standstill instanceof Customer previousCustomer
          && key.equals(previousCustomer.getOverlapSetKey())) {
        reversedCustomers.add(previousCustomer);
        standstill = previousCustomer.getPreviousStandstill();
      }

      GroupSet overlapCustomers = new GroupSet();
      overlapCustomers.customers = Lists.reverse(reversedCustomers);
      overlapCustomers.key = key;
      return overlapCustomers;
    }

    public static GroupSet fromVehicle(Vehicle vehicle) {
      GroupSet overlapSet = new GroupSet();
      overlapSet.vehicle = vehicle;
      return overlapSet;
    }

    public GroupSet includeOrLink(Customer customer) {
      if (key.equals(customer.getOverlapSetKey())) {
        this.customers.add(customer);
        return this;
      }

      GroupSet overlapSet = new GroupSet();
      overlapSet.customers.add(customer);
      overlapSet.key = customer.getOverlapSetKey();
      overlapSet.previousSet = this;
      return overlapSet;
    }

    public Long calculateArrivalToCustomerTimestampMs(Customer customer) {
      return calculateCustomerArrivalTimestampOrCapacityOffsetMs(customer, CalculationType.ARRIVAL);
    }

    public Long calculateCapacityOffsetMs(Customer customer) {
      return calculateCustomerArrivalTimestampOrCapacityOffsetMs(
          customer, CalculationType.CAPACITY);
    }

    private Long calculateCustomerArrivalTimestampOrCapacityOffsetMs(
        Customer customer, CalculationType calculationType) {
      if (customer == null) {
        return null;
      }

      if (calculationType == CalculationType.ARRIVAL
          && customer.getActualArrivalTimestampMs() != null) {
        return customer.getActualArrivalTimestampMs();
      }

      if (vehicle != null) {
        return calculationType.vehicleArrivalTimestampMsProvider.apply(vehicle, customer);
      }

      if (key.equals(customer.getOverlapSetKey())) {
        return previousSet.calculateCustomerArrivalTimestampOrCapacityOffsetMs(
            customer, calculationType);
      }

      List<Departure> departures =
          getDepartures(customer.getLocation(), calculationType.departureTimestampMsProvider);
      if (departures.isEmpty()) {
        return null;
      }

      return Collections.max(
          departures.stream()
              .map(
                  departure ->
                      departure.timestampMs
                          + departure.distance.getDurationMs()
                          + customer.getExtraSetupDurationMs())
              .toList());
    }

    public static long vehicleToCustomerDrivingDurationMs(Vehicle vehicle, Customer customer) {
      return vehicle.getDistanceTo(customer.getLocation()).getDurationMs();
    }

    public static long vehicleArrivalAtCustomerWitReadyPaddingTimestampMs(
        Vehicle vehicle, Customer customer) {
      return Math.max(
          customer.getReadyTimestampMs(),
          vehicle.getDepotDepartureTimestampMs()
              + vehicleToCustomerDrivingDurationMs(vehicle, customer));
    }

    public List<Departure> getDepartures(
        Location location, Function<Customer, Long> departureTimestampMsProvider) {
      return customers.stream()
          .filter(customer -> departureTimestampMsProvider.apply(customer) != null)
          .map(
              customer ->
                  new Departure(
                      customer.getDistanceTo(location),
                      departureTimestampMsProvider.apply(customer)))
          .toList();
    }
  }

  private record Departure(Distance distance, Long timestampMs) {}
}
