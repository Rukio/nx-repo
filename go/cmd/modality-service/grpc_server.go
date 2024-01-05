package main

import (
	"context"
	"fmt"

	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	modalitypb "github.com/*company-data-covered*/services/go/pkg/generated/proto/modality"
	modalitysql "github.com/*company-data-covered*/services/go/pkg/generated/sql/modality"
	"github.com/*company-data-covered*/services/go/pkg/modality/modalitydb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ModalityDB demands what the grpc server needs from a DB implementation. Primarily for mocking purposes.
type ModalityDB interface {
	GetModalities(context.Context) ([]*modalitydb.Modality, error)
	GetModalityConfigsByServiceLineID(ctx context.Context, serviceLineID int64) ([]*modalitydb.ModalityConfig, error)
	CalculateModalities(ctx context.Context, params modalitysql.CalculateModalitiesParams) ([]*modalitydb.Modality, error)
	UpdateModalityConfigs(ctx context.Context, params modalitydb.UpdateModalityConfigsParams) ([]*modalitydb.ModalityConfig, error)
	GetEligibleMarketsByModalityType(ctx context.Context, modalityType string) ([]int64, error)
	GetMarketModalityConfigsByServiceLineID(ctx context.Context, serviceLineID int64) ([]*modalitydb.MarketModalityConfig, error)
	UpdateMarketModalityConfigs(ctx context.Context, params modalitydb.UpdateMarketModalityConfigsParams) ([]*modalitydb.MarketModalityConfig, error)
	GetNetworkModalityConfigsByNetworkID(ctx context.Context, networkID int64) ([]*modalitydb.NetworkModalityConfig, error)
	GetNetworkModalityConfigs(ctx context.Context, params modalitysql.GetNetworkModalityConfigurationsParams) ([]*modalitydb.NetworkModalityConfig, error)
	UpdateNetworkModalityConfigs(ctx context.Context, params modalitydb.UpdateNetworkModalityConfigsParams) ([]*modalitydb.NetworkModalityConfig, error)
	GetNetworkServiceLinesByNetworkID(ctx context.Context, networkID int64) ([]int64, error)
	GetCareRequestEligibleModalities(ctx context.Context, params modalitysql.GetCareRequestEligibleModalitiesParams) ([]*modalitydb.Modality, error)
	FindEligibleNetworks(ctx context.Context, params modalitysql.FindEligibleNetworksParams) ([]int64, error)
	InsertCalculateModalitiesLog(ctx context.Context, params modalitysql.InsertCalculateModalitiesLogParams) error
	IsHealthy(context.Context) bool
}

// a compile-time assertion that our assumed implementation satisfies the above interface.
var _ ModalityDB = (*modalitydb.ModalityDB)(nil)

const (
	serviceLineKey     = "Service Line"
	serviceLineIdsKey  = "Service Line IDs"
	marketKey          = "Market"
	insurancePlanKey   = "Insurance Plan"
	modalityTypeKey    = "Modality Type"
	eligibleMarketsKey = "Eligible Markets"
	configsKey         = "Configs"
	modalitiesKey      = "Modalities"
	networkKey         = "Insurance Network"
	billingCityKey     = "Billing City"
)

type ModalityGRPCServer struct {
	modalitypb.UnimplementedModalityServiceServer
	Logger           *zap.SugaredLogger
	ModalityDB       ModalityDB
	InsuranceService insurancepb.InsuranceServiceClient
}

func (s *ModalityGRPCServer) GetModalities(ctx context.Context, r *modalitypb.GetModalitiesRequest) (*modalitypb.GetModalitiesResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	dbModalities, err := s.ModalityDB.GetModalities(ctx)

	if err != nil {
		s.Logger.Errorf("GetModalities: Failed to get modalities: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	var modalities []*modalitypb.Modality

	for _, m := range dbModalities {
		modalities = append(modalities, &modalitypb.Modality{
			Id:          m.ID,
			DisplayName: m.DisplayName,
			Type:        m.ModalityType,
		})
	}

	return &modalitypb.GetModalitiesResponse{
		Modalities: modalities,
	}, nil
}

func (s *ModalityGRPCServer) GetModalityConfigs(ctx context.Context, r *modalitypb.GetModalityConfigsRequest) (*modalitypb.GetModalityConfigsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	s.Logger.Infow("GetModalityConfigs input data", serviceLineKey, r.ServiceLineId)

	dbModalityConfigs, err := s.ModalityDB.GetModalityConfigsByServiceLineID(ctx, r.ServiceLineId)

	s.Logger.Infow("GetModalityConfigs", configsKey, dbModalityConfigs)

	if err != nil {
		s.Logger.Errorf("GetModalityConfigs: Failed to get modality config: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	var modalityConfigs []*modalitypb.ModalityConfig
	for _, mc := range dbModalityConfigs {
		modalityConfigs = append(modalityConfigs, &modalitypb.ModalityConfig{
			Id:              mc.ID,
			MarketId:        mc.MarketID,
			InsurancePlanId: mc.InsurancePlanID,
			ServiceLineId:   mc.ServiceLineID,
			ModalityId:      mc.ModalityID,
		})
	}

	return &modalitypb.GetModalityConfigsResponse{
		Configs: modalityConfigs,
	}, nil
}

func (s *ModalityGRPCServer) CalculateModalities(ctx context.Context, r *modalitypb.CalculateModalitiesRequest) (*modalitypb.CalculateModalitiesResponse, error) {
	s.Logger.Infow("CalculateModalities input data", serviceLineKey, r.ServiceLineId, marketKey, r.MarketId, insurancePlanKey, r.InsurancePlanId)

	dbModalities, err := s.ModalityDB.CalculateModalities(ctx, modalitysql.CalculateModalitiesParams{
		ServiceLineID:   r.ServiceLineId,
		MarketID:        r.MarketId,
		InsurancePlanID: r.InsurancePlanId,
	})

	s.Logger.Infow("CalculateModalities", modalitiesKey, dbModalities)

	if err != nil {
		logErr := s.ModalityDB.InsertCalculateModalitiesLog(ctx, modalitysql.InsertCalculateModalitiesLogParams{
			ServiceLineID:   r.ServiceLineId,
			MarketID:        r.MarketId,
			InsurancePlanID: r.InsurancePlanId,
		})
		if logErr != nil {
			s.Logger.Errorf("CalculateModalities: Write calculation log to DB failed: %s", logErr)
		}

		s.Logger.Errorf("CalculateModalities: Failed to calculate modalities: %s", err)

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	var modalities []*modalitypb.Modality
	for _, m := range dbModalities {
		modalities = append(modalities, &modalitypb.Modality{
			Id:          m.ID,
			DisplayName: m.DisplayName,
			Type:        m.ModalityType,
		})
	}

	var businessModalities []string
	for _, m := range modalities {
		businessModalities = append(businessModalities, fmt.Sprint(m))
	}

	err = s.ModalityDB.InsertCalculateModalitiesLog(ctx, modalitysql.InsertCalculateModalitiesLogParams{
		ServiceLineID:      r.ServiceLineId,
		MarketID:           r.MarketId,
		InsurancePlanID:    r.InsurancePlanId,
		BusinessModalities: businessModalities,
	})

	if err != nil {
		s.Logger.Errorf("CalculateModalities: Write calculation log to db failed: %s", err)
	}

	return &modalitypb.CalculateModalitiesResponse{
		Modalities: modalities,
	}, nil
}

func (s *ModalityGRPCServer) UpdateModalityConfigs(ctx context.Context, r *modalitypb.UpdateModalityConfigsRequest) (*modalitypb.UpdateModalityConfigsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	s.Logger.Infow("UpdateModalityConfigs input data", serviceLineKey, r.ServiceLineId, configsKey, r.Configs)

	var configs []*modalitydb.ModalityConfig

	for _, mc := range r.Configs {
		configs = append(configs, &modalitydb.ModalityConfig{
			ID:              mc.Id,
			MarketID:        mc.MarketId,
			InsurancePlanID: mc.InsurancePlanId,
			ServiceLineID:   mc.ServiceLineId,
			ModalityID:      mc.ModalityId,
		})
	}
	dbModalityConfigs, err := s.ModalityDB.UpdateModalityConfigs(ctx, modalitydb.UpdateModalityConfigsParams{
		ServiceLineID: r.ServiceLineId,
		Configs:       configs,
	})

	s.Logger.Infow("UpdateModalityConfigs", configsKey, dbModalityConfigs)

	if err != nil {
		s.Logger.Errorf("UpdateModalityConfigs: Failed update modality config: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	var modalityConfigs []*modalitypb.ModalityConfig

	for _, mc := range dbModalityConfigs {
		modalityConfigs = append(modalityConfigs, &modalitypb.ModalityConfig{
			Id:              mc.ID,
			MarketId:        mc.MarketID,
			InsurancePlanId: mc.InsurancePlanID,
			ServiceLineId:   mc.ServiceLineID,
			ModalityId:      mc.ModalityID,
		})
	}

	return &modalitypb.UpdateModalityConfigsResponse{
		Configs: modalityConfigs,
	}, nil
}

func (s *ModalityGRPCServer) GetMarketModalityConfigs(ctx context.Context, r *modalitypb.GetMarketModalityConfigsRequest) (*modalitypb.GetMarketModalityConfigsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	s.Logger.Infow("GetMarketModalityConfigs input data", serviceLineKey, r.ServiceLineId)

	dbMarketModalityConfigs, err := s.ModalityDB.GetMarketModalityConfigsByServiceLineID(ctx, r.ServiceLineId)

	s.Logger.Infow("GetMarketModalityConfigs", configsKey, dbMarketModalityConfigs)

	if err != nil {
		s.Logger.Errorf("GetMarketModalityConfigs: Failed to get market modality config: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	marketModalityConfigs := make([]*modalitypb.MarketModalityConfig, len(dbMarketModalityConfigs))
	for i, mc := range dbMarketModalityConfigs {
		marketModalityConfigs[i] = &modalitypb.MarketModalityConfig{
			Id:            mc.ID,
			MarketId:      mc.MarketID,
			ServiceLineId: mc.ServiceLineID,
			ModalityId:    mc.ModalityID,
		}
	}

	return &modalitypb.GetMarketModalityConfigsResponse{
		Configs: marketModalityConfigs,
	}, nil
}

func (s *ModalityGRPCServer) UpdateMarketModalityConfigs(ctx context.Context, r *modalitypb.UpdateMarketModalityConfigsRequest) (*modalitypb.UpdateMarketModalityConfigsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	s.Logger.Infow("UpdateMarketModalityConfigs input data", serviceLineKey, r.ServiceLineId, configsKey, r.Configs)

	configs := make([]*modalitydb.MarketModalityConfig, len(r.Configs))

	for i, mc := range r.Configs {
		configs[i] = &modalitydb.MarketModalityConfig{
			ID:            mc.Id,
			MarketID:      mc.MarketId,
			ServiceLineID: mc.ServiceLineId,
			ModalityID:    mc.ModalityId,
		}
	}
	dbMarketModalityConfigs, err := s.ModalityDB.UpdateMarketModalityConfigs(ctx, modalitydb.UpdateMarketModalityConfigsParams{
		ServiceLineID: r.ServiceLineId,
		Configs:       configs,
	})

	s.Logger.Infow("UpdateMarketModalityConfigs", configsKey, dbMarketModalityConfigs)

	if err != nil {
		s.Logger.Errorf("UpdateMarketModalityConfigs: Failed update market modality config: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	modalityConfigs := make([]*modalitypb.MarketModalityConfig, len(dbMarketModalityConfigs))

	for i, mc := range dbMarketModalityConfigs {
		modalityConfigs[i] = &modalitypb.MarketModalityConfig{
			Id:            mc.ID,
			MarketId:      mc.MarketID,
			ServiceLineId: mc.ServiceLineID,
			ModalityId:    mc.ModalityID,
		}
	}

	return &modalitypb.UpdateMarketModalityConfigsResponse{
		Configs: modalityConfigs,
	}, nil
}

func (s *ModalityGRPCServer) GetEligibleMarketsByModality(ctx context.Context, r *modalitypb.GetEligibleMarketsByModalityRequest) (*modalitypb.GetEligibleMarketsByModalityResponse, error) {
	s.Logger.Infow("GetEligibleMarketsByModality input data", modalityTypeKey, r.ModalityType)

	eligible, err := s.ModalityDB.GetEligibleMarketsByModalityType(ctx, r.ModalityType)

	s.Logger.Infow("GetEligibleMarketsByModality", eligibleMarketsKey, eligible)

	if err != nil {
		s.Logger.Errorf("GetEligibleMarketsByModality: Failed get eligible markets by modality: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &modalitypb.GetEligibleMarketsByModalityResponse{
		MarketIds: eligible,
	}, nil
}

func (s *ModalityGRPCServer) GetNetworkModalityConfigs(ctx context.Context, r *modalitypb.GetNetworkModalityConfigsRequest) (*modalitypb.GetNetworkModalityConfigsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	s.Logger.Infow("GetNetworkModalityConfigs input data", networkKey, r.GetNetworkId(), serviceLineKey, r.GetServiceLineId())

	dbNetworkModalityConfigs, err := s.ModalityDB.GetNetworkModalityConfigs(ctx, modalitysql.GetNetworkModalityConfigurationsParams{
		NetworkID:     sqltypes.ToNullInt64(r.NetworkId),
		ServiceLineID: sqltypes.ToNullInt64(r.ServiceLineId),
	})

	if err != nil {
		s.Logger.Errorf("GetNetworkModalityConfigs: Failed to get network modality config: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	s.Logger.Infow("GetNetworkModalityConfigs", configsKey, dbNetworkModalityConfigs)

	networkModalityConfigs := make([]*modalitypb.NetworkModalityConfig, len(dbNetworkModalityConfigs))
	for i, nc := range dbNetworkModalityConfigs {
		networkModalityConfigs[i] = &modalitypb.NetworkModalityConfig{
			Id:            &nc.ID,
			NetworkId:     nc.NetworkID,
			BillingCityId: nc.BillingCityID,
			ServiceLineId: nc.ServiceLineID,
			ModalityId:    nc.ModalityID,
		}
	}

	return &modalitypb.GetNetworkModalityConfigsResponse{
		Configs: networkModalityConfigs,
	}, nil
}

func (s *ModalityGRPCServer) UpdateNetworkModalityConfigs(ctx context.Context, r *modalitypb.UpdateNetworkModalityConfigsRequest) (*modalitypb.UpdateNetworkModalityConfigsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	s.Logger.Infow("UpdateNetworkModalityConfigs input data", networkKey, r.NetworkId, configsKey, r.Configs)

	if r.NetworkId <= 0 {
		return &modalitypb.UpdateNetworkModalityConfigsResponse{
			Configs: []*modalitypb.NetworkModalityConfig{},
		}, status.Error(codes.InvalidArgument, "network id should be grater than 0")
	}

	configs := make([]*modalitydb.NetworkModalityConfig, len(r.Configs))

	for i, nc := range r.Configs {
		configs[i] = &modalitydb.NetworkModalityConfig{
			ID:            nc.GetId(),
			NetworkID:     nc.NetworkId,
			BillingCityID: nc.BillingCityId,
			ServiceLineID: nc.ServiceLineId,
			ModalityID:    nc.ModalityId,
		}
	}
	dbNetworkModalityConfigs, err := s.ModalityDB.UpdateNetworkModalityConfigs(ctx, modalitydb.UpdateNetworkModalityConfigsParams{
		NetworkID: r.NetworkId,
		Configs:   configs,
	})

	if err != nil {
		s.Logger.Errorf("UpdateNetworkModalityConfigs: Failed update network modality config: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	s.Logger.Infow("UpdateNetworkModalityConfigs", configsKey, dbNetworkModalityConfigs)

	modalityConfigs := make([]*modalitypb.NetworkModalityConfig, len(dbNetworkModalityConfigs))

	for i, nc := range dbNetworkModalityConfigs {
		modalityConfigs[i] = &modalitypb.NetworkModalityConfig{
			Id:            &nc.ID,
			NetworkId:     nc.NetworkID,
			BillingCityId: nc.BillingCityID,
			ServiceLineId: nc.ServiceLineID,
			ModalityId:    nc.ModalityID,
		}
	}

	return &modalitypb.UpdateNetworkModalityConfigsResponse{
		Configs: modalityConfigs,
	}, nil
}

func (s *ModalityGRPCServer) GetNetworkServiceLines(ctx context.Context, r *modalitypb.GetNetworkServiceLinesRequest) (*modalitypb.GetNetworkServiceLinesResponse, error) {
	if r.NetworkId <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "network id should be greater than 0")
	}

	serviceLineIDs, err := s.ModalityDB.GetNetworkServiceLinesByNetworkID(ctx, r.NetworkId)

	if err != nil {
		s.Logger.Errorf("GetNetworkServiceLines: failed to get service lines for network %d: %s", r.NetworkId, err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	s.Logger.Infow(fmt.Sprintf("GetNetworkServiceLines: service lines for network %d:", r.NetworkId), serviceLineIdsKey, serviceLineIDs)

	return &modalitypb.GetNetworkServiceLinesResponse{ServiceLineIds: serviceLineIDs}, nil
}

func (s *ModalityGRPCServer) ListCareRequestEligibleModalities(ctx context.Context, r *modalitypb.ListCareRequestEligibleModalitiesRequest) (*modalitypb.ListCareRequestEligibleModalitiesResponse, error) {
	s.Logger.Infow("GetCareRequestEligibleModalities input data", serviceLineKey, r.ServiceLineId, marketKey, r.MarketId, networkKey, r.NetworkId, billingCityKey, r.BillingCityId)

	dbModalities, err := s.ModalityDB.GetCareRequestEligibleModalities(ctx, modalitysql.GetCareRequestEligibleModalitiesParams{
		ServiceLineID: r.ServiceLineId,
		MarketID:      r.MarketId,
		NetworkID:     r.NetworkId,
		BillingCityID: r.BillingCityId,
	})
	if err != nil {
		s.Logger.Errorw("ListCareRequestEligibleModalities: failed to get eligible modalities %w", zap.Error(err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	modalities := make([]*modalitypb.Modality, len(dbModalities))

	for i, modality := range dbModalities {
		modalities[i] = &modalitypb.Modality{
			Id:          modality.ID,
			DisplayName: modality.DisplayName,
			Type:        modality.ModalityType,
		}
	}

	return &modalitypb.ListCareRequestEligibleModalitiesResponse{
		Modalities: modalities,
	}, nil
}

func (s *ModalityGRPCServer) ListEligibleNetworks(ctx context.Context, r *modalitypb.ListEligibleNetworksRequest) (*modalitypb.ListEligibleNetworksResponse, error) {
	dbNetworkIDs, err := s.ModalityDB.FindEligibleNetworks(ctx, modalitysql.FindEligibleNetworksParams{
		BillingCityID: sqltypes.ToNullInt64(r.BillingCityId),
		ServiceLineID: sqltypes.ToNullInt64(r.ServiceLineId),
	})
	if err != nil {
		s.Logger.Errorw("FindEligibleNetworks: failed to get insurance network ids", zap.Error(err))
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &modalitypb.ListEligibleNetworksResponse{
		NetworkIds: dbNetworkIDs,
	}, nil
}
