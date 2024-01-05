package main

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestFilterProvidersByLastCompletedCareRequestIntervalDays(t *testing.T) {
	mockStatsigInterval := 28
	tcs := []struct {
		desc                   string
		performanceHubSettings performanceHubSettings

		wantIntervalDays int
	}{
		{
			desc:                   "should return interval from statsig",
			performanceHubSettings: performanceHubSettings{FilterProvidersByLastCompletedCareRequestAfterDays: &mockStatsigInterval},

			wantIntervalDays: mockStatsigInterval,
		},
		{
			desc:                   "should return default value when statsig returns nil",
			performanceHubSettings: performanceHubSettings{},

			wantIntervalDays: defaultFilterProvidersByLastCompletedCareRequestAfterDays,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.wantIntervalDays, tc.performanceHubSettings.FilterProvidersByLastCompletedCareRequestIntervalDays())
		})
	}
}
