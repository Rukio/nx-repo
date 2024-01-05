package expressgrpc

import (
	"context"
	"errors"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) CreateMarket(ctx context.Context, req *partnerpb.CreateMarketRequest) (*partnerpb.CreateMarketResponse, error) {
	if req.Market == nil {
		return nil, status.Error(codes.InvalidArgument, "Market is required")
	}

	_, err := s.DBService.GetPartnerConfigurationByID(ctx, req.Market.PartnerConfigurationId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "PartnerConfiguration with id %d not found", req.Market.PartnerConfigurationId)
		}

		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", err)
	}

	market, err := s.DBService.GetMarketByStationMarketID(ctx, req.Market.StationMarketId)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.Internal, "GetMarketByStationMarketID error: %v", err)
		}

		market, err = s.DBService.AddMarket(ctx, partnersql.AddMarketParams{
			DisplayName:     req.Market.DisplayName,
			StationMarketID: req.Market.StationMarketId,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "AddMarket error: %v", err)
		}
	}

	_, err = s.DBService.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(
		ctx, partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams{
			PartnerConfigurationID: req.Market.PartnerConfigurationId,
			MarketID:               market.ID,
		})
	if err == nil {
		return nil, status.Errorf(codes.AlreadyExists, "PartnerConfigurationMarket with PartnerConfigurationID %d and MarketID %d already exists", req.Market.PartnerConfigurationId, market.ID)
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID error: %v", err)
	}

	req.Market.Id = &market.ID
	_, serviceLinesMap, err := s.DBService.CreatePartnerConfigurationMarketAndServiceLines(ctx, req.Market)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "CreatePartnerConfigurationMarketAndServiceLines error: %v", err)
	}

	req.Market.ServiceLines = partnerdb.ProtoServiceLinesFromServiceLinesMap(serviceLinesMap)
	return &partnerpb.CreateMarketResponse{
		Market: req.Market,
	}, nil
}
