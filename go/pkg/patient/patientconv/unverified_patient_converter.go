package patientconv

import (
	"fmt"
	"strconv"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
)

func UnverifiedPatientToPatientProto(unverifiedPatient *patientspb.UnverifiedPatient, billingCityID *int64) (*commonpb.Patient, error) {
	var patientIDStr *string

	if unverifiedPatient == nil {
		return nil, nil
	}

	patientID := unverifiedPatient.GetPatientId()
	if patientID > 0 {
		patientStr := strconv.FormatInt(patientID, 10)
		patientIDStr = &patientStr
	}

	var mobileNumber *commonpb.PhoneNumber
	var err error
	if unverifiedPatient.GetPhoneNumber().GetPhoneNumber() != "" {
		mobileNumber, err = protoconv.PhoneNumberProto(unverifiedPatient.PhoneNumber.PhoneNumber, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE)
		if err != nil {
			return nil, fmt.Errorf("error parsing phone number: %w", err)
		}
	}

	var billingCity *commonpb.BillingCity
	if billingCityID != nil {
		billingCity = &commonpb.BillingCity{
			Id: strconv.FormatInt(*billingCityID, 10),
		}
	}

	return &commonpb.Patient{
		Id: patientIDStr,
		Name: &commonpb.Name{
			GivenName:  unverifiedPatient.GivenName,
			FamilyName: unverifiedPatient.FamilyName,
		},
		DateOfBirth:    unverifiedPatient.DateOfBirth,
		GenderIdentity: unverifiedPatient.GenderIdentity,
		BirthSex:       &unverifiedPatient.BirthSex,
		Sex:            &unverifiedPatient.LegalSex,
		ContactInfo: &commonpb.ContactInfo{
			MobileNumber: mobileNumber,
		},
		BillingCity: billingCity,
	}, nil
}
