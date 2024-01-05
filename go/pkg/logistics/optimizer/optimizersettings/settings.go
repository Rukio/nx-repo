package optimizersettings

import (
	"context"
	"math/rand"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
)

const defaultSnapshotsLookbackDuration = 60 * 24 * time.Hour // 60 days.

type Settings struct {
	// Description of the settings.
	Description string `json:"description"`

	// Poll interval for new information in service region.
	PollIntervalSec int64 `json:"poll_interval_sec"`

	// Ratio of PollIntervalSec to randomly add as jitter.
	PollIntervalJitterRatio float64 `json:"poll_interval_jitter_ratio"`

	// Validity of distance data, in seconds.
	DistanceValiditySec int64 `json:"distance_validity_sec"`

	// Number of seconds to lookback when finding resources for snapshot queries
	// currently in use for BatchGetLatestVisitSnapshotsInRegion, GetLatestVisitSnapshotsInRegion and GetLatestShiftTeamSnapshotsInRegion
	// Nill will fallback to the default of 60 days.
	SnapshotsLookbackSec *int64 `json:"snapshots_lookback_sec"`

	// Number of days forward to optimize for, including current day.
	OptimizeHorizonDays int64 `json:"optimize_horizon_days"`

	// Optimizer config to use when optimizing.
	OptimizerConfigID int64 `json:"optimizer_config_id"`

	// Maximum duration in milliseconds to optimize for before returning final solution.
	// 0 will use the optimizer_config_id's termination_duration_ms from the database.
	OptimizerTerminationDurationMs int64 `json:"optimizer_termination_duration_ms"`

	// Duration of a stable score (unimproved score) before returning final solution.
	// 0 will not check for a stable score.
	//
	// optimizer_termination_duration_ms will limit the total duration of an optimation.
	OptimizerUnimprovedScoreTerminationDurationMs int64 `json:"optimizer_unimproved_score_termination_duration_ms"`

	// For feasibility checks only, maximum duration in milliseconds to optimize for before returning final solution.
	// 0 will use the server hardcoded termination_duration_ms.
	FeasibilityOptimizerTerminationDurationMs int64 `json:"feasibility_optimizer_termination_duration_ms"`

	// For feasibility checks only, duration of a stable score (unimproved score) before returning final solution.
	// 0 will not check for a stable score.
	//
	// feasibility_optimizer_termination_duration_ms will limit the total duration of an optimation.
	FeasibilityOptimizerUnimprovedScoreTerminationDurationMs int64 `json:"feasibility_optimizer_unimproved_score_termination_duration_ms"`

	// Number of seconds after which the optimizer should run on a region for the current day schedule even if no underlying data has changed.
	// Nil means to not consider staleness. 0 means to always consider schedule stale.
	CurrentDayScheduleMaxStalenessSec *int64 `json:"current_day_schedule_max_staleness_sec"`

	// For feasibility, report non-manual-override visits as infeasible this number of minutes before market closing time.
	FeasibilityCheckLatenessMinutes int64 `json:"feasibility_check_lateness_minutes"`

	// For feasibility checks only, add extra start-of-shift prep time.
	FeasibilityShiftTeamStartBufferSec int64 `json:"feasibility_shift_team_start_buffer_sec"`

	// Use OSRM to fetch distances for all LogisticsDB + other use cases,
	// instead of the default configured map service.
	UseOSRMMapService bool `json:"use_osrm_map_service"`

	// Use Google maps to calculate eta when a care request is en route,
	// instead of the service configured by region.
	UseGoogleMapsForRealTimeTraffic bool `json:"use_google_maps_for_real_time_traffic"`

	// For feasibility checks only, long service duration.
	FeasibilityLongServiceDurationSec int64 `json:"feasibility_long_service_duration_sec"`

	// For feasibility checks only, percent shift team commitment to flag nearing capacity
	// For example: 0 = 0%; 100 = 100%.
	FeasibilityPercentCapacity int64 `json:"feasibility_percent_capacity"`

	// Enables additional response details for limited market availability.
	UseLimitedMarketAvailabilityChecks bool `json:"use_limited_market_availability_checks"`

	// For feasibility checks only, it overrides the default lateness threshold to prevent new visits from being late or from making other visits to be too late.
	// If nil, we use the default threshold for all the visits.
	FeasibilityCheckLatenessThresholdOverrideMs *int64 `json:"feasibility_check_lateness_threshold_override_ms"`

	// Fetch distances from other map services, for doing research comparisons.
	FetchOtherMapServiceDistances          bool  `json:"fetch_other_map_service_distances"`
	FetchOtherMapServiceDistancesTimeoutMs int64 `json:"fetch_other_map_service_distances_timeout_ms"`

	// Use to specify the cost per MS on HighAcuity lateness constraint
	// Nil means to use the current config. 0 means to set a 0 lateness cost.
	ClinicalUrgencyLatenessCostUSDMillsPerMs *float32 `json:"clinical_urgency_lateness_cost_usd_mills_per_ms"`

	// Use to specify the reward of the full queue value on the work distribution constraint
	// Nil means use the current config, 0 means to set a 0 reward.
	WorkDistributionFullQueueValueLimitUSDMills *uint64 `json:"work_distribution_full_queue_value_limit_usd_mills"`

	// Send the computed value for each visit based on potential
	// revenue and partner priority.
	UseVisitValue bool `json:"use_visit_value"`

	// Include latest unscheduled visits in check feasibility
	FeasibilityGetUnscheduledVisits bool `json:"feasibility_get_unscheduled_visits"`

	// Use the last schedule run for check feasibility flow
	FeasibilityCheckUseLastScheduleRun bool `json:"feasibility_check_use_last_schedule_run"`

	// For market availability, override any feasibility location with canonical locations.
	MarketAvailabilityUseCanonicalLocationsVisits bool `json:"market_availability_use_canonical_locations_visits"`

	// Additional time needed to account for setup time before servicing the visits.
	// For example: The extra time needed to access a building, going upstairs, etc.
	// This extra duration affects visits ETAs, showing an increment in the schedules.
	// 0 means no extra duration will be considered.
	VisitExtraSetupDurationSec int64 `json:"visit_extra_setup_duration_sec"`

	// Additional cost for the on scene time for visits, as a ratio of the base on scene cost.
	// 0 means no extra cost added for on scene time.
	// Nil means no constraint is set and defaults to the Optimizer value (which is currently 0).
	OnSceneCostScaleFactor *float32 `json:"on_scene_cost_scale_factor"`

	// Marginal opportunity cost per ETA, in 1/100 points.
	// If nil or <= 0, the constraint does not impact the score.
	ForegoneVisitCostCentsPerMinute *float32 `json:"foregone_visit_cost_cents_per_minute"`

	// Used by time window availability to define the time windows duration in hours.
	// If nil, the duration will default to 4 hours.
	AvailabilityTimeWindowDurationHrs *int `json:"availability_time_window_duration_hrs"`
}

func (s Settings) NextPollInterval() time.Duration {
	return nextPollInterval(s.PollIntervalSec, s.PollIntervalJitterRatio)
}

func nextPollInterval(pollIntervalSec int64, pollIntervalJitterRatio float64) time.Duration {
	pollInterval := time.Duration(pollIntervalSec) * time.Second
	if pollInterval <= 0 {
		return 0
	}

	jitterIntervalMs := nextJitterIntervalMs(pollIntervalSec, pollIntervalJitterRatio)

	// Spread jitter evenly around pollInterval by negating odd intervals.
	if jitterIntervalMs%2 == 1 {
		jitterIntervalMs = -jitterIntervalMs
	}

	pollInterval += time.Duration(jitterIntervalMs) * time.Millisecond
	if pollInterval < 0 {
		return 0
	}

	return pollInterval
}

func (s Settings) NextJitterInterval() time.Duration {
	return time.Duration(nextJitterIntervalMs(s.PollIntervalSec, s.PollIntervalJitterRatio)) * time.Millisecond
}

func nextJitterIntervalMs(pollIntervalSec int64, pollIntervalJitterRatio float64) int64 {
	if pollIntervalSec > 0 && pollIntervalJitterRatio > 0 {
		pollInterval := time.Duration(pollIntervalSec) * time.Second
		pollMs := pollInterval.Milliseconds()
		jitterRangeMs := int64(float64(pollMs) * pollIntervalJitterRatio)
		jitterIntervalMs := rand.Int63n(jitterRangeMs)

		return jitterIntervalMs
	}

	return 0
}

type RegionSettingsMap map[int64]Settings

func (rsm RegionSettingsMap) clone() RegionSettingsMap {
	m := RegionSettingsMap{}
	for k, v := range rsm {
		m[k] = v
	}
	return m
}

func (s Settings) ClinicalUrgencyConfig() *optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig {
	if s.ClinicalUrgencyLatenessCostUSDMillsPerMs == nil {
		return nil
	}

	return &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig{
		HigherLevelValueWins: true,
		Policy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy_{
			LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy{
				LatenessCostUsdMillsPerMs:       *s.ClinicalUrgencyLatenessCostUSDMillsPerMs,
				OffsetPriorToUrgencyWindowEndMs: uint64(time.Hour.Milliseconds()),
			},
		},
	}
}

func (s Settings) WorkDistributionConfig() *optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig {
	if s.WorkDistributionFullQueueValueLimitUSDMills == nil {
		return nil
	}

	return &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{
		Policy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy_{
			ExponentialPolicy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy{
				BaseNumerator:               2,
				BaseDenominator:             1,
				FullQueueValueLimitUsdMills: *s.WorkDistributionFullQueueValueLimitUSDMills,
			},
		},
	}
}

func (s Settings) OpportunityCostConfig() *optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig {
	var onSceneCost *optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCost
	if s.OnSceneCostScaleFactor != nil {
		onSceneCost = &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCost{
			LinearOnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCostPolicy{
				ScalingFactor: *s.OnSceneCostScaleFactor,
			},
		}
	}

	var foregoneVisitCost *optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValue
	if s.ForegoneVisitCostCentsPerMinute != nil && *s.ForegoneVisitCostCentsPerMinute > 0 {
		foregoneVisitCost = &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValue{
			LinearForegoneVisitValue: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValuePolicy{
				CentsPerMinute: *s.ForegoneVisitCostCentsPerMinute,
			},
		}
	}

	if onSceneCost == nil && foregoneVisitCost == nil {
		return nil
	}

	return &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig{
		OnSceneCost:       onSceneCost,
		ForegoneVisitCost: foregoneVisitCost,
	}
}

func (s Settings) SnapshotsLookbackDuration() time.Duration {
	lookbackDuration := defaultSnapshotsLookbackDuration
	if s.SnapshotsLookbackSec != nil {
		lookbackDuration = time.Duration(*s.SnapshotsLookbackSec) * time.Second
	}
	return lookbackDuration
}

func DefaultSnapshotsLookbackDuration() time.Duration {
	// TODO MARK-2617: Make the default snapshot lookback duration configurable.
	return defaultSnapshotsLookbackDuration
}

type Service interface {
	// Return Settings for a service region. May return ErrServiceRegionMarketNotFound if a region is not enabled.
	ServiceRegionSettings(ctx context.Context, serviceRegionID int64) (*Settings, error)

	// Return Settings for all enabled service regions.
	AllEnabledRegionSettings(ctx context.Context) (RegionSettingsMap, error)

	// Return the settings for both the dynamic configs: optimizer settings and availability settings.
	AllSettings(ctx context.Context) (*AllSettings, error)
}
