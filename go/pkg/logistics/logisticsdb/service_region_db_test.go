//go:build db_test

package logisticsdb_test

import (
	"testing"
	"time"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestAddServiceRegionTimezone(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	tzName := "America/Phoenix"
	loc, err := time.LoadLocation(tzName)
	if err != nil {
		t.Fatal(err)
	}

	region, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "some region",
		IanaTimeZoneName: loc.String(),
	})
	if err != nil {
		t.Fatal(err)
	}

	newTZName, err := queries.GetIANATimeZoneNameForServiceRegion(ctx, region.ID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, tzName, newTZName, "wrong timezone name")
}

func TestServiceRegionCanonicalLocations(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	serviceRegionID := time.Now().UnixNano()
	baseLocationID := time.Now().UnixNano()
	locationIDs := []int64{baseLocationID, baseLocationID + 1, baseLocationID + 2, baseLocationID + 3, baseLocationID + 4}

	set, err := queries.AddServiceRegionCanonicalLocationSet(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	locations, err := queries.AddServiceRegionCanonicalLocations(ctx, logisticssql.AddServiceRegionCanonicalLocationsParams{
		LocationsIds:                        locationIDs,
		ServiceRegionCanonicalLocationSetID: set.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 5, len(locations), "Wrong locations size")

	locations, err = queries.GetServiceRegionCanonicalLocations(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 5, len(locations), "Wrong locations size")

	locationIDs = []int64{baseLocationID, baseLocationID + 1, baseLocationID + 2}

	set, err = queries.AddServiceRegionCanonicalLocationSet(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	locations, err = queries.AddServiceRegionCanonicalLocations(ctx, logisticssql.AddServiceRegionCanonicalLocationsParams{
		LocationsIds:                        locationIDs,
		ServiceRegionCanonicalLocationSetID: set.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 3, len(locations), "Wrong locations size")
}

func TestServiceRegionOpenHours(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	serviceRegionID := time.Now().UnixNano()

	schedule1, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}
	schedule2, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegionID)
	if err != nil {
		t.Fatal(err)
	}

	startTime1 := time.Date(0, 0, 0, 1, 0, 0, 0, time.UTC)
	endTime1 := time.Date(0, 0, 0, 2, 0, 0, 0, time.UTC)
	startTime2 := time.Date(0, 0, 0, 3, 0, 0, 0, time.UTC)
	endTime2 := time.Date(0, 0, 0, 4, 0, 0, 0, time.UTC)

	schedules := []struct {
		schedule  *logisticssql.ServiceRegionOpenHoursSchedule
		startTime time.Time
		endTime   time.Time
	}{
		{
			schedule:  schedule1,
			startTime: startTime1,
			endTime:   endTime1,
		},
		{
			schedule:  schedule2,
			startTime: startTime2,
			endTime:   endTime2,
		},
	}

	numWeekdays := 7

	var scheduleIds []int64
	var startTimes, endTimes []time.Time
	var daysOfWeek []int32
	for _, s := range schedules {
		for i := 0; i < numWeekdays; i++ {
			scheduleIds = append(scheduleIds, s.schedule.ID)
			daysOfWeek = append(daysOfWeek, int32(i))
			startTimes = append(startTimes, s.startTime)
			endTimes = append(endTimes, s.endTime)
		}
	}

	days, err := queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
		ServiceRegionOpenHoursScheduleIds: scheduleIds,
		StartTimes:                        startTimes,
		EndTimes:                          endTimes,
		DaysOfWeek:                        daysOfWeek,
	})
	if err != nil {
		t.Fatal(err)
	}

	newDays, err := queries.GetLatestOpenHoursScheduleForServiceRegion(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionParams{
		ServiceRegionID: serviceRegionID,
		BeforeCreatedAt: schedule2.CreatedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	expectedLatestScheduleDays := days[len(days)-numWeekdays:]
	testutils.MustMatch(t, expectedLatestScheduleDays, newDays, "not matching days")
}
