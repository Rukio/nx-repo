package com.*company-data-covered*.logistics.solver;

import com.*company-data-covered*.optimizer.VRPConfig;

/**
 * Default profit components to be shared across a problem, and overridden by entity-specific
 * values.
 *
 * @param appHourlyCostUSDCents Default hourly wage per APP.
 * @param dhmtHourlyCostUSDCents Default hourly wage per DHMT.
 * @param visitRevenueUSDCents Default revenue for servicing a visit.
 */
public record DefaultProfitComponents(
    long appHourlyCostUSDCents, long dhmtHourlyCostUSDCents, long visitRevenueUSDCents) {

  public static DefaultProfitComponents fromVRPConfig(VRPConfig cfg) {
    return new DefaultProfitComponents(
        cfg.getAppHourlyCostUsdCents(),
        cfg.getDhmtHourlyCostUsdCents(),
        cfg.getPerVisitRevenueUsdCents());
  }
}
