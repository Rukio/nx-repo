package expressgrpc

import (
	"context"
	"errors"
	"strconv"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetConfiguration(ctx context.Context, req *partnerpb.GetConfigurationRequest) (*partnerpb.GetConfigurationResponse, error) {
	if req.PartnerConfigurationId == "" {
		return nil, status.Error(codes.InvalidArgument, "PartnerConfiguration ID is required")
	}

	partnerConfigurationID, err := strconv.ParseInt(req.PartnerConfigurationId, 10, 64)
	if err != nil {
		expressID := req.PartnerConfigurationId
		expressPartnerConfiguration, err := s.DBService.GetPartnerConfigurationByExpressID(ctx, expressID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, status.Errorf(codes.NotFound, "GetPartnerConfigurationByExpressID error: configuration with Express ID %v was not found", expressID)
			}
			return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationByExpressID error: %v", err)
		}

		partnerConfigurationID = expressPartnerConfiguration.ID
	}

	partnerConfiguration, err := s.DBService.GetPartnerConfigurationByID(ctx, partnerConfigurationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "GetPartnerConfigurationByID error: configuration with ID %v was not found", partnerConfigurationID)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", err)
	}

	emailDomains, err := s.DBService.GetEmailDomainsByPartnerConfigurationID(ctx, partnerConfigurationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetEmailDomainsByPartnerConfigurationID error: %v", err)
	}

	partnerMarkets, err := s.DBService.GetMarketsAndServiceLinesByIDOrPartnerConfigID(ctx, partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDParams{
		PartnerConfigurationID: sqltypes.ToValidNullInt64(partnerConfigurationID),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetMarketsAndServiceLinesByIDOrPartnerConfigID error: %v", err)
	}

	popHealthChannelItemIDs, err := s.DBService.GetPophealthChannelItemsByPartnerConfigurationID(ctx, partnerConfigurationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetPophealthChannelItemsByPartnerConfigurationID error: %v", err)
	}

	partnerConfigSources, err := s.DBService.GetPartnerConfigurationSourcesByPartnerConfigurationID(ctx, partnerConfigurationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationSourcesByPartnerConfigurationID error: %v", err)
	}

	return &partnerpb.GetConfigurationResponse{
		PartnerConfiguration: partnerdb.ProtoPartnerConfigurationFromGetPartnerConfigurationByIDRow(
			partnerConfiguration,
			partnerdb.PartnerConfigurationRelations{
				EmailDomains:            emailDomains,
				Markets:                 partnerMarkets,
				PopHealthChannelItemIDs: popHealthChannelItemIDs,
				Sources:                 partnerConfigSources,
			},
		),
	}, nil
}
