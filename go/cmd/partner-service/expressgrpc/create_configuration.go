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

func (s *Server) CreateConfiguration(ctx context.Context, req *partnerpb.CreateConfigurationRequest) (*partnerpb.CreateConfigurationResponse, error) {
	if req.PartnerConfiguration == nil {
		return nil, status.Error(codes.InvalidArgument, "PartnerConfiguration is required")
	}

	if req.PartnerConfiguration.Id != nil {
		return nil, status.Error(codes.InvalidArgument, "PartnerConfiguration ID must be nil")
	}

	if req.PartnerConfiguration.ExpressId != nil {
		if err := s.validateUniqueExpressID(ctx, *req.PartnerConfiguration.ExpressId); err != nil {
			return nil, err
		}
	}

	partnerConfig, err := s.DBService.UpsertPartnerConfiguration(ctx, req.PartnerConfiguration)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "UpsertPartnerConfiguration error: %v", err)
	}

	return &partnerpb.CreateConfigurationResponse{
		PartnerConfiguration: partnerdb.ProtoPartnerConfigurationFromGetPartnerConfigurationByIDRow(
			partnerConfig,
			partnerdb.PartnerConfigurationRelations{},
		),
	}, nil
}

func (s *Server) validateUniqueExpressID(ctx context.Context, expressID string) error {
	_, err := s.DBService.GetPartnerConfigurationByExpressID(ctx, expressID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return status.Errorf(codes.Internal, "GetPartnerConfigurationByExpressID error: %v", err)
	}
	return status.Errorf(codes.InvalidArgument, "PartnerConfiguration with ExpressID %v already exists", expressID)
}
