//go:build db_test

package logisticsdb_test

import (
	"database/sql"
	"reflect"
	"strconv"
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestUpsertAttributes(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	attributeCount := 3
	attributeNameBaseID := time.Now().UnixNano()

	var attributeNames []string
	for i := 0; i < attributeCount; i++ {
		attributeNames = append(attributeNames, strconv.FormatInt(attributeNameBaseID+int64(i), 10))
	}

	attributes, err := queries.UpsertAttributes(ctx, attributeNames)
	if err != nil {
		t.Fatal(err)
	}

	if len(attributes) != attributeCount {
		t.Fatalf("Number of attributes not right: %v, %v", attributeCount, attributes)
	}

	attributes2, err := queries.UpsertAttributes(ctx, attributeNames)
	if err != nil {
		t.Fatal(err)
	}

	if len(attributes2) != 0 {
		t.Fatalf("No new attributes should be upserted: %v", attributes)
	}

	attributeNameAttributes, err := queries.GetAttributesForNames(ctx, attributeNames)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, attributes, attributeNameAttributes, "attributes don't match")
}

func TestDeleteVisitSnapshotForCareRequestID_SQLProperlyCopiesAllFields(t *testing.T) {
	ctx, _, q, done := setupDBTest(t)
	defer done()

	baseVal := time.Now().UnixNano()
	original, err := q.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            baseVal,
		ServiceRegionID:          baseVal + 1,
		LocationID:               baseVal + 2,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(baseVal + 3),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(baseVal + 4),
		ServiceDurationSec:       baseVal + 5,
		IsManualOverride:         true,
	})
	if err != nil {
		t.Fatal(err)
	}

	deleted, err := q.DeleteVisitSnapshotForCareRequestID(ctx, original.CareRequestID)
	if err != nil {
		t.Fatal(err)
	}

	orig := reflect.ValueOf(*original)
	v := reflect.ValueOf(*deleted)
	var checkInitialized = func(value reflect.Value, n string) {
		if value.IsZero() {
			t.Fatalf("field(%s) must be initialized to a non-zero value above to properly test the roundtrip", n)
		}
	}

	for i := 0; i < v.NumField(); i++ {
		switch n := v.Type().Field(i).Name; n {
		case "ID", "CreatedAt":
			// we don't care that these fields are copied
			continue
		case "IsManualOverride":
			// int types that we demand be copied appropriately, and non-zero
			checkInitialized(v.Field(i), n)
			if v.Field(i).Bool() != orig.Field(i).Bool() {
				t.Fatalf("field(%s) not copied correctly in SQL, update the INSERT statement", n)
			}
		case "CareRequestID", "ServiceRegionID", "LocationID", "ServiceDurationSec":
			// int types that we demand be copied appropriately, and non-zero
			checkInitialized(v.Field(i), n)
			if v.Field(i).Int() != orig.Field(i).Int() {
				t.Fatalf("field(%s) not copied correctly in SQL, update the INSERT statement", n)
			}
		case "ArrivalStartTimestampSec", "ArrivalEndTimestampSec":
			checkInitialized(v.Field(i), n)
			if v.Field(i).Field(0).Int() != orig.Field(i).Field(0).Int() {
				t.Fatalf("nullable field value(%s) not copied correctly in SQL, update the INSERT statement", n)
			}
			if v.Field(i).Field(1).Bool() != orig.Field(i).Field(1).Bool() {
				t.Fatalf("nullable field(%s) not copied correctly in SQL, update the INSERT statement", n)
			}
		case "DeletedAt":
			if original.DeletedAt.Valid {
				t.Fatal("original deleted at should not be set")
			}
			if !deleted.DeletedAt.Valid {
				t.Fatal("new deleted at should be set")
			}
		default:
			t.Fatalf("unspecified new column name must be tested %s", n)
		}
	}
}

type timeWindow struct {
	start time.Time
	end   time.Time
}

func TestGetLatestSnapshotsInRegion(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	nextServiceRegionID := time.Now().UnixNano()
	nextID := time.Now().UnixNano()

	locIDs := addLocationIDs(ctx, t, queries, 1)

	startTimestamp := time.Now()
	endTimestamp := startTimestamp.Add(1 * time.Hour)

	beforeStartTimestamp := startTimestamp.Add(-1 * time.Minute)
	afterStartTimestamp := startTimestamp.Add(1 * time.Minute)
	beforeEndTimestamp := endTimestamp.Add(-1 * time.Minute)
	afterEndTimestamp := endTimestamp.Add(1 * time.Minute)

	openHoursTW := timeWindow{startTimestamp, endTimestamp}
	insideOpenHoursTW := timeWindow{afterStartTimestamp, beforeEndTimestamp}
	overlapOpenHoursTW := timeWindow{beforeStartTimestamp, afterEndTimestamp}
	overlapStartOpenHoursTW := timeWindow{beforeStartTimestamp, afterStartTimestamp}
	overlapEndOpenHoursTW := timeWindow{beforeEndTimestamp, afterEndTimestamp}
	beforeOpenHoursTW := timeWindow{beforeStartTimestamp.Add(-1 * time.Minute), beforeStartTimestamp}
	afterOpenHoursTW := timeWindow{afterEndTimestamp, afterEndTimestamp.Add(1 * time.Minute)}

	urgencyLevelID := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH
	urgencyOptimizerLevelID := int64(3)       // Current value for HIGH urgency level
	urgencyConfigTimeWindowSec := int64(7200) // 2 hours

	completionValueCents := int64(123)
	partnerPriorityScore := int64(456)

	type timeWindows []struct {
		tw          timeWindow
		otherRegion bool
	}

	// TODO: Add test for snapshots with deleted_at.
	tcs := []struct {
		Desc            string
		SnapshotWindows []timeWindows

		ExpectedSnapshots int
	}{
		{
			Desc: "Base case: 1 entity x 1 snapshot",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "Base case: 1 entity x 1 snapshot other region",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW, otherRegion: true},
				},
			},

			ExpectedSnapshots: 0,
		},
		{
			Desc: "1 entity x 2 snapshots",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW},
					{tw: insideOpenHoursTW},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "1 entity x 2 snapshots, old otherRegion snapshot",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW, otherRegion: true},
					{tw: insideOpenHoursTW, otherRegion: false},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "1 entity x 2 snapshots, new otherRegion snapshot",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW, otherRegion: false},
					{tw: insideOpenHoursTW, otherRegion: true},
				},
			},

			ExpectedSnapshots: 0,
		},
		{
			Desc: "1 entity x overlap open hours",
			SnapshotWindows: []timeWindows{
				{
					{tw: overlapOpenHoursTW},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "1 entity x overlap start time",
			SnapshotWindows: []timeWindows{
				{
					{tw: overlapStartOpenHoursTW},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "1 entity x overlap end time",
			SnapshotWindows: []timeWindows{
				{
					{tw: overlapEndOpenHoursTW},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "1 entity x before start time",
			SnapshotWindows: []timeWindows{
				{
					{tw: beforeOpenHoursTW},
				},
			},

			ExpectedSnapshots: 0,
		},
		{
			Desc: "1 entity x after end time",
			SnapshotWindows: []timeWindows{
				{
					{tw: afterOpenHoursTW},
				},
			},

			ExpectedSnapshots: 0,
		},
		{
			Desc: "1 entity x 2 snapshot with latest inside open hours",
			SnapshotWindows: []timeWindows{
				{
					{tw: afterOpenHoursTW},
					{tw: insideOpenHoursTW},
				},
			},

			ExpectedSnapshots: 1,
		},
		{
			Desc: "1 entity x 2 snapshot with latest outside open hours",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW},
					{tw: afterOpenHoursTW},
				},
			},

			ExpectedSnapshots: 0,
		},
		{
			Desc: "2 entities x 1 snapshot",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW},
				},
				{
					{tw: insideOpenHoursTW},
				},
			},

			ExpectedSnapshots: 2,
		},
		{
			Desc: "2 entities x 2 snapshots",
			SnapshotWindows: []timeWindows{
				{
					{tw: insideOpenHoursTW},
					{tw: insideOpenHoursTW},
				},
				{
					{tw: insideOpenHoursTW},
					{tw: insideOpenHoursTW},
				},
			},

			ExpectedSnapshots: 2,
		},
		{
			Desc:            "No entities",
			SnapshotWindows: nil,

			ExpectedSnapshots: 0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			serviceRegionID := nextServiceRegionID
			nextServiceRegionID++
			otherServiceRegionID := nextServiceRegionID
			nextServiceRegionID++

			var latestShiftTeamSnapshotTime, latestVisitSnapshotTime time.Time
			for _, tws := range tc.SnapshotWindows {
				shiftTeamID := nextID
				careRequestID := nextID
				nextID++

				for _, tw := range tws {
					regionID := serviceRegionID
					if tw.otherRegion {
						regionID = otherServiceRegionID
					}
					shiftTeam, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
						ShiftTeamID:       shiftTeamID,
						ServiceRegionID:   regionID,
						BaseLocationID:    locIDs[0],
						StartTimestampSec: tw.tw.start.Unix(),
						EndTimestampSec:   tw.tw.end.Unix(),
					})
					if err != nil {
						t.Fatal(err)
					}

					visitSnapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
						CareRequestID:            careRequestID,
						ServiceRegionID:          regionID,
						LocationID:               locIDs[0],
						ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(tw.tw.start.Unix()),
						ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(tw.tw.end.Unix()),
					})
					if err != nil {
						t.Fatal(err)
					}

					_, err = queries.AddVisitAcuitySnapshot(
						ctx,
						logisticssql.AddVisitAcuitySnapshotParams{
							VisitSnapshotID:        visitSnapshot.ID,
							ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(int64(urgencyLevelID)),
						},
					)
					if err != nil {
						t.Fatal(err)
					}

					_, err = queries.AddVisitValueSnapshot(ctx, logisticssql.AddVisitValueSnapshotParams{
						VisitSnapshotID:      visitSnapshot.ID,
						CompletionValueCents: sqltypes.ToValidNullInt64(completionValueCents),
						PartnerPriorityScore: sqltypes.ToValidNullInt64(partnerPriorityScore),
					})
					if err != nil {
						t.Fatal(err)
					}

					_, err = queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
						VisitSnapshotID:  visitSnapshot.ID,
						VisitPhaseTypeID: 1, // uncommitted
						StatusCreatedAt:  time.Now().Add(-1 * time.Second),
					})
					if err != nil {
						t.Fatal(err)
					}

					careRequestIDOfRequestedStatusThatWontAppear := time.Now().UnixNano()
					visitSnapshotOfRequestedStatusThatWontAppear, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
						CareRequestID:            careRequestIDOfRequestedStatusThatWontAppear,
						ServiceRegionID:          regionID,
						LocationID:               locIDs[0],
						ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(tw.tw.start.Unix()),
						ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(tw.tw.end.Unix()),
					})
					if err != nil {
						t.Fatal(err)
					}
					vps, err := queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
						VisitSnapshotID:  visitSnapshotOfRequestedStatusThatWontAppear.ID,
						VisitPhaseTypeID: 7, // requested!!
						StatusCreatedAt:  time.Now().Add(-1 * time.Second),
					})
					if err != nil {
						t.Fatal(err)
					}

					latestShiftTeamSnapshotTime = shiftTeam.CreatedAt
					latestVisitSnapshotTime = vps.CreatedAt
				}
			}

			shiftTeamParams := logisticssql.GetLatestShiftTeamSnapshotsInRegionParams{
				ServiceRegionID:    serviceRegionID,
				StartTimestampSec:  openHoursTW.start.Unix(),
				EndTimestampSec:    openHoursTW.end.Unix(),
				LatestSnapshotTime: latestShiftTeamSnapshotTime,
			}
			visitParams := logisticssql.GetLatestVisitSnapshotsInRegionParams{
				ServiceRegionID:    serviceRegionID,
				StartTimestampSec:  sqltypes.ToValidNullInt64(openHoursTW.start.Unix()),
				EndTimestampSec:    sqltypes.ToValidNullInt64(openHoursTW.end.Unix()),
				LatestSnapshotTime: latestVisitSnapshotTime,
				SinceSnapshotTime:  latestShiftTeamSnapshotTime.Add(-1 * time.Hour),
			}

			shiftTeamSnapshots, err := queries.GetLatestShiftTeamSnapshotsInRegion(ctx, shiftTeamParams)
			if err != nil {
				t.Fatal(err)
			}

			visitSnapshots, err := queries.GetLatestVisitSnapshotsInRegion(ctx, visitParams)
			if err != nil {
				t.Fatal(err)
			}

			if len(shiftTeamSnapshots) != tc.ExpectedSnapshots {
				t.Fatalf("not right number of shift team snapshots: %v\n%+v", len(shiftTeamSnapshots), tc)
			}
			if len(visitSnapshots) != tc.ExpectedSnapshots {
				t.Fatalf("not right number of visit snapshots: %v\n%+v", len(visitSnapshots), tc)
			}

			for _, snapshot := range visitSnapshots {
				testutils.MustMatch(t, snapshot.OptimizerUrgencyLevel.Int64, urgencyOptimizerLevelID)
				testutils.MustMatch(t, snapshot.ClinicalWindowDurationSec.Int64, urgencyConfigTimeWindowSec)

				testutils.MustMatch(t, completionValueCents, snapshot.CompletionValueCents.Int64)
				testutils.MustMatch(t, partnerPriorityScore, snapshot.PartnerPriorityScore.Int64)
			}
		})
	}
}

func TestHasAnyShiftTeamSnapshotsSince(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	serviceRegionID := time.Now().UnixNano()
	shiftTeamID := int64(1234)
	baseLocationID := int64(5678)

	startTimestampSec := time.Now().UnixNano()
	endTimestampSec := startTimestampSec + int64(4*time.Hour)

	shiftTeamParams := logisticssql.AddShiftTeamSnapshotParams{
		ServiceRegionID:   serviceRegionID,
		ShiftTeamID:       shiftTeamID,
		BaseLocationID:    baseLocationID,
		StartTimestampSec: startTimestampSec,
		EndTimestampSec:   endTimestampSec,
	}
	firstSnapshotToday, err := queries.AddShiftTeamSnapshot(ctx, shiftTeamParams)
	if err != nil {
		t.Fatal(err)
	}

	hasSnapshotParams := logisticssql.HasAnyShiftTeamSnapshotsInRegionSinceParams{
		ServiceRegionID:    serviceRegionID,
		StartTimestampSec:  startTimestampSec,
		EndTimestampSec:    endTimestampSec,
		SinceSnapshotTime:  firstSnapshotToday.CreatedAt,
		LatestSnapshotTime: firstSnapshotToday.CreatedAt.Add(1 * time.Second),
	}
	vals, err := queries.HasAnyShiftTeamSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	if len(vals) != 0 {
		t.Fatal("should not have any snapshots")
	}

	_, err = queries.AddShiftTeamSnapshot(ctx, shiftTeamParams)
	if err != nil {
		t.Fatal(err)
	}

	tooEarlyTodayShiftTeamParams := shiftTeamParams
	tooEarlyTodayShiftTeamParams.StartTimestampSec = shiftTeamParams.StartTimestampSec - 2
	tooEarlyTodayShiftTeamParams.EndTimestampSec = shiftTeamParams.StartTimestampSec - 1
	_, err = queries.AddShiftTeamSnapshot(ctx, tooEarlyTodayShiftTeamParams)
	if err != nil {
		t.Fatal(err)
	}

	tooLateTodayShiftTeamParams := shiftTeamParams
	tooLateTodayShiftTeamParams.StartTimestampSec = shiftTeamParams.EndTimestampSec + 1
	tooLateTodayShiftTeamParams.EndTimestampSec = shiftTeamParams.EndTimestampSec + 2
	lastSnapshotToday, err := queries.AddShiftTeamSnapshot(ctx, tooLateTodayShiftTeamParams)
	if err != nil {
		t.Fatal(err)
	}

	vals, err = queries.HasAnyShiftTeamSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, []int32{1}, vals, "values don't match")

	hasSnapshotParams.SinceSnapshotTime = lastSnapshotToday.CreatedAt

	yesterdayShiftTeamParams := shiftTeamParams
	yesterdayShiftTeamParams.StartTimestampSec = shiftTeamParams.StartTimestampSec - int64(24*time.Hour)
	yesterdayShiftTeamParams.EndTimestampSec = shiftTeamParams.EndTimestampSec - int64(24*time.Hour)
	_, err = queries.AddShiftTeamSnapshot(ctx, yesterdayShiftTeamParams)
	if err != nil {
		t.Fatal(err)
	}

	vals, err = queries.HasAnyShiftTeamSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, []int32{1}, vals, "values don't match")

	tomorrowShiftTeamParams := shiftTeamParams
	tomorrowShiftTeamParams.StartTimestampSec = shiftTeamParams.StartTimestampSec + int64(24*time.Hour)
	tomorrowShiftTeamParams.EndTimestampSec = shiftTeamParams.EndTimestampSec + int64(24*time.Hour)
	_, err = queries.AddShiftTeamSnapshot(ctx, tomorrowShiftTeamParams)
	if err != nil {
		t.Fatal(err)
	}

	vals, err = queries.HasAnyShiftTeamSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, []int32{1}, vals, "values don't match")
}
func TestHasAnyVisitSnapshotsSince(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	serviceRegionID := time.Now().UnixNano()
	careReqID := int64(1234)
	locationID := int64(5678)

	startTimestampSec := time.Now().UnixNano()
	endTimestampSec := startTimestampSec + int64(4*time.Hour)

	visitParams := logisticssql.AddVisitSnapshotParams{
		ServiceRegionID:          serviceRegionID,
		CareRequestID:            careReqID,
		LocationID:               locationID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(startTimestampSec),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(endTimestampSec),
	}
	todayFirstSnapshot, err := queries.AddVisitSnapshot(ctx, visitParams)
	if err != nil {
		t.Fatal(err)
	}

	hasSnapshotParams := logisticssql.HasAnyVisitSnapshotsInRegionSinceParams{
		ServiceRegionID:    serviceRegionID,
		StartTimestampSec:  sqltypes.ToValidNullInt64(startTimestampSec),
		EndTimestampSec:    sqltypes.ToValidNullInt64(endTimestampSec),
		SinceSnapshotTime:  todayFirstSnapshot.CreatedAt,
		LatestSnapshotTime: todayFirstSnapshot.CreatedAt.Add(1 * time.Second),
	}
	vals, err := queries.HasAnyVisitSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	if len(vals) != 0 {
		t.Fatal("should not have any snapshots")
	}

	testutils.MustFn(t)(queries.AddVisitSnapshot(ctx, visitParams))

	tooEarlyTodayVisitParams := visitParams
	tooEarlyTodayVisitParams.ArrivalStartTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalStartTimestampSec.Int64 - 2)
	tooEarlyTodayVisitParams.ArrivalEndTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalStartTimestampSec.Int64 - 1)
	testutils.MustFn(t)(queries.AddVisitSnapshot(ctx, tooEarlyTodayVisitParams))

	tooLateTodayVisitParams := visitParams
	tooLateTodayVisitParams.ArrivalStartTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalEndTimestampSec.Int64 + 1)
	tooLateTodayVisitParams.ArrivalEndTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalEndTimestampSec.Int64 + 2)
	lastSnapshotToday, err := queries.AddVisitSnapshot(ctx, tooLateTodayVisitParams)
	if err != nil {
		t.Fatal(err)
	}

	vals, err = queries.HasAnyVisitSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, []int32{1}, vals, "values don't match")

	hasSnapshotParams.SinceSnapshotTime = lastSnapshotToday.CreatedAt

	yesterdayVisitParams := visitParams
	yesterdayVisitParams.ArrivalStartTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalStartTimestampSec.Int64 - int64(24*time.Hour))
	yesterdayVisitParams.ArrivalEndTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalEndTimestampSec.Int64 - int64(24*time.Hour))
	_, err = queries.AddVisitSnapshot(ctx, yesterdayVisitParams)
	if err != nil {
		t.Fatal(err)
	}

	vals, err = queries.HasAnyVisitSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, []int32{1}, vals, "values don't match")

	tomorrowVisitParams := visitParams
	tomorrowVisitParams.ArrivalStartTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalStartTimestampSec.Int64 + int64(24*time.Hour))
	tomorrowVisitParams.ArrivalEndTimestampSec = sqltypes.ToValidNullInt64(visitParams.ArrivalEndTimestampSec.Int64 + int64(24*time.Hour))
	_, err = queries.AddVisitSnapshot(ctx, tomorrowVisitParams)
	if err != nil {
		t.Fatal(err)
	}

	vals, err = queries.HasAnyVisitSnapshotsInRegionSince(ctx, hasSnapshotParams)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, []int32{1}, vals, "values don't match")
}

func TestGetVisitPrioritySnapshot(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	visitSnapshotID := time.Now().UnixNano()
	requestedByUserID := sqltypes.ToValidNullInt64(int64(2))
	note := sqltypes.ToValidNullString("foo")
	requestedTimestampSec := sqltypes.ToValidNullInt64(time.Now().UnixNano())

	testutils.MustFn(t)(queries.AddVisitPrioritySnapshot(ctx, logisticssql.AddVisitPrioritySnapshotParams{
		VisitSnapshotID:       visitSnapshotID,
		RequestedByUserID:     requestedByUserID,
		Note:                  note,
		RequestedTimestampSec: requestedTimestampSec,
	}))

	visitPrioritySnapshot, err := queries.GetVisitPrioritySnapshot(ctx, visitSnapshotID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, visitSnapshotID, visitPrioritySnapshot.VisitSnapshotID, "values don't match")
	testutils.MustMatch(t, requestedByUserID, visitPrioritySnapshot.RequestedByUserID, "values don't match")
	testutils.MustMatch(t, note, visitPrioritySnapshot.Note, "values don't match")
	testutils.MustMatch(t, requestedTimestampSec, visitPrioritySnapshot.RequestedTimestampSec, "values don't match")

	nullDataSnapshotID := time.Now().UnixNano()
	testutils.MustFn(t)(queries.AddVisitPrioritySnapshot(ctx, logisticssql.AddVisitPrioritySnapshotParams{
		VisitSnapshotID: nullDataSnapshotID,
	}))

	visitPrioritySnapshotWithNull, err := queries.GetVisitPrioritySnapshot(ctx, nullDataSnapshotID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, nullDataSnapshotID, visitPrioritySnapshotWithNull.VisitSnapshotID, "values don't match")
	testutils.MustMatch(t, sql.NullInt64{}, visitPrioritySnapshotWithNull.RequestedByUserID, "values don't match")
	testutils.MustMatch(t, sql.NullString{}, visitPrioritySnapshotWithNull.Note, "values don't match")
	testutils.MustMatch(t, sql.NullInt64{}, visitPrioritySnapshotWithNull.RequestedTimestampSec, "values don't match")
}

func TestGetCareRequestFeasibilityQueries(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	fakeID := time.Now().UnixNano()
	careRequestID := sqltypes.ToValidNullInt64(fakeID)
	serviceRegionID := sqltypes.ToValidNullInt64(fakeID + 100)
	locationID := sqltypes.ToValidNullInt64(fakeID + 200)
	serviceDate := sql.NullTime{Valid: true, Time: time.Date(2022, 1, 1, 0, 0, 0, 0, time.UTC)}
	arrivalTimeWindowStartTimestampSec := sqltypes.ToValidNullInt64(123)
	arrivalTimeWindowEndTimestampSec := sqltypes.ToValidNullInt64(456)
	serviceDurationSec := sqltypes.ToValidNullInt64(100)

	testutils.MustFn(t)(queries.AddCheckFeasibilityQuery(ctx, logisticssql.AddCheckFeasibilityQueryParams{
		CareRequestID: careRequestID,
	}))

	_, err := queries.GetLatestCheckFeasibilityQueryForCareRequest(ctx, logisticssql.GetLatestCheckFeasibilityQueryForCareRequestParams{
		CareRequestID: careRequestID,
		CreatedBefore: time.Now(),
	})
	if err != nil {
		t.Fatal(err)
	}

	optimizerRunID := sqltypes.ToValidNullInt64(1234)
	bestScheduleID := sqltypes.ToValidNullInt64(2222)
	bestScheduleIsFeasible := sql.NullBool{Valid: true, Bool: true}
	testutils.MustFn(t)(queries.AddCheckFeasibilityQuery(ctx, logisticssql.AddCheckFeasibilityQueryParams{
		CareRequestID:                      careRequestID,
		ServiceRegionID:                    serviceRegionID,
		OptimizerRunID:                     optimizerRunID,
		BestScheduleID:                     bestScheduleID,
		BestScheduleIsFeasible:             bestScheduleIsFeasible,
		ServiceDate:                        serviceDate,
		LocationID:                         locationID,
		ArrivalTimeWindowStartTimestampSec: arrivalTimeWindowStartTimestampSec,
		ArrivalTimeWindowEndTimestampSec:   arrivalTimeWindowEndTimestampSec,
		ServiceDurationSec:                 serviceDurationSec,
	}))

	checkFeasibilityQueries, err := queries.GetAllCheckFeasibilityQueriesForCareRequest(ctx, careRequestID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 2, len(checkFeasibilityQueries), "values don't match")

	wantStruct := &logisticssql.CheckFeasibilityQuery{
		CareRequestID:                      careRequestID,
		ServiceRegionID:                    serviceRegionID,
		OptimizerRunID:                     optimizerRunID,
		BestScheduleID:                     bestScheduleID,
		BestScheduleIsFeasible:             bestScheduleIsFeasible,
		ServiceDate:                        serviceDate,
		LocationID:                         locationID,
		ArrivalTimeWindowStartTimestampSec: arrivalTimeWindowStartTimestampSec,
		ArrivalTimeWindowEndTimestampSec:   arrivalTimeWindowEndTimestampSec,
		ServiceDurationSec:                 serviceDurationSec,
	}
	testutils.MustMatchFn(".ID", ".CreatedAt")(t, wantStruct, checkFeasibilityQueries[0], "values don't match")
}

func TestGetAttributesForCheckFeasibilityQuery(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	checkFeasibilityQueryID := time.Now().UnixNano()

	checkFeasibilityQueryIDs := []int64{checkFeasibilityQueryID, checkFeasibilityQueryID, checkFeasibilityQueryID, checkFeasibilityQueryID}
	attributeNames := []string{"asdf1", "asdf2", "asdf3", "asdf4"}
	isRequireds := []bool{true, false, false, false}
	isForbiddens := []bool{false, true, false, false}
	isPreferreds := []bool{false, false, true, false}
	isUnwanteds := []bool{false, false, false, true}

	_, err := queries.UpsertAttributes(ctx, attributeNames)
	if err != nil {
		t.Fatal(err)
	}

	attributes, err := queries.GetAttributesForNames(ctx, attributeNames)
	if err != nil {
		t.Fatal(err)
	}

	var attributeIDs []int64
	for _, attribute := range attributes {
		attributeIDs = append(attributeIDs, attribute.ID)
	}

	_, err = queries.AddCheckFeasibilityQueryAttributes(ctx, logisticssql.AddCheckFeasibilityQueryAttributesParams{
		CheckFeasibilityQueryIds: checkFeasibilityQueryIDs,
		AttributeIds:             attributeIDs,
		IsRequireds:              isRequireds,
		IsForbiddens:             isForbiddens,
		IsPreferreds:             isPreferreds,
		IsUnwanteds:              isUnwanteds,
	})
	if err != nil {
		t.Fatal(err)
	}

	checkFeasibilityQueryAttributes, err := queries.GetAttributesForCheckFeasibilityQuery(ctx, checkFeasibilityQueryID)
	if err != nil {
		t.Fatal(err)
	}

	var resultAttributeNames []string
	for _, attribute := range checkFeasibilityQueryAttributes {
		resultAttributeNames = append(resultAttributeNames, attribute.Name)
	}

	testutils.MustMatch(t, attributeNames, resultAttributeNames, "values don't match")
}
