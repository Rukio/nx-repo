package expressgrpc

import (
	"context"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) CreateConfigurationSource(ctx context.Context, req *partnerpb.CreateConfigurationSourceRequest) (*partnerpb.CreateConfigurationSourceResponse, error) {
	if req.Source == nil {
		return nil, status.Errorf(codes.InvalidArgument, "source is required")
	}

	_, err := s.DBService.GetPartnerByID(ctx, req.Source.PartnerId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "partner with ID %v was not found", req.Source.PartnerId)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerByID error: %v", err)
	}

	partnerConfigurationID := req.Source.GetPartnerConfigurationId()
	_, err = s.DBService.GetPartnerConfigurationByID(ctx, partnerConfigurationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "partner configuration with ID %v was not found", partnerConfigurationID)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", err)
	}

	_, err = s.DBService.GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID(ctx, partnersql.GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDParams{
		PartnerID:              req.Source.PartnerId,
		PartnerConfigurationID: partnerConfigurationID,
	})
	if err == nil {
		return nil, status.Errorf(codes.AlreadyExists, "PartnerConfigurationSource with PartnerID %d and PartnerConfigurationID %d already exists", req.Source.PartnerId, partnerConfigurationID)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID error: %v", err)
	}

	callbackNumber := req.Source.CallbackNumber
	if callbackNumber == nil {
		return nil, status.Error(codes.InvalidArgument, "callback number is required")
	}
	countryCode := callbackNumber.CountryCode
	phoneNumber := callbackNumber.GetPhoneNumber()
	extension := callbackNumber.Extension

	callbackOptionSlug := partnerdb.CallbackOptionEnumToCallbackOptionSlug[req.Source.DefaultCallbackOption]
	if req.Source.DefaultCallbackOption == partnerpb.CallbackOption_CALLBACK_OPTION_UNSPECIFIED {
		return nil, status.Errorf(codes.InvalidArgument, "invalid callback option: %v", callbackOptionSlug)
	}
	location := &partnerpb.Location{
		Address: req.Source.DefaultVisitAddress,
	}
	partnerConfigurationSource, err := s.DBService.AddPartnerConfigurationSource(ctx, location, partnersql.AddPartnerConfigurationSourceParams{
		PartnerID:                 req.Source.PartnerId,
		PartnerConfigurationID:    partnerConfigurationID,
		CallbackNumberCountryCode: sqltypes.ToNullInt32(countryCode),
		CallbackNumber:            phoneNumber,
		CallbackNumberExtension:   sqltypes.ToNullString(extension),
		DefaultCallbackOptionSlug: callbackOptionSlug,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "AddPartnerConfigurationSource error: %v", err)
	}
	req.Source.Id = &partnerConfigurationSource.ID

	return &partnerpb.CreateConfigurationSourceResponse{
		Source: req.Source,
	}, nil
}
