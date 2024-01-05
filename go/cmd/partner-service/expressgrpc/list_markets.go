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

func (s *Server) ListMarkets(ctx context.Context, req *partnerpb.ListMarketsRequest) (*partnerpb.ListMarketsResponse, error) {
	marketsAndServiceLines, err := s.DBService.GetMarketsAndServiceLinesByIDOrPartnerConfigID(
		ctx,
		partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDParams{
			PartnerConfigurationID: sqltypes.ToValidNullInt64(req.PartnerConfigurationId),
		},
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetMarketsAndServiceLinesByIDOrPartnerConfigID error: %v", err)
	}

	return &partnerpb.ListMarketsResponse{
		Markets: partnerdb.ProtoMarketsFromMarketsAndServiceLines(marketsAndServiceLines),
	}, nil
}
