package optimizersettings

import (
	"time"
)

// Statsig config https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/logistics_availability_service_region_settings
type AvailabilitySettings struct {
	// Description of the settings.
	Description string `json:"description"`

	// Poll interval for new information in service region.
	PollIntervalSec int64 `json:"poll_interval_sec"`

	// Ratio of PollIntervalSec to randomly add as jitter.
	PollIntervalJitterRatio float64 `json:"poll_interval_jitter_ratio"`

	// Allow availability visits to be late.
	AllowLateAvailabilityVisits bool `json:"allow_late_availability_visits"`

	// Allow availability visits to be expendable for optimizer.
	AllowExpendableAvailabilityVisits bool `json:"allow_expendable_availability_visits"`

	// Maximum duration in milliseconds to optimize for before returning final solution.
	// 0 will use the optimizer_config_id's termination_duration_ms from the database.
	OptimizerTerminationDurationMs int64 `json:"optimizer_termination_duration_ms"`

	// Duration of a stable score (unimproved score) before returning final solution.
	// 0 will not check for a stable score.
	//
	// optimizer_termination_duration_ms will limit the total duration of an optimization.
	OptimizerUnimprovedScoreTerminationDurationMs int64 `json:"optimizer_unimproved_score_termination_duration_ms"`

	Attributes []AvailabilityAttribute `json:"attributes"`

	CapacitySettings []*CapacitySettings `json:"capacity_settings"`
}

type AvailabilityAttribute struct {
	Name     string   `json:"name"`
	Variants []string `json:"variants"`
}

type CapacitySettings struct {
	ShiftTeamAttributes           []string `json:"shift_team_attributes"`
	CapacityPercentForHorizonDays []int32  `json:"capacity_percent_for_horizon_days"`
}

func (s AvailabilitySettings) NextPollInterval() time.Duration {
	return nextPollInterval(s.PollIntervalSec, s.PollIntervalJitterRatio)
}

func (s AvailabilitySettings) NextJitterInterval() time.Duration {
	return time.Duration(nextJitterIntervalMs(s.PollIntervalSec, s.PollIntervalJitterRatio)) * time.Millisecond
}

type AvailabilityRegionSettingsMap map[int64]AvailabilitySettings

func (rsm AvailabilityRegionSettingsMap) clone() AvailabilityRegionSettingsMap {
	m := AvailabilityRegionSettingsMap{}
	for k, v := range rsm {
		m[k] = v
	}
	return m
}
