//go:build db_test

package partnerdb_test

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	adhocpartnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner/DO_NOT_USE"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPartnerDB_AddPartner(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	stationChannelItemID := baseID + 1
	stationChannelID := baseID + 1
	displayName := "Test Name"
	partnerCategoryName := "injury_finance"

	tests := []struct {
		name   string
		params []partnersql.AddPartnerParams

		expectedResponse partnersql.Partner
		expectedError    bool
	}{
		{
			name: "success - base case",
			params: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     stationChannelItemID,
					StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
					DisplayName:              displayName,
					PartnerCategoryShortName: partnerCategoryName,
				},
			},

			expectedResponse: partnersql.Partner{
				ID:                   baseID,
				StationChannelItemID: stationChannelItemID,
				StationChannelID:     sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:          displayName,
				PartnerCategoryID:    partnerCategoryShortNameToID[partnerCategoryName],
			},
		},
		{
			name: "error - duplicated station_channel_item_id",
			params: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     stationChannelItemID + 1,
					StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
					DisplayName:              displayName,
					PartnerCategoryShortName: partnerCategoryName,
				},
				{
					StationChannelItemID:     stationChannelItemID + 1,
					StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
					DisplayName:              displayName,
					PartnerCategoryShortName: partnerCategoryName,
				},
			},

			expectedError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			var gotResponse *partnersql.Partner
			var err error
			for _, params := range test.params {
				gotResponse, err = pdb.AddPartner(ctx, params)
			}

			testutils.MustMatch(t, test.expectedError, err != nil)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, gotResponse, &test.expectedResponse)
		})
	}
}

func TestPartnerDB_DeactivatePartnerByID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()
	now := time.Now()
	nowString := now.Format(partnerdb.TimestampLayout)
	baseID := time.Now().UnixNano()
	stationChannelItemID := baseID + 1
	displayName := "Deactivate Partner Test"
	partnerCategoryName := "health_system"

	tests := []struct {
		name                string
		partner             partnersql.AddPartnerParams
		deactivatePartnerID int64

		expectedResponse partnersql.Partner
		expectedError    bool
	}{
		{
			name: "success - base case",
			partner: partnersql.AddPartnerParams{
				StationChannelItemID:     stationChannelItemID,
				DisplayName:              displayName,
				PartnerCategoryShortName: partnerCategoryName,
			},

			expectedResponse: partnersql.Partner{
				ID:                   baseID,
				StationChannelItemID: stationChannelItemID,
				DisplayName:          displayName,
				PartnerCategoryID:    partnerCategoryShortNameToID[partnerCategoryName],
				DeactivatedAt:        sqltypes.StringToValidNullTime(nowString),
			},
		},
		{
			name: "error - partner ID does not exist",
			partner: partnersql.AddPartnerParams{
				StationChannelItemID:     stationChannelItemID,
				DisplayName:              displayName,
				PartnerCategoryShortName: partnerCategoryName,
			},
			deactivatePartnerID: -1,
			expectedError:       true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			partnerIDs, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, []partnersql.AddPartnerParams{test.partner})
			defer removePartners()

			var partnerID int64
			if test.deactivatePartnerID == 0 {
				partnerID = partnerIDs[0]
			} else {
				partnerID = test.deactivatePartnerID
			}
			gotResponse, err := pdb.DeactivatePartnerByID(ctx, partnerID)

			testutils.MustMatch(t, test.expectedError, err != nil)
			testutils.MustMatch(t, !test.expectedError, gotResponse.DeactivatedAt.Valid)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeactivatedAt")(t, gotResponse, &test.expectedResponse)
		})
	}
}

func TestPartnerDB_GetPartnerByID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	stationChannelItemID := baseID + 1
	stationChannelID := baseID + 2
	displayName := "Get Partner Test"
	partnerCategoryName := "home_health"

	tests := []struct {
		name         string
		partner      partnersql.AddPartnerParams
		getPartnerID int64

		expectedResponse *partnersql.GetPartnerByIDRow
		expectedError    bool
	}{
		{
			name: "success - base case",
			partner: partnersql.AddPartnerParams{
				StationChannelItemID:     stationChannelItemID,
				StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:              displayName,
				PartnerCategoryShortName: partnerCategoryName,
			},

			expectedResponse: &partnersql.GetPartnerByIDRow{
				ID:                       baseID,
				StationChannelItemID:     stationChannelItemID,
				StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:              displayName,
				PartnerCategoryShortName: sqltypes.ToValidNullString(partnerCategoryName),
			},
		},
		{
			name: "error - partner ID does not exist",
			partner: partnersql.AddPartnerParams{
				StationChannelItemID:     stationChannelItemID,
				StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:              displayName,
				PartnerCategoryShortName: partnerCategoryName,
			},
			getPartnerID: -1,

			expectedResponse: &partnersql.GetPartnerByIDRow{},
			expectedError:    true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			partnerIDs, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, []partnersql.AddPartnerParams{test.partner})
			defer removePartners()

			var partnerID int64
			if test.getPartnerID == 0 {
				partnerID = partnerIDs[0]
			} else {
				partnerID = test.getPartnerID
			}

			partner, err := pdb.GetPartnerByID(ctx, partnerID)

			testutils.MustMatch(t, test.expectedError, err != nil)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.expectedResponse, partner)
		})
	}
}

func TestPartnerDB_GetPartnersByInsurancePackages(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	displayName := "Partner %d"
	partnerName1 := fmt.Sprintf(displayName, 1)
	partnerName2 := fmt.Sprintf(displayName, 2)
	packageID1 := baseID + 1
	packageID2 := baseID + 2

	partnerCategoryName := "home_health"

	tests := []struct {
		name                string
		partners            []partnersql.AddPartnerParams
		partnersPackagesMap map[int64][]string
		searchPackageIDs    []int64

		expectedResponse []*partnersql.Partner
		expectedError    bool
	}{
		{
			name: "success - base case",
			partners: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     baseID + 1,
					DisplayName:              partnerName1,
					PartnerCategoryShortName: partnerCategoryName,
				},
				{
					StationChannelItemID:     baseID + 2,
					DisplayName:              partnerName2,
					PartnerCategoryShortName: partnerCategoryName,
				},
			},
			partnersPackagesMap: map[int64][]string{
				packageID1: {partnerName1},
				packageID2: {partnerName2},
			},
			searchPackageIDs: []int64{packageID1},
			expectedResponse: []*partnersql.Partner{
				{
					DisplayName: partnerName1,
				},
			},
		},
		{
			name: "success - no partner fetched",

			partners: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     baseID + 1,
					DisplayName:              partnerName1,
					PartnerCategoryShortName: partnerCategoryName,
				},
				{
					StationChannelItemID:     baseID + 2,
					DisplayName:              partnerName2,
					PartnerCategoryShortName: partnerCategoryName,
				},
			},
			partnersPackagesMap: map[int64][]string{
				packageID1: {partnerName1, partnerName2},
				packageID2: {},
			},
			searchPackageIDs: []int64{packageID2},
			expectedResponse: []*partnersql.Partner{},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			addedPartners, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, test.partners)
			defer removePartners()

			addedPartnersMap := make(map[string]int64, len(addedPartners))
			for _, partnerID := range addedPartners {
				// This could be merged into a slightly different addAndRemovePartners function
				partner, err := queries.GetPartnerByID(ctx, partnerID)
				if err != nil {
					t.Fatal(err)
				}
				addedPartnersMap[partner.DisplayName] = partner.ID
			}

			partnerInsurancePackagesParams := make([]partnersql.AddPartnerInsurancePackageParams, 0)
			for packageID, partnerNames := range test.partnersPackagesMap {
				for _, partnerName := range partnerNames {
					partnerID := addedPartnersMap[partnerName]
					param := partnersql.AddPartnerInsurancePackageParams{
						PackageID: packageID,
						PartnerID: partnerID,
					}
					partnerInsurancePackagesParams = append(partnerInsurancePackagesParams, param)
				}
			}

			for _, packageParams := range partnerInsurancePackagesParams {
				_, err := queries.AddPartnerInsurancePackage(ctx, packageParams)
				if err != nil {
					t.Fatal(err)
				}
			}

			gotPartners, err := pdb.GetPartnersByInsurancePackages(ctx, test.searchPackageIDs)
			if err != nil {
				t.Fatal(err)
			}

			if len(gotPartners) != len(test.expectedResponse) {
				t.Errorf("expected %d partners but got %d", len(test.expectedResponse), len(gotPartners))
			}

			for i, gotPartner := range gotPartners {
				testutils.MustMatchFn(".ID", ".StationChannelItemID", ".PartnerCategoryID", ".CreatedAt", ".UpdatedAt")(t, test.expectedResponse[i], gotPartner)
			}
		})
	}
}

func TestPartnerDB_GetPartnerByStationChannelItemID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	stationChannelItemID := baseID + 1
	stationChannelID := baseID + 2
	displayName := "Get Partner By Station Test"
	partnerCategoryName := "employer"

	tests := []struct {
		name                           string
		partner                        partnersql.AddPartnerParams
		getPartnerStationChannelItemID int64

		expectedResponse *partnersql.Partner
		expectedError    bool
	}{
		{
			name: "success - base case",
			partner: partnersql.AddPartnerParams{
				StationChannelItemID:     stationChannelItemID,
				StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:              displayName,
				PartnerCategoryShortName: partnerCategoryName,
			},

			expectedResponse: &partnersql.Partner{
				ID:                   baseID,
				StationChannelItemID: stationChannelItemID,
				StationChannelID:     sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:          displayName,
				PartnerCategoryID:    partnerCategoryShortNameToID[partnerCategoryName],
			},
		},
		{
			name: "error - no partner related to the station channel",
			partner: partnersql.AddPartnerParams{
				StationChannelItemID:     stationChannelItemID,
				StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
				DisplayName:              displayName,
				PartnerCategoryShortName: partnerCategoryName,
			},
			getPartnerStationChannelItemID: -1,

			expectedResponse: &partnersql.Partner{},
			expectedError:    true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			_, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, []partnersql.AddPartnerParams{test.partner})
			defer removePartners()

			var tmpStationChannelItemID int64

			if test.getPartnerStationChannelItemID == 0 {
				tmpStationChannelItemID = stationChannelItemID
			} else {
				tmpStationChannelItemID = test.getPartnerStationChannelItemID
			}

			partner, err := pdb.GetPartnerByStationChannelItemID(ctx, tmpStationChannelItemID)

			testutils.MustMatch(t, test.expectedError, err != nil)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.expectedResponse, partner)
		})
	}
}

func TestPartnerDB_GetPartnersByStationChannelItemIDList(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	displayName := "Partner %d"
	partnerCategoryName := "employer"
	newPartners := []partnersql.AddPartnerParams{
		{
			StationChannelItemID:     baseID + 1,
			DisplayName:              fmt.Sprintf(displayName, 1),
			PartnerCategoryShortName: partnerCategoryName,
		},
		{
			StationChannelItemID:     baseID + 2,
			DisplayName:              fmt.Sprintf(displayName, 2),
			PartnerCategoryShortName: partnerCategoryName,
		},
	}

	tests := []struct {
		name           string
		partners       []partnersql.AddPartnerParams
		channelItemIDs []int64

		expectedResponse []*partnersql.Partner
	}{
		{
			name:           "success - base case",
			partners:       newPartners,
			channelItemIDs: []int64{baseID + 1},

			expectedResponse: []*partnersql.Partner{
				{
					ID:                   baseID + 1,
					StationChannelItemID: baseID + 1,
					DisplayName:          fmt.Sprintf(displayName, 1),
					PartnerCategoryID:    partnerCategoryShortNameToID[partnerCategoryName],
				},
			},
		},
		{
			name:           "success - no partner fetched",
			partners:       newPartners,
			channelItemIDs: []int64{baseID + 3},

			expectedResponse: []*partnersql.Partner{},
		},
		{
			name:           "success - no partners fetched when empty list",
			partners:       newPartners,
			channelItemIDs: []int64{},

			expectedResponse: []*partnersql.Partner{},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			_, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, test.partners)
			defer removePartners()
			gotPartners, err := pdb.GetPartnersByStationChannelItemIDList(ctx, test.channelItemIDs)
			if err != nil {
				t.Fatal(err)
			}

			if len(gotPartners) != len(test.expectedResponse) {
				t.Errorf("expected %d partners but got %d", len(test.expectedResponse), len(gotPartners))
			}

			for i, gotPartner := range gotPartners {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.expectedResponse[i], gotPartner)
			}
		})
	}
}

func TestPartnerDB_SearchPartnersByLatLng(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	partnerCategoryName := "injury_finance"
	locations := []partnersql.AddLocationParams{
		{
			LatitudeE6:  sqltypes.ToValidNullInt32(1500),
			LongitudeE6: sqltypes.ToValidNullInt32(1500),
		},
		{
			LatitudeE6:  sqltypes.ToValidNullInt32(2500),
			LongitudeE6: sqltypes.ToValidNullInt32(2500),
		},
	}

	locationIDs := make([]int64, len(locations))
	for i, location := range locations {
		newLocation, err := queries.AddLocation(ctx, location)
		if err != nil {
			t.Fatal(err)
		}
		locationIDs[i] = newLocation.ID
	}

	baseID := time.Now().UnixNano()
	tests := []struct {
		name                string
		partners            []partnersql.AddPartnerParams
		searchPartnerParams partnersql.SearchPartnersByLatLngParams

		expectedResponse int
	}{
		{
			name: "success - base case",
			partners: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     baseID + 1,
					DisplayName:              "Partner 1",
					LocationID:               sqltypes.ToValidNullInt64(locationIDs[0]),
					PartnerCategoryShortName: partnerCategoryName,
				},
				{
					StationChannelItemID:     baseID + 2,
					DisplayName:              "Partner 3",
					PartnerCategoryShortName: partnerCategoryName,
				},
				{
					StationChannelItemID:     baseID + 3,
					DisplayName:              "Partner 4",
					LocationID:               sqltypes.ToValidNullInt64(locationIDs[1]),
					PartnerCategoryShortName: partnerCategoryName,
				},
			},
			searchPartnerParams: partnersql.SearchPartnersByLatLngParams{
				LatE6Min: sql.NullInt32{Int32: 1000, Valid: true},
				LatE6Max: sql.NullInt32{Int32: 2000, Valid: true},
				LngE6Min: sql.NullInt32{Int32: 1000, Valid: true},
				LngE6Max: sql.NullInt32{Int32: 2000, Valid: true},
			},

			expectedResponse: 1,
		},
		{
			name: "success - no partner found within the location",
			partners: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     baseID + 4,
					DisplayName:              "Partner 4",
					LocationID:               sqltypes.ToValidNullInt64(locationIDs[1]),
					PartnerCategoryShortName: partnerCategoryName,
				},
			},
			searchPartnerParams: partnersql.SearchPartnersByLatLngParams{
				LatE6Min: sql.NullInt32{Int32: 0, Valid: true},
				LatE6Max: sql.NullInt32{Int32: 1, Valid: true},
				LngE6Min: sql.NullInt32{Int32: 0, Valid: true},
				LngE6Max: sql.NullInt32{Int32: 1, Valid: true},
			},

			expectedResponse: 0,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, test.partners)
			defer removePartners()

			gotPartners, err := pdb.SearchPartnersByLatLng(ctx, test.searchPartnerParams)
			if err != nil {
				t.Fatal(err)
			}

			if len(gotPartners) != test.expectedResponse {
				t.Errorf("expected %d partners but got %d", test.expectedResponse, len(gotPartners))
			}
		})
	}
}

func TestPartnerDB_SearchPartnersByName(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name                string
		partners            []partnersql.AddPartnerParams
		searchPartnerParams partnersql.SearchPartnersByNameParams

		expectedResponse []*partnersql.SearchPartnersByNameRow
	}{
		{
			name: "success - base case",
			partners: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     baseID + 1,
					DisplayName:              "BTest Name",
					PartnerCategoryShortName: "employer",
				},
				{
					StationChannelItemID:     baseID + 2,
					DisplayName:              "Ctest Name",
					PartnerCategoryShortName: "injury_finance",
				},
				{
					StationChannelItemID:     baseID + 3,
					DisplayName:              "No fetch Name1",
					PartnerCategoryShortName: "home_health",
				},
				{
					StationChannelItemID:     baseID + 4,
					DisplayName:              "Atest Name",
					PartnerCategoryShortName: "hospice_and_palliative_care",
				},
				{
					StationChannelItemID:     baseID + 5,
					DisplayName:              "No fetch Name2",
					PartnerCategoryShortName: "provider_group",
				},
			},
			searchPartnerParams: partnersql.SearchPartnersByNameParams{
				PartnerName:    "test",
				MaxResultCount: 2,
			},

			expectedResponse: []*partnersql.SearchPartnersByNameRow{
				{
					ID:                       baseID + 1,
					StationChannelItemID:     baseID + 4,
					DisplayName:              "Atest Name",
					PartnerCategoryShortName: sqltypes.ToValidNullString("hospice_and_palliative_care"),
				},
				{
					ID:                       baseID + 2,
					StationChannelItemID:     baseID + 1,
					DisplayName:              "BTest Name",
					PartnerCategoryShortName: sqltypes.ToValidNullString("employer"),
				},
			},
		},
		{
			name: "success - no partner found with the given name",
			partners: []partnersql.AddPartnerParams{
				{
					StationChannelItemID:     baseID + 6,
					DisplayName:              "Bar",
					PartnerCategoryShortName: "employer",
				},
			},
			searchPartnerParams: partnersql.SearchPartnersByNameParams{
				PartnerName:    "Foo",
				MaxResultCount: 1,
			},

			expectedResponse: []*partnersql.SearchPartnersByNameRow{},
		},
		{
			name: "success - no results when max results count is 0",
			searchPartnerParams: partnersql.SearchPartnersByNameParams{
				PartnerName:    "NoResults",
				MaxResultCount: 0,
			},

			expectedResponse: []*partnersql.SearchPartnersByNameRow{},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			_, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, test.partners)
			defer removePartners()

			gotPartners, err := pdb.SearchPartnersByName(ctx, test.searchPartnerParams)
			if err != nil {
				t.Fatal(err)
			}

			if len(gotPartners) != len(test.expectedResponse) {
				t.Errorf("expected %d partners but got %d", len(test.expectedResponse), len(gotPartners))
			}

			for i, gotPartner := range gotPartners {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.expectedResponse[i], gotPartner)
			}
		})
	}
}

func TestPartnerDB_UpdatePartner(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	stationChannelItemID := baseID + 1
	stationChannelID := baseID + 2
	displayName := "New Name"
	partnerCategoryName := "snf"
	phoneCountryCode := sqltypes.ToValidNullInt32(1)
	phoneNumber := sqltypes.ToValidNullString("1234567890")
	phoneExtension := sqltypes.ToValidNullString("12")
	email := sqltypes.ToValidNullString("disuvhiud@oosf.com")
	addressLineOne := sqltypes.ToValidNullString("Address 1")
	addressLineTwo := sqltypes.ToValidNullString("Address 2")
	city := sqltypes.ToValidNullString("Denver")
	stateCode := sqltypes.ToValidNullString("CO")
	zipcode := sqltypes.ToValidNullString("12345")
	latitudeE6 := sqltypes.ToValidNullInt32(10000000)
	longitudeE6 := sqltypes.ToValidNullInt32(20000000)
	addPartnerParams := partnersql.AddPartnerParams{
		StationChannelItemID:     stationChannelItemID,
		StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
		DisplayName:              "Test Name",
		PartnerCategoryShortName: partnerCategoryName,
	}
	addLocationParams := partnersql.AddLocationParams{
		AddressLineOne: addressLineOne,
	}
	locationParams := &partnersql.UpdateLocationParams{
		AddressLineOne: addressLineOne,
		AddressLineTwo: addressLineTwo,
		City:           city,
		StateCode:      stateCode,
		ZipCode:        zipcode,
		LatitudeE6:     latitudeE6,
		LongitudeE6:    longitudeE6,
	}
	updateParams := partnersql.UpdatePartnerParams{
		DisplayName:      displayName,
		PhoneCountryCode: phoneCountryCode,
		PhoneNumber:      phoneNumber,
		PhoneExtension:   phoneExtension,
		Email:            email,
	}
	updatedPartner := &partnersql.GetPartnerByIDRow{
		ID:                       baseID,
		StationChannelItemID:     stationChannelItemID,
		StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
		DisplayName:              displayName,
		PhoneCountryCode:         phoneCountryCode,
		PhoneNumber:              phoneNumber,
		PhoneExtension:           phoneExtension,
		Email:                    email,
		AddressLineOne:           addressLineOne,
		PartnerCategoryShortName: sqltypes.ToValidNullString(partnerCategoryName),
	}
	updatedPartnerWithLocations := &partnersql.GetPartnerByIDRow{
		ID:                       baseID,
		StationChannelItemID:     stationChannelItemID,
		StationChannelID:         sqltypes.ToValidNullInt64(stationChannelID),
		DisplayName:              displayName,
		PhoneCountryCode:         phoneCountryCode,
		PhoneNumber:              phoneNumber,
		PhoneExtension:           phoneExtension,
		Email:                    email,
		AddressLineOne:           addressLineOne,
		AddressLineTwo:           addressLineTwo,
		City:                     city,
		StateCode:                stateCode,
		ZipCode:                  zipcode,
		LatitudeE6:               latitudeE6,
		LongitudeE6:              longitudeE6,
		PartnerCategoryShortName: sqltypes.ToValidNullString(partnerCategoryName),
	}
	packageIDs := []int64{1231, 2244, 3552}

	tests := []struct {
		name            string
		partner         partnersql.AddPartnerParams
		partnerPackages []int64
		updateParams    partnersql.UpdatePartnerParams
		relations       *partnerdb.PartnerRelations

		expectedPartner                  *partnersql.GetPartnerByIDRow
		expectedPartnerPackages          []*partnersql.PartnerInsurancePackage
		expectedPartnerClinicalProviders []*partnersql.PartnerClinicalProvider
		expectedError                    bool
	}{
		{
			name:         "success - package ids provided without packages in DB",
			partner:      addPartnerParams,
			updateParams: updateParams,
			relations:    &partnerdb.PartnerRelations{PackageIDs: packageIDs},

			expectedPartner: updatedPartner,
			expectedPartnerPackages: []*partnersql.PartnerInsurancePackage{
				{
					ID:        baseID + 1,
					PackageID: packageIDs[0],
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 2,
					PackageID: packageIDs[1],
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 3,
					PackageID: packageIDs[2],
					PartnerID: baseID + 1,
				},
			},
		},
		{
			name:            "success - package ids provided with packages in DB",
			partner:         addPartnerParams,
			partnerPackages: []int64{1231, 9999, 8888},
			updateParams:    updateParams,
			relations:       &partnerdb.PartnerRelations{PackageIDs: packageIDs},

			expectedPartner: updatedPartner,
			expectedPartnerPackages: []*partnersql.PartnerInsurancePackage{
				{
					ID:        baseID + 1,
					PackageID: packageIDs[0],
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 2,
					PackageID: packageIDs[1],
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 3,
					PackageID: packageIDs[2],
					PartnerID: baseID + 1,
				},
			},
		},
		{
			name:         "success - empty package ids provided without packages in DB",
			partner:      addPartnerParams,
			updateParams: updateParams,
			relations:    &partnerdb.PartnerRelations{PackageIDs: []int64{}},

			expectedPartner: updatedPartner,
		},
		{
			name:            "success - empty package ids provided with packages in DB",
			partner:         addPartnerParams,
			partnerPackages: []int64{1231, 9999, 8888},
			updateParams:    updateParams,
			relations:       &partnerdb.PartnerRelations{PackageIDs: []int64{}},

			expectedPartner: updatedPartner,
		},
		{
			name:            "success - no package ids provided",
			partner:         addPartnerParams,
			partnerPackages: []int64{1231, 9999, 8888},
			updateParams:    updateParams,
			relations:       &partnerdb.PartnerRelations{},

			expectedPartner: updatedPartner,
			expectedPartnerPackages: []*partnersql.PartnerInsurancePackage{
				{
					ID:        baseID + 1,
					PackageID: 1231,
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 2,
					PackageID: 9999,
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 3,
					PackageID: 8888,
					PartnerID: baseID + 1,
				},
			},
		},
		{
			name:            "success - update partner without relations",
			partner:         addPartnerParams,
			partnerPackages: packageIDs,
			updateParams:    updateParams,

			expectedPartner: updatedPartner,
			expectedPartnerPackages: []*partnersql.PartnerInsurancePackage{
				{
					ID:        baseID + 1,
					PackageID: packageIDs[0],
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 2,
					PackageID: packageIDs[1],
					PartnerID: baseID + 1,
				},
				{
					ID:        baseID + 3,
					PackageID: packageIDs[2],
					PartnerID: baseID + 1,
				},
			},
		},
		{
			name:            "success - update partner with location",
			partner:         addPartnerParams,
			partnerPackages: []int64{},
			updateParams:    updateParams,
			relations: &partnerdb.PartnerRelations{
				LocationParams: locationParams,
			},

			expectedPartner:         updatedPartnerWithLocations,
			expectedPartnerPackages: []*partnersql.PartnerInsurancePackage{},
		},
		{
			name:         "success - update partner with clinical provider relations",
			partner:      addPartnerParams,
			updateParams: updateParams,
			relations: &partnerdb.PartnerRelations{
				AthenaClinicalProviderIDs: []int64{baseID + 1},
			},

			expectedPartner: updatedPartner,
			expectedPartnerClinicalProviders: []*partnersql.PartnerClinicalProvider{
				{AthenaClinicalProviderID: baseID + 1},
			},
		},
		{
			name:      "error updating partner params",
			relations: &partnerdb.PartnerRelations{},

			expectedError: true,
		},
		{
			name: "error updating partner params without relations",

			expectedError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var err error
			newPartner := &partnersql.Partner{}
			if test.partner.StationChannelItemID != 0 {
				location, err := queries.AddLocation(ctx, addLocationParams)
				if err != nil {
					t.Fatal(err)
				}

				test.partner.LocationID = sqltypes.ToValidNullInt64(location.ID)
				if test.relations != nil && test.relations.LocationParams != nil {
					test.relations.LocationParams.ID = location.ID
				}
				partnerIDs, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, []partnersql.AddPartnerParams{test.partner})
				defer removePartners()

				newPartner.ID = partnerIDs[0]
				for _, partnerPackage := range test.partnerPackages {
					_, err := queries.AddPartnerInsurancePackage(ctx, partnersql.AddPartnerInsurancePackageParams{
						PackageID: partnerPackage,
						PartnerID: newPartner.ID,
					})
					if err != nil {
						t.Fatal(err)
					}
				}
			}
			test.updateParams.ID = newPartner.ID

			err = pdb.UpdatePartner(ctx, test.updateParams, test.relations)
			if (err != nil) != test.expectedError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.expectedError)
			}

			if !test.expectedError {
				partner, err := queries.GetPartnerByID(ctx, newPartner.ID)
				if err != nil {
					t.Fatal(err)
				}

				partnerPackages, err := queries.GetPartnerInsurancePackagesByPartnerID(ctx, newPartner.ID)
				if err != nil {
					t.Fatal(err)
				}

				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.expectedPartner, partner)
				if !insurancePackagesMatch(test.expectedPartnerPackages, partnerPackages) {
					t.Errorf("insurance packages do not match")
				}

				partnerClinicalProviders, err := queries.GetPartnerClinicalProvidersByPartnerID(ctx, newPartner.ID)

				testutils.MustMatch(t, err != nil, test.expectedError)
				if !partnerClinicalProvidersMatch(test.expectedPartnerClinicalProviders, partnerClinicalProviders) {
					t.Errorf("insurance packages do not match")
				}
			}
		})
	}
}

func insurancePackagesMatch(want, got []*partnersql.PartnerInsurancePackage) bool {
	wantPackageIDs := make([]int64, len(want))
	gotPackageIDs := make([]int64, len(got))
	for i, insurancePackage := range want {
		wantPackageIDs[i] = insurancePackage.PackageID
	}
	for i, insurancePackage := range got {
		gotPackageIDs[i] = insurancePackage.PackageID
	}
	return unorderedEqual(wantPackageIDs, gotPackageIDs)
}

func partnerClinicalProvidersMatch(want, got []*partnersql.PartnerClinicalProvider) bool {
	wantPackageIDs := make([]int64, len(want))
	gotPackageIDs := make([]int64, len(got))
	for i, partnerClinicalProvider := range want {
		wantPackageIDs[i] = partnerClinicalProvider.AthenaClinicalProviderID
	}
	for i, partnerClinicalProvider := range got {
		gotPackageIDs[i] = partnerClinicalProvider.AthenaClinicalProviderID
	}
	return unorderedEqual(wantPackageIDs, gotPackageIDs)
}

func addAndRemovePartners(ctx context.Context, t *testing.T, queries *partnersql.Queries, adhocQueries *adhocpartnersql.Queries, partners []partnersql.AddPartnerParams) ([]int64, func()) {
	partnerIDs := make([]int64, len(partners))
	for i, partner := range partners {
		newPartner, err := queries.AddPartner(ctx, partner)
		if err != nil {
			t.Fatal(err)
		}
		partnerIDs[i] = newPartner.ID
	}
	return partnerIDs, func() {
		for _, id := range partnerIDs {
			err := adhocQueries.DeletePartnerByID(ctx, id)
			if err != nil {
				t.Fatal(err)
			}
		}
	}
}
