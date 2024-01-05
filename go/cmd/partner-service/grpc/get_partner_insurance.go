package grpc

import (
	"context"
	"errors"

	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetPartnerInsurance(
	ctx context.Context,
	req *partnerpb.GetPartnerInsuranceRequest,
) (*partnerpb.GetPartnerInsuranceResponse, error) {
	searchPopHealthPartners := false
	partner, err := s.DBService.GetInsuranceByCareRequestAndOrigin(ctx, partnersql.GetInsuranceByCareRequestAndOriginParams{
		CareRequestPartnerOriginSlug: sourceSlug,
		StationCareRequestID:         req.CareRequestId,
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.Internal, "GetInsuranceByCareRequestAndOrigin error: %v", err)
		}
		searchPopHealthPartners = true
	}

	if searchPopHealthPartners {
		partner, err = s.DBService.GetInsuranceByCareRequestAndOrigin(ctx, partnersql.GetInsuranceByCareRequestAndOriginParams{
			CareRequestPartnerOriginSlug: popHealthSlug,
			StationCareRequestID:         req.CareRequestId,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return &partnerpb.GetPartnerInsuranceResponse{}, nil
			}
			return nil, status.Errorf(codes.Internal, "GetInsuranceByCareRequestAndOrigin error: %v", err)
		}
	}

	searchNetworksResp, err := s.InsuranceClient.SearchInsuranceNetworks(ctx, &insurancepb.SearchInsuranceNetworksRequest{
		PackageIds: []int64{partner.InsurancePackageID.Int64},
	})
	if err != nil {
		s.Logger.Errorw("SearchInsuranceNetworks error", "package_id", partner.InsurancePackageID.Int64, zap.Error(err))
		return nil, status.Errorf(codes.Internal, "SearchInsuranceNetworks error: %v", err)
	}

	if len(searchNetworksResp.GetNetworks()) == 0 {
		return nil, status.Errorf(codes.NotFound, "No networks found for insurance package id %d", partner.InsurancePackageID.Int64)
	}

	network := searchNetworksResp.Networks[0]
	return &partnerpb.GetPartnerInsuranceResponse{
		Insurance: partnerdb.ProtoInsuranceRecordFromInsuranceNetwork(network),
	}, nil
}
