package grpc

import (
	"context"
	"database/sql"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) UpsertPartner(ctx context.Context, req *partnerpb.UpsertPartnerRequest) (*partnerpb.UpsertPartnerResponse, error) {
	if req.Partner == nil {
		return nil, status.Error(codes.InvalidArgument, "Partner is required")
	}

	var newLocationID sql.NullInt64
	partner, err := s.DBService.GetPartnerByStationChannelItemID(ctx, req.Partner.StationIdentifiers.ChannelItemId)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.Internal, "GetPartnerByStationChannelItemID error: %v", err)
		}

		newLocationID, err = s.DBService.AddLocation(ctx, req.Partner.Location)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "AddLocation error: %v", err)
		}

		categoryShortName, categoryShortNameExists := partnerdb.PartnerCategoryEnumToShortName[req.Partner.PartnerCategory]
		if !categoryShortNameExists {
			return nil, status.Errorf(codes.InvalidArgument, "PartnerCategoryShortName could not be found: %v", req.Partner.PartnerCategory)
		}

		addPartnerParams := partnersql.AddPartnerParams{
			StationChannelItemID:     req.Partner.StationIdentifiers.ChannelItemId,
			StationChannelID:         sqltypes.ToNullInt64(req.Partner.StationIdentifiers.ChannelId),
			DisplayName:              req.Partner.Name,
			LocationID:               newLocationID,
			PartnerCategoryShortName: categoryShortName,
		}

		partner, err = s.DBService.AddPartner(ctx, addPartnerParams)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "AddPartner error: %v", err)
		}
	}

	phone := req.Partner.PhoneNumber
	if phone == nil {
		phone = &common.PhoneNumber{}
	}

	var deactivatedAt sql.NullTime
	if req.Partner.DeactivatedAt != nil {
		deactivatedAt = sqltypes.ToValidNullTime(req.Partner.DeactivatedAt.AsTime())
	}

	updatePartnerParams := partnersql.UpdatePartnerParams{
		ID:               partner.ID,
		DisplayName:      req.Partner.Name,
		PhoneCountryCode: sqltypes.ToNullInt32(phone.CountryCode),
		PhoneNumber:      sqltypes.ToNullString(phone.PhoneNumber),
		PhoneExtension:   sqltypes.ToNullString(phone.Extension),
		Email:            sqltypes.ToNullString(req.Partner.Email),
		DeactivatedAt:    deactivatedAt,
	}

	location := req.Partner.Location
	var updatePartnerLocationParams *partnersql.UpdateLocationParams
	if !newLocationID.Valid && location != nil && partner.LocationID.Valid {
		updatePartnerLocationParams = &partnersql.UpdateLocationParams{
			ID: partner.LocationID.Int64,
		}
		if location.Address != nil {
			updatePartnerLocationParams.AddressLineOne = sqltypes.ToNullString(location.Address.AddressLineOne)
			updatePartnerLocationParams.AddressLineTwo = sqltypes.ToNullString(location.Address.AddressLineTwo)
			updatePartnerLocationParams.City = sqltypes.ToNullString(location.Address.City)
			updatePartnerLocationParams.StateCode = sqltypes.ToNullString(location.Address.State)
			updatePartnerLocationParams.ZipCode = sqltypes.ToNullString(location.Address.ZipCode)
		}
		if location.GeoLocation != nil {
			updatePartnerLocationParams.LatitudeE6 = sqltypes.ToNullInt32(&location.GeoLocation.LatitudeE6)
			updatePartnerLocationParams.LongitudeE6 = sqltypes.ToNullInt32(&location.GeoLocation.LongitudeE6)
		}
	}

	packageIDs := make([]int64, len(req.Partner.GetInsurancePackages()))
	for i, insurancePackage := range req.Partner.GetInsurancePackages() {
		packageIDs[i] = insurancePackage.PackageId
	}

	emrProviders := req.Partner.GetEmrProviders()
	athenaClinicalProviderIDs := make([]int64, len(emrProviders))
	for i, clinicalProvider := range emrProviders {
		athenaClinicalProviderIDs[i] = clinicalProvider.EmrProviderId
	}

	err = s.DBService.UpdatePartner(ctx, updatePartnerParams, &partnerdb.PartnerRelations{
		PackageIDs:                packageIDs,
		AthenaClinicalProviderIDs: athenaClinicalProviderIDs,
		LocationParams:            updatePartnerLocationParams,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "UpdatePartner error: %v", err)
	}

	return &partnerpb.UpsertPartnerResponse{PartnerId: partner.ID}, nil
}
