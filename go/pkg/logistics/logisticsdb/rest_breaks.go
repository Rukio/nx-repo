package logisticsdb

import (
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"google.golang.org/protobuf/proto"
)

type restBreaks []restBreak
type restBreak struct {
	basis       *optimizerpb.VRPRestBreak
	shiftTeamID ShiftTeamID
}

func (rbs restBreaks) toVRPRestBreaks() []*optimizerpb.VRPRestBreak {
	if rbs == nil {
		return nil
	}
	res := make([]*optimizerpb.VRPRestBreak, len(rbs))
	for i, rb := range rbs {
		res[i] = rb.basis
	}
	return res
}

func restBreaksForRestBreakRequests(restBreakRequests []*logisticssql.ShiftTeamRestBreakRequest, snapshots []*logisticssql.ShiftTeamSnapshot, cfg UnrequestedRestBreakConfig, snapshotTime time.Time) restBreaks {
	if len(restBreakRequests) == 0 && !cfg.IncludeUnrequestedRestBreaks {
		return nil
	}

	shiftTeamsWithRequestedRestBreak := make(map[ShiftTeamID]bool, len(snapshots))
	snapshotIDIndexByShiftTeamID := make(map[ShiftTeamID]ShiftTeamSnapshotID, len(snapshots))
	for _, snapshot := range snapshots {
		snapshotIDIndexByShiftTeamID[ShiftTeamID(snapshot.ShiftTeamID)] = ShiftTeamSnapshotID(snapshot.ID)
	}
	res := make(restBreaks, 0, len(restBreakRequests)+len(snapshots))
	for _, rbr := range restBreakRequests {
		shiftTeamID := ShiftTeamID(rbr.ShiftTeamID)
		res = append(res, restBreak{
			basis: &optimizerpb.VRPRestBreak{
				Id: proto.Int64(rbr.ID),
				// Using shift team snapshots IDs for shift teams IDs.
				ShiftTeamId:       proto.Int64(int64(snapshotIDIndexByShiftTeamID[shiftTeamID])),
				LocationId:        proto.Int64(rbr.LocationID),
				StartTimestampSec: proto.Int64(rbr.StartTimestampSec),
				DurationSec:       proto.Int64(rbr.DurationSec),
				Unrequested:       proto.Bool(false),
			},
			shiftTeamID: shiftTeamID,
		})
		shiftTeamsWithRequestedRestBreak[shiftTeamID] = true
	}

	if cfg.IncludeUnrequestedRestBreaks {
		for _, snapshot := range snapshots {
			shiftTeamID := ShiftTeamID(snapshot.ShiftTeamID)
			if !shiftTeamsWithRequestedRestBreak[shiftTeamID] && cfg.shouldAddUnrequestedRestBreak(snapshotTime, snapshot) {
				res = append(res, restBreak{
					basis: &optimizerpb.VRPRestBreak{
						Id:          proto.Int64(int64(shiftTeamID)),
						ShiftTeamId: proto.Int64(int64(snapshotIDIndexByShiftTeamID[shiftTeamID])),
						DurationSec: proto.Int64(int64(cfg.RestBreakDuration.Seconds())),
						Unrequested: proto.Bool(true),
					},
					shiftTeamID: shiftTeamID,
				})
			}
		}
	}
	return res
}
