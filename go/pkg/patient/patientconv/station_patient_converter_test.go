package patientconv

import (
	"testing"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var (
	dateOfBirth   = proto.String("2020-03-02")
	billingCityID = proto.String("123")
)

func TestStationPatientToProto(t *testing.T) {
	tcs := []struct {
		Desc         string
		InputPatient *patient.StationPatient
		WantPatient  *commonpb.Patient
		HasErr       bool
	}{
		{
			Desc:         "Base case",
			InputPatient: exampleStationPatient(),
			WantPatient:  examplePatientProto(),
		},
		{
			Desc:         "Nil patient",
			InputPatient: nil,
			HasErr:       true,
		},
		{
			Desc:         "Empty patient",
			InputPatient: &patient.StationPatient{},
			HasErr:       true,
		},
		{
			Desc: "Patient without id",
			InputPatient: &patient.StationPatient{
				DateOfBirth: dateOfBirth,
			},
			HasErr: true,
		},
		{
			Desc: "Patient without date of birth",
			InputPatient: &patient.StationPatient{
				ID: proto.Int64(1),
			},
			HasErr: true,
		},
		{
			Desc: "Patient with badly formatted date of birth",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("202-3-02"),
			},
			HasErr: true,
		},
		{
			Desc: "Patient with badly formatted phone number",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
				StationPhone: &patient.StationPhone{
					MobileNumber: proto.String("+55-(555)-555-5555"),
				},
			},
			HasErr: true,
		},
		{
			Desc: "Patient with badly formatted guarantor date of birth",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
				Guarantor: &patient.StationGuarantor{
					DateOfBirth: proto.String("202-3-02"),
				},
			},
			HasErr: true,
		},
		{
			Desc: "Patient with badly formatted guarantor phone number",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
				Guarantor: &patient.StationGuarantor{
					Phone: proto.String("5555"),
				},
			},
			HasErr: true,
		},
		{
			Desc: "Patient with badly formatted power of attorney phone number",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
				PowerOfAttorney: &patient.StationPowerOfAttorney{
					Phone: proto.String("555-555"),
				},
			},
			HasErr: true,
		},
		{
			Desc: "Patient with badly formatted time",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
				UpdatedAt:   proto.String("1234567"),
			},
			HasErr: true,
		},
		{
			Desc: "Patient with only required fields",
			InputPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
			},
			WantPatient: &commonpb.Patient{
				Id:          proto.String("1"),
				DateOfBirth: &commonpb.Date{Year: 2020, Month: 3, Day: 2},
			},
		},
		{
			Desc: "Patient with falsy voicemail value",
			InputPatient: &patient.StationPatient{
				ID:               proto.Int64(1),
				DateOfBirth:      dateOfBirth,
				VoicemailConsent: proto.Bool(false),
			},
			WantPatient: &commonpb.Patient{
				Id:               proto.String("1"),
				DateOfBirth:      &commonpb.Date{Year: 2020, Month: 3, Day: 2},
				VoicemailConsent: proto.Bool(false),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedPatient, err := StationPatientToProto(tc.InputPatient)
			if tc.HasErr {
				return
			}
			if err != nil {
				t.Fatalf("StationPatientToProto hit unexpected error %s with test case %+v", err, tc)
			}
			if !proto.Equal(convertedPatient, tc.WantPatient) {
				t.Errorf("\ngot %s\nwant %s", convertedPatient, tc.WantPatient)
			}
		})
	}
}

func exampleStationPatient() *patient.StationPatient {
	return &patient.StationPatient{
		ID: proto.Int64(1234),
		StationName: &patient.StationName{
			FirstName:  proto.String("Mark"),
			MiddleName: proto.String("Marky"),
			LastName:   proto.String("Prather"),
			Suffix:     proto.String("CEO"),
		},
		StationPhone: &patient.StationPhone{
			MobileNumber:    proto.String("(555) 555-5555"),
			PhoneNumberType: &patient.StationPhoneNumberType{IsMobile: true},
		},
		PatientEmail:         proto.String("mark.prather@example.com"),
		DateOfBirth:          dateOfBirth,
		Gender:               proto.String("male"),
		SocialSecurityNumber: proto.String("555-55-5555"),
		StationEHRIdentifier: &patient.StationEHRIdentifier{
			EHRName: proto.String("athena"),
			EHRID:   proto.String("fakeathenaid"),
		},
		StationBillingAddress: &patient.StationBillingAddress{
			BillingAddressStreetAddress1: proto.String("3827 Lafayette Street"),
			BillingAddressStreetAddress2: proto.String("Floor 5"),
			BillingAddressCity:           proto.String("Denver"),
			BillingAddressState:          proto.String("CO"),
			BillingAddressZipcode:        proto.String("80305"),
		},

		PowerOfAttorney: &patient.StationPowerOfAttorney{
			Name:            proto.String("Kevin Riddleberger"),
			Relationship:    proto.String("cofounder"),
			Phone:           proto.String("(555) 555-5554"),
			PhoneNumberType: &patient.StationPhoneNumberType{IsMobile: false},
		},
		Guarantor: &patient.StationGuarantor{
			RelationshipToPatient: proto.String("home_health_team"),
			StationName: &patient.StationName{
				FirstName: proto.String("Erin"),
				LastName:  proto.String("Denholm"),
			},
			DateOfBirth:          proto.String("2019-02-01"),
			SocialSecurityNumber: proto.String("333-33-3333"),
			Phone:                proto.String("(555) 555-5556"),
			Email:                proto.String("erin.denholm@example.com"),
			SameAsCareAddress:    false,
			StationBillingAddress: &patient.StationBillingAddress{
				BillingAddressStreetAddress1: proto.String("3828 Lafayette Street"),
				BillingAddressStreetAddress2: proto.String("Floor 4"),
				BillingAddressCity:           proto.String("New Denver"),
				BillingAddressState:          proto.String("CA"),
				BillingAddressZipcode:        proto.String("94043"),
			},
		},
		PatientSafetyFlag: &patient.StationPatientSafetyFlag{
			FlaggerID:  proto.Int64(111),
			FlagType:   proto.String("temporary"),
			FlagReason: proto.String("Narcotic Dependence"),
		},
		UpdatedAt:        proto.String("2022-03-04T00:05:51.008Z"),
		VoicemailConsent: proto.Bool(true),
		StationBillingCity: &patient.StationBillingCity{
			BillingCityID: billingCityID,
		},
	}
}

func examplePatientProto() *commonpb.Patient {
	return &commonpb.Patient{
		Id: proto.String("1234"),
		PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
			Source:   commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA,
			RecordId: "fakeathenaid",
		},
		Name: &commonpb.Name{
			GivenName:           proto.String("Mark"),
			MiddleNameOrInitial: proto.String("Marky"),
			FamilyName:          proto.String("Prather"),
			Suffix:              proto.String("CEO"),
		},
		ContactInfo: &commonpb.ContactInfo{
			MobileNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 555-5555"),
			},
			Email: proto.String("mark.prather@example.com"),
			Address: &commonpb.Address{
				AddressLineOne: proto.String("3827 Lafayette Street"),
				AddressLineTwo: proto.String("Floor 5"),
				City:           proto.String("Denver"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80305"),
			},
		},
		DateOfBirth: &commonpb.Date{
			Year:  2020,
			Month: 3,
			Day:   2,
		},
		Sex:                  commonpb.Sex_SEX_MALE.Enum(),
		SocialSecurityNumber: proto.String("555-55-5555"),
		Guarantor: &commonpb.Guarantor{
			Name: &commonpb.Name{
				GivenName:  proto.String("Erin"),
				FamilyName: proto.String("Denholm"),
			},
			DateOfBirth: &commonpb.Date{
				Year:  2019,
				Month: 2,
				Day:   1,
			},
			ContactInfo: &commonpb.ContactInfo{
				MobileNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 555-5556"),
				},
				Email: proto.String("erin.denholm@example.com"),
				Address: &commonpb.Address{
					AddressLineOne: proto.String("3828 Lafayette Street"),
					AddressLineTwo: proto.String("Floor 4"),
					City:           proto.String("New Denver"),
					State:          proto.String("CA"),
					ZipCode:        proto.String("94043"),
				},
			},
			SocialSecurityNumber: proto.String("333-33-3333"),
			PatientRelation: &commonpb.PatientRelation{
				Relation: commonpb.RelationToPatient_RELATION_TO_PATIENT_HOME_HEALTH_TEAM,
			},
		},
		MedicalPowerOfAttorney: &commonpb.MedicalPowerOfAttorney{
			Name: &commonpb.Name{
				PreferredName: proto.String("Kevin Riddleberger"),
			},
			ContactInfo: &commonpb.ContactInfo{
				HomeNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 555-5554"),
				},
			},
			PatientRelation: &commonpb.PatientRelation{
				Relation:          commonpb.RelationToPatient_RELATION_TO_PATIENT_OTHER,
				OtherRelationText: proto.String("cofounder"),
			},
		},
		PatientSafetyFlag: &commonpb.PatientSafetyFlag{
			FlaggerUserId: "111",
			Type:          commonpb.PatientSafetyFlag_FLAG_TYPE_TEMPORARY,
			Reason:        proto.String("Narcotic Dependence"),
		},
		UpdatedAt:        &timestamppb.Timestamp{Seconds: 1646352351, Nanos: 8000000},
		VoicemailConsent: proto.Bool(true),
		BillingCity: &commonpb.BillingCity{
			Id: *billingCityID,
		},
	}
}

func TestProtoToStationPatient(t *testing.T) {
	tcs := []struct {
		Desc         string
		InputPatient *commonpb.Patient
		WantPatient  *patient.StationPatient
		HasErr       bool
	}{
		{
			Desc:         "Base case",
			InputPatient: examplePatientProto(),
			WantPatient:  exampleStationPatient(),
		},
		{
			Desc:         "Nil Proto Patient",
			InputPatient: nil,
			HasErr:       true,
		},
		{
			Desc: "Proto Patient without date of birth",
			InputPatient: &commonpb.Patient{
				Id: proto.String("1"),
			},
			HasErr: true,
		},
		{
			Desc: "Patient with required fields",
			InputPatient: &commonpb.Patient{
				Id:          proto.String("1"),
				DateOfBirth: &commonpb.Date{Year: 2020, Month: 3, Day: 2},
			},
			WantPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
			},
		},
		{
			Desc: "Patient with falsy voicemail value",
			InputPatient: &commonpb.Patient{
				Id:          proto.String("1"),
				DateOfBirth: &commonpb.Date{Year: 2020, Month: 3, Day: 2},
				BillingCity: &commonpb.BillingCity{
					Id: *billingCityID,
				},
				VoicemailConsent: proto.Bool(false),
			},
			WantPatient: &patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: dateOfBirth,
				StationBillingCity: &patient.StationBillingCity{
					BillingCityID: billingCityID,
				},
				VoicemailConsent: proto.Bool(false),
			},
		},
	}

	for _, test := range tcs {
		t.Run(test.Desc, func(t *testing.T) {
			convertedPatient, err := ProtoToStationPatient(test.InputPatient)
			if err != nil {
				if test.HasErr {
					return
				}
				if err != nil {
					t.Fatalf("StationPatientToProto hit unexpected error %s with test case %+v", err, test)
				}
			}
			if convertedPatient != nil {
				testutils.MustMatch(t, convertedPatient, test.WantPatient, "patients don't match")
			}
		})
	}
}
