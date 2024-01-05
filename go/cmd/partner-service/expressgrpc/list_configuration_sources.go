package expressgrpc

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) ListConfigurationSources(ctx context.Context, req *partnerpb.ListConfigurationSourcesRequest) (*partnerpb.ListConfigurationSourcesResponse, error) {
	partnerConfigurationID := req.PartnerConfigurationId
	sourcesRows, err := s.DBService.GetPartnerConfigurationSourcesByPartnerConfigurationID(ctx, partnerConfigurationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationSourcesByPartnerConfigurationID error: %v", err)
	}
	sources := make([]*partnerpb.Source, len(sourcesRows))
	for i, row := range sourcesRows {
		sources[i] = partnerdb.ProtoSourceFromGetPartnerConfigSource(row)
	}

	return &partnerpb.ListConfigurationSourcesResponse{
		Sources: sources,
	}, nil
}
