package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

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
			ID:        1,
			Name:      "Denver",
			ShortName: "DEN",
			State:     "CO",
		},
	}

	tcs := []struct {
		desc              string
		stationHTTPStatus int
		stationResponse   any
		context           context.Context

		wantError      bool
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
				ID:        1,
				Name:      "Denver",
				ShortName: "DEN",
				State:     "CO",
			},
			context: ctxWithAuth,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
		{
			desc:              "should return error when missing auth from context",
			stationHTTPStatus: http.StatusUnauthorized,
			context:           ctxWithoutAuth,

			wantError:      true,
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

			s := &GRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.fetchStationMarkets(tc.context)
			if (err != nil) != tc.wantError {
				t.Fatalf("fetchStationMarkets() error = %v, wantError = %v", err, tc.wantError)
			}
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))

			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestCreateStationOnCallShiftTeam(t *testing.T) {
	ctxWithAuth := contextWithAuth()
	ctxWithoutAuth := context.Background()
	startTime, err := time.Parse(scheduledShiftTimeLayout, "12/27/2022 16:00")
	if err != nil {
		t.Fatal(err)
	}
	endTime, err := time.Parse(scheduledShiftTimeLayout, "12/28/2022 01:00")
	if err != nil {
		t.Fatal(err)
	}

	goodResponse := StationOnCallShiftTeam{
		ID:             proto.Int64(1),
		OnCallDoctorID: proto.Int64(1),
		MarketIDs:      []int64{1, 2},
		StartTime:      startTime,
		EndTime:        endTime,
	}

	tcs := []struct {
		desc              string
		stationHTTPStatus int
		stationResponse   any
		context           context.Context

		wantError       bool
		wantStatusCode  codes.Code
		wantResponse    *StationOnCallShiftTeam
		wantQueryParams *url.Values
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
			stationResponse:   []StationOnCallShiftTeam{goodResponse},
			context:           ctxWithAuth,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
		{
			desc:              "should return error when missing auth from context",
			stationHTTPStatus: http.StatusUnauthorized,
			context:           ctxWithoutAuth,

			wantError:      true,
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

			s := &GRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.createStationOnCallShiftTeam(tc.context, &StationOnCallShiftTeamRequest{StationOnCallShiftTeam: &StationOnCallShiftTeam{MarketIDs: []int64{1, 2}, OnCallDoctorID: proto.Int64(1), StartTime: startTime, EndTime: endTime}})
			if (err != nil) != tc.wantError {
				t.Fatalf("createStationOnCallShiftTeam() error = %v, wantError = %v", err, tc.wantError)
			}
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))

			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}
