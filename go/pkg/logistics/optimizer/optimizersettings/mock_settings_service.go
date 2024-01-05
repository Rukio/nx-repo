package optimizersettings

import (
	"context"
)

type MockSettingsService struct {
	AllRegions               RegionSettingsMap
	RegionSettings           *Settings
	ServiceRegionSettingsErr error
	AllSettingsConfigs       *AllSettings
	AllSettingsErr           error
}

func (ss *MockSettingsService) ServiceRegionSettings(ctx context.Context, serviceRegionID int64) (*Settings, error) {
	if ss.ServiceRegionSettingsErr != nil {
		return nil, ss.ServiceRegionSettingsErr
	}
	return ss.RegionSettings, nil
}

func (ss *MockSettingsService) AllEnabledRegionSettings(ctx context.Context) (RegionSettingsMap, error) {
	return ss.AllRegions, nil
}

func (ss *MockSettingsService) AllSettings(ctx context.Context) (*AllSettings, error) {
	if ss.AllSettingsErr != nil {
		return nil, ss.AllSettingsErr
	}
	return ss.AllSettingsConfigs, nil
}

var _ Service = (*MockSettingsService)(nil)
