package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.logistics.domain.geo.Distance;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;
import java.util.Objects;

@JsonFormat(shape = JsonFormat.Shape.ARRAY)
@JsonIgnoreProperties({"id"})
public class Location {
  public static final Location UNUSED_LOCATION =
      new Location(Long.MIN_VALUE, Double.MIN_VALUE, Double.MIN_VALUE);

  private final long id;
  private final double latitude;
  private final double longitude;
  private Map<Location, Distance> distanceMap;

  public Location(long id, double latitude, double longitude) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public long getId() {
    return id;
  }

  public double getLatitude() {
    return latitude;
  }

  public double getLongitude() {
    return longitude;
  }

  /**
   * Set the distance map. Distances are in meters.
   *
   * @param distanceMap a map containing distances from here to other locations
   */
  public void setDistanceMap(Map<Location, Distance> distanceMap) {
    this.distanceMap = distanceMap;
  }

  public Map<Location, Distance> getDistanceMap() {
    return distanceMap;
  }

  /**
   * Distance to the given location in meters.
   *
   * @param location other location
   * @return Distance
   */
  public Distance getDistanceTo(Location location) {
    if (this.equals(location)) {
      return Distance.ZERO;
    }

    Distance distance = distanceMap.get(location);
    if (distance == null) {
      throw new IllegalStateException(
          String.format("Missing distance for location %d -> %d", this.getId(), location.getId()));
    }
    return distance;
  }

  // ************************************************************************
  // Complex methods
  // ************************************************************************

  /**
   * The angle relative to the direction EAST.
   *
   * <p>TODO: Remove when not needed by DepotAngleCustomerDifficultyWeightFactory.
   *
   * @param location never null
   * @return in Cartesian coordinates
   */
  public double getAngle(Location location) {
    double latitudeDifference = location.latitude - latitude;
    double longitudeDifference = location.longitude - longitude;
    return Math.atan2(latitudeDifference, longitudeDifference);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Location location = (Location) o;
    return id == location.id
        && Double.compare(location.latitude, latitude) == 0
        && Double.compare(location.longitude, longitude) == 0;
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, latitude, longitude);
  }

  @Override
  public String toString() {
    return "Location{" + "id=" + id + ", latitude=" + latitude + ", longitude=" + longitude + '}';
  }
}
