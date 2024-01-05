package com.*company-data-covered*.logistics;

import static org.assertj.core.api.Assertions.assertThat;

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
import com.google.common.collect.ImmutableList;
import org.junit.jupiter.api.Test;

class AssignabilityCheckerTest {

  VRPAttribute req1 = VRPAttribute.newBuilder().setId("req1").build();
  VRPAttribute req2 = VRPAttribute.newBuilder().setId("req2").build();
  ImmutableList<VRPAttribute> allReqs = ImmutableList.of(req1, req2);
  VRPAttribute pref1 = VRPAttribute.newBuilder().setId("pref1").build();
  VRPAttribute pref2 = VRPAttribute.newBuilder().setId("pref2").build();
  ImmutableList<VRPAttribute> allPrefs = ImmutableList.of(pref1, pref2);
  VRPAttribute bad1 = VRPAttribute.newBuilder().setId("bad1").build();
  VRPAttribute bad2 = VRPAttribute.newBuilder().setId("bad2").build();
  ImmutableList<VRPAttribute> allBads = ImmutableList.of(bad1, bad2);
  VRPAttribute unwanted1 = VRPAttribute.newBuilder().setId("unwanted1").build();
  VRPAttribute unwanted2 = VRPAttribute.newBuilder().setId("unwanted2").build();
  ImmutableList<VRPAttribute> allUnwanteds = ImmutableList.of(unwanted1, unwanted2);

  VRPTimeWindow tw =
      VRPTimeWindow.newBuilder().setStartTimestampSec(123).setEndTimestampSec(456).build();
  VRPTimeWindow earlyTW =
      VRPTimeWindow.newBuilder().setStartTimestampSec(0).setEndTimestampSec(100).build();

  AssignableVisit visit =
      AssignableVisit.newBuilder()
          .addAllRequiredAttributes(allReqs)
          .addAllPreferredAttributes(allPrefs)
          .addAllForbiddenAttributes(allBads)
          .addAllUnwantedAttributes(allUnwanteds)
          .setArrivalTimeWindow(tw)
          .build();

  AssignabilityChecker checker = new AssignabilityChecker(visit);

  @Test
  void checkShiftTeam_allReqPrefIsAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_ASSIGNABLE)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_partialMissingReqPrefIsNotAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAttributes(req1)
            .addAllAttributes(allPrefs)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .addMissingRequiredAttributes(req2)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_wrongTimeWindowIsNotAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .setAvailableTimeWindow(earlyTW)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_NO_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_allReqPrefForbiddenIsNotAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .addAllAttributes(allBads)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .addAllIncludedForbiddenAttributes(allBads)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_missingReqNotAssignable() {
    AssignableShiftTeam shiftTeam = AssignableShiftTeam.getDefaultInstance();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .addAllMissingRequiredAttributes(allReqs)
                .addAllMissingPreferredAttributes(allPrefs)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_NO_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_missingPrefOverrideable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_OVERRIDE_ASSIGNABLE)
                .addAllMissingPreferredAttributes(allPrefs)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_partialMissingPrefOverrideable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAttributes(pref1)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_OVERRIDE_ASSIGNABLE)
                .addMissingPreferredAttributes(pref2)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_forbiddenNotAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .addAllAttributes(allBads)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .addAllIncludedForbiddenAttributes(allBads)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_partialForbiddenNotAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .addAttributes(bad1)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .addIncludedForbiddenAttributes(bad1)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_unwantedOverrideable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .addAllAttributes(allUnwanteds)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_OVERRIDE_ASSIGNABLE)
                .addAllIncludedUnwantedAttributes(allUnwanteds)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_partialUnwantedPrefOverrideable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .addAttributes(unwanted1)
            .setAvailableTimeWindow(tw)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_OVERRIDE_ASSIGNABLE)
                .addIncludedUnwantedAttributes(unwanted1)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void checkShiftTeam_everythingWrong() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allBads)
            .addAllAttributes(allUnwanteds)
            .setAvailableTimeWindow(earlyTW)
            .build();
    assertThat(checker.checkShiftTeam(shiftTeam))
        .isEqualTo(
            AssignableShiftTeamResult.newBuilder()
                .setShiftTeam(shiftTeam)
                .setStatus(Status.STATUS_NOT_ASSIGNABLE)
                .addAllMissingRequiredAttributes(allReqs)
                .addAllMissingPreferredAttributes(allPrefs)
                .addAllIncludedForbiddenAttributes(allBads)
                .addAllIncludedUnwantedAttributes(allUnwanteds)
                .setTimeWindowStatus(TimeWindowStatus.TIME_WINDOW_STATUS_NO_OVERLAP)
                .build());
  }

  @Test
  void timeWindowsOverlap() {
    VRPTimeWindow t12 =
        VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(2).build();
    VRPTimeWindow t13 =
        VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(3).build();
    VRPTimeWindow t23 =
        VRPTimeWindow.newBuilder().setStartTimestampSec(2).setEndTimestampSec(3).build();
    VRPTimeWindow t24 =
        VRPTimeWindow.newBuilder().setStartTimestampSec(2).setEndTimestampSec(3).build();
    VRPTimeWindow t34 =
        VRPTimeWindow.newBuilder().setStartTimestampSec(3).setEndTimestampSec(4).build();
    VRPTimeWindow t14 =
        VRPTimeWindow.newBuilder().setStartTimestampSec(1).setEndTimestampSec(4).build();

    VRPTimeWindow all =
        VRPTimeWindow.newBuilder().setStartTimestampSec(0).setEndTimestampSec(1000).build();

    // No overlap
    assertThat(AssignabilityChecker.timeWindowsOverlap(t12, t34)).isFalse();
    assertThat(AssignabilityChecker.timeWindowsOverlap(t34, t12)).isFalse();

    // Just touching
    assertThat(AssignabilityChecker.timeWindowsOverlap(t12, t23)).isFalse();
    assertThat(AssignabilityChecker.timeWindowsOverlap(t23, t12)).isFalse();

    // Partial Overlap
    assertThat(AssignabilityChecker.timeWindowsOverlap(t13, t24)).isTrue();
    assertThat(AssignabilityChecker.timeWindowsOverlap(t24, t13)).isTrue();

    // Subset
    assertThat(AssignabilityChecker.timeWindowsOverlap(t14, t23)).isTrue();
    assertThat(AssignabilityChecker.timeWindowsOverlap(t23, t14)).isTrue();
  }

  @Test
  void getStatus_hasMissingRequired() {
    boolean hasMissingRequired = true;
    assertThat(AssignabilityChecker.getStatus(hasMissingRequired, false, false, false, true))
        .isEqualTo(Status.STATUS_NOT_ASSIGNABLE);

    hasMissingRequired = false;
    assertThat(AssignabilityChecker.getStatus(hasMissingRequired, false, false, false, true))
        .isEqualTo(Status.STATUS_ASSIGNABLE);
  }

  @Test
  void getStatus_hasForbidden() {
    boolean hasForbidden = true;
    assertThat(AssignabilityChecker.getStatus(false, false, hasForbidden, false, true))
        .isEqualTo(Status.STATUS_NOT_ASSIGNABLE);

    hasForbidden = false;
    assertThat(AssignabilityChecker.getStatus(false, false, hasForbidden, false, true))
        .isEqualTo(Status.STATUS_ASSIGNABLE);
  }

  @Test
  void getStatus_hasMissingPreferred() {
    boolean hasMissingPreferred = true;
    assertThat(AssignabilityChecker.getStatus(false, hasMissingPreferred, false, false, true))
        .isEqualTo(Status.STATUS_OVERRIDE_ASSIGNABLE);

    hasMissingPreferred = false;
    assertThat(AssignabilityChecker.getStatus(false, hasMissingPreferred, false, false, true))
        .isEqualTo(Status.STATUS_ASSIGNABLE);
  }

  @Test
  void getStatus_hasUnwanted() {
    boolean hasUnwanted = true;
    assertThat(AssignabilityChecker.getStatus(false, false, false, hasUnwanted, true))
        .isEqualTo(Status.STATUS_OVERRIDE_ASSIGNABLE);

    hasUnwanted = false;
    assertThat(AssignabilityChecker.getStatus(false, false, false, hasUnwanted, true))
        .isEqualTo(Status.STATUS_ASSIGNABLE);
  }

  @Test
  void getStatus_hasTimeOverlap() {
    boolean hasTimeOverlap = true;
    assertThat(AssignabilityChecker.getStatus(false, false, false, false, hasTimeOverlap))
        .isEqualTo(Status.STATUS_ASSIGNABLE);

    hasTimeOverlap = false;
    assertThat(AssignabilityChecker.getStatus(false, false, false, false, hasTimeOverlap))
        .isEqualTo(Status.STATUS_NOT_ASSIGNABLE);
  }

  @Test
  void visitResultFromAssignableShiftTeamResult_fromAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAllAttributes(allReqs)
            .addAllAttributes(allPrefs)
            .setAvailableTimeWindow(tw)
            .build();

    AssignableShiftTeamResult shiftTeamResult = checker.checkShiftTeam(shiftTeam);
    assertThat(checker.visitResultFromShiftTeamResult(shiftTeamResult, visit))
        .isEqualTo(
            AssignableVisitResult.newBuilder()
                .setVisit(visit)
                .setStatus(AssignableStatus.ASSIGNABLE_STATUS_ASSIGNABLE)
                .setTimeWindowStatus(
                    AssignableTimeWindowStatus.ASSIGNABLE_TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }

  @Test
  void visitResultFromAssignableShiftTeamResult_fromNotAssignable() {
    AssignableShiftTeam shiftTeam =
        AssignableShiftTeam.newBuilder()
            .addAttributes(req1)
            .addAllAttributes(allPrefs)
            .setAvailableTimeWindow(tw)
            .build();

    AssignableShiftTeamResult shiftTeamResult = checker.checkShiftTeam(shiftTeam);
    assertThat(checker.visitResultFromShiftTeamResult(shiftTeamResult, visit))
        .isEqualTo(
            AssignableVisitResult.newBuilder()
                .setVisit(visit)
                .setStatus(AssignableStatus.ASSIGNABLE_STATUS_NOT_ASSIGNABLE)
                .addMissingRequiredAttributes(req2)
                .setTimeWindowStatus(
                    AssignableTimeWindowStatus.ASSIGNABLE_TIME_WINDOW_STATUS_OVERLAP)
                .build());
  }
}
