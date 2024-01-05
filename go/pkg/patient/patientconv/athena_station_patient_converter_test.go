package patientconv

import (
	"testing"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestToPatientProto(t *testing.T) {
	tcs := []struct {
		Desc                string
		InputStationPatient *stationpatientspb.Patient
		InputAthenaPatient  *athenapb.Patient
		WantPatient         *commonpb.Patient
		HasErr              bool
	}{
		{
			Desc:                "Base case",
			InputStationPatient: exampleStationPatientProto(true),
			InputAthenaPatient:  exampleAthenaPatientProto(true),
			WantPatient:         examplePatient(examplePatientMpoa(), examplePatientGuarantor()),
		},
		{
			Desc:                "Nil stationPatient",
			InputStationPatient: nil,
			InputAthenaPatient:  exampleAthenaPatientProto(true),
			HasErr:              true,
		},
		{
			Desc:                "Nil athenaPatient",
			InputStationPatient: exampleStationPatientProto(true),
			InputAthenaPatient:  nil,
			HasErr:              true,
		},
		{
			Desc:                "Nil athenaPatient.Guarantor",
			InputStationPatient: exampleStationPatientProto(true),
			InputAthenaPatient:  exampleAthenaPatientProto(false),
			WantPatient:         examplePatient(examplePatientMpoa(), nil),
		},
		{
			Desc:                "Nil stationPatient.PowerOfAttorney",
			InputStationPatient: exampleStationPatientProto(false),
			InputAthenaPatient:  exampleAthenaPatientProto(true),
			WantPatient:         examplePatient(nil, examplePatientGuarantor()),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			convertedPatient, err := ToPatientProto(tc.InputAthenaPatient, tc.InputStationPatient)
			if (err != nil) != tc.HasErr {
				t.Errorf("toPatientProto() error = %v, wantErr %v", err, tc.HasErr)
				return
			}
			testutils.MustMatchProto(t, tc.WantPatient, convertedPatient)
		})
	}
}

func examplePatientMpoa() *commonpb.MedicalPowerOfAttorney {
	return &commonpb.MedicalPowerOfAttorney{
		Name: &commonpb.Name{
			PreferredName: proto.String("Ruth Seiger"),
		},
		ContactInfo: &commonpb.ContactInfo{
			HomeNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(303) 555-1234"),
			},
		},
		PatientRelation: &commonpb.PatientRelation{
			Relation:          commonpb.RelationToPatient_RELATION_TO_PATIENT_FAMILY,
			OtherRelationText: proto.String("family"),
		},
		Id: proto.Int64(694994),
	}
}

func examplePatientGuarantor() *commonpb.Guarantor {
	return &commonpb.Guarantor{
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
			HomeNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 067-6888"),
			},
			Address: &commonpb.Address{
				AddressLineOne: proto.String("3828 Lafayette Street"),
				City:           proto.String("DENVER"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80202-5107"),
			},
		},
		PatientRelation: &commonpb.PatientRelation{
			Relation: commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
		},
	}
}

func examplePatient(examplePatientMpoa *commonpb.MedicalPowerOfAttorney, examplePatientGuarantor *commonpb.Guarantor) *commonpb.Patient {
	var mpoa *commonpb.MedicalPowerOfAttorney
	if examplePatientMpoa != nil {
		mpoa = examplePatientMpoa
	} else {
		mpoa = nil
	}

	var guarantor *commonpb.Guarantor
	if examplePatientGuarantor != nil {
		guarantor = examplePatientGuarantor
	} else {
		guarantor = nil
	}

	return &commonpb.Patient{
		Id: proto.String("1234"),
		PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
			Source:   commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA,
			RecordId: "789",
		},
		Name: &commonpb.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Heidenreich"),
		},
		ContactInfo: &commonpb.ContactInfo{
			MobileNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 666-6888"),
			},
			Address: &commonpb.Address{
				AddressLineOne: proto.String("3827 Lafayette Street"),
				City:           proto.String("Denver"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80305"),
			},
		},
		DateOfBirth: &commonpb.Date{
			Year:  1949,
			Month: 5,
			Day:   20,
		},
		Sex:       commonpb.Sex_SEX_MALE.Enum(),
		Guarantor: guarantor,
		PatientSafetyFlag: &commonpb.PatientSafetyFlag{
			FlaggerUserId: "111",
			Type:          commonpb.PatientSafetyFlag_FLAG_TYPE_TEMPORARY,
			Reason:        proto.String("Narcotic Dependence"),
		},
		ChannelItemId:          proto.Int64(123),
		PartnerId:              proto.String("456"),
		SourceType:             proto.String("phone"),
		MedicalPowerOfAttorney: mpoa,
		VoicemailConsent:       proto.Bool(true),
		BillingCity: &commonpb.BillingCity{
			Id: "5",
		},
	}
}

func exampleStationPatientMpoa() *stationpatientspb.PowerOfAttorney {
	return &stationpatientspb.PowerOfAttorney{
		Id:           proto.Int64(694994),
		PatientId:    proto.Int64(1234),
		Name:         proto.String("Ruth Seiger"),
		Phone:        proto.String("303-555-1234"),
		Relationship: proto.String("family"),
	}
}

func exampleStationPatientProto(includeMpoa bool) *stationpatientspb.Patient {
	var mpoa *stationpatientspb.PowerOfAttorney
	if includeMpoa {
		mpoa = exampleStationPatientMpoa()
	} else {
		mpoa = nil
	}

	return &stationpatientspb.Patient{
		Id:            1234,
		ChannelItemId: proto.Int64(123),
		SourceType:    proto.String("phone"),
		PartnerId:     proto.String("456"),
		PatientSafetyFlag: &stationpatientspb.PatientSafetyFlag{
			Id:         proto.Int64(333),
			PatientId:  proto.Int64(1234),
			FlagType:   proto.String("temporary"),
			FlagReason: proto.String("Narcotic Dependence"),
			FlaggerId:  proto.Int64(111),
		},
		VoicemailConsent: proto.Bool(true),
		BillingCity: &stationpatientspb.BillingCity{
			Id:                proto.Int64(5),
			DefaultDepartment: proto.String("2"),
			UsualProvider:     proto.String("235"),
		},
		PowerOfAttorney: mpoa,
		EhrId:           proto.String("789"),
	}
}

func exampleAthenaPatientGuarantor() *athenapb.Guarantor {
	return &athenapb.Guarantor{
		Name: &commonpb.Name{
			GivenName:  proto.String("Erin"),
			FamilyName: proto.String("Denholm"),
		},
		DateOfBirth: &commonpb.Date{
			Year:  2019,
			Month: 2,
			Day:   1,
		},
		ContactInfo: &athenapb.ContactInfo{
			HomeNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 067-6888"),
			},
			Address: &commonpb.Address{
				AddressLineOne: proto.String("3828 Lafayette Street"),
				City:           proto.String("DENVER"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80202-5107"),
			},
		},
		SameAddressAsPatient:  proto.Bool(false),
		RelationshipToPatient: proto.String("1"),
	}
}

func exampleAthenaPatientProto(includeGuarantor bool) *athenapb.Patient {
	var guarantor *athenapb.Guarantor
	if includeGuarantor {
		guarantor = exampleAthenaPatientGuarantor()
	} else {
		guarantor = nil
	}

	return &athenapb.Patient{
		PatientId: proto.String("789"),
		Name: &commonpb.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Heidenreich"),
		},
		DateOfBirth: &commonpb.Date{
			Year:  1949,
			Month: 5,
			Day:   20,
		},
		Sex: proto.String("M"),
		ContactInfo: &athenapb.ContactInfo{
			MobileNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 666-6888"),
			},
			Address: &commonpb.Address{
				AddressLineOne: proto.String("3827 Lafayette Street"),
				City:           proto.String("Denver"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80305"),
			},
		},
		EmergencyContact: &athenapb.EmergencyContact{
			ContactName:         proto.String("BOYD"),
			ContactRelationship: proto.String("SPOUSE"),
			ContactMobilephone:  proto.String("5550676888"),
		},
		Guarantor:         guarantor,
		PrimaryProviderId: proto.String("1"),
		PortalAccessGiven: proto.Bool(false),
	}
}

func TestParseRelationshipToPatient(t *testing.T) {
	var rel *string
	invalidRel := "invalid"
	undefinedRel := "9"

	tcs := []struct {
		Desc   string
		Input  *string
		Want   commonpb.RelationToPatient
		HasErr bool
	}{
		{
			Desc:  "Nil input",
			Input: rel,
			Want:  commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
		},
		{
			Desc:  "Invalid input",
			Input: &invalidRel,
			Want:  commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
		},
		{
			Desc:  "Undefined input",
			Input: &undefinedRel,
			Want:  commonpb.RelationToPatient_RELATION_TO_PATIENT_OTHER,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res := parseRelationshipToPatient(tc.Input)
			testutils.MustMatch(t, tc.Want, res)
		})
	}
}

func TestStationPatientSafetyFlagProto(t *testing.T) {
	tcs := []struct {
		desc  string
		input *stationpatientspb.PatientSafetyFlag

		want *commonpb.PatientSafetyFlag
	}{
		{
			desc: "base case",
			input: &stationpatientspb.PatientSafetyFlag{
				Id:         proto.Int64(1),
				PatientId:  proto.Int64(1),
				FlagType:   proto.String("permanent"),
				FlagReason: proto.String("danger"),
				FlaggerId:  proto.Int64(1),
			},

			want: &commonpb.PatientSafetyFlag{
				Type:          commonpb.PatientSafetyFlag_FLAG_TYPE_PERMANENT,
				Reason:        proto.String("danger"),
				FlaggerUserId: "1",
			},
		},
		{
			desc:  "empty struct",
			input: &stationpatientspb.PatientSafetyFlag{},

			want: &commonpb.PatientSafetyFlag{
				Type: commonpb.PatientSafetyFlag_FLAG_TYPE_UNSPECIFIED,
			},
		},
		{
			desc:  "nil input",
			input: nil,

			want: nil,
		},
		{
			desc: "nil flag type",
			input: &stationpatientspb.PatientSafetyFlag{
				Id:         proto.Int64(1),
				PatientId:  proto.Int64(1),
				FlagType:   nil,
				FlagReason: proto.String("danger"),
				FlaggerId:  proto.Int64(1),
			},

			want: &commonpb.PatientSafetyFlag{
				Type:          commonpb.PatientSafetyFlag_FLAG_TYPE_UNSPECIFIED,
				Reason:        proto.String("danger"),
				FlaggerUserId: "1",
			},
		},
		{
			desc: "invalid flag type",
			input: &stationpatientspb.PatientSafetyFlag{
				Id:         proto.Int64(1),
				PatientId:  proto.Int64(1),
				FlagType:   proto.String("invalid"),
				FlagReason: proto.String("danger"),
				FlaggerId:  proto.Int64(1),
			},

			want: &commonpb.PatientSafetyFlag{
				Type:          commonpb.PatientSafetyFlag_FLAG_TYPE_UNSPECIFIED,
				Reason:        proto.String("danger"),
				FlaggerUserId: "1",
			},
		},
		{
			desc: "nil flagger id",
			input: &stationpatientspb.PatientSafetyFlag{
				Id:         proto.Int64(1),
				PatientId:  proto.Int64(1),
				FlagType:   proto.String("permanent"),
				FlagReason: proto.String("danger"),
				FlaggerId:  nil,
			},

			want: &commonpb.PatientSafetyFlag{
				Type:          commonpb.PatientSafetyFlag_FLAG_TYPE_PERMANENT,
				Reason:        proto.String("danger"),
				FlaggerUserId: "",
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			res := stationPatientSafetyFlagProto(tc.input)
			testutils.MustMatch(t, tc.want, res)
		})
	}
}

func TestEnhancedBestMatchResultPatientIDs(t *testing.T) {
	tcs := []struct {
		Desc                string
		InputAthenaPatients []*athenapb.EnhancedBestMatchResult
		Want                []string
		HasErr              bool
	}{
		{
			Desc: "Base case",
			InputAthenaPatients: []*athenapb.EnhancedBestMatchResult{
				{Patient: exampleAthenaPatientProto(false)},
			},
			Want: []string{"789"},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res := EnhancedBestMatchResultPatientIDs(tc.InputAthenaPatients)
			testutils.MustMatch(t, tc.Want, res)
		})
	}
}

func TestSearchPatientsResultPatientIDs(t *testing.T) {
	tcs := []struct {
		Desc                string
		InputAthenaPatients []*athenapb.SearchPatientsResult
		Want                []string
	}{
		{
			Desc: "Base case",
			InputAthenaPatients: []*athenapb.SearchPatientsResult{
				{
					Patient: &athenapb.Patient{PatientId: proto.String("789")},
				},
			},
			Want: []string{"789"},
		},
		{
			Desc: "multiple patients",
			InputAthenaPatients: []*athenapb.SearchPatientsResult{
				{
					Patient: &athenapb.Patient{PatientId: proto.String("789")},
				},
				{
					Patient: &athenapb.Patient{PatientId: proto.String("567")},
				},
			},
			Want: []string{"789", "567"},
		},
		{
			Desc: "nil input returns empty array",
			InputAthenaPatients: []*athenapb.SearchPatientsResult{
				{
					Patient: &athenapb.Patient{PatientId: proto.String("789")},
				},
				{Patient: nil},
			},
			Want: []string{"789", ""},
		},
		{
			Desc:                "works with nil",
			InputAthenaPatients: nil,
			Want:                []string{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res := SearchPatientsResultPatientIDs(tc.InputAthenaPatients)
			testutils.MustMatch(t, tc.Want, res)
		})
	}
}

func TestToPatientProtos(t *testing.T) {
	tcs := []struct {
		Desc                 string
		InputStationPatients []*stationpatientspb.Patient
		InputAthenaPatients  []*athenapb.Patient
		Want                 []*commonpb.Patient
		HasErr               bool
	}{
		{
			Desc: "Base case",
			InputStationPatients: []*stationpatientspb.Patient{
				exampleStationPatientProto(true),
			},
			InputAthenaPatients: []*athenapb.Patient{
				exampleAthenaPatientProto(true),
			},
			Want: []*commonpb.Patient{
				examplePatient(examplePatientMpoa(), examplePatientGuarantor()),
			},
		},
		{
			Desc: "Multiple station patients for same athena patient",
			InputStationPatients: []*stationpatientspb.Patient{
				{Id: 1234, EhrId: proto.String("789")},
				{Id: 1235, EhrId: proto.String("789")},
			},
			InputAthenaPatients: []*athenapb.Patient{
				{PatientId: proto.String("789")},
			},
			Want: []*commonpb.Patient{
				{
					Id: proto.String("1234"),
					PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
						Source:   commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA,
						RecordId: "789",
					},
				},
				{
					Id: proto.String("1235"),
					PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
						Source:   commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA,
						RecordId: "789",
					},
				},
			},
		},
		{
			Desc: "Empty station patients",
			InputAthenaPatients: []*athenapb.Patient{
				exampleAthenaPatientProto(true),
			},
			Want: []*commonpb.Patient{},
		},
		{
			Desc: "Empty athena patients, which means station proto has no matching athena patient",
			InputStationPatients: []*stationpatientspb.Patient{
				exampleStationPatientProto(true),
			},
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res, err := ToPatientProtos(tc.InputAthenaPatients, tc.InputStationPatients)
			if (err != nil) != tc.HasErr {
				t.Errorf("ToPatientProtos() error = %v, wantErr %v", err, tc.HasErr)
				return
			}
			testutils.MustMatch(t, tc.Want, res)
		})
	}
}

func TestAthenaPatientInsuranceBenefitDetailsToProto(t *testing.T) {
	tcs := []struct {
		Desc  string
		Input *athenapb.InsuranceBenefitDetails

		Want *patientspb.InsuranceBenefitDetails
	}{
		{
			Desc: "Base case",
			Input: &athenapb.InsuranceBenefitDetails{
				EligibilityData: "data",
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				LastCheckDate: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
			},

			Want: &patientspb.InsuranceBenefitDetails{
				EligibilityData: "data",
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				LastCheckDate: &commonpb.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res := AthenaPatientInsuranceBenefitDetailsToProto(tc.Input)
			testutils.MustMatch(t, tc.Want, res)
		})
	}
}
