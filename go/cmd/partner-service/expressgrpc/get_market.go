package expressgrpc

import (
	"context"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetMarket(ctx context.Context, req *partnerpb.GetMarketRequest) (*partnerpb.GetMarketResponse, error) {
	marketsAndServiceLines, err := s.DBService.GetMarketsAndServiceLinesByIDOrPartnerConfigID(ctx, partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDParams{
		PartnerConfigurationMarketID: sqltypes.ToValidNullInt64(req.Id),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetMarketsAndServiceLinesByIDOrPartnerConfigID error: %v", err)
	}

	protoMarkets := partnerdb.ProtoMarketsFromMarketsAndServiceLines(marketsAndServiceLines)
	if len(protoMarkets) == 0 {
		return nil, status.Errorf(codes.NotFound, "Partner configuration market with id %d does not exist", req.Id)
	}

	return &partnerpb.GetMarketResponse{
		Market: protoMarkets[0],
	}, err
}
