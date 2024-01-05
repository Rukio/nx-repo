package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpiconv"
	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type mockValuer struct{}

func (m mockValuer) AuthorizationValue() string {
	return "Bearer AccessTokenString"
}

func TestNewGRPCServer(t *testing.T) {
	token := mockValuer{}
	type args struct {
		dbs           *clinicalkpidb.ClinicalKPIDB
		stationClient *station.Client
		logger        *zap.SugaredLogger
	}
	tests := []struct {
		name string
		args args
		want *GRPCServer
	}{
		{
			name: "success - base case",
			args: args{
				dbs:           &clinicalkpidb.ClinicalKPIDB{},
				stationClient: &station.Client{AuthToken: token},
				logger:        zap.NewNop().Sugar(),
			},
			want: &GRPCServer{
				DBService:     &clinicalkpidb.ClinicalKPIDB{},
				StationClient: &station.Client{AuthToken: token},
				Logger:        zap.NewNop().Sugar(),
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := NewGRPCServer(gRPCServerParams{
				dbService:     tt.args.dbs,
				stationClient: tt.args.stationClient,
				logger:        tt.args.logger,
			})
			testutils.MustMatch(t, tt.want, got, "did not instantiate correctly")
		})
	}
}

var (
	mockCareRequestsCompletedLastSevenDays = int32(20)

	mockChangeDays = int32(7)

	mockOnSceneTimeSecs       = sqltypes.ToValidNullInt32(int32(3600))
	mockOnSceneTimeSecsChange = sqltypes.ToValidNullInt32(int32(3600))

	mockNetPromoterScore, _       = pgtypes.BuildNumeric(int32(3600))
	mockNetPromoterScoreChange, _ = pgtypes.BuildNumeric(int32(3600))

	mockChartClosureRate, _       = pgtypes.BuildNumeric(int32(3600))
	mockChartClosureRateChange, _ = pgtypes.BuildNumeric(int32(3600))

	mockSurveyCaptureRate, _       = pgtypes.BuildNumeric(int32(3600))
	mockSurveyCaptureRateChange, _ = pgtypes.BuildNumeric(int32(3600))

	mockLastCareRequestCompletedAt = sqltypes.ToValidNullTime(time.Now())

	mockCompletedCareRequests = int32(100)
)

func TestGetLatestMetricsForProvider(t *testing.T) {
	now := time.Now()
	updatedAt := now.AddDate(0, 0, 1)
	type args struct {
		mr *clinicalkpipb.GetLatestMetricsForProviderRequest
	}
	authContext := getContextWithAuth()
	noAuthContext := context.Background()
	stationUser := StationUser{
		ID:        123,
		FirstName: "John",
		Email:     "john.wayne@example.com",
		Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
	}
	tcs := []struct {
		name          string
		context       context.Context
		mockDBService *mockClinicalKPIDB
		args          args

		stationHTTPStatus   int
		stationHTTPResponse StationUser

		want         *clinicalkpipb.GetLatestMetricsForProviderResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success: returns provider metrics",
			context: authContext,
			mockDBService: &mockClinicalKPIDB{
				getMetricsForProviderResult: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         12,
					CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            mockNetPromoterScore,
					AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
					ChartClosureRate:                   mockChartClosureRate,
					ChartClosureRateChange:             mockChartClosureRateChange,
					SurveyCaptureRate:                  mockSurveyCaptureRate,
					SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
					ChangeDays:                         mockChangeDays,
					LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompletedCareRequests,
					CreatedAt:                          now,
					UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
				},
				getMetricsForProviderError: nil,
			},
			args: args{
				mr: &clinicalkpipb.GetLatestMetricsForProviderRequest{ProviderId: int64(12)},
			},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetLatestMetricsForProviderResponse{
				Metrics: &clinicalkpipb.MetricsData{
					CareRequestsCompletedLastSevenDays: proto.Int32(mockCareRequestsCompletedLastSevenDays),
					AverageNetPromoterScore:            pgtypes.NumericToProtoFloat64(mockNetPromoterScore),
					AverageNetPromoterScoreChange:      pgtypes.NumericToProtoFloat64(mockNetPromoterScoreChange),
					ChartClosureRate:                   pgtypes.NumericToProtoFloat64(mockChartClosureRate),
					ChartClosureRateChange:             pgtypes.NumericToProtoFloat64(mockChartClosureRateChange),
					SurveyCaptureRate:                  pgtypes.NumericToProtoFloat64(mockSurveyCaptureRate),
					SurveyCaptureRateChange:            pgtypes.NumericToProtoFloat64(mockSurveyCaptureRateChange),
					MedianOnSceneTimeSecs:              proto.Int32(mockOnSceneTimeSecs.Int32),
					MedianOnSceneTimeSecsChange:        proto.Int32(mockOnSceneTimeSecsChange.Int32),
					ChangeDays:                         proto.Int32(mockChangeDays),
					LastCareRequestCompletedAt:         protoconv.TimeToProtoTimestamp(&mockLastCareRequestCompletedAt.Time),
					CompletedCareRequests:              proto.Int32(mockCompletedCareRequests),
					CreatedAt:                          protoconv.TimeToProtoTimestamp(&now),
					UpdatedAt:                          protoconv.TimeToProtoTimestamp(&updatedAt),
					Status:                             clinicalkpipb.MetricsData_STATUS_OK,
				},
			},
		},
		{
			name:    "failure: unauthenticated - station returns unauthorized",
			context: authContext,
			mockDBService: &mockClinicalKPIDB{
				getMetricsForProviderResult: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         12,
					CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            mockNetPromoterScore,
					AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
					ChartClosureRate:                   mockChartClosureRate,
					ChartClosureRateChange:             mockChartClosureRateChange,
					SurveyCaptureRate:                  mockSurveyCaptureRate,
					SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
					ChangeDays:                         mockChangeDays,
					LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
					CreatedAt:                          now,
					UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
				},
				getMetricsForProviderError: nil,
			},
			args: args{
				mr: &clinicalkpipb.GetLatestMetricsForProviderRequest{ProviderId: int64(12)},
			},

			stationHTTPStatus:   http.StatusUnauthorized,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name:    "failure: unauthenticated - no auth context for forwarding",
			context: noAuthContext,
			mockDBService: &mockClinicalKPIDB{
				getMetricsForProviderResult: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         12,
					CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            mockNetPromoterScore,
					AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
					ChartClosureRate:                   mockChartClosureRate,
					ChartClosureRateChange:             mockChartClosureRateChange,
					SurveyCaptureRate:                  mockSurveyCaptureRate,
					SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
					ChangeDays:                         mockChangeDays,
					LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
					CreatedAt:                          now,
					UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
				},
				getMetricsForProviderError: nil,
			},
			args: args{
				mr: &clinicalkpipb.GetLatestMetricsForProviderRequest{ProviderId: int64(12)},
			},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			name:    "success: returns nil metrics if none returned from DB",
			context: authContext,
			mockDBService: &mockClinicalKPIDB{
				getMetricsForProviderResult: nil,
				getMetricsForProviderError:  nil,
			},
			args: args{
				mr: &clinicalkpipb.GetLatestMetricsForProviderRequest{ProviderId: int64(12)},
			},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetLatestMetricsForProviderResponse{
				Metrics: &clinicalkpipb.MetricsData{
					Status:       clinicalkpipb.MetricsData_STATUS_NOT_ENOUGH_COMPLETED_CARE_REQUESTS,
					ErrorMessage: proto.String(clinicalkpiconv.NotEnoughCompletedCareRequestsErrMsg),
				},
			},
		},
		{
			name:    "failure: provider ID is required",
			context: authContext,
			args: args{
				mr: &clinicalkpipb.GetLatestMetricsForProviderRequest{},
			},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure: failed to perform query",
			context: authContext,
			mockDBService: &mockClinicalKPIDB{
				getMetricsForProviderResult: &clinicalkpisql.CalculatedProviderMetric{},
				getMetricsForProviderError:  errors.New("an error occurred"),
			},
			args: args{
				mr: &clinicalkpipb.GetLatestMetricsForProviderRequest{ProviderId: int64(12)},
			},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			stationClient := &station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})
			resp, err := grpcServer.GetLatestMetricsForProvider(tc.context, tc.args.mr)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code(), "received unexpected error")
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetLatestMetricsByMarketRequest(t *testing.T) {
	createdAt := time.Now().In(time.UTC).AddDate(0, 0, -11)
	updatedAt := createdAt.AddDate(0, 0, 1)
	authContext := getContextWithAuth()
	noAuthContext := context.Background()

	goodStationUserResponse := StationUser{
		ID:        1,
		FirstName: "John",
		Email:     "john.doe@example.com",
		Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
		ProviderProfile: &StationProviderProfile{
			Position: providerPositionAPP,
		},
	}
	goodStationProvidersResponse := []StationProvider{
		{
			ID:                      1,
			FirstName:               "John",
			LastName:                "Doe",
			ProviderProfilePosition: &providerPositionAPP,
		},
	}

	provider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{
		SDKKey:         "dummy",
		DefaultUserKey: "dummy",
		LocalMode:      true,
	})
	if err != nil {
		t.Fatal(err)
	}
	provider.Start()
	err = provider.OverrideStruct(performanceHubSettingsStatsigKey, &performanceHubSettings{})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc                         string
		context                      context.Context
		input                        *clinicalkpipb.GetLatestMetricsByMarketRequest
		mockDB                       *mockClinicalKPIDB
		uninitializedStatsigProvider bool

		stationGetUserHTTPStatus        int
		stationGetUserHTTPResponse      *StationUser
		stationGetProvidersHTTPStatus   int
		stationGetProvidersHTTPResponse []StationProvider

		want                         *clinicalkpipb.GetLatestMetricsByMarketResponse
		wantStationProvidersRawQuery string
		wantGRPCCode                 codes.Code
	}{
		{
			desc:    "success - base case",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{
				getCalculatedMetricsForProvidersActiveAfterDateResult: []*clinicalkpisql.CalculatedProviderMetric{
					{
						ProviderID:                         1,
						CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
						AverageNetPromoterScore:            mockNetPromoterScore,
						AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
						ChartClosureRate:                   mockChartClosureRate,
						ChartClosureRateChange:             mockChartClosureRateChange,
						SurveyCaptureRate:                  mockSurveyCaptureRate,
						SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
						MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
						MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
						ChangeDays:                         mockChangeDays,
						LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
						CompletedCareRequests:              mockCompletedCareRequests,
						CreatedAt:                          createdAt,
						UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
					},
				},
				getActiveProvidersForMarketResult: []int64{1},
			},

			stationGetUserHTTPStatus:        http.StatusOK,
			stationGetUserHTTPResponse:      &goodStationUserResponse,
			stationGetProvidersHTTPStatus:   http.StatusOK,
			stationGetProvidersHTTPResponse: goodStationProvidersResponse,

			want: &clinicalkpipb.GetLatestMetricsByMarketResponse{
				ProviderMetrics: []*clinicalkpipb.ProviderMetrics{
					{
						Provider: &clinicalkpipb.Provider{
							Id:        1,
							FirstName: "John",
							LastName:  "Doe",
							Profile: &clinicalkpipb.ProviderProfile{
								Position: providerPositionAPP,
							},
						},
						Metrics: &clinicalkpipb.MetricsData{
							CareRequestsCompletedLastSevenDays: proto.Int32(mockCareRequestsCompletedLastSevenDays),
							AverageNetPromoterScore:            pgtypes.NumericToProtoFloat64(mockNetPromoterScore),
							AverageNetPromoterScoreChange:      pgtypes.NumericToProtoFloat64(mockNetPromoterScoreChange),
							ChartClosureRate:                   pgtypes.NumericToProtoFloat64(mockChartClosureRate),
							ChartClosureRateChange:             pgtypes.NumericToProtoFloat64(mockChartClosureRateChange),
							SurveyCaptureRate:                  pgtypes.NumericToProtoFloat64(mockSurveyCaptureRate),
							SurveyCaptureRateChange:            pgtypes.NumericToProtoFloat64(mockSurveyCaptureRateChange),
							MedianOnSceneTimeSecs:              proto.Int32(mockOnSceneTimeSecs.Int32),
							MedianOnSceneTimeSecsChange:        proto.Int32(mockOnSceneTimeSecsChange.Int32),
							ChangeDays:                         proto.Int32(mockChangeDays),
							LastCareRequestCompletedAt:         protoconv.TimeToProtoTimestamp(&mockLastCareRequestCompletedAt.Time),
							CompletedCareRequests:              proto.Int32(mockCompletedCareRequests),
							CreatedAt:                          protoconv.TimeToProtoTimestamp(&createdAt),
							UpdatedAt:                          protoconv.TimeToProtoTimestamp(&updatedAt),
							Status:                             clinicalkpipb.MetricsData_STATUS_OK,
						},
					},
				},
			},
			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.OK,
		},
		{
			desc:    "success - no providers active in market",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{
				getCalculatedMetricsForProvidersActiveAfterDateResult: []*clinicalkpisql.CalculatedProviderMetric{},
				getActiveProvidersForMarketResult:                     []int64{},
			},

			stationGetUserHTTPStatus:        http.StatusOK,
			stationGetUserHTTPResponse:      &goodStationUserResponse,
			stationGetProvidersHTTPStatus:   http.StatusOK,
			stationGetProvidersHTTPResponse: goodStationProvidersResponse,

			want:                         &clinicalkpipb.GetLatestMetricsByMarketResponse{},
			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.OK,
		},
		{
			desc:    "error - unable to get active provider markets",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{
				getCalculatedMetricsForProvidersActiveAfterDateResult: []*clinicalkpisql.CalculatedProviderMetric{
					{
						ProviderID:                         1,
						CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
						AverageNetPromoterScore:            mockNetPromoterScore,
						AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
						ChartClosureRate:                   mockChartClosureRate,
						ChartClosureRateChange:             mockChartClosureRateChange,
						SurveyCaptureRate:                  mockSurveyCaptureRate,
						SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
						MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
						MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
						ChangeDays:                         mockChangeDays,
						LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
						CompletedCareRequests:              mockCompletedCareRequests,
						CreatedAt:                          createdAt,
						UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
					},
				},
				getActiveProvidersForMarketErr: errors.New("test error"),
			},

			stationGetUserHTTPStatus:        http.StatusOK,
			stationGetUserHTTPResponse:      &goodStationUserResponse,
			stationGetProvidersHTTPStatus:   http.StatusOK,
			stationGetProvidersHTTPResponse: goodStationProvidersResponse,

			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.Internal,
		},
		{
			desc:    "error - unable to get performance hub settings from statsig",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{
				getCalculatedMetricsForProvidersActiveAfterDateResult: []*clinicalkpisql.CalculatedProviderMetric{
					{
						ProviderID:                         1,
						CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
						AverageNetPromoterScore:            mockNetPromoterScore,
						AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
						ChartClosureRate:                   mockChartClosureRate,
						ChartClosureRateChange:             mockChartClosureRateChange,
						SurveyCaptureRate:                  mockSurveyCaptureRate,
						SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
						MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
						MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
						ChangeDays:                         mockChangeDays,
						LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
						CompletedCareRequests:              mockCompletedCareRequests,
						CreatedAt:                          createdAt,
						UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
					},
				},
				getActiveProvidersForMarketResult: []int64{1},
			},
			uninitializedStatsigProvider: true,

			stationGetUserHTTPStatus:        http.StatusOK,
			stationGetUserHTTPResponse:      &goodStationUserResponse,
			stationGetProvidersHTTPStatus:   http.StatusOK,
			stationGetProvidersHTTPResponse: goodStationProvidersResponse,

			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.Internal,
		},
		{
			desc:    "error - unauthorized - no auth context",
			context: noAuthContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{},

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			desc:    "error - unauthorized - station returns unauthorized",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{},

			stationGetUserHTTPStatus: http.StatusUnauthorized,

			wantGRPCCode: codes.Unauthenticated,
		},
		{
			desc:    "error - internal - station returns internal",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{},

			stationGetUserHTTPStatus: http.StatusInternalServerError,

			wantGRPCCode: codes.Internal,
		},
		{
			desc:    "error - permission denied - current user has invalid provider profile position",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{},

			stationGetUserHTTPStatus: http.StatusOK,
			stationGetUserHTTPResponse: &StationUser{
				ID:        1,
				FirstName: "John",
				Email:     "john.doe@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
				ProviderProfile: &StationProviderProfile{
					Position: providerPositionVirtualDoctor,
				},
			},

			wantGRPCCode: codes.PermissionDenied,
		},
		{
			desc:    "error - invalid argument - MarketId not present",
			context: authContext,
			input:   &clinicalkpipb.GetLatestMetricsByMarketRequest{},
			mockDB:  &mockClinicalKPIDB{},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc:    "error - invalid argument - MarketId has wrong value",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: -3,
			},
			mockDB: &mockClinicalKPIDB{},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc:    "error - station providers request returns internal error",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{},

			stationGetUserHTTPStatus:      http.StatusOK,
			stationGetUserHTTPResponse:    &goodStationUserResponse,
			stationGetProvidersHTTPStatus: http.StatusInternalServerError,

			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.Internal,
		},
		{
			desc:    "error - database query error",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{
				getCalculatedMetricsForProvidersActiveAfterDateErr: errors.New("something went wrong"),
			},

			stationGetUserHTTPStatus:        http.StatusOK,
			stationGetUserHTTPResponse:      &goodStationUserResponse,
			stationGetProvidersHTTPStatus:   http.StatusOK,
			stationGetProvidersHTTPResponse: goodStationProvidersResponse,

			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.Internal,
		},
		{
			desc:    "error - database metrics response has unexpected provider id",
			context: authContext,
			input: &clinicalkpipb.GetLatestMetricsByMarketRequest{
				MarketId: 1,
			},
			mockDB: &mockClinicalKPIDB{
				getCalculatedMetricsForProvidersActiveAfterDateResult: []*clinicalkpisql.CalculatedProviderMetric{
					{
						ProviderID: 325,
					},
				},
			},

			stationGetUserHTTPStatus:        http.StatusOK,
			stationGetUserHTTPResponse:      &goodStationUserResponse,
			stationGetProvidersHTTPStatus:   http.StatusOK,
			stationGetProvidersHTTPResponse: goodStationProvidersResponse,

			wantStationProvidersRawQuery: "market_id=1&provider_profile_position=advanced+practice+provider",
			wantGRPCCode:                 codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					var httpStatus int
					var httpResponse any
					switch req.URL.Path {
					case "/api/users/user":
						httpStatus = tc.stationGetUserHTTPStatus
						httpResponse = tc.stationGetUserHTTPResponse
					case "/api/providers":
						httpStatus = tc.stationGetProvidersHTTPStatus
						httpResponse = tc.stationGetProvidersHTTPResponse
						testutils.MustMatch(t, tc.wantStationProvidersRawQuery, req.URL.RawQuery)
					default:
						t.Fatalf("Unexpected URL path: %s", req.URL.Path)
					}

					rw.WriteHeader(httpStatus)
					if httpResponse != nil {
						resp, err := json.Marshal(httpResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			stationClient := &station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}
			serverParams := gRPCServerParams{
				dbService:     tc.mockDB,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			}
			if !tc.uninitializedStatsigProvider {
				serverParams.statsigProvider = provider
			}
			grpcServer := NewGRPCServer(serverParams)
			resp, err := grpcServer.GetLatestMetricsByMarket(tc.context, tc.input)
			if status.Code(err) != tc.wantGRPCCode {
				t.Fatalf("got %s;  want %s", status.Code(err), tc.wantGRPCCode)
			}
			if resp != nil {
				testutils.MustMatch(t, len(tc.want.ProviderMetrics), len(resp.ProviderMetrics), "wrong number of results")
				for i := range resp.ProviderMetrics {
					testutils.MustMatch(t, tc.want.ProviderMetrics[i], resp.ProviderMetrics[i], "response does not match")
				}
			}
		})
	}
}

func TestGetAuthenticatedUser(t *testing.T) {
	type args struct {
		ctx context.Context
		mr  *clinicalkpipb.GetAuthenticatedUserRequest
	}
	tcs := []struct {
		name          string
		args          args
		mockDBService *mockClinicalKPIDB

		stationHTTPStatus   int
		stationHTTPResponse StationUser

		want         *clinicalkpipb.GetAuthenticatedUserResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success: returns authenticated user",
			args: args{
				ctx: getContextWithAuth(),
			},
			mockDBService: &mockClinicalKPIDB{
				getActiveMarketsForProviderResult: []int64{1},
			},

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: StationUser{
				ID:        123,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetAuthenticatedUserResponse{
				User: &clinicalkpipb.User{
					Id:        123,
					FirstName: "John",
					Email:     "john.wayne@example.com",
					Markets:   []*clinicalkpipb.Market{{Id: 1, Name: "Denver", ShortName: "DEN"}},
				},
			},
		},
		{
			name: "success: user not active in markets",
			args: args{
				ctx: getContextWithAuth(),
			},
			mockDBService: &mockClinicalKPIDB{
				getActiveMarketsForProviderResult: []int64{},
			},

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: StationUser{
				ID:        123,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetAuthenticatedUserResponse{
				User: &clinicalkpipb.User{
					Id:        123,
					FirstName: "John",
					Email:     "john.wayne@example.com",
					Markets:   []*clinicalkpipb.Market{},
				},
			},
		},
		{
			name: "failure: unable to get active markets",
			args: args{
				ctx: getContextWithAuth(),
			},
			mockDBService: &mockClinicalKPIDB{
				getActiveMarketsForProviderErr: errors.New("test error"),
			},

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: StationUser{
				ID:        123,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure: unable to get user markets",
			args: args{
				ctx: context.Background(),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure: user JWT is not present in context",
			args: args{
				ctx: context.Background(),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure: empty JWT",
			args: args{
				ctx: metadata.NewIncomingContext(
					context.Background(),
					metadata.Pairs("authorization", ""),
				),
			},

			wantGRPCCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()
			stationClient := &station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}
			s := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})
			resp, err := s.GetAuthenticatedUser(tc.args.ctx, tc.args.mr)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code(), "received unexpected error")
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestProcessStagingRecords(t *testing.T) {
	authContext := getContextWithAuth()
	noAuthContext := context.Background()
	tcs := []struct {
		desc    string
		input   *clinicalkpipb.ProcessStagingRecordsRequest
		mockDB  *mockClinicalKPIDB
		context context.Context

		stationHTTPStatus   int
		stationHTTPResponse []StationProvider

		wantErr bool
		want    *clinicalkpipb.ProcessStagingRecordsResponse
	}{
		{
			desc: "success - base case",
			input: &clinicalkpipb.ProcessStagingRecordsRequest{
				TableName: "staging_provider_metrics",
			},
			mockDB: &mockClinicalKPIDB{
				processStagingRecordsErr: nil,
			},
			context: authContext,

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:        1,
					FirstName: "John",
					LastName:  "Doe",
				},
			},

			wantErr: false,
			want:    &clinicalkpipb.ProcessStagingRecordsResponse{},
		},
		{
			desc:  "failed - error occurs in processing",
			input: &clinicalkpipb.ProcessStagingRecordsRequest{},
			mockDB: &mockClinicalKPIDB{
				processStagingRecordsErr: errors.New("error"),
			},
			context: authContext,

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:        1,
					FirstName: "John",
					LastName:  "Doe",
				},
			},

			wantErr: true,
			want:    nil,
		},
		{
			desc:  "failed - unauthorized - no auth context",
			input: &clinicalkpipb.ProcessStagingRecordsRequest{},
			mockDB: &mockClinicalKPIDB{
				processStagingRecordsErr: errors.New("error"),
			},
			context: noAuthContext,

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:        1,
					FirstName: "John",
					LastName:  "Doe",
				},
			},

			wantErr: true,
			want:    nil,
		},
		{
			desc:  "failed - unauthorized - station returns unauthenticated",
			input: &clinicalkpipb.ProcessStagingRecordsRequest{},
			mockDB: &mockClinicalKPIDB{
				processStagingRecordsErr: errors.New("error"),
			},
			context: authContext,

			stationHTTPStatus: http.StatusUnauthorized,

			wantErr: true,
			want:    nil,
		},
		{
			desc:  "failed - unauthorized - station returns unauthenticated",
			input: &clinicalkpipb.ProcessStagingRecordsRequest{},
			mockDB: &mockClinicalKPIDB{
				processStagingRecordsErr: errors.New("error"),
			},
			context: authContext,

			stationHTTPStatus: http.StatusUnauthorized,

			wantErr: true,
			want:    nil,
		},
		{
			desc:  "failed - station returns internal server error",
			input: &clinicalkpipb.ProcessStagingRecordsRequest{},
			mockDB: &mockClinicalKPIDB{
				processStagingRecordsErr: errors.New("error"),
			},
			context: authContext,

			stationHTTPStatus: http.StatusInternalServerError,

			wantErr: true,
			want:    nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			stationClient := &station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}
			s := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDB,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})

			got, err := s.ProcessStagingRecords(tc.context, tc.input)
			if err != nil && !tc.wantErr {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.want, got, "response doesn't match expected")
		})
	}
}

func TestListProviderShifts(t *testing.T) {
	dateNow := time.Now()
	timeOfDay := &common.TimeOfDay{
		Hours:   int32(dateNow.Hour()),
		Minutes: int32(dateNow.Minute()),
		Seconds: int32(dateNow.Second()),
		Nanos:   int32(dateNow.Nanosecond()),
	}
	getProviderShiftsResult := &clinicalkpidb.GetProviderShiftsResponse{
		Rows: []*clinicalkpisql.GetProviderShiftsRow{
			{
				ShiftTeamID:               1,
				ProviderID:                2,
				ServiceDate:               dateNow,
				StartTime:                 dateNow,
				EndTime:                   dateNow,
				PatientsSeen:              sql.NullInt32{Valid: true, Int32: 3},
				OutTheDoorDurationSeconds: sql.NullInt32{Valid: true, Int32: 4},
				EnRouteDurationSeconds:    sql.NullInt32{Valid: true, Int32: 5},
				OnSceneDurationSeconds:    sql.NullInt32{Valid: true, Int32: 6},
				OnBreakDurationSeconds:    sql.NullInt32{Valid: true, Int32: 7},
				IdleDurationSeconds:       sql.NullInt32{Valid: true, Int32: 8},
			},
		},
		Total: 1,
	}

	tcs := []struct {
		name          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.ListProviderShiftsRequest

		want         *clinicalkpipb.ListProviderShiftsResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "should return the provider shifts",
			mockDBService: &mockClinicalKPIDB{
				getProviderShiftsResult: getProviderShiftsResult,
				getProviderShiftsError:  nil,
			},
			input: &clinicalkpipb.ListProviderShiftsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderShiftsResponse{
				ProviderShifts: []*clinicalkpipb.ProviderShift{
					{
						ShiftTeamId: 1,
						ProviderId:  2,
						ServiceDate: &common.Date{
							Year:  int32(dateNow.Year()),
							Month: int32(dateNow.Month()),
							Day:   int32(dateNow.Day()),
						},
						StartTime:                 timeOfDay,
						EndTime:                   timeOfDay,
						PatientsSeen:              proto.Int32(3),
						OutTheDoorDurationSeconds: proto.Int32(4),
						EnRouteDurationSeconds:    proto.Int32(5),
						OnSceneDurationSeconds:    proto.Int32(6),
						OnBreakDurationSeconds:    proto.Int32(7),
						IdleDurationSeconds:       proto.Int32(8),
					},
				},
				Pagination: &clinicalkpipb.Pagination{
					Total:      1,
					Page:       1,
					TotalPages: 1,
				},
			},
		},
		{
			name: "should return nil when provider id is invalid",
			mockDBService: &mockClinicalKPIDB{
				getProviderShiftsResult: getProviderShiftsResult,
			},
			input: &clinicalkpipb.ListProviderShiftsRequest{ProviderId: 0},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			name: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getProviderShiftsResult: nil,
				getProviderShiftsError:  errors.New("DB error"),
			},
			input: &clinicalkpipb.ListProviderShiftsRequest{ProviderId: 1},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			name: "should return an empty array if there is no records in DB",
			mockDBService: &mockClinicalKPIDB{
				getProviderShiftsResult: &clinicalkpidb.GetProviderShiftsResponse{
					Rows:  []*clinicalkpisql.GetProviderShiftsRow{},
					Total: 0,
				},
				getProviderShiftsError: nil,
			},
			input: &clinicalkpipb.ListProviderShiftsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderShiftsResponse{
				ProviderShifts: []*clinicalkpipb.ProviderShift{},
				Pagination: &clinicalkpipb.Pagination{
					Total:      0,
					Page:       1,
					TotalPages: 0,
				},
			},
		},
		{
			name: "should return an empty array if DB responded with nil",
			mockDBService: &mockClinicalKPIDB{
				getProviderShiftsResult: &clinicalkpidb.GetProviderShiftsResponse{
					Rows:  nil,
					Total: 0,
				},
				getProviderShiftsError: nil,
			},
			input: &clinicalkpipb.ListProviderShiftsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderShiftsResponse{
				ProviderShifts: []*clinicalkpipb.ProviderShift{},
				Pagination: &clinicalkpipb.Pagination{
					Total:      0,
					Page:       1,
					TotalPages: 0,
				},
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			params := gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			}

			grpcServer := NewGRPCServer(params)
			resp, err := grpcServer.ListProviderShifts(context.Background(), tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetMarketOverallMetrics(t *testing.T) {
	getMarketMetricsResult := &clinicalkpisql.GetMarketMetricsRow{
		MarketID:                     1,
		OnSceneTimeMedianSeconds:     sqltypes.ToValidNullInt32(2),
		OnSceneTimeWeekChangeSeconds: sqltypes.ToValidNullInt32(3),
		ChartClosureRate:             sqltypes.ToValidNullFloat64(4),
		ChartClosureRateWeekChange:   sqltypes.ToValidNullFloat64(5),
		SurveyCaptureRate:            sqltypes.ToValidNullFloat64(6),
		SurveyCaptureRateWeekChange:  sqltypes.ToValidNullFloat64(7),
		NetPromoterScoreAverage:      sqltypes.ToValidNullFloat64(8),
		NetPromoterScoreWeekChange:   sqltypes.ToValidNullFloat64(9),
		MarketName:                   sqltypes.ToValidNullString("Denver"),
		MarketShortName:              sqltypes.ToValidNullString("DEN"),
	}

	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.GetMarketOverallMetricsRequest

		want         *clinicalkpipb.GetMarketOverallMetricsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should return the market metrics",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: getMarketMetricsResult,
				getMarketMetricsError:  nil,
			},
			input: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetMarketOverallMetricsResponse{
				MarketMetrics: &clinicalkpipb.MarketMetrics{
					MarketId:                     1,
					OnSceneTimeMedianSeconds:     proto.Int32(2),
					OnSceneTimeWeekChangeSeconds: proto.Int32(3),
					ChartClosureRate:             proto.Float64(4),
					ChartClosureRateWeekChange:   proto.Float64(5),
					SurveyCaptureRate:            proto.Float64(6),
					SurveyCaptureRateWeekChange:  proto.Float64(7),
					NetPromoterScoreAverage:      proto.Float64(8),
					NetPromoterScoreWeekChange:   proto.Float64(9),
				},
				Market: &clinicalkpipb.Market{
					Id:        1,
					Name:      "Denver",
					ShortName: "DEN",
				},
			},
		},
		{
			desc: "should return an empty object if there is no market metrics in DB",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: &clinicalkpisql.GetMarketMetricsRow{},
				getMarketMetricsError:  nil,
			},
			input: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: 1},

			wantGRPCCode: codes.OK,
			want:         &clinicalkpipb.GetMarketOverallMetricsResponse{},
		},
		{
			desc: "should return an empty object if nil is returned from DB",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: nil,
				getMarketMetricsError:  nil,
			},
			input: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: 1},

			wantGRPCCode: codes.OK,
			want:         &clinicalkpipb.GetMarketOverallMetricsResponse{},
		},
		{
			desc: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: nil,
				getMarketMetricsError:  errors.New("DB service error"),
			},
			input: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: 1},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			desc: "should return NotFound error",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: nil,
				getMarketMetricsError:  clinicalkpidb.ErrMarketMetricsNotFound,
			},
			input: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: 1},

			wantGRPCCode: codes.NotFound,
			want:         nil,
		},
		{
			desc: "should return nil when MarketId is 0",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: getMarketMetricsResult,
				getMarketMetricsError:  nil,
			},
			input: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: 0},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return nil when no MarketId was set",
			mockDBService: &mockClinicalKPIDB{
				getMarketMetricsResult: getMarketMetricsResult,
				getMarketMetricsError:  nil,
			},
			input: nil,

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			})
			resp, err := grpcServer.GetMarketOverallMetrics(context.Background(), tc.input)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetProviderOverallMetrics(t *testing.T) {
	getProviderOverallMetricsResult := &clinicalkpisql.GetProviderMetricsRow{
		ProviderID:               1,
		OnSceneTimeMedianSeconds: sqltypes.ToValidNullInt32(1),
		ChartClosureRate:         sqltypes.ToValidNullFloat64(2),
		SurveyCaptureRate:        sqltypes.ToValidNullFloat64(3),
		NetPromoterScoreAverage:  sqltypes.ToValidNullFloat64(4),
		OnTaskPercent:            sqltypes.ToValidNullFloat64(5),
		EscalationRate:           sqltypes.ToValidNullFloat64(6),
		AbxPrescribingRate:       sqltypes.ToValidNullFloat64(7),
		Provider: clinicalkpisql.Provider{
			ProviderID: 1,
			FirstName:  "John",
			LastName:   "Doe",
			JobTitle:   "APP",
		},
	}

	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.GetProviderOverallMetricsRequest

		want         *clinicalkpipb.GetProviderOverallMetricsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should return provider metrics",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsResult: getProviderOverallMetricsResult,
				getProviderMetricsError:  nil,
			},
			input: &clinicalkpipb.GetProviderOverallMetricsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetProviderOverallMetricsResponse{
				ProviderMetrics: &clinicalkpipb.OverallProviderMetrics{
					ProviderId:               1,
					OnSceneTimeMedianSeconds: proto.Int32(1),
					ChartClosureRate:         proto.Float64(2),
					SurveyCaptureRate:        proto.Float64(3),
					NetPromoterScoreAverage:  proto.Float64(4),
					OnTaskPercent:            proto.Float64(5),
					EscalationRate:           proto.Float64(6),
					AbxPrescribingRate:       proto.Float64(7),
					Provider: &clinicalkpipb.Provider{
						Id:        1,
						FirstName: "John",
						LastName:  "Doe",
						Profile: &clinicalkpipb.ProviderProfile{
							Position: "APP",
						},
					},
				},
			},
		},
		{
			desc: "should return nil when ProviderId is 0",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsResult: getProviderOverallMetricsResult,
				getProviderMetricsError:  nil,
			},
			input: &clinicalkpipb.GetProviderOverallMetricsRequest{ProviderId: 0},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsResult: nil,
				getProviderMetricsError:  errors.New("DB error"),
			},
			input: &clinicalkpipb.GetProviderOverallMetricsRequest{ProviderId: 1},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			desc: "should return NotFound error",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsResult: nil,
				getProviderMetricsError:  clinicalkpidb.ErrProviderMetricsNotFound,
			},
			input: &clinicalkpipb.GetProviderOverallMetricsRequest{ProviderId: 1},

			wantGRPCCode: codes.NotFound,
			want:         nil,
		},
		{
			desc: "should return nil when no ProviderId",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsResult: getProviderOverallMetricsResult,
				getProviderMetricsError:  nil,
			},
			input: nil,

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			})
			resp, err := grpcServer.GetProviderOverallMetrics(context.Background(), tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListProviderVisits(t *testing.T) {
	dateNow := time.Now()
	getProviderVisitsResultRows := []*clinicalkpisql.ProviderVisit{
		{
			ProviderID:       1,
			CareRequestID:    1,
			PatientFirstName: "John",
			PatientLastName:  "Doe",
			PatientAthenaID:  "123456",
			ServiceDate:      dateNow,
			ChiefComplaint:   sql.NullString{Valid: true, String: "complaint"},
			Diagnosis:        sql.NullString{Valid: true, String: "diagnosis"},
			IsAbxPrescribed:  true,
			AbxDetails:       sql.NullString{Valid: true, String: "abx details"},
			IsEscalated:      true,
			EscalatedReason:  sql.NullString{Valid: true, String: "escalated reason"},
		},
	}

	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.ListProviderVisitsRequest

		want         *clinicalkpipb.ListProviderVisitsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should return the provider visits",
			mockDBService: &mockClinicalKPIDB{
				getProviderVisitsResult: &clinicalkpidb.GetProviderVisitsResponse{
					Rows:  getProviderVisitsResultRows,
					Total: 1,
				},
				getProviderVisitsError: nil,
			},
			input: &clinicalkpipb.ListProviderVisitsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderVisitsResponse{
				ProviderVisits: []*clinicalkpipb.ProviderVisit{
					{
						ProviderId:       1,
						CareRequestId:    1,
						PatientFirstName: "John",
						PatientLastName:  "Doe",
						PatientAthenaId:  "123456",
						ServiceDate: &common.Date{
							Year:  int32(dateNow.Year()),
							Month: int32(dateNow.Month()),
							Day:   int32(dateNow.Day()),
						},
						ChiefComplaint:  proto.String("complaint"),
						Diagnosis:       proto.String("diagnosis"),
						IsAbxPrescribed: true,
						AbxDetails:      proto.String("abx details"),
						IsEscalated:     true,
						EscalatedReason: proto.String("escalated reason"),
					},
				},
				Pagination: &clinicalkpipb.Pagination{
					Total:      1,
					Page:       1,
					TotalPages: 1,
				},
			},
		},
		{
			desc: "should should calculate pagination correctly",
			mockDBService: &mockClinicalKPIDB{
				getProviderVisitsResult: &clinicalkpidb.GetProviderVisitsResponse{
					Rows:  getProviderVisitsResultRows,
					Total: 7,
				},
				getProviderVisitsError: nil,
			},
			input: &clinicalkpipb.ListProviderVisitsRequest{ProviderId: 1, PerPage: 2},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderVisitsResponse{
				ProviderVisits: []*clinicalkpipb.ProviderVisit{
					{
						ProviderId:       1,
						CareRequestId:    1,
						PatientFirstName: "John",
						PatientLastName:  "Doe",
						PatientAthenaId:  "123456",
						ServiceDate: &common.Date{
							Year:  int32(dateNow.Year()),
							Month: int32(dateNow.Month()),
							Day:   int32(dateNow.Day()),
						},
						ChiefComplaint:  proto.String("complaint"),
						Diagnosis:       proto.String("diagnosis"),
						IsAbxPrescribed: true,
						AbxDetails:      proto.String("abx details"),
						IsEscalated:     true,
						EscalatedReason: proto.String("escalated reason"),
					},
				},
				Pagination: &clinicalkpipb.Pagination{
					Total:      7,
					Page:       1,
					TotalPages: 4,
				},
			},
		},
		{
			desc: "should return nil when ProviderId is missing",
			mockDBService: &mockClinicalKPIDB{
				getProviderVisitsResult: &clinicalkpidb.GetProviderVisitsResponse{
					Rows:  getProviderVisitsResultRows,
					Total: 1,
				},
				getProviderVisitsError: nil,
			},
			input: &clinicalkpipb.ListProviderVisitsRequest{ProviderId: 0},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getProviderVisitsResult: nil,
				getProviderVisitsError:  errors.New("DB error"),
			},
			input: &clinicalkpipb.ListProviderVisitsRequest{ProviderId: 1},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			desc: "should return an empty array if there is no records in DB",
			mockDBService: &mockClinicalKPIDB{
				getProviderVisitsResult: &clinicalkpidb.GetProviderVisitsResponse{
					Rows:  []*clinicalkpisql.ProviderVisit{},
					Total: 0,
				},
				getProviderVisitsError: nil,
			},
			input: &clinicalkpipb.ListProviderVisitsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderVisitsResponse{
				ProviderVisits: []*clinicalkpipb.ProviderVisit{},
				Pagination: &clinicalkpipb.Pagination{
					Total:      0,
					Page:       1,
					TotalPages: 0,
				},
			},
		},
		{
			desc: "should return an empty array if DB responded with nil",
			mockDBService: &mockClinicalKPIDB{
				getProviderVisitsResult: &clinicalkpidb.GetProviderVisitsResponse{
					Rows:  nil,
					Total: 0,
				},
				getProviderVisitsError: nil,
			},
			input: &clinicalkpipb.ListProviderVisitsRequest{ProviderId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderVisitsResponse{
				ProviderVisits: []*clinicalkpipb.ProviderVisit{},
				Pagination: &clinicalkpipb.Pagination{
					Total:      0,
					Page:       1,
					TotalPages: 0,
				},
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			params := gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			}

			grpcServer := NewGRPCServer(params)
			resp, err := grpcServer.ListProviderVisits(context.Background(), tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListProvidersMetricsByMarket(t *testing.T) {
	createdAt := time.Now()
	id := time.Now().UnixNano()
	avatarURL := "url"
	jobTitle := "app"
	firstName := "Ben"
	lastName := "Sahar"

	logger := zap.NewNop().Sugar()
	stationClient := &station.Client{}

	numericValue, _ := pgtypes.BuildNumeric(int32(1))

	getProvidersMetricsByMarketResult := &clinicalkpidb.GetProvidersMetricsByMarketResponse{
		Rows: []*clinicalkpisql.GetProvidersMetricsByMarketRow{
			{
				ProviderID:                   1,
				MarketID:                     1,
				OnSceneTimeMedianSeconds:     sql.NullInt32{Int32: 1, Valid: true},
				OnSceneTimeWeekChangeSeconds: sql.NullInt32{Int32: 1, Valid: true},
				ChartClosureRate:             numericValue,
				ChartClosureRateWeekChange:   numericValue,
				SurveyCaptureRate:            numericValue,
				SurveyCaptureRateWeekChange:  numericValue,
				NetPromoterScoreAverage:      numericValue,
				NetPromoterScoreWeekChange:   numericValue,
				OnTaskPercent:                numericValue,
				OnTaskPercentWeekChange:      numericValue,
				OnSceneTimeRank:              1,
				ChartClosureRateRank:         1,
				SurveyCaptureRateRank:        1,
				NetPromoterScoreRank:         1,
				OnTaskPercentRank:            1,
				Provider: clinicalkpisql.Provider{
					ID:         id + 2,
					ProviderID: 1,
					FirstName:  firstName,
					LastName:   lastName,
					AvatarUrl:  sql.NullString{String: avatarURL, Valid: true},
					JobTitle:   jobTitle,
					CreatedAt:  createdAt,
				},
				Count: 1,
			},
		},
		Total: 16,
	}

	marketProviderMetricsResult := []*clinicalkpipb.MarketProviderMetricsListItem{
		{
			MarketId:                     1,
			ProviderId:                   1,
			OnSceneTimeMedianSeconds:     proto.Int32(1),
			OnSceneTimeWeekChangeSeconds: proto.Int32(1),
			OnSceneTimeRank:              proto.Int64(1),
			ChartClosureRate:             proto.Float64(1),
			ChartClosureRateWeekChange:   proto.Float64(1),
			ChartClosureRateRank:         proto.Int64(1),
			SurveyCaptureRate:            proto.Float64(1),
			SurveyCaptureRateWeekChange:  proto.Float64(1),
			SurveyCaptureRateRank:        proto.Int64(1),
			NetPromoterScoreAverage:      proto.Float64(1),
			NetPromoterScoreWeekChange:   proto.Float64(1),
			NetPromoterScoreRank:         proto.Int64(1),
			OnTaskPercent:                proto.Float64(1),
			OnTaskPercentWeekChange:      proto.Float64(1),
			OnTaskPercentRank:            proto.Int64(1),
			Provider: &clinicalkpipb.Provider{
				Id:        1,
				FirstName: "Ben",
				LastName:  "Sahar",
				AvatarUrl: &avatarURL,
				Profile: &clinicalkpipb.ProviderProfile{
					Position:    "app",
					Credentials: "",
				},
			},
		},
	}

	tcs := []struct {
		name          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.ListProviderMetricsByMarketRequest

		want         *clinicalkpipb.ListProviderMetricsByMarketResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "should return market providers metrics",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: getProvidersMetricsByMarketResult,
				getProvidersMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{
				MarketId: 1,
				Page:     defaultPage,
				PerPage:  defaultPageSize,
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMetricsByMarketResponse{
				MarketProviderMetrics: marketProviderMetricsResult,
				Pagination: &clinicalkpipb.Pagination{
					Total:      16,
					Page:       1,
					TotalPages: 2,
				},
			},
		},
		{
			name: "should return market providers metrics if there is no records in DB",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: &clinicalkpidb.GetProvidersMetricsByMarketResponse{
					Rows:  []*clinicalkpisql.GetProvidersMetricsByMarketRow{},
					Total: 0,
				},
				getProvidersMetricsByMarketError: nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{
				MarketId: 1,
				Page:     defaultPage,
				PerPage:  defaultPageSize,
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMetricsByMarketResponse{
				MarketProviderMetrics: []*clinicalkpipb.MarketProviderMetricsListItem{},
				Pagination: &clinicalkpipb.Pagination{
					Total:      0,
					Page:       1,
					TotalPages: 0,
				},
			},
		},
		{
			name: "should return market providers metrics if page is 0",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: getProvidersMetricsByMarketResult,
				getProvidersMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{
				MarketId: 1,
				PerPage:  defaultPageSize,
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMetricsByMarketResponse{
				MarketProviderMetrics: marketProviderMetricsResult,
				Pagination: &clinicalkpipb.Pagination{
					Total:      16,
					Page:       1,
					TotalPages: 2,
				},
			},
		},
		{
			name: "should return market providers metrics if per page is 0",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: getProvidersMetricsByMarketResult,
				getProvidersMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{
				MarketId: 1,
				Page:     defaultPage,
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMetricsByMarketResponse{
				MarketProviderMetrics: marketProviderMetricsResult,
				Pagination: &clinicalkpipb.Pagination{
					Total:      16,
					Page:       1,
					TotalPages: 2,
				},
			},
		},
		{
			name: "should return market providers metrics 5 items per page",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: getProvidersMetricsByMarketResult,
				getProvidersMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{
				MarketId: 1,
				PerPage:  5,
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMetricsByMarketResponse{
				MarketProviderMetrics: marketProviderMetricsResult,
				Pagination: &clinicalkpipb.Pagination{
					Total:      16,
					Page:       1,
					TotalPages: 4,
				},
			},
		},
		{
			name: "should return second page of market providers metrics",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: getProvidersMetricsByMarketResult,
				getProvidersMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{
				MarketId: 1,
				Page:     2,
			},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMetricsByMarketResponse{
				MarketProviderMetrics: marketProviderMetricsResult,
				Pagination: &clinicalkpipb.Pagination{
					Total:      16,
					Page:       2,
					TotalPages: 2,
				},
			},
		},
		{
			name: "should return error when MarketId is 0",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: getProvidersMetricsByMarketResult,
				getProvidersMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{MarketId: 0, SortBy: 0, SearchText: &lastName, ProviderJobTitle: &jobTitle, Page: defaultPage, PerPage: defaultPageSize},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			name: "should return error from DB",
			mockDBService: &mockClinicalKPIDB{
				getProvidersMetricsByMarketResult: nil,
				getProvidersMetricsByMarketError:  errors.New("DB error"),
			},
			input: &clinicalkpipb.ListProviderMetricsByMarketRequest{MarketId: 1, SortBy: 0, SearchText: &lastName, ProviderJobTitle: &jobTitle, Page: defaultPage, PerPage: defaultPageSize},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        logger,
			})
			resp, err := grpcServer.ListProviderMetricsByMarket(context.Background(), tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetProviderMetricsByMarket(t *testing.T) {
	numericValue, _ := pgtypes.BuildNumeric(int32(5))

	marketProviderMetricsResult := &clinicalkpisql.GetProviderMetricsByMarketRow{
		MarketID:                     1,
		ProviderID:                   2,
		OnSceneTimeMedianSeconds:     sqltypes.ToValidNullInt32(3),
		OnSceneTimeWeekChangeSeconds: sqltypes.ToValidNullInt32(4),
		ChartClosureRate:             numericValue,
		ChartClosureRateWeekChange:   numericValue,
		SurveyCaptureRate:            numericValue,
		SurveyCaptureRateWeekChange:  numericValue,
		NetPromoterScoreAverage:      numericValue,
		NetPromoterScoreWeekChange:   numericValue,
		OnTaskPercent:                numericValue,
		OnTaskPercentWeekChange:      numericValue,
		OnSceneTimeRank:              6,
		ChartClosureRateRank:         7,
		SurveyCaptureRateRank:        8,
		NetPromoterScoreRank:         9,
		OnTaskPercentRank:            10,
		TotalProviders:               20,
	}

	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.GetProviderMetricsByMarketRequest

		want         *clinicalkpipb.GetProviderMetricsByMarketResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should return market providers metrics",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: marketProviderMetricsResult,
				getProviderMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 2, MarketId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetProviderMetricsByMarketResponse{
				MarketProviderMetrics: &clinicalkpipb.MarketProviderMetrics{
					MarketId:                     1,
					ProviderId:                   2,
					OnSceneTimeMedianSeconds:     proto.Int32(3),
					OnSceneTimeWeekChangeSeconds: proto.Int32(4),
					OnSceneTimeRank:              proto.Int64(6),
					ChartClosureRate:             proto.Float64(5),
					ChartClosureRateWeekChange:   proto.Float64(5),
					ChartClosureRateRank:         proto.Int64(7),
					SurveyCaptureRate:            proto.Float64(5),
					SurveyCaptureRateWeekChange:  proto.Float64(5),
					SurveyCaptureRateRank:        proto.Int64(8),
					NetPromoterScoreAverage:      proto.Float64(5),
					NetPromoterScoreWeekChange:   proto.Float64(5),
					NetPromoterScoreRank:         proto.Int64(9),
					OnTaskPercent:                proto.Float64(5),
					OnTaskPercentWeekChange:      proto.Float64(5),
					OnTaskPercentRank:            proto.Int64(10),
					TotalProviders:               20,
				},
			},
		},
		{
			desc: "should return an empty market provider metrics if there is no metrics in DB",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: &clinicalkpisql.GetProviderMetricsByMarketRow{},
				getProviderMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 1, MarketId: 1},

			wantGRPCCode: codes.OK,
			want:         &clinicalkpipb.GetProviderMetricsByMarketResponse{},
		},
		{
			desc: "should return an empty object if nil is returned from DB",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: nil,
				getProviderMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 1, MarketId: 1},

			wantGRPCCode: codes.OK,
			want:         &clinicalkpipb.GetProviderMetricsByMarketResponse{},
		},
		{
			desc: "should return nil when MarketId is 0",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: marketProviderMetricsResult,
				getProviderMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 1, MarketId: 0},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return nil when ProviderID is 0",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: marketProviderMetricsResult,
				getProviderMetricsByMarketError:  nil,
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 0, MarketId: 1},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: nil,
				getProviderMetricsByMarketError:  errors.New("DB error"),
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 1, MarketId: 1},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			desc: "should return NotFound error",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: nil,
				getProviderMetricsByMarketError:  clinicalkpidb.ErrProviderMetricsByMarketNotFound,
			},
			input: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: 1, MarketId: 1},

			wantGRPCCode: codes.NotFound,
			want:         nil,
		},
		{
			desc: "should return nil when no ProviderId and MarketId was set",
			mockDBService: &mockClinicalKPIDB{
				getProviderMetricsByMarketResult: marketProviderMetricsResult,
				getProviderMetricsByMarketError:  nil,
			},
			input: nil,

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			})
			resp, err := grpcServer.GetProviderMetricsByMarket(context.Background(), tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListShiftSnapshots(t *testing.T) {
	dateNow := time.Now()
	timeOfDay := timestamppb.New(dateNow)
	phase := "phase"
	getShiftSnapshotResult := []*clinicalkpisql.GetShiftSnapshotsRow{
		{
			ShiftTeamID:              1,
			StartTimestamp:           dateNow,
			EndTimestamp:             dateNow,
			ShiftSnapshotPhaseTypeID: 1,
			LatitudeE6:               sql.NullInt32{Valid: true, Int32: 1},
			LongitudeE6:              sql.NullInt32{Valid: true, Int32: 1},
			Phase: sql.NullString{
				String: phase,
				Valid:  true,
			},
		},
	}

	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.ListShiftSnapshotsRequest

		want         *clinicalkpipb.ListShiftSnapshotsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should return the shift snapshots",
			mockDBService: &mockClinicalKPIDB{
				getShiftSnapshotsResult: getShiftSnapshotResult,
				getShiftSnapshotsError:  nil,
			},
			input: &clinicalkpipb.ListShiftSnapshotsRequest{ShiftTeamId: 1},

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListShiftSnapshotsResponse{
				ShiftSnapshots: []*clinicalkpipb.ShiftSnapshot{
					{
						ShiftTeamId:    proto.Int64(1),
						StartTimestamp: timeOfDay,
						EndTimestamp:   timeOfDay,
						Phase:          phase,
						LatitudeE6:     proto.Int32(1),
						LongitudeE6:    proto.Int32(1),
					},
				},
			},
		},
		{
			desc: "should return nil when shift team ID is 0",
			mockDBService: &mockClinicalKPIDB{
				getShiftSnapshotsResult: getShiftSnapshotResult,
			},
			input: &clinicalkpipb.ListShiftSnapshotsRequest{ShiftTeamId: 0},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getShiftSnapshotsResult: nil,
				getShiftSnapshotsError:  errors.New("DB error"),
			},
			input: &clinicalkpipb.ListShiftSnapshotsRequest{ShiftTeamId: 1},

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			desc: "should return nil when there is no ShiftTeamID",
			mockDBService: &mockClinicalKPIDB{
				getShiftSnapshotsResult: getShiftSnapshotResult,
				getShiftSnapshotsError:  nil,
			},
			input: nil,

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			})

			resp, err := grpcServer.ListShiftSnapshots(context.Background(), tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code(), "received unexpected error")
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestGetProviderLookBack(t *testing.T) {
	now := time.Now()
	today := clinicalkpiconv.TimestampToDate(now)
	yesterday := today.AddDate(0, 0, -1)
	averagePatientsSeenYesterday, _ := pgtypes.BuildNumeric(7.4)
	averagePatientsSeenToday, _ := pgtypes.BuildNumeric(4.9)
	averageOnShiftDurationSecondsYesterday, _ := pgtypes.BuildNumeric(32400)
	averageOnShiftDurationSecondsToday, _ := pgtypes.BuildNumeric(21600)
	enRouteStartTime := yesterday.Add(8 * time.Hour)
	enRouteEndTime := enRouteStartTime.Add(1 * time.Hour)
	onSceneStartTime := enRouteEndTime.Add(5 * time.Minute)
	onSceneEndTime := onSceneStartTime.Add(44 * time.Minute)
	onBreakStartTime := onSceneEndTime.Add(7 * time.Minute)
	onBreakEndTime := onBreakStartTime.Add(30 * time.Minute)
	enRoutePhaseID := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute.PhaseTypeID()
	onScenePhaseID := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene.PhaseTypeID()
	onBreakPhaseID := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak.PhaseTypeID()
	enRouteShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute.String()
	onSceneShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene.String()
	onBreakShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak.String()

	stationUser := StationUser{
		ID:        12,
		FirstName: "John",
		Email:     "john.wayne@example.com",
		Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
	}
	tcs := []struct {
		name          string
		mockDBService *mockClinicalKPIDB
		req           *clinicalkpipb.GetProviderLookBackRequest

		stationHTTPStatus   int
		stationHTTPResponse StationUser

		want         *clinicalkpipb.GetProviderLookBackResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "should return provider look back",
			mockDBService: &mockClinicalKPIDB{
				getProviderDailyMetricsWithMarketGroupAveragesFromDateResult: []*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
					{
						ProviderID:                               12,
						ServiceDate:                              yesterday,
						MarketGroupID:                            1,
						MarketGroupName:                          "Dallas",
						PatientsSeen:                             7,
						MarketGroupAveragePatientsSeen:           averagePatientsSeenYesterday,
						MarketGroupAverageOnShiftDurationSeconds: averageOnShiftDurationSecondsYesterday,
					},
					{
						ProviderID:                               12,
						ServiceDate:                              today,
						MarketGroupID:                            1,
						MarketGroupName:                          "Dallas",
						PatientsSeen:                             5,
						MarketGroupAveragePatientsSeen:           averagePatientsSeenToday,
						MarketGroupAverageOnShiftDurationSeconds: averageOnShiftDurationSecondsToday,
					},
				},
				getLastShiftSnapshotsResult: []*clinicalkpisql.GetLastShiftSnapshotsRow{
					{
						ProviderID:               12,
						ServiceDate:              yesterday,
						ShiftSnapshotPhaseTypeID: enRoutePhaseID,
						Phase:                    sqltypes.ToNullString(&enRouteShortName),
						StartTimestamp:           enRouteStartTime,
						EndTimestamp:             enRouteEndTime,
					},
					{
						ProviderID:               12,
						ServiceDate:              yesterday,
						ShiftSnapshotPhaseTypeID: onScenePhaseID,
						Phase:                    sqltypes.ToNullString(&onSceneShortName),
						StartTimestamp:           onSceneStartTime,
						EndTimestamp:             onSceneEndTime,
					},
					{
						ProviderID:               12,
						ServiceDate:              yesterday,
						ShiftSnapshotPhaseTypeID: onBreakPhaseID,
						Phase:                    sqltypes.ToNullString(&onBreakShortName),
						StartTimestamp:           onBreakStartTime,
						EndTimestamp:             onBreakEndTime,
					},
				},
			},
			req: &clinicalkpipb.GetProviderLookBackRequest{ProviderId: int64(12)},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetProviderLookBackResponse{
				ShiftsTrend: []*clinicalkpipb.LookBackMetrics{
					{
						ServiceDate:                   protoconv.TimeToProtoDate(&yesterday),
						ProviderPatientsSeen:          proto.Int32(7),
						MarketGroupId:                 proto.Int64(1),
						MarketGroupName:               proto.String("Dallas"),
						AveragePatientsSeen:           proto.Float64(7.4),
						AverageOnShiftDurationSeconds: proto.Float64(32400),
					},
					{
						ServiceDate:                   protoconv.TimeToProtoDate(&today),
						ProviderPatientsSeen:          proto.Int32(5),
						MarketGroupId:                 proto.Int64(1),
						MarketGroupName:               proto.String("Dallas"),
						AveragePatientsSeen:           proto.Float64(4.9),
						AverageOnShiftDurationSeconds: proto.Float64(21600),
					},
				},
				LastDayBreakdown: &clinicalkpipb.Breakdown{
					ServiceDate: protoconv.TimeToProtoDate(&yesterday),
					Snapshots: []*clinicalkpipb.Snapshot{
						{
							Phase:          clinicalkpipb.Snapshot_PHASE_EN_ROUTE,
							StartTimestamp: protoconv.TimeToProtoTimestamp(&enRouteStartTime),
							EndTimestamp:   protoconv.TimeToProtoTimestamp(&enRouteEndTime),
						},
						{
							Phase:          clinicalkpipb.Snapshot_PHASE_ON_SCENE,
							StartTimestamp: protoconv.TimeToProtoTimestamp(&onSceneStartTime),
							EndTimestamp:   protoconv.TimeToProtoTimestamp(&onSceneEndTime),
						},
						{
							Phase:          clinicalkpipb.Snapshot_PHASE_ON_BREAK,
							StartTimestamp: protoconv.TimeToProtoTimestamp(&onBreakStartTime),
							EndTimestamp:   protoconv.TimeToProtoTimestamp(&onBreakEndTime),
						},
					},
				},
			},
		},
		{
			name: "should return invalid argument error when no provider ID",
			req:  &clinicalkpipb.GetProviderLookBackRequest{},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "should return internal error when failed to get provider daily metrics",
			mockDBService: &mockClinicalKPIDB{
				getProviderDailyMetricsWithMarketGroupAveragesFromDateErr: errors.New("an error occurred"),
			},
			req: &clinicalkpipb.GetProviderLookBackRequest{ProviderId: int64(12)},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.Internal,
		},
		{
			name: "should return internal error when failed to get last provider shift snapshots",
			mockDBService: &mockClinicalKPIDB{
				getLastShiftSnapshotsErr: errors.New("an error occurred"),
			},
			req: &clinicalkpipb.GetProviderLookBackRequest{ProviderId: int64(12)},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.Internal,
		},
		{
			name:          "should return empty look back when none returned from DB",
			mockDBService: &mockClinicalKPIDB{},
			req:           &clinicalkpipb.GetProviderLookBackRequest{ProviderId: int64(12)},

			stationHTTPStatus:   http.StatusOK,
			stationHTTPResponse: stationUser,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.GetProviderLookBackResponse{
				ShiftsTrend:      []*clinicalkpipb.LookBackMetrics{},
				LastDayBreakdown: &clinicalkpipb.Breakdown{},
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			stationClient := &station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}

			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})
			resp, err := grpcServer.GetProviderLookBack(context.Background(), tc.req)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantGRPCCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestSyncProviderAvatars(t *testing.T) {
	authContext := getContextWithAuth()
	noAuthContext := context.Background()
	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		input         *clinicalkpipb.SyncProviderAvatarsRequest
		context       context.Context

		stationHTTPStatus   int
		stationHTTPResponse []StationProvider

		want         *clinicalkpipb.SyncProviderAvatarsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should upsert provider avatars",
			mockDBService: &mockClinicalKPIDB{
				GetProviderAvatarsResult: []*clinicalkpisql.GetProviderAvatarsRow{},
				GetProviderAvatarsErr:    nil,
				UpdateProviderAvatarsErr: nil,
			},
			input:   &clinicalkpipb.SyncProviderAvatarsRequest{},
			context: authContext,

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:        1,
					FirstName: "John",
					LastName:  "Doe",
				},
			},

			want:         &clinicalkpipb.SyncProviderAvatarsResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			desc:          "should return an error when StationProvider is unauthenticated",
			mockDBService: &mockClinicalKPIDB{},
			input:         &clinicalkpipb.SyncProviderAvatarsRequest{},
			context:       noAuthContext,

			stationHTTPStatus:   http.StatusUnauthorized,
			stationHTTPResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Unauthenticated,
		},
		{
			desc:          "should return an error when failed to get providers from Station",
			mockDBService: &mockClinicalKPIDB{},
			input:         &clinicalkpipb.SyncProviderAvatarsRequest{},
			context:       authContext,

			stationHTTPStatus:   http.StatusNoContent,
			stationHTTPResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			desc: "should return an error when failed to get providers from ClinikalKPI",
			mockDBService: &mockClinicalKPIDB{
				GetProviderAvatarsErr:    errors.New("DB error"),
				GetProviderAvatarsResult: nil,
				UpdateProviderAvatarsErr: nil,
			},
			input:   &clinicalkpipb.SyncProviderAvatarsRequest{},
			context: authContext,

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:        1,
					FirstName: "John",
					LastName:  "Doe",
				},
			},

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			desc: "should return an error when failed to update provider avatar URL",
			mockDBService: &mockClinicalKPIDB{
				GetProviderAvatarsResult: []*clinicalkpisql.GetProviderAvatarsRow{{ProviderID: int64(1), AvatarUrl: sql.NullString{String: "link"}}, {ProviderID: int64(2), AvatarUrl: sql.NullString{String: "link"}}},
				GetProviderAvatarsErr:    nil,
				UpdateProviderAvatarsErr: errors.New("DB error"),
			},
			input:   &clinicalkpipb.SyncProviderAvatarsRequest{},
			context: authContext,

			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:        1,
					FirstName: "John",
					LastName:  "Doe",
				},
			},

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					resp, err := json.Marshal(tc.stationHTTPResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer stationServer.Close()

			stationClient := &station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}
			grpcServer := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})

			resp, err := grpcServer.SyncProviderAvatars(tc.context, tc.input)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code(), "received unexpected error")
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestListProviderMarkets(t *testing.T) {
	getProviderMarketsResult := []*clinicalkpisql.Market{
		{
			MarketID:  1,
			Name:      "Denver",
			ShortName: sqltypes.ToNullString(proto.String("DEN")),
		},
	}

	tcs := []struct {
		desc          string
		mockDBService *mockClinicalKPIDB
		providerID    int64

		want         *clinicalkpipb.ListProviderMarketsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "should return the provider markets",
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketsResult: getProviderMarketsResult,
				getProviderMarketsError:  nil,
			},
			providerID: 1,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMarketsResponse{
				Markets: []*clinicalkpipb.Market{
					{
						Id:        1,
						Name:      "Denver",
						ShortName: "DEN",
					},
				},
			},
		},
		{
			desc: "should return invalid argument error when ProviderId is missing",
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketsResult: getProviderMarketsResult,
				getProviderMarketsError:  nil,
			},

			wantGRPCCode: codes.InvalidArgument,
			want:         nil,
		},
		{
			desc: "should return error from DB method",
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketsResult: nil,
				getProviderMarketsError:  errors.New("DB error"),
			},
			providerID: 1,

			wantGRPCCode: codes.Internal,
			want:         nil,
		},
		{
			desc: "should return an empty array if there is no records in DB",
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketsResult: []*clinicalkpisql.Market{},
				getProviderMarketsError:  nil,
			},
			providerID: 1,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMarketsResponse{
				Markets: []*clinicalkpipb.Market{},
			},
		},
		{
			desc: "should return an empty array if DB responded with nil",
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketsResult: nil,
				getProviderMarketsError:  nil,
			},
			providerID: 1,

			wantGRPCCode: codes.OK,
			want: &clinicalkpipb.ListProviderMarketsResponse{
				Markets: []*clinicalkpipb.Market{},
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			params := gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: &station.Client{},
				logger:        zap.NewNop().Sugar(),
			}

			grpcServer := NewGRPCServer(params)
			resp, err := grpcServer.ListProviderMarkets(context.Background(), &clinicalkpipb.ListProviderMarketsRequest{ProviderId: tc.providerID})
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}
