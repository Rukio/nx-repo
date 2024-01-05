package logisticsdb

import (
	"testing"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestApplyCapacityLimitations(t *testing.T) {
	tcs := []struct {
		desc               string
		shiftTeamsInput    []*optimizerpb.VRPShiftTeam
		capacitySettings   []*optimizersettings.CapacitySettings
		horizonDay         int
		expectedShiftTeams []*optimizerpb.VRPShiftTeam
	}{
		{
			desc: "base case",
			shiftTeamsInput: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Bridge"},
					},
				},
			},
			capacitySettings: []*optimizersettings.CapacitySettings{
				{
					ShiftTeamAttributes:           []string{"service_name:Acute"},
					CapacityPercentForHorizonDays: []int32{50, 40},
				},
			},
			horizonDay: 0,
			expectedShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
					AllowedCapacityRatio: proto.Float32(0.5),
				},
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Bridge"},
					},
				},
			},
		},
		{
			desc: "2nd horizon day",
			shiftTeamsInput: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
			capacitySettings: []*optimizersettings.CapacitySettings{
				{
					ShiftTeamAttributes:           []string{"service_name:Acute"},
					CapacityPercentForHorizonDays: []int32{100, 50, 40},
				},
			},
			horizonDay: 1,
			expectedShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
					AllowedCapacityRatio: proto.Float32(0.5),
				},
			},
		},
		{
			desc: "higher horizon day than defined",
			shiftTeamsInput: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
			capacitySettings: []*optimizersettings.CapacitySettings{
				{
					ShiftTeamAttributes:           []string{"service_name:Acute"},
					CapacityPercentForHorizonDays: []int32{100, 50},
				},
			},
			horizonDay: 2,
			expectedShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
					AllowedCapacityRatio: proto.Float32(0.5),
				},
			},
		},
		{
			desc: "100 percent",
			shiftTeamsInput: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
			capacitySettings: []*optimizersettings.CapacitySettings{
				{
					ShiftTeamAttributes:           []string{"service_name:Acute"},
					CapacityPercentForHorizonDays: []int32{100},
				},
			},
			horizonDay: 0,
			expectedShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
		},
		{
			desc: "partial match",
			shiftTeamsInput: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
			capacitySettings: []*optimizersettings.CapacitySettings{
				{
					ShiftTeamAttributes:           []string{"service_name:Acute", "nomatch"},
					CapacityPercentForHorizonDays: []int32{50},
				},
			},
			horizonDay: 0,
			expectedShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
		},
		{
			desc: "nil settings",
			shiftTeamsInput: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
			capacitySettings: nil,
			horizonDay:       0,
			expectedShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "service_name:Acute"},
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			shiftTeamCapacities := ShiftTeamCapacitiesOnHorizonDayFromCapacitySettings(tc.capacitySettings, tc.horizonDay)
			ApplyCapacityLimitationsToShiftTeams(tc.shiftTeamsInput, shiftTeamCapacities)
			testutils.MustMatch(t, tc.expectedShiftTeams, tc.shiftTeamsInput)
		})
	}
}
