//go:build db_test

package partnerdb_test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	adhocpartnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner/DO_NOT_USE"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"google.golang.org/protobuf/proto"
)

type partnerConfigParams struct {
	partner     partnersql.AddPartnerConfigurationParams
	redoxConfig partnersql.AddRedoxConfigurationParams
	ssoConfig   partnersql.AddSSOConfigurationParams
}

func TestPartnerDB_AddMarket(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()

	tests := []struct {
		name   string
		params partnersql.AddMarketParams

		wantResp *partnersql.Market
	}{
		{
			name: "successfully gets market by station market id",
			params: partnersql.AddMarketParams{
				DisplayName:     strconv.FormatInt(baseID, 10),
				StationMarketID: baseID,
			},

			wantResp: &partnersql.Market{
				ID:              baseID,
				DisplayName:     strconv.FormatInt(baseID, 10),
				StationMarketID: baseID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotResp, err := pdb.AddMarket(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, gotResp)
		})
	}
}

func TestPartnerDB_CountPartnerConfigurations(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name           string
		partnerConfigs []partnersql.AddPartnerConfigurationParams
		params         partnersql.CountPartnerConfigurationsParams

		wantResp int64
	}{
		{
			name: "successfully count partner configurations",
			partnerConfigs: []partnersql.AddPartnerConfigurationParams{
				{
					ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID, 10)),
					DisplayName: "test1",
				},
				{
					ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+1, 10)),
					DisplayName: "test2",
				},
			},
			params: partnersql.CountPartnerConfigurationsParams{},

			wantResp: 2,
		},
		{
			name: "successfully count partner configurations with name filter",
			partnerConfigs: []partnersql.AddPartnerConfigurationParams{
				{
					ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+2, 10)),
					DisplayName: "test3",
				},
				{
					ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+3, 10)),
					DisplayName: "test4",
				},
			},
			params: partnersql.CountPartnerConfigurationsParams{
				NameFilterEnabled: true,
				DisplayName:       "test4",
			},

			wantResp: 1,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)
			partnerConfigIDs := make([]int64, len(test.partnerConfigs))
			for i, partnerConfig := range test.partnerConfigs {
				newPartnerConfig, err := queries.AddPartnerConfiguration(ctx, partnerConfig)
				if err != nil {
					t.Fatal(err)
				}

				partnerConfigIDs[i] = newPartnerConfig.ID
			}
			defer func() {
				for _, id := range partnerConfigIDs {
					err := adhocQueries.DeletePartnerConfigurationByID(ctx, id)
					if err != nil {
						t.Fatal(err)
					}
				}
			}()

			resp, err := pdb.CountPartnerConfigurations(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.wantResp, resp)
		})
	}
}

func TestPartnerDB_CreatePartnerConfigurationMarketAndServiceLines(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	serviceLines := []partnersql.AddServiceLineParams{
		{
			ShortName:                     "test1",
			DisplayName:                   "test1",
			GenesysEmail:                  "test1@tst.wsx",
			AllowBypassRiskStratification: true,
		},
		{
			ShortName:    "test2",
			DisplayName:  "test2",
			GenesysEmail: "test2@tst.wsx",
		},
	}
	serviceLineIDs, removeServiceLines := addAndRemoveServiceLines(ctx, t, queries, adhocQueries, serviceLines)
	defer removeServiceLines()

	tests := []struct {
		name   string
		params *partnerpb.Market

		wantPartnerConfigMarketResp *partnersql.PartnerConfigurationMarket
		wantServiceLinesResp        map[int64]*partnersql.ServiceLine
		wantErr                     error
	}{
		{
			name: "successfully creates partner configuration market and service lines",
			params: &partnerpb.Market{
				Id:                     &baseID,
				PartnerConfigurationId: baseID + 1,
				ServiceLines: []*partnerpb.ServiceLine{
					{Id: serviceLineIDs[0]},
					{Id: serviceLineIDs[1]},
				},
			},

			wantPartnerConfigMarketResp: &partnersql.PartnerConfigurationMarket{
				ID:                     baseID,
				PartnerConfigurationID: baseID + 1,
				MarketID:               baseID,
			},
			wantServiceLinesResp: map[int64]*partnersql.ServiceLine{
				serviceLineIDs[0]: {
					ID:                            serviceLineIDs[0],
					DisplayName:                   serviceLines[0].DisplayName,
					ShortName:                     serviceLines[0].ShortName,
					GenesysEmail:                  serviceLines[0].GenesysEmail,
					AllowBypassRiskStratification: serviceLines[0].AllowBypassRiskStratification,
				},
				serviceLineIDs[1]: {
					ID:                            serviceLineIDs[1],
					DisplayName:                   serviceLines[1].DisplayName,
					ShortName:                     serviceLines[1].ShortName,
					GenesysEmail:                  serviceLines[1].GenesysEmail,
					AllowBypassRiskStratification: serviceLines[1].AllowBypassRiskStratification,
				},
			},
		},
		{
			name: "fails when service line does not exists",
			params: &partnerpb.Market{
				Id:                     &baseID,
				PartnerConfigurationId: baseID + 1,
				ServiceLines: []*partnerpb.ServiceLine{
					{Id: 0},
				},
			},

			wantErr: fmt.Errorf("service line with id %d does not exist", 0),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			partnerConfigurationMarket, serviceLines, gotErr := pdb.CreatePartnerConfigurationMarketAndServiceLines(ctx, test.params)

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantPartnerConfigMarketResp, partnerConfigurationMarket)
			for id, serviceLine := range test.wantServiceLinesResp {
				testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, serviceLine, serviceLines[id])
			}
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}

func TestPartnerDB_DeleteMarket(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	partnerConfigID := baseID
	market, err := queries.AddMarket(ctx, partnersql.AddMarketParams{
		DisplayName:     "Test Market",
		StationMarketID: baseID + 1,
	})
	if err != nil {
		t.Fatal(err)
	}

	partnerConfigMarket, err := queries.AddPartnerConfigurationMarket(ctx, partnersql.AddPartnerConfigurationMarketParams{
		PartnerConfigurationID: partnerConfigID,
		MarketID:               market.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddPartnerConfigurationMarketServiceLine(ctx, partnersql.AddPartnerConfigurationMarketServiceLineParams{
		PartnerConfigurationMarketID: partnerConfigMarket.ID,
		ServiceLineID:                baseID,
	})
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name                         string
		partnerConfigurationMarketID int64

		want    *partnerdb.PartnerConfigurationMarket
		wantErr bool
	}{
		{
			name:                         "successfully deletes market",
			partnerConfigurationMarketID: partnerConfigMarket.ID,

			want: &partnerdb.PartnerConfigurationMarket{
				PartnerConfigurationMarket: &partnersql.PartnerConfigurationMarket{
					ID:                     partnerConfigMarket.ID,
					PartnerConfigurationID: partnerConfigID,
					MarketID:               market.ID,
				},
				Market: &partnersql.Market{
					ID:              market.ID,
					DisplayName:     market.DisplayName,
					StationMarketID: market.StationMarketID,
				},
			},
		},
		{
			name:                         "fails when partner configuration market does not exist",
			partnerConfigurationMarketID: 0,
			wantErr:                      true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotResp, gotErr := pdb.DeleteMarket(ctx, test.partnerConfigurationMarketID)

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.want, gotResp)
			testutils.MustMatch(t, test.wantErr, gotErr != nil)
		})
	}
}

func TestPartnerDB_DeletePartnerConfiguration(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	now := time.Now()
	baseID := time.Now().UnixNano()
	displayName := strconv.FormatInt(baseID, 10)

	partnerConfigurations := []partnersql.AddPartnerConfigurationParams{{
		DisplayName: displayName,
	}}

	parterConfigurationIDs, removePartnerConfigurations := addAndRemovePartnerConfigurations(ctx, t, queries, adhocQueries, partnerConfigurations)
	defer removePartnerConfigurations()

	tests := []struct {
		name                         string
		partnerConfiguration         *partnersql.AddPartnerConfigurationParams
		deletePartnerConfigurationID int64

		want    *partnersql.PartnerConfiguration
		wantErr bool
	}{
		{
			name:                         "should successfully delete a partner configuration",
			deletePartnerConfigurationID: parterConfigurationIDs[0],

			want: &partnersql.PartnerConfiguration{
				DisplayName: displayName,
				DeletedAt:   sqltypes.ToValidNullTime(now),
			},
		},
		{
			name:                         "error deleting not found partner configuration",
			deletePartnerConfigurationID: 0,

			want:    &partnersql.PartnerConfiguration{},
			wantErr: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := pdb.DeletePartnerConfiguration(ctx, test.deletePartnerConfigurationID)

			testutils.MustMatch(t, test.wantErr, err != nil)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.want, response)
			testutils.MustMatch(t, test.want.DeletedAt.Valid, response.DeletedAt.Valid)
		})
	}
}

func TestPartnerDB_GetMarketByStationMarketID(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	market := partnersql.AddMarketParams{
		DisplayName:     strconv.FormatInt(baseID, 10),
		StationMarketID: baseID,
	}
	tests := []struct {
		name            string
		market          *partnersql.AddMarketParams
		stationMarketID int64

		wantResp *partnersql.Market
		wantErr  bool
	}{
		{
			name:            "successfully gets market by station market id",
			market:          &market,
			stationMarketID: market.StationMarketID,

			wantResp: &partnersql.Market{
				ID:              baseID,
				DisplayName:     market.DisplayName,
				StationMarketID: market.StationMarketID,
			},
		},
		{
			name: "fails when market with station market id does not exist",

			wantResp: &partnersql.Market{},
			wantErr:  true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.market != nil {
				_, err := queries.AddMarket(ctx, *test.market)
				if err != nil {
					t.Fatal(err)
				}
			}

			gotResp, gotErr := pdb.GetMarketByStationMarketID(ctx, test.stationMarketID)

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, gotResp)
			testutils.MustMatch(t, test.wantErr, gotErr != nil)
		})
	}
}

func TestPartnerDB_GetPartnerConfigurationByID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	partner := partnersql.AddPartnerConfigurationParams{
		ExpressID:                    sqltypes.ToValidNullString("test-express-id"),
		DisplayName:                  "test-display-name",
		PhoneNumber:                  sqltypes.ToValidNullString("5555555555"),
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsSsoEnabled:                 true,
		IsViewAllCareRequestsEnabled: true,
	}
	redoxConfig := partnersql.AddRedoxConfigurationParams{
		CancellationID:               "test-cancellation-id",
		ClinicalSummaryDestinationID: "test-clinical-summary-destination-id",
		IsClinicalSummaryEnabled:     true,
		DestinationID:                strconv.FormatInt(baseID, 10),
		SourceID:                     strconv.FormatInt(baseID, 10),
	}
	ssoConfig := partnersql.AddSSOConfigurationParams{
		ConnectionName:      "test-connection",
		LogoutUrl:           sqltypes.ToValidNullString("test.com"),
		EnforceRolePresence: true,
	}
	tests := []struct {
		name          string
		partnerConfig *partnerConfigParams

		wantResp *partnersql.GetPartnerConfigurationByIDRow
		wantErr  error
	}{
		{
			name: "successfully get partner configuration by id",
			partnerConfig: &partnerConfigParams{
				partner:     partner,
				redoxConfig: redoxConfig,
				ssoConfig:   ssoConfig,
			},

			wantResp: &partnersql.GetPartnerConfigurationByIDRow{
				ExpressID:                    partner.ExpressID,
				DisplayName:                  partner.DisplayName,
				PhoneNumber:                  partner.PhoneNumber,
				IsRedoxEnabled:               partner.IsRedoxEnabled,
				IsRiskStratBypassEnabled:     partner.IsRiskStratBypassEnabled,
				IsSsoEnabled:                 partner.IsSsoEnabled,
				IsViewAllCareRequestsEnabled: partner.IsViewAllCareRequestsEnabled,
				CancellationID:               sqltypes.ToValidNullString(redoxConfig.CancellationID),
				ClinicalSummaryDestinationID: sqltypes.ToValidNullString(redoxConfig.ClinicalSummaryDestinationID),
				IsClinicalSummaryEnabled:     sql.NullBool{Bool: redoxConfig.IsClinicalSummaryEnabled, Valid: true},
				DestinationID:                sqltypes.ToValidNullString(redoxConfig.DestinationID),
				SourceID:                     sqltypes.ToValidNullString(redoxConfig.SourceID),
				ConnectionName:               sqltypes.ToValidNullString(ssoConfig.ConnectionName),
				LogoutUrl:                    ssoConfig.LogoutUrl,
				EnforceRolePresence:          sql.NullBool{Bool: ssoConfig.EnforceRolePresence, Valid: true},
			},
		},
		{
			name: "fails when partner configuration does not exist",

			wantResp: &partnersql.GetPartnerConfigurationByIDRow{},
			wantErr:  pgx.ErrNoRows,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)
			partnerConfigID := baseID
			if test.partnerConfig != nil {
				newPartnerConfig, err := queries.AddPartnerConfiguration(ctx, test.partnerConfig.partner)
				if err != nil {
					t.Fatal(err)
				}

				defer func() {
					err := adhocQueries.DeletePartnerConfigurationByID(ctx, newPartnerConfig.ID)
					if err != nil {
						t.Fatal(err)
					}
				}()

				partnerConfigID = newPartnerConfig.ID
				test.partnerConfig.redoxConfig.PartnerConfigurationID = partnerConfigID
				_, err = queries.AddRedoxConfiguration(ctx, test.partnerConfig.redoxConfig)
				if err != nil {
					t.Fatal(err)
				}

				test.partnerConfig.ssoConfig.PartnerConfigurationID = partnerConfigID
				_, err = queries.AddSSOConfiguration(ctx, test.partnerConfig.ssoConfig)
				if err != nil {
					t.Fatal(err)
				}
			}

			gotResp, gotErr := pdb.GetPartnerConfigurationByID(ctx, partnerConfigID)

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, gotResp)
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}

func TestPartnerDB_GetPartnerConfigurationByExpressID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	partner := partnersql.AddPartnerConfigurationParams{
		DisplayName:                  "test-display-name",
		PhoneNumber:                  sqltypes.ToValidNullString("5555555555"),
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsSsoEnabled:                 true,
		IsViewAllCareRequestsEnabled: true,
	}
	tests := []struct {
		name          string
		expressID     string
		partnerConfig *partnerConfigParams

		wantResp *partnersql.PartnerConfiguration
		wantErr  error
	}{
		{
			name:      "successfully get partner configuration by Express id",
			expressID: "test express id",
			partnerConfig: &partnerConfigParams{
				partner: partner,
			},

			wantResp: &partnersql.PartnerConfiguration{
				DisplayName:                  partner.DisplayName,
				PhoneNumber:                  partner.PhoneNumber,
				IsRedoxEnabled:               partner.IsRedoxEnabled,
				IsRiskStratBypassEnabled:     partner.IsRiskStratBypassEnabled,
				IsSsoEnabled:                 partner.IsSsoEnabled,
				IsViewAllCareRequestsEnabled: partner.IsViewAllCareRequestsEnabled,
			},
		},
		{
			name:      "fails when partner configuration does not exist",
			expressID: "fake express id",
			wantResp:  &partnersql.PartnerConfiguration{},
			wantErr:   pgx.ErrNoRows,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			if test.partnerConfig != nil {
				test.partnerConfig.partner.ExpressID = sqltypes.ToValidNullString(test.expressID)
				test.wantResp.ExpressID = sqltypes.ToValidNullString(test.expressID)
				newPartnerConfig, err := queries.AddPartnerConfiguration(ctx, test.partnerConfig.partner)
				if err != nil {
					t.Fatal(err)
				}

				defer func() {
					err := adhocQueries.DeletePartnerConfigurationByID(ctx, newPartnerConfig.ID)
					if err != nil {
						t.Fatal(err)
					}
				}()
			}

			gotResp, gotErr := pdb.GetPartnerConfigurationByExpressID(ctx, test.expressID)

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, gotResp)
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}

func TestPartnerDB_GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	partnerConfigurationID := baseID
	marketID := baseID + 1
	tests := []struct {
		name                string
		partnerConfigMarket *partnersql.AddPartnerConfigurationMarketParams
		params              partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams

		wantResp *partnersql.PartnerConfigurationMarket
		wantErr  bool
	}{
		{
			name: "successfully gets partner configuration market",
			partnerConfigMarket: &partnersql.AddPartnerConfigurationMarketParams{
				PartnerConfigurationID: partnerConfigurationID,
				MarketID:               marketID,
			},
			params: partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams{
				PartnerConfigurationID: partnerConfigurationID,
				MarketID:               marketID,
			},

			wantResp: &partnersql.PartnerConfigurationMarket{
				ID:                     baseID,
				PartnerConfigurationID: partnerConfigurationID,
				MarketID:               marketID,
			},
		},
		{
			name: "fails when partner configuration market does not exist for partner configuration id",
			params: partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams{
				MarketID: marketID,
			},

			wantResp: &partnersql.PartnerConfigurationMarket{},
			wantErr:  true,
		},
		{
			name: "fails when partner configuration market does not exist for market id",
			params: partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams{
				PartnerConfigurationID: partnerConfigurationID,
			},

			wantResp: &partnersql.PartnerConfigurationMarket{},
			wantErr:  true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.partnerConfigMarket != nil {
				_, err := queries.AddPartnerConfigurationMarket(ctx, *test.partnerConfigMarket)
				if err != nil {
					t.Fatal(err)
				}
			}

			gotResp, gotErr := pdb.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(ctx, test.params)

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, gotResp)
			testutils.MustMatch(t, test.wantErr, gotErr != nil)
		})
	}
}

func TestPartnerDB_SearchPartnerConfigurations(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	partnerConfigs := []partnersql.AddPartnerConfigurationParams{
		{
			ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID, 10)),
			DisplayName: "abc-test",
		},
		{
			ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+1, 10)),
			DisplayName: "bcd-test",
		},
		{
			ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+2, 10)),
			DisplayName: "cde-test",
		},
		{
			ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+3, 10)),
			DisplayName: "def-test",
		},
		{
			ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+4, 10)),
			DisplayName: "efg-test",
		},
		{
			ExpressID:   sqltypes.ToValidNullString(strconv.FormatInt(baseID+5, 10)),
			DisplayName: "fgh-test",
		},
	}
	tests := []struct {
		name           string
		partnerConfigs []partnersql.AddPartnerConfigurationParams
		params         partnersql.SearchPartnerConfigurationsParams

		wantResp []*partnersql.SearchPartnerConfigurationsRow
	}{
		{
			name:           "successfully search partner configurations",
			partnerConfigs: partnerConfigs,
			params: partnersql.SearchPartnerConfigurationsParams{
				PageOffset: 2,
				PageSize:   2,
			},

			wantResp: []*partnersql.SearchPartnerConfigurationsRow{
				{
					ExpressID:   partnerConfigs[2].ExpressID,
					DisplayName: partnerConfigs[2].DisplayName,
				},
				{
					ExpressID:   partnerConfigs[3].ExpressID,
					DisplayName: partnerConfigs[3].DisplayName,
				},
			},
		},
		{
			name:           "successfully search partner configurations with name filter",
			partnerConfigs: partnerConfigs,
			params: partnersql.SearchPartnerConfigurationsParams{
				NameFilterEnabled: true,
				DisplayName:       "f",
				PageOffset:        2,
				PageSize:          1,
			},

			wantResp: []*partnersql.SearchPartnerConfigurationsRow{
				{
					ExpressID:   partnerConfigs[5].ExpressID,
					DisplayName: partnerConfigs[5].DisplayName,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)
			partnerConfigIDs := make([]int64, len(test.partnerConfigs))
			for i, partnerConfig := range test.partnerConfigs {
				newPartnerConfig, err := queries.AddPartnerConfiguration(ctx, partnerConfig)
				if err != nil {
					t.Fatal(err)
				}

				partnerConfigIDs[i] = newPartnerConfig.ID
			}
			defer func() {
				for _, id := range partnerConfigIDs {
					err := adhocQueries.DeletePartnerConfigurationByID(ctx, id)
					if err != nil {
						t.Fatal(err)
					}
				}
			}()

			resp, err := pdb.SearchPartnerConfigurations(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, resp)
		})
	}
}

func TestPartnerDB_UpdatePartnerConfigurationMarketServiceLines(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	partnerConfigMarket := &partnersql.PartnerConfigurationMarket{ID: baseID}
	serviceLines := []partnersql.AddServiceLineParams{
		{
			ShortName:                     "test1",
			DisplayName:                   "test1",
			GenesysEmail:                  "test1@tst.wsx",
			AllowBypassRiskStratification: true,
		},
		{
			ShortName:    "test2",
			DisplayName:  "test2",
			GenesysEmail: "test2@tst.wsx",
		},
	}
	serviceLineIDs, removeServiceLines := addAndRemoveServiceLines(ctx, t, queries, adhocQueries, serviceLines)
	defer removeServiceLines()

	_, err := queries.AddPartnerConfigurationMarketServiceLine(ctx, partnersql.AddPartnerConfigurationMarketServiceLineParams{
		PartnerConfigurationMarketID: partnerConfigMarket.ID,
		ServiceLineID:                serviceLineIDs[0],
	})
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name                string
		partnerConfigMarket *partnersql.PartnerConfigurationMarket
		serviceLines        []*partnerpb.ServiceLine

		want map[int64]*partnersql.ServiceLine
	}{
		{
			name:                "successfully updates partner configuration market service lines",
			partnerConfigMarket: partnerConfigMarket,
			serviceLines:        []*partnerpb.ServiceLine{{Id: serviceLineIDs[1]}},

			want: map[int64]*partnersql.ServiceLine{
				serviceLineIDs[1]: {
					ID:                            serviceLineIDs[1],
					DisplayName:                   serviceLines[1].DisplayName,
					ShortName:                     serviceLines[1].ShortName,
					GenesysEmail:                  serviceLines[1].GenesysEmail,
					AllowBypassRiskStratification: serviceLines[1].AllowBypassRiskStratification,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			serviceLines, err := pdb.UpdatePartnerConfigurationMarketServiceLines(ctx, test.partnerConfigMarket, test.serviceLines)
			if err != nil {
				t.Fatal(err)
			}

			for id, serviceLine := range test.want {
				testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, serviceLine, serviceLines[id])
			}
		})
	}
}

func TestPartnerDB_UpsertPartnerConfiguration(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	ssoProperties := &partnerpb.SSOProperties{
		ConnectionName:      "test-connection",
		LogoutUrl:           proto.String("https://test.com/login"),
		EnforceRolePresence: proto.Bool(true),
	}
	newRedoxProperties := &partnerpb.RedoxProperties{
		SourceId:                     strconv.FormatInt(baseID, 10),
		DestinationId:                strconv.FormatInt(baseID, 10),
		ClinicalSummaryDestinationId: proto.String("test-clinical-summary-destination-id"),
		CancellationId:               proto.String("test-cancellation-id"),
		ClinicalNotesEnabled:         true,
	}
	updateRedoxProperties := &partnerpb.RedoxProperties{
		SourceId:                     strconv.FormatInt(baseID+1, 10),
		DestinationId:                strconv.FormatInt(baseID+1, 10),
		ClinicalSummaryDestinationId: proto.String("test-clinical-summary-destination-id"),
		CancellationId:               proto.String("test-cancellation-id"),
		ClinicalNotesEnabled:         true,
	}
	newProtoPartnerConfig := &partnerpb.PartnerConfiguration{
		ExpressId:   proto.String(strconv.FormatInt(baseID, 10)),
		DisplayName: "Test Partner Config",
		PhoneNumber: &common.PhoneNumber{
			PhoneNumber: proto.String("5555555555"),
		},
		SsoEnabled:                 proto.Bool(true),
		RedoxEnabled:               proto.Bool(true),
		RiskStratBypassEnabled:     proto.Bool(true),
		ViewAllCareRequestsEnabled: proto.Bool(true),
		AcceptedDomains:            []string{"test1.com", "test2.com"},
		SsoProperties:              ssoProperties,
		RedoxProperties:            newRedoxProperties,
	}
	newChannelItemIDs := []int64{
		baseID,
	}
	updateProtoPartnerConfig := &partnerpb.PartnerConfiguration{
		ExpressId:   proto.String(strconv.FormatInt(baseID+1, 10)),
		DisplayName: "Test Partner Config",
		PhoneNumber: &common.PhoneNumber{
			PhoneNumber: proto.String("5555555555"),
		},
		SsoEnabled:                 proto.Bool(true),
		RedoxEnabled:               proto.Bool(true),
		RiskStratBypassEnabled:     proto.Bool(true),
		ViewAllCareRequestsEnabled: proto.Bool(true),
		AcceptedDomains:            []string{"test1.com", "test2.com"},
		SsoProperties:              ssoProperties,
		RedoxProperties:            updateRedoxProperties,
		PophealthChannelItemIds:    newChannelItemIDs,
	}
	newPartnerParams := make([]partnersql.AddPartnerParams, len(newChannelItemIDs))
	for i, newChannelItemID := range newChannelItemIDs {
		newPartnerParams[i] = partnersql.AddPartnerParams{StationChannelItemID: newChannelItemID, DisplayName: "foo", PartnerCategoryShortName: "health_system"}
	}
	_, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, newPartnerParams)
	defer removePartners()

	tests := []struct {
		name         string
		params       *partnerpb.PartnerConfiguration
		isUpdateFlow bool

		wantResp *partnersql.GetPartnerConfigurationByIDRow
		wantErr  error
	}{
		{
			name:   "successfully inserts a new partner configuration",
			params: newProtoPartnerConfig,

			wantResp: &partnersql.GetPartnerConfigurationByIDRow{
				ExpressID:                    sqltypes.ToNullString(newProtoPartnerConfig.ExpressId),
				DisplayName:                  newProtoPartnerConfig.DisplayName,
				PhoneNumber:                  sqltypes.ToNullString(newProtoPartnerConfig.PhoneNumber.PhoneNumber),
				IsRedoxEnabled:               *newProtoPartnerConfig.RedoxEnabled,
				IsRiskStratBypassEnabled:     *newProtoPartnerConfig.RiskStratBypassEnabled,
				IsSsoEnabled:                 *newProtoPartnerConfig.SsoEnabled,
				IsViewAllCareRequestsEnabled: *newProtoPartnerConfig.ViewAllCareRequestsEnabled,
				ConnectionName:               sqltypes.ToValidNullString(newProtoPartnerConfig.SsoProperties.ConnectionName),
				LogoutUrl:                    sqltypes.ToNullString(newProtoPartnerConfig.SsoProperties.LogoutUrl),
				EnforceRolePresence:          sqltypes.ToNullBool(newProtoPartnerConfig.SsoProperties.EnforceRolePresence),
				CancellationID:               sqltypes.ToNullString(newProtoPartnerConfig.RedoxProperties.CancellationId),
				ClinicalSummaryDestinationID: sqltypes.ToNullString(newProtoPartnerConfig.RedoxProperties.ClinicalSummaryDestinationId),
				IsClinicalSummaryEnabled:     sql.NullBool{Bool: newProtoPartnerConfig.RedoxProperties.ClinicalNotesEnabled, Valid: true},
				DestinationID:                sqltypes.ToValidNullString(newProtoPartnerConfig.RedoxProperties.DestinationId),
				SourceID:                     sqltypes.ToValidNullString(newProtoPartnerConfig.RedoxProperties.SourceId),
			},
		},
		{
			name:         "successfully updates a partner configuration",
			params:       updateProtoPartnerConfig,
			isUpdateFlow: true,

			wantResp: &partnersql.GetPartnerConfigurationByIDRow{
				ExpressID:                    sqltypes.ToNullString(updateProtoPartnerConfig.ExpressId),
				DisplayName:                  updateProtoPartnerConfig.DisplayName,
				PhoneNumber:                  sqltypes.ToNullString(updateProtoPartnerConfig.PhoneNumber.PhoneNumber),
				IsRedoxEnabled:               *updateProtoPartnerConfig.RedoxEnabled,
				IsRiskStratBypassEnabled:     *updateProtoPartnerConfig.RiskStratBypassEnabled,
				IsSsoEnabled:                 *updateProtoPartnerConfig.SsoEnabled,
				IsViewAllCareRequestsEnabled: *updateProtoPartnerConfig.ViewAllCareRequestsEnabled,
				ConnectionName:               sqltypes.ToValidNullString(updateProtoPartnerConfig.SsoProperties.ConnectionName),
				LogoutUrl:                    sqltypes.ToNullString(updateProtoPartnerConfig.SsoProperties.LogoutUrl),
				EnforceRolePresence:          sqltypes.ToNullBool(updateProtoPartnerConfig.SsoProperties.EnforceRolePresence),
				CancellationID:               sqltypes.ToNullString(updateProtoPartnerConfig.RedoxProperties.CancellationId),
				ClinicalSummaryDestinationID: sqltypes.ToNullString(updateProtoPartnerConfig.RedoxProperties.ClinicalSummaryDestinationId),
				IsClinicalSummaryEnabled:     sql.NullBool{Bool: updateProtoPartnerConfig.RedoxProperties.ClinicalNotesEnabled, Valid: true},
				DestinationID:                sqltypes.ToValidNullString(updateProtoPartnerConfig.RedoxProperties.DestinationId),
				SourceID:                     sqltypes.ToValidNullString(updateProtoPartnerConfig.RedoxProperties.SourceId),
			},
		},
		{
			name: "fails when phone number is invalid",
			params: &partnerpb.PartnerConfiguration{
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("123456789"),
				},
			},

			wantErr: errors.New("PhoneNumber must be 10 digits"),
		},
		{
			name: "fails when updating a partner that does not exist",
			params: &partnerpb.PartnerConfiguration{
				Id:          proto.Int64(999999),
				ExpressId:   proto.String(strconv.FormatInt(baseID+2, 10)),
				DisplayName: "Test Partner Config",
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("5555555555"),
				},
				SsoEnabled:                 proto.Bool(true),
				RedoxEnabled:               proto.Bool(true),
				RiskStratBypassEnabled:     proto.Bool(true),
				ViewAllCareRequestsEnabled: proto.Bool(true),
			},

			wantErr: fmt.Errorf("UpdatePartnerConfiguration error: %w", pgx.ErrNoRows),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)
			if test.isUpdateFlow {
				newPartnerConfig, err := queries.AddPartnerConfiguration(ctx, partnersql.AddPartnerConfigurationParams{
					ExpressID:   sqltypes.ToNullString(test.params.ExpressId),
					DisplayName: test.params.DisplayName,
				})
				if err != nil {
					t.Fatal(err)
				}

				_, err = queries.AddEmailDomain(ctx, partnersql.AddEmailDomainParams{
					PartnerConfigurationID: newPartnerConfig.ID,
					DomainDescription:      "test1.com",
				})
				if err != nil {
					t.Fatal(err)
				}

				test.params.Id = proto.Int64(newPartnerConfig.ID)
			}
			partnerConfig, gotErr := pdb.UpsertPartnerConfiguration(ctx, test.params)
			if gotErr == nil {
				defer func() {
					err := adhocQueries.DeletePartnerConfigurationByID(ctx, partnerConfig.ID)
					if err != nil {
						t.Fatal(err)
					}
				}()
			}

			var partnerConfigWithProperties *partnersql.GetPartnerConfigurationByIDRow
			if test.wantErr == nil {
				var err error
				partnerConfigWithProperties, err = queries.GetPartnerConfigurationByID(ctx, partnerConfig.ID)
				if err != nil {
					t.Fatal(err)
				}
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResp, partnerConfigWithProperties)
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}

func addAndRemoveServiceLines(ctx context.Context, t *testing.T, queries *partnersql.Queries, adhocQueries *adhocpartnersql.Queries, serviceLines []partnersql.AddServiceLineParams) ([]int64, func()) {
	serviceLineIDs := make([]int64, len(serviceLines))
	for i, serviceLine := range serviceLines {
		newServiceLine, err := queries.AddServiceLine(ctx, serviceLine)
		if err != nil {
			t.Fatal(err)
		}
		serviceLineIDs[i] = newServiceLine.ID
	}
	return serviceLineIDs, func() {
		for _, id := range serviceLineIDs {
			err := adhocQueries.DeleteServiceLineByID(ctx, id)
			if err != nil {
				t.Fatal(err)
			}
		}
	}
}

func addAndRemovePartnerConfigurations(ctx context.Context, t *testing.T, queries *partnersql.Queries, adhocQueries *adhocpartnersql.Queries, partnerConfigurations []partnersql.AddPartnerConfigurationParams) ([]int64, func()) {
	partnerConfigurationIDs := make([]int64, len(partnerConfigurations))
	for i, partnerConfiguration := range partnerConfigurations {
		newPartnerConfiguration, err := queries.AddPartnerConfiguration(ctx, partnerConfiguration)
		if err != nil {
			t.Fatal(err)
		}
		partnerConfigurationIDs[i] = newPartnerConfiguration.ID
	}

	return partnerConfigurationIDs, func() {
		for _, id := range partnerConfigurationIDs {
			err := adhocQueries.DeletePartnerConfigurationByID(ctx, id)
			if err != nil {
				t.Fatal(err)
			}
		}
	}
}
