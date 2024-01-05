//go:build db_test

package logisticsdb_test

import (
	"context"
	"errors"
	"testing"
	"time"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

type mockDistanceMatrix struct {
	resp             logistics.DistanceMatrix
	err              error
	distanceSourceID int64
}

func (m *mockDistanceMatrix) GetRoute(context.Context, monitoring.Tags, ...logistics.LatLng) (*logistics.Route, error) {
	return nil, nil
}

func (m *mockDistanceMatrix) IsHealthy(ctx context.Context) bool {
	return true
}

func (m *mockDistanceMatrix) GetDistanceMatrix(_ context.Context, mapsTags monitoring.Tags, origins, destinations []logistics.LatLng) (logistics.DistanceMatrix, error) {
	if m.err == nil {
		matrix := logistics.DistanceMatrix{}
		for _, fromLL := range origins {
			distances := map[logistics.LatLng]logistics.Distance{}
			for _, toLL := range destinations {
				distances[toLL] = testDistance
			}
			matrix[fromLL] = distances
		}

		return matrix, nil
	}

	return m.resp, m.err
}

func (m *mockDistanceMatrix) GetPathDistanceMatrix(_ context.Context, mapsTags monitoring.Tags, path ...logistics.LatLng) (logistics.DistanceMatrix, error) {
	matrix := logistics.DistanceMatrix{}
	for i := 0; i < len(path)-1; i++ {
		matrix[path[i]] = map[logistics.LatLng]logistics.Distance{}
	}
	for i := 0; i < len(path)-1; i++ {
		matrix[path[i]][path[i+1]] = testDistance
	}

	return matrix, nil
}

func (m *mockDistanceMatrix) GetDistanceSourceID() int64 {
	return m.distanceSourceID
}

func addLocations(ctx context.Context, t *testing.T, queries *logisticssql.Queries, locCount int) []*logisticssql.Location {
	t.Helper()

	latE6s := make([]int32, locCount)
	lngE6s := make([]int32, locCount)
	nextCoordinate := int32(time.Now().UnixNano())
	for i := 0; i < locCount; i++ {
		latE6s[i] = nextCoordinate
		lngE6s[i] = nextCoordinate + 1
		nextCoordinate += 2
	}

	locs, err := queries.UpsertLocations(ctx, logisticssql.UpsertLocationsParams{
		LatE6s: latE6s,
		LngE6s: lngE6s,
	})
	if err != nil {
		t.Fatal(err)
	}

	if len(locs) != locCount {
		t.Fatal("not enough locations")
	}

	return locs
}

func addLocationIDs(ctx context.Context, t *testing.T, queries *logisticssql.Queries, locCount int) []int64 {
	t.Helper()

	locs := addLocations(ctx, t, queries, locCount)
	locIds := make([]int64, locCount)
	for i, loc := range locs {
		locIds[i] = loc.ID
	}

	return locIds
}

func addDistances(ctx context.Context, t *testing.T, queries *logisticssql.Queries,
	fromLocIDs, toLocIDs []int64, sourceID int64) {
	t.Helper()

	var params logisticssql.AddDistancesParams

	for _, fromLocID := range fromLocIDs {
		for _, toLocID := range toLocIDs {
			params.FromLocationIds = append(params.FromLocationIds, fromLocID)
			params.ToLocationIds = append(params.ToLocationIds, toLocID)
			params.DistancesMeters = append(params.DistancesMeters, preloadedDistanceMeters)
			params.DurationsSeconds = append(params.DurationsSeconds, preloadedDurationSec)
			params.SourceIds = append(params.SourceIds, sourceID)
		}
	}

	_, err := queries.AddDistances(ctx, params)
	if err != nil {
		t.Fatal(err)
	}
}

func TestGetDistanceMatrixMultiDistanceMatrixRequests(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	afterCreatedAt := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.Local)
	sourceID := time.Now().UnixNano()
	mapService := &mockDistanceMatrix{
		distanceSourceID: sourceID,
	}
	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, &monitoring.NoopScope{})
	locIDs := addLocationIDs(ctx, t, queries, 5)
	existingFrom := locIDs[0:2]
	existingTo := locIDs[1:4]
	nonExistingFrom := locIDs[3:4]
	addDistances(ctx, t, queries, existingFrom, existingTo, sourceID)

	nonExistingPathLocIDs := addLocationIDs(ctx, t, queries, 3)

	rectReqs := []logisticsdb.DistanceMatrixRequest{
		// these distances exist
		&logisticsdb.RectDistancesReq{FromLocationIDs: existingFrom, ToLocationIDs: existingTo},
		// These distances do not exist and should be fetched without a problem
		&logisticsdb.RectDistancesReq{FromLocationIDs: nonExistingFrom, ToLocationIDs: locIDs},
		// These path distances do not exist and should be fetched without a problem
		logisticsdb.PathDistancesReq{nonExistingPathLocIDs[0], nonExistingPathLocIDs[1], nonExistingPathLocIDs[2]},

		// Overlapping requests
		// a duplicate array, though strange, should work just fine!
		&logisticsdb.RectDistancesReq{FromLocationIDs: nonExistingFrom, ToLocationIDs: locIDs},
		// path that overlaps existing rectangles, should work just fine!
		logisticsdb.PathDistancesReq{existingFrom[0], existingTo[0]},
	}

	matrixResp, _, err := ldb.GetDistanceMatrix(ctx, logisticsdb.GetDistanceMatrixParams{
		Reqs:           rectReqs,
		AfterCreatedAt: afterCreatedAt,
		MapService:     mapService,
		MapsTags:       &logisticsdb.DistanceMatrixMapsTags{},
	})
	if err != nil {
		t.Fatal(err)
	}

	var expectedNumDistances int
	for _, req := range rectReqs[:len(rectReqs)-2] {
		// note that this test assumes no overlapping distances except for the last totally duplicate one.
		expectedNumDistances += len(req.LocIDPairSet().Elems())
	}
	if expectedNumDistances != len(matrixResp.Distances) {
		t.Fatalf("returned matrix size is not correct: %d, %d", expectedNumDistances, len(matrixResp.Distances))
	}
}

func TestGetDistanceMatrix(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	errShouldNotBeCalled := errors.New("should not be called")

	nextSourceID := time.Now().UnixNano()

	mapService := &mockDistanceMatrix{}
	errMapService := &mockDistanceMatrix{err: errShouldNotBeCalled}

	researchMapService := &mockDistanceMatrix{}
	researchErrMapService := &mockDistanceMatrix{err: errShouldNotBeCalled}

	invalidLocID := int64(-1)

	researchSettings := optimizersettings.Settings{
		FetchOtherMapServiceDistances:          true,
		FetchOtherMapServiceDistancesTimeoutMs: 500,
	}

	tcs := []struct {
		Desc                       string
		LocIDCount                 int
		MissingFromLocIDCount      int
		MissingToLocIDCount        int
		GetDistancesBatchSize      int
		PreloadLocIDSourceIDOffset int64
		ExtraLocIds                []int64
		MapService                 *mockDistanceMatrix

		ResearchMapServices []logistics.MapService
		Settings            optimizersettings.Settings

		HasError              bool
		HasMapServiceDistance bool
	}{
		{
			Desc:                "Base case, has all preloaded distances",
			LocIDCount:          5,
			MapService:          errMapService,
			ResearchMapServices: []logistics.MapService{researchErrMapService},
			Settings:            researchSettings,
			HasError:            false,
		},
		{
			Desc:                  "Missing some preloaded distances",
			LocIDCount:            3,
			MissingFromLocIDCount: 1,
			MissingToLocIDCount:   1,
			MapService:            mapService,
			ResearchMapServices:   []logistics.MapService{researchMapService},
			Settings:              researchSettings,
			HasError:              false,
			HasMapServiceDistance: true,
		},
		{
			Desc:                  "Missing some preloaded distances, research service fail does not cause error",
			LocIDCount:            3,
			MissingFromLocIDCount: 1,
			MissingToLocIDCount:   1,
			MapService:            mapService,
			ResearchMapServices:   []logistics.MapService{researchErrMapService},
			Settings:              researchSettings,
			HasError:              false,
			HasMapServiceDistance: true,
		},
		{
			Desc:                       "Preloaded distances with different sourceId",
			LocIDCount:                 2,
			PreloadLocIDSourceIDOffset: -1,
			MapService:                 mapService,
			HasError:                   false,
			HasMapServiceDistance:      true,
		},
		{
			Desc:       "No requested locations",
			LocIDCount: 0,
			MapService: errMapService,
			HasError:   false,
		},
		{
			Desc:        "Non-existent location id fails",
			LocIDCount:  1,
			ExtraLocIds: []int64{invalidLocID},
			MapService:  errMapService,
			HasError:    true,
		},
		{
			Desc:       "Map service returns error fails",
			LocIDCount: 1,
			MapService: errMapService,
			HasError:   true,
		},
		{
			Desc:                  "Batch get latest distances for locations query",
			LocIDCount:            5,
			MapService:            mapService,
			GetDistancesBatchSize: 10,
			HasError:              false,
		},
	}

	// TODO: Write tests for created_at.
	afterCreatedAt := time.Date(2000, time.January, 1, 0, 0, 0, 0, time.Local)
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			sourceID := nextSourceID
			mapService := tc.MapService
			mapService.distanceSourceID = sourceID
			nextSourceID++

			for _, ms := range tc.ResearchMapServices {
				ms.(*mockDistanceMatrix).distanceSourceID = nextSourceID
				nextSourceID++
			}

			ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, nil)
			ldb.QuerySettings = logisticsdb.QuerySettings{
				GetLatestDistancesForLocationsBatchSize: uint(tc.GetDistancesBatchSize),
			}

			locIDs := addLocationIDs(ctx, t, queries, tc.LocIDCount)
			fromLocIDs := locIDs[:len(locIDs)-tc.MissingFromLocIDCount]
			toLocIDs := locIDs[:len(locIDs)-tc.MissingToLocIDCount]

			preloadSourceID := sourceID + tc.PreloadLocIDSourceIDOffset
			addDistances(ctx, t, queries, fromLocIDs, toLocIDs, preloadSourceID)

			locIDs = append(locIDs, tc.ExtraLocIds...)
			matrixResp, _, err := ldb.GetDistanceMatrix(
				ctx,
				logisticsdb.GetDistanceMatrixParams{
					Reqs: []logisticsdb.DistanceMatrixRequest{
						&logisticsdb.RectDistancesReq{FromLocationIDs: locIDs, ToLocationIDs: locIDs}},
					AfterCreatedAt: afterCreatedAt,
					MapsTags:       &logisticsdb.DistanceMatrixMapsTags{},

					MapService:          mapService,
					ResearchMapServices: tc.ResearchMapServices,
					Settings:            tc.Settings,
				},
			)
			if err != nil && !tc.HasError {
				t.Fatal(err)
			}
			if tc.HasError {
				return
			}

			matrixLength := len(locIDs) * len(locIDs)
			if matrixLength != len(matrixResp.Distances) {
				t.Fatalf("returned matrix size is not correct: %+v ", tc)
			}

			if tc.HasMapServiceDistance {
				var hasMapServiceResponse bool
				for _, distance := range matrixResp.Distances {
					if *distance.DurationSec == mapServiceDurationSec &&
						*distance.LengthMeters == mapServiceDistanceMeters {
						hasMapServiceResponse = true
						break
					}
				}

				if !hasMapServiceResponse {
					t.Fatalf("no map service response: %+v", matrixResp)
				}
			}
		})
	}
}
