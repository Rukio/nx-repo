package expressgrpc

import (
	"context"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const DefaultMaxResultCount = 10

func (s *Server) SearchPartners(ctx context.Context, req *partnerpb.ExpressServiceSearchPartnersRequest) (*partnerpb.ExpressServiceSearchPartnersResponse, error) {
	maxResultCount := int32(DefaultMaxResultCount)
	if req.GetMaxResultCount() > 0 {
		maxResultCount = req.GetMaxResultCount()
	}
	searchPartnerParams := partnersql.SearchPartnersByNameParams{
		PartnerName:    req.GetName(),
		MaxResultCount: maxResultCount,
	}
	partners, err := s.DBService.SearchPartnersByName(ctx, searchPartnerParams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "SearchPartnersByName error: %v", err)
	}

	protoPartners := make([]*partnerpb.Partner, len(partners))
	for i, partner := range partners {
		protoPartners[i] = partnerdb.ProtoPartnerFromSearchPartnersByNameRow(partner)
	}

	return &partnerpb.ExpressServiceSearchPartnersResponse{
		Partners: protoPartners,
	}, nil
}
