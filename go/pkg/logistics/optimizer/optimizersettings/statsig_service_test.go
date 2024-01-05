package optimizersettings

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func Test_toOptimizerSettingsMap(t *testing.T) {
	settings1 := &Settings{
		PollIntervalSec:                   1,
		DistanceValiditySec:               2,
		OptimizeHorizonDays:               3,
		OptimizerConfigID:                 4,
		CurrentDayScheduleMaxStalenessSec: proto.Int64(5),
	}
	settings2 := &Settings{
		PollIntervalSec:                   10,
		DistanceValiditySec:               20,
		OptimizeHorizonDays:               30,
		OptimizerConfigID:                 40,
		CurrentDayScheduleMaxStalenessSec: proto.Int64(50),
	}

	tcs := []struct {
		Desc    string
		Regions []*StatsigRegionSetSettingsMapping

		Want   RegionSettingsMap
		HasErr bool
	}{
		{
			Desc: "base case",
			Regions: []*StatsigRegionSetSettingsMapping{
				{
					Settings:         settings1,
					ServiceRegionIDs: []int64{1, 2},
				},
				{
					Settings:         settings2,
					ServiceRegionIDs: []int64{3},
				},
			},

			Want: RegionSettingsMap{
				1: *settings1,
				2: *settings1,
				3: *settings2,
			},
		},
		{
			Desc: "no regions specified is empty",
			Regions: []*StatsigRegionSetSettingsMapping{
				{
					Settings: settings1,
				},
				{
					Settings: settings2,
				},
			},

			Want: RegionSettingsMap{},
		},
		{
			Desc: "duplicate ids has error",
			Regions: []*StatsigRegionSetSettingsMapping{
				{
					Settings:         settings1,
					ServiceRegionIDs: []int64{1},
				},
				{
					Settings:         settings2,
					ServiceRegionIDs: []int64{1},
				},
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			m, err := toOptimizerSettingsMap(StatsigServiceRegionSettingsJSON{
				Regions: tc.Regions,
			}, zap.NewNop().Sugar())

			testutils.MustMatch(t, tc.HasErr, err != nil, "error doesn't match")
			testutils.MustMatch(t, tc.Want, m)
		})
	}
}

func Test_toAvailabilitySettingsMap(t *testing.T) {
	availSettings1 := &AvailabilitySettings{
		Description:             "desc1",
		PollIntervalSec:         1,
		PollIntervalJitterRatio: 10,
	}
	availSettings2 := &AvailabilitySettings{
		Description:             "desc2",
		PollIntervalSec:         2,
		PollIntervalJitterRatio: 20,
	}

	tcs := []struct {
		Desc                 string
		Regions              []*StatsigAvailabilityRegionSetSettingsMapping
		OptimizerSettingsMap RegionSettingsMap

		Want   AvailabilityRegionSettingsMap
		HasErr bool
	}{
		{
			Desc: "base case",
			Regions: []*StatsigAvailabilityRegionSetSettingsMapping{
				{
					Settings:         availSettings1,
					ServiceRegionIDs: []int64{1, 2},
				},
				{
					Settings:         availSettings2,
					ServiceRegionIDs: []int64{3},
				},
			},
			OptimizerSettingsMap: RegionSettingsMap{
				1: Settings{},
				2: Settings{},
				3: Settings{},
			},

			Want: AvailabilityRegionSettingsMap{
				1: *availSettings1,
				2: *availSettings1,
				3: *availSettings2,
			},
		},
		{
			Desc: "no regions specified is empty",
			Regions: []*StatsigAvailabilityRegionSetSettingsMapping{
				{
					Settings: availSettings1,
				},
				{
					Settings: availSettings2,
				},
			},

			Want: AvailabilityRegionSettingsMap{},
		},
		{
			Desc: "duplicate ids has error",
			Regions: []*StatsigAvailabilityRegionSetSettingsMapping{
				{
					Settings:         availSettings1,
					ServiceRegionIDs: []int64{1},
				},
				{
					Settings:         availSettings2,
					ServiceRegionIDs: []int64{1},
				},
			},
			OptimizerSettingsMap: RegionSettingsMap{
				1: Settings{},
			},

			HasErr: true,
		},
		{
			Desc: "avail settings not found in opt settings",
			Regions: []*StatsigAvailabilityRegionSetSettingsMapping{
				{
					Settings:         availSettings1,
					ServiceRegionIDs: []int64{99},
				},
			},
			OptimizerSettingsMap: RegionSettingsMap{
				1: Settings{},
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			m, err := toAvailabilitySettingsMap(
				StatsigAvailabilityServiceRegionSettingsJSON{
					Regions: tc.Regions,
				},
				tc.OptimizerSettingsMap,
				zap.NewNop().Sugar())

			testutils.MustMatch(t, tc.HasErr, err != nil, "error doesn't match")
			testutils.MustMatch(t, tc.Want, m)
		})
	}
}

func Test_StatsigService(t *testing.T) {
	p, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{
		LocalMode:      true,
		SDKKey:         "dummy",
		DefaultUserKey: "user",
	})
	if err != nil {
		t.Fatal(err)
	}

	optSettings := &Settings{
		PollIntervalSec:                   1,
		DistanceValiditySec:               2,
		OptimizeHorizonDays:               3,
		OptimizerConfigID:                 4,
		CurrentDayScheduleMaxStalenessSec: proto.Int64(5),
	}
	availSettings := &AvailabilitySettings{
		PollIntervalSec:         1,
		PollIntervalJitterRatio: 2,
	}
	goodRegionID := int64(1)
	badRegionID := int64(2)

	p.Start()
	err = p.OverrideStruct(optimizerSettingsStatsigDynamicConfigKey, StatsigServiceRegionSettingsJSON{
		Regions: []*StatsigRegionSetSettingsMapping{
			{
				Settings:         optSettings,
				ServiceRegionIDs: []int64{goodRegionID},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	err = p.OverrideStruct(availabilitySettingsStatsigDynamicConfigKey, StatsigAvailabilityServiceRegionSettingsJSON{
		Regions: []*StatsigAvailabilityRegionSetSettingsMapping{
			{
				Settings:         availSettings,
				ServiceRegionIDs: []int64{goodRegionID},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	s := &StatsigService{
		StatsigProvider: p,
		RefreshInterval: 1 * time.Millisecond,
		Logger:          zap.NewNop().Sugar(),
	}
	ctx := context.Background()
	s.Start(ctx)
	time.Sleep(300 * time.Millisecond)

	gotOptSettings, err := s.ServiceRegionSettings(ctx, goodRegionID)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, optSettings, gotOptSettings)

	_, err = s.ServiceRegionSettings(ctx, badRegionID)
	testutils.MustMatch(t, ErrServiceRegionSettingsNotFound, err)

	allOptSettings, err := s.AllEnabledRegionSettings(ctx)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, RegionSettingsMap{
		goodRegionID: *gotOptSettings,
	}, allOptSettings)

	allSettings, err := s.AllSettings(ctx)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, &AllSettings{
		OptimizerRegionSettingsMap: allOptSettings,
		AvailabilityRegionSettingsMap: AvailabilityRegionSettingsMap{
			goodRegionID: *availSettings,
		},
	}, allSettings)

	s = &StatsigService{
		StatsigProvider: p,
		RefreshInterval: 0,
	}
	s.Start(ctx)
	_, err = s.ServiceRegionSettings(ctx, goodRegionID)
	testutils.MustMatch(t, ErrServiceRegionSettingsNotFound, err)
}
