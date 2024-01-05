package patientconv

import (
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestUnverifiedPatientToProto(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	testDateProto := timestamppb.New(testDate)
	birthSex := commonpb.BirthSex_BIRTH_SEX_MALE

	tcs := []struct {
		Desc          string
		InputPatient  *patientspb.UnverifiedPatient
		BillingCityID *int64

		WantErr bool
		Want    *commonpb.Patient
	}{
		{
			Desc: "success - base case",
			InputPatient: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(2),
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     proto.String("555-6666"),
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
				GivenName:  proto.String("Hank"),
				FamilyName: proto.String("Hill"),
				PatientId:  proto.Int64(1),
			},
			BillingCityID: proto.Int64(22),

			Want: &commonpb.Patient{
				Id: proto.String("1"),
				Name: &commonpb.Name{
					GivenName:  proto.String("Hank"),
					FamilyName: proto.String("Hill"),
				},
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				BirthSex: &birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				Sex: commonpb.Sex_SEX_MALE.Enum(),
				ContactInfo: &commonpb.ContactInfo{
					MobileNumber: &commonpb.PhoneNumber{
						PhoneNumber:     proto.String("555-6666"),
						PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
						CountryCode:     proto.Int32(1),
					},
				},
				BillingCity: &commonpb.BillingCity{
					Id: *proto.String("22"),
				},
			},
		},
		{
			Desc: "success - without patient id",
			InputPatient: &patientspb.UnverifiedPatient{
				Id:       123,
				AthenaId: proto.Int64(2),
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     proto.String("555-6666"),
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
				GivenName:  proto.String("Hank"),
				FamilyName: proto.String("Hill"),
			},
			BillingCityID: proto.Int64(22),

			Want: &commonpb.Patient{
				Name: &commonpb.Name{
					GivenName:  proto.String("Hank"),
					FamilyName: proto.String("Hill"),
				},
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				BirthSex: &birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				Sex: commonpb.Sex_SEX_MALE.Enum(),
				ContactInfo: &commonpb.ContactInfo{
					MobileNumber: &commonpb.PhoneNumber{
						PhoneNumber:     proto.String("555-6666"),
						PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
						CountryCode:     proto.Int32(1),
					},
				},
				BillingCity: &commonpb.BillingCity{
					Id: *proto.String("22"),
				},
			},
		},
		{
			Desc: "success - without phone number",
			InputPatient: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(2),
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
				GivenName:  proto.String("Hank"),
				FamilyName: proto.String("Hill"),
				PatientId:  proto.Int64(1),
			},
			BillingCityID: proto.Int64(22),

			Want: &commonpb.Patient{
				Id: proto.String("1"),
				Name: &commonpb.Name{
					GivenName:  proto.String("Hank"),
					FamilyName: proto.String("Hill"),
				},
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				BirthSex: &birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				Sex:         commonpb.Sex_SEX_MALE.Enum(),
				ContactInfo: &commonpb.ContactInfo{},
				BillingCity: &commonpb.BillingCity{
					Id: *proto.String("22"),
				},
			},
		},
		{
			Desc: "success - blank phone number",
			InputPatient: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(2),
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				PhoneNumber: &commonpb.PhoneNumber{},
				LegalSex:    commonpb.Sex_SEX_MALE,
				BirthSex:    birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
				GivenName:  proto.String("Hank"),
				FamilyName: proto.String("Hill"),
				PatientId:  proto.Int64(1),
			},
			BillingCityID: proto.Int64(22),

			Want: &commonpb.Patient{
				Id: proto.String("1"),
				Name: &commonpb.Name{
					GivenName:  proto.String("Hank"),
					FamilyName: proto.String("Hill"),
				},
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				BirthSex: &birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				Sex:         commonpb.Sex_SEX_MALE.Enum(),
				ContactInfo: &commonpb.ContactInfo{},
				BillingCity: &commonpb.BillingCity{
					Id: *proto.String("22"),
				},
			},
		},
		{
			Desc: "success - without billing city id",
			InputPatient: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(2),
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     proto.String("555-6666"),
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
				GivenName:  proto.String("Hank"),
				FamilyName: proto.String("Hill"),
				PatientId:  proto.Int64(1),
			},

			Want: &commonpb.Patient{
				Id: proto.String("1"),
				Name: &commonpb.Name{
					GivenName:  proto.String("Hank"),
					FamilyName: proto.String("Hill"),
				},
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				Sex:      commonpb.Sex_SEX_MALE.Enum(),
				BirthSex: &birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				ContactInfo: &commonpb.ContactInfo{
					MobileNumber: &commonpb.PhoneNumber{
						PhoneNumber:     proto.String("555-6666"),
						PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
						CountryCode:     proto.Int32(1),
					},
				},
				BillingCity: nil,
			},
		},
		{
			Desc: "error - with invalid phone number",
			InputPatient: &patientspb.UnverifiedPatient{
				Id:       1,
				AthenaId: proto.Int64(2),
				DateOfBirth: &commonpb.Date{
					Year:  1949,
					Month: 5,
					Day:   20,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     proto.String("-1"),
				},
				LegalSex: commonpb.Sex_SEX_MALE,
				BirthSex: birthSex,
				GenderIdentity: &commonpb.GenderIdentity{
					Category:     commonpb.GenderIdentity_CATEGORY_MALE,
					OtherDetails: proto.String("text"),
				},
				CreatedAt:  testDateProto,
				UpdatedAt:  testDateProto,
				GivenName:  proto.String("Hank"),
				FamilyName: proto.String("Hill"),
				PatientId:  proto.Int64(1),
			},
			BillingCityID: proto.Int64(22),

			WantErr: true,
		},
		{
			Desc:          "nil unverifiedPatient returns nil",
			InputPatient:  nil,
			BillingCityID: proto.Int64(22),

			Want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res, err := UnverifiedPatientToPatientProto(tc.InputPatient, tc.BillingCityID)

			testutils.MustMatch(t, tc.WantErr, err != nil)
			testutils.MustMatch(t, tc.Want, res)
		})
	}
}
