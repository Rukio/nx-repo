package logisticsdb

import (
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
)

type VirtualAPPVisitPhaseShortName string
type VirtualAppVisitPhaseShortNameMap map[logisticspb.VirtualAPPVisitPhase]VirtualAPPVisitPhaseShortName

var (
	VirtualAPPVisitPhaseShortNameToPhases = map[VirtualAPPVisitPhaseShortName]logisticspb.VirtualAPPVisitPhase{
		VirtualAPPVisitPhaseTypeShortNameAssigned:   logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_ASSIGNED,
		VirtualAPPVisitPhaseTypeShortNameUnassigned: logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED,
	}

	VirtualAAPPVisitPhaseShortNameToPhaseTypeID = map[VirtualAPPVisitPhaseShortName]int64{
		VirtualAPPVisitPhaseTypeShortNameUnassigned: 1,
		VirtualAPPVisitPhaseTypeShortNameAssigned:   2,
	}

	VirtualAPPVisitPhaseToShortNames = func() VirtualAppVisitPhaseShortNameMap {
		res := make(map[logisticspb.VirtualAPPVisitPhase]VirtualAPPVisitPhaseShortName, len(VirtualAPPVisitPhaseShortNameToPhases))
		for k, v := range VirtualAPPVisitPhaseShortNameToPhases {
			res[v] = k
		}
		return res
	}()

	// TODO get IDs From DB [LOG-2172].
	VirtualAPPVisitPhaseTypeEnumToID = map[commonpb.VirtualAPPCareRequestStatus_Status]int64{
		commonpb.VirtualAPPCareRequestStatus_STATUS_NAME_UNASSIGNED: 1,
		commonpb.VirtualAPPCareRequestStatus_STATUS_NAME_ASSIGNED:   2,
	}
)
