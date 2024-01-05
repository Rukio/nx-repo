package expressgrpc

import (
	"context"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	defaultPageNumber = int64(1)
	defaultPageSize   = int64(10)
)

func (s *Server) ListConfigurations(ctx context.Context, req *partnerpb.ListConfigurationsRequest) (*partnerpb.ListConfigurationsResponse, error) {
	pageNumber := defaultPageNumber
	if req.PageNumber != nil {
		if req.GetPageNumber() < 1 {
			return nil, status.Error(codes.InvalidArgument, "page number must be greater than 0")
		}
		pageNumber = req.GetPageNumber()
	}

	pageSize := defaultPageSize
	if req.PageSize != nil {
		if req.GetPageSize() < 1 {
			return nil, status.Error(codes.InvalidArgument, "page size must be greater than 0")
		}
		pageSize = req.GetPageSize()
	}

	pageOffset := (pageNumber - 1) * pageSize
	nameFilterEnabled := req.GetName() != ""
	partnerConfigurationsCount, err := s.DBService.CountPartnerConfigurations(ctx, partnersql.CountPartnerConfigurationsParams{
		NameFilterEnabled: nameFilterEnabled,
		DisplayName:       req.GetName(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "CountPartnerConfigurations error: %v", err)
	}

	totalPages := partnerConfigurationsCount / pageSize
	if partnerConfigurationsCount%pageSize > 0 {
		totalPages++
	}
	if partnerConfigurationsCount == 0 || pageOffset > partnerConfigurationsCount {
		return &partnerpb.ListConfigurationsResponse{
			TotalPages:            totalPages,
			PageNumber:            pageNumber,
			PartnerConfigurations: []*partnerpb.PartnerConfiguration{},
		}, nil
	}

	partnerConfigurations, err := s.DBService.SearchPartnerConfigurations(ctx, partnersql.SearchPartnerConfigurationsParams{
		NameFilterEnabled: nameFilterEnabled,
		DisplayName:       req.GetName(),
		PageOffset:        int32(pageOffset),
		PageSize:          int32(pageSize),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "SearchPartnerConfigurations error: %v", err)
	}

	partnerConfigurationsResponse := make([]*partnerpb.PartnerConfiguration, len(partnerConfigurations))
	for i, partnerConfiguration := range partnerConfigurations {
		partnerConfigurationsResponse[i] = partnerdb.ProtoPartnerConfigurationFromSearchPartnerConfigurationsRow(partnerConfiguration)
	}

	return &partnerpb.ListConfigurationsResponse{
		TotalPages:            totalPages,
		PageNumber:            pageNumber,
		PartnerConfigurations: partnerConfigurationsResponse,
	}, nil
}
