package main

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
)

type mockAuthValuer struct{}

func (m mockAuthValuer) AuthorizationValue() string {
	return "Bearer AccessTokenString"
}

func getContextWithAuth() context.Context {
	return metadata.NewIncomingContext(
		context.Background(),
		metadata.Pairs("authorization", "Bearer faketoken"),
	)
}

func TestGetCurrentUser(t *testing.T) {
	goodResponse := &StationUser{
		ID:              1,
		FirstName:       "John",
		Markets:         []StationMarket{{ID: 1, Name: "market"}},
		ProviderProfile: &StationProviderProfile{Position: providerPositionAPP, Credentials: providerCredentialsNursePractitioner},
	}
	badResponse := []StationUser{*goodResponse}

	tcs := []struct {
		Desc              string
		StationHTTPStatus int
		StationResponse   any
		Context           context.Context

		WantError      bool
		WantStatusCode codes.Code
		WantResponse   *StationUser
	}{
		{
			Desc:              "success - base case",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,
			Context:           getContextWithAuth(),

			WantStatusCode: codes.OK,
			WantResponse:   goodResponse,
		},
		{
			Desc:              "failure - bad response",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   badResponse,
			Context:           getContextWithAuth(),

			WantError:      true,
			WantStatusCode: codes.Internal,
		},
		{
			Desc:              "success - missing auth from context",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,
			Context:           context.Background(),

			WantError:      true,
			WantStatusCode: codes.Unauthenticated,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.StationHTTPStatus)
					if tc.StationResponse != nil {
						resp, err := json.Marshal(tc.StationResponse)
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

			stationResponse, err := s.getCurrentUser(tc.Context)
			if err != nil && !tc.WantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.WantError {
				t.Fatalf("did not receive error when one was expected")
			}

			if status.Code(err) != tc.WantStatusCode {
				t.Fatalf("%s got;  want %s", status.Code(err), tc.WantStatusCode)
			}

			if tc.WantResponse != nil {
				testutils.MustMatch(t, tc.WantResponse, stationResponse, "unexpected response body")
			}
		})
	}
}

func TestGetStationProviders(t *testing.T) {
	marketIDKey := "market_id"
	providerProfilePositionKey := "provider_profile_position"
	goodResponse := []StationProvider{
		{
			ID:                         1,
			FirstName:                  "John",
			LastName:                   "Doe",
			ProviderImageTinyURL:       &providerAvatarURL,
			ProviderProfilePosition:    &providerPositionDHMT,
			ProviderProfileCredentials: &providerCredentialsNursePractitioner,
		},
	}

	tcs := []struct {
		Desc              string
		StationHTTPStatus int
		StationResponse   any
		Params            *StationProvidersParams

		WantError       bool
		WantStatusCode  codes.Code
		WantResponse    []StationProvider
		WantQueryParams *url.Values
	}{
		{
			Desc:              "success - without params",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,

			WantStatusCode: codes.OK,
			WantResponse:   goodResponse,
		},
		{
			Desc:              "success - with params and one marketID",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,
			Params:            &StationProvidersParams{marketIDs: []int64{1}, forwardAuth: false},

			WantStatusCode: codes.OK,
			WantResponse:   goodResponse,
			WantQueryParams: &url.Values{
				marketIDKey: []string{"1"},
			},
		},
		{
			Desc:              "success - with params and multiple marketIDs",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,
			Params:            &StationProvidersParams{marketIDs: []int64{1, 2}, forwardAuth: false},

			WantStatusCode: codes.OK,
			WantResponse:   goodResponse,
			WantQueryParams: &url.Values{
				marketIDKey: []string{"1", "2"},
			},
		},
		{
			Desc:              "success - with params and provider profile position",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,
			Params:            &StationProvidersParams{providerProfilePosition: &providerPositionDHMT, forwardAuth: false},

			WantStatusCode: codes.OK,
			WantResponse:   goodResponse,
			WantQueryParams: &url.Values{
				providerProfilePositionKey: []string{"emt"},
			},
		},
		{
			Desc:              "success - with params, multiple marketIDs and provider profile position",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   []StationProvider{},
			Params:            &StationProvidersParams{marketIDs: []int64{1, 2}, providerProfilePosition: &providerPositionAPP, forwardAuth: false},

			WantStatusCode: codes.OK,
			WantResponse:   []StationProvider{},
			WantQueryParams: &url.Values{
				marketIDKey:                []string{"1", "2"},
				providerProfilePositionKey: []string{"advanced practice provider"},
			},
		},
		{
			Desc:              "success - with params and nil marketIDs",
			StationHTTPStatus: http.StatusOK,
			StationResponse:   goodResponse,
			Params:            &StationProvidersParams{forwardAuth: false},

			WantStatusCode:  codes.OK,
			WantResponse:    goodResponse,
			WantQueryParams: &url.Values{},
		},
		{
			Desc:              "error - unable to marshal response body",
			StationHTTPStatus: http.StatusOK,
			StationResponse: StationProvider{
				ID:        1,
				FirstName: "John",
				LastName:  "Doe",
			},

			WantError:      true,
			WantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.StationHTTPStatus)

					if tc.WantQueryParams != nil {
						testutils.MustMatch(t, strings.Join((*tc.WantQueryParams)[marketIDKey], ","), req.URL.Query().Get(marketIDKey))
						testutils.MustMatch(t, strings.Join((*tc.WantQueryParams)[providerProfilePositionKey], ","), req.URL.Query().Get(providerProfilePositionKey))
					}

					if tc.StationResponse != nil {
						resp, err := json.Marshal(tc.StationResponse)
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

			stationResponse, err := s.getStationProviders(context.Background(), tc.Params)
			if err != nil && !tc.WantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.WantError {
				t.Fatalf("did not receive error when one was expected")
			}

			if status.Code(err) != tc.WantStatusCode {
				t.Fatalf("%s got;  want %s", status.Code(err), tc.WantStatusCode)
			}

			if tc.WantResponse != nil {
				testutils.MustMatch(t, tc.WantResponse, stationResponse, "unexpected response body")
			}
		})
	}
}

func TestGetStationMarkets(t *testing.T) {
	goodResponse := []StationMarket{
		{
			ID:        1,
			Name:      "Denver",
			ShortName: "DEN",
		},
	}

	defaultContext := context.Background()
	contextWithAuth := getContextWithAuth()

	tcs := []struct {
		desc              string
		stationHTTPStatus int
		stationResponse   any
		forwardAuth       bool
		ctx               context.Context

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []StationMarket
	}{
		{
			desc:              "success - context with auth, forwardAuth - true",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			forwardAuth:       true,
			ctx:               contextWithAuth,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			desc:              "success - context without auth, forwardAuth - false",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			forwardAuth:       false,
			ctx:               defaultContext,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			desc:              "error - context without auth, forwardAuth - true",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			forwardAuth:       true,
			ctx:               defaultContext,

			wantError:      true,
			wantStatusCode: codes.Unauthenticated,
		},
		{
			desc:              "error - unable to marshal response body",
			stationHTTPStatus: http.StatusOK,
			stationResponse: StationMarket{
				ID:        1,
				Name:      "Denver",
				ShortName: "DEN",
			},
			ctx: defaultContext,

			wantError:      true,
			wantStatusCode: codes.Internal,
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

			stationResponse, err := s.getStationMarkets(tc.ctx, tc.forwardAuth)
			testutils.MustMatch(t, tc.wantError, err != nil, "unexpected error state")
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err), "unexpected status")
			if tc.wantResponse != nil {
				testutils.MustMatch(t, tc.wantResponse, stationResponse, "unexpected response body")
			}
		})
	}
}
