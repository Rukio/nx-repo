package main

import (
	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"golang.org/x/exp/slices"
)

func StationProviderToProto(stationProvider *StationProvider) *clinicalkpipb.Provider {
	var position string
	if stationProvider.ProviderProfilePosition != nil {
		position = *stationProvider.ProviderProfilePosition
	}
	var credentials string
	if stationProvider.ProviderProfileCredentials != nil {
		credentials = *stationProvider.ProviderProfileCredentials
	}

	return &clinicalkpipb.Provider{
		Id:        stationProvider.ID,
		FirstName: stationProvider.FirstName,
		LastName:  stationProvider.LastName,
		AvatarUrl: stationProvider.ProviderImageTinyURL,
		Profile: &clinicalkpipb.ProviderProfile{
			Position:    position,
			Credentials: credentials,
		},
	}
}

func StationMarketToProto(stationMarket *StationMarket) *clinicalkpipb.Market {
	return &clinicalkpipb.Market{
		Id:        stationMarket.ID,
		Name:      stationMarket.Name,
		ShortName: stationMarket.ShortName,
	}
}

func StationProviderProfileToProto(stationProviderProfile *StationProviderProfile) *clinicalkpipb.ProviderProfile {
	if stationProviderProfile == nil {
		return nil
	}

	return &clinicalkpipb.ProviderProfile{
		Position:    stationProviderProfile.Position,
		Credentials: stationProviderProfile.Credentials,
	}
}

func StationUserToProto(stationUser *StationUser, availableMarketIDs []int64) *clinicalkpipb.User {
	markets := []*clinicalkpipb.Market{}
	for _, market := range stationUser.Markets {
		if slices.Contains(availableMarketIDs, market.ID) {
			markets = append(markets, StationMarketToProto(&market))
		}
	}
	return &clinicalkpipb.User{
		Id:              stationUser.ID,
		FirstName:       stationUser.FirstName,
		Email:           stationUser.Email,
		Markets:         markets,
		ProviderProfile: StationProviderProfileToProto(stationUser.ProviderProfile),
	}
}
