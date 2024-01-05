package com.*company-data-covered*.logistics.domain;

import com.*company-data-covered*.optimizer.VRPAttribute;
import java.util.Objects;

public class Attribute {

  private final String id;

  private Attribute(String id) {
    this.id = id;
  }

  // TODO: Add interning of attributes.
  public static Attribute of(String id) {
    return new Attribute(id);
  }

  public static Attribute of(VRPAttribute vrpAttribute) {
    return of(vrpAttribute.getId());
  }

  public String getId() {
    return id;
  }

  public VRPAttribute toVRPAttribute() {
    return VRPAttribute.newBuilder().setId(id).build();
  }

  @Override
  public String toString() {
    return "Attribute{" + "id='" + id + '\'' + '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Attribute attribute = (Attribute) o;
    return Objects.equals(id, attribute.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
