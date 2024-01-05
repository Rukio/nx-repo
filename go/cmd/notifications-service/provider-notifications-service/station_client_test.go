package providernotifications

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type mockAuthValuer struct{}

func (m mockAuthValuer) AuthorizationValue() string {
	return "Bearer faketoken"
}

func contextWithAuth() context.Context {
	return metadata.NewIncomingContext(
		context.Background(),
		metadata.Pairs("authorization", "Bearer faketoken"),
	)
}

func TestFetchStationMarkets(t *testing.T) {
	ctxWithAuth := contextWithAuth()
	ctxWithoutAuth := context.Background()
	goodResponse := []StationMarket{
		{
			ID:           1,
			Name:         "Denver",
			ShortName:    "DEN",
			State:        "CO",
			TimeZoneName: "America/Denver",
		},
		{
			ID:           2,
			Name:         "Atlanta",
			ShortName:    "ATL",
			State:        "GA",
			TimeZoneName: "America/New_York",
		},
		{
			ID:           3,
			Name:         "Las Vegas",
			ShortName:    "LAS",
			State:        "NV",
			TimeZoneName: "America/Los_Angeles",
		},
	}

	tcs := []struct {
		desc              string
		stationHTTPStatus int
		stationResponse   any
		context           context.Context

		wantError      error
		wantStatusCode codes.Code
		wantResponse   []StationMarket
	}{
		{
			desc:              "should work successfully",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			context:           ctxWithAuth,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			desc:              "should return error when unable to marshal response body",
			stationHTTPStatus: http.StatusOK,
			stationResponse: StationMarket{
				ID:           1,
				Name:         "Denver",
				ShortName:    "DEN",
				State:        "CO",
				TimeZoneName: "America/Denver",
			},
			context: ctxWithAuth,

			wantError:      status.Error(codes.Internal, "Failed to unmarshal json into given struct: json: cannot unmarshal object into Go value of type []providernotifications.StationMarket"),
			wantStatusCode: codes.Internal,
		},
		{
			desc:              "should return error when missing auth from context",
			stationHTTPStatus: http.StatusUnauthorized,
			context:           ctxWithoutAuth,

			wantError:      status.Error(codes.Unauthenticated, "HTTP request had error response 401: "),
			wantStatusCode: codes.Unauthenticated,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)

					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			sc := &StationClient{
				StationHTTPClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := sc.FetchStationMarkets(tc.context)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestFetchStationShiftTeam(t *testing.T) {
	ctxWithAuth := contextWithAuth()
	ctxWithoutAuth := context.Background()

	goodResponse := StationShiftTeam{
		ID:        1,
		MarketID:  proto.Int64(1),
		StartTime: "2022-12-28 12:40:16.398466",
		EndTime:   "2022-12-28 15:40:16.398466",
		Car: StationCar{
			ID:    proto.Int64(1),
			Phone: proto.String("303-500-1518"),
		},
	}

	tcs := []struct {
		desc              string
		stationHTTPStatus int
		stationResponse   any
		context           context.Context

		wantError      error
		wantStatusCode codes.Code
		wantResponse   *StationShiftTeam
	}{
		{
			desc:              "should work successfully",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			context:           ctxWithAuth,

			wantStatusCode: codes.OK,
			wantResponse:   &goodResponse,
		},
		{
			desc:              "should return error when unable to marshal response body",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   []StationShiftTeam{goodResponse},
			context:           ctxWithAuth,

			wantError:      status.Error(codes.Internal, "Failed to unmarshal json into given struct: json: cannot unmarshal array into Go value of type providernotifications.StationShiftTeam"),
			wantStatusCode: codes.Internal,
		},
		{
			desc:              "should return error when missing auth from context",
			stationHTTPStatus: http.StatusUnauthorized,
			context:           ctxWithoutAuth,

			wantError:      status.Error(codes.Unauthenticated, "HTTP request had error response 401: "),
			wantStatusCode: codes.Unauthenticated,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)

					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			sc := &StationClient{
				StationHTTPClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := sc.FetchStationShiftTeam(tc.context, 1)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestFetchStationShiftTeamsByIDs(t *testing.T) {
	ctxWithAuth := contextWithAuth()
	ctxWithoutAuth := context.Background()

	goodResponse := []StationShiftTeam{
		{
			ID:        1,
			MarketID:  proto.Int64(1),
			StartTime: "2022-12-28 12:40:16.398466",
			EndTime:   "2022-12-28 15:40:16.398466",
			Car: StationCar{
				ID:    proto.Int64(1),
				Phone: proto.String("303-500-1518"),
			},
		},
		{
			ID:        7,
			MarketID:  proto.Int64(23),
			StartTime: "2022-12-28 12:40:16.398466",
			EndTime:   "2022-12-28 15:40:16.398466",
			Car: StationCar{
				ID:    proto.Int64(12),
				Phone: proto.String("303-500-1518"),
			},
		},
	}

	tcs := []struct {
		desc              string
		stationHTTPStatus int
		stationResponse   any
		context           context.Context
		params            []int64

		wantError       error
		wantStatusCode  codes.Code
		wantResponse    []StationShiftTeam
		wantQueryParams *url.Values
	}{
		{
			desc:              "should work successfully with single id",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			context:           ctxWithAuth,
			params:            []int64{1},

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
			wantQueryParams: &url.Values{
				"ids": []string{"1"},
			},
		},
		{
			desc:              "should work successfully with multiple ids",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			context:           ctxWithAuth,
			params:            []int64{1, 7},

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
			wantQueryParams: &url.Values{
				"ids": []string{"1", "7"},
			},
		},
		{
			desc:    "should return empty array when called with empty ids",
			context: ctxWithAuth,

			wantStatusCode: codes.OK,
			wantResponse:   []StationShiftTeam{},
		},
		{
			desc:              "should return error when unable to marshal response body",
			stationHTTPStatus: http.StatusOK,
			stationResponse: StationShiftTeam{
				ID:        1,
				MarketID:  proto.Int64(1),
				StartTime: "2022-12-28 12:40:16.398466",
				EndTime:   "2022-12-28 15:40:16.398466",
			},
			context: ctxWithAuth,
			params:  []int64{1},

			wantError:      status.Error(codes.Internal, "Failed to unmarshal json into given struct: json: cannot unmarshal object into Go value of type []providernotifications.StationShiftTeam"),
			wantStatusCode: codes.Internal,
		},
		{
			desc:              "should return error when missing auth from context",
			stationHTTPStatus: http.StatusUnauthorized,
			context:           ctxWithoutAuth,
			params:            []int64{1},

			wantError:      status.Error(codes.Unauthenticated, "HTTP request had error response 401: "),
			wantStatusCode: codes.Unauthenticated,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)

					if tc.wantQueryParams != nil {
						paramsKey := "ids"
						testutils.MustMatch(t, strings.Join((*tc.wantQueryParams)[paramsKey], ","), req.URL.Query().Get(paramsKey))
					}

					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			sc := &StationClient{
				StationHTTPClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := sc.FetchStationShiftTeamsByIDs(tc.context, tc.params)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}
