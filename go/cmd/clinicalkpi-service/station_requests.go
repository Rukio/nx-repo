package main

import (
	"context"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/*company-data-covered*/services/go/pkg/station"
)

type StationMarket struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	ShortName string `json:"short_name"`
	State     string `json:"state"`
}

type StationProviderProfile struct {
	Position    string `json:"position"`
	Credentials string `json:"credentials"`
}

type StationProvider struct {
	ID                         int64   `json:"id,omitempty"`
	FirstName                  string  `json:"first_name,omitempty"`
	LastName                   string  `json:"last_name,omitempty"`
	ProviderImageTinyURL       *string `json:"provider_image_tiny_url,omitempty"`
	ProviderProfilePosition    *string `json:"provider_profile_position,omitempty"`
	ProviderProfileCredentials *string `json:"provider_profile_credentials,omitempty"`
}

type StationUser struct {
	ID              int64                   `json:"id"`
	FirstName       string                  `json:"first_name"`
	Email           string                  `json:"email"`
	Markets         []StationMarket         `json:"markets"`
	ProviderProfile *StationProviderProfile `json:"provider_profile"`
}

func (s *GRPCServer) getCurrentUser(ctx context.Context) (*StationUser, error) {
	var (
		userPath    = "/api/users/user"
		stationUser = new(StationUser)
	)
	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        userPath,
		RespData:    &stationUser,
		ForwardAuth: true,
	})
	if err != nil {
		return nil, err
	}
	return stationUser, nil
}

type StationProvidersParams struct {
	marketIDs               []int64
	providerProfilePosition *string
	forwardAuth             bool
}

func (s *GRPCServer) getStationProviders(ctx context.Context, params *StationProvidersParams) ([]StationProvider, error) {
	providerSearchURL := "/api/providers"
	var stationProviders []StationProvider

	queryParams := url.Values{}
	forwardAuth := false
	if params != nil {
		if len(params.marketIDs) > 0 {
			var marketIDStrings []string
			for _, marketID := range params.marketIDs {
				marketIDStrings = append(marketIDStrings, strconv.FormatInt(marketID, 10))
			}
			marketIDsQueryString := strings.Join(marketIDStrings, ",")
			queryParams.Add("market_id", marketIDsQueryString)
		}
		if params.providerProfilePosition != nil {
			queryParams.Add("provider_profile_position", *params.providerProfilePosition)
		}
		forwardAuth = params.forwardAuth
	}

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        providerSearchURL,
		RespData:    &stationProviders,
		QueryParams: queryParams,
		ForwardAuth: forwardAuth,
	})
	if err != nil {
		return nil, err
	}
	return stationProviders, nil
}

func (s *GRPCServer) getStationMarkets(ctx context.Context, forwardAuth bool) ([]StationMarket, error) {
	marketSearchURL := "/api/markets"
	var stationMarkets []StationMarket

	queryParams := url.Values{}

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        marketSearchURL,
		RespData:    &stationMarkets,
		QueryParams: queryParams,
		ForwardAuth: forwardAuth,
	})
	if err != nil {
		return nil, err
	}
	return stationMarkets, nil
}
