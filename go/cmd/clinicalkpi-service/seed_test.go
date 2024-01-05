package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgtype"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestSeedCalculatedMetrics(t *testing.T) {
	netPromoterScore, _ := pgtypes.BuildNumeric(0.95)
	chartClosureRate, _ := pgtypes.BuildNumeric(0.75)
	surveyCaptureRate, _ := pgtypes.BuildNumeric(nil)

	tcs := []struct {
		desc                string
		mockDBService       *mockClinicalKPIDB
		stationHTTPStatus   int
		stationHTTPResponse []StationProvider

		wantError bool
	}{
		{
			desc: "success - base case",
			mockDBService: &mockClinicalKPIDB{
				upsertCalculatedProviderMetricResult: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         1,
					CareRequestsCompletedLastSevenDays: 50,
					AverageNetPromoterScore:            netPromoterScore,
					AverageNetPromoterScoreChange:      netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					ChartClosureRateChange:             chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					SurveyCaptureRateChange:            pgtype.Numeric{},
					MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(int32(1800)),
					MedianOnSceneTimeSecsChange:        sqltypes.ToValidNullInt32(int32(1800)),
					ChangeDays:                         7,
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(10), 12, 12, 0, 0, 0, time.UTC)),
				},
			},
			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionAPP,
				},
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionVirtualDoctor,
				},
			},

			wantError: false,
		},
		{
			desc: "success - error inserting active market does not return error",
			mockDBService: &mockClinicalKPIDB{
				upsertCalculatedProviderMetricResult: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         1,
					CareRequestsCompletedLastSevenDays: 50,
					AverageNetPromoterScore:            netPromoterScore,
					AverageNetPromoterScoreChange:      netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					ChartClosureRateChange:             chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					SurveyCaptureRateChange:            pgtype.Numeric{},
					MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(int32(1800)),
					MedianOnSceneTimeSecsChange:        sqltypes.ToValidNullInt32(int32(1800)),
					ChangeDays:                         7,
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(10), 12, 12, 0, 0, 0, time.UTC)),
				},
				addActiveProviderForMarketsErr: errors.New("error inserting row"),
			},
			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionAPP,
				},
			},

			wantError: false,
		},
		{
			desc: "success - error inserting rows does not return error",
			mockDBService: &mockClinicalKPIDB{
				upsertCalculatedProviderMetricErr: errors.New("error inserting row"),
			},
			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionAPP,
				},
			},

			wantError: false,
		},
		{
			desc: "error - unable to retrieve station providers",
			mockDBService: &mockClinicalKPIDB{
				upsertCalculatedProviderMetricResult: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         1,
					CareRequestsCompletedLastSevenDays: 50,
					AverageNetPromoterScore:            netPromoterScore,
					AverageNetPromoterScoreChange:      netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					ChartClosureRateChange:             chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					SurveyCaptureRateChange:            pgtype.Numeric{},
					MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(int32(1800)),
					MedianOnSceneTimeSecsChange:        sqltypes.ToValidNullInt32(int32(1800)),
					ChangeDays:                         7,
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(10), 12, 12, 0, 0, 0, time.UTC)),
				},
			},
			stationHTTPStatus: http.StatusInternalServerError,

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)

					if tc.stationHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationHTTPResponse)
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
			s := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})

			err := seedCalculatedMetrics(context.Background(), zap.NewNop().Sugar(), s, tc.mockDBService)
			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}
		})
	}
}

func TestSeedStagingMetrics(t *testing.T) {
	netPromoterScore, _ := pgtypes.BuildNumeric(0.95)
	chartClosureRate, _ := pgtypes.BuildNumeric(0.75)
	surveyCaptureRate, _ := pgtypes.BuildNumeric(nil)

	tcs := []struct {
		desc                string
		mockDBService       *mockClinicalKPIDB
		stationHTTPStatus   int
		stationHTTPResponse []StationProvider

		wantError bool
	}{
		{
			desc: "success - base case",
			mockDBService: &mockClinicalKPIDB{
				addAddStagingProviderMetricResult: &clinicalkpisql.StagingProviderMetric{
					ProviderID:                         1,
					CareRequestsCompletedLastSevenDays: 50,
					AverageNetPromoterScore:            netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(int32(1800)),
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(10), 12, 12, 0, 0, 0, time.UTC)),
				},
			},
			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionAPP,
				},
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionVirtualDoctor,
				},
			},

			wantError: false,
		},
		{
			desc: "success - error inserting rows does not return error",
			mockDBService: &mockClinicalKPIDB{
				addAddStagingProviderMetricErr: errors.New("error inserting row"),
			},
			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionAPP,
				},
			},

			wantError: false,
		},
		{
			desc: "error - unable to retrieve station providers",
			mockDBService: &mockClinicalKPIDB{
				addAddStagingProviderMetricResult: &clinicalkpisql.StagingProviderMetric{
					ProviderID:                         1,
					CareRequestsCompletedLastSevenDays: 50,
					AverageNetPromoterScore:            netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(int32(1800)),
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(10), 12, 12, 0, 0, 0, time.UTC)),
				},
			},
			stationHTTPStatus: http.StatusInternalServerError,

			wantError: true,
		},
		{
			desc: "error - unable to delete existing staging provider metrics",
			mockDBService: &mockClinicalKPIDB{
				addAddStagingProviderMetricResult: &clinicalkpisql.StagingProviderMetric{
					ProviderID:                         1,
					CareRequestsCompletedLastSevenDays: 50,
					AverageNetPromoterScore:            netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(int32(1800)),
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(10), 12, 12, 0, 0, 0, time.UTC)),
				},
				deleteAllStagingProviderMetricsErr: errors.New("error inserting row"),
			},
			stationHTTPStatus: http.StatusOK,
			stationHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "John",
					LastName:                "Doe",
					ProviderProfilePosition: &providerPositionAPP,
				},
			},

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)

					if tc.stationHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationHTTPResponse)
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
			s := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})

			err := seedStagingMetrics(context.Background(), zap.NewNop().Sugar(), s, tc.mockDBService)
			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}
		})
	}
}

func TestProviderProfilePositionToJobTitle(t *testing.T) {
	jobTitleAPP := "APP"
	jobTitleDHMT := "DHMT"
	nonExistentPosition := "non_existent_position"

	testCases := []struct {
		name     string
		position *string

		want *string
	}{
		{
			name:     "providerPositionAPP",
			position: &providerPositionAPP,

			want: &jobTitleAPP,
		},
		{
			name:     "providerPositionDHMT",
			position: &providerPositionDHMT,

			want: &jobTitleDHMT,
		},
		{
			name:     "non_existent_position",
			position: &nonExistentPosition,

			want: nil,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jobTitle := providerProfilePositionToJobTitle(tc.position)

			testutils.MustMatch(t, tc.want, jobTitle, "job title mismatch")
		})
	}
}

func TestSeedLeaderHubMetrics(t *testing.T) {
	avatarURL := "url"
	db := &mockClinicalKPIDB{}

	tcs := []struct {
		desc                        string
		stationHTTPStatus           int
		stationProviderHTTPResponse []StationProvider
		stationMarketHTTPResponse   []StationMarket

		wantError bool
	}{
		{
			desc:              "success - base case",
			stationHTTPStatus: http.StatusOK,
			stationProviderHTTPResponse: []StationProvider{
				{
					ID:                      1,
					FirstName:               "Joe",
					LastName:                "Dou",
					ProviderProfilePosition: &providerPositionAPP,
					ProviderImageTinyURL:    &avatarURL,
				},
				{
					ID:                      2,
					FirstName:               "John",
					LastName:                "Boe",
					ProviderProfilePosition: &providerPositionAPP,
					ProviderImageTinyURL:    &avatarURL,
				},
				{
					ID:                      3,
					FirstName:               "John",
					LastName:                "Ooe",
					ProviderProfilePosition: &providerPositionAPP,
					ProviderImageTinyURL:    &avatarURL,
				},
			},
			stationMarketHTTPResponse: []StationMarket{
				{
					ID:        1,
					Name:      "Ohio",
					ShortName: "OH",
				},
				{
					ID:        2,
					Name:      "Arizona",
					ShortName: "AZ",
				},
			},

			wantError: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)

					// check the URL Path to determine what response to write
					if strings.Contains(req.URL.Path, "/api/providers") && tc.stationProviderHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationProviderHTTPResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
						return
					}

					if strings.Contains(req.URL.Path, "/api/markets") && tc.stationMarketHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationMarketHTTPResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
						return
					}
				},
			))
			defer stationServer.Close()

			s := NewGRPCServer(gRPCServerParams{
				dbService: db,
				stationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
				logger: zap.NewNop().Sugar(),
			})

			err := seedLeaderHubMetrics(context.Background(), zap.NewNop().Sugar(), s, db)

			testutils.MustMatch(t, tc.wantError, err != nil)
		})
	}
}

func TestSeedLookBackDailyMetrics(t *testing.T) {
	goodStationProvidersResponse := []StationProvider{
		{
			ID:                      1,
			FirstName:               "John",
			LastName:                "Doe",
			ProviderProfilePosition: &providerPositionAPP,
		},
		{
			ID:                      2,
			FirstName:               "John",
			LastName:                "Doe",
			ProviderProfilePosition: &providerPositionVirtualDoctor,
		},
	}
	goodStationMarketsResponse := []StationMarket{
		{
			ID:        1,
			Name:      "Denver",
			ShortName: "DEN",
			State:     "CO",
		},
		{
			ID:        2,
			Name:      "Olympia",
			ShortName: "OLY",
			State:     "WA",
		},
		{
			ID:        2,
			Name:      "Seattle",
			ShortName: "SEA",
			State:     "WA",
		},
		{
			ID:        2,
			Name:      "Tacoma",
			ShortName: "TAC",
			State:     "WA",
		},
	}

	tcs := []struct {
		desc                string
		mockDBService       *mockClinicalKPIDB
		stationHTTPStatus   map[string]int
		stationHTTPResponse map[string]any

		wantError error
	}{
		{
			desc:                "should work successfully",
			mockDBService:       &mockClinicalKPIDB{},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusOK},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse, "/api/markets": goodStationMarketsResponse},
		},
		{
			desc:              "should return error when unable to retrieve station providers",
			mockDBService:     &mockClinicalKPIDB{},
			stationHTTPStatus: map[string]int{"/api/providers": http.StatusInternalServerError},

			wantError: fmt.Errorf(retrieveStationProvidersErrorTemplate, status.Error(codes.Internal, "HTTP request had error response 500: ")),
		},
		{
			desc:                "should return error when unable to retrieve station markets",
			mockDBService:       &mockClinicalKPIDB{},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusInternalServerError},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse},

			wantError: fmt.Errorf(retrieveStationMarketsErrorTemplate, status.Error(codes.Internal, "HTTP request had error response 500: null")),
		},
		{
			desc: "should return error when unable to clear Look Back tables",
			mockDBService: &mockClinicalKPIDB{
				deleteAllLookBackMetricsErr: errors.New("error deleting rows"),
			},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusOK},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse, "/api/markets": goodStationMarketsResponse},

			wantError: fmt.Errorf("failed to delete all Look Back metrics: %w", errors.New("error deleting rows")),
		},
		{
			desc: "should return error when unable to save markets",
			mockDBService: &mockClinicalKPIDB{
				seedMarketsErr: errors.New("error inserting rows"),
			},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusOK},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse, "/api/markets": goodStationMarketsResponse},

			wantError: fmt.Errorf("failed to save markets: %w", errors.New("error inserting rows")),
		},
		{
			desc: "should return error when unable to save market groups",
			mockDBService: &mockClinicalKPIDB{
				seedMarketGroupsErr: errors.New("error inserting rows"),
			},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusOK},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse, "/api/markets": goodStationMarketsResponse},

			wantError: fmt.Errorf("failed to save market groups: %w", errors.New("error inserting rows")),
		},
		{
			desc: "should return error when unable to save provider daily metrics",
			mockDBService: &mockClinicalKPIDB{
				seedProviderDailyMetricsErr: errors.New("error inserting rows"),
			},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusOK},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse, "/api/markets": goodStationMarketsResponse},

			wantError: fmt.Errorf("failed to save provider daily metrics: %w", errors.New("error inserting rows")),
		},
		{
			desc: "should return error when unable to save provider shift snapshots",
			mockDBService: &mockClinicalKPIDB{
				seedShiftSnapshotsErr: errors.New("error inserting rows"),
			},
			stationHTTPStatus:   map[string]int{"/api/providers": http.StatusOK, "/api/markets": http.StatusOK},
			stationHTTPResponse: map[string]any{"/api/providers": goodStationProvidersResponse, "/api/markets": goodStationMarketsResponse},

			wantError: fmt.Errorf("failed to save shift snapshots: %w", errors.New("error inserting rows")),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus[req.RequestURI])

					if tc.stationHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationHTTPResponse[req.RequestURI])
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
			s := NewGRPCServer(gRPCServerParams{
				dbService:     tc.mockDBService,
				stationClient: stationClient,
				logger:        zap.NewNop().Sugar(),
			})

			err := seedLookBackDailyMetrics(context.Background(), zap.NewNop().Sugar(), s, tc.mockDBService)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}
