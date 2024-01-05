package logisticsdb

import (
	"database/sql"
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestToRouteStop(t *testing.T) {
	visitLocID := time.Now().UnixNano()
	restBreakLocID := time.Now().Add(time.Millisecond).UnixNano()
	location := &logisticssql.Location{ID: time.Now().UnixNano(), LatitudeE6: 10, LongitudeE6: 15, CreatedAt: time.Now()}
	location2 := &logisticssql.Location{ID: time.Now().UnixNano(), LatitudeE6: 20, LongitudeE6: 25, CreatedAt: time.Now()}

	testRow := &logisticssql.GetScheduleRouteStopsForScheduleRow{
		ID:                            1,
		ScheduleID:                    2,
		ScheduleRouteID:               3,
		RouteIndex:                    4,
		ScheduleVisitID:               sql.NullInt64{Valid: true, Int64: 5},
		ScheduleRestBreakID:           sql.NullInt64{Valid: true, Int64: 6},
		CreatedAt:                     time.Now(),
		BreakRequestStartTimestampSec: sql.NullInt64{Valid: true, Int64: 7},
		BreakRequestID:                sql.NullInt64{Valid: true, Int64: 8},
		BreakRequestDurationSec:       sql.NullInt64{Valid: true, Int64: 9},
		BreakRequestLocationID:        sql.NullInt64{Valid: true, Int64: restBreakLocID},
		ArrivalTimestampSec:           sql.NullInt64{Valid: true, Int64: 11},
		VisitSnapshotID:               sql.NullInt64{Valid: true, Int64: 12},
		DepotArrivalTimestampSec:      13,
		VisitPhaseShortName:           sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
		CareRequestID:                 sql.NullInt64{Valid: true, Int64: 14},
		ArrivalStartTimestampSec:      sql.NullInt64{Valid: true, Int64: 15},
		ArrivalEndTimestampSec:        sql.NullInt64{Valid: true, Int64: 17},
		ServiceDurationSec:            sql.NullInt64{Valid: true, Int64: 16},
		VisitLocationID:               sql.NullInt64{Valid: true, Int64: visitLocID},
		VisitClinicalUrgencyWindowSec: sql.NullInt64{Valid: true, Int64: 100},
		VisitClinicalUrgencyLevelID:   sql.NullInt64{Valid: true, Int64: 100},
	}

	_, err := toRouteStop(toRouteStopParams{
		row:                        testRow,
		visitExtraSetupDurationSec: 0,
		locIndex:                   map[int64]*logisticssql.Location{visitLocID: location, restBreakLocID: location2},
	})
	testutils.MustMatch(t, true, err == nil, errString(err))
	testutils.MustMatch(t, true, validateVisitRouteStop(testRow) == nil, "valid visit row")
	testutils.MustMatch(t, true, validateRestBreakRouteStop(testRow) == nil, "valid rest break row")

	fullyInitialized := &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
		ID:                            testRow.ID,
		ScheduleID:                    testRow.ScheduleID,
		ScheduleRouteID:               testRow.ScheduleRouteID,
		RouteIndex:                    testRow.RouteIndex,
		ScheduleVisitID:               testRow.ScheduleVisitID,
		ScheduleRestBreakID:           testRow.ScheduleRestBreakID,
		CreatedAt:                     testRow.CreatedAt,
		BreakRequestStartTimestampSec: testRow.BreakRequestStartTimestampSec,
		BreakRequestID:                testRow.BreakRequestID,
		BreakRequestDurationSec:       testRow.BreakRequestDurationSec,
		BreakRequestLocationID:        testRow.BreakRequestLocationID,
		ArrivalTimestampSec:           testRow.ArrivalTimestampSec,
		VisitSnapshotID:               testRow.VisitSnapshotID,
		DepotArrivalTimestampSec:      testRow.DepotArrivalTimestampSec,
		VisitPhaseShortName:           testRow.VisitPhaseShortName,
		CareRequestID:                 testRow.CareRequestID,
		ArrivalStartTimestampSec:      testRow.ArrivalStartTimestampSec,
		ArrivalEndTimestampSec:        testRow.ArrivalEndTimestampSec,
		ServiceDurationSec:            testRow.ServiceDurationSec,
		VisitLocationID:               testRow.VisitLocationID,
		VisitClinicalUrgencyWindowSec: testRow.VisitClinicalUrgencyWindowSec,
		VisitClinicalUrgencyLevelID:   testRow.VisitClinicalUrgencyLevelID,
	}
	mappedRow := toScheduleRouteIDRow(testRow)
	testutils.MustMatch(t, fullyInitialized, mappedRow, "new fields should map exactly")

	// and check that no new fields slip in unhandled ;)
	orig := reflect.ValueOf(*fullyInitialized)
	v := reflect.ValueOf(*mappedRow)
	var checkInitialized = func(value reflect.Value, n string) {
		if value.IsZero() {
			t.Fatalf("field(%s) must be initialized to a non-zero value above to properly test the mapping", n)
		}
	}

	for i := 0; i < v.NumField(); i++ {
		switch n := v.Type().Field(i).Name; n {
		case "CreatedAt":
			// we don't care that these fields are copied
			continue
		case "ID", "ScheduleID", "ScheduleRouteID", "RouteIndex", "DepotArrivalTimestampSec":
			// int types that we demand be copied appropriately, and non-zero
			checkInitialized(v.Field(i), n)
			if v.Field(i).Int() != orig.Field(i).Int() {
				t.Fatalf("field(%s) not mapped correctly", n)
			}
		case "ScheduleVisitID", "ScheduleRestBreakID", "BreakRequestStartTimestampSec", "BreakRequestID", "BreakRequestDurationSec", "BreakRequestLocationID", "ArrivalTimestampSec", "VisitSnapshotID", "CareRequestID", "ArrivalStartTimestampSec", "ArrivalEndTimestampSec", "ServiceDurationSec", "VisitLocationID", "VisitClinicalUrgencyWindowSec", "VisitClinicalUrgencyLevelID":
			checkInitialized(v.Field(i), n)
			if v.Field(i).Field(0).Int() != orig.Field(i).Field(0).Int() {
				t.Fatalf("nullable field int value(%s) not mapped directly", n)
			}
			if v.Field(i).Field(1).Bool() != orig.Field(i).Field(1).Bool() {
				t.Fatalf("nullable field(%s) not mapped directly", n)
			}
		case "VisitPhaseShortName":
			checkInitialized(v.Field(i), n)
			if v.Field(i).Field(0).String() != orig.Field(i).Field(0).String() {
				t.Fatalf("nullable field string value(%s) not mapped directly", n)
			}
			if v.Field(i).Field(1).Bool() != orig.Field(i).Field(1).Bool() {
				t.Fatalf("nullable field(%s) not mapped directly", n)
			}
		default:
			t.Fatalf("unspecified new column name must be tested %s", n)
		}
	}
}

func errString(err error) string {
	if err == nil {
		return "nil"
	}
	return err.Error()
}

func TestValidateRestBreakRouteStop(t *testing.T) {
	for _, tc := range []struct {
		Desc          string
		Row           *logisticssql.GetScheduleRouteStopsForScheduleRow
		ExpectedError bool
	}{
		{Desc: "base case",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleRestBreakID:     sql.NullInt64{Valid: true},
				BreakRequestID:          sql.NullInt64{Valid: true},
				BreakRequestLocationID:  sql.NullInt64{Valid: true},
				BreakRequestDurationSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: false,
		},
		{Desc: "invalid ScheduleRestBreakID",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleRestBreakID:     sql.NullInt64{Valid: false},
				BreakRequestID:          sql.NullInt64{Valid: true},
				BreakRequestLocationID:  sql.NullInt64{Valid: true},
				BreakRequestDurationSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
		{Desc: "invalid BreakRequestID",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleRestBreakID:     sql.NullInt64{Valid: true},
				BreakRequestID:          sql.NullInt64{Valid: false},
				BreakRequestLocationID:  sql.NullInt64{Valid: true},
				BreakRequestDurationSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
		{Desc: "invalid BreakRequestLocationID",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleRestBreakID:     sql.NullInt64{Valid: true},
				BreakRequestID:          sql.NullInt64{Valid: true},
				BreakRequestLocationID:  sql.NullInt64{Valid: false},
				BreakRequestDurationSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
		{Desc: "invalid BreakRequestDurationSec",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleRestBreakID:     sql.NullInt64{Valid: true},
				BreakRequestID:          sql.NullInt64{Valid: true},
				BreakRequestLocationID:  sql.NullInt64{Valid: true},
				BreakRequestDurationSec: sql.NullInt64{Valid: false},
			},
			ExpectedError: true,
		},
	} {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.ExpectedError, validateRestBreakRouteStop(tc.Row) != nil)
		})
	}
}

func TestValidateVisitRouteStop(t *testing.T) {
	for _, tc := range []struct {
		Desc          string
		Row           *logisticssql.GetScheduleRouteStopsForScheduleRow
		ExpectedError bool
	}{
		{Desc: "base case",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleVisitID:     sql.NullInt64{Valid: true},
				VisitPhaseShortName: sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				VisitSnapshotID:     sql.NullInt64{Valid: true},
				ArrivalTimestampSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: false,
		},
		{Desc: "invalid ScheduleVisitID",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleVisitID:     sql.NullInt64{Valid: false},
				VisitPhaseShortName: sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				VisitSnapshotID:     sql.NullInt64{Valid: true},
				ArrivalTimestampSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
		{Desc: "invalid VisitSnapshotID",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleVisitID:     sql.NullInt64{Valid: true},
				VisitPhaseShortName: sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				VisitSnapshotID:     sql.NullInt64{Valid: false},
				ArrivalTimestampSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
		{Desc: "invalid ArrivalTimestampSec",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleVisitID:     sql.NullInt64{Valid: true},
				VisitPhaseShortName: sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				VisitSnapshotID:     sql.NullInt64{Valid: true},
				ArrivalTimestampSec: sql.NullInt64{Valid: false},
			},
			ExpectedError: true,
		},
		{Desc: "invalid VisitPhaseShortName",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleVisitID:     sql.NullInt64{Valid: true},
				VisitPhaseShortName: sql.NullString{Valid: false},
				VisitSnapshotID:     sql.NullInt64{Valid: true},
				ArrivalTimestampSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
		{Desc: "invalid VisitPhaseShortName - bad data",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRow{
				ScheduleVisitID:     sql.NullInt64{Valid: true},
				VisitPhaseShortName: sql.NullString{Valid: true, String: "bad-data"},
				VisitSnapshotID:     sql.NullInt64{Valid: true},
				ArrivalTimestampSec: sql.NullInt64{Valid: true},
			},
			ExpectedError: true,
		},
	} {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.ExpectedError, validateVisitRouteStop(tc.Row) != nil)
		})
	}
}

func TestToShiftTeamRouteStopInvalidRow(t *testing.T) {
	locationID := int64(1)
	validRow := &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
		ScheduleVisitID:          sql.NullInt64{Valid: true},
		VisitPhaseShortName:      sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
		VisitLocationID:          sql.NullInt64{Valid: true, Int64: locationID},
		ArrivalTimestampSec:      sql.NullInt64{Valid: true},
		ArrivalStartTimestampSec: sql.NullInt64{Valid: true},
		ServiceDurationSec:       sql.NullInt64{Valid: true},
	}
	locationIndex := map[int64]*logisticssql.Location{locationID: {LatitudeE6: 1, LongitudeE6: 2}}

	_, err := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        validRow,
		visitExtraSetupDurationSec: 0,
		locationIndex:              locationIndex,
	})
	if err != nil {
		t.Fatal(err)
	}

	cc := *validRow
	cc.VisitPhaseShortName.Valid = false
	invalidRowNotValidShortName := cc

	_, err1 := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        &invalidRowNotValidShortName,
		visitExtraSetupDurationSec: 0,
		locationIndex:              locationIndex,
	})
	if err1 == nil {
		t.Fatal("NULL short name results in an error")
	}

	cc = *validRow
	cc.VisitPhaseShortName.String = "invalid_short_name"
	invalidRowBadStatus := cc
	_, err2 := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        &invalidRowBadStatus,
		visitExtraSetupDurationSec: 0,
		locationIndex:              locationIndex,
	})
	if err2 == nil {
		t.Fatal("invalid short name results in another error")
	}
	if err1.Error() == err2.Error() {
		t.Fatal("but they should be different errors", err1, err2)
	}

	cc = *validRow
	cc.ArrivalStartTimestampSec.Valid = false
	noArrivalStartTimestampsec := cc
	_, err3 := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        &noArrivalStartTimestampsec,
		visitExtraSetupDurationSec: 0,
		locationIndex:              locationIndex,
	})
	if err3 == nil {
		t.Fatal("invalid arrival start timestamp should return error")
	}

	cc = *validRow
	cc.ArrivalTimestampSec.Valid = false
	noArrivalTimestampsec := cc
	_, err4 := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        &noArrivalTimestampsec,
		visitExtraSetupDurationSec: 0,
		locationIndex:              locationIndex,
	})
	if err4 == nil {
		t.Fatal("invalid arrival timestamp should return error")
	}

	cc = *validRow
	cc.ServiceDurationSec.Valid = false
	noServiceDurationSec := cc
	_, err5 := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        &noServiceDurationSec,
		visitExtraSetupDurationSec: 0,
		locationIndex:              locationIndex,
	})
	if err5 == nil {
		t.Fatal("invalid service duration should return error")
	}
}

func TestToShiftTeamRouteStop_ExhaustiveStopTypeHandling(t *testing.T) {
	locationID := time.Now().UnixNano()

	testutils.AssertExhaustiveOneOfMapping(t,
		&logisticspb.ShiftTeamRouteStop{},
		"stop", []string{"visit", "rest_break"},
		"for a new type of route stop, one must explicitly determine how to handle it"+
			" in the switch statement in toShiftTeamRouteStop",
	)

	for _, tc := range []struct {
		Desc          string
		Row           *logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow
		ExpectedError bool
	}{
		{
			Desc: "invalid row, unknown stop type",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
				VisitPhaseShortName: sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()}},
			ExpectedError: true,
		},
		{
			Desc: "valid row, visit stop type",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
				ScheduleVisitID:          sql.NullInt64{Valid: true},
				VisitPhaseShortName:      sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				VisitLocationID:          sql.NullInt64{Valid: true, Int64: locationID},
				ArrivalTimestampSec:      sql.NullInt64{Valid: true},
				ArrivalStartTimestampSec: sql.NullInt64{Valid: true},
				ServiceDurationSec:       sql.NullInt64{Valid: true},
			},
		},
		{
			Desc: "valid row, rest break stop type",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
				ScheduleRestBreakID:    sql.NullInt64{Valid: true},
				VisitPhaseShortName:    sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				BreakRequestLocationID: sql.NullInt64{Valid: true, Int64: locationID},
			},
		},
		{
			Desc: "invalid row, missing location, visit stop type",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
				ScheduleVisitID:     sql.NullInt64{Valid: true},
				VisitPhaseShortName: sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				VisitLocationID:     sql.NullInt64{Valid: false, Int64: locationID},
			},
			ExpectedError: true,
		},
		{
			Desc: "invalid row, missing location, rest break stop type",
			Row: &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
				ScheduleRestBreakID:    sql.NullInt64{Valid: true},
				VisitPhaseShortName:    sql.NullString{Valid: true, String: VisitPhaseTypeShortNameUncommitted.String()},
				BreakRequestLocationID: sql.NullInt64{Valid: false, Int64: locationID},
			},
			ExpectedError: true,
		},
	} {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			_, err := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
				row:                        tc.Row,
				visitExtraSetupDurationSec: 0,
				locationIndex:              map[int64]*logisticssql.Location{locationID: {LatitudeE6: 1, LongitudeE6: 2}},
			})
			errString := ""
			if err != nil {
				errString = err.Error()
			}
			testutils.MustMatch(t, tc.ExpectedError, err != nil, errString)
		})
	}
}

func Test_reconcileUnassignedVisits(t *testing.T) {
	careRequestIDsFromVisitIDs := []*logisticssql.GetCareRequestIDsAndPhasesFromVisitIDsRow{
		{
			CareRequestID:           123,
			VisitSnapshotID:         1,
			VisitPhaseTypeShortName: VisitPhaseTypeShortNameUncommitted.String(),
		},
		{
			CareRequestID:           456,
			VisitSnapshotID:         2,
			VisitPhaseTypeShortName: VisitPhaseTypeShortNameUncommitted.String(),
		},
		{
			CareRequestID:           123,
			VisitSnapshotID:         3,
			VisitPhaseTypeShortName: VisitPhaseTypeShortNameUncommitted.String(),
		},
		{
			CareRequestID:           789,
			VisitSnapshotID:         4,
			VisitPhaseTypeShortName: VisitPhaseTypeShortNameUncommitted.String(),
		},
		{
			CareRequestID:           time.Now().UnixNano(),
			VisitSnapshotID:         5,
			VisitPhaseTypeShortName: VisitPhaseTypeShortNameUncommitted.String(),
		},
		{
			CareRequestID:           time.Now().UnixNano(),
			VisitSnapshotID:         6,
			VisitPhaseTypeShortName: VisitPhaseTypeShortNameUncommitted.String(),
		},
	}

	currentVisits := []*optimizerpb.VRPVisit{
		// 1 --> 3; the newer visit for care request 123.
		// 2 does not exist anymore!
		{Id: proto.Int64(3)},
		{Id: proto.Int64(4)},
		{Id: proto.Int64(5)}, // will also show up in shift team route history
		{Id: proto.Int64(6)}, // will also show up in shift team upcoming commitment
	}

	r, err := newSnapshotIDReconcilerImpl(careRequestIDsFromVisitIDs, currentVisits, nil, CareRequestActuals{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	reconciled := r.ReconcileUnassignedVisits([]*optimizerpb.VRPUnassignedVisit{
		{VisitId: proto.Int64(1)}, // should be coerced to 3.
		{VisitId: proto.Int64(2)}, // should be removed
		{VisitId: proto.Int64(4)}, // should remain.
		{VisitId: proto.Int64(5)}, // should be removed.
		{VisitId: proto.Int64(6)}, // should be removed.
	}, []*optimizerpb.VRPShiftTeam{
		{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
			Stops: []*optimizerpb.VRPShiftTeamRouteStop{{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
				Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(5)}}}},
		},
			UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{Commitments: []*optimizerpb.VRPShiftTeamCommitment{
				{VisitId: proto.Int64(6)}}}},
	})

	want := []*optimizerpb.VRPUnassignedVisit{
		{VisitId: proto.Int64(3)},
		{VisitId: proto.Int64(4)},
	}

	testutils.MustMatch(t, want, reconciled, "non-current 2 should be removed, 1 should be replaced by fresher 3. 5 and 6 should be removed since theyre in the shift team")
}

func TestPendingUpdatesForSchedules(t *testing.T) {
	testutils.AssertExhaustiveOneOfMapping(t,
		&logisticspb.ShiftTeamRestBreakRequest{},
		"break_type", []string{"on_demand"},
		"for a new type of rest break, one must explicitly determine how to handle it"+
			" in mapping out to the pending updates for schedules",
	)

	now := time.Now()
	pendingRestBreakID := now.Add(time.Millisecond).UnixNano()
	incorporatedRestBreakID := now.Add(2 * time.Millisecond).UnixNano()
	pendingShiftTeamID := now.Add(3 * time.Millisecond).UnixNano()
	incorporatedShiftTeamID := now.Add(4 * time.Millisecond).UnixNano()

	restBreakRequests := []*logisticssql.ShiftTeamRestBreakRequest{
		{ID: pendingRestBreakID, ShiftTeamID: pendingShiftTeamID},
		{ID: incorporatedRestBreakID, ShiftTeamID: incorporatedShiftTeamID},
	}
	schedules := []*logisticspb.ShiftTeamSchedule{
		{ShiftTeamId: pendingShiftTeamID},
		{ShiftTeamId: incorporatedShiftTeamID, Route: &logisticspb.ShiftTeamRoute{
			Stops: []*logisticspb.ShiftTeamRouteStop{
				{Stop: &logisticspb.ShiftTeamRouteStop_RestBreak{
					RestBreak: &logisticspb.ShiftTeamRestBreak{RestBreakId: incorporatedRestBreakID},
				}},
			},
		}},
	}
	pendingRestBreakRequests := pendingRestBreakUpdatesForSchedules(schedules, restBreakRequests)
	testutils.MustMatch(t, 1, len(pendingRestBreakRequests), "one break request is still pending")
	testutils.MustMatch(t, pendingShiftTeamID, pendingRestBreakRequests[0].GetShiftTeamId(), "and its for the right shift team")
}

func TestVisitPhaseTypeIDForStatusName(t *testing.T) {
	// TestCareRequestStatusToPhaseTypeID tests the meat of the logic, this is a coverage hack.
	_, err := visitPhaseTypeIDForStatusName("nonsense-status")
	testutils.MustMatch(t, true, err != nil)
}

func TestVisitPhaseSourceTypeIDForEpisodeEnum(t *testing.T) {
	// TestCareRequestStatusSourceTypeToPhaseSourceTypeID_Exhaustive tests the meat of the logic, this is a coverage hack.
	_, err := visitPhaseSourceTypeIDForEpisodeEnum(9999999)
	testutils.MustMatch(t, true, err != nil, "an enum value not in the map should error")
}

func TestVRPVisitsForVisitSnapshots(t *testing.T) {
	preferredNonManualOverrideName := "2p"
	completionValueCents := int64(123)
	partnerPriorityScore := int64(456)
	partnerInfluencedCompletionValueCents := int64(456)
	visitExtraSetupDurationSec := int64(1)

	manualOverrideNoVisitValueVisitSnapshot := &logisticssql.GetLatestVisitSnapshotsInRegionRow{
		ID:                       1,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
		IsManualOverride:         true,
	}
	manualOverrideWithVisitValueVisitSnapshot := &logisticssql.GetLatestVisitSnapshotsInRegionRow{
		ID:                       1,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
		IsManualOverride:         true,
		CompletionValueCents:     sqltypes.ToValidNullInt64(completionValueCents),
		PartnerPriorityScore:     sqltypes.ToValidNullInt64(partnerPriorityScore),
	}
	manualOverrideWithPartnerInfluencedVisitValueVisitSnapshot := &logisticssql.GetLatestVisitSnapshotsInRegionRow{
		ID:                                    1,
		ArrivalStartTimestampSec:              sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:                sqltypes.ToValidNullInt64(1),
		IsManualOverride:                      true,
		CompletionValueCents:                  sqltypes.ToValidNullInt64(completionValueCents),
		PartnerPriorityScore:                  sqltypes.ToValidNullInt64(partnerPriorityScore),
		PartnerInfluencedCompletionValueCents: sqltypes.ToValidNullInt64(partnerInfluencedCompletionValueCents),
	}
	prioritizedVisitSnapshot := &logisticssql.GetLatestVisitSnapshotsInRegionRow{
		ID:                       2,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
		IsPrioritized:            true,
	}

	tcs := []struct {
		desc          string
		snapshots     []*logisticssql.GetLatestVisitSnapshotsInRegionRow
		attrs         []*logisticssql.GetAttributesForVisitSnapshotsRow
		useVisitValue bool
	}{
		{
			desc: "manual override and prioritized",
			snapshots: []*logisticssql.GetLatestVisitSnapshotsInRegionRow{
				manualOverrideNoVisitValueVisitSnapshot,
				prioritizedVisitSnapshot,
			},
			attrs: []*logisticssql.GetAttributesForVisitSnapshotsRow{
				{VisitSnapshotID: 1, IsPreferred: true, Name: "1p"},
				{VisitSnapshotID: 2, IsPreferred: true, Name: preferredNonManualOverrideName},
			},
		},
		{
			desc: "use visit value",
			snapshots: []*logisticssql.GetLatestVisitSnapshotsInRegionRow{
				manualOverrideNoVisitValueVisitSnapshot,
				manualOverrideWithVisitValueVisitSnapshot,
			},
			useVisitValue: true,
		},
		{
			desc: "use visit value with PartnerInfluencedCompletionValueCents",
			snapshots: []*logisticssql.GetLatestVisitSnapshotsInRegionRow{
				manualOverrideNoVisitValueVisitSnapshot,
				manualOverrideWithPartnerInfluencedVisitValueVisitSnapshot,
			},
			useVisitValue: true,
		},
		{
			desc: "do not use visit value",
			snapshots: []*logisticssql.GetLatestVisitSnapshotsInRegionRow{
				manualOverrideNoVisitValueVisitSnapshot,
				manualOverrideWithVisitValueVisitSnapshot,
			},
			useVisitValue: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			visits, err := vrpVisitsForVisitSnapshots(vrpVisitsForVisitSnapshotsParams{
				visitSnapshots:             tc.snapshots,
				attrs:                      tc.attrs,
				visitExtraSetupDurationSec: visitExtraSetupDurationSec,
				useVisitValue:              tc.useVisitValue,
			})
			if err != nil {
				t.Fatal(err)
			}

			for i, snapshot := range tc.snapshots {
				visit := visits[i]
				if snapshot.IsManualOverride {
					testutils.MustMatch(t, []*optimizerpb.VRPAttribute(nil), visit.RequiredAttributes, "manual override should not include preferred as required")
				} else {
					testutils.MustMatch(t, []*optimizerpb.VRPAttribute{{Id: preferredNonManualOverrideName}}, visit.RequiredAttributes, "otherwise include preferred as required")
				}

				if !snapshot.IsPrioritized {
					testutils.MustMatch(t, true, visit.Priority == nil, "the non-prioritized visit should not have priority info")
				}

				testutils.MustMatch(t, &visitExtraSetupDurationSec, visit.ExtraSetupDurationSec, fmt.Sprintf("extra setup duration does not match for visit: %d", visit.Id))

				if tc.useVisitValue {
					var completionValueCents *int64
					if snapshot.PartnerInfluencedCompletionValueCents.Valid {
						completionValueCents = sqltypes.ToProtoInt64(snapshot.PartnerInfluencedCompletionValueCents)
					} else {
						completionValueCents = sqltypes.ToProtoInt64(snapshot.CompletionValueCents)
					}
					testutils.MustMatch(t, &optimizerpb.VRPVisitValue{
						CompletionValueCents: completionValueCents,
						PartnerPriorityScore: sqltypes.ToProtoInt64(snapshot.PartnerPriorityScore),
					},
						visit.Value,
						"if useVisitValue is true, the VRPVisitValue should match the visit value snapshot",
					)
				} else {
					testutils.MustMatch(t, true, visit.Value == nil, "if useVisitValue is false, the VRPVisit should not include a VRPVisitValue")
				}
			}
		})
	}
}

func TestLogisticsDBWithScope(t *testing.T) {
	mockScope := monitoring.NewMockScope()
	ldb := &LogisticsDB{scope: mockScope, queries: &logisticssql.Queries{}}
	copied := ldb.WithScope(monitoring.Tags{}, monitoring.Fields{})
	testutils.MustMatch(t, true, copied.queries != nil)
}

func TestSetCurrentPositionForLatestStopWithActualArrival_ExhaustiveStopType(t *testing.T) {
	testutils.AssertExhaustiveOneOfMapping(t,
		&logisticspb.ShiftTeamRouteStop{},
		"stop", []string{"visit", "rest_break"},
		"for a new type of route stop, one must explicitly determine how to handle it"+
			" in the switch statement in currentPositionForLatestStopWithActualArrivalOrCompletion",
	)

	depotLocationID := time.Now().UnixNano()
	now := time.Now()
	visitID := time.Now().UnixNano()
	visitLocationID := time.Now().UnixNano()
	restBreakID := time.Now().UnixNano()
	restBreakLocationID := time.Now().UnixNano()
	completionTimeSec := proto.Int64(time.Now().Add(-time.Minute).Unix())
	enrouteVisitID := time.Now().Add(time.Hour).UnixNano()
	enrouteTimestamp := time.Now().Add(time.Minute)

	for _, tc := range []struct {
		Desc                    string
		ShiftTeam               *optimizerpb.VRPShiftTeam
		ExpectedCurrentPosition *optimizerpb.VRPShiftTeamPosition
	}{
		{
			Desc: "visit stop with actual",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                    &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: &visitID}},
					ActualStartTimestampSec: proto.Int64(time.Now().Unix()),
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				LocationId:        visitLocationID,
				KnownTimestampSec: now.Unix(),
			},
		},
		{
			Desc: "visit stop with actual and completed",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                         &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: &visitID}},
					ActualStartTimestampSec:      proto.Int64(time.Now().Unix()),
					ActualCompletionTimestampSec: completionTimeSec,
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				LocationId: visitLocationID,
				// no next stop -- so time ticks
				KnownTimestampSec: now.Unix(),
			},
		},
		{
			Desc: "rest break stop with actual",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                    &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: &restBreakID}},
					ActualStartTimestampSec: proto.Int64(time.Now().Unix()),
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				LocationId:        restBreakLocationID,
				KnownTimestampSec: now.Unix(),
			},
		},
		{
			Desc: "two stops with actual, take latest visit",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                         &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: &restBreakID}},
					ActualStartTimestampSec:      proto.Int64(time.Now().Add(-2 * time.Minute).Unix()),
					ActualCompletionTimestampSec: completionTimeSec,
				},
				{
					Stop:                    &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: &visitID}},
					ActualStartTimestampSec: proto.Int64(time.Now().Add(-time.Minute).Unix()),
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				// the visit location should be used
				LocationId: visitLocationID,
				// we're between the visit's actual arrival and its uncompleted stat -- so we use "now".
				KnownTimestampSec: now.Unix(),
			},
		},
		{
			Desc: "two stops with actual completion, final has invalid no start... take latest visit",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                         &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: &restBreakID}},
					ActualStartTimestampSec:      proto.Int64(time.Now().Add(-2 * time.Minute).Unix()),
					ActualCompletionTimestampSec: completionTimeSec,
				},
				{
					Stop:                         &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: &visitID}},
					ActualCompletionTimestampSec: completionTimeSec,
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				// the visit location should be used
				LocationId: visitLocationID,
				// we're between the visit's actual arrival and its uncompleted stat -- so we use "now".
				KnownTimestampSec: now.Unix(),
			},
		},
		{
			Desc: "actual no actual, not enroute",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                         &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: &restBreakID}},
					ActualStartTimestampSec:      proto.Int64(time.Now().Add(-2 * time.Minute).Unix()),
					ActualCompletionTimestampSec: completionTimeSec,
				},
				{
					Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: &visitID}},
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				// the first stop's location (rest break) should be used
				LocationId: restBreakLocationID,
				// we tick time when we're not en-route
				KnownTimestampSec: now.Unix(),
			},
		},
		{
			Desc: "actual no actual, enroute to second stop",
			ShiftTeam: &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
				{
					Stop:                         &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: &restBreakID}},
					ActualStartTimestampSec:      proto.Int64(time.Now().Add(-2 * time.Minute).Unix()),
					ActualCompletionTimestampSec: completionTimeSec,
				},
				{
					Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: &enrouteVisitID}},
				},
			}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{
				// the first stop's location (rest break) should be used
				LocationId: restBreakLocationID,
				// we use the en-route timestamp.
				KnownTimestampSec: enrouteTimestamp.Unix(),
			},
		},
		{
			Desc: "no stops with actual",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocationID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
					{
						Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: &restBreakID}},
					},
				}}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: depotLocationID, KnownTimestampSec: now.Unix()},
		},
		{
			Desc: "no stops at all",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocationID),
				RouteHistory:    &optimizerpb.VRPShiftTeamRouteHistory{Stops: nil}},
			ExpectedCurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: depotLocationID, KnownTimestampSec: now.Unix()},
		},
	} {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			r := snapshotIDReconciler{
				latestSnapshotTime: now,
				stopLocations: stopLocations{
					restBreakLocations: map[int64]int64{restBreakID: restBreakLocationID},
					visitLocations:     map[VisitSnapshotID]int64{VisitSnapshotID(visitID): visitLocationID},
				},
				visitIDToCareRequestID: map[VisitSnapshotID]CareRequestID{VisitSnapshotID(enrouteVisitID): CareRequestID(enrouteVisitID)},
				careRequestActuals: CareRequestActuals{
					CurrentlyEnRouteTimes: map[CareRequestID]time.Time{CareRequestID(enrouteVisitID): enrouteTimestamp},
				},
				visitIDToPhaseTypeShortName: map[VisitSnapshotID]VisitPhaseShortName{VisitSnapshotID(enrouteVisitID): VisitPhaseTypeShortNameEnRoute},
			}
			testutils.MustMatch(t, true, tc.ShiftTeam.GetRoute().GetCurrentPosition() == nil)
			err := r.annotateRouteHistoryCurrentPositions([]*optimizerpb.VRPShiftTeam{tc.ShiftTeam})
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.ExpectedCurrentPosition, tc.ShiftTeam.GetRouteHistory().GetCurrentPosition())
		})
	}
}

func TestAllMatrixRequestsEmpty(t *testing.T) {
	nonEmpty := &RectDistancesReq{FromLocationIDs: []int64{1}, ToLocationIDs: []int64{2}}
	emptyNoFrom := &RectDistancesReq{ToLocationIDs: []int64{2}}
	emptyNoTo := &RectDistancesReq{FromLocationIDs: []int64{1}}

	tcs := []struct {
		Desc     string
		Matrices []DistanceMatrixRequest

		ExpectedResult bool
	}{
		{
			Desc:           "no input base case is all empty",
			Matrices:       nil,
			ExpectedResult: true,
		},
		{
			Desc:           "empty+empty -> all empty",
			Matrices:       []DistanceMatrixRequest{emptyNoFrom, emptyNoTo},
			ExpectedResult: true,
		},
		{
			Desc:           "empty+non -> not all empty",
			Matrices:       []DistanceMatrixRequest{emptyNoFrom, nonEmpty},
			ExpectedResult: false,
		},
		{
			Desc:           "non+empty -> not all empty",
			Matrices:       []DistanceMatrixRequest{nonEmpty, emptyNoTo},
			ExpectedResult: false,
		},
		{
			Desc:           "non+non -> not all empty",
			Matrices:       []DistanceMatrixRequest{nonEmpty, nonEmpty},
			ExpectedResult: false,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.ExpectedResult, allDistanceMatrixRequestsEmpty(tc.Matrices))
		})
	}
}
func TestSnapshotReconciler_Validate(t *testing.T) {
	visitID := VisitSnapshotID(time.Now().UnixNano())
	careRequestID := CareRequestID(time.Now().UnixNano())
	tcs := []struct {
		Desc       string
		Reconciler *snapshotIDReconciler

		HasError bool
	}{
		{
			Desc:       "empty base case",
			Reconciler: &snapshotIDReconciler{},
		},
		{
			Desc: "simple base case with check feasibility skipped",
			Reconciler: &snapshotIDReconciler{
				canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{
					careRequestID:                        {Id: proto.Int64(int64(visitID))},
					CareRequestID(time.Now().UnixNano()): {Id: proto.Int64(-1)},
				},
				visitIDToPhaseTypeShortName: map[VisitSnapshotID]VisitPhaseShortName{visitID: VisitPhaseTypeShortNameEnRoute},
				visitIDToCareRequestID:      map[VisitSnapshotID]CareRequestID{visitID: careRequestID},
				careRequestActuals:          CareRequestActuals{CurrentlyEnRouteTimes: map[CareRequestID]time.Time{careRequestID: time.Now()}},
			},
		},
		{
			Desc: "missing short name is invalid",
			Reconciler: &snapshotIDReconciler{
				canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{careRequestID: {Id: proto.Int64(int64(visitID))}},
				visitIDToCareRequestID:           map[VisitSnapshotID]CareRequestID{visitID: careRequestID},
				careRequestActuals:               CareRequestActuals{CurrentlyEnRouteTimes: map[CareRequestID]time.Time{careRequestID: time.Now()}},
			},

			HasError: true,
		},
		{
			Desc: "inconsistent CR ID is invalid",
			Reconciler: &snapshotIDReconciler{
				canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{careRequestID: {Id: proto.Int64(int64(visitID))}},
				visitIDToPhaseTypeShortName:      map[VisitSnapshotID]VisitPhaseShortName{visitID: VisitPhaseTypeShortNameEnRoute},
				visitIDToCareRequestID:           map[VisitSnapshotID]CareRequestID{visitID: CareRequestID(time.Now().UnixNano())},
				careRequestActuals:               CareRequestActuals{CurrentlyEnRouteTimes: map[CareRequestID]time.Time{careRequestID: time.Now()}},
			},

			HasError: true,
		},
		{
			Desc: "missing enroute time",
			Reconciler: &snapshotIDReconciler{
				canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{careRequestID: {Id: proto.Int64(int64(visitID))}},
				visitIDToPhaseTypeShortName:      map[VisitSnapshotID]VisitPhaseShortName{visitID: VisitPhaseTypeShortNameEnRoute},
				visitIDToCareRequestID:           map[VisitSnapshotID]CareRequestID{visitID: careRequestID},
			},

			HasError: true,
		},
		{
			Desc: "missing care request ID",
			Reconciler: &snapshotIDReconciler{
				canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{careRequestID: {Id: proto.Int64(int64(visitID))}},
				visitIDToPhaseTypeShortName:      map[VisitSnapshotID]VisitPhaseShortName{visitID: VisitPhaseTypeShortNameEnRoute},
				careRequestActuals:               CareRequestActuals{CurrentlyEnRouteTimes: map[CareRequestID]time.Time{careRequestID: time.Now()}},
			},

			HasError: true,
		},
		{
			Desc: "not en route is fine",
			Reconciler: &snapshotIDReconciler{
				canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{careRequestID: {Id: proto.Int64(int64(visitID))}},
				visitIDToPhaseTypeShortName:      map[VisitSnapshotID]VisitPhaseShortName{visitID: VisitPhaseTypeShortNameCommitted},
				visitIDToCareRequestID:           map[VisitSnapshotID]CareRequestID{visitID: careRequestID},
				careRequestActuals:               CareRequestActuals{CurrentlyEnRouteTimes: map[CareRequestID]time.Time{careRequestID: time.Now()}},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			err := tc.Reconciler.Validate()

			errString := "nil"
			if err != nil {
				errString = err.Error()
			}
			testutils.MustMatch(t, tc.HasError, err != nil, errString)
		})
	}
}

func TestCurrentPositionForLatestStopWithActualArrival_CoverageHack(t *testing.T) {
	visitID := VisitSnapshotID(time.Now().UnixNano())
	badVisitID := VisitSnapshotID(time.Now().UnixNano())

	careRequestID := CareRequestID(time.Now().UnixNano())

	s := &snapshotIDReconciler{
		visitIDToPhaseTypeShortName: map[VisitSnapshotID]VisitPhaseShortName{visitID: VisitPhaseTypeShortNameEnRoute, badVisitID: VisitPhaseTypeShortNameEnRoute},
		visitIDToCareRequestID:      map[VisitSnapshotID]CareRequestID{visitID: careRequestID},
	}

	testutils.AssertExhaustiveOneOfMapping(t,
		&optimizerpb.VRPShiftTeamRouteStop{},
		"stop", []string{"visit", "rest_break"},
		"for a new type of route stop, one must explicitly determine how to handle it"+
			" in the switch statement in currentPositionForLatestStopWithActualArrivalOrCompletion",
	)

	badShiftTeamWithoutStopType := &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
		{ActualStartTimestampSec: proto.Int64(10) /* unset stop type */},
	}}}
	_, err := s.currentPositionForLatestStopWithActualArrivalOrCompletion(badShiftTeamWithoutStopType)
	testutils.MustMatch(t, errors.New("unhandled VRPShiftTeamRouteStop type for current position location ID"), err)

	err = s.annotateRouteHistoryCurrentPositions([]*optimizerpb.VRPShiftTeam{badShiftTeamWithoutStopType})
	testutils.MustMatch(t, errors.New("unhandled VRPShiftTeamRouteStop type for current position location ID"), err)

	_, err = s.currentPositionFromLastKnownLocation(time.Now().UnixNano(), badShiftTeamWithoutStopType.RouteHistory.Stops[0])
	testutils.MustMatch(t, errors.New("unhandled stop type in setCurrentPositionForDepotAndFirstStopNoActualArrivals"), err)

	_, err = s.currentPositionFromLastKnownLocation(time.Now().UnixNano(),
		&optimizerpb.VRPShiftTeamRouteStop{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(int64(badVisitID))}}})

	testutils.MustMatch(t,
		fmt.Errorf("improperly initialized reconciler: missing visit->care request->enroute time for enroute visit: %d", badVisitID),
		err,
	)
}

func TestCheckFeasibilityVisitID_IsCheckFeasibility(t *testing.T) {
	testutils.MustMatch(t, true, VisitSnapshotID(-1).isCheckFeasibilityVisitSnapshotID())
	testutils.MustMatch(t, false, VisitSnapshotID(0).isCheckFeasibilityVisitSnapshotID())
	testutils.MustMatch(t, false, VisitSnapshotID(1).isCheckFeasibilityVisitSnapshotID())
}

func TestGetVRPTimeWindowFromCheckFeasibilityVisit(t *testing.T) {
	testutils.AssertExhaustiveOneOfMapping(t,
		&logisticspb.CheckFeasibilityVisit{},
		"arrival_time_specification", []string{"arrival_time_window", "arrival_date"},
		"the new type must be handled in the getVRPTimeWindowFromCheckFeasibilityVisit switch statement",
	)
	visit := &logisticspb.CheckFeasibilityVisit{}
	now := time.Now()
	openHours := TimeWindow{Start: now, End: now.Add(time.Hour)}
	_, err := getVRPTimeWindowFromCheckFeasibilityVisit(visit, openHours, now.Add(time.Second))
	testutils.MustMatch(t, true, err != nil, "no arrival specification is bad")

	visit.ArrivalTimeSpecification = &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
		ArrivalTimeWindow: &commonpb.TimeWindow{
			StartDatetime: TimeToProtoDateTime(&openHours.Start),
			EndDatetime:   TimeToProtoDateTime(&openHours.End),
		}}
	_, err = getVRPTimeWindowFromCheckFeasibilityVisit(visit, openHours, now.Add(time.Second))
	testutils.MustMatch(t, true, err == nil, "arrival time window is handled")

	visit.ArrivalTimeSpecification = &logisticspb.CheckFeasibilityVisit_ArrivalDate{
		ArrivalDate: TimeToProtoDate(&openHours.Start),
	}
	_, err = getVRPTimeWindowFromCheckFeasibilityVisit(visit, openHours, now.Add(time.Second))
	testutils.MustMatch(t, true, err == nil, "arrival date  is handled")
}

func Test_clinicalUrgencyLevelIDForEnum_errCode(t *testing.T) {
	tcs := []struct {
		name        string
		enum        commonpb.ClinicalUrgencyLevel
		wantErr     bool
		wantErrCode codes.Code
	}{
		{
			name:    "valid level",
			enum:    commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH,
			wantErr: false,
		},
		{
			name:    "unspecified level is not error",
			enum:    0,
			wantErr: false,
		},
		{
			name:        "non-existent level is failedPrecondition",
			enum:        666,
			wantErr:     true,
			wantErrCode: codes.FailedPrecondition,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			_, err := clinicalUrgencyLevelIDForEnum(tc.enum)
			if (err != nil) != tc.wantErr {
				t.Errorf("clinicalUrgencyLevelIDForEnum() error = %v, wantErr %v", err, tc.wantErr)
				return
			}

			if tc.wantErr {
				code := status.Code(err)
				if code != tc.wantErrCode {
					t.Errorf("code = %v, wantErrCode %v", code, tc.wantErrCode)
				}
			}
		})
	}
}

func Test_PathDistanceReq(t *testing.T) {
	var latLngs []logistics.LatLng
	var locIDs []int64
	for i := int32(0); i < 3; i++ {
		latLngs = append(latLngs, logistics.LatLng{LatE6: i, LngE6: i})
		locIDs = append(locIDs, int64(i))
	}

	pdr := PathDistancesReq(locIDs)
	testutils.MustMatch(t, false, pdr.IsEmpty())
	m := &latLngMapper{
		locIDLatLngs: map[int64]logistics.LatLng{
			0: latLngs[0],
			1: latLngs[1],
			2: latLngs[2],
		},
		latLngLocIDs: map[logistics.LatLng]int64{
			latLngs[0]: 0,
			latLngs[1]: 1,
			latLngs[2]: 2,
		},
	}

	testutils.MustMatch(t, []locIDPair{{0, 1}, {1, 2}}, pdr.LocIDPairSet().Elems())
	testutils.MustMatch(t, latLngs, pdr.LatLngs(m))
}

func TestMissingLocIDPairs(t *testing.T) {
	rect2x2 := &RectDistancesReq{
		FromLocationIDs: []int64{1, 2},
		ToLocationIDs:   []int64{1, 2},
	}
	rect3x3 := &RectDistancesReq{
		FromLocationIDs: []int64{1, 2, 3},
		ToLocationIDs:   []int64{1, 2, 3},
	}

	tcs := []struct {
		Desc     string
		HasPairs []locIDPair
		Req      *RectDistancesReq

		ExpectedReqs []MissingLocReq
	}{
		{
			Desc:     "has no pairs, same req",
			HasPairs: nil,
			Req:      rect2x2,

			ExpectedReqs: []MissingLocReq{
				{
					DistanceMatrixRequest: rect2x2,
				},
			},
		},
		{
			Desc:     "has all pairs, no reqs",
			HasPairs: rect2x2.LocIDPairSet().Elems(),
			Req:      rect2x2,
		},
		{
			Desc: "missing one elem, 2x2",
			HasPairs: []locIDPair{
				{1, 1},
				{1, 2},
				{2, 1},
			},
			Req: rect2x2,

			ExpectedReqs: []MissingLocReq{
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{2},
						ToLocationIDs:   []int64{2},
					},
				},
			},
		},
		{
			Desc: "missing one elem, 3x3",
			HasPairs: []locIDPair{
				{1, 1},
				{1, 2},
				{1, 3},
				{2, 1},
				{2, 2},
				{2, 3},
				{3, 1},
				{3, 2},
			},
			Req: rect3x3,

			ExpectedReqs: []MissingLocReq{
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{3},
						ToLocationIDs:   []int64{3},
					},
				},
			},
		},
		{
			Desc: "missing first row and column, 3x3",
			HasPairs: (&RectDistancesReq{
				FromLocationIDs: []int64{2, 3},
				ToLocationIDs:   []int64{2, 3},
			}).LocIDPairSet().Elems(),
			Req: rect3x3,

			ExpectedReqs: []MissingLocReq{
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{1},
						ToLocationIDs:   []int64{1, 2, 3},
					},
				},
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{2, 3},
						ToLocationIDs:   []int64{1},
					},
				},
			},
		},
		{
			Desc: "missing first row and column, and not full submatrix, 3x3",
			HasPairs: []locIDPair{
				{2, 2},
				{3, 3},
			},
			Req: rect3x3,

			ExpectedReqs: []MissingLocReq{
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{1},
						ToLocationIDs:   []int64{1, 2, 3},
					},
				},
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{2, 3},
						ToLocationIDs:   []int64{1},
					},
				},
				{
					DistanceMatrixRequest: &RectDistancesReq{
						FromLocationIDs: []int64{2, 3},
						ToLocationIDs:   []int64{3, 2},
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			hasSet := collections.NewLinkedSet[locIDPair](0)
			hasSet.Add(tc.HasPairs...)

			newReqs, err := missingLocIDPairs(
				tc.Req.LocIDPairSet(), hasSet, tc.Req)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.ExpectedReqs, newReqs)
		})
	}
}

func TestLogisticsDB_scheduleToken(t *testing.T) {
	scheduleID := time.Now().UnixNano()
	opaqueToken, err := scheduleToken(scheduleID)
	if err != nil {
		t.Fatal(err)
	}

	expectedToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, expectedToken, opaqueToken, "token does not match")
}

func Test_estimateToComplete(t *testing.T) {
	tcs := []struct {
		desc                     string
		visitPhaseShortName      VisitPhaseShortName
		arrivalTimestampSec      int64
		arrivalStartTimestampSec int64

		want int64
	}{
		{
			desc:                     "committed, before window start",
			arrivalTimestampSec:      100,
			arrivalStartTimestampSec: 200,

			want: 260,
		},
		{
			desc:                     "committed, after window start",
			visitPhaseShortName:      VisitPhaseTypeShortNameCommitted,
			arrivalTimestampSec:      300,
			arrivalStartTimestampSec: 200,

			want: 360,
		},
		{
			desc:                     "en_route, arriving early",
			visitPhaseShortName:      VisitPhaseTypeShortNameEnRoute,
			arrivalTimestampSec:      100,
			arrivalStartTimestampSec: 200,

			want: 160,
		},
		{
			desc:                     "on_scene, arrived early",
			visitPhaseShortName:      VisitPhaseTypeShortNameOnScene,
			arrivalTimestampSec:      100,
			arrivalStartTimestampSec: 200,

			want: 160,
		},
		{
			desc:                     "en_route, arriving after window start",
			visitPhaseShortName:      VisitPhaseTypeShortNameEnRoute,
			arrivalTimestampSec:      300,
			arrivalStartTimestampSec: 200,

			want: 360,
		},
		{
			desc:                     "on_scene, arrived after window start",
			visitPhaseShortName:      VisitPhaseTypeShortNameOnScene,
			arrivalTimestampSec:      300,
			arrivalStartTimestampSec: 200,

			want: 360,
		},
	}

	serviceDurationSec := int64(50)
	extraSetupDurationSec := int64(10)
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := estimateToComplete(estimateToCompleteParams{
				visitPhaseShortName:      tc.visitPhaseShortName,
				arrivalTimestampSec:      tc.arrivalTimestampSec,
				arrivalStartTimestampSec: tc.arrivalStartTimestampSec,
				serviceDurationSec:       serviceDurationSec,
				extraSetupDurationSec:    extraSetupDurationSec,
			})

			testutils.MustMatch(t, tc.want, got, "en_route or on_scene uses arrivalTimestampSec", "otherwise uses max")
		})
	}
}
