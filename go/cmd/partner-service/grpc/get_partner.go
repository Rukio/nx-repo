package grpc

import (
	"context"
	"errors"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetPartner(ctx context.Context, req *partnerpb.GetPartnerRequest) (*partnerpb.GetPartnerResponse, error) {
	partnerRow, err := s.DBService.GetPartnerByID(ctx, req.PartnerId)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "GetPartnerByID error: partner with ID %v was not found", req.PartnerId)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerByID error: %v", err)
	}

	partner := partnerdb.ProtoPartnerFromGetPartnerByIDRow(partnerRow)

	return &partnerpb.GetPartnerResponse{Partner: partner}, nil
}
