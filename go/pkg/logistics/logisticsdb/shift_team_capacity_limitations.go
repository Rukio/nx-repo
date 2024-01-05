package logisticsdb

import (
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"google.golang.org/protobuf/proto"
)

type ShiftTeamCapacity struct {
	ShiftTeamAttributes []string
	CapacityPercent     int32
}

func ShiftTeamCapacitiesOnHorizonDayFromCapacitySettings(capacitySettings []*optimizersettings.CapacitySettings, horizonDay int) []*ShiftTeamCapacity {
	capacities := make([]*ShiftTeamCapacity, len(capacitySettings))
	for i, capacitySetting := range capacitySettings {
		limitation := &ShiftTeamCapacity{
			ShiftTeamAttributes: capacitySetting.ShiftTeamAttributes,
			CapacityPercent:     capacityPercentOnHorizonDay(capacitySetting, horizonDay),
		}
		capacities[i] = limitation
	}
	return capacities
}

func capacityPercentOnHorizonDay(capacitySetting *optimizersettings.CapacitySettings, horizonDay int) int32 {
	numDefinedCapacityForHorizonDays := len(capacitySetting.CapacityPercentForHorizonDays)
	if numDefinedCapacityForHorizonDays == 0 {
		return 100
	}

	index := horizonDay
	if horizonDay >= numDefinedCapacityForHorizonDays {
		index = numDefinedCapacityForHorizonDays - 1
	}
	return capacitySetting.CapacityPercentForHorizonDays[index]
}

func ApplyCapacityLimitationsToShiftTeams(
	shiftTeams []*optimizerpb.VRPShiftTeam,
	shiftTeamCapacities []*ShiftTeamCapacity) {
	for _, vrpShiftTeam := range shiftTeams {
		for _, shiftTeamCapacity := range shiftTeamCapacities {
			if shiftTeamHasAllCapacitySettingsAttributes(shiftTeamCapacity, vrpShiftTeam) {
				setAllowedCapacityRatioForShiftTeam(shiftTeamCapacity, vrpShiftTeam)
				break
			}
		}
	}
}

func shiftTeamHasAttribute(attributeToFind string, shiftTeam *optimizerpb.VRPShiftTeam) bool {
	for _, vrpAttribute := range shiftTeam.Attributes {
		if attributeToFind == vrpAttribute.Id {
			return true
		}
	}
	return false
}

func shiftTeamHasAllCapacitySettingsAttributes(shiftTeamCapacity *ShiftTeamCapacity, shiftTeam *optimizerpb.VRPShiftTeam) bool {
	for _, shiftTeamAttribute := range shiftTeamCapacity.ShiftTeamAttributes {
		if !shiftTeamHasAttribute(shiftTeamAttribute, shiftTeam) {
			return false
		}
	}
	return true
}

func setAllowedCapacityRatioForShiftTeam(
	shiftTeamCapacity *ShiftTeamCapacity,
	shiftTeam *optimizerpb.VRPShiftTeam) {
	if shiftTeamCapacity.CapacityPercent < 100 {
		shiftTeam.AllowedCapacityRatio = proto.Float32(float32(shiftTeamCapacity.CapacityPercent) / 100.0)
	}
}
