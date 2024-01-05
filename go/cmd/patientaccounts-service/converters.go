package main

import (
	"fmt"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

var (
	errPhoneNumberParseText                           = "failed to parse phone number to proto"
	errFailedToGenerateConsistencyTokenTemplate       = "failed to generate consistency token: %w"
	errFailedToMapProtoAccessLevelTemplate            = "failed to map access level ID to proto: %w"
	errFailedToMapProtoConsentingRelationshipTemplate = "failed to map consenting relationship ID to proto: %w"
)

type ConsistencyToken []byte

func accountProtoFromSQL(account *patientaccountssql.Account) (*patientaccountspb.Account, ConsistencyToken, error) {
	if account == nil {
		return nil, nil, nil
	}

	var givenName *string
	if account.GivenName.Valid {
		givenName = &account.GivenName.String
	}

	var familyName *string
	if account.FamilyName.Valid {
		familyName = &account.FamilyName.String
	}

	var phoneNumber *string
	if account.PhoneNumber.Valid {
		phoneNumber = &account.PhoneNumber.String
	}

	phoneNumberProto, err := protoconv.PhoneNumberProto(phoneNumber, common.PhoneNumber_PHONE_NUMBER_TYPE_UNSPECIFIED)
	if err != nil {
		return nil, nil, fmt.Errorf("%s: %w", errPhoneNumberParseText, err)
	}

	updatedAt := protoconv.TimeToProtoTimestamp(&account.UpdatedAt)
	consistencyToken, err := protoconv.TimestampToBytes(updatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf(errFailedToGenerateConsistencyTokenTemplate, err)
	}

	return &patientaccountspb.Account{
		AccountId:  account.ID,
		Email:      account.Email,
		GivenName:  givenName,
		FamilyName: familyName,
		Number:     phoneNumberProto,
		UpdatedAt:  updatedAt,
	}, consistencyToken, nil
}

func accountAddressProtoFromSQL(address *patientaccountssql.Address) (*patientaccountspb.AccountAddress, ConsistencyToken, error) {
	if address == nil {
		return nil, nil, nil
	}

	updatedAt := protoconv.TimeToProtoTimestamp(&address.UpdatedAt)
	consistencyToken, err := protoconv.TimestampToBytes(updatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf(errFailedToGenerateConsistencyTokenTemplate, err)
	}
	var location *common.Location
	if address.LatitudeE6.Valid && address.LongitudeE6.Valid {
		location = &common.Location{
			LatitudeE6:  address.LatitudeE6.Int32,
			LongitudeE6: address.LongitudeE6.Int32,
		}
	}

	facilityType, ok := FacilityTypeIDToProto[address.FacilityTypeID]
	if !ok {
		facilityType = patientaccountspb.FacilityType_FACILITY_TYPE_UNSPECIFIED
	}

	return &patientaccountspb.AccountAddress{
		Id:        address.ID,
		AccountId: address.AccountID,
		Address: &common.Address{
			AddressLineOne: sqltypes.ToProtoString(address.AddressLineOne),
			AddressLineTwo: sqltypes.ToProtoString(address.AddressLineTwo),
			City:           sqltypes.ToProtoString(address.City),
			State:          sqltypes.ToProtoString(address.StateCode),
			ZipCode:        sqltypes.ToProtoString(address.Zipcode),
		},
		LocationDetails: sqltypes.ToProtoString(address.LocationDetails),
		UpdatedAt:       updatedAt,
		Location:        location,
		FacilityType:    &facilityType,
	}, consistencyToken, nil
}

func accountPatientProtoFromSQL(accountPatient *patientaccountssql.AccountPatientLink) (*patientaccountspb.AccountPatientLink, ConsistencyToken, error) {
	if accountPatient == nil {
		return nil, nil, nil
	}

	updatedAt := protoconv.TimeToProtoTimestamp(&accountPatient.UpdatedAt)
	consistencyToken, err := protoconv.TimestampToBytes(updatedAt)
	if err != nil {
		return nil, nil, fmt.Errorf(errFailedToGenerateConsistencyTokenTemplate, err)
	}

	accessLevel, ok := AccessLevelIDToProto[accountPatient.AccessLevelID]
	if !ok {
		return nil, nil, fmt.Errorf(errFailedToMapProtoAccessLevelTemplate, accountPatient.AccessLevelID)
	}

	consentingRelationship, ok := ConsentingRelationshipIDToProto[accountPatient.ConsentingRelationshipID]
	if !ok {
		return nil, nil, fmt.Errorf(errFailedToMapProtoConsentingRelationshipTemplate, accountPatient.ConsentingRelationshipID)
	}

	return &patientaccountspb.AccountPatientLink{
		Id:          accountPatient.ID,
		AccountId:   accountPatient.AccountID,
		AccessLevel: accessLevel,
		ConsentingRelationship: &patientaccountspb.ConsentingRelationship{
			Category: consentingRelationship,
		},
		UpdatedAt: updatedAt,
	}, consistencyToken, nil
}
