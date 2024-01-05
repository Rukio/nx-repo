package main

import (
	"testing"

	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

var (
	providerCredentialsNursePractitioner = "NP"
	providerAvatarURL                    = "https://example.com"
)

func TestStationMarketToProto(t *testing.T) {
	testCases := []struct {
		desc  string
		input *StationMarket

		expectedOutput *clinicalkpipb.Market
	}{
		{
			desc: "success - base case",
			input: &StationMarket{
				ID:        1,
				Name:      "Denver",
				ShortName: "DEN",
			},

			expectedOutput: &clinicalkpipb.Market{
				Id:        1,
				Name:      "Denver",
				ShortName: "DEN",
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.desc, func(t *testing.T) {
			output := StationMarketToProto(testCase.input)

			testutils.MustMatch(t, testCase.expectedOutput, output, "convert failed")
		})
	}
}

func TestStationProviderToProtoProvider(t *testing.T) {
	testCases := []struct {
		desc  string
		input *StationProvider

		expectedOutput *clinicalkpipb.Provider
	}{
		{
			desc: "success - base case",
			input: &StationProvider{
				ID:                         1,
				FirstName:                  "John",
				LastName:                   "Doe",
				ProviderImageTinyURL:       &providerAvatarURL,
				ProviderProfilePosition:    &providerPositionDHMT,
				ProviderProfileCredentials: &providerCredentialsNursePractitioner,
			},

			expectedOutput: &clinicalkpipb.Provider{
				Id:        1,
				FirstName: "John",
				LastName:  "Doe",
				AvatarUrl: &providerAvatarURL,
				Profile: &clinicalkpipb.ProviderProfile{
					Position:    providerPositionDHMT,
					Credentials: providerCredentialsNursePractitioner,
				},
			},
		},
		{
			desc: "success - nil avatar url",
			input: &StationProvider{
				ID:                         1,
				FirstName:                  "John",
				LastName:                   "Doe",
				ProviderImageTinyURL:       nil,
				ProviderProfilePosition:    &providerPositionDHMT,
				ProviderProfileCredentials: &providerCredentialsNursePractitioner,
			},

			expectedOutput: &clinicalkpipb.Provider{
				Id:        1,
				FirstName: "John",
				LastName:  "Doe",
				AvatarUrl: nil,
				Profile: &clinicalkpipb.ProviderProfile{
					Position:    providerPositionDHMT,
					Credentials: providerCredentialsNursePractitioner,
				},
			},
		},
		{
			desc: "success - nil position",
			input: &StationProvider{
				ID:                         1,
				FirstName:                  "John",
				LastName:                   "Doe",
				ProviderImageTinyURL:       &providerAvatarURL,
				ProviderProfilePosition:    nil,
				ProviderProfileCredentials: &providerCredentialsNursePractitioner,
			},

			expectedOutput: &clinicalkpipb.Provider{
				Id:        1,
				FirstName: "John",
				LastName:  "Doe",
				AvatarUrl: &providerAvatarURL,
				Profile: &clinicalkpipb.ProviderProfile{
					Position:    "",
					Credentials: providerCredentialsNursePractitioner,
				},
			},
		},
		{
			desc: "success - nil credentials",
			input: &StationProvider{
				ID:                         1,
				FirstName:                  "John",
				LastName:                   "Doe",
				ProviderImageTinyURL:       &providerAvatarURL,
				ProviderProfilePosition:    &providerPositionDHMT,
				ProviderProfileCredentials: nil,
			},

			expectedOutput: &clinicalkpipb.Provider{
				Id:        1,
				FirstName: "John",
				LastName:  "Doe",
				AvatarUrl: &providerAvatarURL,
				Profile: &clinicalkpipb.ProviderProfile{
					Position:    providerPositionDHMT,
					Credentials: "",
				},
			},
		},
		{
			desc: "success - both profile fields are nil",
			input: &StationProvider{
				ID:                         1,
				FirstName:                  "John",
				LastName:                   "Doe",
				ProviderImageTinyURL:       nil,
				ProviderProfilePosition:    nil,
				ProviderProfileCredentials: nil,
			},

			expectedOutput: &clinicalkpipb.Provider{
				Id:        1,
				FirstName: "John",
				LastName:  "Doe",
				AvatarUrl: nil,
				Profile:   &clinicalkpipb.ProviderProfile{},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.desc, func(t *testing.T) {
			output := StationProviderToProto(testCase.input)

			testutils.MustMatch(t, testCase.expectedOutput, output, "convert failed")
		})
	}
}

func TestStationUserToProto(t *testing.T) {
	testCases := []struct {
		desc               string
		user               *StationUser
		availableMarketIDs []int64

		expectedOutput *clinicalkpipb.User
	}{
		{
			desc: "success - base case",
			user: &StationUser{
				ID:        1,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				ProviderProfile: &StationProviderProfile{
					Position:    providerPositionAPP,
					Credentials: providerCredentialsNursePractitioner,
				},
			},

			expectedOutput: &clinicalkpipb.User{
				Id:        1,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []*clinicalkpipb.Market{},
				ProviderProfile: &clinicalkpipb.ProviderProfile{
					Position:    providerPositionAPP,
					Credentials: providerCredentialsNursePractitioner,
				},
			},
		},
		{
			desc: "success - user with markets",
			user: &StationUser{
				ID:        1,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
			},
			availableMarketIDs: []int64{1},

			expectedOutput: &clinicalkpipb.User{
				Id:        1,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []*clinicalkpipb.Market{{Id: 1, Name: "Denver", ShortName: "DEN"}},
			},
		},
		{
			desc: "success - user without provider profile",
			user: &StationUser{
				ID:        1,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}},
			},
			availableMarketIDs: []int64{1},

			expectedOutput: &clinicalkpipb.User{
				Id:              1,
				FirstName:       "John",
				Email:           "john.wayne@example.com",
				Markets:         []*clinicalkpipb.Market{{Id: 1, Name: "Denver", ShortName: "DEN"}},
				ProviderProfile: nil,
			},
		},
		{
			desc: "success - filters markets by available market IDs",
			user: &StationUser{
				ID:        1,
				FirstName: "John",
				Email:     "john.wayne@example.com",
				Markets:   []StationMarket{{ID: 1, Name: "Denver", ShortName: "DEN"}, {ID: 2, Name: "Tampa", ShortName: "TPA"}},
			},
			availableMarketIDs: []int64{1},

			expectedOutput: &clinicalkpipb.User{
				Id:              1,
				FirstName:       "John",
				Email:           "john.wayne@example.com",
				Markets:         []*clinicalkpipb.Market{{Id: 1, Name: "Denver", ShortName: "DEN"}},
				ProviderProfile: nil,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.desc, func(t *testing.T) {
			output := StationUserToProto(testCase.user, testCase.availableMarketIDs)

			testutils.MustMatch(t, testCase.expectedOutput, output, "convert failed")
		})
	}
}
