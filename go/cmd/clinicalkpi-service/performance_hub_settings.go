package main

// Performance hub settings in Statsig config https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/performance_hub_settings
type performanceHubSettings struct {
	// FilterProvidersByLastCompletedCareRequestAfterDays is used for configuring interval for last completed care request to filter active providers.
	FilterProvidersByLastCompletedCareRequestAfterDays *int `json:"filter_providers_last_completed_care_request_days"`
}

func (s performanceHubSettings) FilterProvidersByLastCompletedCareRequestIntervalDays() int {
	if s.FilterProvidersByLastCompletedCareRequestAfterDays != nil {
		return *s.FilterProvidersByLastCompletedCareRequestAfterDays
	}
	return defaultFilterProvidersByLastCompletedCareRequestAfterDays
}
