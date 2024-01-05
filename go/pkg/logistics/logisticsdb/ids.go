package logisticsdb

import (
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
)

type VisitSnapshotID int64
type CareRequestID int64

func (v VisitSnapshotID) isCheckFeasibilityVisitSnapshotID() bool {
	return v < 0
}

func (c CareRequestID) Int64() int64 {
	return int64(c)
}

func (s ShiftTeamID) Int64() int64 {
	return int64(s)
}

type ShiftTeamSnapshotID int64
type ShiftTeamID int64
type EntityIDPair struct {
	ShiftTeamID
	CareRequestID
}
type stopLocations struct {
	visitLocations     map[VisitSnapshotID]int64
	restBreakLocations map[int64]int64

	visits     []*optimizerpb.VRPVisit
	restBreaks restBreaks
}

func newStopLocations(visits []*optimizerpb.VRPVisit, rbs restBreaks) stopLocations {
	visitLocations := make(map[VisitSnapshotID]int64, len(visits))
	restBreakLocations := make(map[int64]int64, len(rbs))
	for _, visit := range visits {
		visitLocations[VisitSnapshotID(visit.GetId())] = visit.GetLocationId()
	}
	for _, rb := range rbs {
		restBreakLocations[rb.basis.GetId()] = rb.basis.GetLocationId()
	}
	return stopLocations{
		visitLocations:     visitLocations,
		restBreakLocations: restBreakLocations,
		visits:             visits,
		restBreaks:         rbs,
	}
}
