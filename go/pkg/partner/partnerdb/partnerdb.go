package partnerdb

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
)

type PartnerRelations struct {
	PackageIDs                []int64
	AthenaClinicalProviderIDs []int64
	LocationParams            *partnersql.UpdateLocationParams
}

type PartnerConfigurationRelations struct {
	EmailDomains            []*partnersql.EmailDomain
	Markets                 []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow
	PopHealthChannelItemIDs []int64
	Sources                 []*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow
}

type PartnerConfigurationMarket struct {
	PartnerConfigurationMarket *partnersql.PartnerConfigurationMarket
	Market                     *partnersql.Market
}

type PartnerDB struct {
	db      basedb.DBTX
	scope   monitoring.Scope
	queries *partnersql.Queries
}

func NewPartnerDB(db basedb.DBTX, scope monitoring.Scope) *PartnerDB {
	if scope == nil {
		scope = &monitoring.NoopScope{}
	}
	mdb := monitoring.NewDB(db, scope)
	return &PartnerDB{
		db:      db,
		scope:   scope,
		queries: partnersql.New(mdb),
	}
}

func (pdb *PartnerDB) AddCareRequestPartner(ctx context.Context, arg partnersql.AddCareRequestPartnerParams) (*partnersql.CareRequestPartner, error) {
	return pdb.queries.AddCareRequestPartner(ctx, arg)
}

func (pdb *PartnerDB) AddLocation(ctx context.Context, protoLocation *partnerpb.Location) (sql.NullInt64, error) {
	location, err := pdb.queries.AddLocation(ctx, AddLocationParamsFromProtoLocation(protoLocation))
	if err != nil {
		return sql.NullInt64{}, err
	}

	return sqltypes.ToValidNullInt64(location.ID), nil
}

func (pdb *PartnerDB) AddMarket(ctx context.Context, arg partnersql.AddMarketParams) (*partnersql.Market, error) {
	return pdb.queries.AddMarket(ctx, arg)
}

func (pdb *PartnerDB) AddPartner(ctx context.Context, arg partnersql.AddPartnerParams) (*partnersql.Partner, error) {
	return pdb.queries.AddPartner(ctx, arg)
}

func (pdb *PartnerDB) AddPartnerAssociationBackfill(ctx context.Context, arg partnersql.AddPartnerAssociationBackfillParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return pdb.queries.AddPartnerAssociationBackfill(ctx, arg)
}

func (pdb *PartnerDB) AddPartnerClinicalProvider(ctx context.Context, arg partnersql.AddPartnerClinicalProviderParams) (*partnersql.PartnerClinicalProvider, error) {
	return pdb.queries.AddPartnerClinicalProvider(ctx, arg)
}

func (pdb *PartnerDB) AddPophealthConfiguration(ctx context.Context, arg partnersql.AddPophealthConfigurationParams) (*partnersql.PophealthConfiguration, error) {
	return pdb.queries.AddPophealthConfiguration(ctx, arg)
}

func (pdb *PartnerDB) AddPartnerConfigurationSource(ctx context.Context, protoLocation *partnerpb.Location, addPartnerConfigurationSourceParams partnersql.AddPartnerConfigurationSourceParams) (*partnersql.PartnerConfigurationSource, error) {
	var partnerConfigurationSource *partnersql.PartnerConfigurationSource
	err := pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := pdb.queries.WithTx(tx)
		location, err := queries.AddLocation(ctx, AddLocationParamsFromProtoLocation(protoLocation))
		if err != nil {
			return status.Errorf(codes.Internal, "AddLocation error: %v", err)
		}

		locationID := sqltypes.ToValidNullInt64(location.ID)
		addPartnerConfigurationSourceParams.LocationID = locationID

		partnerConfigurationSource, err = pdb.queries.AddPartnerConfigurationSource(ctx, addPartnerConfigurationSourceParams)
		if err != nil {
			return err
		}
		return nil
	})
	return partnerConfigurationSource, err
}

func (pdb *PartnerDB) CompletePartnerAssociationBackfillByID(ctx context.Context, arg partnersql.CompletePartnerAssociationBackfillByIDParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return pdb.queries.CompletePartnerAssociationBackfillByID(ctx, arg)
}

func (pdb *PartnerDB) CountPartnerConfigurations(ctx context.Context, arg partnersql.CountPartnerConfigurationsParams) (int64, error) {
	return pdb.queries.CountPartnerConfigurations(ctx, arg)
}

func (pdb *PartnerDB) CreatePartnerConfigurationMarketAndServiceLines(ctx context.Context, protoMarket *partnerpb.Market) (*partnersql.PartnerConfigurationMarket, map[int64]*partnersql.ServiceLine, error) {
	var partnerConfigurationMarket *partnersql.PartnerConfigurationMarket
	var serviceLinesMap map[int64]*partnersql.ServiceLine
	err := pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		var err error
		queries := pdb.queries.WithTx(tx)
		partnerConfigurationMarket, err = queries.AddPartnerConfigurationMarket(ctx, partnersql.AddPartnerConfigurationMarketParams{
			PartnerConfigurationID: protoMarket.PartnerConfigurationId,
			MarketID:               *protoMarket.Id,
		})
		if err != nil {
			return fmt.Errorf("AddPartnerConfigurationMarket error: %w", err)
		}

		serviceLinesMap, err = updatePartnerConfigurationMarketServiceLines(ctx, queries, partnerConfigurationMarket, protoMarket.ServiceLines)
		if err != nil {
			partnerConfigurationMarket = nil
		}
		return err
	})
	return partnerConfigurationMarket, serviceLinesMap, err
}

func (pdb *PartnerDB) DeactivatePartnerByID(ctx context.Context, id int64) (*partnersql.Partner, error) {
	return pdb.queries.DeactivatePartnerByID(ctx, id)
}

func (pdb *PartnerDB) DeleteCareRequestPartner(ctx context.Context, id int64) (*partnersql.CareRequestPartner, error) {
	return pdb.queries.DeleteCareRequestPartner(ctx, id)
}

func (pdb *PartnerDB) DeleteMarket(ctx context.Context, partnerConfigMarketID int64) (*PartnerConfigurationMarket, error) {
	var deletedMarket *PartnerConfigurationMarket
	err := pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := pdb.queries.WithTx(tx)
		partnerConfigMarket, err := queries.DeletePartnerConfigurationMarket(ctx, partnerConfigMarketID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return err
			}
			return fmt.Errorf("DeletePartnerConfigurationMarket error: %w", err)
		}

		market, err := queries.GetMarketByID(ctx, partnerConfigMarket.MarketID)
		if err != nil {
			return fmt.Errorf("GetMarketByID error: %w", err)
		}

		_, err = queries.DeletePartnerConfigurationMarketServiceLinesByPartnerConfigMarketID(ctx, partnerConfigMarketID)
		if err != nil {
			return fmt.Errorf("DeletePartnerConfigurationMarketServiceLinesByPartnerConfigMarketID error: %w", err)
		}

		deletedMarket = &PartnerConfigurationMarket{
			PartnerConfigurationMarket: partnerConfigMarket,
			Market:                     market,
		}

		return nil
	})
	return deletedMarket, err
}

func (pdb *PartnerDB) DeletePartnerClinicalProvidersByPartnerID(ctx context.Context, id int64) ([]*partnersql.PartnerClinicalProvider, error) {
	return pdb.queries.DeletePartnerClinicalProvidersByPartnerID(ctx, id)
}

func (pdb *PartnerDB) DeletePophealthConfiguration(ctx context.Context, id int64) (*partnersql.PophealthConfiguration, error) {
	return pdb.queries.DeletePophealthConfiguration(ctx, id)
}

func (pdb *PartnerDB) DeletePartnerConfiguration(ctx context.Context, id int64) (*partnersql.PartnerConfiguration, error) {
	var partnerConfig *partnersql.PartnerConfiguration
	err := pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := pdb.queries.WithTx(tx)
		var err error
		partnerConfig, err = queries.DeletePartnerConfiguration(ctx, id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return err
			}
			return fmt.Errorf("DeletePartnerConfiguration error: %w", err)
		}

		_, err = queries.DeleteEmailDomainsByPartnerConfigurationID(ctx, id)
		if err != nil {
			return fmt.Errorf("DeleteEmailDomainsByPartnerConfigurationID error: %w", err)
		}

		_, err = queries.DeleteRedoxConfigurationByPartnerConfigurationID(ctx, id)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("DeleteRedoxConfigurationByPartnerConfigurationID error: %w", err)
		}

		_, err = queries.DeleteSSOConfigurationByPartnerConfigurationID(ctx, id)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("DeleteSSOConfigurationByPartnerConfigurationID error: %w", err)
		}

		partnerConfigMarkets, err := queries.DeletePartnerConfigurationMarketsByPartnerConfigID(ctx, id)
		if err != nil {
			return fmt.Errorf("DeletePartnerConfigurationMarketsByPartnerConfigID error: %w", err)
		}

		partnerConfigMarketIDs := make([]int64, len(partnerConfigMarkets))
		for i, partnerConfigMarket := range partnerConfigMarkets {
			partnerConfigMarketIDs[i] = partnerConfigMarket.ID
		}
		_, err = queries.DeletePartnerConfigMarketServiceLinesByPartnerConfigIDs(ctx, partnerConfigMarketIDs)
		if err != nil {
			return fmt.Errorf("DeletePartnerConfigMarketServiceLinesByPartnerConfigIDs error: %w", err)
		}

		_, err = queries.DeletePophealthConfigurationsByPartnerConfigurationID(ctx, id)
		if err != nil {
			return fmt.Errorf("DeletePophealthConfigurationsByPartnerConfigurationID error: %w", err)
		}

		_, err = queries.DeletePartnerConfigurationSourcesByPartnerConfigurationID(ctx, id)
		if err != nil {
			return fmt.Errorf("DeletePartnerConfigurationSourcesByPartnerConfigurationID error: %w", err)
		}

		return nil
	})
	return partnerConfig, err
}

func (pdb *PartnerDB) GetCareRequestPartnersByStationCareRequestID(ctx context.Context, stationCareRequestID int64) ([]*partnersql.GetCareRequestPartnersByStationCareRequestIDRow, error) {
	return pdb.queries.GetCareRequestPartnersByStationCareRequestID(ctx, stationCareRequestID)
}

func (pdb *PartnerDB) GetEmailDomainsByPartnerConfigurationID(ctx context.Context, partnerConfigID int64) ([]*partnersql.EmailDomain, error) {
	return pdb.queries.GetEmailDomainsByPartnerConfigurationID(ctx, partnerConfigID)
}

func (pdb *PartnerDB) GetInProgressBackfillByPartnerAndType(ctx context.Context, arg partnersql.GetInProgressBackfillByPartnerAndTypeParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return pdb.queries.GetInProgressBackfillByPartnerAndType(ctx, arg)
}

func (pdb *PartnerDB) GetInsuranceByCareRequestAndOrigin(ctx context.Context, arg partnersql.GetInsuranceByCareRequestAndOriginParams) (*partnersql.Partner, error) {
	return pdb.queries.GetInsuranceByCareRequestAndOrigin(ctx, arg)
}

func (pdb *PartnerDB) GetMarketByStationMarketID(ctx context.Context, stationMarketID int64) (*partnersql.Market, error) {
	return pdb.queries.GetMarketByStationMarketID(ctx, stationMarketID)
}

func (pdb *PartnerDB) GetMarketsAndServiceLinesByIDOrPartnerConfigID(ctx context.Context, arg partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDParams) ([]*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow, error) {
	return pdb.queries.GetMarketsAndServiceLinesByIDOrPartnerConfigID(ctx, arg)
}

func (pdb *PartnerDB) GetPartnerByID(ctx context.Context, id int64) (*partnersql.GetPartnerByIDRow, error) {
	return pdb.queries.GetPartnerByID(ctx, id)
}

func (pdb *PartnerDB) GetPartnerByStationChannelItemID(ctx context.Context, stationChannelItemID int64) (*partnersql.Partner, error) {
	return pdb.queries.GetPartnerByStationChannelItemID(ctx, stationChannelItemID)
}

func (pdb *PartnerDB) GetPartnerClinicalProvidersByPartnerID(ctx context.Context, partnerID int64) ([]*partnersql.PartnerClinicalProvider, error) {
	return pdb.queries.GetPartnerClinicalProvidersByPartnerID(ctx, partnerID)
}

func (pdb *PartnerDB) GetPartnerConfigurationByExpressID(ctx context.Context, expressID string) (*partnersql.PartnerConfiguration, error) {
	return pdb.queries.GetPartnerConfigurationByExpressID(ctx, sqltypes.ToValidNullString(expressID))
}

func (pdb *PartnerDB) GetPartnerConfigurationByID(ctx context.Context, id int64) (*partnersql.GetPartnerConfigurationByIDRow, error) {
	return pdb.queries.GetPartnerConfigurationByID(ctx, id)
}

func (pdb *PartnerDB) GetPartnerConfigurationMarketByID(ctx context.Context, id int64) (*partnersql.PartnerConfigurationMarket, error) {
	return pdb.queries.GetPartnerConfigurationMarketByID(ctx, id)
}

func (pdb *PartnerDB) GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(
	ctx context.Context,
	arg partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams,
) (*partnersql.PartnerConfigurationMarket, error) {
	return pdb.queries.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(ctx, arg)
}

func (pdb *PartnerDB) GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID(ctx context.Context, arg partnersql.GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDParams) (*partnersql.PartnerConfigurationSource, error) {
	return pdb.queries.GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID(ctx, arg)
}

func (pdb *PartnerDB) GetPartnerConfigurationSourceByID(ctx context.Context, id int64) (*partnersql.GetPartnerConfigurationSourceByIDRow, error) {
	return pdb.queries.GetPartnerConfigurationSourceByID(ctx, id)
}

func (pdb *PartnerDB) GetPartnerConfigurationSourcesByPartnerConfigurationID(ctx context.Context, partnerConfigID int64) ([]*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow, error) {
	return pdb.queries.GetPartnerConfigurationSourcesByPartnerConfigurationID(ctx, partnerConfigID)
}

func (pdb *PartnerDB) GetPartnersByInsurancePackages(ctx context.Context, insurancePackageIDs []int64) ([]*partnersql.Partner, error) {
	return pdb.queries.GetPartnersByInsurancePackages(ctx, insurancePackageIDs)
}

func (pdb *PartnerDB) GetPartnersByStationChannelItemIDList(ctx context.Context, stationChannelItemIDs []int64) ([]*partnersql.Partner, error) {
	return pdb.queries.GetPartnersByStationChannelItemIDList(ctx, stationChannelItemIDs)
}

func (pdb *PartnerDB) GetPendingBackfills(ctx context.Context) ([]*partnersql.CareRequestPartnerBackfill, error) {
	return pdb.queries.GetPendingBackfills(ctx)
}

func (pdb *PartnerDB) GetPophealthChannelItemsByPartnerConfigurationID(ctx context.Context, partnerConfigID int64) ([]int64, error) {
	return pdb.queries.GetPophealthChannelItemsByPartnerConfigurationID(ctx, partnerConfigID)
}

func (pdb *PartnerDB) GetServiceLinesByExpressIDAndMarketID(ctx context.Context, arg partnersql.GetServiceLinesByExpressIDAndMarketIDParams) ([]*partnersql.ServiceLine, error) {
	return pdb.queries.GetServiceLinesByExpressIDAndMarketID(ctx, arg)
}

func (pdb *PartnerDB) GetSourceCareRequestPartnerByCareRequestID(ctx context.Context, stationCareRequestID int64) (*partnersql.CareRequestPartner, error) {
	return pdb.queries.GetSourceCareRequestPartnerByCareRequestID(ctx, stationCareRequestID)
}

func (pdb *PartnerDB) IsHealthy(ctx context.Context) bool {
	return pdb.db.Ping(ctx) == nil
}

func (pdb *PartnerDB) SearchPartnerConfigurations(ctx context.Context, arg partnersql.SearchPartnerConfigurationsParams) ([]*partnersql.SearchPartnerConfigurationsRow, error) {
	return pdb.queries.SearchPartnerConfigurations(ctx, arg)
}

func (pdb *PartnerDB) SearchPartnersByLatLng(ctx context.Context, arg partnersql.SearchPartnersByLatLngParams) ([]*partnersql.SearchPartnersByLatLngRow, error) {
	return pdb.queries.SearchPartnersByLatLng(ctx, arg)
}

func (pdb *PartnerDB) SearchPartnersByName(ctx context.Context, arg partnersql.SearchPartnersByNameParams) ([]*partnersql.SearchPartnersByNameRow, error) {
	return pdb.queries.SearchPartnersByName(ctx, arg)
}

func (pdb *PartnerDB) UpdatePartner(ctx context.Context, partnerParams partnersql.UpdatePartnerParams, partnerRelations *PartnerRelations) error {
	err := pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := pdb.queries.WithTx(tx)
		_, err := queries.UpdatePartner(ctx, partnerParams)
		if err != nil {
			return fmt.Errorf("UpdatePartner error: %w", err)
		}

		if partnerRelations == nil {
			return nil
		}

		if partnerRelations.PackageIDs != nil {
			err := updatePartnerInsurancePackages(ctx, queries, partnerParams.ID, partnerRelations.PackageIDs)
			if err != nil {
				return err
			}
		}

		if partnerRelations.AthenaClinicalProviderIDs != nil {
			err := updatePartnerClinicalProviders(ctx, queries, partnerParams.ID, partnerRelations.AthenaClinicalProviderIDs)
			if err != nil {
				return err
			}
		}

		if partnerRelations.LocationParams != nil {
			_, err := queries.UpdateLocation(ctx, *partnerRelations.LocationParams)
			if err != nil {
				return fmt.Errorf("UpdateLocation error: %w", err)
			}
		}

		return nil
	})
	return err
}

func (pdb *PartnerDB) UpdatePartnerAssociationBackfillByID(ctx context.Context, arg partnersql.UpdatePartnerAssociationBackfillByIDParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return pdb.queries.UpdatePartnerAssociationBackfillByID(ctx, arg)
}

func (pdb *PartnerDB) UpdatePartnerConfigurationMarketServiceLines(
	ctx context.Context,
	partnerConfigMarket *partnersql.PartnerConfigurationMarket,
	serviceLines []*partnerpb.ServiceLine,
) (map[int64]*partnersql.ServiceLine, error) {
	var serviceLinesMap map[int64]*partnersql.ServiceLine
	err := pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := pdb.queries.WithTx(tx)
		_, err := queries.DeletePartnerConfigurationMarketServiceLinesByPartnerConfigMarketID(ctx, partnerConfigMarket.ID)
		if err != nil {
			return fmt.Errorf("DeletePartnerConfigurationMarketServiceLinesByPartnerConfigMarketID error: %w", err)
		}

		serviceLinesMap, err = updatePartnerConfigurationMarketServiceLines(ctx, queries, partnerConfigMarket, serviceLines)
		return err
	})
	return serviceLinesMap, err
}

func (pdb *PartnerDB) UpsertPartnerConfiguration(ctx context.Context, protoPartnerConfig *partnerpb.PartnerConfiguration) (*partnersql.GetPartnerConfigurationByIDRow, error) {
	phoneNumber, err := ProtoPhoneNumberToPartnerConfigurationPhoneNumber(protoPartnerConfig.PhoneNumber)
	if err != nil {
		return nil, errors.New("PhoneNumber must be 10 digits")
	}

	var partnerConfigWithProps *partnersql.GetPartnerConfigurationByIDRow
	err = pdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := pdb.queries.WithTx(tx)
		var partnerConfig *partnersql.PartnerConfiguration
		if protoPartnerConfig.Id == nil {
			partnerConfig, err = queries.AddPartnerConfiguration(ctx, partnersql.AddPartnerConfigurationParams{
				ExpressID:                    sqltypes.ToNullString(protoPartnerConfig.ExpressId),
				DisplayName:                  protoPartnerConfig.DisplayName,
				PhoneNumber:                  phoneNumber,
				IsRedoxEnabled:               protoPartnerConfig.GetRedoxEnabled(),
				IsRiskStratBypassEnabled:     protoPartnerConfig.GetRiskStratBypassEnabled(),
				IsSsoEnabled:                 protoPartnerConfig.GetSsoEnabled(),
				IsViewAllCareRequestsEnabled: protoPartnerConfig.GetViewAllCareRequestsEnabled(),
			})
			if err != nil {
				return fmt.Errorf("AddPartnerConfiguration error: %w", err)
			}
		} else {
			partnerConfig, err = queries.UpdatePartnerConfiguration(ctx, partnersql.UpdatePartnerConfigurationParams{
				DisplayName:                  sqltypes.ToValidNullString(protoPartnerConfig.DisplayName),
				PhoneNumber:                  phoneNumber,
				IsRedoxEnabled:               sqltypes.ToNullBool(protoPartnerConfig.RedoxEnabled),
				IsRiskStratBypassEnabled:     sqltypes.ToNullBool(protoPartnerConfig.RiskStratBypassEnabled),
				IsSsoEnabled:                 sqltypes.ToNullBool(protoPartnerConfig.SsoEnabled),
				IsViewAllCareRequestsEnabled: sqltypes.ToNullBool(protoPartnerConfig.ViewAllCareRequestsEnabled),
				ID:                           *protoPartnerConfig.Id,
			})
			if err != nil {
				return fmt.Errorf("UpdatePartnerConfiguration error: %w", err)
			}
		}

		partnerConfigWithProps = &partnersql.GetPartnerConfigurationByIDRow{
			ID:                           partnerConfig.ID,
			ExpressID:                    partnerConfig.ExpressID,
			DisplayName:                  partnerConfig.DisplayName,
			PhoneNumber:                  partnerConfig.PhoneNumber,
			IsRedoxEnabled:               partnerConfig.IsRedoxEnabled,
			IsRiskStratBypassEnabled:     partnerConfig.IsRiskStratBypassEnabled,
			IsSsoEnabled:                 partnerConfig.IsSsoEnabled,
			IsViewAllCareRequestsEnabled: partnerConfig.IsViewAllCareRequestsEnabled,
			UpdatedAt:                    partnerConfig.UpdatedAt,
			CreatedAt:                    partnerConfig.CreatedAt,
		}

		if len(protoPartnerConfig.AcceptedDomains) > 0 {
			err = upsertAcceptedDomains(ctx, queries, partnerConfig.ID, protoPartnerConfig.AcceptedDomains)
			if err != nil {
				return fmt.Errorf("UpdateAcceptedDomain error: %w", err)
			}
		}

		if protoPartnerConfig.SsoProperties != nil {
			ssoConfig, err := upsertSsoProperties(ctx, queries, partnerConfig.ID, protoPartnerConfig.SsoProperties)
			if err != nil {
				return fmt.Errorf("UpdateSsoProperties error: %w", err)
			}

			partnerConfigWithProps.ConnectionName = sqltypes.ToValidNullString(ssoConfig.ConnectionName)
			partnerConfigWithProps.LogoutUrl = ssoConfig.LogoutUrl
			partnerConfigWithProps.EnforceRolePresence = sqltypes.ToValidNullBool(ssoConfig.EnforceRolePresence)
		}

		if protoPartnerConfig.RedoxProperties != nil {
			redoxConfig, err := upsertRedoxProperties(ctx, queries, partnerConfig.ID, protoPartnerConfig.RedoxProperties)
			if err != nil {
				return fmt.Errorf("UpdateRedoxProperties error: %w", err)
			}

			partnerConfigWithProps.SourceID = sqltypes.ToValidNullString(redoxConfig.SourceID)
			partnerConfigWithProps.DestinationID = sqltypes.ToValidNullString(redoxConfig.DestinationID)
			partnerConfigWithProps.ClinicalSummaryDestinationID = sqltypes.ToValidNullString(redoxConfig.ClinicalSummaryDestinationID)
			partnerConfigWithProps.CancellationID = sqltypes.ToValidNullString(redoxConfig.CancellationID)
			partnerConfigWithProps.IsClinicalSummaryEnabled = sqltypes.ToValidNullBool(redoxConfig.IsClinicalSummaryEnabled)
		}

		if len(protoPartnerConfig.PophealthChannelItemIds) > 0 {
			err = upsertPophealthConfigurations(ctx, queries, partnerConfig.ID, protoPartnerConfig.PophealthChannelItemIds)
			if err != nil {
				return fmt.Errorf("upsertPophealthConfigurations error: %w", err)
			}
		}

		return nil
	})
	return partnerConfigWithProps, err
}

func updatePartnerInsurancePackages(ctx context.Context, queries *partnersql.Queries, partnerID int64, packageIDs []int64) error {
	_, err := queries.DeletePartnerInsurancesByPartnerID(ctx, partnerID)
	if err != nil {
		return fmt.Errorf("DeletePartnerInsurancesByPartnerID error: %w", err)
	}

	for _, packageID := range packageIDs {
		_, err = queries.AddPartnerInsurancePackage(ctx, partnersql.AddPartnerInsurancePackageParams{
			PackageID: packageID,
			PartnerID: partnerID,
		})
		if err != nil {
			return fmt.Errorf("AddPartnerInsurancePackage error: %w", err)
		}
	}
	return nil
}

func updatePartnerClinicalProviders(ctx context.Context, queries *partnersql.Queries, partnerID int64, athenaClinicalProviders []int64) error {
	_, err := queries.DeletePartnerClinicalProvidersByPartnerID(ctx, partnerID)
	if err != nil {
		return fmt.Errorf("DeletePartnerClinicalProvidersByPartnerID error: %w", err)
	}

	for _, athenaClinicalProviderID := range athenaClinicalProviders {
		_, err = queries.AddPartnerClinicalProvider(ctx, partnersql.AddPartnerClinicalProviderParams{
			PartnerID:                partnerID,
			AthenaClinicalProviderID: athenaClinicalProviderID,
		})
		if err != nil {
			return fmt.Errorf("AddPartnerClinicalProvider error: %w", err)
		}
	}
	return nil
}

func upsertAcceptedDomains(ctx context.Context, queries *partnersql.Queries, partnerConfigID int64, domains []string) error {
	_, err := queries.DeleteEmailDomainsByPartnerConfigurationID(ctx, partnerConfigID)
	if err != nil {
		return err
	}

	for _, domain := range domains {
		_, err = queries.AddEmailDomain(ctx, partnersql.AddEmailDomainParams{
			PartnerConfigurationID: partnerConfigID,
			DomainDescription:      domain,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func upsertSsoProperties(ctx context.Context, queries *partnersql.Queries, partnerConfigID int64, ssoProperties *partnerpb.SSOProperties) (*partnersql.SsoConfiguration, error) {
	ssoConfig, err := queries.UpdateSSOConfiguration(ctx, partnersql.UpdateSSOConfigurationParams{
		PartnerConfigurationID: partnerConfigID,
		ConnectionName:         ssoProperties.ConnectionName,
		LogoutUrl:              sqltypes.ToNullString(ssoProperties.LogoutUrl),
		EnforceRolePresence:    ssoProperties.GetEnforceRolePresence(),
	})
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		ssoConfig, err = queries.AddSSOConfiguration(ctx, partnersql.AddSSOConfigurationParams{
			PartnerConfigurationID: partnerConfigID,
			ConnectionName:         ssoProperties.ConnectionName,
			LogoutUrl:              sqltypes.ToNullString(ssoProperties.LogoutUrl),
			EnforceRolePresence:    ssoProperties.GetEnforceRolePresence(),
		})
	}
	return ssoConfig, err
}

func upsertRedoxProperties(ctx context.Context, queries *partnersql.Queries, partnerConfigID int64, redoxProperties *partnerpb.RedoxProperties) (*partnersql.RedoxConfiguration, error) {
	redoxConfig, err := queries.UpdateRedoxConfiguration(ctx, partnersql.UpdateRedoxConfigurationParams{
		PartnerConfigurationID:       partnerConfigID,
		CancellationID:               sqltypes.ToNullString(redoxProperties.CancellationId),
		ClinicalSummaryDestinationID: redoxProperties.GetClinicalSummaryDestinationId(),
		IsClinicalSummaryEnabled:     redoxProperties.ClinicalNotesEnabled,
		DestinationID:                redoxProperties.DestinationId,
		SourceID:                     redoxProperties.SourceId,
	})
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		redoxConfig, err = queries.AddRedoxConfiguration(ctx, partnersql.AddRedoxConfigurationParams{
			PartnerConfigurationID:       partnerConfigID,
			CancellationID:               redoxProperties.GetCancellationId(),
			ClinicalSummaryDestinationID: redoxProperties.GetClinicalSummaryDestinationId(),
			IsClinicalSummaryEnabled:     redoxProperties.ClinicalNotesEnabled,
			DestinationID:                redoxProperties.DestinationId,
			SourceID:                     redoxProperties.SourceId,
		})
	}
	return redoxConfig, err
}

func updatePartnerConfigurationMarketServiceLines(
	ctx context.Context,
	queries *partnersql.Queries,
	partnerConfigMarket *partnersql.PartnerConfigurationMarket,
	serviceLines []*partnerpb.ServiceLine,
) (map[int64]*partnersql.ServiceLine, error) {
	serviceLinesMap := make(map[int64]*partnersql.ServiceLine, len(serviceLines))
	for _, protoServiceLine := range serviceLines {
		if _, exists := serviceLinesMap[protoServiceLine.Id]; !exists {
			serviceLine, err := queries.GetServiceLineByID(ctx, protoServiceLine.Id)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					return nil, fmt.Errorf("service line with id %d does not exist", protoServiceLine.Id)
				}
				return nil, fmt.Errorf("GetServiceLineByID error: %w", err)
			}

			serviceLinesMap[serviceLine.ID] = serviceLine
			_, err = queries.AddPartnerConfigurationMarketServiceLine(ctx, partnersql.AddPartnerConfigurationMarketServiceLineParams{
				PartnerConfigurationMarketID: partnerConfigMarket.ID,
				ServiceLineID:                serviceLine.ID,
			})
			if err != nil {
				return nil, fmt.Errorf("AddPartnerConfigurationMarketServiceLine error: %w", err)
			}
		}
	}
	return serviceLinesMap, nil
}

func upsertPophealthConfigurations(ctx context.Context, queries *partnersql.Queries, partnerConfigID int64, pophealthChannelItemIDs []int64) error {
	_, err := queries.DeletePophealthConfigurationsByPartnerConfigurationID(ctx, partnerConfigID)
	if err != nil {
		return err
	}

	partners, err := queries.GetPartnersByStationChannelItemIDList(ctx, pophealthChannelItemIDs)
	if err != nil {
		return err
	}

	for _, partner := range partners {
		_, err = queries.AddPophealthConfiguration(ctx, partnersql.AddPophealthConfigurationParams{
			PartnerConfigurationID: partnerConfigID,
			PartnerID:              partner.ID,
		})
		if err != nil {
			return err
		}
	}
	return nil
}
