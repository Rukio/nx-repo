//go:build db_test

package logisticsdb_test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/collections"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	testDBName          = "logistics"
	noSettingsService   optimizersettings.Service
	mockSettingsService = &optimizersettings.MockSettingsService{RegionSettings: &optimizersettings.Settings{}}

	testDistance = logistics.Distance{
		Duration:     time.Duration(mapServiceDurationSec) * time.Second,
		LengthMeters: mapServiceDistanceMeters,
	}
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *logisticssql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, logisticssql.New(db), func() {
		db.Close()
	}
}

const (
	preloadedDistanceMeters = int32(10)
	preloadedDurationSec    = int32(100)

	mapServiceDistanceMeters = int64(99)
	mapServiceDurationSec    = int64(999)
)

func TestGetMultipleServiceRegionsOpenHoursForDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	numberOfServiceRegions := 3
	var serviceRegionIDS []int64
	startDayTime, _ := time.Parse(time.Kitchen, "8:00AM")
	endDayTime, _ := time.Parse(time.Kitchen, "10:00PM")

	tzLoc, err := time.LoadLocation("America/Mexico_City")
	if err != nil {
		t.Fatal(err)
	}

	date := time.Date(2022, time.November, 30, 0, 0, 0, 0, tzLoc)
	var day *logisticssql.ServiceRegionOpenHoursScheduleDay

	for i := 0; i < numberOfServiceRegions; i++ {
		serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
			Description:      "open hours region",
			IanaTimeZoneName: tzLoc.String(),
		})
		if err != nil {
			t.Fatal(err)
		}

		serviceRegionIDS = append(serviceRegionIDS, serviceRegion.ID)

		schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
		if err != nil {
			t.Fatal(err)
		}

		days, err := queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
			ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID},
			DaysOfWeek:                        []int32{int32(date.Weekday())},
			StartTimes:                        []time.Time{startDayTime},
			EndTimes:                          []time.Time{endDayTime},
		})
		if err != nil {
			t.Fatal(err)
		}
		day = days[0]
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil)

	beforeCreatedAt := day.CreatedAt
	openHours, err := ldb.GetMultipleServiceRegionOpenHoursForDate(ctx, logisticsdb.GetMultipleServiceRegionOpenHoursForDateParams{
		ServiceRegionIDS: serviceRegionIDS,
		Date:             date,
		SnapshotTime:     beforeCreatedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	expectedStartTimestamp := time.Date(date.Year(), date.Month(), date.Day(),
		startDayTime.Hour(), startDayTime.Minute(), startDayTime.Second(), startDayTime.Nanosecond(), tzLoc)
	expectedEndTimestamp := time.Date(date.Year(), date.Month(), date.Day(),
		endDayTime.Hour(), endDayTime.Minute(), endDayTime.Second(), endDayTime.Nanosecond(), tzLoc)

	openHourServiceRegionIDS := collections.NewLinkedInt64Set(len(openHours))

	for _, openHour := range openHours {
		openHourServiceRegionIDS.Add(openHour.ServiceRegionID)
		testutils.MustMatch(t, expectedStartTimestamp, openHour.TimeWindow.Start, "open hours start doesn't match")
		testutils.MustMatch(t, expectedEndTimestamp, openHour.TimeWindow.End, "open hours end doesn't match")
		testutils.MustMatch(t, openHour.ServiceRegionOpenHoursScheduleDay.DayOfWeek, day.DayOfWeek, "day of week doesn't match")
	}

	testutils.MustMatch(t, openHourServiceRegionIDS.Has(serviceRegionIDS...), true, "missing service region ids")
}

func TestGetServiceRegionOpenHoursForDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	startDayTime, _ := time.Parse(time.Kitchen, "8:00AM")
	endDayTime, _ := time.Parse(time.Kitchen, "10:00PM")

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "open hours region",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}

	schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
	if err != nil {
		t.Fatal(err)
	}

	date := time.Date(2022, time.May, 3, 0, 0, 0, 0, tzLoc)
	days, err := queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
		ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID},
		DaysOfWeek:                        []int32{int32(date.Weekday())},
		StartTimes:                        []time.Time{startDayTime},
		EndTimes:                          []time.Time{endDayTime},
	})
	if err != nil {
		t.Fatal(err)
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil)

	beforeCreatedAt := days[0].CreatedAt
	openHours, _, err := ldb.GetServiceRegionOpenHoursForDate(ctx, logisticsdb.GetServiceRegionOpenHoursForDateParams{
		ServiceRegionID: serviceRegion.ID,
		Date:            date,
		SnapshotTime:    beforeCreatedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	expectedStartTimestamp := time.Date(date.Year(), date.Month(), date.Day(),
		startDayTime.Hour(), startDayTime.Minute(), startDayTime.Second(), startDayTime.Nanosecond(), tzLoc)
	expectedEndTimestamp := time.Date(date.Year(), date.Month(), date.Day(),
		endDayTime.Hour(), endDayTime.Minute(), endDayTime.Second(), endDayTime.Nanosecond(), tzLoc)

	testutils.MustMatch(t, expectedStartTimestamp, openHours.Start, "open hours start doesn't match")
	testutils.MustMatch(t, expectedEndTimestamp, openHours.End, "open hours end doesn't match")
}

func setupServiceRegionForCreateVRPDescription(ctx context.Context, t *testing.T, queries *logisticssql.Queries) *logisticssql.ServiceRegion {
	t.Helper()

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}
	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "10:00PM")
	if err != nil {
		t.Fatal(err)
	}
	if err != nil {
		t.Fatal(err)
	}

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "vrp description region",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}

	stationMarketID := time.Now().UnixNano()

	testutils.MustFn(t)(queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: stationMarketID,
	}))

	latLongE6 := int32(time.Now().UnixNano())
	loc, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  latLongE6,
		LongitudeE6: latLongE6,
	})
	if err != nil {
		t.Fatal(err)
	}

	set, err := queries.AddServiceRegionCanonicalLocationSet(ctx, serviceRegion.ID)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddServiceRegionCanonicalLocations(ctx, logisticssql.AddServiceRegionCanonicalLocationsParams{
		ServiceRegionCanonicalLocationSetID: set.ID,
		LocationsIds:                        []int64{loc.ID},
	}))

	schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustFn(t)(queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
		ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID},
		DaysOfWeek:                        []int32{int32(time.Now().Weekday())},
		StartTimes:                        []time.Time{startDayTime},
		EndTimes:                          []time.Time{endDayTime},
	}))

	testutils.MustFn(t)(queries.AddServiceRegionCanonicalVisitDurations(ctx, logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
		ServiceRegionID:       serviceRegion.ID,
		ServiceDurationMinSec: int64(10),
		ServiceDurationMaxSec: int64(20),
	}))

	return serviceRegion
}

func TestLDB_AttachCheckFeasibilityRequestToProblem(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	startDayTime, err := time.Parse(time.Kitchen, "0:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "11:59PM")
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().In(tzLoc)
	date := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, startDayTime, tzLoc)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, endDayTime, tzLoc)

	lastOptimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  int64(1),
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	optimizerRun := &logisticssql.OptimizerRun{
		ID:                lastOptimizerRun.ID,
		SnapshotTimestamp: time.Now(),
	}

	tcs := []struct {
		Desc                 string
		CFIDs                []int64
		HasErr               bool
		NumExistingLocations int
		NumExistingVisits    int
		NumCFVisits          int
		NumCFLocationIDs     int
	}{
		{
			Desc:             "Error if base problem already has check feasibility IDs",
			CFIDs:            []int64{2, 4},
			HasErr:           true,
			NumCFVisits:      1,
			NumCFLocationIDs: 1,
		},
		{
			Desc:                 "Error if cfLocationIDs length doesn't match cfVisits",
			HasErr:               true,
			NumExistingLocations: 2,
			NumExistingVisits:    1,
			NumCFVisits:          2,
			NumCFLocationIDs:     1,
		},
		{
			Desc:                 "Base case",
			NumExistingLocations: 2,
			NumCFVisits:          1,
			NumExistingVisits:    1,
			NumCFLocationIDs:     1,
		},
		{
			Desc:                 "Base case 2",
			NumExistingLocations: 4,
			NumCFVisits:          3,
			NumCFLocationIDs:     3,
			NumExistingVisits:    5,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var distances []*optimizerpb.VRPDistance
			var locations []*optimizerpb.VRPLocation

			visits := make([]*logisticspb.CheckFeasibilityVisit, tc.NumCFVisits)
			latE6s := make([]int32, tc.NumCFVisits)
			lngE6s := make([]int32, tc.NumCFVisits)

			for i := 0; i < tc.NumCFVisits; i++ {
				latE6s[i] = *proto.Int32(int32(time.Now().UnixNano() + int64(i*100)))
				lngE6s[i] = *proto.Int32(int32(time.Now().UnixNano() + int64(i*100)))
				visits[i] = &logisticspb.CheckFeasibilityVisit{
					Location: &commonpb.Location{
						LatitudeE6:  latE6s[i],
						LongitudeE6: lngE6s[i],
					},
					ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
						ArrivalTimeWindow: &commonpb.TimeWindow{
							StartDatetime: logisticsdb.TimeToProtoDateTime(&startTimestamp),
							EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTimestamp),
						},
					},
				}
			}

			_, err := queries.UpsertLocations(ctx,
				logisticssql.UpsertLocationsParams{
					LatE6s: latE6s,
					LngE6s: lngE6s,
				})
			if err != nil {
				t.Fatal(err)
			}

			cfLocs, err := queries.GetLocations(ctx, logisticssql.GetLocationsParams{
				LatE6s: latE6s,
				LngE6s: lngE6s,
			})
			if err != nil {
				t.Fatal(err)
			}

			cfLocIDs := make([]int64, tc.NumCFLocationIDs)
			for i := 0; i < tc.NumCFLocationIDs; i++ {
				loc := cfLocs[i%len(cfLocs)]
				cfLocIDs[i] = loc.ID
			}

			existingVisits := make([]*optimizerpb.VRPVisit, tc.NumExistingVisits)
			for i := 0; i < tc.NumExistingVisits; i++ {
				existingVisits[i] = &optimizerpb.VRPVisit{Id: proto.Int64(123)}
			}

			if tc.NumExistingLocations > 0 {
				latE6s := make([]int32, tc.NumExistingLocations)
				lngE6s := make([]int32, tc.NumExistingLocations)
				for i := 0; i < tc.NumExistingLocations; i++ {
					latE6s[i] = *proto.Int32(int32(time.Now().UnixNano() + int64(i)))
					lngE6s[i] = *proto.Int32(int32(time.Now().UnixNano() + int64(i)))
				}

				locs, err := queries.UpsertLocations(ctx,
					logisticssql.UpsertLocationsParams{
						LatE6s: latE6s,
						LngE6s: lngE6s,
					})
				if err != nil {
					t.Fatal(err)
				}

				for _, fromLoc := range locs {
					locations = append(locations, &optimizerpb.VRPLocation{
						Id: &fromLoc.ID,
					})
					for _, ToLoc := range locs {
						distances = append(distances, &optimizerpb.VRPDistance{
							FromLocationId: &fromLoc.ID,
							ToLocationId:   &ToLoc.ID,
						})
					}
				}
			}

			problemData := &logisticsdb.VRPProblemData{
				FeasibilityVisitIDs: tc.CFIDs,
				OptimizerRun:        optimizerRun,

				VRPProblem: &optimizerpb.VRPProblem{
					Description: &optimizerpb.VRPDescription{
						Locations: locations,
						DistanceMatrix: &optimizerpb.VRPDistanceMatrix{
							Distances: distances,
						},
						Visits: existingVisits,
					},
				},
			}

			newProblemData, err := ldb.AttachCheckFeasibilityRequestToProblem(problemData, visits, cfLocIDs)

			testutils.MustMatch(t, tc.HasErr, err != nil, "errs don't match")

			if newProblemData == nil {
				return
			}

			testutils.MustMatch(t, tc.NumCFVisits+tc.NumExistingVisits, len(newProblemData.VRPProblem.Description.Visits))
		})
	}
}

func TestLDB_UpsertVisitLocations(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	visits := []*logisticspb.CheckFeasibilityVisit{{}}

	err := ldb.UpsertVisitLocations(ctx, visits)
	if err == nil {
		t.Fatalf("Expected error")
	}

	visits = []*logisticspb.CheckFeasibilityVisit{
		{
			Location: &commonpb.Location{
				LatitudeE6:  *proto.Int32(int32(time.Now().UnixNano())),
				LongitudeE6: *proto.Int32(int32(time.Now().UnixNano())),
			},
		},
	}

	err = ldb.UpsertVisitLocations(ctx, visits)
	if err != nil {
		t.Fatal(err)
	}

	locs, err := ldb.GetVisitLocations(ctx, visits)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, visits[0].Location.LatitudeE6, locs[0].LatitudeE6)
	testutils.MustMatch(t, visits[0].Location.LongitudeE6, locs[0].LongitudeE6)
}

func TestLDB_UpdateShiftTeamLocation(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	shiftTeamID := time.Now().UnixNano()
	unknownShiftTeamID := shiftTeamID + 12345

	serviceRegionID := time.Now().UnixNano()

	snapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       shiftTeamID,
		ServiceRegionID:   serviceRegionID,
		StartTimestampSec: 0,
		EndTimestampSec:   1,
	})
	if err != nil {
		t.Fatal(err)
	}

	latestSnapshotTimestamp := snapshot.CreatedAt

	tcs := []struct {
		Desc        string
		ShiftTeamID int64

		HasErr bool
	}{
		{
			Desc:        "base case",
			ShiftTeamID: shiftTeamID,
		},
		{
			Desc:        "unknown shift team id",
			ShiftTeamID: unknownShiftTeamID,

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			_, err := ldb.UpdateShiftTeamLocation(ctx, latestSnapshotTimestamp, tc.ShiftTeamID, logistics.LatLng{})
			if (err != nil) != tc.HasErr {
				t.Fatalf("error not the same: %+v", tc)
			}
		})
	}
}

func TestLDB_UpsertLocation(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	latLng := logistics.LatLng{
		LatE6: int32(time.Now().UnixNano()),
		LngE6: int32(time.Now().UnixNano()),
	}

	_, err := queries.UpsertLocation(ctx, logisticssql.UpsertLocationParams{
		LatitudeE6:  latLng.LatE6,
		LongitudeE6: latLng.LngE6,
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Desc   string
		LatLng logistics.LatLng
	}{
		{
			Desc:   "old latlng",
			LatLng: latLng,
		},
		{
			Desc: "new latlng",
			LatLng: logistics.LatLng{
				LatE6: latLng.LatE6 + 1,
				LngE6: latLng.LngE6 + 1,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			loc, err := logisticsdb.UpsertLocation(ctx, queries, tc.LatLng)
			if err != nil {
				t.Fatal(err)
			}

			if loc == nil {
				t.Fatal("location should not be nil")
			}
		})
	}
}

func TestLDB_AddShiftTeamRestBreakRequest(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	t.Run("happy path, then disallow dupes", func(t *testing.T) {
		stationMarketID := time.Now().UnixNano()
		shiftTeamID := time.Now().UnixNano()
		duration := int64(100)
		addStationMarket(ctx, t, queries, stationMarketID)
		writeTeamShiftSnapshot(ctx, t, &writeTeamShiftTeamSnapshotParams{
			stationMarketID: stationMarketID,
			shiftTeamID:     shiftTeamID,
			ldb:             ldb,
		})

		restBreakParams := logisticssql.AddShiftTeamRestBreakRequestParams{
			ShiftTeamID:          shiftTeamID,
			StartTimestampSec:    time.Now().Unix(),
			DurationSec:          duration,
			LocationID:           time.Now().UnixNano(),
			MaxRestBreakRequests: 1,
		}
		restBreakParams2 := restBreakParams
		restBreakParams2.MaxRestBreakRequests = 2

		params1 := logisticsdb.AddShiftTeamRestBreakParams{
			RestBreakParams: restBreakParams,
			LatestTimestamp: time.Now(),
		}
		params2 := logisticsdb.AddShiftTeamRestBreakParams{
			RestBreakParams: restBreakParams2,
			LatestTimestamp: time.Now(),
		}
		_, err := ldb.AddShiftTeamRestBreakRequest(ctx, params1)
		testutils.MustMatch(t, nil, err, "first add should go through")

		_, err = ldb.AddShiftTeamRestBreakRequest(ctx, params1)
		testutils.MustMatch(t, fmt.Errorf("shift team %d already has the maximum %d rest breaks per day", params1.RestBreakParams.ShiftTeamID, 1), err, "but the second should not")

		_, err = ldb.AddShiftTeamRestBreakRequest(ctx, params2)
		testutils.MustMatch(t, nil, err, "unless we allow more rest breaks per day")
	})
}

func TestLDB_GetLatestShiftTeamLocationID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	serviceRegionID := time.Now().UnixNano()

	tcs := []struct {
		Desc            string
		SnapshotCount   int
		MissingLocation bool

		HasErr bool
	}{
		{
			Desc:          "no snapshots",
			SnapshotCount: 0,

			HasErr:          true,
			MissingLocation: true,
		},
		{
			Desc:          "base case",
			SnapshotCount: 1,
		},
		{
			Desc:            "no locations, yes snapshot",
			SnapshotCount:   1,
			MissingLocation: true,
			HasErr:          true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var latestSnapshotID int64
			shiftTeamID := time.Now().UnixNano()
			locationID := time.Now().UnixNano()
			for i := 0; i < tc.SnapshotCount; i++ {
				snapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
					ShiftTeamID:       shiftTeamID,
					ServiceRegionID:   serviceRegionID,
					StartTimestampSec: 0,
					EndTimestampSec:   1,
				})
				if err != nil {
					t.Fatal(err)
				}

				latestSnapshotID = snapshot.ID
			}
			if !tc.MissingLocation {
				_, err := queries.AddShiftTeamLocation(ctx, logisticssql.AddShiftTeamLocationParams{
					ShiftTeamSnapshotID: latestSnapshotID,
					LocationID:          locationID,
				})
				if err != nil {
					t.Fatal(err)
				}
			}

			latestLocationID, err := ldb.GetLatestShiftTeamLocationID(ctx, shiftTeamID, time.Now().Add(time.Minute))
			testutils.MustMatch(t, tc.HasErr, err != nil, "errs don't match")

			if tc.MissingLocation && tc.SnapshotCount > 0 {
				testutils.MustMatch(t, logisticsdb.ErrNoShiftTeamLocation, err)
			}
			if tc.HasErr {
				return
			}

			testutils.MustMatch(t, locationID, latestLocationID, "location ids don't match")
		})
	}
}

func TestLDB_GetLatestShiftTeamSnapshotID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	serviceRegionID := time.Now().UnixNano()
	shiftTeamID := time.Now().UnixNano()

	tcs := []struct {
		Desc          string
		SnapshotCount int

		HasErr bool
	}{
		{
			Desc:          "base case",
			SnapshotCount: 1,
		},
		{
			Desc:          "many snapshots",
			SnapshotCount: 10,
		},
		{
			Desc:          "no snapshots",
			SnapshotCount: 0,

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var latestSnapshotID int64
			var latestTimestamp time.Time
			for i := 0; i < tc.SnapshotCount; i++ {
				snapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
					ShiftTeamID:       shiftTeamID,
					ServiceRegionID:   serviceRegionID,
					StartTimestampSec: 0,
					EndTimestampSec:   1,
				})
				if err != nil {
					t.Fatal(err)
				}

				latestSnapshotID = snapshot.ID
				latestTimestamp = snapshot.CreatedAt
			}

			snapshotResponse, err := ldb.GetLatestShiftTeamSnapshotID(ctx, latestTimestamp, shiftTeamID)
			if (err != nil) != tc.HasErr {
				t.Fatal(err)
			}

			if tc.HasErr {
				return
			}

			testutils.MustMatch(t, latestSnapshotID, *snapshotResponse.ShiftTeamSnapshotID, "snapshot ids don't match")
		})
	}
}

func TestLDB_GetLatestVisitSnapshot(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	tcs := []struct {
		Desc          string
		SnapshotCount int

		HasErr bool
	}{
		{
			Desc:          "base case",
			SnapshotCount: 1,
		},
		{
			Desc:          "many snapshots",
			SnapshotCount: 10,
		},
		{
			Desc:          "no snapshots",
			SnapshotCount: 0,

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			serviceRegionID := time.Now().UnixNano()
			careRequestID := time.Now().UnixNano()

			var latestSnapshotID int64
			for i := 0; i < tc.SnapshotCount; i++ {
				snapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
					CareRequestID:            careRequestID,
					ServiceRegionID:          serviceRegionID,
					LocationID:               time.Now().UnixNano(),
					ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
					ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
				})
				if err != nil {
					t.Fatal(err)
				}

				latestSnapshotID = snapshot.ID
			}

			newSnapshot, err := ldb.GetLatestVisitSnapshot(ctx, careRequestID, time.Now().Add(time.Minute))
			if (err != nil) != tc.HasErr {
				t.Fatal(err)
			}

			if tc.HasErr {
				return
			}

			testutils.MustMatch(t, latestSnapshotID, newSnapshot.ID, "snapshot ids don't match")
		})
	}
}

func TestLDB_DeleteVisitSnapshotForCareRequestID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	serviceRegionID := int64(1)

	tcs := []struct {
		Desc          string
		SnapshotCount int
		CareReqID     int64
		HasErr        bool
	}{
		{
			Desc:          "base case",
			SnapshotCount: 1,
			CareReqID:     1,
		},
		{
			Desc:          "incorrect care request ID",
			SnapshotCount: 0, // skip creation
			CareReqID:     0,
			HasErr:        true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			for i := 0; i < tc.SnapshotCount; i++ {
				// Add Snapshot
				newSnapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
					CareRequestID:            tc.CareReqID,
					ServiceRegionID:          serviceRegionID,
					LocationID:               time.Now().UnixNano(),
					ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
					ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
				})
				if err != nil {
					t.Fatal(err)
				}

				// Verify Existence and null deleted_at field
				getSnapshot, err := ldb.GetLatestVisitSnapshot(ctx, tc.CareReqID, time.Now().Add(time.Minute))
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, newSnapshot.ID, getSnapshot.ID, "snapshot not added")
				testutils.MustMatch(t, newSnapshot.DeletedAt.Valid, false, "snapshot deleted_at field null")
			}

			// Delete and verify deleted_at field and correct serviceRegionID in response
			deletedVisitResponse, err := ldb.DeleteVisitSnapshotForCareRequestID(ctx, tc.CareReqID)
			if (err != nil) != tc.HasErr {
				t.Fatal(err)
			}
			if tc.HasErr {
				return
			}

			deletedSnapshot, err := ldb.GetLatestVisitSnapshot(ctx, tc.CareReqID, time.Now().Add(time.Minute))
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, deletedSnapshot.DeletedAt.Valid, true, "snapshot deleted_at field non-null")
			testutils.MustMatch(t, serviceRegionID, deletedVisitResponse.ServiceRegionID, "incorrect service region ID")
		})
	}
}

func TestLogisticsDB_GetServiceRegionVisitServiceDurations(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	serviceRegionID := time.Now().UnixNano()

	visitDurations, err := ldb.GetServiceRegionVisitServiceDurations(ctx, logisticssql.GetServiceRegionCanonicalVisitDurationsParams{ServiceRegionID: serviceRegionID, CreatedBefore: time.Now()})
	if err == nil {
		t.Fatal("expected to have error for undefined minimal service duration")
	}
	if visitDurations[logisticsdb.MinVisitServiceDurationKey].Seconds() != 0 {
		t.Fatal("undefined service region minimal visit duration should be set to zero")
	}

	minServiceDuration := 300 * time.Second
	maxServiceDuration := 600 * time.Second
	_, err = queries.AddServiceRegionCanonicalVisitDurations(ctx, logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
		ServiceRegionID:       serviceRegionID,
		ServiceDurationMinSec: int64(minServiceDuration.Seconds()),
		ServiceDurationMaxSec: int64(maxServiceDuration.Seconds()),
	})
	if err != nil {
		t.Fatal(err)
	}

	visitDurations, err = ldb.GetServiceRegionVisitServiceDurations(ctx, logisticssql.GetServiceRegionCanonicalVisitDurationsParams{ServiceRegionID: serviceRegionID, CreatedBefore: time.Now()})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, minServiceDuration, visitDurations[logisticsdb.MinVisitServiceDurationKey], "service region minimal visit duration doesn't match")
	testutils.MustMatch(t, maxServiceDuration, visitDurations[logisticsdb.MaxVisitServiceDurationKey], "service region max visit duration doesn't match")
}

func TestLDB_GetServiceRegionCanonicalLocations(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	serviceRegionID := time.Now().UnixNano()

	baseLatLngCoord := time.Now().UnixNano()
	var latLngs []logistics.LatLng
	var wantLocs []*logisticssql.Location
	for i := int32(0); i < 10; i++ {
		latLngs = append(latLngs, logistics.LatLng{
			LatE6: int32(baseLatLngCoord) + i*2,
			LngE6: int32(baseLatLngCoord) + i*2 + 1,
		})
		wantLocs = append(wantLocs, &logisticssql.Location{
			LatitudeE6:  int32(baseLatLngCoord) + i*2,
			LongitudeE6: int32(baseLatLngCoord) + i*2 + 1,
		})
	}

	serviceRegionCanonicalLocations, err := ldb.GetServiceRegionCanonicalLocations(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}
	if serviceRegionCanonicalLocations != nil {
		t.Fatal("service region canonical locations should not be set")
	}

	now := time.Now()
	_, err = ldb.GetServiceRegionVisitServiceDurations(ctx, logisticssql.GetServiceRegionCanonicalVisitDurationsParams{
		ServiceRegionID: serviceRegionID,
		CreatedBefore:   now,
	})
	if !errors.Is(err, logisticsdb.ErrUndefinedVisitServiceDurationsForRegion) {
		t.Fatal(err)
	}

	minServiceDuration := 1 * time.Minute
	maxServiceDuration := 2 * time.Minute
	locs, err := ldb.UpdateServiceRegionFeasibilityCheckSettings(ctx, logisticsdb.UpdateServiceRegionFeasibilityCheckSettingsParams{
		ServiceRegionID:  serviceRegionID,
		Locations:        latLngs,
		MinVisitDuration: &minServiceDuration,
		MaxVisitDuration: &maxServiceDuration,
	})
	if err != nil {
		t.Fatal(err)
	}

	mustMatchLocs := testutils.MustMatchFn(".ID", ".CreatedAt")
	mustMatchLocs(t, wantLocs, locs, "Service region canonical locations don't match")

	serviceRegionCanonicalLocations, err = ldb.GetServiceRegionCanonicalLocations(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	mustMatchLocs(t, wantLocs, serviceRegionCanonicalLocations, "Service region canonical locations don't match")

	now = time.Now()
	durations, err := ldb.GetServiceRegionVisitServiceDurations(ctx, logisticssql.GetServiceRegionCanonicalVisitDurationsParams{
		ServiceRegionID: serviceRegionID,
		CreatedBefore:   now,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, minServiceDuration, durations[logisticsdb.MinVisitServiceDurationKey])
	testutils.MustMatch(t, maxServiceDuration, durations[logisticsdb.MaxVisitServiceDurationKey])
}

func TestLDB_GetServiceRegionIDForStationMarketID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "some service region",
		IanaTimeZoneName: "Asia/Tokyo",
	})
	if err != nil {
		t.Fatal(err)
	}

	stationMarketID := time.Now().UnixNano()
	unknownStationMarketID := stationMarketID + 1

	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: stationMarketID,
		ShortName:       "random market in some service region",
	})
	if err != nil {
		t.Fatal(err)
	}

	newServiceRegion, err := ldb.GetServiceRegionForStationMarketID(ctx, stationMarketID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, serviceRegion.ID, newServiceRegion.ID, "service region IDs don't match for existing station market ID")

	_, err = ldb.GetServiceRegionForStationMarketID(ctx, unknownStationMarketID)
	if err == nil {
		t.Fatal("unknown station market ID should give an error for service region")
	}
}

func TestLDB_GetLocationsByIDs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	loc, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  int32(time.Now().UnixNano()),
		LongitudeE6: int32(time.Now().UnixNano()),
	})
	if err != nil {
		t.Fatal(err)
	}

	knownLocID := loc.ID
	unknownLocID := int64(-1)

	tcs := []struct {
		Desc       string
		KnownIDs   int
		UnknownIDs int

		HasErr bool
	}{
		{
			Desc:       "base case",
			KnownIDs:   1,
			UnknownIDs: 0,
		},
		{
			Desc:       "no ids",
			KnownIDs:   0,
			UnknownIDs: 0,
		},
		{
			Desc:       "many konwn ids",
			KnownIDs:   10,
			UnknownIDs: 0,
		},
		{
			Desc:       "has 1 unknown id",
			KnownIDs:   0,
			UnknownIDs: 1,

			HasErr: true,
		},
		{
			Desc:       "has many unknown ids",
			KnownIDs:   0,
			UnknownIDs: 10,

			HasErr: true,
		},
		{
			Desc:       "has many known and unknown ids",
			KnownIDs:   10,
			UnknownIDs: 10,

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var ids []int64
			for i := 0; i < tc.KnownIDs; i++ {
				ids = append(ids, knownLocID)
			}
			for i := 0; i < tc.UnknownIDs; i++ {
				ids = append(ids, unknownLocID)
			}

			locs, err := ldb.GetLocationsByIDs(ctx, ids)
			if (err != nil) != tc.HasErr {
				t.Fatalf("error doesn't match: %v, tc: %+v", err, tc)
			}

			if tc.HasErr {
				return
			}

			if len(locs) != tc.KnownIDs {
				t.Fatalf("number of locs is wrong: %d, tc: %+v", len(locs), tc)
			}
		})
	}
}

func TestLDB_AddOptimizerRunErrorRoundtrip(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	optimizerRunID := time.Now().UnixNano()
	errorValue := "some error value string"
	params := logisticssql.AddOptimizerRunErrorParams{
		OptimizerRunID:            optimizerRunID,
		ErrorValue:                errorValue,
		OptimizerRunErrorSourceID: 1,
	}
	err := ldb.AddOptimizerRunError(ctx, params)
	if err != nil {
		t.Fatal(err)
	}
	back, err := queries.GetOptimizerRunErrorForOptimizerRunID(ctx, optimizerRunID)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, params.ErrorValue, back.ErrorValue)
}

func TestLDB_VRPProblemDataForSchedule(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	mapService := &mockDistanceMatrix{}
	ldb := logisticsdb.NewLogisticsDB(db, logistics.NewMapServicePicker(mapService, mapService, mockSettingsService), mockSettingsService, monitoring.NewMockScope())

	serviceRegion := setupServiceRegionForCreateVRPDescription(ctx, t, queries)
	logisticsVersion := "<some logistics SHA>"
	optimizerVersion := "<some optimizer SHA>"
	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:           serviceRegion.ID,
		ServiceDate:               time.Now(),
		SnapshotTimestamp:         time.Now(),
		ServiceVersion:            logisticsVersion,
		EarliestDistanceTimestamp: time.Now().Add(-time.Minute),
		OptimizerRunType:          string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}
	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		OptimizerRunID:   optimizerRun.ID,
		OptimizerVersion: optimizerVersion,
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Desc                 string
		ScheduleID           int64
		HasOptimizerRunError bool

		TestShouldError bool
	}{
		{
			Desc:       "Base Case without error",
			ScheduleID: schedule.ID,
		},
		{
			Desc:            "Unknown schedule ID error",
			ScheduleID:      time.Now().UnixNano(),
			TestShouldError: true,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			_, err := ldb.VRPProblemDataForSchedule(ctx, tc.ScheduleID)
			if err != nil && !tc.TestShouldError {
				t.Fatal(err)
			}

			if tc.TestShouldError {
				return
			}
		})
	}
}

func TestLDB_GetOptimizerRunDiagnostics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	mapService := &mockDistanceMatrix{}
	ldb := logisticsdb.NewLogisticsDB(db, logistics.NewMapServicePicker(mapService, mapService, mockSettingsService), mockSettingsService, monitoring.NewMockScope())

	serviceRegion := setupServiceRegionForCreateVRPDescription(ctx, t, queries)
	logisticsVersion := "<some logistics SHA>"
	optimizerVersion := "<some optimizer SHA>"
	optimizerRunWithoutError, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:           serviceRegion.ID,
		ServiceDate:               time.Now(),
		SnapshotTimestamp:         time.Now(),
		ServiceVersion:            logisticsVersion,
		EarliestDistanceTimestamp: time.Now().Add(-time.Minute),
		OptimizerRunType:          string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		OptimizerRunID:   optimizerRunWithoutError.ID,
		ServiceRegionID:  serviceRegion.ID,
		OptimizerVersion: optimizerVersion,
	}))
	availabilityOptimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:           serviceRegion.ID,
		ServiceDate:               time.Now(),
		SnapshotTimestamp:         time.Now(),
		ServiceVersion:            logisticsVersion,
		EarliestDistanceTimestamp: time.Now().Add(-time.Minute),
		OptimizerRunType:          string(logisticsdb.ServiceRegionAvailabilityRunType),
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		OptimizerRunID:   availabilityOptimizerRun.ID,
		ServiceRegionID:  serviceRegion.ID,
		OptimizerVersion: optimizerVersion,
	}))
	optimizerRunWithError, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:           serviceRegion.ID,
		ServiceDate:               time.Now(),
		SnapshotTimestamp:         time.Now(),
		ServiceVersion:            logisticsVersion,
		EarliestDistanceTimestamp: time.Now().Add(-time.Minute),
		OptimizerRunType:          string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddOptimizerRunError(ctx, logisticssql.AddOptimizerRunErrorParams{
		OptimizerRunID:            optimizerRunWithError.ID,
		ErrorValue:                "error in optimizer run writing",
		OptimizerRunErrorSourceID: 1,
	}))

	tcs := []struct {
		Desc                 string
		OptimizerRunID       int64
		HasOptimizerRunError bool

		TestShouldError bool
	}{
		{
			Desc:           "Base Case without error",
			OptimizerRunID: optimizerRunWithoutError.ID,
		},
		{
			Desc:           "Base Case availability run",
			OptimizerRunID: availabilityOptimizerRun.ID,
		},
		{
			Desc:                 "Base case with optimizer run error",
			OptimizerRunID:       optimizerRunWithError.ID,
			HasOptimizerRunError: true,
		},
		{
			Desc:            "Unknown optimizer run ID",
			OptimizerRunID:  time.Now().UnixNano(),
			TestShouldError: true,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			ord, err := ldb.GetOptimizerRunDiagnostics(ctx, tc.OptimizerRunID, nil, nil)
			if err != nil && !tc.TestShouldError {
				t.Fatal(err)
			}

			if tc.TestShouldError {
				return
			}
			testutils.MustMatch(t, ord.Run.ID, tc.OptimizerRunID, "the matching optimizer run is in the response")
			if tc.HasOptimizerRunError {
				testutils.MustMatch(t, ord.RunError.OptimizerRunID, tc.OptimizerRunID, "and the matching error, if it exists")
			} else {
				testutils.MustMatch(t, ord.OptimizerVersion, optimizerVersion, "at least when there's a latest schedule, there should be a revision")
			}
		})
	}
}

func TestLDB_GetLatestShiftTeamSchedule(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "some region",
		IanaTimeZoneName: "America/Mexico_City",
	})
	if err != nil {
		t.Fatalf("error adding service region: %s", err)
	}

	var serviceDate = &commonpb.Date{Year: 2022, Month: 8, Day: 2}
	var snapshotTime = time.Now().Truncate(time.Second)

	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:   serviceRegion.ID,
		ServiceDate:       *logisticsdb.ProtoDateToTime(serviceDate),
		SnapshotTimestamp: snapshotTime,
		OptimizerRunType:  string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatalf("error adding optimizer run: %s", err)
	}

	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegion.ID,
		OptimizerRunID:  optimizerRun.ID,
	})
	if err != nil {
		t.Fatalf("error adding schedule: %s", err)
	}

	token, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(schedule.ID),
	})
	if err != nil {
		t.Fatal(err)
	}

	expectedMeta := &logisticspb.ScheduleMetadata{
		ScheduleToken: token,
		ServiceDate:   serviceDate,
		GeneratedAt:   timestamppb.New(snapshotTime),
	}

	coordinate := int32(time.Now().UnixNano())

	locations, err := queries.UpsertLocations(ctx, logisticssql.UpsertLocationsParams{
		LatE6s: []int32{
			coordinate,
			coordinate + 1,
			coordinate + 2,
		},
		LngE6s: []int32{
			coordinate,
			coordinate + 1,
			coordinate + 2,
		},
	})
	if err != nil {
		t.Fatalf("error adding locations: %s", err)
	}

	baseLocation := locations[0]
	visitLocation := locations[1]
	visitLocation2 := locations[2]

	withVisitsShiftTeamID := time.Now().UnixNano()
	unknownShiftTeamID := withVisitsShiftTeamID + 2
	withoutVisitsShiftTeamID := withVisitsShiftTeamID + 3
	withoutBaseLocationShiftTeamID := withVisitsShiftTeamID + 4
	startTimestamp := time.Date(2022, time.January, 1, 20, 0, 0, 0, time.Local)
	startTimestampSec := startTimestamp.Unix()
	endTimestampSec := startTimestampSec + 1

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "9:00PM")
	if err != nil {
		t.Fatal(err)
	}

	openHoursSchedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
		ServiceRegionOpenHoursScheduleIds: []int64{openHoursSchedule.ID},
		DaysOfWeek:                        []int32{int32(logisticsdb.ProtoDateToTime(serviceDate).Weekday())},
		StartTimes:                        []time.Time{startDayTime},
		EndTimes:                          []time.Time{endDayTime},
	})
	if err != nil {
		t.Fatal(err)
	}

	shiftTeamWithVisitsSnapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       withVisitsShiftTeamID,
		ServiceRegionID:   serviceRegion.ID,
		BaseLocationID:    baseLocation.ID,
		StartTimestampSec: startTimestampSec,
		EndTimestampSec:   endTimestampSec,
	})
	if err != nil {
		t.Fatalf("error adding shift team snapshot: %s", err)
	}
	pendingRestBreak, err := queries.AddShiftTeamRestBreakRequest(ctx, logisticssql.AddShiftTeamRestBreakRequestParams{
		ShiftTeamID:          shiftTeamWithVisitsSnapshot.ShiftTeamID,
		StartTimestampSec:    startTimestampSec,
		DurationSec:          120,
		LocationID:           baseLocation.ID,
		MaxRestBreakRequests: 1,
	})
	if err != nil {
		t.Fatal(err)
	}

	shiftTeamWithoutVisitsSnapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       withoutVisitsShiftTeamID,
		ServiceRegionID:   serviceRegion.ID,
		BaseLocationID:    baseLocation.ID,
		StartTimestampSec: startTimestampSec,
		EndTimestampSec:   endTimestampSec,
	})
	if err != nil {
		t.Fatalf("error adding shift team snapshot: %s", err)
	}

	testutils.MustFn(t)(queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       withoutBaseLocationShiftTeamID,
		ServiceRegionID:   serviceRegion.ID,
		StartTimestampSec: startTimestampSec,
		EndTimestampSec:   endTimestampSec,
	}))

	scheduleIDs := []int64{schedule.ID, schedule.ID}
	shiftTeamSnapshotIDs := []int64{shiftTeamWithVisitsSnapshot.ID, shiftTeamWithoutVisitsSnapshot.ID}
	depotArrivalTimestampsSec := []int64{startTimestampSec, startTimestampSec}

	scheduleRoutes, err := queries.AddScheduleRoutes(ctx, logisticssql.AddScheduleRoutesParams{
		ScheduleIds:               scheduleIDs,
		ShiftTeamSnapshotIds:      shiftTeamSnapshotIDs,
		DepotArrivalTimestampsSec: depotArrivalTimestampsSec,
	})
	if err != nil {
		t.Fatalf("error adding schedule routes: %s", err)
	}
	latestShiftTeamSnapshotTimestamp := scheduleRoutes[1].CreatedAt

	careRequestID := time.Now().UnixNano()
	careRequestID2 := careRequestID + 1
	arrivalTimestampSec := startTimestampSec
	arrivalTimestampSec2 := arrivalTimestampSec + 1
	serviceDurationSec := int64(3600)

	visitSnapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            careRequestID,
		ServiceRegionID:          serviceRegion.ID,
		LocationID:               visitLocation.ID,
		ServiceDurationSec:       serviceDurationSec,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
	})
	if err != nil {
		t.Fatalf("error adding visit snapshot: %s", err)
	}
	testutils.MustFn(t)(queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  visitSnapshot.ID,
		VisitPhaseTypeID: 2, // committed
		StatusCreatedAt:  time.Now(),
	}))
	visitSnapshot2, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            careRequestID2,
		ServiceRegionID:          serviceRegion.ID,
		LocationID:               visitLocation2.ID,
		ServiceDurationSec:       serviceDurationSec,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
	})
	if err != nil {
		t.Fatalf("error adding visit snapshot: %s", err)
	}
	testutils.MustFn(t)(queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  visitSnapshot2.ID,
		VisitPhaseTypeID: 1, // uncommitted
		StatusCreatedAt:  time.Now(),
	}))

	scheduleRouteIds := []int64{scheduleRoutes[0].ID, scheduleRoutes[0].ID}
	visitSnapshotIds := []int64{visitSnapshot2.ID, visitSnapshot.ID}
	arrivalTimestampsSecs := []int64{arrivalTimestampSec2, arrivalTimestampSec}
	routeIndexes := []int32{2, 1}
	scheduleIDs = []int64{schedule.ID, schedule.ID}
	addScheduleVisitStopsParams := logisticssql.AddScheduleVisitStopsParams{}
	for i := 0; i < len(scheduleIDs); i++ {
		sv, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
			ScheduleID:          scheduleIDs[i],
			ScheduleRouteID:     scheduleRouteIds[i],
			VisitSnapshotID:     sqltypes.ToValidNullInt64(visitSnapshotIds[i]),
			ArrivalTimestampSec: arrivalTimestampsSecs[i],
		})
		if err != nil {
			t.Fatalf("error adding schedule visit: %s", err)
		}
		addScheduleVisitStopsParams.ScheduleVisitIds = append(addScheduleVisitStopsParams.ScheduleVisitIds, sv.ID)
		addScheduleVisitStopsParams.ScheduleIds = append(addScheduleVisitStopsParams.ScheduleIds, sv.ScheduleID)
		addScheduleVisitStopsParams.ScheduleRouteIds = append(addScheduleVisitStopsParams.ScheduleRouteIds, sv.ScheduleRouteID)
		addScheduleVisitStopsParams.RouteIndexes = append(addScheduleVisitStopsParams.RouteIndexes, routeIndexes[i])
	}

	testutils.MustFn(t)(queries.AddScheduleVisitStops(ctx, addScheduleVisitStopsParams))

	respWithVisits := &logisticspb.GetShiftTeamScheduleResponse{
		Meta: expectedMeta,
		Schedule: &logisticspb.ShiftTeamSchedule{
			ShiftTeamId: withVisitsShiftTeamID,
			Route: &logisticspb.ShiftTeamRoute{
				BaseLocation: &commonpb.Location{
					LatitudeE6:  baseLocation.LatitudeE6,
					LongitudeE6: baseLocation.LongitudeE6,
				},
				BaseLocationArrivalTimestampSec: &startTimestampSec,
				Stops: []*logisticspb.ShiftTeamRouteStop{
					{
						Stop: &logisticspb.ShiftTeamRouteStop_Visit{
							Visit: &logisticspb.ShiftTeamVisit{
								CareRequestId:        &careRequestID,
								ArrivalTimestampSec:  &arrivalTimestampSec,
								CompleteTimestampSec: proto.Int64(arrivalTimestampSec + serviceDurationSec),
								Location: &commonpb.Location{
									LatitudeE6:  visitLocation.LatitudeE6,
									LongitudeE6: visitLocation.LongitudeE6,
								},
								Status: logisticspb.ShiftTeamVisit_STATUS_COMMITTED.Enum(),
							},
						},
					},
					{
						Stop: &logisticspb.ShiftTeamRouteStop_Visit{
							Visit: &logisticspb.ShiftTeamVisit{
								CareRequestId:        &careRequestID2,
								ArrivalTimestampSec:  &arrivalTimestampSec2,
								CompleteTimestampSec: proto.Int64(arrivalTimestampSec2 + serviceDurationSec),
								Location: &commonpb.Location{
									LatitudeE6:  visitLocation2.LatitudeE6,
									LongitudeE6: visitLocation2.LongitudeE6,
								},
								Status: logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
							},
						},
					},
				},
			},
		},
		PendingUpdates: &logisticspb.SchedulePendingUpdates{RestBreakRequests: []*logisticspb.ShiftTeamRestBreakRequest{
			{
				ShiftTeamId: pendingRestBreak.ShiftTeamID,
				BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
					OnDemand: &logisticspb.BreakOnDemand{
						StartTimestampSec: proto.Int64(pendingRestBreak.StartTimestampSec),
						DurationSec:       proto.Int64(pendingRestBreak.DurationSec),
					},
				},
			},
		}},
	}

	respWithoutVisits := &logisticspb.GetShiftTeamScheduleResponse{
		Meta: expectedMeta,
		Schedule: &logisticspb.ShiftTeamSchedule{
			ShiftTeamId: withoutVisitsShiftTeamID,
			Route: &logisticspb.ShiftTeamRoute{
				BaseLocation: &commonpb.Location{
					LatitudeE6:  baseLocation.LatitudeE6,
					LongitudeE6: baseLocation.LongitudeE6,
				},
			},
		},
		PendingUpdates: &logisticspb.SchedulePendingUpdates{},
	}

	tcs := []struct {
		Desc        string
		ShiftTeamID int64
		Resp        *logisticspb.GetShiftTeamScheduleResponse

		HasError bool
	}{
		{
			Desc:        "Base Case",
			ShiftTeamID: withVisitsShiftTeamID,

			HasError: false,
			Resp:     respWithVisits,
		},
		{
			Desc: "Shift Team doesn't exist",

			ShiftTeamID: unknownShiftTeamID,
			HasError:    true,
		},
		{
			Desc:        "No visits",
			ShiftTeamID: withoutVisitsShiftTeamID,

			HasError: false,
			Resp:     respWithoutVisits,
		},
		{
			Desc:        "No base location",
			ShiftTeamID: withoutBaseLocationShiftTeamID,

			HasError: true,
		},
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	earliestShiftTeamSnapshotTimestamp := latestShiftTeamSnapshotTimestamp.Add(-optimizersettings.DefaultSnapshotsLookbackDuration())
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			schedule, err := ldb.GetLatestShiftTeamSchedule(
				ctx,
				tc.ShiftTeamID,
				logisticsdb.TimeWindow{
					Start: earliestShiftTeamSnapshotTimestamp,
					End:   latestShiftTeamSnapshotTimestamp,
				},
			)
			if err != nil && !tc.HasError {
				t.Fatal(err)
			}

			if tc.HasError {
				return
			}
			resp := &logisticspb.GetShiftTeamScheduleResponse{
				Meta:           schedule.Metadata,
				Schedule:       schedule.Schedule,
				PendingUpdates: schedule.PendingUpdates,
			}

			testutils.MustMatchProto(t, tc.Resp, resp, "The content of the response doesn't match")
		})
	}
}

func TestGetMissingScheduleInfoByServiceDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	defer done()

	tzLoc, _ := time.LoadLocation("UTC")
	firstDayDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}

	endDayTime, err := time.Parse(time.Kitchen, "9:00PM")
	if err != nil {
		t.Fatal(err)
	}

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "open hours region",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}

	firstDayStartTimestamp := logisticsdb.TimestampFromDateTimeLoc(firstDayDate, startDayTime, tzLoc)
	firstDayEndTimestamp := logisticsdb.TimestampFromDateTimeLoc(firstDayDate, endDayTime, tzLoc)
	missingShiftTeamsInfo := []struct {
		NumMissing int
	}{
		{
			NumMissing: 2,
		},
		{
			NumMissing: 0,
		},
		{
			NumMissing: 5,
		},
	}

	expectedPendingShiftTeamUpdates := make(map[int][]*logisticspb.PendingShiftTeamUpdate)
	expectedPendingCareRequestUpdates := make(map[int][]*logisticspb.PendingVisitUpdate)
	getMissingSchedulesShiftTeamParams := make([]logisticssql.GetShiftTeamsIDsInRegionSinceParams, len(missingShiftTeamsInfo))
	getMissingSchedulesCareRequestParams := make([]logisticssql.GetCareRequestIDsSinceParams, len(missingShiftTeamsInfo))
	var earliestTimestamp time.Time
	for i, mi := range missingShiftTeamsInfo {
		startShiftTimestampSec := firstDayStartTimestamp.AddDate(0, 0, i).Unix()
		endShiftTimeStampSec := firstDayEndTimestamp.AddDate(0, 0, i).Unix()
		expectedPendingShiftTeamUpdates[i] = make([]*logisticspb.PendingShiftTeamUpdate, mi.NumMissing)
		expectedPendingCareRequestUpdates[i] = make([]*logisticspb.PendingVisitUpdate, mi.NumMissing)
		for j := 0; j < mi.NumMissing; j++ {
			shiftTeamSnapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
				ShiftTeamID:       time.Now().UnixNano(),
				ServiceRegionID:   serviceRegion.ID,
				StartTimestampSec: startShiftTimestampSec,
				EndTimestampSec:   endShiftTimeStampSec,
				BaseLocationID:    0,
			})
			if err != nil {
				t.Fatal(err)
			}

			visit, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
				CareRequestID:   time.Now().UnixNano(),
				ServiceRegionID: serviceRegion.ID,
				ArrivalStartTimestampSec: sql.NullInt64{
					Valid: true,
					Int64: startShiftTimestampSec,
				},
				ArrivalEndTimestampSec: sql.NullInt64{
					Valid: true,
					Int64: endShiftTimeStampSec,
				},
			})
			if err != nil {
				t.Fatal(err)
			}
			if i == 0 && j == 0 {
				earliestTimestamp = shiftTeamSnapshot.CreatedAt.Add(-1 * time.Minute)
			}
			expectedPendingShiftTeamUpdates[i][j] = &logisticspb.PendingShiftTeamUpdate{
				ShiftTeamId: shiftTeamSnapshot.ShiftTeamID,
			}
			expectedPendingCareRequestUpdates[i][j] = &logisticspb.PendingVisitUpdate{
				CareRequestId: visit.CareRequestID,
			}
		}
		getMissingSchedulesShiftTeamParams[i] = logisticssql.GetShiftTeamsIDsInRegionSinceParams{
			ServiceRegionID:    serviceRegion.ID,
			StartTimestampSec:  endShiftTimeStampSec,
			EndTimestampSec:    endShiftTimeStampSec,
			SinceSnapshotTime:  earliestTimestamp,
			LatestSnapshotTime: time.Now(),
		}
		getMissingSchedulesCareRequestParams[i] = logisticssql.GetCareRequestIDsSinceParams{
			ServiceRegionID:    serviceRegion.ID,
			StartTimestampSec:  sqltypes.ToValidNullInt64(endShiftTimeStampSec),
			EndTimestampSec:    sqltypes.ToValidNullInt64(endShiftTimeStampSec),
			SinceSnapshotTime:  earliestTimestamp,
			LatestSnapshotTime: time.Now(),
		}
	}

	missingSchedulesByServiceDate, err := ldb.GetMissingScheduleInfoByServiceDates(ctx, logisticsdb.GetMissingScheduleInfoByServiceDatesParams{
		ShiftTeamParams:   getMissingSchedulesShiftTeamParams,
		CareRequestParams: getMissingSchedulesCareRequestParams,
	})
	if err != nil {
		t.Fatal(err)
	}

	for i := range missingShiftTeamsInfo {
		testutils.MustMatch(t, expectedPendingShiftTeamUpdates[i], missingSchedulesByServiceDate[i].ShiftTeams)
		testutils.MustMatch(t, expectedPendingCareRequestUpdates[i], missingSchedulesByServiceDate[i].CareRequests)
	}
}

func TestLDB_GetLatestShiftTeamSchedulesInServiceRegion(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)

	horizonDays := 4
	settingsService := &optimizersettings.MockSettingsService{
		RegionSettings: &optimizersettings.Settings{
			OptimizeHorizonDays: int64(horizonDays),
		},
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, settingsService, monitoring.NewMockScope())
	defer done()

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "region",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}

	stationMarketID := time.Now().UnixNano()
	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: stationMarketID,
	})
	if err != nil {
		t.Fatal(err)
	}

	firstDayDate := logisticsdb.TimestampFromDateTimeLoc(time.Now().In(tzLoc), time.Time{}, tzLoc)
	secondDay := firstDayDate.AddDate(0, 0, 1)
	lastScheduledDayDate := firstDayDate.AddDate(0, 0, horizonDays-2)
	startDayTime, _ := time.Parse(time.Kitchen, "8:00AM")
	endDayTime, _ := time.Parse(time.Kitchen, "10:00PM")
	firstDayStartTimestamp := logisticsdb.TimestampFromDateTimeLoc(firstDayDate, startDayTime, tzLoc)
	firstDayStartTimestampSec := firstDayStartTimestamp.Unix()
	firstDayEndTimestamp := logisticsdb.TimestampFromDateTimeLoc(firstDayDate, endDayTime, tzLoc)
	firstDayEndTimestampSec := firstDayEndTimestamp.Unix()
	secondDayStartTimestamp := logisticsdb.TimestampFromDateTimeLoc(secondDay, startDayTime, tzLoc)
	secondDayEndTimestamp := logisticsdb.TimestampFromDateTimeLoc(secondDay, endDayTime, tzLoc)
	lastDayStartTimestamp := logisticsdb.TimestampFromDateTimeLoc(lastScheduledDayDate, startDayTime, tzLoc)
	lastDayStartTimestampSec := lastDayStartTimestamp.Unix()
	lastDayEndTimestamp := logisticsdb.TimestampFromDateTimeLoc(lastScheduledDayDate, endDayTime, tzLoc)
	lastDayEndTimestampSec := lastDayEndTimestamp.Unix()
	firstSnapshotTimestamp := time.Now().Add(2 * time.Minute).Truncate(time.Second)
	lastSnapshotTimestamp := firstSnapshotTimestamp.Add(time.Minute)
	optimizerRunFirstDay, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:   serviceRegion.ID,
		ServiceDate:       firstDayDate,
		SnapshotTimestamp: firstSnapshotTimestamp,
		OptimizerRunType:  string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	scheduleFirstDay, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegion.ID,
		OptimizerRunID:  optimizerRunFirstDay.ID,
	})
	if err != nil {
		t.Fatal(err)
	}
	debugExplanation := "debug_explanation"
	testutils.MustFn(t)(queries.AddScheduleDiagnostics(ctx, logisticssql.AddScheduleDiagnosticsParams{
		ScheduleID:       scheduleFirstDay.ID,
		DebugExplanation: sqltypes.ToValidNullString(debugExplanation),
	}))

	optimizerRunLastDay, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:   serviceRegion.ID,
		ServiceDate:       lastScheduledDayDate,
		SnapshotTimestamp: lastSnapshotTimestamp,
		OptimizerRunType:  string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	scheduleLastDay, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegion.ID,
		OptimizerRunID:  optimizerRunLastDay.ID,
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddScheduleDiagnostics(ctx, logisticssql.AddScheduleDiagnosticsParams{
		ScheduleID:       scheduleLastDay.ID,
		DebugExplanation: sqltypes.ToValidNullString(debugExplanation),
	}))

	coordinate := int32(time.Now().UnixNano())
	locations, err := queries.UpsertLocations(ctx, logisticssql.UpsertLocationsParams{
		LatE6s: []int32{
			coordinate,
			coordinate + 1,
			coordinate + 2,
			coordinate + 3,
		},
		LngE6s: []int32{
			coordinate,
			coordinate + 1,
			coordinate + 2,
			coordinate + 3,
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	scheduleOpenHours, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
	if err != nil {
		t.Fatal(err)
	}

	for i := 0; i < horizonDays-1; i++ {
		scheduleDate := firstDayDate.AddDate(0, 0, i)
		_, err := queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
			ServiceRegionOpenHoursScheduleIds: []int64{scheduleOpenHours.ID},
			DaysOfWeek:                        []int32{int32(scheduleDate.Weekday())},
			StartTimes:                        []time.Time{startDayTime},
			EndTimes:                          []time.Time{endDayTime},
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	baseLocationFirstDay := locations[2]
	baseLocationLastDay := locations[3]
	shiftTeamSnapshotFirstDay, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       time.Now().UnixNano(),
		ServiceRegionID:   serviceRegion.ID,
		StartTimestampSec: firstDayStartTimestampSec,
		EndTimestampSec:   firstDayEndTimestampSec,
		BaseLocationID:    baseLocationFirstDay.ID,
	})
	if err != nil {
		t.Fatal(err)
	}
	pendingShiftTeam, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       time.Now().UnixNano(),
		ServiceRegionID:   serviceRegion.ID,
		StartTimestampSec: secondDayStartTimestamp.Unix(),
		EndTimestampSec:   secondDayEndTimestamp.Unix(),
		BaseLocationID:    baseLocationFirstDay.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	pendingVisit, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            time.Now().UnixNano(),
		ServiceRegionID:          serviceRegion.ID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(secondDayStartTimestamp.Unix()),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(secondDayEndTimestamp.Unix()),
	})
	if err != nil {
		t.Fatal(err)
	}

	shiftTeamSnapshotLastDay, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       shiftTeamSnapshotFirstDay.ShiftTeamID + 1,
		ServiceRegionID:   serviceRegion.ID,
		StartTimestampSec: lastDayStartTimestampSec,
		EndTimestampSec:   lastDayEndTimestampSec,
		BaseLocationID:    baseLocationLastDay.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	pendingRestBreakLastDay, err := queries.AddShiftTeamRestBreakRequest(ctx, logisticssql.AddShiftTeamRestBreakRequestParams{
		ShiftTeamID:          shiftTeamSnapshotLastDay.ShiftTeamID,
		StartTimestampSec:    lastDayEndTimestampSec - 120,
		DurationSec:          120,
		LocationID:           shiftTeamSnapshotLastDay.BaseLocationID,
		MaxRestBreakRequests: 1,
	})
	if err != nil {
		t.Fatal(err)
	}

	scheduleRoutes, err := queries.AddScheduleRoutes(ctx, logisticssql.AddScheduleRoutesParams{
		ScheduleIds:               []int64{scheduleFirstDay.ID, scheduleLastDay.ID},
		ShiftTeamSnapshotIds:      []int64{shiftTeamSnapshotFirstDay.ID, shiftTeamSnapshotLastDay.ID},
		DepotArrivalTimestampsSec: []int64{firstDayEndTimestampSec, lastDayEndTimestampSec},
	})
	if err != nil {
		t.Fatal(err)
	}

	careRequestIDFirstDay := time.Now().UnixNano()
	careRequestIDLastDay := careRequestIDFirstDay + 1
	unassigableCareRequestIDLastDay := careRequestIDFirstDay + 2

	serviceDurationSec := int64(3600)

	firstDayVisitArrivalStartTimestamp := firstDayStartTimestamp.Add(2 * time.Hour)
	firstDayVisitArrivalStartTimestampSec := firstDayVisitArrivalStartTimestamp.Unix()
	firstDayVisitArrivalEndTimestamp := firstDayVisitArrivalStartTimestamp.Add(4 * time.Hour)
	firstDayVisitArrivalEndTimestampSec := firstDayVisitArrivalEndTimestamp.Unix()
	firstDayVisitArrivalTimestamp := firstDayVisitArrivalStartTimestamp.Add(-30 * time.Minute)
	firstDayVisitArrivalTimestampSec := firstDayVisitArrivalTimestamp.Unix()

	lastDayVisitArrivalStartTimestamp := lastDayStartTimestamp.Add(2 * time.Hour)
	lastDayVisitArrivalStartTimestampSec := lastDayVisitArrivalStartTimestamp.Unix()
	lastDayVisitArrivalEndTimestamp := lastDayVisitArrivalStartTimestamp.Add(4 * time.Hour)
	lastDayVisitArrivalEndTimestampSec := lastDayVisitArrivalEndTimestamp.Unix()
	lastDayVisitArrivalTimestamp := lastDayVisitArrivalStartTimestamp.Add(-30 * time.Minute)
	lastDayVisitArrivalTimestampSec := lastDayVisitArrivalTimestamp.Unix()

	lastDayUnassignableVisitArrivalStartTimestamp := lastDayStartTimestamp.Add(2 * time.Hour)
	lastDayUnassignableVisitArrivalStartTimestampSec := lastDayUnassignableVisitArrivalStartTimestamp.Unix()
	lastDayUnassignableVisitArrivalEndTimestamp := lastDayUnassignableVisitArrivalStartTimestamp.Add(4 * time.Hour)
	lastDayUnassignableVisitArrivalEndTimestampSec := lastDayUnassignableVisitArrivalEndTimestamp.Unix()

	visitSnapshotFirstDay, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            careRequestIDFirstDay,
		ServiceRegionID:          serviceRegion.ID,
		LocationID:               locations[0].ID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(firstDayVisitArrivalStartTimestampSec),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(firstDayVisitArrivalEndTimestampSec),
		ServiceDurationSec:       serviceDurationSec,
	})
	if err != nil {
		t.Fatal(err)
	}
	unassignableVisitSnapshotLastDay, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            unassigableCareRequestIDLastDay,
		ServiceRegionID:          serviceRegion.ID,
		LocationID:               locations[0].ID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(lastDayUnassignableVisitArrivalStartTimestampSec),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(lastDayUnassignableVisitArrivalEndTimestampSec),
		ServiceDurationSec:       serviceDurationSec,
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  visitSnapshotFirstDay.ID,
		VisitPhaseTypeID: 1, // uncommitted
		StatusCreatedAt:  time.Now(),
	}))
	testutils.MustFn(t)(queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  unassignableVisitSnapshotLastDay.ID,
		VisitPhaseTypeID: 1, // uncommitted
		StatusCreatedAt:  time.Now(),
	}))

	visitSnapshotLastDay, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            careRequestIDLastDay,
		ServiceRegionID:          serviceRegion.ID,
		LocationID:               locations[1].ID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(lastDayVisitArrivalStartTimestampSec),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(lastDayVisitArrivalEndTimestampSec),
		ServiceDurationSec:       serviceDurationSec,
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  visitSnapshotLastDay.ID,
		VisitPhaseTypeID: 1, // uncommitted
		StatusCreatedAt:  time.Now(),
	}))

	firstDayUrgencyWindowStartTimestamp := firstDayVisitArrivalStartTimestamp.UTC()
	firstDayUrgencyWindowEndTimestamp := firstDayUrgencyWindowStartTimestamp.Add(2 * time.Hour)
	lastDayUrgencyWindowStartTimestamp := lastDayVisitArrivalStartTimestamp.UTC()
	lastDayUrgencyWindowEndTimestamp := lastDayVisitArrivalEndTimestamp.UTC() // no urgency window since urgency is low

	unassignableVisitUrgencyWindowStartTimestamp := lastDayUnassignableVisitArrivalStartTimestamp.UTC()
	unassignableVisitUrgencyWindowEndTimestamp := lastDayUnassignableVisitArrivalEndTimestamp.UTC()

	clinicalUrgencyLevelHigh := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH
	clinicalUrgencyLow := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_LOW

	testutils.MustFn(t)(queries.AddVisitAcuitySnapshot(ctx, logisticssql.AddVisitAcuitySnapshotParams{
		VisitSnapshotID:        visitSnapshotFirstDay.ID,
		ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(logisticsdb.ClinicalUrgencyLevelEnumToID[clinicalUrgencyLevelHigh]),
	}))
	testutils.MustFn(t)(queries.AddVisitAcuitySnapshot(ctx, logisticssql.AddVisitAcuitySnapshotParams{
		VisitSnapshotID:        visitSnapshotLastDay.ID,
		ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(logisticsdb.ClinicalUrgencyLevelEnumToID[clinicalUrgencyLow]),
	}))
	testutils.MustFn(t)(queries.AddVisitAcuitySnapshot(ctx, logisticssql.AddVisitAcuitySnapshotParams{
		VisitSnapshotID:        unassignableVisitSnapshotLastDay.ID,
		ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(logisticsdb.ClinicalUrgencyLevelEnumToID[clinicalUrgencyLow]),
	}))

	visit1, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
		VisitSnapshotID:     sqltypes.ToValidNullInt64(visitSnapshotFirstDay.ID),
		ScheduleID:          scheduleFirstDay.ID,
		ScheduleRouteID:     scheduleRoutes[0].ID,
		ArrivalTimestampSec: firstDayVisitArrivalTimestampSec,
	})
	if err != nil {
		t.Fatal(err)
	}
	visit2, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
		VisitSnapshotID:     sqltypes.ToValidNullInt64(visitSnapshotLastDay.ID),
		ScheduleID:          scheduleLastDay.ID,
		ScheduleRouteID:     scheduleRoutes[1].ID,
		ArrivalTimestampSec: lastDayVisitArrivalTimestampSec,
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustFn(t)(queries.AddUnassignedScheduleVisitsToSchedule(ctx, logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
		ScheduleID:       scheduleLastDay.ID,
		VisitSnapshotIds: []int64{unassignableVisitSnapshotLastDay.ID},
	}))

	_, err = queries.AddScheduleVisitStops(ctx, logisticssql.AddScheduleVisitStopsParams{
		ScheduleIds:      []int64{visit1.ScheduleID, visit2.ScheduleID},
		ScheduleRouteIds: []int64{visit1.ScheduleRouteID, visit2.ScheduleRouteID},
		RouteIndexes:     []int32{1, 1},
		ScheduleVisitIds: []int64{visit1.ID, visit2.ID},
	})
	if err != nil {
		t.Fatal(err)
	}

	nonexistentMarketID := time.Now().UnixNano()
	_, err = ldb.GetLatestShiftTeamSchedulesInServiceRegion(ctx, nonexistentMarketID, time.Now(), true)
	if !errors.Is(err, logisticsdb.ErrServiceRegionMarketNotFound) {
		t.Fatalf("service region should be missing and is not: %v", err)
	}

	schedulesResponse, err := ldb.GetLatestShiftTeamSchedulesInServiceRegion(ctx, stationMarketID, time.Now(), true)
	if err != nil {
		t.Fatal(err)
	}
	schedules := schedulesResponse.ShiftTeamSchedules

	firstDayToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleFirstDay.ID),
	})
	if err != nil {
		t.Fatal(err)
	}

	lastDayToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleLastDay.ID),
	})
	if err != nil {
		t.Fatal(err)
	}

	expectedScheduleResponse := logisticspb.GetServiceRegionScheduleResponse{
		DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
			{
				ServiceDate: logisticsdb.TimeToProtoDate(&firstDayDate),
				Meta: &logisticspb.ScheduleMetadata{
					ScheduleToken: firstDayToken,
					ServiceDate:   logisticsdb.TimeToProtoDate(&firstDayDate),
					GeneratedAt:   timestamppb.New(firstSnapshotTimestamp),
				},
				Schedules: []*logisticspb.ShiftTeamSchedule{
					{
						ShiftTeamId: shiftTeamSnapshotFirstDay.ShiftTeamID,
						Route: &logisticspb.ShiftTeamRoute{
							BaseLocationArrivalTimestampSec: proto.Int64(firstDayEndTimestampSec),
							BaseLocation: &commonpb.Location{
								LatitudeE6:  baseLocationFirstDay.LatitudeE6,
								LongitudeE6: baseLocationFirstDay.LongitudeE6,
							},
							Stops: []*logisticspb.ShiftTeamRouteStop{
								{
									Stop: &logisticspb.ShiftTeamRouteStop_Visit{
										Visit: &logisticspb.ShiftTeamVisit{
											CareRequestId:        &careRequestIDFirstDay,
											ArrivalTimestampSec:  proto.Int64(firstDayVisitArrivalTimestampSec),
											CompleteTimestampSec: proto.Int64(firstDayVisitArrivalStartTimestampSec + serviceDurationSec),
											Location: &commonpb.Location{
												LatitudeE6:  locations[0].LatitudeE6,
												LongitudeE6: locations[0].LongitudeE6,
											},
											Status: logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
											Acuity: &logisticspb.VisitAcuity{
												ClinicalUrgencyLevel: clinicalUrgencyLevelHigh,
												ClinicalUrgencyWindow: &commonpb.TimeWindow{
													StartDatetime: logisticsdb.TimeToProtoDateTime(&firstDayUrgencyWindowStartTimestamp),
													EndDatetime:   logisticsdb.TimeToProtoDateTime(&firstDayUrgencyWindowEndTimestamp),
												},
											},
										},
									},
								},
							},
						},
					},
				},
				PendingUpdates: &logisticspb.SchedulePendingUpdates{},
			},
			{
				ServiceDate: logisticsdb.TimeToProtoDate(&secondDay),
				PendingUpdates: &logisticspb.SchedulePendingUpdates{
					ShiftTeams: []*logisticspb.PendingShiftTeamUpdate{
						{ShiftTeamId: pendingShiftTeam.ShiftTeamID},
					},
					Visits: []*logisticspb.PendingVisitUpdate{
						{CareRequestId: pendingVisit.CareRequestID},
					},
				},
			},
			{
				ServiceDate: logisticsdb.TimeToProtoDate(&lastScheduledDayDate),
				Meta: &logisticspb.ScheduleMetadata{
					ScheduleToken: lastDayToken,
					ServiceDate:   logisticsdb.TimeToProtoDate(&lastScheduledDayDate),
					GeneratedAt:   timestamppb.New(lastSnapshotTimestamp),
				},
				UnassignableVisits: []*logisticspb.UnassignableVisit{
					{
						CareRequestId: proto.Int64(unassigableCareRequestIDLastDay),
						Acuity: &logisticspb.VisitAcuity{
							ClinicalUrgencyLevel: clinicalUrgencyLow,
							ClinicalUrgencyWindow: &commonpb.TimeWindow{
								StartDatetime: logisticsdb.TimeToProtoDateTime(&unassignableVisitUrgencyWindowStartTimestamp),
								EndDatetime:   logisticsdb.TimeToProtoDateTime(&unassignableVisitUrgencyWindowEndTimestamp),
							},
						},
					},
				},
				Schedules: []*logisticspb.ShiftTeamSchedule{
					{
						ShiftTeamId: shiftTeamSnapshotLastDay.ShiftTeamID,
						Route: &logisticspb.ShiftTeamRoute{
							BaseLocationArrivalTimestampSec: proto.Int64(lastDayEndTimestampSec),
							BaseLocation: &commonpb.Location{
								LatitudeE6:  baseLocationLastDay.LatitudeE6,
								LongitudeE6: baseLocationLastDay.LongitudeE6,
							},
							Stops: []*logisticspb.ShiftTeamRouteStop{
								{
									Stop: &logisticspb.ShiftTeamRouteStop_Visit{
										Visit: &logisticspb.ShiftTeamVisit{
											CareRequestId:        &careRequestIDLastDay,
											ArrivalTimestampSec:  proto.Int64(lastDayVisitArrivalTimestampSec),
											CompleteTimestampSec: proto.Int64(lastDayVisitArrivalStartTimestampSec + serviceDurationSec),
											Location: &commonpb.Location{
												LatitudeE6:  locations[1].LatitudeE6,
												LongitudeE6: locations[1].LongitudeE6,
											},
											Status: logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
											Acuity: &logisticspb.VisitAcuity{
												ClinicalUrgencyLevel: clinicalUrgencyLow,
												ClinicalUrgencyWindow: &commonpb.TimeWindow{
													StartDatetime: logisticsdb.TimeToProtoDateTime(&lastDayUrgencyWindowStartTimestamp),
													EndDatetime:   logisticsdb.TimeToProtoDateTime(&lastDayUrgencyWindowEndTimestamp),
												},
											},
										},
									},
								},
							},
						},
					},
				},
				PendingUpdates: &logisticspb.SchedulePendingUpdates{
					RestBreakRequests: []*logisticspb.ShiftTeamRestBreakRequest{
						{
							ShiftTeamId: shiftTeamSnapshotLastDay.ShiftTeamID,
							BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
								OnDemand: &logisticspb.BreakOnDemand{StartTimestampSec: proto.Int64(pendingRestBreakLastDay.StartTimestampSec), DurationSec: proto.Int64(pendingRestBreakLastDay.DurationSec)},
							},
						},
					},
				},
			},
		},
	}

	resultScheduleResponse := logisticspb.GetServiceRegionScheduleResponse{
		DateSchedules: schedules,
	}

	testutils.MustMatchProto(t, &expectedScheduleResponse, &resultScheduleResponse, "the schedule doesn't match")

	snapshots, err := ldb.GetLatestShiftTeamSnapshotsInRegion(ctx, serviceRegion.ID, time.Now(), lastDayStartTimestamp, lastDayEndTimestamp)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, snapshots[0].ShiftTeamID, shiftTeamSnapshotLastDay.ShiftTeamID, "shift team snapshot ID doesn't match")
	testutils.MustMatch(t, snapshots[0].BaseLocationID, baseLocationLastDay.ID, "shift team snapshot location ID doesn't match")
}

func TestWriteScheduleForVRPSolution_ExhaustiveRouteStopType(t *testing.T) {
	testutils.AssertExhaustiveOneOfMapping(t,
		&optimizerpb.VRPShiftTeamRouteStop{},
		"stop", []string{"visit", "rest_break"},
		"for a new type of route stop, one must explicitly determine how to handle it"+
			" in the switch statement in WriteScheduleForVRPSolution",
	)
}

type writeTeamShiftTeamSnapshotParams struct {
	shiftTeamID     int64
	stationMarketID int64

	startTimestamp *time.Time
	endTimestamp   *time.Time

	ldb *logisticsdb.LogisticsDB
}

// TODO use this helper instead of manual creation of generic STsnapshots where possible.
func writeTeamShiftSnapshot(ctx context.Context, t *testing.T, params *writeTeamShiftTeamSnapshotParams) *logisticssql.ShiftTeamSnapshot {
	t.Helper()

	ldb := params.ldb

	now := time.Now()
	start, end := now, now.Add(time.Minute)
	if params.startTimestamp != nil {
		start = *params.startTimestamp
	}

	if params.endTimestamp != nil {
		end = *params.endTimestamp
	}

	timeWindow := commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&start),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&end),
	}
	location := commonpb.Location{
		LatitudeE6:  int32(now.UnixNano()),
		LongitudeE6: int32(now.UnixNano()),
	}
	shiftTeamID := params.shiftTeamID
	shiftTeam := &shiftteampb.ShiftTeam{
		Id:                  shiftTeamID,
		MarketId:            &params.stationMarketID,
		BaseLocation:        &location,
		ShiftTimeWindow:     &timeWindow,
		ShiftTeamAttributes: []*commonpb.Attribute{{Name: "attr1"}},
	}

	snapshot, err := ldb.WriteShiftTeamSnapshot(ctx, shiftTeamID, &shiftteampb.GetShiftTeamResponse{ShiftTeam: shiftTeam})
	if err != nil {
		t.Fatal(err)
	}
	return snapshot
}

type writeVisitSnapshotParams struct {
	stationMarketID int64
	careReqID       int64
	shiftTeamID     *int64

	visitPhase logisticsdb.VisitPhaseShortName

	start time.Time
	end   time.Time

	ldb *logisticsdb.LogisticsDB
}

func writeVisitSnapshotWithStartEnd(ctx context.Context, t *testing.T, params *writeVisitSnapshotParams) *logisticssql.VisitSnapshot {
	t.Helper()

	ldb := params.ldb

	visitPhase := params.visitPhase
	statusName, ok := logisticsdb.PhaseTypeIDToCareRequestStatusName[visitPhase.PhaseTypeID()]
	if !ok {
		t.Fatalf("bad visitPhase: %s", visitPhase)
	}

	stationMarketID := params.stationMarketID
	careReqID := params.careReqID
	shiftTeamID := params.shiftTeamID
	start := params.start
	end := params.end
	res, err := ldb.WriteVisitSnapshot(ctx, careReqID, &episodepb.GetVisitResponse{
		CareRequest: &commonpb.CareRequestInfo{
			Id:       careReqID,
			MarketId: proto.Int64(stationMarketID),
			Location: &commonpb.Location{
				LatitudeE6:  *proto.Int32(int32(time.Now().UnixNano())),
				LongitudeE6: *proto.Int32(int32(time.Now().UnixNano())),
			},
			ArrivalTimeWindow: &commonpb.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&start),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&end),
			},
			ServiceDurationSec: proto.Int64(123),
			RequiredAttributes: []*commonpb.Attribute{
				{Name: "required visit attr1"},
				{Name: "required visit attr2"},
			},
			PreferredAttributes: []*commonpb.Attribute{
				{Name: "preferred visit attr1"},
				{Name: "preferred visit attr2"},
			},
			ForbiddenAttributes: []*commonpb.Attribute{
				{Name: "forbidden visit attr1"},
				{Name: "forbidden visit attr2"},
			},
			UnwantedAttributes: []*commonpb.Attribute{
				{Name: "unwanted visit attr1"},
				{Name: "unwanted visit attr2"},
			},
			RequestStatus: &commonpb.CareRequestStatus{
				UserId:       proto.Int64(time.Now().UnixNano()),
				Name:         proto.String(statusName),
				SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER.Enum(),
				CreatedAtSec: proto.Int64(time.Now().Unix()),
				ShiftTeamId:  shiftTeamID,
			},
		},
	})

	if err != nil {
		t.Fatal(err)
	}
	return res
}

func writeVisitSnapshot(ctx context.Context, t *testing.T, careReqID int64, stationMarketID int64, ldb *logisticsdb.LogisticsDB, visitPhase logisticsdb.VisitPhaseShortName, shiftTeamID *int64) *logisticssql.VisitSnapshot {
	t.Helper()
	now := time.Now()
	return writeVisitSnapshotWithStartEnd(ctx, t, &writeVisitSnapshotParams{
		stationMarketID: stationMarketID,
		careReqID:       careReqID,
		shiftTeamID:     shiftTeamID,
		visitPhase:      visitPhase,
		start:           now,
		end:             now.Add(time.Minute),
		ldb:             ldb,
	})
}

func TestLDB_WriteScheduleForVRPSolutionRoundtrip(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "10:00PM")
	if err != nil {
		t.Fatal(err)
	}

	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, startDayTime, time.UTC)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, endDayTime, time.UTC)

	stationMarketID := time.Now().UnixNano()
	serviceRegionData, err := setupForGetServiceRegionVRPData(
		ctx,
		queries,
		stationMarketID,
		startTimestamp,
		endTimestamp,
	)
	if err != nil {
		t.Fatal(err)
	}
	serviceRegionID := serviceRegionData.serviceRegion.ID
	run, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	baseCareRequestID := time.Now().UnixNano()
	_, m := addStationMarket(ctx, t, queries, stationMarketID)
	visit1 := writeVisitSnapshot(ctx, t, baseCareRequestID, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	visit2 := writeVisitSnapshot(ctx, t, baseCareRequestID+1, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	visit3 := writeVisitSnapshot(ctx, t, baseCareRequestID+2, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	visit4 := writeVisitSnapshot(ctx, t, baseCareRequestID+3, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	unassignedVisit5 := writeVisitSnapshot(ctx, t, baseCareRequestID+4, m.StationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	loc, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  int32(time.Now().UnixNano()),
		LongitudeE6: int32(time.Now().UnixNano()),
	})
	if err != nil {
		t.Fatal(err)
	}
	shiftTeam1, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       time.Now().UnixNano(),
		ServiceRegionID:   stationMarketID,
		BaseLocationID:    loc.ID,
		StartTimestampSec: 0,
		EndTimestampSec:   1,
	})
	if err != nil {
		t.Fatal(err)
	}
	shiftTeam2, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       time.Now().UnixNano(),
		ServiceRegionID:   stationMarketID,
		BaseLocationID:    loc.ID,
		StartTimestampSec: 0,
		EndTimestampSec:   1,
	})
	if err != nil {
		t.Fatal(err)
	}
	br := addShiftTeamRestBreakRequest(ctx, t, shiftTeam1.ShiftTeamID, loc.ID, 60*30, ldb)

	resp := &optimizerpb.SolveVRPResponse{
		Status: optimizerpb.SolveVRPResponse_STATUS_FINISHED.Enum(),
		Solution: &optimizerpb.VRPSolution{
			Score: &optimizerpb.VRPScore{
				HardScore:             proto.Int64(1),
				UnassignedVisitsScore: proto.Int64(2),
				SoftScore:             proto.Int64(3),
				DebugExplanation:      proto.String("fake debug explanation"),
			},

			Description: &optimizerpb.VRPDescription{
				ShiftTeams: []*optimizerpb.VRPShiftTeam{
					{
						Id:                  proto.Int64(shiftTeam1.ID),
						RouteHistory:        &optimizerpb.VRPShiftTeamRouteHistory{},
						UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
						Route: &optimizerpb.VRPShiftTeamRoute{
							Stops: []*optimizerpb.VRPShiftTeamRouteStop{
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(visit1.ID),
									ArrivalTimestampSec: proto.Int64(789)}},
									Pinned: proto.Bool(false)},
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
									RestBreakId:       proto.Int64(br.ID),
									StartTimestampSec: proto.Int64(br.StartTimestampSec)}},
									Pinned: proto.Bool(false),
								},
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(visit2.ID),
									ArrivalTimestampSec: proto.Int64(1789)}},
									Pinned: proto.Bool(false),
								},
							},
						},
					},
					{
						Id:                  proto.Int64(shiftTeam2.ID),
						RouteHistory:        &optimizerpb.VRPShiftTeamRouteHistory{},
						UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
						Route: &optimizerpb.VRPShiftTeamRoute{
							Stops: []*optimizerpb.VRPShiftTeamRouteStop{
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(visit3.ID),
									ArrivalTimestampSec: proto.Int64(7891)}},
									Pinned: proto.Bool(false),
								},
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(visit4.ID),
									ArrivalTimestampSec: proto.Int64(17894)}},
									Pinned: proto.Bool(false),
								},
							},
						},
					},
				},
				UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{
					{VisitId: proto.Int64(unassignedVisit5.ID)},
				},
			},
			TotalStats: &optimizerpb.VRPStats{
				DriveDurationSec:    proto.Int64(1),
				DriveDistanceMeters: proto.Int64(2),
				ServiceDurationSec:  proto.Int64(3),
			},
		},
	}

	params := &logisticsdb.WriteScheduleForVRPSolutionParams{
		ServiceRegionID:  serviceRegionID,
		OptimizerRunID:   run.ID,
		OptimizerVersion: "version",
		Solution:         resp.Solution,
	}
	schedule, err := ldb.WriteScheduleForVRPSolution(ctx, params)
	if err != nil {
		t.Fatal(err)
	}

	if schedule == nil {
		t.Fatal(err)
	}

	newDescription, err := ldb.GetVRPSolutionFromScheduleID(ctx, schedule.ID, run.SnapshotTimestamp, true)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, resp.Solution, newDescription, "solution doesn't match")
}

func TestLDB_WriteScheduleForVRPSolutionAvailabilityRun(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "10:00PM")
	if err != nil {
		t.Fatal(err)
	}

	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, startDayTime, time.UTC)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, endDayTime, time.UTC)

	now := time.Now()
	stationMarketID := now.UnixNano()
	serviceRegionData, err := setupForGetServiceRegionVRPData(
		ctx,
		queries,
		stationMarketID,
		startTimestamp,
		endTimestamp,
	)
	if err != nil {
		t.Fatal(err)
	}
	serviceRegionID := serviceRegionData.serviceRegion.ID
	run, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	set, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}
	visitCount := 3
	setIDs := make([]int64, visitCount)
	arrivalTimes := make([]time.Time, visitCount)
	locationIDs := make([]int64, visitCount)
	serviceDurationsSec := make([]int64, visitCount)
	for i := 0; i < visitCount; i++ {
		setIDs[i] = set.ID
		arrivalTimes[i] = now
		locationIDs[i] = int64(i)
		serviceDurationsSec[i] = int64(i)
	}
	visits, err := queries.AddServiceRegionAvailabilityVisits(ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
		ServiceRegionAvailabilityVisitSetIds: setIDs,
		ArrivalStartTimes:                    arrivalTimes,
		ArrivalEndTimes:                      arrivalTimes,
		LocationIds:                          locationIDs,
		ServiceDurationsSec:                  serviceDurationsSec,
	})
	if err != nil {
		t.Fatal(err)
	}

	realAvailabilityVisitID1 := visits[0].ID
	fakeAvailabilityVisitID1 := -realAvailabilityVisitID1
	realAvailabilityVisitID2 := visits[1].ID
	fakeAvailabilityVisitID2 := -realAvailabilityVisitID2
	realUnassignedAvailabilityVisitID := visits[2].ID
	fakeUnassignedAvailabilityVisitID := -realUnassignedAvailabilityVisitID
	baseCareRequestID := time.Now().UnixNano()
	visit := writeVisitSnapshot(ctx, t, baseCareRequestID, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	newUnassignedVisit := writeVisitSnapshot(ctx, t, baseCareRequestID+1, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameUncommitted, nil)
	loc, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  int32(time.Now().UnixNano()),
		LongitudeE6: int32(time.Now().UnixNano()),
	})
	if err != nil {
		t.Fatal(err)
	}
	shiftTeam, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       time.Now().UnixNano(),
		ServiceRegionID:   stationMarketID,
		BaseLocationID:    loc.ID,
		StartTimestampSec: 0,
		EndTimestampSec:   1,
	})
	if err != nil {
		t.Fatal(err)
	}
	restBreakRequest := addShiftTeamRestBreakRequest(ctx, t, shiftTeam.ShiftTeamID, loc.ID, 60*30, ldb)

	resp := &optimizerpb.SolveVRPResponse{
		Status: optimizerpb.SolveVRPResponse_STATUS_FINISHED.Enum(),
		Solution: &optimizerpb.VRPSolution{
			Score: &optimizerpb.VRPScore{
				HardScore:             proto.Int64(1),
				UnassignedVisitsScore: proto.Int64(2),
				SoftScore:             proto.Int64(3),
				DebugExplanation:      proto.String("fake debug explanation"),
			},

			Description: &optimizerpb.VRPDescription{
				ShiftTeams: []*optimizerpb.VRPShiftTeam{
					{
						Id:                  proto.Int64(shiftTeam.ID),
						RouteHistory:        &optimizerpb.VRPShiftTeamRouteHistory{},
						UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
						Route: &optimizerpb.VRPShiftTeamRoute{
							Stops: []*optimizerpb.VRPShiftTeamRouteStop{
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(visit.ID),
									ArrivalTimestampSec: proto.Int64(789)}},
									Pinned: proto.Bool(false)},
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
									RestBreakId:       proto.Int64(restBreakRequest.ID),
									StartTimestampSec: proto.Int64(restBreakRequest.StartTimestampSec)}},
									Pinned: proto.Bool(false),
								},
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(fakeAvailabilityVisitID1),
									ArrivalTimestampSec: proto.Int64(1789)}},
									Pinned: proto.Bool(false),
								},
								{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
									VisitId:             proto.Int64(fakeAvailabilityVisitID2),
									ArrivalTimestampSec: proto.Int64(1789)}},
									Pinned: proto.Bool(false),
								},
							},
						},
					},
				},
				UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{
					{VisitId: proto.Int64(fakeUnassignedAvailabilityVisitID)},
					{VisitId: proto.Int64(newUnassignedVisit.ID)},
				},
			},
			TotalStats: &optimizerpb.VRPStats{
				DriveDurationSec:    proto.Int64(1),
				DriveDistanceMeters: proto.Int64(2),
				ServiceDurationSec:  proto.Int64(3),
			},
		},
	}

	params := &logisticsdb.WriteScheduleForVRPSolutionParams{
		ServiceRegionID:  serviceRegionID,
		OptimizerRunID:   run.ID,
		OptimizerVersion: "version",
		Solution:         resp.Solution,
		AvailabilityVisitIDMap: logisticsdb.AvailabilityVisitIDMap{
			fakeAvailabilityVisitID1:          realAvailabilityVisitID1,
			fakeAvailabilityVisitID2:          realAvailabilityVisitID2,
			fakeUnassignedAvailabilityVisitID: realUnassignedAvailabilityVisitID,
		},
		LastScheduleUnassignedVisits: []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow{},
	}
	schedule, err := ldb.WriteScheduleForVRPSolution(ctx, params)
	if err != nil {
		t.Fatal(err)
	}
	if schedule == nil {
		t.Fatal(err)
	}

	assignedAvailabilityVisits, err := queries.GetAssignedAvailabilityVisitsForScheduleID(ctx, schedule.ID)
	if err != nil {
		t.Fatal(err)
	}
	unassignedAvailabilityVisits, err := queries.GetUnassignedAvailabilityVisitsForScheduleID(ctx, schedule.ID)
	if err != nil {
		t.Fatal()
	}
	testutils.MustMatch(t, 2, len(assignedAvailabilityVisits), "assigned availability visits does not match")
	testutils.MustMatch(t, 1, len(unassignedAvailabilityVisits), "unassigned availability visits does not match")

	expectedUnassignedDiff := int64(1)
	scheduleDiagnostics, err := queries.GetDiagnosticsForSchedule(ctx, schedule.ID)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, expectedUnassignedDiff, scheduleDiagnostics.UnassignedVisitsDiff.Int64, "unassigned visits diff not recorded")
}

func TestLogisticsDB_MarketHasNonScheduleChanges(t *testing.T) {
	_, db, _, done := setupDBTest(t)
	defer done()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	marketName := "Fake Name"
	changedMarketName := "Changed Name"
	marketShortName := "FN"
	changedMarketShortName := "CN"
	marketTimeZone := "Fake TZ"
	changedMarketTimeZone := "Changed TZ"

	tcs := []struct {
		Description   string
		StationMarket *marketpb.Market
		Market        *logisticssql.Market
		ServiceRegion *logisticssql.ServiceRegion

		HasChanges bool
	}{
		{
			Description: "No Changes",
			StationMarket: &marketpb.Market{
				Name:             &marketName,
				ShortName:        &marketShortName,
				IanaTimeZoneName: &marketTimeZone,
			},
			Market: &logisticssql.Market{
				ShortName: marketShortName,
			},
			ServiceRegion: &logisticssql.ServiceRegion{
				IanaTimeZoneName: marketTimeZone,
				Description:      marketName,
			},

			HasChanges: false,
		},
		{
			Description: "Changed Name",
			StationMarket: &marketpb.Market{
				Name:             &changedMarketName,
				ShortName:        &marketShortName,
				IanaTimeZoneName: &marketTimeZone,
			},
			Market: &logisticssql.Market{
				ShortName: marketShortName,
			},
			ServiceRegion: &logisticssql.ServiceRegion{
				IanaTimeZoneName: marketTimeZone,
				Description:      marketName,
			},

			HasChanges: true,
		},
		{
			Description: "Changed Short Name",
			StationMarket: &marketpb.Market{
				Name:             &marketName,
				ShortName:        &changedMarketShortName,
				IanaTimeZoneName: &marketTimeZone,
			},
			Market: &logisticssql.Market{
				ShortName: marketShortName,
			},
			ServiceRegion: &logisticssql.ServiceRegion{
				IanaTimeZoneName: marketTimeZone,
				Description:      marketName,
			},

			HasChanges: true,
		},
		{
			Description: "Changed TZ",
			StationMarket: &marketpb.Market{
				Name:             &marketName,
				ShortName:        &marketShortName,
				IanaTimeZoneName: &changedMarketTimeZone,
			},
			Market: &logisticssql.Market{
				ShortName: marketName,
			},
			ServiceRegion: &logisticssql.ServiceRegion{
				IanaTimeZoneName: marketTimeZone,
				Description:      marketName,
			},

			HasChanges: true,
		},
	}

	for _, tc := range tcs {
		result := ldb.MarketHasNonScheduleChanges(tc.StationMarket, tc.Market, tc.ServiceRegion)
		if tc.HasChanges != result {
			t.Fatalf("%s: expected %t but received %t", tc.Description, tc.HasChanges, result)
		}
	}
}

func TestLogisticsDB_UpsertMarketAndServiceRegionFromStationMarket(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	marketTimeZone := "Fake TZ"
	marketTimeZoneChanged := "Changed TZ"
	dayOfWeek := proto.Int32(1)
	openHours := proto.Int32(12)
	openMinutes := proto.Int32(30)
	closeHours := proto.Int32(23)
	closeMinutes := proto.Int32(59)
	marketID := proto.Int64(1)
	marketID2 := proto.Int64(2)
	marketID3 := proto.Int64(3)
	marketName := "Fake Name"
	marketShortName := "FN"

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      marketName,
		IanaTimeZoneName: marketTimeZone,
	})
	if err != nil {
		t.Fatal("error creating service region")
	}

	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: *marketID3,
		ShortName:       marketShortName,
	})
	if err != nil {
		t.Fatal("error creating market")
	}

	tcs := []struct {
		Desc              string
		StationMarket     *marketpb.Market
		ResultDescription string
		ResultShortName   string
		ResultTZ          string

		HasError bool
	}{
		{
			Desc: "Base Case",
			StationMarket: &marketpb.Market{
				Id:               *marketID,
				IanaTimeZoneName: &marketTimeZone,
				Name:             &marketName,
				ShortName:        &marketShortName,
				Enabled:          proto.Bool(true),
				ScheduleDays: []*commonpb.ScheduleDay{
					{
						DayOfWeek: *dayOfWeek,
						OpenTime: &commonpb.TimeOfDay{
							Hours:   *openHours,
							Minutes: *openMinutes,
						},
						CloseTime: &commonpb.TimeOfDay{
							Hours:   *closeHours,
							Minutes: *closeMinutes,
						},
					},
				},
			},
		},
		{
			Desc: "Empty Schedule",
			StationMarket: &marketpb.Market{
				Id:               *marketID2,
				IanaTimeZoneName: &marketTimeZone,
				Name:             &marketName,
				ShortName:        &marketShortName,
				Enabled:          proto.Bool(true),
			},
		},
		{
			Desc: "Existing Market & Service Region",
			StationMarket: &marketpb.Market{
				Id:               *marketID3,
				IanaTimeZoneName: &marketTimeZone,
				Name:             &marketName,
				ShortName:        &marketShortName,
				Enabled:          proto.Bool(true),
				ScheduleDays: []*commonpb.ScheduleDay{
					{
						DayOfWeek: *dayOfWeek,
						OpenTime: &commonpb.TimeOfDay{
							Hours:   *openHours,
							Minutes: *openMinutes,
						},
						CloseTime: &commonpb.TimeOfDay{
							Hours:   *closeHours,
							Minutes: *closeMinutes,
						},
					},
				},
			},
		},
		{
			Desc: "Updating Enabled Market",
			StationMarket: &marketpb.Market{
				Id:               *marketID3,
				IanaTimeZoneName: &marketTimeZoneChanged,
				Name:             &marketName,
				ShortName:        &marketShortName,
				Enabled:          proto.Bool(true),
			},

			HasError: true,
		},
		{
			Desc: "Updating Disabled Market",
			StationMarket: &marketpb.Market{
				Id:               *marketID3,
				IanaTimeZoneName: &marketTimeZoneChanged,
				Name:             &marketName,
				ShortName:        &marketShortName,
				Enabled:          proto.Bool(false),
			},

			HasError: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			err := ldb.UpsertMarketAndServiceRegionFromStationMarket(ctx, tc.StationMarket)
			if (err != nil) != tc.HasError {
				t.Fatalf("HasError does not match: %v, tc: %+v", err, tc)
			}

			if tc.HasError {
				return
			}

			dbServiceRegion, err := queries.GetServiceRegionForStationMarket(ctx, tc.StationMarket.Id)
			if err != nil {
				t.Fatalf("service region is missing: %v, tc: %+v", err, tc)
			}

			resultMarket := &marketpb.Market{
				IanaTimeZoneName: &dbServiceRegion.IanaTimeZoneName,
				Name:             &dbServiceRegion.Description,
				ScheduleDays:     []*commonpb.ScheduleDay{},
			}

			dbMarkets, err := queries.GetMarketsInServiceRegion(ctx, dbServiceRegion.ID)
			if err != nil {
				t.Fatalf("couldn't load markets for service regions: %v, tc: %+v", err, tc)
			}

			for _, market := range dbMarkets {
				market := market
				if market.StationMarketID == tc.StationMarket.Id {
					resultMarket.Id = market.StationMarketID
					resultMarket.ShortName = &market.ShortName
				}
			}

			dbScheduleDays, err := queries.GetLatestOpenHoursScheduleForServiceRegion(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionParams{
				ServiceRegionID: dbServiceRegion.ID,
				BeforeCreatedAt: time.Now(),
			})
			if err != nil {
				t.Fatalf("error loading schedule days: %v, tc: %+v", err, tc)
			}

			for _, scheduleDay := range dbScheduleDays {
				resultMarket.ScheduleDays = append(resultMarket.ScheduleDays, &commonpb.ScheduleDay{
					DayOfWeek: scheduleDay.DayOfWeek,
					OpenTime: &commonpb.TimeOfDay{
						Hours:   int32(scheduleDay.StartTime.Hour()),
						Minutes: int32(scheduleDay.StartTime.Minute()),
					},
					CloseTime: &commonpb.TimeOfDay{
						Hours:   int32(scheduleDay.EndTime.Hour()),
						Minutes: int32(scheduleDay.EndTime.Minute()),
					},
				})
			}

			testutils.MustMatchProtoFn("enabled")(t, tc.StationMarket, resultMarket, "resulting market/service region did not match")
		})
	}
}

func TestLogisticsDB_IsHealthy(t *testing.T) {
	ctx, _, _, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(&basedb.MockPingDBTX{}, nil, noSettingsService, monitoring.NewMockScope())
	isHealthy := ldb.IsHealthy(ctx)
	testutils.MustMatch(t, true, isHealthy, "database status is not the expected")

	ldb = logisticsdb.NewLogisticsDB(&basedb.MockPingDBTX{
		PingErr: errors.New("boo"),
	}, nil, noSettingsService, monitoring.NewMockScope())
	isHealthy = ldb.IsHealthy(ctx)
	testutils.MustMatch(t, false, isHealthy, "database status is healthy but database is null")
}

func TestIsPinnedVisitPhaseExhaustiveEnumeration(t *testing.T) {
	testutils.MustMatch(t, len(logisticsdb.IsPinnedVisitPhase), len(logisticspb.VisitPhase_name)-1, "must explicitly associate all shift team visit statuses to pinned-ness, except unspecified")
	testutils.MustMatch(t, false, logisticsdb.IsPinnedVisitPhase[logisticsdb.VisitPhaseTypeShortNameUncommitted])
	testutils.MustMatch(t, true, logisticsdb.IsPinnedVisitPhase[logisticsdb.VisitPhaseTypeShortNameCommitted])

	testutils.MustMatch(t, len(logisticspb.VisitPhase_name)-1, len(logisticsdb.VisitPhaseShortNameToPhases), "must explicitly associate all shift team visit statuses to phase type short names, except unspecified")
}

func TestLogisticsDB_GetLatestInfoForCareRequest(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	expectedArrivalTimeStamp := time.Now().Add(30 * time.Minute).UTC()
	expectedArrivalTimeStampSec := expectedArrivalTimeStamp.Unix()
	baseCareRequestID := time.Now().UnixNano()

	err := addCareRequestsInfo(ctx, queries, baseCareRequestID, expectedArrivalTimeStampSec)
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Desc          string
		CareRequestID int64
		Response      bool

		HasError bool
	}{
		{
			Desc:          "timestamp found",
			CareRequestID: baseCareRequestID,
			Response:      true,

			HasError: false,
		},
		{
			Desc:          "care request completed",
			CareRequestID: baseCareRequestID + 1,
			Response:      false,

			HasError: true,
		},
		{
			Desc:          "care request not have visit phase",
			CareRequestID: baseCareRequestID + 2,
			Response:      false,

			HasError: true,
		},
		{
			Desc:          "care request not have schedule visit",
			CareRequestID: baseCareRequestID + 3,
			Response:      false,

			HasError: true,
		},
		{
			Desc:          "care request not have schedule visit",
			CareRequestID: baseCareRequestID + 5,
			Response:      false,

			HasError: true,
		},
	}

	latestTimestamp := time.Now()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	for _, tc := range tcs {
		latestInfo, err := ldb.GetLatestInfoForCareRequest(ctx, tc.CareRequestID, latestTimestamp)
		if (err != nil) != tc.HasError {
			t.Fatalf("test %v fails on: %e", tc.Desc, err)
		}

		testutils.MustMatch(t, tc.Response, latestInfo != nil, "response was null when doesn't should be")
	}
}

// TODO: simplify test case and set up data for TestLogisticsDB_GetLatestInfoForCareRequest.
func addCareRequestsInfo(ctx context.Context, queries *logisticssql.Queries, baseCareRequestID, expectedArrivalTimeStampSec int64) error {
	baseID := time.Now().UnixNano()

	shiftTeamSnapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       baseID + 100,
		ServiceRegionID:   baseID,
		BaseLocationID:    baseID + 1,
		StartTimestampSec: baseID + 10,
		EndTimestampSec:   baseID + 100,
	})
	if err != nil {
		return err
	}
	location, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  int32(baseID + 1),
		LongitudeE6: int32(baseID + 1),
	})
	if err != nil {
		return err
	}
	_, err = queries.AddShiftTeamLocation(ctx, logisticssql.AddShiftTeamLocationParams{
		ShiftTeamSnapshotID: shiftTeamSnapshot.ID,
		LocationID:          location.ID,
	})
	if err != nil {
		return err
	}
	visitPhaseType, err := queries.GetVisitPhaseTypeForShortName(ctx, "committed")
	if err != nil {
		return err
	}

	location, err = queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  int32(baseID),
		LongitudeE6: int32(baseID),
	})
	if err != nil {
		return err
	}

	visit, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            baseCareRequestID,
		ServiceRegionID:          baseID,
		LocationID:               location.ID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
		ServiceDurationSec:       0,
	})
	if err != nil {
		return err
	}
	_, err = queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  visit.ID,
		VisitPhaseTypeID: visitPhaseType.ID,
		StationUserID:    sqltypes.ToValidNullInt64(baseID),
		StatusCreatedAt:  visit.CreatedAt.Add(-1 * time.Second),
	})
	if err != nil {
		return err
	}

	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  baseID,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		return err
	}

	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID:       baseID,
		OptimizerRunID:        optimizerRun.ID,
		HardScore:             0,
		UnassignedVisitsScore: 0,
		SoftScore:             0,
	})
	if err != nil {
		return err
	}

	shiftTeam1, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:     baseID * 10,
		ServiceRegionID: baseID, BaseLocationID: baseID,
		StartTimestampSec: baseID,
		EndTimestampSec:   baseID + 1,
	})
	if err != nil {
		return err
	}
	visitPhaseType, err = queries.GetVisitPhaseTypeForShortName(ctx, logisticsdb.VisitPhaseTypeShortNameEnRoute.String())
	if err != nil {
		return err
	}

	visit2, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
		CareRequestID:            baseCareRequestID + 4,
		ServiceRegionID:          baseID,
		LocationID:               baseID,
		ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(0),
		ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(1),
		ServiceDurationSec:       0,
	})
	if err != nil {
		return err
	}
	_, err = queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
		VisitSnapshotID:  visit2.ID,
		VisitPhaseTypeID: visitPhaseType.ID,
		StationUserID:    sqltypes.ToValidNullInt64(baseID),
	})
	if err != nil {
		return err
	}

	optimizerRun2, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  baseID,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		return err
	}

	schedule2, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID:       baseID,
		OptimizerRunID:        optimizerRun2.ID,
		HardScore:             0,
		UnassignedVisitsScore: 0,
		SoftScore:             0,
	})
	if err != nil {
		return err
	}

	nonsenseTime := time.Now().Unix()
	scheduleRouteIDs, err := queries.AddScheduleRoutes(ctx, logisticssql.AddScheduleRoutesParams{
		ScheduleIds:               []int64{schedule.ID, schedule.ID, schedule2.ID, schedule2.ID},
		ShiftTeamSnapshotIds:      []int64{shiftTeamSnapshot.ID, shiftTeam1.ID, shiftTeamSnapshot.ID, shiftTeam1.ID},
		DepotArrivalTimestampsSec: []int64{nonsenseTime, nonsenseTime, nonsenseTime, nonsenseTime},
	})
	if err != nil {
		return err
	}
	if len(scheduleRouteIDs) != 4 {
		return fmt.Errorf("incorrect number of schedule routes created(%d), expected(%d)", len(scheduleRouteIDs), 4)
	}

	_, err = queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
		ScheduleRouteID:     scheduleRouteIDs[0].ID,
		ScheduleID:          schedule.ID,
		VisitSnapshotID:     sqltypes.ToValidNullInt64(visit.ID),
		ArrivalTimestampSec: expectedArrivalTimeStampSec,
	})
	if err != nil {
		return err
	}
	_, err = queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
		ScheduleRouteID:     scheduleRouteIDs[3].ID,
		ScheduleID:          schedule2.ID,
		VisitSnapshotID:     sqltypes.ToValidNullInt64(visit2.ID),
		ArrivalTimestampSec: expectedArrivalTimeStampSec,
	})
	if err != nil {
		return err
	}

	return nil
}

func addStationMarket(ctx context.Context, t *testing.T, queries *logisticssql.Queries, stationMarketID int64) (*logisticssql.ServiceRegion, *logisticssql.Market) {
	t.Helper()

	region, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "some market",
		IanaTimeZoneName: "Asia/Tokyo",
	})
	if err != nil {
		t.Fatal(err)
	}

	market, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: region.ID,
		StationMarketID: stationMarketID,
		ShortName:       strconv.Itoa(int(stationMarketID)),
	})
	if err != nil {
		t.Fatal(err)
	}

	return region, market
}

func addShiftTeamRestBreakRequest(ctx context.Context, t *testing.T, shiftTeamID int64, locID int64, durationSec int64, ldb *logisticsdb.LogisticsDB) *logisticssql.ShiftTeamRestBreakRequest {
	t.Helper()

	brResponse, err := ldb.AddShiftTeamRestBreakRequest(
		ctx,
		logisticsdb.AddShiftTeamRestBreakParams{
			RestBreakParams: logisticssql.AddShiftTeamRestBreakRequestParams{
				ShiftTeamID:          shiftTeamID,
				StartTimestampSec:    time.Now().Unix(),
				DurationSec:          durationSec,
				LocationID:           locID,
				MaxRestBreakRequests: 1,
			},
			LatestTimestamp: time.Now(),
		},
	)
	if err != nil {
		t.Fatal(err)
	}
	return brResponse.RestBreakRequest
}

func TestWriteShiftTeamSnapshot(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	stationMarketID := time.Now().UnixNano()
	addStationMarket(ctx, t, queries, stationMarketID)

	shiftTeamID := time.Now().UnixNano()

	now := time.Now()
	now1 := now.Add(1 * time.Second)
	timeWindow := &commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&now),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&now1),
	}
	loc := &commonpb.Location{
		LatitudeE6:  int32(now.UnixNano()),
		LongitudeE6: int32(now.UnixNano()),
	}

	tcs := []struct {
		Desc      string
		ShiftTeam *shiftteampb.GetShiftTeamResponse

		HasErr bool
	}{
		{
			Desc: "base case",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: &shiftteampb.ShiftTeam{
					Id:              shiftTeamID,
					MarketId:        &stationMarketID,
					BaseLocation:    loc,
					ShiftTimeWindow: timeWindow,
				},
			},
		},
		{
			Desc: "base case with current location",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: &shiftteampb.ShiftTeam{
					Id:              shiftTeamID,
					MarketId:        &stationMarketID,
					BaseLocation:    loc,
					CurrentLocation: loc,
					ShiftTimeWindow: timeWindow,
				},
			},
		},
		{
			Desc: "base case with deleted shift",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: &shiftteampb.ShiftTeam{
					Id:              shiftTeamID,
					DeletedAt:       logisticsdb.TimeToProtoDateTime(&now),
					MarketId:        &stationMarketID,
					BaseLocation:    loc,
					ShiftTimeWindow: timeWindow,
				},
			},
		},
		{
			Desc: "no shift team",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: nil,
			},

			HasErr: true,
		},
		{
			Desc: "no market id",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: &shiftteampb.ShiftTeam{
					Id:              shiftTeamID,
					MarketId:        nil,
					BaseLocation:    loc,
					ShiftTimeWindow: timeWindow,
				},
			},

			HasErr: true,
		},
		{
			Desc: "no base location",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: &shiftteampb.ShiftTeam{
					Id:              shiftTeamID,
					MarketId:        &stationMarketID,
					BaseLocation:    nil,
					ShiftTimeWindow: timeWindow,
				},
			},

			HasErr: true,
		},
		{
			Desc: "no time window",
			ShiftTeam: &shiftteampb.GetShiftTeamResponse{
				ShiftTeam: &shiftteampb.ShiftTeam{
					Id:              shiftTeamID,
					MarketId:        &stationMarketID,
					BaseLocation:    loc,
					ShiftTimeWindow: nil,
				},
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			_, err := ldb.WriteShiftTeamSnapshot(ctx, shiftTeamID, tc.ShiftTeam)

			testutils.MustMatch(t, tc.HasErr, err != nil, "errors don't match")
		})
	}
}

func TestWriteVisitSnapshot(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	stationMarketID := time.Now().UnixNano()
	addStationMarket(ctx, t, queries, stationMarketID)

	careReqID := time.Now().UnixNano()

	now := time.Now()
	now1 := now.Add(1 * time.Second)
	timeWindow := &commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&now),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&now1),
	}
	loc := &commonpb.Location{
		LatitudeE6:  int32(now.UnixNano()),
		LongitudeE6: int32(now.UnixNano()),
	}
	serviceDurationSec := int64(123)
	acceptedCareRequestStatus := &commonpb.CareRequestStatus{
		Name:         proto.String("accepted"),
		SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER.Enum(),
		UserId:       proto.Int64(time.Now().UnixNano()),
		CreatedAtSec: proto.Int64(time.Now().Unix()),
		ShiftTeamId:  proto.Int64(time.Now().UnixNano()),
	}
	priority := &commonpb.CareRequestPriority{
		RequestedTimestampSec: proto.Int64(now.Unix()),
		RequestedByUserId:     proto.Int64(1),
		Note:                  proto.String("test"),
	}
	tcs := []struct {
		Desc  string
		Visit *episodepb.GetVisitResponse

		HasErr bool
	}{
		{
			Desc: "base case",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           loc,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
					IsManualOverride:   true,
				},
			},
		},
		{
			Desc: "With priority",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           loc,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
					IsManualOverride:   true,
					Priority:           priority,
				},
			},
		},
		{
			Desc: "With visit value",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           loc,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
					IsManualOverride:   true,
					Value: &commonpb.CareRequestValue{
						CompletionValueCents:                  proto.Int64(123),
						PartnerPriorityScore:                  proto.Int64(456),
						PartnerInfluencedCompletionValueCents: proto.Int64(789),
					},
				},
			},
		},
		{
			Desc: "With visit value, but zero values",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           loc,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
					IsManualOverride:   true,
					Value:              &commonpb.CareRequestValue{},
				},
			},
		},
		{
			Desc: "no care request",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: nil,
			},

			HasErr: true,
		},
		{
			Desc: "no market id",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           nil,
					Location:           loc,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
				},
			},

			HasErr: true,
		},
		{
			Desc: "no location",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           nil,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
				},
			},

			HasErr: true,
		},
		{
			Desc: "no time window",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           loc,
					ArrivalTimeWindow:  nil,
					ServiceDurationSec: &serviceDurationSec,
					RequestStatus:      acceptedCareRequestStatus,
				},
			},

			HasErr: true,
		},
		{
			Desc: "no service duration",
			Visit: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:                 careReqID,
					MarketId:           &stationMarketID,
					Location:           loc,
					ArrivalTimeWindow:  timeWindow,
					ServiceDurationSec: nil,
					RequestStatus:      acceptedCareRequestStatus,
				},
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			vs, err := ldb.WriteVisitSnapshot(ctx, careReqID, tc.Visit)
			testutils.MustMatch(t, tc.HasErr, err != nil, "errors don't match")
			if err != nil {
				return
			}
			testutils.MustMatch(t, tc.Visit.CareRequest.IsManualOverride, vs.IsManualOverride)
			if tc.Visit.CareRequest.Priority != nil {
				ps, err := queries.GetVisitPrioritySnapshot(ctx, vs.ID)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, *priority.RequestedTimestampSec, ps.RequestedTimestampSec.Int64)
				testutils.MustMatch(t, *priority.RequestedByUserId, ps.RequestedByUserID.Int64)
				testutils.MustMatch(t, *priority.Note, ps.Note.String)
			}

			value := tc.Visit.CareRequest.Value
			if value != nil {
				visitValueSnapshots, err := queries.GetVisitValueSnapshot(ctx, vs.ID)
				if err != nil {
					t.Fatal(err)
				}
				if len(visitValueSnapshots) == 0 {
					t.Fatal("no visit value snapshot found")
				}

				visitValueSnapshot := visitValueSnapshots[0]

				testutils.MustMatch(t, value.CompletionValueCents, sqltypes.ToProtoInt64(visitValueSnapshot.CompletionValueCents))
				testutils.MustMatch(t, value.PartnerPriorityScore, sqltypes.ToProtoInt64(visitValueSnapshot.PartnerPriorityScore))
				testutils.MustMatch(t, value.PartnerInfluencedCompletionValueCents, sqltypes.ToProtoInt64(visitValueSnapshot.PartnerInfluencedCompletionValueCents))
			}
		})
	}
}

func TestWriteVisitAcuitySnapshot(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	stationMarketID := time.Now().UnixNano()
	addStationMarket(ctx, t, queries, stationMarketID)

	careReqID := time.Now().UnixNano()

	requestedCareRequestStatus := &commonpb.CareRequestStatus{
		Name:         proto.String("requested"),
		SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER.Enum(),
		UserId:       proto.Int64(time.Now().UnixNano()),
		CreatedAtSec: proto.Int64(time.Now().Unix()),
		ShiftTeamId:  proto.Int64(time.Now().UnixNano()),
	}

	now := time.Now()
	arrivalTimeWindowEnd := now.Add(1 * time.Second)

	clinicalUrgencyLevel := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_LOW.Enum()

	acuity := &commonpb.AcuityInfo{
		PatientAge:            proto.Int32(123),
		CurrentChiefComplaint: proto.String("general complaint"),
		Level:                 clinicalUrgencyLevel,
	}

	visit := &episodepb.GetVisitResponse{
		CareRequest: &commonpb.CareRequestInfo{
			Id:       careReqID,
			MarketId: &stationMarketID,
			Location: &commonpb.Location{
				LatitudeE6:  int32(now.UnixNano()),
				LongitudeE6: int32(now.UnixNano()),
			},
			ArrivalTimeWindow: &commonpb.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&now),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&arrivalTimeWindowEnd),
			},
			ServiceDurationSec: proto.Int64(123),
			RequestStatus:      requestedCareRequestStatus,
			Acuity:             acuity,
		},
	}

	visitSnapshot, err := ldb.WriteVisitSnapshot(ctx, careReqID, visit)
	if err != nil {
		t.Fatal(err)
	}

	got, err := queries.GetVisitAcuitySnapshotByVisitSnapshotID(ctx, visitSnapshot.ID)
	if err != nil {
		t.Fatal(err)
	}

	want := &logisticssql.VisitAcuitySnapshot{
		VisitSnapshotID:        visitSnapshot.ID,
		ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(logisticsdb.ClinicalUrgencyLevelEnumToID[*clinicalUrgencyLevel]),
		PatientAge:             sql.NullInt64{Valid: true, Int64: 123},
		ChiefComplaint:         sql.NullString{Valid: true, String: "general complaint"},
	}

	testutils.MustMatchFn(".ID", ".CreatedAt")(t, want, got)
}

func TestWriteVisitAcuitySnapshot_requestError(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	stationMarketID := time.Now().UnixNano()
	addStationMarket(ctx, t, queries, stationMarketID)

	careReqID := time.Now().UnixNano()

	requestedCareRequestStatus := &commonpb.CareRequestStatus{
		Name:         proto.String("requested"),
		SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER.Enum(),
		UserId:       proto.Int64(time.Now().UnixNano()),
		CreatedAtSec: proto.Int64(time.Now().Unix()),
		ShiftTeamId:  proto.Int64(time.Now().UnixNano()),
	}

	now := time.Now()
	arrivalTimeWindowEnd := now.Add(1 * time.Second)

	clinicalUrgencyLevelLow := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_LOW.Enum()
	clinicalUrgencyLevelHigh := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH.Enum()

	previousAcuity := &commonpb.AcuityInfo{
		PatientAge:            proto.Int32(123),
		CurrentChiefComplaint: proto.String("a horrible complaint"),
		Level:                 clinicalUrgencyLevelHigh,
	}

	visit := &episodepb.GetVisitResponse{
		CareRequest: &commonpb.CareRequestInfo{
			Id:       careReqID,
			MarketId: &stationMarketID,
			Location: &commonpb.Location{
				LatitudeE6:  int32(now.UnixNano()),
				LongitudeE6: int32(now.UnixNano()),
			},
			ArrivalTimeWindow: &commonpb.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&now),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&arrivalTimeWindowEnd),
			},
			ServiceDurationSec: proto.Int64(123),
			RequestStatus:      requestedCareRequestStatus,
			Acuity:             previousAcuity,
		},
	}

	_, err := ldb.WriteVisitSnapshot(ctx, careReqID, visit)
	if err != nil {
		t.Fatal(err)
	}

	acuityWithRequestError := &commonpb.AcuityInfo{
		PatientAge:            proto.Int32(123),
		CurrentChiefComplaint: proto.String("ingrown toenail"),
		Level:                 clinicalUrgencyLevelLow,
		RequestError:          proto.String("something wrong happened"),
	}
	visit.CareRequest.Acuity = acuityWithRequestError

	visitSnapshot, err := ldb.WriteVisitSnapshot(ctx, careReqID, visit)
	if err != nil {
		t.Fatal(err)
	}

	got, err := queries.GetVisitAcuitySnapshotByVisitSnapshotID(ctx, visitSnapshot.ID)
	if err != nil {
		t.Fatal(err)
	}

	want := &logisticssql.VisitAcuitySnapshot{
		VisitSnapshotID:        visitSnapshot.ID,
		ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(logisticsdb.ClinicalUrgencyLevelEnumToID[*clinicalUrgencyLevelHigh]),
		PatientAge:             sql.NullInt64{Valid: true, Int64: 123},
		ChiefComplaint:         sql.NullString{Valid: true, String: "a horrible complaint"},
	}

	testutils.MustMatchFn(".ID", ".CreatedAt")(t, want, got, "new snapshot should be equal to the latest snapshot")
}

func TestCareRequestStatusToPhaseTypeID(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	expectedShortNames := map[string]string{
		"accepted":  "uncommitted",
		"committed": "committed",
		"on_route":  "en_route",
		"on_scene":  "on_scene",
		"complete":  "completed",
		"archived":  "cancelled",
		"requested": "requested",
	}
	testutils.MustMatch(t, len(expectedShortNames), len(logisticsdb.CareRequestStatusNameToPhaseTypeID), "all values should have an expectation")
	for k, v := range logisticsdb.CareRequestStatusNameToPhaseTypeID {
		vpt, err := queries.GetVisitPhaseTypeByID(ctx, v)
		// all values referenced should be real phase type IDs
		if err != nil {
			t.Fatal(err)
		}
		testutils.MustMatch(t, expectedShortNames[k], vpt.ShortName)
	}
}

func TestLogisticsDB_GetAssignableShiftTeamsCandidatesForDate(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	tz, err := time.LoadLocation("America/Denver")
	if err != nil {
		t.Fatal(err)
	}

	todayOpen := time.Date(2022, time.August, 1, 8, 0, 0, 0, tz)
	todayClose := time.Date(2022, time.August, 1, 16, 0, 0, 0, tz)
	tomorrowOpen := todayOpen.AddDate(0, 0, 1)
	tomorrowClose := todayClose.AddDate(0, 0, 1)

	openScheduleDays := []*commonpb.ScheduleDay{
		{
			DayOfWeek: int32(todayOpen.Weekday()),
			OpenTime:  logisticsdb.ProtoTimeOfDayFromTime(todayOpen),
			CloseTime: logisticsdb.ProtoTimeOfDayFromTime(todayClose),
		},
		{
			DayOfWeek: int32(tomorrowOpen.Weekday()),
			OpenTime:  logisticsdb.ProtoTimeOfDayFromTime(tomorrowOpen),
			CloseTime: logisticsdb.ProtoTimeOfDayFromTime(tomorrowClose),
		},
	}

	tcs := []struct {
		Desc string

		ShiftTeamTWs []timeWindow
		Date         time.Time

		NumCandidates int
	}{
		{
			Desc: "one shift team today, one candidate today",
			ShiftTeamTWs: []timeWindow{
				{todayOpen, todayClose},
			},
			Date: todayOpen,

			NumCandidates: 1,
		},
		{
			Desc: "two shift teams today, two candidate today",
			ShiftTeamTWs: []timeWindow{
				{todayOpen, todayClose},
				{todayOpen.Add(1 * time.Hour), todayClose.Add(-1 * time.Hour)},
			},
			Date: todayOpen,

			NumCandidates: 2,
		},
		{
			Desc: "one shift team today and tomorrow, one candidate today",
			ShiftTeamTWs: []timeWindow{
				{todayOpen, todayClose},
				{tomorrowOpen, tomorrowClose},
			},
			Date: todayOpen,

			NumCandidates: 1,
		},
		{
			Desc: "one shift team today and tomorrow, one candidate tomorrow",
			ShiftTeamTWs: []timeWindow{
				{todayOpen, todayClose},
				{tomorrowOpen, tomorrowClose},
			},
			Date: tomorrowOpen,

			NumCandidates: 1,
		},
		{
			Desc: "one shift team today, no candidate tomorrow",
			ShiftTeamTWs: []timeWindow{
				{todayOpen, todayClose},
			},
			Date: tomorrowOpen,

			NumCandidates: 0,
		},
		{
			Desc: "one shift team tomorrow, no candidate today",
			ShiftTeamTWs: []timeWindow{
				{tomorrowOpen, tomorrowClose},
			},
			Date: todayOpen,

			NumCandidates: 0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationMarketID := time.Now().UnixNano()
			latLong := time.Now().UnixNano()

			err := ldb.UpsertMarketAndServiceRegionFromStationMarket(ctx, &marketpb.Market{
				Id:               stationMarketID,
				Enabled:          proto.Bool(true),
				ScheduleDays:     openScheduleDays,
				IanaTimeZoneName: proto.String(todayOpen.Location().String()),
				Name:             proto.String("Assignable Shift Team Candidate"),
				ShortName:        proto.String("Assignable Shift Team Candidate"),
			})
			if err != nil {
				t.Fatal(err)
			}

			var snapshotTime time.Time
			for _, tw := range tc.ShiftTeamTWs {
				shiftTeamID := time.Now().UnixNano()
				shiftTeam, err := ldb.WriteShiftTeamSnapshot(ctx, shiftTeamID,
					&shiftteampb.GetShiftTeamResponse{
						ShiftTeam: &shiftteampb.ShiftTeam{
							Id:       shiftTeamID,
							MarketId: proto.Int64(stationMarketID),
							BaseLocation: &commonpb.Location{
								LatitudeE6:  int32(latLong),
								LongitudeE6: int32(latLong),
							},
							ShiftTimeWindow: &commonpb.TimeWindow{
								StartDatetime: logisticsdb.TimeToProtoDateTime(&tw.start),
								EndDatetime:   logisticsdb.TimeToProtoDateTime(&tw.end),
							},
							ShiftTeamAttributes: []*commonpb.Attribute{
								{Name: "test_skill"},
							},
						}})
				if err != nil {
					t.Fatal(err)
				}

				snapshotTime = shiftTeam.CreatedAt
			}

			assignableShiftTeams, err := ldb.GetAssignableShiftTeamCandidatesForDate(ctx, logisticsdb.GetAssignableShiftTeamCandidatesForDateParams{
				StationMarketID:    stationMarketID,
				Date:               tc.Date,
				LatestSnapshotTime: snapshotTime,
			})
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.NumCandidates, len(assignableShiftTeams), "wrong length of candidates")
		})
	}
}

func TestCareRequestStatusSourceTypeToPhaseSourceTypeID_Exhaustive(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()
	sourceTypes, err := queries.GetVisitPhaseSourceTypes(ctx)
	if err != nil {
		t.Fatal(err)
	}
	sourceTypeMap := make(map[int64]*logisticssql.VisitPhaseSourceType)
	for _, st := range sourceTypes {
		sourceTypeMap[st.ID] = st
	}

	src := commonpb.CareRequestStatus_SourceType_value
	testutils.MustMatch(t, len(src)-1, len(logisticsdb.CareRequestStatusSourceTypeToPhaseSourceTypeID), "everything but unspecified, no more")
	for k, v := range src {
		if v == 0 {
			continue
		}
		sourceTypeID, ok := logisticsdb.CareRequestStatusSourceTypeToPhaseSourceTypeID[commonpb.CareRequestStatus_SourceType(v)]
		testutils.MustMatch(t, true, ok, k)
		_, foundSourceType := sourceTypeMap[sourceTypeID]
		testutils.MustMatch(t, true, foundSourceType, k, fmt.Sprint(sourceTypeID))
	}
}

func Test_GetClinicalUrgencyLevelByID(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	expectedShortNamesByID := map[int64]string{
		1: "high_manual_override",
		2: "high",
		3: "normal",
		4: "low",
	}

	testutils.MustMatch(t, len(expectedShortNamesByID), len(commonpb.ClinicalUrgencyLevel_name)-1, "all values should have an expectation")

	for _, id := range logisticsdb.ClinicalUrgencyLevelEnumToID {
		clinicalUrgencyLevel, err := queries.GetClinicalUrgencyLevelByID(ctx, (id))
		if err != nil {
			t.Fatal(err)
		}

		testutils.MustMatch(t, expectedShortNamesByID[id], clinicalUrgencyLevel.ShortName)
	}
}

func TestLDB_GetDistanceSourceByShortName(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	tcs := []struct {
		Desc                    string
		DistanceSourceShortName string

		HasError bool
	}{
		{
			Desc:                    "osrm case",
			DistanceSourceShortName: logisticsdb.OSRMMapsSourceShortName,
		},
		{
			Desc:                    "google_maps case",
			DistanceSourceShortName: logisticsdb.GoogleMapsSourceShortName,
		},
		{
			Desc:                    "distance source not found",
			DistanceSourceShortName: "unknown",

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			distanceSourceResp, err := ldb.GetDistanceSourceByShortName(ctx, tc.DistanceSourceShortName)
			if err != nil && !tc.HasError {
				t.Fatalf("error not the same: %+v", tc)
			}
			if tc.HasError {
				return
			}

			if distanceSourceResp == nil {
				t.Fatalf("distance source should not be nil: %+v", tc)
			}
		})
	}
}

func TestGetLatestOptimizerRunForRegionDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	serviceDate := time.Now().Truncate(time.Hour)
	serviceRegionID := time.Now().UnixNano()
	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	res, err := ldb.GetLatestOptimizerRunForRegionDate(ctx, logisticssql.GetLatestOptimizerRunForRegionDateParams{
		ServiceRegionID: serviceRegionID,
		ServiceDate:     serviceDate,
		CreatedBefore:   time.Now(),
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, optimizerRun.ID, res.ID)

	_, err = ldb.GetLatestOptimizerRunForRegionDate(ctx, logisticssql.GetLatestOptimizerRunForRegionDateParams{
		ServiceRegionID: serviceRegionID,
		ServiceDate:     serviceDate.Add(24 * time.Hour),
		CreatedBefore:   time.Now(),
	})
	testutils.MustMatch(t, logisticsdb.ErrNoOptimizerRunForDate, err)
}

func TestGetLatestOptimizerRunForRegionDate_filterOutFeasibilityChecks(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	serviceDate := time.Now().Truncate(time.Hour)
	serviceRegionID := time.Now().UnixNano()

	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	// add a feasibility check run
	_, err = queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.FeasibilityCheckRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	res, err := ldb.GetLatestOptimizerRunForRegionDate(ctx, logisticssql.GetLatestOptimizerRunForRegionDateParams{
		ServiceRegionID: serviceRegionID,
		ServiceDate:     serviceDate,
		CreatedBefore:   time.Now(),
	})
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, optimizerRun.ID, res.ID, "should filter out feasibility check runs")

	_, err = ldb.GetLatestOptimizerRunForRegionDate(ctx, logisticssql.GetLatestOptimizerRunForRegionDateParams{
		ServiceRegionID: serviceRegionID,
		ServiceDate:     serviceDate.Add(24 * time.Hour),
		CreatedBefore:   time.Now(),
	})
	testutils.MustMatch(t, logisticsdb.ErrNoOptimizerRunForDate, err)
}

func TestLogisticsDB_WriteScheduleStats(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	scheduleID := time.Now().UnixNano()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil)
	err := ldb.WriteScheduleStats(ctx, scheduleID, &optimizerpb.VRPStats{
		DriveDurationSec:    proto.Int64(111),
		DriveDistanceMeters: proto.Int64(222),
		ServiceDurationSec:  proto.Int64(333),
	})
	if err != nil {
		t.Fatal(err)
	}

	scheduleStat, err := queries.GetScheduleStats(ctx, scheduleID)
	if err != nil {
		t.Fatal(err)
	}

	want := &logisticssql.ScheduleStat{
		ScheduleID:          scheduleID,
		DriveDurationSec:    sql.NullInt64{Valid: true, Int64: 111},
		DriveDistanceMeters: sql.NullInt64{Valid: true, Int64: 222},
		ServiceDurationSec:  sql.NullInt64{Valid: true, Int64: 333},
	}

	testutils.MustMatchFn(".ID")(t, want, scheduleStat)
}

func TestCareRequestActualsFromCareRequestIDs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	shiftTeamID := proto.Int64(time.Now().UnixNano())
	completedCareRequestID := time.Now().UnixNano()
	stationMarketID := time.Now().UnixNano()
	addStationMarket(ctx, t, queries, stationMarketID)

	arrivedVisit1 := writeVisitSnapshot(ctx, t, completedCareRequestID, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameOnScene, shiftTeamID)
	arrivedAndCompletedVisit1 := writeVisitSnapshot(ctx, t, completedCareRequestID, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameCompleted, shiftTeamID)

	onlyArrivedVisit2 := writeVisitSnapshot(ctx, t, completedCareRequestID+1, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameOnScene, shiftTeamID)

	oldVersionOfVisit3 := writeVisitSnapshot(ctx, t, completedCareRequestID+2, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameOnScene, shiftTeamID)
	disallowedTransitionVisit3 := writeVisitSnapshot(ctx, t, completedCareRequestID+2, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameCommitted, shiftTeamID)

	enRouteVisit4 := writeVisitSnapshot(ctx, t, completedCareRequestID+3, stationMarketID, ldb, logisticsdb.VisitPhaseTypeShortNameEnRoute, shiftTeamID)

	actuals, err := ldb.CareRequestActualsFromCareRequestIDs(ctx,
		[]int64{
			arrivedVisit1.ID,
			arrivedAndCompletedVisit1.ID,
			onlyArrivedVisit2.ID,
			// sometimes this function will see multiple versions of the visit.
			// The code needs to be able to resolve the "latest" phase from multiple snapshot IDs.
			oldVersionOfVisit3.ID,
			disallowedTransitionVisit3.ID,
			enRouteVisit4.ID,
		},
		[]int64{
			arrivedAndCompletedVisit1.CareRequestID,
			onlyArrivedVisit2.CareRequestID,
			disallowedTransitionVisit3.CareRequestID,
			enRouteVisit4.CareRequestID,
		},
		time.Now(),
	)
	if err != nil {
		t.Fatal(err)
	}

	// the timestamps we need to test against are on the "status created at"; so we fetch them here.
	// this looks suspect, but not how this is used in production.
	vpsOld, err := queries.GetVisitPhaseForVisitSnapshotsByCareRequestID(ctx, []int64{
		arrivedVisit1.ID,
		onlyArrivedVisit2.ID,
		enRouteVisit4.ID,
	})
	if err != nil {
		t.Fatal(err)
	}
	vpsNew, err := queries.GetVisitPhaseForVisitSnapshotsByCareRequestID(ctx, []int64{
		arrivedAndCompletedVisit1.ID,
		disallowedTransitionVisit3.ID,
	})
	if err != nil {
		t.Fatal(err)
	}
	type idPair struct {
		careRequestID int64
		snapshotID    int64
	}
	type timingPair struct {
		arrival   time.Time
		completed time.Time
		enRoute   time.Time
	}
	expectedShiftTeamActuals := logisticsdb.NewShiftTeamActuals()
	statusTimings := make(map[idPair]*timingPair)
	for _, vp := range append(vpsNew, vpsOld...) {
		key := idPair{
			careRequestID: vp.CareRequestID,
			snapshotID:    vp.VisitSnapshotID,
		}
		updateTiming := func(timing *timingPair, val time.Time, shiftTeamID logisticsdb.ShiftTeamID) {
			switch vp.VisitPhaseShortName {
			case logisticsdb.VisitPhaseTypeShortNameCompleted.String():
				timing.completed = val
				expectedShiftTeamActuals.AddCompletion(logisticsdb.EntityIDPair{
					ShiftTeamID:   shiftTeamID,
					CareRequestID: logisticsdb.CareRequestID(key.careRequestID),
				}, val)
			case logisticsdb.VisitPhaseTypeShortNameOnScene.String():
				timing.arrival = val
				expectedShiftTeamActuals.AddArrival(logisticsdb.EntityIDPair{
					ShiftTeamID:   shiftTeamID,
					CareRequestID: logisticsdb.CareRequestID(key.careRequestID),
				}, val)
			case logisticsdb.VisitPhaseTypeShortNameEnRoute.String():
				timing.enRoute = val
				expectedShiftTeamActuals.AddCurrentlyEnRoute(logisticsdb.EntityIDPair{
					ShiftTeamID:   shiftTeamID,
					CareRequestID: logisticsdb.CareRequestID(key.careRequestID),
				}, val)
			case logisticsdb.VisitPhaseTypeShortNameCommitted.String():
				expectedShiftTeamActuals.AddCommitted(logisticsdb.EntityIDPair{
					ShiftTeamID:   shiftTeamID,
					CareRequestID: logisticsdb.CareRequestID(key.careRequestID),
				}, val)
			}
		}
		val, ok := statusTimings[key]
		if !ok {
			tp := &timingPair{}
			statusTimings[key] = tp
			updateTiming(tp, vp.StatusCreatedAt, logisticsdb.ShiftTeamID(vp.ShiftTeamID.Int64))
		} else {
			updateTiming(val, vp.StatusCreatedAt, logisticsdb.ShiftTeamID(vp.ShiftTeamID.Int64))
		}
	}
	testutils.MustMatch(t, logisticsdb.CareRequestActuals{
		// disallowedTransitionVisit3 does not show up here.
		ArrivalTimes: map[logisticsdb.CareRequestID]time.Time{
			logisticsdb.CareRequestID(arrivedAndCompletedVisit1.CareRequestID): statusTimings[idPair{careRequestID: arrivedVisit1.CareRequestID, snapshotID: arrivedVisit1.ID}].arrival,
			logisticsdb.CareRequestID(onlyArrivedVisit2.CareRequestID):         statusTimings[idPair{careRequestID: onlyArrivedVisit2.CareRequestID, snapshotID: onlyArrivedVisit2.ID}].arrival,
		},
		CompletionTimes: map[logisticsdb.CareRequestID]time.Time{
			logisticsdb.CareRequestID(arrivedAndCompletedVisit1.CareRequestID): statusTimings[idPair{careRequestID: arrivedAndCompletedVisit1.CareRequestID, snapshotID: arrivedAndCompletedVisit1.ID}].completed,
		},
		CurrentlyEnRouteTimes: map[logisticsdb.CareRequestID]time.Time{
			logisticsdb.CareRequestID(enRouteVisit4.CareRequestID): statusTimings[idPair{careRequestID: enRouteVisit4.CareRequestID, snapshotID: enRouteVisit4.ID}].enRoute,
		},
		ShiftTeamActuals: expectedShiftTeamActuals,
	}, actuals)
}
func TestGetLatestCareRequestsDataForDiagnostics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseCareRequestID1 := time.Now().UnixNano()
	err := addCareRequestsInfo(ctx, queries, baseCareRequestID1, 0)
	if err != nil {
		t.Fatal(err)
	}

	baseCareRequestID2 := time.Now().UnixNano()
	err = addCareRequestsInfo(ctx, queries, baseCareRequestID2, 0)
	if err != nil {
		t.Fatal(err)
	}

	expectedCareRequests := []logisticsdb.CareRequestDiagnostics{
		{
			CareRequestID: &baseCareRequestID1,
			VisitPhase:    logisticspb.VisitPhase_VISIT_PHASE_COMMITTED,
		},
		{
			CareRequestID: &baseCareRequestID2,
			VisitPhase:    logisticspb.VisitPhase_VISIT_PHASE_COMMITTED,
		},
	}

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	careRequestIDs := []int64{baseCareRequestID1, baseCareRequestID2}
	createdBefore := time.Now()
	createdBeforeHourAgo := createdBefore.Add(-time.Hour * 1)

	careRequestDiagnosticsResp, err := ldb.GetLatestCareRequestsDataForDiagnostics(ctx, careRequestIDs, createdBefore)
	if err != nil {
		t.Fatal(err)
	}
	for i, careRequestDiagnostic := range careRequestDiagnosticsResp {
		testutils.MustMatch(t, expectedCareRequests[i].CareRequestID, careRequestDiagnostic.CareRequestID, "care request id doesnt match")
		testutils.MustMatch(t, expectedCareRequests[i].VisitPhase, careRequestDiagnostic.VisitPhase, "care request visit phase doesnt match")
	}

	careRequestDiagnosticsPastResp, err := ldb.GetLatestCareRequestsDataForDiagnostics(ctx, careRequestIDs, createdBeforeHourAgo)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, len(careRequestDiagnosticsPastResp), 0, "future care request found")
}

func TestWriteVirtualAPPVisitPhaseSnapshot(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	now := time.Now()
	arrivalTimeWindowEnd := now.Add(1 * time.Second)

	careReqID := time.Now().UnixNano()
	shiftTeamID := time.Now().UnixNano()
	stationUserID := time.Now().UnixNano()
	stationMarketID := time.Now().UnixNano()
	addStationMarket(ctx, t, queries, stationMarketID)

	virtualAPPVisitPhaseType := commonpb.VirtualAPPCareRequestStatus_STATUS_NAME_ASSIGNED
	virtualAPPVisitSourceType := commonpb.StatusSourceType_STATUS_SOURCE_TYPE_MANUAL_OPTIMIZER

	tcs := []struct {
		Desc                        string
		VirtualAppCareRequestStatus *commonpb.VirtualAPPCareRequestStatus
		ExpectedSnapshot            *logisticssql.VirtualAppVisitPhaseSnapshot
		HasError                    bool
	}{
		{
			Desc: "base case",
			VirtualAppCareRequestStatus: &commonpb.VirtualAPPCareRequestStatus{
				Status:       virtualAPPVisitPhaseType,
				UserId:       &stationUserID,
				SourceType:   virtualAPPVisitSourceType,
				CreatedAtSec: time.Now().Unix(),
				ShiftTeamId:  proto.Int64(shiftTeamID),
			},
			ExpectedSnapshot: &logisticssql.VirtualAppVisitPhaseSnapshot{
				VirtualAppVisitPhaseTypeID: logisticsdb.VirtualAPPVisitPhaseTypeEnumToID[virtualAPPVisitPhaseType],
				VisitPhaseSourceTypeID:     logisticsdb.StatusSourceTypeToPhaseSourceTypeID[virtualAPPVisitSourceType],
				StationUserID:              sql.NullInt64{Valid: true, Int64: stationUserID},
				ShiftTeamID:                sql.NullInt64{Valid: true, Int64: shiftTeamID},
			},
			HasError: false,
		},
		{
			Desc:                        "empty case",
			VirtualAppCareRequestStatus: nil,
			ExpectedSnapshot:            nil,
			HasError:                    true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			careRequestInfo := &commonpb.CareRequestInfo{
				Id:       careReqID,
				MarketId: &stationMarketID,
				Location: &commonpb.Location{
					LatitudeE6:  int32(now.UnixNano()),
					LongitudeE6: int32(now.UnixNano()),
				},
				ArrivalTimeWindow: &commonpb.TimeWindow{
					StartDatetime: logisticsdb.TimeToProtoDateTime(&now),
					EndDatetime:   logisticsdb.TimeToProtoDateTime(&arrivalTimeWindowEnd),
				},
				ServiceDurationSec: proto.Int64(123),
				RequestStatus: &commonpb.CareRequestStatus{
					Name:         proto.String("requested"),
					SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER.Enum(),
					UserId:       proto.Int64(time.Now().UnixNano()),
					CreatedAtSec: proto.Int64(time.Now().Unix()),
					ShiftTeamId:  proto.Int64(shiftTeamID),
				},
				VirtualAppCareRequestStatus: tc.VirtualAppCareRequestStatus,
			}
			visit := &episodepb.GetVisitResponse{CareRequest: careRequestInfo}

			visitSnapshot, err := ldb.WriteVisitSnapshot(ctx, careReqID, visit)
			if err != nil && !tc.HasError {
				t.Fatal(err)
			}
			if tc.HasError {
				return
			}

			got, err := queries.GetVirtualAPPVisitPhaseSnapshotByVisitSnapshotID(ctx, visitSnapshot.ID)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatchFn(".ID", ".CreatedAt", ".VisitSnapshotID")(t, tc.ExpectedSnapshot, got)
		})
	}
}

func TestLDB_GetOpenHoursScheduleForServiceRegion(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	serviceRegionID := time.Now().UnixNano()

	openTime := &commonpb.TimeOfDay{
		Hours:   1,
		Minutes: 2,
		Seconds: 3,
	}
	closeTime := &commonpb.TimeOfDay{
		Hours:   4,
		Minutes: 5,
		Seconds: 6,
	}

	days := []*commonpb.ScheduleDay{
		{
			DayOfWeek: 0,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
		{
			DayOfWeek: 1,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
		{
			DayOfWeek: 2,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
		{
			DayOfWeek: 3,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
		{
			DayOfWeek: 4,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
		{
			DayOfWeek: 5,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
		{
			DayOfWeek: 6,
			OpenTime:  openTime,
			CloseTime: closeTime,
		},
	}
	schedule, err := ldb.UpdateOpenHoursScheduleForServiceRegion(ctx, serviceRegionID, days)
	if err != nil {
		t.Fatal(err)
	}

	scheduleDays, err := ldb.GetOpenHoursScheduleForServiceRegion(ctx, serviceRegionID, schedule.CreatedAt)
	if err != nil {
		t.Fatal(err)
	}

	expected := make([]*commonpb.ScheduleDay, 7)
	for i, day := range days {
		expected[i] = &commonpb.ScheduleDay{
			DayOfWeek: day.DayOfWeek,
			OpenTime:  day.OpenTime,
			CloseTime: day.CloseTime,
		}
	}

	testutils.MustMatch(t, expected, scheduleDays)
}

func TestLDB_AddServiceRegionAvailabilityQuery(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()
	mapService := &mockDistanceMatrix{}
	ldb := logisticsdb.NewLogisticsDB(db, logistics.NewMapServicePicker(mapService, mapService, mockSettingsService), mockSettingsService, monitoring.NewMockScope())

	serviceRegionID := int64(100)
	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	referenceScheduleID := int64(30)
	feasibilityStatus := logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE

	query, err := ldb.AddServiceRegionAvailabilityQuery(ctx, &logisticsdb.ServiceRegionAvailabilityQueryParams{
		ServiceRegionID:     serviceRegionID,
		ServiceDate:         serviceDate,
		ReferenceScheduleID: referenceScheduleID,
		FeasibilityStatus:   feasibilityStatus.String(),
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, serviceRegionID, query.ServiceRegionID)
	testutils.MustMatch(t, serviceDate, query.ServiceDate)
	testutils.MustMatch(t, referenceScheduleID, query.ReferenceScheduleID.Int64)
	testutils.MustMatch(t, feasibilityStatus.String(), query.FeasibilityStatus.String)
}

func TestLogisticsDB_AddServiceRegionAvailabilityQueries(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()
	mapService := &mockDistanceMatrix{}
	ldb := logisticsdb.NewLogisticsDB(db, logistics.NewMapServicePicker(mapService, mapService, mockSettingsService), mockSettingsService, monitoring.NewMockScope())

	serviceRegionID := int64(100)
	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	referenceScheduleID := int64(30)
	availabilityStatus := logisticspb.ServiceRegionAvailability_STATUS_AVAILABLE

	queries, err := ldb.AddServiceRegionAvailabilityQueries(ctx, logisticssql.AddServiceRegionAvailabilityQueriesParams{
		ServiceRegionIds:     []int64{serviceRegionID},
		ServiceDates:         []time.Time{serviceDate},
		ReferenceScheduleIds: []int64{referenceScheduleID},
		FeasibilityStatuses:  []string{availabilityStatus.String()},
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, serviceRegionID, queries[0].ServiceRegionID)
	testutils.MustMatch(t, serviceDate, queries[0].ServiceDate)
	testutils.MustMatch(t, referenceScheduleID, queries[0].ReferenceScheduleID.Int64)
	testutils.MustMatch(t, availabilityStatus.String(), queries[0].FeasibilityStatus.String)
}

func TestLogisticsDB_AddServiceRegionAvailabilityQueryAttributes(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	query1 := &logisticssql.ServiceRegionAvailabilityQuery{ID: 1}
	query2 := &logisticssql.ServiceRegionAvailabilityQuery{ID: 2}
	query3 := &logisticssql.ServiceRegionAvailabilityQuery{ID: 3}
	query4 := &logisticssql.ServiceRegionAvailabilityQuery{ID: 4}
	query5 := &logisticssql.ServiceRegionAvailabilityQuery{ID: 5}

	now := time.Now()
	attributeName1 := fmt.Sprintf("attribute-%v", now.UnixNano())
	attributeName2 := fmt.Sprintf("attribute-%v", now.UnixNano()+1)
	_, err := queries.UpsertAttributes(ctx, []string{
		attributeName1, attributeName2,
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Desc                string
		AvailabilityQueries []*logisticssql.ServiceRegionAvailabilityQuery
		AttributeNames      []string

		HasErr bool
	}{
		{
			Desc: "one query with one attribute",
			AvailabilityQueries: []*logisticssql.ServiceRegionAvailabilityQuery{
				query1,
			},
			AttributeNames: []string{
				attributeName1,
			},
		},
		{
			Desc: "one query with two attributes",
			AvailabilityQueries: []*logisticssql.ServiceRegionAvailabilityQuery{
				query2,
			},
			AttributeNames: []string{
				attributeName1, attributeName2,
			},
		},
		{
			Desc: "three queries with two attributes",
			AvailabilityQueries: []*logisticssql.ServiceRegionAvailabilityQuery{
				query3, query4, query5,
			},
			AttributeNames: []string{
				attributeName1, attributeName2,
			},
		},
		{
			Desc: "error with attributes",

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			queryAttributes, err := ldb.AddServiceRegionAvailabilityQueryAttributes(ctx, tc.AvailabilityQueries, tc.AttributeNames)
			if err != nil && !tc.HasErr {
				t.Fatal(err)
			}

			if tc.HasErr {
				return
			}

			testutils.MustMatch(t, len(tc.AvailabilityQueries)*len(tc.AttributeNames), len(queryAttributes), "lengths don't match")
		})
	}
}

func TestLDB_GetCheckFeasibilityCareRequestHistory(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	mapService := &mockDistanceMatrix{}
	defer done()

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}
	ldb := logisticsdb.NewLogisticsDB(db, logistics.NewMapServicePicker(mapService, mapService, mockSettingsService), mockSettingsService, monitoring.NewMockScope())
	now := time.Now().UTC()
	fakeID := now.UnixNano()
	arrivalTWStart := now
	arrivalTWEnd := arrivalTWStart.Add(time.Second * 3000)
	arrivalTWStartTimestampSec := arrivalTWStart.Unix()
	arrivalTWEndTimestampSec := arrivalTWEnd.Unix()
	serviceDurationSec := int64(500)
	latitudeE6 := int32(921)
	longitudeE6 := int32(921)
	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)
	badServiceDate := time.Date(2022, time.January, 2, 0, 0, 0, 0, time.UTC)

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "9:00PM")
	if err != nil {
		t.Fatal(err)
	}

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "open hours region",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}
	serviceRegionID := serviceRegion.ID

	minServiceDuration := 300 * time.Second
	maxServiceDuration := 600 * time.Second
	_, err = queries.AddServiceRegionCanonicalVisitDurations(ctx, logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
		ServiceRegionID:       serviceRegion.ID,
		ServiceDurationMinSec: int64(minServiceDuration.Seconds()),
		ServiceDurationMaxSec: int64(maxServiceDuration.Seconds()),
	})
	if err != nil {
		t.Fatal(err)
	}

	openHoursSchedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	openHoursScheduleDays, err := queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
		ServiceRegionOpenHoursScheduleIds: []int64{openHoursSchedule.ID},
		DaysOfWeek:                        []int32{int32(serviceDate.Weekday())},
		StartTimes:                        []time.Time{startDayTime},
		EndTimes:                          []time.Time{endDayTime},
	})
	if err != nil {
		t.Fatal(err)
	}

	addParams := logisticssql.AddOptimizerRunParams{
		ServiceRegionID:            serviceRegionID,
		ServiceDate:                serviceDate,
		OpenHoursScheduleDayID:     openHoursScheduleDays[0].ID,
		OpenHoursStartTimestampSec: openHoursScheduleDays[0].StartTime.Unix(),
		OpenHoursEndTimestampSec:   openHoursScheduleDays[0].EndTime.Unix(),
		SnapshotTimestamp:          now.Add(time.Minute),
		OptimizerRunType:           string(logisticsdb.FeasibilityCheckRunType),
	}

	_, err = queries.AddOptimizerRun(ctx, addParams)
	if err != nil {
		t.Fatal(err)
	}

	badDateAddParams := addParams
	badDateAddParams.ServiceDate = badServiceDate

	optimizerRunWithBadDate, err := queries.AddOptimizerRun(ctx, badDateAddParams)
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:            serviceRegionID,
		ServiceDate:                serviceDate,
		OpenHoursScheduleDayID:     openHoursScheduleDays[0].ID,
		OpenHoursStartTimestampSec: openHoursScheduleDays[0].StartTime.Unix(),
		OpenHoursEndTimestampSec:   openHoursScheduleDays[0].EndTime.Unix(),
		SnapshotTimestamp:          now.Add(-4 * time.Minute),
		OptimizerRunType:           string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	requiredAttributes := []*commonpb.Attribute{
		{
			Name: "a1",
		},
		{
			Name: "a2",
		},
	}
	preferredAttributes := []*commonpb.Attribute{
		{
			Name: "a3",
		},
		{
			Name: "a4",
		},
	}
	forbiddenAttributes := []*commonpb.Attribute{
		{
			Name: "a5",
		},
		{
			Name: "a6",
		},
	}
	unwantedAttributes := []*commonpb.Attribute{
		{
			Name: "a7",
		},
		{
			Name: "a8",
		},
	}

	_, err = queries.UpsertLocation(ctx, logisticssql.UpsertLocationParams{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	})
	if err != nil {
		t.Fatal(err)
	}
	loc, err := queries.GetLocation(ctx, logisticssql.GetLocationParams{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	})
	if err != nil {
		t.Fatal(err)
	}

	locID := loc.ID
	addStationMarket(ctx, t, queries, fakeID)
	writeTeamShiftSnapshot(ctx, t, &writeTeamShiftTeamSnapshotParams{
		stationMarketID: fakeID,
		shiftTeamID:     fakeID,
		ldb:             ldb,
	})
	visitSnapshot, err := ldb.WriteVisitSnapshot(ctx, fakeID, &episodepb.GetVisitResponse{
		CareRequest: &commonpb.CareRequestInfo{
			Id:       fakeID,
			MarketId: proto.Int64(fakeID),
			Location: protoconv.LocationToCommonLocation(loc),
			ArrivalTimeWindow: &commonpb.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&arrivalTWStart),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&arrivalTWEnd),
			},
			ServiceDurationSec:  &serviceDurationSec,
			RequiredAttributes:  requiredAttributes,
			PreferredAttributes: preferredAttributes,
			ForbiddenAttributes: forbiddenAttributes,
			UnwantedAttributes:  unwantedAttributes,
			RequestStatus: &commonpb.CareRequestStatus{
				UserId:       proto.Int64(time.Now().UnixNano()),
				Name:         proto.String("accepted"),
				SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER.Enum(),
				CreatedAtSec: proto.Int64(time.Now().Unix()),
				ShiftTeamId:  &fakeID,
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	lastOptimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:            serviceRegionID,
		ServiceDate:                serviceDate,
		OpenHoursScheduleDayID:     openHoursScheduleDays[0].ID,
		OpenHoursStartTimestampSec: openHoursScheduleDays[0].StartTime.Unix(),
		OpenHoursEndTimestampSec:   openHoursScheduleDays[0].EndTime.Unix(),
		SnapshotTimestamp:          visitSnapshot.CreatedAt,
		OptimizerRunType:           string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	latestSchedule, err := queries.AddSchedule(ctx,
		logisticssql.AddScheduleParams{
			ServiceRegionID: serviceRegionID,
			OptimizerRunID:  lastOptimizerRun.ID,
		},
	)
	if err != nil {
		t.Fatal(err)
	}

	err = ldb.WriteScheduleStats(ctx, latestSchedule.ID, &optimizerpb.VRPStats{
		DriveDurationSec:    proto.Int64(111),
		DriveDistanceMeters: proto.Int64(222),
		ServiceDurationSec:  proto.Int64(333),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Desc            string
		CareRequestID   sql.NullInt64
		OptimizerRunID  sql.NullInt64
		ServiceDate     sql.NullTime
		BestScheduleID  sql.NullInt64
		RemoveArrivalTW bool
		ShouldErr       bool
	}{
		{
			Desc:          "base case valid data",
			CareRequestID: sqltypes.ToValidNullInt64(fakeID + 1),
		},
		{
			Desc:           "invalid optimizer run id",
			CareRequestID:  sqltypes.ToValidNullInt64(fakeID + 2),
			OptimizerRunID: sqltypes.ToValidNullInt64(-2),
			ShouldErr:      true,
		},
		{
			Desc:           "Invalid service date data",
			CareRequestID:  sqltypes.ToValidNullInt64(fakeID + 2),
			ServiceDate:    sql.NullTime{Valid: true, Time: badServiceDate},
			OptimizerRunID: sqltypes.ToValidNullInt64(optimizerRunWithBadDate.ID),
			ShouldErr:      true,
		},
		{
			Desc:           "Invalid best schedule",
			CareRequestID:  sqltypes.ToValidNullInt64(fakeID + 3),
			BestScheduleID: sqltypes.ToValidNullInt64(latestSchedule.ID + 3),
			ShouldErr:      true,
		},
		{
			Desc:            "No Arrival Time Window",
			CareRequestID:   sqltypes.ToValidNullInt64(fakeID + 4),
			RemoveArrivalTW: true,
			ShouldErr:       true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			cfQuery := logisticssql.CheckFeasibilityQuery{
				CareRequestID:                      sqltypes.ToValidNullInt64(fakeID + 1),
				ServiceRegionID:                    sqltypes.ToNullInt64(&serviceRegionID),
				LocationID:                         sqltypes.ToNullInt64(&locID),
				ServiceDate:                        sql.NullTime{Valid: true, Time: serviceDate},
				ArrivalTimeWindowStartTimestampSec: sqltypes.ToNullInt64(&arrivalTWStartTimestampSec),
				ArrivalTimeWindowEndTimestampSec:   sqltypes.ToNullInt64(&arrivalTWEndTimestampSec),
				ServiceDurationSec:                 sqltypes.ToNullInt64(&serviceDurationSec),
				OptimizerRunID:                     sqltypes.ToNullInt64(&lastOptimizerRun.ID),
				BestScheduleID:                     sqltypes.ToNullInt64(&latestSchedule.ID),
				BestScheduleIsFeasible:             sql.NullBool{Valid: true, Bool: true},
			}

			if tc.OptimizerRunID.Valid {
				cfQuery.OptimizerRunID = tc.OptimizerRunID
			}

			if tc.ServiceDate.Valid {
				cfQuery.ServiceDate = tc.ServiceDate
			}

			if tc.BestScheduleID.Valid {
				cfQuery.BestScheduleID = tc.BestScheduleID
			}

			if tc.RemoveArrivalTW {
				cfQuery.ArrivalTimeWindowStartTimestampSec = sql.NullInt64{}
				cfQuery.ArrivalTimeWindowEndTimestampSec = sql.NullInt64{}
			}

			_, err = ldb.AddCheckFeasibilityQuery(ctx, logisticsdb.CheckFeasibilityQueryParams{
				CareRequestID:                      cfQuery.CareRequestID.Int64,
				ServiceRegionID:                    cfQuery.ServiceRegionID.Int64,
				ServiceDate:                        cfQuery.ServiceDate.Time,
				LatitudeE6:                         latitudeE6,
				LongitudeE6:                        longitudeE6,
				ArrivalTimeWindowStartTimestampSec: cfQuery.ArrivalTimeWindowStartTimestampSec.Int64,
				ArrivalTimeWindowEndTimestampSec:   cfQuery.ArrivalTimeWindowEndTimestampSec.Int64,
				ServiceDurationSec:                 cfQuery.ServiceDurationSec.Int64,
				OptimizerRunID:                     cfQuery.OptimizerRunID.Int64,
				BestScheduleID:                     cfQuery.BestScheduleID.Int64,
				BestScheduleIsFeasible:             cfQuery.BestScheduleIsFeasible.Bool,
				RequiredAttributes:                 requiredAttributes,
				PreferredAttributes:                preferredAttributes,
				ForbiddenAttributes:                forbiddenAttributes,
				UnwantedAttributes:                 unwantedAttributes,
			})

			history, err := ldb.GetCheckFeasibilityCareRequestHistory(ctx, cfQuery.CareRequestID.Int64)
			if err != nil {
				t.Fatal(err)
			}

			if history[0].Error != nil {
				if !tc.ShouldErr {
					t.Fatalf("expected error")
				}
				return
			}
			testutils.MustMatch(t, locID, *history[0].Problem.Description.Visits[0].LocationId, "values don't match")
			testutils.MustMatch(t, requiredAttributes[0].Name, history[0].Problem.Description.Visits[0].RequiredAttributes[0].Id, "values don't match")
		})
	}
}

func TestLDB_GetCheckFeasibilityQueriesForCareRequest(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())
	now := time.Now()
	fakeID := now.UnixNano()
	srID := 100 + fakeID
	arrivalTWStartTimestampSec := now.UnixNano()
	arrivalTWEndTimestampSec := arrivalTWStartTimestampSec + 3000
	serviceDurationSec := int64(500)
	optimizerRunID := int64(1)
	bestScheduleID := int64(123)
	latitudeE6 := int32(921)
	longitudeE6 := int32(921)
	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)

	requiredAttributes := []*commonpb.Attribute{
		{
			Name: "a1",
		},
		{
			Name: "a2",
		},
	}
	preferredAttributes := []*commonpb.Attribute{
		{
			Name: "a3",
		},
		{
			Name: "a4",
		},
	}
	forbiddenAttributes := []*commonpb.Attribute{
		{
			Name: "a5",
		},
		{
			Name: "a6",
		},
	}
	unwantedAttributes := []*commonpb.Attribute{
		{
			Name: "a7",
		},
		{
			Name: "a8",
		},
	}

	_, err := queries.UpsertLocation(ctx, logisticssql.UpsertLocationParams{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	})
	if err != nil {
		t.Fatal(err)
	}
	loc, err := queries.GetLocation(ctx, logisticssql.GetLocationParams{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	})
	if err != nil {
		t.Fatal(err)
	}

	locID := loc.ID
	cfQuery := logisticssql.CheckFeasibilityQuery{
		CareRequestID:                      sqltypes.ToNullInt64(&fakeID),
		ServiceRegionID:                    sqltypes.ToNullInt64(&srID),
		LocationID:                         sqltypes.ToNullInt64(&locID),
		ServiceDate:                        sql.NullTime{Valid: true, Time: serviceDate},
		ArrivalTimeWindowStartTimestampSec: sqltypes.ToNullInt64(&arrivalTWStartTimestampSec),
		ArrivalTimeWindowEndTimestampSec:   sqltypes.ToNullInt64(&arrivalTWEndTimestampSec),
		ServiceDurationSec:                 sqltypes.ToNullInt64(&serviceDurationSec),
		OptimizerRunID:                     sqltypes.ToNullInt64(&optimizerRunID),
		BestScheduleID:                     sqltypes.ToNullInt64(&bestScheduleID),
		BestScheduleIsFeasible:             sql.NullBool{Valid: true, Bool: true},
		ResponseStatus:                     sql.NullString{Valid: true, String: logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE.String()},
	}

	_, err = ldb.AddCheckFeasibilityQuery(ctx, logisticsdb.CheckFeasibilityQueryParams{
		CareRequestID:                      cfQuery.CareRequestID.Int64,
		ServiceRegionID:                    cfQuery.ServiceRegionID.Int64,
		ServiceDate:                        cfQuery.ServiceDate.Time,
		LatitudeE6:                         latitudeE6,
		LongitudeE6:                        longitudeE6,
		ArrivalTimeWindowStartTimestampSec: cfQuery.ArrivalTimeWindowStartTimestampSec.Int64,
		ArrivalTimeWindowEndTimestampSec:   cfQuery.ArrivalTimeWindowEndTimestampSec.Int64,
		ServiceDurationSec:                 cfQuery.ServiceDurationSec.Int64,
		OptimizerRunID:                     cfQuery.OptimizerRunID.Int64,
		BestScheduleID:                     cfQuery.BestScheduleID.Int64,
		BestScheduleIsFeasible:             cfQuery.BestScheduleIsFeasible.Bool,
		RequiredAttributes:                 requiredAttributes,
		PreferredAttributes:                preferredAttributes,
		ForbiddenAttributes:                forbiddenAttributes,
		UnwantedAttributes:                 unwantedAttributes,
		ResponseStatus:                     cfQuery.ResponseStatus.String,
	})
	if err != nil {
		t.Fatal(err)
	}

	var wantAttributes []*logisticsdb.CheckFeasibilityQueryAttribute
	for _, attr := range requiredAttributes {
		wantAttributes = append(wantAttributes, &logisticsdb.CheckFeasibilityQueryAttribute{
			Name:       attr.Name,
			IsRequired: true,
		})
	}
	for _, attr := range forbiddenAttributes {
		wantAttributes = append(wantAttributes, &logisticsdb.CheckFeasibilityQueryAttribute{
			Name:        attr.Name,
			IsForbidden: true,
		})
	}
	for _, attr := range preferredAttributes {
		wantAttributes = append(wantAttributes, &logisticsdb.CheckFeasibilityQueryAttribute{
			Name:        attr.Name,
			IsPreferred: true,
		})
	}
	for _, attr := range unwantedAttributes {
		wantAttributes = append(wantAttributes, &logisticsdb.CheckFeasibilityQueryAttribute{
			Name:       attr.Name,
			IsUnwanted: true,
		})
	}

	serviceDurationSec2 := serviceDurationSec + 2000
	optimizerRunID2 := optimizerRunID + 2000
	bestScheduleID2 := bestScheduleID + 2000

	cfQuery2 := logisticssql.CheckFeasibilityQuery{
		CareRequestID:                      sqltypes.ToNullInt64(&fakeID),
		ServiceRegionID:                    sqltypes.ToNullInt64(&srID),
		LocationID:                         sqltypes.ToNullInt64(&locID),
		ServiceDate:                        sql.NullTime{Valid: true, Time: serviceDate},
		ArrivalTimeWindowStartTimestampSec: sqltypes.ToNullInt64(&arrivalTWStartTimestampSec),
		ArrivalTimeWindowEndTimestampSec:   sqltypes.ToNullInt64(&arrivalTWEndTimestampSec),
		ServiceDurationSec:                 sqltypes.ToNullInt64(&serviceDurationSec2),
		OptimizerRunID:                     sqltypes.ToNullInt64(&optimizerRunID2),
		BestScheduleID:                     sqltypes.ToNullInt64(&bestScheduleID2),
		BestScheduleIsFeasible:             sql.NullBool{Valid: true, Bool: false},
		ResponseStatus:                     sql.NullString{Valid: true, String: logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED.String()},
	}

	_, err = ldb.AddCheckFeasibilityQuery(ctx, logisticsdb.CheckFeasibilityQueryParams{
		CareRequestID:                      cfQuery2.CareRequestID.Int64,
		ServiceRegionID:                    cfQuery2.ServiceRegionID.Int64,
		ServiceDate:                        cfQuery2.ServiceDate.Time,
		LatitudeE6:                         latitudeE6,
		LongitudeE6:                        longitudeE6,
		ArrivalTimeWindowStartTimestampSec: cfQuery2.ArrivalTimeWindowStartTimestampSec.Int64,
		ArrivalTimeWindowEndTimestampSec:   cfQuery2.ArrivalTimeWindowEndTimestampSec.Int64,
		ServiceDurationSec:                 cfQuery2.ServiceDurationSec.Int64,
		OptimizerRunID:                     cfQuery2.OptimizerRunID.Int64,
		BestScheduleID:                     cfQuery2.BestScheduleID.Int64,
		BestScheduleIsFeasible:             cfQuery2.BestScheduleIsFeasible.Bool,
		RequiredAttributes:                 requiredAttributes,
		PreferredAttributes:                preferredAttributes,
		ForbiddenAttributes:                forbiddenAttributes,
		UnwantedAttributes:                 unwantedAttributes,
		ResponseStatus:                     cfQuery2.ResponseStatus.String,
	})
	if err != nil {
		t.Fatal(err)
	}

	gotCfqData, err := ldb.GetCheckFeasibilityQueriesForCareRequest(ctx, cfQuery.CareRequestID.Int64)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchFn(".ID", ".CreatedAt")(t, &cfQuery2, gotCfqData[0].CheckFeasibilityQuery, "values don't match")
	testutils.MustMatchFn(".ID", ".CreatedAt")(t, &cfQuery, gotCfqData[1].CheckFeasibilityQuery, "values don't match")
	testutils.MustMatch(t, wantAttributes, gotCfqData[1].Attributes, "values don't match")
}

func TestLogisticsDB_GetAssignableVisitsForDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	tz, err := time.LoadLocation("America/Denver")
	if err != nil {
		t.Fatal(err)
	}

	startTime := time.Date(2022, time.August, 1, 8, 0, 0, 0, tz)
	endTime := time.Date(2022, time.August, 1, 16, 0, 0, 0, tz)
	startTimeTomorrow := startTime.AddDate(0, 0, 1)
	endTimeTomorrow := endTime.AddDate(0, 0, 1)

	stationMarketID1 := time.Now().UnixNano()
	stationMarketID2 := stationMarketID1 + 1
	stationMarketIDs := []int64{stationMarketID1, stationMarketID2}
	for _, stationMarketID := range stationMarketIDs {
		err = ldb.UpsertMarketAndServiceRegionFromStationMarket(ctx, &marketpb.Market{
			Id:               stationMarketID,
			Enabled:          proto.Bool(true),
			ScheduleDays:     []*commonpb.ScheduleDay{},
			IanaTimeZoneName: proto.String(startTime.Location().String()),
			Name:             proto.String("assignable visit"),
			ShortName:        proto.String("assignable visit"),
		})
		if err != nil {
			t.Fatal(err)
		}

		serviceRegion, err := ldb.GetServiceRegionForStationMarketID(ctx, stationMarketID)
		if err != nil {
			t.Fatal(err)
		}

		schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
		if err != nil {
			t.Fatal(err)
		}

		_, err = queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
			ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID},
			DaysOfWeek:                        []int32{int32(startTime.Weekday())},
			StartTimes:                        []time.Time{startTime},
			EndTimes:                          []time.Time{endTime},
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	type visit struct {
		marketID                     int64
		timeWindow                   timeWindow
		phaseTypeShortName           logisticsdb.VisitPhaseShortName
		virtualAPPPhaseTypeShortName logisticsdb.VirtualAPPVisitPhaseShortName
	}

	tcs := []struct {
		Desc string

		Date                  time.Time
		StationMarketIDs      []int64
		VisitPhases           []logisticspb.VisitPhase
		VirtualAPPVisitPhases []logisticspb.VirtualAPPVisitPhase
		Visits                []visit

		NumAssignableVisits int
	}{
		{
			Desc:             "get visits en_route or on_scene and virtual unassigned within time window",
			Date:             startTime,
			StationMarketIDs: stationMarketIDs,
			VisitPhases: []logisticspb.VisitPhase{
				logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
				logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
			},
			VirtualAPPVisitPhases: []logisticspb.VirtualAPPVisitPhase{
				logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED,
			},
			Visits: []visit{
				{
					marketID:                     stationMarketID1,
					timeWindow:                   timeWindow{startTime, endTime},
					phaseTypeShortName:           logisticsdb.VisitPhaseTypeShortNameEnRoute,
					virtualAPPPhaseTypeShortName: logisticsdb.VirtualAPPVisitPhaseTypeShortNameUnassigned,
				},
				{
					marketID:                     stationMarketID1,
					timeWindow:                   timeWindow{startTime, endTime},
					phaseTypeShortName:           logisticsdb.VisitPhaseTypeShortNameOnScene,
					virtualAPPPhaseTypeShortName: logisticsdb.VirtualAPPVisitPhaseTypeShortNameUnassigned,
				},
				{
					marketID:                     stationMarketID2,
					timeWindow:                   timeWindow{startTime, endTime},
					phaseTypeShortName:           logisticsdb.VisitPhaseTypeShortNameCompleted,
					virtualAPPPhaseTypeShortName: logisticsdb.VirtualAPPVisitPhaseTypeShortNameUnassigned,
				},
				{
					marketID:                     stationMarketID2,
					timeWindow:                   timeWindow{startTime, endTime},
					phaseTypeShortName:           logisticsdb.VisitPhaseTypeShortNameOnScene,
					virtualAPPPhaseTypeShortName: logisticsdb.VirtualAPPVisitPhaseTypeShortNameAssigned,
				},
				{
					marketID:                     stationMarketID2,
					timeWindow:                   timeWindow{startTimeTomorrow, endTimeTomorrow},
					phaseTypeShortName:           logisticsdb.VisitPhaseTypeShortNameEnRoute,
					virtualAPPPhaseTypeShortName: logisticsdb.VirtualAPPVisitPhaseTypeShortNameUnassigned,
				},
			},

			NumAssignableVisits: 2,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var snapshotTime time.Time
			for _, visit := range tc.Visits {
				careRequestID := time.Now().UnixNano()
				visitSnapshot := writeVisitSnapshotWithStartEnd(ctx, t, &writeVisitSnapshotParams{
					stationMarketID: visit.marketID,
					careReqID:       careRequestID,
					visitPhase:      visit.phaseTypeShortName,
					start:           visit.timeWindow.start,
					end:             visit.timeWindow.end,
					ldb:             ldb,
				})
				if err != nil {
					t.Fatal(err)
				}
				_, err = queries.AddVirtualAPPVisitPhaseSnapshot(ctx, logisticssql.AddVirtualAPPVisitPhaseSnapshotParams{
					VisitSnapshotID:            visitSnapshot.ID,
					VirtualAppVisitPhaseTypeID: logisticsdb.VirtualAAPPVisitPhaseShortNameToPhaseTypeID[visit.virtualAPPPhaseTypeShortName],
					VisitPhaseSourceTypeID:     logisticsdb.StatusSourceTypeToPhaseSourceTypeID[commonpb.StatusSourceType_STATUS_SOURCE_TYPE_PROVIDER],
					StationUserID:              sql.NullInt64{Valid: false},
					ShiftTeamID:                sql.NullInt64{Valid: false},
				})
				if err != nil {
					t.Fatal(err)
				}
				snapshotTime = visitSnapshot.CreatedAt
			}

			assignableVisits, err := ldb.GetAssignableVisitsForDate(ctx, logisticsdb.GetAssignableVisitsForDateParams{
				MarketIDs:             tc.StationMarketIDs,
				Date:                  tc.Date,
				LatestSnapshotTime:    snapshotTime,
				VisitPhases:           tc.VisitPhases,
				VirtualAPPVisitPhases: tc.VirtualAPPVisitPhases,
			})
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.NumAssignableVisits, len(assignableVisits), "wrong length of assignable visits")
		})
	}
}

func TestLogisticsDB_GetServiceRegionsForStationMarkets(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	badStationMarketID := int64(-1)

	serviceRegionWithOneMarket, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "region with one market",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}
	stationMarketIDWithOldVersions := time.Now().UnixNano()
	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegionWithOneMarket.ID,
		StationMarketID: stationMarketIDWithOldVersions,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegionWithOneMarket.ID,
		StationMarketID: stationMarketIDWithOldVersions,
	})
	if err != nil {
		t.Fatal(err)
	}

	serviceRegionWithMultiMarkets, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "region with multiple markets",
		IanaTimeZoneName: tzLoc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}
	marketForServiceRegionWithMultiMarkets1, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegionWithMultiMarkets.ID,
		StationMarketID: time.Now().UnixNano(),
	})
	if err != nil {
		t.Fatal(err)
	}
	marketForServiceRegionWithMultiMarkets2, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegionWithMultiMarkets.ID,
		StationMarketID: time.Now().UnixNano(),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Desc      string
		MarketIDs []int64

		ExpectedServiceRegions int
		HasErr                 bool
	}{
		{
			Desc:      "service region with a market with old versions",
			MarketIDs: []int64{stationMarketIDWithOldVersions},

			ExpectedServiceRegions: 1,
			HasErr:                 false,
		},
		{
			Desc:      "service region with multiple markets",
			MarketIDs: []int64{marketForServiceRegionWithMultiMarkets1.StationMarketID, marketForServiceRegionWithMultiMarkets2.StationMarketID},

			ExpectedServiceRegions: 1,
			HasErr:                 false,
		},
		{
			Desc:      "bad market",
			MarketIDs: []int64{stationMarketIDWithOldVersions, badStationMarketID},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			serviceRegions, err := ldb.GetServiceRegionsForStationMarkets(ctx, tc.MarketIDs)
			if err != nil && !tc.HasErr {
				t.Fatal(err)
			}
			if tc.HasErr {
				return
			}
			testutils.MustMatch(t, tc.ExpectedServiceRegions, len(serviceRegions), "expected service regions don't match")
		})
	}
}

func TestLogisticsDB_VisitArrivalTimestampsForSchedule(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(
		db,
		nil,
		noSettingsService,
		monitoring.NewMockScope(),
	)

	scheduleID := time.Now().UnixNano()

	want := map[int64]time.Time{}

	for i := 0; i < 5; i++ {
		visitSnapshotID := time.Now().UnixNano()
		arrivalTimestamp := time.Now().
			UTC().
			Truncate(time.Second).
			Add(time.Duration(i) * time.Minute)

		testutils.MustFn(t)(queries.
			AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
				ScheduleID:          scheduleID,
				VisitSnapshotID:     sqltypes.ToValidNullInt64(visitSnapshotID),
				ArrivalTimestampSec: arrivalTimestamp.Unix(),
			}))

		want[visitSnapshotID] = arrivalTimestamp
	}

	got, err := ldb.VisitArrivalTimestampsForSchedule(context.Background(), scheduleID)

	testutils.MustMatch(t, nil, err)
	testutils.MustMatch(t, want, got)
}

func TestLogisticsDB_UpsertConstraintConfigs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	now := time.Now()

	cc := &optimizerpb.VRPConstraintConfig{
		OpportunityCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig{
			Policy: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_IdleTimePolicy_{
				IdleTimePolicy: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_IdleTimePolicy{
					CycleTimeCutoffMinutes: uint64(now.Nanosecond()),
				},
			},
		},
		WorkDistribution: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{},
	}

	dbconfig, err := logisticsdb.UpsertConstraintConfig(ctx, queries, cc)
	if err != nil {
		t.Fatal(err)
	}

	cc2, err := ldb.GetConstraintConfig(ctx, dbconfig.ID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchProto(t, cc, cc2, "Roundtrip of constraint config does not match")

	dbconfig2, err := logisticsdb.UpsertConstraintConfig(ctx, queries, cc)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, dbconfig, dbconfig2, "First upserted config should be returned if already in DB")
}

func TestLogisticsDB_AddOptimizerRun(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	now := time.Now()

	cc := &optimizerpb.VRPConstraintConfig{
		OpportunityCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig{
			Policy: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_IdleTimePolicy_{
				IdleTimePolicy: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_IdleTimePolicy{
					CycleTimeCutoffMinutes: uint64(now.Nanosecond()),
				},
			},
		},
		WorkDistribution: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{},
	}

	optimizerSettings := &optimizersettings.Settings{
		Description:                "Test optimizer settings",
		VisitExtraSetupDurationSec: 60,
		UseOSRMMapService:          true,
	}

	run, err := ldb.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	}, cc, optimizerSettings)
	if err != nil {
		t.Fatal(err)
	}

	cc2, err := ldb.GetConstraintConfig(ctx, run.OptimizerConstraintConfigID.Int64)
	if err != nil {
		t.Fatal(err)
	}

	oss, err := ldb.GetOptimizerSettingsByID(ctx, run.OptimizerSettingsID.Int64)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchProto(t, cc, cc2)
	testutils.MustMatch(t, optimizerSettings, oss)
}

func TestLogisticsDB_UpsertOptimizerSettingsWithNewSettings(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	settings := &optimizersettings.Settings{
		Description: fmt.Sprintf("Dummy Settings %v", time.Now()),
	}

	insertedOptimizerSettings, err := logisticsdb.UpsertOptimizerSettings(ctx, queries, settings)
	if err != nil {
		t.Fatal(err)
	}

	// Should get the existing settings instead of inserting a new one.
	existingSettings, err := logisticsdb.UpsertOptimizerSettings(ctx, queries, settings)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, insertedOptimizerSettings, existingSettings)
}

func TestLogisticsDB_GetOptimizerSettingsByIdFailsWithInvalidId(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	_, err := ldb.GetOptimizerSettingsByID(ctx, -1)

	if err == nil {
		t.Fatal("error was expected")
	}

	testutils.MustMatch(t, err.Error(), "no rows in result set")
}

func TestLogisticsDB_ServiceRegionAvailability(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "test",
		IanaTimeZoneName: "America/Denver",
	})
	if err != nil {
		t.Fatal(err)
	}

	marketID := time.Now().UnixNano()
	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: marketID,
		ShortName:       "test",
	})
	if err != nil {
		t.Fatal(err)
	}

	baseValue := int32(time.Now().UnixNano())
	location, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  baseValue,
		LongitudeE6: baseValue,
	})
	if err != nil {
		t.Fatal(err)
	}

	set, err := queries.AddServiceRegionCanonicalLocationSet(ctx, serviceRegion.ID)
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddServiceRegionCanonicalLocations(ctx, logisticssql.AddServiceRegionCanonicalLocationsParams{
		ServiceRegionCanonicalLocationSetID: set.ID,
		LocationsIds:                        []int64{location.ID},
	})
	if err != nil {
		t.Fatal(err)
	}

	serviceDate := time.Date(2023, time.October, 31, 0, 0, 0, 0, time.UTC)
	tcs := []struct {
		Desc            string
		ServiceRegionID int64
		HorizonDays     int64
		Cases           []struct {
			ServiceDate      time.Time
			AssignedVisits   int
			UnassignedVisits int
		}

		ExpectedResults int
	}{
		{
			Desc:            "2 horizon days",
			HorizonDays:     2,
			ServiceRegionID: serviceRegion.ID,
			Cases: []struct {
				ServiceDate      time.Time
				AssignedVisits   int
				UnassignedVisits int
			}{
				{
					ServiceDate:      serviceDate,
					AssignedVisits:   4,
					UnassignedVisits: 0,
				},
				{
					ServiceDate:      serviceDate.AddDate(0, 0, 1),
					AssignedVisits:   2,
					UnassignedVisits: 2,
				},
			},
			ExpectedResults: 2,
		},
		{
			Desc:            "3 horizon days",
			ServiceRegionID: serviceRegion.ID,
			HorizonDays:     3,
			Cases: []struct {
				ServiceDate      time.Time
				AssignedVisits   int
				UnassignedVisits int
			}{
				{
					ServiceDate:      serviceDate,
					AssignedVisits:   4,
					UnassignedVisits: 0,
				},
				{
					ServiceDate:      serviceDate.AddDate(0, 0, 1),
					AssignedVisits:   2,
					UnassignedVisits: 2,
				},
				{
					ServiceDate:      serviceDate.AddDate(0, 0, 2),
					AssignedVisits:   3,
					UnassignedVisits: 1,
				},
			},
			ExpectedResults: 3,
		},
		{
			Desc:            "no data in db returns empty responses",
			HorizonDays:     5,
			ServiceRegionID: serviceRegion.ID,
			Cases: []struct {
				ServiceDate      time.Time
				AssignedVisits   int
				UnassignedVisits int
			}{},
			ExpectedResults: 5,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			snapshotTime := time.Now()
			for _, c := range tc.Cases {
				snapshotTime = setupAvailabilityData(ctx, t, queries, setupAvailabilityParams{
					ServiceRegionID:  tc.ServiceRegionID,
					ServiceDate:      c.ServiceDate,
					UnassignedVisits: c.UnassignedVisits,
					AssignedVisits:   c.AssignedVisits,
				})
			}

			ldb := logisticsdb.NewLogisticsDB(db, nil,
				&optimizersettings.MockSettingsService{RegionSettings: &optimizersettings.Settings{
					OptimizeHorizonDays: tc.HorizonDays,
				}}, monitoring.NewMockScope())

			availability, err := ldb.ServiceRegionAvailability(ctx, logisticsdb.ServiceRegionAvailabilityParams{
				StationMarketID:   marketID,
				ServiceDate:       serviceDate,
				IncludeAttributes: true,
				SnapshotTime:      snapshotTime,
			})
			if err != nil {
				t.Fatal(err)
			}

			availabilityResults := availability.Results
			testutils.MustMatch(t, tc.ExpectedResults, len(availabilityResults), "the result not match the Expected Results")
			if len(tc.Cases) == 0 {
				return
			}
			for i, result := range availabilityResults {
				expected := tc.Cases[i]

				testutils.MustMatch(t, expected.AssignedVisits, len(result.AssignedVisits), "the expected assigned visits does not match")
				testutils.MustMatch(t, expected.UnassignedVisits, len(result.UnassignedVisits), "the expected unassigned visits does not match")
			}
		})
	}
}

type setupAvailabilityParams struct {
	ServiceRegionID int64

	AssignedVisits   int
	UnassignedVisits int

	ServiceDate time.Time
}

func setupAvailabilityData(
	ctx context.Context,
	t *testing.T,
	queries *logisticssql.Queries,
	params setupAvailabilityParams,
) time.Time {
	t.Helper()

	baseID := time.Now().UnixNano()
	attributes, err := queries.UpsertAttributes(ctx, []string{fmt.Sprintf("attribute-%v", baseID)})
	if err != nil {
		t.Fatal(err)
	}

	visitCount := params.UnassignedVisits + params.AssignedVisits
	now := time.Now()
	visitIDs := make([]int64, visitCount)
	arrivalTimes := make([]time.Time, visitCount)
	locationIDs := make([]int64, visitCount)
	attributeIDs := make([]int64, visitCount)
	serviceDurationsSec := make([]int64, visitCount)
	isRequireds := make([]bool, visitCount)
	isOthers := make([]bool, visitCount)
	for i := 0; i < visitCount; i++ {
		visitIDs[i] = baseID + int64(i)
		arrivalTimes[i] = now
		locationIDs[i] = baseID + int64(i)
		attributeIDs[i] = attributes[0].ID
		serviceDurationsSec[i] = baseID + int64(i)
		isRequireds[i] = true
		isOthers[i] = false
	}

	visits, err := queries.AddServiceRegionAvailabilityVisits(ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
		ServiceRegionAvailabilityVisitSetIds: visitIDs,
		ArrivalStartTimes:                    arrivalTimes,
		ArrivalEndTimes:                      arrivalTimes,
		LocationIds:                          locationIDs,
		ServiceDurationsSec:                  serviceDurationsSec,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddServiceRegionAvailabilityVisitAttributes(ctx, logisticssql.AddServiceRegionAvailabilityVisitAttributesParams{
		ServiceRegionAvailabilityVisitIds: visitIDs,
		AttributeIds:                      attributeIDs,
		IsRequireds:                       isRequireds,
		IsUnwanteds:                       isOthers,
		IsForbiddens:                      isOthers,
		IsPreferreds:                      isOthers,
	})
	if err != nil {
		t.Fatal(err)
	}

	unassignedVisitIDs := make([]int64, params.UnassignedVisits)
	for i := 0; i < params.UnassignedVisits; i++ {
		unassignedVisitIDs[i] = visits[i].ID
	}

	serviceDate := params.ServiceDate
	serviceRegionID := params.ServiceRegionID
	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionAvailabilityRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegionID,
		OptimizerRunID:  optimizerRun.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddUnassignedScheduleVisitsToSchedule(ctx, logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
		ScheduleID:                        schedule.ID,
		ServiceRegionAvailabilityVisitIds: unassignedVisitIDs,
	})
	if err != nil {
		t.Fatal(err)
	}

	visitOffset := params.UnassignedVisits

	snapshotTime := time.Now()
	for i := 0; i < params.AssignedVisits; i++ {
		scheduleVisit, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
			ScheduleID:                       schedule.ID,
			ArrivalTimestampSec:              0,
			ScheduleRouteID:                  baseID,
			ServiceRegionAvailabilityVisitID: sqltypes.ToValidNullInt64(visits[visitOffset+i].ID),
		})
		if err != nil {
			t.Fatal(err)
		}

		snapshotTime = scheduleVisit.CreatedAt
	}

	return snapshotTime
}

func ensureAttrsForCombinations(
	ctx context.Context,
	t *testing.T,
	queries *logisticssql.Queries,
	numCombinations int,
	totalAttrsNumPerCombination int,
) ([][]int64, error) {
	t.Helper()

	var attrCombinations [][]*logisticssql.Attribute
	attrNum := time.Now().UnixNano()
	for j := 0; j < numCombinations; j++ {
		var attrNames []string
		for k := 0; k < totalAttrsNumPerCombination; k++ {
			attrNum++
			attrNames = append(attrNames, fmt.Sprintf("avail attr %v", attrNum))
		}
		attrs, err := queries.UpsertAttributes(ctx, attrNames)
		if err != nil {
			return nil, err
		}
		attrCombinations = append(attrCombinations, attrs)
	}

	var attrIDsCombinations [][]int64
	for _, attrCombination := range attrCombinations {
		var combination []int64
		for _, attr := range attrCombination {
			combination = append(combination, attr.ID)
		}
		attrIDsCombinations = append(attrIDsCombinations, combination)
	}

	return attrIDsCombinations, nil
}

func TestLogisticsDB_AddServiceRegionAvailabilityVisitsTransactionally(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	serviceRegionID := time.Now().UnixNano()
	now := time.Now()
	openHoursDay := &logisticssql.ServiceRegionOpenHoursScheduleDay{
		StartTime: now,
		EndTime:   now.Add(time.Hour),
	}
	locIDs := []int64{int64(1), int64(2)}

	numCombinations := 9
	totalAttrsNumPerCombination := 2
	attrIDsCombinations, err := ensureAttrsForCombinations(ctx, t, queries, numCombinations, totalAttrsNumPerCombination)
	if err != nil {
		t.Fatal(err)
	}
	minServiceDuration := 1 * time.Second
	maxServiceDuration := 2 * time.Second
	visitDurations := make(logisticsdb.VisitServiceDurations)
	visitDurations[logisticsdb.MinVisitServiceDurationKey] = minServiceDuration
	visitDurations[logisticsdb.MaxVisitServiceDurationKey] = maxServiceDuration

	txParams := &logisticsdb.AddServiceRegionAvailabilityVisitsTransactionallyParams{
		ServiceRegionID:       serviceRegionID,
		OpenHoursDay:          openHoursDay,
		LocIDs:                locIDs,
		AttrIDsCombinations:   attrIDsCombinations,
		VisitServiceDurations: visitDurations,
	}
	gotVisits, gotAttrs, err := ldb.AddServiceRegionAvailabilityVisitsTransactionally(ctx, txParams)
	if err != nil {
		t.Fatal(err)
	}

	expectedVisits, err := queries.GetLatestAvailabilityVisitsInRegion(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}
	var expectedVisitIDs []int64
	for _, v := range expectedVisits {
		expectedVisitIDs = append(expectedVisitIDs, v.ID)
	}

	expectedAttrs, err := queries.GetServiceRegionAvailabilityVisitAttributes(ctx, expectedVisitIDs)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, len(expectedVisits), len(locIDs)*len(attrIDsCombinations)*len(visitDurations), "visits count doesn't match")
	testutils.MustMatch(t, len(expectedVisits), len(gotVisits), "visits doesn't match")
	testutils.MustMatch(t, len(expectedAttrs), len(gotAttrs), "visits attributes don't match")
}

func TestLogisticsDB_GetAvailabilityAttributesByVisitID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	now := time.Now()
	attributes, err := queries.UpsertAttributes(ctx, []string{
		fmt.Sprintf("attribute-%v", now.UnixNano()),
	})
	if err != nil {
		t.Fatal(err)
	}

	serviceRegionID := int64(999)
	set, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	visitCount := 2
	setIDs := make([]int64, visitCount)
	arrivalTimes := make([]time.Time, visitCount)
	locationIDs := make([]int64, visitCount)
	serviceDurationsSec := make([]int64, visitCount)

	attributeIDs := make([]int64, visitCount)
	isRequireds := make([]bool, visitCount)
	isOthers := make([]bool, visitCount)
	for i := 0; i < visitCount; i++ {
		setIDs[i] = set.ID
		arrivalTimes[i] = now
		locationIDs[i] = int64(i)
		serviceDurationsSec[i] = int64(i)

		attributeIDs[i] = attributes[0].ID
		isRequireds[i] = true
		isOthers[i] = false
	}

	visits, err := queries.AddServiceRegionAvailabilityVisits(ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
		ServiceRegionAvailabilityVisitSetIds: setIDs,
		ArrivalStartTimes:                    arrivalTimes,
		ArrivalEndTimes:                      arrivalTimes,
		LocationIds:                          locationIDs,
		ServiceDurationsSec:                  serviceDurationsSec,
	})
	if err != nil {
		t.Fatal(err)
	}
	var visitIDs []int64
	for _, v := range visits {
		visitIDs = append(visitIDs, v.ID)
	}

	_, err = queries.AddServiceRegionAvailabilityVisitAttributes(ctx, logisticssql.AddServiceRegionAvailabilityVisitAttributesParams{
		ServiceRegionAvailabilityVisitIds: visitIDs,
		AttributeIds:                      attributeIDs,
		IsRequireds:                       isRequireds,
		IsUnwanteds:                       isOthers,
		IsForbiddens:                      isOthers,
		IsPreferreds:                      isOthers,
	})
	if err != nil {
		t.Fatal(err)
	}

	attrMapByVisitID, err := ldb.GetAvailabilityAttributesByVisitID(ctx, visitIDs)
	if err != nil {
		t.Fatal(err)
	}
	emptyAttrMapByVisitID, err := ldb.GetAvailabilityAttributesByVisitID(ctx, []int64{99999})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, len(attrMapByVisitID), visitCount, "total num of visits don't match")
	testutils.MustMatch(t, len(emptyAttrMapByVisitID), 0, "should be an empty map")
}

func TestLogisticsDB_HasAnyNewScheduleSinceLastAvailabilityRun(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	serviceRegionID := time.Now().UnixNano()
	serviceDate := time.Date(2023, time.October, 31, 0, 0, 0, 0, time.UTC)
	var snapshotTime = time.Now().Truncate(time.Second)

	result, err := ldb.HasAnyNewScheduleSinceLastAvailabilityRun(ctx, logisticsdb.HasNewScheduleParams{
		ServiceRegionID:    serviceRegionID,
		ServiceDate:        serviceDate,
		LatestSnapShotTime: snapshotTime,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, false, result)

	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:   serviceRegionID,
		ServiceDate:       serviceDate,
		SnapshotTimestamp: snapshotTime,
		OptimizerRunType:  string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegionID,
		OptimizerRunID:  optimizerRun.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	result, err = ldb.HasAnyNewScheduleSinceLastAvailabilityRun(ctx, logisticsdb.HasNewScheduleParams{
		ServiceRegionID:    serviceRegionID,
		ServiceDate:        serviceDate,
		LatestSnapShotTime: schedule.CreatedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, true, result)

	optimizerRunAvailability, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:   serviceRegionID,
		ServiceDate:       serviceDate,
		SnapshotTimestamp: snapshotTime,
		OptimizerRunType:  string(logisticsdb.ServiceRegionAvailabilityRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	availabilitySchedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegionID,
		OptimizerRunID:  optimizerRunAvailability.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	result, err = ldb.HasAnyNewScheduleSinceLastAvailabilityRun(ctx, logisticsdb.HasNewScheduleParams{
		ServiceRegionID:    serviceRegionID,
		ServiceDate:        serviceDate,
		LatestSnapShotTime: availabilitySchedule.CreatedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, false, result)
}
