package expressgrpc

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v4"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) DeletePartnerConfiguration(ctx context.Context, req *partnerpb.DeleteConfigurationRequest) (*partnerpb.DeleteConfigurationResponse, error) {
	partnerConfig, err := s.DBService.DeletePartnerConfiguration(ctx, req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "Partner Configuration with id %d not found", req.Id)
		}

		return nil, status.Errorf(codes.Internal, "DeletePartnerConfiguration error: %v", err)
	}

	return &partnerpb.DeleteConfigurationResponse{
		PartnerConfiguration: partnerdb.ProtoPartnerConfigurationFromPartnerConfiguration(partnerConfig),
	}, nil
}
