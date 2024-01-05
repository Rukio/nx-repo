package com.*company-data-covered*.logistics.domain;

import com.google.common.collect.ImmutableSet;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.optaplanner.core.api.domain.constraintweight.ConstraintConfiguration;
import org.optaplanner.core.api.domain.constraintweight.ConstraintWeight;
import org.optaplanner.core.api.score.buildin.bendablelong.BendableLongScore;

@ConstraintConfiguration
public class VehicleRoutingSolutionConstraintConfiguration {
  protected static final long MS_PER_MINUTE = Duration.ofMinutes(1).toMillis();

  public static final String WORK_DISTRIBUTION_EXPONENTIAL_POLICY_VALUE_USD_MILLS =
      "work distribution exponential policy value";

  public static final String SOFT_LATE_ARRIVAL_PER_MINUTE_COST_USD_MILLS =
      "late arrival soft cost per minute";

  public static final String SOFT_LATE_URGENCY_ARRIVAL_PER_MINUTE_COST_USD_MILLS =
      "late urgency window arrival soft cost per minute";

  public static final String DRIVING_COST_USD_MILLS_PER_KILOMETER =
      "driving cost usd mills per kilometer";

  // depot late arrival
  public static final String SOFT_LATE_DEPOT_ARRIVAL_PER_MINUTE_COST_USD_MILLS =
      "late arrival to depot soft cost per minute";

  public static final int HARD_LEVELS_SIZE = 3;
  public static final int SOFT_LEVELS_SIZE = 1;

  private static final double E6 = 1e6;

  public static final BendableLongScore ONE_DEPOT_STOP_HARD =
      BendableLongScore.ofHard(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, 1);
  public static final BendableLongScore ONE_HARD =
      BendableLongScore.ofHard(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 1, 1);
  public static final BendableLongScore ONE_UNASSIGNED_CUSTOMER =
      BendableLongScore.ofHard(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 2, 1);
  public static final BendableLongScore ONE_SOFT =
      BendableLongScore.ofSoft(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, 1);
  public static final BendableLongScore ZERO =
      BendableLongScore.zero(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE);

  // ref: https://www.irs.gov/newsroom/irs-issues-standard-mileage-rates-for-2022
  @ConstraintWeight(DRIVING_COST_USD_MILLS_PER_KILOMETER)
  private BendableLongScore drivingCostUSDMillsPerKilometer =
      BendableLongScore.ofSoft(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, 360);

  // WorkDistributionConstraintConfig configuration values
  // WorkDistributionConstraintConfig.ExponentialPolicy configuration values:
  private Map<Integer, Long> workDistributionExponentialPolicyLookupTableMills;

  @ConstraintWeight(WORK_DISTRIBUTION_EXPONENTIAL_POLICY_VALUE_USD_MILLS)
  private BendableLongScore workDistributionExponentialPolicyValueUsdMills =
      BendableLongScore.zero(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE);

  // LateArrivalConstraintConfig configuration values
  private long hardLatenessThresholdMs = 0;
  // LateArrivalConstraintConfig.LinearOffsetPolicy configuration values.

  private Map<Long, Long> visitLatenessTolerancesMsOverrides = Map.of();

  @ConstraintWeight(SOFT_LATE_ARRIVAL_PER_MINUTE_COST_USD_MILLS)
  private BendableLongScore linearOffsetLatenessCostUsdMillsPerMinute =
      BendableLongScore.zero(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE);

  @ConstraintWeight(SOFT_LATE_URGENCY_ARRIVAL_PER_MINUTE_COST_USD_MILLS)
  private BendableLongScore linearOffsetUrgencyLatenessCostUsdMillsPerMinute =
      BendableLongScore.zero(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE);

  // depot late arrival
  @ConstraintWeight(SOFT_LATE_DEPOT_ARRIVAL_PER_MINUTE_COST_USD_MILLS)
  private BendableLongScore linearOffsetDepotLatenessCostUsdMillsPerMinute =
      BendableLongScore.zero(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE);

  private long vehicleOnSceneProviderCostScaleE6 = 0;

  private double linearForegoneVisitValueCentsPerMs = 0f;

  private long currentTimestampMs = 0L;

  // DepotLateArrivalConstraintConfig values
  private long depotHardLatenessThresholdMs = 0;
  // DepotLateArrivalConstraintConfig.LinearOffsetPolicy configuration values.

  private long linearOffsetLatenessPriorToTimeWindowEndMs = 0;
  private ImmutableSet<Long> disallowedLateArrivalVisitIds = ImmutableSet.of();
  private long linearOffsetLatenessPriorToUrgencyWindowEndMs = 0;
  private long linearOffsetLatenessPriorToDepotDueTimeMs = 0;

  public void setWorkDistributionExponentialPolicy(
      long fullQueueValueUsdMills, int baseNum, int baseDenom, int maximumNumberOfCustomers) {

    // turn on the constraint.
    workDistributionExponentialPolicyValueUsdMills = ONE_SOFT;

    // and pre-compute all the values for serving customer visits.
    Map<Integer, Long> lookupTable = new HashMap<>();
    for (int n = 0; n <= maximumNumberOfCustomers; n++) {
      double usdMills = fullQueueValueUsdMills * (1 - 1 / Math.pow((float) baseNum / baseDenom, n));

      lookupTable.put(n, (long) usdMills);
    }
    this.workDistributionExponentialPolicyLookupTableMills = lookupTable;
  }

  public BendableLongScore getWorkDistributionExponentialPolicyValueUsdMills() {
    return workDistributionExponentialPolicyValueUsdMills;
  }

  public long getHardLatenessThresholdMs() {
    return hardLatenessThresholdMs;
  }

  public void setHardLatenessThresholdMs(long thresholdMs) {
    this.hardLatenessThresholdMs = thresholdMs;
  }

  public void setVisitLatenessTolerancesMs(Map<Long, Long> thresholdMsByVisitId) {
    this.visitLatenessTolerancesMsOverrides = thresholdMsByVisitId;
  }

  public Long getVisitLatenessToleranceMs(Long visitId) {
    return this.visitLatenessTolerancesMsOverrides.getOrDefault(
        visitId, this.getHardLatenessThresholdMs());
  }

  public long getDepotHardLatenessThresholdMs() {
    return depotHardLatenessThresholdMs;
  }

  public void setDepotHardLatenessThresholdMs(long thresholdMs) {
    this.depotHardLatenessThresholdMs = thresholdMs;
  }

  public BendableLongScore getLinearOffsetLatenessCostUsdMillsPerMinute() {
    return linearOffsetLatenessCostUsdMillsPerMinute;
  }

  public void setLinearOffsetLatenessCostUSDMillsPerMs(float millsPerMs) {
    this.linearOffsetLatenessCostUsdMillsPerMinute =
        BendableLongScore.ofSoft(
            HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, (long) (MS_PER_MINUTE * millsPerMs));
  }

  public BendableLongScore getLinearOffsetUrgencyLatenessCostUSDMillsPerMinute() {
    return linearOffsetUrgencyLatenessCostUsdMillsPerMinute;
  }

  public void setLinearOffsetUrgencyLatenessCostUSDMillsPerMs(float millsPerMs) {
    this.linearOffsetUrgencyLatenessCostUsdMillsPerMinute =
        BendableLongScore.ofSoft(
            HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, (long) (MS_PER_MINUTE * millsPerMs));
  }

  public BendableLongScore getLinearOffsetDepotLatenessCostUSDMillsPerMinute() {
    return linearOffsetDepotLatenessCostUsdMillsPerMinute;
  }

  public void setLinearOffsetDepotLatenessCostUSDMillsPerMs(float millsPerMs) {
    this.linearOffsetDepotLatenessCostUsdMillsPerMinute =
        BendableLongScore.ofSoft(
            HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, (long) (MS_PER_MINUTE * millsPerMs));
  }

  public long getVehicleOnSceneProviderCostScaleE6() {
    return vehicleOnSceneProviderCostScaleE6;
  }

  public void setVehicleOnSceneProviderCostScale(double scale) {
    this.vehicleOnSceneProviderCostScaleE6 = (long) (E6 * scale);
  }

  public double getLinearForegoneVisitValueCentsPerMs() {
    return linearForegoneVisitValueCentsPerMs;
  }

  public void setLinearForegoneVisitValueCentsPerMs(double centsPerMs) {
    this.linearForegoneVisitValueCentsPerMs = centsPerMs;
  }

  public long getCurrentTimestampMs() {
    return currentTimestampMs;
  }

  public void setCurrentTimestampMs(long timestampMs) {
    this.currentTimestampMs = timestampMs;
  }

  public long getLinearOffsetLatenessPriorToTimeWindowEndMs() {
    return linearOffsetLatenessPriorToTimeWindowEndMs;
  }

  public void setLinearOffsetLatenessPriorToTimeWindowEndMs(long offsetMs) {
    this.linearOffsetLatenessPriorToTimeWindowEndMs = offsetMs;
  }

  public ImmutableSet<Long> getDisallowedLateArrivalVisitIds() {
    return disallowedLateArrivalVisitIds;
  }

  public void setDisallowedLateArrivalVisitIds(ImmutableSet<Long> visitIds) {
    this.disallowedLateArrivalVisitIds = visitIds;
  }

  public long getLinearOffsetLatenessPriorToUrgencyWindowEndMs() {
    return linearOffsetLatenessPriorToUrgencyWindowEndMs;
  }

  public void setLinearOffsetLatenessPriorToUrgencyWindowEndMs(long offsetMs) {
    this.linearOffsetLatenessPriorToUrgencyWindowEndMs = offsetMs;
  }

  public long getLinearOffsetLatenessPriorToDepotDueTimeMs() {
    return linearOffsetLatenessPriorToDepotDueTimeMs;
  }

  public void setLinearOffsetLatenessPriorToDepotDueTimeMs(long offsetMs) {
    this.linearOffsetLatenessPriorToDepotDueTimeMs = offsetMs;
  }

  public void setDrivingCostUSDMillsPerKilometer(long drivingCost) {
    this.drivingCostUSDMillsPerKilometer =
        BendableLongScore.ofSoft(HARD_LEVELS_SIZE, SOFT_LEVELS_SIZE, 0, drivingCost);
  }

  public BendableLongScore getDrivingCostUSDMillsPerKilometer() {
    return drivingCostUSDMillsPerKilometer;
  }

  public long getWorkDistributionExponentialPolicyUSDMills(int numCustomersServed) {
    if (workDistributionExponentialPolicyLookupTableMills == null) {
      // when the ConstraintWeight is zero (i.e. this constraint is not configured in proto),
      // the access below should not even get called in production. However, this guard is
      // needed for testing which by design doesn't look at the ConstraintWeight.
      return 0;
    }
    return workDistributionExponentialPolicyLookupTableMills.get(numCustomersServed);
  }
}
