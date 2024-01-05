package optimizersettings

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	"go.uber.org/zap"
)

const (
	optimizerSettingsStatsigDynamicConfigKey    = "logistics_optimizer_service_region_settings"
	availabilitySettingsStatsigDynamicConfigKey = "logistics_availability_service_region_settings"

	inconsistentAvailabilitySettingsErrorMessage  = "availability settings has a region not in optimizer settings"
	inconsistentAvailabilitySettingsErrorTemplate = "availability service region id not found in optimizer settings: %d"
	duplicateServiceRegionIDErrorMessage          = "duplicate service region id, invalid settings"
	duplicateServiceRegionIDErrorTemplate         = "duplicate service region id: %d"

	serviceRegionIDLoggerKey = "service_region_id"
	settingsLoggerKey        = "settings"
	settingsTypeLoggerKey    = "settings_type"
)

var (
	ErrServiceRegionSettingsNotFound = errors.New("service region settings not found")
)

type StatsigServiceRegionSettingsJSON struct {
	Regions []*StatsigRegionSetSettingsMapping `json:"regions"`
}

type StatsigRegionSetSettingsMapping struct {
	Settings *Settings `json:"settings"`

	// Set of service regions that Settings apply to.
	ServiceRegionIDs []int64 `json:"service_region_ids"`
}

type StatsigAvailabilityServiceRegionSettingsJSON struct {
	Regions []*StatsigAvailabilityRegionSetSettingsMapping `json:"regions"`
}

type StatsigAvailabilityRegionSetSettingsMapping struct {
	Settings *AvailabilitySettings `json:"settings"`

	// Set of service regions that Settings apply to.
	ServiceRegionIDs []int64 `json:"service_region_ids"`
}

type StatsigService struct {
	StatsigProvider *providers.StatsigProvider
	RefreshInterval time.Duration
	Logger          *zap.SugaredLogger

	mx                            sync.RWMutex
	optimizerRegionSettingsMap    RegionSettingsMap
	availabilityRegionSettingsMap AvailabilityRegionSettingsMap
}

func (s *StatsigService) Start(ctx context.Context) {
	s.optimizerRegionSettingsMap = RegionSettingsMap{}
	s.availabilityRegionSettingsMap = AvailabilityRegionSettingsMap{}
	if s.RefreshInterval == 0 {
		return
	}

	s.populateSettings()

	go func() {
		for {
			select {
			case <-ctx.Done():
				return

			case <-time.After(s.RefreshInterval):
			}

			s.populateSettings()
		}
	}()
}

func toOptimizerSettingsMap(settingsJSON StatsigServiceRegionSettingsJSON, logger *zap.SugaredLogger) (RegionSettingsMap, error) {
	m := RegionSettingsMap{}
	seenRegionIDs := map[int64]bool{}
	for _, regionSettings := range settingsJSON.Regions {
		for _, serviceRegionID := range regionSettings.ServiceRegionIDs {
			if seenRegionIDs[serviceRegionID] {
				logger.Errorw(duplicateServiceRegionIDErrorMessage,
					serviceRegionIDLoggerKey, serviceRegionID,
					settingsLoggerKey, settingsJSON,
					settingsTypeLoggerKey, "optimizer",
				)
				return nil, fmt.Errorf(duplicateServiceRegionIDErrorTemplate, serviceRegionID)
			}
			seenRegionIDs[serviceRegionID] = true

			m[serviceRegionID] = *regionSettings.Settings
		}
	}

	return m, nil
}

func toAvailabilitySettingsMap(
	availabilitySettingsJSON StatsigAvailabilityServiceRegionSettingsJSON,
	optimizerSettingsMap RegionSettingsMap,
	logger *zap.SugaredLogger) (AvailabilityRegionSettingsMap, error) {
	m := AvailabilityRegionSettingsMap{}
	seenRegionIDs := map[int64]bool{}
	for _, availRegionSettings := range availabilitySettingsJSON.Regions {
		for _, availServiceRegionID := range availRegionSettings.ServiceRegionIDs {
			_, ok := optimizerSettingsMap[availServiceRegionID]
			if !ok {
				logger.Errorw(inconsistentAvailabilitySettingsErrorMessage,
					serviceRegionIDLoggerKey, availServiceRegionID,
					settingsLoggerKey, availabilitySettingsJSON,
					settingsTypeLoggerKey, "availability",
				)
				return nil, fmt.Errorf(inconsistentAvailabilitySettingsErrorTemplate, availServiceRegionID)
			}
			if seenRegionIDs[availServiceRegionID] {
				logger.Errorw(duplicateServiceRegionIDErrorMessage,
					serviceRegionIDLoggerKey, availServiceRegionID,
					settingsLoggerKey, availabilitySettingsJSON,
					settingsTypeLoggerKey, "availability",
				)
				return nil, fmt.Errorf(duplicateServiceRegionIDErrorTemplate, availServiceRegionID)
			}
			seenRegionIDs[availServiceRegionID] = true

			m[availServiceRegionID] = *availRegionSettings.Settings
		}
	}

	return m, nil
}

func (s *StatsigService) populateSettings() {
	var optimizerSettingsJSON StatsigServiceRegionSettingsJSON
	err := s.StatsigProvider.Struct(optimizerSettingsStatsigDynamicConfigKey, &optimizerSettingsJSON)
	if err != nil {
		s.Logger.Errorw("could not get optimizer settings from statsig", zap.Error(err))
		return
	}
	var availabilitySettingsJSON StatsigAvailabilityServiceRegionSettingsJSON
	err = s.StatsigProvider.Struct(availabilitySettingsStatsigDynamicConfigKey, &availabilitySettingsJSON)
	if err != nil {
		s.Logger.Errorw("could not get availability settings from statsig", zap.Error(err))
		return
	}

	optimizerSettingsMap, err := toOptimizerSettingsMap(optimizerSettingsJSON, s.Logger)
	if err != nil {
		s.Logger.Errorw("could not parse optimizer settings", zap.Error(err))
		return
	}
	availabilitySettingsMap, err := toAvailabilitySettingsMap(availabilitySettingsJSON, optimizerSettingsMap, s.Logger)
	if err != nil {
		s.Logger.Errorw("could not parse availability settings", zap.Error(err))
		return
	}

	s.mx.Lock()
	s.optimizerRegionSettingsMap = optimizerSettingsMap
	s.availabilityRegionSettingsMap = availabilitySettingsMap
	s.mx.Unlock()
}

func (s *StatsigService) ServiceRegionSettings(ctx context.Context, serviceRegionID int64) (*Settings, error) {
	s.mx.RLock()
	defer s.mx.RUnlock()

	settings, ok := s.optimizerRegionSettingsMap[serviceRegionID]
	if !ok {
		return nil, ErrServiceRegionSettingsNotFound
	}

	return &settings, nil
}

func (s *StatsigService) AllEnabledRegionSettings(ctx context.Context) (RegionSettingsMap, error) {
	s.mx.RLock()
	m := s.optimizerRegionSettingsMap
	s.mx.RUnlock()

	return m.clone(), nil
}

type AllSettings struct {
	OptimizerRegionSettingsMap    RegionSettingsMap
	AvailabilityRegionSettingsMap AvailabilityRegionSettingsMap
}

func (s *StatsigService) AllSettings(ctx context.Context) (*AllSettings, error) {
	s.mx.RLock()
	orsm := s.optimizerRegionSettingsMap
	arsm := s.availabilityRegionSettingsMap
	s.mx.RUnlock()

	return &AllSettings{
		OptimizerRegionSettingsMap:    orsm.clone(),
		AvailabilityRegionSettingsMap: arsm.clone(),
	}, nil
}

var _ Service = (*StatsigService)(nil)
