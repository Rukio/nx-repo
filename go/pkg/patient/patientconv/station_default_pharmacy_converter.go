package patientconv

import (
	"errors"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"google.golang.org/protobuf/proto"
)

var (
	errNoStationPharmacy   = errors.New("station pharmacy cannot be nil")
	errNoStationPharmacyID = errors.New("station pharmacy requires id")

	errNoProtoPharmacyID = errors.New("pharmacy id cannot be empty")
)

func StationDefaultPharmacyToProto(pharmacy *patient.StationPharmacy) (*patientspb.Pharmacy, error) {
	if pharmacy == nil {
		return nil, errNoStationPharmacy
	}

	if pharmacy.ClinicalProviderID == nil {
		return nil, errNoStationPharmacyID
	}

	phoneNumber, err := protoconv.PhoneNumberProto(pharmacy.PhoneNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		return nil, err
	}

	return &patientspb.Pharmacy{
		ClinicalProviderId:   pharmacy.ClinicalProviderID,
		ClinicalProviderName: pharmacy.ClinicalProviderName,
		PharmacyType:         pharmacyTypeProto(pharmacy.PharmacyType),
		Address:              pharmacyAddressProto(pharmacy),
		ReceiverType:         pharmacy.ReceiverType,
		AcceptFax:            acceptFaxProto(pharmacy.AcceptFax),
		PhoneNumber:          phoneNumber,
		FaxNumber:            pharmacy.FaxNumber,
	}, nil
}

func PharmacyIDToStationDefaultPharmacyParams(pharmacyID string) (*patient.StationDefaultPharmacyParams, error) {
	if pharmacyID == "" {
		return nil, errNoProtoPharmacyID
	}

	return &patient.StationDefaultPharmacyParams{
		DefaultPharmacy: &patient.StationDefaultPharmacyParamsPayload{
			DefaultPharmacyID: pharmacyID,
		},
	}, nil
}

var pharmacyTypes = map[string]patientspb.PharmacyType{
	"RETAIL":    patientspb.PharmacyType_PHARMACY_TYPE_RETAIL,
	"MAILORDER": patientspb.PharmacyType_PHARMACY_TYPE_MAILORDER,
	"":          patientspb.PharmacyType_PHARMACY_TYPE_UNSPECIFIED,
}

func pharmacyTypeProto(pharmacyStationType *string) *patientspb.PharmacyType {
	if pharmacyStationType == nil {
		return patientspb.PharmacyType_PHARMACY_TYPE_UNSPECIFIED.Enum()
	}

	pharmacyType, ok := pharmacyTypes[*pharmacyStationType]
	if !ok {
		return patientspb.PharmacyType_PHARMACY_TYPE_UNSPECIFIED.Enum()
	}

	return &pharmacyType
}

func acceptFaxProto(accept *string) *bool {
	if accept != nil || *accept == "true" {
		return proto.Bool(true)
	}

	return proto.Bool(false)
}

func pharmacyAddressProto(pharmacy *patient.StationPharmacy) *commonpb.Address {
	return &commonpb.Address{
		AddressLineOne: pharmacy.Address1,
		City:           pharmacy.City,
		State:          pharmacy.State,
		ZipCode:        pharmacy.Zip,
	}
}
