package logisticsdb

import (
	"fmt"
	"log"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
)

type VisitPhaseShortName string

// Validate validates that the visit phase is registered in the maps that back other functions.
func (v VisitPhaseShortName) Validate() error {
	if _, ok := IsPinnedVisitPhase[v]; !ok {
		return fmt.Errorf("visit phase(%s) not mapped in IsPinnedVisitPhase", v)
	}
	if _, ok := visitPhaseShortNameToPhaseTypeID[v]; !ok {
		return fmt.Errorf("visit phase(%s) not mapped in visitPhaseShortNameToPhaseTypeID", v)
	}
	return nil
}

// PhaseTypeID is a DB identifier for the visit phase short name. Panics if invalid.
func (v VisitPhaseShortName) PhaseTypeID() int64 {
	id, ok := visitPhaseShortNameToPhaseTypeID[v]
	if !ok {
		log.Panicf("invalid VisitPhaseShortName: %s", v)
	}
	return id
}

func (v VisitPhaseShortName) String() string {
	return string(v)
}

// IsPinned is whether the visit phase reflects a pinned state for optimizer. Panics if invalid.
func (v VisitPhaseShortName) IsPinned() bool {
	p, ok := IsPinnedVisitPhase[v]
	if !ok {
		log.Panicf("invalid VisitPhaseShortName: %s", v)
	}
	return p
}

var (
	VisitPhaseShortNameToPhases = map[VisitPhaseShortName]logisticspb.VisitPhase{
		VisitPhaseTypeShortNameRequested:   logisticspb.VisitPhase_VISIT_PHASE_REQUESTED,
		VisitPhaseTypeShortNameUncommitted: logisticspb.VisitPhase_VISIT_PHASE_UNCOMMITTED,
		VisitPhaseTypeShortNameCommitted:   logisticspb.VisitPhase_VISIT_PHASE_COMMITTED,
		VisitPhaseTypeShortNameEnRoute:     logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
		VisitPhaseTypeShortNameOnScene:     logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
		VisitPhaseTypeShortNameCompleted:   logisticspb.VisitPhase_VISIT_PHASE_COMPLETE,
		VisitPhaseTypeShortNameCancelled:   logisticspb.VisitPhase_VISIT_PHASE_CANCELLED,
	}

	visitPhaseShortNameToPhaseTypeID = map[VisitPhaseShortName]int64{
		// See `20220228221620_create_schedule.sql`.
		VisitPhaseTypeShortNameUncommitted: 1,
		VisitPhaseTypeShortNameCommitted:   2,
		VisitPhaseTypeShortNameEnRoute:     3,
		VisitPhaseTypeShortNameOnScene:     4,
		VisitPhaseTypeShortNameCompleted:   5,
		VisitPhaseTypeShortNameCancelled:   6,
		VisitPhaseTypeShortNameRequested:   7,
	}

	CareRequestStatusNameToPhaseTypeID = map[string]int64{
		// See `20220228221620_create_schedule.sql`.
		"accepted":  1,
		"committed": 2,
		"on_route":  3,
		"on_scene":  4,
		"complete":  5,
		"archived":  6,
		"requested": 7,
	}
	PhaseTypeIDToCareRequestStatusName = func() map[int64]string {
		res := make(map[int64]string)
		for s, id := range CareRequestStatusNameToPhaseTypeID {
			res[id] = s
		}
		return res
	}()

	CareRequestStatusSourceTypeToPhaseSourceTypeID = map[commonpb.CareRequestStatus_SourceType]int64{
		// See `20220228221620_create_schedule.sql`.
		commonpb.CareRequestStatus_SOURCE_TYPE_MANUAL_OPTIMIZER:                 1,
		commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER:                         2,
		commonpb.CareRequestStatus_SOURCE_TYPE_LOGISTICS_ELIXIR_AUTO_ASSIGNMENT: 3,
		commonpb.CareRequestStatus_SOURCE_TYPE_OTHER:                            4,
	}
	StatusSourceTypeToPhaseSourceTypeID = map[commonpb.StatusSourceType]int64{
		commonpb.StatusSourceType_STATUS_SOURCE_TYPE_MANUAL_OPTIMIZER:                 1,
		commonpb.StatusSourceType_STATUS_SOURCE_TYPE_PROVIDER:                         2,
		commonpb.StatusSourceType_STATUS_SOURCE_TYPE_LOGISTICS_ELIXIR_AUTO_ASSIGNMENT: 3,
		commonpb.StatusSourceType_STATUS_SOURCE_TYPE_OTHER:                            4,
	}

	ClinicalUrgencyLevelEnumToID = map[commonpb.ClinicalUrgencyLevel]int64{
		commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH_MANUAL_OVERRIDE: 1,
		commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH:                 2,
		commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_NORMAL:               3,
		commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_LOW:                  4,
	}
	ClinicalUrgencyLevelIDToEnum = func() map[int64]commonpb.ClinicalUrgencyLevel {
		res := make(map[int64]commonpb.ClinicalUrgencyLevel)
		for s, id := range ClinicalUrgencyLevelEnumToID {
			res[id] = s
		}
		return res
	}()

	VisitPhaseToShortNames = func() map[logisticspb.VisitPhase]VisitPhaseShortName {
		res := make(map[logisticspb.VisitPhase]VisitPhaseShortName, len(VisitPhaseShortNameToPhases))
		for k, v := range VisitPhaseShortNameToPhases {
			res[v] = k
		}
		return res
	}()

	VisitPhaseShortNameToScheduleVisitStatus = map[VisitPhaseShortName]*logisticspb.ShiftTeamVisit_Status{
		VisitPhaseTypeShortNameUncommitted: logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
		VisitPhaseTypeShortNameCommitted:   logisticspb.ShiftTeamVisit_STATUS_COMMITTED.Enum(),
		VisitPhaseTypeShortNameEnRoute:     logisticspb.ShiftTeamVisit_STATUS_EN_ROUTE.Enum(),
		VisitPhaseTypeShortNameOnScene:     logisticspb.ShiftTeamVisit_STATUS_ON_SCENE.Enum(),
		VisitPhaseTypeShortNameCompleted:   logisticspb.ShiftTeamVisit_STATUS_COMPLETE.Enum(),
	}
)
