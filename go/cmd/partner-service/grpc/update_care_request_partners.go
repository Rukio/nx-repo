package grpc

import (
	"context"
	"errors"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	locationSlug               = "location"
	sourceSlug                 = "source"
	popHealthSlug              = "pop_health"
	latLngErrorMarginDegreesE6 = 150.0
	insuranceSlug              = "insurance"
	providerNetworkSlug        = "provider_network"
)

func (s *Server) UpdateCareRequestPartners(ctx context.Context, req *partnerpb.UpdateCareRequestPartnersRequest) (*partnerpb.UpdateCareRequestPartnersResponse, error) {
	careRequestPartners, err := s.DBService.GetCareRequestPartnersByStationCareRequestID(ctx, req.CareRequest.Id)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, status.Errorf(codes.Internal, "GetCareRequestPartnersByStationCareRequestID error: %v", err)
	}

	switch *req.Origin {
	case partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION:
		careRequestPartners, err := s.updateLocationPartners(ctx, req, careRequestPartners)
		if err != nil {
			return nil, err
		}

		return &partnerpb.UpdateCareRequestPartnersResponse{
			CareRequestPartners: careRequestPartners,
		}, nil
	case partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH:
		careRequestPartners, err := s.updatePopHealthPartner(ctx, req, careRequestPartners)
		if err != nil {
			return nil, err
		}

		return &partnerpb.UpdateCareRequestPartnersResponse{
			CareRequestPartners: careRequestPartners,
		}, nil
	case partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_SOURCE:
		careRequestPartner, err := s.updateSourcePartner(ctx, req, careRequestPartners)
		if err != nil {
			return nil, err
		}

		return &partnerpb.UpdateCareRequestPartnersResponse{
			CareRequestPartners: []*partnerpb.CareRequestPartner{careRequestPartner},
		}, nil

	case partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_INSURANCE:
		careRequestPartners, err := s.updateInsurancePartners(ctx, req, careRequestPartners)
		if err != nil {
			return nil, err
		}

		return &partnerpb.UpdateCareRequestPartnersResponse{
			CareRequestPartners: careRequestPartners,
		}, nil

	case partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_PROVIDER_NETWORK:
		careRequestPartners, err := s.updateProviderNetworkPartners(ctx, req, careRequestPartners)
		if err != nil {
			return nil, err
		}

		return &partnerpb.UpdateCareRequestPartnersResponse{
			CareRequestPartners: careRequestPartners,
		}, nil

	default:
		return nil, status.Errorf(codes.InvalidArgument, "UpdateCareRequestPartners unimplemented origin")
	}
}

func (s *Server) updateLocationPartners(
	ctx context.Context,
	req *partnerpb.UpdateCareRequestPartnersRequest,
	careRequestPartners []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow,
) ([]*partnerpb.CareRequestPartner, error) {
	if req.CareRequest.Location.GeoLocation == nil || req.CareRequest.Location.GeoLocation.LatitudeE6 == 0 || req.CareRequest.Location.GeoLocation.LongitudeE6 == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "updateLocationPartners requires a lat and lng")
	}

	latE6Min := req.CareRequest.Location.GeoLocation.LatitudeE6 - latLngErrorMarginDegreesE6
	latE6Max := req.CareRequest.Location.GeoLocation.LatitudeE6 + latLngErrorMarginDegreesE6
	lngE6Min := req.CareRequest.Location.GeoLocation.LongitudeE6 - latLngErrorMarginDegreesE6
	lngE6Max := req.CareRequest.Location.GeoLocation.LongitudeE6 + latLngErrorMarginDegreesE6

	locationPartners, err := s.DBService.SearchPartnersByLatLng(ctx, partnersql.SearchPartnersByLatLngParams{
		LatE6Min: sqltypes.ToValidNullInt32(latE6Min),
		LatE6Max: sqltypes.ToValidNullInt32(latE6Max),
		LngE6Min: sqltypes.ToValidNullInt32(lngE6Min),
		LngE6Max: sqltypes.ToValidNullInt32(lngE6Max),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "SearchPartnersByLatLng error: %v", err)
	}

	locationPartnerMap := make(map[int64]struct{})
	for _, locationPartner := range locationPartners {
		locationPartnerMap[locationPartner.ID] = struct{}{}
	}

	updatedCareRequestPartnerAssoc, err := s.updateCareRequestPartnerAssociations(ctx, req.CareRequest.Id, careRequestPartners, locationPartnerMap, locationSlug)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return updatedCareRequestPartnerAssoc, nil
}

func (s *Server) updateSourcePartner(ctx context.Context, req *partnerpb.UpdateCareRequestPartnersRequest, careRequestPartners []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow) (*partnerpb.CareRequestPartner, error) {
	sourcePartner, err := s.DBService.GetPartnerByStationChannelItemID(ctx, req.CareRequest.ChannelItemId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "GetPartnerByStationChannelItemID error: %v", err)
	}

	if sourcePartner.DeactivatedAt.Valid {
		return nil, status.Errorf(codes.FailedPrecondition, "source partner with channel item id %v was deactivated", req.CareRequest.ChannelItemId)
	}

	var existingSourcePartner *partnersql.GetCareRequestPartnersByStationCareRequestIDRow
	for i := range careRequestPartners {
		if careRequestPartners[i].CareRequestPartnerOriginSlug == sourceSlug {
			existingSourcePartner = careRequestPartners[i]
			break
		}
	}

	if existingSourcePartner == nil || existingSourcePartner.PartnerID != sourcePartner.ID {
		_, err := s.DBService.AddCareRequestPartner(ctx, partnersql.AddCareRequestPartnerParams{
			StationCareRequestID:         req.CareRequest.Id,
			PartnerID:                    sourcePartner.ID,
			CareRequestPartnerOriginSlug: sourceSlug,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "AddCareRequestPartner error: %v", err)
		}

		if existingSourcePartner != nil {
			_, err = s.DBService.DeleteCareRequestPartner(ctx, existingSourcePartner.ID)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "DeleteCareRequestPartner error: %v", err)
			}
		}
	}

	return &partnerpb.CareRequestPartner{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_SOURCE,
		Id:     sourcePartner.ID,
	}, nil
}

func (s *Server) updatePopHealthPartner(
	ctx context.Context,
	req *partnerpb.UpdateCareRequestPartnersRequest,
	careRequestPartners []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow,
) ([]*partnerpb.CareRequestPartner, error) {
	if req.CareRequest.Patient == nil || req.CareRequest.Patient.DateOfBirth == nil || req.CareRequest.Patient.Name == nil {
		return nil, status.Errorf(codes.InvalidArgument, "updatePopHealthPartner requires a patient with name and dob")
	}

	patients, err := s.PopHealthSearchPatientClient.SearchPatient(ctx, &pophealthpb.SearchPatientRequest{
		FirstName:   req.CareRequest.Patient.Name.GetGivenName(),
		LastName:    req.CareRequest.Patient.Name.GetFamilyName(),
		DateOfBirth: req.CareRequest.Patient.DateOfBirth,
		Ssn:         req.CareRequest.Patient.Ssn,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "SearchPatient error: %v", err)
	}

	popHealthPartnerMap, err := s.getPartnersMapFromPophealthPatients(ctx, patients.GetPatient())
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	updatedCareRequestPartnerAssoc, err := s.updateCareRequestPartnerAssociations(ctx, req.CareRequest.Id, careRequestPartners, popHealthPartnerMap, popHealthSlug)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return updatedCareRequestPartnerAssoc, nil
}

func (s *Server) updateInsurancePartners(ctx context.Context, req *partnerpb.UpdateCareRequestPartnersRequest, careRequestPartners []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow) ([]*partnerpb.CareRequestPartner, error) {
	insurancePackageIDs := make([]int64, len(req.CareRequest.InsurancePackages))
	for i, insurancePackage := range req.CareRequest.InsurancePackages {
		insurancePackageIDs[i] = insurancePackage.PackageId
	}
	insurancePartners, err := s.DBService.GetPartnersByInsurancePackages(ctx, insurancePackageIDs)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetPartnersByInsurancePackages error: %v", err)
	}

	insurancePartnersMap := make(map[int64]struct{}, len(insurancePartners))
	for _, insurancePartner := range insurancePartners {
		insurancePartnersMap[insurancePartner.ID] = struct{}{}
	}

	updatedCareRequestPartnerAssoc, err := s.updateCareRequestPartnerAssociations(ctx, req.CareRequest.Id, careRequestPartners, insurancePartnersMap, insuranceSlug)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return updatedCareRequestPartnerAssoc, nil
}

func (s *Server) updateProviderNetworkPartners(ctx context.Context, req *partnerpb.UpdateCareRequestPartnersRequest, careRequestPartners []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow) ([]*partnerpb.CareRequestPartner, error) {
	networkChannelItemIDs := make([]int64, len(req.CareRequest.ProviderNetworks))
	for i, providerNetwork := range req.CareRequest.ProviderNetworks {
		networkChannelItemIDs[i] = providerNetwork.ChannelItemId
	}
	networkPartners, err := s.DBService.GetPartnersByStationChannelItemIDList(ctx, networkChannelItemIDs)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "GetPartnersByStationChannelItemIDList error: %v", err)
	}

	networkPartnersIDsSet := make(map[int64]struct{}, len(networkPartners))
	for _, networkPartner := range networkPartners {
		networkPartnersIDsSet[networkPartner.ID] = struct{}{}
	}

	updatedCareRequestPartnerAssoc, err := s.updateCareRequestPartnerAssociations(ctx, req.CareRequest.Id, careRequestPartners, networkPartnersIDsSet, providerNetworkSlug)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return updatedCareRequestPartnerAssoc, nil
}
