//go:build db_test

package logisticsdb_test

import (
	"testing"
	"time"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestGetLatestAvailabilityVisitsInRegion(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	tcs := []struct {
		Desc      string
		NumVisits int
		NumSets   int
	}{
		{
			Desc:      "Base case: 1 set x 1 visit",
			NumVisits: 1,
			NumSets:   1,
		},
		{
			Desc:      "Multiple visits: 1 set x 2 visits",
			NumVisits: 2,
			NumSets:   1,
		},
		{
			Desc:      "Multiple visits and sets: 4 sets x 4 visits",
			NumVisits: 4,
			NumSets:   4,
		},
	}

	baseServiceRegionID := time.Now().UnixNano()
	for index, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			serviceRegionID := baseServiceRegionID + int64(index)
			baseCoord := int32(serviceRegionID)
			for i := 0; i < tc.NumSets; i++ {
				serviceRegionAvailabilitySet, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, serviceRegionID)
				if err != nil {
					t.Fatal(err)
				}
				startTimes := make([]time.Time, 0, tc.NumVisits)
				endTimes := make([]time.Time, 0, tc.NumVisits)
				serviceRegionAvailabilitySetIds := make([]int64, 0, tc.NumVisits)
				locationIds := make([]int64, 0, tc.NumVisits)
				serviceDurationsSec := make([]int64, 0, tc.NumVisits)
				for j := 0; j < tc.NumVisits; j++ {
					startTimes = append(startTimes, time.Now())
					endTimes = append(endTimes, time.Now().Add(8*time.Hour))
					serviceRegionAvailabilitySetIds = append(serviceRegionAvailabilitySetIds, serviceRegionAvailabilitySet.ID)
					coord := baseCoord + int32((i+1)*tc.NumVisits+j)
					location, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
						LatitudeE6:  coord,
						LongitudeE6: coord,
					})
					if err != nil {
						t.Fatal(err)
					}
					locationIds = append(locationIds, location.ID)
					serviceDurationsSec = append(serviceDurationsSec, int64(j))
				}
				visits, err := queries.AddServiceRegionAvailabilityVisits(
					ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
						ArrivalStartTimes:                    startTimes,
						ArrivalEndTimes:                      endTimes,
						ServiceRegionAvailabilityVisitSetIds: serviceRegionAvailabilitySetIds,
						LocationIds:                          locationIds,
						ServiceDurationsSec:                  serviceDurationsSec,
					},
				)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, tc.NumVisits, len(visits))
			}

			availabilityVisits, err := queries.GetLatestAvailabilityVisitsInRegion(ctx, serviceRegionID)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.NumVisits, len(availabilityVisits))
		})
	}
}

func TestGetServiceRegionAvailabilityVisitAttributes(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	tcs := []struct {
		Desc      string
		NumVisits int
		NumAttrs  int
	}{
		{
			Desc:      "Base case 1 visit x 1 attr",
			NumVisits: 1,
			NumAttrs:  1,
		},
		{
			Desc:      "1 visits x 2 attrs",
			NumVisits: 1,
			NumAttrs:  2,
		},
		{
			Desc:      "4 visits x 1 attrs",
			NumVisits: 4,
			NumAttrs:  1,
		},
		{
			Desc:      "4 visits x 4 attrs",
			NumVisits: 4,
			NumAttrs:  4,
		},
	}

	baseServiceRegionID := time.Now().UnixNano()
	for index, tc := range tcs {
		serviceRegionID := baseServiceRegionID + int64(index)
		baseCoord := int32(serviceRegionID)
		serviceRegionAvailabilitySet, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, serviceRegionID)
		if err != nil {
			t.Fatal(err)
		}

		startTimes := make([]time.Time, 0, tc.NumVisits)
		endTimes := make([]time.Time, 0, tc.NumVisits)
		serviceRegionAvailabilitySetIds := make([]int64, 0, tc.NumVisits)
		locationIds := make([]int64, 0, tc.NumVisits)
		serviceDurationsSec := make([]int64, 0, tc.NumVisits)
		for i := 0; i < tc.NumVisits; i++ {
			startTimes = append(startTimes, time.Now())
			endTimes = append(endTimes, time.Now().Add(10*time.Hour))
			serviceRegionAvailabilitySetIds = append(serviceRegionAvailabilitySetIds, serviceRegionAvailabilitySet.ID)
			coord := baseCoord + int32((i+1)*tc.NumVisits+index)
			location, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
				LatitudeE6:  coord,
				LongitudeE6: coord,
			})
			if err != nil {
				t.Fatal(err)
			}
			locationIds = append(locationIds, location.ID)
			serviceDurationsSec = append(serviceDurationsSec, int64(i))
		}
		visits, err := queries.AddServiceRegionAvailabilityVisits(
			ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
				ArrivalStartTimes:                    startTimes,
				ArrivalEndTimes:                      endTimes,
				ServiceRegionAvailabilityVisitSetIds: serviceRegionAvailabilitySetIds,
				LocationIds:                          locationIds,
				ServiceDurationsSec:                  serviceDurationsSec,
			},
		)
		if err != nil {
			t.Fatal(err)
		}
		testutils.MustMatch(t, tc.NumVisits, len(visits))

		totalAttrsEntries := tc.NumAttrs * tc.NumVisits
		visitIds := make([]int64, 0, totalAttrsEntries)
		attrsIds := make([]int64, 0, totalAttrsEntries)
		flagsOn := make([]bool, 0, totalAttrsEntries)
		flagsOff := make([]bool, 0, totalAttrsEntries)
		for _, visit := range visits {
			for i := 0; i < tc.NumAttrs; i++ {
				visitIds = append(visitIds, visit.ID)
				attrsIds = append(attrsIds, int64(i+1))
				flagsOn = append(flagsOn, true)
				flagsOff = append(flagsOff, false)
			}
		}

		visitAttrs, err := queries.AddServiceRegionAvailabilityVisitAttributes(ctx, logisticssql.AddServiceRegionAvailabilityVisitAttributesParams{
			ServiceRegionAvailabilityVisitIds: visitIds,
			AttributeIds:                      attrsIds,
			IsRequireds:                       flagsOn,
			IsForbiddens:                      flagsOff,
			IsPreferreds:                      flagsOff,
			IsUnwanteds:                       flagsOff,
		})
		if err != nil {
			t.Fatal(err)
		}
		testutils.MustMatch(t, totalAttrsEntries, len(visitAttrs))
	}
}

func TestGetAssignedAvailabilityVisitsForScheduleID(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	serviceRegionID := time.Now().UnixNano()
	serviceRegionAvailabilitySet, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}
	numVisits := 12
	startTimes := make([]time.Time, 0, numVisits)
	endTimes := make([]time.Time, 0, numVisits)
	serviceRegionAvailabilitySetIds := make([]int64, 0, numVisits)
	locationIds := make([]int64, 0, numVisits)
	serviceDurationsSec := make([]int64, 0, numVisits)
	startTime := time.Now()
	endTime := startTime.Add(8 * time.Hour)
	for i := 0; i < numVisits; i++ {
		startTimes = append(startTimes, startTime)
		endTimes = append(endTimes, endTime)
		serviceRegionAvailabilitySetIds = append(serviceRegionAvailabilitySetIds, serviceRegionAvailabilitySet.ID)
		location, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
			LatitudeE6:  int32(serviceRegionID) + int32(i),
			LongitudeE6: int32(serviceRegionID) + int32(i),
		})
		if err != nil {
			t.Fatal(err)
		}
		locationIds = append(locationIds, location.ID)
		serviceDurationsSec = append(serviceDurationsSec, int64(i))
	}
	visits, err := queries.AddServiceRegionAvailabilityVisits(
		ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
			ArrivalStartTimes:                    startTimes,
			ArrivalEndTimes:                      endTimes,
			ServiceRegionAvailabilityVisitSetIds: serviceRegionAvailabilitySetIds,
			LocationIds:                          locationIds,
			ServiceDurationsSec:                  serviceDurationsSec,
		},
	)
	if err != nil {
		t.Fatal(err)
	}

	scheduleID := time.Now().UnixNano()
	assignedVisits := make([]*logisticssql.ScheduleVisit, 0, numVisits)
	for _, visit := range visits {
		assignedVisit, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
			ScheduleID:                       scheduleID,
			ServiceRegionAvailabilityVisitID: sqltypes.ToValidNullInt64(visit.ID),
		})
		if err != nil {
			t.Fatal(err)
		}
		assignedVisits = append(assignedVisits, assignedVisit)
	}

	assignedAvailabilityVisits, err := queries.GetAssignedAvailabilityVisitsForScheduleID(ctx, scheduleID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, numVisits, len(assignedVisits))
	testutils.MustMatch(t, numVisits, len(assignedAvailabilityVisits))
}

func TestGetUnassignedAvailabilityVisitsForScheduleID(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	serviceRegionID := time.Now().UnixNano()
	serviceRegionAvailabilitySet, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	numVisits := 12
	startTimes := make([]time.Time, 0, numVisits)
	endTimes := make([]time.Time, 0, numVisits)
	locationIds := make([]int64, 0, numVisits)
	serviceRegionAvailabilitySetIds := make([]int64, 0, numVisits)
	serviceDurationsSec := make([]int64, 0, numVisits)
	startTime := time.Now()
	endTime := startTime.Add(8 * time.Hour)
	baseCoord := int32(serviceRegionID)
	for i := 0; i < numVisits; i++ {
		startTimes = append(startTimes, startTime)
		endTimes = append(endTimes, endTime)
		serviceRegionAvailabilitySetIds = append(serviceRegionAvailabilitySetIds, serviceRegionAvailabilitySet.ID)
		coord := baseCoord + int32(i)
		location, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
			LatitudeE6:  coord,
			LongitudeE6: coord,
		})
		if err != nil {
			t.Fatal(err)
		}
		locationIds = append(locationIds, location.ID)
		serviceDurationsSec = append(serviceDurationsSec, int64(i))
	}
	visits, err := queries.AddServiceRegionAvailabilityVisits(
		ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
			ArrivalStartTimes:                    startTimes,
			ArrivalEndTimes:                      endTimes,
			ServiceRegionAvailabilityVisitSetIds: serviceRegionAvailabilitySetIds,
			LocationIds:                          locationIds,
			ServiceDurationsSec:                  serviceDurationsSec,
		},
	)
	if err != nil {
		t.Fatal(err)
	}

	scheduleID := time.Now().UnixNano()
	visitIDs := make([]int64, 0, numVisits)
	for _, visit := range visits {
		visitIDs = append(visitIDs, visit.ID)
	}
	unassignedVisits, err := queries.AddUnassignedScheduleVisitsToSchedule(ctx, logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
		ScheduleID:                        scheduleID,
		ServiceRegionAvailabilityVisitIds: visitIDs,
	})
	if err != nil {
		t.Fatal(err)
	}

	unassignedAvailabilityVisits, err := queries.GetUnassignedAvailabilityVisitsForScheduleID(ctx, scheduleID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, numVisits, len(unassignedVisits))
	testutils.MustMatch(t, numVisits, len(unassignedAvailabilityVisits))
}
