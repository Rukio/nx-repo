//go:build db_test

package main_test

import (
	"context"
	"errors"
	"strconv"
	"testing"
	"time"

	main "github.com/*company-data-covered*/services/go/cmd/logistics-service"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const (
	dbClockSkewDuration = 1 * time.Hour
)

var (
	noSettingsService optimizersettings.Service
)

type mockShiftTeamService struct {
	shiftteampb.ShiftTeamServiceClient
	resp *shiftteampb.GetShiftTeamResponse
	err  error
}

func (s *mockShiftTeamService) GetShiftTeam(ctx context.Context, in *shiftteampb.GetShiftTeamRequest, opts ...grpc.CallOption) (*shiftteampb.GetShiftTeamResponse, error) {
	return s.resp, s.err
}

func TestRemoveCareRequest(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	s := &main.GRPCServer{
		LogisticsDB: logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil),
	}
	validCareRequestID := time.Now().UnixNano()

	tcs := []*struct {
		Desc string
		Req  *logisticspb.RemoveCareRequestRequest

		ExpectedErrorCode codes.Code
	}{
		{
			Desc: "happy case",
			Req:  &logisticspb.RemoveCareRequestRequest{CareRequestId: validCareRequestID},

			ExpectedErrorCode: codes.OK,
		},
		{
			Desc: "invalid argument: empty care request",
			Req:  &logisticspb.RemoveCareRequestRequest{},

			ExpectedErrorCode: codes.InvalidArgument,
		},
		{
			Desc: "not found: no snapshot exists",
			Req:  &logisticspb.RemoveCareRequestRequest{CareRequestId: -1},

			ExpectedErrorCode: codes.NotFound,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			locationID := time.Now().UnixNano()

			startTimestamp := time.Now()
			testutils.MustFn(t)(queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
				ServiceRegionID:          time.Now().UnixNano(),
				CareRequestID:            validCareRequestID,
				LocationID:               locationID,
				ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(startTimestamp.Unix()),
				ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(startTimestamp.Add(30 * time.Minute).Unix()),
				ServiceDurationSec:       int64(time.Hour.Seconds()),
				IsManualOverride:         true,
			}))
			_, err := s.RemoveCareRequest(ctx, tc.Req)
			if tc.ExpectedErrorCode != status.Code(err) {
				t.Fatal(err)
			}
			if tc.ExpectedErrorCode == codes.InvalidArgument {
				return
			}
			createdAt := time.Now().Add(dbClockSkewDuration)
			latestSnapshot, err := queries.GetLatestVisitSnapshot(ctx, logisticssql.GetLatestVisitSnapshotParams{
				CareRequestID: tc.Req.CareRequestId,
				CreatedAt:     createdAt,
			})
			if err != nil && tc.ExpectedErrorCode != codes.NotFound {
				t.Fatal(err)
			}
			if tc.ExpectedErrorCode != codes.OK {
				return
			}
			if !latestSnapshot.DeletedAt.Valid {
				t.Fatal("must have soft deleted by setting non NULL to DeletedAt")
			}
		})
	}
}

func TestUpdateShiftTeamLoc(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	s := &main.GRPCServer{
		LogisticsDB: logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil),
	}

	latitudeE6 := int32(time.Now().UnixNano())
	longitudeE6 := latitudeE6 + 1
	location := &commonpb.Location{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	}
	unknownLocation := &commonpb.Location{
		LatitudeE6:  latitudeE6 + 1,
		LongitudeE6: longitudeE6 + 1,
	}

	shiftTeamID := time.Now().UnixNano()
	unknownShiftTeamID := shiftTeamID + 1
	startTimestampSec := time.Now().UnixNano()
	snapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       shiftTeamID,
		ServiceRegionID:   time.Now().UnixNano(),
		BaseLocationID:    time.Now().UnixNano(),
		StartTimestampSec: startTimestampSec,
		EndTimestampSec:   startTimestampSec + 1,
	})
	if err != nil {
		t.Fatal(err)
	}

	s.Clock = main.MockClock(snapshot.CreatedAt)

	tcs := []*struct {
		Desc string
		Req  *logisticspb.UpdateShiftTeamLocRequest

		HasError bool
	}{
		{
			Desc: "Base case",
			Req: &logisticspb.UpdateShiftTeamLocRequest{
				ShiftTeamId: shiftTeamID,
				Location:    location,
			},

			HasError: false,
		},
		{
			Desc: "Shift Team doesn't exist and location exist",
			Req: &logisticspb.UpdateShiftTeamLocRequest{
				ShiftTeamId: unknownShiftTeamID,
				Location:    location,
			},

			HasError: true,
		},
		{
			Desc: "Shift Team exist and Location exist",
			Req: &logisticspb.UpdateShiftTeamLocRequest{
				ShiftTeamId: shiftTeamID,
				Location:    location,
			},

			HasError: false,
		},
		{
			Desc: "Shift Team doesn't exist and location is new",
			Req: &logisticspb.UpdateShiftTeamLocRequest{
				ShiftTeamId: unknownShiftTeamID,
				Location:    unknownLocation,
			},

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			_, err := s.UpdateShiftTeamLoc(ctx, tc.Req)
			if (err != nil) != tc.HasError {
				t.Fatal(err)
			}

			if tc.HasError {
				return
			}

			createdAt := time.Now().Add(dbClockSkewDuration)
			shiftTeamLocation, err := queries.GetLatestShiftTeamLocation(ctx, logisticssql.GetLatestShiftTeamLocationParams{
				ShiftTeamSnapshotID: snapshot.ID,
				CreatedAt:           createdAt,
			})
			if err != nil {
				t.Fatal(err)
			}

			newLocation, err := queries.GetLocation(ctx,
				logisticssql.GetLocationParams{
					LatitudeE6:  tc.Req.Location.LatitudeE6,
					LongitudeE6: tc.Req.Location.LongitudeE6,
				})
			if err != nil {
				t.Fatal(err)
			}

			if shiftTeamLocation.LocationID != newLocation.ID {
				t.Fatalf("ShiftTeam doesn't contain upserted location, tc: %+v", tc)
			}
		})
	}
}

func TestUpsertShiftTeam(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "some region",
		IanaTimeZoneName: "America/Mexico_City",
	})
	if err != nil {
		t.Fatal(err)
	}

	market, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: time.Now().UnixNano(),
		ShortName:       "BCD",
	})
	if err != nil {
		t.Fatal(err)
	}

	unknownMarketID := market.StationMarketID + 1
	startTime := time.Date(2022, time.January, 1, 17, 0, 0, 0, time.Local)
	endTime := startTime.Add(time.Hour * 1)
	startDateTime := logisticsdb.TimeToProtoDateTime(&startTime)
	endDateTime := logisticsdb.TimeToProtoDateTime(&endTime)
	shiftTimeWindow := &commonpb.TimeWindow{
		StartDatetime: startDateTime,
		EndDatetime:   endDateTime,
	}
	shiftTeamID := time.Now().UnixNano()
	unknownShiftTeamID := shiftTeamID + 1
	unknownShiftTeamID2 := unknownShiftTeamID + 1
	latitudeE6 := int32(time.Now().UnixNano())
	longitudeE6 := latitudeE6 + 1
	baseLocation := &commonpb.Location{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	}
	attributeBaseName := strconv.FormatInt(time.Now().UnixNano(), 10)
	attributeName1 := attributeBaseName + " attribute 1"
	attributeName2 := attributeBaseName + " attribute 2"
	attributes := []*commonpb.Attribute{
		{
			Name: attributeName1,
		},
		{
			Name: attributeName2,
		},
	}
	tcs := []struct {
		Desc             string
		ShiftTeamID      int64
		ShiftTeamService *mockShiftTeamService

		HasError bool
	}{
		{
			Desc:        "Base case",
			ShiftTeamID: shiftTeamID,
			ShiftTeamService: &mockShiftTeamService{
				resp: &shiftteampb.GetShiftTeamResponse{
					ShiftTeam: &shiftteampb.ShiftTeam{
						Id:                  shiftTeamID,
						MarketId:            &market.StationMarketID,
						BaseLocation:        baseLocation,
						ShiftTimeWindow:     shiftTimeWindow,
						ShiftTeamAttributes: attributes,
					},
				},
			},

			HasError: false,
		},
		{
			Desc:        "New Shift Team with providers counts",
			ShiftTeamID: shiftTeamID,
			ShiftTeamService: &mockShiftTeamService{
				resp: &shiftteampb.GetShiftTeamResponse{
					ShiftTeam: &shiftteampb.ShiftTeam{
						Id:                                   shiftTeamID,
						MarketId:                             &market.StationMarketID,
						BaseLocation:                         baseLocation,
						ShiftTimeWindow:                      shiftTimeWindow,
						ShiftTeamAttributes:                  attributes,
						AdvancedPracticeProviderCount:        proto.Int32(1),
						*company-data-covered*MedicalTechnicianCount: proto.Int32(1),
					},
				},
			},

			HasError: false,
		},
		{
			Desc:        "New shift Team without attributes and location exist",
			ShiftTeamID: unknownShiftTeamID2,
			ShiftTeamService: &mockShiftTeamService{
				resp: &shiftteampb.GetShiftTeamResponse{
					ShiftTeam: &shiftteampb.ShiftTeam{
						Id:                  unknownShiftTeamID2,
						MarketId:            &market.StationMarketID,
						BaseLocation:        baseLocation,
						ShiftTimeWindow:     shiftTimeWindow,
						ShiftTeamAttributes: nil,
					},
				},
			},

			HasError: false,
		},
		{
			Desc:        "Shift Team doesn't exist",
			ShiftTeamID: unknownShiftTeamID,
			ShiftTeamService: &mockShiftTeamService{
				resp: nil,
				err:  errors.New("shift Team not found"),
			},

			HasError: true,
		},
		{
			Desc:        "Shift Team exist and marketid doesn't exist in the database",
			ShiftTeamID: shiftTeamID,
			ShiftTeamService: &mockShiftTeamService{
				resp: &shiftteampb.GetShiftTeamResponse{
					ShiftTeam: &shiftteampb.ShiftTeam{
						Id:                  shiftTeamID,
						MarketId:            &unknownMarketID,
						BaseLocation:        baseLocation,
						ShiftTimeWindow:     shiftTimeWindow,
						ShiftTeamAttributes: nil,
					},
				},
			},

			HasError: true,
		},
		{
			Desc:        "Shift Team exist and shift time window doesn't exist",
			ShiftTeamID: shiftTeamID,
			ShiftTeamService: &mockShiftTeamService{
				resp: &shiftteampb.GetShiftTeamResponse{
					ShiftTeam: &shiftteampb.ShiftTeam{
						Id:                  shiftTeamID,
						MarketId:            &market.StationMarketID,
						BaseLocation:        baseLocation,
						ShiftTimeWindow:     nil,
						ShiftTeamAttributes: nil,
					},
				},
			},

			HasError: true,
		},
	}

	s := &main.GRPCServer{
		LogisticsDB: logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil),
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s.ShiftTeamService = tc.ShiftTeamService
			_, err := s.UpsertShiftTeam(ctx, &logisticspb.UpsertShiftTeamRequest{
				ShiftTeamId: tc.ShiftTeamID,
			})
			if err != nil && !tc.HasError {
				t.Fatal(err)
			}

			if tc.HasError {
				return
			}

			createdAt := time.Now().Add(dbClockSkewDuration)
			latestShiftTeamSnapshot, err := queries.GetLatestShiftTeamSnapshot(ctx, logisticssql.GetLatestShiftTeamSnapshotParams{
				ShiftTeamID: tc.ShiftTeamID,
				CreatedAt:   createdAt,
			})
			if err != nil {
				t.Fatal(err)
			}

			shiftTeamAttributes, err := queries.GetAttributesForShiftTeam(ctx, latestShiftTeamSnapshot.ID)
			if err != nil {
				t.Fatal(err)
			}

			if len(shiftTeamAttributes) != len(tc.ShiftTeamService.resp.ShiftTeam.ShiftTeamAttributes) {
				t.Fatalf("Shift Team doesn't contain the same number of attributes as the database upserted shift team tc: %+v, %+v", tc, shiftTeamAttributes)
			}
		})
	}
}

type episodeServiceMock struct {
	episodepb.EpisodeServiceClient

	resp *episodepb.GetVisitResponse
	err  error
}

func (s *episodeServiceMock) GetVisit(ctx context.Context, in *episodepb.GetVisitRequest, opts ...grpc.CallOption) (*episodepb.GetVisitResponse, error) {
	return s.resp, s.err
}

func (s *episodeServiceMock) ListVisits(ctx context.Context, in *episodepb.ListVisitsRequest, opts ...grpc.CallOption) (*episodepb.ListVisitsResponse, error) {
	return nil, errors.New("unimplemented")
}

func (s *episodeServiceMock) DuplicateVisit(ctx context.Context, in *episodepb.DuplicateVisitRequest, opts ...grpc.CallOption) (*episodepb.DuplicateVisitResponse, error) {
	return nil, errors.New("unimplemented")
}

func (s *episodeServiceMock) GetVisitPossibleServiceLines(ctx context.Context, in *episodepb.GetVisitPossibleServiceLinesRequest, opts ...grpc.CallOption) (*episodepb.GetVisitPossibleServiceLinesResponse, error) {
	return nil, errors.New("unimplemented")
}

func (s *episodeServiceMock) UpsertVisitETARange(ctx context.Context, in *episodepb.UpsertVisitETARangeRequest, opts ...grpc.CallOption) (*episodepb.UpsertVisitETARangeResponse, error) {
	return nil, errors.New("unimplemented")
}

func (s *episodeServiceMock) SearchVisits(ctx context.Context, in *episodepb.SearchVisitsRequest, opts ...grpc.CallOption) (*episodepb.SearchVisitsResponse, error) {
	return nil, errors.New("unimplemented")
}

func TestUpsertCareRequest(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "East Service Region",
		IanaTimeZoneName: "America/Cancun",
	})
	if err != nil {
		t.Fatal(err)
	}

	market, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: time.Now().UnixNano(),
		ShortName:       "ABC",
	})
	if err != nil {
		t.Fatal(err)
	}

	careRequestID := time.Now().UnixNano()
	careRequestID2 := careRequestID + 1
	invalidCareRequestID := careRequestID + 2
	serviceDurationSec := int64(3600)
	latitudeE6 := int32(time.Now().UnixNano())
	longitudeE6 := latitudeE6 + 1
	location := commonpb.Location{
		LatitudeE6:  latitudeE6,
		LongitudeE6: longitudeE6,
	}
	startDate := time.Date(2022, time.January, 1, 20, 0, 0, 0, time.Local)
	endDate := startDate.Add(time.Hour)
	arrivalTimeWindow := &commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&startDate),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&endDate),
	}
	unknownMarketID := market.StationMarketID + 1
	attributeBaseName := strconv.FormatInt(time.Now().UnixNano(), 10)
	requiredAttributes := []*commonpb.Attribute{
		{
			Name: attributeBaseName + " attribute A",
		},
		{
			Name: attributeBaseName + " attribute B",
		},
	}

	testCases := []struct {
		Desc           string
		CareRequestID  int64
		EpisodeService episodepb.EpisodeServiceClient

		HasError bool
	}{
		{
			Desc:          "Base case",
			CareRequestID: careRequestID,
			EpisodeService: &episodeServiceMock{
				resp: &episodepb.GetVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id:                 careRequestID,
						MarketId:           &market.StationMarketID,
						Location:           &location,
						ArrivalTimeWindow:  arrivalTimeWindow,
						ServiceDurationSec: &serviceDurationSec,
						RequiredAttributes: requiredAttributes,
						RequestStatus: &commonpb.CareRequestStatus{
							Name:         proto.String("accepted"),
							SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_MANUAL_OPTIMIZER.Enum(),
							CreatedAtSec: proto.Int64(time.Now().Unix()),
							ShiftTeamId:  proto.Int64(time.Now().UnixNano()),
						},
					},
				},
			},
			HasError: false,
		},
		{
			Desc:          "New care request with no attributes",
			CareRequestID: careRequestID2,
			EpisodeService: &episodeServiceMock{
				resp: &episodepb.GetVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id:                 careRequestID2,
						MarketId:           &market.StationMarketID,
						Location:           &location,
						ArrivalTimeWindow:  arrivalTimeWindow,
						ServiceDurationSec: &serviceDurationSec,
						RequiredAttributes: nil,
						RequestStatus: &commonpb.CareRequestStatus{
							Name:         proto.String("accepted"),
							SourceType:   commonpb.CareRequestStatus_SOURCE_TYPE_MANUAL_OPTIMIZER.Enum(),
							CreatedAtSec: proto.Int64(time.Now().Unix()),
							ShiftTeamId:  proto.Int64(time.Now().UnixNano()),
						},
					},
				},
			},
			HasError: false,
		},
		{
			Desc:          "Invalid care request id",
			CareRequestID: invalidCareRequestID,
			EpisodeService: &episodeServiceMock{
				err: errors.New("care request not found"),
			},
			HasError: true,
		},
		{
			Desc:          "Unknown market id",
			CareRequestID: careRequestID,
			EpisodeService: &episodeServiceMock{
				resp: &episodepb.GetVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id:                 careRequestID,
						MarketId:           &unknownMarketID,
						Location:           &location,
						ArrivalTimeWindow:  arrivalTimeWindow,
						ServiceDurationSec: &serviceDurationSec,
						RequiredAttributes: nil,
					},
				},
			},
			HasError: true,
		},
		{
			Desc:          "Arrival time window is not provided",
			CareRequestID: careRequestID,
			EpisodeService: &episodeServiceMock{
				resp: &episodepb.GetVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id:                 careRequestID,
						MarketId:           &market.StationMarketID,
						Location:           &location,
						ArrivalTimeWindow:  nil,
						ServiceDurationSec: &serviceDurationSec,
						RequiredAttributes: nil,
					},
				},
			},
			HasError: true,
		},
	}

	s := &main.GRPCServer{
		LogisticsDB: logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil),
	}
	for _, tc := range testCases {
		t.Run(tc.Desc, func(t *testing.T) {
			s.EpisodeService = tc.EpisodeService
			_, err := s.UpsertCareRequest(ctx, &logisticspb.UpsertCareRequestRequest{
				CareRequestId: tc.CareRequestID,
			})

			if (err != nil) != tc.HasError {
				t.Fatal(err)
			}

			if tc.HasError {
				return
			}

			createdAt := time.Now().Add(dbClockSkewDuration)
			latestVisitSnapshot, err := queries.GetLatestVisitSnapshot(ctx, logisticssql.GetLatestVisitSnapshotParams{
				CareRequestID: tc.CareRequestID,
				CreatedAt:     createdAt,
			})
			if err != nil {
				t.Fatal(err)
			}

			locationResponse, err := queries.GetLocation(ctx, logisticssql.GetLocationParams{
				LatitudeE6:  latitudeE6,
				LongitudeE6: longitudeE6,
			})
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt")(t, &logisticssql.VisitSnapshot{
				CareRequestID:            tc.CareRequestID,
				ServiceRegionID:          serviceRegion.ID,
				LocationID:               locationResponse.ID,
				ArrivalStartTimestampSec: sqltypes.ToValidNullInt64(startDate.Unix()),
				ArrivalEndTimestampSec:   sqltypes.ToValidNullInt64(endDate.Unix()),
				ServiceDurationSec:       serviceDurationSec,
			}, latestVisitSnapshot, "The content of the latest visit snapshot doesn't match")

			visitAttributes, err := queries.GetAttributesForVisit(ctx, latestVisitSnapshot.ID)
			if err != nil {
				t.Fatal(err)
			}

			if len(visitAttributes) != len(tc.EpisodeService.(*episodeServiceMock).resp.CareRequest.RequiredAttributes) {
				t.Fatalf("Care request doesn't contain the same number of attributes as the database upserted care request tc: %+v, %+v", tc, visitAttributes)
			}
		})
	}
}

func TestGRPCServer_GetCareRequestETA(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	s := &main.GRPCServer{
		LogisticsDB: logisticsdb.NewLogisticsDB(db, nil, noSettingsService, nil),
	}
	baseCareRequestID := time.Now().Add(2 * time.Hour).UnixNano()
	err := addETADbData(ctx, queries, baseCareRequestID)
	if err != nil {
		t.Fatal(err)
	}
	tcs := []struct {
		Desc         string
		Request      *logisticspb.GetCareRequestETARequest
		ExpectedEnum logisticspb.GetCareRequestETAResponse_Precision

		HasError bool
	}{
		{
			Desc:    "care request id is null",
			Request: &logisticspb.GetCareRequestETARequest{},

			HasError: true,
		},
		{
			Desc: "care request id not have latest info",
			Request: &logisticspb.GetCareRequestETARequest{
				CareRequestId: proto.Int64(0),
			},

			HasError: true,
		},
		{
			Desc: "care request id has ETA with PRECISION_COARSE",
			Request: &logisticspb.GetCareRequestETARequest{
				CareRequestId: proto.Int64(baseCareRequestID),
			},
			ExpectedEnum: logisticspb.GetCareRequestETAResponse_PRECISION_COARSE,

			HasError: false,
		},
	}

	for _, tc := range tcs {
		res, err := s.GetCareRequestETA(ctx, tc.Request)
		if (err != nil) != tc.HasError {
			t.Fatalf("test '%s' has error on %s", tc.Desc, err)
		}

		if res != nil {
			testutils.MustMatch(t, &tc.ExpectedEnum, res.Precision, "precision not expected")
		}
	}
}

// TODO: simplify this setup function.
func addETADbData(ctx context.Context, queries *logisticssql.Queries, baseCareRequestID int64) error {
	baseID := time.Now().UnixNano()
	shiftTeamID := baseID + 100
	shiftTeamSnapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
		ShiftTeamID:       shiftTeamID,
		ServiceRegionID:   baseID + 1,
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
	visitPhaseType, err := queries.GetVisitPhaseTypeForShortName(ctx, logisticsdb.VisitPhaseTypeShortNameCommitted.String())
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
		ShiftTeamID:      sqltypes.ToValidNullInt64(shiftTeamID),
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
	scheduleRoutes, err := queries.AddScheduleRoutes(ctx, logisticssql.AddScheduleRoutesParams{
		ScheduleIds:               []int64{schedule.ID},
		ShiftTeamSnapshotIds:      []int64{shiftTeamSnapshot.ID},
		DepotArrivalTimestampsSec: []int64{time.Now().Unix()},
	})
	if err != nil {
		return err
	}
	if len(scheduleRoutes) != 1 {
		return errors.New("incorrect number of schedule routes created for test setup")
	}
	_, err = queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
		ScheduleRouteID:     scheduleRoutes[0].ID,
		ScheduleID:          schedule.ID,
		VisitSnapshotID:     sqltypes.ToValidNullInt64(visit.ID),
		ArrivalTimestampSec: baseCareRequestID,
	})
	if err != nil {
		return err
	}

	return nil
}
