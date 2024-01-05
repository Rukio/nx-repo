package com.*company-data-covered*.logistics;

import com.*company-data-covered*.logistics.domain.Attribute;
import com.*company-data-covered*.optimizer.AssignableShiftTeam;
import com.*company-data-covered*.optimizer.AssignableShiftTeamResult;
import com.*company-data-covered*.optimizer.AssignableShiftTeamResult.Status;
import com.*company-data-covered*.optimizer.AssignableShiftTeamResult.TimeWindowStatus;
import com.*company-data-covered*.optimizer.AssignableStatus;
import com.*company-data-covered*.optimizer.AssignableTimeWindowStatus;
import com.*company-data-covered*.optimizer.AssignableVisit;
import com.*company-data-covered*.optimizer.AssignableVisitResult;
import com.*company-data-covered*.optimizer.VRPAttribute;
import com.*company-data-covered*.optimizer.VRPTimeWindow;
import com.*company-data-covered*.optimizer.VRPVisit;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Sets;
import com.google.common.collect.Sets.SetView;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

public class AssignabilityChecker {

  private ImmutableSet<Attribute> requiredAttributes;
  private ImmutableSet<Attribute> preferredAttributes;
  private ImmutableSet<Attribute> forbiddenAttributes;
  private ImmutableSet<Attribute> unwantedAttributes;
  private final VRPTimeWindow arrivalTimeWindow;

  private final List<VRPAttribute> orderedRequiredAttributes;
  private final List<VRPAttribute> orderedPreferredAttributes;
  private final List<VRPAttribute> orderedForbiddenAttributes;
  private final List<VRPAttribute> orderedUnwantedAttributes;

  private static final AttrComparator COMPARATOR = new AttrComparator();

  public static final AssignabilityChecker EMPTY_ASSIGNABILITY_CHECKER =
      new AssignabilityChecker(ImmutableList.of(), ImmutableList.of());

  public AssignabilityChecker(AssignableVisit visit) {
    orderedRequiredAttributes = visit.getRequiredAttributesList();
    orderedPreferredAttributes = visit.getPreferredAttributesList();
    orderedForbiddenAttributes = visit.getForbiddenAttributesList();
    orderedUnwantedAttributes = visit.getUnwantedAttributesList();
    arrivalTimeWindow = visit.getArrivalTimeWindow();

    this.computeSets();
  }

  public AssignabilityChecker(VRPVisit visit) {
    orderedRequiredAttributes = visit.getRequiredAttributesList();
    orderedPreferredAttributes = List.of();
    orderedForbiddenAttributes = visit.getForbiddenAttributesList();
    orderedUnwantedAttributes = List.of();
    arrivalTimeWindow = visit.getArrivalTimeWindow();

    this.computeSets();
  }

  // Convenience for testing.
  public AssignabilityChecker(
      ImmutableList<Attribute> requiredAttributes, ImmutableList<Attribute> forbiddenAttributes) {
    orderedRequiredAttributes = requiredAttributes.stream().map(Attribute::toVRPAttribute).toList();
    orderedPreferredAttributes = List.of();
    orderedForbiddenAttributes =
        forbiddenAttributes.stream().map(Attribute::toVRPAttribute).toList();
    orderedUnwantedAttributes = List.of();
    arrivalTimeWindow = VRPTimeWindow.getDefaultInstance();

    this.computeSets();
  }

  private void computeSets() {
    requiredAttributes = toAttributeSet(orderedRequiredAttributes);
    preferredAttributes = toAttributeSet(orderedPreferredAttributes);
    forbiddenAttributes = toAttributeSet(orderedForbiddenAttributes);
    unwantedAttributes = toAttributeSet(orderedUnwantedAttributes);
  }

  public record checkAttributesResult(
      Set<Attribute> missingRequired,
      Set<Attribute> missingPreferred,
      Set<Attribute> includedForbidden,
      Set<Attribute> includedUnwanted) {
    public long problemCount() {
      return missingRequired.size()
          + missingPreferred.size()
          + includedForbidden.size()
          + includedUnwanted.size();
    }
  }

  public AssignableShiftTeamResult checkShiftTeam(AssignableShiftTeam shiftTeam) {
    ImmutableSet<Attribute> attributes = toAttributeSet(shiftTeam.getAttributesList());

    checkAttributesResult result = checkShiftTeamAttributes(attributes);

    VRPTimeWindow availableTimeWindow = shiftTeam.getAvailableTimeWindow();

    boolean hasTimeOverlap = timeWindowsOverlap(arrivalTimeWindow, availableTimeWindow);
    boolean hasMissingRequired = !result.missingRequired.isEmpty();
    boolean hasMissingPreferred = !result.missingPreferred.isEmpty();
    boolean hasForbidden = !result.includedForbidden.isEmpty();
    boolean hasUnwanted = !result.includedUnwanted.isEmpty();

    Status status =
        getStatus(
            hasMissingRequired, hasMissingPreferred, hasForbidden, hasUnwanted, hasTimeOverlap);

    TimeWindowStatus timeWindowStatus =
        hasTimeOverlap
            ? TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP
            : TimeWindowStatus.TIME_WINDOW_STATUS_NO_OVERLAP;

    return AssignableShiftTeamResult.newBuilder()
        .setShiftTeam(shiftTeam)
        .setStatus(status)
        .addAllMissingRequiredAttributes(toSortedVRPAttributeList(result.missingRequired))
        .addAllMissingPreferredAttributes(toSortedVRPAttributeList(result.missingPreferred))
        .addAllIncludedForbiddenAttributes(toSortedVRPAttributeList(result.includedForbidden))
        .addAllIncludedUnwantedAttributes(toSortedVRPAttributeList(result.includedUnwanted))
        .setTimeWindowStatus(timeWindowStatus)
        .build();
  }

  public AssignableVisitResult visitResultFromShiftTeamResult(
      AssignableShiftTeamResult shiftTeam, AssignableVisit visit) {
    return AssignableVisitResult.newBuilder()
        .setVisit(visit)
        .setStatus(toAssignableStatus(shiftTeam.getStatus()))
        .addAllMissingRequiredAttributes(shiftTeam.getMissingRequiredAttributesList())
        .addAllMissingPreferredAttributes(shiftTeam.getMissingPreferredAttributesList())
        .addAllIncludedForbiddenAttributes(shiftTeam.getIncludedForbiddenAttributesList())
        .addAllIncludedUnwantedAttributes(shiftTeam.getIncludedUnwantedAttributesList())
        .setTimeWindowStatus(toAssignableTimeWindowStatus(shiftTeam.getTimeWindowStatus()))
        .build();
  }

  public checkAttributesResult checkShiftTeamAttributes(ImmutableSet<Attribute> attributes) {
    SetView<Attribute> missingRequired = Sets.difference(requiredAttributes, attributes);
    SetView<Attribute> missingPreferred = Sets.difference(preferredAttributes, attributes);
    SetView<Attribute> includedForbidden = Sets.intersection(forbiddenAttributes, attributes);
    SetView<Attribute> includedUnwanted = Sets.intersection(unwantedAttributes, attributes);

    return new checkAttributesResult(
        missingRequired, missingPreferred, includedForbidden, includedUnwanted);
  }

  public List<VRPAttribute> getOrderedRequiredAttributes() {
    return orderedRequiredAttributes;
  }

  public List<VRPAttribute> getOrderedPreferredAttributes() {
    return orderedPreferredAttributes;
  }

  public List<VRPAttribute> getOrderedForbiddenAttributes() {
    return orderedForbiddenAttributes;
  }

  public List<VRPAttribute> getOrderedUnwantedAttributes() {
    return orderedUnwantedAttributes;
  }

  protected static Status getStatus(
      boolean hasMissingRequired,
      boolean hasMissingPreferred,
      boolean hasForbidden,
      boolean hasUnwanted,
      boolean hasTimeOverlap) {
    if (hasMissingRequired || hasForbidden || !hasTimeOverlap) {
      return Status.STATUS_NOT_ASSIGNABLE;
    }

    if (hasMissingPreferred || hasUnwanted) {
      return Status.STATUS_OVERRIDE_ASSIGNABLE;
    }

    return Status.STATUS_ASSIGNABLE;
  }

  protected static AssignableStatus toAssignableStatus(Status status) {
    switch (status) {
      case STATUS_ASSIGNABLE:
        return AssignableStatus.ASSIGNABLE_STATUS_ASSIGNABLE;
      case STATUS_NOT_ASSIGNABLE:
        return AssignableStatus.ASSIGNABLE_STATUS_NOT_ASSIGNABLE;
      case STATUS_OVERRIDE_ASSIGNABLE:
        return AssignableStatus.ASSIGNABLE_STATUS_OVERRIDE_ASSIGNABLE;
      default:
        return AssignableStatus.ASSIGNABLE_STATUS_UNSPECIFIED;
    }
  }

  protected static AssignableTimeWindowStatus toAssignableTimeWindowStatus(
      TimeWindowStatus status) {
    if (status == TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP) {
      return AssignableTimeWindowStatus.ASSIGNABLE_TIME_WINDOW_STATUS_OVERLAP;
    }

    return AssignableTimeWindowStatus.ASSIGNABLE_TIME_WINDOW_STATUS_NO_OVERLAP;
  }

  protected static boolean timeWindowsOverlap(VRPTimeWindow tw1, VRPTimeWindow tw2) {
    // TODO: consider adding a 'minimal overlap' argument that says the time windows
    // have to have at least some number of seconds overlap.  Perhaps those really
    // tight timings could result in an STATUS_OVERRIDE_ASSIGNABLE?
    return (tw1.getStartTimestampSec() < tw2.getEndTimestampSec())
        && (tw1.getEndTimestampSec() > tw2.getStartTimestampSec());
  }

  private static ImmutableSet<Attribute> toAttributeSet(Collection<VRPAttribute> attributes) {
    return ImmutableSet.copyOf(attributes.stream().map(Attribute::of).iterator());
  }

  private static List<VRPAttribute> toSortedVRPAttributeList(Set<Attribute> attributes) {
    return attributes.stream().sorted(COMPARATOR).map(Attribute::toVRPAttribute).toList();
  }

  private static class AttrComparator implements Comparator<Attribute> {
    @Override
    public int compare(Attribute o1, Attribute o2) {
      return o1.getId().compareTo(o2.getId());
    }
  }
}
