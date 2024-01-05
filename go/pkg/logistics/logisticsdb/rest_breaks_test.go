package logisticsdb

import (
	"testing"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestRestBreaksForRestBreakRequests(t *testing.T) {
	rbID1 := int64(1)
	rbID2 := int64(2)
	locationID := time.Now().UnixNano()
	shiftTeamID1 := time.Now().UnixNano()
	shiftTeamSnapshotID1 := shiftTeamID1 + 1
	shiftTeamID2 := time.Now().Add(time.Millisecond).UnixNano()
	shiftTeamSnapshotID2 := shiftTeamID2 + 1

	startTimestampSec1 := time.Now().Unix()
	startTimestampSec2 := startTimestampSec1 + 30
	durationSec := int64(30)

	rbrs := []*logisticssql.ShiftTeamRestBreakRequest{
		{ID: rbID1,
			StartTimestampSec: startTimestampSec1,
			DurationSec:       durationSec,
			ShiftTeamID:       shiftTeamID1,
			LocationID:        locationID},
		{ID: rbID2,
			StartTimestampSec: startTimestampSec2,
			DurationSec:       durationSec,
			ShiftTeamID:       shiftTeamID2,
			LocationID:        locationID},
	}
	result := restBreaksForRestBreakRequests(rbrs, []*logisticssql.ShiftTeamSnapshot{
		{ID: shiftTeamSnapshotID1, ShiftTeamID: shiftTeamID1, EndTimestampSec: startTimestampSec2 + durationSec},
		{ID: shiftTeamSnapshotID2, ShiftTeamID: shiftTeamID2, EndTimestampSec: startTimestampSec2 + durationSec},
	},
		UnrequestedRestBreakConfig{},
		time.Unix(startTimestampSec1, 0),
	)
	expected1 := &optimizerpb.VRPRestBreak{
		Id:                proto.Int64(rbID1),
		ShiftTeamId:       proto.Int64(shiftTeamSnapshotID1),
		DurationSec:       proto.Int64(durationSec),
		LocationId:        proto.Int64(locationID),
		StartTimestampSec: proto.Int64(startTimestampSec1),
		Unrequested:       proto.Bool(false),
	}
	expected2 := &optimizerpb.VRPRestBreak{
		Id:                proto.Int64(rbID2),
		ShiftTeamId:       proto.Int64(shiftTeamSnapshotID2),
		DurationSec:       proto.Int64(durationSec),
		LocationId:        proto.Int64(locationID),
		StartTimestampSec: proto.Int64(startTimestampSec2),
		Unrequested:       proto.Bool(false),
	}
	testutils.MustMatch(t, restBreaks{
		{basis: expected1, shiftTeamID: ShiftTeamID(shiftTeamID1)},

		{basis: expected2, shiftTeamID: ShiftTeamID(shiftTeamID2)},
	}, result)

	testutils.MustMatch(t, []*optimizerpb.VRPRestBreak{expected1, expected2}, result.toVRPRestBreaks())
}

func TestRestBreaksForRestBreakRequestsWithUnrequested(t *testing.T) {
	testutils.MustMatch(t, true,
		restBreaksForRestBreakRequests(nil, nil, UnrequestedRestBreakConfig{}, time.Now()) == nil,
	)

	shiftTeamID1 := time.Now().UnixNano()
	shiftTeamSnapshotID1 := shiftTeamID1 + 1
	shiftTeamID2 := time.Now().Add(time.Microsecond).UnixNano()
	shiftTeamSnapshotID2 := shiftTeamID2 + 1
	shiftTeamID3 := time.Now().Add(time.Millisecond).UnixNano()
	shiftTeamSnapshotID3 := shiftTeamID3 + 1
	shiftTeamID4 := time.Now().Add(time.Minute).UnixNano()
	shiftTeamSnapshotID4 := shiftTeamID4 + 1

	startTime := time.Now()
	var rbrs []*logisticssql.ShiftTeamRestBreakRequest
	result := restBreaksForRestBreakRequests(rbrs, []*logisticssql.ShiftTeamSnapshot{
		{ID: shiftTeamSnapshotID1, ShiftTeamID: shiftTeamID1, StartTimestampSec: startTime.Unix(), EndTimestampSec: startTime.Add(2 * time.Minute).Unix()},
		{ID: shiftTeamSnapshotID2, ShiftTeamID: shiftTeamID2, StartTimestampSec: startTime.Unix(), EndTimestampSec: startTime.Add(2 * time.Minute).Unix()},
		{ID: shiftTeamSnapshotID3, ShiftTeamID: shiftTeamID3, StartTimestampSec: startTime.Unix(), EndTimestampSec: startTime.Unix()},
		// start time in the future, the rest break doesn't fit between start and end (but does fit btwn currentTime and end)
		{ID: shiftTeamSnapshotID4, ShiftTeamID: shiftTeamID4, StartTimestampSec: startTime.Add(2 * time.Minute).Unix(), EndTimestampSec: startTime.Add(121 * time.Second).Unix()},
	},
		UnrequestedRestBreakConfig{IncludeUnrequestedRestBreaks: true, RestBreakDuration: time.Minute},
		startTime,
	)
	expected1 := &optimizerpb.VRPRestBreak{
		Id:          proto.Int64(shiftTeamID1),
		ShiftTeamId: proto.Int64(shiftTeamSnapshotID1),
		DurationSec: proto.Int64(60),
		Unrequested: proto.Bool(true),
	}
	expected2 := &optimizerpb.VRPRestBreak{
		Id:          proto.Int64(shiftTeamID2),
		ShiftTeamId: proto.Int64(shiftTeamSnapshotID2),
		DurationSec: proto.Int64(60),
		Unrequested: proto.Bool(true),
	}
	testutils.MustMatch(t, restBreaks{
		{basis: expected1, shiftTeamID: ShiftTeamID(shiftTeamID1)},
		{basis: expected2, shiftTeamID: ShiftTeamID(shiftTeamID2)},
		// the third shift team's rest break would not fit.
	}, result, "no rest break requests means that both unrequested breaks should be there")

	testutils.MustMatch(t, []*optimizerpb.VRPRestBreak{expected1, expected2}, result.toVRPRestBreaks())
}
