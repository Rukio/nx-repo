package patientconv

import (
	"testing"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func exampleAthenaPatient() *athenapb.Patient {
	return &athenapb.Patient{
		PatientId: proto.String("fakeathenaid"),
		Name: &commonpb.Name{
			GivenName:           proto.String("Mark"),
			MiddleNameOrInitial: proto.String("Marky"),
			Suffix:              proto.String("CEO"),
			FamilyName:          proto.String("Prather"),
		},
		DateOfBirth: &commonpb.Date{
			Year:  2020,
			Month: 3,
			Day:   2,
		},
		Sex:          proto.String("M"),
		DepartmentId: proto.String("5"),
		ContactInfo: &athenapb.ContactInfo{
			MobileNumber: &commonpb.PhoneNumber{
				PhoneNumberType: 2,
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
		Guarantor: &athenapb.Guarantor{
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
				HomeNumber: nil,
				MobileNumber: &commonpb.PhoneNumber{
					PhoneNumberType: 2,
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
			RelationshipToPatient: proto.String("4"),
		},
	}
}

func TestToAthenaPatient(t *testing.T) {
	examplePatient := examplePatientProto()

	examplePatientWithoutGuarantor := examplePatientProto()
	examplePatientWithoutGuarantor.Guarantor = nil

	examplePatientWithoutPatientID := examplePatientProto()
	examplePatientWithoutPatientID.PrimaryIdentifier = nil

	athenaPatientWithoutPatientID := exampleAthenaPatient()
	athenaPatientWithoutPatientID.PatientId = nil

	tcs := []struct {
		Desc              string
		InputPatient      *commonpb.Patient
		InputDepartmentID *string
		WantPatient       *athenapb.Patient
	}{
		{
			Desc:              "Base case",
			InputPatient:      examplePatientProto(),
			InputDepartmentID: proto.String("5"),
			WantPatient:       exampleAthenaPatient(),
		},
		{
			Desc:              "Without patient ID",
			InputPatient:      examplePatientWithoutPatientID,
			InputDepartmentID: proto.String("5"),
			WantPatient:       athenaPatientWithoutPatientID,
		},
		{
			Desc:              "Empty patient proto",
			InputPatient:      &commonpb.Patient{},
			InputDepartmentID: proto.String("5"),
			WantPatient: &athenapb.Patient{
				DepartmentId: proto.String("5"),
				ContactInfo:  nil,
				Guarantor:    nil,
			},
		},
		{
			Desc:              "Patient proto missing guarantor",
			InputPatient:      examplePatientWithoutGuarantor,
			InputDepartmentID: proto.String("5"),
			WantPatient: &athenapb.Patient{
				PatientId:    &examplePatient.GetPrimaryIdentifier().RecordId,
				Name:         examplePatient.Name,
				DateOfBirth:  examplePatient.DateOfBirth,
				Sex:          proto.String("M"),
				DepartmentId: proto.String("5"),
				ContactInfo: &athenapb.ContactInfo{
					HomeNumber:   examplePatient.ContactInfo.HomeNumber,
					MobileNumber: examplePatient.ContactInfo.MobileNumber,
					WorkNumber:   examplePatient.ContactInfo.WorkNumber,
					Email:        examplePatient.ContactInfo.Email,
					Address:      examplePatient.ContactInfo.Address,
				},
				Guarantor: nil,
			},
		},
	}

	for _, test := range tcs {
		t.Run(test.Desc, func(t *testing.T) {
			convertedPatient := ToAthenaPatient(test.InputPatient, test.InputDepartmentID)
			testutils.MustMatch(t, convertedPatient, test.WantPatient, "patients don't match")
		})
	}
}

func TestToAthenaPatientRelation(t *testing.T) {
	tcs := []struct {
		Desc          string
		InputRelation commonpb.RelationToPatient
		Want          *string
	}{
		{
			Desc:          "Default",
			InputRelation: commonpb.RelationToPatient_RELATION_TO_PATIENT_CASE_MANAGEMENT,
			Want:          proto.String("4"),
		},
		{
			Desc:          "RELATION_TO_PATIENT_UNSPECIFIED",
			InputRelation: commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
			Want:          proto.String("13"),
		},
		{
			Desc:          "RELATION_TO_PATIENT_SELF",
			InputRelation: commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
			Want:          proto.String("1"),
		},
	}

	for _, test := range tcs {
		t.Run(test.Desc, func(t *testing.T) {
			convertedPatient := toAthenaPatientRelation(test.InputRelation)
			testutils.MustMatch(t, convertedPatient, test.Want, "patients don't match")
		})
	}
}
