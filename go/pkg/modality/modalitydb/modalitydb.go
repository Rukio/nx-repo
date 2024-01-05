package modalitydb

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v4"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	modalitysql "github.com/*company-data-covered*/services/go/pkg/generated/sql/modality"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

type ModalityDB struct {
	db      basedb.DBTX
	scope   monitoring.Scope
	queries *modalitysql.Queries
}

func NewModalityDB(db basedb.DBTX, scope monitoring.Scope) *ModalityDB {
	return &ModalityDB{
		db:      db,
		scope:   scope,
		queries: modalitysql.New(db),
	}
}

type Modality struct {
	ID           int64
	DisplayName  string
	ModalityType string
}

func (mdb *ModalityDB) GetModalities(ctx context.Context) ([]*Modality, error) {
	dbModalities, err := mdb.queries.GetModalities(ctx)

	if err != nil {
		return []*Modality{}, err
	}

	var modalities []*Modality

	for _, m := range dbModalities {
		modalities = append(modalities, &Modality{
			ID:           m.ID,
			DisplayName:  m.DisplayName,
			ModalityType: m.ModalityType,
		})
	}

	return modalities, nil
}

func (mdb *ModalityDB) GetEligibleMarketsByModalityType(ctx context.Context, modalityType string) ([]int64, error) {
	return mdb.queries.GetEligibleMarketsByModalityType(ctx, modalityType)
}

func (mdb *ModalityDB) CalculateModalities(ctx context.Context, params modalitysql.CalculateModalitiesParams) ([]*Modality, error) {
	if params.ServiceLineID == 0 {
		return nil, fmt.Errorf("invalid calculate modalities query with service line id: %d", params.ServiceLineID)
	}
	if params.MarketID == 0 {
		return nil, fmt.Errorf("invalid calculate modalities query with market id: %d", params.MarketID)
	}
	if params.InsurancePlanID == 0 {
		return nil, fmt.Errorf("invalid calculate modalities query with insurance plan id: %d", params.InsurancePlanID)
	}

	dbModalities, err := mdb.queries.CalculateModalities(ctx, params)

	if err != nil {
		return []*Modality{}, err
	}

	var modalities []*Modality

	for _, m := range dbModalities {
		modalities = append(modalities, &Modality{
			ID:           m.ID,
			DisplayName:  m.DisplayName,
			ModalityType: m.ModalityType,
		})
	}

	return modalities, nil
}

type ModalityConfig struct {
	ID              int64
	MarketID        int64
	InsurancePlanID int64
	ModalityID      int64
	ServiceLineID   int64
}

func (mdb *ModalityDB) GetModalityConfigsByServiceLineID(ctx context.Context, serviceLineID int64) ([]*ModalityConfig, error) {
	if serviceLineID == 0 {
		return nil, fmt.Errorf("invalid get modality configurations query with service line id: %d", serviceLineID)
	}

	dbModalityConfigurations, err := mdb.queries.GetModalityConfigsByServiceLineID(ctx, serviceLineID)

	if err != nil {
		return []*ModalityConfig{}, err
	}

	var modalityConfigs []*ModalityConfig

	for _, m := range dbModalityConfigurations {
		modalityConfigs = append(modalityConfigs, &ModalityConfig{
			ID:              m.ID,
			MarketID:        m.MarketID,
			InsurancePlanID: m.InsurancePlanID,
			ModalityID:      m.ModalityID,
			ServiceLineID:   m.ServiceLineID,
		})
	}

	return modalityConfigs, nil
}

type UpdateModalityConfigsParams struct {
	ServiceLineID int64
	Configs       []*ModalityConfig
}

func (mdb *ModalityDB) UpdateModalityConfigs(ctx context.Context, params UpdateModalityConfigsParams) ([]*ModalityConfig, error) {
	if params.ServiceLineID == 0 {
		return nil, fmt.Errorf("invalid update modality configurations query with service line id: %d", params.ServiceLineID)
	}
	err := mdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := mdb.queries.WithTx(tx)
		err := qtx.DeleteModalityConfigurationsByServiceLineId(ctx, params.ServiceLineID)
		if err != nil {
			return err
		}
		var createQueryParams []modalitysql.CreateModalityConfigurationsParams
		for _, mc := range params.Configs {
			createQueryParams = append(createQueryParams, modalitysql.CreateModalityConfigurationsParams{
				MarketID:        mc.MarketID,
				InsurancePlanID: mc.InsurancePlanID,
				ModalityID:      mc.ModalityID,
				ServiceLineID:   mc.ServiceLineID,
			})
		}
		_, err = qtx.CreateModalityConfigurations(ctx, createQueryParams)
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return []*ModalityConfig{}, err
	}
	return mdb.GetModalityConfigsByServiceLineID(ctx, params.ServiceLineID)
}

type UpdateMarketModalityConfigsParams struct {
	ServiceLineID int64
	Configs       []*MarketModalityConfig
}

func (mdb *ModalityDB) UpdateMarketModalityConfigs(ctx context.Context, params UpdateMarketModalityConfigsParams) ([]*MarketModalityConfig, error) {
	if params.ServiceLineID == 0 {
		return nil, fmt.Errorf("invalid update market modality configurations query with service line id: %d", params.ServiceLineID)
	}
	err := mdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := mdb.queries.WithTx(tx)
		err := qtx.DeleteMarketModalityConfigurationsByServiceLineId(ctx, params.ServiceLineID)
		if err != nil {
			return err
		}
		createQueryParams := make([]modalitysql.CreateMarketModalityConfigurationsParams, len(params.Configs))
		for i, mc := range params.Configs {
			createQueryParams[i] = modalitysql.CreateMarketModalityConfigurationsParams{
				MarketID:      mc.MarketID,
				ModalityID:    mc.ModalityID,
				ServiceLineID: mc.ServiceLineID,
			}
		}
		_, err = qtx.CreateMarketModalityConfigurations(ctx, createQueryParams)
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return []*MarketModalityConfig{}, err
	}
	return mdb.GetMarketModalityConfigsByServiceLineID(ctx, params.ServiceLineID)
}

type MarketModalityConfig struct {
	ID            int64
	MarketID      int64
	ModalityID    int64
	ServiceLineID int64
}

func (mdb *ModalityDB) GetMarketModalityConfigsByServiceLineID(ctx context.Context, serviceLineID int64) ([]*MarketModalityConfig, error) {
	if serviceLineID == 0 {
		return nil, fmt.Errorf("invalid get market modality configurations query with service line id: %d", serviceLineID)
	}

	dbModalityConfigurations, err := mdb.queries.GetMarketModalityConfigsByServiceLineID(ctx, serviceLineID)

	if err != nil {
		return []*MarketModalityConfig{}, err
	}

	modalityConfigs := make([]*MarketModalityConfig, len(dbModalityConfigurations))

	for i, m := range dbModalityConfigurations {
		modalityConfigs[i] = &MarketModalityConfig{
			ID:            m.ID,
			MarketID:      m.MarketID,
			ModalityID:    m.ModalityID,
			ServiceLineID: m.ServiceLineID,
		}
	}

	return modalityConfigs, nil
}

type NetworkModalityConfig struct {
	ID            int64
	NetworkID     int64
	BillingCityID int64
	ModalityID    int64
	ServiceLineID int64
}

type UpdateNetworkModalityConfigsParams struct {
	NetworkID int64
	Configs   []*NetworkModalityConfig
}

func (mdb *ModalityDB) UpdateNetworkModalityConfigs(ctx context.Context, params UpdateNetworkModalityConfigsParams) ([]*NetworkModalityConfig, error) {
	if params.NetworkID <= 0 {
		return nil, fmt.Errorf("invalid update network modality configurations query with network id: %d", params.NetworkID)
	}
	err := mdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := mdb.queries.WithTx(tx)

		err := qtx.DeleteNetworkModalityConfigurationsByNetworkID(ctx, params.NetworkID)
		if err != nil {
			return fmt.Errorf("failed to delete modality configurations for network id: %d: %w", params.NetworkID, err)
		}

		createQueryParams := make([]modalitysql.CreateNetworkModalityConfigurationsParams, len(params.Configs))

		for i, nc := range params.Configs {
			createQueryParams[i] = modalitysql.CreateNetworkModalityConfigurationsParams{
				NetworkID:     nc.NetworkID,
				BillingCityID: nc.BillingCityID,
				ModalityID:    nc.ModalityID,
				ServiceLineID: nc.ServiceLineID,
			}
		}

		_, err = qtx.CreateNetworkModalityConfigurations(ctx, createQueryParams)
		if err != nil {
			return fmt.Errorf("failed to create modality configurations for network id: %d: %w", params.NetworkID, err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}
	return mdb.GetNetworkModalityConfigsByNetworkID(ctx, params.NetworkID)
}

func (mdb *ModalityDB) GetNetworkModalityConfigsByNetworkID(ctx context.Context, networkID int64) ([]*NetworkModalityConfig, error) {
	fmt.Println(networkID <= 0)
	if networkID <= 0 {
		return nil, fmt.Errorf("invalid get network modality configurations query with network id: %d", networkID)
	}

	dbNetworkModalityConfigurations, err := mdb.queries.GetNetworkModalityConfigurationsByNetworkID(ctx, networkID)
	if err != nil {
		return nil, err
	}

	networkModalityConfigs := make([]*NetworkModalityConfig, len(dbNetworkModalityConfigurations))
	for i, nm := range dbNetworkModalityConfigurations {
		networkModalityConfigs[i] = &NetworkModalityConfig{
			ID:            nm.ID,
			NetworkID:     nm.NetworkID,
			BillingCityID: nm.BillingCityID,
			ModalityID:    nm.ModalityID,
			ServiceLineID: nm.ServiceLineID,
		}
	}

	return networkModalityConfigs, nil
}

func (mdb *ModalityDB) GetNetworkServiceLinesByNetworkID(ctx context.Context, networkID int64) ([]int64, error) {
	return mdb.queries.GetNetworkServiceLinesByNetworkID(ctx, networkID)
}

func (mdb *ModalityDB) GetCareRequestEligibleModalities(ctx context.Context, params modalitysql.GetCareRequestEligibleModalitiesParams) ([]*Modality, error) {
	if params.ServiceLineID == 0 {
		return nil, fmt.Errorf("invalid get care request eligible modalities query with service line id: %d", params.ServiceLineID)
	}
	if params.MarketID == 0 {
		return nil, fmt.Errorf("invalid get care request eligible modalities query with market id: %d", params.MarketID)
	}
	if params.BillingCityID == 0 {
		return nil, fmt.Errorf("invalid get care request eligible modalities query with billing city id: %d", params.BillingCityID)
	}
	if params.NetworkID == 0 {
		return nil, fmt.Errorf("invalid get care request eligible modalities query with network id: %d", params.NetworkID)
	}

	dbModalities, err := mdb.queries.GetCareRequestEligibleModalities(ctx, params)
	if err != nil {
		return nil, err
	}

	modalities := make([]*Modality, len(dbModalities))

	for i, m := range dbModalities {
		modalities[i] = &Modality{
			ID:           m.ID,
			DisplayName:  m.DisplayName,
			ModalityType: m.ModalityType,
		}
	}

	return modalities, nil
}

func (mdb *ModalityDB) GetNetworkModalityConfigs(ctx context.Context, params modalitysql.GetNetworkModalityConfigurationsParams) ([]*NetworkModalityConfig, error) {
	dbNetworkConfigurations, err := mdb.queries.GetNetworkModalityConfigurations(ctx, params)
	if err != nil {
		return nil, err
	}

	networkConfigs := make([]*NetworkModalityConfig, len(dbNetworkConfigurations))
	for i, nc := range dbNetworkConfigurations {
		networkConfigs[i] = &NetworkModalityConfig{
			ID:            nc.ID,
			NetworkID:     nc.NetworkID,
			BillingCityID: nc.BillingCityID,
			ModalityID:    nc.ModalityID,
			ServiceLineID: nc.ServiceLineID,
		}
	}

	return networkConfigs, nil
}

func (mdb *ModalityDB) FindEligibleNetworks(ctx context.Context, params modalitysql.FindEligibleNetworksParams) ([]int64, error) {
	return mdb.queries.FindEligibleNetworks(ctx, params)
}

func (mdb *ModalityDB) IsHealthy(ctx context.Context) bool {
	return mdb.db.Ping(ctx) == nil
}

type InsertCalculateModalitiesLogParams struct {
	MarketID           int64
	InsurancePlanID    int64
	ServiceLineID      int64
	BusinessModalities []*Modality
}

func (mdb *ModalityDB) InsertCalculateModalitiesLog(ctx context.Context, params modalitysql.InsertCalculateModalitiesLogParams) error {
	return mdb.queries.InsertCalculateModalitiesLog(ctx, modalitysql.InsertCalculateModalitiesLogParams{
		MarketID:           params.MarketID,
		InsurancePlanID:    params.InsurancePlanID,
		ServiceLineID:      params.ServiceLineID,
		BusinessModalities: params.BusinessModalities,
	})
}
