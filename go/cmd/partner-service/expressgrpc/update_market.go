package expressgrpc

import (
	"context"
	"errors"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) UpdateMarket(ctx context.Context, req *partnerpb.UpdateMarketRequest) (*partnerpb.UpdateMarketResponse, error) {
	if req.Market == nil {
		return nil, status.Errorf(codes.InvalidArgument, "market is required")
	}

	partnerConfigMarket, err := s.DBService.GetPartnerConfigurationMarketByID(ctx, req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "PartnerConfigurationMarket with id %d not found", req.Id)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationMarketByID error: %v", err)
	}

	serviceLinesMap, err := s.DBService.UpdatePartnerConfigurationMarketServiceLines(ctx, partnerConfigMarket, req.Market.ServiceLines)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "UpdatePartnerConfigurationMarketServiceLines error: %v", err)
	}

	req.Market.Id = &partnerConfigMarket.ID
	req.Market.ServiceLines = partnerdb.ProtoServiceLinesFromServiceLinesMap(serviceLinesMap)
	return &partnerpb.UpdateMarketResponse{
		Market: req.Market,
	}, nil
}
