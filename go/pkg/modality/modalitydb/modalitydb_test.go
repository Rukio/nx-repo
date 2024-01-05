//go:build db_test

package modalitydb

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	modalitysql "github.com/*company-data-covered*/services/go/pkg/generated/sql/modality"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

const (
	testDBName          = "modality"
	testMarketID        = int64(42)
	testInsurancePlanID = int64(432)
	testNetworkID       = int64(100)
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *modalitysql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, modalitysql.New(db), db.Close
}

/*
Generate n number of ModalityConfigs which can be saved to DB with 1 specific service line id.
*/
func generateModalityConfigs(numToGenerate int, serviceLineID int64) []*ModalityConfig {
	var modalityConfigs = make([]*ModalityConfig, numToGenerate)
	for i := range modalityConfigs {
		modalityConfigs[i] = &ModalityConfig{
			ServiceLineID:   serviceLineID,
			MarketID:        int64(rand.Intn(5) + 1),
			InsurancePlanID: int64(rand.Intn(10) + 1),
			ModalityID:      int64(rand.Intn(2) + 1),
		}
	}
	return modalityConfigs
}

func createModalityConfig(t *testing.T, serviceLineID int64, modalityID int64, queries *modalitysql.Queries) {
	createQueryParams := []modalitysql.CreateModalityConfigurationsParams{
		{
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,
			ModalityID:      modalityID,
			ServiceLineID:   serviceLineID,
		},
	}
	_, err := queries.CreateModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}
}

func createModalityConfigs(t *testing.T, serviceLineID int64, queries *modalitysql.Queries) []*ModalityConfig {
	modalityConfigs := generateModalityConfigs(10, serviceLineID)

	var createQueryParams []modalitysql.CreateModalityConfigurationsParams
	for _, mc := range modalityConfigs {
		createQueryParams = append(createQueryParams, modalitysql.CreateModalityConfigurationsParams{
			MarketID:        mc.MarketID,
			InsurancePlanID: mc.InsurancePlanID,
			ModalityID:      mc.ModalityID,
			ServiceLineID:   mc.ServiceLineID,
		})
	}
	_, err := queries.CreateModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}

	return modalityConfigs
}

/*
Generate n number of MarketModalityConfigs which can be saved to DB with 1 specific service line id.
*/
func generateMarketModalityConfigs(numToGenerate int, serviceLineID int64) []*MarketModalityConfig {
	var modalityConfigs = make([]*MarketModalityConfig, numToGenerate)
	for i := range modalityConfigs {
		modalityConfigs[i] = &MarketModalityConfig{
			ServiceLineID: serviceLineID,
			MarketID:      int64(rand.Intn(5) + 1),
			ModalityID:    int64(rand.Intn(2) + 1),
		}
	}
	return modalityConfigs
}

func createMarketModalityConfigs(t *testing.T, serviceLineID int64, queries *modalitysql.Queries) []*MarketModalityConfig {
	marketModalityConfigs := generateMarketModalityConfigs(10, serviceLineID)

	createQueryParams := make([]modalitysql.CreateMarketModalityConfigurationsParams, len(marketModalityConfigs))
	for i, mc := range marketModalityConfigs {
		createQueryParams[i] = modalitysql.CreateMarketModalityConfigurationsParams{
			MarketID:      mc.MarketID,
			ModalityID:    mc.ModalityID,
			ServiceLineID: mc.ServiceLineID,
		}
	}
	_, err := queries.CreateMarketModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}

	return marketModalityConfigs
}

func createMarketModalityConfig(t *testing.T, serviceLineID int64, modalityID int64, queries *modalitysql.Queries) {
	createQueryParams := []modalitysql.CreateMarketModalityConfigurationsParams{
		{
			MarketID:      testMarketID,
			ModalityID:    modalityID,
			ServiceLineID: serviceLineID,
		},
	}
	_, err := queries.CreateMarketModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}
}

/*
Generate n number of NetworkModalityConfigs which can be saved to DB with 1 specific network id.
*/
func generateNetworkModalityConfigs(numToGenerate int, networkID int64) []*NetworkModalityConfig {
	var networkModalityConfigs = make([]*NetworkModalityConfig, numToGenerate)
	for i := range networkModalityConfigs {
		networkModalityConfigs[i] = &NetworkModalityConfig{
			NetworkID:     networkID,
			ServiceLineID: int64(rand.Intn(3) + 1),
			BillingCityID: int64(rand.Intn(5) + 1),
			ModalityID:    int64(rand.Intn(2) + 1),
		}
	}
	return networkModalityConfigs
}

func generateNetworkModalityConfigsWithServiceLineID(numToGenerate int, networkID int64, serviceLineID int64) []*NetworkModalityConfig {
	networkModalityConfigs := make([]*NetworkModalityConfig, numToGenerate)
	for i := range networkModalityConfigs {
		networkModalityConfigs[i] = &NetworkModalityConfig{
			NetworkID:     networkID,
			ServiceLineID: serviceLineID,
			BillingCityID: int64(rand.Intn(5) + 1),
			ModalityID:    int64(rand.Intn(2) + 1),
		}
	}
	return networkModalityConfigs
}

func createNetworkModalityConfigs(t *testing.T, networkID int64, queries *modalitysql.Queries) []*NetworkModalityConfig {
	networkModalityConfigs := generateNetworkModalityConfigs(10, networkID)

	createQueryParams := make([]modalitysql.CreateNetworkModalityConfigurationsParams, len(networkModalityConfigs))
	for i, nc := range networkModalityConfigs {
		createQueryParams[i] = modalitysql.CreateNetworkModalityConfigurationsParams{
			NetworkID:     nc.NetworkID,
			BillingCityID: nc.BillingCityID,
			ModalityID:    nc.ModalityID,
			ServiceLineID: nc.ServiceLineID,
		}
	}
	_, err := queries.CreateNetworkModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}

	return networkModalityConfigs
}

func createNetworkModalityConfigsWithGivenServiceLine(t *testing.T, networkID int64, serviceLineID int64, queries *modalitysql.Queries) []*NetworkModalityConfig {
	networkModalityConfigs := generateNetworkModalityConfigsWithServiceLineID(10, networkID, serviceLineID)

	createQueryParams := make([]modalitysql.CreateNetworkModalityConfigurationsParams, len(networkModalityConfigs))
	for i, nc := range networkModalityConfigs {
		createQueryParams[i] = modalitysql.CreateNetworkModalityConfigurationsParams{
			NetworkID:     nc.NetworkID,
			BillingCityID: nc.BillingCityID,
			ModalityID:    nc.ModalityID,
			ServiceLineID: nc.ServiceLineID,
		}
	}
	_, err := queries.CreateNetworkModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("fatal error %s", err)
	}

	return networkModalityConfigs
}

func createNetworkModalityConfig(t *testing.T, networkID int64, serviceLineID int64, modalityID int64, billingCityID int64, queries *modalitysql.Queries) {
	createQueryParams := []modalitysql.CreateNetworkModalityConfigurationsParams{
		{
			NetworkID:     networkID,
			ServiceLineID: serviceLineID,
			ModalityID:    modalityID,
			BillingCityID: billingCityID,
		},
	}
	_, err := queries.CreateNetworkModalityConfigurations(context.Background(), createQueryParams)
	if err != nil {
		t.Fatalf("failed to create network modality config %s", err)
	}
}

func TestNewModalityDB(t *testing.T) {
	_, db, _, done := setupDBTest(t)
	defer done()

	t.Run("Create modality DB connection", func(t *testing.T) {
		mdb := NewModalityDB(db, nil)

		if mdb == nil {
			t.Fatal("DB was not connected")
		}
	})
}

func TestGetModalities(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	modalityDB := NewModalityDB(db, nil)
	modalities, err := modalityDB.GetModalities(ctx)
	var modalityTypes [3]string
	for i, m := range modalities {
		modalityTypes[i] = m.ModalityType
	}
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}
	testutils.MustMatch(t, 3, len(modalities), "modalities count didn't match")
	testutils.MustMatch(t, [3]string{"in_person", "telepresentation", "virtual"}, modalityTypes, "modalities order don`t match")
}

func TestGetModalityConfigsByServiceLineID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()

	serviceLineWithConfigs := baseID + 1

	mockedModalityConfigs := createModalityConfigs(t, serviceLineWithConfigs, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		Description   string
		ServiceLineID int64

		WantError bool
	}{
		{
			Description:   "should return modalities",
			ServiceLineID: serviceLineWithConfigs,

			WantError: false,
		},
		{
			Description:   "should return error",
			ServiceLineID: int64(0),

			WantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			modalityConfigs, err := modalityDB.GetModalityConfigsByServiceLineID(ctx, tc.ServiceLineID)

			if err != nil && !tc.WantError {
				t.Fatalf("fatal error %s \n", err)
			}

			if !tc.WantError {
				testutils.MustMatchFn(".ID")(t, mockedModalityConfigs, modalityConfigs, "values don't match after initial mod configs creation")
				testutils.MustMatch(t, len(mockedModalityConfigs), len(modalityConfigs), "modality configs count didn't match after creation")
			} else {
				testutils.MustMatch(t, "invalid get modality configurations query with service line id: 0", err.Error(), "Test should give correct error if there is no service line id")
			}
		})
	}
}

func TestGetMarketModalityConfigsByServiceLineID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()

	serviceLineWithConfigs := baseID + 1

	mockedMarketModalityConfigs := createMarketModalityConfigs(t, serviceLineWithConfigs, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		Description   string
		ServiceLineID int64

		WantError bool
	}{
		{
			Description:   "should return modalities",
			ServiceLineID: serviceLineWithConfigs,

			WantError: false,
		},
		{
			Description:   "should return error",
			ServiceLineID: int64(0),

			WantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			marketModalityConfigs, err := modalityDB.GetMarketModalityConfigsByServiceLineID(ctx, tc.ServiceLineID)

			if err != nil && !tc.WantError {
				t.Fatalf("fatal error %s \n", err)
			}

			if !tc.WantError {
				testutils.MustMatchFn(".ID")(t, mockedMarketModalityConfigs, marketModalityConfigs, "values don't match after initial mod configs creation")
				testutils.MustMatch(t, len(mockedMarketModalityConfigs), len(marketModalityConfigs), "modality configs count didn't match after creation")
			} else {
				testutils.MustMatch(t, "invalid get market modality configurations query with service line id: 0", err.Error(), "Test should give correct error if there is no service line id")
			}
		})
	}
}

func TestUpdateModalityConfigs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()

	serviceLineWithConfigs := baseID + 1

	createModalityConfigs(t, serviceLineWithConfigs, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		Description   string
		ServiceLineID int64

		WantError bool
	}{
		{
			Description:   "should create modality configs",
			ServiceLineID: baseID + 1,

			WantError: false,
		},
		{
			Description:   "should update modality configs",
			ServiceLineID: serviceLineWithConfigs,

			WantError: false,
		},
		{
			Description:   "should return error",
			ServiceLineID: int64(0),

			WantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			updateModalityConfigs := generateModalityConfigs(5, tc.ServiceLineID)
			modalityConfigs, err := modalityDB.UpdateModalityConfigs(ctx, UpdateModalityConfigsParams{
				ServiceLineID: tc.ServiceLineID,
				Configs:       updateModalityConfigs,
			})

			if err != nil && !tc.WantError {
				t.Fatalf("fatal error %s \n", err)
			}

			if !tc.WantError {
				testutils.MustMatchFn(".ID")(t, updateModalityConfigs, modalityConfigs, "values don't match after initial mod configs creation")
			} else {
				testutils.MustMatch(t, "invalid update modality configurations query with service line id: 0", err.Error(), "Test should give correct error if there is no service line id")
			}
		})
	}
}

func TestUpdateMarketModalityConfigs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()

	serviceLineWithConfigs := baseID + 1

	createMarketModalityConfigs(t, serviceLineWithConfigs, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		Description   string
		ServiceLineID int64

		WantError bool
	}{
		{
			Description:   "should create modality configs",
			ServiceLineID: baseID + 2,

			WantError: false,
		},
		{
			Description:   "should update modality configs",
			ServiceLineID: serviceLineWithConfigs,

			WantError: false,
		},
		{
			Description:   "should return error",
			ServiceLineID: int64(0),

			WantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			updateMarketModalityConfigs := generateMarketModalityConfigs(5, tc.ServiceLineID)
			marketModalityConfigs, err := modalityDB.UpdateMarketModalityConfigs(ctx, UpdateMarketModalityConfigsParams{
				ServiceLineID: tc.ServiceLineID,
				Configs:       updateMarketModalityConfigs,
			})

			if err != nil && !tc.WantError {
				t.Fatalf("fatal error %s \n", err)
			}

			if !tc.WantError {
				testutils.MustMatchFn(".ID")(t, updateMarketModalityConfigs, marketModalityConfigs, "values don't match after initial mod configs creation")
			} else {
				testutils.MustMatch(t, "invalid update market modality configurations query with service line id: 0", err.Error(), "Test should give correct error if there is no service line id")
			}
		})
	}
}

func TestGetNetworkModalityConfigsByNetworkID(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockInvalidNetworkID := int64(0)

	ctx, db, queries, done := setupDBTest(t)
	defer done()

	mockedNetworkModalityConfigs := createNetworkModalityConfigs(t, baseID, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		description string
		networkID   int64

		wantError error
	}{
		{
			description: "should return network modality configurations",
			networkID:   baseID,
		},
		{
			description: "should return error",
			networkID:   mockInvalidNetworkID,

			wantError: fmt.Errorf("invalid get network modality configurations query with network id: %d", mockInvalidNetworkID),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			networkModalityConfigs, err := modalityDB.GetNetworkModalityConfigsByNetworkID(ctx, tc.networkID)

			if tc.wantError != nil {
				fmt.Println(err)
				testutils.MustMatch(t, tc.wantError, err)
			} else {
				testutils.MustMatchFn(".ID")(t, mockedNetworkModalityConfigs, networkModalityConfigs)
			}
		})
	}
}

func TestUpdateNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()

	ctx, db, queries, done := setupDBTest(t)
	defer done()

	createNetworkModalityConfigs(t, baseID, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		description string
		networkID   int64

		wantError error
	}{
		{
			description: "should create network modality configs",
			networkID:   baseID + 1,
		},
		{
			description: "should update network modality configs",
			networkID:   baseID,
		},
		{
			description: "should return error",
			networkID:   int64(0),

			wantError: fmt.Errorf("invalid update network modality configurations query with network id: %d", 0),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			updateNetworkModalityConfigs := generateNetworkModalityConfigs(5, tc.networkID)

			networkModalityConfigs, err := modalityDB.UpdateNetworkModalityConfigs(ctx, UpdateNetworkModalityConfigsParams{
				NetworkID: tc.networkID,
				Configs:   updateNetworkModalityConfigs,
			})

			if tc.wantError != nil {
				testutils.MustMatch(t, tc.wantError, err)
			} else {
				testutils.MustMatchFn(".ID")(t, updateNetworkModalityConfigs, networkModalityConfigs)
			}
		})
	}
}

func TestCalculateModalities(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()

	inPersonModalityServiceLine := baseID + 1
	virtualModalityServiceLine := baseID + 2
	bothModalitiesServiceLine := baseID + 3
	telepresentationModalitiesServiceLine := baseID + 4
	inPersonModalityID := int64(1)
	virtualModalityID := int64(2)
	telepresentationModalityID := int64(3)
	onlyConfigsServiceLine := baseID + 5
	onlyMarketConfigsServiceLine := baseID + 6

	createModalityConfig(t, inPersonModalityServiceLine, inPersonModalityID, queries)
	createMarketModalityConfig(t, inPersonModalityServiceLine, inPersonModalityID, queries)
	createModalityConfig(t, virtualModalityServiceLine, virtualModalityID, queries)
	createMarketModalityConfig(t, virtualModalityServiceLine, virtualModalityID, queries)
	createModalityConfig(t, telepresentationModalitiesServiceLine, telepresentationModalityID, queries)
	createMarketModalityConfig(t, telepresentationModalitiesServiceLine, telepresentationModalityID, queries)
	createModalityConfig(t, bothModalitiesServiceLine, inPersonModalityID, queries)
	createMarketModalityConfig(t, bothModalitiesServiceLine, inPersonModalityID, queries)
	createModalityConfig(t, bothModalitiesServiceLine, virtualModalityID, queries)
	createMarketModalityConfig(t, bothModalitiesServiceLine, virtualModalityID, queries)
	createModalityConfig(t, bothModalitiesServiceLine, telepresentationModalityID, queries)
	createMarketModalityConfig(t, bothModalitiesServiceLine, telepresentationModalityID, queries)
	createModalityConfig(t, onlyConfigsServiceLine, inPersonModalityID, queries)
	createMarketModalityConfig(t, onlyMarketConfigsServiceLine, virtualModalityID, queries)

	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		Description     string
		ServiceLineID   int64
		MarketID        int64
		InsurancePlanID int64

		Want         []*Modality
		WantError    bool
		ErrorMessage string
	}{
		{
			Description:     "should return in person modality",
			ServiceLineID:   inPersonModalityServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			Want:      []*Modality{{ID: inPersonModalityID, DisplayName: "In-person", ModalityType: "in_person"}},
			WantError: false,
		},
		{
			Description:     "should return virtual modality",
			ServiceLineID:   virtualModalityServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			Want:      []*Modality{{ID: virtualModalityID, DisplayName: "Virtual", ModalityType: "virtual"}},
			WantError: false,
		},
		{
			Description:     "should return telepresentation modality",
			ServiceLineID:   telepresentationModalitiesServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			Want:      []*Modality{{ID: telepresentationModalityID, DisplayName: "Telepresentation", ModalityType: "telepresentation"}},
			WantError: false,
		},
		{
			Description:     "should return in both modalities",
			ServiceLineID:   bothModalitiesServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			Want: []*Modality{
				{ID: inPersonModalityID, DisplayName: "In-person", ModalityType: "in_person"},
				{ID: virtualModalityID, DisplayName: "Virtual", ModalityType: "virtual"},
				{ID: telepresentationModalityID, DisplayName: "Telepresentation", ModalityType: "telepresentation"},
			},
			WantError: false,
		},
		{
			Description:     "should return empty if there is no market modality configurations for given service line",
			ServiceLineID:   onlyConfigsServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			Want:      nil,
			WantError: false,
		},
		{
			Description:     "should return empty if there is no modality configurations for given service line",
			ServiceLineID:   onlyMarketConfigsServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			Want:      nil,
			WantError: false,
		},
		{
			Description:     "should return 0 service line id error",
			ServiceLineID:   int64(0),
			MarketID:        testMarketID,
			InsurancePlanID: testInsurancePlanID,

			WantError:    true,
			ErrorMessage: "invalid calculate modalities query with service line id: 0",
		},
		{
			Description:     "should return 0 market id error",
			ServiceLineID:   bothModalitiesServiceLine,
			MarketID:        int64(0),
			InsurancePlanID: testInsurancePlanID,

			WantError:    true,
			ErrorMessage: "invalid calculate modalities query with market id: 0",
		},
		{
			Description:     "should return 0 insurance plan id error",
			ServiceLineID:   bothModalitiesServiceLine,
			MarketID:        testMarketID,
			InsurancePlanID: int64(0),

			WantError:    true,
			ErrorMessage: "invalid calculate modalities query with insurance plan id: 0",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			params := modalitysql.CalculateModalitiesParams{
				ServiceLineID:   tc.ServiceLineID,
				MarketID:        tc.MarketID,
				InsurancePlanID: tc.InsurancePlanID,
			}
			modalities, err := modalityDB.CalculateModalities(ctx, params)
			if err != nil && !tc.WantError {
				t.Fatalf("fatal error %s \n", err)
			}

			if !tc.WantError {
				testutils.MustMatch(t, tc.Want, modalities, "modalities didn't match")
			} else {
				testutils.MustMatch(t, tc.ErrorMessage, err.Error(), "Test should give correct error")
			}
		})
	}
}

func TestInsertCalculateModalitiesLog(t *testing.T) {
	var businessModalities []string
	serviceLineID := int64(1)
	insurancePlanID := int64(1)
	marketID := int64(1)

	tcs := []struct {
		Description     string
		ServiceLineID   int64
		InsurancePlanID int64
		MarketID        int64

		WantError    bool
		ErrorMessage string
	}{
		{
			Description:     "should insert calculate modalities log",
			ServiceLineID:   serviceLineID,
			InsurancePlanID: insurancePlanID,
			MarketID:        marketID,

			WantError: false,
		},
		{
			Description:     "should give an error on unhealthy db",
			ServiceLineID:   serviceLineID,
			InsurancePlanID: insurancePlanID,
			MarketID:        marketID,

			WantError:    true,
			ErrorMessage: "closed pool",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			ctx, db, _, done := setupDBTest(t)
			defer done()

			modalityDB := NewModalityDB(db, nil)

			modalities, _ := modalityDB.GetModalities(ctx)

			for _, m := range modalities {
				businessModalities = append(businessModalities, fmt.Sprint(m))
			}

			params := modalitysql.InsertCalculateModalitiesLogParams{
				ServiceLineID:      tc.ServiceLineID,
				InsurancePlanID:    tc.InsurancePlanID,
				MarketID:           tc.MarketID,
				BusinessModalities: businessModalities,
			}
			if tc.WantError {
				done()
			}
			err := modalityDB.InsertCalculateModalitiesLog(ctx, params)
			if err != nil && !tc.WantError {
				t.Fatalf("fatal error %s \n", err)
			}

			if tc.WantError {
				testutils.MustMatch(t, tc.ErrorMessage, err.Error(), "Test should give correct error")
			}
		})
	}
}

func TestIsHealthy(t *testing.T) {
	ctx, _, _, done := setupDBTest(t)
	defer done()

	testCases := []struct {
		Name string
		DB   *basedb.MockPingDBTX

		ExpectedOutput bool
	}{
		{
			Name:           "DB is healthy",
			DB:             &basedb.MockPingDBTX{},
			ExpectedOutput: true,
		},
		{
			Name:           "DB is unhealthy",
			DB:             &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			ExpectedOutput: false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			modalityDB := NewModalityDB(testCase.DB, nil)

			isHealthy := modalityDB.IsHealthy(ctx)

			if isHealthy != testCase.ExpectedOutput {
				testutils.MustMatch(t, testCase.ExpectedOutput, isHealthy, "IsHealthy test failed")
			}
		})
	}
}

func TestGetEligibleMarketsByModalityType(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()

	var (
		inPersonModalityServiceLine = baseID + 1
		virtualModalityServiceLine  = baseID + 2
		inPersonModalityID          = int64(1)
		virtualModalityID           = int64(2)
	)

	err := queries.DeleteModalityConfigurations(ctx)
	if err != nil {
		t.Fatalf("fatal error %s \n", err)
	}
	createModalityConfig(t, inPersonModalityServiceLine, inPersonModalityID, queries)
	createMarketModalityConfig(t, inPersonModalityServiceLine, inPersonModalityID, queries)
	createModalityConfig(t, virtualModalityServiceLine, virtualModalityID, queries)
	createMarketModalityConfig(t, virtualModalityServiceLine, virtualModalityID, queries)

	modalityDB := NewModalityDB(db, nil)
	marketID := testMarketID

	tcs := []struct {
		Description  string
		ModalityType string

		Want []int64
	}{
		{
			Description:  "should return in person eligible markets",
			ModalityType: "in_person",

			Want: []int64{marketID},
		},
		{
			Description:  "should return in virtual eligible markets",
			ModalityType: "virtual",

			Want: []int64{marketID},
		},
		{
			Description:  "should return empty list",
			ModalityType: "foobaar",

			Want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			modalities, err := modalityDB.GetEligibleMarketsByModalityType(ctx, tc.ModalityType)
			if err != nil {
				t.Fatalf("fatal error %s \n", err)
			}

			testutils.MustMatch(t, tc.Want, modalities, "markets didn't match")
		})
	}
}

func TestGetNetworkServiceLinesByNetworkID(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockedServiceLineIDs := []int64{baseID + 1, baseID + 2, baseID + 3}

	ctx, db, queries, done := setupDBTest(t)
	defer done()

	for _, serviceLineID := range mockedServiceLineIDs {
		createNetworkModalityConfigsWithGivenServiceLine(t, baseID, serviceLineID, queries)
	}

	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		description string
		networkID   int64

		want []int64
	}{
		{
			description: "should return service line ids for given insurance network",
			networkID:   baseID,

			want: mockedServiceLineIDs,
		},
		{
			description: "should return empty list",
			networkID:   baseID + 1,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			serviceLinesIDs, _ := modalityDB.GetNetworkServiceLinesByNetworkID(ctx, tc.networkID)

			testutils.MustMatch(t, tc.want, serviceLinesIDs)
		})
	}
}

func TestGetCareRequestEligibleModalities(t *testing.T) {
	baseID := time.Now().UnixNano()

	ctx, db, queries, done := setupDBTest(t)
	defer done()

	inPersonServiceLineID := baseID + 1
	inPersonModalityID := int64(1)
	inPersonBillingCityID := baseID + 1
	virtualServiceLineID := baseID + 2
	virtualModalityID := int64(2)
	virtualBillingCityID := baseID + 2
	telepServiceLineID := baseID + 3
	telepModalityID := int64(3)
	telepBillingCity := baseID + 3
	allModalitiesServiceLineID := baseID + 4
	allModalitiesBillingCityID := baseID + 4
	noneModalitiesServiceLineID := baseID + 5
	noneModalitiesMarketID := baseID + 6
	invalidServiceLineID := int64(0)
	invalidMarketID := int64(0)
	invalidBillingCityID := int64(0)
	invalidNetworkID := int64(0)

	// create configs for in-person modality
	createMarketModalityConfig(t, inPersonServiceLineID, inPersonModalityID, queries)
	createNetworkModalityConfig(t, testNetworkID, inPersonServiceLineID, inPersonModalityID, inPersonBillingCityID, queries)
	// create configs for virtual modality
	createMarketModalityConfig(t, virtualServiceLineID, virtualModalityID, queries)
	createNetworkModalityConfig(t, testNetworkID, virtualServiceLineID, virtualModalityID, virtualBillingCityID, queries)
	// create configs for tele-p modality
	createMarketModalityConfig(t, telepServiceLineID, telepModalityID, queries)
	createNetworkModalityConfig(t, testNetworkID, telepServiceLineID, telepModalityID, telepBillingCity, queries)
	// create configs for all types of modality
	createMarketModalityConfig(t, allModalitiesServiceLineID, inPersonModalityID, queries)
	createNetworkModalityConfig(t, testNetworkID, allModalitiesServiceLineID, inPersonModalityID, allModalitiesBillingCityID, queries)
	createMarketModalityConfig(t, allModalitiesServiceLineID, virtualModalityID, queries)
	createNetworkModalityConfig(t, testNetworkID, allModalitiesServiceLineID, virtualModalityID, allModalitiesBillingCityID, queries)
	createMarketModalityConfig(t, allModalitiesServiceLineID, telepModalityID, queries)
	createNetworkModalityConfig(t, testNetworkID, allModalitiesServiceLineID, telepModalityID, allModalitiesBillingCityID, queries)

	modalityDB := NewModalityDB(db, nil)

	inPersonModality := &Modality{ID: inPersonModalityID, DisplayName: "In-person", ModalityType: "in_person"}
	virtualModality := &Modality{ID: virtualModalityID, DisplayName: "Virtual", ModalityType: "virtual"}
	telepModality := &Modality{ID: telepModalityID, DisplayName: "Telepresentation", ModalityType: "telepresentation"}

	tcs := []struct {
		desc  string
		input modalitysql.GetCareRequestEligibleModalitiesParams

		want    []*Modality
		wantErr error
	}{
		{
			desc: "success - should return in person modality",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: inPersonServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: inPersonBillingCityID,
				NetworkID:     testNetworkID,
			},

			want: []*Modality{inPersonModality},
		},
		{
			desc: "success - should return virtual modality",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: virtualServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: virtualBillingCityID,
				NetworkID:     testNetworkID,
			},

			want: []*Modality{virtualModality},
		},
		{
			desc: "success - should return tele-p modality",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: telepServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: telepBillingCity,
				NetworkID:     testNetworkID,
			},

			want: []*Modality{telepModality},
		},
		{
			desc: "success - should return all modalities",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: allModalitiesServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: allModalitiesBillingCityID,
				NetworkID:     testNetworkID,
			},

			want: []*Modality{inPersonModality, virtualModality, telepModality},
		},
		{
			desc: "success - should return empty list if there is no market modality configurations",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: inPersonServiceLineID,
				MarketID:      noneModalitiesMarketID,
				BillingCityID: inPersonBillingCityID,
				NetworkID:     testNetworkID,
			},

			want: []*Modality{},
		},
		{
			desc: "success - should return empty list if there is no network modality configurations for given service line",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: noneModalitiesServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: inPersonBillingCityID,
				NetworkID:     testNetworkID,
			},

			want: []*Modality{},
		},
		{
			desc: "failure - invalid service_line_id param",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: invalidServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: inPersonBillingCityID,
				NetworkID:     testNetworkID,
			},

			wantErr: fmt.Errorf("invalid get care request eligible modalities query with service line id: %d", invalidServiceLineID),
		},
		{
			desc: "failure - invalid market_id param",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: inPersonServiceLineID,
				MarketID:      invalidMarketID,
				BillingCityID: inPersonBillingCityID,
				NetworkID:     testNetworkID,
			},

			wantErr: fmt.Errorf("invalid get care request eligible modalities query with market id: %d", invalidMarketID),
		},
		{
			desc: "failure - invalid billing_city_id param",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: inPersonServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: invalidBillingCityID,
				NetworkID:     testNetworkID,
			},

			wantErr: fmt.Errorf("invalid get care request eligible modalities query with billing city id: %d", invalidBillingCityID),
		},
		{
			desc: "failure - invalid network_id param",
			input: modalitysql.GetCareRequestEligibleModalitiesParams{
				ServiceLineID: inPersonServiceLineID,
				MarketID:      testMarketID,
				BillingCityID: inPersonBillingCityID,
				NetworkID:     invalidNetworkID,
			},

			wantErr: fmt.Errorf("invalid get care request eligible modalities query with network id: %d", invalidNetworkID),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			modalities, err := modalityDB.GetCareRequestEligibleModalities(ctx, tc.input)

			testutils.MustMatch(t, tc.want, modalities)
			testutils.MustMatch(t, tc.wantErr, err)
		})
	}
}

func TestGetNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()
	firstNetworkID := baseID + 1
	secondNetworkID := baseID + 2
	firstServiceLineID := baseID + 3
	secondServiceLine := baseID + 4
	networkWithNoConfigs := baseID + 5
	serviceLineWithNoConfigs := baseID + 6

	ctx, db, queries, done := setupDBTest(t)
	defer done()

	firstNetworkAndFirstServiceLine := createNetworkModalityConfigsWithGivenServiceLine(t, firstNetworkID, firstServiceLineID, queries)
	firstNetworkAndSecondServiceLine := createNetworkModalityConfigsWithGivenServiceLine(t, firstNetworkID, secondServiceLine, queries)
	secondNetworkAndFirstServiceLine := createNetworkModalityConfigsWithGivenServiceLine(t, secondNetworkID, firstServiceLineID, queries)
	secondNetworkAndSecondServiceLine := createNetworkModalityConfigsWithGivenServiceLine(t, secondNetworkID, secondServiceLine, queries)
	allConfigs := []*NetworkModalityConfig{}
	allConfigs = append(allConfigs, firstNetworkAndFirstServiceLine...)
	allConfigs = append(allConfigs, firstNetworkAndSecondServiceLine...)
	allConfigs = append(allConfigs, secondNetworkAndFirstServiceLine...)
	allConfigs = append(allConfigs, secondNetworkAndSecondServiceLine...)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		desc  string
		input modalitysql.GetNetworkModalityConfigurationsParams

		want []*NetworkModalityConfig
	}{
		{
			desc:  "success - should return configs based on network id and service line id",
			input: modalitysql.GetNetworkModalityConfigurationsParams{NetworkID: sqltypes.ToValidNullInt64(firstNetworkID), ServiceLineID: sqltypes.ToValidNullInt64(firstServiceLineID)},

			want: firstNetworkAndFirstServiceLine,
		},
		{
			desc:  "success - should return configs based on network id only",
			input: modalitysql.GetNetworkModalityConfigurationsParams{NetworkID: sqltypes.ToValidNullInt64(firstNetworkID)},

			want: append(firstNetworkAndFirstServiceLine, firstNetworkAndSecondServiceLine...),
		},
		{
			desc:  "success - should return configs based on service line id only",
			input: modalitysql.GetNetworkModalityConfigurationsParams{ServiceLineID: sqltypes.ToValidNullInt64(firstServiceLineID)},

			want: append(firstNetworkAndFirstServiceLine, secondNetworkAndFirstServiceLine...),
		},
		{
			desc:  "success - should return all configs",
			input: modalitysql.GetNetworkModalityConfigurationsParams{NetworkID: sqltypes.ToValidNullInt64(firstNetworkID)},

			want: allConfigs,
		},
		{
			desc:  "success - will return empty result if there is no configs for such network id",
			input: modalitysql.GetNetworkModalityConfigurationsParams{NetworkID: sqltypes.ToValidNullInt64(networkWithNoConfigs)},

			want: []*NetworkModalityConfig{},
		},
		{
			desc:  "success - will return empty result if there is no configs for such service line id",
			input: modalitysql.GetNetworkModalityConfigurationsParams{ServiceLineID: sqltypes.ToValidNullInt64(serviceLineWithNoConfigs)},

			want: []*NetworkModalityConfig{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			networkModalityConfigs, _ := modalityDB.GetNetworkModalityConfigs(ctx, tc.input)

			for _, dbConfig := range networkModalityConfigs {
				isElementInResponse := false
				for _, config := range tc.want {
					if (config.NetworkID == dbConfig.NetworkID) && (config.BillingCityID == dbConfig.BillingCityID) && (config.ServiceLineID == dbConfig.ServiceLineID) && (config.ModalityID == dbConfig.ModalityID) {
						isElementInResponse = true
						break
					}
				}

				if !isElementInResponse {
					t.Fatal("response does not contain all network modality configs.")
				}
			}
		})
	}
}

func TestFindEligibleNetworks(t *testing.T) {
	baseID := time.Now().UnixNano()
	firstNetworkID := baseID + 1
	secondNetworkID := baseID + 2
	firstServiceLineID := baseID + 3
	secondServiceLine := baseID + 4
	billingCityID := baseID + 5
	emptyBillingCityID := baseID + 6
	modalityID := int64(1)

	ctx, db, queries, done := setupDBTest(t)
	defer done()

	createNetworkModalityConfig(t, firstNetworkID, firstServiceLineID, modalityID, billingCityID, queries)
	createNetworkModalityConfig(t, firstNetworkID, secondServiceLine, modalityID, billingCityID, queries)
	createNetworkModalityConfig(t, secondNetworkID, secondServiceLine, modalityID, billingCityID, queries)
	modalityDB := NewModalityDB(db, nil)

	tcs := []struct {
		description string
		input       modalitysql.FindEligibleNetworksParams

		want []int64
	}{
		{
			description: "success - returns all networks IDs for given billing city",
			input: modalitysql.FindEligibleNetworksParams{
				BillingCityID: sqltypes.ToNullInt64(&billingCityID),
			},

			want: []int64{firstNetworkID, secondNetworkID},
		},
		{
			description: "success - returns all networks IDs for given service line",
			input: modalitysql.FindEligibleNetworksParams{
				ServiceLineID: sqltypes.ToNullInt64(&firstServiceLineID),
			},

			want: []int64{firstNetworkID},
		},
		{
			description: "success - returns all networks IDs for given billing city and service line",
			input: modalitysql.FindEligibleNetworksParams{
				BillingCityID: sqltypes.ToNullInt64(&billingCityID),
				ServiceLineID: sqltypes.ToNullInt64(&firstServiceLineID),
			},

			want: []int64{firstNetworkID},
		},
		{
			description: "success - returns empty data",
			input: modalitysql.FindEligibleNetworksParams{
				BillingCityID: sqltypes.ToNullInt64(&emptyBillingCityID),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			networksIDs, _ := modalityDB.FindEligibleNetworks(ctx, tc.input)

			testutils.MustMatch(t, tc.want, networksIDs)
		})
	}
}
