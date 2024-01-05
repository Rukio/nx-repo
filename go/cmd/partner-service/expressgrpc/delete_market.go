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

func (s *Server) DeleteMarket(ctx context.Context, req *partnerpb.DeleteMarketRequest) (*partnerpb.DeleteMarketResponse, error) {
	market, err := s.DBService.DeleteMarket(ctx, req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "Partner configuration market with id %d does not exist", req.Id)
		}
		return nil, status.Errorf(codes.Internal, "DeleteMarket error: %v", err)
	}

	return &partnerpb.DeleteMarketResponse{
		Market: partnerdb.ProtoMarketFromPartnerDBPartnerConfigurationMarket(market),
	}, nil
}
