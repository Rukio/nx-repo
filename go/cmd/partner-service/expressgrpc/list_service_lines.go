package expressgrpc

import (
	"context"
	"errors"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) ListServiceLines(ctx context.Context, req *partnerpb.ListServiceLinesRequest) (*partnerpb.ListServiceLinesResponse, error) {
	market, err := s.DBService.GetMarketByStationMarketID(ctx, req.MarketId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "market %v was not found", req.MarketId)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationByExpressID error: %v", err)
	}

	serviceLines, err := s.DBService.GetServiceLinesByExpressIDAndMarketID(ctx, partnersql.GetServiceLinesByExpressIDAndMarketIDParams{
		MarketID:  market.ID,
		ExpressID: sqltypes.ToValidNullString(req.PartnerId),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetServiceLinesByConfigurationAndMarket error: %v", err)
	}

	protoServiceLines := make([]*partnerpb.ServiceLine, len(serviceLines))
	for i, serviceLine := range serviceLines {
		protoServiceLines[i] = partnerdb.ProtoServiceLineFromServiceLine(serviceLine)
	}
	return &partnerpb.ListServiceLinesResponse{
		ServiceLines: protoServiceLines,
	}, nil
}
