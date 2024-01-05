package optimizersettings

import (
	"testing"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type durationRange struct {
	min time.Duration
	max time.Duration
}

func (r durationRange) MustContain(t *testing.T, d time.Duration, name string) {
	t.Helper()

	success := d >= r.min && d <= r.max
	if !success {
		t.Fatalf("%v not in %s[%v, %v]", d, name, r.min, r.max)
	}
}

func TestPollInterval(t *testing.T) {
	runs := 100
	tcs := []struct {
		Desc        string
		PollSec     int64
		JitterRatio float64

		ExpectedPollInterval   durationRange
		ExpectedJitterInterval durationRange
	}{
		{
			Desc:    "some poll interval, no jitter",
			PollSec: 1,

			ExpectedPollInterval: durationRange{1 * time.Second, 1 * time.Second},
		},
		{
			Desc:        "some poll interval, with jitter, is within jitter ratio",
			PollSec:     1,
			JitterRatio: 0.1,

			ExpectedPollInterval:   durationRange{900 * time.Millisecond, 1100 * time.Millisecond},
			ExpectedJitterInterval: durationRange{0, 100 * time.Millisecond},
		},
		{
			Desc:        "some poll interval, larger than 1 jitter ratio, is not negative",
			PollSec:     1,
			JitterRatio: 1.1,

			ExpectedPollInterval:   durationRange{0 * time.Millisecond, 2100 * time.Millisecond},
			ExpectedJitterInterval: durationRange{0, 1100 * time.Millisecond},
		},
		{
			Desc:    "no poll interval",
			PollSec: 0,
		},
		{
			Desc:    "negative poll interval",
			PollSec: -1,
		},
		{
			Desc:        "no poll interval, some jitter",
			PollSec:     0,
			JitterRatio: 0.1,
		},
		{
			Desc:        "negative poll interval, some jitter",
			PollSec:     -1,
			JitterRatio: 0.1,
		},
		{
			Desc:        "some poll interval, negative jitter",
			PollSec:     1,
			JitterRatio: -0.1,

			ExpectedPollInterval: durationRange{1 * time.Second, 1 * time.Second},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := Settings{
				PollIntervalSec:         tc.PollSec,
				PollIntervalJitterRatio: tc.JitterRatio,
			}

			ars := AvailabilitySettings{
				PollIntervalSec:         tc.PollSec,
				PollIntervalJitterRatio: tc.JitterRatio,
			}

			for i := 0; i < runs; i++ {
				tc.ExpectedPollInterval.MustContain(t, s.NextPollInterval(), "poll interval")
				tc.ExpectedJitterInterval.MustContain(t, s.NextJitterInterval(), "jitter interval")

				tc.ExpectedPollInterval.MustContain(t, ars.NextPollInterval(), "availability runner poll interval")
				tc.ExpectedJitterInterval.MustContain(t, ars.NextJitterInterval(), "availability runner jitter interval")
			}
		})
	}
}

func TestSettings_ClinicalUrgencyConfig(t *testing.T) {
	var customUSDMillsCost float32 = 0.0045
	var customUSDMillsNonValue float32

	tcs := []struct {
		name     string
		settings Settings

		expectedConstraintConfig *optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig
	}{
		{
			name: "with correct values",
			settings: Settings{
				ClinicalUrgencyLatenessCostUSDMillsPerMs: &customUSDMillsCost,
			},

			expectedConstraintConfig: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig{
				HigherLevelValueWins: true,
				Policy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy_{
					LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy{
						LatenessCostUsdMillsPerMs:       customUSDMillsCost,
						OffsetPriorToUrgencyWindowEndMs: uint64(time.Hour.Milliseconds()),
					},
				},
			},
		},
		{
			name:                     "without values",
			settings:                 Settings{},
			expectedConstraintConfig: nil,
		},
		{
			name: "with 0 value",
			settings: Settings{
				ClinicalUrgencyLatenessCostUSDMillsPerMs: &customUSDMillsNonValue,
			},

			expectedConstraintConfig: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig{
				HigherLevelValueWins: true,
				Policy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy_{
					LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy{
						LatenessCostUsdMillsPerMs:       customUSDMillsNonValue,
						OffsetPriorToUrgencyWindowEndMs: uint64(time.Hour.Milliseconds()),
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testutils.MustMatchProto(t, tc.expectedConstraintConfig, tc.settings.ClinicalUrgencyConfig(),
				"ClinicalUrgencyConfig output don't match expected proto")
		})
	}
}

func TestSettings_WorkDistributionConfig(t *testing.T) {
	customFullQueueValueLimitUsdMills := uint64(45)
	var customFullQueueValueLimitUsdMillsNonValue uint64

	tcs := []struct {
		name     string
		settings Settings

		expectedConstraintConfig *optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig
	}{
		{
			name: "with correct values",
			settings: Settings{
				WorkDistributionFullQueueValueLimitUSDMills: &customFullQueueValueLimitUsdMills,
			},

			expectedConstraintConfig: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{
				Policy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy_{
					ExponentialPolicy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy{
						BaseNumerator:               2,
						BaseDenominator:             1,
						FullQueueValueLimitUsdMills: customFullQueueValueLimitUsdMills,
					},
				},
			},
		},
		{
			name:                     "without values",
			settings:                 Settings{},
			expectedConstraintConfig: nil,
		},
		{
			name: "with 0 value",
			settings: Settings{
				WorkDistributionFullQueueValueLimitUSDMills: &customFullQueueValueLimitUsdMillsNonValue,
			},

			expectedConstraintConfig: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{
				Policy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy_{
					ExponentialPolicy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy{
						BaseNumerator:               2,
						BaseDenominator:             1,
						FullQueueValueLimitUsdMills: customFullQueueValueLimitUsdMillsNonValue,
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testutils.MustMatchProto(t, tc.expectedConstraintConfig, tc.settings.WorkDistributionConfig(),
				"ClinicalUrgencyConfig output don't match expected proto")
		})
	}
}

func TestSettings_OpportunityCostConfig(t *testing.T) {
	customOnSceneCostScaleFactor := float32(0.14)
	customOnSceneCostScaleFactorZero := float32(0)
	customForegoneVisitCostCentsPerMinute := float32(0.5)
	customForegoneVisitCostCentsPerMinuteZero := float32(0)

	tcs := []struct {
		name     string
		settings Settings

		expectedConstraintConfig *optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig
	}{
		{
			name: "with correct values",
			settings: Settings{
				OnSceneCostScaleFactor:          &customOnSceneCostScaleFactor,
				ForegoneVisitCostCentsPerMinute: &customForegoneVisitCostCentsPerMinute,
			},

			expectedConstraintConfig: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig{
				OnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCost{
					LinearOnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCostPolicy{
						ScalingFactor: customOnSceneCostScaleFactor,
					},
				},
				ForegoneVisitCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValue{
					LinearForegoneVisitValue: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValuePolicy{
						CentsPerMinute: customForegoneVisitCostCentsPerMinute,
					},
				},
			},
		},
		{
			name:                     "without values",
			settings:                 Settings{},
			expectedConstraintConfig: nil,
		},
		{
			name: "with 0 value",
			settings: Settings{
				OnSceneCostScaleFactor:          &customOnSceneCostScaleFactorZero,
				ForegoneVisitCostCentsPerMinute: &customForegoneVisitCostCentsPerMinuteZero,
			},

			expectedConstraintConfig: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig{
				OnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCost{
					LinearOnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCostPolicy{
						ScalingFactor: customOnSceneCostScaleFactorZero,
					},
				},
				ForegoneVisitCost: nil,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testutils.MustMatchProto(t, tc.expectedConstraintConfig, tc.settings.OpportunityCostConfig(),
				"ClinicalUrgencyConfig output don't match expected proto")
		})
	}
}

func TestSnapshotsLookbackDuration(t *testing.T) {
	customValueSec := int64(9876543210)
	tcs := []struct {
		Description          string
		SnapshotsLookbackSec *int64
		Expected             time.Duration
	}{
		{
			Description:          "Default fallback",
			SnapshotsLookbackSec: nil,
			Expected:             60 * 24 * time.Hour,
		},
		{
			Description:          "Custom value",
			SnapshotsLookbackSec: &customValueSec,
			Expected:             time.Duration(customValueSec) * time.Second,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			s := Settings{SnapshotsLookbackSec: tc.SnapshotsLookbackSec}
			testutils.MustMatch(t, s.SnapshotsLookbackDuration(), tc.Expected)
		})
	}
}
