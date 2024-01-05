package expressgrpc

import (
	"context"
	"errors"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"

	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetConfigurationSource(ctx context.Context, req *partnerpb.GetConfigurationSourceRequest) (*partnerpb.GetConfigurationSourceResponse, error) {
	partnerConfigurationSourceID := req.GetId()
	sourceRow, err := s.DBService.GetPartnerConfigurationSourceByID(ctx, partnerConfigurationSourceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "configuration source with ID %v was not found", partnerConfigurationSourceID)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationSourceByID error: %v", err)
	}
	sourceRows := partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow(*sourceRow)
	return &partnerpb.GetConfigurationSourceResponse{
		Source: partnerdb.ProtoSourceFromGetPartnerConfigSource(&sourceRows),
	}, nil
}
