package com.*company-data-covered*.logistics.solver;

import static org.assertj.core.api.Assertions.assertThat;

import com.*company-data-covered*.optimizer.VRPConfig;
import org.junit.jupiter.api.Test;

class DefaultProfitComponentsTest {

  @Test
  void fromVRPConfig() {
    VRPConfig vrpConfig =
        VRPConfig.newBuilder()
            .setAppHourlyCostUsdCents(1)
            .setDhmtHourlyCostUsdCents(2)
            .setPerVisitRevenueUsdCents(3)
            .build();
    DefaultProfitComponents dpc = DefaultProfitComponents.fromVRPConfig(vrpConfig);
    assertThat(dpc.appHourlyCostUSDCents()).isEqualTo(1);
    assertThat(dpc.dhmtHourlyCostUSDCents()).isEqualTo(2);
    assertThat(dpc.visitRevenueUSDCents()).isEqualTo(3);
  }
}
