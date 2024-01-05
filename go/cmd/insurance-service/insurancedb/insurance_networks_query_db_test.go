//go:build db_test

package insurancedb

import (
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v4"

	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func generateCreateInsuranceNetworkParams(payerID int64) *insurancesql.CreateInsuranceNetworkParams {
	baseID := time.Now().UnixNano()

	return &insurancesql.CreateInsuranceNetworkParams{
		Name:                      fmt.Sprintf("Network %d", baseID),
		PackageID:                 baseID,
		InsuranceClassificationID: baseID,
		InsurancePayerID:          payerID,
		InsurancePlanID:           baseID,
		IsActive:                  true,
	}
}

func TestCreateInsuranceNetwork(t *testing.T) {
	baseID := time.Now().UnixNano()
	planID := baseID + 1
	packageID := baseID + 2
	insuranceClassificationID := baseID + 3
	notes := sqltypes.ToValidNullString("amazing notes")
	emcCode := sqltypes.ToValidNullString(fmt.Sprintf("emc_code_%d", baseID))

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payerName := fmt.Sprintf("payer_to_create_%d", baseID)
	dbPayer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{Name: payerName})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description                  string
		createNetworkParams          insurancesql.CreateInsuranceNetworkParams
		createNetworkAddressesParams []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams

		error error
	}{
		{
			description: "success - creating network with all data",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				EmcCode:                   emcCode,
				IsActive:                  true,
			},
		},
		{
			description: "success - creating network with all data and addresses",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				EmcCode:                   emcCode,
				IsActive:                  true,
			},
			createNetworkAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
				{Address: "Address21", City: "City21", Zipcode: "12345", BillingState: "UA"},
				{Address: "Address22", City: "City22", Zipcode: "23456", BillingState: "CO"},
			},
		},
		{
			description: "success - creating inactive network",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				EmcCode:                   emcCode,
				IsActive:                  false,
			},
		},
		{
			description: "success - creating network without any notes",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				EmcCode:                   emcCode,
				IsActive:                  false,
			},
		},
		{
			description: "success - creating network without emc code",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				IsActive:                  true,
			},
		},
		{
			description: "success - creating network with package_id = 0 for Self Pay insurance plans",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 0,
				InsuranceClassificationID: insuranceClassificationID,
				IsActive:                  true,
			},
		},
		{
			description: "success - creating network with package_id = 0",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 0,
				InsuranceClassificationID: insuranceClassificationID,
				IsActive:                  true,
			},
		},
		{
			description: "failure - creating network without name",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				IsActive:                  true,
			},

			error: errors.New("network.name can not be blank"),
		},
		{
			description: "failure - creating network with wrong package_id",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 -1,
				InsuranceClassificationID: insuranceClassificationID,
				IsActive:                  false,
			},

			error: errors.New("network.package_id can not be less than 0"),
		},
		{
			description: "failure - creating network without insurance_classification_id",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				IsActive:                  false,
			},

			error: errors.New("network.insurance_classification_id can not be blank"),
		},
		{
			description: "failure - creating network without insurance_payer_id",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				IsActive:                  false,
			},

			error: errors.New("network.insurance_payer_id can not be blank"),
		},
		{
			description: "failure - not creating network without full addresses data",
			createNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
				InsurancePlanID:           planID,
				InsurancePayerID:          dbPayer.ID,
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				EmcCode:                   emcCode,
				IsActive:                  true,
			},
			createNetworkAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
				{Address: "Address21", Zipcode: "12345", BillingState: "UA"},
			},

			error: errors.New("network city can not be blank"),
		},
	}

	for i, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			if tc.error != nil && tc.error.Error() == "network.name can not be blank" {
				tc.createNetworkParams.Name = ""
			} else {
				tc.createNetworkParams.Name = fmt.Sprint(baseID + int64(i))
			}

			expectedNetwork := insurancesql.InsuranceNetwork{
				Name:                      tc.createNetworkParams.Name,
				Notes:                     tc.createNetworkParams.Notes,
				IsActive:                  tc.createNetworkParams.IsActive,
				EligibilityCheckEnabled:   tc.createNetworkParams.EligibilityCheckEnabled,
				ProviderEnrollmentEnabled: tc.createNetworkParams.ProviderEnrollmentEnabled,
				InsurancePlanID:           tc.createNetworkParams.InsurancePlanID,
				InsurancePayerID:          tc.createNetworkParams.InsurancePayerID,
				PackageID:                 tc.createNetworkParams.PackageID,
				InsuranceClassificationID: tc.createNetworkParams.InsuranceClassificationID,
				EmcCode:                   tc.createNetworkParams.EmcCode,
				CreatedAt:                 time.Now(),
				UpdatedAt:                 time.Now(),
			}

			network, err := insuranceDB.CreateInsuranceNetwork(ctx, tc.createNetworkParams, tc.createNetworkAddressesParams)

			if tc.error == nil {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, &expectedNetwork, network)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestGetInsuranceNetwork(t *testing.T) {
	baseID := time.Now().UnixNano()
	emcCode := sqltypes.ToValidNullString(fmt.Sprintf("emc_code_%d", baseID))

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name: fmt.Sprintf("payer_name_%d", baseID),
	})
	if err != nil {
		t.Fatal(err)
	}

	createdNetwork, err := insuranceDB.CreateInsuranceNetwork(ctx, insurancesql.CreateInsuranceNetworkParams{
		Name:                      fmt.Sprintf("network_name_%d", baseID),
		Notes:                     sqltypes.ToValidNullString("test notes"),
		PackageID:                 baseID + 1,
		InsurancePlanID:           baseID + 2,
		InsurancePayerID:          payer.ID,
		InsuranceClassificationID: baseID + 3,
		IsActive:                  true,
		EmcCode:                   emcCode,
	}, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		networkID   int64

		error error
	}{
		{
			description: "success - network with all data",
			networkID:   createdNetwork.ID,
		},
		{
			description: "failure - not rows in result set",
			networkID:   createdNetwork.ID + 1,

			error: errors.New("no rows in result set"),
		},
		{
			description: "failure - not existing network",
			networkID:   0,

			error: errors.New("invalid attempt to get InsuranceNetwork without id"),
		},
		{
			description: "failure - get network with the negative number as ID",
			networkID:   -5,

			error: errors.New("invalid attempt to get InsuranceNetwork without id"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			getNetwork, err := insuranceDB.GetInsuranceNetwork(ctx, tc.networkID)
			if tc.error == nil {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, createdNetwork, getNetwork)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestGetInsuranceNetworkByInsurancePlanID(t *testing.T) {
	baseID := time.Now().UnixNano()
	planID := baseID + 1
	packageID := baseID + 2
	insuranceClassificationID := baseID + 3
	payerGroupID := baseID + 4
	notes := sqltypes.ToValidNullString("amazing notes")
	emcCode := sqltypes.ToValidNullString(fmt.Sprintf("emc_code_%d", baseID))

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name:         fmt.Sprintf("payer_name_%d", baseID),
		PayerGroupID: payerGroupID,
	})
	if err != nil {
		t.Fatal(err)
	}

	createdNetwork, err := insuranceDB.CreateInsuranceNetwork(ctx, insurancesql.CreateInsuranceNetworkParams{
		Name:                      fmt.Sprintf("network_name_%d", baseID),
		Notes:                     notes,
		PackageID:                 packageID,
		InsurancePlanID:           planID,
		InsurancePayerID:          payer.ID,
		InsuranceClassificationID: insuranceClassificationID,
		IsActive:                  true,
		EmcCode:                   emcCode,
	}, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description     string
		insurancePlanID int64

		error error
	}{
		{
			description:     "success - network with all data",
			insurancePlanID: planID,
		},
		{
			description:     "failure - no rows in result set",
			insurancePlanID: planID + 1,

			error: errors.New("no rows in result set"),
		},
		{
			description:     "failure - invalid insurance plan id - zero",
			insurancePlanID: 0,

			error: errInvalidInsurancePlanID,
		},
		{
			description:     "failure - invalid insurance plan id - less than zero",
			insurancePlanID: -5,

			error: errInvalidInsurancePlanID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			result := &insurancesql.GetInsuranceNetworkByInsurancePlanIDRow{
				Name:                      createdNetwork.Name,
				PackageID:                 packageID,
				InsurancePlanID:           planID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer.ID,
				InsurancePayerName:        payer.Name,
				InsurancePayerGroupID:     payerGroupID,
				Notes:                     notes,
				IsActive:                  createdNetwork.IsActive,
				EmcCode:                   emcCode,
			}
			getNetwork, err := insuranceDB.GetInsuranceNetworkByInsurancePlanID(ctx, tc.insurancePlanID)
			if tc.error == nil {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, result, getNetwork)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestSearchInsuranceNetworks(t *testing.T) {
	baseID := time.Now().UnixNano()
	insuranceClassificationID := baseID + 1
	packageID := baseID + 2
	insurancePlanID := baseID + 3
	filterInsuranceClassifications := []int64{insuranceClassificationID}
	notes := sqltypes.ToValidNullString("test notes")
	emcCode := fmt.Sprintf("emc_code_%d", baseID)
	stateAbbrCO := "CO"
	stateAbbrLA := "LA"
	filterStates := []string{stateAbbrCO}

	const (
		ascOrder  = "asc"
		descOrder = "desc"
	)

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payer1, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name:     fmt.Sprintf("payer_name_%d_1", baseID),
		IsActive: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	payer2, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name:     fmt.Sprintf("payer_name_%d_2", baseID),
		IsActive: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	payer3, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name:     fmt.Sprintf("payer_name_%d_3", baseID),
		IsActive: false,
	})
	if err != nil {
		t.Fatal(err)
	}
	payer4, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name:     fmt.Sprintf("payer_name_%d_4", baseID),
		IsActive: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = insuranceDB.DeleteInsurancePayer(ctx, payer4.ID)
	if err != nil {
		t.Fatal(err)
	}

	network, err := insuranceDB.CreateInsuranceNetwork(ctx, insurancesql.CreateInsuranceNetworkParams{
		Name:                      fmt.Sprintf("a network for order checks %d", baseID),
		Notes:                     notes,
		IsActive:                  true,
		InsuranceClassificationID: insuranceClassificationID,
		InsurancePayerID:          payer2.ID,
		PackageID:                 baseID,
		InsurancePlanID:           baseID,
	}, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description         string
		createParams        insurancesql.CreateInsuranceNetworkParams
		createAddressParams []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams
		stateForNetwork     string
		searchParams        insurancesql.SearchInsuranceNetworksParams

		wantNetworkInResult bool
	}{
		{
			description: "success - network created in DB and found in results by provided payer id",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds: []int64{payer1.ID},
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - network created in DB and found in results by one of provided payer ids",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds: []int64{payer1.ID, payer2.ID},
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - network created in DB and found in filtered by classifications result",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				FilterClassifications: filterInsuranceClassifications,
			},

			wantNetworkInResult: true,
		},
		{
			description: "failure - network created in DB and not found in filtered by classifications result",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID + 1,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				FilterClassifications: filterInsuranceClassifications,
			},

			wantNetworkInResult: false,
		},
		{
			description: "success - network created in DB and found in filtered by state result",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			stateForNetwork: stateAbbrCO,
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				FilterStates: filterStates,
			},

			wantNetworkInResult: true,
		},
		{
			description: "failure - network created in DB and not found in filtered by state result",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			stateForNetwork: stateAbbrLA,
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				FilterStates: filterStates,
			},

			wantNetworkInResult: false,
		},
		{
			description: "success - network created in DB and found as a result of searching for part of its name",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				SearchString: fmt.Sprint(baseID)[:len(fmt.Sprint(baseID))-2],
			},

			wantNetworkInResult: true,
		},
		{
			description: "failure - network created in DB and not found as a result of searching for its name",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				SearchString: "NO_SUCH_NAME",
			},

			wantNetworkInResult: false,
		},
		{
			description: "failure - network doesn't creates and not appears in results",

			wantNetworkInResult: false,
		},
		{
			description: "success - default ascending order by name",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds:      []int64{payer1.ID, payer2.ID},
				SortBy:        "name",
				SortDirection: ascOrder,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - descending order by name",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds:      []int64{payer1.ID, payer2.ID},
				SortBy:        "name",
				SortDirection: descOrder,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - descending order by name with capitalized name",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds:      []int64{payer1.ID, payer2.ID},
				SortBy:        "name",
				SortDirection: descOrder,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - ascending order by updated_at",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds:      []int64{payer1.ID, payer2.ID},
				SortBy:        "updated_at",
				SortDirection: ascOrder,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - descending order by updated_at",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PayerIds:      []int64{payer1.ID, payer2.ID},
				SortBy:        "updated_at",
				SortDirection: descOrder,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - network created in DB and found only networks by network IDs search param",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				NetworkIds: []int64{network.ID},
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - network created in DB and found only networks by insurance plan IDs search param",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				InsurancePlanIds: []int64{insurancePlanID},
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - network created in DB and found by package id",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				PackageIds: []int64{packageID},
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - should return only active networks",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  false,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{},

			wantNetworkInResult: false,
		},
		{
			description: "success - network created in DB and found as a result of searching for emc_code",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 baseID,
				InsurancePlanID:           baseID,
				EmcCode:                   sqltypes.ToValidNullString(emcCode),
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				SearchString: emcCode,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - should return both active and inactive networks",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  false,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				ShowInactive: true,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - should return only active networks with passed false for show inactive filter",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  false,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				ShowInactive: false,
			},

			wantNetworkInResult: false,
		},
		{
			description: "success - should not return insurance network with inactive insurance payer",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer3.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{},

			wantNetworkInResult: false,
		},
		{
			description: "success - should return insurance networks with inactive payers",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer3.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				ShowInactive: true,
			},

			wantNetworkInResult: true,
		},
		{
			description: "success - should not return insurance network with archived insurance payer",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer4.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			searchParams: insurancesql.SearchInsuranceNetworksParams{},

			wantNetworkInResult: false,
		},
		{
			description: "success - should return insurance network as a result of searching for address",
			createParams: insurancesql.CreateInsuranceNetworkParams{
				Notes:                     notes,
				IsActive:                  true,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          payer1.ID,
				PackageID:                 packageID,
				InsurancePlanID:           insurancePlanID,
			},
			createAddressParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{{
				City:         "TestCity",
				Zipcode:      "12345",
				Address:      "TestAddressForSearch",
				BillingState: "UA",
			}},
			searchParams: insurancesql.SearchInsuranceNetworksParams{
				SearchString: "TestAddressForSearch",
			},

			wantNetworkInResult: true,
		},
	}

	for i, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			tc.createParams.Name = fmt.Sprint(baseID + int64(i))
			createdNetwork, _ := insuranceDB.CreateInsuranceNetwork(ctx, tc.createParams, tc.createAddressParams)

			if tc.stateForNetwork != "" {
				networkStatesParams := []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
					{InsuranceNetworkID: createdNetwork.ID, StateAbbr: tc.stateForNetwork},
				}
				_, err := insuranceDB.UpdateInsuranceNetworkStates(ctx, createdNetwork.ID, networkStatesParams)
				if err != nil {
					t.Fatal(err)
				}
			}

			dbNetworks, err := insuranceDB.SearchInsuranceNetworks(ctx, tc.searchParams)
			if err != nil {
				t.Fatal(err)
			}

			found := false
			for _, dbNetwork := range dbNetworks {
				if createdNetwork == nil {
					break
				}
				if tc.searchParams.NetworkIds != nil {
					for _, networkID := range tc.searchParams.NetworkIds {
						if networkID == dbNetwork.ID {
							found = true
						}
					}
				} else {
					found = dbNetwork.ID == createdNetwork.ID
				}

				if found {
					break
				}
			}

			switch tc.searchParams.SortBy {
			case "name":
				if tc.searchParams.SortDirection == ascOrder {
					for i := 1; i < len(dbNetworks); i++ {
						if strings.ToLower(dbNetworks[i-1].Name) > strings.ToLower(dbNetworks[i].Name) {
							t.Fatalf("unexpected asc order by name: %v > %v", dbNetworks[i-1].Name, dbNetworks[i].Name)
						}
					}
				} else {
					for i := 1; i < len(dbNetworks); i++ {
						if strings.ToLower(dbNetworks[i-1].Name) < strings.ToLower(dbNetworks[i].Name) {
							t.Fatalf("unexpected desc order by name: %v < %v", dbNetworks[i-1].Name, dbNetworks[i].Name)
						}
					}
				}
			case "updated_at":
				if tc.searchParams.SortDirection == ascOrder {
					if dbNetworks[0].UpdatedAt.After(dbNetworks[1].UpdatedAt) {
						t.Fatalf("unexpected desc order by name: %v < %v", dbNetworks[0].UpdatedAt, dbNetworks[1].UpdatedAt)
					}
				} else {
					if dbNetworks[0].UpdatedAt.Before(dbNetworks[1].UpdatedAt) {
						t.Fatalf("unexpected desc order by updated_at: %v < %v", dbNetworks[0].UpdatedAt, dbNetworks[1].UpdatedAt)
					}
				}
			}

			testutils.MustMatch(t, found, tc.wantNetworkInResult)
		})
	}
}

func TestGetInsuranceNetworkAddressByInsuranceNetworksIDs(t *testing.T) {
	baseID := time.Now().UnixNano()
	var emptyAddresses []*insurancesql.InsuranceNetworkAddress

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name: fmt.Sprintf("payer_name_%d", baseID),
	})
	if err != nil {
		t.Fatal(err)
	}

	emptyAddressesParams := []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{}
	networkWithoutAddressesParams := generateCreateInsuranceNetworkParams(payer.ID)
	networkWithoutAddresses, err := insuranceDB.CreateInsuranceNetwork(ctx, *networkWithoutAddressesParams, emptyAddressesParams)
	if err != nil {
		t.Fatal(err)
	}

	firstNetworkWithAddressesParams := generateCreateInsuranceNetworkParams(payer.ID)
	firstNetworkAddressesParams := []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
		{Address: "Address3", City: "City3", Zipcode: "34567", BillingState: "LA"},
	}
	firstNetworkWithAddresses, err := insuranceDB.CreateInsuranceNetwork(ctx, *firstNetworkWithAddressesParams, firstNetworkAddressesParams)
	if err != nil {
		t.Fatal(err)
	}

	secondNetworkWithAddressesParams := generateCreateInsuranceNetworkParams(payer.ID)
	secondNetworkAddressesParams := []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
		{Address: "Address21", City: "City21", Zipcode: "12345", BillingState: "UA"},
		{Address: "Address22", City: "City22", Zipcode: "23456", BillingState: "CO"},
	}
	secondNetworkWithAddresses, err := insuranceDB.CreateInsuranceNetwork(ctx, *secondNetworkWithAddressesParams, secondNetworkAddressesParams)
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		networkIDs  []int64

		want []*insurancesql.InsuranceNetworkAddress
	}{
		{
			description: "success - there is no addresses for given network id",
			networkIDs:  []int64{networkWithoutAddresses.ID},

			want: emptyAddresses,
		},
		{
			description: "success - there is no addresses for uncreated network id",

			want: emptyAddresses,
		},
		{
			description: "success - network with one address",
			networkIDs:  []int64{firstNetworkWithAddresses.ID},

			want: []*insurancesql.InsuranceNetworkAddress{
				{InsuranceNetworkID: firstNetworkWithAddresses.ID, Address: "Address3", City: "City3", Zipcode: "34567", BillingState: "LA"},
			},
		},
		{
			description: "success - network with two addresses",
			networkIDs:  []int64{secondNetworkWithAddresses.ID},

			want: []*insurancesql.InsuranceNetworkAddress{
				{InsuranceNetworkID: secondNetworkWithAddresses.ID, Address: "Address21", City: "City21", Zipcode: "12345", BillingState: "UA"},
				{InsuranceNetworkID: secondNetworkWithAddresses.ID, Address: "Address22", City: "City22", Zipcode: "23456", BillingState: "CO"},
			},
		},
		{
			description: "success - multiple networks with multiple addresses for each",
			networkIDs:  []int64{firstNetworkWithAddresses.ID, secondNetworkWithAddresses.ID},

			want: []*insurancesql.InsuranceNetworkAddress{
				{InsuranceNetworkID: firstNetworkWithAddresses.ID, Address: "Address3", City: "City3", Zipcode: "34567", BillingState: "LA"},
				{InsuranceNetworkID: secondNetworkWithAddresses.ID, Address: "Address21", City: "City21", Zipcode: "12345", BillingState: "UA"},
				{InsuranceNetworkID: secondNetworkWithAddresses.ID, Address: "Address22", City: "City22", Zipcode: "23456", BillingState: "CO"},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			addresses, err := insuranceDB.GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx, tc.networkIDs)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID")(t, addresses, tc.want)
		})
	}
}

func TestGetInsuranceNetworkStatesByInsuranceNetworksIDs(t *testing.T) {
	baseID := time.Now().UnixNano()
	var emptyStates []*insurancesql.InsuranceNetworkState

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name: fmt.Sprintf("payer_name_%d", baseID),
	})
	if err != nil {
		t.Fatal(err)
	}

	firstNetworkWithStatesParams := generateCreateInsuranceNetworkParams(payer.ID)
	firstNetworkWithStates, err := insuranceDB.CreateInsuranceNetwork(ctx, *firstNetworkWithStatesParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}
	secondNetworkWithStatesParams := generateCreateInsuranceNetworkParams(payer.ID)
	secondNetworkWithStates, err := insuranceDB.CreateInsuranceNetwork(ctx, *secondNetworkWithStatesParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}
	networkWithoutStatesParams := generateCreateInsuranceNetworkParams(payer.ID)
	networkWithoutStates, err := insuranceDB.CreateInsuranceNetwork(ctx, *networkWithoutStatesParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}

	secondNetworkStatesParams := []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
		{InsuranceNetworkID: secondNetworkWithStates.ID, StateAbbr: "UA"},
		{InsuranceNetworkID: secondNetworkWithStates.ID, StateAbbr: "NY"},
	}
	_, err = insuranceDB.UpdateInsuranceNetworkStates(ctx, secondNetworkWithStates.ID, secondNetworkStatesParams)
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description               string
		networkIDs                []int64
		updateNetworkStatesParams []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams

		want []*insurancesql.InsuranceNetworkState
	}{
		{
			description: "success - there is no states for given network id",
			networkIDs:  []int64{networkWithoutStates.ID},

			want: emptyStates,
		},
		{
			description: "success - there is no states for uncreated network id",
			networkIDs:  []int64{baseID},

			want: emptyStates,
		},
		{
			description: "success - network with two states",
			networkIDs:  []int64{firstNetworkWithStates.ID},
			updateNetworkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "CO"},
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "LA"},
			},

			want: []*insurancesql.InsuranceNetworkState{
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "CO"},
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "LA"},
			},
		},
		{
			description: "success - network with one state",
			networkIDs:  []int64{firstNetworkWithStates.ID},
			updateNetworkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "UA"},
			},

			want: []*insurancesql.InsuranceNetworkState{
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "UA"},
			},
		},
		{
			description: "success - multiple networks with multiple states for each",
			networkIDs:  []int64{firstNetworkWithStates.ID, secondNetworkWithStates.ID},
			updateNetworkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "LA"},
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "TX"},
			},

			want: []*insurancesql.InsuranceNetworkState{
				{InsuranceNetworkID: secondNetworkWithStates.ID, StateAbbr: "UA"},
				{InsuranceNetworkID: secondNetworkWithStates.ID, StateAbbr: "NY"},
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "LA"},
				{InsuranceNetworkID: firstNetworkWithStates.ID, StateAbbr: "TX"},
			},
		},
		{
			description:               "success - updated network with empty list of states",
			networkIDs:                []int64{firstNetworkWithStates.ID},
			updateNetworkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{},

			want: emptyStates,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			_, err := insuranceDB.UpdateInsuranceNetworkStates(ctx, tc.networkIDs[0], tc.updateNetworkStatesParams)
			if err != nil {
				t.Fatal(err)
			}

			states, err := insuranceDB.GetInsuranceNetworkStatesByInsuranceNetworksIDs(ctx, tc.networkIDs)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID")(t, states, tc.want)
		})
	}
}

func TestUpdateInsuranceNetwork(t *testing.T) {
	baseID := time.Now().UnixNano()

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	networkUpdatedName := fmt.Sprintf("Network updated %d", baseID)
	networkUpdatedIsActive := true
	networkUpdatedPackageID := baseID + 1
	networkUpdatedInsuranceClassificationID := baseID + 1
	networkUpdatedInsurancePlanID := baseID + 1
	networkUpdatedNotes := sqltypes.ToValidNullString("very interesting notes.")
	emcCode := sqltypes.ToValidNullString(fmt.Sprintf("emc_code_%d", baseID))

	payerName := fmt.Sprintf("payer_to_create_%d", baseID)

	input := insurancesql.CreateInsurancePayerParams{Name: payerName}
	dbPayer, err := insuranceDB.CreateInsurancePayer(ctx, input)
	if err != nil {
		t.Fatal(err)
	}

	createNetworkInput := generateCreateInsuranceNetworkParams(dbPayer.ID)
	dbNetwork, err := insuranceDB.CreateInsuranceNetwork(ctx, *createNetworkInput, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description            string
		networkParams          *insurancesql.UpdateInsuranceNetworkParams
		networkAddressesParams []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams
		want                   *insurancesql.InsuranceNetwork

		error error
	}{
		{
			description: "success - updates insurance network",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				Notes:                     networkUpdatedNotes,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          dbPayer.ID,
				InsurancePlanID:           networkUpdatedInsurancePlanID,
				IsActive:                  networkUpdatedIsActive,
				EmcCode:                   emcCode,
			},

			want: &insurancesql.InsuranceNetwork{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				Notes:                     networkUpdatedNotes,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          dbPayer.ID,
				InsurancePlanID:           networkUpdatedInsurancePlanID,
				IsActive:                  networkUpdatedIsActive,
				EmcCode:                   emcCode,
			},
		},
		{
			description: "success - updates insurance network with address",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				Notes:                     networkUpdatedNotes,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          dbPayer.ID,
				InsurancePlanID:           networkUpdatedInsurancePlanID,
				IsActive:                  networkUpdatedIsActive,
				EmcCode:                   emcCode,
			},
			networkAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
				{Address: "Address21", City: "City21", Zipcode: "12345", BillingState: "UA"},
				{Address: "Address22", City: "City22", Zipcode: "23456", BillingState: "CO"},
			},

			want: &insurancesql.InsuranceNetwork{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				Notes:                     networkUpdatedNotes,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          dbPayer.ID,
				InsurancePlanID:           networkUpdatedInsurancePlanID,
				IsActive:                  networkUpdatedIsActive,
				EmcCode:                   emcCode,
			},
		},
		{
			description: "failure - no such insurance network",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        0,
				Name:                      networkUpdatedName,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          dbPayer.ID,
			},

			error: pgx.ErrNoRows,
		},
		{
			description:   "failure - invalid insurance network name argument",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{ID: dbNetwork.ID, Name: ""},

			error: errors.New("network.name can not be blank"),
		},
		{
			description:   "failure - invalid insurance network package ID argument",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{ID: dbNetwork.ID, Name: networkUpdatedName, PackageID: -1},

			error: errors.New("network.package_id can not be less than 0"),
		},
		{
			description: "failure - invalid insurance network classification ID argument",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: 0,
			},

			error: errors.New("network.insurance_classification_id can not be blank"),
		},
		{
			description: "failure - invalid insurance network payer ID argument",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          0,
			},

			error: errors.New("network.insurance_payer_id can not be blank"),
		},
		{
			description: "failure - not updating network without full addresses data",
			networkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        dbNetwork.ID,
				Name:                      networkUpdatedName,
				Notes:                     networkUpdatedNotes,
				PackageID:                 networkUpdatedPackageID,
				InsuranceClassificationID: networkUpdatedInsuranceClassificationID,
				InsurancePayerID:          dbPayer.ID,
				InsurancePlanID:           networkUpdatedInsurancePlanID,
				IsActive:                  networkUpdatedIsActive,
				EmcCode:                   emcCode,
			},
			networkAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
				{Address: "Address21", Zipcode: "12345", BillingState: "UA"},
			},

			error: errors.New("network city can not be blank"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			updatedNetwork, err := insuranceDB.UpdateInsuranceNetwork(ctx, *tc.networkParams, tc.networkAddressesParams)

			if tc.error == nil {
				testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, updatedNetwork, tc.want)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestUpdateInsuranceNetworkStates(t *testing.T) {
	baseID := time.Now().UnixNano()
	var emptyStates []*insurancesql.InsuranceNetworkState

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payerName := fmt.Sprintf("payer_to_create_%d", baseID)

	createPayerInput := insurancesql.CreateInsurancePayerParams{Name: payerName}
	dbPayer, err := insuranceDB.CreateInsurancePayer(ctx, createPayerInput)
	if err != nil {
		t.Fatal(err)
	}

	createNetworkInput := generateCreateInsuranceNetworkParams(dbPayer.ID)
	dbNetwork, err := insuranceDB.CreateInsuranceNetwork(ctx, *createNetworkInput, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description         string
		networkID           int64
		networkStatesParams []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams
		want                []*insurancesql.InsuranceNetworkState

		error error
	}{
		{
			description: "success - update network states",
			networkID:   dbNetwork.ID,
			networkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "CO"},
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "LA"},
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "NY"},
			},

			want: []*insurancesql.InsuranceNetworkState{
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "CO"},
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "LA"},
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "NY"},
			},
		},
		{
			description: "success - update network with one state",
			networkID:   dbNetwork.ID,
			networkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "TX"},
			},

			want: []*insurancesql.InsuranceNetworkState{
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "TX"},
			},
		},
		{
			description:         "success - update networks with empty states array",
			networkID:           dbNetwork.ID,
			networkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{},

			want: emptyStates,
		},
		{
			description: "failure - update networks with wrong states array",
			networkID:   dbNetwork.ID,
			networkStatesParams: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: dbNetwork.ID, StateAbbr: "bad abbr"},
			},

			error: errors.New("ERROR: value too long for type character varying(2) (SQLSTATE 22001)"),
		},
		{
			description: "failure - invalid insurance network id argument",
			networkID:   int64(0),

			error: errors.New("invalid attempt to get InsuranceNetwork without id"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			updatedNetworkStates, err := insuranceDB.UpdateInsuranceNetworkStates(ctx, tc.networkID, tc.networkStatesParams)
			if err != nil && tc.error == nil {
				t.Fatal(err)
			}

			if tc.error == nil {
				testutils.MustMatchFn(".ID")(t, updatedNetworkStates, tc.want)
			} else {
				testutils.MustMatch(t, tc.error.Error(), err.Error())
			}
		})
	}
}

func TestCreateInsuranceNetworksAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	modalityType := "in_person"
	newPatientAppointmentType := "D0-7"
	existingPatientAppointmentType := "D0-8"

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	tcs := []struct {
		description string
		input       insurancesql.CreateInsuranceNetworksAppointmentTypesParams

		want      []*insurancesql.InsuranceNetworksAppointmentType
		wantError bool
	}{
		{
			description: "success - creates networks appointment types",
			input: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
				NetworkIds:                      []int64{networkID},
				ServiceLineIds:                  []int64{serviceLineID},
				ModalityTypes:                   []string{modalityType},
				NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
				ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
			},

			want: []*insurancesql.InsuranceNetworksAppointmentType{
				{
					NetworkID:                      networkID,
					ServiceLineID:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},
		},
		{
			description: "error - creates networks failed due to nil values",
			input: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
				NetworkIds:                      []int64{},
				ServiceLineIds:                  []int64{serviceLineID},
				ModalityTypes:                   []string{modalityType},
				NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
				ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
			},

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			networksAppointmentTypes, err := insuranceDB.CreateInsuranceNetworksAppointmentTypes(ctx, tc.input)
			if tc.wantError && err == nil {
				t.Fatal("Want error but received nil")
			}
			if !tc.wantError && err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID")(t, tc.want, networksAppointmentTypes)
		})
	}
}

func TestUpdateInsuranceNetworkAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	modalityType := "tele_p"
	newPatientAppointmentType := "DH-7"
	existingPatientAppointmentType := "DH-8"

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	tcs := []struct {
		description string
		input       UpdateInsuranceNetworkAppointmentTypesParams

		want      []*insurancesql.InsuranceNetworksAppointmentType
		wantError bool
	}{
		{
			description: "success - creates networks appointment types",
			input: UpdateInsuranceNetworkAppointmentTypesParams{
				NetworkID: networkID,
				AppointmentTypes: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
					NetworkIds:                      []int64{networkID},
					ServiceLineIds:                  []int64{serviceLineID},
					ModalityTypes:                   []string{modalityType},
					NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
					ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
				},
			},

			want: []*insurancesql.InsuranceNetworksAppointmentType{
				{
					NetworkID:                      networkID,
					ServiceLineID:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},
		},
		{
			description: "error - failed to delete existing appointment types",
			input: UpdateInsuranceNetworkAppointmentTypesParams{
				NetworkID: networkID,
				AppointmentTypes: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
					NetworkIds:                      []int64{networkID},
					ServiceLineIds:                  []int64{},
					ModalityTypes:                   []string{modalityType},
					NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
					ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
				},
			},

			wantError: true,
			want: []*insurancesql.InsuranceNetworksAppointmentType{
				{
					NetworkID:                      networkID,
					ServiceLineID:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},
		},
		{
			description: "error - creates networks failed due to nil values in appointment types",
			input: UpdateInsuranceNetworkAppointmentTypesParams{
				NetworkID: networkID,
				AppointmentTypes: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
					NetworkIds:                      []int64{networkID},
					ServiceLineIds:                  []int64{},
					ModalityTypes:                   []string{modalityType},
					NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
					ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
				},
			},

			wantError: true,
			want: []*insurancesql.InsuranceNetworksAppointmentType{
				{
					NetworkID:                      networkID,
					ServiceLineID:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			networksAppointmentTypes, err := insuranceDB.UpdateInsuranceNetworkAppointmentTypes(ctx, tc.input)
			if tc.wantError && err == nil {
				t.Fatal("Want error but received nil")
			}
			if !tc.wantError && err != nil {
				t.Fatal(err)
			}
			if tc.wantError && tc.want != nil {
				dbAppointmentTypes, err := insuranceDB.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx, insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{
					NetworkID: tc.input.NetworkID,
				})
				if err != nil {
					t.Fatal(err)
				}

				testutils.MustMatchFn(".ID")(t, tc.want, dbAppointmentTypes)
			} else {
				testutils.MustMatchFn(".ID")(t, tc.want, networksAppointmentTypes)
			}
		})
	}
}

func TestGetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	firstServiceLineID := baseID + 2
	secondServiceLineID := baseID + 3
	modalityType := "in_person"
	newPatientAppointmentType := "D0-7"
	existingPatientAppointmentType := "D0-8"
	invalidNetworkID := int64(0)

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	networkAppointmentTypesWithFirstServiceLine, err := insuranceDB.CreateInsuranceNetworksAppointmentTypes(ctx, insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
		NetworkIds:                      []int64{networkID},
		ServiceLineIds:                  []int64{firstServiceLineID},
		ModalityTypes:                   []string{modalityType},
		NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
		ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
	})
	if err != nil {
		t.Fatal(err)
	}

	networkAppointmentTypesWithSecondServiceLine, err := insuranceDB.CreateInsuranceNetworksAppointmentTypes(ctx, insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
		NetworkIds:                      []int64{networkID},
		ServiceLineIds:                  []int64{secondServiceLineID},
		ModalityTypes:                   []string{modalityType},
		NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
		ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		input       insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams

		want      []*insurancesql.InsuranceNetworksAppointmentType
		wantError error
	}{
		{
			description: "success - returns all appointment types for given network",
			input: insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{
				NetworkID: networkID,
			},

			want: append(networkAppointmentTypesWithFirstServiceLine, networkAppointmentTypesWithSecondServiceLine...),
		},
		{
			description: "success - return all appointment types for given network and service line",
			input: insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{
				NetworkID:     networkID,
				ServiceLineID: sqltypes.ToNullInt64(&firstServiceLineID),
			},

			want: networkAppointmentTypesWithFirstServiceLine,
		},
		{
			description: "failure - invalid network.id argument",
			input: insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{
				NetworkID: invalidNetworkID,
			},

			wantError: fmt.Errorf("network_id should be greater than 0"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			networksAppointmentTypes, err := insuranceDB.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx, tc.input)

			testutils.MustMatch(t, tc.want, networksAppointmentTypes)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestDeleteInsuranceNetworksAppointmentTypesByInsuranceNetworkID(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	modalityType := "virtual"
	newPatientAppointmentType := "D11-6"
	existingPatientAppointmentType := "D11-7"

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	_, err := insuranceDB.CreateInsuranceNetworksAppointmentTypes(ctx, insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
		NetworkIds:                      []int64{networkID},
		ServiceLineIds:                  []int64{serviceLineID},
		ModalityTypes:                   []string{modalityType},
		NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
		ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		input       int64
	}{
		{
			description: "success - deletes appointment types for given network",
			input:       networkID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			err := insuranceDB.DeleteInsuranceNetworksAppointmentTypesByInsuranceNetworkID(ctx, tc.input)
			if err != nil {
				t.Fatal(err)
			}

			appointmentTypes, err := insuranceDB.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx, insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{NetworkID: tc.input})
			if err != nil {
				t.Fatal(err)
			}

			if appointmentTypes != nil {
				t.Fatal("Should delete appointment types for given insurance network, but received result")
			}
		})
	}
}
