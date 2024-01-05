package optimizersettings

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestMockSettingsService(t *testing.T) {
	var serviceRegionID int64 = 1
	m := &MockSettingsService{ServiceRegionSettingsErr: ErrServiceRegionSettingsNotFound}
	_, err := m.ServiceRegionSettings(context.Background(), serviceRegionID)
	testutils.MustMatch(t, ErrServiceRegionSettingsNotFound, err)

	s := &Settings{Description: "some value"}
	m = &MockSettingsService{RegionSettings: s, AllRegions: RegionSettingsMap{serviceRegionID: *s}}
	srs, err := m.ServiceRegionSettings(context.Background(), serviceRegionID)
	testutils.MustMatch(t, nil, err)
	testutils.MustMatch(t, s, srs)

	aers, err := m.AllEnabledRegionSettings(context.Background())
	testutils.MustMatch(t, nil, err)
	testutils.MustMatch(t, RegionSettingsMap{serviceRegionID: *s}, aers)

	as := &AvailabilitySettings{Description: "some availability settings"}
	m = &MockSettingsService{
		AllSettingsConfigs: &AllSettings{
			OptimizerRegionSettingsMap:    RegionSettingsMap{serviceRegionID: *s},
			AvailabilityRegionSettingsMap: AvailabilityRegionSettingsMap{serviceRegionID: *as},
		},
	}

	allSettings, err := m.AllSettings(context.Background())
	testutils.MustMatch(t, nil, err)
	testutils.MustMatch(t, m.AllSettingsConfigs, allSettings)
}
